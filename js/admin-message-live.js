import {
  supabaseClient
} from "./supabase-client.js";

const PROFILE_ID =
  "identityhub-pro";

const SECTION_SELECTOR =
  "#admin-messages-section";

let realtimeChannel = null;
let currentNewCount = 0;
let controlsCreated = false;

/* ==================================================
   UTILITÁRIOS
================================================== */

function wait(milliseconds) {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

async function waitForMessagesSection() {
  for (
    let attempt = 0;
    attempt < 40;
    attempt += 1
  ) {
    const section =
      document.querySelector(
        SECTION_SELECTOR
      );

    if (section) {
      return section;
    }

    await wait(100);
  }

  return null;
}

function formatNumber(value) {
  return new Intl.NumberFormat(
    "pt-PT"
  ).format(
    Number(value) || 0
  );
}

/* ==================================================
   CONTROLOS VISUAIS
================================================== */

function createLiveControls(section) {
  if (
    controlsCreated ||
    document.querySelector(
      "#admin-message-live-controls"
    )
  ) {
    return;
  }

  const heading =
    section.querySelector(
      ".admin-messages__heading"
    );

  const refreshButton =
    section.querySelector(
      "#refresh-admin-messages"
    );

  if (!heading) {
    return;
  }

  const controls =
    document.createElement("div");

  controls.id =
    "admin-message-live-controls";

  controls.className =
    "admin-message-live-controls";

  controls.innerHTML = `
    <div
      class="admin-message-live-status"
      id="admin-message-live-status"
      data-status="connecting"
    >
      <span
        class="admin-message-live-status__dot"
        aria-hidden="true"
      ></span>

      <span id="admin-message-live-status-text">
        A ligar…
      </span>
    </div>

    <div
      class="admin-message-live-counter"
      id="admin-message-live-counter"
      aria-label="Mensagens novas"
      hidden
    >
      <span aria-hidden="true">
        ✉
      </span>

      <strong id="admin-message-live-count">
        0
      </strong>
    </div>

    <button
      class="admin-button admin-button--secondary"
      id="enable-message-notifications"
      type="button"
    >
      Ativar notificações
    </button>
  `;

  heading.appendChild(
    controls
  );

  if (refreshButton) {
    controls.appendChild(
      refreshButton
    );
  }

  controls
    .querySelector(
      "#enable-message-notifications"
    )
    ?.addEventListener(
      "click",
      requestNotificationPermission
    );

  controlsCreated = true;

  updateNotificationButton();
}

function setLiveStatus(
  status,
  text
) {
  const container =
    document.querySelector(
      "#admin-message-live-status"
    );

  const label =
    document.querySelector(
      "#admin-message-live-status-text"
    );

  if (container) {
    container.dataset.status =
      status;
  }

  if (label) {
    label.textContent =
      text;
  }
}

function updateMessageCounter(count) {
  currentNewCount =
    Number(count) || 0;

  const counter =
    document.querySelector(
      "#admin-message-live-counter"
    );

  const value =
    document.querySelector(
      "#admin-message-live-count"
    );

  if (!counter || !value) {
    return;
  }

  value.textContent =
    formatNumber(
      currentNewCount
    );

  counter.hidden =
    currentNewCount === 0;

  document.title =
    currentNewCount > 0
      ? `(${currentNewCount}) IdentityHub Pro`
      : "IdentityHub Pro";
}

/* ==================================================
   NOTIFICAÇÕES DO NAVEGADOR
================================================== */

function notificationsSupported() {
  return (
    "Notification" in window
  );
}

function updateNotificationButton() {
  const button =
    document.querySelector(
      "#enable-message-notifications"
    );

  if (!button) {
    return;
  }

  if (!notificationsSupported()) {
    button.textContent =
      "Notificações indisponíveis";

    button.disabled = true;

    return;
  }

  if (
    Notification.permission ===
    "granted"
  ) {
    button.textContent =
      "Notificações ativas";

    button.disabled = true;

    return;
  }

  if (
    Notification.permission ===
    "denied"
  ) {
    button.textContent =
      "Notificações bloqueadas";

    button.disabled = true;

    return;
  }

  button.textContent =
    "Ativar notificações";

  button.disabled = false;
}

async function requestNotificationPermission() {
  if (!notificationsSupported()) {
    return;
  }

  try {
    await Notification.requestPermission();

    updateNotificationButton();
  } catch (error) {
    console.warn(
      "Não foi possível ativar as notificações:",
      error
    );
  }
}

function showBrowserNotification(message) {
  if (
    !notificationsSupported() ||
    Notification.permission !==
      "granted"
  ) {
    return;
  }

  const senderName =
    message?.name ||
    "Novo contacto";

  const notification =
    new Notification(
      "Nova mensagem recebida",
      {
        body:
          `${senderName} enviou uma mensagem através do cartão.`,

        icon:
          "./assets/icons/icon-192.png",

        badge:
          "./assets/icons/icon-192.png",

        tag:
          "identityhub-new-message",

        renotify: true
      }
    );

  notification.addEventListener(
    "click",
    () => {
      window.focus();

      document
        .querySelector(
          SECTION_SELECTOR
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      notification.close();
    }
  );
}

/* ==================================================
   RESUMO DA CAIXA
================================================== */

async function loadMessageSummary() {
  try {
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_profile_admin_message_summary"
    );

    if (error) {
      throw error;
    }

    const summary =
      Array.isArray(data)
        ? data[0]
        : data;

    updateMessageCounter(
      summary?.new_count || 0
    );
  } catch (error) {
    console.error(
      "Não foi possível carregar o resumo das mensagens:",
      error
    );
  }
}

/* ==================================================
   EVENTO PARA ATUALIZAR A CAIXA
================================================== */

function dispatchMessagesChanged(
  reason,
  record = null
) {
  window.dispatchEvent(
    new CustomEvent(
      "identityhub:messageschanged",
      {
        detail: {
          reason,
          record
        }
      }
    )
  );
}

/* ==================================================
   REALTIME
================================================== */

function handleNewMessage(payload) {
  const message =
    payload.new || {};

  updateMessageCounter(
    currentNewCount + 1
  );

  dispatchMessagesChanged(
    "insert",
    message
  );

  if (document.hidden) {
    showBrowserNotification(
      message
    );
  }
}

function handleUpdatedMessage(payload) {
  dispatchMessagesChanged(
    "update",
    payload.new || null
  );

  void loadMessageSummary();
}

function subscribeToMessages() {
  if (realtimeChannel) {
    supabaseClient.removeChannel(
      realtimeChannel
    );
  }

  setLiveStatus(
    "connecting",
    "A ligar…"
  );

  realtimeChannel =
    supabaseClient
      .channel(
        "identityhub-admin-messages"
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table:
            "profile_messages",
          filter:
            `profile_id=eq.${PROFILE_ID}`
        },
        handleNewMessage
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table:
            "profile_messages",
          filter:
            `profile_id=eq.${PROFILE_ID}`
        },
        handleUpdatedMessage
      )
      .subscribe(
        (status) => {
          if (
            status ===
            "SUBSCRIBED"
          ) {
            setLiveStatus(
              "connected",
              "Tempo real ativo"
            );

            return;
          }

          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            setLiveStatus(
              "error",
              "Ligação interrompida"
            );

            return;
          }

          if (
            status ===
            "CLOSED"
          ) {
            setLiveStatus(
              "offline",
              "Desligado"
            );
          }
        }
      );
}

/* ==================================================
   INICIALIZAÇÃO
================================================== */

async function initialiseLiveMessages() {
  const section =
    await waitForMessagesSection();

  if (!section) {
    console.warn(
      "A caixa de mensagens não foi encontrada."
    );

    return;
  }

  createLiveControls(
    section
  );

  const {
    data,
    error
  } =
    await supabaseClient.auth
      .getSession();

  if (error) {
    setLiveStatus(
      "error",
      "Sessão indisponível"
    );

    return;
  }

  if (data.session) {
    await loadMessageSummary();

    subscribeToMessages();
  }

  supabaseClient.auth
    .onAuthStateChange(
      (_event, session) => {
        window.setTimeout(
          async () => {
            if (session) {
              await loadMessageSummary();

              subscribeToMessages();
            } else {
              updateMessageCounter(0);

              setLiveStatus(
                "offline",
                "Desligado"
              );

              if (
                realtimeChannel
              ) {
                supabaseClient
                  .removeChannel(
                    realtimeChannel
                  );

                realtimeChannel =
                  null;
              }
            }
          },
          0
        );
      }
    );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        void loadMessageSummary();
      }
    }
  );

  window.addEventListener(
    "beforeunload",
    () => {
      if (realtimeChannel) {
        supabaseClient.removeChannel(
          realtimeChannel
        );
      }
    }
  );
}

initialiseLiveMessages();
