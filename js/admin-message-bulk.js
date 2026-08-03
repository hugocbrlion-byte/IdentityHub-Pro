import {
  supabaseClient
} from "./supabase-client.js";

const SECTION_SELECTOR =
  "#admin-messages-section";

const LIST_SELECTOR =
  "#admin-message-list";

const selectedMessageIds =
  new Set();

let observer = null;
let bulkInterface = null;

/* ==================================================
   ESPERAR PELA CAIXA DE MENSAGENS
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
    attempt < 50;
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

/* ==================================================
   CRIAR INTERFACE
================================================== */

function createBulkInterface(
  section
) {
  if (
    document.querySelector(
      "#admin-message-bulk"
    )
  ) {
    bulkInterface =
      document.querySelector(
        "#admin-message-bulk"
      );

    return;
  }

  bulkInterface =
    document.createElement(
      "div"
    );

  bulkInterface.id =
    "admin-message-bulk";

  bulkInterface.className =
    "admin-message-bulk";

  bulkInterface.innerHTML = `
    <div class="admin-message-bulk__selection">

      <label class="admin-message-bulk__select-all">
        <input
          type="checkbox"
          id="admin-message-select-all"
        >

        <span>
          Selecionar todas
        </span>
      </label>

      <strong id="admin-message-selected-count">
        0 selecionadas
      </strong>

    </div>

    <div
      class="admin-message-bulk__actions"
      id="admin-message-active-actions"
      hidden
    >
      <button
        type="button"
        data-bulk-message-action="mark_read"
      >
        Marcar como lidas
      </button>

      <button
        type="button"
        data-bulk-message-action="archive"
      >
        Arquivar
      </button>

      <button
        type="button"
        class="admin-message-bulk__trash"
        data-bulk-message-action="trash"
      >
        Mover para o lixo
      </button>
    </div>

    <div
      class="admin-message-bulk__actions"
      id="admin-message-trash-actions"
      hidden
    >
      <button
        type="button"
        class="admin-message-bulk__restore"
        data-bulk-message-action="restore"
      >
        Restaurar
      </button>

      <button
        type="button"
        class="admin-message-bulk__delete"
        data-bulk-message-action="delete_permanently"
      >
        Eliminar definitivamente
      </button>
    </div>

    <button
      type="button"
      class="admin-message-bulk__empty-trash"
      id="empty-message-trash"
      hidden
    >
      Esvaziar lixo
    </button>

    <p
      class="admin-message-bulk__status"
      id="admin-message-bulk-status"
      role="status"
      hidden
    ></p>
  `;

  const results =
    section.querySelector(
      ".admin-message-results"
    );

  const list =
    section.querySelector(
      LIST_SELECTOR
    );

  if (results) {
    results.insertAdjacentElement(
      "afterend",
      bulkInterface
    );
  } else if (list) {
    list.insertAdjacentElement(
      "beforebegin",
      bulkInterface
    );
  } else {
    section.appendChild(
      bulkInterface
    );
  }

  attachBulkEvents();
  updateBulkInterface();
}

/* ==================================================
   CARTÕES E SELEÇÃO
================================================== */

function getMessageCards() {
  return [
    ...document.querySelectorAll(
      `${LIST_SELECTOR} .admin-message-card`
    )
  ];
}

function isDeletedCard(card) {
  return card.classList.contains(
    "admin-message-card--deleted"
  );
}

function addSelectionToCard(
  card
) {
  if (
    card.querySelector(
      ".admin-message-select"
    )
  ) {
    return;
  }

  const messageId =
    card.dataset.messageId;

  const header =
    card.querySelector(
      "header"
    );

  if (
    !messageId ||
    !header
  ) {
    return;
  }

  const label =
    document.createElement(
      "label"
    );

  label.className =
    "admin-message-select";

  label.innerHTML = `
    <input
      type="checkbox"
      value="${messageId}"
      aria-label="Selecionar mensagem"
    >

    <span aria-hidden="true"></span>
  `;

  const checkbox =
    label.querySelector(
      "input"
    );

  checkbox.checked =
    selectedMessageIds.has(
      messageId
    );

  checkbox.addEventListener(
    "change",
    () => {
      if (checkbox.checked) {
        selectedMessageIds.add(
          messageId
        );
      } else {
        selectedMessageIds.delete(
          messageId
        );
      }

      updateBulkInterface();
    }
  );

  header.prepend(
    label
  );
}

function synchroniseCards() {
  const cards =
    getMessageCards();

  const visibleIds =
    new Set(
      cards
        .map(
          (card) =>
            card.dataset.messageId
        )
        .filter(Boolean)
    );

  [
    ...selectedMessageIds
  ].forEach(
    (messageId) => {
      if (
        !visibleIds.has(
          messageId
        )
      ) {
        selectedMessageIds.delete(
          messageId
        );
      }
    }
  );

  cards.forEach(
    addSelectionToCard
  );

  updateBulkInterface();
}

/* ==================================================
   ESTADO DA INTERFACE
================================================== */

function getSelectedCards() {
  return getMessageCards()
    .filter(
      (card) =>
        selectedMessageIds.has(
          card.dataset.messageId
        )
    );
}

function isTrashView() {
  return Boolean(
    document.querySelector(
      '[data-message-filter="deleted"][aria-pressed="true"]'
    )
  );
}

function updateBulkInterface() {
  if (!bulkInterface) {
    return;
  }

  const selectedCards =
    getSelectedCards();

  const selectedCount =
    selectedCards.length;

  const allSelectedDeleted =
    selectedCount > 0 &&
    selectedCards.every(
      isDeletedCard
    );

  const allSelectedActive =
    selectedCount > 0 &&
    selectedCards.every(
      (card) =>
        !isDeletedCard(card)
    );

  const count =
    document.querySelector(
      "#admin-message-selected-count"
    );

  if (count) {
    count.textContent =
      selectedCount === 1
        ? "1 selecionada"
        : `${selectedCount} selecionadas`;
  }

  const activeActions =
    document.querySelector(
      "#admin-message-active-actions"
    );

  const trashActions =
    document.querySelector(
      "#admin-message-trash-actions"
    );

  if (activeActions) {
    activeActions.hidden =
      !allSelectedActive;
  }

  if (trashActions) {
    trashActions.hidden =
      !allSelectedDeleted;
  }

  const cards =
    getMessageCards();

  const selectAll =
    document.querySelector(
      "#admin-message-select-all"
    );

  if (selectAll) {
    const selectedVisible =
      cards.filter(
        (card) =>
          selectedMessageIds.has(
            card.dataset.messageId
          )
      ).length;

    selectAll.checked =
      cards.length > 0 &&
      selectedVisible ===
        cards.length;

    selectAll.indeterminate =
      selectedVisible > 0 &&
      selectedVisible <
        cards.length;

    selectAll.disabled =
      cards.length === 0;
  }

  const emptyTrash =
    document.querySelector(
      "#empty-message-trash"
    );

  if (emptyTrash) {
    emptyTrash.hidden =
      !isTrashView();
  }
}

/* ==================================================
   MENSAGENS DE ESTADO
================================================== */

function showBulkStatus(
  text,
  type = "success"
) {
  const status =
    document.querySelector(
      "#admin-message-bulk-status"
    );

  if (!status) {
    return;
  }

  status.textContent = text;
  status.dataset.type = type;
  status.hidden = false;
}

function hideBulkStatus() {
  const status =
    document.querySelector(
      "#admin-message-bulk-status"
    );

  if (!status) {
    return;
  }

  status.textContent = "";
  status.hidden = true;

  delete status.dataset.type;
}

/* ==================================================
   LIMPAR SELEÇÃO
================================================== */

function clearSelection() {
  selectedMessageIds.clear();

  document
    .querySelectorAll(
      ".admin-message-select input"
    )
    .forEach(
      (checkbox) => {
        checkbox.checked = false;
      }
    );

  updateBulkInterface();
}

/* ==================================================
   CONFIRMAÇÕES
================================================== */

function getActionConfirmation(
  action
) {
  if (action === "trash") {
    return window.confirm(
      "Mover as mensagens selecionadas para o lixo?\n\nPoderão ser restauradas posteriormente."
    );
  }

  if (
    action ===
    "delete_permanently"
  ) {
    const confirmation =
      window.prompt(
        "Esta ação é irreversível.\n\nEscreve ELIMINAR para apagar definitivamente as mensagens selecionadas."
      );

    return confirmation ===
      "ELIMINAR"
      ? confirmation
      : null;
  }

  return true;
}

/* ==================================================
   EXECUTAR AÇÃO EM MASSA
================================================== */

async function runBulkAction(
  action,
  button
) {
  const messageIds = [
    ...selectedMessageIds
  ];

  if (
    messageIds.length === 0
  ) {
    return;
  }

  const confirmation =
    getActionConfirmation(
      action
    );

  if (
    confirmation === false ||
    confirmation === null
  ) {
    return;
  }

  hideBulkStatus();

  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    "A processar…";

  try {
    const {
      data: sessionData,
      error: sessionError
    } =
      await supabaseClient.auth
        .getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.session) {
      throw new Error(
        "A sessão terminou. Inicia sessão novamente."
      );
    }

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "bulk_manage_profile_messages",
      {
        p_message_ids:
          messageIds,

        p_action:
          action,

        p_confirmation:
          action ===
            "delete_permanently"
            ? confirmation
            : ""
      }
    );

    if (error) {
      throw error;
    }

    const affected =
      Number(data) || 0;

    clearSelection();

    showBulkStatus(
      affected === 1
        ? "1 mensagem atualizada."
        : `${affected} mensagens atualizadas.`
    );

    window.dispatchEvent(
      new CustomEvent(
        "identityhub:messageschanged",
        {
          detail: {
            reason:
              "bulk-action",

            action,

            affected
          }
        }
      )
    );
  } catch (error) {
    console.error(
      "Não foi possível executar a ação em massa:",
      error
    );

    showBulkStatus(
      error.message ||
        "Não foi possível atualizar as mensagens.",
      "error"
    );
  } finally {
    button.disabled = false;
    button.textContent =
      originalText;
  }
}

/* ==================================================
   ESVAZIAR LIXO
================================================== */

async function emptyTrash(
  button
) {
  const confirmation =
    window.prompt(
      "Todas as mensagens que estão no lixo serão eliminadas definitivamente.\n\nEscreve ELIMINAR para continuar."
    );

  if (
    confirmation !==
    "ELIMINAR"
  ) {
    return;
  }

  hideBulkStatus();

  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent =
    "A eliminar…";

  try {
    const {
      data,
      error
    } = await supabaseClient.rpc(
      "empty_profile_message_trash",
      {
        p_confirmation:
          confirmation
      }
    );

    if (error) {
      throw error;
    }

    const affected =
      Number(data) || 0;

    clearSelection();

    showBulkStatus(
      affected === 1
        ? "1 mensagem eliminada definitivamente."
        : `${affected} mensagens eliminadas definitivamente.`
    );

    window.dispatchEvent(
      new CustomEvent(
        "identityhub:messageschanged",
        {
          detail: {
            reason:
              "empty-trash",

            affected
          }
        }
      )
    );
  } catch (error) {
    console.error(
      "Não foi possível esvaziar o lixo:",
      error
    );

    showBulkStatus(
      error.message ||
        "Não foi possível esvaziar o lixo.",
      "error"
    );
  } finally {
    button.disabled = false;
    button.textContent =
      originalText;
  }
}

/* ==================================================
   EVENTOS
================================================== */

function attachBulkEvents() {
  document
    .querySelector(
      "#admin-message-select-all"
    )
    ?.addEventListener(
      "change",
      (event) => {
        const checked =
          event.target.checked;

        getMessageCards()
          .forEach(
            (card) => {
              const messageId =
                card.dataset.messageId;

              const checkbox =
                card.querySelector(
                  ".admin-message-select input"
                );

              if (!messageId) {
                return;
              }

              if (checked) {
                selectedMessageIds.add(
                  messageId
                );
              } else {
                selectedMessageIds.delete(
                  messageId
                );
              }

              if (checkbox) {
                checkbox.checked =
                  checked;
              }
            }
          );

        updateBulkInterface();
      }
    );

  document
    .querySelectorAll(
      "[data-bulk-message-action]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            runBulkAction(
              button.dataset
                .bulkMessageAction,
              button
            );
          }
        );
      }
    );

  document
    .querySelector(
      "#empty-message-trash"
    )
    ?.addEventListener(
      "click",
      (event) => {
        emptyTrash(
          event.currentTarget
        );
      }
    );

  document
    .querySelectorAll(
      "[data-message-filter]"
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            clearSelection();

            window.setTimeout(
              updateBulkInterface,
              50
            );
          }
        );
      }
    );
}

/* ==================================================
   OBSERVAR NOVOS CARTÕES
================================================== */

function observeMessageList() {
  const list =
    document.querySelector(
      LIST_SELECTOR
    );

  if (!list) {
    return;
  }

  observer =
    new MutationObserver(
      () => {
        synchroniseCards();
      }
    );

  observer.observe(
    list,
    {
      childList: true
    }
  );

  synchroniseCards();
}

/* ==================================================
   INICIALIZAÇÃO
================================================== */

async function initialiseBulkMessages() {
  const section =
    await waitForMessagesSection();

  if (!section) {
    console.warn(
      "A caixa de mensagens não foi encontrada."
    );

    return;
  }

  createBulkInterface(
    section
  );

  observeMessageList();

  window.addEventListener(
    "identityhub:messageschanged",
    () => {
      clearSelection();

      window.setTimeout(
        synchroniseCards,
        150
      );
    }
  );

  window.addEventListener(
    "beforeunload",
    () => {
      observer?.disconnect();
    }
  );
}

initialiseBulkMessages();