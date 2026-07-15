export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.info(
      "Este navegador não suporta Service Workers."
    );

    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration =
        await navigator.serviceWorker.register(
          "./service-worker.js"
        );

      console.log(
        "Service Worker registado:",
        registration.scope
      );
    } catch (error) {
      console.error(
        "Falha ao registar o Service Worker:",
        error
      );
    }
  });
}