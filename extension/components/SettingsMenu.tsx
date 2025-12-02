import React, { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Image, Bookmark } from 'lucide-react';

interface SettingsMenuProps {
  onAddSection: () => void;
  onCustomize: () => void;
  onImportBookmarks: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onAddSection, onCustomize, onImportBookmarks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-56 flex flex-col gap-1 p-1.5 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-4 zoom-in-95 origin-bottom-right duration-200">
          <button
            onClick={() => {
              onAddSection();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 active:bg-black/10 transition-colors text-gray-800 text-sm font-medium text-left"
          >
            <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
              <Plus size={16} className="text-blue-500" />
            </div>
            Add Section
          </button>

          <button
            onClick={() => {
              onCustomize();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 active:bg-black/10 transition-colors text-gray-800 text-sm font-medium text-left"
          >
            <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
              <Image size={16} className="text-purple-500" />
            </div>
            Customize Background
          </button>

          <button
            onClick={() => {
              onImportBookmarks();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 active:bg-black/10 transition-colors text-gray-800 text-sm font-medium text-left"
          >
            <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
              <Bookmark size={16} className="text-orange-500" />
            </div>
            Import Bookmarks
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-3.5 rounded-full 
          bg-white/70 hover:bg-white/90 backdrop-blur-2xl border border-white/40 
          shadow-lg hover:shadow-xl text-gray-800 font-semibold 
          transition-all active:scale-95 duration-200
          ${isOpen ? 'bg-white/90 ring-4 ring-white/30' : ''}
        `}
      >
        <Settings size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
    </div>
  );
};

export default SettingsMenu;