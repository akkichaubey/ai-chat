import { GoogleGenAI } from '@google/genai';
import { NextRequest } from 'next/server';

interface MessageAttachment {
  type: string;
  data: string;
}

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
  attachments?: MessageAttachment[];
}

interface ContentPartText {
  text: string;
}

interface ContentPartInline {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

type ContentPart = ContentPartText | ContentPartInline;

async function streamOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: MessageItem[],
  temperature: number | undefined,
  systemPrompt: string | undefined
): Promise<Response> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ],
    stream: true,
    temperature: temperature ?? 1.0
  };

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    let detailMsg = errText;
    try {
      const parsedJSON = JSON.parse(errText);
      if (parsedJSON.error?.message) {
        detailMsg = parsedJSON.error.message;
      } else if (parsedJSON.error) {
        detailMsg = typeof parsedJSON.error === 'string' ? parsedJSON.error : JSON.stringify(parsedJSON.error);
      }
    } catch {}
    throw new Error(`API error ${resp.status}: ${detailMsg}`);
  }

  const reader = resp.body!.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const text = json.choices?.[0]?.delta?.content;
              if (text) controller.enqueue(encoder.encode(text));
            } catch {}
          }
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
  });
}

async function streamAnthropic(
  apiKey: string,
  model: string,
  messages: MessageItem[],
  temperature: number | undefined,
  systemPrompt: string | undefined
): Promise<Response> {
  const body: Record<string, unknown> = {
    model,
    max_tokens: 8096,
    stream: true,
    temperature: temperature ?? 1.0,
    messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
  };
  if (systemPrompt) body.system = systemPrompt;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    let detailMsg = errText;
    try {
      const parsedJSON = JSON.parse(errText);
      if (parsedJSON.error?.message) {
        detailMsg = parsedJSON.error.message;
      } else if (parsedJSON.error) {
        detailMsg = typeof parsedJSON.error === 'string' ? parsedJSON.error : JSON.stringify(parsedJSON.error);
      }
    } catch {}
    throw new Error(`Anthropic error ${resp.status}: ${detailMsg}`);
  }

  const reader = resp.body!.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('event:')) continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              if (json.type === 'content_block_delta') {
                const text = json.delta?.text;
                if (text) controller.enqueue(encoder.encode(text));
              }
            } catch {}
          }
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
  });
}

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      model,
      apiKey: clientApiKey,
      temperature,
      systemPrompt,
      thinkingEnabled,
      webSearchEnabled,
      provider = 'gemini'
    } = await request.json();

    // API key precedence:
    // 1. Client-supplied API key from settings
    // 2. Server-side environment variable fallback specific to provider
    let apiKey = clientApiKey;
    if (!apiKey) {
      if (provider === 'gemini') {
        apiKey = process.env.GEMINI_API_KEY;
      } else if (provider === 'openai') {
        apiKey = process.env.OPENAI_API_KEY;
      } else if (provider === 'anthropic') {
        apiKey = process.env.ANTHROPIC_API_KEY;
      } else if (provider === 'groq') {
        apiKey = process.env.GROQ_API_KEY;
      } else if (provider === 'openrouter') {
        apiKey = process.env.OPENROUTER_API_KEY;
      }
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is missing. Please set it in the Settings panel.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (provider === 'openai') {
      return await streamOpenAICompatible('https://api.openai.com/v1/chat/completions', apiKey, model, messages, temperature, systemPrompt);
    }
    if (provider === 'openrouter') {
      return await streamOpenAICompatible('https://openrouter.ai/api/v1/chat/completions', apiKey, model, messages, temperature, systemPrompt);
    }
    if (provider === 'groq') {
      return await streamOpenAICompatible('https://api.groq.com/openai/v1/chat/completions', apiKey, model, messages, temperature, systemPrompt);
    }
    if (provider === 'anthropic') {
      return await streamAnthropic(apiKey, model, messages, temperature, systemPrompt);
    }

    let ai = new GoogleGenAI({ apiKey });
    
    // Format the messages for the Google GenAI SDK (maps 'assistant' -> 'model')
    // Supports inlineData for image and PDF attachments
    const formattedContents = messages.map((msg: MessageItem) => {
      const parts: ContentPart[] = [];
      
      // Add text content if present (or fallback to empty string if attachments exist)
      if (msg.content || !msg.attachments || msg.attachments.length === 0) {
        parts.push({ text: msg.content || '' });
      }
      
      // Add any image or PDF attachments as inlineData
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att: MessageAttachment) => {
          if (att.type.startsWith('image/') || att.type === 'application/pdf') {
            parts.push({
              inlineData: {
                mimeType: att.type,
                data: att.data
              }
            });
          }
        });
      }
      
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts
      };
    });
    
    // Build the configuration
    const config: Record<string, unknown> = {};
    if (temperature !== undefined) {
      config.temperature = temperature;
    }
    
    if (systemPrompt) {
      config.systemInstruction = systemPrompt;
    }
    
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
    
    // Web Search Override
    if (webSearchEnabled) {
      activeModel = 'gemini-2.5-flash';
      config.tools = [{ googleSearch: {} }];
    }
    
    // Configure thinking/reasoning parameters dynamically
    if (thinkingEnabled) {
      if (activeModel.startsWith('gemma')) {
        config.thinkingConfig = {
          thinkingLevel: 'high'
        };
      } else if (activeModel.startsWith('gemini-2.5')) {
        config.thinkingConfig = {
          thinkingBudget: -1
        };
      }
    } else {
      if (activeModel.startsWith('gemini-2.5')) {
        config.thinkingConfig = {
          thinkingBudget: 0
        };
      }
    }
    
    // Call the streaming API with an exponential backoff retry mechanism to mitigate Gemma 4 transient 500/503 server errors
    let responseStream: Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['models']['generateContentStream']>> | undefined = undefined;
    const attempts = 4;
    let delay = 1000;
    
    for (let i = 0; i < attempts; i++) {
      try {
        responseStream = await ai.models.generateContentStream({
          model: activeModel,
          contents: formattedContents,
          config: config as Parameters<InstanceType<typeof GoogleGenAI>['models']['generateContentStream']>[0]['config']
        });
        break;
      } catch (error) {
        const err = error as { status?: number; message?: string };
        const errorMsg = String(err.message || '');
        
        // Automatic authentication error detection & server-side key fallback
        const isAuthError = 
          err.status === 401 ||
          err.status === 400 ||
          errorMsg.includes('401') ||
          errorMsg.includes('400') ||
          errorMsg.toLowerCase().includes('api key') ||
          errorMsg.toLowerCase().includes('key expired') ||
          errorMsg.toLowerCase().includes('authentication') ||
          errorMsg.toLowerCase().includes('unauthenticated') ||
          errorMsg.toLowerCase().includes('invalid');

        if (isAuthError && clientApiKey && process.env.GEMINI_API_KEY && clientApiKey !== process.env.GEMINI_API_KEY) {
          console.warn("[API KEY FALLBACK] Client-supplied key failed authentication. Retrying with server environment GEMINI_API_KEY...");
          ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          try {
            responseStream = await ai.models.generateContentStream({
              model: activeModel,
              contents: formattedContents,
              config: config as Parameters<InstanceType<typeof GoogleGenAI>['models']['generateContentStream']>[0]['config']
            });
            break;
          } catch (retryErr) {
            throw retryErr;
          }
        }

        const isTransientError =
          err.status === 500 ||
          err.status === 503 ||
          errorMsg.includes('500') ||
          errorMsg.includes('503') ||
          errorMsg.toLowerCase().includes('internal') ||
          errorMsg.toLowerCase().includes('unavailable');

        if (isTransientError && i < attempts - 1) {
          console.warn(`[API WARNING] Attempt ${i + 1}/${attempts} failed. Retrying in ${delay}ms... Error: ${errorMsg}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw error;
        }
      }
    }
    
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!responseStream) {
            throw new Error('Response stream not initialized');
          }
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error in API Chat route:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
