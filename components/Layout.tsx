import { useState, FC, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // The map page needs a full-bleed layout
  const isMapPage = location.pathname === '/map';

  return (
    <div className="flex h-screen bg-light-gray dark:bg-gray-900 font-sans">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className={`flex-1 ${isMapPage ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto bg-light-gray dark:bg-gray-900 p-6 md:p-8'}`}>
          {children}
        </main>
        {!isMapPage && <Footer />}
      </div>
    </div>
  );
};

export default Layout;