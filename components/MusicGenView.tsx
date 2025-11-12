
import React, { useState, useEffect } from 'react';
import { MidiNote } from '../types';
import { generateMusicFromPrompt } from '../services/geminiService';
import Loader from './Loader';
import { PlayIcon, StopIcon } from './icons';

const MusicGenView: React.FC = () => {
    const [prompt, setPrompt] = useState('A relaxing Amapiano groove with a deep log drum');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedMusic, setGeneratedMusic] = useState<{description: string, midiNotes: MidiNote[]}|null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const audioCtx = React.useRef<AudioContext | null>(null);
    const sources = React.useRef<OscillatorNode[]>([]);

    useEffect(() => {
        return () => {
            handleStop();
        };
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        handleStop();
        try {
            const result = await generateMusicFromPrompt(prompt);
            setGeneratedMusic(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlay = () => {
        if (!generatedMusic || isPlaying) return;

        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtx.current.state === 'suspended') {
            audioCtx.current.resume();
        }

        const now = audioCtx.current.currentTime;
        const secondsPerBeat = 60 / 110; // Assume 110 BPM for Amapiano

        generatedMusic.midiNotes.forEach(note => {
            const startTime = now + note.start * secondsPerBeat;
            const endTime = startTime + note.duration * secondsPerBeat;
            const freq = 440 * Math.pow(2, (note.pitch - 69) / 12);
            
            const osc = audioCtx.current!.createOscillator();
            const gainNode = audioCtx.current!.createGain();

            osc.type = note.pitch < 50 ? 'sine' : 'triangle'; // sine for bass, triangle for melody
            osc.frequency.setValueAtTime(freq, startTime);

            const velocityGain = (note.velocity / 127) * 0.4;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(velocityGain, startTime + 0.02); // Quick attack
            gainNode.gain.setValueAtTime(velocityGain, endTime - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, endTime); // Release

            osc.connect(gainNode);
            gainNode.connect(audioCtx.current!.destination);
            osc.start(startTime);
            osc.stop(endTime + 0.1);
            sources.current.push(osc);
        });

        setIsPlaying(true);
        // Set a timeout to reset playing state when music ends
        const totalDuration = (Math.max(...generatedMusic.midiNotes.map(n => n.start + n.duration)) * secondsPerBeat + 0.2) * 1000;
        setTimeout(() => setIsPlaying(false), totalDuration);
    };

    const handleStop = () => {
        sources.current.forEach(source => {
            try {
                source.stop();
                source.disconnect();
            } catch(e) {}
        });
        sources.current = [];
        setIsPlaying(false);
    };

    return (
        <div className="p-8 h-full flex flex-col items-center">
            {isLoading && <Loader message="AI is composing..." />}
            <div className="w-full max-w-3xl text-center">
                <h3 className="text-xl font-bold text-primary mb-2">AI Music Generation</h3>
                <p className="text-secondary mb-6">Describe the music you want to create, and let AI compose a unique pattern for you.</p>
                
                <div className="flex items-center gap-2">
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="e.g., 'A bouncy log drum pattern with a soulful electric piano chord progression'"
                        rows={2}
                        className="w-full bg-surface border border-background rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                    <button onClick={handleGenerate} disabled={isLoading} className="bg-accent text-primary font-semibold py-2 px-4 rounded-lg hover:bg-accent-hover transition-colors h-full">
                        Generate
                    </button>
                </div>
                 {error && <p className="mt-4 text-hot-pink text-center">{error}</p>}

                {generatedMusic && (
                    <div className="mt-8 text-left bg-surface p-6 rounded-xl border border-background animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-primary">Generated Pattern:</h4>
                                <p className="text-secondary text-sm italic">"{generatedMusic.description}"</p>
                            </div>
                            <button onClick={isPlaying ? handleStop : handlePlay} className={`p-3 rounded-full ${isPlaying ? 'bg-hot-pink text-white' : 'bg-accent text-white'}`}>
                                {isPlaying ? <StopIcon /> : <PlayIcon />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicGenView;
