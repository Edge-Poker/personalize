-- ---------------------------------------------------------------------------
-- 0011 — a capa
--
-- O herói deixou de ser um bloco de texto sobre uma composição e passou a ser
-- a capa inteira: vídeo percorrido pelo mouse, frase que se digita e pílulas.
-- Os campos mudaram de papel:
--
--   nota    era a nota de margem, agora são as duas linhas desfocadas
--   titulo  era o h1 estático, agora é a frase que a máquina de escrever monta
--   acoes   eram botões, agora são as pílulas
--   email   novo, alimenta a pílula que copia o endereço
--   video   novo, o arquivo no bucket midia
--
-- `voz`, `seletor_antes` e `seletor_depois` continuam gravados na linha e são
-- ignorados pelo esquema. Não apago: se a capa não vingar, o texto ainda está
-- aqui. Coluna sem uso custa nada; texto perdido custa reescrever.
--
-- O update é por merge (||), então rodar de novo não duplica nem apaga o que
-- não é citado.
-- ---------------------------------------------------------------------------

update sections s
set dados = s.dados || jsonb_build_object(
  'nota', E'Oi. Aqui é o estúdio inteiro:\numa pessoa, um site por vez.',
  'titulo', 'Que bom que você parou. Todo site que eu faço começa com uma conversa. Vamos começar a sua?',
  'acoes', jsonb_build_array(
    jsonb_build_object('rotulo', 'quero um site', 'href', '/contato'),
    jsonb_build_object('rotulo', 'ver trabalhos', 'href', '/trabalhos'),
    jsonb_build_object('rotulo', 'quanto custa', 'href', '/servicos'),
    jsonb_build_object('rotulo', 'como eu trabalho', 'href', '/sobre')
  ),
  -- Fica vazio de propósito. A pílula que copia o endereço só aparece quando
  -- existir endereço de verdade — inventar um e-mail seria pior que não ter.
  'email', '',
  'video', 'https://fjmnwelhtsipmpghnqcl.supabase.co/storage/v1/object/public/midia/capa/capa-2026.mp4'
)
from pages p
where s.page_id = p.id
  and p.slug = 'home'
  and s.tipo = 'heroi';
