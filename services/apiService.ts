import { PluginTemplate } from '../types';

export interface CommunityPlugin extends PluginTemplate {
    author: string;
    likes: number;
    downloads: number;
}

const mockCommunityPlugins: CommunityPlugin[] = [
    {
        id: 'granular-dreams',
        name: 'Granular Dreams',
        author: '@aesthetics',
        likes: 1204,
        downloads: 5832,
        type: 'effect',
        framework: 'JUCE',
        description: 'A mind-bending granular delay that turns any sound into a lush, evolving texture. Perfect for ambient soundscapes.',
        tags: ['granular', 'ambient', 'sound-design', 'experimental'],
        parameters: [
            { id: 'grainSize', name: 'Grain Size', type: 'range', defaultValue: 30, min: 5, max: 200, unit: 'ms' },
            { id: 'pitchShift', name: 'Pitch Shift', type: 'range', defaultValue: 0, min: -12, max: 12, step: 1 },
            { id: 'feedback', name: 'Feedback', type: 'range', defaultValue: 50, min: 0, max: 95, unit: '%' },
            { id: 'mix', name: 'Mix', type: 'range', defaultValue: 100, min: 0, max: 100, unit: '%' },
        ],
        code: `// JUCE code for Granular Dreams...`,
        signalChain: ['Granulator', 'PitchShifter', 'FeedbackDelay'],
    },
    {
        id: 'rhythm-slicer-pro',
        name: 'Rhythm Slicer Pro',
        author: '@beatmaker',
        likes: 876,
        downloads: 3109,
        type: 'effect',
        framework: 'Web Audio',
        description: 'An advanced gate and slicer that creates complex rhythmic patterns from drum loops, pads, or any sustained audio.',
        tags: ['rhythm', 'gate', 'slicer', 'sequencer'],
        parameters: [
            { id: 'rate', name: 'Rate', type: 'range', defaultValue: 8, min: 1, max: 32, step: 1 },
            { id: 'smoothness', name: 'Smoothness', type: 'range', defaultValue: 20, min: 0, max: 100, unit: '%' },
            { id: 'gateAmount', name: 'Gate Amount', type: 'range', defaultValue: 80, min: 0, max: 100, unit: '%' },
        ],
        code: `// Web Audio code for Rhythm Slicer Pro...`,
        signalChain: ['Gate', 'Envelope'],
    },
    {
        id: 'amapiano-keys',
        name: 'Deep Amapiano Keys',
        author: '@sgijaz',
        likes: 2341,
        downloads: 9870,
        type: 'instrument',
        framework: 'JUCE',
        description: 'The quintessential electric piano sound for deep and soulful amapiano tracks, with built-in "shaker" percussion layer.',
        tags: ['amapiano', 'keys', 'electric-piano', 'soulful'],
        parameters: [
            { id: 'hardness', name: 'Hardness', type: 'range', defaultValue: 60, min: 0, max: 100 },
            { id: 'shakerMix', name: 'Shaker Mix', type: 'range', defaultValue: 40, min: 0, max: 100, unit: '%' },
            { id: 'verb', name: 'Reverb', type: 'range', defaultValue: 30, min: 0, max: 100, unit: '%' },
        ],
        code: `// JUCE code for Deep Amapiano Keys...`,
        signalChain: ['EP Sampler', 'Shaker Synth', 'Reverb'],
    },
    {
        id: 'console-warmer',
        name: 'Console Warmer',
        author: '@mixmaster',
        likes: 950,
        downloads: 4500,
        type: 'utility',
        framework: 'JUCE',
        description: 'A subtle utility plugin that adds the saturation and warmth of a vintage analog mixing console to your tracks.',
        tags: ['utility', 'saturation', 'analog', 'warmth', 'mixing'],
        parameters: [
            { id: 'drive', name: 'Drive', type: 'range', defaultValue: 25, min: 0, max: 100 },
            { id: 'crosstalk', name: 'Crosstalk', type: 'range', defaultValue: 10, min: 0, max: 100 },
        ],
        code: `// JUCE code for Console Warmer...`,
        signalChain: ['Saturation', 'Crosstalk'],
    }
];

export const fetchCommunityPlugins = async (): Promise<CommunityPlugin[]> => {
    console.log("Fetching community plugins...");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    // In a real app, this would be a fetch() call to a backend API
    // e.g., const response = await fetch('/api/community/plugins');
    // const data = await response.json();
    // return data;
    return mockCommunityPlugins;
};
