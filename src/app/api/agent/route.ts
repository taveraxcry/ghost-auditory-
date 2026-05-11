import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Agent prompt instructions
    const systemPrompt = `
Eres un Oráculo operativo (IA) de la Clínica Veterinaria Solo Huellas.
Tu objetivo es responder dudas sobre logística (Última milla, Dropshipping, Cross-docking) y clínica.
Si sabes la respuesta basada en el contexto de Solo Huellas, responde corto y claro.
Si la pregunta es muy compleja, no tienes la respuesta, o involucra dinero/acceso a claves, DEBES responder EXCLUSIVAMENTE con la palabra: COMPLEJA.
No digas "lo siento", solo responde "COMPLEJA".
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.1,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";
    const isComplex = aiResponse.trim().toUpperCase() === "COMPLEJA";

    // Create record in Firebase
    try {
      await addDoc(collection(db, "audits"), {
        query,
        answer: isComplex ? "" : aiResponse,
        status: isComplex ? "pending" : "resolved",
        is_complex: isComplex,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Firebase error (missing keys maybe?):", e);
    }

    return NextResponse.json({
      success: true,
      answer: aiResponse,
      isComplex
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Agent execution failed" }, { status: 500 });
  }
}
