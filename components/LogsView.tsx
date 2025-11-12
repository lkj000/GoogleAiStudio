
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
        case 'error': return 'text-hot-pink';
        case 'warn': return 'text-yellow-400';
        case 'info': return 'text-vivid-sky-blue';
        default: return 'text-secondary';
    }
};

const formatMessage = (args: any[]): string => {
    return args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
            try {
                // Pretty print objects
                return JSON.stringify(arg, null, 2);
            } catch (e) {
                return '[Unserializable Object]';
            }
        }
        return String(arg);
    }).join(' ');
};

const LogsView: React.FC<{ logs: LogEntry[], onClear: () => void, isWebAudioProject: boolean }> = ({ logs, onClear, isWebAudioProject }) => {
    const endOfLogsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfLogsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);
    
    if (!isWebAudioProject) {
        return (
            <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold text-primary mb-2">Runtime Logs Unavailable</h3>
                <p className="text-secondary mt-1">Live logging is only available for Web Audio plugins.</p>
            </div>
        );
    }

    return (
        <div className="p-4 h-full bg-[#1E1E1E] rounded-b-xl flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-2 pb-2 border-b border-surface">
                <h3 className="text-sm font-semibold text-primary">Plugin Runtime Console Logs</h3>
                <button
                    onClick={onClear}
                    className="text-xs bg-surface text-secondary hover:text-primary px-3 py-1 rounded-md transition-colors"
                >
                    Clear Logs
                </button>
            </div>
            <div className="flex-grow overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                    <div className="text-secondary italic p-2">No logs yet. Use console.log(), .warn(), or .error() in your plugin code to see output here.</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={`flex items-start whitespace-pre-wrap border-b border-surface/50 py-1 ${getLogLevelColor(log.level)}`}>
                            <span className="text-gray-500 mr-3 flex-shrink-0">[{log.timestamp}]</span>
                            <code className="flex-grow">{formatMessage(log.message)}</code>
                        </div>
                    ))
                )}
                <div ref={endOfLogsRef} />
            </div>
        </div>
    );
};

export default LogsView;
