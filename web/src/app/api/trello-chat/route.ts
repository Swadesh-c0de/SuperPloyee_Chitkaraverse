import { NextRequest } from "next/server";
import { getGroqClient } from "@/lib/groq";

const BASE = "https://api.trello.com/1";

function authParams() {
  return `key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_TOKEN}`;
}

async function trelloGet(endpoint: string) {
  const sep = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${endpoint}${sep}${authParams()}`);
  if (!res.ok) throw new Error(`Trello GET ${res.status}: ${await res.text()}`);
  return res.json();
}

async function trelloPut(endpoint: string, params = "") {
  const sep = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${endpoint}${sep}${authParams()}${params ? "&" + params : ""}`, { method: "PUT" });
  if (!res.ok) throw new Error(`Trello PUT ${res.status}: ${await res.text()}`);
  return res.json();
}

async function trelloPost(endpoint: string, params = "") {
  const sep = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${endpoint}${sep}${authParams()}${params ? "&" + params : ""}`, { method: "POST" });
  if (!res.ok) throw new Error(`Trello POST ${res.status}: ${await res.text()}`);
  return res.json();
}

async function executeTrelloAction(action: any): Promise<string> {
  const { type, cardId, cardName, listId, listName, text, actionId, boardName } = action;
  switch (type) {
    case "add_comment": {
      await trelloPost(`/cards/${cardId}/actions/comments`, `text=${encodeURIComponent(text)}`);
      return `✅ Comment added to "${cardName}": "${text}"`;
    }
    case "move_card": {
      await trelloPut(`/cards/${cardId}`, `idList=${encodeURIComponent(listId)}`);
      return `✅ Moved "${cardName}" to list "${listName}"`;
    }
    case "update_card_name": {
      await trelloPut(`/cards/${cardId}`, `name=${encodeURIComponent(text)}`);
      return `✅ Renamed card to "${text}"`;
    }
    case "update_card_desc": {
      await trelloPut(`/cards/${cardId}`, `desc=${encodeURIComponent(text)}`);
      return `✅ Updated description of "${cardName}"`;
    }
    default:
      return `⚠️ Unknown action type: ${type}`;
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.TRELLO_API_KEY) {
    return Response.json({ error: "Missing Trello API keys" }, { status: 500 });
  }

  let groq: Awaited<ReturnType<typeof getGroqClient>>;
  try {
    groq = await getGroqClient();
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  const { messages, trelloContext } = await req.json();

  const systemPrompt = `You are a Trello assistant with full read and write access to the user's Trello workspace. You can answer questions AND take real actions on Trello cards.

## Your Trello Data
${trelloContext}

## What you can do
- Answer any question about the boards, cards, lists, priorities, statuses
- Add comments to cards
- Move cards between lists
- Rename cards or update their descriptions
- Suggest actions and execute them when asked

## Action format
When you need to perform a Trello action, embed a JSON block at the END of your message like this:
\`\`\`trello-action
{"type":"add_comment","cardId":"<id>","cardName":"<name>","text":"<comment text>"}
\`\`\`
or
\`\`\`trello-action
{"type":"move_card","cardId":"<id>","cardName":"<name>","listId":"<id>","listName":"<name>"}
\`\`\`
or
\`\`\`trello-action
{"type":"update_card_name","cardId":"<id>","cardName":"<current name>","text":"<new name>"}
\`\`\`
or
\`\`\`trello-action
{"type":"update_card_desc","cardId":"<id>","cardName":"<name>","text":"<new description>"}
\`\`\`

Only include a trello-action block when the user explicitly asks you to do something. For questions, just answer in plain text.
Be concise. Reference cards and boards by name. Always confirm what you did.`;

  let fullText = "";

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    fullText = completion.choices[0]?.message?.content ?? "";
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Groq error" }, { status: 500 });
  }

  // Extract and execute any trello-action blocks
  const actionResults: string[] = [];
  const actionRegex = /```trello-action\n([\s\S]*?)```/g;
  let match;

  while ((match = actionRegex.exec(fullText)) !== null) {
    try {
      const action = JSON.parse(match[1].trim());
      const result = await executeTrelloAction(action);
      actionResults.push(result);
    } catch (err: any) {
      actionResults.push(`⚠️ Action failed: ${err.message}`);
    }
  }

  // Strip action blocks from the displayed text
  const cleanText = fullText.replace(/```trello-action\n[\s\S]*?```/g, "").trim();

  return Response.json({
    text: cleanText,
    actionResults,
  });
}
