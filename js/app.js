import { loadProfile } from "./profile.js";
import { renderContactActions } from "./actions.js";
import { renderQRCode } from "./qr.js";
import { downloadVCard } from "./vcard.js";
import { shareProfile } from "./share.js";
import { showToast } from "./toast.js";
import { registerServiceWorker } from "./pwa.js";
import { setupInstallButton } from "./install.js";
import { setupMotionEffects } from "./motion.js";

import {
  initialiseI18n,
  t
} from "./i18n.js";

let activeProfile = null;

function renderProfile(profile) {
  const nameElement =
    document.querySelector(
      "#profile-name"
    );

  const taglineElement =
    document.querySelector(
      "#profile-tagline"
    );

  const jobElement =
    document.querySelector(
      "#profile-job"
    );

  const locationElement =
    document.querySelector(
      "#profile-location"
    );

  const avatarElement =
    document.querySelector(
      "#profile-avatar"
    );

  nameElement.textContent =
    profile.name;

  taglineElement.textContent =
    profile.tagline;

  jobElement.textContent =
    profile.job;

  locationElement.textContent =
    profile.location;

  avatarElement.alt =
    `Fotografia de perfil de ${profile.name}`;

  document.title =
    `${profile.name} | IdentityHub Pro`;
}

function vibrate(duration = 20) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

function setupProfileButtons(profile) {
  const saveButton =
    document.querySelector(
      "#save-contact-button"
    );

  const shareButton =
    document.querySelector(
      "#share-button"
    );

  saveButton.addEventListener(
    "click",
    () => {
      vibrate();

      downloadVCard(profile);

      showToast(
        t("toast.contactReady")
      );
    }
  );

  shareButton.addEventListener(
    "click",
    async () => {
      vibrate();

      try {
        const result =
          await shareProfile(profile);

        if (result.status === "shared") {
          showToast(
            t("toast.shared")
          );
        }

        if (result.status === "copied") {
          showToast(
            t("toast.copied")
          );
        }
      } catch (error) {
        console.error(
          "Falha ao partilhar:",
          error
        );

        showToast(
          t("toast.shareError"),
          "error"
        );
      }
    }
  );
}

function setupLanguageUpdates() {
  window.addEventListener(
    "identityhub:languagechange",
    () => {
      if (!activeProfile) {
        return;
      }

      /*
       * Os botões são gerados por JavaScript,
       * portanto são recriados quando o idioma muda.
       */
      renderContactActions(
        activeProfile
      );
    }
  );
}

async function start() {
  try {
    console.log(
      "IdentityHub Pro iniciado."
    );

    initialiseI18n();

    activeProfile =
      await loadProfile();

    renderProfile(activeProfile);

    renderContactActions(
      activeProfile
    );

    renderQRCode(activeProfile);

    setupProfileButtons(
      activeProfile
    );

    console.log(
      "Perfil carregado:",
      activeProfile
    );
  } catch (error) {
    console.error(
      "Falha ao iniciar o IdentityHub Pro:",
      error
    );
  }
}

registerServiceWorker();
setupInstallButton();
setupMotionEffects();
setupLanguageUpdates();
start();