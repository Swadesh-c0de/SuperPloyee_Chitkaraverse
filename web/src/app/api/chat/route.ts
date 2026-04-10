import { NextRequest } from "next/server";
import { getGroqClient } from "@/lib/groq";

export async function POST(req: NextRequest) {
  let groq: Awaited<ReturnType<typeof getGroqClient>>;
  try {
    groq = await getGroqClient();
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  const { messages, context } = await req.json();

  const systemPrompt = `You are Cortex — an intelligent knowledge assistant embedded in a company's internal intelligence platform. You have been given access to the company's connected data sources.

${context ? `## Live Knowledge Graph Context\n${context}` : "No data sources connected yet."}

## Instructions
- Answer questions by reasoning over the knowledge graph context provided above.
- When referencing specific documents, nodes, or data sources, cite them inline like [Source: Notion / Product Roadmap Q4].
- Be precise, insightful, and concise. Avoid filler.
- If asked about something not in the context, say so clearly — don't hallucinate.
- When synthesizing across multiple sources, explain the connections you're making.
- Respond in a professional but direct tone. No corporate speak.`;

  let stream: Awaited<ReturnType<typeof groq.chat.completions.create>>;
  try { // eslint-disable-line
    stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      temperature: 0.4,
      max_tokens: 1024,
    });
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode ?? 500;
    const message = err?.error?.message ?? err?.message ?? "Groq API error";
    return Response.json({ error: message }, { status: status >= 400 && status < 600 ? status : 500 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err?.message ?? "Stream error" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
