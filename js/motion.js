import { showToast } from "./toast.js";

const MAX_ROTATION = 5;
const MAX_AVATAR_SHIFT = 7;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function supportsReducedMotion() {
  return window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
}

function isFinePointerDevice() {
  return window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
}

function isIOSPermissionRequired() {
  return (
    typeof window.DeviceOrientationEvent !== "undefined" &&
    typeof window.DeviceOrientationEvent.requestPermission ===
      "function"
  );
}

function setMotionValues(
  card,
  rotateX,
  rotateY,
  spotlightX = 50,
  spotlightY = 50
) {
  card.style.setProperty(
    "--rotate-x",
    `${rotateX.toFixed(2)}deg`
  );

  card.style.setProperty(
    "--rotate-y",
    `${rotateY.toFixed(2)}deg`
  );

  card.style.setProperty(
    "--avatar-x",
    `${(rotateY * 1.25).toFixed(2)}px`
  );

  card.style.setProperty(
    "--avatar-y",
    `${(-rotateX * 1.25).toFixed(2)}px`
  );

  card.style.setProperty(
    "--spotlight-x",
    `${spotlightX.toFixed(1)}%`
  );

  card.style.setProperty(
    "--spotlight-y",
    `${spotlightY.toFixed(1)}%`
  );
}

function resetMotion(card) {
  card.classList.add("card--resetting");

  setMotionValues(card, 0, 0, 50, 50);

  window.setTimeout(() => {
    card.classList.remove("card--resetting");
  }, 450);
}

function setupPointerMotion(card) {
  if (!isFinePointerDevice()) {
    return;
  }

  card.addEventListener("pointermove", (event) => {
    const bounds = card.getBoundingClientRect();

    const relativeX =
      (event.clientX - bounds.left) / bounds.width;

    const relativeY =
      (event.clientY - bounds.top) / bounds.height;

    const normalisedX = relativeX - 0.5;
    const normalisedY = relativeY - 0.5;

    const rotateY =
      clamp(normalisedX * MAX_ROTATION * 2, -MAX_ROTATION, MAX_ROTATION);

    const rotateX =
      clamp(-normalisedY * MAX_ROTATION * 2, -MAX_ROTATION, MAX_ROTATION);

    setMotionValues(
      card,
      rotateX,
      rotateY,
      relativeX * 100,
      relativeY * 100
    );
  });

  card.addEventListener("pointerleave", () => {
    resetMotion(card);
  });
}

function createOrientationHandler(card) {
  return (event) => {
    if (
      typeof event.beta !== "number" ||
      typeof event.gamma !== "number"
    ) {
      return;
    }

    /*
     * gamma: movimento esquerda/direita
     * beta: movimento frente/trás
     */
    const horizontal = clamp(
      event.gamma / 30,
      -1,
      1
    );

    const vertical = clamp(
      (event.beta - 45) / 35,
      -1,
      1
    );

    const rotateY = horizontal * MAX_ROTATION;
    const rotateX = -vertical * MAX_ROTATION;

    const spotlightX = 50 + horizontal * 28;
    const spotlightY = 50 + vertical * 28;

    setMotionValues(
      card,
      rotateX,
      rotateY,
      spotlightX,
      spotlightY
    );
  };
}

function enableOrientationMotion(card) {
  const orientationHandler =
    createOrientationHandler(card);

  window.addEventListener(
    "deviceorientation",
    orientationHandler,
    true
  );

  card.classList.add("card--motion-active");
}

function prepareIOSPermission(card, trigger) {
  trigger.setAttribute("role", "button");
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute(
    "aria-label",
    "Ativar efeito de movimento"
  );

  trigger.classList.add("motion-trigger");

  if (!sessionStorage.getItem("motion-hint-shown")) {
    window.setTimeout(() => {
      showToast(
        "No iPhone, toca na fotografia para ativar o efeito 3D."
      );
    }, 1200);

    sessionStorage.setItem(
      "motion-hint-shown",
      "true"
    );
  }

  async function requestMotionPermission() {
    try {
      const permission =
        await window.DeviceOrientationEvent.requestPermission();

      if (permission === "granted") {
        enableOrientationMotion(card);

        trigger.classList.remove("motion-trigger");

        trigger.removeAttribute("role");
        trigger.removeAttribute("tabindex");
        trigger.removeAttribute("aria-label");

        showToast("Efeito de movimento ativado.");
      } else {
        showToast(
          "A permissão de movimento não foi concedida.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Erro ao ativar o movimento:",
        error
      );

      showToast(
        "Não foi possível ativar o movimento.",
        "error"
      );
    }
  }

  trigger.addEventListener(
    "click",
    requestMotionPermission
  );

  trigger.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      requestMotionPermission();
    }
  });
}

export function setupMotionEffects() {
  const card = document.querySelector(
    "#profile-card"
  );

  const avatar = document.querySelector(
    ".avatar-wrapper"
  );

  if (!card || !avatar) {
    console.warn(
      "Não foi possível iniciar o Motion Engine."
    );

    return;
  }

  if (supportsReducedMotion()) {
    console.info(
      "Efeitos de movimento reduzidos por preferência do utilizador."
    );

    return;
  }

  setMotionValues(card, 0, 0, 50, 50);

  setupPointerMotion(card);

  if (
    typeof window.DeviceOrientationEvent ===
    "undefined"
  ) {
    return;
  }

  if (isIOSPermissionRequired()) {
    prepareIOSPermission(card, avatar);
    return;
  }

  enableOrientationMotion(card);
}