import { NextRequest } from "next/server";
import { getGroqClient } from "@/lib/groq";

const TOOLS: any[] = [
  {
    type: "function",
    function: {
      name: "search_knowledge_base",
      description:
        "Search the company knowledge base for information. Use this when the user asks about repos, people, documents, decisions, projects, or anything that may be in the connected data sources.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to look up in the knowledge base",
          },
          source_filter: {
            type: "string",
            description:
              "Optional: filter by source (GITHUB, NOTION, SLACK, JIRA, CONFLUENCE, DRIVE, INTERCOM). Leave empty to search all.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_meeting_context",
      description:
        "Retrieve the current meeting transcript and suggest relevant talking points or flag issues based on what has been said.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            description: "What aspect to focus on: 'action_items', 'decisions', 'risks', 'summary'",
          },
        },
        required: ["focus"],
      },
    },
  },
];

function executeToolCall(
  name: string,
  args: Record<string, string>,
  kbContext: string
): string {
  if (name === "search_knowledge_base") {
    const { query, source_filter } = args;
    if (!kbContext) return "No knowledge base sources connected. Ask the user to connect data sources first.";
    const lines = kbContext.split("\n");
    const q = query.toLowerCase();
    const filter = source_filter?.toUpperCase();
    const matches = lines.filter((l) => {
      const matchesQuery = l.toLowerCase().includes(q) ||
        q.split(" ").some((word) => word.length > 3 && l.toLowerCase().includes(word));
      const matchesFilter = !filter || l.toUpperCase().includes(filter);
      return matchesQuery && matchesFilter;
    });
    if (matches.length === 0) {
      return `No results found for "${query}"${filter ? ` in ${filter}` : ""}. Knowledge base contains: ${lines.slice(0, 3).join("; ")}`;
    }
    return `Found ${matches.length} result(s) for "${query}":\n${matches.slice(0, 8).join("\n")}`;
  }

  if (name === "get_meeting_context") {
    const { focus } = args;
    return `Meeting context retrieved. Focus: ${focus}. Use the transcript history in context to extract ${focus}. Summarize what you have observed so far and provide actionable intelligence.`;
  }

  return "Unknown tool";
}

export async function POST(req: NextRequest) {
  let groq: Awaited<ReturnType<typeof getGroqClient>>;
  try {
    groq = await getGroqClient();
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  const { messages, kbContext, transcript } = await req.json();

  const systemPrompt = `You are Cortex — an AI meeting intelligence assistant running live inside a meeting. You can hear what the user is saying and respond in real time.

## Your Role
- You are the AI participant in a 1-on-1 conversation with the user
- Respond conversationally, concisely, and helpfully
- When the user asks about data from the knowledge base (repos, people, documents, decisions), ALWAYS use the search_knowledge_base tool
- Proactively flag relevant context from the KB when you detect topic changes
- Keep responses short and punchy — this is a live meeting, not a report

## Knowledge Base Context
${kbContext || "No data sources connected yet. Responses will be based on general knowledge only."}

## Current Meeting Transcript (so far)
${transcript || "Meeting just started."}

## Instructions
- If asked about specific data (repos, people, counts, decisions), call search_knowledge_base first
- After tool calls, synthesize the result into a direct answer
- Flag action items, risks, or decisions as you detect them
- Stay in character as Cortex — sharp, contextual, no filler`;

  const groqMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        let iterations = 0;
        let currentMessages = [...groqMessages];

        while (iterations < 5) {
          iterations++;

          const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: currentMessages,
            tools: TOOLS,
            tool_choice: "auto",
            temperature: 0.5,
            max_tokens: 512,
          });

          const choice = completion.choices[0];
          const msg = choice.message;

          // Handle tool calls
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            currentMessages.push(msg);

            for (const tc of msg.tool_calls) {
              const name = tc.function.name;
              const args: Record<string, string> = JSON.parse(tc.function.arguments ?? "{}");
              const callId = tc.id;

              send({ type: "tool_call", tool: name, args, id: callId });

              const toolResult = executeToolCall(name, args, kbContext ?? "");
              send({ type: "tool_result", tool: name, result: toolResult, id: callId });

              currentMessages.push({
                role: "tool",
                tool_call_id: callId,
                content: toolResult,
              });
            }
            continue;
          }

          // Final text — stream word by word
          const text = msg.content ?? "";
          const words = text.split(/(\s+)/);
          for (const word of words) {
            if (word) {
              send({ type: "text", text: word });
              await new Promise((r) => setTimeout(r, 18));
            }
          }
          send({ type: "done" });
          break;
        }
      } catch (err: any) {
        console.error("[meeting-chat] Groq error:", err?.message ?? err);
        send({ type: "error", message: err?.message ?? "Unknown error" });
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
