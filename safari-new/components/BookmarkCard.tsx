import React, { useRef, useState } from 'react';
import { Bookmark } from '../types';
import { Folder, Globe } from 'lucide-react';

interface BookmarkCardProps {
  bookmark: Bookmark;
  parentId?: string;
  onDelete: (id: string) => void;
  onClick?: (bookmark: Bookmark) => void;
  onDrop?: (sourceId: string, targetId: string) => void;
  onDragStart?: (e: React.DragEvent, bookmark: Bookmark, parentId?: string) => void;
  onDragEnd?: () => void;
  onContextMenu?: (e: React.MouseEvent, bookmark: Bookmark) => void;
  onHover?: (url: string | null) => void;
  isInsideFolder?: boolean;
}

// Small sub-component to handle individual preview item error states
const FolderPreviewItem = ({ child, isDense }: { child: Bookmark, isDense: boolean }) => {
    const [imgError, setImgError] = useState(false);
    
    if (child.type === 'folder') {
        return (
             <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                <Folder size={isDense ? 10 : 14} className="text-blue-400 fill-blue-400/20" />
            </div>
        );
    }

    if (child.favicon && !imgError) {
        return (
            <img 
                src={child.favicon} 
                alt="" 
                className="w-full h-full object-cover pointer-events-none" 
                draggable={false}
                onError={() => setImgError(true)} 
            />
        );
    }

    return <Globe size={isDense ? 8 : 12} className="text-gray-400" />;
};

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ 
  bookmark, 
  parentId,
  onDelete, 
  onClick, 
  onDrop,
  onDragStart,
  onDragEnd,
  onContextMenu,
  onHover,
  isInsideFolder = false
}) => {
  const isFolder = bookmark.type === 'folder';
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, bookmark);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isFolder && onClick) {
      e.preventDefault();
      onClick(bookmark);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    const dragData = JSON.stringify({ 
      id: bookmark.id, 
      type: bookmark.type, 
      fromFolderId: parentId 
    });
    e.dataTransfer.setData('application/json', dragData);
    e.dataTransfer.effectAllowed = 'move';
    
    // FORCE drag image to be the visual card
    if (cardRef.current) {
        // Offset centering for better feel
        e.dataTransfer.setDragImage(cardRef.current, 40, 40);
    }
    
    if (onDragStart) {
        onDragStart(e, bookmark, parentId);
    }
  };

  const handleDragEndInternal = (e: React.DragEvent) => {
      if (onDragEnd) onDragEnd();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (onDrop) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDrop) {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const { id: sourceId } = JSON.parse(data);
        if (sourceId !== bookmark.id) {
            onDrop(sourceId, bookmark.id);
        }
      }
    }
  };

  // Folder Preview Logic
  const renderFolderPreview = () => {
    const children = bookmark.children || [];
    const isDense = children.length > 4;
    const gridClass = isDense ? "grid-cols-3 grid-rows-3" : "grid-cols-2 grid-rows-2";
    const limit = isDense ? 9 : 4;

    return (
      <div className={`grid ${gridClass} gap-1 p-2 w-full h-full bg-white/20 backdrop-blur-xl rounded-[22%]`}>
        {children.slice(0, limit).map((child, i) => (
           <div key={i} className="flex items-center justify-center bg-white rounded-md w-full h-full shadow-sm overflow-hidden aspect-square">
               <FolderPreviewItem child={child} isDense={isDense} />
           </div>
        ))}
        {children.length === 0 && (
           <div className="col-span-full row-span-full flex items-center justify-center opacity-40">
              <Folder size={28} className="text-white" />
           </div>
        )}
      </div>
    );
  };

  const IconContainer = (
    <div 
        ref={cardRef}
        className="relative group w-[72px] h-[72px] md:w-[82px] md:h-[82px] transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer"
        onContextMenu={handleContextMenu}
    >
      {isFolder ? (
        renderFolderPreview()
      ) : (
        // Single App Icon
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-[22%] bg-white shadow-sm relative group-hover:shadow-md transition-shadow">
          {bookmark.favicon && !imgError ? (
             <img 
               src={bookmark.favicon} 
               alt="" 
               className="w-full h-full object-cover pointer-events-none select-none"
               onError={() => setImgError(true)}
               draggable={false}
             />
          ) : null}
          
          {/* Fallback Icon */}
          <div className={`${bookmark.favicon && !imgError ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 text-gray-400`}>
             <Globe size={36} />
          </div>

          {/* Inner Border */}
          <div className="absolute inset-0 rounded-[22%] ring-1 ring-black/5 pointer-events-none" />
        </div>
      )}
    </div>
  );

  return (
    <div 
      className="flex flex-col items-center gap-2 w-[88px]"
      draggable={true} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndInternal}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={() => {
        if (!isFolder && bookmark.url && onHover) onHover(bookmark.url);
      }}
      onMouseLeave={() => {
        if (onHover) onHover(null);
      }}
    >
      {isFolder ? (
        <div onClick={handleClick}>{IconContainer}</div>
      ) : (
        <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={handleClick}
            className="select-none outline-none"
            draggable={false} // CRITICAL: Prevents link dragging
        >
          {IconContainer}
        </a>
      )}
      
      <span className="text-white text-[12px] md:text-[13px] font-medium tracking-tight text-center leading-snug drop-shadow-lg line-clamp-2 w-[96px] select-none break-words px-1" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
        {bookmark.title}
      </span>
    </div>
  );
};