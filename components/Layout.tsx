
import * as React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  // The map page needs a full-bleed layout
  const isMapPage = location.pathname === '/map';

  return (
    <div className="flex h-screen bg-light-gray font-sans">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className={`flex-1 ${isMapPage ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto bg-light-gray p-6 md:p-8'}`}>
          {children}
        </main>
        {!isMapPage && <Footer />}
      </div>
    </div>
  );
};

export default Layout;