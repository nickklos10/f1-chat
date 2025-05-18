// src/app/api/chat/route.ts

import { NextRequest } from "next/server";
import { Message } from "ai";
import { embed, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { DataAPIClient } from "@datastax/astra-db-ts";

export const runtime = "edge";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env!;

// Initialize your AstraDB client once
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { keyspace: ASTRA_DB_NAMESPACE! });

// Define type for AstraDB document
interface AstraDocument {
  text: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  // 1) parse & assert body
  const { messages } = (await req.json()) as { messages: Message[] };

  // 2) create embedding for the latest user message
  const latest = messages[messages.length - 1]?.content ?? "";
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: latest,
  });

  // 3) look up your collection exactly once per request
  let coll;
  try {
    // try opening an existing collection
    coll = await db.collection(ASTRA_DB_COLLECTION!);
  } catch (err: Error | unknown) {
    // if it really doesn't exist, then create it
    if (
      err instanceof Error &&
      (err.name === "CollectionNotFoundError" || /not found/i.test(err.message))
    ) {
      coll = await db.createCollection(ASTRA_DB_COLLECTION!);
    } else {
      console.error("AstraDB error:", err);
      // you can decide to fail here or proceed without context
      return new Response(
        JSON.stringify({ error: "AstraDB error fetching collection" }),
        { status: 500 }
      );
    }
  }

  // 4) run your vector query
  let documentContext = "";
  try {
    const cursor = coll.find(null, {
      sort: { $vector: embedding },
      limit: 10,
    });
    const docs = (await cursor.toArray()) as AstraDocument[];
    documentContext = JSON.stringify(docs.map((d) => d.text));
  } catch (err: unknown) {
    console.warn("AstraDB query failed—continuing without context", err);
  }

  const context_timestamp = new Date().toISOString();
  const systemPrompt = `
  
      You are F1GPT, an AI assistant who specialises exclusively in Formula 1.

      1 — Time-awareness
      Today is ${context_timestamp}.  
      Treat this value as "now" whenever you reason about dates or decide what is current.

      2 — Authoritative data comes first
      When you answer, always prefer the latest facts that appear in ${documentContext}.  
      If the needed fact is absent, fall back on your own knowledge—but **never** say that you did so or mention the context file.

      3 — Mandatory extraction targets  
      From every ${documentContext} you receive, silently pull out (when present):

      - the next scheduled Grand Prix (official name, circuit, country, full calendar date)  
      - the latest top-level Drivers' and Constructors' championship tables (names, points, positions)  
      - any breaking news item dated after the most recent Grand Prix  

      Store those pieces in working memory so that direct questions like  
      "Where is the next race?" or "Show me the current standings" can be answered in a single turn.

      4 — Answer-style rules
      • Write normal prose paragraphs (no bullet points in the answer unless the user explicitly asks).  
      • Use markdown where useful (tables are allowed for standings).  
      • State complete calendar dates, e.g. "17 May 2025", not "next Sunday".  
      • Do **not** embed or return images.  
      • Do **not** cite, reference, or hint at the existence of ${documentContext}.
      • Do **not** cite or mention any articles or sources in your answer.

      5 — If information is genuinely unknown
      Reply briefly that the data is not available yet (e.g. "The FIA has not published the next race date as of ${context_timestamp}.").  
      Never speculate or hallucinate.

    -------
    START OF CONTEXT
    ${documentContext}
    END OF CONTEXT
    -------
`;

  // Create the streaming response with a specific maxTokens to ensure complete responses
  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
    temperature: 0.2,
    maxTokens: 1500,
    stopSequences: [],
  });

  // Convert to a more reliable streaming response
  const streamResponse = result.toDataStreamResponse({
    headers: {
      // Set headers to prevent premature connection closure
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });

  return streamResponse;
}
