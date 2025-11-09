
import React, { useState } from 'react';
import { ArrangementSection, ArrangementPattern } from '../types';
import { generateArrangement } from '../services/audioProcessingService';
import Loader from './Loader';


const PatternPill: React.FC<{ pattern: ArrangementPattern; isDragging?: boolean }> = ({ pattern, isDragging }) => {
    const typeColor = {
        Drums: 'bg-hot-pink/80 text-white',
        Bass: 'bg-vivid-sky-blue/80 text-white',
        Melody: 'bg-accent/80 text-white',
        Chords: 'bg-yellow-500/80 text-white',
        Lead: 'bg-green-500/80 text-white',
        FX: 'bg-secondary/80 text-white',
    };

    return (
        <div className={`p-2 rounded text-xs font-semibold w-full h-full flex items-center justify-center text-center ${typeColor[pattern.type]} ${isDragging ? 'opacity-50' : ''}`}>
            {pattern.name}
        </div>
    );
};

interface ArrangementAssistantProps {
    patterns: ArrangementPattern[];
    arrangement: ArrangementSection[];
    onArrangementChange: (newArrangement: ArrangementSection[]) => void;
}

const ArrangementAssistantView: React.FC<ArrangementAssistantProps> = ({ patterns, arrangement, onArrangementChange }) => {
    const [draggedPattern, setDraggedPattern] = useState<ArrangementPattern | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [genre, setGenre] = useState('Amapiano');

    const handleDragStart = (pattern: ArrangementPattern) => {
        setDraggedPattern(pattern);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (sectionIndex: number) => {
        if (!draggedPattern) return;
        
        const newArrangement = [...arrangement];
        // Avoid adding duplicate patterns to the same section
        if (!newArrangement[sectionIndex].patterns.find(p => p.id === draggedPattern.id)) {
            newArrangement[sectionIndex].patterns.push(draggedPattern);
            onArrangementChange(newArrangement);
        }
        setDraggedPattern(null);
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const generated = await generateArrangement(patterns, genre);
            onArrangementChange(generated);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 h-full flex space-x-8 relative">
            {isLoading && <Loader message={`Generating ${genre} arrangement...`} />}
            <div className="w-1/4 flex-shrink-0 flex flex-col">
                <h3 className="text-xl font-bold text-primary mb-2">Pattern Pool</h3>
                <p className="text-secondary mb-6">Drag patterns onto the timeline or let AI build an arrangement.</p>
                <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                    {patterns.map(p => (
                        <div key={p.id} draggable onDragStart={() => handleDragStart(p)} className="cursor-grab active:cursor-grabbing h-12">
                            <PatternPill pattern={p} isDragging={draggedPattern?.id === p.id} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-primary">Quick Arrangement Assistant</h3>
                </div>
                <div className="flex items-center justify-between mb-6">
                    <p className="text-secondary">Build your track structure in seconds.</p>
                    <div className="flex items-center space-x-2">
                         <select value={genre} onChange={e => setGenre(e.target.value)} className="bg-surface border border-background rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                            <option>Amapiano</option>
                            <option>Lofi Hip-Hop</option>
                            <option>House</option>
                            <option>Trap</option>
                        </select>
                        <button onClick={handleGenerate} disabled={isLoading} className="bg-accent text-primary font-semibold py-2 px-4 rounded-lg hover:bg-accent-hover transition-colors">
                            Generate with AI
                        </button>
                    </div>
                </div>

                {error && <p className="text-center text-hot-pink mb-4">{error}</p>}

                <div className="w-full bg-background/50 border border-surface rounded-xl p-4 space-y-2">
                    {arrangement.map((section, sectionIndex) => (
                        <div key={`${section.name}-${sectionIndex}`} className="flex items-start space-x-4">
                            <div className="w-24 text-right flex-shrink-0 p-2">
                                <h4 className="font-bold text-primary">{section.name}</h4>
                                <p className="text-xs text-secondary">{section.length} bars</p>
                            </div>
                            <div 
                                className={`flex-grow bg-surface rounded min-h-[4rem] border-2 border-dashed border-background p-2 grid grid-cols-4 gap-2 transition-colors hover:border-accent`}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(sectionIndex)}
                            >
                                {section.patterns.map((p, i) => (
                                    <div key={`${p.id}-${i}`} className="h-12">
                                       <PatternPill pattern={p} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ArrangementAssistantView;