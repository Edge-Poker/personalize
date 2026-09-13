-- 0003_catalogo.sql
-- Servicos, trabalhos, depoimentos e mediateca.

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  titulo text not null check (char_length(titulo) between 1 and 200),
  resumo text not null default '',
  descricao text not null default '',
  inclui text[] not null default '{}',
  nao_inclui text[] not null default '{}',
  para_quem text not null default '',
  preco_min numeric(10,2),
  preco_max numeric(10,2),
  preco_texto text,
  prazo_texto text,
  ordem integer not null default 0,
  visivel boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint faixa_de_preco_coerente check (
    preco_min is null or preco_max is null or preco_max >= preco_min
  )
);

create index services_ordem_idx on public.services (ordem);

alter table public.services enable row level security;

create trigger tg_services_touch
  before update on public.services
  for each row execute function public.touch_atualizado_em();

create policy "leitura publica de servicos visiveis"
  on public.services for select
  using (visivel = true or public.is_admin());

create policy "admin escreve servicos"
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
-- O case e um relato, entao as colunas sao as partes do relato: o que pediram,
-- qual era o problema, o que foi decidido, o que mudou, o resultado.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  titulo text not null check (char_length(titulo) between 1 and 200),
  cliente text not null default '',
  papel text not null default '',
  ano integer check (ano is null or ano between 1990 and 2100),
  resumo text not null default '',
  pedido text not null default '',
  problema text not null default '',
  decisao text not null default '',
  mudou text not null default '',
  resultado text not null default '',
  citacao text,
  citacao_autor text,
  citacao_cargo text,
  url_externa text,
  capa_path text,
  capa_alt text,
  antes_path text,
  antes_alt text,
  depois_path text,
  depois_alt text,
  tags text[] not null default '{}',
  ordem integer not null default 0,
  visivel boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- Se existe uma das duas imagens do comparador, a outra tem de existir tambem.
  constraint comparador_completo check (
    (antes_path is null) = (depois_path is null)
  )
);

create index projects_ordem_idx on public.projects (ordem);

alter table public.projects enable row level security;

create trigger tg_projects_touch
  before update on public.projects
  for each row execute function public.touch_atualizado_em();

create policy "leitura publica de trabalhos visiveis"
  on public.projects for select
  using (visivel = true or public.is_admin());

create policy "admin escreve trabalhos"
  on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
-- Nasce invisivel de proposito. Depoimento so aparece quando existe frase real
-- e alguem disse ela. Nao ha seed de depoimento neste projeto.

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  autor text not null check (char_length(autor) between 1 and 120),
  cargo text not null default '',
  texto text not null check (char_length(texto) between 1 and 2000),
  project_id uuid references public.projects(id) on delete set null,
  ordem integer not null default 0,
  visivel boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create trigger tg_testimonials_touch
  before update on public.testimonials
  for each row execute function public.touch_atualizado_em();

create policy "leitura publica de depoimentos visiveis"
  on public.testimonials for select
  using (visivel = true or public.is_admin());

create policy "admin escreve depoimentos"
  on public.testimonials for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
-- alt e obrigatorio no banco, nao so no formulario. Imagem sem alt nao entra.

create table public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  alt text not null check (char_length(trim(alt)) between 1 and 300),
  largura integer check (largura is null or largura > 0),
  altura integer check (altura is null or altura > 0),
  tipo text,
  bytes integer,
  criado_em timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "leitura publica da mediateca"
  on public.media for select
  using (true);

create policy "admin escreve mediateca"
  on public.media for all
  using (public.is_admin())
  with check (public.is_admin());
