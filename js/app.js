import {
  loadProfile,
  getLocalizedProfile
} from "./profile.js";

import {
  renderContactActions
} from "./actions.js";

import {
  renderQRCode
} from "./qr.js";

import {
  downloadVCard
} from "./vcard.js";

import {
  shareProfile
} from "./share.js";

import {
  showToast
} from "./toast.js";

import {
  registerServiceWorker
} from "./pwa.js";

import {
  setupInstallButton
} from "./install.js";

import {
  setupMotionEffects
} from "./motion.js";

import {
  applyProfileTheme
} from "./theme.js";

import {
  initialiseI18n,
  getLanguage,
  t
} from "./i18n.js";

import {
  setupVisitCounter
} from "./visits.js";

let activeProfile = null;

function getCurrentProfile() {
  if (!activeProfile) {
    return null;
  }

  return getLocalizedProfile(
    activeProfile,
    getLanguage()
  );
}

function renderProfile() {
  const profile =
    getCurrentProfile();

  if (!profile) {
    return;
  }

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

  avatarElement.src =
    profile.photo_url;

  avatarElement.alt =
    `Fotografia de perfil de ${profile.name}`;

  avatarElement.addEventListener(
    "error",
    () => {
      avatarElement.src =
        "./assets/images/profile.jpg";
    },
    {
      once: true
    }
  );

  document.title =
    `${profile.name} | IdentityHub Pro`;
}

function vibrate(duration = 20) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

function setupProfileButtons() {
  const saveButton =
    document.querySelector(
      "#save-contact-button"
    );

  const shareButton =
    document.querySelector(
      "#share-button"
    );

  if (!saveButton || !shareButton) {
    return;
  }

  saveButton.addEventListener(
    "click",
    () => {
      const profile =
        getCurrentProfile();

      if (!profile) {
        return;
      }

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
      const profile =
        getCurrentProfile();

      if (!profile) {
        return;
      }

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
      const profile =
        getCurrentProfile();

      if (!profile) {
        return;
      }

      renderProfile();

      renderContactActions(
        profile
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

    applyProfileTheme(
      activeProfile
    );

    renderProfile();

    const profile =
      getCurrentProfile();

    renderContactActions(
      profile
    );

    renderQRCode(
      profile
    );

    setupProfileButtons();

    await setupVisitCounter();

    if (
      activeProfile.motion_enabled !==
      false
    ) {
      setupMotionEffects();
    }

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
setupLanguageUpdates();
start();