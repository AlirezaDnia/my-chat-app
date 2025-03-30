import { NextRequest, NextResponse } from 'next/server';

interface ModelConfig {
  model: string;
}

const models: ModelConfig[] = [
  {
    model: 'google/gemini-2.5-pro-exp-03-25:free',
  },
  {
    model: 'deepseek/deepseek-chat-v3-0324:free',
  },
  // اضافه کردن مدل های دیگر
];

function isValidModel(model: string): boolean {
  return models.some((m) => m.model === model);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { messages, model }: { messages: any[]; model: string } = await req.json();

  if (!isValidModel(model)) {
    return NextResponse.json({ error: 'Model not found' }, { status: 400 });
  }

  const apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API Key not found' }, { status: 500 });
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        // اضافه کردن هدرهای دیگر
      },
      body: JSON.stringify({ messages: messages, model: model }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'خطا در ارتباط با API', details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return NextResponse.json(data.choices[0].message, { status: 200 });
    } else {
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