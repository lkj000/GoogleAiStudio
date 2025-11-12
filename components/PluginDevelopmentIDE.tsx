
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AiGenerateIcon, CodeIcon, ConsoleIcon, ParametersIcon, PublishIcon, SaveIcon, TemplateIcon, TestIcon, VisualBuilderIcon, DownloadIcon, SignalChainIcon, TimeStretchIcon, MidiHumanizerIcon, ArrangementIcon, ShareIcon, DocsIcon, PresetsIcon, AnalyzeIcon, DawIcon, SocialIcon, LogsIcon, SnapshotIcon, CompareIcon, AnalysisReportIcon, StemSeparatorIcon, MusicGenIcon } from './icons';
import TemplatesView from './TemplatesView';
import { PluginTemplate, ArrangementPattern, ArrangementSection, LogEntry, ProjectSnapshot } from '../types';
import { generatePluginFromDescription, addModuleToProject, generatePluginFromSmartTemplate, refactorSignalChain } from '../services/geminiService';
import Loader from './Loader';
import ConsoleView from './ConsoleView';
import LogsView from './LogsView';
import VisualBuilderView from './VisualBuilderView';
import SignalPatcher from './SignalPatcher';
import * as audioEngine from '../services/audioEngine';
import AutoTimeStretchView from './AutoTimeStretchView';
import MidiHumanizerView from './MidiHumanizerView';
import ArrangementAssistantView from './ArrangementAssistantView';
import ShareView from './ShareView';
import DocsView from './DocsView';
import ErrorAlert from './ErrorAlert';
import PresetsView from './PresetsView';
import AnalyzeView from './AnalyzeView';
import DAWView from './DAWView';
import CommunityView from './CommunityView';
import AIGenerateView from './AIGenerateView';
import SuggestionPrompts from './SuggestionPrompts';
import SnapshotCompareView from './CompareView';
import CompetitiveAnalysisView from './CompetitiveAnalysisView';
import StemSeparationView from './StemSeparationView';
import MusicGenView from './MusicGenView';


// --- New View Components ---

const highlightCode = (code: string, framework: 'JUCE' | 'Web Audio') => {
    if (!code) return '';
    let highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Use a placeholder trick to avoid re-highlighting already processed tokens
    const replacements: string[] = [];
    
    // 1. Comments and Strings first, as they can contain anything
    highlighted = highlighted.replace(/(".*?"|'.*?'|\/\/.*|\/\*[\s\S]*?\*\/)/g, (match) => {
        let style = '';
        if (match.startsWith('//') || match.startsWith('/*')) {
            style = 'color: #6A9955;'; // Green for comments
        } else if (match.startsWith('"') || match.startsWith("'")) {
            style = 'color: #CE9178;'; // Orange for strings
        }
        
        replacements.push(`<span style="${style}">${match}</span>`);
        return `__REPLACE_${replacements.length - 1}__`;
    });

    const juceKeywords = [
        'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor',
        'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t',
        'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
        'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype',
        'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum',
        'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto',
        'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept',
        'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private',
        'protected', 'public', 'register', 'reinterpret_cast', 'requires', 'return',
        'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast',
        'struct', 'switch', 'template', 'this', 'thread_local', 'throw', 'true',
        'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using',
        'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq',
        'override' // JUCE specific
    ];
    const webAudioKeywords = [
        'class', 'constructor', 'this', 'const', 'let', 'var', 'return', 'if', 
        'else', 'for', 'while', 'new', 'function', 'true', 'false', 'import', 
        'export', 'from', 'async', 'await', 'extends', 'super', 'get', 'set', 'static'
    ];
    const keywords = framework === 'JUCE' ? juceKeywords : webAudioKeywords;
    const controlKeywords = ['if', 'for', 'while', 'switch', 'catch', 'try'];

    // 2. Preprocessor directives (JUCE only)
    if (framework === 'JUCE') {
        highlighted = highlighted.replace(/(^|\n)(#\w+.*)/g, '$1<span style="color: #C586C0;">$2</span>');
    }
    
    // 3. Types/Classes (PascalCase and std/juce namespaces)
    if (framework === 'JUCE') {
         highlighted = highlighted.replace(/\b(juce::\w+|std::\w+)\b/g, '<span style="color: #4EC9B0;">$1</span>');
         highlighted = highlighted.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span style="color: #4EC9B0;">$1</span>');
    }

    // 4. Keywords
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    highlighted = highlighted.replace(keywordRegex, '<span style="color: #569CD6;">$1</span>');

    // 5. Function Calls
    highlighted = highlighted.replace(/\b([a-zA-Z_][\w]*)\s*(?=\()/g, (match) => {
        if (controlKeywords.includes(match)) {
            return match;
        }
        return `<span style="color: #DCDCAA;">${match}</span>`;
    });

    // 6. Numbers
    highlighted = highlighted.replace(/\b([0-9.]+f?)\b/g, '<span style="color: #B5CEA8;">$1</span>');

    // Put back the comments and strings
    highlighted = highlighted.replace(/__REPLACE_(\d+)__/g, (match, index) => {
        return replacements[parseInt(index)];
    });

    return highlighted;
};

const CodeEditorView: React.FC<{ code: string; onCodeChange: (newCode: string) => void; framework: 'JUCE' | 'Web Audio' }> = ({ code, onCodeChange, framework }) => {
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const highlightRef = useRef<HTMLPreElement>(null);

    const highlightedCode = React.useMemo(() => highlightCode(code, framework), [code, framework]);

    const syncScroll = () => {
        if (editorRef.current && highlightRef.current) {
            highlightRef.current.scrollTop = editorRef.current.scrollTop;
            highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
        }
    };
    
    return (
        <div className="p-4 h-full flex flex-col">
            <div className="relative w-full flex-grow">
                <pre 
                    ref={highlightRef} 
                    aria-hidden="true" 
                    className="absolute top-0 left-0 w-full h-full m-0 p-4 bg-[#1E1E1E] text-secondary font-mono text-sm rounded-lg border border-surface overflow-auto pointer-events-none"
                >
                    <code dangerouslySetInnerHTML={{ __html: highlightedCode + '<br>' }} />
                </pre>
                <textarea 
                    ref={editorRef}
                    className="w-full h-full bg-transparent text-transparent caret-white font-mono text-sm p-4 rounded-lg border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-accent resize-none absolute top-0 left-0"
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    onScroll={syncScroll}
                    spellCheck="false"
                />
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
                        <th scope="col" className="px-6 py-3">Unit</th>
                        <th scope="col" className="px-6 py-3">Affects</th>
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
                            <td className="px-6 py-4">{p.unit || 'N/A'}</td>
                            <td className="px-6 py-4">
                                {p.affects ? (
                                    <span className="bg-vivid-sky-blue/20 text-vivid-sky-blue text-xs font-semibold px-2 py-1 rounded-full">{p.affects}</span>
                                ) : 'N/A'}
                            </td>
                        </tr>
                    ))}
                     {parameters.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center py-8 text-secondary">This plugin has no parameters defined.</td>
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

// --- Main IDE Component ---

type Tab = 'AI Generate' | 'Templates' | 'Social' | 'Time Stretch' | 'MIDI Humanizer' | 'Arrangement' | 'DAW' | 'Stem Separation' | 'Music Gen' | 'AI Mix Assist' | 'Analysis' | 'Signal Chain' | 'Code Editor' | 'Visual Builder' | 'Parameters' | 'Presets' | 'Test' | 'Console' | 'Logs' | 'Share' | 'Docs' | 'Publish' | 'Snapshot Compare';

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

const initialPatterns: ArrangementPattern[] = [
    { id: 'p1', name: 'Log Drum Groove A', type: 'Drums', notes: [ { pitch: 60, start: 0, duration: 1, velocity: 100 }, { pitch: 60, start: 3, duration: 0.5, velocity: 90 } ] },
    { id: 'p2', name: 'Shaker Loop', type: 'Drums', notes: [ { pitch: 76, start: 0.5, duration: 0.25, velocity: 80 }, { pitch: 76, start: 1.5, duration: 0.25, velocity: 80 } ] },
    { id: 'p3', name: 'Sub Bass Line 1', type: 'Bass', notes: [ { pitch: 36, start: 0, duration: 4, velocity: 110 } ] },
    { id: 'p4', name: 'Pad Chord Progression', type: 'Chords', notes: [ { pitch: 72, start: 0, duration: 4, velocity: 90 }, { pitch: 76, start: 0, duration: 4, velocity: 90 } ] },
    { id: 'p5', name: 'Vocal Chop FX', type: 'FX', notes: [ { pitch: 84, start: 2, duration: 1, velocity: 100 } ] },
    { id: 'p6', name: 'Synth Lead Riff', type: 'Lead', notes: [ { pitch: 81, start: 0, duration: 0.5, velocity: 120 }, { pitch: 79, start: 1, duration: 0.5, velocity: 120 } ] },
];

const initialArrangement: ArrangementSection[] = [
    { name: 'Intro', length: 8, patterns: [] },
    { name: 'Verse', length: 16, patterns: [] },
    { name: 'Chorus', length: 16, patterns: [] },
    { name: 'Verse', length: 16, patterns: [] },
    { name: 'Chorus', length: 16, patterns: [] },
    { name: 'Outro', length: 8, patterns: [] },
];

const PluginDevelopmentIDE: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('Templates');
    const [activeProject, setActiveProject] = useState<PluginTemplate | null>(null);
    const [projectCode, setProjectCode] = useState<string>('');
    const [snapshots, setSnapshots] = useState<Record<string, ProjectSnapshot[]>>({});
    const [consoleMessages, setConsoleMessages] = useState<string[]>(['Welcome to Amapiano AI Plugin IDE.']);
    const [runtimeLogs, setRuntimeLogs] = useState<LogEntry[]>([]);
    const [isProcessing, setIsProcessing] = useState(false); // For both compiling and AI module adding
    const [compilationSuccess, setCompilationSuccess] = useState(false);
    const [compileProgress, setCompileProgress] = useState<number | null>(null);
    const [contentKey, setContentKey] = useState(0); // Used to re-trigger animation
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [paramValues, setParamValues] = useState<Record<string, number>>({});
    const [patterns, setPatterns] = useState<ArrangementPattern[]>(initialPatterns);
    const [arrangement, setArrangement] = useState<ArrangementSection[]>(initialArrangement);

    const analyserNode = useRef<AnalyserNode | null>(null);

    const logToConsole = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setConsoleMessages(prev => [...prev, `<span class="text-gray-500">[${timestamp}]</span> ${message}`]);
    }, []);
    
    const logToRuntimeConsole = useCallback((log: LogEntry) => {
        setRuntimeLogs(prev => [...prev, log]);
    }, []);
    
    const handleClearRuntimeLogs = () => {
        setRuntimeLogs([]);
    };

    // Auto-save to localStorage
    useEffect(() => {
        if (activeProject) {
            try {
                const projectJson = JSON.stringify({ project: activeProject, code: projectCode, arrangement, patterns, allSnapshots: snapshots });
                localStorage.setItem('amapiano-ai-autosave', projectJson);
            } catch (error) {
                console.error("Auto-save failed:", error);
            }
        } else {
            localStorage.removeItem('amapiano-ai-autosave');
        }
    }, [activeProject, projectCode, arrangement, patterns, snapshots]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedProjectJson = localStorage.getItem('amapiano-ai-autosave');
            if (savedProjectJson) {
                const savedState = JSON.parse(savedProjectJson);
                if (savedState.project && savedState.project.id) {
                    setActiveProject(savedState.project);
                    setProjectCode(savedState.code || savedState.project.code);
                    setArrangement(savedState.arrangement || initialArrangement);
                    setPatterns(savedState.patterns || initialPatterns);
                    setSnapshots(savedState.allSnapshots || {});
                    const timestamp = new Date().toLocaleTimeString();
                    setConsoleMessages(prev => [...prev, `<span class="text-gray-500">[${timestamp}]</span> Restored auto-saved project: <span class="text-accent-hover font-semibold">${savedState.project.name}</span>`]);
                    setActiveTab('Visual Builder');
                }
            }
        } catch (error) {
            console.error("Failed to load auto-saved project:", error);
            localStorage.removeItem('amapiano-ai-autosave'); // Clear corrupted data
        }
    }, []);

    const handleSelectTemplate = useCallback((template: PluginTemplate, source: 'template' | 'ai' = 'template') => {
        setCompilationSuccess(false);
        setActiveProject(template);
        if (source === 'ai') {
             logToConsole(`🤖 AI-Generated Plugin "<span class="text-accent-hover font-semibold">${template.name}</span>" loaded. Check out its controls in the Visual Builder!`);
        } else {
            logToConsole(`📄 Template "<span class="text-accent-hover font-semibold">${template.name}</span>" loaded.`);
        }
        setActiveTab('Visual Builder');
    }, [logToConsole]);
    
    const handleLoadCommunityPlugin = useCallback((plugin: PluginTemplate) => {
        setCompilationSuccess(false);
        setActiveProject(plugin);
        logToConsole(`🌐 Community plugin "<span class="text-accent-hover font-semibold">${plugin.name}</span>" loaded.`);
        setActiveTab('Visual Builder');
    }, [logToConsole]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const projectData = urlParams.get('project');

        if (projectData) {
            try {
                // Unicode-safe base64 decoding
                const decodedJson = decodeURIComponent(atob(projectData));
                const project: PluginTemplate = JSON.parse(decodedJson);
                if (project && project.id && project.name) {
                    logToConsole(`🔗 Loaded shared project: <span class="text-accent-hover font-semibold">${project.name}</span>`);
                    handleSelectTemplate(project, 'ai');
                    // Clean up the URL to avoid reloading the same project on refresh
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (error) {
                console.error("Failed to load shared project from URL:", error);
                logToConsole('<span class="text-hot-pink">Error: Could not load the shared project. The link may be corrupted.</span>');
            }
        }
    }, [logToConsole, handleSelectTemplate]);

    useEffect(() => {
        const init = async () => {
            try {
                const analyser = await audioEngine.init();
                analyserNode.current = analyser;
                setIsAudioReady(true);
            } catch (error: any) {
                console.error("Failed to initialize audio engine:", error);
                const userMessage = "Audio engine failed to start. Please allow microphone access or refresh the page.";
                logToConsole(`<span class="text-hot-pink">Error: ${userMessage}</span>`);
                setGlobalError(userMessage);
            }
        };
        init();
    }, [logToConsole]);

    useEffect(() => {
        if (activeProject) {
            setProjectCode(activeProject.code);
            setRuntimeLogs([]); // Clear logs when project changes

            const initialValues = activeProject.parameters.reduce((acc, p) => {
                acc[p.id] = p.defaultValue;
                return acc;
            }, {} as Record<string, number>);
            setParamValues(initialValues);
        } else {
            setProjectCode('');
        }
    }, [activeProject]);

    useEffect(() => {
        setContentKey(prev => prev + 1);
    }, [activeTab, activeProject]);

    const handleParamChange = useCallback((id: string, value: number) => {
        setParamValues(prev => ({...prev, [id]: value}));
    }, []);

    const handleApplyPreset = useCallback((values: Record<string, number>) => {
        setParamValues(values);
    }, []);
    
    const handleCloseProject = () => {
        if (activeProject) {
            logToConsole(`Project "<span class="text-accent-hover font-semibold">${activeProject.name}</span>" closed.`);
        }
        setActiveProject(null);
        setCompilationSuccess(false);
        setActiveTab('Templates');
    };

    const handleCompile = async () => {
        if (!activeProject) return;
        setCompilationSuccess(false);
        setIsProcessing(true);
        setCompileProgress(0);
        setActiveTab('Console');
        logToConsole(`Starting cloud build for "${activeProject.name}"...`);

        const steps = [
            "Packaging source files...",
            "Authenticating with build service...",
            "Uploading (5.2 MB)...",
            "Build queued on `macos-arm64` runner...",
            "Installing JUCE dependencies...",
            "Compiling PluginProcessor.cpp...",
            "Compiling PluginEditor.cpp...",
            "Linking...",
            "Signing artifact...",
        ];
        
        for (const [index, step] of steps.entries()) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
            logToConsole(`✓ ${step}`);
            setCompileProgress(((index + 1) / steps.length) * 100);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        logToConsole("✨ Build successful! Artifacts ready for export.");
        setIsProcessing(false);
        setCompilationSuccess(true);
    };
    
    const handleAddModule = async (moduleName: string, moduleDescription: string) => {
        if (!activeProject) return;
        setCompilationSuccess(false);
        setCompileProgress(null);
        setIsProcessing(true);
        setActiveTab('Console');
        logToConsole(`🧠 Instructing AI to add <span class="text-vivid-sky-blue font-semibold">'${moduleName}'</span> module...`);

        try {
            const updatedProject = await addModuleToProject(activeProject, moduleName, moduleDescription);
            setActiveProject(updatedProject);
            logToConsole(`✅ AI successfully integrated the <span class="text-vivid-sky-blue font-semibold">'${moduleName}'</span> module.`);
            logToConsole(`🚀 The new module has been added to your Signal Chain!`);
            setActiveTab('Signal Chain');
        } catch (e: any) {
            logToConsole(`<span class="text-hot-pink">❌ AI Module Integration Failed: ${e.message}</span>`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReorderChain = async (newChain: string[]) => {
        if (!activeProject) return;
        setCompilationSuccess(false);
        setCompileProgress(null);
        setIsProcessing(true);
        setActiveTab('Console');
        logToConsole(`🧠 Instructing AI to refactor signal chain...`);
        try {
            const updatedProject = await refactorSignalChain(activeProject, newChain);
            setActiveProject(updatedProject);
            logToConsole(`✅ AI successfully refactored the signal chain order.`);
        } catch (e: any) {
             logToConsole(`<span class="text-hot-pink">❌ AI Signal Chain Refactor Failed: ${e.message}</span>`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTakeSnapshot = () => {
        if (!activeProject) return;
        const snapshotName = prompt("Enter a name for this snapshot:", `Snapshot at ${new Date().toLocaleTimeString()}`);
        if (snapshotName) {
            const newSnapshot: ProjectSnapshot = {
                id: crypto.randomUUID(),
                name: snapshotName,
                timestamp: new Date().toISOString(),
                project: { ...activeProject, code: projectCode }
            };
            setSnapshots(prev => ({
                ...prev,
                [activeProject.id]: [...(prev[activeProject.id] || []), newSnapshot]
            }));
            logToConsole(`📸 Snapshot created: <span class="font-semibold">${snapshotName}</span>`);
        }
    };

    const handleRestoreSnapshot = (snapshot: ProjectSnapshot) => {
        if (window.confirm(`Are you sure you want to restore "${snapshot.name}"? This will overwrite your current unsaved changes.`)) {
            setActiveProject(snapshot.project);
            logToConsole(`⏪ Restored from snapshot: <span class="font-semibold">${snapshot.name}</span>`);
            setActiveTab('Visual Builder');
        }
    };

    const renderContent = () => {
        const noProjectViews: Tab[] = ['Templates', 'AI Generate', 'Social', 'Time Stretch', 'MIDI Humanizer', 'Arrangement', 'DAW', 'Stem Separation', 'Music Gen', 'Analysis', 'Console', 'Logs', 'Docs', 'Snapshot Compare'];
        if (activeTab === 'Analysis') return <CompetitiveAnalysisView />;

        const noProject = !activeProject && !noProjectViews.includes(activeTab);

        if (noProject) {
             return <SuggestionPrompts />;
        }

        switch (activeTab) {
            case 'Templates':
                return <TemplatesView onSelectTemplate={handleSelectTemplate} />;
            case 'Social':
                return <CommunityView onLoadPlugin={handleLoadCommunityPlugin} />;
            case 'Time Stretch':
                return <AutoTimeStretchView />;
            case 'MIDI Humanizer':
                return <MidiHumanizerView />;
            case 'Arrangement':
                return <ArrangementAssistantView patterns={patterns} arrangement={arrangement} onArrangementChange={setArrangement} />;
            case 'DAW':
                return <DAWView />;
            case 'Stem Separation':
                return <StemSeparationView />;
             case 'Music Gen':
                return <MusicGenView />;
            case 'AI Mix Assist':
                return activeProject && <AnalyzeView project={activeProject} analyserNode={analyserNode.current} paramValues={paramValues} log={logToConsole} />;
            case 'Signal Chain':
                return activeProject && <SignalPatcher project={activeProject} onReorder={handleReorderChain} onAddModule={handleAddModule} isProcessing={isProcessing} />;
            case 'Code Editor':
                return activeProject && <CodeEditorView code={projectCode} onCodeChange={setProjectCode} framework={activeProject.framework} />;
            case 'Visual Builder':
                return activeProject && <VisualBuilderView project={activeProject} analyserNode={analyserNode.current} paramValues={paramValues} onParamChange={handleParamChange} />;
            case 'Parameters':
                return activeProject && <ParametersView parameters={activeProject.parameters} />;
            case 'Presets':
                return activeProject && <PresetsView project={activeProject} log={logToConsole} onApplyPreset={handleApplyPreset} />;
            case 'Test':
                return activeProject && <TestView />;
            case 'Console':
                return <ConsoleView messages={consoleMessages} compilationSuccess={compilationSuccess} project={activeProject} isProcessing={isProcessing} compileProgress={compileProgress} />;
            case 'Logs':
                return <LogsView logs={runtimeLogs} onClear={handleClearRuntimeLogs} isWebAudioProject={activeProject?.framework === 'Web Audio'} />;
            case 'Share':
                return activeProject && <ShareView project={activeProject} />;
            case 'Docs':
                return <DocsView project={activeProject} log={logToConsole} />;
            case 'Publish':
                return activeProject && <PublishView />;
            case 'AI Generate':
                return <AIGenerateView onPluginGenerated={handleSelectTemplate} log={logToConsole} />;
            case 'Snapshot Compare':
                return activeProject && <SnapshotCompareView project={activeProject} code={projectCode} snapshots={snapshots[activeProject.id] || []} onRestore={handleRestoreSnapshot} />;
            default:
                return null;
        }
    };
    
    const projectName = activeProject ? `${activeProject.name}` : "Amapiano AI Suite";

    return (
        <div className="bg-surface rounded-xl border border-background shadow-2xl overflow-hidden shadow-accent-glow/10">
            {globalError && <ErrorAlert message={globalError} onDismiss={() => setGlobalError(null)} />}
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
                    <ActionButton onClick={handleTakeSnapshot} disabled={!activeProject}><SnapshotIcon /> Snapshot</ActionButton>
                    <ActionButton primary onClick={handleCompile} disabled={!activeProject || isProcessing}>
                         {isProcessing && compileProgress !== null ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : null}
                        {isProcessing ? 'Processing...' : 'Compile'}
                    </ActionButton>
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
                <IdeTab icon={<SocialIcon />} label="Social" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<AnalysisReportIcon />} label="Analysis" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<StemSeparatorIcon />} label="Stem Separation" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<MusicGenIcon />} label="Music Gen" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<TimeStretchIcon />} label="Time Stretch" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<MidiHumanizerIcon />} label="MIDI Humanizer" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<ArrangementIcon />} label="Arrangement" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<DawIcon />} label="DAW" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<AnalyzeIcon />} label="AI Mix Assist" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<CompareIcon />} label="Snapshot Compare" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<SignalChainIcon />} label="Signal Chain" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<CodeIcon />} label="Code Editor" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<VisualBuilderIcon />} label="Visual Builder" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<ParametersIcon />} label="Parameters" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<PresetsIcon />} label="Presets" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<TestIcon />} label="Test" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<ConsoleIcon />} label="Console" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<LogsIcon />} label="Logs" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<ShareIcon />} label="Share" activeTab={activeTab} onClick={setActiveTab} />
                <IdeTab icon={<DocsIcon />} label="Docs" activeTab={activeTab} onClick={setActiveTab} />
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
