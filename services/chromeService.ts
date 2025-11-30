import { Section, AppSettings } from '../types';

declare const chrome: any;

const STORAGE_KEY = 'safari_new_tab_data';
const SETTINGS_KEY = 'safari_new_tab_settings';

export const WALLPAPERS = [
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&q=80&w=3870&h=2176', // Mountain
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=3870&h=2176', // Ocean
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=3870&h=2176', // Forest
  'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&q=80&w=3870&h=2176', // Desert
  'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&q=80&w=3870&h=2176', // Aurora
  'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=3870&h=2176', // Minimal
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=3870&h=2176', // Foggy Forest
  'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?auto=format&fit=crop&q=80&w=3870&h=2176', // Hills
  'https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&q=80&w=3870&h=2176', // Peaks
];

export const DEFAULT_DATA: Section[] = [
  {
    id: 'favorites',
    title: 'Favorites',
    items: [
      { id: 'l_1', name: 'Google', url: 'https://google.com', type: 'link' },
      { id: 'l_2', name: 'YouTube', url: 'https://youtube.com', type: 'link' },
      { id: 'l_3', name: 'GitHub', url: 'https://github.com', type: 'link' },
      { id: 'l_4', name: 'Twitter', url: 'https://twitter.com', type: 'link' },
    ]
  },
  {
    id: 'system_tools',
    title: 'System Tools',
    isLocked: true,
    items: [
      {
        id: 'sys_1',
        name: 'Clear Data',
        url: '#',
        type: 'link',
        isSystem: true,
        action: 'CLEAR_DATA'
      }
    ]
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  backgroundMode: 'random',
  currentBackgroundUrl: WALLPAPERS[0]
};

// Helper to get Chrome API safely
const getChromeApi = () => {
  if (typeof chrome !== 'undefined') return chrome;
  if (typeof window !== 'undefined' && (window as any).chrome) return (window as any).chrome;
  return null;
};

// --- DATA ---

export const loadData = async (): Promise<Section[]> => {
  console.log("[SafariNewTab] loadData called");
  return new Promise((resolve) => {
    const chromeApi = getChromeApi();
    console.log("[SafariNewTab] chromeApi found:", !!chromeApi);

    if (chromeApi && chromeApi.storage && chromeApi.storage.local) {
      console.log("[SafariNewTab] Attempting to read from chrome.storage.local");
      chromeApi.storage.local.get([STORAGE_KEY], (result: any) => {
        if (chromeApi.runtime && chromeApi.runtime.lastError) {
          console.error("[SafariNewTab] Storage error:", chromeApi.runtime.lastError);
          resolve(DEFAULT_DATA);
          return;
        }
        console.log("[SafariNewTab] Storage result raw:", result);

        if (result[STORAGE_KEY]) {
          console.log("[SafariNewTab] Found data in storage");
          const data = result[STORAGE_KEY].map((section: Section) => ({
            ...section,
            items: section.items.map(item => ({
              ...item,
              type: item.type || 'link',
              items: item.items || []
            }))
          }));
          resolve(data);
        } else {
          console.log("[SafariNewTab] No data in storage, using DEFAULT_DATA");
          resolve(DEFAULT_DATA);
        }
      });
    } else {
      console.log("[SafariNewTab] chrome.storage not available. Falling back to localStorage");
      // Fallback to localStorage (only for dev/preview, NOT for content script)
      // In content script, localStorage is the PAGE'S storage.
      // We should check if we are in an extension context.
      // But for now, let's keep the fallback but log a warning if needed.
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        resolve(JSON.parse(localData));
      } else {
        resolve(DEFAULT_DATA);
      }
    }
  });
};

export const saveData = async (data: Section[]): Promise<void> => {
  return new Promise((resolve) => {
    const chromeApi = getChromeApi();
    if (chromeApi && chromeApi.storage && chromeApi.storage.local) {
      chromeApi.storage.local.set({ [STORAGE_KEY]: data }, () => {
        if (chromeApi.runtime && chromeApi.runtime.lastError) {
          console.error("Error saving data:", chromeApi.runtime.lastError);
        }
        resolve();
      });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      resolve();
    }
  });
};

// --- SETTINGS ---

export const loadSettings = async (): Promise<AppSettings> => {
  return new Promise((resolve) => {
    const chromeApi = getChromeApi();
    if (chromeApi && chromeApi.storage && chromeApi.storage.local) {
      chromeApi.storage.local.get([SETTINGS_KEY], (result: any) => {
        if (chromeApi.runtime && chromeApi.runtime.lastError) {
          console.error("Error loading settings:", chromeApi.runtime.lastError);
          resolve(DEFAULT_SETTINGS);
          return;
        }
        if (result[SETTINGS_KEY]) {
          resolve(result[SETTINGS_KEY]);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      });
    } else {
      const localSettings = localStorage.getItem(SETTINGS_KEY);
      if (localSettings) {
        resolve(JSON.parse(localSettings));
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    }
  });
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  return new Promise((resolve) => {
    const chromeApi = getChromeApi();
    if (chromeApi && chromeApi.storage && chromeApi.storage.local) {
      chromeApi.storage.local.set({ [SETTINGS_KEY]: settings }, () => {
        if (chromeApi.runtime && chromeApi.runtime.lastError) {
          console.error("Error saving settings:", chromeApi.runtime.lastError);
        }
        resolve();
      });
    } else {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      resolve();
    }
  });
};

export const getRandomWallpaper = () => {
  const randomIndex = Math.floor(Math.random() * WALLPAPERS.length);
  return WALLPAPERS[randomIndex];
};

// --- UTILS ---

export const clearBrowsingData = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const chromeApi = getChromeApi();
    if (chromeApi && chromeApi.browsingData) {
      const millisecondsPerWeek = 1000 * 60 * 60; // 1 Hour
      const oneHourAgo = (new Date()).getTime() - millisecondsPerWeek;

      chromeApi.browsingData.remove(
        { since: oneHourAgo },
        {
          appcache: true, cache: true, cookies: true, downloads: true,
          fileSystems: true, formData: true, history: true, indexedDB: true,
          localStorage: true, passwords: true, serviceWorkers: true, webSQL: true
        },
        () => {
          if (chromeApi.runtime && chromeApi.runtime.lastError) reject(chromeApi.runtime.lastError);
          else resolve();
        }
      );
    } else {
      setTimeout(resolve, 500);
    }
  });
};

export const getCurrentTab = async (): Promise<{ title: string; url: string } | null> => {
  return new Promise((resolve) => {
    const chromeApi = getChromeApi();
    if (chromeApi && chromeApi.tabs && chromeApi.tabs.query) {
      chromeApi.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs && tabs.length > 0) {
          resolve({ title: tabs[0].title, url: tabs[0].url });
        } else {
          resolve(null);
        }
      });
    } else {
      resolve({ title: document.title, url: window.location.href });
    }
  });
};