import { createContext, useContext, useState, useEffect } from 'react';
import { getSocket } from '../utils/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuth,    setIsAuth]    = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [userName,  setUserName]  = useState(() => localStorage.getItem('loggedInUser')  || '');
  const [userRole,  setUserRole]  = useState(() => localStorage.getItem('userRole')      || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('loggedInEmail') || '');
  const [userId,    setUserId]    = useState(() => localStorage.getItem('userId')        || '');
  const [token,     setToken]     = useState(() => localStorage.getItem('authToken')     || '');

  const connectSocket = (role, id) => {
    try {
      const socket = getSocket();
      socket.connect();
      socket.emit('join-room', role);
      socket.emit('join-room', `user-${id}`);
    } catch (err) {
      console.error('Socket connection error:', err);
    }
  };

  const disconnectSocket = () => {
    try {
      const socket = getSocket();
      socket.disconnect();
    } catch (err) {
      console.error('Socket disconnection error:', err);
    }
  };

  const login = (name, role, email, id, tk) => {
    localStorage.setItem('isLoggedIn',    'true');
    localStorage.setItem('loggedInUser',  name);
    localStorage.setItem('userRole',      role);
    localStorage.setItem('loggedInEmail', email);
    localStorage.setItem('userId',        id);
    localStorage.setItem('authToken',     tk);
    setIsAuth(true); setUserName(name); setUserRole(role);
    setUserEmail(email); setUserId(id); setToken(tk);

    connectSocket(role, id);
  };

  const logout = () => {
    ['isLoggedIn','loggedInUser','userRole','loggedInEmail','userId','authToken']
      .forEach(k => localStorage.removeItem(k));
    setIsAuth(false); setUserName(''); setUserRole('');
    setUserEmail(''); setUserId(''); setToken('');

    disconnectSocket();
  };

  useEffect(() => {
    if (isAuth && token && userId && userRole) {
      connectSocket(userRole, userId);
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuth, token, userId, userRole]);

  return (
    <AuthContext.Provider value={{ isAuth, userName, userRole, userEmail, userId, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
