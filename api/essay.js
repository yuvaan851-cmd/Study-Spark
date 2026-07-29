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
  const { text, mode } = req.body || {};
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Missing text." });
    return;
  }
  const instructions = {
    grammar: "Fix the grammar, punctuation, and capitalization in the following text. Return only the corrected text, nothing else.",
    clarity: "Rewrite the following text for clarity and conciseness, keeping the same meaning and roughly the same length. Return only the rewritten text, nothing else.",
    outline: "Create a five-part essay outline (Introduction, three body paragraphs, Conclusion) based on the following text or topic sentence. Use roman numerals and short bullet points under each section. Return only the outline, nothing else.",
  };
  const instruction = instructions[mode] || instructions.grammar;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: instruction }] }, contents: [{ role: "user", parts: [{ text }] }] }),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: "Gemini API error", detail: errText });
      return;
    }
    const data = await response.json();
    const output =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "Sorry, I couldn't generate a result — try again.";
    res.status(200).json({ output });
  } catch (err) {
    res.status(500).json({ error: "Request to Gemini failed.", detail: String(err) });
  }
}
