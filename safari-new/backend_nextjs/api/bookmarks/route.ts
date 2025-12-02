import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * COPY THIS FILE TO: app/api/bookmarks/route.ts
 * DEPENDENCIES: npm install @vercel/kv uuid
 * ENV VARS: KV_REST_API_URL, KV_REST_API_TOKEN, SITE_PASSWORD
 */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-site-password',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(req: Request) {
  const password = req.headers.get('x-site-password');
  
  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  }

  try {
    // Return all items. Logic might vary if you store a single JSON blob or a list.
    // For folder support, we assume 'bookmarks' key holds the entire JSON array.
    // If using 'lrange', we get a list of items. If items are folders, that's fine.
    const bookmarks = await kv.get('bookmarks_full_state'); 
    
    // Fallback to legacy list if full state doesn't exist
    if (!bookmarks) {
         const list = await kv.lrange('bookmarks', 0, -1);
         return NextResponse.json(list, { headers: corsHeaders() });
    }
    
    return NextResponse.json(bookmarks, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500, headers: corsHeaders() });
  }
}

// POST: Appends a single new item (Legacy/Extension support)
export async function POST(req: Request) {
  const password = req.headers.get('x-site-password');

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
  }

  try {
    const body = await req.json();
    const { title, url, favicon } = body;

    const newBookmark = {
      id: uuidv4(),
      title,
      url,
      favicon: favicon || '',
      date: new Date().toISOString(),
      type: 'link'
    };

    // We need to update the full state. 
    // Fetch current state, prepend, save.
    let current = await kv.get('bookmarks_full_state') as any[];
    if (!current) {
        // Fallback
        current = await kv.lrange('bookmarks', 0, -1) as any[];
    }
    
    if (!Array.isArray(current)) current = [];
    current.unshift(newBookmark);
    
    await kv.set('bookmarks_full_state', current);
    
    // Also keep legacy list sync for safety if needed, but 'set' is better for complex structures
    await kv.lpush('bookmarks', newBookmark);

    return NextResponse.json(newBookmark, { status: 201, headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500, headers: corsHeaders() });
  }
}

// PUT: Saves the entire list (for Drag & Drop / Folder creation updates)
export async function PUT(req: Request) {
    const password = req.headers.get('x-site-password');
    if (password !== process.env.SITE_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
    }

    try {
        const body = await req.json();
        // Overwrite the full state
        await kv.set('bookmarks_full_state', body);
        return NextResponse.json({ success: true }, { headers: corsHeaders() });
    } catch(error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500, headers: corsHeaders() });
    }
}

export async function DELETE(req: Request) {
    const password = req.headers.get('x-site-password');
    if (password !== process.env.SITE_PASSWORD) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() });
    }

    const { searchParams } = new URL(req.url);
    const idToDelete = searchParams.get('id');

    try {
        let current = await kv.get('bookmarks_full_state') as any[];
        if (!current) current = await kv.lrange('bookmarks', 0, -1) as any[];
        
        // Recursive delete helper (if id is inside folder)
        const filterRecursive = (items: any[]): any[] => {
            return items.filter(item => {
                if (item.id === idToDelete) return false;
                if (item.children) {
                    item.children = filterRecursive(item.children);
                }
                return true;
            });
        };

        const updated = filterRecursive(current);
        await kv.set('bookmarks_full_state', updated);

        return NextResponse.json({ success: true }, { headers: corsHeaders() });
    } catch (error) {
         return NextResponse.json({ error: 'Delete failed' }, { status: 500, headers: corsHeaders() });
    }
}
