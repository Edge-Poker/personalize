-- ---------------------------------------------------------------------------
-- Semente do briefing (5.2)
-- ---------------------------------------------------------------------------
-- As sete perguntas, as opcoes e os pesos.
--
-- AVISO SOBRE OS NUMEROS: os minimos de `base_min` sao os precos publicados em
-- /servicos (649, 1.499, 599) e portanto sao reais. Todo o resto — maximos,
-- fatores de volume, acrescimos por funcionalidade, custo de identidade e fator
-- de urgencia — foi arbitrado por mim como ponto de partida plausivel, nao por
-- quem cobra. Sao editaveis pelo painel, e devem ser revisados antes de o
-- briefing ir ao ar de verdade: uma faixa errada numa tela de orcamento custa
-- mais caro que uma tela feia.
--
-- `on conflict do nothing` em tudo: rodar de novo nao desfaz o que voce ajustou.

insert into public.briefing_perguntas (chave, ordem, enunciado, tipo, max_escolhas, ajuda)
values
  ('tipo', 10, 'O que você precisa?', 'unica', null, null),
  ('publico', 20, 'Para quem é?', 'unica', null, null),
  ('paginas', 30, 'Quantas páginas você imagina?', 'unica', null,
   'Chute sem medo. Serve para dimensionar, não para fechar escopo.'),
  ('funcoes', 40, 'O que o site precisa fazer além de informar?', 'multipla', null,
   'Pode marcar quantas quiser.'),
  ('identidade', 50, 'Você já tem identidade visual?', 'unica', null, null),
  ('prazo', 60, 'Quando precisa no ar?', 'unica', null, null),
  ('clima', 70, 'Escolha três palavras para o clima do site', 'multipla', 3,
   'No máximo três. São elas que montam a amostra visual no fim.')
on conflict (chave) do nothing;

-- ---------------------------------------------------------------------------
-- 1. Tipo — a unica pergunta que traz base e dias
-- ---------------------------------------------------------------------------

insert into public.briefing_opcoes
  (pergunta_id, ordem, valor, rotulo, base_min, base_max, dias_min, dias_max, sem_orcamento)
select p.id, v.ordem, v.valor, v.rotulo, v.base_min, v.base_max, v.dias_min, v.dias_max, v.sem_orcamento
  from public.briefing_perguntas p
  join (values
    (10, 'portfolio', 'Portfólio profissional', 649.00, 1600.00, 7, 21, false),
    (20, 'vendas', 'Site de vendas', 1499.00, 4500.00, 21, 42, false),
    (30, 'landing', 'Landing page de campanha', 599.00, 1400.00, 7, 14, false),
    -- Sem base: nao ha o que multiplicar, e o resultado pula a faixa de preco.
    (40, 'nao-sei', 'Ainda não sei', null, null, null, null, true)
  ) as v(ordem, valor, rotulo, base_min, base_max, dias_min, dias_max, sem_orcamento) on true
 where p.chave = 'tipo'
on conflict (pergunta_id, valor) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Publico — sem peso: entra no resumo em prosa, nao na conta
-- ---------------------------------------------------------------------------

insert into public.briefing_opcoes (pergunta_id, ordem, valor, rotulo)
select p.id, v.ordem, v.valor, v.rotulo
  from public.briefing_perguntas p
  join (values
    (10, 'cliente-final', 'Cliente final'),
    (20, 'empresas', 'Outras empresas'),
    (30, 'interno', 'Público interno'),
    (40, 'comunidade', 'Comunidade ou alunos')
  ) as v(ordem, valor, rotulo) on true
 where p.chave = 'publico'
on conflict (pergunta_id, valor) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Paginas — multiplicador
-- ---------------------------------------------------------------------------

insert into public.briefing_opcoes (pergunta_id, ordem, valor, rotulo, fator, fator_dias)
select p.id, v.ordem, v.valor, v.rotulo, v.fator, v.fator_dias
  from public.briefing_perguntas p
  join (values
    (10, 'uma', 'Uma', 0.85, 0.80),
    (20, 'ate-cinco', 'Até cinco', 1.00, 1.00),
    (30, 'cinco-quinze', 'Cinco a quinze', 1.45, 1.35),
    (40, 'mais-quinze', 'Mais de quinze ou não sei', 2.10, 1.80)
  ) as v(ordem, valor, rotulo, fator, fator_dias) on true
 where p.chave = 'paginas'
on conflict (pergunta_id, valor) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Funcoes — soma fixa. Pagamento e login sao os pesados, como manda o 5.2
-- ---------------------------------------------------------------------------

insert into public.briefing_opcoes
  (pergunta_id, ordem, valor, rotulo, acrescimo_min, acrescimo_max, dias_acrescimo, neutra)
select p.id, v.ordem, v.valor, v.rotulo, v.amin, v.amax, v.dias, v.neutra
  from public.briefing_perguntas p
  join (values
    (10, 'pagamento', 'Receber pagamento', 900.00, 2200.00, 10, false),
    (20, 'login', 'Ter área de login', 1200.00, 3000.00, 14, false),
    (30, 'blog', 'Ter blog ou conteúdo', 400.00, 1100.00, 5, false),
    (40, 'agendamento', 'Agendar horário', 600.00, 1500.00, 7, false),
    (50, 'whatsapp', 'Integrar com WhatsApp', 120.00, 350.00, 1, false),
    -- Neutra: marcar isto limpa as outras, e nao soma nada.
    (60, 'nada', 'Nada disso', 0.00, 0.00, 0, true)
  ) as v(ordem, valor, rotulo, amin, amax, dias, neutra) on true
 where p.chave = 'funcoes'
on conflict (pergunta_id, valor) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Identidade — soma de criacao quando nao existe ou vai ser refeita
-- ---------------------------------------------------------------------------

insert into public.briefing_opcoes
  (pergunta_id, ordem, valor, rotulo, acrescimo_min, acrescimo_max, dias_acrescimo)
select p.id, v.ordem, v.valor, v.rotulo, v.amin, v.amax, v.dias
  from public.briefing_perguntas p
  join (values
    (10, 'logo-e-cores', 'Tenho logo e cores', 0.00, 0.00, 0),
    (20, 'so-logo', 'Tenho só logo', 250.00, 700.00, 3),
    (30, 'nada', 'Não tenho nada', 700.00, 1900.00, 8),
    (40, 'refazer', 'Tenho e quero refazer', 900.00, 2400.00, 10)
  ) as v(ordem, valor, rotulo, amin, amax, dias) on true
 where p.chave = 'identidade'
on conflict (pergunta_id, valor) do nothing;

-- ---------------------------------------------------------------------------
-- 6. Prazo — fator de urgencia. Sobe o preco e comprime os dias
-- ---------------------------------------------------------------------------

insert into public.briefing_opcoes (pergunta_id, ordem, valor, rotulo, fator, fator_dias)
select p.id, v.ordem, v.valor, v.rotulo, v.fator, v.fator_dias
  from public.briefing_perguntas p
  join (values
    (10, 'semana', 'Semana que vem', 1.35, 0.55),
    (20, 'mes', 'Neste mês', 1.10, 0.80),
    (30, 'tres-meses', 'Nos próximos três meses', 1.00, 1.00),
    -- "Sem pressa nao altera nada" no preco; nos dias, afrouxa.
    (40, 'sem-pressa', 'Sem pressa', 1.00, 1.15)
  ) as v(ordem, valor, rotulo, fator, fator_dias) on true
 where p.chave = 'prazo'
on conflict (pergunta_id, valor) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Clima — as doze palavras. Sem peso: alimentam a direcao visual
-- ---------------------------------------------------------------------------

insert into public.briefing_opcoes (pergunta_id, ordem, valor, rotulo)
select p.id, v.ordem, v.valor, v.rotulo
  from public.briefing_perguntas p
  join (values
    (10, 'sobrio', 'sóbrio'),
    (20, 'quente', 'quente'),
    (30, 'tecnico', 'técnico'),
    (40, 'artesanal', 'artesanal'),
    (50, 'minimalista', 'minimalista'),
    (60, 'denso', 'denso'),
    (70, 'luminoso', 'luminoso'),
    (80, 'serio', 'sério'),
    (90, 'jovem', 'jovem'),
    (100, 'classico', 'clássico'),
    (110, 'ousado', 'ousado'),
    (120, 'silencioso', 'silencioso')
  ) as v(ordem, valor, rotulo) on true
 where p.chave = 'clima'
on conflict (pergunta_id, valor) do nothing;

-- ---------------------------------------------------------------------------
-- Direcoes visuais
-- ---------------------------------------------------------------------------
-- AVISO: estas quatro sao minhas, nao suas. O 5.2 diz "pre-desenhada por mim",
-- e quem desenha e voce. Elas existem para o bloco 3 do resultado funcionar de
-- ponta a ponta hoje; troque as cores e os pares tipograficos pelos seus.
--
-- A escolha e por sobreposicao: vence a direcao que casa com mais palavras das
-- tres marcadas. Cada uma das doze palavras aparece em pelo menos uma direcao,
-- senao existiria combinacao sem resposta.

insert into public.briefing_direcoes
  (chave, rotulo, ordem, palavras, cores, fonte_titulo, fonte_texto, nota)
values
  (
    'noturno', 'Noturno', 10,
    array['sobrio', 'serio', 'silencioso', 'minimalista', 'classico'],
    array['#000000', '#afddff', '#1b2530', '#ffffff'],
    'Cormorant Garamond', 'Source Serif',
    'Fundo preto, luz fria e muito ar. O contraste faz o trabalho que a cor não faz.'
  ),
  (
    'brasa', 'Brasa', 20,
    array['quente', 'artesanal', 'denso', 'classico'],
    array['#1a0f0a', '#e2703a', '#f0d9c0', '#7a2f18'],
    'Playfair Display', 'Lora',
    'Terra e fogo baixo. Serifa com contraste alto, para quem vende trabalho de mão.'
  ),
  (
    'oficina', 'Oficina', 30,
    array['tecnico', 'minimalista', 'sobrio', 'denso'],
    array['#0e1116', '#9fb3c8', '#e6edf3', '#2d3a47'],
    'IBM Plex Sans', 'IBM Plex Serif',
    'Cinza-azulado e grade visível. Parece ferramenta, e é de propósito.'
  ),
  (
    'fagulha', 'Fagulha', 40,
    array['luminoso', 'jovem', 'ousado'],
    array['#0a0a0f', '#ffd166', '#ef476f', '#f7f7ff'],
    'Archivo', 'Inter',
    'Dois acentos saturados sobre quase preto. Alto volume, usado com parcimônia.'
  )
on conflict (chave) do nothing;
