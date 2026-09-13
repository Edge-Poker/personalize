"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * O motor das animacoes.
 *
 * Um observador so para a pagina inteira, montado no layout do site. Ele faz
 * tres coisas:
 *
 * 1. Escreve `data-fx` no <html>. Todo estado inicial escondido (.fx-up e
 *    companhia) mora dentro de `[data-fx]`, entao quem chega sem JavaScript
 *    nunca ve conteudo invisivel esperando um observador que nao vem. Esse e o
 *    erro classico dessas bibliotecas: a pagina fica em branco no leitor de
 *    texto, no buscador e em qualquer navegador onde o script falhou.
 *
 * 2. Poe a classe `run` no elemento quando ele entra na tela, e para de
 *    observa-lo. Animacao de entrada roda uma vez; reanimar ao rolar para cima
 *    e o tique que faz a pagina parecer inquieta.
 *
 * 3. Cuida das que dependem do cursor — inclinar, ima, onda no clique — por
 *    delegacao, num listener so no documento em vez de um por elemento. Todo
 *    `.acao` e `.pilula` entra nessa lista sem precisar de classe: se e botao,
 *    responde ao cursor.
 */

const ENTRADAS = [
  ".fx-fade",
  ".fx-up",
  ".fx-pop",
  ".fx-blur",
  ".fx-slide-l",
  ".fx-slide-r",
  ".fx-stagger",
  ".fx-curtain",
  ".fx-draw",
].join(",");

export function Animar() {
  const caminho = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.dataset.fx = "1";

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("run");
          observador.unobserve(entrada.target);
        }
      },
      /*
        threshold 0 com a borda de baixo puxada para dentro: o gatilho e "a
        borda de cima do elemento cruzou 92% da altura da tela".

        A versao obvia — exigir 12% do elemento visivel — tem um buraco: secao
        mais alta que a janela nunca atinge a fracao. Um bloco de 10000px numa
        tela de 800px chega no maximo a 8% e ficaria invisivel para sempre.
        Medir pela borda nao depende da altura de nada.
      */
      { threshold: 0, rootMargin: "0px 0px -8% 0px" },
    );

    for (const alvo of document.querySelectorAll(ENTRADAS)) observador.observe(alvo);

    return () => observador.disconnect();
    // Reexecuta a cada navegacao: o layout nao remonta entre rotas, entao sem
    // isto so a primeira pagina visitada teria animacao.
  }, [caminho]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function aoMover(evento: PointerEvent) {
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;

      const inclinavel = alvo.closest<HTMLElement>(".fx-tilt");
      if (inclinavel) {
        const caixa = inclinavel.getBoundingClientRect();
        const x = (evento.clientX - caixa.left) / caixa.width - 0.5;
        const y = (evento.clientY - caixa.top) / caixa.height - 0.5;
        inclinavel.style.transform =
          `perspective(900px) rotateY(${(x * 12).toFixed(2)}deg) rotateX(${(-y * 12).toFixed(2)}deg)`;
      }

      const imantado = alvo.closest<HTMLElement>(".fx-magnet, .acao, .pilula");
      if (imantado) {
        const caixa = imantado.getBoundingClientRect();
        const x = evento.clientX - caixa.left - caixa.width / 2;
        const y = evento.clientY - caixa.top - caixa.height / 2;
        // Metade da amplitude de antes. O ímã tem que ser percebido depois de
        // notado, e não antes — se o botão anda mais que o cursor, vira brinquedo.
        imantado.style.transform = `translate(${(x * 0.1).toFixed(1)}px, ${(y * 0.14).toFixed(1)}px)`;
      }
    }

    function aoSair(evento: PointerEvent) {
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;
      const solto = alvo.closest<HTMLElement>(".fx-tilt, .fx-magnet, .acao, .pilula");
      if (solto) solto.style.transform = "";
    }

    function aoClicar(evento: MouseEvent) {
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;
      const molhado = alvo.closest<HTMLElement>(".fx-ripple, .acao, .pilula");
      if (!molhado) return;

      const caixa = molhado.getBoundingClientRect();
      const lado = Math.max(caixa.width, caixa.height) * 2;
      const onda = document.createElement("span");
      onda.className = "onda";
      onda.style.width = `${lado}px`;
      onda.style.height = `${lado}px`;
      onda.style.left = `${evento.clientX - caixa.left}px`;
      onda.style.top = `${evento.clientY - caixa.top}px`;
      molhado.appendChild(onda);
      onda.addEventListener("animationend", () => onda.remove(), { once: true });
    }

    document.addEventListener("pointermove", aoMover, { passive: true });
    document.addEventListener("pointerout", aoSair, { passive: true });
    document.addEventListener("click", aoClicar);
    return () => {
      document.removeEventListener("pointermove", aoMover);
      document.removeEventListener("pointerout", aoSair);
      document.removeEventListener("click", aoClicar);
    };
  }, []);

  return null;
}
