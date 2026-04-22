/**
 * Main App Component - Routes between Home and ChatRoom views
 */

import { useState } from 'react';
import Home from './components/Home';
import ChatRoom from './components/ChatRoom';

function App() {
  const [roomId, setRoomId] = useState(null);
  const [username, setUsername] = useState('Anonymous');
  const [creator, setCreator] = useState(null);

  const handleJoinRoom = (id, name, creatorName) => {
    setRoomId(id);
    setUsername(name);
    setCreator(creatorName);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    setUsername('Anonymous');
    setCreator(null);
  };

  if (!roomId) {
    return <Home onJoinRoom={handleJoinRoom} />;
  }

  return (
    <ChatRoom
      roomId={roomId}
      username={username}
      creator={creator}
      onLeave={handleLeaveRoom}
    />
  );
}

export default App;