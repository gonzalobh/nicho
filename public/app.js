const inputText = document.getElementById("inputText");
const rol = document.getElementById("rol");
const tipoMensaje = document.getElementById("tipoMensaje");
const relacionJerarquica = document.getElementById("relacionJerarquica");
const contexto = document.getElementById("contexto");
const objetivoEmocional = document.getElementById("objetivoEmocional");
const outputText = document.getElementById("outputText");
const correctBtn = document.getElementById("correctBtn");
const errorMessage = document.getElementById("errorMessage");
const readyMessage = document.getElementById("readyMessage");

const setLoading = (isLoading) => {
  correctBtn.disabled = isLoading;
  correctBtn.textContent = isLoading ? "Corrigiendo…" : "Corregir";
};

const showError = (message) => {
  errorMessage.textContent = message || "";
};

const updateOutput = (text) => {
  outputText.value = text;
  readyMessage.hidden = !Boolean(text.trim());
};

correctBtn.addEventListener("click", async () => {
  const text = inputText.value.trim();

  if (!text) {
    showError("Ingresa texto para corregir.");
    updateOutput("");
    return;
  }

  showError("");
  setLoading(true);

  try {
    const response = await fetch("/api/correct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        rol: rol.value,
        tipoMensaje: tipoMensaje.value,
        relacionJerarquica: relacionJerarquica.value,
        contexto: contexto.value,
        objetivoEmocional: objetivoEmocional.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "No se pudo corregir el texto.");
    }

    updateOutput(data.output || "");
  } catch (error) {
    updateOutput("");
    showError(error.message || "Ocurrió un error inesperado.");
  } finally {
    setLoading(false);
  }
});
