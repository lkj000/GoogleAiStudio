import React, { useEffect, useRef } from 'react';
import { PluginTemplate } from '../types';
import ExportView from './ExportView';

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="p-4 mb-4 bg-background/50 rounded-lg border border-surface animate-fade-in">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-primary">Compiling...</span>
            <span className="text-sm font-semibold text-accent">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-surface rounded-full h-2.5">
            <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
        </div>
    </div>
);

const ConsoleView: React.FC<{ messages: string[], compilationSuccess: boolean, project: PluginTemplate | null, isProcessing: boolean, compileProgress: number | null }> = ({ messages, compilationSuccess, project, isProcessing, compileProgress }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="p-4 h-full bg-[#1E1E1E] rounded-b-xl flex flex-col">
            {isProcessing && compileProgress !== null && compileProgress < 100 && <ProgressBar progress={compileProgress} />}
            {compilationSuccess && project && <ExportView project={project} />}
            <div className="flex-grow overflow-y-auto">
                <pre className="text-xs text-secondary font-mono whitespace-pre-wrap">
                    {messages.map((msg, i) => <div key={i} dangerouslySetInnerHTML={{ __html: msg }} />)}
                </pre>
                 <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};

export default ConsoleView;
