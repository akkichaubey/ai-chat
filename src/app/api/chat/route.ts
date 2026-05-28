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

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      model, 
      apiKey: clientApiKey, 
      temperature,
      systemPrompt,
      thinkingEnabled,
      webSearchEnabled
    } = await request.json();
    
    // API key precedence:
    // 1. Client-supplied API key from headers/settings
    // 2. Server-side environment variable GEMINI_API_KEY
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is missing. Please set it in the Settings panel.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
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
