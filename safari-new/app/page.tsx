'use client';

import { useState, useEffect } from 'react';
import { Trash2, Lock, ExternalLink, Plus } from 'lucide-react';
import IconLink from '@/components/IconLink';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPassword = localStorage.getItem('sitePassword');
    if (savedPassword) {
      setPassword(savedPassword);
      checkPassword(savedPassword);
    } else {
      setLoading(false);
    }
  }, []);

  const checkPassword = async (pwd: string) => {
    // Simple client-side check isn't secure for the API, but good for UI.
    // Real check happens when fetching data.
    try {
      const res = await fetch('/api/bookmarks', {
        headers: { 'x-site-password': pwd }
      });
      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('sitePassword', pwd);
        const data = await res.json();
        setBookmarks(data);
      } else {
        setError('Invalid password');
      }
    } catch (e) {
      setError('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    checkPassword(password);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link click
    if (!confirm('Delete this bookmark?')) return;

    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-site-password': password }
      });
      if (res.ok) {
        setBookmarks(bookmarks.filter(b => b.id !== id));
      }
    } catch (e) {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-6">Safari Dashboard</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-white text-purple-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed bg-no-repeat">
      <div className="min-h-screen bg-black/40 backdrop-blur-sm p-8">
        <header className="max-w-7xl mx-auto mb-12 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">My Start Page</h1>
          <button
            onClick={() => {
              localStorage.removeItem('sitePassword');
              setIsAuthenticated(false);
              setPassword('');
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-all border border-white/10"
          >
            Lock
          </button>
        </header>

        <main className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bookmarks.map((bookmark) => (
            <IconLink
              key={bookmark.id}
              title={bookmark.title}
              url={bookmark.url}
              favicon={bookmark.favicon}
              onDelete={(e) => handleDelete(bookmark.id, e)}
            />
          ))}

          {bookmarks.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/50">
              <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Plus size={32} />
              </div>
              <p className="text-lg">No bookmarks yet</p>
              <p className="text-sm">Use the Chrome Extension to add some!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
