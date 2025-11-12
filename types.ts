
export type TemplateCategory = 'instrument' | 'effect' | 'utility';

export interface PluginParameter {
  id: string;
  name: string;
  type: 'range' | 'toggle';
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: '%' | 'ms' | 'Hz' | 'dB'; // New: Add units for better UI
  affects?: string; // New: Specify which module this param controls
}

export interface PluginTemplate {
  id: string;
  name: string;
  type: TemplateCategory;
  framework: 'JUCE' | 'Web Audio';
  description: string;
  tags: string[];
  parameters: PluginParameter[];
  code: string;
  signalChain?: string[]; // New: For visual patcher/reordering
}

export interface Preset {
    name:string;
    values: Record<string, number>;
}

export interface MidiNote {
    pitch: number; // MIDI note number (0-127)
    start: number; // Start time in beats/steps
    duration: number; // Duration in beats/steps
    velocity: number; // Velocity (0-127)
}

export interface ArrangementPattern {
    id: string;
    name: string;
    type: 'Drums' | 'Bass' | 'Melody' | 'FX' | 'Chords' | 'Lead';
    notes: MidiNote[];
}

export interface ArrangementSection {
    name: string;
    length: number; // in bars
    patterns: ArrangementPattern[];
}

export interface LogEntry {
    level: 'log' | 'warn' | 'error' | 'info';
    timestamp: string;
    message: any[];
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  timestamp: string;
  project: PluginTemplate;
}

export interface DAWTrack {
  id: string;
  name: string;
  buffer: AudioBuffer;
  sourceNode?: AudioBufferSourceNode;
  gainNode: GainNode;
  // FIX: PannerNode does not have a 'pan' property. StereoPannerNode should be used for stereo panning.
  pannerNode: StereoPannerNode;
  volume: number; // 0-1
  pan: number; // -1 to 1
  isMuted: boolean;
  isSoloed: boolean;
}

export interface Stem {
  name: 'Vocals' | 'Drums' | 'Bass' | 'Other';
  buffer: AudioBuffer | null;
  sourceNode?: AudioBufferSourceNode;
  gainNode?: GainNode;
  volume: number;
  isPlaying: boolean;
  color: string;
}