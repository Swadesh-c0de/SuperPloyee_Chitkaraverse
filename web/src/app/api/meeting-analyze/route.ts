import { NextRequest } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { transcript, context } = await req.json();

  const systemPrompt = `You are Cortex — an elite post-meeting intelligence engine. You analyze meeting transcripts and extract actionable intelligence.

${context ? `## Company Knowledge Base Context\n${context}\n\n` : ""}

Return a **pure JSON object** with EXACTLY this structure (no markdown fences, no extra text):
{
  "summary": "2-3 sentence executive summary of the meeting",
  "sentiment": "positive|neutral|negative",
  "decisions": [{"text": "...", "owner": "Name (Role)", "confidence": 85}],
  "actions": [{"text": "...", "owner": "Name", "deadline": "timeframe", "priority": "high|medium|low"}],
  "unresolved": ["question or blocker 1", "question 2"],
  "kbMatches": [{"label": "knowledge base item name", "relevance": "why it is relevant to this meeting"}],
  "riskFlags": ["risk 1", "risk 2"],
  "followUpDraft": "A short follow-up email draft (3-4 sentences) summarizing what was decided and what happens next."
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyze this meeting transcript:\n\n${transcript}` },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: any = {};
  try {
    // Strip markdown fences if model adds them despite instructions
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = { summary: raw, decisions: [], actions: [], unresolved: [], kbMatches: [], riskFlags: [], followUpDraft: "" };
  }

  return Response.json(parsed);
}
