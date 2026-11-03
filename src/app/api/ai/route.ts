import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, model, systemPrompt, userPrompt } = body as {
      provider: "openai" | "gemini" | "anthropic";
      apiKey: string;
      model?: string;
      systemPrompt: string;
      userPrompt: string;
    };

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { error: "Missing API key for live LLM call. Using built-in Rubric Engine." },
        { status: 400 }
      );
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.4
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data.error?.message || "OpenAI API error" }, { status: res.status });
      }
      return NextResponse.json({ text: data.choices?.[0]?.message?.content || "" });
    }

    if (provider === "gemini") {
      const geminiModel = model || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(
        apiKey.trim()
      )}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }]
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data.error?.message || "Gemini API error" }, { status: res.status });
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return NextResponse.json({ text });
    }

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: model || "claude-3-5-sonnet-latest",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }]
        })
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data.error?.message || "Anthropic API error" }, { status: res.status });
      }
      return NextResponse.json({ text: data.content?.[0]?.text || "" });
    }

    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
