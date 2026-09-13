import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /*
    Um build de medição não pode escrever na mesma pasta que o `next dev` está
    servindo. Já aconteceu: rodei `next build` com o dev aberto, os dois
    escreveram em .next ao mesmo tempo e o site ficou sem CSS até o dev ser
    reiniciado — parecia bug de estilo e era colisão de pasta.

    Com isto, `PASTA_BUILD=.next-medida npm run build` mede os pacotes sem
    encostar no que está no ar.
  */
  distDir: process.env.PASTA_BUILD ?? ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  typedRoutes: true,
  async redirects() {
    return [
      {
        /*
          O caso do Bernardo nasceu com o slug errado — o nome no endereço era
          o do irmão errado, e o conteúdo era de um site de consultório que não
          tinha nada a ver. O texto foi corrigido no banco e o slug virou
          `bernardo-cantelli`; isto aqui é só para o endereço antigo não morrer
          em 404 caso ele tenha sido mandado para alguém.

          Permanente: o endereço antigo não vai voltar a existir, e é isso que
          diz para buscador transferir o que ele tinha para o novo.
        */
        source: "/trabalhos/eduardo-cantelli",
        destination: "/trabalhos/bernardo-cantelli",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Propostas sao privadas por link. Nunca devem entrar em indice nem em cache compartilhado.
        source: "/proposta/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
