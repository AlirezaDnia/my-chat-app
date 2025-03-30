'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

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
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState<string>('google/gemini-2.5-pro-exp-03-25:free');

  const modelNames: { [key: string]: string } = {
    'google/gemini-2.5-pro-exp-03-25:free': 'Gemini 2.5 Pro',
    'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek Chat',
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newUserMessage: Message = { role: 'user', content: message };
    const newChat: Message[] = [...chat, newUserMessage];
    setChat(newChat);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newChat, model: selectedModel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.details?.message || 'خطا در درخواست به سرور');
      }

      const data: Message = await response.json();
      setChat([...newChat, data]);
    } catch (err: any) {
      console.error('خطا:', err);
      setError(err.message || 'یه مشکلی پیش اومد!');
      setChat([...newChat, { role: 'assistant', content: 'یه مشکلی پیش اومد!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">چت با مدل زبانی</h1>
        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          <option value="google/gemini-2.5-pro-exp-03-25:free">Gemini 2.5 Pro</option>
          <option value="deepseek/deepseek-chat-v3-0324:free">DeepSeek Chat</option>
        </select>
        <div ref={chatContainerRef} className="h-96 overflow-y-auto border rounded p-4 bg-gray-50">
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-2 rounded ${
                msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-green-100 text-left'
              }`}
            >
              <span className="font-semibold">{msg.role === 'user' ? 'شما: ' : `${modelNames[selectedModel]}: `}</span>
              {typeof msg.content === 'string' ? (
                <ReactMarkdown children={msg.content}  />
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
          {error && <p className="text-red-500">{error}</p>}
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