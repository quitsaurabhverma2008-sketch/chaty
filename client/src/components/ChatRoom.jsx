/**
 * ChatRoom Component - Real-time messaging using REST polling
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'https://server-k1hodgsax-quitsaurabhverma2008-9330s-projects.vercel.app';
const SERVER_URL = API_URL;

function ChatRoom({ roomId, username, creator, onLeave }) {
  const isCreator = username === creator;
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPartner, setAiPartner] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const lastFetchRef = useRef(0);
  const pollIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

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
    
    const userMsg = inputValue.trim();
    const wasAiInChat = aiPartner !== null;
    
    try {
      await axios.post(`${API_URL}/api/rooms/${roomId}/messages`, {
        user: username,
        text: userMsg
      });
      
      // If AI partner in room, send message to AI too with 2 second delay
      if (wasAiInChat) {
        // Show typing indicator
        setAiTyping(true);
        
        // 2 second delay before AI responds
        setTimeout(async () => {
          try {
            await axios.post(`${API_URL}/api/ai/chat`, {
              roomId,
              message: userMsg,
              userName: username
            });
          } catch (aiErr) {
            console.error('AI chat error:', aiErr);
          }
          setAiTyping(false);
          fetchMessages();
        }, 2000);
      }
      
      await fetchMessages();
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
};

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', file);
      formData.append('userhash', '');
      
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });
      
      const url = await response.text();
      const trimmedUrl = url.trim();
      
      if (trimmedUrl.startsWith('https://files.catbox.moe/')) {
        await axios.post(`${API_URL}/api/rooms/${roomId}/messages`, {
          user: username,
          text: inputValue.trim(),
          file: {
            name: file.name,
            type: file.type,
            data: trimmedUrl
          }
        });
        await fetchMessages();
        setInputValue('');
      } else if (trimmedUrl.startsWith('https://')) {
        await axios.post(`${API_URL}/api/rooms/${roomId}/messages`, {
          user: username,
          text: inputValue.trim(),
          file: {
            name: file.name,
            type: file.type,
            data: trimmedUrl
          }
        });
        await fetchMessages();
        setInputValue('');
      } else {
        console.log('Catbox response:', trimmedUrl);
        await axios.post(`${API_URL}/api/rooms/${roomId}/messages`, {
          user: username,
          text: inputValue.trim() || 'File shared'
        });
        await fetchMessages();
        setInputValue('');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Try a smaller file.');
    } finally {
      setUploading(false);
    }
    
    e.target.value = '';
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

  const addAiPartner = async (gender) => {
    try {
      const res = await axios.post(`${API_URL}/api/ai/add`, {
        roomId,
        gender
      });
      setAiPartner(res.data);
      setShowAiModal(false);
    } catch (err) {
      console.error('Failed to add AI:', err);
      alert(err.response?.data?.error || 'Failed to add AI partner');
    }
  };

  const sendAiMessage = async () => {
    if (!inputValue.trim() || !aiPartner) return;
    
    const userMsg = inputValue.trim();
    setInputValue('');
    setAiLoading(true);
    
    try {
      const res = await axios.post(`${API_URL}/api/ai/chat`, {
        roomId,
        message: userMsg,
        userName: username
      });
    } catch (err) {
      console.error('AI chat error:', err);
    }
    
    setAiLoading(false);
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

    if (msg.type === 'system-deleted') {
      return (
        <div key={msg.id} className="message system" data-testid="system-message">
          <span className="system-badge deleted">Room</span> was deleted
          <span className="time">{msg.time}</span>
        </div>
      );
    }

    if (msg.type === 'system-recovered') {
      return (
        <div key={msg.id} className="message system" data-testid="system-message">
          <span className="system-badge recovered">Room</span> was recovered
          <span className="time">{msg.time}</span>
        </div>
      );
    }

    const isOwn = msg.user === username;

    const renderFile = () => {
      if (!msg.file) return null;
      const { name, type, data } = msg.file;
      
      if (type.startsWith('image/')) {
        return (
          <div className="file-attachment image">
            <img src={data} alt={name} />
          </div>
        );
      }
      
      if (type.startsWith('video/')) {
        return (
          <div className="file-attachment video">
            <video controls src={data} />
          </div>
        );
      }
      
      return (
        <div className="file-attachment file">
          <span className="file-icon">📄</span>
          <span className="file-name">{name}</span>
          <a href={data} download={name} className="file-download">Download</a>
        </div>
      );
    };

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
        {msg.text && <div className="message-text">{msg.text}</div>}
        {msg.file && renderFile()}
      </div>
    );
  };

  return (
    <div className="chat-container" data-testid="chat-room">
      <div className="chat-header">
        <div className="room-info">
          <span className="room-label">Room</span>
          <span className="room-id" data-testid="room-id">{roomId}</span>
          {aiPartner && <span className="ai-badge">🤖 {aiPartner.name}</span>}
        </div>
        <div className="header-buttons">
          {!aiPartner && (
            <button
              type="button"
              className="btn-ai"
              onClick={() => setShowAiModal(true)}
              title="Add AI Partner"
            >
              🤖
            </button>
          )}
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
        {aiTyping && (
          <div className="typing-indicator">
            <span>{aiPartner?.name || 'AI'} is typing</span>
            <span className="typing-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </div>
        )}
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
            placeholder={aiPartner ? `Chat with ${aiPartner.name}...` : "Type a message... (paste image links)"}
            maxLength={500}
          />
          <button type="submit" data-testid="send-btn" disabled={!inputValue.trim() || uploading || aiLoading}>
            {aiLoading ? '...' : 'Send'}
          </button>
        </form>

      {showAiModal && (
        <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add AI Partner 🤖</h3>
            <p>Select a partner personality:</p>
            <div className="ai-options">
              <button className="ai-option male" onClick={() => addAiPartner('male')}>
                👨 Male
              </button>
              <button className="ai-option female" onClick={() => addAiPartner('female')}>
                👩 Female
              </button>
            </div>
            <button className="modal-close" onClick={() => setShowAiModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatRoom;