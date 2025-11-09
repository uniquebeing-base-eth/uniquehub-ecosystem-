import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const systemPrompt = `You are UniqBot, the official AI assistant of UniqueHub, a Web3 learning and earning platform.

Your purpose is to help users:
- Understand how UniqueHub works (courses, points, earnings, marketplace, NFTs, wallet features, etc.)
- Explain educational terms and concepts
- Define the meaning of words simply and clearly

About UniqueHub:
- UniqueHub is a Web3 education platform where users can learn, earn, and trade
- Users earn UNIQ points by completing tasks like daily check-ins, watching videos, and taking courses
- The platform features courses (both free and paid), an NFT marketplace, and a wallet
- Users can connect via Farcaster for authentication
- The platform token UNIQ is coming soon
- Users can earn by creating and selling courses or NFT items

Always sound friendly, intelligent, and supportive.
Keep your answers short, clear, and easy to read.
Be polite and encouraging.
Never give financial, medical, or legal advice.
End some responses with warm, motivational lines like "Keep learning with UniqueHub 💙" or "You're doing great — stay curious!"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg: any) => ({ role: msg.role, content: msg.content }))
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Failed to get response from AI');
    }

    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in uniqbot-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
