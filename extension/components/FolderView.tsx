import React, { useState } from 'react';
import { LinkItem } from '../types';
import IconLink from './IconLink';
import { X } from 'lucide-react';

interface FolderViewProps {
  folder: LinkItem;
  sectionId: string;
  onClose: () => void;
  onItemClick: (item: LinkItem) => void;
  onContextMenu: (e: React.MouseEvent, itemId: string) => void;
  onDrop: (sourceItemId: string, sourceSectionId: string, targetItemId: string, targetSectionId: string) => void;
}

const FolderView: React.FC<FolderViewProps> = ({ folder, sectionId, onClose, onItemClick, onContextMenu, onDrop }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isOutside, setIsOutside] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsOutside(false);
  };

  // Detect when dragging outside the folder content area
  const handleDragOverBackdrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDragging) {
      setIsOutside(true);
    }
  };

  // Keep 'inside' state when over content
  const handleDragOverContent = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDragging && isOutside) {
      setIsOutside(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOutside ? 'pointer-events-none' : 'pointer-events-auto'}`}
      onDragOver={handleDragOverBackdrop}
    >
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 transition-all duration-300 ease-out
          ${isDragging && isOutside ? 'bg-black/0 backdrop-blur-none' : 'bg-black/40 backdrop-blur-md'}
        `}
        onClick={onClose}
      />
      
      {/* Folder Content */}
      <div 
        className={`
          relative z-10 bg-white/60 backdrop-blur-3xl border border-white/50 rounded-[36px] shadow-2xl p-8 w-full max-w-2xl 
          transition-all duration-300 ease-out origin-center
          ${isDragging && isOutside ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}
        `}
        onDragOver={handleDragOverContent}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }} 
      >
        <div className="flex items-center justify-between mb-8 pl-2 pr-1">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight drop-shadow-sm">{folder.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors text-gray-700 shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        <div 
          className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-6 min-h-[160px] content-start"
          // We don't rely on container drag events here because children stop propagation
        >
          {folder.items && folder.items.map((item) => (
             <IconLink 
               key={item.id}
               item={item}
               sectionId={sectionId}
               onContextMenu={(e, itemId) => onContextMenu(e, itemId)}
               onClick={onItemClick}
               onDrop={onDrop}
               // Pass Handlers down to child to bypass stopPropagation issues
               onDragStart={handleDragStart}
               onDragEnd={handleDragEnd}
             />
          ))}
          {(!folder.items || folder.items.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center h-40 text-gray-500 font-medium opacity-70">
              Folder is empty
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderView;