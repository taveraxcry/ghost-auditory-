import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const QUALITY_MAP: Record<string, { level: string; gp: number }> = {
  BASICA: { level: 'basica', gp: 10 },
  INTERMEDIA: { level: 'intermedia', gp: 20 },
  COMPLEJA: { level: 'compleja', gp: 30 },
};

function getGroq() {
  try {
    const { default: Groq } = require('groq-sdk');
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });
    }

    const groq = getGroq();

    const prompt = `Eres un evaluador de conocimiento institucional para una clínica veterinaria.
Evalúa la siguiente respuesta de un experto Senior a una duda interna.

PREGUNTA DEL JUNIOR: "${question}"
RESPUESTA DEL SENIOR: "${answer}"

Criterios:
1. Relevancia: ¿Responde exactamente la pregunta?
2. Profundidad: ¿Explica el porqué o el proceso?
3. Utilidad para base de conocimiento: ¿Es reutilizable como documentación?
4. Claridad: ¿Está bien estructurada?

Responde ÚNICAMENTE con uno de estos tres valores exactos, sin explicación:
BASICA
INTERMEDIA
COMPLEJA`;

    if (!groq) throw new Error('Groq client not available');
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Eres un evaluador estricto de calidad de conocimiento institucional.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 50,
    });

    const rawLevel = chatCompletion.choices[0]?.message?.content?.trim().toUpperCase() || 'INTERMEDIA';
    const matched = QUALITY_MAP[rawLevel] || QUALITY_MAP.INTERMEDIA;

    return NextResponse.json({
      success: true,
      qualityLevel: matched.level,
      gpAmount: matched.gp,
    });
  } catch (error) {
    console.error('Evaluate-reply API error:', error);
    return NextResponse.json({ qualityLevel: 'intermedia', gpAmount: 20 }, { status: 200 });
  }
}
