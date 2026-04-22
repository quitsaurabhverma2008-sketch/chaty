/**
 * Home Component - Create or Join a Room (REST version)
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://server-virid-one-15.vercel.app';

function Home({ onJoinRoom }) {
  const [username, setUsername] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);

  const animePics = [
    'https://i.pinimg.com/736x/a6/73/52/a673528f46f566c8b5c8c70920f95f79.jpg',
    'https://i.pinimg.com/736x/a1/88/c3/a188c36f91c9bb2e8e9a6b81e457f6d2.jpg',
    'https://i.pinimg.com/736x/1f/54/3c/1f543c0e80e62ee15c3c89e5a7e9cd1e.jpg',
    'https://i.pinimg.com/736x/1b/4e/92/1b4e92c8d18a1dd8f7c6c6c64a8b4c9d.jpg',
    'https://i.pinimg.com/736x/5c/e9/95/5ce9953b5c3f8e0a87e20e7a0df56c3d.jpg',
    'https://i.pinimg.com/736x/9c/38/a4/9c38a4e0bc7c6e0a9a1e8c1e0c8c6d9e.jpg',
    'https://i.pinimg.com/736x/2c/fc/92/2cfc92f40f0f4fcf9b8e6a3d8e3c0e5d.jpg',
    'https://i.pinimg.com/736x/3d/7c/5e/3d7c5e1eb3f51d2a2f8e1d1f5e4c8d9e.jpg',
    'https://i.pinimg.com/736x/4e/8c/b9/4e8cb9d9a5b7b1e0e3c4f1d7c7c5e8d.jpg',
    'https://i.pinimg.com/736x/5f/9d/2e/5f9d2ed9b8e8f1e0f0f1f5e5b7c1e9.jpg',
    'https://i.pinimg.com/736x/6e/8c/5f/6e8c5f6f9f9b1e1e4c5f2d8c8d6e9f.jpg',
    'https://i.pinimg.com/736x/7f/9d/6e/7f9d6e8a9a9f1e1f5d6f3e9d9e7f0e.jpg',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % animePics.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [animePics.length]);

  const handleCreate = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/rooms`, {
        username: username || 'Anonymous'
      });
      const roomId = res.data.roomId;
      
      await axios.post(`${API_URL}/api/rooms/${roomId}/join`, {
        username: username || 'Anonymous'
      });
      
      setLoading(false);
      onJoinRoom(roomId, username || 'Anonymous', res.data.creator);
    } catch (err) {
      setLoading(false);
      setError('Failed to create room');
    }
  };

  const handleJoin = async () => {
    setError('');

    if (!joinRoomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    if (!/^\d{4}$/.test(joinRoomId)) {
      setError('Room ID must be 4 digits');
      return;
    }

    setLoading(true);

    try {
      const checkRes = await axios.get(`${API_URL}/api/rooms/${joinRoomId}`);

      if (!checkRes.data.exists) {
        try {
          await axios.post(`${API_URL}/api/rooms/${joinRoomId}/recover`, {
            username: username || 'Anonymous'
          });
          setLoading(false);
          onJoinRoom(joinRoomId, username || 'Anonymous', username || 'Anonymous');
          return;
        } catch (recoverErr) {
          setLoading(false);
          setError(recoverErr.response?.data?.error || 'Room does not exist');
          return;
        }
      }

      const isCreator = checkRes.data.creator === (username || 'Anonymous');
      
      await axios.post(`${API_URL}/api/rooms/${joinRoomId}/join`, {
        username: username || 'Anonymous'
      });

      setLoading(false);
      onJoinRoom(joinRoomId, username || 'Anonymous', isCreator ? username : null);
    } catch (err) {
      setLoading(false);
      setError('Failed to join room');
    }
  };

  const handleRecover = async () => {
    setError('');

    if (!joinRoomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    if (!/^\d{4}$/.test(joinRoomId)) {
      setError('Room ID must be 4 digits');
      return;
    }

    setLoading(true);

    try {
      const checkRes = await axios.get(`${API_URL}/api/rooms/${joinRoomId}`);
      
      if (checkRes.data.exists) {
        await axios.post(`${API_URL}/api/rooms/${joinRoomId}/join`, {
          username: username || 'Anonymous'
        });
        setLoading(false);
        onJoinRoom(joinRoomId, username || 'Anonymous');
        return;
      }

      await axios.post(`${API_URL}/api/rooms/${joinRoomId}/recover`, {
        username: username || 'Anonymous'
      });
      setLoading(false);
      onJoinRoom(joinRoomId, username || 'Anonymous', username || 'Anonymous');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to recover room');
    }
  };

  return (
    <>
      <div className="bg-pic" style={{backgroundImage: `url(${animePics[currentBg]})`}}></div>
      <div className="bg-overlay"></div>
      <button className="menu-toggle" onClick={() => setShowOptions(!showOptions)}>
        <div className="menu-circle"></div>
      </button>
      <div className={`home-container ${showOptions ? 'visible' : ''}`}>
        <div className="home-card">
          <h1 data-testid="app-title">Chat App</h1>
          <p className="subtitle">Create or join a room to start chatting</p>

          <div className="form-group">
            <label htmlFor="username">Display Name (optional)</label>
            <input
              type="text"
              id="username"
              data-testid="username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Anonymous"
              maxLength={20}
            />
          </div>

          <div className="actions">
            <button
              className="btn-create"
              data-testid="create-room-btn"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <div className="form-group">
              <label htmlFor="roomId">Room ID</label>
              <input
                type="text"
                id="roomId"
                data-testid="room-id-input"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit ID"
                maxLength={4}
              />
            </div>

            <div className="join-actions">
              <button
                className="btn-join"
                data-testid="join-room-btn"
                onClick={handleJoin}
                disabled={loading || !joinRoomId}
              >
                {loading ? 'Joining...' : 'Join'}
              </button>

              <button
                className="btn-recover"
                onClick={handleRecover}
                disabled={loading || !joinRoomId}
              >
                {loading ? 'Recovering...' : 'Recover'}
              </button>
            </div>
          </div>

          {error && <div className="error-message" data-testid="error-message">{error}</div>}
        </div>
      </div>
    </>
  );
}

export default Home;