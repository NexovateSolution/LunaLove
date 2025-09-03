import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiX, FiLoader } from 'react-icons/fi';
import api from '../api.js';

const Chatbot = ({ authToken, onClose }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isTyping) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await api.post('/api/chatbot/', { message: input });
      const botMessage = { sender: 'bot', text: response.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      const errorMessage = { sender: 'bot', text: 'Sorry, I am having trouble connecting. Please try again later.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-5 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="p-3 bg-fuchsia-600 text-white rounded-t-lg flex justify-between items-center">
        <h3 className="font-bold">ShebaLove Assistant</h3>
        <button onClick={onClose} className="text-white font-bold">&times;</button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`my-2 ${msg.sender === 'bot' ? 'text-left' : 'text-right'}`}>
            <span className={`inline-block p-2 rounded-lg ${msg.sender === 'bot' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-fuchsia-500 text-white'}`}>
              {msg.text}
            </span>
          </div>
        ))}
        {isTyping && (
            <div className="my-2 text-left">
                <span className="inline-block p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                    Typing...
                </span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ask me anything..."
          />
          <button onClick={handleSend} className="bg-fuchsia-600 text-white p-2 rounded-r-md hover:bg-fuchsia-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
