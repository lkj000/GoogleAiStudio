
import React, { useState, useEffect } from 'react';
import { PluginTemplate } from '../types';
import { DragHandleIcon, SignalChainIcon, HomeIcon } from './icons';
import Loader from './Loader';
import { availableModules, Module } from '../data/modules';

const ModuleRackCard: React.FC<{ module: Module }> = ({ module }) => (
    <div 
        draggable
        onDragStart={(e) => {
            e.dataTransfer.setData('moduleName', module.name);
            e.dataTransfer.setData('moduleDescription', module.description);
            e.dataTransfer.effectAllowed = 'copy';
        }}
        className="bg-surface/80 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4 border border-background hover:border-accent/50 transition-all group cursor-grab active:cursor-grabbing"
    >
        <div className="bg-background p-3 rounded-full group-hover:bg-accent/20 transition-colors text-accent">
             <HomeIcon />
        </div>
        <div>
            <h3 className="font-bold text-primary">{module.name}</h3>
            <p className="text-secondary text-sm">{module.description}</p>
        </div>
    </div>
);

const SignalChainItem: React.FC<{ moduleName: string; index: number; onDragStart: (e: React.DragEvent<HTMLDivElement>, item: string) => void; onDragOver: (e: React.DragEvent<HTMLDivElement>) => void; onDrop: (e: React.DragEvent<HTMLDivElement>, targetItem: string) => void; isDragged: boolean; }> = ({ moduleName, index, onDragStart, onDragOver, onDrop, isDragged }) => (
    <div 
        className={`flex items-center p-4 bg-surface rounded-lg border border-background transition-shadow ${isDragged ? 'shadow-lg shadow-accent-glow/50 opacity-50' : ''}`}
        draggable
        onDragStart={(e) => onDragStart(e, moduleName)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, moduleName)}
    >
        <DragHandleIcon />
        <div className="ml-4 flex-grow flex items-center space-x-3">
            <div className="bg-accent/20 p-2 rounded-full text-accent">
                <SignalChainIcon />
            </div>
            <span className="font-semibold text-primary">{moduleName}</span>
        </div>
        <span className="text-xs font-mono text-secondary">Slot {index + 1}</span>
    </div>
);

const SignalPatcher: React.FC<{ project: PluginTemplate; onReorder: (newChain: string[]) => void; onAddModule: (name: string, description: string) => void; isProcessing: boolean; }> = ({ project, onReorder, onAddModule, isProcessing }) => {
    const [chain, setChain] = useState(project.signalChain || []);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [isDropZoneActive, setIsDropZoneActive] = useState(false);

    useEffect(() => {
        setChain(project.signalChain || []);
    }, [project.signalChain]);

    const handleChainDragStart = (e: React.DragEvent<HTMLDivElement>, item: string) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item); // For internal reordering
    };

    const handleChainDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleChainDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: string) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === targetItem) {
            setDraggedItem(null);
            return;
        }

        const currentIndex = chain.indexOf(draggedItem);
        const targetIndex = chain.indexOf(targetItem);
        
        const newChain = [...chain];
        const [removed] = newChain.splice(currentIndex, 1);
        newChain.splice(targetIndex, 0, removed);
        
        setChain(newChain);
        setDraggedItem(null);
        onReorder(newChain);
    };

    const handleDropZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const moduleName = e.dataTransfer.types.includes('modulename');
        if (moduleName) {
            e.dataTransfer.dropEffect = 'copy';
            setIsDropZoneActive(true);
        }
    };

    const handleDropZoneDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDropZoneActive(false);
    };

    const handleDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDropZoneActive(false);
        const moduleName = e.dataTransfer.getData('moduleName');
        const moduleDescription = e.dataTransfer.getData('moduleDescription');
        if (moduleName && moduleDescription) {
            onAddModule(moduleName, moduleDescription);
        }
    };

    if (project.framework !== 'JUCE') {
        return (
            <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold text-primary mb-2">Signal Patcher Unavailable</h3>
                <p className="text-secondary mt-1">Visual signal patching is currently only available for JUCE projects.</p>
            </div>
        );
    }

    return (
        <div className="p-8 h-full relative grid grid-cols-1 md:grid-cols-3 gap-8">
            {isProcessing && <Loader message="AI is refactoring code..." />}
            
            {/* Module Rack */}
            <div className="md:col-span-1">
                <h3 className="text-xl font-bold text-primary mb-2">Module Rack</h3>
                <p className="text-secondary mb-6">Drag a module to the chain to add it to your plugin.</p>
                <div className="space-y-4">
                    {availableModules.map(module => (
                        <ModuleRackCard key={module.name} module={module} />
                    ))}
                </div>
            </div>

            {/* Signal Chain */}
            <div className="md:col-span-2">
                <h3 className="text-xl font-bold text-primary mb-2">Active Signal Chain</h3>
                <p className="text-secondary mb-6">Reorder modules to change the processing flow.</p>

                <div 
                    className={`p-4 rounded-xl border-2 min-h-[300px] transition-colors ${isDropZoneActive ? 'border-accent bg-accent/10' : 'border-dashed border-surface'}`}
                    onDragOver={handleDropZoneDragOver}
                    onDragLeave={handleDropZoneDragLeave}
                    onDrop={handleDropZoneDrop}
                >
                    {chain.length > 0 ? (
                        <div className="space-y-3">
                            {chain.map((moduleName, index) => (
                                <SignalChainItem
                                    key={moduleName + index}
                                    moduleName={moduleName}
                                    index={index}
                                    onDragStart={handleChainDragStart}
                                    onDragOver={handleChainDragOver}
                                    onDrop={handleChainDrop}
                                    isDragged={draggedItem === moduleName}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center items-center text-center text-secondary">
                            <SignalChainIcon />
                            <p className="mt-2 font-semibold">The signal chain is empty.</p>
                            <p>Drag modules from the rack on the left to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignalPatcher;
