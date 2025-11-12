

import React, { useState } from 'react';
import { humanizeMidiPattern } from '../services/audioProcessingService';
import { MidiNote } from '../types';
import Loader from './Loader';
import * as audioEngine from '../services/audioEngine';

const PianoRollNote: React.FC<{ start: number, duration: number, pitch: number, velocity: number, humanized?: boolean }> = ({ start, duration, pitch, velocity, humanized }) => {
    const top = (11 - pitch) * 8.333; // 100% / 12 notes
    const left = start * 6.25; // 100% / 16 steps
    const width = duration * 6.25;
    const opacity = 0.5 + (velocity / 127) * 0.5;
    
    return (
        <div 
            className={`absolute rounded-sm ${humanized ? 'bg-hot-pink' : 'bg-accent'}`}
            style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: '8.333%', opacity }}
        />
    );
};


const MidiHumanizerView: React.FC = () => {
    const [timing, setTiming] = useState(25);
    const [velocity, setVelocity] = useState(40);
    const [humanizedPattern, setHumanizedPattern] = useState<MidiNote[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const originalPattern: MidiNote[] = [
        { pitch: 0, start: 0, duration: 1, velocity: 100 },
        { pitch: 7, start: 2, duration: 1, velocity: 110 },
        { pitch: 4, start: 4, duration: 1, velocity: 90 },
        { pitch: 7, start: 6, duration: 1, velocity: 115 },
        { pitch: 0, start: 8, duration: 1, velocity: 105 },
        { pitch: 7, start: 10, duration: 1, velocity: 120 },
        { pitch: 5, start: 12, duration: 1, velocity: 95 },
        { pitch: 4, start: 14, duration: 1, velocity: 100 },
    ];

    const handleHumanize = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await humanizeMidiPattern(originalPattern, timing, velocity);
            setHumanizedPattern(result);
        } catch (e: any) {
            setError(e.message);
            setHumanizedPattern(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePlayOriginal = () => {
        audioEngine.playMidiPattern(originalPattern, 120);
    };

    const handlePlayHumanized = () => {
        if (humanizedPattern) {
            audioEngine.playMidiPattern(humanizedPattern, 120);
        }
    };

    return (
         <div className="p-8 h-full relative">
            {isLoading && <Loader message="Applying humanization..." />}
            <h3 className="text-xl font-bold text-primary mb-2">Intelligent MIDI Humanization</h3>
            <p className="text-secondary mb-6 max-w-2xl">Instantly apply natural, human-like variations to your MIDI patterns to avoid a robotic feel.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-background/50 border border-surface rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-primary">MIDI Pattern Viewer</h4>
                        <div className="flex items-center space-x-2">
                             <button onClick={handlePlayOriginal} className="bg-surface text-primary font-semibold py-2 px-4 rounded-lg hover:bg-background transition-colors text-sm">Play Original</button>
                             <button onClick={handlePlayHumanized} disabled={!humanizedPattern} className="bg-hot-pink/80 text-white font-semibold py-2 px-4 rounded-lg hover:bg-hot-pink transition-colors text-sm disabled:opacity-50">Play Humanized</button>
                        </div>
                    </div>
                    <div className="bg-surface p-2 rounded-lg border border-background">
                       <div className="relative w-full aspect-[2/1] bg-background rounded">
                         {/* Grid Lines */}
                        {[...Array(15)].map((_, i) => <div key={i} className="absolute border-r border-surface/50" style={{ left: `${(i + 1) * 6.25}%`, top: 0, bottom: 0 }} />)}
                        {[...Array(11)].map((_, i) => <div key={i} className="absolute border-b border-surface/50" style={{ top: `${(i + 1) * 8.333}%`, left: 0, right: 0 }} />)}

                        {/* Original Notes */}
                        {originalPattern.map((note, i) => <PianoRollNote key={`orig-${i}`} {...note} />)}
                        
                        {/* Humanized Notes Overlay */}
                        <div className="absolute inset-0 transition-opacity" style={{opacity: humanizedPattern ? 1 : 0}}>
                            {humanizedPattern?.map((note, i) => (
                                <PianoRollNote key={`hum-${i}`} {...note} humanized />
                            ))}
                        </div>
                       </div>
                    </div>
                </div>

                 <div className="lg:col-span-1 bg-surface border border-background rounded-xl p-6">
                    <h4 className="font-bold text-lg text-primary mb-4">Humanization Controls</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Timing Randomness: {timing}%</label>
                            <input type="range" min="0" max="100" value={timing} onChange={e => setTiming(Number(e.target.value))} className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-hot-pink" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Velocity Variation: {velocity}%</label>
                            <input type="range" min="0" max="100" value={velocity} onChange={e => setVelocity(Number(e.target.value))} className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-hot-pink" />
                        </div>
                        <div className="pt-4">
                           <button onClick={handleHumanize} disabled={isLoading} className="w-full bg-hot-pink text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity">
                                Humanize Pattern
                           </button>
                            {humanizedPattern && (
                                <button onClick={() => setHumanizedPattern(null)} className="w-full text-center text-secondary text-sm mt-3 hover:text-primary">
                                    Clear Humanization
                                </button>
                            )}
                        </div>
                        {error && <p className="text-sm text-hot-pink mt-2 text-center">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MidiHumanizerView;