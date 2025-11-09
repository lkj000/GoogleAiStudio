
import React, { useState } from 'react';
import { PluginTemplate } from '../types';
import { generatePluginFromDescription, generatePluginFromSmartTemplate } from '../services/geminiService';
import Loader from './Loader';
import { AiGenerateIcon, DownloadIcon } from './icons';
import MultiModalInput from './MultiModalInput';


const AIGeneratedTemplateCard: React.FC<{ template: PluginTemplate; onSelect: (template: PluginTemplate) => void; }> = ({ template, onSelect }) => (
    <div className="bg-surface/80 backdrop-blur-sm rounded-lg p-5 flex flex-col border-2 border-accent shadow-[0_0_15px_rgba(138,66,214,0.5)]">
        <div className="flex-grow">
            <div className="flex items-center space-x-4 mb-3">
                 <div className="bg-accent/20 p-3 rounded-full text-accent">
                    <AiGenerateIcon />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-primary">{template.name}</h3>
                    <div className="flex items-center space-x-2 text-xs mt-1">
                        <span className="bg-background text-secondary px-2 py-0.5 rounded">{template.type}</span>
                        <span className="bg-background text-secondary px-2 py-0.5 rounded">{template.framework}</span>
                    </div>
                 </div>
            </div>
            <p className="text-secondary text-sm mb-4">{template.description}</p>
            <div className="flex flex-wrap gap-2">
                {template.tags.map(tag => <span className="bg-hot-pink/20 text-hot-pink text-xs font-medium px-2.5 py-1 rounded-full" key={tag}>{tag}</span>)}
            </div>
        </div>
         <button onClick={() => onSelect(template)} className="mt-6 w-full flex items-center justify-center bg-accent text-primary font-semibold py-3 rounded-lg hover:bg-accent-hover transition-colors">
            <DownloadIcon />
            Load in Editor
        </button>
    </div>
);

const SmartTemplateCard: React.FC<{ title: string; description: string; onGenerate: () => void }> = ({ title, description, onGenerate }) => (
    <div className="bg-surface/50 border border-background rounded-xl p-5 text-left group hover:border-accent/50 transition-colors">
        <h4 className="font-bold text-primary text-md">{title}</h4>
        <p className="text-secondary text-sm mt-1 mb-4">{description}</p>
        <button onClick={onGenerate} className="w-full bg-accent/80 text-primary font-semibold py-2 rounded-lg group-hover:bg-accent transition-colors">Generate</button>
    </div>
);

const AIGenerateView: React.FC<{ onPluginGenerated: (template: PluginTemplate, source: 'ai') => void; log: (message: string) => void; }> = ({ onPluginGenerated, log }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Generating with Amapiano AI...");
    const [generatedPlugin, setGeneratedPlugin] = useState<PluginTemplate | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (prompt: string, framework: 'JUCE' | 'Web Audio') => {
        if (!prompt.trim()) {
            setError("Please enter a description for the plugin.");
            return;
        }
        setLoadingMessage("Generating with Amapiano AI...");
        setIsLoading(true);
        setError(null);
        setGeneratedPlugin(null);
        log(`✨ Kicking off AI generation for: "${prompt}"...`);
        try {
            const plugin = await generatePluginFromDescription(prompt, framework);
            log(`✅ AI successfully generated plugin: <span class="text-accent-hover font-semibold">${plugin.name}</span>`);
            setGeneratedPlugin(plugin);
        } catch (e: any) {
            log(`<span class="text-hot-pink">❌ AI Generation Failed: ${e.message}</span>`);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSmartTemplate = async (templateName: 'Amapianorizer' | 'Lofi Chillifier') => {
        setLoadingMessage(`Building ${templateName}...`);
        setIsLoading(true);
        setError(null);
        setGeneratedPlugin(null);
        log(`🧠 Generating Smart Template: ${templateName}...`);
        try {
            const plugin = await generatePluginFromSmartTemplate(templateName);
            log(`✅ AI successfully generated Smart Template: <span class="text-accent-hover font-semibold">${plugin.name}</span>`);
            setGeneratedPlugin(plugin);
        } catch (e: any) {
            log(`<span class="text-hot-pink">❌ Smart Template Generation Failed: ${e.message}</span>`);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-8 h-full flex flex-col items-center justify-center">
            {isLoading && <Loader message={loadingMessage} />}
            <div className="w-full max-w-4xl">
                 <div className="text-center">
                    <h3 className="text-2xl font-bold text-primary mb-2">Create Anything</h3>
                    <p className="text-secondary mb-6 max-w-xl mx-auto">Describe, speak, or upload a reference file to generate your ideal plugin.</p>
                </div>
                
                <MultiModalInput onGenerate={handleGenerate} disabled={isLoading} />

                <div className="mt-8">
                    <h4 className="text-lg font-semibold text-center text-secondary mb-4">Or start with a Smart Template</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <SmartTemplateCard 
                            title="Amapianorizer"
                            description="A genre-defining multi-effect for authentic Amapiano sounds."
                            onGenerate={() => handleSmartTemplate('Amapianorizer')}
                       />
                       <SmartTemplateCard 
                            title="Lofi Chillifier"
                            description="Instantly add vintage warmth, tape hiss, and hazy echoes."
                            onGenerate={() => handleSmartTemplate('Lofi Chillifier')}
                       />
                    </div>
                </div>

                {error && <p className="mt-4 text-hot-pink text-center">{error}</p>}
            </div>

            {generatedPlugin && (
                <div className="mt-8 w-full max-w-md">
                    <AIGeneratedTemplateCard template={generatedPlugin} onSelect={() => onPluginGenerated(generatedPlugin, 'ai')} />
                </div>
            )}
        </div>
    );
};


export default AIGenerateView;
