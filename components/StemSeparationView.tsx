
import React, { useState, useCallback, useRef } from 'react';
import { Stem } from '../types';
import { separateStems } from '../services/geminiService';
import * as audioEngine from '../services/audioEngine';
import Loader from './Loader';
import RealWaveform from './RealWaveform';
import { PlayIcon, StopIcon, UploadCloudIcon } from './icons';

const StemTrack: React.FC<{
    stem: Stem;
    onPlay: (stemName: Stem['name']) => void;
    onStop: (stemName: Stem['name']) => void;
    onVolumeChange: (stemName: Stem['name'], volume: number) => void;
}> = ({ stem, onPlay, onStop, onVolumeChange }) => {
    return (
        <div className="bg-surface p-4 rounded-lg border border-background flex items-center gap-4">
            <div className="w-24 flex-shrink-0">
                <h4 className="font-bold text-primary">{stem.name}</h4>
                 <button onClick={() => stem.isPlaying ? onStop(stem.name) : onPlay(stem.name)} disabled={!stem.buffer} className="p-2 mt-2 rounded-full text-secondary disabled:opacity-50 enabled:hover:bg-background enabled:hover:text-primary">
                    {stem.isPlaying ? <StopIcon /> : <PlayIcon />}
                </button>
            </div>
            <div className="flex-grow h-20 bg-background rounded">
                <RealWaveform buffer={stem.buffer} color={stem.color} />
            </div>
            <div className="w-32 flex-shrink-0">
                <input
                    type="range"
                    min="0"
                    max="1.2"
                    step="0.01"
                    value={stem.volume}
                    onChange={(e) => onVolumeChange(stem.name, parseFloat(e.target.value))}
                    disabled={!stem.buffer}
                    className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-accent"
                />
            </div>
        </div>
    );
};

const StemSeparationView: React.FC = () => {
    const [stems, setStems] = useState<Stem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileDrop = async (file: File) => {
        if (!file.type.startsWith('audio/')) {
            setError('Please drop an audio file.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setFileName(file.name);
        setStems([]);

        try {
            const stemInfo = await separateStems(file.name);
            
            const stemPromises = stemInfo.map(async info => {
                const buffer = await audioEngine.createDummyBuffer(); // Use dummy audio for now
                const color = { Vocals: '#F72585', Drums: '#4CC9F0', Bass: '#8A42D6', Other: '#A0A0B0'}[info.name];
                const stem: Stem = { name: info.name, buffer, volume: 1, isPlaying: false, color: color || '#A0A0B0' };
                return stem;
            });

            const newStems = await Promise.all(stemPromises);
            setStems(newStems);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            handleFileDrop(event.dataTransfer.files[0]);
        }
    }, []);

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            handleFileDrop(event.target.files[0]);
        }
    };

    const handlePlay = (stemName: Stem['name']) => {
        // Simple playback: stop others when one starts
        stems.forEach(s => handleStop(s.name));

        const stem = stems.find(s => s.name === stemName);
        if (stem && stem.buffer) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            source.buffer = stem.buffer;
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            gainNode.gain.value = stem.volume;
            source.start();

            source.onended = () => {
                setStems(prev => prev.map(s => s.name === stemName ? {...s, isPlaying: false} : s));
            };

            setStems(prev => prev.map(s => s.name === stemName ? {...s, isPlaying: true, sourceNode: source, gainNode: gainNode} : s));
        }
    };

    const handleStop = (stemName: Stem['name']) => {
        const stem = stems.find(s => s.name === stemName);
        if (stem && stem.sourceNode) {
            stem.sourceNode.stop();
            stem.sourceNode.disconnect();
            setStems(prev => prev.map(s => s.name === stemName ? {...s, isPlaying: false, sourceNode: undefined, gainNode: undefined} : s));
        }
    };
    
    const handleVolumeChange = (stemName: Stem['name'], volume: number) => {
         setStems(prev => prev.map(s => {
            if (s.name === stemName) {
                if(s.gainNode) {
                    s.gainNode.gain.setValueAtTime(volume, s.gainNode.context.currentTime);
                }
                return { ...s, volume };
            }
            return s;
        }));
    };

    return (
        <div className="p-8 h-full relative">
            {isLoading && <Loader message="AI is separating stems..." />}
            <h3 className="text-xl font-bold text-primary mb-2">AI Stem Separation</h3>
            <p className="text-secondary mb-6 max-w-2xl">Drop an audio file to separate it into vocals, drums, bass, and other instruments using AI.</p>
            
            {stems.length === 0 ? (
                <div 
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    className="h-full flex flex-col items-center justify-center bg-background/50 border-2 border-dashed border-surface rounded-xl text-center cursor-pointer hover:border-accent"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="audio/*" className="hidden" />
                    <UploadCloudIcon />
                    <h4 className="text-lg font-semibold text-primary mt-4">Drop your audio file here</h4>
                    <p className="text-secondary mt-1">or click to browse</p>
                    {error && <p className="mt-4 text-hot-pink">{error}</p>}
                </div>
            ) : (
                <div>
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-primary">Separated Stems for: <span className="text-accent">{fileName}</span></h4>
                        <button onClick={() => setStems([])} className="bg-surface text-secondary hover:text-primary px-4 py-2 rounded-lg text-sm">Start Over</button>
                    </div>
                    <div className="space-y-4">
                        {stems.map(stem => (
                            <StemTrack 
                                key={stem.name} 
                                stem={stem}
                                onPlay={handlePlay}
                                onStop={handleStop}
                                onVolumeChange={handleVolumeChange}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StemSeparationView;
