import { showToast } from "./toast.js";

let deferredInstallPrompt = null;

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(
    window.navigator.userAgent
  );
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function showButton(button) {
  button.hidden = false;
}

function hideButton(button) {
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
    hideButton(installButton);
    return;
  }

  /*
   * No iPhone não existe o evento beforeinstallprompt.
   * Mostramos o botão para apresentar as instruções manuais.
   */
  if (isIOSDevice()) {
    showButton(installButton);
  }

  window.addEventListener(
    "beforeinstallprompt",
    (event) => {
      event.preventDefault();

      deferredInstallPrompt = event;

      showButton(installButton);

      console.log(
        "A instalação do IdentityHub Pro está disponível."
      );
    }
  );

  installButton.addEventListener(
    "click",
    async () => {
      if (isStandaloneMode()) {
        hideButton(installButton);

        showToast("A aplicação já está instalada.");
        return;
      }

      if (isIOSDevice()) {
        showToast(
          "No iPhone: toca em Partilhar e escolhe “Adicionar ao ecrã principal”."
        );

        return;
      }

      if (!deferredInstallPrompt) {
        showToast(
          "A instalação ainda não está disponível neste navegador."
        );

        return;
      }

      deferredInstallPrompt.prompt();

      const choice =
        await deferredInstallPrompt.userChoice;

      if (choice.outcome === "accepted") {
        showToast("Instalação iniciada.");
      } else {
        showToast("Instalação cancelada.");
      }

      deferredInstallPrompt = null;

      hideButton(installButton);
    }
  );

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;

    hideButton(installButton);

    showToast("IdentityHub Pro instalado.");

    console.log(
      "IdentityHub Pro foi instalado com sucesso."
    );
  });
}