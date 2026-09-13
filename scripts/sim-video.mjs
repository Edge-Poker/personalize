/*
  Simula "sair e voltar do navegador" com a aba indo para segundo plano no meio
  da dissolucao. Roda a logica ANTIGA e a NOVA no mesmo cenario.

  O que se modela do iOS, que e a parte que importa:
    - em segundo plano, a promessa de play() fica PENDENTE para sempre;
    - o relogio dos temporizadores congela junto.

  Sucesso = depois de voltar, a copia visivel esta tocando.
*/

const FUSAO = 1.6;
const LIMITE_TROCA = FUSAO * 1000 + 2500;

let agora = 0;
let emSegundoPlano = false;
const pendentes = [];

function esperar(ms) {
  return new Promise((r) => pendentes.push({ quando: agora + ms, r }));
}
function avancar(ms) {
  agora += ms;
  if (emSegundoPlano) return Promise.resolve(); // temporizadores congelados
  const prontos = pendentes.filter((t) => t.quando <= agora);
  for (const t of prontos) {
    pendentes.splice(pendentes.indexOf(t), 1);
    t.r();
  }
  return Promise.resolve();
}

function criarVideo(nome) {
  return {
    nome,
    paused: true,
    currentTime: 0,
    opacity: 0,
    play() {
      // Em segundo plano o iOS nao resolve nem rejeita: fica pendente.
      if (emSegundoPlano) return new Promise(() => {});
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
  };
}

function montar(versao) {
  const um = criarVideo("um");
  const dois = criarVideo("dois");
  const filmes = [um, dois];
  const est = { visivel: 0, trocando: false, trocaEm: 0, geracao: 0 };

  um.paused = false;
  um.opacity = 1;

  async function trocar(minha) {
    const valido = () => (versao === "novo" ? est.geracao === minha : true);
    const saindo = filmes[est.visivel];
    const entrando = filmes[1 - est.visivel];
    entrando.currentTime = 0;
    try {
      await entrando.play();
    } catch {
      return;
    }
    if (!valido()) return;
    entrando.opacity = 1;
    saindo.opacity = 0;
    est.visivel = 1 - est.visivel;
    await esperar(FUSAO * 1000);
    if (!valido()) return;
    saindo.pause();
    saindo.currentTime = 0;
  }

  function vigiar() {
    if (est.trocando) return;
    const minha = (est.geracao += 1);
    est.trocando = true;
    est.trocaEm = agora;
    void trocar(minha).finally(() => {
      if (versao === "novo") {
        if (est.geracao === minha) est.trocando = false;
      } else {
        est.trocando = false;
      }
    });
  }

  function tentar() {
    if (est.trocando) {
      if (versao === "antigo") return;
      if (agora - est.trocaEm < LIMITE_TROCA) return;
      est.geracao += 1;
      est.trocando = false;
    }
    const atual = filmes[est.visivel];
    const outra = filmes[1 - est.visivel];
    if (atual.paused) {
      atual.opacity = 1;
      if (outra !== atual) {
        outra.opacity = 0;
        if (!outra.paused) outra.pause();
      }
      void atual.play().catch(() => {});
    }
  }

  function aoMudarVisibilidade() {
    if (!emSegundoPlano) {
      tentar();
      return;
    }
    if (versao === "novo") {
      est.geracao += 1;
      est.trocando = false;
    }
  }

  return { filmes, est, vigiar, tentar, aoMudarVisibilidade };
}

async function cenario(versao) {
  agora = 0;
  emSegundoPlano = false;
  pendentes.length = 0;

  const m = montar(versao);

  // 1. video rodando; chega perto do fim e comeca a dissolucao
  m.vigiar();
  await avancar(100);

  // 2. o visitante troca de app BEM no meio da dissolucao
  emSegundoPlano = true;
  m.aoMudarVisibilidade();
  // O iOS pausa os elementos ao sair de cena.
  for (const f of m.filmes) f.pause();
  await avancar(30000); // trinta segundos fora

  // 3. volta
  emSegundoPlano = false;
  m.aoMudarVisibilidade();
  await avancar(50);

  // 4. e ainda toca a tela, que e o que qualquer um faria
  m.tentar();
  await avancar(50);

  const visivel = m.filmes[m.est.visivel];
  return {
    versao,
    trancaPresa: m.est.trocando,
    visivel: visivel.nome,
    tocando: !visivel.paused,
  };
}

/*
  O caso pior: a troca comeca com a aba JA em segundo plano. Ai quem fica
  pendente e a promessa do play(), que nao volta nem quando a aba volta —
  nenhum temporizador vai destravar essa tranca.
*/
async function cenarioPlayPendente(versao) {
  agora = 0;
  emSegundoPlano = false;
  pendentes.length = 0;

  const m = montar(versao);

  // A aba sai de cena, e so entao o timeupdate atrasado dispara a troca.
  emSegundoPlano = true;
  m.aoMudarVisibilidade();
  for (const f of m.filmes) f.pause();
  m.vigiar(); // play() aqui fica pendente para sempre
  await avancar(30000);

  emSegundoPlano = false;
  m.aoMudarVisibilidade();
  await avancar(50);
  m.tentar(); // o visitante toca a tela
  await avancar(50);

  const visivel = m.filmes[m.est.visivel];
  return { versao, trancaPresa: m.est.trocando, visivel: visivel.nome, tocando: !visivel.paused };
}

console.log("cenario 1 — sai no meio da dissolucao:");
for (const v of ["antigo", "novo"]) {
  const r = await cenario(v);
  console.log(
    `  ${r.versao.padEnd(7)} tranca_presa=${String(r.trancaPresa).padEnd(5)} ` +
      `visivel=${r.visivel.padEnd(4)} tocando=${String(r.tocando).padEnd(5)} ` +
      `${r.tocando ? "OK" : "FALHOU — video pausado"}`,
  );
}

console.log("\ncenario 2 — troca comeca com a aba fora (play pendente):");
for (const v of ["antigo", "novo"]) {
  const r = await cenarioPlayPendente(v);
  console.log(
    `  ${r.versao.padEnd(7)} tranca_presa=${String(r.trancaPresa).padEnd(5)} ` +
      `visivel=${r.visivel.padEnd(4)} tocando=${String(r.tocando).padEnd(5)} ` +
      `${r.tocando ? "OK" : "FALHOU — video pausado"}`,
  );
}
