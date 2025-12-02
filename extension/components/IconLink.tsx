import React, { useState } from 'react';
import { LinkItem } from '../types';
import { Trash2, Globe } from 'lucide-react';

interface IconLinkProps {
  item: LinkItem;
  sectionId: string;
  onContextMenu: (e: React.MouseEvent, itemId: string) => void;
  onClick: (item: LinkItem) => void;
  onDrop: (sourceItemId: string, sourceSectionId: string, targetItemId: string, targetSectionId: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const IconLink: React.FC<IconLinkProps> = ({ item, sectionId, onContextMenu, onClick, onDrop, onDragStart, onDragEnd }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [faviconAttempt, setFaviconAttempt] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to section containers
    onClick(item);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!item.isSystem) {
      onContextMenu(e, item.id);
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (item.isSystem) {
      e.preventDefault();
      return;
    }

    // Notify parent (FolderView needs this to track drag state)
    if (onDragStart) {
      onDragStart(e);
    }

    // CRITICAL: Stop propagation so the Section parent doesn't detect a "Section Drag"
    e.stopPropagation();

    e.dataTransfer.setData('application/json', JSON.stringify({ itemId: item.id, sectionId }));
    e.dataTransfer.setData('type', 'ITEM'); // Explicit type
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEndHandler = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (item.isSystem) return;
    e.preventDefault();
    e.stopPropagation();

    // Only accept Items, not Sections
    if (!e.dataTransfer.types.includes('application/json')) return;

    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling to parent containers
    setIsDragOver(false);
    if (item.isSystem) return;

    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Ensure we are dropping an item, not a section
        if (parsed.itemId && parsed.sectionId) {
          const { itemId: sourceItemId, sectionId: sourceSectionId } = parsed;
          if (sourceItemId !== item.id) {
            onDrop(sourceItemId, sourceSectionId, item.id, sectionId);
          }
        }
      } catch (err) {
        console.error('Failed to parse drag data', err);
      }
    }
  };

  // Multi-fallback favicon system
  const getFavicon = (url: string, attempt: number = 0): string => {
    try {
      const domain = new URL(url).hostname;

      // Try different favicon services
      switch (attempt) {
        case 0:
          // Google's favicon service (high quality, 128px)
          return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        case 1:
          // DuckDuckGo's favicon service (reliable fallback)
          return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        case 2:
          // Direct favicon from domain
          return `https://${domain}/favicon.ico`;
        case 3:
          // Favicon.ico grabber service
          return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        default:
          return '';
      }
    } catch {
      return '';
    }
  };

  const handleImageError = () => {
    if (faviconAttempt < 3) {
      setFaviconAttempt(faviconAttempt + 1);
    } else {
      setShowFallback(true);
    }
  };

  // Render Folder Preview
  if (item.type === 'folder') {
    return (
      <div
        className={`
          flex flex-col items-center gap-3 group cursor-pointer w-[90px] md:w-[100px] 
          transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          ${isDragOver ? 'scale-110 z-20' : 'hover:scale-105 z-10'}
        `}
        title={item.name}
        draggable={!item.isSystem}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEndHandler}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div
          className={`
            w-[72px] h-[72px] md:w-20 md:h-20
            bg-white/40 
            backdrop-blur-xl 
            rounded-[20px] 
            shadow-[0_4px_16px_rgba(0,0,0,0.1)] 
            border
            p-[6px]
            grid grid-cols-2 grid-rows-2 gap-[4px]
            transition-all duration-300 ease-out
            group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)] group-hover:bg-white/50
            ${isDragOver ? 'border-blue-400 border-2 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'border-white/30'}
          `}
        >
          {item.items && item.items.slice(0, 4).map((subItem, index) => (
            <div key={index} className="w-full h-full bg-white/60 rounded-[6px] flex items-center justify-center overflow-hidden shadow-sm transition-opacity">
              <img
                key={`${subItem.url}-${faviconAttempt}`}
                src={getFavicon(subItem.url, faviconAttempt)}
                alt=""
                className="w-4 h-4 md:w-5 md:h-5 object-contain opacity-90"
                onError={handleImageError}
              />
            </div>
          ))}
        </div>
        <span className="text-[13px] font-medium text-white text-center truncate w-full px-1 leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] select-none transition-opacity">
          {item.name}
        </span>
      </div>
    );
  }

  // Render Standard Link
  return (
    <div
      className={`
        flex flex-col items-center gap-3 group cursor-pointer w-[90px] md:w-[100px] 
        transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        ${isDragOver ? 'scale-110 z-20' : 'hover:scale-105 z-10'}
      `}
      title={item.name}
      draggable={!item.isSystem}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndHandler}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick} // Ensure click is attached to container for reliability
    >
      <div className="relative block">
        <div
          className={`
            w-[72px] h-[72px] md:w-20 md:h-20
            bg-white/80 
            backdrop-blur-2xl 
            rounded-[20px] 
            shadow-[0_4px_16px_rgba(0,0,0,0.1)] 
            border
            flex items-center justify-center
            transition-all duration-300 ease-out
            group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] group-hover:bg-white/90
            ${isDragOver ? 'border-blue-400 border-2 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'border-white/50'}
          `}
          onContextMenu={handleContextMenu}
        >
          {item.isSystem ? (
            <Trash2 className="w-8 h-8 text-gray-700 opacity-80" />
          ) : showFallback ? (
            <Globe className="w-8 h-8 text-gray-600 opacity-70" />
          ) : (
            <img
              key={`${item.url}-${faviconAttempt}`}
              src={getFavicon(item.url, faviconAttempt)}
              alt={item.name}
              className="w-8 h-8 md:w-9 md:h-9 object-contain rounded-sm drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
            />
          )}
        </div>
      </div>
      <span className="text-[13px] font-medium text-white text-center truncate w-full px-1 leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] select-none transition-opacity">
        {item.name}
      </span>
    </div>
  );
};

export default IconLink;