-- ---------------------------------------------------------------------------
-- A prosa do resumo vira dado
-- ---------------------------------------------------------------------------
-- O bloco 1 do resultado monta uma frase a partir das respostas, e a primeira
-- versao montava usando os rotulos dos botoes. Rotulo de botao e escrito para
-- ser clicado, nao para ser lido no meio de uma oracao — e o resultado saiu
-- assim:
--
--   "Um landing page de campanha de uma, para outras empresas"
--   "Um ainda nao sei de uma, sem data marcada."
--
-- Genero errado, substantivo faltando, e uma frase que nao quer dizer nada.
-- Nenhum ajuste no codigo conserta isso sem chumbar texto: "uma" precisa virar
-- "de uma pagina", e so quem escreveu a opcao sabe qual e a forma certa.
--
-- Entao cada opcao carrega o pedaco de frase que ela vira. O artigo vem junto
-- ("um site de vendas", "uma landing page"), que e o que resolve a concordancia
-- sem o codigo ter de adivinhar genero de substantivo em portugues.
--
-- Fica editavel como todo o resto: mudar o texto do resumo e mudar uma linha
-- aqui, nao um template no codigo.

alter table public.briefing_opcoes add column if not exists frase text;

comment on column public.briefing_opcoes.frase is
  'Pedaco de frase usado no resumo em prosa do resultado. Nulo cai no rotulo.';

update public.briefing_opcoes o set frase = v.frase
  from (values
    -- Com artigo: e ele que faz a concordancia funcionar.
    ('tipo', 'portfolio', 'um portfólio profissional'),
    ('tipo', 'vendas', 'um site de vendas'),
    ('tipo', 'landing', 'uma landing page de campanha'),
    ('tipo', 'nao-sei', 'um projeto que ainda vai ser definido'),

    ('publico', 'cliente-final', 'para cliente final'),
    ('publico', 'empresas', 'para outras empresas'),
    ('publico', 'interno', 'para público interno'),
    ('publico', 'comunidade', 'para uma comunidade ou para alunos'),

    ('paginas', 'uma', 'de uma página'),
    ('paginas', 'ate-cinco', 'de até cinco páginas'),
    ('paginas', 'cinco-quinze', 'de cinco a quinze páginas'),
    ('paginas', 'mais-quinze', 'com mais de quinze páginas, ou número ainda aberto'),

    -- Sem artigo: entram numa lista depois de "com".
    ('funcoes', 'pagamento', 'pagamento'),
    ('funcoes', 'login', 'área de login'),
    ('funcoes', 'blog', 'blog'),
    ('funcoes', 'agendamento', 'agendamento de horário'),
    ('funcoes', 'whatsapp', 'integração com WhatsApp'),

    ('identidade', 'logo-e-cores', 'a partir da identidade que já existe'),
    ('identidade', 'so-logo', 'a partir de um logo que já existe'),
    ('identidade', 'nada', 'partindo de uma identidade que ainda vai ser criada'),
    ('identidade', 'refazer', 'com a identidade atual sendo refeita'),

    ('prazo', 'semana', 'para ir ao ar na semana que vem'),
    ('prazo', 'mes', 'para ir ao ar neste mês'),
    ('prazo', 'tres-meses', 'para ir ao ar nos próximos três meses'),
    ('prazo', 'sem-pressa', 'sem data marcada')
  ) as v(chave, valor, frase)
 where o.valor = v.valor
   and o.pergunta_id = (select p.id from public.briefing_perguntas p where p.chave = v.chave);
