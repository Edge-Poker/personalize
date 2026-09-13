#!/usr/bin/env node
/**
 * Cria a conta admin e coloca ela na tabela `admins`.
 *
 * Existe porque nao existe cadastro publico no site: nenhuma rota cria conta,
 * e a tabela admins nao tem policy de insert. A unica porta e esta, rodando
 * na sua maquina com a service_role.
 *
 *   npm run criar-admin
 *
 * Le ADMIN_EMAIL do .env.local e pergunta a senha sem mostrar na tela.
 * Se ja existir admin, recusa - o site e de uma conta so. Para trocar a senha
 * de uma conta que ja existe, rode com --forcar.
 */

import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Sem .env.local: seguimos com o que estiver no ambiente.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const forcar = process.argv.includes("--forcar");

const faltando = [
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceRole],
  ["ADMIN_EMAIL", email],
]
  .filter(([, valor]) => !valor)
  .map(([nome]) => nome);

if (faltando.length > 0) {
  console.error(`Faltam variaveis: ${faltando.join(", ")}`);
  console.error("Copie .env.example para .env.local e preencha antes de rodar.");
  process.exit(1);
}

function perguntarSenha(rotulo) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error("Sem terminal interativo. Rode este script direto no terminal."));
      return;
    }
    stdout.write(rotulo);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const ENTER = ["\r", "\n", "\u0004"];
    const CTRL_C = "\u0003";
    const APAGAR = ["\u007f", "\b"];

    let senha = "";
    const aoDigitar = (tecla) => {
      if (ENTER.includes(tecla)) {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", aoDigitar);
        stdout.write("\n");
        resolve(senha);
        return;
      }
      if (tecla === CTRL_C) {
        stdin.setRawMode(false);
        stdout.write("\n");
        process.exit(130);
      }
      if (APAGAR.includes(tecla)) {
        senha = senha.slice(0, -1);
        return;
      }
      senha += tecla;
    };

    stdin.on("data", aoDigitar);
  });
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count: quantosAdmins, error: erroContagem } = await supabase
  .from("admins")
  .select("*", { count: "exact", head: true });

if (erroContagem) {
  console.error(`Nao consegui ler a tabela admins: ${erroContagem.message}`);
  console.error("As migrations ja foram aplicadas?");
  process.exit(1);
}

if (quantosAdmins > 0 && !forcar) {
  console.error(`Ja existe ${quantosAdmins} admin cadastrado. Este site e de uma conta so.`);
  console.error("Para redefinir a senha da conta existente, rode: npm run criar-admin -- --forcar");
  process.exit(1);
}

const senha = await perguntarSenha(`Senha para ${email}: `);

if (senha.length < 12) {
  console.error("Use pelo menos 12 caracteres. Essa senha e a chave do site inteiro.");
  process.exit(1);
}

// Cria a conta ja confirmada: nao ha caixa de entrada para clicar em link aqui.
let userId = null;
const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
  email,
  password: senha,
  email_confirm: true,
});

if (criado?.user) {
  userId = criado.user.id;
  console.log("Conta criada.");
} else {
  const jaExiste =
    erroCriar &&
    (erroCriar.status === 422 || /already|registered|exists/i.test(erroCriar.message));

  if (!jaExiste) {
    console.error(`Nao consegui criar a conta: ${erroCriar?.message ?? "erro desconhecido"}`);
    process.exit(1);
  }

  const { data: lista, error: erroLista } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (erroLista) {
    console.error(`A conta ja existe, mas nao consegui encontrar: ${erroLista.message}`);
    process.exit(1);
  }

  const existente = lista.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!existente) {
    console.error("A conta ja existe mas nao apareceu na listagem. Confira no painel do Supabase.");
    process.exit(1);
  }

  userId = existente.id;

  const { error: erroSenha } = await supabase.auth.admin.updateUserById(userId, {
    password: senha,
    email_confirm: true,
  });

  if (erroSenha) {
    console.error(`Nao consegui atualizar a senha: ${erroSenha.message}`);
    process.exit(1);
  }

  console.log("Conta ja existia. Senha atualizada.");
}

const { error: erroAdmin } = await supabase
  .from("admins")
  .upsert({ user_id: userId }, { onConflict: "user_id" });

if (erroAdmin) {
  console.error(`Conta criada, mas nao entrou em admins: ${erroAdmin.message}`);
  process.exit(1);
}

console.log(`Pronto. ${email} agora entra em /entrar e acessa /admin.`);
