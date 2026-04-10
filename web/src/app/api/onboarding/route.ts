import { NextRequest } from "next/server";
import { getGroqClient } from "@/lib/groq";

export async function POST(req: NextRequest) {
  let groq: Awaited<ReturnType<typeof getGroqClient>>;
  try {
    groq = await getGroqClient();
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  const { mode, answers, companyContext } = await req.json();

  const isClient = mode === "client";

  const systemPrompt = `You are Cortex — an intelligent onboarding architect. Given a set of configuration answers, generate a detailed, structured onboarding roadmap as JSON.

## Company Context
${companyContext}

## Output Format
Return ONLY valid JSON matching this exact schema, no markdown fences, no explanation:
{
  "title": string,
  "subtitle": string,
  "summary": string,
  "phases": [
    {
      "id": string,
      "label": string,
      "duration": string,
      "objective": string,
      "milestones": [
        {
          "id": string,
          "title": string,
          "description": string,
          "priority": "critical" | "high" | "medium",
          "source": string,
          "tasks": string[]
        }
      ]
    }
  ],
  "keyContacts": [
    { "role": string, "purpose": string }
  ],
  "successMetrics": string[],
  "redFlags": string[]
}`;

  const userPrompt = isClient
    ? `Generate a CLIENT onboarding roadmap for the following configuration:
${Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

Create 3 phases: Activation (Week 1-2), Integration (Week 3-6), Value Realization (Month 2-3).
Make it specific, actionable, and tailored to the client type and industry provided.`
    : `Generate an EMPLOYEE onboarding roadmap for the following configuration:
${Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

Create 3 phases: Day 1-30 (Orientation), Day 31-60 (Integration), Day 61-90 (Impact).
Make it specific, actionable, and tailored to the role, department, and seniority provided.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  try {
    const json = JSON.parse(raw);
    return Response.json(json);
  } catch {
    // try to extract JSON from response if wrapped in text
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
