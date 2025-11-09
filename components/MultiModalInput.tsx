import React, { useState, useRef, useEffect } from 'react';
import { AiGenerateIcon, MicrophoneIcon, UploadCloudIcon } from './icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface MultiModalInputProps {
    onGenerate: (prompt: string, framework: 'JUCE' | 'Web Audio') => void;
    disabled?: boolean;
}

const MultiModalInput: React.FC<MultiModalInputProps> = ({ onGenerate, disabled }) => {
    const [prompt, setPrompt] = useState('');
    const [framework, setFramework] = useState<'JUCE' | 'Web Audio'>('JUCE');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { 
        isListening, 
        transcript, 
        startListening, 
        stopListening, 
        error: speechError,
        hasRecognitionSupport 
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        }
    }, [transcript]);

    const handleGenerateClick = () => {
        if (prompt.trim()) {
            onGenerate(prompt, framework);
        }
    };
    
    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const filePrompt = `Create a plugin inspired by the audio characteristics of the file: "${file.name}". `;
            setPrompt(prev => prev ? `${prev} ${filePrompt}` : filePrompt);
        }
         if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-surface p-4 rounded-xl border border-background">
            <textarea 
                placeholder={isListening ? "Listening..." : "e.g., 'A wobbly lo-fi chorus effect with wow and flutter knobs'"} 
                rows={3} 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-background border border-surface rounded-md py-3 px-4 text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                disabled={disabled || isListening}
            />
             {(speechError) && <p className="text-xs text-hot-pink mt-1">{speechError}</p>}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                    {hasRecognitionSupport && (
                        <button 
                            onClick={handleMicClick}
                            disabled={disabled}
                            title={isListening ? "Stop Recording" : "Record Voice"}
                            className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isListening ? 'bg-hot-pink text-white animate-pulse' : 'text-secondary hover:bg-background'}`}
                        >
                            <MicrophoneIcon />
                        </button>
                    )}
                     <button 
                        onClick={handleUploadClick}
                        disabled={disabled}
                        title="Upload File"
                        className="p-2 rounded-full text-secondary hover:bg-background transition-colors disabled:opacity-50"
                     >
                        <UploadCloudIcon />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center p-1 bg-background rounded-lg">
                        <button onClick={() => setFramework('JUCE')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${framework === 'JUCE' ? 'bg-accent text-white' : 'text-secondary hover:bg-surface'}`}>JUCE (C++)</button>
                        <button onClick={() => setFramework('Web Audio')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${framework === 'Web Audio' ? 'bg-accent text-white' : 'text-secondary hover:bg-surface'}`}>Web Audio (JS)</button>
                    </div>

                    <button onClick={handleGenerateClick} disabled={disabled || !prompt.trim()} className="bg-accent text-primary font-semibold py-2.5 px-6 rounded-lg hover:bg-accent-hover transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                        <AiGenerateIcon />
                        <span>Generate</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MultiModalInput;