
import React from 'react';

import ReactDOM from 'react-dom/client';

import OverlayPanel from './components/OverlayPanel';



const ROOT_ID = 'safari-extension-overlay-root';



// Prevent multiple injections

if (!document.getElementById(ROOT_ID)) {

  const host = document.createElement('div');

  host.id = ROOT_ID;

  // Host container covers screen but passes events through by default

  host.style.position = 'fixed';

  host.style.zIndex = '2147483647'; // Max z-index

  host.style.inset = '0';

  host.style.pointerEvents = 'none'; // Let clicks pass through to site when closed



  document.body.appendChild(host);



  const shadow = host.attachShadow({ mode: 'open' });



  // Inject Styles for the Shadow DOM

  const style = document.createElement('style');

  style.textContent = `

    :host {

      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

    }

    *, *::before, *::after {

      box-sizing: border-box;

    }

    .overlay-container {

      position: fixed;

      inset: 0;

      display: flex;

      align-items: center;

      justify-content: center;

      pointer-events: none;

      transition: background 0.2s ease, backdrop-filter 0.2s ease;

    }

    .overlay-container.open {

      pointer-events: auto; /* Capture clicks on backdrop */

      background: rgba(0, 0, 0, 0.25);

      backdrop-filter: blur(4px);

      -webkit-backdrop-filter: blur(4px);

    }

    .panel {

      width: 640px;

      max-width: 90vw;

      max-height: 80vh;

      background: rgba(255, 255, 255, 0.85);

      backdrop-filter: blur(32px);

      -webkit-backdrop-filter: blur(32px);

      border: 1px solid rgba(255, 255, 255, 0.6);

      border-radius: 24px;

      box-shadow: 0 24px 48px rgba(0,0,0,0.2);

      display: flex;

      flex-direction: column;

      overflow: hidden;

      transform-origin: center;

      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

      opacity: 0;

      transform: scale(0.95) translateY(10px);

    }

    .panel.open {

      opacity: 1;

      transform: scale(1) translateY(0);

    }

    

    /* Scrollbar */

    .scroll-area::-webkit-scrollbar {

      width: 6px;

    }

    .scroll-area::-webkit-scrollbar-track {

      background: transparent;

    }

    .scroll-area::-webkit-scrollbar-thumb {

      background: rgba(0, 0, 0, 0.2);

      border-radius: 3px;

    }

    .scroll-area::-webkit-scrollbar-thumb:hover {

      background: rgba(0, 0, 0, 0.3);

    }



    /* Utilities */

    .flex-col { display: flex; flex-direction: column; }

    .flex-row { display: flex; flex-direction: row; }

    .items-center { align-items: center; }

    .justify-between { justify-content: space-between; }

    .justify-end { justify-content: flex-end; }

    .p-4 { padding: 16px; }

    .p-6 { padding: 24px; }

    .gap-2 { gap: 8px; }

    .gap-4 { gap: 16px; }

    .font-bold { font-weight: 700; }

    .text-sm { font-size: 14px; }

    .text-xs { font-size: 12px; }

    .text-lg { font-size: 18px; }

    .text-gray-500 { color: #6b7280; }

    .text-gray-800 { color: #1f2937; }

    .text-gray-400 { color: #9ca3af; }

    .hover-bg-black-5:hover { background-color: rgba(0,0,0,0.05); }

    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .cursor-pointer { cursor: pointer; }

  `;

  shadow.appendChild(style);



  const root = ReactDOM.createRoot(shadow);

  root.render(

    <React.StrictMode>

      <OverlayPanel />

    </React.StrictMode>

  );

}
