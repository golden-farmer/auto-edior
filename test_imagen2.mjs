import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY;

async function testImagen() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log(data.models.filter(m => m.name.includes('imagen')));
  } catch(e) {
    console.error(e);
  }
}

testImagen();
