let hideTimeout;

export function showToast(message, type = "success") {
  const toast = document.querySelector("#toast");

  if (!toast) {
    return;
  }

  window.clearTimeout(hideTimeout);

  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add("toast--visible");

  hideTimeout = window.setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 2800);
}