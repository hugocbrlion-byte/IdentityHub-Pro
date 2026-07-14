function escapeVCardValue(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function createSafeFileName(name = "contacto") {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function splitName(fullName = "") {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");

  return {
    firstName,
    lastName
  };
}

export function createVCard(profile) {
  const { firstName, lastName } = splitName(profile.name);

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    `FN:${escapeVCardValue(profile.name)}`,
    `TITLE:${escapeVCardValue(profile.job)}`,
    `TEL;TYPE=CELL:${escapeVCardValue(profile.phone)}`,
    `EMAIL;TYPE=INTERNET:${escapeVCardValue(profile.email)}`,
    `ADR;TYPE=HOME:;;;${escapeVCardValue(profile.location)};;;;`,
    `URL:${escapeVCardValue(profile.website)}`,
    `X-SOCIALPROFILE;TYPE=instagram:${escapeVCardValue(profile.instagram)}`,
    `X-SOCIALPROFILE;TYPE=steam:${escapeVCardValue(profile.steam)}`,
    `item1.URL:https://wa.me/${String(profile.whatsapp).replace(/\D/g, "")}`,
    "item1.X-ABLabel:WhatsApp",
    "END:VCARD"
  ];

  return lines.join("\r\n");
}

export function downloadVCard(profile) {
  const vCard = createVCard(profile);

  const blob = new Blob([vCard], {
    type: "text/vcard;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${createSafeFileName(profile.name)}.vcf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}