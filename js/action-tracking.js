import {
  supabaseClient
} from "./supabase-client.js";

const IS_ADMIN_PREVIEW =
  new URLSearchParams(
    window.location.search
  ).get("preview") === "1";

const ALLOWED_ACTIONS =
  new Set([
    "phone",
    "whatsapp",
    "email",
    "instagram",
    "steam"
  ]);

const recentlyTracked =
  new WeakSet();

async function registerActionClick(
  actionKey
) {
  try {
    const {
      error
    } = await supabaseClient.rpc(
      "register_profile_action_click",
      {
        p_action_key:
          actionKey
      }
    );

    if (error) {
      throw error;
    }
  } catch (error) {
    /*
     * Uma falha nas estatísticas nunca deve
     * impedir o visitante de abrir o contacto.
     */
    console.warn(
      "Não foi possível registar a interação:",
      error
    );
  }
}

function findActionElement(event) {
  const target =
    event.target;

  if (
    !(target instanceof Element)
  ) {
    return null;
  }

  return target.closest(
    "[data-action]"
  );
}

function trackAction(event) {
  if (IS_ADMIN_PREVIEW) {
    return;
  }

  const actionElement =
    findActionElement(event);

  if (!actionElement) {
    return;
  }

  const actionKey =
    actionElement.dataset.action;

  if (
    !ALLOWED_ACTIONS.has(
      actionKey
    )
  ) {
    return;
  }

  /*
   * Evita contar pointerdown e click
   * como duas interações diferentes.
   */
  if (
    recentlyTracked.has(
      actionElement
    )
  ) {
    return;
  }

  recentlyTracked.add(
    actionElement
  );

  window.setTimeout(
    () => {
      recentlyTracked.delete(
        actionElement
      );
    },
    1500
  );

  void registerActionClick(
    actionKey
  );
}

function initialiseActionTracking() {
  if (IS_ADMIN_PREVIEW) {
    return;
  }

  /*
   * O pointerdown inicia o pedido antes de o
   * navegador abrir o telefone ou aplicação externa.
   */
  document.addEventListener(
    "pointerdown",
    trackAction,
    {
      capture: true,
      passive: true
    }
  );

  /*
   * Permite contar ativações feitas através
   * do teclado, onde não existe pointerdown.
   */
  document.addEventListener(
    "click",
    (event) => {
      if (event.detail === 0) {
        trackAction(event);
      }
    },
    true
  );
}

initialiseActionTracking();