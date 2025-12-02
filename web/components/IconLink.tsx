import React, { useState } from 'react';
import { Trash2, Globe } from 'lucide-react';

interface IconLinkProps {
    title: string;
    url: string;
    favicon: string;
    onDelete: (e: React.MouseEvent) => void;
}

const IconLink: React.FC<IconLinkProps> = ({ title, url, favicon, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imgError, setImgError] = useState(false);

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
        flex flex-col items-center gap-3 group cursor-pointer w-[100px]
        transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        hover:scale-105 z-10
      `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative block">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onDelete(e);
                    }}
                    className={`
            absolute -top-2 -right-2 z-20 p-1.5 bg-gray-200 rounded-full text-red-500 
            opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-gray-300
          `}
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>

                <div
                    className={`
            w-20 h-20
            bg-white/80 
            backdrop-blur-2xl 
            rounded-[20px] 
            shadow-[0_4px_16px_rgba(0,0,0,0.1)] 
            border border-white/50
            flex items-center justify-center
            transition-all duration-300 ease-out
            group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] group-hover:bg-white/90
          `}
                >
                    {imgError ? (
                        <Globe className="w-9 h-9 text-gray-600 opacity-70" />
                    ) : (
                        <img
                            src={favicon}
                            alt={title}
                            className="w-9 h-9 object-contain rounded-sm drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                            onError={() => setImgError(true)}
                        />
                    )}
                </div>
            </div>
            <span className="text-[13px] font-medium text-white text-center truncate w-full px-1 leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] select-none">
                {title}
            </span>
        </a>
    );
};

export default IconLink;
