import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from './config';
import { Routes, Route, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MeetingView } from './pages/MeetingView';
import { Tasks } from './pages/Tasks';
import { ChannelView } from './pages/ChannelView';
import { DirectMessageView } from './pages/DirectMessageView';
import { CreateMeeting } from './pages/CreateMeeting';
import { JoinMeeting } from './pages/JoinMeeting';
import { WaitingRoom } from './pages/WaitingRoom';
import { LandingPage } from './pages/LandingPage';
import { ContactPage } from './pages/ContactPage';
import { Integrations } from './pages/Integrations';
import { CalendarView } from './pages/CalendarView';
import { RecordingsPage } from './pages/RecordingsPage';
import { 
  LayoutDashboard, 
  CheckSquare, 
  LogOut, 
  Video, 
  Plus, 
  Calendar,
  Users, 
  Hash, 
  MessageSquare, 
  User, 
  ChevronDown, 
  ChevronRight,
  Settings,
  X,
  Film
} from 'lucide-react';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('token');
    return t && t !== 'null' && t !== 'undefined' ? t : null;
  });
  const [user, setUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('user');
      return u && u !== 'null' ? JSON.parse(u) : null;
    } catch { return null; }
  });

  // Compute view states from URL paths
  const getActiveViewType = () => {
    if (location.pathname === '/' || location.pathname === '/create-meeting') return 'dashboard';
    if (location.pathname === '/tasks') return 'tasks';
    if (location.pathname === '/calendar') return 'calendar';
    if (location.pathname === '/integrations') return 'integrations';
    if (location.pathname === '/recordings') return 'recordings';
    if (location.pathname.startsWith('/channel/')) return 'channel';
    if (location.pathname.startsWith('/dm/')) return 'dm';
    return '';
  };

  const isImmersiveRoute = 
    location.pathname.startsWith('/meeting/') || 
    location.pathname.startsWith('/summary/') || 
    location.pathname === '/join' || 
    location.pathname === '/waiting-room';

  // Wrapper components for routes to extract params
  const MeetingRouteWrapper = () => {
    const { id } = useParams<{ id: string }>();
    return (
      <MeetingView 
        token={token || ''} 
        meetingId={id || ''} 
        currentUser={user}
        onBack={() => navigate(user?.isGuest ? '/join' : '/dashboard')} 
      />
    );
  };

  const ChannelRouteWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const teamId = searchParams.get('teamId') || '';
    return (
      <ChannelView 
        token={token || ''} 
        channelId={id || ''} 
        teamId={teamId} 
        currentUser={user}
        socket={socketRef.current}
        onStartMeeting={(meetingId) => navigate(`/meeting/${meetingId}`)}
      />
    );
  };

  const DmRouteWrapper = () => {
    const { id } = useParams<{ id: string }>();
    return (
      <DirectMessageView 
        token={token || ''} 
        otherUserId={id || ''} 
        currentUser={user}
        socket={socketRef.current}
      />
    );
  };

  // Teams & Channels state
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [collapsedTeams, setCollapsedTeams] = useState<{ [key: string]: boolean }>({});
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [selectedTeamIdForChannel, setSelectedTeamIdForChannel] = useState<string | null>(null);
  const [showDMPanel, setShowDMPanel] = useState(false);
  const [dmPanelTab, setDmPanelTab] = useState<'dm' | 'create' | 'join'>('dm');
  const [dmPersonalSubTab, setDmPersonalSubTab] = useState<'share' | 'open'>('share');
  const [personalCodeCopied, setPersonalCodeCopied] = useState(false);
  const [enterPersonalCode, setEnterPersonalCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [groupPanelError, setGroupPanelError] = useState('');
  const [groupPanelLoading, setGroupPanelLoading] = useState(false);
  const [createdGroupCode, setCreatedGroupCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState<any>(null);
  
  // Modal fields
  const [teamName, setTeamName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [modalError, setModalError] = useState('');

  const socketRef = useRef<Socket | null>(null);

  // Initialize socket and data
  useEffect(() => {
    if (!token || !user || user.isGuest) return;

    // Establish global socket connection
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('App connected to WebSocket gateway');
      // Join user specific room to receive direct messages
      socket.emit('joinUserRoom', { userId: user.id });
    });

    fetchTeams();
    fetchUsers();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, user?.id]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:5000/teams', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Failed to fetch teams', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/teams/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    navigate('/join');
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    try {
      const response = await fetch('http://localhost:5000/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: teamName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to create team');
      
      setTeamName('');
      setShowCreateTeamModal(false);
      fetchTeams();
    } catch (err: any) {
      setModalError(err.message || 'Error creating team');
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!selectedTeamIdForChannel) return;
    try {
      const response = await fetch(`http://localhost:5000/teams/${selectedTeamIdForChannel}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: channelName, description: channelDesc }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to create channel');

      setChannelName('');
      setChannelDesc('');
      setShowCreateChannelModal(false);
      fetchTeams();
    } catch (err: any) {
      setModalError(err.message || 'Error creating channel');
    }
  };

  const toggleTeam = (teamId: string) => {
    setCollapsedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const isPublicRoute = location.pathname === '/' || location.pathname === '/join' || location.pathname === '/waiting-room' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/contact';

  // Automatically redirect logged-in users away from auth pages to the app dashboard
  useEffect(() => {
    if (token && user && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate('/dashboard');
    }
  }, [token, user, location.pathname]);

  if ((!token || !user) && (location.pathname === '/login' || location.pathname === '/register' || !isPublicRoute)) {
    return <Login onLogin={handleLogin} />;
  }

  // Root route '/' always shows the beautiful LandingPage
  if (location.pathname === '/') {
    return <LandingPage />;
  }

  // /contact route shows the Contact page
  if (location.pathname === '/contact') {
    return <ContactPage />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      {!isImmersiveRoute && (
        <aside className="sidebar" style={{ width: '280px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
            width: '36px', 
            height: '36px', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Video size={20} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">TeamsSpace</h2>
        </div>

        {/* Global Views */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <button 
            className={`btn ${getActiveViewType() === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%', padding: '10px 16px' }}
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>

          <button 
            className={`btn ${getActiveViewType() === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%', padding: '10px 16px' }}
            onClick={() => navigate('/tasks')}
          >
            <CheckSquare size={16} /> Action Board
          </button>

          <button 
            className={`btn ${getActiveViewType() === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%', padding: '10px 16px' }}
            onClick={() => navigate('/calendar')}
          >
            <Calendar size={16} /> Calendar
          </button>

          <button 
            className={`btn ${getActiveViewType() === 'integrations' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%', padding: '10px 16px' }}
            onClick={() => navigate('/integrations')}
          >
            <Settings size={16} /> Integrations
          </button>

          <button 
            className={`btn ${getActiveViewType() === 'recordings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%', padding: '10px 16px' }}
            onClick={() => navigate('/recordings')}
          >
            <Film size={16} /> Recordings
          </button>
        </nav>

        {/* Teams & Channels section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={12} /> Teams
            </span>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
              onClick={() => setShowCreateTeamModal(true)}
              title="Create Team"
            >
              <Plus size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {teams.map(team => {
              const isCollapsed = collapsedTeams[team.id];
              return (
                <div key={team.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      padding: '6px 8px', 
                      borderRadius: 'var(--radius-sm)', 
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      background: 'rgba(255,255,255,0.01)',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => toggleTeam(team.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>{team.name}</span>
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeamIdForChannel(team.id);
                        setShowCreateChannelModal(true);
                      }}
                      title="Add Channel"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '20px', marginTop: '4px' }}>
                      {team.channels?.map((channel: any) => (
                        <button
                          key={channel.id}
                          className={`btn ${location.pathname.startsWith(`/channel/${channel.id}`) ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ 
                            justifyContent: 'flex-start', 
                            width: '100%', 
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            border: 'none',
                            background: location.pathname.startsWith(`/channel/${channel.id}`) ? 'var(--primary)' : 'transparent'
                          }}
                          onClick={() => navigate(`/channel/${channel.id}?teamId=${team.id}`)}
                        >
                          <Hash size={12} /> {channel.name}
                        </button>
                      ))}
                      {(!team.channels || team.channels.length === 0) && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '16px' }}>No channels</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {teams.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '8px' }}>Create a team to start collaborating.</span>
            )}
          </div>
        </div>

        {/* Direct Messages section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={12} /> Direct Messages
            </span>
            <button
              title="Start new conversation"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
              onClick={() => { setShowDMPanel(true); }}
            >
              <Plus size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {users.map(u => (
              <button
                key={u.id}
                className={`btn ${location.pathname === `/dm/${u.id}` ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  justifyContent: 'flex-start', 
                  width: '100%', 
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  border: 'none',
                  background: location.pathname === `/dm/${u.id}` ? 'var(--primary)' : 'transparent'
                }}
                onClick={() => navigate(`/dm/${u.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    background: 'rgba(255,255,255,0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold', 
                    color: 'var(--secondary)' 
                  }}>
                    {u.name[0]}
                  </div>
                  <span>{u.name}</span>
                </div>
              </button>
            ))}
            {users.length === 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '8px' }}>No teammates available.</span>
            )}
          </div>
        </div>

        {/* User Card */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {user && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
                {user.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
            </div>
          )}
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      )}

      {/* Main Page Content */}
      <main 
        className="main-content" 
        style={{ 
          marginLeft: isImmersiveRoute ? '0' : '280px', 
          width: isImmersiveRoute ? '100%' : 'calc(100% - 280px)',
          padding: isImmersiveRoute ? '24px' : '40px'
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard token={token || ''} onSelectMeeting={(id) => navigate(`/meeting/${id}`)} />} />
          <Route path="/dashboard" element={<Dashboard token={token || ''} onSelectMeeting={(id) => navigate(`/meeting/${id}`)} />} />
          <Route path="/create-meeting" element={<CreateMeeting token={token || ''} />} />
          <Route path="/join" element={<JoinMeeting currentUser={user} />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/meeting/:id" element={<MeetingRouteWrapper />} />
          <Route path="/summary/:id" element={<MeetingRouteWrapper />} />
          <Route path="/tasks" element={<Tasks token={token || ''} />} />
          <Route path="/calendar" element={<CalendarView token={token || ''} onSelectMeeting={(id) => navigate(`/meeting/${id}`)} />} />
          <Route path="/integrations" element={<Integrations token={token || ''} />} />
          <Route path="/recordings" element={<RecordingsPage token={token || ''} />} />
          <Route path="/channel/:id" element={<ChannelRouteWrapper />} />
          <Route path="/dm/:id" element={<DmRouteWrapper />} />
          <Route path="*" element={<Dashboard token={token || ''} onSelectMeeting={(id) => navigate(`/meeting/${id}`)} />} />
        </Routes>
      </main>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '16px' }}>Create New Team</h2>
            {modalError && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '0.9rem' }}>{modalError}</div>}
            
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Team Name</label>
                <input
                  type="text" className="input-field" placeholder="e.g. Product Engineering"
                  value={teamName} onChange={e => setTeamName(e.target.value)} required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTeamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '16px' }}>Create New Channel</h2>
            {modalError && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '0.9rem' }}>{modalError}</div>}
            
            <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Channel Name</label>
                <input
                  type="text" className="input-field" placeholder="e.g. dev-discussion"
                  value={channelName} onChange={e => setChannelName(e.target.value)} required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</label>
                <input
                  type="text" className="input-field" placeholder="Channel topic or purpose"
                  value={channelDesc} onChange={e => setChannelDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateChannelModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Group Collab Panel */}
      {showDMPanel && (
        <div
          onClick={() => setShowDMPanel(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="glass-card"
            style={{ width: '100%', maxWidth: '420px', padding: '28px', borderRadius: '20px', position: 'relative' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>New Conversation</h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Personal chat or group collab with a code</p>
              </div>
              <button onClick={() => { setShowDMPanel(false); setCreatedGroupCode(null); setJoinedGroup(null); setGroupPanelError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs — 3 options */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '22px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
              {([
                { key: 'dm', label: '💬 Personal DM' },
                { key: 'create', label: '➕ Create Group' },
                { key: 'join', label: '🔑 Join Group' },
              ] as const).map(tab => (
                <button key={tab.key}
                  onClick={() => { setDmPanelTab(tab.key); setGroupPanelError(''); setCreatedGroupCode(null); setJoinedGroup(null); setEnterPersonalCode(''); setDmPersonalSubTab('share'); }}
                  style={{
                    flex: 1, padding: '7px 4px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.72rem', fontFamily: 'inherit',
                    background: dmPanelTab === tab.key ? 'var(--primary)' : 'transparent',
                    color: dmPanelTab === tab.key ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ===== PERSONAL DM TAB ===== */}
            {dmPanelTab === 'dm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* Sub-tabs: Share my code / Open someone's chat */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  {(['share', 'open'] as const).map(st => (
                    <button key={st}
                      onClick={() => setDmPersonalSubTab(st)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontWeight: 700, fontSize: '0.8rem', padding: '4px 8px',
                        color: dmPersonalSubTab === st ? 'var(--primary-hover)' : 'var(--text-muted)',
                        borderBottom: dmPersonalSubTab === st ? '2px solid var(--primary)' : '2px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {st === 'share' ? '📤 Share My Code' : '📥 Open by Code'}
                    </button>
                  ))}
                </div>

                {dmPersonalSubTab === 'share' ? (
                  /* Show current user's personal code */
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                      {user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{user?.name}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>Share your <strong>Personal Code</strong> so others can message you directly</p>

                    <div style={{ background: 'rgba(0,0,0,0.25)', border: '1.5px solid var(--primary)', borderRadius: '12px', padding: '14px 18px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-hover)', wordBreak: 'break-all', textAlign: 'left' }}>
                        {user?.id || '—'}
                      </span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(user?.id || ''); setPersonalCodeCopied(true); setTimeout(() => setPersonalCodeCopied(false), 2000); }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', flexShrink: 0 }}
                      >
                        {personalCodeCopied ? '✅ Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>The receiver pastes this under <strong>"Open by Code"</strong> to chat with you</p>
                  </div>
                ) : (
                  /* Enter someone else's personal code to open DM */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const code = enterPersonalCode.trim();
                      if (!code) return;
                      navigate(`/dm/${code}`);
                      setShowDMPanel(false);
                      setEnterPersonalCode('');
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Person's Code</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Paste the personal code here"
                        value={enterPersonalCode}
                        onChange={e => setEnterPersonalCode(e.target.value)}
                        autoFocus
                        required
                        style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}
                      />
                      <span style={{ display: 'block', marginTop: '6px', fontSize: '0.73rem', color: 'var(--text-muted)' }}>Ask them to share their Personal Code from the "Share My Code" tab</span>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={!enterPersonalCode.trim()}>
                      💬 Open Chat
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ===== CREATE GROUP TAB ===== */}
            {dmPanelTab === 'create' && (
              <>
                {createdGroupCode ? (
                  /* Success — show the collab code */
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(92,107,77,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.5rem' }}>🎉</div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>Group Created!</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '20px' }}>Share this <strong>Collab Code</strong> with your members</p>

                    {/* Code box */}
                    <div style={{ background: 'rgba(0,0,0,0.25)', border: '1.5px solid var(--primary)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--primary-hover)', wordBreak: 'break-all' }}>
                        {createdGroupCode}
                      </span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(createdGroupCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.78rem', flexShrink: 0 }}
                      >
                        {codeCopied ? '✅ Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Members paste this code under "Join with Code" to join your group</p>
                    <button className="btn btn-primary" style={{ width: '100%' }}
                      onClick={() => { setShowDMPanel(false); setCreatedGroupCode(null); fetchTeams(); }}
                    >Go to Group Chat</button>
                  </div>
                ) : (
                  /* Create form */
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!groupName.trim()) return;
                    setGroupPanelLoading(true);
                    setGroupPanelError('');
                    try {
                      const authToken = localStorage.getItem('token') || token;
                      // 1. Create the team
                      const teamRes = await fetch('http://localhost:5000/teams', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                        body: JSON.stringify({ name: groupName.trim() }),
                      });
                      const teamData = await teamRes.json();
                      if (!teamRes.ok) throw new Error(teamData.message || 'Failed to create group');

                      // 2. Auto-create a #general channel
                      await fetch(`http://localhost:5000/teams/${teamData.id}/channels`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                        body: JSON.stringify({ name: 'general', description: 'Group general chat' }),
                      });

                      setCreatedGroupCode(teamData.id);
                      setGroupName('');
                      fetchTeams();
                    } catch (err: any) {
                      setGroupPanelError(err.message || 'Something went wrong');
                    } finally {
                      setGroupPanelLoading(false);
                    }
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {groupPanelError && (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>{groupPanelError}</div>
                    )}
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Group Name</label>
                      <input type="text" className="input-field" placeholder="e.g. Project Alpha Team"
                        value={groupName} onChange={e => setGroupName(e.target.value)} autoFocus required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={groupPanelLoading || !groupName.trim()}>
                      {groupPanelLoading ? 'Creating...' : 'Create Group & Get Code'}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* ===== JOIN GROUP TAB ===== */}
            {dmPanelTab === 'join' && (
              <>
                {joinedGroup ? (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.5rem' }}>✅</div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>Joined <span style={{ color: 'var(--primary-hover)' }}>{joinedGroup.name}</span>!</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '20px' }}>You've been added to the group. Open the chat below.</p>
                    <button className="btn btn-primary" style={{ width: '100%' }}
                      onClick={() => {
                        const ch = joinedGroup.channels?.[0];
                        if (ch) navigate(`/channel/${ch.id}?teamId=${joinedGroup.id}`);
                        setShowDMPanel(false); setJoinedGroup(null);
                      }}
                    >Open Group Chat</button>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!joinCode.trim()) return;
                    setGroupPanelLoading(true);
                    setGroupPanelError('');
                    try {
                      const authToken = localStorage.getItem('token') || token;
                      const res = await fetch(`http://localhost:5000/teams/${joinCode.trim()}/join`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message || 'Invalid code or group not found');
                      setJoinedGroup(data);
                      setJoinCode('');
                      fetchTeams();
                    } catch (err: any) {
                      setGroupPanelError(err.message || 'Something went wrong');
                    } finally {
                      setGroupPanelLoading(false);
                    }
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {groupPanelError && (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem' }}>{groupPanelError}</div>
                    )}
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Collab Code</label>
                      <input type="text" className="input-field" placeholder="Paste the code shared by host"
                        value={joinCode} onChange={e => setJoinCode(e.target.value)} autoFocus required
                        style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }} />
                      <span style={{ display: 'block', marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ask the group host for their Collab Code</span>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={groupPanelLoading || !joinCode.trim()}>
                      {groupPanelLoading ? 'Joining...' : '🔑 Join Group'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
