import React, { useState } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import { AppSettings, Section } from '../types';
import { getRandomWallpaper } from '../services/chromeService';

interface CustomizeModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

const CustomizeModal: React.FC<CustomizeModalProps> = ({ settings, onClose, onSave }) => {
  const [currentUrl, setCurrentUrl] = useState(settings.currentBackgroundUrl);
  const [mode, setMode] = useState<'random' | 'static'>(settings.backgroundMode);

  const handleShuffle = () => {
    const newUrl = getRandomWallpaper();
    setCurrentUrl(newUrl);
    // If user shuffles, they likely want to keep this image (Static), or see what's next
    // But if they are in 'random' mode, shuffling just previews.
  };

  const handleSave = () => {
    onSave({
      backgroundMode: mode,
      currentBackgroundUrl: currentUrl
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/80 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/20">
          <h3 className="text-xl font-bold text-gray-800">Customize Background</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 transition-colors text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          {/* Preview Area */}
          <div className="relative group w-full h-48 rounded-2xl overflow-hidden shadow-inner border border-black/5 bg-gray-100">
             <img 
               src={currentUrl} 
               alt="Background Preview" 
               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
             />
             <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
             
             <button 
               onClick={handleShuffle}
               className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white backdrop-blur-md rounded-lg shadow-lg text-sm font-semibold text-gray-800 transition-all active:scale-95"
             >
               <RefreshCw size={14} />
               Shuffle
             </button>
          </div>

          {/* Options */}
          <div className="space-y-3">
             <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider ml-1">Mode</label>
             
             <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('static')}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200
                    ${mode === 'static' 
                       ? 'border-blue-500 bg-blue-50/50 text-blue-700' 
                       : 'border-transparent bg-white/50 hover:bg-white/80 text-gray-600'}
                  `}
                >
                  <span className="font-semibold">Keep Current</span>
                  <span className="text-xs opacity-70">Static Image</span>
                  {mode === 'static' && <div className="absolute top-3 right-3 text-blue-500"><Check size={16} /></div>}
                </button>

                <button
                  onClick={() => setMode('random')}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200
                    ${mode === 'random' 
                       ? 'border-purple-500 bg-purple-50/50 text-purple-700' 
                       : 'border-transparent bg-white/50 hover:bg-white/80 text-gray-600'}
                  `}
                >
                  <span className="font-semibold">Live Background</span>
                  <span className="text-xs opacity-70">Randomize on Startup</span>
                  {mode === 'random' && <div className="absolute top-3 right-3 text-purple-500"><Check size={16} /></div>}
                </button>
             </div>
          </div>

          <p className="text-xs text-gray-500 text-center px-4 leading-relaxed">
            {mode === 'random' 
              ? 'A new nature wallpaper will be selected automatically every time you open a new tab.' 
              : 'The currently selected image will differ from tab to tab but remain fixed until you change it.'}
          </p>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/30 border-t border-white/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold shadow-lg shadow-gray-900/20 transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomizeModal;