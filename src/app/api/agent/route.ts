import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 25;

function getGroq() {
  try {
    const { default: Groq } = require('groq-sdk');
    return new Groq({ apiKey: process.env.GROQ_API_KEY });
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `Eres Ghosty, el asistente IA de la Clínica Veterinaria Solo Huellas. Responde en español, de forma corta, directa y con viñetas.

DOMINIO PERMITIDO: veterinaria, nutrición animal, mascotas, operación/logística de Solo Huellas, gestión del conocimiento, auditoría, talento humano.
FUERA DE DOMINIO: responde SOLO la palabra: IRRELEVANTE
ESCALAMIENTO: SOLO si peligra la vida del animal (urgencia crítica) o piden datos confidenciales de la empresa (salarios, contraseñas), responde SOLO la palabra: COMPLEJA

BASE DE CONOCIMIENTO RÁPIDA:
- 1ra vacuna cachorro: 45 días. Gatito: 2 meses.
- Refuerzo adultos: Anual. Rabia: Obligatoria anual.
- Baño post-vacuna: Esperar 3-5 días.
- NexGard/Bravecto: Pulgas/garrapatas (1-3 meses). Desde 8 sem y 1.3 kg.
- Desparasitar cachorros: 15-20 días. Adultos: cada 3 meses.
- Tóxicos: Chocolate, uvas, cebolla, ajo, aguacate, xilitol, ibuprofeno.
- Baño perro: Cada 21-30 días. Gatos: No (solo por indicación médica).
- Urgencia vital (COMPLEJA): lengua azul, encías blancas, convulsión, obstrucción uretral, torsión gástrica, veneno.
- Temperatura normal: 38.0 - 39.2 °C rectal.
- Celo perra: Cada 6 meses, 15-21 días. Castración: Evita piometra/cáncer.
- Cambio de alimento: Gradual 7-10 días. Frecuencia: 4x (<4m), 3x (<6m), 2x (adultos).
- Solo Huellas: Urgencias 24h en Pasto, citas web, pagos Nequi/tarjeta/efectivo.

FORMATO DE RESPUESTA:
- Título en ### (Markdown H3)
- Viñetas cortas con **negritas** para lo importante
- Máximo 5 viñetas
- Al final: "¿Qué más necesitas saber?" + 2 preguntas sugeridas en viñetas`;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const groq = getGroq();
    if (!groq) throw new Error('Groq client not available');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens: 800,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";
    const cleanResponse = aiResponse.trim().toUpperCase().replace(/[^A-Z]/g, '');
    const isComplex = cleanResponse === "COMPLEJA";
    const isIrrelevant = cleanResponse === "IRRELEVANTE";

    return NextResponse.json({
      success: true,
      answer: aiResponse,
      isComplex,
      isIrrelevant
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message || "Agent execution failed" }, { status: 500 });
  }
}
