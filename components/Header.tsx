import * as React from 'react';
import { Menu, LogOut, User as UserIcon, Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Role } from '../types';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { notifications, markNotificationAsRead, markAllAsRead } = useData();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const userNotifications = notifications.filter(n => {
    if (!user) return false;
    if (user.role === Role.ADMIN) return true; // Admins see all
    if (user.role === Role.BASE_MANAGER) return n.baseId === user.baseId;
    return false;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadNotifications = userNotifications.filter(n => !n.read);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="relative bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu size={24} />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sail-orange"
                >
                    <Bell size={20} />
                    {unreadNotifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center border-2 border-white">
                            {unreadNotifications.length}
                        </span>
                    )}
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border z-20">
                        <div className="p-3 flex justify-between items-center border-b">
                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                            {unreadNotifications.length > 0 && (
                                <button onClick={markAllAsRead} className="text-sm text-sail-blue hover:underline">
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {userNotifications.length === 0 ? (
                                <p className="text-center text-gray-500 py-6 text-sm">No notifications yet.</p>
                            ) : (
                                <ul>
                                    {userNotifications.map(n => (
                                        <li key={n.id} className={`p-3 border-b last:border-b-0 hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm text-gray-700 pr-2">{n.message}</p>
                                                {!n.read && (
                                                    <button onClick={() => markNotificationAsRead(n.id)} title="Mark as read" className="flex-shrink-0 text-green-500 hover:text-green-700 p-1">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <UserIcon className="h-8 w-8 rounded-full bg-gray-200 text-gray-500 p-1" />
                <div className='text-right'>
                    <span className="font-semibold text-gray-800 text-sm">{user?.name}</span>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sail-orange"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;