-- ---------------------------------------------------------------------------
-- Recalibra os pesos para a faixa 599 .. 6.500
-- ---------------------------------------------------------------------------
-- Os numeros da 0015 eram um chute meu, e o chute saiu alto: o cenario mais
-- pesado dava R$ 8.800 a R$ 24.600, e ate um caso comum passava dos R$ 9.000.
-- Faixa que nao corresponde ao que se cobra e pior que faixa nenhuma — ela
-- afasta quem caberia no orcamento e atrai quem esta pedindo outra coisa.
--
-- A escala nova mira uma banda: nada abaixo de 599, e 6.500 como teto do que a
-- calculadora se propoe a estimar. O piso e o teto em si moram em
-- lib/briefing.ts (PISO e TETO), porque sao politica do negocio e nao peso de
-- opcao; estes pesos aqui sao o que faz a conta cair naturalmente dentro deles,
-- sem depender do corte.
--
-- Calibrado contra nove cenarios, do mais barato ao mais caro:
--
--   o mais barato possivel      R$ 599 a R$ 1.000
--   portfolio simples           R$ 800 a R$ 2.000
--   landing de campanha         R$ 900 a R$ 2.100
--   vendas tipico             R$ 2.300 a R$ 4.400
--   vendas com agendamento    R$ 2.800 a R$ 5.400
--   pesado, sem ser tudo      R$ 3.300 a R$ 6.300
--   quase tudo                R$ 3.900 a R$ 6.500+
--   TUDO no maximo            R$ 4.400 a R$ 6.500+
--
-- O teto so aparece nos dois ultimos, que era o pedido: bater em 6.500+ tem de
-- significar "voce marcou quase tudo", nao "voce marcou duas coisas".
--
-- Os minimos de base continuam sendo os precos publicados em /servicos — 649,
-- 1.499 e 599. Aqueles sao reais e nao se mexe neles aqui.

-- Base por tipo: os maximos desceram, os minimos ficaram.
update public.briefing_opcoes o set base_max = v.base_max
  from (values
    ('portfolio', 1500.00),
    ('vendas', 2600.00),
    ('landing', 1150.00)
  ) as v(valor, base_max)
 where o.valor = v.valor
   and o.pergunta_id = (select id from public.briefing_perguntas where chave = 'tipo');

-- Volume: 2,1x para "mais de quinze" multiplicava o projeto inteiro por dois.
-- Mais paginas custa mais, mas nao dobra — o trabalho de montar a segunda
-- metade de um site e menor que o da primeira.
update public.briefing_opcoes o set fator = v.fator
  from (values
    ('uma', 0.85),
    ('ate-cinco', 1.00),
    ('cinco-quinze', 1.22),
    ('mais-quinze', 1.45)
  ) as v(valor, fator)
 where o.valor = v.valor
   and o.pergunta_id = (select id from public.briefing_perguntas where chave = 'paginas');

-- Funcionalidades: pagamento e login continuam os mais pesados, como manda o
-- 5.2, mas numa escala em que somar todas nao triplica a conta.
update public.briefing_opcoes o
   set acrescimo_min = v.amin, acrescimo_max = v.amax
  from (values
    ('pagamento', 350.00, 750.00),
    ('login', 450.00, 900.00),
    ('blog', 180.00, 380.00),
    ('agendamento', 220.00, 500.00),
    ('whatsapp', 50.00, 120.00),
    ('nada', 0.00, 0.00)
  ) as v(valor, amin, amax)
 where o.valor = v.valor
   and o.pergunta_id = (select id from public.briefing_perguntas where chave = 'funcoes');

update public.briefing_opcoes o
   set acrescimo_min = v.amin, acrescimo_max = v.amax
  from (values
    ('logo-e-cores', 0.00, 0.00),
    ('so-logo', 120.00, 300.00),
    ('nada', 280.00, 620.00),
    ('refazer', 350.00, 700.00)
  ) as v(valor, amin, amax)
 where o.valor = v.valor
   and o.pergunta_id = (select id from public.briefing_perguntas where chave = 'identidade');

-- Urgencia: 1,35 somava mais de um terco ao total so pela pressa. A pressa
-- custa, mas esse peso fazia o prazo decidir o orcamento sozinho.
update public.briefing_opcoes o set fator = v.fator
  from (values
    ('semana', 1.18),
    ('mes', 1.06),
    ('tres-meses', 1.00),
    ('sem-pressa', 1.00)
  ) as v(valor, fator)
 where o.valor = v.valor
   and o.pergunta_id = (select id from public.briefing_perguntas where chave = 'prazo');
