import Groq from "groq-sdk";

function getKeys(): string[] {
  const raw = process.env.GROQ_API_KEYS ?? process.env.GROQ_API_KEY ?? "";
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

/**
 * Returns a Groq client using the first working API key from the
 * GROQ_API_KEYS (comma-separated) or GROQ_API_KEY env variable.
 * Tries each key with a lightweight models.list() probe until one succeeds.
 */
export async function getGroqClient(): Promise<Groq> {
  const keys = getKeys();
  if (keys.length === 0) {
    throw new Error("No Groq API keys configured. Set GROQ_API_KEYS or GROQ_API_KEY in .env.local");
  }

  let lastError: unknown;
  for (const key of keys) {
    const client = new Groq({ apiKey: key });
    try {
      await client.models.list();
      return client;
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      // 401/403 = bad key, try next. Anything else (rate limit 429, 5xx) — also try next key.
      lastError = err;
    }
  }

  throw new Error(
    `All ${keys.length} Groq API key(s) failed. Last error: ${(lastError as any)?.message ?? lastError}`
  );
}
