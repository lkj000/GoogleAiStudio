

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AiGenerateIcon, CodeIcon, ConsoleIcon, ParametersIcon, PublishIcon, SaveIcon, TemplateIcon, TestIcon, VisualBuilderIcon, DownloadIcon, HomeIcon } from './icons';
import TemplatesView from './TemplatesView';
import { PluginTemplate, PluginParameter } from '../types';
import { generatePluginFromDescription, addModuleToProject } from '../services/geminiService';
import Loader from './Loader';
import ModulesView from './ModulesView';

// --- Audio Feedback Hook ---
const useSimpleSynth = () => {
    const audioCtx = useRef<AudioContext | null>(null);
    const oscillator = useRef<OscillatorNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const isInitialized = useRef(false);
    const isInitializing = useRef(false);

    const initAudio = useCallback(() => {
        if (isInitialized.current || isInitializing.current) {
            if(audioCtx.current && audioCtx.current.state === 'suspended') {
                audioCtx.current.resume();
            }
            return;
        }
        isInitializing.current = true;
        
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const setupNodes = () => {
            if (context.state === 'closed') {
                isInitializing.current = false;
                return;
            };

            const osc = context.createOscillator();
            const gain = context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, context.currentTime);
            gain.gain.setValueAtTime(0, context.currentTime);

            osc.connect(gain);
            gain.connect(context.destination);
            osc.start();

            oscillator.current = osc;
            gainNode.current = gain;
            audioCtx.current = context;
            isInitialized.current = true;
            isInitializing.current = false;
        };
        
        if (context.state === 'suspended') {
            context.resume().then(setupNodes).catch(e => {
                console.error("Audio context resume failed:", e);
                isInitializing.current = false;
            });
        } else {
            setupNodes();
        }
    }, []);

    useEffect(() => {
        return () => {
            if (audioCtx.current && audioCtx.current.state !== 'closed') {
                audioCtx.current.close().catch(console.error);
            }
            isInitialized.current = false;
        };
    }, []);

    const playTone = useCallback((freq: number) => {
        if (!isInitialized.current || !audioCtx.current || !gainNode.current || !oscillator.current) return;
        if (audioCtx.current.state !== 'running') return;
        
        const now = audioCtx.current.currentTime;
        gainNode.current.gain.cancelScheduledValues(now);
        gainNode.current.gain.setValueAtTime(gainNode.current.gain.value, now);
        gainNode.current.gain.linearRampToValueAtTime(0.1, now + 0.01);
        oscillator.current.frequency.linearRampToValueAtTime(freq, now + 0.01);
    }, []);
    
    const stopTone = useCallback((durationSeconds: number) => {
        if (!isInitialized.current || !audioCtx.current || !gainNode.current) return;
        if (audioCtx.current.state !== 'running') return;

        const now = audioCtx.current.currentTime;
        gainNode.current.gain.cancelScheduledValues(now);
        gainNode.current.gain.setValueAtTime(gainNode.current.gain.value, now);
        gainNode.current.gain.linearRampToValueAtTime(0, now + durationSeconds);
    }, []);

    return { playTone, stopTone, initAudio };
};


// --- New View Components ---

const CodeEditorView: React.FC<{ code: string, onCodeChange: (newCode: string) => void }> = ({ code, onCodeChange }) => {
    return (
        <div className="p-4 h-full flex flex-col">
            <textarea 
                className="w-full flex-grow bg-[#1E1E1E] text-secondary font-mono text-sm p-4 rounded-lg border border-surface focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
            />
        </div>
    );
};

const Knob: React.FC<{ 
    label: string; 
    value: number; 
    min?: number; 
    max?: number;
    onValueChange: (newValue: number) => void;
    playTone: (freq: number) => void;
    stopTone: (durationSeconds: number) => void;
    initAudio: () => void;
}> = ({ label, value = 0, min = 0, max = 100, onValueChange, playTone, stopTone, initAudio }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        initAudio(); 
        e.preventDefault();

        const startY = e.clientY;
        const startValue = value;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const range = max - min;
            const sensitivity = range > 0 ? range / 200 : 0.5;
            let newValue = startValue + deltaY * sensitivity;
            newValue = Math.max(min, Math.min(max, newValue));
            onValueChange(newValue);
            playTone(200 + (range > 0 ? (newValue - min) / range : 0) * 600);
        };

        const handleMouseUp = () => {
            document.body.style.cursor = 'default';
            stopTone(0.05);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.body.style.cursor = 'ns-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp, { once: true });

    }, [value, min, max, onValueChange, playTone, stopTone, initAudio]);

    const range = max - min;
    const percentage = range > 0 ? ((value - min) / range) * 100 : 0;
    const rotation = -135 + (percentage * 270) / 100;


    return (
        <div className="flex flex-col items-center space-y-2 select-none" onMouseDown={handleMouseDown}>
            <div className="relative w-24 h-24 cursor-pointer">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" stroke="#373843" strokeWidth="8" fill="none" />
                    <path 
                        d="M 14.64 85.36 A 45 45 0 1 1 85.36 85.36" // 270 degree arc
                        stroke="url(#knob-gradient)" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: 212.05,
                            strokeDashoffset: 212.05 * (1 - (range > 0 ? (value - min) / range : 0)),
                            transition: 'stroke-dashoffset 0.1s linear'
                        }}
                    />
                    <defs>
                        <linearGradient id="knob-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F72585" />
                            <stop offset="100%" stopColor="#8A42D6" />
                        </linearGradient>
                    </defs>
                     <line x1="50" y1="50" x2="50" y2="15" stroke="#F4F4F5" strokeWidth="3" strokeLinecap="round" transform={`rotate(${rotation} 50 50)`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-lg">{value.toFixed(1)}</div>
            </div>
            <span className="text-sm text-secondary font-semibold">{label}</span>
        </div>
    );
};

const WaveformDisplay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Fix: `useRef<number>()` is invalid TypeScript without an initial value. Initialize with `null` and update the type.
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let time = 0;

        const draw = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2;
            
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, '#4CC9F0');
            gradient.addColorStop(1, '#F72585');
            ctx.strokeStyle = gradient;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4CC9F0';
            
            ctx.beginPath();
            const centerY = canvas.height / 2;
            const amplitude = canvas.height / 3;

            for (let x = 0; x < canvas.width; x++) {
                const angle1 = (x / canvas.width) * Math.PI * 4 + time;
                const angle2 = (x / canvas.width) * Math.PI * 10 + time * 0.5;
                const y = centerY + Math.sin(angle1) * amplitude * 0.7 + Math.sin(angle2) * amplitude * 0.3;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            animationFrameId.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        }
    }, []);

    return <canvas ref={canvasRef} className="w-full h-full" width="600" height="150" />;
}

const LevelMeter: React.FC<{ value: number }> = ({ value }) => {
    const segments = Array.from({ length: 20 });
    return (
        <div className="flex flex-col-reverse gap-1 bg-background p-1 rounded">
            {segments.map((_, i) => {
                const segmentValue = (i + 1) * 5;
                const isOn = value >= segmentValue;
                let colorClass = 'bg-green-500/30';
                if (isOn) {
                    if (segmentValue > 90) colorClass = 'bg-red-500';
                    else if (segmentValue > 75) colorClass = 'bg-yellow-500';
                    else colorClass = 'bg-green-500';
                }
                return <div key={i} className={`h-2 w-4 rounded-sm transition-colors duration-100 ${colorClass}`} />;
            })}
        </div>
    );
};

const Fader: React.FC = () => (
    <div className="flex flex-col items-center space-y-2">
        <div className="relative w-4 h-48 bg-background rounded-full p-1">
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-6 h-8 bg-primary rounded-sm cursor-pointer" />
        </div>
        <span className="text-xs text-secondary font-semibold">MASTER</span>
    </div>
);

const VisualBuilderView: React.FC<{ parameters: PluginTemplate['parameters'] }> = ({ parameters }) => {
    const { playTone, stopTone, initAudio } = useSimpleSynth();
    const [paramValues, setParamValues] = useState<Record<string, number>>({});
    const [meterLevel, setMeterLevel] = useState({ l: 0, r: 0 });

    useEffect(() => {
        const initialValues = parameters.reduce((acc, p) => {
            acc[p.id] = p.defaultValue;
            return acc;
        }, {} as Record<string, number>);
        setParamValues(initialValues);
    }, [parameters]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setMeterLevel({
                l: Math.random() * 95 + 5,
                r: Math.random() * 95 + 5
            });
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const handleParamChange = useCallback((id: string, value: number) => {
        setParamValues(prev => ({...prev, [id]: value}));
    }, []);

    const knobsToRender = parameters.filter(p => p.type === 'range');

    if (knobsToRender.length === 0) {
        return (
            <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold text-primary mb-6">Visual Interface Builder</h3>
                <p className="text-secondary mt-2">This plugin has no visual controls (like knobs or sliders) to display.</p>
                <p className="text-secondary mt-1">You can view its full details in the 'Parameters' tab.</p>
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col">
            <h3 className="text-xl font-bold text-primary mb-6">Visual Interface Builder</h3>
            <div className="flex-grow bg-background/50 border border-surface rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {knobsToRender.map(param => (
                        <Knob 
                            key={param.id} 
                            label={param.name} 
                            value={paramValues[param.id] || 0} 
                            min={param.min} 
                            max={param.max}
                            onValueChange={(val) => handleParamChange(param.id, val)}
                            playTone={playTone}
                            stopTone={stopTone}
                            initAudio={initAudio}
                        />
                    ))}
                </div>
            </div>
             <div className="flex-shrink-0 mt-6 p-4 bg-background/50 border border-surface rounded-xl flex items-center gap-6">
                <div className="flex-grow h-[150px]">
                    <WaveformDisplay />
                </div>
                <div className="flex-shrink-0 flex items-end gap-4">
                     <div className="flex items-center gap-2">
                        <LevelMeter value={meterLevel.l}/>
                        <LevelMeter value={meterLevel.r}/>
                    </div>
                    <Fader />
                </div>
            </div>
        </div>
    );
};


const ParametersView: React.FC<{ parameters: PluginTemplate['parameters'] }> = ({ parameters }) => (
     <div className="p-8 h-full">
        <h3 className="text-xl font-bold text-primary mb-6">Plugin Parameters</h3>
        <div className="bg-surface rounded-lg border border-background overflow-hidden">
            <table className="w-full text-sm text-left text-secondary">
                <thead className="bg-background/50 text-xs text-secondary uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3">ID</th>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">Type</th>
                        <th scope="col" className="px-6 py-3">Default</th>
                        <th scope="col" className="px-6 py-3">Range</th>
                    </tr>
                </thead>
                <tbody>
                    {parameters.map((p) => (
                        <tr key={p.id} className="border-b border-background">
                            <td className="px-6 py-4 font-mono text-accent">{p.id}</td>
                            <td className="px-6 py-4 font-semibold text-primary">{p.name}</td>
                            <td className="px-6 py-4">{p.type}</td>
                            <td className="px-6 py-4">{p.defaultValue}</td>
                            <td className="px-6 py-4">{p.min !== undefined && p.max !== undefined ? `${p.min} - ${p.max}` : 'N/A'}</td>
                        </tr>
                    ))}
                     {parameters.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-secondary">This plugin has no parameters defined.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const TestView: React.FC = () => (
     <div className="p-8 h-full">
        <h3 className="text-xl font-bold text-primary mb-6">Real-time Performance Test</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface p-6 rounded-lg border border-background text-center">
                <h4 className="text-sm font-semibold text-secondary uppercase">Latency</h4>
                <p className="text-4xl font-bold text-vivid-sky-blue mt-2">1.2<span className="text-2xl text-secondary">ms</span></p>
            </div>
            <div className="bg-surface p-6 rounded-lg border border-background text-center">
                <h4 className="text-sm font-semibold text-secondary uppercase">CPU Load</h4>
                <p className="text-4xl font-bold text-hot-pink mt-2">4.7<span className="text-2xl text-secondary">%</span></p>
            </div>
            <div className="bg-surface p-6 rounded-lg border border-background text-center">
                <h4 className="text-sm font-semibold text-secondary uppercase">Memory</h4>
                <p className="text-4xl font-bold text-accent mt-2">24.1<span className="text-2xl text-secondary">MB</span></p>
            </div>
        </div>
         <div className="mt-8 bg-surface p-4 rounded-lg border border-background">
            <p className="text-sm text-green-400 font-semibold">✅ All tests passed successfully.</p>
        </div>
    </div>
);

const ConsoleView: React.FC<{ messages: string[] }> = ({ messages }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="p-4 h-full bg-[#1E1E1E] rounded-b-xl flex flex-col">
            <div className="flex-grow overflow-y-auto">
                <pre className="text-xs text-secondary font-mono whitespace-pre-wrap">
                    {messages.map((msg, i) => <div key={i} dangerouslySetInnerHTML={{ __html: msg }} />)}
                </pre>
                 <div ref={endOfMessagesRef} />
            </div>
        </div>
    );
};


const PublishView: React.FC = () => (
     <div className="p-8 h-full max-w-lg mx-auto">
        <h3 className="text-xl font-bold text-primary mb-6">Publish Plugin</h3>
        <div className="space-y-4">
            <div>
                <label htmlFor="pluginName" className="block text-sm font-medium text-secondary mb-1">Plugin Name</label>
                <input type="text" id="pluginName" className="w-full bg-surface border border-background rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
                <label htmlFor="version" className="block text-sm font-medium text-secondary mb-1">Version</label>
                <input type="text" id="version" placeholder="e.g., 1.0.0" className="w-full bg-surface border border-background rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-secondary mb-1">Description</label>
                <textarea id="description" rows={4} className="w-full bg-surface border border-background rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"></textarea>
            </div>
            <button className="w-full bg-accent text-primary font-semibold py-3 rounded-lg hover:bg-accent-hover transition-colors">
                Submit for Review
            </button>
        </div>
    </div>
);

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


const AIGenerateView: React.FC<{ onPluginGenerated: (template: PluginTemplate, source: 'ai') => void; log: (message: string) => void; }> = ({ onPluginGenerated, log }) => {
    const [prompt, setPrompt] = useState('');
    const [framework, setFramework] = useState<'JUCE' | 'Web Audio'>('JUCE');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedPlugin, setGeneratedPlugin] = useState<PluginTemplate | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a description for the plugin.");
            return;
        }
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
    
    return (
        <div className="p-8 h-full flex flex-col items-center justify-center">
            {isLoading && <Loader message="Generating with Amapiano AI..." />}
            <div className="w-full max-w-3xl text-center">
                 <h3 className="text-2xl font-bold text-primary mb-2">Create Anything</h3>
                <p className="text-secondary mb-6 max-w-xl mx-auto">Describe the plugin, module, or instrument you can imagine. Our AI will bring it to life.</p>
                
                <div className="bg-surface p-4 rounded-xl border border-background">
                    <textarea 
                        placeholder="e.g., 'A wobbly lo-fi chorus effect with wow and flutter knobs'" 
                        rows={3} 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-background border border-surface rounded-md py-3 px-4 text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />

                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-2 p-1 bg-background rounded-lg">
                            <button onClick={() => setFramework('JUCE')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${framework === 'JUCE' ? 'bg-accent text-white' : 'text-secondary hover:bg-surface'}`}>JUCE (C++)</button>
                            <button onClick={() => setFramework('Web Audio')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${framework === 'Web Audio' ? 'bg-accent text-white' : 'text-secondary hover:bg-surface'}`}>Web Audio (JS)</button>
                        </div>

                         <button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto bg-accent text-primary font-semibold py-2.5 px-6 rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                            <AiGenerateIcon />
                            <span>Generate Plugin</span>
                        </button>
                    </div>
                </div>

                {error && <p className="mt-4 text-hot-pink">{error}</p>}
            </div>

            {generatedPlugin && (
                <div className="mt-8 w-full max-w-md">
                    <AIGeneratedTemplateCard template={generatedPlugin} onSelect={() => onPluginGenerated(generatedPlugin, 'ai')} />
                </div>
            )}
        </div>
    );
};


// --- Main IDE Component ---

type Tab = 'AI Generate' | 'Templates' | 'Modules' |'Code Editor' | 'Visual Builder' | 'Parameters' | 'Test' | 'Console' | 'Publish';

const IdeTab: React.FC<{ icon: React.ReactNode; label: Tab; activeTab: Tab; onClick: (tab: Tab) => void; }> = ({ icon, label, activeTab, onClick }) => (
    <button
        onClick={() => onClick(label)}
        className={`flex items-center px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === label ? 'border-accent text-primary' : 'border-transparent text-secondary hover:text-primary hover:border-surface'}`}
    >
        {icon}
        {label}
    </button>
);

const ActionButton: React.FC<{ children: React.ReactNode; primary?: boolean; className?: string; onClick?: () => void; disabled?: boolean; }> = ({ children, primary, className = '', onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${primary ? 'bg-accent text-primary hover:bg-accent-hover' : 'bg-surface text-primary hover:bg-background'} ${className}`}>
        {children}
    </button>
);


const PluginDevelopmentIDE: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('Templates');
    const [activeProject, setActiveProject] = useState<PluginTemplate | null>(null);
    const [projectCode, setProjectCode] = useState<string>('');
    const [consoleMessages, setConsoleMessages] = useState<string[]>(['Welcome to Amapiano AI Plugin IDE.']);
    const [isProcessing, setIsProcessing] = useState(false); // For both compiling and AI module adding
    const [contentKey, setContentKey] = useState(0); // Used to re-trigger animation

    useEffect(() => {
        if (activeProject) {
            setProjectCode(activeProject.code);
        } else {
            setProjectCode('');
        }
    }, [activeProject]);

    useEffect(() => {
        setContentKey(prev => prev + 1);
    }, [activeTab, activeProject]);


    const logToConsole = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setConsoleMessages(prev => [...prev, `<span class="text-gray-500">[${timestamp}]</span> ${message}`]);
    };

    const handleSelectTemplate = (template: PluginTemplate, source: 'template' | 'ai' = 'template') => {
        setActiveProject(template);
        if (source === 'ai') {
             logToConsole(`🤖 AI-Generated Plugin "<span class="text-accent-hover font-semibold">${template.name}</span>" loaded. Check out its controls in the Visual Builder!`);
        } else {
            logToConsole(`📄 Template "<span class="text-accent-hover font-semibold">${template.name}</span>" loaded.`);
        }
        setActiveTab('Visual Builder');
    };
    
    const handleCloseProject = () => {
        if (activeProject) {
            logToConsole(`Project "<span class="text-accent-hover font-semibold">${activeProject.name}</span>" closed.`);
        }
        setActiveProject(null);
        setActiveTab('Templates');
    };

    const handleCompile = () => {
        if (!activeProject) return;
        setIsProcessing(true);
        setActiveTab('Console');
        logToConsole(`Starting compilation for "${activeProject.name}"...`);
        setTimeout(() => {
            logToConsole("✓ C++ files processed.");
            setTimeout(() => {
                logToConsole("✓ Linking WebAssembly module.");
                setTimeout(() => {
                    logToConsole("✨ Build successful! Artifacts ready in /build folder.");
                    setIsProcessing(false);
                }, 800);
            }, 1000);
        }, 1200);
    };
    
    const handleAddModule = async (moduleName: string, moduleDescription: string) => {
        if (!activeProject) return;

        setIsProcessing(true);
        setActiveTab('Console');
        logToConsole(`🧠 Instructing AI to add <span class="text-vivid-sky-blue font-semibold">'${moduleName}'</span> module...`);

        try {
            const updatedProject = await addModuleToProject(activeProject, moduleName, moduleDescription);
            setActiveProject(updatedProject);
            logToConsole(`✅ AI successfully integrated the <span class="text-vivid-sky-blue font-semibold">'${moduleName}'</span> module.`);
            logToConsole(`🚀 Switched to Visual Builder to see the new controls!`);
            setActiveTab('Visual Builder');
        } catch (e: any) {
            logToConsole(`<span class="text-hot-pink">❌ AI Module Integration Failed: ${e.message}</span>`);
        } finally {
            setIsProcessing(false);
        }
    };


    const renderContent = () => {
        const noProject = !activeProject && !['Templates', 'AI Generate'].includes(activeTab);
        if (noProject) {
             return (
                <div className="p-8 text-center text-secondary h-full flex flex-col justify-center items-center">
                    <h3 className="text-xl font-semibold text-primary">No Active Project</h3>
                    <p className="mt-2">Please select a template or use AI Generate to begin.</p>
                     <button onClick={() => setActiveTab('Templates')} className="mt-4 bg-accent text-primary font-semibold py-2 px-4 rounded-lg hover:bg-accent-hover transition-colors">
                        Go to Templates
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case 'Templates':
                return <TemplatesView onSelectTemplate={handleSelectTemplate} />;
            case 'Modules':
                return activeProject && <ModulesView onAddModule={handleAddModule} isProcessing={isProcessing} />;
            case 'Code Editor':
                return activeProject && <CodeEditorView code={projectCode} onCodeChange={setProjectCode} />;
            case 'Visual Builder':
                return activeProject && <VisualBuilderView parameters={activeProject.parameters} />;
            case 'Parameters':
                return activeProject && <ParametersView parameters={activeProject.parameters} />;
            case 'Test':
                return activeProject && <TestView />;
            case 'Console':
                return <ConsoleView messages={consoleMessages} />;
            case 'Publish':
                return activeProject && <PublishView />;
            case 'AI Generate':
                return <AIGenerateView onPluginGenerated={handleSelectTemplate} log={logToConsole} />;
            default:
                return null;
        }
    };
    
    const projectName = activeProject ? `${activeProject.name}` : "Untitled Plugin";

    return (
        <div className="bg-surface rounded-xl border border-background shadow-2xl overflow-hidden shadow-accent-glow/10">
            {/* IDE Header */}
            <div className="p-4 flex items-center justify-between border-b border-background bg-surface/80 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                    <div className="text-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-primary">Plugin Development IDE</h1>
                        <div className="flex items-center text-xs text-secondary space-x-2 mt-1">
                            <span>{projectName}</span>
                            {activeProject && <span className="bg-vivid-sky-blue/20 text-vivid-sky-blue px-2 py-0.5 rounded-full font-semibold">{activeProject.framework}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <ActionButton disabled={!activeProject}><SaveIcon /> Save</ActionButton>
                    <ActionButton primary onClick={handleCompile} disabled={!activeProject || isProcessing}>
                         {isProcessing ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : null}
                        {isProcessing ? 'Processing...' : 'Compile'}
                    </ActionButton>
                    <ActionButton onClick={() => setActiveTab('Test')} disabled={!activeProject}>Test</ActionButton>
                    <ActionButton onClick={() => setActiveTab('Publish')} disabled={!activeProject}>Publish</ActionButton>
                    {activeProject &&
                        <button onClick={handleCloseProject} className="text-secondary hover:text-primary ml-2" title="Close Project">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    }
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center border-b border-background overflow-x-auto">
                <IdeTab icon={<AiGenerateIcon />} label="AI Generate" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<TemplateIcon />} label="Templates" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<HomeIcon />} label="Modules" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<CodeIcon />} label="Code Editor" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<VisualBuilderIcon />} label="Visual Builder" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<ParametersIcon />} label="Parameters" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<TestIcon />} label="Test" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<ConsoleIcon />} label="Console" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<PublishIcon />} label="Publish" activeTab={activeTab} onClick={setActiveTab} />
            </div>

            {/* Tab Content */}
            <div key={contentKey} className="bg-background min-h-[70vh] animate-fade-in">
                {renderContent()}
            </div>
        </div>
    );
};

export default PluginDevelopmentIDE;