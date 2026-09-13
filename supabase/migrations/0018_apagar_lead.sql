-- ---------------------------------------------------------------------------
-- Apagar um lead, e devolver a tentativa
-- ---------------------------------------------------------------------------
-- Apagar um lead pelo painel tem de apagar em todo lugar, e "todo lugar" aqui
-- inclui o link que o cliente guardou. Isso sai de graca: `briefing_por_token`
-- procura a linha, e sem linha ela devolve null — a pagina do token ja trata
-- esse caso mostrando "esse link nao abre mais". Nao ha cache nem copia.
--
-- O que nao sai de graca e devolver a tentativa. O limite de 3 por hora vive em
-- `rate_limit`, numa linha cuja chave e o hash do ip de quem respondeu; o lead
-- e a contagem nao se conhecem. Entao o lead passa a guardar a chave do proprio
-- balde, e apagar decrementa a contagem.
--
-- A chave e o hash, nao o ip: ver chaveDeLimite() em lib/pedido.ts. A tabela
-- nao precisa saber quem e a pessoa, precisa saber se e a mesma de antes.

alter table public.leads add column if not exists chave_limite text;

comment on column public.leads.chave_limite is
  'Chave do balde em rate_limit (hash do ip). Serve para devolver a tentativa ao apagar o lead.';

-- ---------------------------------------------------------------------------
-- registrar_lead passa a guardar o balde
-- ---------------------------------------------------------------------------
-- Parametro novo com valor padrao criaria sobrecarga: as duas versoes existiriam
-- e o PostgREST teria duas candidatas. Por isso a antiga cai pela assinatura.
--
-- `p_balde` e separado de `p_chave_limite` de proposito. O segundo manda checar
-- o limite; o primeiro so manda lembrar de qual balde veio. O briefing usa o
-- balde proprio dele (0017) e por isso passa `p_chave_limite` nulo — mas ainda
-- precisa registrar de onde veio, para o apagar saber onde devolver.

drop function if exists public.registrar_lead(text, text, text, text, text, text, jsonb, text, text, text, text, text);

create or replace function public.registrar_lead(
  p_nome text,
  p_email text default null,
  p_whatsapp text default null,
  p_origem text default 'contato',
  p_tipo_projeto text default null,
  p_mensagem text default null,
  p_respostas jsonb default '{}'::jsonb,
  p_faixa_estimada text default null,
  p_prazo_estimado text default null,
  p_temperamento text default null,
  p_chave_limite text default null,
  p_direcao_visual text default null,
  p_balde text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_token text;
begin
  if p_chave_limite is not null then
    if not public.checar_rate_limit('lead:' || p_chave_limite, 5, 3600) then
      raise exception 'limite_excedido'
        using hint = 'Aguarde antes de enviar outra mensagem.';
    end if;
  end if;

  if coalesce(trim(p_nome), '') = '' then
    raise exception 'nome_obrigatorio';
  end if;

  if coalesce(trim(p_email), '') = '' and coalesce(trim(p_whatsapp), '') = '' then
    raise exception 'contato_obrigatorio';
  end if;

  if jsonb_typeof(p_respostas) is distinct from 'object'
     or pg_column_size(p_respostas) > 32768 then
    raise exception 'respostas_invalidas';
  end if;

  insert into public.leads (
    nome, email, whatsapp, origem, tipo_projeto, mensagem,
    respostas, faixa_estimada, prazo_estimado, direcao_visual, chave_limite
  )
  values (
    trim(p_nome),
    nullif(trim(coalesce(p_email, '')), ''),
    nullif(trim(coalesce(p_whatsapp, '')), ''),
    coalesce(p_origem, 'contato'),
    nullif(trim(coalesce(p_tipo_projeto, '')), ''),
    nullif(trim(coalesce(p_mensagem, '')), ''),
    coalesce(p_respostas, '{}'::jsonb),
    nullif(trim(coalesce(p_faixa_estimada, '')), ''),
    nullif(trim(coalesce(p_prazo_estimado, '')), ''),
    nullif(trim(coalesce(p_direcao_visual, '')), ''),
    nullif(trim(coalesce(p_balde, p_chave_limite, '')), '')
  )
  returning id, token_retorno into v_id, v_token;

  -- So volta o que o proprio visitante precisa para achar o briefing de novo.
  return jsonb_build_object('id', v_id, 'token_retorno', v_token);
end;
$$;

revoke execute on function public.registrar_lead(text, text, text, text, text, text, jsonb, text, text, text, text, text, text) from public;
grant execute on function public.registrar_lead(text, text, text, text, text, text, jsonb, text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- apagar_lead
-- ---------------------------------------------------------------------------
-- Precisa ser `security definer` por causa de `rate_limit`: a 0001 revoga tudo
-- dela para anon e authenticated, entao nem o admin logado alcanca a tabela por
-- fora. Sem isto, apagar o lead funcionaria e devolver a tentativa nao — e o
-- painel diria que fez as duas coisas.
--
-- Definer sem checagem seria uma funcao que apaga lead de quem chamar. Por isso
-- a primeira linha e `is_admin()`.

create or replace function public.apagar_lead(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_balde text;
  v_origem text;
  v_apagados integer;
  v_liberou boolean := false;
begin
  if not public.is_admin() then
    raise exception 'nao_autorizado';
  end if;

  select l.chave_limite, l.origem into v_balde, v_origem
    from public.leads l where l.id = p_id;

  if not found then
    return jsonb_build_object('apagado', false, 'tentativa_liberada', false);
  end if;

  delete from public.leads where id = p_id;
  get diagnostics v_apagados = row_count;

  /*
    Devolve uma tentativa ao balde de quem respondeu.

    `greatest(0, ...)` porque a janela pode ter virado entre o envio e o apagar:
    a contagem teria voltado a zero sozinha, e subtrair daria negativo — o que
    transformaria um lead apagado em tentativas extras de presente.

    So para briefing: o balde do /contato e outro, com outro teto, e mexer nele
    aqui seria devolver tentativa de uma coisa por causa de outra.
  */
  if v_apagados > 0 and v_origem = 'briefing' and coalesce(trim(v_balde), '') <> '' then
    update public.rate_limit
       set contagem = greatest(0, contagem - 1)
     where chave = 'briefing:' || v_balde;

    v_liberou := found;
  end if;

  return jsonb_build_object('apagado', v_apagados > 0, 'tentativa_liberada', v_liberou);
end;
$$;

revoke execute on function public.apagar_lead(uuid) from public, anon;
grant execute on function public.apagar_lead(uuid) to authenticated;
