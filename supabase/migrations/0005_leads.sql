-- 0005_leads.sql
-- Leads de contato e de briefing.
--
-- Decisao: a tabela nao tem policy de INSERT publico. O visitante escreve
-- atraves da funcao registrar_lead, que e security definer.
--
-- O briefing pedia "insert publico". Uma policy de insert aberta deixaria
-- qualquer um gravar status = 'fechado', respostas gigantes ou um token de
-- retorno escolhido a dedo, porque policy nao controla coluna. A funcao entrega
-- o mesmo resultado - qualquer pessoa cria um lead, ninguem le - e ainda e o
-- lugar natural do rate limit e da validacao de tamanho.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) between 2 and 120),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  whatsapp text check (whatsapp is null or char_length(whatsapp) between 8 and 30),
  origem text not null default 'contato' check (origem in ('contato', 'briefing', 'proposta', 'outro')),
  tipo_projeto text,
  mensagem text check (mensagem is null or char_length(mensagem) <= 4000),
  respostas jsonb not null default '{}'::jsonb,
  faixa_estimada text,
  prazo_estimado text,
  temperamento text check (temperamento is null or temperamento in ('calmo', 'direto', 'autoral')),
  status text not null default 'novo' check (status in ('novo', 'lido', 'respondido', 'proposta', 'fechado', 'arquivado')),
  token_retorno text not null unique default public.gerar_token(),
  ip inet,
  user_agent text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint pelo_menos_um_contato check (email is not null or whatsapp is not null)
);

create index leads_criado_em_idx on public.leads (criado_em desc);
create index leads_status_idx on public.leads (status);

alter table public.leads enable row level security;

create trigger tg_leads_touch
  before update on public.leads
  for each row execute function public.touch_atualizado_em();

-- Unica policy: admin. Nao existe leitura publica de lead, nem por token -
-- o retorno do briefing passa pela funcao la embaixo, que devolve so as
-- colunas que o proprio visitante escreveu.
create policy "so admin toca leads"
  on public.leads for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- registrar_lead
-- ---------------------------------------------------------------------------

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
  p_chave_limite text default null
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
    respostas, faixa_estimada, prazo_estimado, temperamento
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
    nullif(trim(coalesce(p_temperamento, '')), '')
  )
  returning id, token_retorno into v_id, v_token;

  -- So volta o que o proprio visitante precisa para achar o briefing de novo.
  return jsonb_build_object('id', v_id, 'token_retorno', v_token);
end;
$$;

revoke execute on function public.registrar_lead(text, text, text, text, text, text, jsonb, text, text, text, text) from public;
grant execute on function public.registrar_lead(text, text, text, text, text, text, jsonb, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Retorno do briefing por token
-- ---------------------------------------------------------------------------
-- O visitante volta pelo link e edita o que respondeu. A tabela continua
-- fechada: a funcao devolve um objeto montado a mao, sem status, sem ip,
-- sem user_agent, sem id interno.

create or replace function public.briefing_por_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v jsonb;
begin
  if coalesce(trim(p_token), '') = '' then
    return null;
  end if;

  select jsonb_build_object(
           'nome', l.nome,
           'email', l.email,
           'whatsapp', l.whatsapp,
           'tipo_projeto', l.tipo_projeto,
           'respostas', l.respostas,
           'faixa_estimada', l.faixa_estimada,
           'prazo_estimado', l.prazo_estimado,
           'temperamento', l.temperamento,
           'criado_em', l.criado_em
         )
    into v
    from public.leads l
   where l.token_retorno = p_token
     and l.origem = 'briefing'
     and l.status <> 'arquivado';

  return v;
end;
$$;

revoke execute on function public.briefing_por_token(text) from public;
grant execute on function public.briefing_por_token(text) to anon, authenticated;

create or replace function public.atualizar_briefing(
  p_token text,
  p_respostas jsonb,
  p_faixa_estimada text default null,
  p_prazo_estimado text default null,
  p_nome text default null,
  p_email text default null,
  p_whatsapp text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_linhas integer;
begin
  if coalesce(trim(p_token), '') = '' then
    return false;
  end if;

  if not public.checar_rate_limit('briefing:' || p_token, 30, 3600) then
    raise exception 'limite_excedido';
  end if;

  if jsonb_typeof(p_respostas) is distinct from 'object'
     or pg_column_size(p_respostas) > 32768 then
    raise exception 'respostas_invalidas';
  end if;

  update public.leads l
     set respostas = p_respostas,
         faixa_estimada = coalesce(nullif(trim(coalesce(p_faixa_estimada, '')), ''), l.faixa_estimada),
         prazo_estimado = coalesce(nullif(trim(coalesce(p_prazo_estimado, '')), ''), l.prazo_estimado),
         nome = coalesce(nullif(trim(coalesce(p_nome, '')), ''), l.nome),
         email = coalesce(nullif(trim(coalesce(p_email, '')), ''), l.email),
         whatsapp = coalesce(nullif(trim(coalesce(p_whatsapp, '')), ''), l.whatsapp)
   where l.token_retorno = p_token
     and l.origem = 'briefing'
     and l.status not in ('arquivado', 'fechado');

  get diagnostics v_linhas = row_count;
  return v_linhas > 0;
end;
$$;

revoke execute on function public.atualizar_briefing(text, jsonb, text, text, text, text, text) from public;
grant execute on function public.atualizar_briefing(text, jsonb, text, text, text, text, text) to anon, authenticated;
