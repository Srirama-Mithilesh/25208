
import React from 'react';
import { User, Bell, Shield } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Application Settings</h2>
        
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="flex items-start space-x-4">
            <User className="h-6 w-6 text-sail-blue mt-1" />
            <div>
              <h3 className="font-semibold text-lg text-gray-800">Profile</h3>
              <p className="text-gray-500 text-sm mb-2">This information will be displayed publicly so be careful what you share.</p>
              <div className="space-y-3 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sail-orange focus:border-sail-orange" defaultValue="admin_user" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sail-orange focus:border-sail-orange" defaultValue="admin@sail.co.in" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200"></div>

          {/* Notifications */}
          <div className="flex items-start space-x-4">
            <Bell className="h-6 w-6 text-sail-orange mt-1" />
            <div>
              <h3 className="font-semibold text-lg text-gray-800">Notifications</h3>
              <p className="text-gray-500 text-sm mb-2">Manage how you receive notifications.</p>
              <div className="space-y-2 mt-4">
                <div className="flex items-center">
                  <input id="email-notifications" type="checkbox" className="h-4 w-4 text-sail-orange border-gray-300 rounded focus:ring-sail-orange" defaultChecked />
                  <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">Email Notifications</label>
                </div>
                 <div className="flex items-center">
                  <input id="push-notifications" type="checkbox" className="h-4 w-4 text-sail-orange border-gray-300 rounded focus:ring-sail-orange" />
                  <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-900">Push Notifications</label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200"></div>

           {/* Security */}
          <div className="flex items-start space-x-4">
            <Shield className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-lg text-gray-800">Security</h3>
              <p className="text-gray-500 text-sm mb-2">Manage your account's security settings.</p>
               <button className="mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Change Password
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end">
          <button className="px-4 py-2 bg-sail-blue text-white rounded-md hover:bg-blue-800 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
