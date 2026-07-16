import {
  supabaseClient
} from "./supabase-client.js";

import {
  getLanguage,
  t
} from "./i18n.js";

const VISIT_DAY_STORAGE_KEY =
  "identityhub-last-counted-day";

const LAST_TOTAL_STORAGE_KEY =
  "identityhub-last-visit-total";

let currentTotal = 0;
let animationFrameId = null;

function getLocalDay() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(
      key,
      String(value)
    );

    return true;
  } catch {
    return false;
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    console.info(
      `Não foi possível remover ${key}.`
    );
  }
}

function getNumberFormatter() {
  const locale =
    getLanguage() === "pt"
      ? "pt-PT"
      : "en-US";

  return new Intl.NumberFormat(locale);
}

function getVisitLabel(total) {
  return total === 1
    ? t("stats.visit")
    : t("stats.visits");
}

function updateAccessibility(counter, total) {
  const formattedTotal =
    getNumberFormatter().format(total);

  const label =
    getVisitLabel(total);

  counter.setAttribute(
    "aria-label",
    `${formattedTotal} ${label}`
  );
}

function renderVisitLabel(total) {
  const labelElement =
    document.querySelector(
      "#visit-label"
    );

  if (!labelElement) {
    return;
  }

  labelElement.textContent =
    getVisitLabel(total);
}

function animateVisitTotal(element, total) {
  if (animationFrameId) {
    cancelAnimationFrame(
      animationFrameId
    );
  }

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (reducedMotion || total <= 0) {
    element.textContent =
      getNumberFormatter().format(total);

    return;
  }

  const duration = 850;
  const startTime = performance.now();

  function animationStep(currentTime) {
    const elapsed =
      currentTime - startTime;

    const progress = Math.min(
      elapsed / duration,
      1
    );

    const easedProgress =
      1 - Math.pow(1 - progress, 3);

    const visibleTotal =
      Math.round(
        total * easedProgress
      );

    element.textContent =
      getNumberFormatter().format(
        visibleTotal
      );

    if (progress < 1) {
      animationFrameId =
        requestAnimationFrame(
          animationStep
        );
    }
  }

  animationFrameId =
    requestAnimationFrame(
      animationStep
    );
}

function renderCounter(
  total,
  {
    animate = true
  } = {}
) {
  const counter =
    document.querySelector(
      "#profile-views"
    );

  const totalElement =
    document.querySelector(
      "#visit-count"
    );

  if (!counter || !totalElement) {
    console.warn(
      "O elemento do contador não foi encontrado no index.html."
    );

    return;
  }

  currentTotal = total;

  counter.hidden = false;

  if (animate) {
    animateVisitTotal(
      totalElement,
      total
    );
  } else {
    totalElement.textContent =
      getNumberFormatter().format(total);
  }

  renderVisitLabel(total);

  updateAccessibility(
    counter,
    total
  );
}

function renderUnavailableCounter() {
  const counter =
    document.querySelector(
      "#profile-views"
    );

  const totalElement =
    document.querySelector(
      "#visit-count"
    );

  const labelElement =
    document.querySelector(
      "#visit-label"
    );

  if (
    !counter ||
    !totalElement ||
    !labelElement
  ) {
    return;
  }

  counter.hidden = false;

  totalElement.textContent = "—";

  labelElement.textContent =
    t("stats.unavailable");

  counter.setAttribute(
    "aria-label",
    t("stats.unavailable")
  );
}

function readSavedTotal() {
  const storedValue =
    readStorage(
      LAST_TOTAL_STORAGE_KEY
    );

  if (storedValue === null) {
    return null;
  }

  const numericValue =
    Number(storedValue);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
}

async function requestVisitTotal() {
  const today = getLocalDay();

  const previousVisitDay =
    readStorage(
      VISIT_DAY_STORAGE_KEY
    );

  const shouldRegisterVisit =
    previousVisitDay !== today;

  if (shouldRegisterVisit) {
    writeStorage(
      VISIT_DAY_STORAGE_KEY,
      today
    );
  }

  const functionName =
    shouldRegisterVisit
      ? "register_profile_visit"
      : "get_profile_views";

  const {
    data,
    error
  } = await supabaseClient.rpc(
    functionName
  );

  if (error) {
    if (shouldRegisterVisit) {
      if (previousVisitDay) {
        writeStorage(
          VISIT_DAY_STORAGE_KEY,
          previousVisitDay
        );
      } else {
        removeStorage(
          VISIT_DAY_STORAGE_KEY
        );
      }
    }

    throw error;
  }

  const total = Number(data);

  if (!Number.isFinite(total)) {
    throw new Error(
      "O Supabase devolveu um total de visitas inválido."
    );
  }

  writeStorage(
    LAST_TOTAL_STORAGE_KEY,
    total
  );

  return total;
}

function setupLanguageUpdates() {
  window.addEventListener(
    "identityhub:languagechange",
    () => {
      renderCounter(
        currentTotal,
        {
          animate: false
        }
      );
    }
  );
}

export async function setupVisitCounter() {
  setupLanguageUpdates();

  try {
    const total =
      await requestVisitTotal();

    renderCounter(total);
  } catch (error) {
    console.error(
      "Não foi possível carregar o contador:",
      error
    );

    const savedTotal =
      readSavedTotal();

    if (savedTotal !== null) {
      renderCounter(
        savedTotal,
        {
          animate: false
        }
      );

      return;
    }

    renderUnavailableCounter();
  }
}