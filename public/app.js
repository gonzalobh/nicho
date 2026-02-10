const inputText = document.getElementById("inputText");
const subcontext = document.getElementById("subcontext");
const relation = document.getElementById("relation");
const outputText = document.getElementById("outputText");
const correctBtn = document.getElementById("correctBtn");
const copyBtn = document.getElementById("copyBtn");
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
  const hasOutput = Boolean(text.trim());
  readyMessage.hidden = !hasOutput;
  copyBtn.disabled = !hasOutput;
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
        subcontext: subcontext.value,
        relation: relation.value,
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

copyBtn.addEventListener("click", async () => {
  if (!outputText.value.trim()) return;

  try {
    await navigator.clipboard.writeText(outputText.value);
    showError("Texto copiado.");
    setTimeout(() => {
      if (errorMessage.textContent === "Texto copiado.") {
        showError("");
      }
    }, 1300);
  } catch (error) {
    showError("No se pudo copiar automáticamente.");
  }
});
