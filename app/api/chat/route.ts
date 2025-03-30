import { NextRequest, NextResponse } from 'next/server';

interface TextContent {
  type: 'text';
  text: string;
}

interface ImageContent {
  type: 'image_url';
  image_url: { url: string };
}

type MessageContent = TextContent | ImageContent;

interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

export async function POST(req: NextRequest) {
  const { messages }: { messages: Message[] } = await req.json();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API Key پیدا نشد' }, { status: 500 });
  }

  const updatedMessages = messages.map((msg, index) => {
    if (index === messages.length - 1 && typeof msg.content === 'string') {
      return {
        ...msg,
        content: `${msg.content}`,
      };
    }
    return msg;
  });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'My Gemini Chat',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro-exp-03-25:free',
        messages: updatedMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    return NextResponse.json(data.choices[0].message, { status: 200 });
  } catch (error: any) {
    console.error('خطای کامل:', error.message);
    return NextResponse.json(
      { error: 'خطا در ارتباط با API', details: JSON.parse(error.message) || error.message },
      { status: 500 }
    );
  }
}