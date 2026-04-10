import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";

const BOT_DIR = path.resolve(process.cwd(), "../bot");
const BOT_SCRIPT = path.join(BOT_DIR, "bot.js");

export async function POST(req: NextRequest) {
  const { meetUrl, botName } = await req.json();

  if (!meetUrl || !meetUrl.includes("meet.google.com")) {
    return Response.json({ error: "Invalid Google Meet URL" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, message: string) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, message })}\n\n`)
          );
        } catch {}
      };

      send("status", "Starting bot process...");

      const child = spawn("node", [BOT_SCRIPT], {
        cwd: BOT_DIR,          // run from bot/ so require() finds its node_modules
        env: {
          ...process.env,
          MEET_LINK: meetUrl,
          BOT_NAME: botName || "Cortex AI",
        },
        detached: false,
      });

      child.stdout.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          send("log", line);

          if (
            line.includes("Successfully admitted") ||
            line.includes("Bot is active") ||
            line.includes("Bot processed join")
          ) {
            send("joined", "Bot has joined the meeting");
          }
        }
      });

      child.stderr.on("data", (data: Buffer) => {
        const text = data.toString().trim();
        if (text) send("error", text);
      });

      child.on("error", (err) => {
        send("error", `Failed to start bot: ${err.message}`);
        try { controller.close(); } catch {}
      });

      child.on("close", (code) => {
        send("done", `Bot process exited (code ${code})`);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
