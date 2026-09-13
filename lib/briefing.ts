import "server-only";

import { criarClientePublico } from "@/lib/supabase/publico";

/**
 * O briefing, do lado do servidor.
 *
 * Este arquivo e `server-only` de proposito, e nao por precaucao generica: os
 * pesos do calculo moram nas mesmas linhas das opcoes. Importar isto de um
 * componente de cliente levaria a tabela de precos para dentro do bundle, onde
 * qualquer visitante leria quanto cada funcionalidade custa e quanto a pressa
 * encarece. O `import "server-only"` transforma esse engano em erro de build.
 *
 * O que atravessa para o navegador e `PerguntaPublica`, montada em
 * `perguntasPublicas()`: enunciado, opcoes e rotulos. Nenhum numero.
 */

export type TipoPergunta = "unica" | "multipla";

type OpcaoBruta = {
  id: string;
  ordem: number;
  valor: string;
  rotulo: string;
  base_min: string | number | null;
  base_max: string | number | null;
  dias_min: number | null;
  dias_max: number | null;
  fator: string | number | null;
  fator_dias: string | number | null;
  acrescimo_min: string | number | null;
  acrescimo_max: string | number | null;
  dias_acrescimo: number | null;
  neutra: boolean;
  sem_orcamento: boolean;
  /** O pedaco de frase que esta opcao vira no resumo. Ver 0016. */
  frase: string | null;
};

type PerguntaBruta = {
  id: string;
  chave: string;
  ordem: number;
  enunciado: string;
  ajuda: string | null;
  tipo: TipoPergunta;
  max_escolhas: number | null;
  briefing_opcoes: OpcaoBruta[];
};

/** O que o navegador recebe. Sem um numero sequer. */
export type PerguntaPublica = {
  chave: string;
  enunciado: string;
  ajuda: string | null;
  tipo: TipoPergunta;
  maxEscolhas: number | null;
  opcoes: { valor: string; rotulo: string; neutra: boolean }[];
};

export type Direcao = {
  chave: string;
  rotulo: string;
  palavras: string[];
  cores: string[];
  fonteTitulo: string;
  fonteTexto: string;
  nota: string | null;
};

/** As respostas: escolha unica vira string, multipla vira lista. */
export type Respostas = Record<string, string | string[]>;

export type Resultado = {
  resumo: string;
  /** Nulo quando o tipo escolhido desliga o orcamento ("ainda nao sei"). */
  faixa: { min: number; max: number; texto: string; noTeto: boolean } | null;
  prazo: { min: number; max: number; texto: string } | null;
  /** A linha curta que explica o que mexe no numero. */
  porque: string | null;
  direcao: Direcao | null;
  /*
    De onde vem cada pedaco da faixa, em valores do meio dela.

    Existe para a pagina do cliente poder desenhar a conta em vez de so
    declara-la. Mostra proporcao do orcamento dele — nao a tabela de pesos:
    "area de login pesou 28% do seu projeto" nao diz quanto area de login custa
    em qualquer outro. Ainda assim e a informacao mais sensivel que esta pagina
    publica; se um dia incomodar, e este campo que sai.

    `fatia` vai de 0 a 1, e nao em reais, de proposito. A tela so desenha
    porcentagem, entao mandar o valor absoluto seria exposicao sem uso — e como
    este objeto viaja ate o navegador na resposta da acao, alguem juntando
    alguns briefings reconstruiria a tabela de pesos a partir dos valores.
  */
  composicao: { rotulo: string; fatia: number }[];
  /* O valor da opcao escolhida na pergunta 1. A maquete da amostra visual
     desenha um esqueleto diferente por tipo de site, e precisa saber qual. */
  tipoEscolhido: string | null;
};

/* Um numero pode chegar do driver como string. `null` continua `null`. */
function n(valor: string | number | null): number | null {
  if (valor === null || valor === undefined) return null;
  const numero = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

const SELECAO = `
  id, chave, ordem, enunciado, ajuda, tipo, max_escolhas,
  briefing_opcoes (
    id, ordem, valor, rotulo, base_min, base_max, dias_min, dias_max,
    fator, fator_dias, acrescimo_min, acrescimo_max, dias_acrescimo,
    neutra, sem_orcamento, frase
  )
`;

async function carregarPerguntas(): Promise<PerguntaBruta[]> {
  const supabase = criarClientePublico();
  const { data, error } = await supabase
    .from("briefing_perguntas")
    .select(SELECAO)
    .eq("visivel", true)
    .order("ordem", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as PerguntaBruta[]).map((pergunta) => ({
    ...pergunta,
    briefing_opcoes: [...(pergunta.briefing_opcoes ?? [])].sort((a, b) => a.ordem - b.ordem),
  }));
}

export async function perguntasPublicas(): Promise<PerguntaPublica[]> {
  const perguntas = await carregarPerguntas();

  // A projecao acontece aqui, e nao no componente: e este `map` que garante
  // que peso nenhum atravesse a fronteira.
  return perguntas.map((pergunta) => ({
    chave: pergunta.chave,
    enunciado: pergunta.enunciado,
    ajuda: pergunta.ajuda,
    tipo: pergunta.tipo,
    maxEscolhas: pergunta.max_escolhas,
    opcoes: pergunta.briefing_opcoes.map((opcao) => ({
      valor: opcao.valor,
      rotulo: opcao.rotulo,
      neutra: opcao.neutra,
    })),
  }));
}

async function carregarDirecoes(): Promise<Direcao[]> {
  const supabase = criarClientePublico();
  const { data, error } = await supabase
    .from("briefing_direcoes")
    .select("chave, rotulo, ordem, palavras, cores, fonte_titulo, fonte_texto, nota")
    .eq("visivel", true)
    .order("ordem", { ascending: true });

  if (error || !data) return [];

  return data.map((linha) => ({
    chave: linha.chave as string,
    rotulo: linha.rotulo as string,
    palavras: (linha.palavras as string[]) ?? [],
    cores: (linha.cores as string[]) ?? [],
    fonteTitulo: linha.fonte_titulo as string,
    fonteTexto: linha.fonte_texto as string,
    nota: (linha.nota as string | null) ?? null,
  }));
}

/**
 * Valida as respostas contra o que existe no banco.
 *
 * O 5.2 pede que resposta que nao bate com opcao valida seja rejeitada, e a
 * checagem tem de ser contra o banco e nao contra uma lista no codigo — as
 * opcoes sao editaveis, e uma copia no codigo comecaria a divergir no primeiro
 * ajuste pelo painel.
 */
export async function validarRespostas(
  cruas: unknown,
): Promise<{ ok: true; respostas: Respostas } | { ok: false; erro: string }> {
  if (typeof cruas !== "object" || cruas === null || Array.isArray(cruas)) {
    return { ok: false, erro: "Respostas em formato inesperado." };
  }

  const perguntas = await carregarPerguntas();
  if (perguntas.length === 0) return { ok: false, erro: "O briefing está indisponível agora." };

  const entrada = cruas as Record<string, unknown>;
  const limpas: Respostas = {};

  for (const pergunta of perguntas) {
    const valores = pergunta.briefing_opcoes.map((opcao) => opcao.valor);
    const bruto = entrada[pergunta.chave];

    if (bruto === undefined || bruto === null || bruto === "") continue;

    if (pergunta.tipo === "unica") {
      if (typeof bruto !== "string" || !valores.includes(bruto)) {
        return { ok: false, erro: `Resposta inválida em "${pergunta.enunciado}".` };
      }
      limpas[pergunta.chave] = bruto;
      continue;
    }

    if (!Array.isArray(bruto)) {
      return { ok: false, erro: `Resposta inválida em "${pergunta.enunciado}".` };
    }

    const marcadas = [...new Set(bruto)];
    if (marcadas.some((item) => typeof item !== "string" || !valores.includes(item as string))) {
      return { ok: false, erro: `Resposta inválida em "${pergunta.enunciado}".` };
    }
    if (pergunta.max_escolhas !== null && marcadas.length > pergunta.max_escolhas) {
      return {
        ok: false,
        erro: `Escolha no máximo ${pergunta.max_escolhas} em "${pergunta.enunciado}".`,
      };
    }

    limpas[pergunta.chave] = marcadas as string[];
  }

  return { ok: true, respostas: limpas };
}

/*
  O piso e o teto da faixa, em reais.

  Ficam aqui, e nao no banco junto dos pesos, porque nao sao peso de opcao — sao
  politica do negocio. O piso e "abaixo disso eu nao pego"; o teto e "acima
  disso a calculadora para de se propor a estimar". Os pesos da 0019 ja foram
  calibrados para a conta cair naturalmente dentro desta banda, entao o corte
  quase nunca age: ele existe para o caso extremo, e para o dia em que voce
  editar um peso no painel sem refazer a calibragem inteira.

  A contrapartida de estarem em codigo e que mudar exige deploy, enquanto todo
  o resto do briefing e editavel pelo painel. Se isso incomodar, o lugar certo
  deles e a tabela `site_settings`, que ja existe.
*/
const PISO = 599;
const TETO = 6500;

/* Arredonda para a centena mais proxima, sempre para fora da faixa: o minimo
   desce, o maximo sobe. Faixa que aperta o proprio limite vira promessa. */
function arredondar(valor: number, sentido: "baixo" | "cima"): number {
  const passo = 100;
  return sentido === "baixo"
    ? Math.max(0, Math.floor(valor / passo) * passo)
    : Math.ceil(valor / passo) * passo;
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function emSemanas(dias: number): number {
  return Math.max(1, Math.round(dias / 7));
}

/**
 * O calculo.
 *
 * total = (base x fator_volume + soma_dos_acrescimos) x fator_urgencia
 *
 * Rodado duas vezes, uma para o minimo e outra para o maximo, com os pesos
 * correspondentes. Os dias seguem a mesma forma, com o fator de urgencia
 * comprimindo em vez de multiplicar.
 */
export async function calcular(respostas: Respostas): Promise<Resultado> {
  const perguntas = await carregarPerguntas();
  const porChave = new Map(perguntas.map((pergunta) => [pergunta.chave, pergunta]));

  function escolhidas(chave: string): OpcaoBruta[] {
    const pergunta = porChave.get(chave);
    if (!pergunta) return [];
    const resposta = respostas[chave];
    const lista = Array.isArray(resposta) ? resposta : resposta ? [resposta] : [];
    return pergunta.briefing_opcoes.filter((opcao) => lista.includes(opcao.valor));
  }

  const tipo = escolhidas("tipo")[0] ?? null;
  const paginas = escolhidas("paginas")[0] ?? null;
  const identidade = escolhidas("identidade")[0] ?? null;
  const prazo = escolhidas("prazo")[0] ?? null;
  const funcoes = escolhidas("funcoes").filter((opcao) => !opcao.neutra);
  const clima = escolhidas("clima");

  const direcao = await escolherDirecao(clima.map((opcao) => opcao.valor));
  const resumo = montarResumo({ tipo, paginas, funcoes, identidade, prazo, publico: escolhidas("publico")[0] ?? null });

  // Sem base nao ha conta. E o caso do "ainda nao sei": o 5.2 manda mostrar
  // resumo e dizer que este caso pede conversa antes de qualquer numero.
  if (!tipo || tipo.sem_orcamento || n(tipo.base_min) === null) {
    return {
      resumo,
      faixa: null,
      prazo: null,
      porque: null,
      direcao,
      composicao: [],
      tipoEscolhido: tipo?.valor ?? null,
    };
  }

  const fatorVolume = n(paginas?.fator ?? null) ?? 1;
  const fatorUrgencia = n(prazo?.fator ?? null) ?? 1;
  const fatorDias = n(prazo?.fator_dias ?? null) ?? 1;
  const fatorDiasVolume = n(paginas?.fator_dias ?? null) ?? 1;

  const somaMin =
    funcoes.reduce((total, opcao) => total + (n(opcao.acrescimo_min) ?? 0), 0) +
    (n(identidade?.acrescimo_min ?? null) ?? 0);
  const somaMax =
    funcoes.reduce((total, opcao) => total + (n(opcao.acrescimo_max) ?? 0), 0) +
    (n(identidade?.acrescimo_max ?? null) ?? 0);

  const baseMin = n(tipo.base_min) ?? 0;
  const baseMax = n(tipo.base_max) ?? baseMin;

  /*
    A conta, e depois a banda.

    O arredondamento vem antes do corte de proposito: cortar primeiro e
    arredondar depois levaria o teto de 6.500 para 6.600 na subida, e o numero
    que a pessoa le deixaria de ser o numero que a regra diz.

    `min > max` acontece quando ate o minimo estoura o teto — projeto que
    simplesmente nao cabe nesta calculadora. Ai os dois viram o teto, e o texto
    abaixo vira "R$ 6.500+" sozinho, sem intervalo: fingir uma faixa de
    6.500 a 6.500 seria pior que admitir que aqui a conta acabou.
  */
  let min = arredondar((baseMin * fatorVolume + somaMin) * fatorUrgencia, "baixo");
  let max = arredondar((baseMax * fatorVolume + somaMax) * fatorUrgencia, "cima");

  min = Math.max(PISO, min);
  const noTeto = max >= TETO;
  max = Math.min(TETO, max);
  if (min > max) min = max;

  const diasSomados = funcoes.reduce((total, opcao) => total + (opcao.dias_acrescimo ?? 0), 0) +
    (identidade?.dias_acrescimo ?? 0);
  const diasMin = Math.round(((tipo.dias_min ?? 7) * fatorDiasVolume + diasSomados) * fatorDias);
  const diasMax = Math.round(((tipo.dias_max ?? 21) * fatorDiasVolume + diasSomados) * fatorDias);

  const semanasMin = emSemanas(diasMin);
  const semanasMax = Math.max(semanasMin, emSemanas(diasMax));

  /*
    A composicao, em valores do meio da faixa.

    O meio e nao o maximo porque a barra tem de somar algo que o visitante
    reconheca: o ponto central da faixa que ele acabou de ler. Com os maximos,
    a soma dos pedacos daria um numero que nao aparece em lugar nenhum da tela.

    A urgencia entra como a diferenca que ela provoca, e nao como fator: fator
    nao tem largura. O que ela acrescenta, sim.
  */
  const meio = (a: number | null, b: number | null) => ((a ?? 0) + (b ?? a ?? 0)) / 2;

  const baseMeio = meio(n(tipo.base_min), n(tipo.base_max)) * fatorVolume;
  const pedacos = [
    { rotulo: tipo.rotulo, valor: baseMeio },
    ...funcoes.map((opcao) => ({
      rotulo: opcao.rotulo,
      valor: meio(n(opcao.acrescimo_min), n(opcao.acrescimo_max)),
    })),
  ];

  if (identidade && meio(n(identidade.acrescimo_min), n(identidade.acrescimo_max)) > 0) {
    pedacos.push({
      rotulo: identidade.rotulo,
      valor: meio(n(identidade.acrescimo_min), n(identidade.acrescimo_max)),
    });
  }

  const antesDaUrgencia = pedacos.reduce((soma, pedaco) => soma + pedaco.valor, 0);
  if (fatorUrgencia > 1) {
    pedacos.push({
      rotulo: prazo?.rotulo ?? "Urgência",
      valor: antesDaUrgencia * (fatorUrgencia - 1),
    });
  }

  const somaDosPedacos = pedacos.reduce((soma, pedaco) => soma + pedaco.valor, 0);

  return {
    resumo,
    tipoEscolhido: tipo.valor,
    composicao:
      somaDosPedacos > 0
        ? pedacos
            .filter((pedaco) => pedaco.valor > 0)
            .map((pedaco) => ({ rotulo: pedaco.rotulo, fatia: pedaco.valor / somaDosPedacos }))
        : [],
    faixa: {
      min,
      max,
      noTeto,
      // O "+" e o que impede o teto de ser lido como preco fechado: sem ele,
      // "R$ 3.900 a R$ 6.500" prometeria um limite que a conta nao garante.
      texto: noTeto
        ? min >= max
          ? `${moeda(TETO)}+`
          : `${moeda(min)} a ${moeda(max)}+`
        : `${moeda(min)} a ${moeda(max)}`,
    },
    prazo: {
      min: diasMin,
      max: diasMax,
      texto:
        semanasMin === semanasMax
          ? `${semanasMin} ${semanasMin === 1 ? "semana" : "semanas"}`
          : `${semanasMin} a ${semanasMax} semanas`,
    },
    porque: montarPorque({ funcoes, identidade, prazo, paginas }),
    direcao,
  };
}

async function escolherDirecao(palavras: string[]): Promise<Direcao | null> {
  if (palavras.length === 0) return null;

  const direcoes = await carregarDirecoes();
  if (direcoes.length === 0) return null;

  // Vence quem casa com mais palavras. Empate fica com a primeira da ordem,
  // que ja vem ordenada do banco — assim o desempate e uma decisao sua, e nao
  // o acaso da consulta.
  let melhor = direcoes[0]!;
  let melhorPontos = -1;

  for (const direcao of direcoes) {
    const pontos = palavras.filter((palavra) => direcao.palavras.includes(palavra)).length;
    if (pontos > melhorPontos) {
      melhor = direcao;
      melhorPontos = pontos;
    }
  }

  return melhorPontos > 0 ? melhor : direcoes[0]!;
}

/*
  O resumo em prosa.

  Cada pedaco vem da coluna `frase` da opcao — inclusive o artigo, que e o que
  faz "uma landing page" e "um site de vendas" sairem certos sem o codigo ter de
  adivinhar genero de substantivo. Ver a 0016, que conta como a versao anterior
  produzia "Um landing page de campanha de uma".

  Opcao sem frase cai no rotulo: e melhor sair um pouco duro do que sumir do
  resumo quando alguem criar uma opcao nova pelo painel e esquecer o campo.
*/
function montarResumo(partes: {
  tipo: OpcaoBruta | null;
  paginas: OpcaoBruta | null;
  funcoes: OpcaoBruta[];
  identidade: OpcaoBruta | null;
  prazo: OpcaoBruta | null;
  publico: OpcaoBruta | null;
}): string {
  const { tipo, paginas, funcoes, identidade, prazo, publico } = partes;

  const dizer = (opcao: OpcaoBruta | null) =>
    opcao ? (opcao.frase?.trim() || opcao.rotulo.toLowerCase()) : null;

  const inicio = dizer(tipo) ?? "um projeto ainda em definição";

  const comFuncoes =
    funcoes.length > 0
      ? `com ${listar(funcoes.map((opcao) => opcao.frase?.trim() || opcao.rotulo.toLowerCase()))}`
      : null;

  const pedacos = [dizer(paginas), dizer(publico), comFuncoes, dizer(identidade), dizer(prazo)]
    .filter((pedaco): pedaco is string => Boolean(pedaco));

  const frase = pedacos.length > 0 ? `${inicio} ${pedacos.join(", ")}` : inicio;
  return `${frase.charAt(0).toUpperCase()}${frase.slice(1)}.`.replace(/\s+/g, " ");
}

function listar(itens: string[]): string {
  if (itens.length === 1) return itens[0]!;
  return `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}`;
}

function montarPorque(partes: {
  funcoes: OpcaoBruta[];
  identidade: OpcaoBruta | null;
  prazo: OpcaoBruta | null;
  paginas: OpcaoBruta | null;
}): string {
  const sobem: string[] = [];

  /*
    Nomeia so o que de fato pesou nesta conta. Uma lista generica do que
    "costuma encarecer" nao explica o numero que a pessoa esta olhando.

    Os itens entram soltos, e nao ja juntados por `listar`. Juntar aqui e juntar
    de novo no fim produzia "receber pagamento e agendar horario e criar a
    identidade" — dois "e" seguidos, porque havia uma lista dentro da outra.
  */
  for (const opcao of partes.funcoes) {
    if ((n(opcao.acrescimo_max) ?? 0) >= 900) sobem.push(opcao.rotulo.toLowerCase());
  }
  if (partes.identidade?.valor === "nada" || partes.identidade?.valor === "refazer") {
    sobem.push("criar a identidade");
  }
  if (partes.prazo?.valor === "semana") sobem.push("o prazo curto");
  if (partes.paginas?.valor === "mais-quinze") sobem.push("o número de páginas");

  if (sobem.length === 0) {
    return "O que faz esse número subir é volume de páginas, funcionalidade que guarda dado e pressa. Nada disso pesa aqui.";
  }

  return `O que puxa esse número para cima aqui é ${listar(sobem)}. Menos páginas ou mais prazo derrubam a faixa.`;
}
