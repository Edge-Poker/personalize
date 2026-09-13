"use client";

import Link from "next/link";

/**
 * A tela que aparece quando uma gravação do painel falha.
 *
 * Existe porque a alternativa era o que estava acontecendo: a ação recusava a
 * gravação, a página recarregava com os valores antigos e nada era dito. Você
 * desmarcava "visível", salvava, e continuava visível — parecendo bug de
 * permissão quando era só silêncio.
 */
export default function ErroDoPainel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-[620px]">
      <h1 className="titulo-2">Não deu certo</h1>
      <p role="alert" className="corpo medida mt-[var(--e4)]">
        {error.message}
      </p>
      <p className="corpo medida mt-[var(--e3)]">
        Nada foi gravado. O que você tinha digitado se perdeu nesta tela — vale conferir
        antes de tentar de novo.
      </p>
      <div className="mt-[var(--e5)] flex flex-wrap gap-[var(--e3)]">
        <button type="button" onClick={reset} className="acao acao-forte">
          tentar de novo
        </button>
        <Link href="/admin" className="acao">
          voltar ao painel
        </Link>
      </div>
    </div>
  );
}
