/**
 * ChatRoom Component - Real-time messaging interface
 */

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ChatRoom({ roomId, username, onLeave }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-room', { roomId, username });
    });

    newSocket.on('chat-message', (msg) => {
      setMessages((prev) => [...prev, { type: 'message', ...msg, key: Date.now() + Math.random() }]);
    });

    newSocket.on('user-joined', (data) => {
      setMessages((prev) => [...prev, { type: 'system-joined', ...data, key: Date.now() + Math.random() }]);
    });

    newSocket.on('user-left', (data) => {
      setMessages((prev) => [...prev, { type: 'system-left', ...data, key: Date.now() + Math.random() }]);
    });

    newSocket.on('error', (data) => {
      setMessages((prev) => [...prev, { type: 'system-error', text: data.message, key: Date.now() + Math.random() }]);
    });

    newSocket.on('message-history', (history) => {
      setMessages(history.map((msg, i) => ({ type: 'message', ...msg, key: i })));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();

    if (!inputValue.trim() || !socket) return;

    socket.emit('chat-message', inputValue.trim());
    setInputValue('');
  };

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
    }
    onLeave();
  };

  const renderMessage = (msg) => {
    if (msg.type === 'system-joined') {
      return (
        <div key={msg.key} className="message system" data-testid="system-message">
          <span className="system-badge joined">{msg.user}</span> joined the room
          <span className="time">{msg.time}</span>
        </div>
      );
    }

    if (msg.type === 'system-left') {
      return (
        <div key={msg.key} className="message system" data-testid="system-message">
          <span className="system-badge left">{msg.user}</span> left the room
          <span className="time">{msg.time}</span>
        </div>
      );
    }

    if (msg.type === 'system-error') {
      return (
        <div key={msg.key} className="message error" data-testid="error-message">
          {msg.text}
        </div>
      );
    }

    const isOwn = msg.user === username;

    return (
      <div
        key={msg.key}
        className={`message ${isOwn ? 'own' : 'other'}`}
        data-testid="chat-message"
      >
        <div className="message-header">
          <span className="sender">{msg.user}</span>
          <span className="time">{msg.time}</span>
        </div>
        <div className="message-text">{msg.text}</div>
      </div>
    );
  };

  return (
    <div className="chat-container" data-testid="chat-room">
      <div className="chat-header">
        <div className="room-info">
          <span className="room-label">Room</span>
          <span className="room-id" data-testid="room-id">{roomId}</span>
        </div>
        <button
          className="btn-leave"
          data-testid="leave-btn"
          onClick={handleLeave}
        >
          Leave
        </button>
      </div>

      <div className="messages-area" data-testid="messages-area">
        {messages.length === 0 ? (
          <div className="no-messages" data-testid="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={handleSend}>
        <input
          type="text"
          data-testid="message-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
        />
        <button type="submit" data-testid="send-btn" disabled={!inputValue.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatRoom;