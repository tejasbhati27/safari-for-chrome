export interface LinkItem {
  id: string;
  name: string;
  url: string;
  type: 'link' | 'folder';
  items?: LinkItem[]; // For folders
  isSystem?: boolean; // Determines if it triggers a system action like Clear Data
  action?: 'CLEAR_DATA';
}

export interface Section {
  id: string;
  title: string;
  items: LinkItem[];
  isLocked?: boolean; // If true, section cannot be deleted (e.g., System Tools)
}

export interface AppSettings {
  backgroundMode: 'random' | 'static';
  currentBackgroundUrl: string;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  sectionId: string;
  itemId: string;
  isFolder?: boolean;
}

export interface ModalState {
  isOpen: boolean;
  type: 'ADD_SECTION' | 'ADD_LINK' | 'RENAME_FOLDER' | 'CUSTOMIZE' | null;
  targetSectionId?: string;
  targetFolderId?: string;
}

export interface ToastState {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
}