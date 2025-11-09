import { PluginTemplate, ArrangementSection } from "../types";

// Base64 encoded WAV file of a simple 90bpm drum loop
const sampleLoopB64 = "UklGRlJQBQBXQVZFZm10IBAAAAABAAIARKwAABCxAgAEABAAZGF0YSCgBQBg9/7/9f/p/9L/wv+o/6j/tP/E/8j/yv/K/8r/x//C/7j/rP+X/4//hf9//3L/b/9t/3H/ef+B/4f/iv+P/5X/mP+b/5//ov+n/6r/rv+w/7X/uv+9/7//wP/C/8X/x//J/8r/y//L/8r/yv/L/8r/yv/L/8r/yv/L/8r/yv/L/8v/y//J/8f/xf/D/8H/v/+6/7T/rP+p/6f/ov+e/5n/lf+R/4z/if+F/3//cv9r/2b/Y/9f/13/Wv9b/1//Yf9k/2f/b/9z/3n/fv+D/4n/jv+T/5f/mv+e/6L/pv+q/6//tP+3/7r/vf/A/8L/xf/H/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/y//J/8j/x//F/8P/wf/A/73/uv+2/7T/r/+q/6f/o/+e/5r/lv+U/5D/jP+J/4X/gP9+/3T/b/9o/2T/Yv9h/2D/YP9j/2b/aP9s/3D/d/99/4L/hf+J/43/kf+V/5n/nv+j/6b/qv+v/7L/tf+6/73/v//B/8T/x//J/8r/y//L/8v/y//K/8r/y//L/8v/y//L/8r/y//L/8v/y//L/8r/y//K/8r/y//K/8r/y//K/8r/y//J/8j/xf/D/8H/v/+8/7r/tv+z/6//qf+k/6D/n/uc/5f/kv+O/4r/hP9//3T/b/9n/2X/Y/9i/2L/Yv9k/2f/aP9s/3D/d/97/3//g/+G/4r/jv+R/5T/mP+b/5//ov+m/6r/sP+1/7f/uv+9/8D/wv/F/8f/yv/M/8z/zf/N/83/zf/N/83/zf/N/83/zf/N/83/zf/N/83/zf/M/8v/yv/K/8r/yf/I/8X/w//C/7//u/+3/7T/sP+q/6X/ov+e/5n/lf+S/47/iv+E/3//dP9v/2j/Zv9k/2L/Yv9j/2X/aP9r/2//d/96/3//gv+F/4n/jP+R/5T/mP+c/5//o/+m/6r/r/+z/7X/t/+7/7//wP/C/8X/x//J/8r/y//M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/y//K/8r/yv/K/8r/yf/H/8X/w//B/7//vP+5/7b/sv+v/6n/pf+h/5//m/+X/5P/j/+M/4n/hf9//3T/cf9s/2j/Zv9l/2X/Zv9p/2v/cv91/3r/f/+C/4b/i/+N/5H/lP+Y/5v/nf+h/6X/qf+u/7D/tf+3/7r/vf/A/8L/xP/G/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+v/6r/p/+h/5//m/+X/5P/kP+M/4n/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7f/sv+w/6v/pv+i/6D/n/+b/5f/lP+S/47/i/+H/4P/fv93/3H/bP9p/2X/ZP9h/1//W/9a/1n/Wv9d/2D/ZP9o/2z/cf94/3v/f/+D/4f/iv+P/5T/mv+d/6H/pv+q/7D/tf+3/7v/vf/A/8L/xP/G/8n/yv/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yf/I/8b/xP/D/8L/v/+8/7n/t/+z/7D/qv+m/6H/nf+a/5b/k/+O/4v/hv+C/33/dv9x/2z/aP9l/2P/X/9c/1z/Xv9g/2P/aP9s/3H/dv95/37/hP+I/4v/kP+U/5n/nP+f/6L/pv+p/6//sv+2/7n/vP/A/8L/xP/G/8n/yv/L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yv/J/8f/xf/D/8H/v/+8/7n/tv+z/6//qf+l/6H/n/+b/5f/k/+O/4z/if+F/3//dP9x/2v/aP9m/2X/Y/9i/2H/Y/9l/2f/a/9v/3T/eP98/4D/hP+I/4z/kP+U/5n/nP+g/6T/qP+s/7H/tf+4/7v/vf/A/8P/xP/H/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8r/yv/K/8r/yv/K/8r/yv/J/8j/xf/E/8P/wf/A/73/uv+2/7P/r/+q/6f/ov+e/5r/lv+U/5D/jP+J/4X/gP9+/3T/b/9o/2b/Y/9h/1//Wv9b/1//Yf9k/2j/b/9z/3n/gP+D/4f/if+N/5H/lf+Z/53/oP+l/6n/rf+v/7L/tf+3/7r/vf/B/8P/xP/H/8n/yv/L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yv/J/8j/x//E/8L/wP+9/7n/tv+z/6//qf+k/6H/n/+b/5f/lP+S/47/i/+H/4L/ff92/3H/b/9o/2X/Y/9g/1//Wv9Z/1v/X/9h/2T/aP9s/3H/d/95/3//hP+H/4r/j/+S/5X/m/+e/6H/pf+p/63/sP+z/7X/uf+8/7//wP/D/8X/x//J/8r/y//L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/L/8r/yv/K/8r/yf/H/8X/w//B/7//vP+5/7b/sv+v/6r/pv+h/5//m/+X/5P/kP+M/4n/hP9//3T/cf9r/2j/Zv9l/2X/Zv9p/2v/cv91/3r/f/+C/4b/i/+N/5H/lP+Y/5v/nf+h/6X/qf+u/7D/tf+3/7r/vf/A/8L/xP/G/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+v/6r/p/+h/5//m/+X/5P/kP+M/4n/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7f/sv+w/6v/pv+i/6D/n/+b/5f/lP+S/47/i/+H/4P/fv93/3H/bP9p/2X/ZP9h/1//W/9a/1n/Wv9d/2D/ZP9o/2z/cf94/3v/f/+D/4f/iv+P/5T/mv+d/6H/pv+q/7D/tf+3/7v/vf/A/8L/xP/G/8n/yv/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yf/I/8b/xP/D/8L/v/+8/7n/t/+z/7D/qv+m/6H/nf+a/5b/k/+O/4v/hv+C/33/dv9x/2z/aP9l/2P/X/9c/1z/Xv9g/2P/aP9s/3H/dv95/37/hP+I/4v/kP+U/5n/nP+f/6L/pv+p/6//sv+2/7n/vP/A/8L/xP/G/8n/yv/L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yv/J/8f/xf/D/8H/v/+8/7n/tv+z/6//qf+l/6H/n/+b/5f/k/+O/4z/if+F/3//dP9x/2v/aP9m/2X/Y/9i/2H/Y/9l/2f/a/9v/3T/eP98/4D/hP+I/4z/kP+U/5n/nP+g/6T/qP+s/7H/tf+4/7v/vf/A/8P/xP/H/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8r/yv/K/8r/yv/K/8r/yv/J/8j/xf/E/8P/wf/A/73/uv+2/7P/r/+q/6f/ov+e/5r/lv+U/5D/jP+J/4X/gP9+/3T/b/9o/2b/Y/9h/1//Wv9b/1//Yf9k/2j/b/9z/3n/gP+D/4f/if+N/5H/lf+Z/53/oP+l/6n/rf+v/7L/tf+3/7r/vf/B/8P/xP/H/8n/yv/L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yv/J/8j/x//E/8L/wP+9/7n/tv+z/6//qf+k/6H/n/+b/5f/lP+S/47/i/+H/4L/ff92/3H/b/9o/2X/Y/9g/1//Wv9Z/1v/X/9h/2T/aP9s/3H/d/95/3//hP+H/4r/j/+S/5X/m/+e/6H/pf+p/63/sP+z/7X/uf+8/7//wP/D/8X/x//J/8r/y//L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/L/8r/yv/K/8r/yf/H/8X/w//B/7//vP+5/7b/sv+v/6r/pv+h/5//m/+X/5P/kP+M/4n/hP9//3T/cf9r/2j/Zv9l/2X/Zv9p/2v/cv91/3r/f/+C/4b/i/+N/5H/lP+Y/5v/nf+h/6X/qf+u/7D/tf+3/7r/vf/A/8L/xP/G/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+v/6r/p/+h/5//m/+X/5P/kP+M/4n/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+i/6D/n/+b/5f/lP+S/47/i/+H/4P/fv93/3H/bP9p/2X/ZP9h/1//W/9a/1n/Wv9d/2D/ZP9o/2z/cf94/3v/f/+D/4f/iv+P/5T/mv+d/6H/"];

let audioContext: AudioContext;
let masterGain: GainNode;
let analyser: AnalyserNode;

// For sample loop playback
let sampleSource: AudioBufferSourceNode | null = null;
let defaultSampleBuffer: AudioBuffer;
let userSampleBuffer: AudioBuffer | null = null;
let sampleGainNode: GainNode;
let currentPlaybackRate = 1.0;
let currentGain = 1.0;

// For plugin hosting
let pluginInput: GainNode;
let pluginOutput: GainNode;
let pluginInstance: any = null;

// For DAW playback
let isDAWPlaying = false;
let dawStartTime = 0;
let currentBeat = 0;
let bpm = 120.0;
let schedulerInterval: number | null = null;
const scheduleAheadTime = 0.1; // seconds
const lookahead = 25.0; // ms

// Helper to decode base64
const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

export const init = async (): Promise<AnalyserNode> => {
    if (audioContext) {
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        return analyser;
    }
    
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioContext.createGain();
    analyser = audioContext.createAnalyser();
    masterGain.connect(analyser);
    analyser.connect(audioContext.destination);

    pluginInput = audioContext.createGain();
    pluginOutput = audioContext.createGain();
    pluginOutput.connect(masterGain);
    
    sampleGainNode = audioContext.createGain();
    sampleGainNode.connect(pluginInput);

    const audioData = base64ToArrayBuffer(sampleLoopB64);
    defaultSampleBuffer = await audioContext.decodeAudioData(audioData);

    return analyser;
};

export const loadUserSample = async (audioData: ArrayBuffer): Promise<void> => {
    try {
        const decodedBuffer = await audioContext.decodeAudioData(audioData);
        userSampleBuffer = decodedBuffer;
    } catch (error) {
        console.error("Error decoding audio data:", error);
        userSampleBuffer = null;
        throw new Error("Failed to decode audio file. It might be corrupted or in an unsupported format.");
    }
};

export const connectPlugin = (project: PluginTemplate) => {
    disconnectPlugin();
    
    try {
        const PluginClass = new Function(`return ${project.code}`)();
        pluginInstance = new PluginClass(audioContext);
        pluginInput.connect(pluginInstance.input);
        pluginInstance.output.connect(pluginOutput);
    } catch (e) {
        console.error("Failed to instantiate Web Audio plugin:", e);
        pluginInput.connect(pluginOutput);
    }
};

export const disconnectPlugin = () => {
    if (pluginInstance && pluginInstance.output) {
         pluginInstance.output.disconnect();
    }
    pluginInput.disconnect();
    pluginInstance = null;
    pluginInput.connect(pluginOutput);
};

export const setParam = (id: string, value: number) => {
    if (pluginInstance && typeof pluginInstance.setParam === 'function') {
        pluginInstance.setParam(id, value);
    }
};

// --- Sample Loop Playback ---
export const setSampleGain = (level: number) => {
    currentGain = level;
    if (sampleGainNode) {
        sampleGainNode.gain.linearRampToValueAtTime(level, audioContext.currentTime + 0.01);
    }
};

export const setSamplePlaybackRate = (rate: number) => {
    currentPlaybackRate = rate;
    if (sampleSource) {
        sampleSource.playbackRate.linearRampToValueAtTime(rate, audioContext.currentTime + 0.01);
    }
};

export const playSampleLoop = async () => {
    if (audioContext.state === 'suspended') await audioContext.resume();
    stopSampleLoop();
    
    sampleSource = audioContext.createBufferSource();
    sampleSource.buffer = userSampleBuffer || defaultSampleBuffer;
    sampleSource.loop = true;
    sampleSource.playbackRate.value = currentPlaybackRate;
    sampleSource.connect(sampleGainNode);

    const now = audioContext.currentTime;
    sampleGainNode.gain.cancelScheduledValues(now);
    sampleGainNode.gain.setValueAtTime(0, now);
    sampleGainNode.gain.linearRampToValueAtTime(currentGain, now + 0.05);
    sampleSource.start();
};

export const stopSampleLoop = () => {
    if (sampleSource) {
        const now = audioContext.currentTime;
        sampleGainNode.gain.cancelScheduledValues(now);
        sampleGainNode.gain.setValueAtTime(sampleGainNode.gain.value, now);
        sampleGainNode.gain.linearRampToValueAtTime(0, now + 0.05);
        sampleSource.stop(now + 0.06);
        sampleSource = null;
    }
};

// --- DAW Playback Engine ---
const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

const scheduler = (arrangement: ArrangementSection[], onUpdatePlayhead: (beat: number) => void) => {
    const secondsPerBeat = 60.0 / bpm;
    
    while (isDAWPlaying && audioContext.currentTime > dawStartTime + (currentBeat * secondsPerBeat) - scheduleAheadTime) {
        let currentBar = 0;
        let barStartBeat = 0;
        let totalBeats = 0;

        for (const section of arrangement) {
            const sectionStartBeat = totalBeats;
            const sectionEndBeat = sectionStartBeat + section.length * 4;

            if (currentBeat >= sectionStartBeat && currentBeat < sectionEndBeat) {
                const beatInSection = currentBeat - sectionStartBeat;
                for (const pattern of section.patterns) {
                    for (const note of pattern.notes) {
                        if (beatInSection >= note.start && beatInSection < note.start + 0.01) { // Play note at its start
                            if (pluginInstance && typeof pluginInstance.play === 'function') {
                                const noteTime = dawStartTime + (currentBeat * secondsPerBeat);
                                pluginInstance.play(midiToFreq(note.pitch), noteTime);
                            }
                        }
                    }
                }
            }
            totalBeats += section.length * 4;
        }

        onUpdatePlayhead(currentBeat);
        currentBeat += 0.25; // Advance by a 16th note
        if (currentBeat > totalBeats) currentBeat = 0; // Loop
    }
};

export const playDAW = (arrangement: ArrangementSection[], newBpm: number, onUpdatePlayhead: (beat: number) => void) => {
    if (isDAWPlaying) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    isDAWPlaying = true;
    bpm = newBpm;
    dawStartTime = audioContext.currentTime;
    currentBeat = 0;
    
    schedulerInterval = window.setInterval(() => scheduler(arrangement, onUpdatePlayhead), lookahead);
};

export const stopDAW = () => {
    isDAWPlaying = false;
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
    if (pluginInstance && typeof pluginInstance.stopAll === 'function') {
        pluginInstance.stopAll(audioContext.currentTime);
    }
};