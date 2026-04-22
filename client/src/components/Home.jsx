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
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const photos = [
    'https://images6.alphacoders.com/134/1341913.jpeg',
    'https://images8.alphacoders.com/134/1341920.jpeg',
    'https://images3.alphacoders.com/134/1341924.jpeg',
    'https://images4.alphacoders.com/134/1341927.jpeg',
    'https://images7.alphacoders.com/134/1341930.jpeg',
    'https://images.alphacoders.com/135/1358978.png',
    'https://images.alphacoders.com/135/1358981.png',
    'https://images.alphacoders.com/135/1358984.png',
    'https://images.alphacoders.com/135/1358987.png',
    'https://images.alphacoders.com/135/1358990.png',
    'https://images.alphacoders.com/133/1338522.jpeg',
    'https://images.alphacoders.com/133/1338523.jpeg',
    'https://images.alphacoders.com/133/1338525.jpeg',
    'https://images.alphacoders.com/133/1338529.jpeg',
    'https://images.alphacoders.com/133/1338530.jpeg',
    'https://images.alphacoders.com/132/1329546.jpeg',
    'https://images.alphacoders.com/132/1329550.jpeg',
    'https://images.alphacoders.com/132/1329553.jpeg',
    'https://images.alphacoders.com/132/1329556.jpeg',
    'https://images.alphacoders.com/132/1329559.jpeg',
    'https://images.alphacoders.com/134/1342231.png',
    'https://images.alphacoders.com/134/1342236.png',
    'https://images.alphacoders.com/134/1342240.png',
    'https://images.alphacoders.com/134/1342243.png',
    'https://images.alphacoders.com/134/1342248.png',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhoto(prev => (prev + 1) % photos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="bg-photo" style={{backgroundImage: `url(${photos[currentPhoto]})`}}></div>
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