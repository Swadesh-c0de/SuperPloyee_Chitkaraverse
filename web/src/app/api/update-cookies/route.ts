import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const GOOGLE_TXT = path.resolve(process.cwd(), "../google.txt");
const BOT_JS = path.resolve(process.cwd(), "../bot/bot.js");

function parseNetscapeCookies(content: string) {
  const cookies: object[] = [];
  for (let line of content.split("\n")) {
    line = line.trim();
    if (!line) continue;
    let isHttpOnly = false;
    if (line.startsWith("#HttpOnly_")) {
      isHttpOnly = true;
      line = line.substring(10);
    } else if (line.startsWith("#")) {
      continue;
    }
    const parts = line.split("\t");
    if (parts.length >= 7) {
      cookies.push({
        domain: parts[0],
        path: parts[2],
        secure: parts[3] === "TRUE",
        expires: parseInt(parts[4], 10),
        name: parts[5],
        value: parts[6],
        sameSite: "Lax",
        httpOnly: isHttpOnly,
      });
    }
  }
  return cookies;
}

function injectIntoBotJs(cookies: object[]) {
  if (!fs.existsSync(BOT_JS)) throw new Error("bot/bot.js not found");
  let source = fs.readFileSync(BOT_JS, "utf8");
  const BEGIN = "// __COOKIES_BEGIN__";
  const END = "// __COOKIES_END__";
  const cookieJSON = JSON.stringify(cookies, null, 4);
  const indented = cookieJSON
    .split("\n")
    .map((l, i) => (i === 0 ? l : "    " + l))
    .join("\n");
  const replacement = `${BEGIN}\n    const googleCookies = ${indented};\n    ${END}`;
  if (source.includes(BEGIN) && source.includes(END)) {
    source = source.replace(
      new RegExp(`${BEGIN.replace(/\//g, "\\/")}[\\s\\S]*?${END.replace(/\//g, "\\/")}`, "m"),
      replacement
    );
  } else {
    throw new Error("Cookie markers not found in bot.js");
  }
  fs.writeFileSync(BOT_JS, source, "utf8");
}

export async function POST(req: NextRequest) {
  try {
    const { cookieText } = await req.json();
    if (!cookieText?.trim()) {
      return Response.json({ error: "No cookie text provided" }, { status: 400 });
    }

    fs.writeFileSync(GOOGLE_TXT, cookieText, "utf8");

    const cookies = parseNetscapeCookies(cookieText);
    if (cookies.length === 0) {
      return Response.json({ error: "No valid cookies parsed — check Netscape format" }, { status: 400 });
    }

    injectIntoBotJs(cookies);

    return Response.json({ success: true, count: cookies.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
