import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as secp256k1 from "https://esm.sh/@noble/secp256k1@2.1.0";
import { keccak_256 } from "https://esm.sh/@noble/hashes@1.4.0/sha3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encode packed for Ethereum (matching Solidity's abi.encodePacked)
function encodePacked(types: string[], values: (string | bigint)[]): Uint8Array {
  const parts: Uint8Array[] = [];
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];
    
    if (type === 'address') {
      // Address is 20 bytes
      const hex = (value as string).toLowerCase().replace('0x', '');
      parts.push(hexToBytes(hex.padStart(40, '0')));
    } else if (type === 'string') {
      // String is UTF-8 encoded bytes
      const encoder = new TextEncoder();
      parts.push(encoder.encode(value as string));
    } else if (type === 'uint256') {
      // uint256 is 32 bytes, big-endian
      const bigVal = typeof value === 'bigint' ? value : BigInt(value);
      const hex = bigVal.toString(16).padStart(64, '0');
      parts.push(hexToBytes(hex));
    }
  }
  
  // Concatenate all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  
  return result;
}

// Create Ethereum signed message hash (EIP-191)
function createEthSignedMessageHash(messageHash: Uint8Array): Uint8Array {
  const prefix = new TextEncoder().encode('\x19Ethereum Signed Message:\n32');
  const combined = new Uint8Array(prefix.length + messageHash.length);
  combined.set(prefix, 0);
  combined.set(messageHash, prefix.length);
  return keccak_256(combined);
}

// Sign message with private key and return signature in format contract expects
async function signMessage(messageHash: Uint8Array, privateKey: Uint8Array): Promise<string> {
  const ethSignedHash = createEthSignedMessageHash(messageHash);
  
  // Sign the hash
  const signature = await secp256k1.signAsync(ethSignedHash, privateKey);
  
  // Get r and s values (32 bytes each)
  const r = signature.r.toString(16).padStart(64, '0');
  const s = signature.s.toString(16).padStart(64, '0');
  
  // Calculate recovery id (v = 27 or 28 for Ethereum)
  const recoveryBit = signature.recovery;
  const v = (27 + (recoveryBit || 0)).toString(16).padStart(2, '0');
  
  return '0x' + r + s + v;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const privateKeyHex = Deno.env.get('REWARDS_SIGNER_PRIVATE_KEY');
    if (!privateKeyHex) {
      console.error('REWARDS_SIGNER_PRIVATE_KEY not configured');
      throw new Error('Server configuration error');
    }

    // Clean up private key - remove 0x prefix if present
    const cleanPrivateKey = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    const privateKey = hexToBytes(cleanPrivateKey);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, walletAddress, tokenId } = await req.json();

    console.log('Generating claim signature for:', { userId, walletAddress, tokenId });

    if (!userId || !walletAddress || !tokenId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, walletAddress, tokenId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's total points from database
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', userId)
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

    // Check if user already claimed today for this token
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingClaim, error: claimError } = await supabase
      .from('multichain_claims')
      .select('id')
      .eq('user_id', userId)
      .eq('chain_id', tokenId)
      .gte('claimed_at', today.toISOString())
      .maybeSingle();

    if (claimError) {
      console.error('Error checking existing claims:', claimError);
    }

    if (existingClaim) {
      return new Response(
        JSON.stringify({ error: 'Already claimed today for this token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create message hash matching the contract's verification:
    // keccak256(abi.encodePacked(user, tokenId, points))
    const packedData = encodePacked(
      ['address', 'string', 'uint256'],
      [walletAddress, tokenId, BigInt(points)]
    );
    
    const messageHash = keccak_256(packedData);
    console.log('Message hash:', bytesToHex(messageHash));
    
    // Sign the message
    const signature = await signMessage(messageHash, privateKey);
    console.log('Generated signature:', signature);

    return new Response(
      JSON.stringify({
        success: true,
        points,
        tokenId,
        walletAddress,
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
