-- 0006_propostas.sql
-- Proposta privada por link. A tabela nao tem nenhuma policy publica: nem
-- select, nem insert. O cliente chega so pelas duas funcoes daqui de baixo,
-- que exigem slug E token juntos e devolvem um objeto montado a mao.
--
-- Consequencia pratica: nao da para listar propostas, nao da para descobrir
-- que uma proposta existe, e nao da para ver preco de outro cliente nem
-- adivinhando o slug.

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  token text not null unique default public.gerar_token(),
  lead_id uuid references public.leads(id) on delete set null,
  titulo text not null check (char_length(titulo) between 1 and 200),
  cliente text not null default '',
  resumo text not null default '',
  escopo jsonb not null default '[]'::jsonb,
  etapas jsonb not null default '[]'::jsonb,
  condicoes text not null default '',
  preco numeric(10,2) check (preco is null or preco >= 0),
  preco_texto text,
  prazo_texto text,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'enviada', 'aceita', 'recusada', 'cancelada')),
  expira_em timestamptz,
  enviada_em timestamptz,
  vista_em timestamptz,
  aceito_em timestamptz,
  aceite_ip inet,
  aceite_user_agent text,
  aceite_nome text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index proposals_status_idx on public.proposals (status);
create index proposals_lead_idx on public.proposals (lead_id);

alter table public.proposals enable row level security;

create trigger tg_proposals_touch
  before update on public.proposals
  for each row execute function public.touch_atualizado_em();

create policy "so admin toca propostas"
  on public.proposals for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Cast de IP que nao explode
-- ---------------------------------------------------------------------------
-- O IP vem de cabecalho HTTP. Pode vir vazio, pode vir com porta, pode vir
-- com lixo. Uma proposta aceita nao pode falhar porque o proxy mandou algo
-- estranho no x-forwarded-for.

create or replace function public.texto_para_inet(p text)
returns inet
language plpgsql
immutable
as $$
begin
  return p::inet;
exception when others then
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- proposta_por_token
-- ---------------------------------------------------------------------------

create or replace function public.proposta_por_token(p_slug text, p_token text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v jsonb;
begin
  if coalesce(trim(p_slug), '') = '' or coalesce(trim(p_token), '') = '' then
    return null;
  end if;

  -- Nao devolve rascunho nem proposta cancelada, e nao devolve nada depois
  -- da data de expiracao.
  select p.id,
         jsonb_build_object(
           'slug', p.slug,
           'titulo', p.titulo,
           'cliente', p.cliente,
           'resumo', p.resumo,
           'escopo', p.escopo,
           'etapas', p.etapas,
           'condicoes', p.condicoes,
           'preco', p.preco,
           'preco_texto', p.preco_texto,
           'prazo_texto', p.prazo_texto,
           'status', p.status,
           'expira_em', p.expira_em,
           'aceito_em', p.aceito_em,
           'aceite_nome', p.aceite_nome
         )
    into v_id, v
    from public.proposals p
   where p.slug = p_slug
     and p.token = p_token
     and p.status in ('enviada', 'aceita', 'recusada')
     and (p.expira_em is null or p.expira_em > now());

  if v_id is null then
    return null;
  end if;

  -- Primeira visualizacao fica registrada; as seguintes nao mexem em nada.
  update public.proposals
     set vista_em = now()
   where id = v_id and vista_em is null;

  return v;
end;
$$;

revoke execute on function public.proposta_por_token(text, text) from public;
grant execute on function public.proposta_por_token(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- aceitar_proposta
-- ---------------------------------------------------------------------------

create or replace function public.aceitar_proposta(
  p_slug text,
  p_token text,
  p_nome text default null,
  p_ip text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
  v_aceito_em timestamptz;
begin
  if coalesce(trim(p_slug), '') = '' or coalesce(trim(p_token), '') = '' then
    return jsonb_build_object('ok', false, 'motivo', 'link_invalido');
  end if;

  if not public.checar_rate_limit('aceite:' || p_slug, 10, 3600) then
    return jsonb_build_object('ok', false, 'motivo', 'limite_excedido');
  end if;

  select p.status, p.aceito_em
    into v_status, v_aceito_em
    from public.proposals p
   where p.slug = p_slug and p.token = p_token
   for update;

  if v_status is null then
    return jsonb_build_object('ok', false, 'motivo', 'link_invalido');
  end if;

  -- Aceitar de novo nao e erro: devolve o aceite que ja existe.
  if v_status = 'aceita' then
    return jsonb_build_object('ok', true, 'ja_aceita', true, 'aceito_em', v_aceito_em);
  end if;

  if v_status <> 'enviada' then
    return jsonb_build_object('ok', false, 'motivo', 'indisponivel');
  end if;

  update public.proposals
     set status = 'aceita',
         aceito_em = now(),
         aceite_ip = public.texto_para_inet(p_ip),
         aceite_user_agent = left(coalesce(p_user_agent, ''), 500),
         aceite_nome = nullif(trim(coalesce(p_nome, '')), '')
   where slug = p_slug
     and token = p_token
     and status = 'enviada'
     and (expira_em is null or expira_em > now())
  returning aceito_em into v_aceito_em;

  if v_aceito_em is null then
    return jsonb_build_object('ok', false, 'motivo', 'expirada');
  end if;

  return jsonb_build_object('ok', true, 'ja_aceita', false, 'aceito_em', v_aceito_em);
end;
$$;

revoke execute on function public.aceitar_proposta(text, text, text, text, text) from public;
grant execute on function public.aceitar_proposta(text, text, text, text, text) to anon, authenticated;
