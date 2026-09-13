import type { Metadata } from "next";
import { buscarAjustes, buscarServicos } from "@/lib/conteudo";
import { linkWhatsapp, mensagemDaPagina } from "@/lib/whatsapp";
import { FormularioContato } from "./formulario";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Me conte o que você precisa. Leio tudo pessoalmente e respondo em até um dia útil.",
};

export default async function Contato() {
  const [ajustes, servicos] = await Promise.all([buscarAjustes(), buscarServicos()]);
  const whatsapp = linkWhatsapp(ajustes.contato.whatsapp, mensagemDaPagina("contato"));
  const instagram = ajustes.contato.instagram
    ? `https://instagram.com/${ajustes.contato.instagram.replace(/^@/, "")}`
    : "";

  return (
    <>
      <section className="grade pt-[var(--e7)] pb-[var(--e5)]">
        <div className="calha">
          <p className="nota">eu leio tudo. não tem equipe, sou eu mesmo.</p>
        </div>
        <div className="mancha">
          <h1 className="titulo-1 medida">Vamos conversar</h1>
          <p className="corpo-g medida mt-[var(--e4)]">
            Não precisa chegar com tudo definido. A maior parte dos projetos começa com
            alguém dizendo mais ou menos o que quer, e a primeira coisa que eu faço é
            perguntar.
          </p>
        </div>
      </section>

      <section className="grade pb-[var(--e6)]">
        <div className="calha">
          {/*
            Os dois atalhos de quem não quer preencher formulário. Aparecem só
            quando existe o dado em /admin/ajustes — botão que leva a lugar
            nenhum é pior que botão que não existe.
          */}
          {whatsapp || instagram ? (
            <>
              <p className="nota">com pressa?</p>
              <div className="mt-[var(--e3)] flex flex-col items-start gap-[var(--e2)]">
                {whatsapp ? (
                  <a
                    href={whatsapp}
                    className="acao"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    chamar no whatsapp
                  </a>
                ) : null}
                {instagram ? (
                  <a
                    href={instagram}
                    className="acao"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ver no instagram
                  </a>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <div className="mancha max-w-[540px]">
          <FormularioContato tipos={servicos.map((servico) => servico.titulo)} />
        </div>
      </section>
    </>
  );
}
