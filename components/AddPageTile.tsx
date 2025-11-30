import React from 'react';
import { Plus } from 'lucide-react';

interface AddPageTileProps {
  onClick: () => void;
}

const AddPageTile: React.FC<AddPageTileProps> = ({ onClick }) => {
  return (
    <div 
      className="flex flex-col items-center gap-3 cursor-pointer w-[90px] md:w-[100px] transition-transform duration-300 hover:scale-105"
      onClick={onClick}
    >
      <div 
        className="
          w-[72px] h-[72px] md:w-20 md:h-20
          bg-white/90
          backdrop-blur-2xl 
          rounded-[20px] 
          shadow-[0_4px_16px_rgba(0,0,0,0.1)] 
          border border-white/50
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] hover:bg-white
        "
      >
        <Plus className="w-8 h-8 md:w-9 md:h-9 text-gray-400" strokeWidth={2.5} />
      </div>
      <span className="text-[13px] font-medium text-white text-center truncate w-full px-1 leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] select-none">
        Add Page
      </span>
    </div>
  );
};

export default AddPageTile;