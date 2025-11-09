

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrangementSection, ArrangementPattern } from '../types';
import { SpeakerIcon, MuteIcon } from './icons';

const PIXELS_PER_BEAT = 40;
const TRACK_HEIGHT = 60; // in pixels

const PatternClip: React.FC<{ pattern: ArrangementPattern, sectionStartBeats: number, sectionLengthBeats: number }> = ({ pattern, sectionStartBeats, sectionLengthBeats }) => {
    const typeColor = {
        Drums: 'bg-hot-pink/80 border-hot-pink',
        Bass: 'bg-vivid-sky-blue/80 border-vivid-sky-blue',
        Melody: 'bg-accent/80 border-accent',
        Chords: 'bg-yellow-500/80 border-yellow-500',
        Lead: 'bg-green-500/80 border-green-500',
        FX: 'bg-secondary/80 border-gray-500',
    };
    
    return (
        <div 
            className={`absolute h-12 top-1/2 -translate-y-1/2 rounded-lg text-white text-xs font-semibold flex items-center px-3 border-l-4 ${typeColor[pattern.type]}`}
            style={{
                left: `${sectionStartBeats * PIXELS_PER_BEAT}px`,
                width: `${sectionLengthBeats * PIXELS_PER_BEAT}px`
            }}
        >
            {pattern.name}
        </div>
    );
};

const TrackHeader: React.FC<{ trackName: string }> = ({ trackName }) => (
    <div className="h-full bg-surface border-b border-r border-background flex items-center px-4">
        <div className="flex items-center space-x-2">
            <button className="p-1 rounded text-secondary hover:bg-background"><SpeakerIcon /></button>
            <span className="font-bold text-primary">{trackName}</span>
        </div>
    </div>
);

interface DAWViewProps {
    arrangement: ArrangementSection[];
    patterns: ArrangementPattern[];
    isPlaying: boolean;
}

const DAWView: React.FC<DAWViewProps> = ({ arrangement, patterns, isPlaying }) => {
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const playheadRef = useRef<HTMLDivElement>(null);
    // FIX: Correctly type the ref. useRef without an argument makes the value potentially undefined.
    const animationFrameId = useRef<number | undefined>();

    const tracks = useMemo(() => {
        const trackNames = new Set(patterns.map(p => p.type));
        return Array.from(trackNames).sort();
    }, [patterns]);

    const totalBeats = useMemo(() => {
        return arrangement.reduce((sum, section) => sum + section.length * 4, 0);
    }, [arrangement]);

    // FIX: Pre-calculate section start times to avoid state mutations during render.
    const sectionsWithStartBeats = useMemo(() => {
        let beatTracker = 0;
        return arrangement.map(section => {
            const sectionWithStart = {
                ...section,
                startBeat: beatTracker,
            };
            beatTracker += section.length * 4;
            return sectionWithStart;
        });
    }, [arrangement]);


    // Simple playhead animation for visual feedback (not tied to audio engine time yet)
    useEffect(() => {
        if (!isPlaying) {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (playheadRef.current) {
                playheadRef.current.style.transform = 'translateX(0px)';
            }
            return;
        }

        const bpm = 110;
        const beatsPerSecond = bpm / 60;
        const pixelsPerSecond = beatsPerSecond * PIXELS_PER_BEAT;
        let startTime: number | null = null;
        
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsedSeconds = (timestamp - startTime) / 1000;
            let newLeft = elapsedSeconds * pixelsPerSecond;

            if (newLeft > totalBeats * PIXELS_PER_BEAT) {
                startTime = timestamp; // Loop
                newLeft = 0;
            }

            if (playheadRef.current) {
                playheadRef.current.style.transform = `translateX(${newLeft}px)`;
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
             if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }

    }, [isPlaying, totalBeats]);
    
    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex-grow flex overflow-hidden">
                <div className="w-48 flex-shrink-0 bg-surface/50 border-r border-background">
                    {/* Track Headers */}
                    <div className="h-10 border-b border-background"></div>
                    {tracks.map(trackName => (
                         <div key={trackName} style={{ height: `${TRACK_HEIGHT}px`}}>
                            <TrackHeader trackName={trackName} />
                        </div>
                    ))}
                </div>
                <div ref={timelineContainerRef} className="flex-grow overflow-x-auto">
                    <div className="relative" style={{ width: `${totalBeats * PIXELS_PER_BEAT}px` }}>
                        {/* Time Ruler */}
                        <div className="h-10 border-b border-background sticky top-0 bg-surface/80 backdrop-blur-sm z-20">
                             {[...Array(Math.ceil(totalBeats / 4))].map((_, barIndex) => (
                                <div key={barIndex} className="absolute top-0 h-full flex items-center text-xs text-secondary" style={{ left: `${barIndex * 4 * PIXELS_PER_BEAT}px`}}>
                                    <div className="w-px h-full bg-surface"></div>
                                    <span className="pl-1">{barIndex + 1}</span>
                                </div>
                            ))}
                        </div>
                        
                        {/* Track Lanes */}
                        {/* FIX: Replaced faulty rendering logic with pre-calculated values for correctness and performance. */}
                        {tracks.map((trackName, trackIndex) => (
                             <div key={trackName} className="relative border-b border-background" style={{ height: `${TRACK_HEIGHT}px` }}>
                                {/* Grid lines */}
                                {[...Array(totalBeats)].map((_, beatIndex) => (
                                     <div key={beatIndex} className={`absolute top-0 h-full w-px ${((beatIndex + 1) % 4 === 0) ? 'bg-surface' : 'bg-surface/50'}`} style={{ left: `${(beatIndex + 1) * PIXELS_PER_BEAT}px`}} />
                                ))}

                                {/* Clips for this track */}
                                {sectionsWithStartBeats.map(section => {
                                    const sectionPatterns = section.patterns.filter(p => p.type === trackName);
                                    const sectionLengthBeats = section.length * 4;
                                    
                                    return sectionPatterns.map((p, i) => (
                                        <PatternClip key={`${p.id}-${i}`} pattern={p} sectionStartBeats={section.startBeat} sectionLengthBeats={sectionLengthBeats} />
                                    ));
                                })}
                             </div>
                        ))}

                        {/* Playhead */}
                        <div ref={playheadRef} className="absolute top-0 h-full w-0.5 bg-accent z-30 pointer-events-none">
                            <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-accent transform rotate-45"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DAWView;