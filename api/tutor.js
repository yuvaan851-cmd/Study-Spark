export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing GEMINI_API_KEY on the server." });
    return;
  }
  const { question, level, history } = req.body || {};
  if (!question || typeof question !== "string") {
    res.status(400).json({ error: "Missing question." });
    return;
  }
  const systemPrompt = `You are a patient, encouraging homework tutor for a ${level || "High School"} student.
Never give the final answer outright on the first response — guide the student step by step with questions and hints,
the way a good tutor would. If the student explicitly asks for the answer after being guided, or seems stuck after
a couple of exchanges, you may reveal it and explain the reasoning clearly. Keep responses concise and encouraging.`;
  const contents = [];
  if (Array.isArray(history)) {
    for (const m of history) {
      if (!m?.text) continue;
      contents.push({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] });
    }
  }
  contents.push({ role: "user", parts: [{ text: question }] });
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents }),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: "Gemini API error", detail: errText });
      return;
    }
    const data = await response.json();
    const answer =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "Sorry, I couldn't come up with a response — try rephrasing your question.";
    res.status(200).json({ answer });
  } catch (err) {
    res.status(500).json({ error: "Request to Gemini failed.", detail: String(err) });
  }
}
