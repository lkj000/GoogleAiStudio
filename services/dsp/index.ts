import { saturationSource } from './saturation';
import { filteredDelaySource } from './filteredDelay';
import { reverbSource } from './reverb';
import { transientShaperSource } from './transientShaper';

export const dspSources = {
    Saturation: saturationSource,
    'Filtered Delay': filteredDelaySource,
    Reverb: reverbSource,
    'Transient Shaper': transientShaperSource,
};
