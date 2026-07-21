import {
  supabaseClient
} from "./supabase-client.js";

const PROFILE_ID = "identityhub-pro";
const STORAGE_BUCKET = "profile-images";
const STORAGE_PATH = "identityhub-pro/profile.webp";

const MAX_SOURCE_SIZE =
  12 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const fileInput =
  document.querySelector(
    "#photo-file-input"
  );

const selectButton =
  document.querySelector(
    "#select-photo-button"
  );

const currentPhoto =
  document.querySelector(
    "#admin-photo-preview"
  );

const modal =
  document.querySelector(
    "#photo-crop-modal"
  );

const cropImage =
  document.querySelector(
    "#photo-crop-image"
  );

const rotateLeftButton =
  document.querySelector(
    "#photo-rotate-left"
  );

const rotateRightButton =
  document.querySelector(
    "#photo-rotate-right"
  );

const resetButton =
  document.querySelector(
    "#photo-reset-crop"
  );

const saveButton =
  document.querySelector(
    "#save-photo-button"
  );

const saveText =
  document.querySelector(
    "#save-photo-text"
  );

const saveSpinner =
  document.querySelector(
    "#save-photo-spinner"
  );

const uploadMessage =
  document.querySelector(
    "#photo-upload-message"
  );

const cropMessage =
  document.querySelector(
    "#photo-crop-message"
  );

let cropper = null;
let sourceObjectUrl = null;
let isUploading = false;

function showElementMessage(
  element,
  text,
  type = "success"
) {
  if (!element) {
    return;
  }

  element.textContent = text;
  element.dataset.type = type;
  element.hidden = false;
}

function hideElementMessage(element) {
  if (!element) {
    return;
  }

  element.hidden = true;
  element.textContent = "";
  delete element.dataset.type;
}

function destroyCropper() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  if (sourceObjectUrl) {
    URL.revokeObjectURL(
      sourceObjectUrl
    );

    sourceObjectUrl = null;
  }

  if (cropImage) {
    cropImage.onload = null;
    cropImage.removeAttribute("src");
  }
}

function closeCropModal({
  force = false
} = {}) {
  if (isUploading && !force) {
    return;
  }

  destroyCropper();

  modal.hidden = true;

  document.body.classList.remove(
    "admin-photo-modal-open"
  );

  fileInput.value = "";

  hideElementMessage(
    cropMessage
  );
}

function openCropModal(file) {
  hideElementMessage(
    uploadMessage
  );

  hideElementMessage(
    cropMessage
  );

  destroyCropper();

  sourceObjectUrl =
    URL.createObjectURL(file);

  modal.hidden = false;

  document.body.classList.add(
    "admin-photo-modal-open"
  );

  cropImage.onload = () => {
    if (!window.Cropper) {
      showElementMessage(
        cropMessage,
        "O editor de imagem não foi carregado.",
        "error"
      );

      return;
    }

    cropper =
      new window.Cropper(
        cropImage,
        {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 1,
          responsive: true,
          restore: false,
          background: false,
          guides: false,
          center: true,
          highlight: false,
          movable: true,
          zoomable: true,
          zoomOnTouch: true,
          zoomOnWheel: true,
          rotatable: true,
          scalable: false,
          cropBoxMovable: false,
          cropBoxResizable: false,
          toggleDragModeOnDblclick: false
        }
      );
  };

  cropImage.src =
    sourceObjectUrl;
}

function validateFile(file) {
  if (!file) {
    throw new Error(
      "Não foi selecionada nenhuma fotografia."
    );
  }

  if (
    !ALLOWED_TYPES.includes(file.type)
  ) {
    throw new Error(
      "Seleciona uma imagem JPG, PNG ou WebP."
    );
  }

  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error(
      "A fotografia selecionada ultrapassa os 12 MB."
    );
  }
}

function canvasToBlob(canvas) {
  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "Não foi possível processar a fotografia."
              )
            );

            return;
          }

          resolve(blob);
        },
        "image/webp",
        0.9
      );
    }
  );
}

function setUploading(uploading) {
  isUploading = uploading;

  saveButton.disabled =
    uploading;

  selectButton.disabled =
    uploading;

  saveText.textContent =
    uploading
      ? "A guardar..."
      : "Guardar fotografia";

  saveSpinner.hidden =
    !uploading;
}

async function verifySession() {
  const {
    data,
    error
  } =
    await supabaseClient.auth
      .getSession();

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error(
      "A sessão terminou. Inicia sessão novamente."
    );
  }
}

async function verifyAdministrator() {
  const {
    data,
    error
  } = await supabaseClient.rpc(
    "is_profile_admin"
  );

  if (error) {
    throw error;
  }

  if (data !== true) {
    throw new Error(
      "Esta conta não tem permissão para alterar a fotografia."
    );
  }
}

async function uploadProfilePhoto(blob) {
  const {
    error
  } =
    await supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(
        STORAGE_PATH,
        blob,
        {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: true
        }
      );

  if (error) {
    throw error;
  }

  const {
    data
  } =
    supabaseClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(
        STORAGE_PATH
      );

  if (!data?.publicUrl) {
    throw new Error(
      "Não foi possível obter o endereço público da fotografia."
    );
  }

  return (
    `${data.publicUrl}?v=${Date.now()}`
  );
}

async function savePhotoUrl(photoUrl) {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("profile_settings")
      .update({
        photo_url: photoUrl
      })
      .eq(
        "id",
        PROFILE_ID
      )
      .select(
        "photo_url"
      )
      .single();

  if (error) {
    throw error;
  }

  return data.photo_url;
}

async function handleSavePhoto() {
  hideElementMessage(
    cropMessage
  );

  if (!cropper) {
    showElementMessage(
      cropMessage,
      "Seleciona e ajusta primeiro uma fotografia.",
      "error"
    );

    return;
  }

  setUploading(true);

  try {
    await verifySession();
    await verifyAdministrator();

    const canvas =
      cropper.getCroppedCanvas({
        width: 1000,
        height: 1000,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high"
      });

    if (!canvas) {
      throw new Error(
        "Não foi possível criar a imagem recortada."
      );
    }

    const photoBlob =
      await canvasToBlob(canvas);

    const publicUrl =
      await uploadProfilePhoto(
        photoBlob
      );

    const savedPhotoUrl =
      await savePhotoUrl(
        publicUrl
      );

    currentPhoto.src =
      savedPhotoUrl;

    setUploading(false);

    closeCropModal({
      force: true
    });

    showElementMessage(
      uploadMessage,
      "Fotografia atualizada com sucesso."
    );

    window.dispatchEvent(
  new CustomEvent(
    "identityhub:adminsaved",
    {
      detail: {
        message:
          "Fotografia atualizada com sucesso."
      }
    }
  )
);

  } catch (error) {
    console.error(
      "Não foi possível guardar a fotografia:",
      error
    );

    showElementMessage(
      cropMessage,
      error.message ||
        "Não foi possível guardar a fotografia.",
      "error"
    );

    setUploading(false);
  }
}

function handleFileSelection() {
  const [file] =
    fileInput.files;

  try {
    validateFile(file);

    openCropModal(file);
  } catch (error) {
    fileInput.value = "";

    showElementMessage(
      uploadMessage,
      error.message,
      "error"
    );
  }
}

function initialisePhotoManager() {
  const requiredElements = [
    fileInput,
    selectButton,
    currentPhoto,
    modal,
    cropImage,
    rotateLeftButton,
    rotateRightButton,
    resetButton,
    saveButton
  ];

  if (
    requiredElements.some(
      (element) => !element
    )
  ) {
    console.warn(
      "Não foi possível iniciar o gestor da fotografia. Confirma o admin.html."
    );

    return;
  }

  selectButton.addEventListener(
    "click",
    () => {
      fileInput.value = "";
      fileInput.click();
    }
  );

  fileInput.addEventListener(
    "change",
    handleFileSelection
  );

  rotateLeftButton.addEventListener(
    "click",
    () => {
      cropper?.rotate(-90);
    }
  );

  rotateRightButton.addEventListener(
    "click",
    () => {
      cropper?.rotate(90);
    }
  );

  resetButton.addEventListener(
    "click",
    () => {
      cropper?.reset();
    }
  );

  saveButton.addEventListener(
    "click",
    handleSavePhoto
  );

  modal
    .querySelectorAll(
      "[data-photo-close]"
    )
    .forEach((element) => {
      element.addEventListener(
        "click",
        () => closeCropModal()
      );
    });

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !modal.hidden
      ) {
        closeCropModal();
      }
    }
  );
}

initialisePhotoManager();