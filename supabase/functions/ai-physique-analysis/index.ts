import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are an expert fitness and physique analyst AI. You analyze body photos and provide a detailed, objective assessment of the person's physique.

You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no commentary. The JSON must have exactly this shape:

{
  "physiqueScore": <number 1-10, one decimal>,
  "bodyFatEstimate": <number, estimated body fat percentage, one decimal>,
  "bodyFatTrend": "<"decreasing" | "stable" | "increasing" — your best guess based on visible leanness>,
  "muscleDefinition": <number 0-100>,
  "shoulderWidth": <number 0-100>,
  "chestDevelopment": <number 0-100>,
  "armGrowth": <number 0-100>,
  "waistReduction": <number 0-100, higher = leaner waist>,
  "postureImprovement": <number 0-100>,
  "symmetry": <number 0-100>,
  "estimatedMuscleMassKg": <number, estimated lean muscle mass in kg>,
  "estimatedHeightCm": <number or null>,
  "suggestions": [<5 actionable, specific training/nutrition tips as strings>],
  "report": "<2-3 sentence summary of the physique analysis>"
}

Base scores on visible muscularity, leanness, symmetry, and posture. Be encouraging but honest. If you cannot see the full body, estimate based on what is visible.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY_NOT_CONFIGURED",
          message: "The AI analysis feature requires an OpenAI API key. Please add it as a secret named OPENAI_API_KEY in your Supabase project settings.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { photoUrl } = await req.json();

    if (!photoUrl || typeof photoUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "MISSING_PHOTO", message: "A photo URL is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this physique photo. Estimate body composition, muscle development across body parts, posture, symmetry, and provide an overall physique score with suggestions for improvement. Respond with ONLY the JSON object.",
              },
              {
                type: "image_url",
                image_url: { url: photoUrl, detail: "high" },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_ERROR",
          message: `OpenAI API returned an error (${openaiResponse.status}). ${errText.slice(0, 200)}`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "NO_RESPONSE", message: "The AI did not return any analysis." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "PARSE_ERROR", message: "The AI response could not be parsed." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ analysis, raw: openaiData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "SERVER_ERROR", message: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
