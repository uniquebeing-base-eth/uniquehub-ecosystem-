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

    // Generate certificate using HTML/CSS for better rendering
    console.log("Generating certificate image...");
    
    // Create an HTML template that can be rendered as an image
    const certificateHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 800px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    }
    .certificate {
      width: 1120px;
      height: 720px;
      background: transparent;
      border: 8px solid #FFD700;
      border-radius: 10px;
      padding: 20px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .inner-border {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 2px solid #FFD700;
      border-radius: 5px;
    }
    .content {
      z-index: 1;
      text-align: center;
      color: white;
    }
    h1 {
      font-size: 48px;
      color: #FFD700;
      margin-bottom: 30px;
      font-weight: bold;
    }
    .subtitle {
      font-size: 24px;
      margin-bottom: 40px;
    }
    .name {
      font-size: 42px;
      font-weight: bold;
      margin: 40px 0;
    }
    .course {
      font-size: 36px;
      color: #FFD700;
      font-weight: bold;
      margin: 40px 0;
      padding: 0 40px;
    }
    .date {
      font-size: 20px;
      margin: 40px 0;
    }
    .issuer {
      font-size: 24px;
      font-weight: bold;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="inner-border"></div>
    <div class="content">
      <h1>CERTIFICATE OF COMPLETION</h1>
      <p class="subtitle">This certifies that</p>
      <p class="name">${userName}</p>
      <p class="subtitle">has successfully completed</p>
      <p class="course">${course.title}</p>
      <p class="date">Completion Date: ${completionDate}</p>
      <p class="issuer">Issued by UniqueHub</p>
    </div>
  </div>
</body>
</html>`;

    // Convert HTML to image using an external service (Cloudinary or similar)
    // For now, we'll use SVG but with a data URL that Farcaster can handle
    const svgCertificate = `<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="1200" height="800" fill="url(#bgGradient)"/>
  <rect x="40" y="40" width="1120" height="720" fill="none" stroke="#FFD700" stroke-width="8" rx="10"/>
  <rect x="60" y="60" width="1080" height="680" fill="none" stroke="#FFD700" stroke-width="2" rx="5"/>
  
  <text x="600" y="150" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFD700" text-anchor="middle">CERTIFICATE OF COMPLETION</text>
  
  <text x="600" y="220" font-family="Arial, sans-serif" font-size="24" fill="#FFFFFF" text-anchor="middle">This certifies that</text>
  
  <text x="600" y="320" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${userName}</text>
  
  <text x="600" y="400" font-family="Arial, sans-serif" font-size="24" fill="#FFFFFF" text-anchor="middle">has successfully completed</text>
  
  <text x="600" y="480" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#FFD700" text-anchor="middle">${course.title}</text>
  
  <text x="600" y="580" font-family="Arial, sans-serif" font-size="20" fill="#FFFFFF" text-anchor="middle">Completion Date: ${completionDate}</text>
  
  <text x="600" y="680" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Issued by UniqueHub</text>
</svg>`;

    // Convert SVG to PNG using an image conversion API for better Farcaster compatibility
    const certificateId = crypto.randomUUID();
    
    // Use SVG to PNG conversion service
    const svgBase64 = btoa(unescape(encodeURIComponent(svgCertificate)));
    
    // Try using a conversion service or store as data URL
    // For now, we'll upload the SVG but serve it as PNG via Supabase transform
    const binaryData = Uint8Array.from(atob(svgBase64), c => c.charCodeAt(0));
    
    const fileName = `${user.id}/${certificateId}.svg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(fileName, binaryData, {
        contentType: "image/svg+xml",
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload certificate image");
    }

    // Get public URL with transformation to PNG for better compatibility
    const { data: { publicUrl } } = supabase.storage
      .from("certificates")
      .getPublicUrl(fileName, {
        transform: {
          width: 1200,
          height: 800,
          format: 'origin'
        }
      });

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
