import { exigirAdmin } from "@/lib/admin";
import { buscarAjustes } from "@/lib/conteudo";
import { FormularioAjustes } from "./formulario";

export default async function Ajustes() {
  await exigirAdmin();
  const ajustes = await buscarAjustes();

  return (
    <div>
      <h1 className="titulo-2">Ajustes</h1>
      <p className="corpo medida mt-[var(--e3)]">
        Marca, contatos e SEO padrão. Estes campos aparecem no cabeçalho, no rodapé e nos
        metadados de todas as páginas.
      </p>
      <FormularioAjustes ajustes={ajustes} />
    </div>
  );
}
