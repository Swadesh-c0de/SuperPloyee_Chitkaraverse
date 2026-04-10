import { NextRequest } from "next/server";
import { getGroqClient } from "@/lib/groq";

export async function POST(req: NextRequest) {
  let groq: Awaited<ReturnType<typeof getGroqClient>>;
  try {
    groq = await getGroqClient();
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  const { intent, context, companyContext } = await req.json();

  const systemPrompt = `You are Cortex — an AI-first SOP architect. Given a user's intent and context configuration, generate a comprehensive, production-ready Standard Operating Procedure as strict JSON.

## Company Context
${companyContext}

## Output Format
Return ONLY valid JSON matching this EXACT schema with no markdown, no explanation, no code fences:
{
  "title": string,
  "category": string,
  "description": string,
  "trigger": string,
  "goal": string,
  "conditions": string,
  "variables": [{ "name": string, "description": string, "example": string }],
  "steps": [
    {
      "id": string,
      "order": number,
      "title": string,
      "instruction": string,
      "type": "manual" | "ai" | "decision" | "api",
      "source": string,
      "branches": [{ "condition": string, "nextStep": string }] | null,
      "aiPrompt": string | null
    }
  ],
  "rules": [
    { "condition": string, "action": string }
  ],
  "outputs": [{ "type": string, "description": string, "format": string }],
  "aiTone": string,
  "aiConstraints": string[],
  "owner": string,
  "reviewFrequency": string,
  "tags": string[]
}`;

  const userPrompt = `Generate a complete SOP for the following:

INTENT: ${intent}

CONFIGURATION:
- Trigger: ${context.trigger}
- Goal: ${context.goal}
- Conditions/Constraints: ${context.conditions}
- Category: ${context.category}
- Department: ${context.department}
- Enforcement: ${context.enforcement}
- AI Tone: ${context.tone}

Make it highly specific and actionable. Steps should be detailed with real-world instructions.
Include at least 6-8 steps. Mix step types (manual, ai, decision) for variety.
Add 3-4 IF-THEN rules for decision logic.
Add 2-3 output definitions.
Add 4-6 variables with {{variable_name}} format names.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 3000,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  try {
    return Response.json(JSON.parse(raw));
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return Response.json(JSON.parse(match[0]));
      } catch {
        return Response.json({ error: "parse_failed", raw }, { status: 500 });
      }
    }
    return Response.json({ error: "parse_failed", raw }, { status: 500 });
  }
}
