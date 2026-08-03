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

/* ==================================================
   CONFIGURAÇÃO
================================================== */

const IS_ADMIN_PREVIEW =
  new URLSearchParams(
    window.location.search
  ).get("preview") === "1";

let activeProfile = null;
let profileButtonsReady = false;

/* ==================================================
   PERFIL ATUAL
================================================== */

function getCurrentProfile() {
  if (!activeProfile) {
    return null;
  }

  return getLocalizedProfile(
    activeProfile,
    getLanguage()
  );
}

/* ==================================================
   MOSTRAR NOTIFICAÇÕES COM SEGURANÇA
================================================== */

function safeToast(
  translationKey,
  fallbackText,
  type = "success"
) {
  let message =
    fallbackText;

  try {
    const translated =
      t(translationKey);

    if (
      translated &&
      translated !==
        translationKey
    ) {
      message =
        translated;
    }
  } catch (error) {
    console.warn(
      "Não foi possível obter a tradução:",
      error
    );
  }

  try {
    showToast(
      message,
      type
    );
  } catch (error) {
    console.warn(
      "Não foi possível mostrar a notificação:",
      error
    );
  }
}

/* ==================================================
   RENDERIZAR PERFIL
================================================== */

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

  if (nameElement) {
    nameElement.textContent =
      profile.name || "";
  }

  if (taglineElement) {
    taglineElement.textContent =
      profile.tagline || "";
  }

  if (jobElement) {
    jobElement.textContent =
      profile.job || "";
  }

  if (locationElement) {
    locationElement.textContent =
      profile.location || "";
  }

  if (avatarElement) {
    avatarElement.onerror =
      () => {
        avatarElement.onerror =
          null;

        avatarElement.src =
          "./assets/images/profile.jpg";
      };

    avatarElement.src =
      profile.photo_url ||
      "./assets/images/profile.jpg";

    avatarElement.alt =
      `Fotografia de perfil de ${
        profile.name ||
        "Hugo Rodrigues"
      }`;
  }

  document.title =
    `${
      profile.name ||
      "Hugo Rodrigues"
    } | IdentityHub Pro`;
}

/* ==================================================
   VIBRAÇÃO
================================================== */

function vibrate(
  duration = 20
) {
  try {
    if (
      "vibrate" in navigator
    ) {
      navigator.vibrate(
        duration
      );
    }
  } catch (error) {
    console.warn(
      "Vibração indisponível:",
      error
    );
  }
}

/* ==================================================
   GUARDAR CONTACTO
================================================== */

function handleSaveContact() {
  const profile =
    getCurrentProfile();

  if (!profile) {
    console.error(
      "O perfil ainda não está disponível."
    );

    safeToast(
      "toast.contactError",
      "Não foi possível preparar o contacto.",
      "error"
    );

    return;
  }

  try {
    vibrate();

    downloadVCard(
      profile
    );

    safeToast(
      "toast.contactReady",
      "Contacto preparado para guardar."
    );
  } catch (error) {
    console.error(
      "Falha ao guardar contacto:",
      error
    );

    safeToast(
      "toast.contactError",
      "Não foi possível guardar o contacto.",
      "error"
    );
  }
}

/* ==================================================
   PARTILHAR PERFIL
================================================== */

async function handleShareProfile() {
  const profile =
    getCurrentProfile();

  if (!profile) {
    console.error(
      "O perfil ainda não está disponível."
    );

    safeToast(
      "toast.shareError",
      "Não foi possível preparar a partilha.",
      "error"
    );

    return;
  }

  try {
    vibrate();

    const result =
      await shareProfile(
        profile
      );

    if (
      result?.status ===
      "shared"
    ) {
      safeToast(
        "toast.shared",
        "Cartão partilhado."
      );

      return;
    }

    if (
      result?.status ===
      "copied"
    ) {
      safeToast(
        "toast.copied",
        "Ligação copiada."
      );

      return;
    }

    console.warn(
      "Resultado de partilha desconhecido:",
      result
    );
  } catch (error) {
    /*
     * Não mostrar erro quando o utilizador
     * cancela voluntariamente a partilha.
     */
    if (
      error?.name ===
      "AbortError"
    ) {
      return;
    }

    console.error(
      "Falha ao partilhar:",
      error
    );

    safeToast(
      "toast.shareError",
      "Não foi possível partilhar o cartão.",
      "error"
    );
  }
}

/* ==================================================
   CONFIGURAR BOTÕES PRINCIPAIS
================================================== */

function setupProfileButtons() {
  if (profileButtonsReady) {
    return;
  }

  /*
   * O evento é aplicado ao documento em modo
   * capture. Assim continua a funcionar mesmo
   * que outro módulo substitua ou atualize os
   * elementos dos botões.
   */
  document.addEventListener(
    "click",
    async (event) => {
      const target =
        event.target;

      if (
        !(
          target instanceof
          Element
        )
      ) {
        return;
      }

      const button =
        target.closest(
          "#save-contact-button, #share-button"
        );

      if (!button) {
        return;
      }

      if (button.disabled) {
        return;
      }

      event.preventDefault();

      if (
        button.id ===
        "save-contact-button"
      ) {
        console.log(
          "Clique em Guardar contacto detetado."
        );

        handleSaveContact();

        return;
      }

      if (
        button.id ===
        "share-button"
      ) {
        console.log(
          "Clique em Partilhar detetado."
        );

        await handleShareProfile();
      }
    },
    true
  );

  profileButtonsReady = true;

  console.log(
    "Botões Guardar contacto e Partilhar preparados."
  );
}

/* ==================================================
   ATUALIZAÇÃO DE IDIOMA
================================================== */

function setupLanguageUpdates() {
  window.addEventListener(
    "identityhub:languagechange",
    () => {
      const profile =
        getCurrentProfile();

      if (!profile) {
        return;
      }

      try {
        renderProfile();
      } catch (error) {
        console.error(
          "Falha ao atualizar o perfil após mudar o idioma:",
          error
        );
      }

      try {
        renderContactActions(
          profile
        );
      } catch (error) {
        console.error(
          "Falha ao atualizar os contactos após mudar o idioma:",
          error
        );
      }
    }
  );
}

/* ==================================================
   PRÉ-VISUALIZAÇÃO DO ADMIN
================================================== */

function setupAdminPreviewReceiver() {
  if (!IS_ADMIN_PREVIEW) {
    return;
  }

  document.documentElement.classList.add(
    "admin-preview-mode"
  );

  window.addEventListener(
    "message",
    (event) => {
      if (
        event.origin !==
        window.location.origin
      ) {
        return;
      }

      if (
        event.data?.type !==
        "identityhub:admin-preview"
      ) {
        return;
      }

      if (
        !event.data.profile ||
        typeof event.data.profile !==
          "object"
      ) {
        return;
      }

      activeProfile = {
        ...(activeProfile || {}),
        ...event.data.profile
      };

      try {
        applyProfileTheme(
          activeProfile
        );
      } catch (error) {
        console.error(
          "Falha ao aplicar o tema na pré-visualização:",
          error
        );
      }

      try {
        renderProfile();
      } catch (error) {
        console.error(
          "Falha ao atualizar a pré-visualização:",
          error
        );
      }

      const profile =
        getCurrentProfile();

      if (profile) {
        try {
          renderContactActions(
            profile
          );
        } catch (error) {
          console.error(
            "Falha ao atualizar os contactos da pré-visualização:",
            error
          );
        }

        try {
          renderQRCode(
            profile
          );
        } catch (error) {
          console.error(
            "Falha ao atualizar o QR Code da pré-visualização:",
            error
          );
        }
      }
    }
  );
}

/* ==================================================
   INICIAR PERFIL
================================================== */

async function start() {
  console.log(
    "A iniciar IdentityHub Pro..."
  );

  /*
   * Associar os eventos dos botões antes de
   * carregar perfil, QR Code, estatísticas
   * ou efeitos.
   */
  setupProfileButtons();

  try {
    initialiseI18n();
  } catch (error) {
    console.error(
      "Falha ao iniciar os idiomas:",
      error
    );
  }

  try {
    activeProfile =
      await loadProfile();
  } catch (error) {
    console.error(
      "Falha ao carregar o perfil:",
      error
    );

    safeToast(
      "toast.profileError",
      "Não foi possível carregar o perfil.",
      "error"
    );

    return;
  }

  if (!activeProfile) {
    console.error(
      "O perfil carregado está vazio."
    );

    return;
  }

  try {
    applyProfileTheme(
      activeProfile
    );
  } catch (error) {
    console.error(
      "Falha ao aplicar o tema:",
      error
    );
  }

  try {
    renderProfile();
  } catch (error) {
    console.error(
      "Falha ao renderizar o perfil:",
      error
    );
  }

  const profile =
    getCurrentProfile();

  if (!profile) {
    console.error(
      "Não foi possível localizar o perfil atual."
    );

    return;
  }

  try {
    renderContactActions(
      profile
    );
  } catch (error) {
    console.error(
      "Falha ao renderizar os contactos:",
      error
    );
  }

  try {
    renderQRCode(
      profile
    );
  } catch (error) {
    console.error(
      "Falha ao renderizar o QR Code:",
      error
    );
  }

  if (!IS_ADMIN_PREVIEW) {
    try {
      await setupVisitCounter();
    } catch (error) {
      console.error(
        "Falha ao carregar o contador de visitas:",
        error
      );
    }

    try {
      if (
        activeProfile.motion_enabled !==
        false
      ) {
        setupMotionEffects();
      }
    } catch (error) {
      console.error(
        "Falha ao iniciar os efeitos de movimento:",
        error
      );
    }
  }

  console.log(
    "Perfil carregado:",
    activeProfile
  );

  console.log(
    "IdentityHub Pro iniciado com sucesso."
  );
}

/* ==================================================
   INICIALIZAÇÃO GERAL
================================================== */

/*
 * Preparar imediatamente Guardar contacto
 * e Partilhar.
 */
setupProfileButtons();

/*
 * Instalação PWA e Service Worker apenas
 * na página pública.
 */
if (!IS_ADMIN_PREVIEW) {
  try {
    registerServiceWorker();
  } catch (error) {
    console.error(
      "Falha ao registar o Service Worker:",
      error
    );
  }

  try {
    setupInstallButton();
  } catch (error) {
    console.error(
      "Falha ao preparar o botão de instalação:",
      error
    );
  }
}

setupLanguageUpdates();
setupAdminPreviewReceiver();
start();