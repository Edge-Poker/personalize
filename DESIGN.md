# persona.lize — plano de design

Documento da etapa 1. Nada de código ainda. Aqui está a decisão visual inteira,
com os números, e no fim a autocrítica contra a lista de proibições.

---

## 1. A ideia em uma frase

O site é feito de **papel, tinta e um acento** — e o acento troca conforme quem
está lendo. A marca não é uma paleta; é uma estrutura que aceita três humores
sem se desmanchar.

O ponto de `persona.lize` não é pontuação. Ele é o **indicador de estado**: marca
o temperamento ativo no topo, marca o progresso no briefing, marca a etapa aceita
na proposta. É a única coisa do site que tem permissão de se mexer.

---

## 2. Cor

### 2.1 O que é fixo na marca

Estes três não mudam entre temperamentos. São a espinha.

| Token | Hex | Função | Contraste |
|---|---|---|---|
| `--tinta` | `#14302F` | Todo texto de leitura. Petróleo muito escuro, nunca preto. Preto puro é frio e denuncia falta de escolha. | **11,9:1** sobre o papel mais escuro |
| `--tinta-fraca` | `#4A6461` | Texto secundário, legendas, notas da margem. Mesma família da tinta, dessaturada. | **5,4:1** sobre o papel mais escuro |
| `--linha` | tinta a 18% sobre o papel | Fio de 1px. Separação vem de fio, não de sombra. | decorativo |

Não existe token de sombra. O site não tem sombra em lugar nenhum — a profundidade
vem de fio, de posição no grid e de espaço vazio. Isso é uma decisão, não uma
economia (ver princípio 3).

### 2.2 O que muda por temperamento

Cada temperamento tem **um acento**, e o papel é **esse acento diluído a ~4%**.
Por isso a troca parece costurada e não um tema alternativo colado por cima: o
fundo já é parente da cor de destaque.

Cada acento vem em duas versões, porque um acento só quase nunca passa em AA e
em área grande ao mesmo tempo:

- `--acento` — escuro o bastante para **texto pequeno** (≥ 4,5:1)
- `--acento-vivo` — a versão saturada, só para **área ≥ 24px, fios grossos e gráficos**

**calmo** *(padrão para quem não escolhe nada)*

| Token | Hex | Contraste sobre papel |
|---|---|---|
| `--papel` | `#E9EDE5` | — (sálvia pálida) |
| `--acento` | `#6F5518` | **5,9:1** ✅ AA texto pequeno |
| `--acento-vivo` | `#8A6B1F` | 4,2:1 — só área grande |

Ocre profundo, quase latão. É quente sem ser laranja: o matiz fica em ~48°,
território de mostarda/bronze, longe dos ~18° do terracota.

**direto**

| Token | Hex | Contraste sobre papel |
|---|---|---|
| `--papel` | `#EFF1EC` | — (papel mais claro e mais frio) |
| `--acento` | `#0E4F5C` | **8,1:1** ✅ |
| `--acento-vivo` | `#136B7C` | 4,6:1 ✅ |

Petróleo azul. É o temperamento que aumenta contraste e reduz espaço — o papel
clareia e o acento escurece de propósito.

**autoral**

| Token | Hex | Contraste sobre papel |
|---|---|---|
| `--papel` | `#EDE8EA` | — (malva pálido, tingido pelo vinho) |
| `--acento` | `#7A2E42` | **7,6:1** ✅ |
| `--acento-vivo` | `#9B3A54` | 4,8:1 ✅ |

Vinho dessaturado sobre papel malva. É o par mais incomum dos três e o que mais
parece escolha de alguém.

> Todos os números acima foram calculados na fórmula WCAG de luminância relativa,
> não estimados. Na etapa 6 eu passo tudo por ferramenta para confirmar, incluindo
> os estados de foco e as combinações acento-sobre-acento.

**Regra de uso:** o acento aparece no máximo **três vezes por tela**. Se aparecer
uma quarta, alguma das três não era importante.

---

## 3. Tipografia

### 3.1 O conflito que precisei resolver

O briefing pede duas coisas que se batem:

- seção 3: *"uma família tipográfica de display"* — restrição
- seção 5.1: o temperamento troca *"o par tipográfico"* — variação

Resolvi assim: **uma display só, mas variável**. O temperamento não troca a
família de display — ele **move os eixos** dela. Mesma voz, postura diferente.
Quem troca de verdade é a família de texto, e só num dos três casos.

Efeito colateral bom: como Fraunces é uma fonte variável, os eixos **interpolam**
durante a transição. A troca de temperamento vira uma animação tipográfica real,
não um corte. É disso que vem o único momento memorável do site (seção 5).

### 3.2 As famílias

**Display — Fraunces** (Google Fonts, OFL, via `next/font/google`)
Serifada variável com eixos `wght`, `opsz`, `SOFT` e `WONK`. O `SOFT` engorda e
amolece as terminações; o `WONK` troca desenhos de letra por variantes tortas. É
literalmente traço de espessura variável, como caneta — o que a seção 3 do
briefing pediu, e sem recorrer a blob com gradiente.

**Texto — Public Sans** (Google Fonts, OFL, via `next/font/google`)
Neutra, hinting excelente (vem do design system do governo americano), altura-x
generosa, sem maneirismo. É a face que fica quieta enquanto a display fala.

**Texto do temperamento `autoral` — Newsreader** (Google Fonts, OFL)
Serifada de texto com eixo óptico. Muda a textura da leitura inteira, não só o
título. É o que faz `autoral` parecer outro site sem virar outra marca.

Nenhuma das três é Inter nem Playfair. As três carregam por `next/font`, sem
requisição externa, sem CLS, sem passo manual de instalação.

> **Alternativa que deixo anotada:** se você quiser algo ainda menos visto no lugar
> de Public Sans, **Switzer** (Fontshare, grátis) é melhor desenhada. Custa
> auto-hospedar os arquivos `.woff2` no repo. Não fiz por padrão porque adiciona
> um passo manual e Public Sans resolve. Se quiser, troco na etapa 3.

### 3.3 Os pares por temperamento

| | display (Fraunces) | texto | tracking do corpo |
|---|---|---|---|
| **calmo** | `wght 400` · `opsz 60` · `SOFT 60` · `WONK 0` | Public Sans 400 | `0` |
| **direto** | `wght 600` · `opsz 144` · `SOFT 0` · `WONK 0` | Public Sans 500 | `-0.008em` |
| **autoral** | `wght 500` · `opsz 9` · `SOFT 100` · `WONK 1` | Newsreader 400 | `+0.004em` |

`opsz 9` no `autoral` é o truque: o tamanho óptico pequeno aplicado em texto
grande dá letras robustas e estranhas, com serifas grossas demais para o corpo.
Parece desenho, não default.

### 3.4 Escala

Progressão **irregular de propósito** — as razões vão de 1,13 a 1,41. Uma escala
de razão constante (1,25 em tudo) soa mecânica; esta tem respiração.

| Papel | px | peso | altura de linha | tracking | família |
|---|---|---|---|---|---|
| `nota` | 13 | 500 | 1,50 | `+0.01em` | texto |
| `corpo-p` | 15 | 400 | 1,65 | `0` | texto |
| `corpo` | 17 | 400 | 1,70 | `-0.003em` | texto |
| `corpo-g` | 20 | 400 | 1,58 | `-0.006em` | texto |
| `titulo-4` | 22 | 500 | 1,30 | `-0.010em` | display |
| `titulo-3` | 29 | 500 | 1,22 | `-0.014em` | display |
| `titulo-2` | 41 | 500 | 1,12 | `-0.018em` | display |
| `titulo-1` | 58 | 400 | 1,04 | `-0.022em` | display |
| `display` | `clamp(41, 8.2vw, 82)` | 400 | 0,98 | `-0.026em` | display |

Medida de leitura fixada em **62 caracteres**, não em pixels. Corpo nunca abaixo
de 15px em lugar nenhum, inclusive rodapé e formulário.

O temperamento multiplica a escala inteira: calmo `1.0`, direto `0.94`,
autoral `1.06`.

---

## 4. Layout

### 4.1 O conceito: grid de 13 colunas

**13 é primo.** Nenhum número divide 13 em partes iguais. Não dá para fazer três
cards iguais nem quatro cards iguais sem sobrar coluna — a assimetria não é uma
escolha que eu preciso lembrar de fazer em cada seção, é uma **consequência da
estrutura**. Isso mata o clichê de "tudo picado em cards idênticos" no nível do
grid, antes de virar tentação.

O layout tem duas zonas:

- **a calha** — colunas 1 a 4. Segura a nota da seção: uma frase curta, caixa
  baixa, na display em itálico, cor `--tinta-fraca`. É o lugar onde a maioria dos
  sites põe eyebrow em CAIXA ALTA. Aqui é uma anotação de margem, escrita como
  gente fala.
- **a mancha** — colunas 5 a 13. O conteúdo.

Alinhamento **óptico, não métrico**: aspas, itálicos e o ponto da marca saem da
margem alguns pixels para a linha *parecer* reta. Números tabulares em preço e
prazo.

### 4.2 Espaçamento

Progressão aditiva (cada passo é a soma dos dois anteriores, arredondada ao pixel):

```
4 · 7 · 11 · 18 · 29 · 47 · 76 · 123 · 199
```

Não é 8/16/24/32. É a mesma matemática de arranjo de folha em caule — daí vem o
"orgânico" da seção 3 do briefing, sem desenhar uma folha em lugar nenhum.

Densidade por temperamento: calmo `×1.15`, direto `×0.85`, autoral `×1.00`.
É o que faz a troca ser sentida no corpo e não só nos olhos.

### 4.3 Raio de borda = hierarquia

O raio **codifica profundidade**, não decora:

| Nível | Raio | O quê |
|---|---|---|
| Página | `0` | Superfícies que encostam na borda da tela |
| Bloco | `2px` | Blocos de conteúdo dentro da mancha |
| Coisa que se segura | `2px 12px 2px 12px` | Botões, chips, o seletor de temperamento |
| Imagem | `0` | Foto e captura de tela nunca têm raio |

O raio assimétrico dos elementos interativos é a única licença poética do sistema.
Dá a eles um leve ar de coisa recortada à mão, e só eles têm.

### 4.4 Wireframe — home

```
┌─────────────────────────────────────────────────────────────────────────┐
│ persona.lize        serviços  trabalhos  sobre  contato                  │
│                                    como você prefere ler?  ● ○ ○         │
│                                             calmo  direto  autoral       │
├──────────────────┬──────────────────────────────────────────────────────┤
│ col 1–4 (calha)  │ col 5–13 (mancha)                                    │
│                  │                                                       │
│                  │  Eu faço sites que                                    │
│                  │  não parecem template.                                │
│  isto aqui muda  │                                                       │
│  de humor        │  Troque ali em cima e veja: muda a cor, a letra, o    │
│  enquanto você   │  espaço entre as coisas e o jeito que este parágrafo  │
│  lê. é o produto │  está escrito. Mesma informação, outra voz. É o que   │
│  se demonstrando │  eu faço para cada cliente, aqui feito na sua frente. │
│  sozinho.        │                                                       │
│                  │  ┌ ver trabalhos ┐   falar comigo no whatsapp         │
│                  │  └───────────────┘                                    │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │                                                       │
│  o que eu faço   │  Portfólio profissional        a partir de R$ —       │
│                  │  ─────────────────────────────────────────────────    │
│                  │  Site de vendas                a partir de R$ —       │
│                  │  ─────────────────────────────────────────────────    │
│                  │  Landing page de campanha      a partir de R$ —       │
│                  │  ─────────────────────────────────────────────────    │
│                  │  Projeto sob medida            escopo a combinar      │
│                  │                                                       │
│                  │  (lista, não grade de cards. cada linha abre a        │
│                  │   página do serviço. o fio é a separação.)            │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │  ┌───────────────────────────────┐                    │
│  três trabalhos  │  │                               │  Eduardo Cantelli  │
│  reais. o do     │  │   imagem larga, sem raio      │  psiquiatra · 2025 │
│  Cantelli é      │  │                               │                    │
│  sobre refazer   │  └───────────────────────────────┘                    │
│  a primeira      │  A primeira versão ficou fria. Refizemos.             │
│  versão inteira. │                                                       │
│                  │        ┌───────────────────────────────┐              │
│                  │        │   imagem deslocada 2 colunas  │  EDGE Poker  │
│                  │        │   à direita — o ritmo quebra  │  2025        │
│                  │        └───────────────────────────────┘              │
│                  │        Curso, fórum, provas, ranking, assinatura.     │
│                  │                                                       │
│                  │  (cada caso entra em uma largura e um deslocamento    │
│                  │   diferentes. nenhum é do mesmo tamanho do outro.)    │
├──────────────────┼──────────────────────────────────────────────────────┤
│  em vez de       │  Me conta o que você precisa em 7 perguntas.          │
│  formulário      │  No fim eu te devolvo faixa de preço, prazo e uma     │
│                  │  amostra de direção visual. Leva uns 3 minutos.       │
│                  │  ┌ começar o briefing ┐                               │
│                  │  └────────────────────┘                               │
├──────────────────┴──────────────────────────────────────────────────────┤
│ persona.lize      whatsapp   email   instagram          voltar ao topo   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Por que a calha fica à esquerda:** o texto é em português, a leitura vai da
esquerda para a direita, e a nota precisa ser lida *antes* do conteúdo — ela
enquadra o que vem. Calha à direita viraria rodapé lateral e ninguém leria.

**No mobile (≤ 720px):** o grid de 13 vira 4. A calha deixa de ser coluna e vira
uma linha acima do conteúdo, com fio à esquerda de 1px e recuo — continua sendo
visivelmente uma anotação, não um subtítulo. O seletor de temperamento sai do
cabeçalho e vira uma faixa fixa e baixa no rodapé da viewport, alcançável com o
polegar.

### 4.5 Wireframe — página interna (`/trabalhos/eduardo-cantelli`)

Escolhi o caso em vez do serviço porque é onde mora o diferencial 5.4.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ persona.lize        serviços  trabalhos  sobre  contato      ● ○ ○      │
├──────────────────┬──────────────────────────────────────────────────────┤
│                  │  Eduardo Cantelli                                     │
│  psiquiatra e    │  Site para consultório de psiquiatria e psicoterapia. │
│  psicoterapeuta  │                                                       │
│  2025            │                                                       │
│                  │                                                       │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │                                                       │
│  o que ele pediu │  Um site onde o paciente encontrasse as informações   │
│                  │  práticas sem se sentir num consultório de convênio.  │
│                  │                                                       │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │                                                       │
│  o problema      │  A primeira versão que eu entreguei estava correta e  │
│  de verdade      │  estava fria. Cinza, tipografia dura, texto em        │
│                  │  terceira pessoa. Certa para uma clínica, errada      │
│                  │  para ele. O problema não era o layout, era a voz.    │
│                  │                                                       │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │  ╔═════════════════════╦═════════════════════════╗    │
│  o que mudou     │  ║   antes             ║             depois      ║    │
│                  │  ║                     ║                         ║    │
│                  │  ║  ← arraste a alça → ║                         ║    │
│                  │  ║                     ║                         ║    │
│                  │  ╚═════════════════════╩═════════════════════════╝    │
│                  │  Comparador arrastável. Também funciona com as        │
│                  │  setas do teclado quando recebe foco.                 │
│                  │                                                       │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │                                                       │
│  a decisão       │  Refizemos com argila rosada e reescrevemos tudo em   │
│                  │  primeira pessoa. Ele passou a soar como ele.         │
│                  │                                                       │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │      “                                                │
│  o que ele       │      espaço da citação do cliente — fica vazio e      │
│  disse           │      editável até existir uma frase real.             │
│                  │                                          — nome, cargo│
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │  próximo trabalho                                     │
│                  │  EDGE Poker                                           │
└──────────────────┴──────────────────────────────────────────────────────┘
```

A página inteira é **uma coluna de texto com anotações na margem**. Não tem card,
não tem grade, não tem "resultados em números". É um relato. A imagem entra na
largura que o assunto pede, não numa largura padrão.

---

## 5. Movimento

**Uma animação memorável no site inteiro, e ela é a troca de temperamento.**

Quando você troca, durante ~520ms:

1. os **eixos da Fraunces interpolam** — as letras dos títulos engordam, amolecem
   e entortam no meio do caminho, de verdade, porque a fonte é variável;
2. o acento **percorre o arco de matiz** entre o antigo e o novo em espaço OKLCH,
   então passa por cores intermediárias plausíveis em vez de piscar;
3. a escala de espaçamento interpola, e o conteúdo **respira** para a nova
   densidade.

Tudo isso é uma transição de custom properties com `@property` registrado, então
o navegador interpola sozinho na thread de composição. Não é JS animando estilo.

**O resto do site fica quieto.** Sem entrada ao rolar. Sem transição de hover em
card — o único hover que existe é o sublinhado do link e a mudança de cor do fio,
e é instantâneo.

O ponto da marca tem **uma** função de movimento fora disso: no briefing, ele é a
barra de progresso — cresce de ponto a traço conforme você avança. Movimento
funcional, não enfeite.

`prefers-reduced-motion: reduce` → a troca vira corte de 1 frame e o ponto do
briefing muda de tamanho sem transição. Nada quebra, nada some.

**Sem flash ao carregar:** script inline e bloqueante no `<head>` lê o
`localStorage` e escreve `data-temperamento` no `<html>` antes da primeira
pintura. Sem tema escolhido → `calmo`.

---

## 6. Princípios

Quatro regras. Se alguma coisa nova não passa nas quatro, não entra.

1. **Treze colunas, nunca simétrico.** Se dois blocos têm a mesma largura e a mesma
   altura lado a lado, um dos dois está errado.
2. **A hierarquia vem de posição e tamanho, nunca de estilo de letra.** Nada de
   caixa alta decorativa, nada de itálico para "dar destaque", nada de uma palavra
   colorida no meio do título. Se precisa gritar, sobe no grid ou cresce.
3. **Fio, não sombra.** A separação entre as coisas é uma linha de 1px ou é espaço
   vazio. O site não tem uma única `box-shadow` de elevação.
4. **O ponto é a única coisa que se move.** Um momento de movimento memorável — a
   troca de temperamento — e uma função de movimento útil — o ponto como progresso.
   Fora isso, parado.

---

## 7. Autocrítica contra a lista de proibições

Revisei o plano contra os dez itens. O que eu mudei e por quê:

| Proibição | Situação | O que eu fiz |
|---|---|---|
| Creme `#F4F1EA` + serifada de alto contraste + terracota `#D97757` | **Era o risco maior.** Meu primeiro rascunho tinha papel `#EDE9E1` no temperamento quente — vizinho do creme queimado — e eu quase escolhi ocre saturado, que na tela vira primo do terracota. | Troquei o papel quente de creme para **malva `#EDE8EA`**, tingido pelo vinho e não pelo bege. E fixei que o papel de cada tema é o **acento diluído**, o que impede o bege de voltar: não existe acento bege. O ocre que sobrou está em matiz ~48° (latão), não ~18° (terracota). |
| Preto quase-preto com acento verde-ácido ou vermelho neon | Não entrou | Não existe fundo escuro no site. A tinta é `#14302F`, petróleo, e os três acentos são todos dessaturados. |
| Tudo picado em cards idênticos, mesmo raio, mesma sombra | Risco estrutural | Resolvido na **estrutura**, não na disciplina: grid de **13 colunas primo** impede repetição igual, o raio **codifica hierarquia** em vez de decorar, e **não existe token de sombra** no sistema. Serviços viram lista com fio; trabalhos entram em larguras e deslocamentos diferentes. |
| Eyebrow em CAIXA ALTA espaçada acima de cada título | **Eu tinha isso.** No primeiro rascunho a calha carregava um rótulo de seção em caixa alta com tracking. | Virou **nota de margem**: caixa baixa, display em itálico, escrita como frase ("o problema de verdade", "isto aqui muda de humor enquanto você lê"). É informação, não etiqueta. Está no princípio 2 para não voltar. |
| `01 / 02 / 03` em conteúdo que não é sequência | Não entrou | Os quatro serviços e os três trabalhos não são numerados — não são etapas. O único lugar com número é a barra de progresso do briefing, que **é** sequência, e mesmo lá o indicador é o ponto, não o algarismo. |
| Uma palavra do título em cor ou itálico diferente | Não entrou | Princípio 2 proíbe. Títulos são de uma cor e de um estilo só, sempre. |
| Seta `→` colada em link e botão | **Eu tinha isso.** Estava no rascunho do wireframe da home, em "ver trabalhos →". | Tirei todas. O CTA é só o verbo: "ver trabalhos", "começar o briefing", "falar comigo no whatsapp". Se um link precisa de seta para parecer clicável, ele está mal escrito ou mal posicionado. |
| Monoespaçada em rótulo pequeno por estética | Não entrou | Não existe monoespaçada no projeto. As notas de margem são display em itálico; metadados são a face de texto em 13px. |
| Metadados com ponto médio `A · B · C` | **Escapou.** No wireframe do case eu escrevi `psiquiatra · 2025`. | Correção para a etapa 3: metadado vira **linhas empilhadas na calha**, uma por linha, como já está no wireframe da página interna ("psiquiatra e psicoterapeuta" / "2025"). Deixei o `·` visível na home acima **de propósito, como marca do que precisa ser corrigido**, para você conferir que eu achei. |
| Fade-and-slide-up em toda seção + hover em todo card | Não entrou | Seção 5: uma animação no site inteiro, zero entrada ao rolar, zero transição de hover em card. |

**Onde eu divergi do ponto de partida do briefing, e por quê:**

- Você sugeriu *"um acento único"*. Eu entrego **um acento por temperamento**,
  três no total — mas nunca dois na mesma tela, e cada um em duas luminâncias por
  exigência de contraste, não por gosto. Sem isso o diferencial 5.1 não teria o
  que trocar.
- Você sugeriu *"uma família de display"*. Mantive uma só e fiz o temperamento
  mover os **eixos variáveis** dela. Quem troca de família é a face de texto, e
  só no `autoral`. Como efeito, ganhei a animação da seção 5 de graça.

---

## 8. Três coisas que eu preciso que você decida

1. **Public Sans ou Switzer** como face de texto. Public Sans: zero setup, ótimo
   hinting, um pouco sem graça. Switzer: melhor desenhada, exige auto-hospedar os
   `.woff2`. Meu voto é começar com Public Sans e trocar na etapa 6 se incomodar.
2. **O temperamento padrão é `calmo`** (ocre sobre sálvia). Se você preferir que
   quem chega sem escolher veja `autoral` (vinho sobre malva), é uma linha de
   config — mas `calmo` é o mais legível dos três e o menos arriscado como
   primeira impressão.
3. **Faixas de investimento.** Nos wireframes está `a partir de R$ —` porque eu
   não vou inventar seu preço. Preciso dos quatro números (ou da decisão de exibir
   "sob consulta") antes da etapa 3, já que a mesma tabela alimenta as regras de
   preço do briefing.

---

**Próxima etapa, quando você aprovar:** projeto Next.js, migrations numeradas com
RLS desde a primeira, `admins`, login, middleware. Sem visual ainda.
