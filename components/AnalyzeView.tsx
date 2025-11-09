// components/AnalyzeView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PluginTemplate } from '../types';
import RealtimeSpectrogram from './RealtimeSpectrogram';
import * as audioAnalysis from '../services/audioAnalysisService';
import { getAudioFeedback } from '../services/geminiService';
import Loader from './Loader';

interface AnalyzeViewProps {
    project: PluginTemplate;
    analyserNode: AnalyserNode | null;
    paramValues: Record<string, number>;
    log: (message: string) => void;
}

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

const AnalyzeView: React.FC<AnalyzeViewProps> = ({ project, analyserNode, paramValues, log }) => {
    const [rms, setRms] = useState(0);
    const [peak, setPeak] = useState(0);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const timeDomainData = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (!analyserNode) return;
        
        analyserNode.fftSize = 2048; // A good size for both time and frequency
        timeDomainData.current = new Uint8Array(analyserNode.fftSize);

        const intervalId = setInterval(() => {
            if (timeDomainData.current) {
                analyserNode.getByteTimeDomainData(timeDomainData.current);
                const { rms, peak } = audioAnalysis.calculateVolume(timeDomainData.current);
                setRms(audioAnalysis.linearToDecibels(rms));
                setPeak(audioAnalysis.linearToDecibels(peak));
            }
        }, 100); // Update metrics 10x per second

        return () => clearInterval(intervalId);
    }, [analyserNode]);
    
    const handleAskAI = async () => {
        if (!userInput.trim() || !analyserNode) return;
        
        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        setChatHistory(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        // Get a snapshot of frequency data
        const freqData = new Uint8Array(analyserNode.frequencyBinCount);
        const freqSnapshot = audioAnalysis.getFrequencySnapshot(analyserNode, freqData);
        
        const currentAnalysis = {
            rms: rms,
            peak: peak,
            dominantFrequency: freqSnapshot.dominantFrequency,
            bass: freqSnapshot.bassLevel,
            mids: freqSnapshot.midLevel,
            treble: freqSnapshot.trebleLevel,
        };
        
        log(`🤖 Asking AI for feedback: "${userInput}"`);
        try {
            const aiResponse = await getAudioFeedback(userInput, project, paramValues, currentAnalysis);
            const aiMessage: ChatMessage = { sender: 'ai', text: aiResponse };
            setChatHistory(prev => [...prev, aiMessage]);
             log(`✅ AI responded with feedback.`);
        } catch (error: any) {
            const errorMessage: ChatMessage = { sender: 'ai', text: `Sorry, I encountered an error: ${error.message}`};
            setChatHistory(prev => [...prev, errorMessage]);
            log(`<span class="text-hot-pink">❌ AI feedback failed: ${error.message}</span>`);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (project.framework !== 'Web Audio') {
        return (
            <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold text-primary mb-2">Analysis Unavailable</h3>
                <p className="text-secondary mt-1">Real-time audio analysis is currently only available for Web Audio plugins.</p>
            </div>
        );
    }

    return (
        <div className="p-8 h-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            {isLoading && <Loader message="AI is analyzing your sound..." />}
            <div className="lg:col-span-2 flex flex-col gap-6">
                <h3 className="text-xl font-bold text-primary">Real-time Audio Analysis</h3>
                 <div className="flex-grow bg-background/50 border border-surface rounded-xl p-4 min-h-[200px]">
                     {analyserNode ? <RealtimeSpectrogram analyserNode={analyserNode} /> : <div className="flex items-center justify-center h-full text-secondary">Initializing visualizer...</div>}
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-background/50 border border-surface rounded-xl p-6 text-center">
                        <h4 className="text-sm font-semibold text-secondary uppercase">RMS Volume</h4>
                        <p className="text-4xl font-bold text-vivid-sky-blue mt-2">{rms > -100 ? rms.toFixed(1) : '-Inf'}<span className="text-2xl text-secondary">dBFS</span></p>
                    </div>
                    <div className="bg-background/50 border border-surface rounded-xl p-6 text-center">
                        <h4 className="text-sm font-semibold text-secondary uppercase">Peak Volume</h4>
                        <p className="text-4xl font-bold text-hot-pink mt-2">{peak > -100 ? peak.toFixed(1) : '-Inf'}<span className="text-2xl text-secondary">dBFS</span></p>
                    </div>
                 </div>
            </div>
            <div className="lg:col-span-1 bg-surface border border-background rounded-xl p-6 flex flex-col">
                 <h3 className="text-xl font-bold text-primary mb-4 flex-shrink-0">AI Mixing Assistant</h3>
                 <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2">
                    {chatHistory.length === 0 && <div className="text-secondary text-center p-4">Ask a question about your sound, like "How can I make this bass sound fuller?"</div>}
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-accent text-white' : 'bg-background text-secondary'}`}>
                                <p className="text-sm prose prose-invert" dangerouslySetInnerHTML={{__html: msg.text.replace(/\n/g, '<br />')}}></p>
                            </div>
                        </div>
                    ))}
                 </div>
                 <div className="flex-shrink-0 flex items-center gap-2">
                    <input 
                        type="text"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAskAI()}
                        placeholder="Ask the AI..."
                        className="w-full bg-background border border-surface rounded-md py-2 px-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button onClick={handleAskAI} disabled={isLoading || !userInput.trim()} className="bg-accent text-primary p-2.5 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </button>
                 </div>
            </div>
        </div>
    )
};

export default AnalyzeView;
