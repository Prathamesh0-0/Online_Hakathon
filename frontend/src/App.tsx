import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
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
import { Integrations } from './pages/Integrations';
import { CalendarView } from './pages/CalendarView';
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
  Settings
} from 'lucide-react';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));

  // Compute view states from URL paths
  const getActiveViewType = () => {
    if (location.pathname === '/' || location.pathname === '/create-meeting') return 'dashboard';
    if (location.pathname === '/tasks') return 'tasks';
    if (location.pathname === '/calendar') return 'calendar';
    if (location.pathname === '/integrations') return 'integrations';
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
        onBack={() => navigate(user?.isGuest ? '/join' : '/')} 
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
    const socket = io('http://localhost:5000');
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
    navigate('/');
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

  const isPublicRoute = location.pathname === '/' || location.pathname === '/join' || location.pathname === '/waiting-room';

  if ((!token || !user) && !isPublicRoute) {
    return <Login onLogin={handleLogin} />;
  }

  if ((!token || !user) && location.pathname === '/') {
    return <LandingPage />;
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
            onClick={() => navigate('/')}
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
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', padding: '0 4px' }}>
            <MessageSquare size={12} /> Direct Messages
          </span>

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
          <Route path="/create-meeting" element={<CreateMeeting token={token || ''} />} />
          <Route path="/join" element={<JoinMeeting currentUser={user} />} />
          <Route path="/waiting-room" element={<WaitingRoom />} />
          <Route path="/meeting/:id" element={<MeetingRouteWrapper />} />
          <Route path="/summary/:id" element={<MeetingRouteWrapper />} />
          <Route path="/tasks" element={<Tasks token={token || ''} />} />
          <Route path="/calendar" element={<CalendarView token={token || ''} onSelectMeeting={(id) => navigate(`/meeting/${id}`)} />} />
          <Route path="/integrations" element={<Integrations token={token || ''} />} />
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
    </div>
  );
}

export default App;
