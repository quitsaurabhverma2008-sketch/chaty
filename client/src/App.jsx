/**
 * Main App Component - Routes between Home and ChatRoom views
 */

import { useState } from 'react';
import Home from './components/Home';
import ChatRoom from './components/ChatRoom';

function App() {
  const [roomId, setRoomId] = useState(null);
  const [username, setUsername] = useState('Anonymous');

  const handleJoinRoom = (id, name) => {
    setRoomId(id);
    setUsername(name);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setUsername('Anonymous');
  };

  if (!roomId) {
    return <Home onJoinRoom={handleJoinRoom} />;
  }

  return (
    <ChatRoom
      roomId={roomId}
      username={username}
      onLeave={handleLeaveRoom}
    />
  );
}

export default App;