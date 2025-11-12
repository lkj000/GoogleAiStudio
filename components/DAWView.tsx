
import React, { useState, useEffect, useCallback } from 'react';
import { DAWTrack } from '../types';
import * as audioEngine from '../services/audioEngine';
import { PlayIcon, StopIcon, SpeakerIcon, MuteIcon, MicrophoneIcon, UploadIcon } from './icons';
import Loader from './Loader';

const TrackControls: React.FC<{
    track: DAWTrack;
    onVolumeChange: (id: string, value: number) => void;
    onPanChange: (id: string, value: number) => void;
    onMuteToggle: (id: string, isMuted: boolean) => void;
    onSoloToggle: (id: string, isSoloed: boolean) => void;
}> = ({ track, onVolumeChange, onPanChange, onMuteToggle, onSoloToggle }) => {
    return (
        <div className="h-full bg-surface border-b border-r border-background flex flex-col p-2 space-y-2">
            <div className="font-bold text-primary truncate text-sm">{track.name}</div>
            <div className="flex items-center space-x-1">
                <button 
                    onClick={() => onMuteToggle(track.id, !track.isMuted)}
                    className={`px-2 py-1 text-xs font-bold rounded ${track.isMuted ? 'bg-hot-pink text-white' : 'bg-background text-secondary'}`}
                >
                    M
                </button>
                <button 
                    onClick={() => onSoloToggle(track.id, !track.isSoloed)}
                    className={`px-2 py-1 text-xs font-bold rounded ${track.isSoloed ? 'bg-yellow-400 text-black' : 'bg-background text-secondary'}`}
                >
                    S
                </button>
            </div>
            <div className="flex-grow space-y-1">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.volume}
                    onChange={(e) => onVolumeChange(track.id, parseFloat(e.target.value))}
                    className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-accent"
                    title="Volume"
                />
                <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={track.pan}
                    onChange={(e) => onPanChange(track.id, parseFloat(e.target.value))}
                    className="w-full h-1 bg-background rounded-lg appearance-none cursor-pointer accent-vivid-sky-blue"
                    title="Pan"
                />
            </div>
        </div>
    );
};

const DAWView: React.FC = () => {
    const [tracks, setTracks] = useState<DAWTrack[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        audioEngine.setDAWTracks(tracks);
    }, [tracks]);

    const addTrack = (name: string, buffer: AudioBuffer) => {
        // Create a temporary context to instantiate nodes for type correctness.
        // These will be replaced by the audio engine's nodes.
        const tempAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const newTrack: DAWTrack = {
            id: `track-${Date.now()}`,
            name,
            buffer,
            volume: 0.8,
            pan: 0,
            isMuted: false,
            isSoloed: false,
            gainNode: tempAudioContext.createGain(),
            // FIX: Use StereoPannerNode to match the updated DAWTrack type.
            pannerNode: tempAudioContext.createStereoPanner()
        };
        tempAudioContext.close();
        setTracks(prev => [...prev, newTrack]);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            addTrack(file.name, audioBuffer);
        } catch (error) {
            console.error("Failed to load audio file:", error);
            alert("Failed to load audio file. It might be corrupted or in an unsupported format.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecord = async () => {
        if (isRecording) {
            try {
                setIsLoading(true);
                const buffer = await audioEngine.stopRecording();
                addTrack('Recording ' + new Date().toLocaleTimeString(), buffer);
            } catch (error) {
                console.error("Recording failed:", error);
                alert(error);
            } finally {
                setIsLoading(false);
                setIsRecording(false);
            }
        } else {
            try {
                await audioEngine.startRecording();
                setIsRecording(true);
            } catch (error) {
                console.error("Could not start recording:", error);
                alert(error);
            }
        }
    };

    const handlePlayToggle = () => {
        if (isPlaying) {
            audioEngine.stopDAW();
            setIsPlaying(false);
        } else {
            audioEngine.playDAW();
            setIsPlaying(true);
        }
    };

    const onVolumeChange = useCallback((id: string, value: number) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, volume: value } : t));
        audioEngine.updateTrackVolume(id, value);
    }, []);
    const onPanChange = useCallback((id: string, value: number) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, pan: value } : t));
        audioEngine.updateTrackPan(id, value);
    }, []);
    const onMuteToggle = useCallback((id: string, isMuted: boolean) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, isMuted } : t));
        audioEngine.toggleMute(id, isMuted);
    }, []);
    const onSoloToggle = useCallback((id: string, isSoloed: boolean) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, isSoloed } : t));
        audioEngine.toggleSolo(id, isSoloed);
    }, []);

    return (
        <div className="h-full flex flex-col bg-background text-primary">
            {isLoading && <Loader message={isRecording ? 'Recording...' : 'Processing...'} />}
            <div className="flex-shrink-0 p-2 border-b border-surface flex items-center space-x-4">
                <button onClick={handlePlayToggle} className={`p-2 rounded-md ${isPlaying ? 'bg-hot-pink text-white' : 'bg-surface'}`}>
                    {isPlaying ? <StopIcon /> : <PlayIcon />}
                </button>
                <button onClick={handleRecord} className={`p-2 rounded-full flex items-center space-x-2 ${isRecording ? 'bg-hot-pink text-white animate-pulse' : 'bg-surface'}`}>
                    <MicrophoneIcon />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-md flex items-center space-x-2 bg-surface">
                    <UploadIcon /> <span>Add Audio</span>
                </button>
            </div>
            <div className="flex-grow flex overflow-x-auto">
                {tracks.map(track => (
                    <div key={track.id} className="w-48 flex-shrink-0">
                        <TrackControls 
                            track={track} 
                            onVolumeChange={onVolumeChange}
                            onPanChange={onPanChange}
                            onMuteToggle={onMuteToggle}
                            onSoloToggle={onSoloToggle}
                        />
                    </div>
                ))}
                {tracks.length === 0 && (
                    <div className="w-full h-full flex items-center justify-center text-secondary">
                        <p>Your DAW is empty. Add some audio to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DAWView;