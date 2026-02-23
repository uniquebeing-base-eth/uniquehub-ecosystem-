import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate certificate as SVG template, then convert to PNG-compatible data
function generateCertificateSvg(userName: string, courseTitle: string, completionDate: string, certificateId: string): string {
  // Escape XML entities
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f1729"/>
      <stop offset="50%" style="stop-color:#1a2744"/>
      <stop offset="100%" style="stop-color:#0d1f3c"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f0c27f"/>
      <stop offset="50%" style="stop-color:#ffd700"/>
      <stop offset="100%" style="stop-color:#f0c27f"/>
    </linearGradient>
    <linearGradient id="blue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#60a5fa"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Golden border -->
  <rect x="20" y="20" width="1160" height="590" rx="12" fill="none" stroke="url(#gold)" stroke-width="3"/>
  <rect x="30" y="30" width="1140" height="570" rx="8" fill="none" stroke="url(#gold)" stroke-width="1" opacity="0.5"/>
  
  <!-- Corner decorations -->
  <circle cx="50" cy="50" r="8" fill="url(#gold)" opacity="0.8"/>
  <circle cx="1150" cy="50" r="8" fill="url(#gold)" opacity="0.8"/>
  <circle cx="50" cy="580" r="8" fill="url(#gold)" opacity="0.8"/>
  <circle cx="1150" cy="580" r="8" fill="url(#gold)" opacity="0.8"/>
  
  <!-- Star decoration -->
  <text x="600" y="90" text-anchor="middle" font-size="32" fill="url(#gold)">★</text>
  
  <!-- Title -->
  <text x="600" y="140" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="bold" fill="url(#gold)" letter-spacing="6">CERTIFICATE OF COMPLETION</text>
  
  <!-- Decorative line -->
  <line x1="250" y1="165" x2="950" y2="165" stroke="url(#gold)" stroke-width="1.5" opacity="0.6"/>
  
  <!-- This certifies that -->
  <text x="600" y="220" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#94a3b8">This certifies that</text>
  
  <!-- User name -->
  <text x="600" y="275" text-anchor="middle" font-family="Georgia, serif" font-size="38" font-weight="bold" fill="white">${esc(userName)}</text>
  
  <!-- Underline for name -->
  <line x1="300" y1="290" x2="900" y2="290" stroke="url(#gold)" stroke-width="1" opacity="0.4"/>
  
  <!-- has successfully completed -->
  <text x="600" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#94a3b8">has successfully completed the course</text>
  
  <!-- Course title -->
  <text x="600" y="395" text-anchor="middle" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="url(#gold)">${esc(courseTitle)}</text>
  
  <!-- Date -->
  <text x="600" y="460" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#64748b">Completion Date: ${esc(completionDate)}</text>
  
  <!-- Certificate ID -->
  <text x="600" y="490" text-anchor="middle" font-family="monospace" font-size="12" fill="#475569">Certificate ID: ${esc(certificateId.substring(0, 8))}</text>
  
  <!-- Bottom separator -->
  <line x1="250" y1="520" x2="950" y2="520" stroke="url(#gold)" stroke-width="1" opacity="0.4"/>
  
  <!-- UniqueHub branding -->
  <rect x="480" y="540" width="240" height="40" rx="20" fill="url(#blue)" opacity="0.2"/>
  <text x="600" y="567" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="url(#blue)">🎓 UniqueHub</text>
  
  <!-- Website -->
  <text x="600" y="600" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#475569">uniquehub.xyz</text>
</svg>`;
}

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

    // Verify course completion
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

    const certificateId = crypto.randomUUID();

    // Generate SVG certificate
    console.log("Generating template-based certificate...");
    const svgContent = generateCertificateSvg(userName, course.title, completionDate, certificateId);
    
    // Store SVG as certificate image (SVG is a valid image format)
    const fileName = `${user.id}/${certificateId}.svg`;
    const svgBlob = new TextEncoder().encode(svgContent);

    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(fileName, svgBlob, {
        contentType: "image/svg+xml",
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload certificate image");
    }

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

    console.log("Certificate generated successfully (template):", certificateId);

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
