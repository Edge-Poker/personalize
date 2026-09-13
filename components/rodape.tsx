import { buscarAjustes } from "@/lib/conteudo";
import { linkWhatsapp, mensagemDaPagina } from "@/lib/whatsapp";
import Link from "next/link";
import { Marca } from "@/components/marca";

export async function Rodape() {
  const { marca, contato } = await buscarAjustes();
  const whatsapp = linkWhatsapp(contato.whatsapp, mensagemDaPagina());

  const contatos = [
    contato.email ? { rotulo: contato.email, href: `mailto:${contato.email}` } : null,
    whatsapp ? { rotulo: "whatsapp", href: whatsapp } : null,
    contato.instagram
      ? {
          rotulo: "instagram",
          href: `https://instagram.com/${contato.instagram.replace(/^@/, "")}`,
        }
      : null,
  ].filter((item) => item !== null);

  return (
    <footer className="fx-fade mt-[var(--e9)] border-t border-[var(--linha)]">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-baseline justify-between gap-[var(--e4)] px-[var(--e5)] py-[var(--e6)] max-[720px]:px-[var(--e4)]">
        <p className="titulo-4">
          <Link href="/" className="marca">
            <Marca />
          </Link>
        </p>

        {contatos.length > 0 ? (
          <ul className="flex flex-wrap gap-x-[var(--e5)] gap-y-1">
            {contatos.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="enlace corpo-p">
                  {item.rotulo}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="nota">{marca.descricao}</p>
        )}
      </div>
    </footer>
  );
}
