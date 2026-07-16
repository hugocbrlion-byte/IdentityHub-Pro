import { getProfileUrl } from "./profile-url.js";
import { t } from "./i18n.js";

async function copyText(text) {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      text
    );

    return;
  }

  const textarea =
    document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute(
    "readonly",
    ""
  );

  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);

  textarea.select();

  document.execCommand("copy");

  textarea.remove();
}

export async function shareProfile(profile) {
  const url = getProfileUrl(profile);

  const shareData = {
    title:
      `${profile.name} | IdentityHub Pro`,

    text: t(
      "share.text",
      {
        name: profile.name,
        tagline: profile.tagline
      }
    ),

    url
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);

      return {
        status: "shared"
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return {
          status: "cancelled"
        };
      }

      console.error(
        "Erro na partilha nativa:",
        error
      );
    }
  }

  await copyText(url);

  return {
    status: "copied"
  };
}