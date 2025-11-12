
import { DAWTrack, LogEntry, PluginTemplate, MidiNote } from "../types";

let audioContext: AudioContext;
let masterGain: GainNode;
let analyser: AnalyserNode;
let isInitialized = false;
// FIX: Declare sampleBuffer at the module level.
let sampleBuffer: AudioBuffer | null = null;


// DAW state
let dawTracks = new Map<string, DAWTrack>();
let isDAWPlaying = false;
let soloedTracks = new Set<string>();

// Recording state
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

// Preview state
let previewSource: AudioBufferSourceNode | null = null;
let previewPluginInstance: any = null;

// Sample loop state
let sampleLoopSource: AudioBufferSourceNode | null = null;

// MIDI playback state
let midiSources: OscillatorNode[] = [];


// Base64 encoded WAV file of a simple 90bpm drum loop
const sampleLoopB64 = "UklGRlJQBQBXQVZFZm10IBAAAAABAAIARKwAABCxAgAEABAAZGF0YSCgBQBg9/7/9f/p/9L/wv+o/6j/tP/E/8j/yv/K/8r/x//C/7j/rP+X/4//hf9//3L/b/9t/3H/ef+B/4f/iv+P/5X/mP+b/5//ov+n/6r/rv+w/7X/uv+9/7//wP/C/8X/x//J/8r/y//L/8r/yv/L/8r/yv/L/8r/yv/L/8r/yv/L/8v/y//J/8f/xf/D/8H/v/+6/7T/rP+X/4//hf9//3L/b/9t/3H/ef+B/4f/iv+P/5X/mP+b/5//ov+n/6r/rv+w/7X/uv+9/7//wP/C/8X/x//J/8r/y//L/8r/yv/L/8r/yv/L/8r/yv/L/8r/yv/L/8v/y//J/8f/xf/D/8H/v/+6/7T/rP+p/6f/ov+e/5n/lf+R/4z/if+F/3//cv9r/2b/Y/9f/13/Wv9b/1//Yf9k/2f/b/9z/3n/fv+D/4n/jv+T/5f/mv+e/6L/pv+q/6//tP+3/7r/vf/A/8L/xf/H/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/y//J/8j/x//F/8P/wf/A/73/uv+2/7T/r/+q/6f/o/+e/5r/lv+U/5D/jP+J/4X/gP9+/3T/b/9o/2T/Yv9h/2D/YP9j/2b/aP9s/3D/d/99/4L/hf+J/43/kf+V/5n/nv+j/6b/qv+v/7L/tf+6/73/v//B/8T/x//J/8r/y//L/8v/y//K/8r/y//L/8r/y//L/8r/y//L/8v/y//L/8r/y//K/8r/y//K/8r/y//K/8r/y//J/8j/xf/D/8H/v/+8/7r/tv+z/6//qf+k/6D/n/uc/5f/kv+O/4r/hP9//3T/b/9n/2X/Y/9i/2L/Yv9k/2f/aP9s/3D/d/97/3//g/+G/4r/jv+R/5T/mP+b/5//ov+m/6r/sP+1/7f/uv+9/8D/wv/F/8f/yv/M/8z/zf/N/83/zf/N/83/zf/N/83/zf/N/83/zf/N/83/zP/L/8v/yv/K/8n/yP/F/8P/wv+9/7r/t/+0/7D/qv+l/6L/nv+Z/5X/kv+O/4r/hP9//3T/b/9o/2b/ZP9i/2L/Y/9l/2j/a/9v/3f/ev9//4L/hf+J/4z/kf+U/5j/nP+f/6P/pv+q/6//s/+1/7f/u/+9/8D/wv/F/8f/yv/L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/L/8r/yv/K/8r/yv/J/8f/xf/D/8H/v/+8/7n/tv+y/6//qf+l/6H/n/+b/5f/k/+O/4z/if+F/3//dP9x/2z/aP9l/2X/Zv9p/2v/cv91/3r/f/+C/4b/i/+N/5H/lP+Y/5v/nf+h/6X/qf+u/7D/tf+3/7r/vf/A/8L/xP/G/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+v/6r/p/+h/5//m/+X/5P/kP+M/4n/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+i/6D/n/+b/5f/lP+S/47/i/+H/4P/fv93/3H/bP9p/2X/ZP9h/1//W/9a/1n/Wv9d/2D/ZP9o/2z/cf94/3v/f/+D/4f/iv+P/5T/mv+d/6H/pv+q/7D/tf+3/7v/vf/A/8L/xP/G/8n/yv/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yf/I/8b/xP/D/8L/v/+8/7n/t/+z/7D/qv+m/6H/nf+a/5b/k/+O/4v/hv+C/33/dv9x/2z/aP9l/2P/X/9c/1z/Xv9g/2P/aP9s/3H/dv95/37/hP+I/4v/kP+U/5n/nP+f/6L/pv+p/6//sv+2/7n/vP/A/8L/xP/G/8n/yv/L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yv/J/8f/xf/D/8H/v/+8/7n/tv+z/6//qf+l/6H/n/+b/5f/k/+O/4z/if+F/3//dP9x/2v/aP9m/2X/Y/9i/2H/Y/9l/2f/a/9v/3T/eP98/4D/hP+I/4z/kP+U/5n/nP+g/6T/qP+s/7H/tf+4/7v/vf/A/8P/xP/H/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8r/yv/K/8r/yv/K/8r/yv/J/8j/xf/E/8P/wf/A/73/uv+2/7P/r/+q/6f/ov+e/5r/lv+U/5D/jP+J/4X/gP9+/3T/b/9o/2b/Y/9h/1//Wv9b/1//Yf9k/2j/b/9z/3n/gP+D/4f/if+N/5H/lf+Z/53/oP+l/6n/rf+v/7L/tf+3/7r/vf/B/8P/xP/H/8n/yv/L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8v/yv/K/8r/yv/J/8j/x//E/8L/wP+9/7n/tv+z/6//qf+k/6H/n/+b/5f/lP+S/47/i/+H/4L/ff92/3H/b/9o/2X/Y/9g/1//Wv9Z/1v/X/9h/2T/aP9s/3H/d/95/3//hP+H/4r/j/+S/5X/m/+e/6H/pf+p/63/sP+z/7X/uf+8/7//wP/D/8X/x//J/8r/y//L/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/M/8z/zP/L/8r/yv/K/8r/yf/H/8X/w//B/7//vP+5/7b/sv+v/6r/pv+h/5//m/+X/5P/kP+M/4n/hP9//3T/cf9r/2j/Zv9l/2X/Zv9p/2v/cv91/3r/f/+C/4b/i/+N/5H/lP+Y/5v/nf+h/6X/qf+u/7D/tf+3/7r/vf/A/8L/xP/G/8n/yv/L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+v/6r/p/+h/5//m/+X/5P/kP+M/4n/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+h/5//m/+X/5T/kf+M/4r/hP9//3T/cf9r/2j/Zv9l/2b/aP9s/3D/d/96/3//gv+G/4r/jv+R/5T/mP+c/6D/pf+p/63/sP+0/7f/uv+9/8D/wv/E/8b/yf/K/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//L/8v/y//K/8r/yv/K/8n/yP/F/8T/w//C/8D/vP+6/7b/sv+w/6v/pv+i/6D/n/+b/5f/lP+S/47/i/+H/4P/fv93/3H/bP9p/2X/ZP9h/1//W/9a/1n/Wv9d/2D/ZP9o/2z/cf94/3v/f/+D/4f/iv+P/5T/mv+d/6H/"];

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
    if (isInitialized) {
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        return analyser;
    }
    
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioContext.createGain();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    masterGain.connect(analyser);
    analyser.connect(audioContext.destination);

    const audioData = base64ToArrayBuffer(sampleLoopB64);
    // FIX: Assign to the module-level sampleBuffer
    sampleBuffer = await audioContext.decodeAudioData(audioData);
    
    isInitialized = true;
    return analyser;
};

// --- Plugin Preview ---
export const previewPlugin = async (template: PluginTemplate) => {
    if (template.framework !== 'Web Audio' || !sampleBuffer) return;
    if (audioContext.state === 'suspended') await audioContext.resume();

    stopPreview(); // Stop any existing preview

    try {
        // This is unsafe but necessary for this dynamic plugin loading architecture
        const PluginClass = new Function(`return ${template.code}`)();
        previewPluginInstance = new PluginClass(audioContext);

        previewSource = audioContext.createBufferSource();
        previewSource.buffer = sampleBuffer;
        previewSource.loop = true;

        previewSource.connect(previewPluginInstance.input);
        previewPluginInstance.output.connect(masterGain);
        previewSource.start();

    } catch (e) {
        console.error("Failed to preview plugin:", e);
    }
};

export const stopPreview = () => {
    if (previewSource) {
        try {
            previewSource.stop();
            previewSource.disconnect();
        } catch (e) {}
        previewSource = null;
    }
    if (previewPluginInstance && previewPluginInstance.output) {
        try {
            previewPluginInstance.output.disconnect();
        } catch(e) {}
        previewPluginInstance = null;
    }
};

// --- Sample Loop Playback ---
export const playSampleLoop = async () => {
    if (!sampleBuffer) return;
    if (audioContext.state === 'suspended') await audioContext.resume();
    
    stopSampleLoop();

    sampleLoopSource = audioContext.createBufferSource();
    sampleLoopSource.buffer = sampleBuffer;
    sampleLoopSource.loop = true;
    sampleLoopSource.connect(masterGain);
    sampleLoopSource.start();
};

export const stopSampleLoop = () => {
    if (sampleLoopSource) {
        try {
            sampleLoopSource.stop();
            sampleLoopSource.disconnect();
        } catch (e) {
            // Can error if already stopped
        }
        sampleLoopSource = null;
    }
};

export const setSamplePlaybackRate = async (rate: number) => {
    if (sampleLoopSource) {
        sampleLoopSource.playbackRate.setValueAtTime(rate, audioContext.currentTime);
    }
};

// --- User Sample Loading ---
export const loadUserSample = async (arrayBuffer: ArrayBuffer) => {
    if (!audioContext) await init();
    try {
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        sampleBuffer = decodedBuffer;
        stopSampleLoop(); // Stop the old loop if it was playing
    } catch (e) {
        console.error("Failed to decode user sample:", e);
        throw new Error("Failed to decode audio file. It may be corrupted or in an unsupported format.");
    }
};

// --- MIDI Playback ---
export const playMidiPattern = async (pattern: MidiNote[], bpm: number) => {
    if (!audioContext) await init();
    if (audioContext.state === 'suspended') await audioContext.resume();

    // Stop any previous MIDI playback
    midiSources.forEach(source => {
        try { source.stop(); source.disconnect(); } catch (e) {}
    });
    midiSources = [];

    const now = audioContext.currentTime;
    const secondsPerBeat = 60 / bpm;

    pattern.forEach(note => {
        const startTime = now + note.start * secondsPerBeat;
        const endTime = startTime + note.duration * secondsPerBeat;
        const freq = 440 * Math.pow(2, (note.pitch - 69) / 12);

        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.type = note.pitch < 50 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        const velocityGain = (note.velocity / 127) * 0.3; // Lower gain to avoid clipping
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocityGain, startTime + 0.01);
        gainNode.gain.setValueAtTime(velocityGain, endTime - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, endTime);

        osc.connect(gainNode);
        gainNode.connect(masterGain);
        osc.start(startTime);
        osc.stop(endTime + 0.1);
        midiSources.push(osc);
    });
};


// --- DAW & Mixer ---

const updateTrackGains = () => {
    const hasSolo = soloedTracks.size > 0;
    dawTracks.forEach(track => {
        const isMuted = track.isMuted || (hasSolo && !track.isSoloed);
        const targetGain = isMuted ? 0 : track.volume;
        track.gainNode.gain.linearRampToValueAtTime(targetGain, audioContext.currentTime + 0.02);
    });
};

export const setDAWTracks = (tracks: DAWTrack[]) => {
    // Clean up old nodes
    dawTracks.forEach(track => {
        track.sourceNode?.disconnect();
        track.gainNode.disconnect();
        track.pannerNode.disconnect();
    });
    dawTracks.clear();
    
    tracks.forEach(trackData => {
        const gainNode = audioContext.createGain();
        // FIX: Use StereoPannerNode for stereo panning.
        const pannerNode = audioContext.createStereoPanner();
        
        gainNode.connect(pannerNode);
        pannerNode.connect(masterGain);
        
        gainNode.gain.value = trackData.volume;
        // FIX: 'pan' property exists on StereoPannerNode.
        pannerNode.pan.value = trackData.pan;
        
        const newTrack: DAWTrack = { ...trackData, gainNode, pannerNode };
        dawTracks.set(trackData.id, newTrack);
    });
    updateTrackGains();
};

export const playDAW = () => {
    if (isDAWPlaying || !audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    const now = audioContext.currentTime;
    dawTracks.forEach(track => {
        if (track.buffer) {
            track.sourceNode = audioContext.createBufferSource();
            track.sourceNode.buffer = track.buffer;
            track.sourceNode.connect(track.gainNode);
            track.sourceNode.start(now);
        }
    });
    isDAWPlaying = true;
};

export const stopDAW = () => {
    if (!isDAWPlaying) return;
    const now = audioContext.currentTime;
    dawTracks.forEach(track => {
        track.sourceNode?.stop(now);
        track.sourceNode?.disconnect();
        track.sourceNode = undefined;
    });
    isDAWPlaying = false;
};

export const updateTrackVolume = (trackId: string, volume: number) => {
    const track = dawTracks.get(trackId);
    if (track) {
        track.volume = volume;
        updateTrackGains();
    }
};

export const updateTrackPan = (trackId: string, pan: number) => {
    const track = dawTracks.get(trackId);
    if (track) {
        track.pan = pan;
        // FIX: Use 'pan' property of StereoPannerNode.
        track.pannerNode.pan.linearRampToValueAtTime(pan, audioContext.currentTime + 0.02);
    }
};

export const toggleMute = (trackId: string, isMuted: boolean) => {
    const track = dawTracks.get(trackId);
    if (track) {
        track.isMuted = isMuted;
        updateTrackGains();
    }
};

export const toggleSolo = (trackId: string, isSoloed: boolean) => {
    const track = dawTracks.get(trackId);
    if (track) {
        track.isSoloed = isSoloed;
        if (isSoloed) {
            soloedTracks.add(trackId);
        } else {
            soloedTracks.delete(trackId);
        }
        updateTrackGains();
    }
};

// --- Recording ---

export const startRecording = async (): Promise<void> => {
    if (mediaRecorder && mediaRecorder.state === 'recording') return;
    
    if (audioContext.state === 'suspended') await audioContext.resume();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });

        mediaRecorder.start();
    } catch (err) {
        console.error("Error starting recording:", err);
        throw new Error("Could not start recording. Please ensure microphone permissions are granted.");
    }
};

export const stopRecording = (): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
        if (!mediaRecorder) {
            return reject("Recording not started.");
        }
        
        mediaRecorder.addEventListener("stop", async () => {
            const audioBlob = new Blob(audioChunks);
            const arrayBuffer = await audioBlob.arrayBuffer();
            try {
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                resolve(audioBuffer);
            } catch (e) {
                reject("Failed to decode recorded audio.");
            }
        });

        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        mediaRecorder = null;
    });
};

export const createDummyBuffer = async (): Promise<AudioBuffer> => {
    if (!audioContext) await init();
    
    const duration = 2; // seconds
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill with sine wave
    for (let i = 0; i < frameCount; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
    }
    return buffer;
}