# persona.lize — revisão de direção

Fase 1. Auditoria do que existe e proposta da nova direção. Nenhuma linha de
código alterada até você aprovar.

Este documento não substitui o `DESIGN.md`. Ele o corrige.

---

## 1. Diagnóstico: por que a versão atual parece genérica

Ela não tem erros. É esse o problema.

Escrevi o `DESIGN.md` inteiro me defendendo de uma lista de proibições. Cada
decisão foi tomada perguntando "isso vai parecer clichê?" e nunca perguntando
"isso vai ser lembrado?". Defesa produz ausência de erro. Não produz presença.

Cinco falhas concretas:

**1. Fiz a versão de bom gosto de exatamente o que proibi.** O briefing baniu
eyebrow em CAIXA ALTA. Eu troquei por nota de margem em serifada itálica — que
é o mesmo gesto, só que na versão que os estúdios bons usam. Troquei o clichê
popular pelo clichê fino. Continua sendo um tell.

**2. Minhas três regras estruturais são todas subtrativas.** "Fio, não sombra."
"Uma animação só." "Um acento por tela." Restrição é a estética-padrão de todo
site de estúdio desde 2018. Três regras de tirar não somam uma identidade — elas
somam bom gosto, que é outra coisa.

**3. Assimetria sistemática lê como simetria.** As 13 colunas garantem que nada
se repita igual. Mas como a regra vale sempre e do mesmo jeito, o olho aprende o
padrão em duas seções e para de notar. Assimetria que nunca surpreende é ordem
com passos diferentes.

**4. Copiei a silhueta do que evitei.** Verifiquei a paleta contra "creme +
terracota" e passei. Mas não verifiquei a *forma*: fundo claro, display serifada
enorme, muito branco, fio de 1px, itálico pequeno na margem. A cor mudou, o
desenho não. É reconhecível a três metros de distância.

**5. A coisa mais original do produto virou o menor elemento da tela.** O
seletor de temperamento — que é literalmente o que a persona.lize vende — é um
ponto de 7px no canto superior direito. Eu tratei o diferencial como
configuração. Ele devia ser a página.

O quinto é o que mais dói e é o que orienta esta revisão.

---

## 2. Auditoria da implementação

Onde a identidade mora hoje:

| Arquivo | Linhas | O que controla | Destino |
|---|---|---|---|
| `app/globals.css` | 492 | tokens, temperamentos, grid, escala, movimento | **refazer** |
| `app/fontes.ts` | 35 | Fraunces, Public Sans, Newsreader | **refazer** |
| `lib/temperamentos.ts` | 32 | os 3 temperamentos, script antiflash | aproveitar |
| `components/secoes.tsx` | 267 | tipos de seção e composição | reescrever composição, manter Zod |
| `components/pagina-servico.tsx` | 153 | composição do serviço | **refazer** |
| `components/pagina-trabalho.tsx` | 129 | composição do case | **refazer** |
| `components/marca-grafica.tsx` | 98 | placeholder gerado | aproveitar, recolorir |
| `components/seletor-temperamento.tsx` | 90 | o controle | **refazer** — vira peça central |
| `components/listas.tsx` | 86 | serviços e trabalhos | **refazer** |
| `components/texto.tsx` | 27 | injeção do editor | **não tocar** |

**O que não se toca:** Supabase, RLS, auth, migrations, painel, `components/editor/`,
`lib/rascunhos.ts`, `lib/conteudo.ts`, middleware. A injeção de `Texto` por prop
é o que mantém o editor fora do bundle público — qualquer componente refeito
continua recebendo `Texto` por prop.

**Sem alteração de schema.** Tudo que a nova voz precisa cabe em `sections.dados`
e `site_settings.valor`, que já são jsonb. É migration de dados, não de estrutura.

### O achado que muda o plano

Fiz uma varredura de prosa hardcoded. O resultado importa:

| Vem do banco, você edita clicando | Está preso no código, você não edita |
|---|---|
| home, `/sobre`, títulos e textos de serviços e trabalhos, menu, marca, SEO | intro de `/servicos`, intro de `/trabalhos`, `/contato` inteiro, `/briefing`, estados vazios, rótulos de capítulo dos cases ("o que ele pediu", "a decisão"), "Está incluso / Não está", mensagens de sucesso e de erro |

Ou seja: **metade da copy que precisa da voz nova está onde você não alcança.**
Isso contraria o item 6 do briefing original, que pede tudo editável. A Fase 3
move esses textos para `site_settings`, sem mexer no schema.

---

## 3. Nova direção: oito princípios

1. **A estrutura fica à vista.** O site mostra o próprio funcionamento em vez de
   escondê-lo atrás de acabamento. Não é decoração de "design system" — é expor
   os parâmetros de verdade, porque o produto é justamente um site que se ajusta.

2. **Duas tintas que se cruzam.** Onde dois blocos se sobrepõem, aparece uma
   terceira cor que ninguém escolheu. É `mix-blend-mode: multiply`, que é o que
   tinta faz em papel. Uma assinatura, aplicada em todo lugar, sem exceção.

3. **O alinhamento é uma promessa que às vezes se quebra.** Quase tudo obedece a
   grade. Exatamente um elemento por seção pode violá-la — sempre por uma coluna
   exata, sempre para o mesmo lado. Quebra medida lê como decisão; quebra
   aleatória lê como bug.

4. **Ênfase por largura, não por peso.** Negrito é o recurso de todo mundo. Aqui
   a palavra que importa muda de *largura*: a mesma palavra condensada ou normal.
   Só é possível com fonte variável, e é imediatamente estranho no bom sentido.

5. **O ponto é um objeto, não um caractere.** Ele sai do logotipo e trabalha:
   marca temperamento, posição, progresso, estado. Existe um só na tela por vez.

6. **Nada se move sozinho.** Movimento só responde a uma ação sua. Nenhuma
   entrada ao rolar, em lugar nenhum. A quietude é parte da direção.

7. **Se parece card, não é.** Antes de desenhar uma caixa, tentar lista, índice,
   comparação ou bloco de texto. Caixa é o último recurso, não o primeiro.

8. **Uma frase pode terminar antes do esperado.** Vale para o texto e para a
   composição: nem tudo precisa fechar.

---

## 4. Tipografia

> **Revisado depois da primeira amostra.** A proposta anterior era Bricolage
> Grotesque — uma grotesca deliberadamente irregular. Descartada: você pediu
> faces sérias e quadradas, que passem profissionalismo. Irregularidade
> intencional é o oposto disso.

Fora: Fraunces, Public Sans, Newsreader, e tudo que você listou.

**Display — Archivo** (Google Fonts, OFL, variável: `wght` 100–900,
`wdth` 62–125).

Grotesca de ombros quadrados: terminações retas, curvas que fecham em ângulo,
nenhum maneirismo simpático. Em largura expandida e corpo grande tem autoridade
de placa de sinalização. O eixo de largura vai de 62 a 125 — amplitude grande o
bastante para a mesma palavra ser irreconhecível de um extremo ao outro.

**Texto — IBM Plex Sans** (Google Fonts, OFL).

Desenhada como tipografia corporativa de engenharia. Sóbria, levemente quadrada,
sem simpatia, com legibilidade testada em ambiente técnico.

**A tensão.** As duas compartilham o esqueleto quadrado e discordam no detalhe:
Archivo é grotesca pura e fechada, Plex tem resquícios humanistas nas
terminações e no `a`. Lado a lado parecem quase da mesma família — e não são.
É um desconforto mais fino que o da proposta anterior, e mais adequado ao tom
profissional.

Serifada não entra em lugar nenhum. Serifada + sans é o par previsível que a
própria lista de proibições cita.

### Temperamento move o eixo de largura

Esta parte sobreviveu à revisão e ficou **mais** importante: com a paleta quase
monocromática, a cor deixou de poder carregar personalidade. Sobrou a forma.

| | Archivo | ritmo |
|---|---|---|
| **calmo** | `wdth 100` · `wght 500` | normal |
| **direto** | `wdth 78` · `wght 700` | condensado, denso, tracking negativo |
| **autoral** | `wdth 125` · `wght 300` | expandido, leve, tracking positivo |

De `direto` para `autoral` a largura quase dobra. É perceptível do outro lado da
sala — que era exatamente o problema do `SOFT`/`WONK` da Fraunces, que quase
ninguém notava.

### Escala

Mantida a progressão irregular do `DESIGN.md` — ela não era o problema. Razões de
1,13 a 1,41, sem razão constante.

`13 · 15 · 17 · 20 · 22 · 29 · 41 · 58 · 82`

Muda o papel do topo: `82px` deixa de ser "título grande" e passa a ser o corpo
do hero, com a frase ocupando a largura inteira e quebrando onde a medida manda.

---

## 5. Cores

Três paletas medidas antes de escolher, com `scripts/estudo-paletas.py`. As três
primeiras versões reprovaram no mesmo ponto: o bloco de segunda tinta tinha
luminância quase igual à do papel (1,05 a 1,22:1) e não se lia como bloco — sem
isso a sobreimpressão não existe. Ajustei o bloco e remedi.

> **Revisado depois da primeira amostra.** A proposta anterior era ultramar,
> ameixa e enxofre. Descartada: você pediu cores pouco distoantes entre si,
> ancoradas em preto, branco e cinza.
>
> A troca não é só de gosto — ela muda o peso das outras decisões. Se a cor
> recua, a personalidade tem de sair inteira da composição, da largura da letra
> e do ritmo. Isso é coerente com o item 19 do seu próprio briefing: *"a
> estranheza deve vir principalmente da composição e da tipografia, não de uma
> paleta carnavalesca"*. Eu tinha carregado demais na cor.

**Escolhida: quase branco, quase preto, e um aço muito dessaturado.**

Base fixa, comum aos três temperamentos:

| Token | Hex | Função |
|---|---|---|
| `--tinta` | `#121317` | quase preto, levemente frio. Todo texto de leitura. Nunca `#000` |

O resto muda por temperamento — não de matiz, mas de **temperatura e contraste**:

| | `--papel` | `--cinza` | `--acento` | `--bloco` |
|---|---|---|---|---|
| **calmo** | `#F4F4F3` | `#6A6C70` | `#34506B` | `#CFCFCE` |
| **direto** | `#FAFAFA` | `#63666B` | `#23405C` | `#C9CBCF` |
| **autoral** | `#F1EFEA` | `#6E6A62` | `#4A4034` | `#D2CCC0` |

`calmo` é neutro. `direto` é mais frio e mais contrastado — o papel clareia e o
acento escurece. `autoral` é quente: papel de creme leve e acento em grafite
amarronzado, com croma de **0,024** em OKLCH, praticamente cinza.

**Medido, não estimado.** Os 18 pares dos três temperamentos passam em AA:

- tinta sobre papel: **16,15 a 17,79:1**
- cinza sobre papel: **4,68 a 5,52:1**
- acento sobre papel: **7,61 a 10,27:1**
- tinta sobre bloco: **11,43 a 11,91:1**
- acento sobre bloco: **5,38 a 6,60:1**
- bloco contra papel: **1,39 a 1,56:1** — visível como área, sem virar mancha

Uma regra sai daí: **cinza secundário não entra dentro do bloco** (fica em 3,3:1).
Dentro de bloco só tinta ou acento.

**A sobreimpressão vira tonal.** Cinza sobre tinta não gera cor nova: gera um
cinza mais fundo. É mais discreto e mais sério que a versão colorida, e continua
sendo `multiply` de verdade — o que tinta faz em papel. A gramática sobrevive à
perda de cor; ela só fica mais quieta.

---

## 6. Grid

As 13 colunas ficam. O que muda é a relação com elas.

**Antes:** calha (colunas 1–4) e mancha (5–13), sempre, em toda seção. Previsível
depois de duas telas.

**Agora, três regras:**

1. **A grade é estrita.** Todo elemento nasce alinhado a ela.
2. **Uma quebra por seção, medida.** Exatamente um elemento pode ultrapassar,
   sempre por uma coluna mais a calha, sempre para a esquerda. Um título entra na
   margem; uma legenda desce para baixo do bloco em vez de ficar ao lado; uma
   imagem passa da borda direita da tela. Uma por seção. Nunca duas.
3. **A calha deixa de ser fixa.** Às vezes ela segura a nota; às vezes o conteúdo
   principal; às vezes fica vazia e o texto atravessa as 13. Quem decide é a
   seção, não o sistema.

A sensação alvo é a que você descreveu: ordem que ocasionalmente perde a
paciência com ela mesma. O visitante tem que sentir que há uma régua por trás,
inclusive quando algo sai dela.

**Mobile não é o desktop empilhado.** Em telas pequenas as 13 colunas viram 6, a
quebra de grid passa a ser sangria horizontal (o bloco encosta na borda da tela
enquanto o texto mantém margem), e o seletor de temperamento sai do topo para uma
faixa fixa embaixo, alcançável com o polegar. O hero no mobile não é o hero do
desktop menor: é uma composição própria, com a frase ocupando a tela quase toda.

---

## 7. Elementos proprietários

Quatro. Se algum não passar nos oito princípios, não entra.

### A. Sobreimpressão

Todo bloco chapado usa `mix-blend-mode: multiply`. Onde dois se cruzam, sai a
terceira cor. Aplica-se ao bloco de enxofre atrás de um título, à marca gráfica
dos cases, ao estado ativo do seletor, ao bloco de preço.

Por que é ownable: quase ninguém usa multiply em layout web, porque exige pensar
a paleta em função do cruzamento. Uma vez visto, é reconhecível.

### B. O ponto migrante

Existe **um** ponto na tela. Ele começa no logotipo. Quando você interage, ele
sai de lá e vai marcar o que está ativo — o temperamento escolhido, a aba atual,
a etapa do briefing, o capítulo do case que você está lendo. Quando não há nada
para marcar, ele volta para o logotipo.

Não é enfeite: é o único indicador de estado do site inteiro. E é literalmente o
ponto da marca fazendo trabalho.

### C. A cota

Divisórias deixam de ser fio de 1px. Passam a ser desenhadas como linha de cota
de desenho técnico: traço com marcações nas pontas e a informação sentada em
cima. Um separador entre serviços carrega o preço e o prazo na própria linha.

Substitui o fio (que era genérico) por algo que informa. E resolve o item 11:
serviço não vira card, vira cota.

### D. O corte largo

Palavra enfatizada não fica negrito. Fica **condensada**, com a mesma cor e o
mesmo tamanho, usando o eixo `wdth`. No meio de uma frase, a palavra parece
espremida — e é exatamente onde seu olho vai.

Só funciona com fonte variável. É o tipo de detalhe que quem entende de tipografia
reconhece e quem não entende sente sem saber por quê.

---

## 8. Movimento

Três comportamentos no site inteiro. Nada além disto.

1. **A troca de temperamento.** Continua sendo o momento principal, agora com
   muito mais amplitude: além de cor e espaçamento, o eixo `wdth` interpola (a
   frase inteira encolhe ou alarga na sua frente), a densidade muda e um ou dois
   elementos trocam de posição na composição. ~520ms, em `@property` registrado.

2. **O ponto migrante.** Anima entre posições com `view-transition` ou animação
   de posição simples. Só quando você faz alguma coisa.

3. **O comparador antes/depois do case do Cantelli.** A interação do portfólio.
   Fica para a etapa 6 do plano original.

**Nada de:** entrada ao rolar, card flutuando, parallax, texto entrando de lado,
zoom, hover em tudo. `prefers-reduced-motion` corta os três.

---

## 9. O momento estranho

> **Descartado:** a primeira proposta era o site adivinhar o temperamento a
> partir da sua velocidade de rolagem e avisar que adivinhou. Vetada — trocar a
> aparência sem a pessoa pedir é intrusivo, e o efeito não pagava o risco.

A substituta é melhor, porque não é comportamento colado por cima: sai do
conteúdo.

### O case do Cantelli se refaz na sua frente

A história daquele projeto é: a primeira versão estava certa e estava fria, e
foi refeita inteira. Hoje esse case *conta* isso em cinco parágrafos.

A proposta é que ele **faça** isso.

A página do Cantelli abre na direção errada — a fria. Cinza, tipografia dura,
espaçamento apertado, texto em terceira pessoa. Você lê o pedido, lê o problema.
E no ponto exato em que o texto diz que foi refeito, a página se refaz: paleta,
tipografia, ritmo e composição trocam de uma vez, e o resto do case continua na
direção certa.

Você não leu sobre um redesenho. Você viu um.

**Por que isto é melhor que a adivinhação:**

- não age sem motivo — o gatilho é o próprio texto chegando naquele parágrafo;
- não é truque genérico: só funciona *neste* case, porque só esta história é
  sobre refazer. Nenhum outro site pode copiar sem ter a mesma história;
- reaproveita a máquina de temperamentos que já existe — é o mesmo mecanismo de
  troca de tokens, apontado para outra coisa;
- é a interação do portfólio que o item 13 já reservava.

**Cuidados:** acontece uma vez, numa página só. Sob `prefers-reduced-motion` a
troca é instantânea em vez de interpolada — e continua fazendo sentido, porque o
que importa é o antes e o depois, não a transição. A versão fria precisa passar
nos mesmos mínimos de contraste da versão final: feia de propósito, ilegível
nunca.

### O segundo momento, menor

O ponto sai do logotipo. Quando ele migra para marcar estado, o logotipo fica
`personalize` — sem o ponto — até ele voltar. É um detalhe que quase ninguém
registra conscientemente, e quem registra sorri. É também o teste da regra: se
existe um ponto só, ele não pode estar em dois lugares.

---

## 10. Voz

Quem escreve sabe muito sobre internet e não precisa provar isso em cada frase.

**Regras:**

- Frase curta pode conviver com parágrafo longo. O ritmo irregular é o que faz
  soar falado.
- Pode haver pausa. Pode haver pensamento que não fecha.
- Humor de observação, e **raro** — no máximo quatro momentos no site inteiro.
  Se tudo é engraçado, nada é.
- Nunca vender. Descrever, e deixar a pessoa concluir.
- Nada de: soluções digitais, presença online, transformação, jornada,
  ecossistema, posicionamento, autoridade, propósito, potencializar, inovação.
- Nada de entusiasmo artificial. Nenhuma exclamação.
- Admitir limite é mais convincente que afirmar competência.

**Amostra de calibragem** (a copy final vem na Fase 3):

| Hoje | Direção |
|---|---|
| "Para quem precisa de um lugar próprio na internet, com currículo, trabalhos e contato." | "Tem gente excelente no que faz mandando um link na bio como se fosse um site." |
| "Eu faço sites que não parecem template." | *(o hero deixa de ser uma frase — ver seção 11)* |
| "Vamos conversar" | "Se você já sabe o que quer, me conta. Se não sabe, também." |
| "Não é agência." | "Sou eu. Isso limita quanta coisa eu pego, e é de propósito." |
| "Nenhum trabalho publicado ainda." | "Ainda não tem nada aqui. Suspeito que você saiba disso melhor que eu." |
| "enviar" | "mandar" |

Três vozes por bloco continuam existindo — isso é o produto. O que muda é que as
três passam a ser distintas de verdade. Hoje `calmo` e `direto` são o mesmo texto
com tamanhos diferentes de frase.

---

## 11. Antes → depois

| # | Elemento | Hoje | Depois |
|---|---|---|---|
| 1 | **Hero** | frase grande + parágrafo + dois botões | a página inteira é a demonstração: a frase ocupa a tela, o seletor está no meio dela (não no canto), e trocar o temperamento reescreve e recompõe o que você está lendo |
| 2 | **Seletor de temperamento** | três pontos de 7px no cabeçalho | peça central do hero, em corpo de leitura, com o ponto migrante marcando o ativo |
| 3 | **Nota de margem** | serifada itálica pequena (o tell de estúdio) | some. A informação que ela carregava vira cota, ou entra no texto |
| 4 | **Divisória** | fio de 1px | cota com marcação e informação em cima |
| 5 | **Lista de serviços** | linhas com título à esquerda e preço à direita | composição editorial: nome, para quem é, preço e prazo em bloco tipográfico, sem alinhamento de tabela |
| 6 | **Case** | cinco capítulos com o mesmo layout e o mesmo rótulo | cada case com composição própria conforme a história. Cantelli abre pelo erro; EDGE abre pela escala; International Freshman abre pelo volume de dados |
| 7 | **Sobre** | processo em terceira pessoa disfarçada | primeira pessoa, com o que deu errado, o que não faz e por que pega pouco projeto |
| 8 | **Contato** | formulário com rótulos corretos | três perguntas escritas como pergunta, e a página diz o que acontece depois |
| 9 | **Ênfase** | não existe | eixo de largura |
| 10 | **Blocos de cor** | não existem | enxofre com sobreimpressão |
| 11 | **Placeholder do case** | traços em ocre sobre cinza | mesmos traços, agora em enxofre com multiply, cruzando o texto |
| 12 | **Estados vazios** | corretos e sem graça | com voz |
| 13 | **Copy hardcoded** | 8 arquivos fora do seu alcance | movida para `site_settings`, editável |
| 14 | **Mobile** | desktop empilhado | composição própria; seletor no rodapé fixo |

---

## 12. Autocrítica: o que estou evitando de propósito

Repito o exercício, agora contra as tendências de 2024–2026 e não só contra a
lista original.

| Tendência | Por que não |
|---|---|
| Fundo claro + serifada editorial gigante + muito branco | é exatamente a versão atual. É o motivo desta revisão |
| Nota de margem em itálico | o eyebrow de CAIXA ALTA vestido melhor. Eliminado |
| Grid "quebrado" aleatoriamente | quebra sem medida lê como bug. A minha é sempre de uma coluna, sempre para o mesmo lado |
| Blend modes como efeito | multiply aqui é regra da paleta, não filtro por cima. As cores emergentes foram calculadas antes |
| Fonte "estranha" como piada visual | Bricolage é irregular por desenho, não por deformação. E o texto é lido numa neutra impecável |
| Scroll-telling, pin, parallax | zero. Três interações no site inteiro |
| Cursor personalizado | não. O ponto migrante marca estado, não substitui o cursor |
| Ruído, grain, textura de papel | seria "humano" fingido. A humanidade vem do texto |
| Modo escuro como prova de sofisticação | não existe. Uma superfície, bem resolvida |
| Números grandes de vaidade | não há métrica para exibir, e inventar seria mentira |

**O que eu ainda posso estar errando.** Duas coisas, e prefiro dizer agora:

1. **A sobreimpressão pode virar maneirismo.** Se o enxofre aparecer em toda
   seção, em três telas vira papel de parede. Regra: no máximo dois blocos por
   página, e nunca dois seguidos.
2. **O ponto migrante pode virar brinquedo.** Se ele se mexer demais, cansa. Ele
   só migra quando você age, e nunca durante a leitura.

---

## 13. Ordem de execução

- **Fase 2 — feita.** Tipografia, paleta, grid e gramática visual aplicados ao
  site inteiro. Funcionalidade preservada: Supabase, RLS, auth, painel, edição
  no lugar, middleware. Nenhuma alteração de schema.

  Os nomes dos tokens e das classes foram mantidos de propósito — `--papel`,
  `--tinta`, `.titulo-3`, `.acao` e companhia continuam existindo, com valores
  novos. O painel e as telas de login consomem essas mesmas classes; trocar o
  vocabulário junto com os valores quebraria tudo isso sem necessidade.

  A página `/amostra` foi removida, como estava previsto.
- **Fase 3** — reescrita completa da copy, incluindo mover para o banco os textos
  hoje presos no código.
- **Fase 4** — responsivo, acessibilidade (contraste nos três temperamentos,
  foco, teclado, `prefers-reduced-motion`), performance.
- **Fase 5** — o teste crítico das sete perguntas, respondido honestamente.

---

## 14. Decidido

- **Momento estranho:** adivinhação de temperamento **cortada**. No lugar, o case
  do Cantelli se refaz durante a leitura (seção 9).
- **Tipografia:** antes de refazer os componentes, sai uma **página de amostra**
  em `/amostra` com a tipografia, a paleta e a sobreimpressão. Aprovação ali
  antes de tocar no resto.
- **Paleta:** ultramar, ameixa e enxofre. As outras duas candidatas continuam
  medíveis em `python3 scripts/estudo-paletas.py`.
