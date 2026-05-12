const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'como bañar un perro' }],
      model: 'llama-3.1-8b-instant',
    });
    console.log("Success:", chatCompletion.choices[0].message.content);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
main();
