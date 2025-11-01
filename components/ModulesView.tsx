
import React from 'react';
import { HomeIcon } from './icons'; // Using HomeIcon as a placeholder for a generic module icon

interface Module {
    name: string;
    description: string;
}

const availableModules: Module[] = [
    {
        name: 'Saturation',
        description: 'Adds warmth and harmonic complexity, emulating analog gear.'
    },
    {
        name: 'Filtered Delay',
        description: 'A classic delay effect with a low-pass filter on the feedback path.'
    },
    {
        name: 'Reverb',
        description: 'Simulates acoustic spaces, from small rooms to large halls.'
    },
    {
        name: 'Transient Shaper',
        description: 'Shape the attack and sustain of percussive sounds.'
    }
];

const ModuleCard: React.FC<{ module: Module, onAdd: () => void, isProcessing: boolean }> = ({ module, onAdd, isProcessing }) => (
    <div className="bg-surface/80 backdrop-blur-sm rounded-lg p-5 flex flex-col justify-between border border-background hover:border-accent/50 transition-all group">
        <div>
            <div className="flex items-center space-x-4 mb-3">
                <div className="bg-background p-3 rounded-full group-hover:bg-accent/20 transition-colors">
                    <div className="text-accent h-6 w-6">
                        <HomeIcon />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-primary">{module.name}</h3>
                </div>
            </div>
            <p className="text-secondary text-sm mb-4">{module.description}</p>
        </div>
        <button 
            onClick={onAdd}
            disabled={isProcessing}
            className="mt-4 w-full flex items-center justify-center bg-accent text-primary font-semibold py-3 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Add to Project
        </button>
    </div>
);

const ModulesView: React.FC<{ onAddModule: (name: string, description: string) => void, isProcessing: boolean }> = ({ onAddModule, isProcessing }) => {
    return (
        <div className="p-6">
            <div className="bg-surface/50 border border-background rounded-lg p-5 mb-6">
                <h2 className="text-xl font-bold text-primary">Audio Module Rack</h2>
                <p className="text-secondary mt-1">
                    Select a professional-grade DSP module to add to your project. The AI will automatically integrate it into your plugin's code and create the necessary parameters.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableModules.map(module => (
                    <ModuleCard 
                        key={module.name} 
                        module={module} 
                        onAdd={() => onAddModule(module.name, module.description)}
                        isProcessing={isProcessing}
                    />
                ))}
            </div>
        </div>
    );
};

export default ModulesView;
