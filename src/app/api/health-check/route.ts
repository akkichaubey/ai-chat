import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, provider = 'gemini', model } = await request.json();

    if (!model) {
      return Response.json({ healthy: false, error: 'Model parameter is missing' }, { status: 400 });
    }

    let keyToValidate = apiKey;
    if (!keyToValidate) {
      if (provider === 'gemini') {
        keyToValidate = process.env.GEMINI_API_KEY;
      } else if (provider === 'openai') {
        keyToValidate = process.env.OPENAI_API_KEY;
      } else if (provider === 'anthropic') {
        keyToValidate = process.env.ANTHROPIC_API_KEY;
      } else if (provider === 'openrouter') {
        keyToValidate = process.env.OPENROUTER_API_KEY;
      } else if (provider === 'groq') {
        keyToValidate = process.env.GROQ_API_KEY;
      }
    }

    if (!keyToValidate) {
      return Response.json({ healthy: false, error: 'API key is missing' }, { status: 400 });
    }

    let url = '';
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let body = '';

    if (provider === 'gemini') {
      let activeModel = model;
      if (activeModel === 'gemma-4-31b-it') {
        activeModel = 'gemini-2.5-flash';
      } else if (activeModel === 'gemma-2-27b-it') {
        activeModel = 'gemma2-27b-it';
      } else if (activeModel === 'gemma-2-9b-it') {
        activeModel = 'gemma2-9b-it';
      } else if (activeModel === 'gemma-2-2b-it') {
        activeModel = 'gemma2-2b-it';
      }

      url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${keyToValidate}`;
      body = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1 }
      });
    } else if (provider === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keyToValidate}`;
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      });
    } else if (provider === 'anthropic') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = keyToValidate;
      headers['anthropic-version'] = '2023-06-01';
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      });
    } else if (provider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keyToValidate}`;
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      });
    } else if (provider === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${keyToValidate}`;
      body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      });
    } else {
      return Response.json({ healthy: false, error: 'Unknown provider' }, { status: 400 });
    }

    const start = Date.now();
    
    // Set a 10-second timeout for the fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      });
    } catch (fetchErr) {
      const e = fetchErr as Error;
      return Response.json({ 
        healthy: false, 
        error: e.name === 'AbortError' ? 'Request Timeout' : e.message, 
        latency: Date.now() - start 
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const latency = Date.now() - start;

    if (!resp.ok) {
      const errText = await resp.text();
      let errorMsg = `Error ${resp.status}: ${resp.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errorMsg = parsed.error.message;
        } else if (parsed.error) {
          errorMsg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
        }
      } catch {}
      return Response.json({ healthy: false, error: errorMsg, latency });
    }

    return Response.json({ healthy: true, latency });

  } catch (err) {
    const e = err as Error;
    return Response.json({ healthy: false, error: e.message }, { status: 500 });
  }
}
