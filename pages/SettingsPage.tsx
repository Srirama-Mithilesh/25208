import { FC } from 'react';
import { User, Bell, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SettingsPage: FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">Application Settings</h2>
        
        <div className="space-y-6">
            {/* Appearance Settings */}
            <div className="flex items-start space-x-4">
              {theme === 'light' ? <Sun className="h-6 w-6 text-yellow-500 mt-1" /> : <Moon className="h-6 w-6 text-indigo-400 mt-1" />}
              <div>
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Appearance</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Switch between light and dark themes.</p>
                <div className="mt-4 flex items-center gap-4">
                    <button onClick={toggleTheme} className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-sail-orange">
                        <span className="sr-only">Toggle theme</span>
                        <span className={`${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                    </button>
                    <span className="text-gray-700 dark:text-gray-300 capitalize">{theme} Mode</span>
                </div>
              </div>
            </div>
          
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Profile Settings */}
          <div className="flex items-start space-x-4">
            <User className="h-6 w-6 text-sail-blue mt-1" />
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Profile</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">This information will be displayed publicly so be careful what you share.</p>
              <div className="space-y-3 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                  <input type="text" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-sail-orange focus:border-sail-orange" defaultValue="admin_user" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-sail-orange focus:border-sail-orange" defaultValue="admin@sail.co.in" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Notifications */}
          <div className="flex items-start space-x-4">
            <Bell className="h-6 w-6 text-sail-orange mt-1" />
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Notifications</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Manage how you receive notifications.</p>
              <div className="space-y-2 mt-4">
                <div className="flex items-center">
                  <input id="email-notifications" type="checkbox" className="h-4 w-4 text-sail-orange border-gray-300 rounded focus:ring-sail-orange" defaultChecked />
                  <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Email Notifications</label>
                </div>
                 <div className="flex items-center">
                  <input id="push-notifications" type="checkbox" className="h-4 w-4 text-sail-orange border-gray-300 rounded focus:ring-sail-orange" />
                  <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Push Notifications</label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

           {/* Security */}
          <div className="flex items-start space-x-4">
            <Shield className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Security</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Manage your account's security settings.</p>
               <button className="mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Change Password
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button className="px-4 py-2 bg-sail-blue text-white rounded-md hover:bg-blue-800 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;