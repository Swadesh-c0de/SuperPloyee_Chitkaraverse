import { NextRequest } from "next/server";

const BASE = "https://api.trello.com/1";

function authParams() {
  return `key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_TOKEN}`;
}

async function trelloGet(endpoint: string) {
  const sep = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${endpoint}${sep}${authParams()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello GET ${res.status}: ${text}`);
  }
  return res.json();
}

async function trelloPut(endpoint: string, params = "") {
  const sep = endpoint.includes("?") ? "&" : "?";
  const url = `${BASE}${endpoint}${sep}${authParams()}${params ? "&" + params : ""}`;
  const res = await fetch(url, { method: "PUT" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello PUT ${res.status}: ${text}`);
  }
  return res.json();
}

async function trelloPost(endpoint: string, params = "") {
  const sep = endpoint.includes("?") ? "&" : "?";
  const url = `${BASE}${endpoint}${sep}${authParams()}${params ? "&" + params : ""}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trello POST ${res.status}: ${text}`);
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  if (!process.env.TRELLO_API_KEY || !process.env.TRELLO_TOKEN) {
    return Response.json({ error: "Trello credentials not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "boards") {
      const boards = await trelloGet("/members/me/boards?fields=name,url,desc");
      return Response.json({ boards });
    }

    if (action === "cards") {
      const boardId = searchParams.get("boardId");
      if (!boardId) return Response.json({ error: "boardId required" }, { status: 400 });
      const [lists, cards] = await Promise.all([
        trelloGet(`/boards/${boardId}/lists`),
        trelloGet(`/boards/${boardId}/cards?fields=name,desc,due,dateLastActivity,idList,labels,shortUrl`),
      ]);
      return Response.json({ lists, cards });
    }

    if (action === "card-comments") {
      const cardId = searchParams.get("cardId");
      if (!cardId) return Response.json({ error: "cardId required" }, { status: 400 });
      const actions = await trelloGet(`/cards/${cardId}/actions?filter=commentCard`);
      return Response.json({ actions });
    }

    if (action === "all") {
      const boards = await trelloGet("/members/me/boards?fields=name,url,desc");
      const boardData = await Promise.all(
        boards.map(async (board: { id: string; name: string; url: string; desc: string }) => {
          const [lists, cards] = await Promise.all([
            trelloGet(`/boards/${board.id}/lists`),
            trelloGet(`/boards/${board.id}/cards?fields=name,desc,due,dateLastActivity,idList,labels,shortUrl`),
          ]);
          return { board, lists, cards };
        })
      );
      return Response.json({ boardData });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.TRELLO_API_KEY || !process.env.TRELLO_TOKEN) {
    return Response.json({ error: "Trello credentials not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { action } = body;

  try {
    if (action === "add-comment") {
      const { cardId, text } = body;
      if (!cardId || !text) return Response.json({ error: "cardId and text required" }, { status: 400 });
      const result = await trelloPost(`/cards/${cardId}/actions/comments`, `text=${encodeURIComponent(text)}`);
      return Response.json({ result });
    }

    if (action === "update-comment") {
      const { actionId, text } = body;
      if (!actionId || !text) return Response.json({ error: "actionId and text required" }, { status: 400 });
      const result = await trelloPut(`/actions/${actionId}`, `text=${encodeURIComponent(text)}`);
      return Response.json({ result });
    }

    if (action === "move-card") {
      const { cardId, listId } = body;
      if (!cardId || !listId) return Response.json({ error: "cardId and listId required" }, { status: 400 });
      const result = await trelloPut(`/cards/${cardId}`, `idList=${encodeURIComponent(listId)}`);
      return Response.json({ result });
    }

    if (action === "update-card") {
      const { cardId, name, desc, due } = body;
      if (!cardId) return Response.json({ error: "cardId required" }, { status: 400 });
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (desc) params.set("desc", desc);
      if (due) params.set("due", due);
      const result = await trelloPut(`/cards/${cardId}`, params.toString());
      return Response.json({ result });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
