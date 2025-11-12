import React, { useState } from 'react';
import { PluginTemplate, Preset } from '../types';
import { generatePresets } from '../services/geminiService';
import Loader from './Loader';
import { PresetsIcon } from './icons';

interface PresetsViewProps {
    project: PluginTemplate;
    log: (message: string) => void;
    onApplyPreset: (values: Record<string, number>) => void;
}

const PresetCard: React.FC<{ preset: Preset, onApply: () => void }> = ({ preset, onApply }) => (
    <div className="bg-surface/80 backdrop-blur-sm rounded-lg p-5 flex flex-col border border-background hover:border-accent/50 transition-all group">
        <h3 className="text-lg font-bold text-primary mb-3 group-hover:text-accent transition-colors">{preset.name}</h3>
        <div className="text-xs text-secondary space-y-1 mb-4 flex-grow">
            {Object.entries(preset.values).map(([paramId, value]) => (
                <div key={paramId} className="flex justify-between font-mono">
                    <span>{paramId}:</span>
                    <span className="font-semibold text-primary">{!Number.isNaN(Number(value)) ? (Number.isInteger(Number(value)) ? Number(value) : Number(value).toFixed(2)) : 'N/A'}</span>
                </div>
            ))}
        </div>
        <button onClick={onApply} className="mt-4 w-full bg-surface text-primary font-semibold py-3 rounded-lg hover:bg-accent hover:text-primary transition-colors">
            Apply Preset
        </button>
    </div>
);

const PresetsView: React.FC<PresetsViewProps> = ({ project, log, onApplyPreset }) => {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePresets = async () => {
        setIsLoading(true);
        setError(null);
        log(`🤖 Generating presets for <span class="text-accent-hover font-semibold">${project.name}</span>...`);
        try {
            const generated = await generatePresets(project, 6);
            setPresets(generated);
            log(`✅ Successfully generated ${generated.length} presets.`);
        } catch (e: any) {
            setError(e.message);
            log(`<span class="text-hot-pink">❌ Preset Generation Failed: ${e.message}</span>`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = (preset: Preset) => {
        onApplyPreset(preset.values);
        log(`🎛️ Applied preset: <span class="font-semibold">${preset.name}</span>`);
    };

    return (
        <div className="p-8 h-full flex flex-col">
            {isLoading && <Loader message="AI is designing sounds..." />}
            <h3 className="text-xl font-bold text-primary mb-2">Preset Manager</h3>
            <p className="text-secondary mb-6">Generate and apply different sound configurations for your plugin.</p>
            
            {presets.length > 0 ? (
                <div className="flex-grow min-h-0">
                    <div className="flex items-center justify-end mb-4">
                        <button onClick={handleGeneratePresets} disabled={isLoading} className="bg-accent text-primary font-semibold py-2 px-4 rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                            Regenerate Presets
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
                        {presets.map((preset, index) => (
                           <PresetCard key={index} preset={preset} onApply={() => handleApply(preset)} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center bg-background/50 border-2 border-dashed border-surface rounded-xl text-center">
                    <div className="text-accent mb-4">
                        <PresetsIcon />
                    </div>
                    <h4 className="text-lg font-semibold text-primary">No presets generated yet</h4>
                    <p className="text-secondary mt-1">Let AI create some starting points for your sound.</p>
                    <button onClick={handleGeneratePresets} disabled={isLoading} className="mt-6 bg-accent text-primary font-semibold py-3 px-6 rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                        Generate Example Presets
                    </button>
                     {error && <p className="mt-4 text-hot-pink text-center">{error}</p>}
                </div>
            )}
        </div>
    );
};

export default PresetsView;