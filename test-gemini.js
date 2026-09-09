const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert technical interviewer. I have an upcoming interview for the role of Full Stack Developer Intern at F6 IT Services.
Please generate exactly 5 likely interview topics or questions I should prepare for. Focus on technical, system design, or domain-specific areas.
Return the result as a JSON array of strings. Example: ["Topic 1", "Topic 2"]
Respond ONLY with valid JSON.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    });
    console.log("Response:", result.response.text());
  } catch (err) {
    console.log("Error:", err);
  }
}

test();
