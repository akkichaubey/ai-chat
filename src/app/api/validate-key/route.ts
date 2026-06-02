import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, provider = 'gemini' } = await request.json();

    if (!apiKey) {
      return Response.json({ valid: false, error: 'No API key provided' }, { status: 400 });
    }

    if (provider === 'gemini') {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (resp.ok) return Response.json({ valid: true });
      return Response.json({ valid: false, error: `Gemini: ${resp.status} ${resp.statusText}` });
    }

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
    } else {
      return Response.json({ valid: false, error: 'Unknown provider' }, { status: 400 });
    }

    const resp = await fetch(testUrl, { headers });
    if (resp.ok) return Response.json({ valid: true });
    return Response.json({ valid: false, error: `${provider}: ${resp.status} ${resp.statusText}` });

  } catch (err) {
    const e = err as Error;
    return Response.json({ valid: false, error: e.message }, { status: 500 });
  }
}
