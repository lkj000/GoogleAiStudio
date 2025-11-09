import React, { useState, useRef } from 'react';
import { PlayIcon, StopIcon, UploadIcon } from './icons';
import * as audioEngine from '../services/audioEngine';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onTogglePlay: () => void;
    gain: number;
    onGainChange: (value: number) => void;
    playbackRate: number;
    onRateChange: (value: number) => void;
    log: (message: string) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPlaying, onTogglePlay, gain, onGainChange, playbackRate, onRateChange, log }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('Default Loop');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        log(`Uploading sample "${file.name}"...`);

        try {
            const arrayBuffer = await file.arrayBuffer();
            await audioEngine.loadUserSample(arrayBuffer);
            setFileName(file.name);
            log(`✅ Sample "${file.name}" loaded successfully.`);
            if (isPlaying) { 
                onTogglePlay(); 
                setTimeout(() => onTogglePlay(), 100); 
            }
        } catch (e: any) {
            setError(e.message);
            log(`<span class="text-hot-pink">❌ Sample Load Failed: ${e.message}</span>`);
            setFileName('Default Loop'); 
        } finally {
            setIsLoading(false);
            if(fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    return (
        <div className="flex items-center space-x-4 bg-background p-2 rounded-lg">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
            <button onClick={handleFileSelect} disabled={isLoading} className="flex items-center text-sm text-secondary hover:text-primary transition-colors disabled:opacity-50 px-2 py-1.5 rounded-md hover:bg-surface">
                <UploadIcon />
                <span>{isLoading ? 'Loading...' : 'Upload'}</span>
            </button>
            <div className="text-sm text-secondary truncate w-32 text-center" title={fileName}>{fileName}</div>
            
            <div className="h-6 w-px bg-surface" />

            <button onClick={onTogglePlay} className={`p-2 rounded-md transition-colors ${isPlaying ? 'bg-hot-pink/20 text-hot-pink' : 'text-secondary hover:bg-surface hover:text-primary'}`} title={isPlaying ? "Stop" : "Play"}>
                {isPlaying ? <StopIcon /> : <PlayIcon />}
            </button>

            <div className="flex items-center space-x-2">
                <label className="text-xs text-secondary">Gain</label>
                <input type="range" min="0" max="1.5" step="0.01" value={gain} onChange={e => onGainChange(Number(e.target.value))} className="w-24 h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-accent" />
            </div>
            <div className="flex items-center space-x-2">
                <label className="text-xs text-secondary">Rate</label>
                <input type="range" min="0.5" max="2" step="0.01" value={playbackRate} onChange={e => onRateChange(Number(e.target.value))} className="w-24 h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-accent" />
            </div>

            {error && <div className="text-xs text-hot-pink animate-fade-in">{error}</div>}
        </div>
    );
};

export default PlaybackControls;
