const ROLE_PROMPTS = {
  manager: "Tono seguro, claro, con autoridad tranquila. No excesivamente cercano.",
  colaborador: "Tono respetuoso, claro, sin sonar inseguro ni autoritario.",
  freelancer: "Tono profesional, autónomo y confiable. Evitar subordinación excesiva.",
  ventas: "Tono persuasivo, claro, no agresivo ni exagerado.",
  soporte: "Tono paciente, claro, orientado a solución.",
  rrhh: "Tono neutral, cuidadoso y respetuoso.",
  founder: "Tono directo, estratégico y claro. Evitar informalidad.",
};

const MESSAGE_TYPE_PROMPTS = {
  solicitud: "Respetuoso, claro, sin exigencia.",
  seguimiento: "Firme y educado, sin presión.",
  reclamo_interno: "Claro y directo, no confrontacional.",
  feedback: "Constructivo, específico, sin juicio.",
  decision_dificil: "Claro, empático, sin ambigüedad.",
  decir_no: "Firme, respetuoso, sin justificar de más.",
  aclaracion: "Preciso, neutral, orientado a corregir malentendidos.",
  cierre: "Concreto, claro, confirmatorio.",
};

const HIERARCHY_PROMPTS = {
  superior: "Respeto, claridad, evitar imperativos.",
  par: "Equilibrio, naturalidad, claridad.",
  subordinado: "Claridad, respeto, autoridad serena.",
  cliente_externo: "Formalidad cuidada, orientación a relación.",
};

const CONTEXT_PROMPTS = {
  interno: "Lenguaje directo, menos formalismo, claridad operativa.",
  externo: "Lenguaje más formal, cuidado en el tono y estructura.",
};

const EMOTIONAL_GOAL_PROMPTS = {
  informar: "Claridad, estructura, neutralidad.",
  tranquilizar: "Lenguaje calmado, seguro, sin urgencia innecesaria.",
  convencer: "Argumentación clara, sin exagerar.",
  corregir_sin_friccion: "Suavizar fricción, evitar tono acusatorio.",
  respetar: "Cuidado extremo del tono, evitar imposiciones.",
};

const BASE_EDITORIAL_PROMPT = `Eres un editor profesional nativo en español.

Tu tarea es entregar UNA ÚNICA versión final del texto, lista para enviar.

Corrige únicamente:

* Ortografía
* Gramática
* Puntuación
* Claridad mínima

REGLAS ABSOLUTAS:

* NO cambies el significado
* NO agregues información
* NO embellezcas
* NO alargues innecesariamente el texto
* Mantén la voz del autor
* Español natural, profesional y humano
* No expliques cambios
* Entrega SOLO el texto final`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    text,
    rol = "colaborador",
    tipoMensaje = "solicitud",
    relacionJerarquica = "par",
    contexto = "interno",
    objetivoEmocional = "informar",
  } = req.body || {};

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "No text provided" });
  }

  if (!process.env.NICHO) {
    return res.status(500).json({ error: "Missing NICHO env var" });
  }

  const rolePrompt = ROLE_PROMPTS[rol] || ROLE_PROMPTS.colaborador;
  const messageTypePrompt = MESSAGE_TYPE_PROMPTS[tipoMensaje] || MESSAGE_TYPE_PROMPTS.solicitud;
  const hierarchyPrompt = HIERARCHY_PROMPTS[relacionJerarquica] || HIERARCHY_PROMPTS.par;
  const contextPrompt = CONTEXT_PROMPTS[contexto] || CONTEXT_PROMPTS.interno;
  const emotionalGoalPrompt =
    EMOTIONAL_GOAL_PROMPTS[objetivoEmocional] || EMOTIONAL_GOAL_PROMPTS.informar;

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
          { role: "system", content: rolePrompt },
          { role: "system", content: messageTypePrompt },
          { role: "system", content: hierarchyPrompt },
          { role: "system", content: contextPrompt },
          { role: "system", content: emotionalGoalPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: data?.error?.message || "OpenAI request failed" });
    }

    const output = data?.choices?.[0]?.message?.content?.trim();

    if (!output) {
      return res.status(502).json({ error: "No output generated" });
    }

    return res.status(200).json({ output });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
}
