import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { courseId } = await req.json();

    // Verify course completion for every user
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("progress_percentage, course_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (enrollmentError || !enrollment || enrollment.progress_percentage !== 100) {
      throw new Error("Course not completed");
    }
    

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (existingCert) {
      return new Response(
        JSON.stringify({ certificate: existingCert, message: "Certificate already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get course and profile data
    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", courseId)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, farcaster_username")
      .eq("user_id", user.id)
      .single();

    if (!course || !profile) {
      throw new Error("Course or profile not found");
    }

    const userName = profile.display_name || profile.farcaster_username || "Student";
    const completionDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    // Generate certificate using AI image generation for proper PNG output
    console.log("Generating certificate image with AI...");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Generate a beautiful certificate image using AI
    const imagePrompt = `Create a professional certificate of completion. The certificate should have:
- A rich purple and blue gradient background
- An elegant golden border with decorative corners
- Large title "CERTIFICATE OF COMPLETION" in gold text at the top
- Text "This certifies that" followed by the name "${userName}" in white bold text
- Text "has successfully completed" followed by the course title "${course.title}" in gold text
- "Completion Date: ${completionDate}" at the bottom
- "Issued by UniqueHub" with a small blue cube icon
- Overall professional, elegant, award-certificate style
- Size should be 1200x630 pixels (16:9 aspect ratio for social sharing)
Ultra high resolution, clean design, no watermarks.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI image generation failed:", errorText);
      throw new Error("Failed to generate certificate image");
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract the base64 image from response
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageBase64) {
      console.error("No image in AI response:", JSON.stringify(aiData));
      throw new Error("No image generated");
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    
    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const certificateId = crypto.randomUUID();
    const fileName = `${user.id}/${certificateId}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload certificate image");
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("certificates")
      .getPublicUrl(fileName);

    // Create metadata JSON for NFT
    const metadata = {
      name: `UniqueHub Certificate - ${course.title}`,
      description: `Certificate of completion for ${course.title} on UniqueHub, issued to ${userName}`,
      image: publicUrl,
      attributes: [
        { trait_type: "Course", value: course.title },
        { trait_type: "Recipient", value: userName },
        { trait_type: "Completion Date", value: completionDate },
        { trait_type: "Certificate ID", value: certificateId },
        { trait_type: "Platform", value: "UniqueHub" }
      ]
    };

    // Upload metadata JSON
    const metadataFileName = `${user.id}/${certificateId}-metadata.json`;
    const { error: metadataError } = await supabase.storage
      .from("certificates")
      .upload(metadataFileName, JSON.stringify(metadata), {
        contentType: "application/json",
        upsert: false
      });

    if (metadataError) {
      console.error("Metadata upload error:", metadataError);
    }

    const { data: { publicUrl: tokenUri } } = supabase.storage
      .from("certificates")
      .getPublicUrl(metadataFileName);

    // Save certificate to database
    const { data: certificate, error: dbError } = await supabase
      .from("certificates")
      .insert({
        user_id: user.id,
        course_id: courseId,
        certificate_id: certificateId,
        image_url: publicUrl,
        token_uri: tokenUri
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save certificate");
    }

    console.log("Certificate generated successfully:", certificateId);

    return new Response(
      JSON.stringify({ certificate, metadata }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-certificate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
