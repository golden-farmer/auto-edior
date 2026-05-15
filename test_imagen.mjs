import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY;

async function testImagen() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        instances: [{ prompt: "A photorealistic apple" }],
        parameters: { sampleCount: 1 }
      })
    });
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}

testImagen();
