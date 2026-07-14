const icons = {
  phone: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.2 3.5 9.4 8a1.5 1.5 0 0 1-.35 1.75l-1.2 1.2a14.2 14.2 0 0 0 5.2 5.2l1.2-1.2A1.5 1.5 0 0 1 16 14.6l4.5 2.2a1.5 1.5 0 0 1 .8 1.65A3.2 3.2 0 0 1 18.1 21C9.75 21 3 14.25 3 5.9a3.2 3.2 0 0 1 2.55-3.2 1.5 1.5 0 0 1 1.65.8Z"
      />
    </svg>
  `,

  whatsapp: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.5 11.6a8.4 8.4 0 0 1-12.45 7.35L3 20.3l1.35-4.9A8.4 8.4 0 1 1 20.5 11.6Z"
      />
      <path
        d="M8.3 7.7c.25-.55.5-.55.75-.55h.65c.2 0 .4.05.55.4l.8 1.9c.1.25.05.45-.1.65l-.6.75c-.15.2-.3.35-.1.65.65 1.1 1.55 2 2.65 2.65.3.2.5.05.7-.15l.8-.95c.2-.25.45-.3.7-.2l1.85.85c.3.15.5.25.55.45.1.45-.05 1.4-.7 2-.6.55-1.45.8-2.25.65-1.35-.25-3.1-1-4.75-2.45-1.4-1.25-2.45-2.8-2.8-4.15-.25-.95-.05-1.8.5-2.5Z"
      />
    </svg>
  `,

  email: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  `,

  instagram: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" class="icon-fill" />
    </svg>
  `,

  steam: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="15.5" cy="8.5" r="3.5" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <path d="m8.7 15.4 3.9-3.7M3.5 14.8l1.2.7" />
    </svg>
  `
};

function sanitisePhoneNumber(number = "") {
  return number.replace(/[^\d+]/g, "");
}

function createAction({
  key,
  label,
  value,
  href,
  external = false
}) {
  const action = document.createElement("a");

  action.className = `contact-action contact-action--${key}`;
  action.href = href;
  action.setAttribute("aria-label", label);
  action.dataset.label = label;

  if (external) {
    action.target = "_blank";
    action.rel = "noopener noreferrer";
  }

  action.innerHTML = `
    <span class="contact-action__icon">
      ${icons[key]}
    </span>

    <span class="contact-action__tooltip">
      <strong>${label}</strong>
      <small>${value}</small>
    </span>
  `;

  action.addEventListener("click", () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(25);
    }
  });

  return action;
}

export function renderContactActions(profile) {
  const container = document.querySelector("#contact-actions");

  if (!container) {
    throw new Error("O contentor #contact-actions não foi encontrado.");
  }

  const phone = sanitisePhoneNumber(profile.phone);
  const whatsapp = sanitisePhoneNumber(profile.whatsapp);
  const whatsappMessage = encodeURIComponent(
    `Olá Hugo! Vi o teu cartão digital.`
  );

  const instagramName = profile.instagram
    .replace(/\/$/, "")
    .split("/")
    .pop();

  const steamName = profile.steam
    .replace(/\/$/, "")
    .split("/")
    .pop();

  const actions = [
    {
      key: "phone",
      label: "Telefonar",
      value: profile.phone,
      href: `tel:${phone}`
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      value: profile.whatsapp,
      href: `https://wa.me/${whatsapp.replace("+", "")}?text=${whatsappMessage}`,
      external: true
    },
    {
      key: "email",
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}?subject=${encodeURIComponent(
        "Contacto através do IdentityHub Pro"
      )}`
    },
    {
      key: "instagram",
      label: "Instagram",
      value: `@${instagramName}`,
      href: profile.instagram,
      external: true
    },
    {
      key: "steam",
      label: "Steam",
      value: steamName,
      href: profile.steam,
      external: true
    }
  ];

  container.replaceChildren(
    ...actions.map((action) => createAction(action))
  );
}