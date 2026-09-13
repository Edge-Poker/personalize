import type { ComponentType } from "react";

/**
 * Mesmo padrão de components/texto.tsx e components/imagem.tsx.
 *
 * A rota pública injeta `SemControles`, que não desenha nada e não importa
 * código nenhum de edição. A rota do editor injeta a barra de verdade. Quem
 * monta a página não conhece nenhuma das duas — recebe por prop.
 */
/** Uma seção pertence a exatamente um destes. O banco garante isso num check. */
export type DonoDeSecoes = {
  tipo: "pagina" | "trabalho" | "servico";
  id: string;
};

export type PropsControles = {
  secaoId: string;
  dono: DonoDeSecoes;
  /** Aparece na barra: sem isso não dá para saber qual bloco você vai apagar. */
  tipo: string;
  ordem: number;
  primeiro: boolean;
  ultimo: boolean;
};

export type ComponenteControles = ComponentType<PropsControles>;

export function SemControles() {
  return null;
}

/** Botão de acrescentar bloco no fim, para quando não há nenhum ainda. */
export type PropsAdicionar = { dono: DonoDeSecoes; ordem: number };
export type ComponenteAdicionar = ComponentType<PropsAdicionar>;

export function SemAdicionar() {
  return null;
}
