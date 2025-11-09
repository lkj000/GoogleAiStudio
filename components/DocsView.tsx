import React, { useState }from 'react';
import { PluginTemplate } from '../types';
import { generateDocumentation } from '../services/geminiService';
import Loader from './Loader';
import { DocsIcon } from './icons';

const DocsView: React.FC<{ project: PluginTemplate; log: (message: string) => void; }> = ({ project, log }) => {
    const [docsContent, setDocsContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState('');

    const handleGenerateDocs = async () => {
        setIsLoading(true);
        setError(null);
        setCopySuccess('');
        log(`✍️ Generating user manual for <span class="text-accent-hover font-semibold">${project.name}</span>...`);
        try {
            const content = await generateDocumentation(project);
            setDocsContent(content);
            log(`✅ Successfully generated documentation.`);
        } catch (e: any) {
            setError(e.message);
            log(`<span class="text-hot-pink">❌ Documentation Generation Failed: ${e.message}</span>`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!navigator.clipboard) {
            setCopySuccess('Copying is not supported on this browser.');
            return;
        }
        navigator.clipboard.writeText(docsContent).then(() => {
            setCopySuccess('Markdown copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            setCopySuccess('Failed to copy.');
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className="p-8 h-full flex flex-col">
            {isLoading && <Loader message="AI is writing the manual..." />}
            <h3 className="text-xl font-bold text-primary mb-2">Documentation & User Manual</h3>
            <p className="text-secondary mb-6">Use AI to generate a complete user manual for your plugin, then edit and export it.</p>
            
            {docsContent ? (
                <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex items-center justify-end space-x-2 mb-4">
                         <button onClick={handleGenerateDocs} disabled={isLoading} className="bg-surface text-primary font-semibold py-2 px-4 rounded-lg hover:bg-background transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                            Regenerate
                        </button>
                        <button onClick={handleCopy} className="bg-accent text-primary font-semibold py-2 px-4 rounded-lg hover:bg-accent-hover transition-colors">
                           {copySuccess ? copySuccess : 'Copy Markdown'}
                        </button>
                    </div>
                    <textarea
                        className="w-full flex-grow bg-[#1E1E1E] text-secondary font-mono text-sm p-4 rounded-lg border border-surface focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        value={docsContent}
                        onChange={(e) => setDocsContent(e.target.value)}
                        placeholder="Generated documentation will appear here..."
                    />
                </div>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center bg-background/50 border-2 border-dashed border-surface rounded-xl text-center">
                    <div className="text-accent mb-4">
                        <DocsIcon />
                    </div>
                    <h4 className="text-lg font-semibold text-primary">No documentation yet</h4>
                    <p className="text-secondary mt-1">Click the button to generate a user manual for "{project.name}".</p>
                    <button onClick={handleGenerateDocs} disabled={isLoading} className="mt-6 bg-accent text-primary font-semibold py-3 px-6 rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                        <span>Generate User Manual</span>
                    </button>
                     {error && <p className="mt-4 text-hot-pink text-center">{error}</p>}
                </div>
            )}
        </div>
    );
};

export default DocsView;
