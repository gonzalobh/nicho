const SUBCONTEXT_PROMPTS = {
  general: "Email profesional general.",
  solicitud: "Email profesional de solicitud. Respetuoso y claro.",
  seguimiento: "Email profesional de seguimiento. Firme sin insistir.",
  negar: "Email profesional para decir que no. Claro y respetuoso.",
  feedback: "Email profesional de feedback. Constructivo.",
  reclamo: "Email profesional de reclamo. Firme, no agresivo.",
};

const RELATION_PROMPTS = {
  interno: "Comunicación interna de trabajo. Tono directo, respetuoso.",
  externo: "Comunicación profesional externa. Tono formal cuidadoso.",
};

const BASE_EDITORIAL_PROMPT = `Eres un editor profesional nativo en español.
Entrega UNA versión final lista para enviar.
Corrige únicamente ortografía, gramática, puntuación y claridad mínima.
Reglas absolutas:
- NO cambiar el significado
- NO agregar información
- NO embellecer
- NO hacer el texto más largo de lo necesario
- Mantener la voz del autor
- Español natural, profesional y humano
- No explicar cambios
- Entregar SOLO el texto final (sin comillas, sin listas, sin prefacios)`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, subcontext = "general", relation = "externo" } = req.body || {};

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "No text provided" });
  }

  if (!process.env.NICHO) {
    return res.status(500).json({ error: "Missing NICHO env var" });
  }

  const relationPrompt = RELATION_PROMPTS[relation] || RELATION_PROMPTS.externo;
  const subcontextPrompt = SUBCONTEXT_PROMPTS[subcontext] || SUBCONTEXT_PROMPTS.general;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NICHO}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: BASE_EDITORIAL_PROMPT },
          { role: "system", content: relationPrompt },
          { role: "system", content: subcontextPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const openAiMessage =
        data?.error?.message || "OpenAI request failed";
      return res.status(502).json({ error: openAiMessage });
    }

    const output = data?.choices?.[0]?.message?.content?.trim();

    if (!output) {
      return res.status(502).json({ error: "No output generated" });
    }

    return res.status(200).json({ output });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
