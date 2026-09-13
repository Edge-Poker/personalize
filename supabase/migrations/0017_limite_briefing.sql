-- ---------------------------------------------------------------------------
-- O briefing ganha balde proprio
-- ---------------------------------------------------------------------------
-- Ate aqui o briefing dividia o limite com o formulario de contato: os dois
-- chamam `registrar_lead`, que checa `'lead:' || chave` com teto de 5 por hora.
-- Duas consequencias ruins. Uma, o teto era 5 e nao 3. Duas, quem mandasse tres
-- mensagens pelo contato chegava ao briefing com duas tentativas — um limite
-- que depende do que a pessoa fez noutra pagina e um limite que ela nao tem
-- como entender.
--
-- Agora sao baldes separados, com prefixo proprio. E a funcao devolve quanto
-- falta para a janela virar, em vez de so dizer "nao". A diferenca entre
-- "tentativas indisponiveis" e "volta em 12 minutos" e a diferenca entre o
-- visitante desistir e o visitante esperar.
--
-- O limite e a janela sao parametros com valor padrao, e nao constantes: mudar
-- de 3 para 5 vira um argumento na chamada, nao uma migration.

create or replace function public.checar_limite_briefing(
  p_chave text,
  p_limite integer default 3,
  p_janela_segundos integer default 3600
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_contagem integer;
  v_inicio timestamptz;
begin
  if coalesce(trim(p_chave), '') = '' then
    -- Sem chave nao ha como contar. Deixa passar: barrar todo mundo porque o
    -- ip nao chegou transformaria um detalhe de infraestrutura em porta
    -- fechada.
    return jsonb_build_object('permitido', true, 'restam_segundos', 0);
  end if;

  insert into public.rate_limit as r (chave, contagem, janela_inicio)
  values ('briefing:' || p_chave, 1, now())
  on conflict (chave) do update
    set contagem = case
          when r.janela_inicio < now() - make_interval(secs => p_janela_segundos) then 1
          else r.contagem + 1
        end,
        janela_inicio = case
          when r.janela_inicio < now() - make_interval(secs => p_janela_segundos) then now()
          else r.janela_inicio
        end
  returning r.contagem, r.janela_inicio into v_contagem, v_inicio;

  return jsonb_build_object(
    'permitido', v_contagem <= p_limite,
    'restam_segundos',
      greatest(0, p_janela_segundos - floor(extract(epoch from (now() - v_inicio)))::integer)
  );
end;
$$;

revoke execute on function public.checar_limite_briefing(text, integer, integer) from public;
grant execute on function public.checar_limite_briefing(text, integer, integer) to anon, authenticated;
