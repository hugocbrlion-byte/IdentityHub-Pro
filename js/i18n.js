const translations = {
  pt: {
    language: {
      label: "Idioma"
    },

    qr: {
      eyebrow: "Ligação rápida",
      title: "Digitaliza para guardar",
      description:
        "Aponta a câmara para abrir o cartão digital."
    },

    buttons: {
      saveContact: "Guardar contacto",
      share: "Partilhar",
      install: "Instalar aplicação"
    },

    actions: {
      phone: "Telefonar",
      whatsapp: "WhatsApp",
      email: "Email",
      instagram: "Instagram",
      steam: "Steam"
    },

    messages: {
      whatsapp:
        "Olá {firstName}! Vi o teu cartão digital.",

      emailSubject:
        "Contacto através do IdentityHub Pro"
    },

    share: {
      text: "{name} — {tagline}"
    },

    toast: {
      contactReady:
        "Contacto preparado para guardar.",

      shared:
        "Cartão partilhado.",

      copied:
        "Ligação copiada.",

      shareError:
        "Não foi possível partilhar."
    }
  },

  en: {
    language: {
      label: "Language"
    },

    qr: {
      eyebrow: "Quick connection",
      title: "Scan to save",
      description:
        "Point your camera to open the digital card."
    },

    buttons: {
      saveContact: "Save contact",
      share: "Share",
      install: "Install app"
    },

    actions: {
      phone: "Call",
      whatsapp: "WhatsApp",
      email: "Email",
      instagram: "Instagram",
      steam: "Steam"
    },

    messages: {
      whatsapp:
        "Hi {firstName}! I found your digital card.",

      emailSubject:
        "Contact via IdentityHub Pro"
    },

    share: {
      text: "{name} — {tagline}"
    },

    toast: {
      contactReady:
        "Contact ready to save.",

      shared:
        "Card shared.",

      copied:
        "Link copied.",

      shareError:
        "Unable to share."
    }
  }
};

const SUPPORTED_LANGUAGES = ["pt", "en"];
const STORAGE_KEY = "identityhub-language";

let currentLanguage = "pt";

function normaliseLanguage(language = "") {
  const shortLanguage = language
    .toLowerCase()
    .split("-")[0];

  return SUPPORTED_LANGUAGES.includes(shortLanguage)
    ? shortLanguage
    : "en";
}

function readSavedLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      language
    );
  } catch {
    console.info(
      "Não foi possível guardar a preferência de idioma."
    );
  }
}

function detectPreferredLanguage() {
  const savedLanguage = readSavedLanguage();

  if (
    savedLanguage &&
    SUPPORTED_LANGUAGES.includes(savedLanguage)
  ) {
    return savedLanguage;
  }

  const preferredLanguages =
    Array.isArray(navigator.languages) &&
    navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  const portugueseLanguage =
    preferredLanguages.find((language) =>
      language.toLowerCase().startsWith("pt")
    );

  return portugueseLanguage
    ? "pt"
    : "en";
}

function getTranslationValue(key) {
  return key.split(".").reduce(
    (value, property) =>
      value?.[property],
    translations[currentLanguage]
  );
}

function interpolate(text, variables = {}) {
  return Object.entries(variables).reduce(
    (result, [key, value]) =>
      result.replaceAll(
        `{${key}}`,
        String(value)
      ),
    text
  );
}

function updateLanguageButtons() {
  document
    .querySelectorAll("[data-language]")
    .forEach((button) => {
      const isActive =
        button.dataset.language ===
        currentLanguage;

      button.classList.toggle(
        "language-switcher__button--active",
        isActive
      );

      button.setAttribute(
        "aria-pressed",
        String(isActive)
      );
    });
}

export function t(key, variables = {}) {
  const value = getTranslationValue(key);

  if (typeof value !== "string") {
    console.warn(
      `Tradução não encontrada: ${key}`
    );

    return key;
  }

  return interpolate(value, variables);
}

export function translateDocument() {
  document
    .querySelectorAll("[data-i18n]")
    .forEach((element) => {
      element.textContent = t(
        element.dataset.i18n
      );
    });

  document
    .querySelectorAll(
      "[data-i18n-aria-label]"
    )
    .forEach((element) => {
      element.setAttribute(
        "aria-label",
        t(
          element.dataset.i18nAriaLabel
        )
      );
    });

  document
    .querySelectorAll("[data-i18n-title]")
    .forEach((element) => {
      element.setAttribute(
        "title",
        t(element.dataset.i18nTitle)
      );
    });

  updateLanguageButtons();
}

export function setLanguage(
  language,
  {
    persist = true,
    emitEvent = true
  } = {}
) {
  currentLanguage =
    normaliseLanguage(language);

  document.documentElement.lang =
    currentLanguage === "pt"
      ? "pt-PT"
      : "en";

  if (persist) {
    saveLanguage(currentLanguage);
  }

  translateDocument();

  if (emitEvent) {
    window.dispatchEvent(
      new CustomEvent(
        "identityhub:languagechange",
        {
          detail: {
            language: currentLanguage
          }
        }
      )
    );
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function setupLanguageSwitcher() {
  document
    .querySelectorAll("[data-language]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          setLanguage(
            button.dataset.language
          );
        }
      );
    });
}

export function initialiseI18n() {
  setLanguage(
    detectPreferredLanguage(),
    {
      persist: false,
      emitEvent: false
    }
  );

  setupLanguageSwitcher();

  console.log(
    "Idioma ativo:",
    currentLanguage
  );
}