import { createClient } from 'redis';

export default async function handler(req, res) {
    const client = createClient({
        url: process.env.REDIS_URL
    });

    await client.connect();

    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-site-password'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Password check
    const sitePassword = process.env.SITE_PASSWORD;
    const headerPassword = req.headers['x-site-password'];

    if (sitePassword && headerPassword !== sitePassword) {
        await client.disconnect();
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        if (req.method === 'GET') {
            const data = await client.get('bookmarks');
            await client.disconnect();
            return res.status(200).json(data ? JSON.parse(data) : []);
        }

        if (req.method === 'PUT') {
            const body = req.body; // In Vercel functions, body is already parsed if JSON
            await client.set('bookmarks', JSON.stringify(body));
            await client.disconnect();
            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                await client.disconnect();
                return res.status(400).json({ error: 'Missing id' });
            }

            const data = await client.get('bookmarks');
            let bookmarks = data ? JSON.parse(data) : [];

            // Recursive delete helper
            const removeBookmarkFromTree = (nodes, idToDelete) => {
                return nodes.reduce((acc, node) => {
                    if (node.id === idToDelete) return acc;
                    if (node.children) {
                        return [...acc, { ...node, children: removeBookmarkFromTree(node.children, idToDelete) }];
                    }
                    return [...acc, node];
                }, []);
            };

            bookmarks = removeBookmarkFromTree(bookmarks, id);
            await client.set('bookmarks', JSON.stringify(bookmarks));

            await client.disconnect();
            return res.status(200).json({ success: true });
        }

        await client.disconnect();
        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API Error:', error);
        if (client.isOpen) await client.disconnect();
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
