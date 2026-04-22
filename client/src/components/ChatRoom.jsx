/**
 * ChatRoom Component - Real-time messaging using REST polling
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://server-virid-one-15.vercel.app';
const SERVER_URL = API_URL;

function ChatRoom({ roomId, username, creator, onLeave }) {
  const isCreator = username === creator;
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const lastFetchRef = useRef(0);
  const pollIntervalRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/rooms/${roomId}/messages?since=${lastFetchRef.current}`);
      const newMessages = res.data.messages || [];
      
      if (newMessages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNew = newMessages.filter(m => !existingIds.has(m.id));
          return [...prev, ...uniqueNew];
        });
        
        const latestMsg = newMessages[newMessages.length - 1];
        if (latestMsg && latestMsg.timestamp) {
          lastFetchRef.current = latestMsg.timestamp;
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    lastFetchRef.current = Date.now();
    fetchMessages().then(() => setLoading(false));
    
    pollIntervalRef.current = setInterval(fetchMessages, 2000);

    const notifyLeave = () => {
      const data = JSON.stringify({ username });
      navigator.sendBeacon(`${API_URL}/api/rooms/${roomId}/leave`, data);
    };

    window.addEventListener('pagehide', notifyLeave);
    window.addEventListener('beforeunload', notifyLeave);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      window.removeEventListener('pagehide', notifyLeave);
      window.removeEventListener('beforeunload', notifyLeave);
      notifyLeave();
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    try {
      await axios.post(`${API_URL}/api/rooms/${roomId}/messages`, {
        user: username,
        text: inputValue.trim()
      });
      
      await fetchMessages();
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleLeave = async () => {
    try {
      await axios.post(`${API_URL}/api/rooms/${roomId}/leave`, {
        username
      });
    } catch (err) {
      console.error('Failed to leave:', err);
    }
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    onLeave();
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm('Delete this room permanently?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/rooms/${roomId}`, {
        data: { username }
      });
    } catch (err) {
      console.error('Failed to delete room:', err);
      alert(err.response?.data?.error || 'Failed to delete room');
      return;
    }
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    onLeave();
  };

  const renderMessage = (msg) => {
    if (msg.type === 'system-joined') {
      return (
        <div key={msg.id} className="message system" data-testid="system-message">
          <span className="system-badge joined">{msg.user}</span> joined the room
          <span className="time">{msg.time}</span>
        </div>
      );
    }

    if (msg.type === 'system-left') {
      return (
        <div key={msg.id} className="message system" data-testid="system-message">
          <span className="system-badge left">{msg.user}</span> left the room
          <span className="time">{msg.time}</span>
        </div>
      );
    }

    const isOwn = msg.user === username;

    return (
      <div
        key={msg.id}
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
        <div className="header-buttons">
          {isCreator && (
            <button
              className="btn-delete"
              onClick={handleDeleteRoom}
              title="Delete room permanently"
            >
              🗑️
            </button>
          )}
          <button
            className="btn-leave"
            data-testid="leave-btn"
            onClick={handleLeave}
            title="Close chat"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="messages-area" data-testid="messages-area">
        {loading ? (
          <div className="no-messages">Loading messages...</div>
        ) : messages.length === 0 ? (
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