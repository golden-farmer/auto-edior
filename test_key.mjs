const API_KEY = "AIzaSyA3CbKeMfOSZFCSqKgPCMOaqmTf5uC1EiQ";

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "안녕하세요, 테스트입니다. 한 줄만 답해주세요." }] }]
    })
  });

  console.log("Status:", res.status);
  const data = await res.text();
  console.log("Response:", data.substring(0, 500));
}

test().catch(console.error);
