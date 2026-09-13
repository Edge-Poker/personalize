# persona.lize

Site do estudio. Next.js 15 (App Router), TypeScript estrito, Tailwind v4,
Supabase (Auth, Postgres, Storage) e deploy na Vercel.

O plano visual esta em [DESIGN.md](./DESIGN.md). Leia antes de mexer em
qualquer coisa de interface: as regras de cor, grid e movimento sao decisoes,
nao preferencias.

## Onde estamos

Entrega em seis etapas, com revisao no fim de cada uma.

- [x] 1. `DESIGN.md` com o plano e a autocritica
- [x] 2. Projeto, migrations, RLS, login e middleware
- [x] 3. Site publico com o conteudo semente e a troca de temperamento
- [x] 4. Painel `/admin` e edicao no proprio site
- [ ] 5. Briefing conversacional e propostas por link
- [ ] 6. Cases com comparador, SEO, polimento e acessibilidade

## Rodar na sua maquina

Precisa de Node 20 ou mais novo.

```bash
npm install
cp .env.example .env.local
```

Preencha o `.env.local` com os dados do seu projeto no Supabase
(Project Settings > API). Depois:

```bash
npm run dev
```

O site sobe em http://localhost:3000.

## Aplicar as migrations

As migrations estao em `supabase/migrations`, numeradas, e devem ser aplicadas
em ordem. Duas formas:

**Pelo painel do Supabase** — abra o SQL Editor e cole o conteudo de cada
arquivo, na ordem, de `0001` ate `0011`. E o caminho mais simples se voce so
vai fazer isso uma vez.

**Pela CLI** — mais confortavel se for mexer no banco com frequencia:

```bash
npx supabase link --project-ref <id-do-projeto>
npx supabase db push
```

Confira depois, no SQL Editor, que nao sobrou tabela sem protecao:

```sql
select tablename, rowsecurity
  from pg_tables
 where schemaname = 'public'
 order by tablename;
```

Toda linha tem de vir com `rowsecurity = true`. Se alguma vier `false`, pare e
resolva antes de seguir: sem RLS a tabela esta aberta para a internet.

### Conferir a sintaxe antes de aplicar

Da para passar as migrations pelo parser oficial do Postgres sem ter banco
nenhum rodando. Pega erro de digitacao no SQL e no corpo das funcoes plpgsql:

```bash
pip install pglast
npm run checar-sql
```

Isso nao verifica se a policy faz o que promete, nem se o nome da coluna
existe — so sintaxe. O teste de verdade e aplicar num projeto Supabase e
tentar ler `leads` deslogado (tem de vir vazio).

## Criar a sua conta

Nao existe cadastro no site. Nenhuma rota cria conta, e a tabela `admins` nao
tem policy de insert. A unica porta e este script, que roda na sua maquina com
a `service_role`:

```bash
npm run criar-admin
```

Ele le o `ADMIN_EMAIL` do `.env.local`, pergunta a senha sem mostrar na tela,
cria a conta ja confirmada e coloca o `user_id` em `admins`.

Se ja existir um admin, o script recusa — o site e de uma conta so. Para trocar
a senha da conta que ja existe:

```bash
npm run criar-admin -- --forcar
```

Depois disso, `/entrar` com esse e-mail e senha da acesso a `/admin`.

## Publicar na Vercel

1. Suba o repositorio para o GitHub.
2. Na Vercel, "Add New > Project" e importe o repositorio. O framework e
   detectado sozinho.
3. Em Settings > Environment Variables, coloque as seis variaveis do
   `.env.example`, nos tres ambientes (Production, Preview, Development).
   `NEXT_PUBLIC_SITE_URL` em Production e o dominio de verdade, sem barra no
   fim.
4. Deploy.
5. No Supabase, em Authentication > URL Configuration, ponha o dominio da
   Vercel em Site URL e em Redirect URLs. Sem isso o login funciona em local e
   quebra em producao.

`SUPABASE_SERVICE_ROLE_KEY` entra so como variavel de servidor. Se ela algum
dia aparecer com prefixo `NEXT_PUBLIC_`, ela esta no bundle do navegador e
precisa ser rotacionada no mesmo dia.

## Como o acesso e controlado

Tres camadas, e as tres precisam falhar junto para vazar alguma coisa:

1. **Middleware** (`middleware.ts`) — `/admin` sem sessao vai para `/entrar`.
2. **Layout** (`app/admin/layout.tsx`) — sessao que nao esta em `admins` e
   mandada de volta. Autenticado nao e autorizado.
3. **RLS** — toda policy de escrita exige `is_admin()`. Mesmo com as duas
   camadas acima furadas, o banco recusa.

A UI nunca e a autorizacao. Ela so evita mostrar botao que nao ia funcionar.

### Regras de leitura, em uma frase cada

- `pages`, `sections`, `services`, `projects`, `testimonials`, `nav_items` —
  o publico le so o que esta publicado e visivel.
- `leads`, `proposals`, `rascunhos`, `rate_limit` — o publico nao le nada,
  nunca, em nenhuma consulta.
- Lead novo entra pela funcao `registrar_lead`, nao por policy de insert:
  policy nao controla coluna, e funcao controla.
- Proposta e retorno de briefing passam por funcao `security definer` que
  exige o token e devolve um objeto montado a mao. A tabela continua fechada.

## A capa

A home abre com um video em tela cheia que **nao toca sozinho**: ele e percorrido
pelo movimento horizontal do mouse. O arquivo precisa estar inteiro na memoria
para poder ser percorrido, entao ele so carrega no desktop com apontador fino.
No telefone entra um fundo desenhado em CSS, que custa zero byte.

### O video ainda nao e seu

O arquivo veio de `d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/`,
que e a pasta de **outra conta**. Esta hospedado no bucket `midia` agora, o que
resolve banda e confiabilidade, mas **o direito sobre a imagem nao foi
verificado**. Antes de por o site no ar: confirme que pode usar, ou troque.

Trocar e uma linha — sobe o arquivo e muda `video` nos dados da secao `heroi`,
que da para editar pelo proprio site:

    node scripts/enviar-video.mjs caminho/do/video.mp4 nome-no-bucket.mp4

## As animacoes

O vocabulario `.fx-*` da secao 15 do `globals.css` veio de
[naocodei.com/free-code-css](https://naocodei.com/free-code-css/), adaptado aos
tokens do site. Quem dispara e `components/animar.tsx`: um IntersectionObserver
so para a pagina inteira, que poe a classe `run` quando o elemento entra e para
de observa-lo. Animacao de entrada roda uma vez.

Dois detalhes que decidem se isso e bom ou desastre:

- Todo estado inicial escondido mora dentro de `[data-fx]`, e `data-fx` so e
  escrito no `<html>` pelo JavaScript. Sem script — buscador, leitor de texto,
  bundle que falhou — nada fica invisivel esperando um observador que nao vem.
- O gatilho e `threshold: 0` com a borda de baixo puxada para dentro, e nao uma
  fracao do elemento. Fracao quebra em secao mais alta que a janela: ela nunca
  atinge a porcentagem e ficaria invisivel para sempre.

`.acao` e `.pilula` respondem ao cursor sem precisar de classe nenhuma — ima e
onda no clique sao de serie em todo botao. A lista de seletores esta em
`animar.tsx`.

## Antes de mostrar para alguem

Tres coisas no conteudo semente precisam de voce. As duas primeiras deixam
buraco visivel no site.

1. **Contatos.** `site_settings > contato` esta com e-mail, WhatsApp e
   Instagram vazios. Enquanto estiverem assim, o botao de WhatsApp nao aparece
   em lugar nenhum e o rodape mostra so a descricao da marca. Preencha pelo
   SQL Editor ou pelo painel, na etapa 4.
2. **Sua historia.** A pagina `/sobre` fala de processo — o que da para
   afirmar olhando os tres cases. Ela nao fala de voce: nome, formacao,
   trajetoria, cidade. Eu nao invento isso. Acrescente uma secao sua.
3. **Os prazos dos servicos.** Voce me passou os precos, nao os prazos. Os
   textos "2 a 3 semanas", "4 a 6 semanas" e "1 semana" sao estimativa minha e
   estao marcados como tal na migration `0008`. Confira antes de publicar: e
   promessa que voce vai ter de cumprir.

Depoimento nao entra nesta lista porque nao ha nenhum no banco, de proposito.
A tabela `testimonials` nasce com `visivel = false` e o espaco da citacao no
case fica visivelmente vazio ate existir frase real de gente real.

## Como o site publico e montado

- Leitura pelo cliente **sem cookie** (`lib/supabase/publico.ts`), entao as
  paginas sao estaticas com revalidacao de uma hora em vez de renderizadas por
  visitante. E o que segura a nota de performance.
- Erro de banco **derruba o build** em vez de virar pagina vazia. Sem isso, o
  Supabase fora do ar na hora do deploy publicaria a home como 404, congelada
  ate a proxima revalidacao.
- Os itens do menu, os servicos, os trabalhos e as secoes da home vem todos do
  banco. `/sobre` nao tem rota escrita a mao: ela e desenhada pelo segmento
  dinamico `app/(site)/[slug]`, que e o mesmo caminho de qualquer pagina nova
  que voce criar.
- Secao com `dados` fora do formato esperado e pulada, nao quebra a pagina.

### A troca de temperamento

- Tres paletas, tres pares tipograficos e tres ritmos de espacamento, todos em
  CSS custom properties registradas com `@property` — e por isso que a troca
  interpola em vez de cortar.
- O texto dos blocos-chave vem no HTML **nas tres vozes**, e o CSS esconde as
  duas que nao valem com `display:none`. Funciona sem JavaScript, nao pisca, e
  o leitor de tela le so a voz ativa.
- Um script inline no `<body>` le o `localStorage` antes da primeira pintura.
  A transicao so e liberada depois disso, senao o site se pintaria sozinho a
  cada carregamento.
- `prefers-reduced-motion: reduce` desliga a transicao inteira.

Conferir os contrastes dos tres temperamentos:

```bash
python3 scripts/checar-cores.py
```

## Editar o site

Duas superficies, com divisao clara:

- **`/admin`** cuida do que e estrutural: criar pagina, ordenar secoes e abas,
  preco, prazo, visibilidade, leads, mediateca, ajustes da marca.
- **O proprio site** cuida do texto. No painel, clique em "editar no site":
  as URLs normais passam a mostrar a versao editavel. Clique em qualquer
  paragrafo, escreva por cima, e use a barra que aparece embaixo para desfazer,
  descartar ou salvar.

Salvar guarda **rascunho**, nao publica. O que voce escreveu fica esperando em
`/admin`, na lista "rascunhos nao publicados", ate voce mandar publicar. Ate
la, quem visita continua vendo o texto antigo.

Para editar as outras duas vozes de um bloco, troque o temperamento no
cabecalho: so a voz ativa fica clicavel, entao o seletor tambem serve de
navegacao entre as tres versoes do mesmo paragrafo.

### Por que o editor nao esta no site publico

O briefing pedia duas coisas que nao cabem na mesma pagina: a pagina publica
editavel ao clicar, e quem nao esta logado nao ver "nem o botao, nem o bundle".
Ou a pagina e estatica e igual para todos, ou ela varia por sessao e deixa de
ser cacheavel.

A saida foram duas paginas para a mesma URL. `/sobre` continua sendo HTML
estatico sem uma linha de codigo de editor. Quem tem sessao e ligou o modo de
edicao e **reescrito** pelo middleware para `/editar/sobre`, que desenha os
mesmos componentes com a camada de edicao em volta. O endereco na barra nao
muda.

O que faz isso funcionar e a injecao em `components/texto.tsx`: quem monta a
pagina recebe o componente de texto por prop. A rota publica passa
`TextoSimples`, a do editor passa `Editavel`. Como nenhum dos dois e importado
por quem monta, o grafo de modulos da rota publica nunca encosta no editor.

Da para conferir depois de um build:

```bash
grep -rl "Clique em qualquer texto para editar" .next/static/chunks/
```

So os arquivos sob `app/editar/` devem aparecer. Se algum chunk de rota publica
aparecer nessa lista, o editor vazou e a regressao e real.

### Imagens

O envio recorta, reduz para no maximo 2000px e converte para WebP no navegador,
antes de subir - um jpg de camera nao chega inteiro ao Storage. A descricao e
obrigatoria no formulario e tambem no banco: ha um check em `media.alt`, entao
nao ha caminho que grave imagem sem ela.

AVIF nao e gerado aqui: nenhum navegador codifica AVIF por `canvas.toBlob`
ainda. Quem entrega AVIF e o `next/image` na hora de servir, a partir do WebP.

## Estrutura

```
app/(site)/     site publico, estatico
app/editar/     espelho editavel das mesmas URLs
app/entrar/     login
app/admin/      painel
components/     cabecalho, rodape, secoes, seletor de temperamento
components/editor/  contentEditable e barra flutuante
lib/            clientes Supabase, conteudo, rascunhos, env, tipos
supabase/       migrations numeradas, semente em 0008
scripts/        criar-admin, checar-sql, checar-cores
DESIGN.md       o plano visual e a autocritica
```
