import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { 
  MessageSquare, Plus, LogOut, User, Archive, Send, 
  Lock, Mail, UserPlus, Menu, X, Scale, ShieldAlert, 
  AlertCircle, Trash2, Loader2, BookOpen, AlertTriangle
} from 'lucide-react';
import './App.css';

// Configure marked options for line breaks
marked.setOptions({
  breaks: true,
  gfm: true
});

function App() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authLoading, setAuthLoading] = useState(true);
  
  // Auth Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Chat/Dashboard state
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isReplying]);

  // Check auth state on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch sessions when user logs in
  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  // Check auth state
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/get-me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error verifying auth state:', err);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!username || !email || !password) {
      setErrorMsg('All fields are required.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMsg('Registration successful! Logging in...');
        setTimeout(() => {
          setUser(data.user);
          // Clear inputs
          setUsername('');
          setEmail('');
          setPassword('');
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Registration failed. Try again.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend.');
      console.error(err);
    }
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setEmail('');
        setPassword('');
      } else {
        setErrorMsg(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend.');
      console.error(err);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (response.ok) {
        setUser(null);
        setSessions([]);
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Fetch User's Chat Sessions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch('/api/chat/sessions', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Filter out archived unless we want them? In roadmap.md we list active.
        // The endpoint retrieves all sessions. Let's filter or list them.
        setSessions(data);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Create a New Chat Session
  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/chat/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: 'New Consultation' })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newSession = data.session;
        
        // Add to active sessions list locally & select it
        setSessions([newSession, ...sessions]);
        handleSelectSession(newSession);
        
        // Mobile Sidebar auto-close
        setSidebarOpen(false);
      }
    } catch (err) {
      console.error('Error creating chat session:', err);
    }
  };

  // Load specific session messages
  const handleSelectSession = async (session) => {
    setCurrentSession(session);
    setMessagesLoading(true);
    setMessages([]);
    
    try {
      const response = await fetch(`/api/chat/sessions/${session._id}/messages`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error loading session messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentSession || isReplying) return;

    const currentMsgText = inputText.trim();
    setInputText('');

    // Optimistically update message stream for seamless responsiveness
    const tempUserMsg = {
      _id: Date.now().toString(),
      sender: 'user',
      content: currentMsgText,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMsg]);
    setIsReplying(true);

    try {
      const response = await fetch(`/api/chat/sessions/${currentSession._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: currentMsgText,
          sender: 'user'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Replace optimistic message and add backend's assistant response
        setMessages(prev => {
          // Filter out our temporary message and add exact ones from backend
          const cleanHistory = prev.filter(m => m._id !== tempUserMsg._id);
          return [...cleanHistory, data.userMessage, data.assistantMessage];
        });

        // Trigger a session refresh to update potential auto-generated title
        // If this was the first user message, reload sessions list to catch the updated title!
        const userMsgCount = messages.filter(m => m.sender === 'user').length;
        if (userMsgCount === 0) {
          fetchSessions();
          // Update local currentSession title
          setCurrentSession(prev => ({
            ...prev,
            title: currentMsgText.substring(0, 35) + (currentMsgText.length > 35 ? '...' : '')
          }));
        }
      } else {
        // Remove optimistic user message and show alert on failure
        setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id));
        alert('Failed to send message.');
      }
    } catch (err) {
      console.error('Send message error:', err);
      setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id));
      alert('Error sending message. Network failed.');
    } finally {
      setIsReplying(false);
    }
  };

  // Archive Chat Session
  const handleArchiveSession = async (sessionId, e) => {
    e.stopPropagation(); // Avoid selecting the chat session when clicking archive
    
    if (!confirm('Are you sure you want to archive this chat session?')) return;

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        // Deselect if we archived the current active session
        if (currentSession && currentSession._id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
        
        // Refresh session list
        fetchSessions();
      }
    } catch (err) {
      console.error('Error archiving session:', err);
    }
  };

  // Helper to render markdown html safely
  const renderMarkdown = (content) => {
    const rawHtml = DOMPurify.sanitize(marked.parse(content || ''));
    return { __html: rawHtml };
  };

  // Render Loader screen at boot
  if (authLoading) {
    return (
      <div className="auth-wrapper">
        <div className="glass-card flex flex-col justify-center items-center p-10 rounded-2xl">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
          <p className="text-secondary text-sm">Initializing LawGPT securely...</p>
        </div>
      </div>
    );
  }

  // Render Auth panel if not logged in
  if (!user) {
    return (
      <div className="auth-wrapper animate-fade-in">
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <div className="auth-logo">
              <Scale size={32} />
            </div>
            <h1 className="auth-title">LawGPT</h1>
            <p className="auth-subtitle">Professional AI Legal Consultation</p>
          </div>

          {errorMsg && (
            <div className="glass-card border-red-500/20 bg-red-500/5 text-red-400 p-3 rounded-lg flex items-center gap-3 mb-5 text-sm animate-fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="glass-card border-green-500/20 bg-green-500/5 text-green-400 p-3 rounded-lg flex items-center gap-3 mb-5 text-sm animate-fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="auth-button">
                Sign In
              </button>
              <div className="auth-toggle">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  className="auth-toggle-btn"
                  onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
                >
                  Create account
                </button>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  placeholder="lawyer_john" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="auth-button">
                Create Account
              </button>
              <div className="auth-toggle">
                Already have an account?{' '}
                <button 
                  type="button" 
                  className="auth-toggle-btn"
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render main dashboard when logged in
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Scale size={18} />
            </div>
            <span>LawGPT</span>
          </div>
          <button 
            className="sidebar-toggle-btn md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <Plus size={16} />
          New Consultation
        </button>

        <div className="sessions-list-container">
          <div className="sessions-title">Conversations</div>
          
          {sessionsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-muted" size={20} />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-muted text-xs text-center p-4">
              No recent consultations.
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session._id}
                className={`session-item ${currentSession?._id === session._id ? 'active' : ''} ${session.status === 'archived' ? 'opacity-60' : ''}`}
                onClick={() => {
                  handleSelectSession(session);
                  setSidebarOpen(false); // Auto-close sidebar on mobile after selection
                }}
              >
                <div className="session-item-content">
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="session-item-title">{session.title}</span>
                </div>
                {session.status !== 'archived' && (
                  <button 
                    className="archive-btn" 
                    title="Archive consultation"
                    onClick={(e) => handleArchiveSession(session._id, e)}
                  >
                    <Archive size={12} />
                  </button>
                )}
              </button>
            ))
          )}
        </div>

        {/* User Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-area">
        {currentSession ? (
          <>
            {/* Active session header */}
            <header className="chat-header">
              <div className="chat-header-info">
                <button 
                  className="sidebar-toggle-btn"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={18} />
                </button>
                <div>
                  <h2 className="chat-header-title">{currentSession.title}</h2>
                  <span className="chat-header-status">
                    ID: {currentSession._id.substring(0, 8)}...
                  </span>
                </div>
              </div>
              <div>
                {currentSession.status === 'archived' ? (
                  <span className="chat-header-badge archived">Archived</span>
                ) : (
                  <span className="chat-header-badge">Active Session</span>
                )}
              </div>
            </header>

            {/* Messages Scroll Area */}
            <div className="messages-container">
              {messagesLoading ? (
                <div className="flex flex-col justify-center items-center h-full">
                  <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                  <p className="text-secondary text-sm">Retrieving consultation history...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-center max-w-sm mx-auto">
                  <Scale size={40} className="text-muted mb-4" />
                  <h3 className="font-semibold text-white mb-2">Legal Consultant Ready</h3>
                  <p className="text-secondary text-sm">
                    Enter your question below. The AI will cite sections, acts, and relevant regulations.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg._id} 
                    className={`message-bubble-wrapper ${msg.sender}`}
                  >
                    <div className="message-bubble">
                      <div className="message-info">
                        {msg.sender === 'user' ? (
                          <>
                            <span>You</span>
                            <div className="message-avatar-small">U</div>
                          </>
                        ) : (
                          <>
                            <div className="message-avatar-small bg-indigo-600">AI</div>
                            <span>LawGPT Legal Assistant</span>
                          </>
                        )}
                      </div>

                      {msg.sender === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div 
                          className="markdown-content"
                          dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Loader while waiting for Gemini response */}
              {isReplying && (
                <div className="message-bubble-wrapper assistant">
                  <div className="message-bubble">
                    <div className="message-info">
                      <div className="message-avatar-small bg-indigo-600">AI</div>
                      <span>Drafting legal response...</span>
                    </div>
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Disclaimer and Input Container */}
            <div className="chat-input-container">
              {currentSession.status === 'archived' ? (
                <div className="disclaimer-box text-center justify-center border-yellow-500/20 bg-yellow-500/5 text-yellow-300">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>This conversation is archived. Create a new consultation to continue.</span>
                </div>
              ) : (
                <>
                  <form className="chat-input-form" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      className="chat-input"
                      placeholder="Ask any legal question, contract risk advice..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isReplying}
                    />
                    <button 
                      type="submit" 
                      className="send-btn" 
                      disabled={!inputText.trim() || isReplying}
                    >
                      <Send size={16} />
                    </button>
                  </form>
                  
                  <div className="disclaimer-box">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5 text-red-400" />
                    <p>
                      <strong>Important Notice:</strong> LawGPT is an AI assistant, not a human lawyer. 
                      This system provides general legal information and does not establish an attorney-client relationship.
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* Empty screen / Welcome panel */
          <div className="welcome-pane animate-fade-in">
            <div className="welcome-logo">
              <Scale size={40} />
            </div>
            <h1 className="welcome-title">Welcome to LawGPT</h1>
            <p className="welcome-subtitle">
              Your professional, AI-powered legal consultation companion. Ask legal questions,
              scan contract structures, and draft formatted documents instantly with fully grounded Gemini intelligence.
            </p>

            <div className="features-grid">
              <div className="glass-card feature-card">
                <Scale size={24} className="feature-icon" />
                <h3 className="feature-title">Statutory Citations</h3>
                <p className="feature-desc">Receive legal opinions automatically referenced to exact Articles and Penal Codes.</p>
              </div>

              <div className="glass-card feature-card">
                <BookOpen size={24} className="feature-icon" />
                <h3 className="feature-title">Structured Drafting</h3>
                <p className="feature-desc">Generate well-structured tenancy agreements, NDAs, and corporate policies.</p>
              </div>
            </div>

            <button 
              className="auth-button animate-pulse-glow" 
              style={{ marginTop: '40px', padding: '14px 28px' }}
              onClick={handleNewChat}
            >
              Start Consultation Thread
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
