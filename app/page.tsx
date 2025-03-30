'use client';
import { useState, useRef, useEffect } from 'react';

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

export default function Home() {
  const [message, setMessage] = useState<string>('');
  const [chat, setChat] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newChat: Message[] = [...chat, { role: 'user', content: message }];
    setChat(newChat);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newChat }),
      });

      if (!response.ok) {
        throw new Error('خطا در درخواست به سرور');
      }

      const data: Message = await response.json();
      setChat([...newChat, data]);
    } catch (error) {
      console.error('خطا:', error);
      setChat([...newChat, { role: 'assistant', content: 'یه مشکلی پیش اومد!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendImageMessage = async () => {
    const imageMessage: Message = {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image_url',
          image_url: {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg',
          },
        },
      ],
    };

    const newChat: Message[] = [...chat, imageMessage];
    setChat(newChat);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newChat }),
      });

      if (!response.ok) {
        throw new Error('خطا در درخواست به سرور');
      }

      const data: Message = await response.json();
      setChat([...newChat, data]);
    } catch (error) {
      console.error('خطا:', error);
      setChat([...newChat, { role: 'assistant', content: 'یه مشکلی پیش اومد!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">چت با Gemini 2.5 Pro</h1>
        <div ref={chatContainerRef} className="h-96 overflow-y-auto border rounded p-4 bg-gray-50">
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-2 rounded ${
                msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-green-100 text-left'
              }`}
            >
              <span className="font-semibold">{msg.role === 'user' ? 'شما: ' : 'هوش مصنوعی: '}</span>
              {typeof msg.content === 'string' ? (
                <span>{msg.content}</span>
              ) : (
                msg.content.map((item, i) =>
                  item.type === 'text' ? (
                    <span key={i}>{item.text}</span>
                  ) : (
                    <img key={i} src={item.image_url.url} alt="User uploaded" className="max-w-xs" />
                  )
                )
              )}
            </div>
          ))}
          {isLoading && <p>در حال بارگذاری...</p>}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="پیامت رو اینجا بنویس..."
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            ارسال متن
          </button>
        </div>
      </div>
    </div>
  );
}