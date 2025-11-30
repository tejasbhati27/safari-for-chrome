import React, { useEffect, useRef } from 'react';
import { Trash, Edit3 } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isFolder?: boolean;
  onClose: () => void;
  onDelete: () => void;
  onRename?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, isFolder, onClose, onDelete, onRename }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Adjust positioning to not go off screen
  const style = {
    top: y,
    left: x,
  };

  return (
    <div 
      ref={ref}
      style={style}
      className="fixed z-50 w-48 bg-white/70 backdrop-blur-2xl border border-white/40 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
    >
      {isFolder && onRename && (
        <button
          onClick={onRename}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-black/5 active:bg-black/10 flex items-center gap-2 transition-colors first:rounded-t-lg font-medium"
        >
          <Edit3 size={16} />
          Rename
        </button>
      )}
      <button
        onClick={onDelete}
        className={`w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-500/10 active:bg-red-500/20 flex items-center gap-2 transition-colors last:rounded-b-lg font-medium ${!isFolder ? 'first:rounded-t-lg' : ''}`}
      >
        <Trash size={16} />
        Delete {isFolder ? 'Folder' : 'Shortcut'}
      </button>
    </div>
  );
};

export default ContextMenu;