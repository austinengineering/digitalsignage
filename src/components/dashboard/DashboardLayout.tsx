'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userPool } from '@/lib/cognito';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      router.push('/');
      return;
    }

    currentUser.getSession((err: any, session: any) => {
      if (err) {
        router.push('/');
        return;
      }
      setUserName(session.getIdToken().payload.email);
    });
  }, [router]);

  const handleSignOut = () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-semibold">Digital Signage</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{userName}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}