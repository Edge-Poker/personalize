import { EB_Garamond, Source_Serif_4 } from "next/font/google";

/**
 * Garamond. Old-style: contraste moderado, transição diagonal, haste que nunca
 * chega a sumir.
 *
 * Substituiu a Bodoni Moda depois da amostra. Didone tem filete de meio pixel
 * por definição, e sobre fundo escuro a irradiação come esse filete — não era
 * ajuste de peso, era a família errada para fundo preto.
 *
 * O itálico é caligráfico de verdade, com desenho próprio, e não a romana
 * inclinada por software. É ele que dá à ênfase (.enfase) uma textura
 * própria sem afinar nada.
 */
export const fonteDisplay = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--fonte-display",
});

/**
 * Texto. Serifada sóbria, de contraste baixo, desenhada para tela.
 *
 * A Garamond é linda e cansativa em corpo de leitura longo. Esta faz o
 * trabalho pesado e deixa a Garamond fazer o efeito.
 */
export const fonteTexto = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--fonte-texto",
});
