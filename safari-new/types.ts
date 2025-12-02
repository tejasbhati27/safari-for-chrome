export type BookmarkType = 'link' | 'folder';

export interface Bookmark {
  id: string;
  title: string;
  url?: string; // Optional for folders
  favicon?: string;
  date: string; // ISO string
  type?: BookmarkType;
  children?: Bookmark[]; // For folders
}

export interface ApiError {
  error: string;
}

export const STORAGE_KEYS = {
  PASSWORD: 'dashboard_password',
};