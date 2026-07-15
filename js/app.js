import { loadProfile } from "./profile.js";
import { renderContactActions } from "./actions.js";
import { renderQRCode } from "./qr.js";
import { downloadVCard } from "./vcard.js";
import { shareProfile } from "./share.js";
import { showToast } from "./toast.js";
import { registerServiceWorker } from "./pwa.js";

function renderProfile(profile) {
  const nameElement = document.querySelector("#profile-name");
  const taglineElement = document.querySelector("#profile-tagline");
  const jobElement = document.querySelector("#profile-job");
  const locationElement = document.querySelector("#profile-location");
  const avatarElement = document.querySelector("#profile-avatar");

  nameElement.textContent = profile.name;
  taglineElement.textContent = profile.tagline;
  jobElement.textContent = profile.job;
  locationElement.textContent = profile.location;

  avatarElement.alt = `Fotografia de perfil de ${profile.name}`;

  document.title = `${profile.name} | IdentityHub Pro`;
}

function vibrate(duration = 20) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

function setupProfileButtons(profile) {
  const saveButton = document.querySelector(
    "#save-contact-button"
  );

  const shareButton = document.querySelector(
    "#share-button"
  );

  saveButton.addEventListener("click", () => {
    vibrate();

    downloadVCard(profile);

    showToast("Contacto preparado para guardar.");
  });

  shareButton.addEventListener("click", async () => {
    vibrate();

    try {
      const result = await shareProfile(profile);

      if (result.status === "shared") {
        showToast("Cartão partilhado.");
      }

      if (result.status === "copied") {
        showToast("Ligação copiada.");
      }
    } catch (error) {
      console.error("Falha ao partilhar:", error);

      showToast(
        "Não foi possível partilhar.",
        "error"
      );
    }
  });
}

async function start() {
  try {
    console.log("IdentityHub Pro iniciado.");

    const profile = await loadProfile();

    renderProfile(profile);
    renderContactActions(profile);
    renderQRCode(profile);
    setupProfileButtons(profile);

    console.log("Perfil carregado:", profile);
  } catch (error) {
    console.error(
      "Falha ao iniciar o IdentityHub Pro:",
      error
    );
  }
}

registerServiceWorker();
start();