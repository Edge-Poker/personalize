-- ---------------------------------------------------------------------------
-- 0013 — o video novo
--
-- O anterior era 3828x2164, e era percorrido pelo mouse. As duas coisas
-- estavam erradas juntas: buscar num video daquele tamanho tem teto de ~12
-- quadros por segundo (medido), e amarrar a capa ao mouse deixava o celular
-- sem gesto nenhum.
--
-- O novo toca sozinho, em laco, igual nos dois. Tem comeco e fim diferentes —
-- as flores crescem —, entao quem fecha o ciclo sao duas copias em
-- cross-fade; ver components/capa-motor.tsx.
--
-- A URL abaixo e a de origem, de terceiro. Trocar para o bucket proprio e
-- rodar scripts/enviar-video.mjs e depois editar este campo pelo site.
-- ---------------------------------------------------------------------------

update sections s
set dados = s.dados || jsonb_build_object(
  'video', 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_115057_94c3699b-0fd1-4124-bcf3-3626bb8c1f77.mp4'
)
from pages p
where s.page_id = p.id
  and p.slug = 'home'
  and s.tipo = 'heroi';
