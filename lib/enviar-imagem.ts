import { criarClienteNavegador } from "@/lib/supabase/client";
import { registrarMidia, type MidiaRegistrada } from "@/app/admin/midia/acoes";

/** Nenhuma tela precisa de mais que isto, e acima disso o arquivo pesa à toa. */
const LARGURA_MAXIMA = 2000;

/**
 * Converte, reduz e sobe uma imagem — tudo no navegador, antes de tocar no
 * Storage.
 *
 * Vive fora dos componentes porque agora dois lugares fazem isso: a mediateca
 * do painel, com recorte, e a troca de imagem no meio da página, sem recorte.
 * Ter duas cópias garantiria que uma delas parasse de converter para WebP num
 * refactor futuro e ninguém percebesse até a conta do Storage crescer.
 */
export async function enviarImagem(
  arquivo: File,
  alt: string,
): Promise<{ ok: true; item: MidiaRegistrada } | { ok: false; erro: string }> {
  if (!arquivo.type.startsWith("image/")) {
    return { ok: false, erro: "Isso não é uma imagem. Envie png, jpg ou webp." };
  }

  if (alt.trim().length === 0) {
    return { ok: false, erro: "Descreva a imagem antes de enviar." };
  }

  try {
    const bitmap = await createImageBitmap(arquivo);
    const reducao = Math.min(1, LARGURA_MAXIMA / bitmap.width);
    const largura = Math.max(1, Math.round(bitmap.width * reducao));
    const altura = Math.max(1, Math.round(bitmap.height * reducao));

    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;

    const contexto = tela.getContext("2d");
    if (!contexto) return { ok: false, erro: "Este navegador não deixou desenhar a imagem." };

    contexto.imageSmoothingQuality = "high";
    contexto.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close();

    /*
      WebP e não AVIF: canvas.toBlob não codifica AVIF em navegador nenhum
      hoje. A conversão para AVIF acontece depois, no next/image, que serve o
      formato que o navegador de quem visita aceita.
    */
    const blob = await new Promise<Blob | null>((resolver) =>
      tela.toBlob(resolver, "image/webp", 0.85),
    );

    if (!blob) return { ok: false, erro: "Não consegui converter a imagem." };

    const supabase = criarClienteNavegador();
    const caminho = `${new Date().getFullYear()}/${crypto.randomUUID()}.webp`;

    const { error } = await supabase.storage
      .from("midia")
      .upload(caminho, blob, { contentType: "image/webp", upsert: false });

    if (error) return { ok: false, erro: error.message };

    return await registrarMidia({
      path: caminho,
      alt: alt.trim(),
      largura,
      altura,
      bytes: blob.size,
    });
  } catch (erro) {
    return {
      ok: false,
      erro: erro instanceof Error ? erro.message : "Não consegui enviar a imagem.",
    };
  }
}
