import { NextResponse } from 'next/server';

// In-memory cache for key validation results: { [provider]: { valid: boolean, expiresAt: number } }
const validationCache: Record<string, { valid: boolean; expiresAt: number }> = {};
const CACHE_TTL = 60 * 1000; // Cache results for 60 seconds

async function checkKeyValidity(provider: string, apiKey: string): Promise<boolean> {
  const cached = validationCache[provider];
  if (cached && cached.expiresAt > Date.now()) {
    return cached.valid;
  }

  try {
    let isValid = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    if (provider === 'gemini') {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { signal: controller.signal }
      );
      isValid = resp.ok;
    } else {
      let testUrl = '';
      let headers: Record<string, string> = {};

      if (provider === 'openai') {
        testUrl = 'https://api.openai.com/v1/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
      } else if (provider === 'anthropic') {
        testUrl = 'https://api.anthropic.com/v1/models';
        headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
      } else if (provider === 'openrouter') {
        testUrl = 'https://openrouter.ai/api/v1/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
      } else if (provider === 'groq') {
        testUrl = 'https://api.groq.com/openai/v1/models';
        headers = { 'Authorization': `Bearer ${apiKey}` };
      }

      if (testUrl) {
        const resp = await fetch(testUrl, { headers, signal: controller.signal });
        isValid = resp.ok;
      }
    }

    clearTimeout(timeoutId);

    // Cache the validation result
    validationCache[provider] = {
      valid: isValid,
      expiresAt: Date.now() + CACHE_TTL
    };
    return isValid;
  } catch (err) {
    console.error(`Error validating key for ${provider}:`, err);
    return false;
  }
}

export async function GET() {
  const providers = {
    gemini: process.env.GEMINI_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    groq: process.env.GROQ_API_KEY || '',
    openrouter: process.env.OPENROUTER_API_KEY || '',
  };

  // Validate all configured keys in parallel
  const results = await Promise.all(
    Object.entries(providers).map(async ([provider, key]) => {
      if (!key) return [provider, false];
      const valid = await checkKeyValidity(provider, key);
      return [provider, valid];
    })
  );

  return NextResponse.json(Object.fromEntries(results));
}
