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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { messages }: { messages: Message[] } = await req.json();
  const apiKey = process.env.OPENROUTER_API_KEY;
  const referer = 'http://localhost:3000';
  const title = 'My Gemini Chat';

  if (!apiKey) {
    return NextResponse.json({ error: 'API Key پیدا نشد' }, { status: 500 });
  }

  const updatedMessages = messages.map((msg, index) => {
    if (index === messages.length - 1 && typeof msg.content === 'string') {
      return {
        ...msg,
        content: msg.content,
      };
    }
    return msg;
  });

  try {
    const requestBody = {
      model: 'google/gemini-2.5-pro-exp-03-25:free',
      messages: updatedMessages,
      stream: false,
    };

    console.log('Request Body:', requestBody); // لاگ بدنه درخواست

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': referer,
        'X-Title': title,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData); // لاگ خطای API
      return NextResponse.json(
        { error: 'خطا در ارتباط با API', details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('API Response:', data); // لاگ پاسخ API

    if (data.choices && data.choices.length > 0) {
      return NextResponse.json(data.choices[0].message, { status: 200 });
    } else {
      console.error('Invalid API Response:', data); // لاگ پاسخ نامعتبر API
      return NextResponse.json({ error: 'پاسخ API نامعتبر است' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('خطای کامل:', error);
    return NextResponse.json(
      { error: 'خطا در ارتباط با API', details: error.message },
      { status: 500 }
    );
  }
}