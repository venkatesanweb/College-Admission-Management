import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { FiSend, FiArrowLeft, FiLogOut, FiMessageSquare, FiRadio } from 'react-icons/fi';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const ChatPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const selectedContactRef = useRef(null);

  useEffect(() => {
    fetchContacts();
    connectWebSocket();
    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, []);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
    if (selectedContact) fetchConversation(selectedContact.id || selectedContact.userId);
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWebSocket = () => {
    try {
      const client = new Client({
        webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'),
        reconnectDelay: 5000,
        onConnect: () => {
          client.subscribe(`/topic/user/${user.userId}/messages`, (msg) => {
            const received = JSON.parse(msg.body);
            const currentSelected = selectedContactRef.current;
            if (currentSelected && (currentSelected.id === received.senderId || currentSelected.userId === received.senderId)) {
              setMessages(prev => {
                if (prev.some(m => m.id === received.id)) return prev;
                return [...prev, received];
              });
            } else {
              toast.info(`New message from ${received.senderName}`);
              fetchContacts(); // refresh contacts list to show new contact if needed
            }
          });
          client.subscribe('/topic/broadcast', (msg) => {
            const received = JSON.parse(msg.body);
            setBroadcasts(prev => {
              if (prev.some(b => b.id === received.id)) return prev;
              return [received, ...prev];
            });
          });
        },
        onStompError: (frame) => {
          console.error('STOMP error', frame);
        },
      });
      client.activate();
      stompClientRef.current = client;
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await API.get(`/chat/contacts`);
      setContacts(res.data.data || []);
    } catch (err) {
      setContacts([]);
    }
  };

  const fetchConversation = async (otherUserId) => {
    try {
      const res = await API.get(`/chat/conversation/${otherUserId}`);
      setMessages(res.data.data);
    } catch (err) { toast.error('Failed to load messages'); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const payload = {
        content: newMessage,
        broadcast: broadcastMode,
        receiverId: broadcastMode ? null : (selectedContact?.id || selectedContact?.userId),
      };

      const res = await API.post('/chat/send', payload);
      if (!broadcastMode) {
        setMessages(prev => {
          if (prev.some(m => m.id === res.data.data.id)) return prev;
          return [...prev, res.data.data];
        });
      } else {
        setBroadcasts(prev => {
          if (prev.some(b => b.id === res.data.data.id)) return prev;
          return [res.data.data, ...prev];
        });
      }
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const res = await API.get('/chat/broadcasts');
      setBroadcasts(res.data.data);
    } catch (err) { /* silent */ }
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const backPath = user?.role === 'STUDENT' ? '/student/dashboard' : '/admin/dashboard';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><h2>🎓 Admission Portal</h2><p>Messaging</p></div>
        <nav className="sidebar-nav">
          <Link to={backPath} className="sidebar-link"><FiArrowLeft /> Back to Dashboard</Link>
          <div className="sidebar-link active"><FiMessageSquare /> Chat</div>
          <button className="sidebar-link" onClick={() => { setBroadcastMode(!broadcastMode); setSelectedContact(null); fetchBroadcasts(); }}>
            <FiRadio /> {broadcastMode ? 'Direct Messages' : 'Broadcasts'}
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogout}><FiLogOut /> Logout</button>
        </div>
      </aside>

      <main className="main-content" style={{ marginLeft: 260, display: 'flex', flexDirection: 'column' }}>
        <div className="page-content" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-container" style={{ flex: 1, margin: 24, height: 'calc(100vh - 96px)' }}>
            {/* Contacts List */}
            {!broadcastMode && (
              <div className="chat-sidebar">
                <div className="chat-sidebar-header">Contacts</div>
                {contacts.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No contacts found</div>
                ) : (
                  contacts.map(c => (
                    <div
                      key={c.id}
                      className={`chat-user-item ${selectedContact?.id === c.id ? 'active' : ''}`}
                      onClick={() => { setSelectedContact(c); setBroadcastMode(false); }}
                    >
                      <div className="chat-user-avatar">{c.fullName?.charAt(0)?.toUpperCase()}</div>
                      <div className="chat-user-info">
                        <h4>{c.fullName}</h4>
                        <p>{c.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chat Area */}
            <div className="chat-main" style={broadcastMode ? { gridColumn: 'span 2' } : {}}>
              <div className="chat-main-header">
                {broadcastMode ? '📢 Broadcast Messages' : selectedContact ? `Chat with ${selectedContact.fullName}` : 'Select a contact to start chatting'}
              </div>

              <div className="chat-messages">
                {broadcastMode ? (
                  broadcasts.length === 0 ? (
                    <div className="empty-state"><FiRadio size={48} /><h3>No Broadcasts</h3><p>Admin broadcast messages will appear here</p></div>
                  ) : (
                    broadcasts.map(msg => (
                      <div key={msg.id} className="chat-message received">
                        <strong style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>Broadcast Message</strong>
                        <div>{msg.content}</div>
                        <span className="time">{new Date(msg.sentAt).toLocaleString()}</span>
                      </div>
                    ))
                  )
                ) : !selectedContact ? (
                  <div className="empty-state"><FiMessageSquare size={48} /><h3>No Conversation Selected</h3><p>Choose a contact from the sidebar</p></div>
                ) : messages.length === 0 ? (
                  <div className="empty-state"><FiMessageSquare size={48} /><h3>No Messages Yet</h3><p>Start the conversation!</p></div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`chat-message ${msg.senderId === user.userId ? 'sent' : 'received'}`}>
                      <div>{msg.content}</div>
                      <span className="time">{new Date(msg.sentAt).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {((selectedContact && !(user?.role === 'STUDENT' && selectedContact?.role === 'SUPER_ADMIN')) || (broadcastMode && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'))) && (
                <div className="chat-input-area">
                  <input
                    type="text"
                    placeholder={broadcastMode ? 'Type a broadcast message...' : 'Type a message...'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button className="btn btn-primary" onClick={sendMessage}><FiSend /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
