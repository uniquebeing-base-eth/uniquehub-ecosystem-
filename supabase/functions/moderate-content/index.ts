import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, contentType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Moderating content: ${contentType}, URL: ${imageUrl.substring(0, 100)}...`);

    const moderationPrompt = `You are a content moderation AI for an educational platform called UniqueHub. 
Analyze this image and determine if it's appropriate for an educational course platform.

Flag content as INAPPROPRIATE if it contains:
- Sexually explicit or suggestive content
- Nudity or revealing clothing
- Violence or gore
- Hate symbols or offensive imagery
- Drug use or drug paraphernalia
- Personal selfies that are not educational
- Random screen recordings that don't appear educational
- Off-topic content unrelated to learning

Flag content as NEEDS_REVIEW if it:
- Appears to be a casual selfie video thumbnail
- Looks like a random phone recording
- Doesn't clearly show educational content
- Is ambiguous in nature

Mark as APPROVED if it:
- Shows presentation slides or whiteboard
- Shows code editor or programming content
- Shows educational diagrams or charts
- Has professional thumbnail design
- Appears to be genuine educational content
- Shows instructor in teaching setting

Respond in this exact JSON format only:
{
  "status": "approved" | "needs_review" | "rejected",
  "reason": "Brief explanation",
  "confidence": 0.0-1.0,
  "flags": ["list", "of", "specific", "issues"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: moderationPrompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Default to needs_review if AI fails
      return new Response(
        JSON.stringify({
          status: "needs_review",
          reason: "Automated moderation unavailable, flagged for manual review",
          confidence: 0,
          flags: ["moderation_error"]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", aiResponse);

    // Parse JSON from response
    let moderationResult;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Default to needs_review if parsing fails
      moderationResult = {
        status: "needs_review",
        reason: "Could not parse moderation result, flagged for manual review",
        confidence: 0.5,
        flags: ["parse_error"]
      };
    }

    // Normalize status values
    if (moderationResult.status === "rejected") {
      moderationResult.status = "rejected";
    } else if (moderationResult.status === "approved") {
      moderationResult.status = "approved";
    } else {
      moderationResult.status = "needs_review";
    }

    console.log("Moderation result:", moderationResult);

    return new Response(
      JSON.stringify(moderationResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        status: "needs_review",
        reason: "Error during moderation, flagged for manual review",
        confidence: 0,
        flags: ["system_error"]
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
