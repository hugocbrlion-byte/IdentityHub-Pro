import {
  supabaseClient
} from "./supabase-client.js";

import {
  showToast
} from "./toast.js";

const IS_ADMIN_PREVIEW =
  new URLSearchParams(
    window.location.search
  ).get("preview") === "1";

const CLIENT_TOKEN_KEY =
  "identityhub-message-client-token";

let modal = null;
let form = null;
let openButton = null;
let submitButton = null;
let submitText = null;
let submitSpinner = null;
let previousFocus = null;
let isSubmitting = false;

/* ==================================================
   TOKEN DO NAVEGADOR
================================================== */

function createFallbackUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(
      /[xy]/g,
      (character) => {
        const randomValue =
          Math.floor(
            Math.random() * 16
          );

        const value =
          character === "x"
            ? randomValue
            : (
                randomValue & 0x3
              ) | 0x8;

        return value.toString(16);
      }
    );
}

function getClientToken() {
  try {
    const existingToken =
      localStorage.getItem(
        CLIENT_TOKEN_KEY
      );

    if (existingToken) {
      return existingToken;
    }

    const newToken =
      typeof crypto.randomUUID ===
      "function"
        ? crypto.randomUUID()
        : createFallbackUUID();

    localStorage.setItem(
      CLIENT_TOKEN_KEY,
      newToken
    );

    return newToken;
  } catch {
    return (
      typeof crypto.randomUUID ===
      "function"
        ? crypto.randomUUID()
        : createFallbackUUID()
    );
  }
}

/* ==================================================
   CRIAR INTERFACE
================================================== */

function createMessageInterface() {
  const contactActions =
    document.querySelector(
      "#contact-actions"
    ) ||
    document.querySelector(
      ".contact-actions"
    ) ||
    document.querySelector(
      "[data-contact-actions]"
    );

  if (
    !contactActions ||
    document.querySelector(
      "#open-contact-message"
    )
  ) {
    return;
  }

  openButton =
    document.createElement(
      "button"
    );

  openButton.id =
    "open-contact-message";

  openButton.className =
    "contact-message-button";

  openButton.type =
    "button";

  openButton.innerHTML = `
    <span
      class="contact-message-button__icon"
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24">
        <path
          d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
        ></path>

        <path
          d="M8 9h8"
        ></path>

        <path
          d="M8 13h5"
        ></path>
      </svg>
    </span>

    <span>
      Enviar mensagem
    </span>
  `;

  contactActions.insertAdjacentElement(
    "afterend",
    openButton
  );

  modal =
    document.createElement("div");

  modal.id =
    "contact-message-modal";

  modal.className =
    "contact-message-modal";

  modal.hidden = true;

  modal.innerHTML = `
    <div
      class="contact-message-modal__backdrop"
      data-message-close
    ></div>

    <section
      class="contact-message-modal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-message-title"
    >
      <header class="contact-message-modal__header">
        <div>
          <span>
            IdentityHub Pro
          </span>

          <h2 id="contact-message-title">
            Enviar mensagem
          </h2>

          <p>
            Preenche os dados e entrarei em contacto assim que possível.
          </p>
        </div>

        <button
          class="contact-message-modal__close"
          type="button"
          aria-label="Fechar"
          data-message-close
        >
          ×
        </button>
      </header>

      <form
        class="contact-message-form"
        id="contact-message-form"
      >
        <label class="contact-message-field">
          <span>Nome</span>

          <input
            type="text"
            id="contact-message-name"
            name="name"
            autocomplete="name"
            minlength="2"
            maxlength="80"
            required
          >
        </label>

        <label class="contact-message-field">
          <span>Email</span>

          <input
            type="email"
            id="contact-message-email"
            name="email"
            autocomplete="email"
            maxlength="160"
            required
          >
        </label>

        <label class="contact-message-field">
          <span>
            Telefone
            <small>Opcional</small>
          </span>

          <input
            type="tel"
            id="contact-message-phone"
            name="phone"
            autocomplete="tel"
            maxlength="30"
          >
        </label>

        <label
          class="contact-message-field contact-message-field--wide"
        >
          <span>Mensagem</span>

          <textarea
            id="contact-message-body"
            name="message"
            minlength="5"
            maxlength="2000"
            rows="6"
            required
          ></textarea>

          <small id="contact-message-counter">
            0 / 2000
          </small>
        </label>

        <label
          class="contact-message-honeypot"
          aria-hidden="true"
        >
          <span>Website</span>

          <input
            type="text"
            id="contact-message-website"
            name="website"
            tabindex="-1"
            autocomplete="off"
          >
        </label>

        <p
          class="contact-message-status"
          id="contact-message-status"
          role="alert"
          hidden
        ></p>

        <div class="contact-message-form__actions">
          <button
            class="contact-message-cancel"
            type="button"
            data-message-close
          >
            Cancelar
          </button>

          <button
            class="contact-message-submit"
            id="contact-message-submit"
            type="submit"
          >
            <span id="contact-message-submit-text">
              Enviar mensagem
            </span>

            <span
              class="contact-message-spinner"
              id="contact-message-spinner"
              hidden
              aria-hidden="true"
            ></span>
          </button>
        </div>
      </form>
    </section>
  `;

  document.body.appendChild(
    modal
  );

  form =
    modal.querySelector(
      "#contact-message-form"
    );

  submitButton =
    modal.querySelector(
      "#contact-message-submit"
    );

  submitText =
    modal.querySelector(
      "#contact-message-submit-text"
    );

  submitSpinner =
    modal.querySelector(
      "#contact-message-spinner"
    );
}

/* ==================================================
   ABRIR E FECHAR
================================================== */

function openModal() {
  if (!modal) {
    return;
  }

  previousFocus =
    document.activeElement;

  modal.hidden = false;

  document.body.classList.add(
    "contact-message-open"
  );

  requestAnimationFrame(() => {
    modal.classList.add(
      "contact-message-modal--visible"
    );

    modal
      .querySelector(
        "#contact-message-name"
      )
      ?.focus();
  });
}

function closeModal() {
  if (
    !modal ||
    isSubmitting
  ) {
    return;
  }

  modal.classList.remove(
    "contact-message-modal--visible"
  );

  document.body.classList.remove(
    "contact-message-open"
  );

  window.setTimeout(() => {
    modal.hidden = true;

    previousFocus?.focus?.();
  }, 180);
}

/* ==================================================
   ESTADO DO FORMULÁRIO
================================================== */

function showStatus(
  text,
  type = "error"
) {
  const status =
    modal?.querySelector(
      "#contact-message-status"
    );

  if (!status) {
    return;
  }

  status.textContent = text;
  status.dataset.type = type;
  status.hidden = false;
}

function hideStatus() {
  const status =
    modal?.querySelector(
      "#contact-message-status"
    );

  if (!status) {
    return;
  }

  status.hidden = true;
  status.textContent = "";

  delete status.dataset.type;
}

function setSubmitting(submitting) {
  isSubmitting = submitting;

  submitButton.disabled =
    submitting;

  submitText.textContent =
    submitting
      ? "A enviar..."
      : "Enviar mensagem";

  submitSpinner.hidden =
    !submitting;
}

function updateCharacterCounter() {
  const textarea =
    modal?.querySelector(
      "#contact-message-body"
    );

  const counter =
    modal?.querySelector(
      "#contact-message-counter"
    );

  if (
    !textarea ||
    !counter
  ) {
    return;
  }

  counter.textContent =
    `${textarea.value.length} / 2000`;
}

/* ==================================================
   ENVIAR
================================================== */

async function submitMessage(event) {
  event.preventDefault();

  if (
    isSubmitting ||
    !form.reportValidity()
  ) {
    return;
  }

  hideStatus();
  setSubmitting(true);

  const formData =
    new FormData(form);

  try {
    const {
      error
    } = await supabaseClient.rpc(
      "submit_profile_message",
      {
        p_name:
          formData.get("name"),

        p_email:
          formData.get("email"),

        p_phone:
          formData.get("phone"),

        p_message:
          formData.get("message"),

        p_website:
          formData.get("website"),

        p_client_token:
          getClientToken()
      }
    );

    if (error) {
      throw error;
    }

    form.reset();

    updateCharacterCounter();

    setSubmitting(false);

    closeModal();

    showToast(
      "Mensagem enviada com sucesso."
    );
  } catch (error) {
    console.error(
      "Não foi possível enviar a mensagem:",
      error
    );

    const errorMessage =
      String(
        error?.message || ""
      );

    if (
      errorMessage.includes(
        "Please wait"
      )
    ) {
      showStatus(
        "Aguarda alguns minutos antes de enviares outra mensagem."
      );
    } else if (
      errorMessage.includes(
        "Invalid email"
      )
    ) {
      showStatus(
        "Confirma o endereço de email."
      );
    } else {
      showStatus(
        "Não foi possível enviar a mensagem. Tenta novamente."
      );
    }

    setSubmitting(false);
  }
}

/* ==================================================
   EVENTOS
================================================== */

function attachEvents() {
  openButton?.addEventListener(
    "click",
    openModal
  );

  form?.addEventListener(
    "submit",
    submitMessage
  );

  modal
    ?.querySelectorAll(
      "[data-message-close]"
    )
    .forEach((element) => {
      element.addEventListener(
        "click",
        closeModal
      );
    });

  modal
    ?.querySelector(
      "#contact-message-body"
    )
    ?.addEventListener(
      "input",
      updateCharacterCounter
    );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        modal &&
        !modal.hidden
      ) {
        closeModal();
      }
    }
  );
}

function initialiseMessageForm() {
  if (IS_ADMIN_PREVIEW) {
    return;
  }

  createMessageInterface();
  attachEvents();
  updateCharacterCounter();
}

initialiseMessageForm();