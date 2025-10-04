
import * as React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sailboat, User, Lock } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-sail-blue flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 space-y-8">
            <div className="text-center space-y-2">
                <div className="flex justify-center items-center gap-3">
                    <Sailboat size={48} className="text-sail-orange" />
                    <h1 className="text-4xl font-extrabold text-sail-blue">SAIL DSS</h1>
                </div>
                <p className="text-gray-600">Rake Formation Decision Support</p>
            </div>
            <form className="space-y-6" onSubmit={handleLogin}>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        id="username"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sail-orange focus:border-sail-orange"
                        required
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sail-orange focus:border-sail-orange"
                        required
                    />
                </div>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sail-orange hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sail-orange transition-colors"
                >
                    Login
                </button>
            </form>
            <p className="text-xs text-center text-gray-500">
                Hint: Use 'admin'/'password' or 'manager_bhilai'/'password'.
            </p>
        </div>
        <div className="text-center text-gray-300 mt-8 text-sm">
             © 2025 Steel Authority of India – Decision Support System Prototype
        </div>
    </div>
  );
};

export default LoginPage;