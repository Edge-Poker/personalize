-- 0009_textos.sql
-- A linha que guarda os textos de interface.
--
-- Título de serviço mora em `services`, relato de case mora em `projects`, mas
-- "o que ele pediu", "Está incluso" e os estados vazios não pertencem a
-- registro nenhum. Eram literais espalhados por oito arquivos, fora do alcance
-- do painel - o que contrariava o item 6 do briefing, que pede tudo editável.
--
-- A linha nasce vazia de propósito: os valores padrão vivem em lib/textos.ts e
-- o banco só guarda o que for editado. Assim, apagar uma chave devolve o texto
-- ao padrão em vez de deixar buraco na tela.
--
-- Mas ela precisa existir. Publicar rascunho faz UPDATE, e UPDATE em linha
-- inexistente afeta zero linhas sem reclamar - a edição sumiria em silêncio.

insert into public.site_settings (chave, valor, publico)
values ('textos', '{}'::jsonb, true)
on conflict (chave) do nothing;
