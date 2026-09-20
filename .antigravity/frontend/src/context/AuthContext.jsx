import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  captain: {
    id: 'usr_capt_01',
    name: 'Capt. Alex Vance',
    email: 'captain@polarnav.ai',
    role: 'Captain / Bridge Master',
    vessel: 'R/V Kronos Explorer',
    iceClass: 'Polar Class 3 (PC3)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: 'PC3 Master',
    token: 'demo_token_capt_01'
  },
  navigator: {
    id: 'usr_nav_02',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@polarnav.ai',
    role: 'Chief Hydrographer',
    vessel: 'SA Agulhas II',
    iceClass: 'Polar Class 5 (PC5)',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    badge: 'Polar Hydrographer',
    token: 'demo_token_nav_02'
  },
  admin: {
    id: 'usr_adm_03',
    name: 'Cmdr. Henrik Lind',
    email: 'admin@polarnav.ai',
    role: 'Fleet Command Ops',
    vessel: 'Southern Fleet HQ',
    iceClass: 'Polar Class 1 (PC1)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: 'Fleet Admin',
    token: 'demo_token_adm_03'
  }
};

const STORAGE_KEY = 'polarnav_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedUser = localStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (e) {
      console.error('Failed to parse saved auth state:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // Check against demo accounts or accept valid input
    const demoKey = Object.keys(DEMO_USERS).find(
      key => DEMO_USERS[key].email.toLowerCase() === email.toLowerCase()
    );

    let loggedUser;
    if (demoKey) {
      loggedUser = DEMO_USERS[demoKey];
    } else {
      // Custom user creation
      const username = email.split('@')[0];
      loggedUser = {
        id: `usr_${Date.now()}`,
        name: username.charAt(0).toUpperCase() + username.slice(1),
        email,
        role: 'Navigational Officer',
        vessel: 'Polar Vessel Alpha',
        iceClass: 'Polar Class 4 (PC4)',
        avatarUrl: null,
        badge: 'Bridge Officer',
        token: `jwt_${Date.now()}`
      };
    }

    setUser(loggedUser);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
    }
    return loggedUser;
  };

  const quickLogin = (roleKey) => {
    const selectedUser = DEMO_USERS[roleKey] || DEMO_USERS.captain;
    setUser(selectedUser);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedUser));
    }
    return selectedUser;
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        quickLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
      login: async () => {},
      quickLogin: () => {},
      logout: () => {}
    };
  }
  return context;
}
