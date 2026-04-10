import { NextRequest } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { mode, tickets, deals } = await req.json();

  if (mode === "analyze") {
    const systemPrompt = `You are Cortex — an AI customer intelligence engine. Given raw support tickets and sales deal data, produce a structured intelligence report as strict JSON with no markdown, no explanation, no code fences.

Return ONLY valid JSON matching this EXACT schema:
{
  "summary": string,
  "topPatterns": [{ "pattern": string, "count": number, "severity": "critical"|"high"|"medium" }],
  "categoryBreakdown": [{ "category": string, "count": number, "autoResolvable": boolean }],
  "salesInsight": string,
  "atRiskDeals": [{ "company": string, "reason": string }],
  "recommendedActions": [{ "action": string, "priority": "immediate"|"soon"|"later" }],
  "satisfactionScore": number,
  "automationPotential": number
}`;

    const userPrompt = `Analyze this customer data:

SUPPORT TICKETS (${tickets.length} total):
${JSON.stringify(tickets.slice(0, 12), null, 2)}

SALES PIPELINE (${deals.length} deals):
${JSON.stringify(deals, null, 2)}

Generate real patterns, insights, and recommendations. satisfactionScore should be 0-100. automationPotential should be 0-100 (% of tickets that can be auto-resolved).`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    try {
      return Response.json(JSON.parse(raw));
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { return Response.json(JSON.parse(match[0])); } catch {}
      }
      return Response.json({ error: "parse_failed", raw }, { status: 500 });
    }
  }

  if (mode === "resolve") {
    const systemPrompt = `You are Cortex — an AI support resolution engine. For each ticket, decide if it can be auto-resolved by AI or must be escalated to a human. Return strict JSON only, no markdown, no explanation.

Return ONLY valid JSON matching this schema:
{
  "resolutions": [
    {
      "id": string,
      "resolution": "auto" | "human",
      "note": string,
      "action": string
    }
  ],
  "summary": {
    "autoCount": number,
    "humanCount": number,
    "automationRate": number,
    "timeSavedMinutes": number
  }
}`;

    const userPrompt = `Resolve these support tickets:
${JSON.stringify(tickets, null, 2)}

For "auto": AI can handle it — send a guide, reset something, fix config, notify customer.
For "human": needs billing approval, code fix, manual investigation, or is safety-critical.
note should be a one-line description of what was done or why escalated.
action should be an imperative action taken (e.g. "Rate limit reset applied", "Escalated to billing team").
automationRate should be a whole number from 0 to 100 representing percentage.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    try {
      return Response.json(JSON.parse(raw));
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { return Response.json(JSON.parse(match[0])); } catch {}
      }
      return Response.json({ error: "parse_failed", raw }, { status: 500 });
    }
  }

  return Response.json({ error: "invalid_mode" }, { status: 400 });
}
