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
}
