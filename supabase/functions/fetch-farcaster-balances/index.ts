// Fetch Base ETH and USDC balances for the authenticated user's Farcaster wallet.
// Uses Neynar to resolve custody/verified addresses and Alchemy to fetch balances.
// Returns formatted strings with correct decimals for display.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_ALCHEMY_URL = (apiKey: string) => `https://base-mainnet.g.alchemy.com/v2/${apiKey}`;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function parseHexToBigInt(hexOrDec: string): bigint {
  if (!hexOrDec) return 0n;
  if (hexOrDec.startsWith('0x')) return BigInt(hexOrDec);
  return BigInt(hexOrDec);
}

function formatUnitsFixed(value: bigint, decimals: number, fractionDigits: number): string {
  const base = 10n ** BigInt(decimals);
  const integer = value / base;
  const fraction = value % base;
  // Scale fraction to requested digits with rounding
  const scale = 10n ** BigInt(decimals);
  const scaled = (fraction * (10n ** BigInt(fractionDigits))) / scale;
  const fractionStr = scaled.toString().padStart(fractionDigits, '0');
  return `${integer.toString()}.${fractionStr}`;
}

async function rpcCall(url: string, method: string, params: unknown[]) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} failed: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const neynarApiKey = Deno.env.get('NEYNAR_API_KEY')!;
    const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY')!;

    if (!neynarApiKey || !alchemyApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing NEYNAR_API_KEY or ALCHEMY_API_KEY' }),
        { status: 500, headers: { 'content-type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json', ...corsHeaders },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fid')
      .eq('id', auth.user.id)
      .single();

    if (profileError || !profile?.fid) {
      return new Response(JSON.stringify({ error: 'FID not found' }), {
        status: 400,
        headers: { 'content-type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch Neynar user to get custody + verified addresses
    const neynarRes = await fetch(
      `https://api.neynar.com/v2/farcaster/user?fid=${profile.fid}`,
      { headers: { 'accept': 'application/json', 'api_key': neynarApiKey } }
    );
    if (!neynarRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch Neynar user' }), {
        status: 502,
        headers: { 'content-type': 'application/json', ...corsHeaders },
      });
    }
    const neynarData = await neynarRes.json();

    const custody = neynarData?.result?.user?.custody_address || neynarData?.user?.custodyAddress;
    const verifiedAddrs: string[] =
      neynarData?.result?.user?.verifications || neynarData?.user?.verifiedAddresses || [];

    const address: string = custody || verifiedAddrs[0] || '';
    if (!address) {
      return new Response(JSON.stringify({ error: 'No Farcaster wallet address found' }), {
        status: 404,
        headers: { 'content-type': 'application/json', ...corsHeaders },
      });
    }

    const rpcUrl = BASE_ALCHEMY_URL(alchemyApiKey);

    // ETH balance
    const ethHex: string = await rpcCall(rpcUrl, 'eth_getBalance', [address, 'latest']);
    const ethBI = parseHexToBigInt(ethHex);
    const ethFormatted = formatUnitsFixed(ethBI, 18, 4);

    // USDC balance via alchemy_getTokenBalances
    const tokenRes = await rpcCall(rpcUrl, 'alchemy_getTokenBalances', [
      address,
      [USDC_ADDRESS],
    ]);
    const usdcHex = tokenRes?.tokenBalances?.[0]?.tokenBalance ?? '0x0';
    const usdcBI = parseHexToBigInt(usdcHex);
    const usdcFormatted = formatUnitsFixed(usdcBI, 6, 2);

    const payload = {
      address,
      eth: { value: ethHex, formatted: ethFormatted },
      usdc: { value: usdcHex, formatted: usdcFormatted },
    };

    return new Response(JSON.stringify(payload), {
      headers: { 'content-type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json', ...corsHeaders },
    });
  }
});
