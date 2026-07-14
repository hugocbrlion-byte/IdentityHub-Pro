import { getProfileUrl } from "./profile-url.js";

export function renderQRCode(profile) {
  const container = document.querySelector("#qr-code");

  if (!container) {
    throw new Error("O contentor #qr-code não foi encontrado.");
  }

  if (!window.QRCode) {
    throw new Error("A biblioteca QRCode.js não foi carregada.");
  }

  const destination = getProfileUrl(profile);

  console.log("Endereço utilizado pelo QR Code:", destination);

  container.replaceChildren();

  new window.QRCode(container, {
    text: destination,
    width: 190,
    height: 190,
    colorDark: "#080a10",
    colorLight: "#ffffff",
    correctLevel: window.QRCode.CorrectLevel.H
  });
}