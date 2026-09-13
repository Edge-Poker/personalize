-- 0004_rascunhos.sql
-- Rascunho e publicado, separados.
--
-- Por que uma tabela a parte em vez de uma coluna "rascunho" em cada tabela:
-- RLS e por linha, nao por coluna. Se o rascunho morasse dentro de projects,
-- qualquer visitante que pode ler a linha publicada leria junto o texto nao
-- publicado. Aqui o rascunho vive numa tabela que o anon nao alcanca de jeito
-- nenhum, e as tabelas de conteudo guardam so o que ja esta no ar.
--
-- Publicar = copiar o jsonb para as colunas reais e apagar o rascunho.
-- Pre-visualizar = ler a linha publicada e sobrepor o rascunho, so para admin.

create table public.rascunhos (
  id uuid primary key default gen_random_uuid(),
  tabela text not null check (tabela in ('pages', 'sections', 'services', 'projects', 'testimonials', 'site_settings')),
  registro_id text not null,
  dados jsonb not null default '{}'::jsonb,
  atualizado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (tabela, registro_id)
);

alter table public.rascunhos enable row level security;

create trigger tg_rascunhos_touch
  before update on public.rascunhos
  for each row execute function public.touch_atualizado_em();

-- Uma policy so, para todas as operacoes, exigindo admin. Sem leitura publica
-- em nenhuma hipotese.
create policy "so admin toca rascunhos"
  on public.rascunhos for all
  using (public.is_admin())
  with check (public.is_admin());
