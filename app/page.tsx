'use client';

import { FormEvent, useState } from 'react';

type Subcontext = 'general' | 'solicitud' | 'seguimiento' | 'negar' | 'feedback' | 'reclamo';
type Relation = 'interno' | 'externo';

export default function Page() {
  const [text, setText] = useState('');
  const [subcontext, setSubcontext] = useState<Subcontext>('general');
  const [relation, setRelation] = useState<Relation>('interno');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, subcontext, relation }),
      });

      const data = await response.json();
      setOutput(data.output ?? '');
    } catch {
      setOutput('No se pudo procesar el texto en este momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <section className="card">
        <h1>nicho</h1>
        <p className="subtitle">Editor profesional minimalista.</p>

        <form onSubmit={handleSubmit} className="form">
          <label htmlFor="input">Texto de entrada</label>
          <textarea
            id="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pega aquí tu email..."
            rows={8}
            required
          />

          <div className="row">
            <div className="field">
              <label htmlFor="subcontext">Tipo de email</label>
              <select
                id="subcontext"
                value={subcontext}
                onChange={(e) => setSubcontext(e.target.value as Subcontext)}
              >
                <option value="general">general</option>
                <option value="solicitud">solicitud</option>
                <option value="seguimiento">seguimiento</option>
                <option value="negar">negar</option>
                <option value="feedback">feedback</option>
                <option value="reclamo">reclamo</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="relation">Relación</label>
              <select
                id="relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value as Relation)}
              >
                <option value="interno">interno</option>
                <option value="externo">externo</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading || !text.trim()}>
            {loading ? 'Corrigiendo...' : 'Corregir'}
          </button>

          <label htmlFor="output">Texto de salida</label>
          <textarea id="output" value={output} rows={8} readOnly placeholder="Aquí verás el resultado..." />

          <p className="ready">Listo. Puedes enviarlo.</p>
        </form>
      </section>
    </main>
  );
}
