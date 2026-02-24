import React from 'react';

const AuthContext = React.createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false
});

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);

  const login = (userData) => {
    setUser(userData);
    console.log("user data: ", userData);
    // 1. Switched to sessionStorage
    sessionStorage.setItem('user', JSON.stringify(userData)); 
  };
  
  const logout = () => {
    setUser(null);
    // 2. Switched to sessionStorage
    sessionStorage.removeItem('user'); 
    window.location.pathname = '/login';
  };
  
  React.useEffect(() => {
    // 3. Switched to sessionStorage
    const storedUser = sessionStorage.getItem('user'); 
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 4. REMOVED the buggy 'beforeunload' useEffect entirely!

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);