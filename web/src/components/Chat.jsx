import React, { useRef, useEffect, useState } from "react";
import { FaGift } from "react-icons/fa";


export default function Chat({ match, onBack, onGift, onSendMessage }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [match]);

  if (!match) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No match selected.
      </div>
    );
  }

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden
  bg-white dark:bg-gray-900
  bg-gradient-to-br from-pink-100 via-fuchsia-100 to-purple-200
  dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with gradient background */}
      <div
        className="flex items-center gap-3 border-b pb-3 px-4 pt-4 z-10"
        style={{
          background: "linear-gradient(90deg, #f43f5e 0%, #a21caf 100%)"
        }}
      >
        <button className="mr-3 text-white text-xl" onClick={onBack}>&larr;</button>
        <img src={match.avatar} alt={match.name} className="w-12 h-12 rounded-full border-2 border-white" />
        <div>
          <div className="font-bold text-lg text-white">{match.name}</div>
          <div className="text-xs text-pink-100">Perfect Match 💖</div>
        </div>
      </div>
      {/* Messages */}
      <div
  className="relative flex-1 min-h-0 flex flex-col gap-2 px-4 py-4 overflow-y-auto"
  style={{
    background: "linear-gradient(135deg, #fbeffb 0%, #f3e6fa 100%)"
  }}
      >
        {/* Blurred colorful blob */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-300 opacity-30 rounded-full filter blur-3xl pointer-events-none"
          style={{ zIndex: 0 }}
        ></div>
        <div
          className="absolute bottom-10 right-10 w-72 h-72 bg-yellow-200 opacity-20 rounded-full filter blur-2xl pointer-events-none"
          style={{ zIndex: 0 }}
        ></div>
        <div className="relative z-10">
          {match.messages && match.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[70%] shadow-md ${
                  msg.fromMe
                    ? "bg-fuchsia-500 text-white rounded-br-none"
                    : "bg-white/70 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 rounded-bl-none"
                }`}
              >
                {msg.text}
                {msg.time && (
                  <span className="block text-xs mt-1 opacity-60">{msg.time}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input */}
      <div className="flex items-center pt-2 border-t gap-2 px-4 pb-4 bg-white/80 dark:bg-gray-900/80">
        <input
          className="flex-1 p-2 rounded-full border border-fuchsia-200 dark:border-fuchsia-800 bg-gray-50 dark:bg-gray-800 focus:outline-none"
          type="text"
          placeholder="Type your message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <button
          className="ml-2 px-4 py-2 rounded-full bg-fuchsia-500 text-white font-semibold"
          onClick={handleSend}
        >
          Send
        </button>
        <button
          className="ml-2 px-2 py-2 rounded-full bg-yellow-400 text-white font-semibold"
          title="Send Gift"
          onClick={onGift}
        >
          <FaGift />
        </button>
      </div>
    </div>
  );
}