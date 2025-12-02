
import React, { useState, useEffect } from 'react';
import { Plus, X, Bookmark, ChevronLeft, Trash2 } from 'lucide-react';
import { Section, LinkItem } from '../types';
import { loadData, saveData } from '../services/chromeService';

const OverlayPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Handle Keyboard Shortcuts & Initial Data
  useEffect(() => {
    // safe initialization
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      setCurrentTitle(document.title);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Alt + Q
      if (e.altKey && e.code === 'KeyQ') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        if (openFolderId) {
          setOpenFolderId(null); // Go back if in folder
        } else {
          setIsOpen(false); // Close if at root
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openFolderId]);

  // Load data when opening
  useEffect(() => {
    if (isOpen) {
      loadData().then(setSections);
      // Refresh current page info in case it changed (SPA navigation)
      if (typeof window !== 'undefined') {
        setCurrentUrl(window.location.href);
        setCurrentTitle(document.title);
      }
    } else {
      setOpenFolderId(null); // Reset folder view on close
    }
  }, [isOpen]);

  const handleAddPage = async (sectionId: string) => {
    const newItem: LinkItem = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: currentTitle || 'New Page',
      url: currentUrl,
      type: 'link'
    };

    const newSections = sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, items: [...section.items, newItem] };
      }
      return section;
    });

    setSections(newSections);
    await saveData(newSections);
  };

  const handleDeleteItem = async (itemId: string, sectionId?: string) => {
    const newSections = JSON.parse(JSON.stringify(sections)) as Section[];

    // Find and remove the item
    for (const section of newSections) {
      // Check root items
      const rootIndex = section.items.findIndex(i => i.id === itemId);
      if (rootIndex !== -1) {
        section.items.splice(rootIndex, 1);
        setSections(newSections);
        await saveData(newSections);
        return;
      }

      // Check inside folders
      for (const item of section.items) {
        if (item.type === 'folder' && item.items) {
          const folderItemIndex = item.items.findIndex(i => i.id === itemId);
          if (folderItemIndex !== -1) {
            item.items.splice(folderItemIndex, 1);
            setSections(newSections);
            await saveData(newSections);
            return;
          }
        }
      }
    }
  };

  const handleLinkClick = (url: string) => {
    window.location.href = url;
  };

  const handleItemClick = (item: LinkItem) => {
    if (item.type === 'folder') {
      setOpenFolderId(item.id);
    } else if (!item.isSystem) {
      handleLinkClick(item.url);
    }
  };

  // Multi-fallback favicon system
  const getFavicon = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return '';
    }
  };

  const getOpenFolder = () => {
    if (!openFolderId) return null;
    for (const section of sections) {
      const folder = section.items.find(i => i.id === openFolderId && i.type === 'folder');
      if (folder) return folder;
    }
    return null;
  };

  const activeFolder = getOpenFolder();

  return (
    <div
      className={`overlay-container ${isOpen ? 'open' : ''}`}
      style={{ zIndex: 2147483647 }} // Max Z-Index
      onClick={() => setIsOpen(false)} // Click backdrop to close
    >
      <div
        className={`panel ${isOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside panel
        style={{ padding: '0', display: 'flex', flexDirection: 'column' }}
      >

        {/* Minimal Header */}
        <div className="flex w-full items-center justify-between p-4 z-10 relative">
          {activeFolder ? (
            <button
              onClick={() => setOpenFolderId(null)}
              className="hover-bg-black-5"
              style={{
                padding: '8px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', gap: '4px', paddingRight: '12px'
              }}
            >
              <ChevronLeft size={20} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-600">Back</span>
            </button>
          ) : <div />}

          <button
            onClick={() => setIsOpen(false)}
            className="hover-bg-black-5"
            style={{
              padding: '8px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
            }}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="scroll-area" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 32px 32px 32px',
          marginTop: '-10px',
          // Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent'
        }}>

          {activeFolder ? (
            // Folder View
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex-row items-center justify-center" style={{ marginBottom: '32px' }}>
                <h2 className="text-lg font-bold text-gray-800 tracking-tight">{activeFolder.name}</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '20px' }}>
                {activeFolder.items && activeFolder.items.map(item => (
                  <div
                    key={item.id}
                    className="flex-col items-center gap-2 group"
                    style={{ cursor: 'pointer', textAlign: 'center', position: 'relative' }}
                    title={item.name}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.8)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.5)', transition: 'transform 0.2s', position: 'relative'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onClick={() => handleItemClick(item)}
                    >
                      <img src={getFavicon(item.url)} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'contain' }} />

                      {/* Delete Button */}
                      {!item.isSystem && hoveredItemId === item.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <Trash2 size={12} color="white" />
                        </button>
                      )}
                    </div>
                    <span className="truncate" style={{ display: 'block', textAlign: 'center', width: '100%', fontSize: '12px', fontWeight: 500, color: '#374151', padding: '0 4px' }}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Sections View
            sections.map(section => (
              <div key={section.id} style={{ marginBottom: '40px' }}>
                <div className="flex-row items-center justify-between" style={{ marginBottom: '16px' }}>
                  <h3 className="text-sm font-bold text-gray-800 tracking-tight">{section.title}</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '20px' }}>
                  {/* Existing Items */}
                  {section.items.map(item => (
                    <div
                      key={item.id}
                      className="flex-col items-center gap-2 group"
                      style={{ cursor: 'pointer', textAlign: 'center', position: 'relative' }}
                      title={item.name}
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                    >
                      {item.type === 'folder' ? (
                        <div
                          style={{
                            width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(255,255,255,0.6)', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', padding: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative'
                          }}
                          onClick={() => handleItemClick(item)}
                        >
                          {item.items?.slice(0, 4).map((sub, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '6px', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', overflow: 'hidden' }}>
                              <img src={getFavicon(sub.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }} />
                            </div>
                          ))}

                          {/* Delete Button for Folder */}
                          {!item.isSystem && hoveredItemId === item.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#ef4444',
                                border: '2px solid white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'transform 0.2s',
                                zIndex: 10
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <Trash2 size={12} color="white" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.8)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.5)', transition: 'transform 0.2s', position: 'relative'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          onClick={() => handleItemClick(item)}
                        >
                          {item.isSystem ? <Bookmark size={28} className="text-gray-400" /> : (
                            <img src={getFavicon(item.url)} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'contain' }} />
                          )}

                          {/* Delete Button for Link */}
                          {!item.isSystem && hoveredItemId === item.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id);
                              }}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#ef4444',
                                border: '2px solid white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'transform 0.2s',
                                zIndex: 10
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <Trash2 size={12} color="white" />
                            </button>
                          )}
                        </div>
                      )}
                      <span className="truncate" style={{ display: 'block', textAlign: 'center', width: '100%', fontSize: '12px', fontWeight: 500, color: '#374151', padding: '0 4px' }}>{item.name}</span>
                    </div>
                  ))}

                  {/* Add Page Tile */}
                  {!section.isLocked && (
                    <div
                      className="flex-col items-center gap-2 group"
                      style={{ cursor: 'pointer', textAlign: 'center' }}
                      onClick={() => handleAddPage(section.id)}
                    >
                      <div style={{
                        width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.9)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.5)', transition: 'transform 0.2s',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Plus size={32} className="text-gray-400" strokeWidth={2} />
                      </div>
                      <span className="truncate" style={{ display: 'block', textAlign: 'center', width: '100%', fontSize: '12px', fontWeight: 500, color: '#374151', padding: '0 4px' }}>Add Page</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default OverlayPanel;
