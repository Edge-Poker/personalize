import { Animar } from "@/components/animar";
import { Cabecalho } from "@/components/cabecalho";
import { Rodape } from "@/components/rodape";

/**
 * O site publico le tudo pelo cliente sem cookie (lib/supabase/publico.ts),
 * entao estas paginas sao geradas e cacheadas em vez de renderizadas por
 * visitante. Uma hora e um meio-termo razoavel: edicao no painel aparece
 * sozinha em ate 60 minutos, e da para forcar antes com revalidatePath quando
 * a etapa 4 existir.
 */
export const revalidate = 3600;

export default function LayoutDoSite({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#conteudo" className="pular-para-conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo">{children}</main>
      <Rodape />
      <Animar />
    </>
  );
}
