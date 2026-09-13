/**
 * O ponto é o indicador de estado do site, não pontuação.
 *
 * Existe um só. Quando ele migra para marcar a posição na navegação, este aqui
 * fica invisível — `visibility` e não `display`, para o logotipo não encolher
 * no meio da troca. O logotipo incompleto é o teste da regra.
 *
 * Sem aria-hidden: a marca é `persona.lize`, com ponto, e leitor de tela não
 * pronuncia ponto no meio de palavra.
 */
export function Marca({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      persona<span className="ponto ponto-marca">.</span>lize
    </span>
  );
}
