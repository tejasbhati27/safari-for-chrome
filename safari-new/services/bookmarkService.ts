import { Bookmark } from '../types';

// NOTE: In a real Next.js app, this points to your API route.
const API_URL = '/api/bookmarks';

const MOCK_BOOKMARKS: Bookmark[] = [
  // --- Socials Folder ---
  {
    id: 'folder-socials',
    title: 'Socials',
    date: new Date().toISOString(),
    type: 'folder',
    children: [
      { id: 'f1', title: 'X (Twitter)', url: 'https://twitter.com', favicon: 'https://abs.twimg.com/favicons/twitter.2.ico', date: '' },
      { id: 'f2', title: 'Instagram', url: 'https://instagram.com', favicon: 'https://static.cdninstagram.com/rsrc.php/v3/yG/r/De-Dwpd5CHc.png', date: '' },
      { id: 'f3', title: 'LinkedIn', url: 'https://linkedin.com', favicon: 'https://static-exp1.licdn.com/sc/h/al2o9zrycg59ojnbbm58v1i60', date: '' },
      { id: 'f4', title: 'YouTube', url: 'https://youtube.com', favicon: 'https://www.youtube.com/s/desktop/189d2a65/img/favicon_144x144.png', date: '' },
      { id: 'f5', title: 'Twitch', url: 'https://twitch.tv', favicon: 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png', date: '' }
    ]
  },
   // --- Dev Tools Folder ---
   {
    id: 'folder-dev',
    title: 'Development',
    date: new Date().toISOString(),
    type: 'folder',
    children: [
      { id: 'd1', title: 'GitHub', url: 'https://github.com', favicon: 'https://github.githubassets.com/favicons/favicon.svg', date: '' },
      { id: 'd2', title: 'Vercel', url: 'https://vercel.com', favicon: 'https://assets.vercel.com/image/upload/q_auto/front/favicon/vercel/180x180.png', date: '' },
      { id: 'd3', title: 'StackOverflow', url: 'https://stackoverflow.com', favicon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico', date: '' }
    ]
  },
  // --- Standard Links ---
  {
    id: '1',
    title: 'Netflix',
    url: 'https://netflix.com',
    favicon: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
    date: new Date().toISOString(),
    type: 'link'
  },
  {
    id: '2',
    title: 'Figma',
    url: 'https://figma.com',
    favicon: 'https://static.figma.com/app/icon/1/icon-192.png',
    date: new Date().toISOString(),
    type: 'link'
  },
  {
    id: '3',
    title: 'Gmail',
    url: 'https://mail.google.com',
    favicon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    date: new Date().toISOString(),
    type: 'link'
  },
  {
    id: '4',
    title: 'Notion',
    url: 'https://notion.so',
    favicon: 'https://www.notion.so/images/favicon.ico',
    date: new Date().toISOString(),
    type: 'link'
  }
];

export const fetchBookmarks = async (password: string): Promise<Bookmark[]> => {
  try {
    const res = await fetch(API_URL, {
      headers: { 'x-site-password': password }
    });

    if (res.status === 401) throw new Error('Unauthorized');

    if (res.ok) {
      const data = await res.json();
      return data;
    }
    
    // Fallback for demo
    console.warn("API not found/error, using mock data.");
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_BOOKMARKS), 600));

  } catch (error: any) {
    if (error.message === 'Unauthorized') throw error;
    console.warn("API Error, using mock data.", error);
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_BOOKMARKS), 600));
  }
};

export const deleteBookmark = async (id: string, password: string): Promise<void> => {
   try {
    await fetch(`${API_URL}?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-site-password': password }
    });
   } catch (e) {
     console.log("Mock delete for demo");
   }
};

// Placeholder for full save
export const saveBookmarks = async (bookmarks: Bookmark[], password: string) => {
    try {
        await fetch(API_URL, {
            method: 'PUT',
            headers: { 
                'x-site-password': password,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(bookmarks)
        });
    } catch(e) {
        console.error("Save failed", e);
    }
}
