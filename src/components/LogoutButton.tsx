import React from 'react';
import AuthContext from '../context/AuthContext'; // Corrected import statement

const LogoutButton: React.FC = () => {
  const { logout } = AuthContext.useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Optionally, show a success message or redirect
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally, show an error message
    }
  };

  return (
    <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
      Logout
    </button>
  );
};

export default LogoutButton;
