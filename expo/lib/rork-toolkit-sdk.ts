import { z } from 'zod';

export type TextPart = { type: 'text'; text: string };
export type ImagePart = { type: 'image'; image: string };
export type UserMessage = { role: 'user'; content: string | (TextPart | ImagePart)[] };
export type AssistantMessage = { role: 'assistant'; content: string | TextPart[] };

const API_BASE = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';

function getBaseUrl(): string {
  const base = API_BASE;
  if (!base || base === '') {
    console.warn('[toolkit-sdk] Missing EXPO_PUBLIC_TOOLKIT_URL env var, using default');
    return 'https://toolkit.rork.com';
  }
  return base;
}

export async function generateText(params: string | { messages: (UserMessage | AssistantMessage)[] }): Promise<string> {
  try {
    const messages = typeof params === 'string' ? [{ role: 'user', content: params } as UserMessage] : params.messages;
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/agent/chat`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`generateText failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    const text: string = typeof data === 'string' ? data : data.text ?? '';
    return text;
  } catch (e) {
    console.log('[toolkit-sdk] generateText error', e);
    throw e;
  }
}

export async function generateObject<T extends z.ZodType>(params: {
  messages: (UserMessage | AssistantMessage)[];
  schema: T;
}): Promise<z.infer<T>> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/agent/chat`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: params.messages }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`generateObject failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    const parsed = params.schema.safeParse(data);
    if (!parsed.success) {
      console.log('[toolkit-sdk] schema parse error', parsed.error);
      throw parsed.error;
    }
    return parsed.data as z.infer<T>;
  } catch (e) {
    console.log('[toolkit-sdk] generateObject error', e);
    throw e;
  }
}
