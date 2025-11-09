

import React, { useState } from 'react';
import { PlayIcon } from './icons';
import { timeStretchAudio } from '../services/audioProcessingService';
import Loader from './Loader';

const Waveform: React.FC<{ color: string }> = ({ color }) => (
    <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
        <path d="M0,40 C20,10 40,70 60,40 S100,10 120,40 S160,70 180,40 S220,10 240,40 S280,70 300,40" stroke={color} strokeWidth="2" fill="none" />
    </svg>
);

const AutoTimeStretchView: React.FC = () => {
    const [originalBPM, setOriginalBPM] = useState(90);
    const [targetBPM, setTargetBPM] = useState(110);
    // FIX: Explicitly type the state to match the function's expected parameter type.
    const [algorithm, setAlgorithm] = useState<'percussive' | 'tonal' | 'speech'>('percussive');
    const [isStretched, setIsStretched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStretch = async () => {
        setIsLoading(true);
        setError(null);
        setIsStretched(false);
        try {
            await timeStretchAudio(originalBPM, targetBPM, algorithm);
            setIsStretched(true);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 h-full relative">
            {isLoading && <Loader message="Analyzing and stretching audio..." />}
            <h3 className="text-xl font-bold text-primary mb-2">Auto Time-Stretch Engine</h3>
            <p className="text-secondary mb-6 max-w-2xl">Leverage our intelligent time-stretching algorithm to fit any loop or sample perfectly into your project's tempo.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-background/50 border border-surface rounded-xl p-6 space-y-6">
                    <div>
                        <h4 className="font-semibold text-primary mb-3">Original Sample</h4>
                        <div className="bg-surface p-4 rounded-lg border border-background">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-mono text-sm text-secondary">log_drum_loop_90bpm.wav</span>
                                <button className="p-2 rounded-full text-secondary hover:bg-background hover:text-primary"><PlayIcon /></button>
                            </div>
                            <div className="h-20">
                                <Waveform color="#A0A0B0" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary mb-3">Stretched Result</h4>
                        <div className={`bg-surface p-4 rounded-lg border ${isStretched ? 'border-accent' : 'border-background'}`}>
                             <div className="flex items-center justify-between mb-3">
                                <span className="font-mono text-sm text-accent">{isStretched ? `log_drum_loop_${targetBPM}bpm.wav` : '...'}</span>
                                {isStretched && <button className="p-2 rounded-full text-secondary hover:bg-background hover:text-primary"><PlayIcon /></button>}
                            </div>
                            <div className="h-20 opacity-0 data-[active=true]:opacity-100 transition-opacity" data-active={isStretched}>
                                <Waveform color="#8A42D6" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-surface border border-background rounded-xl p-6">
                    <h4 className="font-bold text-lg text-primary mb-4">Parameters</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Original BPM</label>
                            <input type="number" value={originalBPM} onChange={e => setOriginalBPM(Number(e.target.value))} className="w-full bg-background border border-surface rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Target BPM</label>
                            <input type="number" value={targetBPM} onChange={e => setTargetBPM(Number(e.target.value))} className="w-full bg-background border border-surface rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Algorithm Mode</label>
                            {/* FIX: Cast the value from the onChange event to the correct type. */}
                            <select value={algorithm} onChange={e => setAlgorithm(e.target.value as 'percussive' | 'tonal' | 'speech')} className="w-full bg-background border border-surface rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                                <option value="percussive">Percussive</option>
                                <option value="tonal">Tonal</option>
                                <option value="speech">Speech</option>
                            </select>
                        </div>
                        <button onClick={handleStretch} disabled={isLoading} className="w-full bg-accent text-primary font-semibold py-3 rounded-lg hover:bg-accent-hover transition-colors mt-4">
                            Stretch Audio
                        </button>
                        {error && <p className="text-sm text-hot-pink mt-2 text-center">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoTimeStretchView;