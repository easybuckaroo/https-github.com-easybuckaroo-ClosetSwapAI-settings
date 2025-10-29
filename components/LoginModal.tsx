import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { AppleIcon, GoogleIcon, UserIcon } from './IconComponents';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, users, loginWithProvider } = useAppContext();

  if (!isOpen) {
    return null;
  }

  const handleLogin = (userId: string) => {
    login(userId);
    onClose();
  };
  
  const handleProviderLogin = (email: string) => {
    loginWithProvider(email);
    onClose();
  };

  // Exclude admin from the login selector for this demo UI
  const loginableUsers = users.filter(u => u.type !== 'admin');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Login or Sign Up</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <p className="text-center text-gray-500 mb-6">For demo purposes, please select a profile or use a provider.</p>

        <div className="space-y-4 max-h-60 overflow-y-auto">
          {loginableUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user.id)}
              className="w-full flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-left">{user.name}</p>
                <p className="text-sm text-gray-500 text-left capitalize">{user.type} Account {user.age < 18 ? '(Minor)' : ''}</p>
              </div>
            </button>
          ))}
        </div>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
                onClick={() => handleProviderLogin('dbrabon@gmail.com')}
                className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <GoogleIcon className="w-5 h-5" />
                <span className="font-medium text-gray-700">Google (Admin)</span>
            </button>
             <button 
                onClick={() => handleProviderLogin('new.buyer@example.com')}
                className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <AppleIcon className="w-5 h-5" />
                <span className="font-medium text-gray-700">Apple (New User)</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;