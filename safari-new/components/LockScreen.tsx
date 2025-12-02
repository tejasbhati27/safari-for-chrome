import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface LockScreenProps {
  onUnlock: (password: string) => void;
  error?: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onUnlock(password);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Dynamic abstract background similar to Apple screensavers */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      
      <div className="z-10 w-full max-w-md p-8 flex flex-col items-center animate-fade-in-up">
        <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mb-8 shadow-2xl ring-1 ring-white/30">
          <Lock size={40} className="text-white/90" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-white/60 mb-8 text-lg">Enter password to access dashboard</p>

        <form onSubmit={handleSubmit} className="w-full relative group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-black/30 transition-all text-center text-lg tracking-widest"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all disabled:opacity-0 disabled:scale-75"
            disabled={!password}
          >
            <ArrowRight size={20} />
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-200 bg-red-500/20 px-4 py-2 rounded-lg backdrop-blur-md text-sm font-medium animate-shake">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};