-- 0002_conteudo.sql
-- Estrutura editavel do site: ajustes globais, navegacao, paginas e secoes.
-- Leitura publica so do que esta publicado e visivel. Escrita so para admins.

-- ---------------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------------
-- chave -> valor jsonb. Marca, contatos, redes, SEO padrao, definicao dos
-- temperamentos. A coluna publico existe para eu poder guardar ajuste que o
-- visitante nao precisa ver sem inventar outra tabela.

create table public.site_settings (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb,
  publico boolean not null default true,
  atualizado_em timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create trigger tg_site_settings_touch
  before update on public.site_settings
  for each row execute function public.touch_atualizado_em();

create policy "leitura publica de ajustes publicos"
  on public.site_settings for select
  using (publico = true or public.is_admin());

create policy "admin escreve ajustes"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- nav_items
-- ---------------------------------------------------------------------------

create table public.nav_items (
  id uuid primary key default gen_random_uuid(),
  rotulo text not null check (char_length(rotulo) between 1 and 60),
  href text not null check (char_length(href) between 1 and 300),
  ordem integer not null default 0,
  visivel boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index nav_items_ordem_idx on public.nav_items (ordem);

alter table public.nav_items enable row level security;

create trigger tg_nav_items_touch
  before update on public.nav_items
  for each row execute function public.touch_atualizado_em();

create policy "leitura publica de navegacao visivel"
  on public.nav_items for select
  using (visivel = true or public.is_admin());

create policy "admin escreve navegacao"
  on public.nav_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- pages
-- ---------------------------------------------------------------------------

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  titulo text not null check (char_length(titulo) between 1 and 200),
  seo jsonb not null default '{}'::jsonb,
  publicado boolean not null default false,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.pages enable row level security;

create trigger tg_pages_touch
  before update on public.pages
  for each row execute function public.touch_atualizado_em();

create policy "leitura publica de paginas publicadas"
  on public.pages for select
  using (publicado = true or public.is_admin());

create policy "admin escreve paginas"
  on public.pages for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- sections
-- ---------------------------------------------------------------------------
-- Uma secao so e publica se ela esta visivel E a pagina dela esta publicada.
-- A subconsulta roda sob a RLS de pages, entao nao ha como vazar por aqui.

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  tipo text not null check (char_length(tipo) between 1 and 60),
  ordem integer not null default 0,
  dados jsonb not null default '{}'::jsonb,
  visivel boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index sections_page_ordem_idx on public.sections (page_id, ordem);

alter table public.sections enable row level security;

create trigger tg_sections_touch
  before update on public.sections
  for each row execute function public.touch_atualizado_em();

create policy "leitura publica de secoes visiveis"
  on public.sections for select
  using (
    (visivel = true and exists (
      select 1 from public.pages p
      where p.id = sections.page_id and p.publicado = true
    ))
    or public.is_admin()
  );

create policy "admin escreve secoes"
  on public.sections for all
  using (public.is_admin())
  with check (public.is_admin());
