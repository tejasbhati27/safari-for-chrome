import React, { useState, useEffect, useRef } from 'react';
import { LockScreen } from './components/LockScreen';
import { BookmarkCard } from './components/BookmarkCard';
import { fetchBookmarks, deleteBookmark, saveBookmarks } from './services/bookmarkService';
import { STORAGE_KEYS, Bookmark } from './types';
import { Loader2, X, Trash2, Ban, ChevronLeft, FolderOpen, ExternalLink, Pencil, Settings, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const WALLPAPERS = [
  { name: 'Default', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' },
  { name: 'Aurora', url: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=2574&auto=format&fit=crop' },
  { name: 'Big Sur', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2940&auto=format&fit=crop' },
  { name: 'Dark Waves', url: 'https://images.unsplash.com/photo-1614850523060-8da1d56e37def?q=80&w=2940&auto=format&fit=crop' },
  { name: 'Gradient', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop' },
  { name: 'Midnight', url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=2942&auto=format&fit=crop' }
];

const FALLBACK_BG = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2560&auto=format&fit=crop';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Folder & Drag State
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [folderDimmed, setFolderDimmed] = useState(false); 
  const [isDragging, setIsDragging] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: Bookmark } | null>(null);
  
  // Rename & Hover State
  const [renamingItem, setRenamingItem] = useState<Bookmark | null>(null);
  const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);

  // Settings & Appearance
  const [showSettings, setShowSettings] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(WALLPAPERS[0].url);

  const folderContentRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Check for saved password and background on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem(STORAGE_KEYS.PASSWORD);
    if (savedPassword) {
      handleUnlock(savedPassword);
    }
    
    const savedBg = localStorage.getItem('dashboard_bg');
    if (savedBg) {
        setBackgroundImage(savedBg);
    }
  }, []);

  useEffect(() => {
    if (renamingItem && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
  }, [renamingItem]);

  const handleUnlock = async (pwd: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBookmarks(pwd);
      setBookmarks(Array.isArray(data) ? data : []);
      setPassword(pwd);
      localStorage.setItem(STORAGE_KEYS.PASSWORD, pwd);
      setIsAuthenticated(true);
    } catch (err) {
      setError('Incorrect password');
      localStorage.removeItem(STORAGE_KEYS.PASSWORD);
    } finally {
      setLoading(false);
    }
  };

  const handleBgChange = (url: string) => {
      setBackgroundImage(url);
      localStorage.setItem('dashboard_bg', url);
  };
  
  const handleRandomBg = () => {
      const random = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
      handleBgChange(random.url);
  };

  const handleRandomBgApi = () => {
      // Get precise screen dimensions for high quality and perfect aspect ratio match
      const width = typeof window !== 'undefined' ? window.screen.width * window.devicePixelRatio : 1920;
      const height = typeof window !== 'undefined' ? window.screen.height * window.devicePixelRatio : 1080;
      
      const timestamp = new Date().getTime();
      // Using /seed/{random} ensures we don't get cached images, requesting exact screen size
      const url = `https://picsum.photos/seed/${timestamp}/${Math.floor(width)}/${Math.floor(height)}`;
      
      handleBgChange(url);
  };

  // --- Helper Functions ---

  const findBookmark = (nodes: Bookmark[], id: string): Bookmark | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findBookmark(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  const getParentId = (nodes: Bookmark[], id: string): string | null => {
      for(const node of nodes) {
          if (node.children?.some(child => child.id === id)) return node.id;
          if (node.children) {
              const res = getParentId(node.children, id);
              if (res) return res;
          }
      }
      return null;
  };

  const removeBookmarkFromTree = (nodes: Bookmark[], id: string): Bookmark[] => {
    return nodes.reduce((acc, node) => {
      if (node.id === id) return acc;
      if (node.children) {
        return [...acc, { ...node, children: removeBookmarkFromTree(node.children, id) }];
      }
      return [...acc, node];
    }, [] as Bookmark[]);
  };

  // --- Actions ---

  const handleDelete = async (id: string) => {
    const newBookmarks = removeBookmarkFromTree(bookmarks, id);
    setBookmarks(newBookmarks);
    await deleteBookmark(id, password);
    setContextMenu(null);
  };
  
  const handleRename = async (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      
      const updateTitleRecursive = (nodes: Bookmark[]): Bookmark[] => {
        return nodes.map(node => {
            if (node.id === id) return { ...node, title: newTitle };
            if (node.children) return { ...node, children: updateTitleRecursive(node.children) };
            return node;
        });
    };
    
    const updated = updateTitleRecursive(bookmarks);
    setBookmarks(updated);
    await saveBookmarks(updated, password);
    setRenamingItem(null);
  };

  const handleFolderClick = (folder: Bookmark) => {
      setOpenFolderId(folder.id);
  };

  const closeFolder = () => {
      setOpenFolderId(null);
      setFolderDimmed(false);
  };

  const goBackFolder = () => {
      if (!openFolderId) return;
      const parentId = getParentId(bookmarks, openFolderId);
      setOpenFolderId(parentId); 
      setFolderDimmed(false);
  };

  const handleContextMenu = (e: React.MouseEvent, item: Bookmark) => {
      e.preventDefault();
      setContextMenu({ x: e.pageX, y: e.pageY, item });
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = () => {
      setIsDragging(true);
      setContextMenu(null); // Close menu on drag
  };

  const handleDragEnd = () => {
      setIsDragging(false);
      setFolderDimmed(false);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
      if (folderContentRef.current && !folderContentRef.current.contains(e.relatedTarget as Node)) {
          setFolderDimmed(true);
      }
  };
  
  const handleDropBookmark = async (sourceId: string, targetId: string | null) => {
    setIsDragging(false);
    setFolderDimmed(false);

    const sourceBookmark = findBookmark(bookmarks, sourceId);
    if (!sourceBookmark) return;

    const treeWithoutSource = removeBookmarkFromTree(bookmarks, sourceId);

    // Recursive insert/grouping logic
    const insertIntoTree = (nodes: Bookmark[]): Bookmark[] => {
        return nodes.map(node => {
            // Recurse first
            let updatedChildren = node.children;
            if (node.children) {
                 updatedChildren = insertIntoTree(node.children);
            }

            // Case: Dropping onto a Folder -> Add to it
            if (node.id === targetId && node.type === 'folder') {
                return { ...node, children: [sourceBookmark, ...(node.children || [])] };
            }

            // Case: Dropping onto a Link -> Create Group Folder
            if (node.id === targetId && node.type !== 'folder') {
                const newFolder: Bookmark = {
                    id: uuidv4(),
                    title: 'New Folder',
                    type: 'folder',
                    date: new Date().toISOString(),
                    children: [node, sourceBookmark]
                };
                return newFolder;
            }

            return { ...node, children: updatedChildren };
        });
    };

    let updatedBookmarks: Bookmark[] = [];
    if (targetId === null) {
        // Dropped on root
        updatedBookmarks = [...treeWithoutSource, sourceBookmark];
        // CRITICAL FIX: If we dropped to root, assume user moved it out of the folder.
        // Close the folder to show the user the dashboard.
        setOpenFolderId(null);
    } else {
        updatedBookmarks = insertIntoTree(treeWithoutSource);
    }

    setBookmarks(updatedBookmarks);
    await saveBookmarks(updatedBookmarks, password);
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('application/json');
      if (data) {
          const { id: sourceId } = JSON.parse(data);
          handleDropBookmark(sourceId, null);
      }
  };

  const openFolder = openFolderId ? findBookmark(bookmarks, openFolderId) : null;

  if (!isAuthenticated) {
    return <LockScreen onUnlock={handleUnlock} error={error} />;
  }

  return (
    <div 
        className="min-h-screen w-full relative selection:bg-blue-500/30 font-sans overflow-hidden bg-gray-900"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleGlobalDrop}
        onClick={() => { setContextMenu(null); setShowSettings(false); }}
        onContextMenu={(e) => e.preventDefault()} // Disable default context menu globally
    >
        {/* Robust Background Image Loader (Hidden) */}
        {/* Detects if the current background fails to load and switches to fallback */}
        <img 
            src={backgroundImage} 
            className="hidden" 
            aria-hidden="true"
            onError={() => {
                if (backgroundImage !== FALLBACK_BG) {
                    console.warn("Background failed to load, switching to fallback.");
                    setBackgroundImage(FALLBACK_BG);
                }
            }}
        />

        {/* iOS 17 Style Abstract Wallpaper */}
        <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0 transition-all duration-700 ease-out"
            style={{ 
                backgroundImage: `url('${backgroundImage}')`, 
                transform: openFolderId ? 'scale(1.1)' : 'scale(1.0)',
                filter: openFolderId ? 'brightness(0.6) blur(20px)' : 'brightness(1)'
            }}
        />

        {/* Drag Action Bar */}
        <div className={`fixed top-4 left-0 right-0 z-[100] flex justify-center gap-6 pointer-events-none transition-all duration-300 ${isDragging ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
            {/* Cancel Pill */}
            <div 
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    setIsDragging(false); 
                    setFolderDimmed(false);
                }}
                className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full bg-gray-500/50 backdrop-blur-2xl border border-white/20 text-white shadow-lg cursor-pointer hover:bg-gray-500/70 hover:scale-105 transition-all"
            >
                <Ban size={18} />
                <span className="text-sm font-semibold">Cancel</span>
            </div>

            {/* Delete Pill */}
            <div 
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation();
                    const data = e.dataTransfer.getData('application/json');
                    if (data) {
                        const { id } = JSON.parse(data);
                        handleDelete(id);
                    }
                    setIsDragging(false);
                    setFolderDimmed(false);
                }}
                className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/50 backdrop-blur-2xl border border-white/20 text-white shadow-lg cursor-pointer hover:bg-red-500/70 hover:scale-105 transition-all"
            >
                <Trash2 size={18} />
                <span className="text-sm font-semibold">Remove</span>
            </div>
        </div>
        
        {/* Main Dashboard Content */}
        <main className={`relative z-10 w-full h-screen overflow-y-auto p-6 md:p-12 transition-opacity duration-300 ${openFolderId && !folderDimmed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-white" size={48} />
                </div>
            ) : (
                <div className="flex flex-col gap-12 max-w-7xl mx-auto mt-16 pb-20">
                    <section>
                        <div className="flex flex-wrap gap-x-6 gap-y-10 items-start justify-start pl-2">
                            {bookmarks.map((bookmark) => (
                                <BookmarkCard 
                                    key={bookmark.id} 
                                    bookmark={bookmark} 
                                    onDelete={() => {}} // Legacy prop
                                    onClick={handleFolderClick}
                                    onDrop={handleDropBookmark}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onContextMenu={handleContextMenu}
                                    onHover={setHoveredUrl}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </main>

        {/* Folder Modal */}
        {openFolderId && openFolder && (
            <div 
                className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-300 ${folderDimmed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                onClick={(e) => { if (e.target === e.currentTarget) closeFolder(); }}
            >
                <div 
                    ref={folderContentRef}
                    onDragLeave={handleFolderDragLeave}
                    className="bg-gray-800/40 backdrop-blur-3xl border border-white/10 rounded-[38px] p-8 md:p-12 w-full max-w-4xl mx-4 shadow-2xl flex flex-col gap-8 max-h-[80vh] animate-scale-up"
                >
                    <div className="flex items-center gap-4 w-full px-2">
                        <button 
                            onClick={goBackFolder}
                            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <input 
                            className="bg-transparent text-3xl font-semibold text-white outline-none placeholder-white/40 w-full tracking-tight"
                            value={openFolder.title}
                            onChange={(e) => {
                                const newTitle = e.target.value;
                                const updateTitle = (nodes: Bookmark[]): Bookmark[] => nodes.map(n => {
                                    if(n.id === openFolderId) return { ...n, title: newTitle };
                                    if(n.children) return { ...n, children: updateTitle(n.children) };
                                    return n;
                                });
                                setBookmarks(updateTitle(bookmarks));
                            }}
                            onBlur={() => saveBookmarks(bookmarks, password)}
                        />
                         <button 
                            onClick={closeFolder}
                            className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-x-8 gap-y-10 overflow-y-auto min-h-[200px] content-start p-2">
                        {openFolder.children && openFolder.children.length > 0 ? (
                            openFolder.children.map((child) => (
                                <BookmarkCard 
                                    key={child.id} 
                                    bookmark={child}
                                    parentId={openFolder.id} 
                                    onDelete={() => {}}
                                    onClick={child.type === 'folder' ? handleFolderClick : undefined}
                                    onDrop={handleDropBookmark}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onContextMenu={handleContextMenu}
                                    onHover={setHoveredUrl}
                                    isInsideFolder={true}
                                />
                            ))
                        ) : (
                            <div className="w-full h-32 flex items-center justify-center text-white/30 text-lg font-medium">
                                Drag items here
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Custom Context Menu */}
        {contextMenu && (
            <div 
                className="fixed z-[9999] min-w-[180px] bg-white/70 backdrop-blur-2xl border border-white/40 rounded-xl shadow-2xl overflow-hidden animate-scale-up origin-top-left"
                style={{ 
                    top: contextMenu.y, 
                    left: Math.min(contextMenu.x, window.innerWidth - 190) 
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-4 py-2 border-b border-gray-400/10 bg-white/10">
                   <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Options</span>
                </div>

                {contextMenu.item.type === 'folder' && (
                    <div 
                        onClick={() => { handleFolderClick(contextMenu.item); setContextMenu(null); }}
                        className="flex items-center gap-3 px-4 py-3 text-[15px] text-gray-800 hover:bg-white/40 cursor-pointer border-b border-gray-400/10 font-medium transition-colors"
                    >
                        <FolderOpen size={18} className="text-blue-500" />
                        Open Folder
                    </div>
                )}
                
                {contextMenu.item.type !== 'folder' && (
                    <div 
                        onClick={() => { window.open(contextMenu.item.url, '_blank'); setContextMenu(null); }}
                        className="flex items-center gap-3 px-4 py-3 text-[15px] text-gray-800 hover:bg-white/40 cursor-pointer border-b border-gray-400/10 font-medium transition-colors"
                    >
                        <ExternalLink size={18} className="text-blue-500" />
                        Open Link
                    </div>
                )}
                
                <div 
                    onClick={() => {
                        setRenamingItem(contextMenu.item);
                        setContextMenu(null);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-[15px] text-gray-800 hover:bg-white/40 cursor-pointer border-b border-gray-400/10 font-medium transition-colors"
                >
                    <Pencil size={18} className="text-blue-500" />
                    Rename
                </div>

                <div 
                    onClick={() => handleDelete(contextMenu.item.id)}
                    className="flex items-center gap-3 px-4 py-3 text-[15px] text-red-500 hover:bg-red-500/10 cursor-pointer font-medium transition-colors"
                >
                    <Trash2 size={18} />
                    Delete
                </div>
            </div>
        )}
        
        {/* Rename Modal */}
        {renamingItem && (
            <div 
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setRenamingItem(null)}
            >
                <div 
                    className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl w-80 shadow-2xl flex flex-col gap-4 scale-100 animate-scale-up border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 className="text-lg font-semibold text-gray-800 text-center">
                        Rename {renamingItem.type === 'folder' ? 'Folder' : 'Bookmark'}
                    </h3>
                    <input
                        ref={renameInputRef}
                        className="w-full bg-gray-100/50 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        defaultValue={renamingItem.title}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(renamingItem.id, e.currentTarget.value);
                            if (e.key === 'Escape') setRenamingItem(null);
                        }}
                    />
                    <div className="flex gap-2 mt-2">
                        <button 
                            onClick={() => setRenamingItem(null)}
                            className="flex-1 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                if(renameInputRef.current) handleRename(renamingItem.id, renameInputRef.current.value);
                            }}
                            className="flex-1 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 shadow-md transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Settings Menu (Bottom Right) */}
        {showSettings && (
            <div 
                className="fixed bottom-20 right-6 z-[60] bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 w-72 p-4 animate-scale-up origin-bottom-right"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-gray-800 font-semibold mb-3 text-sm flex items-center gap-2">
                    <Settings size={14} className="text-gray-500" />
                    Wallpaper
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {WALLPAPERS.map((wp, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleBgChange(wp.url)}
                            className={`group relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all shadow-sm ${backgroundImage === wp.url ? 'border-blue-500 scale-95 ring-2 ring-blue-500/20' : 'border-transparent hover:scale-105 hover:shadow-md'}`}
                        >
                            <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                    ))}
                    {/* Local Random */}
                    <button 
                        onClick={handleRandomBg}
                        className="col-span-1 mt-2 py-2 bg-gray-200/50 hover:bg-gray-200 rounded-lg text-center text-xs font-medium cursor-pointer transition-colors text-gray-700 flex items-center justify-center gap-1"
                    >
                        <RefreshCw size={12} />
                        Preset Random
                    </button>
                    {/* API Random */}
                    <button 
                        onClick={handleRandomBgApi}
                        className="col-span-1 mt-2 py-2 bg-blue-100/50 hover:bg-blue-100 rounded-lg text-center text-xs font-medium cursor-pointer transition-colors text-blue-700 flex items-center justify-center gap-1"
                    >
                        <ImageIcon size={12} />
                        Web Random
                    </button>
                </div>
            </div>
        )}

        {/* Settings Button (Bottom Right) */}
        <button 
            onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
            className={`fixed bottom-6 right-6 p-3 rounded-full text-white shadow-lg transition-all z-[60] hover:scale-110 active:scale-95 ${showSettings ? 'bg-white/40 text-white rotate-90' : 'bg-white/20 hover:bg-white/30 backdrop-blur-xl'}`}
        >
            <Settings size={24} />
        </button>
        
        {/* Hover URL Preview (Bottom Left) */}
        {hoveredUrl && (
            <div className="fixed bottom-4 left-4 z-50 px-3 py-1.5 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-lg text-white/90 text-xs font-mono shadow-lg pointer-events-none max-w-[50vw] truncate transition-all duration-200">
                {hoveredUrl}
            </div>
        )}
    </div>
  );
};

export default App;