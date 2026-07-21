import {
  t
} from "./i18n.js";

/* ==================================================
   ÍCONES
================================================== */

const ACTION_ICONS = {
  phone: `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2
        19.79 19.79 0 0 1-8.63-3.07
        19.5 19.5 0 0 1-6-6
        19.79 19.79 0 0 1-3.07-8.67
        A2 2 0 0 1 4.11 2h3
        a2 2 0 0 1 2 1.72
        12.84 12.84 0 0 0 .7 2.81
        2 2 0 0 1-.45 2.11L8.09 9.91
        a16 16 0 0 0 6 6l1.27-1.27
        a2 2 0 0 1 2.11-.45
        12.84 12.84 0 0 0 2.81.7
        A2 2 0 0 1 22 16.92z"
      ></path>
    </svg>
  `,

  whatsapp: `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8
        8.5 8.5 0 0 1-7.6 4.7
        8.38 8.38 0 0 1-3.8-.9
        L3 21l1.9-5.7
        a8.38 8.38 0 0 1-.9-3.8
        8.5 8.5 0 0 1 4.7-7.6
        8.38 8.38 0 0 1 3.8-.9h.5
        a8.48 8.48 0 0 1 8 8z"
      ></path>

      <path
        d="M9.3 8.4c.2-.4.4-.4.7-.4h.5
        c.2 0 .4.1.5.4l.8 1.8
        c.1.3.1.5-.1.7l-.6.8
        c-.2.2-.2.4-.1.6
        .6 1.2 1.6 2.2 2.8 2.8
        .2.1.4.1.6-.1l.9-1.1
        c.2-.2.4-.3.7-.2l1.8.9
        c.3.1.4.3.4.5
        0 .5-.2 1.3-.6 1.7
        -.5.5-1.3.8-2.1.8
        -1.2 0-2.8-.6-4.3-1.8
        -1.8-1.4-3-3.3-3.3-4.7
        -.2-1 .1-1.9.6-2.7z"
      ></path>
    </svg>
  `,

  email: `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      ></rect>

      <path
        d="m3 7 9 6 9-6"
      ></path>
    </svg>
  `,

  instagram: `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
      ></rect>

      <circle
        cx="12"
        cy="12"
        r="4"
      ></circle>

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        class="contact-action__icon-dot"
      ></circle>
    </svg>
  `,

  steam: `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="15.5"
        cy="8.5"
        r="3.5"
      ></circle>

      <circle
        cx="15.5"
        cy="8.5"
        r="1.5"
      ></circle>

      <circle
        cx="7"
        cy="16.5"
        r="2.5"
      ></circle>

      <path
        d="m9.1 15.2 4.1-3.4"
      ></path>

      <path
        d="m4.8 15.4-3.3-1.3"
      ></path>

      <path
        d="m9 17.1 4.2 1.7
        a4 4 0 0 0 5.1-2.3"
      ></path>
    </svg>
  `
};

/* ==================================================
   TRADUÇÕES
================================================== */

function translate(
  key,
  fallback
) {
  try {
    const result = t(key);

    if (
      typeof result !== "string" ||
      result.trim() === "" ||
      result === key
    ) {
      return fallback;
    }

    return result;
  } catch {
    return fallback;
  }
}

/* ==================================================
   TRATAMENTO DOS DADOS
================================================== */

function normaliseText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isActionVisible(
  profile,
  key
) {
  const value =
    profile[
      `${key}_visible`
    ];

  return (
    value !== false &&
    value !== "false" &&
    value !== 0 &&
    value !== "0"
  );
}

function normaliseWhatsApp(value) {
  return normaliseText(value)
    .replace(/\D/g, "");
}

function normaliseInstagramUrl(value) {
  const instagram =
    normaliseText(value);

  if (!instagram) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      instagram
    )
  ) {
    return instagram;
  }

  const username =
    instagram
      .replace(/^@/, "")
      .replace(
        /^(www\.)?instagram\.com\//i,
        ""
      )
      .replace(/\/+$/, "");

  return username
    ? `https://www.instagram.com/${username}/`
    : "";
}

function normaliseSteamUrl(value) {
  const steam =
    normaliseText(value);

  if (!steam) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      steam
    )
  ) {
    return steam;
  }

  const steamId =
    steam
      .replace(/^@/, "")
      .replace(/\/+$/, "");

  return steamId
    ? `https://steamcommunity.com/id/${steamId}/`
    : "";
}

/* ==================================================
   CRIAÇÃO DE CADA ÍCONE
================================================== */

function createAction(action) {
  const link =
    document.createElement("a");

  link.className =
    `contact-action contact-action--${action.key}`;

  link.dataset.action =
    action.key;

  link.dataset.tooltip =
    action.label;

  link.href =
    action.href;

  link.title =
    action.label;

  link.setAttribute(
    "aria-label",
    action.label
  );

  if (action.external) {
    link.target =
      "_blank";

    link.rel =
      "noopener noreferrer";
  }

  const icon =
    document.createElement("span");

  icon.className =
    "contact-action__icon";

  icon.setAttribute(
    "aria-hidden",
    "true"
  );

  icon.innerHTML =
    ACTION_ICONS[action.key] || "";

  link.appendChild(icon);

  return link;
}

/* ==================================================
   RENDERIZAÇÃO
================================================== */

export function renderContactActions(
  profile
) {
  const container =
    document.querySelector(
      "#contact-actions"
    ) ||
    document.querySelector(
      ".contact-actions"
    ) ||
    document.querySelector(
      "[data-contact-actions]"
    );

  if (!container) {
    console.warn(
      "O contentor dos contactos não foi encontrado."
    );

    return;
  }

  if (!profile) {
    container.replaceChildren();
    container.hidden = true;

    return;
  }

  const phone =
    normaliseText(
      profile.phone
    );

  const whatsapp =
    normaliseWhatsApp(
      profile.whatsapp
    );

  const email =
    normaliseText(
      profile.email
    );

  const instagram =
    normaliseText(
      profile.instagram
    );

  const steam =
    normaliseText(
      profile.steam
    );

  const instagramUrl =
    normaliseInstagramUrl(
      instagram
    );

  const steamUrl =
    normaliseSteamUrl(
      steam
    );

  const whatsappMessage =
    encodeURIComponent(
      translate(
        "messages.whatsapp",
        "Olá Hugo! Encontrei o teu cartão digital."
      )
    );

  const emailSubject =
    encodeURIComponent(
      translate(
        "messages.emailSubject",
        "Contacto através do IdentityHub Pro"
      )
    );

  const actions = [
    {
      key: "phone",

      label:
        translate(
          "actions.phone",
          "Telefonar"
        ),

      href:
        phone
          ? `tel:${phone}`
          : "",

      visible:
        isActionVisible(
          profile,
          "phone"
        ) &&
        Boolean(phone)
    },

    {
      key: "whatsapp",

      label:
        translate(
          "actions.whatsapp",
          "WhatsApp"
        ),

      href:
        whatsapp
          ? `https://wa.me/${whatsapp}?text=${whatsappMessage}`
          : "",

      external: true,

      visible:
        isActionVisible(
          profile,
          "whatsapp"
        ) &&
        Boolean(whatsapp)
    },

    {
      key: "email",

      label:
        translate(
          "actions.email",
          "Email"
        ),

      href:
        email
          ? `mailto:${email}?subject=${emailSubject}`
          : "",

      visible:
        isActionVisible(
          profile,
          "email"
        ) &&
        Boolean(email)
    },

    {
      key: "instagram",

      label:
        translate(
          "actions.instagram",
          "Instagram"
        ),

      href:
        instagramUrl,

      external: true,

      visible:
        isActionVisible(
          profile,
          "instagram"
        ) &&
        Boolean(instagramUrl)
    },

    {
      key: "steam",

      label:
        translate(
          "actions.steam",
          "Steam"
        ),

      href:
        steamUrl,

      external: true,

      visible:
        isActionVisible(
          profile,
          "steam"
        ) &&
        Boolean(steamUrl)
    }
  ];

  const visibleActions =
    actions.filter(
      (action) =>
        action.visible === true &&
        Boolean(action.href)
    );

  container.replaceChildren(
    ...visibleActions.map(
      createAction
    )
  );

  container.hidden =
    visibleActions.length === 0;

  container.setAttribute(
    "aria-hidden",
    visibleActions.length === 0
      ? "true"
      : "false"
  );
}