import Link from "next/link";
import { buscarNav } from "@/lib/conteudo";
import { BarraRecolhivel } from "@/components/barra-recolhivel";
import { LinkInterno } from "@/components/link-interno";
import { Marca } from "@/components/marca";

export async function Cabecalho() {
  const itens = await buscarNav();

  return (
    <header className="cabecalho">
      <div className="cabecalho-interno">
        {/*
          A marca fica fora do que recolhe. Ela e o link para a home e a
          assinatura do site: sumir com ela para ganhar altura seria economizar
          na parte que nao pesa.
        */}
        <Link href="/" className="marca titulo-4">
          <Marca />
        </Link>

        <BarraRecolhivel>
          <nav aria-label="Navegação principal">
            <ul className="fx-stagger flex flex-wrap items-center gap-x-[var(--e4)] gap-y-1">
              {itens.map((item) => (
                <li key={item.id}>
                  <LinkInterno href={item.href} className="aba corpo-p">
                    {item.rotulo}
                  </LinkInterno>
                </li>
              ))}
            </ul>
          </nav>
        </BarraRecolhivel>
      </div>
    </header>
  );
}
