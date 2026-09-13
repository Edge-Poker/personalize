import type { ComponentType } from "react";
import NextImage from "next/image";
import type { TabelaComRascunho } from "@/lib/rascunhos";
import { urlDaMidia } from "@/lib/midia";
import { MarcaGrafica } from "@/components/marca-grafica";

/**
 * Mesmo truque de components/texto.tsx, agora para imagem.
 *
 * A rota pública injeta `ImagemSimples`, que só desenha. A rota do editor
 * injeta `ImagemEditavel`, que é client component e abre a mediateca ao
 * clicar. Como quem monta a página recebe o componente por prop, o grafo de
 * módulos da rota pública nunca encosta no editor.
 */
export type PropsImagem = {
  tabela: TabelaComRascunho;
  registroId: string;
  /** Coluna que guarda o caminho no Storage. Ex.: "capa_path". */
  caminho: string;
  /**
   * Coluna que guarda a descrição. Ex.: "capa_alt".
   *
   * A descrição viaja junto com a imagem: trocar a foto sem trocar o alt
   * deixaria o site descrevendo a imagem errada para quem não enxerga — pior
   * do que não ter descrição.
   */
  caminhoAlt: string;
  /** Caminho atual no Storage, ou null quando ainda não há imagem. */
  path: string | null;
  alt: string;
  /** Semente do traço gerado que entra no lugar quando não há imagem. */
  reserva: string;
  className?: string;
};

export type ComponenteImagem = ComponentType<PropsImagem>;

/**
 * Sem imagem, entra o traço gerado a partir do slug — nunca um retângulo cinza
 * nem foto de banco de imagens. O placeholder é autoral e estável: o mesmo
 * trabalho tem sempre o mesmo traço.
 */
export function ImagemSimples({ path, alt, reserva, className = "" }: PropsImagem) {
  if (!path) {
    return <MarcaGrafica chave={reserva} className={className} />;
  }

  return (
    <NextImage
      src={urlDaMidia(path)}
      alt={alt}
      width={1600}
      height={1000}
      className={className}
      sizes="(max-width: 760px) 100vw, 70vw"
    />
  );
}
