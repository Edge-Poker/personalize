-- 0001_base.sql
-- Fundacao: extensoes, helpers, tabela de admins e controle de taxa.
-- RLS ligada em toda tabela criada aqui, desde a primeira linha.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Toca atualizado_em em qualquer tabela que tenha a coluna.
create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- Token opaco de 32 bytes, seguro para URL (43 caracteres).
--
-- gen_random_bytes fica sem qualificacao de schema de proposito: o Supabase
-- instala pgcrypto em `extensions`, mas instalacao antiga pode ter em `public`.
-- O search_path abaixo cobre os dois casos.
create or replace function public.gerar_token()
returns text
language sql
volatile
set search_path = public, extensions, pg_temp
as $$
  select translate(encode(gen_random_bytes(32), 'base64'), '+/=', '-_');
$$;

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
-- A autorizacao vive aqui, no banco. A UI pode mentir; a policy nao.
-- Nao existe policy de insert: so o service_role (script criar-admin) ou SQL
-- direto no painel do Supabase colocam alguem aqui. E o que impede uma segunda
-- conta de aparecer sozinha.

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  criado_em timestamptz not null default now()
);

alter table public.admins enable row level security;

-- security definer porque a propria policy de admins precisa consultar admins;
-- sem isso a checagem entra em recursao infinita.
-- Precisa existir antes de qualquer policy que a referencie.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins leem admins"
  on public.admins for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- rate_limit
-- ---------------------------------------------------------------------------
-- Janela deslizante simples, por chave. Sem policy nenhuma: RLS ligada e zero
-- policies significa zero acesso via API. So funcoes security definer entram.

create table public.rate_limit (
  chave text primary key,
  contagem integer not null default 0,
  janela_inicio timestamptz not null default now()
);

alter table public.rate_limit enable row level security;
revoke all on public.rate_limit from anon, authenticated;

create or replace function public.checar_rate_limit(
  p_chave text,
  p_limite integer,
  p_janela_segundos integer
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_contagem integer;
begin
  insert into public.rate_limit as r (chave, contagem, janela_inicio)
  values (p_chave, 1, now())
  on conflict (chave) do update
    set contagem = case
          when r.janela_inicio < now() - make_interval(secs => p_janela_segundos) then 1
          else r.contagem + 1
        end,
        janela_inicio = case
          when r.janela_inicio < now() - make_interval(secs => p_janela_segundos) then now()
          else r.janela_inicio
        end
  returning r.contagem into v_contagem;

  return v_contagem <= p_limite;
end;
$$;

revoke execute on function public.checar_rate_limit(text, integer, integer) from public;
grant execute on function public.checar_rate_limit(text, integer, integer) to anon, authenticated;
