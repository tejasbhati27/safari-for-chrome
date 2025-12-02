import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onHide }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-2xl border border-white/50 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-sm font-semibold text-gray-800">{message}</span>
      </div>
    </div>
  );
};

export default Toast;