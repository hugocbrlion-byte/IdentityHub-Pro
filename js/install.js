import { showToast } from "./toast.js";

let deferredInstallPrompt = null;

function isIOSDevice() {
  const userAgent = window.navigator.userAgent.toLowerCase();

  const classicIOS =
    /iphone|ipad|ipod/.test(userAgent);

  const modernIPad =
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1;

  return classicIOS || modernIPad;
}

function isAndroidDevice() {
  return /android/i.test(
    window.navigator.userAgent
  );
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function createInstallModal() {
  let modal = document.querySelector(
    "#install-help-modal"
  );

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");

  modal.id = "install-help-modal";
  modal.className = "install-help";
  modal.hidden = true;

  modal.innerHTML = `
    <div
      class="install-help__backdrop"
      data-install-close
    ></div>

    <section
      class="install-help__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-help-title"
    >
      <button
        class="install-help__close"
        type="button"
        aria-label="Fechar"
        data-install-close
      >
        ×
      </button>

      <div class="install-help__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12"></path>
          <path d="m7 10 5 5 5-5"></path>
          <path d="M5 19h14"></path>
        </svg>
      </div>

      <span class="install-help__eyebrow">
        IdentityHub Pro
      </span>

      <h2 id="install-help-title">
        Instalar aplicação
      </h2>

      <div
        class="install-help__content"
        id="install-help-content"
      ></div>

      <button
        class="install-help__confirm"
        type="button"
        data-install-close
      >
        Percebi
      </button>
    </section>
  `;

  document.body.appendChild(modal);

  modal
    .querySelectorAll("[data-install-close]")
    .forEach((element) => {
      element.addEventListener("click", () => {
        modal.hidden = true;
        document.body.classList.remove(
          "install-help-open"
        );
      });
    });

  return modal;
}

function showInstallInstructions(platform) {
  const modal = createInstallModal();

  const content = modal.querySelector(
    "#install-help-content"
  );

  if (platform === "ios") {
    content.innerHTML = `
      <ol class="install-help__steps">
        <li>
          Abre esta página no
          <strong>Safari</strong>.
        </li>

        <li>
          Toca no botão
          <strong>Partilhar</strong>.
        </li>

        <li>
          Escolhe
          <strong>Adicionar ao ecrã principal</strong>.
        </li>

        <li>
          Ativa
          <strong>Abrir como aplicação web</strong>
          e toca em
          <strong>Adicionar</strong>.
        </li>
      </ol>
    `;
  } else {
    content.innerHTML = `
      <ol class="install-help__steps">
        <li>
          Abre esta página no
          <strong>Google Chrome</strong>.
        </li>

        <li>
          Toca no menu dos
          <strong>três pontos</strong>.
        </li>

        <li>
          Escolhe
          <strong>Instalar aplicação</strong>
          ou
          <strong>Adicionar ao ecrã principal</strong>.
        </li>
      </ol>

      <p class="install-help__note">
        Caso tenhas aberto o link dentro do Instagram,
        WhatsApp ou Facebook, escolhe primeiro
        “Abrir no Chrome”.
      </p>
    `;
  }

  modal.hidden = false;

  document.body.classList.add(
    "install-help-open"
  );
}

function showInstallButton(button) {
  button.hidden = false;
}

function hideInstallButton(button) {
  button.hidden = true;
}

export function setupInstallButton() {
  const installButton = document.querySelector(
    "#install-app-button"
  );

  if (!installButton) {
    console.warn(
      "O botão #install-app-button não foi encontrado."
    );

    return;
  }

  if (isStandaloneMode()) {
    hideInstallButton(installButton);
    return;
  }

  /*
   * Nos dispositivos móveis mostramos sempre o botão.
   * Caso o prompt nativo não esteja disponível,
   * apresentamos instruções manuais.
   */
  if (isIOSDevice() || isAndroidDevice()) {
    showInstallButton(installButton);
  }

  window.addEventListener(
    "beforeinstallprompt",
    (event) => {
      event.preventDefault();

      deferredInstallPrompt = event;

      showInstallButton(installButton);

      installButton.classList.add(
        "profile-button--install-ready"
      );

      console.log(
        "Instalação automática disponível."
      );
    }
  );

  installButton.addEventListener(
    "click",
    async () => {
      if (isStandaloneMode()) {
        hideInstallButton(installButton);

        showToast(
          "A aplicação já está instalada."
        );

        return;
      }

      /*
       * O iPhone utiliza sempre instalação manual.
       */
      if (isIOSDevice()) {
        showInstallInstructions("ios");
        return;
      }

      /*
       * Android ou desktop com prompt disponível.
       */
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();

        const choice =
          await deferredInstallPrompt.userChoice;

        if (choice.outcome === "accepted") {
          showToast("Instalação iniciada.");
        } else {
          showToast("Instalação cancelada.");
        }

        deferredInstallPrompt = null;

        installButton.classList.remove(
          "profile-button--install-ready"
        );

        return;
      }

      /*
       * Android sem prompt automático disponível.
       */
      if (isAndroidDevice()) {
        showInstallInstructions("android");
        return;
      }

      showToast(
        "Usa o menu do navegador para instalar a aplicação."
      );
    }
  );

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;

    hideInstallButton(installButton);

    showToast(
      "IdentityHub Pro instalado."
    );

    console.log(
      "IdentityHub Pro instalado com sucesso."
    );
  });
}