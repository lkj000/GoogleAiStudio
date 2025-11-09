
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
    name: string;
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