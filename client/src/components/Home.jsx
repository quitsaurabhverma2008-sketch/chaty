/**
 * Home Component - Create or Join a Room
 */

import { useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://chaty-server-ap26.onrender.com';

function Home({ onJoinRoom }) {
  const [username, setUsername] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError('');
    setLoading(true);

    try {
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        newSocket.emit('create-room', { username: username || 'Anonymous' }, (response) => {
          setLoading(false);
          onJoinRoom(response.roomId, username || 'Anonymous');
        });
      });

      newSocket.on('connect_error', () => {
        setLoading(false);
        setError('Failed to connect to server');
      });
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
        setLoading(false);
        setError('Room does not exist');
        return;
      }

      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        newSocket.emit('join-room', {
          roomId: joinRoomId,
          username: username || 'Anonymous',
        });
        setLoading(false);
        onJoinRoom(joinRoomId, username || 'Anonymous');
      });

      newSocket.on('connect_error', () => {
        setLoading(false);
        setError('Failed to connect to server');
      });
    } catch (err) {
      setLoading(false);
      setError('Failed to join room');
    }
  };

  return (
    <>
      <div className="bg-shapes">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>
      <div className="home-container">
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

            <button
              className="btn-join"
              data-testid="join-room-btn"
              onClick={handleJoin}
              disabled={loading || !joinRoomId}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>

          {error && <div className="error-message" data-testid="error-message">{error}</div>}
        </div>
      </div>
    </>
  );
}

export default Home;