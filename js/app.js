import { loadProfile } from "./profile.js";

async function start() {
  try {
    console.log("IdentityHub Pro iniciado.");

    const profile = await loadProfile();

    console.log("Perfil carregado:", profile);
  } catch (error) {
    console.error("Falha ao iniciar o IdentityHub Pro:", error);
  }
}

start();