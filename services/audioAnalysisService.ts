// services/audioAnalysisService.ts

export const calculateVolume = (dataArray: Uint8Array): { rms: number; peak: number } => {
    let sumSquares = 0.0;
    let peak = 0.0;
    for (const amplitude of dataArray) {
        // Data is 0-255, convert to -1.0 to 1.0
        const normalizedValue = (amplitude / 128.0) - 1.0;
        sumSquares += normalizedValue * normalizedValue;
        if (Math.abs(normalizedValue) > peak) {
            peak = Math.abs(normalizedValue);
        }
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    return { rms, peak };
};

// Converts a linear value (0-1) to dBFS
export const linearToDecibels = (linear: number): number => {
    if (linear <= 0) return -Infinity;
    return 20 * Math.log10(linear);
};

export const getFrequencySnapshot = (
    analyserNode: AnalyserNode,
    dataArray: Uint8Array
): { dominantFrequency: number; bassLevel: number; midLevel: number; trebleLevel: number } => {
    analyserNode.getByteFrequencyData(dataArray);

    const sampleRate = analyserNode.context.sampleRate;
    const binWidth = sampleRate / analyserNode.fftSize;

    let maxVal = 0;
    let maxIndex = 0;

    let bassEnergy = 0;
    let midEnergy = 0;
    let trebleEnergy = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const freq = i * binWidth;
        const level = dataArray[i];

        if (level > maxVal) {
            maxVal = level;
            maxIndex = i;
        }

        // Bass: ~20Hz - 250Hz
        if (freq >= 20 && freq < 250) {
            bassEnergy += level;
        }
        // Mids: ~250Hz - 4kHz
        else if (freq >= 250 && freq < 4000) {
            midEnergy += level;
        }
        // Treble: ~4kHz+
        else if (freq >= 4000) {
            trebleEnergy += level;
        }
    }

    const totalEnergy = bassEnergy + midEnergy + trebleEnergy;
    
    return {
        dominantFrequency: maxIndex * binWidth,
        bassLevel: totalEnergy > 0 ? (bassEnergy / totalEnergy) * 100 : 0,
        midLevel: totalEnergy > 0 ? (midEnergy / totalEnergy) * 100 : 0,
        trebleLevel: totalEnergy > 0 ? (trebleEnergy / totalEnergy) * 100 : 0,
    };
};
