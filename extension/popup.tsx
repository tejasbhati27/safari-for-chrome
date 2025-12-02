import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Reuse existing styles

const Popup = () => {
    const [dashboardUrl, setDashboardUrl] = useState('');
    const [password, setPassword] = useState('');
    const [isSetup, setIsSetup] = useState(false);
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [currentTab, setCurrentTab] = useState<{ title: string; url: string; favIconUrl?: string } | null>(null);

    useEffect(() => {
        // Load saved settings
        chrome.storage.sync.get(['dashboardUrl', 'sitePassword'], (result) => {
            if (result.dashboardUrl && result.sitePassword) {
                setDashboardUrl(result.dashboardUrl);
                setPassword(result.sitePassword);
                setIsSetup(true);
            }
        });

        // Get current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                setCurrentTab({
                    title: tabs[0].title || '',
                    url: tabs[0].url || '',
                    favIconUrl: tabs[0].favIconUrl,
                });
            }
        });
    }, []);

    const handleSetup = () => {
        if (!dashboardUrl || !password) {
            setStatus('error');
            setStatusMessage('Please fill in all fields.');
            return;
        }
        // Remove trailing slash
        const cleanUrl = dashboardUrl.replace(/\/$/, '');
        chrome.storage.sync.set({ dashboardUrl: cleanUrl, sitePassword: password }, () => {
            setDashboardUrl(cleanUrl);
            setIsSetup(true);
            setStatus('idle');
            setStatusMessage('');
        });
    };

    const handleSave = async () => {
        if (!currentTab || !dashboardUrl || !password) return;

        setStatus('saving');
        try {
            const response = await fetch(`${dashboardUrl}/api/bookmarks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-site-password': password,
                },
                body: JSON.stringify({
                    title: currentTab.title,
                    url: currentTab.url,
                    favicon: currentTab.favIconUrl,
                }),
            });

            if (response.ok) {
                setStatus('success');
                setStatusMessage('Saved to Dashboard!');
                setTimeout(() => window.close(), 1500);
            } else {
                setStatus('error');
                setStatusMessage(`Error: ${response.statusText}`);
            }
        } catch (error) {
            setStatus('error');
            setStatusMessage('Failed to connect to Dashboard.');
        }
    };

    const handleReset = () => {
        chrome.storage.sync.clear(() => {
            setIsSetup(false);
            setDashboardUrl('');
            setPassword('');
            setStatus('idle');
            setStatusMessage('');
        });
    };

    if (!isSetup) {
        return (
            <div className="w-80 p-6 bg-white/90 backdrop-blur-md">
                <h1 className="text-xl font-bold mb-4 text-gray-800">Setup Extension</h1>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard URL</label>
                        <input
                            type="url"
                            placeholder="https://my-site.vercel.app"
                            value={dashboardUrl}
                            onChange={(e) => setDashboardUrl(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Secret Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    {status === 'error' && <p className="text-red-500 text-sm">{statusMessage}</p>}
                    <button
                        onClick={handleSetup}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 p-6 bg-white/90 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-bold text-gray-800">Save to Safari</h1>
                <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">
                    Reset
                </button>
            </div>

            {currentTab && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-800 truncate mb-1">{currentTab.title}</p>
                    <p className="text-xs text-gray-500 truncate">{currentTab.url}</p>
                </div>
            )}

            {status === 'error' && <p className="text-red-500 text-sm mb-3">{statusMessage}</p>}

            <button
                onClick={handleSave}
                disabled={status === 'saving' || status === 'success'}
                className={`w-full py-2 rounded-lg font-medium transition-colors ${status === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {status === 'saving' ? 'Saving...' : status === 'success' ? 'Saved!' : 'Save Bookmark'}
            </button>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Popup />
    </React.StrictMode>
);
