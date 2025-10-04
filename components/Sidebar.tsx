import { FC } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Warehouse, Train, BarChart2, Settings, X, Sailboat, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, text: 'Dashboard', roles: [Role.ADMIN, Role.BASE_MANAGER] },
    { to: '/orders', icon: ShoppingCart, text: 'Orders', roles: [Role.ADMIN] },
    { to: '/inventory', icon: Warehouse, text: 'Inventories', roles: [Role.ADMIN, Role.BASE_MANAGER] },
    { to: '/planner', icon: Train, text: 'Planner', roles: [Role.ADMIN, Role.BASE_MANAGER] },
    { to: '/map', icon: Map, text: 'Logistics Map', roles: [Role.ADMIN, Role.BASE_MANAGER] },
    { to: '/reports', icon: BarChart2, text: 'Reports', roles: [Role.ADMIN, Role.BASE_MANAGER] },
    { to: '/settings', icon: Settings, text: 'Settings', roles: [Role.ADMIN, Role.BASE_MANAGER] },
  ];

  const getLinkClass = (path: string) => {
    return location.pathname === path
      ? 'bg-sail-orange text-white'
      : 'text-gray-300 hover:bg-sail-blue-dark hover:text-white';
  };
  
  const accessibleNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <div
        className={`fixed lg:relative inset-y-0 left-0 w-64 bg-sail-blue text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          <div className="flex items-center gap-2">
            <Sailboat size={32} className="text-sail-orange" />
            <h1 className="text-xl font-bold">RakeNet</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-300 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {accessibleNavItems.map(item => (
            <NavLink
              key={item.text}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${getLinkClass(item.to)}`}
            >
              <item.icon className="mr-3" size={20} />
              {item.text}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;