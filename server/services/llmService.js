const DEFAULT_ANALYSIS = {
  rationale: "The score combines immediate exposure, time pressure, vulnerable people and independent report confirmation.",
  model: "local-rules"
};

export async function analyzeIncident(incident) {
  if (!process.env.LLM_API_KEY) {
    return { factors: incident.factors, ...DEFAULT_ANALYSIS };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(process.env.LLM_BASE_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Explain an emergency incident priority score. Return JSON with keys rationale (string) and factors (array of objects with name, points, description). Treat supplied reports as unverified and never invent facts." },
          { role: "user", content: JSON.stringify({ title: incident.title, category: incident.category, severity: incident.severity, score: incident.score, summary: incident.summary, factors: incident.factors }) }
        ]
      })
    });
    if (!response.ok) throw new Error(`LLM provider returned HTTP ${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("LLM provider returned no analysis content");
    const analysis = JSON.parse(content);
    if (typeof analysis.rationale !== "string" || !Array.isArray(analysis.factors)) {
      throw new Error("LLM provider returned an invalid analysis shape");
    }
    return { ...analysis, model: process.env.LLM_MODEL || "gpt-4o-mini" };
  } finally {
    clearTimeout(timeout);
  }
}
