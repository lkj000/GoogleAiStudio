
import React from 'react';
import { PlayIcon, StopIcon } from './icons';

const TransportControls: React.FC<{ isPlaying: boolean; onTogglePlay: () => void; }> = ({ isPlaying, onTogglePlay }) => {
    return (
        <div className="flex items-center space-x-2 bg-background p-1 rounded-lg">
            <button 
                onClick={onTogglePlay} 
                className={`p-2 rounded-md transition-colors ${isPlaying ? 'bg-hot-pink/20 text-hot-pink' : 'text-secondary hover:bg-surface hover:text-primary'}`}
                title={isPlaying ? "Stop" : "Play"}
            >
                {isPlaying ? <StopIcon /> : <PlayIcon />}
            </button>
        </div>
    );
};

export default TransportControls;
