-- ---------------------------------------------------------------------------
-- 0010 — secoes polimorficas
--
-- ATENCAO: este arquivo foi RECONSTRUIDO depois do fato.
--
-- A migration foi aplicada no banco de producao na epoca, mas o arquivo nunca
-- chegou a ser gravado no repositorio — o SQL foi passado direto para o painel
-- do Supabase. O buraco so apareceu quando alguem foi listar as migrations e
-- viu 0009 seguido de 0011. Sem este arquivo, uma instalacao nova rodando
-- 0001..0011 em ordem termina com `sections` sem project_id e com page_id
-- obrigatorio, e o codigo nao funciona contra esse banco.
--
-- Por isso tudo aqui e idempotente: rodar contra o banco que ja tem as
-- mudancas nao faz nada, e rodar contra um banco novo constroi o que falta.
-- Se as duas coisas divergirem, e este arquivo que esta errado.
--
-- O que a migration faz:
--
-- Blocos de texto e imagem deixaram de morar so em paginas. Agora uma secao
-- pertence a uma pagina, a um trabalho OU a um servico — exatamente um dos
-- tres. O CHECK e o que impede uma secao orfa ou uma secao com dois donos, que
-- apareceria duas vezes no site.
-- ---------------------------------------------------------------------------

-- page_id deixa de ser obrigatorio: agora ele e um dos tres donos possiveis.
alter table public.sections alter column page_id drop not null;

alter table public.sections
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

alter table public.sections
  add column if not exists service_id uuid references public.services(id) on delete cascade;

create index if not exists sections_project_ordem_idx on public.sections (project_id, ordem);
create index if not exists sections_service_ordem_idx on public.sections (service_id, ordem);

-- Exatamente um dono. `num_nonnulls` conta quantos dos argumentos nao sao
-- nulos — e mais direto que tres comparacoes encadeadas e nao erra quando
-- alguem acrescentar um quarto tipo de dono sem prestar atencao.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sections_um_dono'
  ) then
    alter table public.sections
      add constraint sections_um_dono
      check (num_nonnulls(page_id, project_id, service_id) = 1);
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- A politica de leitura precisa cobrir os tres donos.
--
-- A regra continua a mesma de antes, aplicada tres vezes: uma secao so e
-- publica se ela esta visivel E o dono dela esta publicado/visivel. As
-- subconsultas rodam sob a RLS das tabelas donas, entao nao ha como vazar por
-- aqui.
--
-- Sem esta politica, esconder um trabalho no painel deixaria os blocos dele
-- visiveis no site — o conteudo sumia da listagem e continuava acessivel.
-- ---------------------------------------------------------------------------

drop policy if exists "leitura publica de secoes visiveis" on public.sections;

create policy "leitura publica de secoes visiveis"
  on public.sections for select
  using (
    (
      visivel = true
      and (
        exists (
          select 1 from public.pages p
          where p.id = sections.page_id and p.publicado = true
        )
        or exists (
          select 1 from public.projects t
          where t.id = sections.project_id and t.visivel = true
        )
        or exists (
          select 1 from public.services v
          where v.id = sections.service_id and v.visivel = true
        )
      )
    )
    or public.is_admin()
  );
