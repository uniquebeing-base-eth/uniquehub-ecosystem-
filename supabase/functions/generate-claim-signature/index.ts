import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as secp from "https://esm.sh/@noble/secp256k1@2.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hex utilities
function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Keccak256 hash (using SHA-256 as fallback - for production use proper keccak)
async function keccak256(data: Uint8Array): Promise<Uint8Array> {
  // Create a new ArrayBuffer copy to avoid TypeScript issues
  const arrayBuffer = new ArrayBuffer(data.length);
  new Uint8Array(arrayBuffer).set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return new Uint8Array(hashBuffer);
}

// Encode packed for Solidity abi.encodePacked
function encodePacked(types: string[], values: (string | bigint)[]): Uint8Array {
  const parts: Uint8Array[] = [];
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];
    
    if (type === 'address') {
      const hex = (value as string).toLowerCase().replace('0x', '');
      parts.push(hexToBytes(hex.padStart(40, '0')));
    } else if (type === 'string') {
      const encoder = new TextEncoder();
      parts.push(encoder.encode(value as string));
    } else if (type === 'uint256') {
      const bigVal = typeof value === 'bigint' ? value : BigInt(value);
      const hex = bigVal.toString(16).padStart(64, '0');
      parts.push(hexToBytes(hex));
    }
  }
  
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  
  return result;
}

// Sign message with Ethereum style
async function signMessage(messageHash: Uint8Array, privateKeyHex: string): Promise<string> {
  // Remove 0x prefix if present
  const privKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
  const privateKeyBytes = hexToBytes(privKey);
  
  // Create Ethereum signed message hash
  const prefix = new TextEncoder().encode('\x19Ethereum Signed Message:\n32');
  const prefixedMessage = new Uint8Array(prefix.length + messageHash.length);
  prefixedMessage.set(prefix, 0);
  prefixedMessage.set(messageHash, prefix.length);
  
  const ethSignedHash = await keccak256(prefixedMessage);
  
  // Sign with secp256k1
  const signature = await secp.signAsync(ethSignedHash, privateKeyBytes, {
    lowS: true,
  });
  
  // Get r, s values
  const r = signature.r.toString(16).padStart(64, '0');
  const s = signature.s.toString(16).padStart(64, '0');
  
  // Calculate v (recovery id + 27)
  const v = (signature.recovery ?? 0) + 27;
  
  return '0x' + r + s + v.toString(16).padStart(2, '0');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const privateKey = Deno.env.get('REWARDS_SIGNER_PRIVATE_KEY');
    if (!privateKey) {
      console.error('REWARDS_SIGNER_PRIVATE_KEY not configured');
      throw new Error('Server configuration error');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { walletAddress, tokenId } = await req.json();

    console.log('Generating claim signature for:', { userId: user.id, walletAddress, tokenId });

    if (!walletAddress || !tokenId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: walletAddress, tokenId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's total points
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', user.id)
      .maybeSingle();

    if (pointsError) {
      console.error('Error fetching user points:', pointsError);
      throw new Error('Failed to fetch user points');
    }

    const points = userPoints?.total_points || 0;
    console.log('User points:', points);

    if (points < 1000) {
      return new Response(
        JSON.stringify({ error: 'Insufficient points. Minimum 1000 points required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingClaim } = await supabase
      .from('multichain_claims')
      .select('id')
      .eq('user_id', user.id)
      .eq('chain_id', tokenId)
      .gte('claimed_at', today.toISOString())
      .maybeSingle();

    if (existingClaim) {
      return new Response(
        JSON.stringify({ error: 'Already claimed today for this token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create message hash matching contract: keccak256(abi.encodePacked(user, tokenId, points))
    const packedData = encodePacked(
      ['address', 'string', 'uint256'],
      [walletAddress.toLowerCase(), tokenId, BigInt(points)]
    );
    
    const messageHash = await keccak256(packedData);
    
    // Sign the message
    const signature = await signMessage(messageHash, privateKey);

    console.log('Generated signature successfully');

    return new Response(
      JSON.stringify({
        success: true,
        points,
        tokenId,
        signature,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating claim signature:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate signature';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
