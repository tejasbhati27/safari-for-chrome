import React, { useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { Section, LinkItem, ContextMenuState, ModalState, ToastState, AppSettings } from './types';
import { loadData, saveData, clearBrowsingData, getCurrentTab, loadSettings, saveSettings, getRandomWallpaper, DEFAULT_SETTINGS } from './services/chromeService';
import IconLink from './components/IconLink';
import ContextMenu from './components/ContextMenu';
import Modal from './components/Modal';
import Toast from './components/Toast';
import FolderView from './components/FolderView';
import AddPageTile from './components/AddPageTile';
import SettingsMenu from './components/SettingsMenu';
import CustomizeModal from './components/CustomizeModal';
import OverlayPanel from './components/OverlayPanel';

const App: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  
  // Track dragging state for Sections
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);

  // UI State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    sectionId: '',
    itemId: '',
    isFolder: false
  });
  
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: null
  });

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: ''
  });

  // Load Data on Mount
  useEffect(() => {
    const init = async () => {
      const [loadedSections, loadedSettings] = await Promise.all([loadData(), loadSettings()]);
      
      let finalSettings = { ...loadedSettings };
      
      // Handle Live Background (Random Mode)
      if (loadedSettings.backgroundMode === 'random') {
         const newWallpaper = getRandomWallpaper();
         // We update the session state, but we don't necessarily save this to storage 
         // unless we want to persist "the last seen image". 
         // For a true "New Tab" feel, it usually changes per session or refresh.
         // Let's just update the local state to show a fresh one.
         finalSettings.currentBackgroundUrl = newWallpaper;
      }

      setSections(loadedSections);
      setSettings(finalSettings);
      setLoading(false);
    };
    init();
  }, []);

  // Handle Escape key for canceling edits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingSectionId) {
          setEditingSectionId(null); // Cancel editing on escape
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingSectionId]);

  // --- Helpers ---

  // Helper to find and remove an item from a cloned sections array
  const findAndRemoveItem = (currentSections: Section[], itemId: string) => {
    let item: LinkItem | undefined;
    let parentList: LinkItem[] | undefined;
    let parentSection: Section | undefined;
    let parentFolder: LinkItem | undefined;
    let index = -1;

    for (const section of currentSections) {
      // Check Root
      let idx = section.items.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        item = section.items[idx];
        parentList = section.items;
        parentSection = section;
        index = idx;
        break;
      }
      // Check Nested in Folders
      for (const fItem of section.items) {
        if (fItem.type === 'folder' && fItem.items) {
          idx = fItem.items.findIndex(i => i.id === itemId);
          if (idx !== -1) {
             item = fItem.items[idx];
             parentList = fItem.items;
             parentFolder = fItem;
             parentSection = section;
             index = idx;
             break;
          }
        }
      }
      if (item) break;
    }

    if (item && parentList) {
      parentList.splice(index, 1);
      
      // Auto-delete empty folder if we removed from one
      if (parentFolder && parentFolder.items && parentFolder.items.length === 0 && parentSection) {
         const fIdx = parentSection.items.findIndex(i => i.id === parentFolder?.id);
         if (fIdx !== -1) {
           parentSection.items.splice(fIdx, 1);
           // If the currently open folder was deleted, close the view
           if (openFolderId === parentFolder.id) {
             setOpenFolderId(null);
           }
         }
      }
    }

    return { item, parentSection, parentFolder };
  };

  // --- Handlers ---

  const handleSaveSectionTitle = async (sectionId: string) => {
    const newSections = sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, title: editingSectionTitle };
      }
      return section;
    });
    setSections(newSections);
    await saveData(newSections);
    setEditingSectionId(null);
  };

  const handleSectionTitleClick = (section: Section) => {
    if (!section.isLocked) {
      setEditingSectionId(section.id);
      setEditingSectionTitle(section.title);
    }
  };

  const handleSectionTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingSectionTitle(e.target.value);
  };

  const handleSectionTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, sectionId: string) => {
    if (e.key === 'Enter') {
      handleSaveSectionTitle(sectionId);
    } else if (e.key === 'Escape') {
      setEditingSectionId(null);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
    setModal({ ...modal, isOpen: false });
    setToast({ visible: true, message: 'Settings Saved' });
  };

  const handleItemClick = async (item: LinkItem) => {
    if (item.type === 'folder') {
      setOpenFolderId(item.id);
      return;
    }

    if (item.isSystem && item.action === 'CLEAR_DATA') {
      try {
        await clearBrowsingData();
        setToast({ visible: true, message: 'Browsing Data Cleared' });
      } catch (error) {
        console.error("Failed to clear data", error);
      }
    } else if (item.url) {
       window.location.href = item.url;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, sectionId: string, itemId: string) => {
    const section = sections.find(s => s.id === sectionId);
    let isFolder = false;
    if (section) {
      const item = section.items.find(i => i.id === itemId);
      if (item && item.type === 'folder') isFolder = true;
    }

    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      sectionId,
      itemId,
      isFolder
    });
  };

  const handleDeleteItem = async () => {
    if (!contextMenu.visible) return;
    const newSections = JSON.parse(JSON.stringify(sections)) as Section[];
    
    // Use helper to remove
    findAndRemoveItem(newSections, contextMenu.itemId);

    setSections(newSections);
    await saveData(newSections);
    setToast({ visible: true, message: 'Deleted' });
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleRenameFolder = () => {
    setModal({
      isOpen: true,
      type: 'RENAME_FOLDER',
      targetSectionId: contextMenu.sectionId,
      targetFolderId: contextMenu.itemId
    });
    setContextMenu({ ...contextMenu, visible: false });
  };

  const submitRenameFolder = async (data: { name: string }) => {
    const newSections = JSON.parse(JSON.stringify(sections)) as Section[];
    for (const section of newSections) {
      if (section.id === modal.targetSectionId) {
        const folder = section.items.find(i => i.id === modal.targetFolderId);
        if (folder) {
          folder.name = data.name;
          setSections(newSections);
          await saveData(newSections);
          setModal({ isOpen: false, type: null });
          return;
        }
      }
    }
  };

  // --- Item Drag & Drop Handlers ---

  const handleDropItem = async (
    sourceItemId: string, 
    sourceSectionId: string, 
    targetItemId: string, 
    targetSectionId: string
  ) => {
    const newSections = JSON.parse(JSON.stringify(sections)) as Section[];
    
    // 1. Find Source and its context
    let sourceItem: LinkItem | undefined;
    let sourceParentList: LinkItem[] | undefined;
    let sourceIndex = -1;
    let sourceFolder: LinkItem | undefined;
    let sourceParentSection: Section | undefined;

    const findSource = () => {
      for (const section of newSections) {
        // Root
        let idx = section.items.findIndex(i => i.id === sourceItemId);
        if (idx !== -1) return { item: section.items[idx], list: section.items, index: idx, parentSection: section, parentFolder: undefined };
        // Nested
        for (const item of section.items) {
          if (item.type === 'folder' && item.items) {
            idx = item.items.findIndex(s => s.id === sourceItemId);
            if (idx !== -1) return { item: item.items[idx], list: item.items, index: idx, parentSection: section, parentFolder: item };
          }
        }
      }
      return null;
    };

    const sourceData = findSource();
    if (!sourceData) return;
    
    sourceItem = sourceData.item;
    sourceParentList = sourceData.list;
    sourceIndex = sourceData.index;
    sourceFolder = sourceData.parentFolder;
    sourceParentSection = sourceData.parentSection;

    // 2. Find Target context
    let targetSection = newSections.find(s => s.id === targetSectionId);
    if (!targetSection) return;

    let targetItem: LinkItem | undefined;
    let targetParentList: LinkItem[] | undefined;
    let targetIndex = -1;

    // Check Root Target
    let tIdx = targetSection.items.findIndex(i => i.id === targetItemId);
    if (tIdx !== -1) {
      targetItem = targetSection.items[tIdx];
      targetParentList = targetSection.items;
      targetIndex = tIdx;
    } else {
      // Check Nested Target
      for (const item of targetSection.items) {
        if (item.type === 'folder' && item.items) {
          const subIdx = item.items.findIndex(s => s.id === targetItemId);
          if (subIdx !== -1) {
            targetItem = item.items[subIdx];
            targetParentList = item.items;
            targetIndex = subIdx;
            break;
          }
        }
      }
    }

    if (!targetItem || !targetParentList) return;

    const isTargetRoot = targetParentList === targetSection.items;

    // BRANCH A: Same List Reordering
    if (sourceParentList === targetParentList) {
      // Special Case: Creating a folder by dropping Link on Link (Root only)
      if (isTargetRoot && sourceItem.type === 'link' && targetItem.type === 'link') {
         const newFolder: LinkItem = {
           id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
           name: 'New Folder',
           type: 'folder',
           url: '',
           items: [targetItem, sourceItem]
         };
         
         // Remove source then replace target with folder
         if (sourceIndex < targetIndex) {
            sourceParentList.splice(sourceIndex, 1);
            sourceParentList[targetIndex - 1] = newFolder;
         } else {
            sourceParentList.splice(sourceIndex, 1);
            sourceParentList[targetIndex] = newFolder;
         }
         
         setToast({ visible: true, message: 'Folder Created' });
         setSections(newSections);
         await saveData(newSections);
         return;
      }

      // Special Case: Adding Link to Folder (Root)
      if (isTargetRoot && sourceItem.type === 'link' && targetItem.type === 'folder') {
          if (!targetItem.items) targetItem.items = [];
          targetItem.items.push(sourceItem);
          sourceParentList.splice(sourceIndex, 1);
          setToast({ visible: true, message: 'Added to Folder' });
          setSections(newSections);
          await saveData(newSections);
          return;
      }

      // Default: Reorder
      sourceParentList.splice(sourceIndex, 1);
      const newTargetIndex = sourceParentList.findIndex(i => i.id === targetItemId);
      sourceParentList.splice(newTargetIndex, 0, sourceItem);
      
      setSections(newSections);
      await saveData(newSections);
      return;
    }

    // BRANCH B: Moving Between Lists
    // Remove Source first
    sourceParentList.splice(sourceIndex, 1);

    // Clean up empty source folder if needed
    if (sourceFolder && sourceFolder.items && sourceFolder.items.length === 0) {
      const fIdx = sourceParentSection.items.findIndex(i => i.id === sourceFolder?.id);
      if (fIdx !== -1) {
        sourceParentSection.items.splice(fIdx, 1);
        if (openFolderId === sourceFolder.id) setOpenFolderId(null);
      }
    }

    // Insert into Target
    if (targetItem.type === 'folder') {
       if (!targetItem.items) targetItem.items = [];
       targetItem.items.push(sourceItem);
       setToast({ visible: true, message: 'Added to Folder' });
    } else {
       const targetIsInsideFolder = !isTargetRoot;
       if (targetIsInsideFolder) {
         // Insert before target
         const insertIdx = targetParentList.findIndex(i => i.id === targetItemId);
         targetParentList.splice(insertIdx, 0, sourceItem);
       } else {
         // Create New Folder
         const newFolder: LinkItem = {
           id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
           name: 'New Folder',
           type: 'folder',
           url: '',
           items: [targetItem, sourceItem]
         };
         const replaceIdx = targetSection.items.findIndex(i => i.id === targetItem!.id);
         targetSection.items[replaceIdx] = newFolder;
         setToast({ visible: true, message: 'Folder Created' });
       }
    }

    setSections(newSections);
    await saveData(newSections);
  };

  // Dropping an ITEM on the Section Background (Move to Section)
  const handleSectionDrop = async (e: React.DragEvent, targetSectionId: string) => {
    // Only handle Item drops here, not Section drops
    if (e.dataTransfer.types.includes('section_drag')) return;

    e.preventDefault();
    e.stopPropagation(); // Prevent global drop
    
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    let parsed;
    try { parsed = JSON.parse(data); } catch(e) { return; }
    
    // Safety check: ensure it's an item
    if (!parsed.itemId) return;

    const { itemId } = parsed;
    
    const newSections = JSON.parse(JSON.stringify(sections)) as Section[];
    
    // Use helper to extract source
    const { item } = findAndRemoveItem(newSections, itemId);
    
    if (item) {
        // Find Target Section
        const targetSection = newSections.find(s => s.id === targetSectionId);
        if (targetSection) {
            targetSection.items.push(item);
            setSections(newSections);
            await saveData(newSections);
            setToast({ visible: true, message: 'Moved to Section' });
        }
    }
  };

  // Dropping on Global Wallpaper (Move to Root of its own section or Move Out of Folder)
  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const parsed = JSON.parse(data);
      if (!parsed.itemId || !parsed.sectionId) return;

      const { itemId, sectionId: sourceSectionId } = parsed;
      const newSections = JSON.parse(JSON.stringify(sections)) as Section[];
      
      const { item } = findAndRemoveItem(newSections, itemId);

      if (item) {
        // Add back to the root of its original section (Unfolder or Move to Home)
        const targetSection = newSections.find(s => s.id === sourceSectionId);
        if (targetSection) {
            targetSection.items.push(item);
            setSections(newSections);
            await saveData(newSections);
            setToast({ visible: true, message: 'Moved to Home' });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Section Drag & Drop Handlers ---

  const handleSectionDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSectionIndex(index);
    e.dataTransfer.setData('section_drag', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    // Only accept Section Drags
    if (!e.dataTransfer.types.includes('section_drag')) return;
    
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === index) return;
  };

  const handleSectionDropReorder = async (e: React.DragEvent, dropIndex: number) => {
    if (!e.dataTransfer.types.includes('section_drag')) return;
    
    e.preventDefault();
    const dragIndexStr = e.dataTransfer.getData('section_drag');
    const dragIndex = parseInt(dragIndexStr, 10);

    if (isNaN(dragIndex) || dragIndex === dropIndex) return;

    const newSections = [...sections];
    const [movedSection] = newSections.splice(dragIndex, 1);
    newSections.splice(dropIndex, 0, movedSection);

    setSections(newSections);
    setDraggedSectionIndex(null);
    await saveData(newSections);
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionIndex(null);
  };


  // --- Add/Edit Handlers ---

  const handleAddSection = async (data: { title: string }) => {
    const newSection: Section = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: data.title,
      items: []
    };
    const newSections = [...sections, newSection];
    setSections(newSections);
    await saveData(newSections);
    setModal({ isOpen: false, type: null });
  };

  const handleAddLink = async (data: { name: string; url: string }) => {
    if (!modal.targetSectionId) return;
    let finalUrl = data.url;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
    
    const newItem: LinkItem = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: data.name,
      url: finalUrl,
      type: 'link'
    };

    const newSections = sections.map(section => {
      if (section.id === modal.targetSectionId) {
        return { ...section, items: [...section.items, newItem] };
      }
      return section;
    });

    setSections(newSections);
    await saveData(newSections);
    setModal({ isOpen: false, type: null });
  };

  const handleImportBookmarksConfirmed = async () => {
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      setToast({ visible: true, message: 'Chrome Bookmarks API not available.', type: 'error' });
      setModal({ isOpen: false, type: null });
      return;
    }

    const importedLinks: LinkItem[] = [];

    const processNode = (node: chrome.bookmarks.BookmarkTreeNode) => {
      if (node.url) {
        importedLinks.push({
          id: `link_${node.id}`,
          name: node.title,
          url: node.url,
          type: 'link'
        });
      }
      if (node.children) {
        node.children.forEach(processNode);
      }
    };

    try {
      const tree = await chrome.bookmarks.getTree();
      tree.forEach(processNode);

      if (importedLinks.length > 0) {
        const newSection: Section = {
          id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          title: 'Imported Bookmarks',
          items: importedLinks
        };
        const updatedSections = [...sections, newSection];
        setSections(updatedSections);
        await saveData(updatedSections);
        setToast({ visible: true, message: `Successfully imported ${importedLinks.length} bookmarks.`, type: 'success' });
      } else {
        setToast({ visible: true, message: 'No bookmarks found to import.', type: 'info' });
      }
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      setToast({ visible: true, message: 'Failed to import bookmarks.', type: 'error' });
    }

    setModal({ isOpen: false, type: null });
  };

  const handleAddPage = async (sectionId: string) => {
    setModal({ isOpen: true, type: 'ADD_LINK', targetSectionId: sectionId });
  };

  const getOpenFolder = () => {
    if (!openFolderId) return null;
    for (const section of sections) {
      const folder = section.items.find(i => i.id === openFolderId && i.type === 'folder');
      if (folder) return { folder, sectionId: section.id };
    }
    return null;
  };
  
  const openFolderData = getOpenFolder();

  if (loading) return <div className="min-h-screen bg-gray-900" />;

  return (
    <div 
      className="min-h-screen w-full relative overflow-x-hidden selection:bg-blue-500/30"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleGlobalDrop}
    >
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed transform scale-105 pointer-events-none transition-all duration-700 ease-in-out"
        style={{ 
          backgroundImage: `url('${settings.currentBackgroundUrl}')`,
        }}
      />
      <div className="fixed inset-0 z-0 bg-black/20 pointer-events-none" />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-6xl flex flex-col gap-12 pb-32">
        {sections.map((section, index) => (
          <div 
             key={section.id} 
             className={`
               animate-in fade-in slide-in-from-bottom-8 duration-500 group rounded-3xl p-2 -m-2 transition-all ease-out
               ${draggedSectionIndex === index ? 'opacity-40 scale-95 ring-2 ring-white/30' : 'opacity-100 scale-100'}
             `}
             style={{ animationDelay: `${index * 100}ms` }}
             draggable={true}
             onDragStart={(e) => handleSectionDragStart(e, index)}
             onDragOver={(e) => handleSectionDragOver(e, index)}
             onDrop={(e) => handleSectionDropReorder(e, index)}
             onDragEnd={handleSectionDragEnd}
          >
            <div className="flex items-center justify-between mb-6 px-4 cursor-grab active:cursor-grabbing">
              {editingSectionId === section.id ? (
                <input
                  type="text"
                  value={editingSectionTitle}
                  onChange={handleSectionTitleChange}
                  onBlur={() => handleSaveSectionTitle(section.id)}
                  onKeyDown={(e) => handleSectionTitleKeyDown(e, section.id)}
                  className="bg-white/20 text-white text-2xl font-bold tracking-tight drop-shadow-md rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
              ) : (
                <h2
                  className={`text-2xl font-bold text-white tracking-tight drop-shadow-md opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-2 ${!section.isLocked ? 'cursor-pointer' : ''}`}
                  onClick={() => handleSectionTitleClick(section)}
                >
                  <GripVertical className="opacity-0 group-hover:opacity-60 transition-opacity w-5 h-5" />
                  {section.title}
                </h2>
              )}
            </div>
            {/* Section Grid Container acting as Drop Zone for ITEMS */}
            <div 
                className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-6 gap-y-10 min-h-[100px] rounded-xl transition-colors duration-300"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleSectionDrop(e, section.id)}
            >
              {section.items.map((item) => (
                <IconLink 
                  key={item.id} 
                  item={item} 
                  sectionId={section.id}
                  onClick={handleItemClick}
                  onContextMenu={(e, itemId) => handleContextMenu(e, section.id, itemId)}
                  onDrop={handleDropItem}
                />
              ))}
              
              {!section.isLocked && (
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto transform translate-y-2 group-hover:translate-y-0">
                  <AddPageTile onClick={() => handleAddPage(section.id)} />
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="fixed bottom-10 right-10 z-20 animate-in zoom-in-95 duration-700 delay-300">
          <SettingsMenu 
            onAddSection={() => setModal({ isOpen: true, type: 'ADD_SECTION' })}
            onCustomize={() => setModal({ isOpen: true, type: 'CUSTOMIZE' })}
            onImportBookmarks={() => setModal({ isOpen: true, type: 'IMPORT_BOOKMARKS' })}
          />
        </div>
      </main>

      {contextMenu.visible && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          isFolder={contextMenu.isFolder}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
          onDelete={handleDeleteItem}
          onRename={handleRenameFolder}
        />
      )}

      {openFolderData && (
        <FolderView 
          folder={openFolderData.folder}
          sectionId={openFolderData.sectionId}
          onClose={() => setOpenFolderId(null)}
          onItemClick={handleItemClick}
          onContextMenu={(e, itemId) => handleContextMenu(e, openFolderData.sectionId, itemId)}
          onDrop={handleDropItem}
        />
      )}

      {modal.isOpen && modal.type === 'ADD_SECTION' && (
        <Modal
          title="New Section"
          onClose={() => setModal({ ...modal, isOpen: false })}
          onSubmit={handleAddSection}
          fields={[{ name: 'title', label: 'Section Name', placeholder: 'e.g., Reading List' }]}
        />
      )}

      {modal.isOpen && modal.type === 'ADD_LINK' && (
        <Modal
          title="New Shortcut"
          onClose={() => setModal({ ...modal, isOpen: false })}
          onSubmit={handleAddLink}
          fields={[
            { name: 'name', label: 'Name', placeholder: 'Website Name' },
            { name: 'url', label: 'URL', placeholder: 'https://example.com' }
          ]}
        />
      )}

      {modal.isOpen && modal.type === 'RENAME_FOLDER' && (
        <Modal
          title="Rename Folder"
          onClose={() => setModal({ ...modal, isOpen: false })}
          onSubmit={submitRenameFolder}
          fields={[{ name: 'name', label: 'Folder Name', placeholder: 'New Name' }]}
        />
      )}

      {modal.isOpen && modal.type === 'CUSTOMIZE' && (
        <CustomizeModal 
          settings={settings}
          onClose={() => setModal({ ...modal, isOpen: false })}
          onSave={handleSaveSettings}
        />
      )}

      {modal.isOpen && modal.type === 'IMPORT_BOOKMARKS' && (
        <Modal
          title="Import Bookmarks"
          onClose={() => setModal({ ...modal, isOpen: false })}
          onSubmit={handleImportBookmarksConfirmed}
          fields={[]}
          confirmText="Import"
        >
          <p>This will import your Chrome bookmarks into a new section in this extension.</p>
          <p>Existing bookmarks in your extension will not be affected.</p>
        </Modal>
      )}

      <Toast 
        message={toast.message} 
        isVisible={toast.visible} 
        onHide={() => setToast({ ...toast, visible: false })} 
      />

      {/* Overlay Panel (Mounted here for Preview/Dev purposes only) */}
      <OverlayPanel />
    </div>
  );
};

export default App;