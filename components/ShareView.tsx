
import React, { useState, useEffect } from 'react';
import { PluginTemplate } from '../types';

const ShareView: React.FC<{ project: PluginTemplate }> = ({ project }) => {
    const [shareUrl, setShareUrl] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        if (project) {
            try {
                const projectJson = JSON.stringify(project);
                // Unicode-safe base64 encoding
                const base64Project = btoa(unescape(encodeURIComponent(projectJson)));
                const url = `${window.location.origin}${window.location.pathname}?project=${encodeURIComponent(base64Project)}`;
                setShareUrl(url);
            } catch (error) {
                console.error("Failed to serialize project for sharing:", error);
                setShareUrl('Could not generate share link.');
            }
        }
    }, [project]);

    const handleCopy = () => {
        if (!navigator.clipboard) {
            setCopySuccess('Copying is not supported in this browser.');
            return;
        }
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopySuccess('Link copied to clipboard!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            setCopySuccess('Failed to copy link.');
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className="p-8 h-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-bold text-primary mb-2">Share Your Plugin</h3>
            <p className="text-secondary mb-8">Anyone with the link can view and interact with a snapshot of your current project.</p>
            
            <div className="w-full bg-surface p-4 rounded-xl border border-background">
                <label htmlFor="share-url" className="sr-only">Share URL</label>
                <div className="flex items-center space-x-2">
                    <input
                        id="share-url"
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="w-full bg-background border border-surface rounded-md py-3 px-4 text-secondary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        onFocus={(e) => e.target.select()}
                    />
                    <button 
                        onClick={handleCopy}
                        className="flex-shrink-0 bg-accent text-primary font-semibold py-3 px-5 rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        Copy Link
                    </button>
                </div>
                {copySuccess && <p className="mt-3 text-sm text-green-400">{copySuccess}</p>}
            </div>

            <div className="mt-6 text-sm text-secondary">
                <p>Note: This creates a read-only snapshot. Changes made by others will not affect your project.</p>
            </div>
        </div>
    );
};

export default ShareView;
