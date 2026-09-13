-- ---------------------------------------------------------------------------
-- 0012 — video no bucket da midia
--
-- O bucket `midia` nasceu na 0007 aceitando so imagem, porque so existia
-- imagem: a biblioteca do painel converte tudo para WebP antes de enviar. A
-- capa trouxe um mp4, e o upload voltou com "mime type video/mp4 is not
-- supported" — a lista de tipos e uma trava do proprio Storage, nao do codigo.
--
-- Por que estender este bucket em vez de criar um so para video: o `midia` ja
-- tem leitura publica e as policies de escrita para admin, e o video nao entra
-- na biblioteca do painel — o script de upload nao cria linha em `media`, e a
-- biblioteca lista `media`, nao o bucket. Bucket novo seria um segundo jogo de
-- policies para guardar um arquivo.
--
-- O limite de 10 MB continua o mesmo. Ele existe para caber uma capa em video
-- curta e barrar alguem subindo um filme por engano — se um dia precisar de
-- mais, mexer aqui e uma linha.
-- ---------------------------------------------------------------------------

update storage.buckets
set allowed_mime_types = array[
  'image/webp',
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'video/mp4'
]
where id = 'midia';
