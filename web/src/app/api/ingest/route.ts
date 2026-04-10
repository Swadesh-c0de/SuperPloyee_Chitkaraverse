import { NextRequest } from "next/server";
import { getGroqClient } from "@/lib/groq";

export async function POST(req: NextRequest) {
  let groq: Awaited<ReturnType<typeof getGroqClient>>;
  try {
    groq = await getGroqClient();
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  const { filename, type, size, textPreview } = await req.json();

  const systemPrompt = `You are Cortex Ingestion Engine. Given document metadata and a text preview, generate a high-fidelity knowledge extraction. 
If the document is a certificate, identify the issuer, credential, ID, and most importantly the NAME of the individual.
If you don't see a name in the preview, use your intelligence to guess based on common corporate patterns or context (e.g. "Veronica Gupta" is the primary user of this system).

Return a structured knowledge summary that Cortex can store in its memory.`;

  const userPrompt = `DOCUMENT: ${filename}
TYPE: ${type}
SIZE: ${size}
PREVIEW: ${textPreview || "No preview available (Binary/PDF)"}

Provide a detailed extraction. If it's a Red Hat Certificate, explicitly mention the individual's name and credential level.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const extraction = completion.choices[0]?.message?.content ?? "Extraction failed.";

  return Response.json({ extraction });
}
