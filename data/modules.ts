
export interface Module {
    name: string;
    description: string;
}

export const availableModules: Module[] = [
    {
        name: 'Saturation',
        description: 'Adds warmth and harmonic complexity, emulating analog gear.'
    },
    {
        name: 'Filtered Delay',
        description: 'A classic delay effect with a low-pass filter on the feedback path.'
    },
    {
        name: 'Reverb',
        description: 'Simulates acoustic spaces, from small rooms to large halls.'
    },
    {
        name: 'Transient Shaper',
        description: 'Shape the attack and sustain of percussive sounds.'
    }
];
