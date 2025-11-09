

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PluginTemplate } from '../types';
import * as audioEngine from '../services/audioEngine';
import RealtimeOscilloscope from './RealtimeOscilloscope';

// Re-importing Knob and useSimpleSynth to keep this component self-contained for logic
const useSimpleSynth = () => {
    const audioCtx = useRef<AudioContext | null>(null);
    const oscillator = useRef<OscillatorNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const isInitialized = useRef(false);
    const isInitializing = useRef(false);

    const initAudio = useCallback(() => {
        if (isInitialized.current || isInitializing.current) {
            if(audioCtx.current && audioCtx.current.state === 'suspended') {
                audioCtx.current.resume();
            }
            return;
        }
        isInitializing.current = true;
        
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const setupNodes = () => {
            if (context.state === 'closed') {
                isInitializing.current = false;
                return;
            };

            const osc = context.createOscillator();
            const gain = context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, context.currentTime);
            gain.gain.setValueAtTime(0, context.currentTime);

            osc.connect(gain);
            gain.connect(context.destination);
            osc.start();

            oscillator.current = osc;
            gainNode.current = gain;
            audioCtx.current = context;
            isInitialized.current = true;
            isInitializing.current = false;
        };
        
        if (context.state === 'suspended') {
            context.resume().then(setupNodes).catch(e => {
                console.error("Audio context resume failed:", e);
                isInitializing.current = false;
            });
        } else {
            setupNodes();
        }
    }, []);

    useEffect(() => {
        return () => {
            if (audioCtx.current && audioCtx.current.state !== 'closed') {
                audioCtx.current.close().catch(console.error);
            }
            isInitialized.current = false;
        };
    }, []);

    const playTone = useCallback((freq: number) => {
        if (!isInitialized.current || !audioCtx.current || !gainNode.current || !oscillator.current) return;
        if (audioCtx.current.state !== 'running') return;
        
        const now = audioCtx.current.currentTime;
        gainNode.current.gain.cancelScheduledValues(now);
        gainNode.current.gain.setValueAtTime(gainNode.current.gain.value, now);
        gainNode.current.gain.linearRampToValueAtTime(0.1, now + 0.01);
        oscillator.current.frequency.linearRampToValueAtTime(freq, now + 0.01);
    }, []);
    
    const stopTone = useCallback((durationSeconds: number) => {
        if (!isInitialized.current || !audioCtx.current || !gainNode.current) return;
        if (audioCtx.current.state !== 'running') return;

        const now = audioCtx.current.currentTime;
        gainNode.current.gain.cancelScheduledValues(now);
        gainNode.current.gain.setValueAtTime(gainNode.current.gain.value, now);
        gainNode.current.gain.linearRampToValueAtTime(0, now + durationSeconds);
    }, []);

    return { playTone, stopTone, initAudio };
};

const Knob: React.FC<{ 
    label: string; 
    value: number; 
    min?: number; 
    max?: number;
    unit?: string;
    onValueChange: (newValue: number) => void;
    playTone: (freq: number) => void;
    stopTone: (durationSeconds: number) => void;
    initAudio: () => void;
}> = ({ label, value = 0, min = 0, max = 100, unit, onValueChange, playTone, stopTone, initAudio }) => {
    
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        initAudio(); 
        e.preventDefault();

        const startY = e.clientY;
        const startValue = value;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const range = max - min;
            const sensitivity = range > 0 ? range / 200 : 0.5;
            let newValue = startValue + deltaY * sensitivity;
            newValue = Math.max(min, Math.min(max, newValue));
            onValueChange(newValue);
            playTone(200 + (range > 0 ? (newValue - min) / range : 0) * 600);
        };

        const handleMouseUp = () => {
            document.body.style.cursor = 'default';
            stopTone(0.05);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.body.style.cursor = 'ns-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp, { once: true });

    }, [value, min, max, onValueChange, playTone, stopTone, initAudio]);

    const range = max - min;
    const percentage = range > 0 ? ((value - min) / range) * 100 : 0;
    const rotation = -135 + (percentage * 270) / 100;


    return (
        <div className="flex flex-col items-center space-y-2 select-none" onMouseDown={handleMouseDown}>
            <div className="relative w-24 h-24 cursor-pointer">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" stroke="#373843" strokeWidth="8" fill="none" />
                    <path 
                        d="M 14.64 85.36 A 45 45 0 1 1 85.36 85.36" // 270 degree arc
                        stroke="url(#knob-gradient)" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: 212.05,
                            strokeDashoffset: 212.05 * (1 - (range > 0 ? (value - min) / range : 0)),
                            transition: 'stroke-dashoffset 0.1s linear'
                        }}
                    />
                    <defs>
                        <linearGradient id="knob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F72585" />
                            <stop offset="100%" stopColor="#8A42D6" />
                        </linearGradient>
                    </defs>
                     <line x1="50" y1="50" x2="50" y2="15" stroke="#F4F4F5" strokeWidth="3" strokeLinecap="round" transform={`rotate(${rotation} 50 50)`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-primary font-bold text-lg leading-none">{value.toFixed(1)}</span>
                    {unit && <span className="text-secondary text-xs mt-1">{unit}</span>}
                </div>
            </div>
            <span className="text-sm text-secondary font-semibold">{label}</span>
        </div>
    );
};

interface VisualBuilderViewProps {
    project: PluginTemplate;
    analyserNode: AnalyserNode | null;
    paramValues: Record<string, number>;
    onParamChange: (id: string, value: number) => void;
}

const VisualBuilderView: React.FC<VisualBuilderViewProps> = ({ project, analyserNode, paramValues, onParamChange }) => {
    const { playTone, stopTone, initAudio } = useSimpleSynth();
    
    const knobsToRender = project.parameters.filter(p => p.type === 'range');

    if (knobsToRender.length === 0) {
        return (
            <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold text-primary mb-6">Visual Interface Builder</h3>
                <p className="text-secondary mt-2">This plugin has no visual controls (like knobs or sliders) to display.</p>
                <p className="text-secondary mt-1">You can view its full details in the 'Parameters' tab.</p>
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <h3 className="text-xl font-bold text-primary mb-6">Visual Interface Builder</h3>
            <div className="flex-grow bg-background/50 border border-surface rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {knobsToRender.map(param => (
                        <Knob 
                            key={param.id} 
                            label={param.name} 
                            value={paramValues[param.id] || 0} 
                            min={param.min} 
                            max={param.max}
                            unit={param.unit}
                            onValueChange={(val) => onParamChange(param.id, val)}
                            playTone={playTone}
                            stopTone={stopTone}
                            initAudio={initAudio}
                        />
                    ))}
                </div>
            </div>
             <div className="flex-shrink-0 mt-6 p-4 bg-background/50 border border-surface rounded-xl flex items-center gap-6">
                <div className="flex-grow h-[150px]">
                    {analyserNode ? (
                         <RealtimeOscilloscope analyserNode={analyserNode} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary">
                           {project.framework === 'Web Audio' ? 'Audio engine loading...' : 'Real-time preview only available for Web Audio plugins.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisualBuilderView;