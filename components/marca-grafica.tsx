/**
 * Placeholder para trabalho que ainda nao tem imagem.
 *
 * Nao e foto de banco de imagens nem retangulo cinza: sao tracos de espessura
 * variavel, desenhados como caneta e nao como stroke uniforme, que e o que o
 * DESIGN.md pede da parte organica da identidade.
 *
 * O desenho e derivado do slug, entao cada trabalho tem sempre o mesmo traco,
 * e dois trabalhos nunca tem o mesmo. Determinismo importa: sem ele o
 * placeholder mudaria a cada build e o servidor renderizaria diferente do
 * cliente.
 */

/** Hash estavel (FNV-1a). Nao precisa ser criptografico, precisa ser igual sempre. */
function semente(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function geradorDeNumeros(inicial: number) {
  let estado = inicial || 1;
  return () => {
    estado ^= estado << 13;
    estado ^= estado >>> 17;
    estado ^= estado << 5;
    estado >>>= 0;
    return estado / 0xffffffff;
  };
}

const LARGURA = 800;
const ALTURA = 500;
const SEGMENTOS = 14;

export function MarcaGrafica({
  chave,
  className = "",
}: {
  chave: string;
  className?: string;
}) {
  const proximo = geradorDeNumeros(semente(chave));
  const tracos = 3 + Math.floor(proximo() * 3); // 3 a 5

  const caminhos: { d: string; espessura: number }[] = [];

  for (let t = 0; t < tracos; t += 1) {
    const x0 = 0.08 + proximo() * 0.2;
    const y0 = 0.15 + proximo() * 0.6;
    const x1 = 0.6 + proximo() * 0.32;
    const y1 = 0.15 + proximo() * 0.6;
    const curvatura = (proximo() - 0.5) * 0.75;
    const espessuraMax = 3 + proximo() * 16;

    // Cada traco vira varios segmentos curtos com espessura crescente e depois
    // decrescente. E isso que da o afinar das pontas, como caneta levantando
    // do papel.
    for (let s = 0; s < SEGMENTOS; s += 1) {
      const a = s / SEGMENTOS;
      const b = (s + 1) / SEGMENTOS;

      const ponto = (u: number) => {
        const x = x0 + (x1 - x0) * u;
        const y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * curvatura;
        return [x * LARGURA, y * ALTURA] as const;
      };

      const [ax, ay] = ponto(a);
      const [bx, by] = ponto(b);
      const meio = (a + b) / 2;

      caminhos.push({
        d: `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`,
        espessura: Math.max(1, Math.sin(meio * Math.PI) * espessuraMax),
      });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      className={className}
      role="img"
      aria-label="Marca gráfica gerada para este trabalho, no lugar de uma imagem"
      style={{ background: "var(--bloco)" }}
    >
      <g stroke="var(--acento)" strokeLinecap="round" fill="none">
        {caminhos.map((caminho, i) => (
          <path key={i} d={caminho.d} strokeWidth={caminho.espessura.toFixed(2)} />
        ))}
      </g>
    </svg>
  );
}
