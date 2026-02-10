import { NextResponse } from 'next/server';

const BASE_PROMPT = [
  'Corrige ortografía, gramática, puntuación y claridad mínima.',
  'NO cambies el significado.',
  'NO agregues información.',
  'NO embellezcas el texto.',
  'Mantén la voz del autor.',
  'Devuelve español natural, profesional y humano.',
].join(' ');

const SUBCONTEXTS = {
  general: 'Email profesional general.',
  solicitud: 'Email profesional de solicitud. Respetuoso y claro.',
  seguimiento: 'Email profesional de seguimiento. Firme sin insistir.',
  negar: 'Email profesional para decir que no. Claro y respetuoso.',
  feedback: 'Email profesional de feedback. Constructivo.',
  reclamo: 'Email profesional de reclamo. Firme, no agresivo.',
} as const;

const RELATIONS = {
  interno: 'Comunicación interna de trabajo. Tono directo, respetuoso.',
  externo: 'Comunicación profesional externa. Tono formal cuidadoso.',
} as const;

type Subcontext = keyof typeof SUBCONTEXTS;
type Relation = keyof typeof RELATIONS;

export async function POST(req: Request) {
  try {
    const { text, subcontext, relation } = (await req.json()) as {
      text?: string;
      subcontext?: Subcontext;
      relation?: Relation;
    };

    if (!text || !subcontext || !relation) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }

    const key = process.env.NICHO;
    if (!key) {
      return NextResponse.json({ error: 'Falta NICHO en variables de entorno.' }, { status: 500 });
    }

    const prompt = [BASE_PROMPT, RELATIONS[relation], SUBCONTEXTS[subcontext]].join('\n');

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      }),
    });

    if (!completion.ok) {
      const detail = await completion.text();
      return NextResponse.json({ error: 'Error de OpenAI', detail }, { status: 502 });
    }

    const data = await completion.json();
    const output = data?.choices?.[0]?.message?.content?.trim() ?? '';

    return NextResponse.json({ output });
  } catch {
    return NextResponse.json({ error: 'No se pudo completar la corrección.' }, { status: 500 });
  }
}
