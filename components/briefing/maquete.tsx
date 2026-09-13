/**
 * A maquete da amostra visual.
 *
 * O 5.2 pede "um wireframe simplificado do tipo de site escolhido, renderizado
 * ao vivo". A primeira versao que eu fiz eram quatro barras cinzas de alturas
 * diferentes: nao parecia pagina, era igual para os tres tipos e ignorava a
 * paleta da direcao. Tres motivos para existir, e falhava nos tres.
 *
 * Esta desenha a estrutura que cada tipo de site realmente tem — portfolio e
 * grade de imagem, site de vendas e secoes com chamada, landing e uma coluna so
 * terminando em botao — e pinta tudo com as quatro cores da direcao escolhida.
 * E ai que ela vira amostra: a mesma paleta, aplicada a um layout.
 *
 * SVG e nao divs porque o desenho tem proporcao fixa e precisa encolher inteiro
 * no telefone. Com `viewBox` isso e de graca.
 *
 * Continua sendo esqueleto de proposito: blocos, sem texto nem foto de verdade.
 * Uma miniatura bonita faria a pessoa achar que ja viu a tela dela, e o proprio
 * 5.2 manda deixar escrito que isto e amostra, nao promessa.
 */
/* Componentes de 0 a 255 a partir de "#rrggbb". Cor que nao casa vira cinza
   medio, que nunca sera o mais claro nem o mais escuro da paleta. */
function rgb(hex: string): [number, number, number] {
  const casa = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!casa) return [136, 136, 136];
  const n = parseInt(casa[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* Luminancia percebida. Os pesos sao os da recomendacao de contraste: o olho
   enxerga verde muito mais do que azul, entao a media aritmetica diria que
   #0000ff e #00ff00 tem o mesmo brilho. */
function brilho(hex: string): number {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/* Saturacao no modelo HSL: o quanto a cor se afasta do cinza. E o que separa um
   acento de um neutro, independente de ele ser claro ou escuro. */
function saturacao(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => c / 255) as [number, number, number];
  const alto = Math.max(r, g, b);
  const baixo = Math.min(r, g, b);
  if (alto === baixo) return 0;
  const luz = (alto + baixo) / 2;
  return (alto - baixo) / (luz > 0.5 ? 2 - alto - baixo : alto + baixo);
}

/**
 * Escolhe quem faz o que na paleta.
 *
 * Por luminancia e saturacao, e nao por posicao no array. A primeira versao
 * assumia uma ordem — fundo, acento, claro, apoio — e a direcao "noturno"
 * desmentiu na hora: o terceiro valor dela e um azul-petroleo escuro, entao o
 * cabecalho da maquete saia escuro sobre preto, invisivel.
 *
 * E a ordem nao ia melhorar: as direcoes sao editaveis pelo painel, e esperar
 * que quem cria uma paleta a ordene numa convencao que so existe neste arquivo
 * e esperar um bug. Medir resolve para qualquer paleta, inclusive as claras.
 */
function papeis(cores: string[]) {
  const lista = cores.length > 0 ? cores : ["#111111", "#888888", "#dddddd", "#ffffff"];
  const porBrilho = [...lista].sort((a, b) => brilho(a) - brilho(b));

  const fundo = porBrilho[0]!;
  const claro = porBrilho[porBrilho.length - 1]!;

  // O acento sai do miolo: o mais saturado que nao seja o fundo nem o texto.
  const miolo = porBrilho.slice(1, -1);
  const candidatos = miolo.length > 0 ? miolo : [claro];
  const acento = [...candidatos].sort((a, b) => saturacao(b) - saturacao(a))[0]!;
  const apoio = candidatos.find((cor) => cor !== acento) ?? acento;

  return { fundo, claro, acento, apoio };
}

export function Maquete({ tipo, cores }: { tipo: string | null; cores: string[] }) {
  const { fundo, claro, acento, apoio } = papeis(cores);

  return (
    <svg
      viewBox="0 0 320 208"
      className="briefing-maquete"
      role="img"
      aria-label="Esboço de layout na paleta sugerida"
    >
      <rect width="320" height="208" fill={fundo} />

      {/* O topo e igual nos tres: marca a esquerda, navegacao a direita. E o
          que faz os tres lerem como paginas da mesma familia. */}
      <rect x="18" y="16" width="34" height="7" fill={claro} opacity="0.9" />
      <rect x="240" y="18" width="20" height="4" fill={claro} opacity="0.45" />
      <rect x="266" y="18" width="16" height="4" fill={claro} opacity="0.45" />
      <rect x="288" y="18" width="14" height="4" fill={claro} opacity="0.45" />
      <rect x="18" y="34" width="284" height="1" fill={claro} opacity="0.2" />

      {tipo === "portfolio" ? <Portfolio {...{ acento, claro, apoio }} /> : null}
      {tipo === "vendas" ? <Vendas {...{ acento, claro, apoio }} /> : null}
      {tipo === "landing" ? <Landing {...{ acento, claro, apoio }} /> : null}
      {tipo !== "portfolio" && tipo !== "vendas" && tipo !== "landing" ? (
        <Indefinido {...{ acento, claro }} />
      ) : null}
    </svg>
  );
}

type Tinta = { acento: string; claro: string; apoio: string };

/* Portfolio: o nome grande e a obra ocupando a maior parte da pagina. */
function Portfolio({ acento, claro, apoio }: Tinta) {
  const colunas = [18, 121, 224];
  const linhas = [96, 156];

  return (
    <>
      <rect x="18" y="50" width="120" height="12" fill={claro} />
      <rect x="18" y="68" width="72" height="5" fill={claro} opacity="0.5" />
      <rect x="18" y="82" width="24" height="2" fill={acento} />

      {linhas.map((y) =>
        colunas.map((x, indice) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="78"
            height="46"
            fill={indice === 1 && y === 96 ? acento : apoio}
            opacity={indice === 1 && y === 96 ? 0.85 : 0.6}
          />
        )),
      )}
    </>
  );
}

/* Vendas: chamada, prova em tres blocos, e a faixa de conversao no pe. */
function Vendas({ acento, claro, apoio }: Tinta) {
  return (
    <>
      <rect x="18" y="52" width="150" height="10" fill={claro} />
      <rect x="18" y="68" width="120" height="10" fill={claro} opacity="0.75" />
      <rect x="18" y="88" width="52" height="14" rx="7" fill={acento} />
      <rect x="196" y="50" width="106" height="56" fill={apoio} opacity="0.6" />

      {[18, 116, 214].map((x) => (
        <g key={x}>
          <rect x={x} y="122" width="88" height="40" fill={apoio} opacity="0.35" />
          <rect x={x + 10} y="132" width="30" height="4" fill={claro} opacity="0.7" />
          <rect x={x + 10} y="142" width="58" height="3" fill={claro} opacity="0.35" />
          <rect x={x + 10} y="149" width="46" height="3" fill={claro} opacity="0.35" />
        </g>
      ))}

      <rect x="18" y="176" width="284" height="18" fill={acento} opacity="0.9" />
    </>
  );
}

/* Landing: uma coluna so, centrada, empurrando para um botao. */
function Landing({ acento, claro, apoio }: Tinta) {
  return (
    <>
      <rect x="70" y="56" width="180" height="12" fill={claro} />
      <rect x="94" y="74" width="132" height="12" fill={claro} opacity="0.75" />
      <rect x="110" y="98" width="100" height="5" fill={claro} opacity="0.4" />
      <rect x="128" y="114" width="64" height="16" rx="8" fill={acento} />
      <rect x="18" y="146" width="284" height="34" fill={apoio} opacity="0.55" />
      <rect x="134" y="190" width="52" height="4" fill={claro} opacity="0.3" />
    </>
  );
}

/* "Ainda nao sei": nao ha tipo para desenhar, e inventar um seria escolher pela
   pessoa. Fica a pagina em branco com o cursor — o projeto ainda por definir. */
function Indefinido({ acento, claro }: Omit<Tinta, "apoio">) {
  return (
    <>
      <rect x="18" y="56" width="110" height="9" fill={claro} opacity="0.35" />
      <rect x="18" y="72" width="74" height="9" fill={claro} opacity="0.22" />
      <rect x="18" y="96" width="2" height="16" fill={acento} />
      <rect x="18" y="132" width="284" height="1" fill={claro} opacity="0.15" />
      <rect x="18" y="156" width="284" height="1" fill={claro} opacity="0.1" />
      <rect x="18" y="180" width="284" height="1" fill={claro} opacity="0.06" />
    </>
  );
}
