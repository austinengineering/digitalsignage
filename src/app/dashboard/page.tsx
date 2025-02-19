'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MediaLibrary from '@/components/dashboard/MediaLibrary';
import PlaylistManager from '@/components/dashboard/PlaylistManager';
import { useState } from 'react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('screens');

  const renderContent = () => {
    switch (activeTab) {
      case 'media':
        return <MediaLibrary />;
      case 'playlists':
        return <PlaylistManager />;
      case 'screens':
      default:
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-900">Screens</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your connected display screens
            </p>
            {/* Screen management content will go here */}
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('screens')}
              className={`${
                activeTab === 'screens'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap px-6 py-4 border-b-2 font-medium text-sm`}
            >
              Screens
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`${
                activeTab === 'playlists'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap px-6 py-4 border-b-2 font-medium text-sm`}
            >
              Playlists
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`${
                activeTab === 'media'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap px-6 py-4 border-b-2 font-medium text-sm`}
            >
              Media Library
            </button>
          </nav>
        </div>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}