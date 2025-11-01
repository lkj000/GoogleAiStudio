export const reverbSource = `
namespace AmapianoDSP
{
    // One-pole low-pass filter
    class OnePoleLPF
    {
    public:
        void setCutoff(float freq, double sampleRate)
        {
            auto w0 = juce::MathConstants<double>::twoPi * freq / sampleRate;
            alpha = 1.0 - std::exp(-w0);
        }

        float process(float input)
        {
            lastOutput = input * alpha + lastOutput * (1.0f - alpha);
            return lastOutput;
        }

        void reset() { lastOutput = 0.0f; }

    private:
        float lastOutput = 0.0f;
        double alpha = 1.0;
    };

    // Circular buffer for delay lines
    template <typename T>
    class CircularBuffer
    {
    public:
        void prepare(int maxDelaySamples)
        {
            buffer.resize(maxDelaySamples + 1);
            clear();
        }

        void clear()
        {
            std::fill(buffer.begin(), buffer.end(), T{});
            writePtr = 0;
        }

        void write(T value)
        {
            buffer[writePtr] = value;
            writePtr = (writePtr + 1) % buffer.size();
        }

        T read(int delaySamples) const
        {
            int readPtr = (writePtr - delaySamples + buffer.size()) % buffer.size();
            return buffer[readPtr];
        }

        int getCapacity() const { return (int)buffer.size(); }

    private:
        std::vector<T> buffer;
        int writePtr = 0;
    };

    // All-pass and Comb filters for Reverb
    class AllpassFilter
    {
    public:
        void prepare(int maxDelaySamples) { delayLine.prepare(maxDelaySamples); }
        void setFeedback(float newFeedback) { feedback = newFeedback; }
        void setDelaySamples(int newDelaySamples) { delaySamples = newDelaySamples; }
        float process(float input)
        {
            float delayed = delayLine.read(delaySamples);
            float output = -input + delayed;
            delayLine.write(input + feedback * delayed);
            return output;
        }
    private:
        CircularBuffer<float> delayLine;
        float feedback = 0.5f;
        int delaySamples = 100;
    };

    class CombFilter
    {
    public:
        void prepare(int maxDelaySamples) { delayLine.prepare(maxDelaySamples); }
        void setFeedback(float newFeedback) { feedback = newFeedback; }
        void setDelaySamples(int newDelaySamples) { delaySamples = newDelaySamples; }
        void setDamping(float newDamping, double sr) { lpf.setCutoff(newDamping, sr); }
        float process(float input)
        {
            float delayed = delayLine.read(delaySamples);
            delayed = lpf.process(delayed);
            delayLine.write(input + feedback * delayed);
            return delayed;
        }
    private:
        CircularBuffer<float> delayLine;
        OnePoleLPF lpf;
        float feedback = 0.5f;
        int delaySamples = 100;
    };

    // Reverb based on a simplified Schroeder/Moorer design
    class Reverb
    {
    public:
        void prepare(double sampleRate, int maxBlockSize)
        {
            this->sampleRate = sampleRate;
            int maxReverbDelaySamples = static_cast<int>(2.0 * sampleRate);

            preDelayLine.prepare(maxReverbDelaySamples);
            comb1.prepare(maxReverbDelaySamples); comb1.setDelaySamples(static_cast<int>(0.0297 * sampleRate));
            comb2.prepare(maxReverbDelaySamples); comb2.setDelaySamples(static_cast<int>(0.0371 * sampleRate));
            comb3.prepare(maxReverbDelaySamples); comb3.setDelaySamples(static_cast<int>(0.0411 * sampleRate));
            comb4.prepare(maxReverbDelaySamples); comb4.setDelaySamples(static_cast<int>(0.0437 * sampleRate));
            allpass1.prepare(maxReverbDelaySamples); allpass1.setDelaySamples(static_cast<int>(0.0050 * sampleRate));
            allpass2.prepare(maxReverbDelaySamples); allpass2.setDelaySamples(static_cast<int>(0.0017 * sampleRate));
        }

        void setPreDelayMs(float ms) { preDelaySamples = juce::jlimit(0, preDelayLine.getCapacity() - 1, static_cast<int>(ms / 1000.0 * sampleRate)); }
        void setRoomSize(float size) // 0..1
        {
            float feedback = 0.5f + size * 0.45f;
            comb1.setFeedback(feedback); comb2.setFeedback(feedback);
            comb3.setFeedback(feedback); comb4.setFeedback(feedback);
            
            float dampingFreq = juce::jmap(size, 0.0f, 1.0f, 1500.0f, 8000.0f);
            comb1.setDamping(dampingFreq, sampleRate); comb2.setDamping(dampingFreq, sampleRate);
            comb3.setDamping(dampingFreq, sampleRate); comb4.setDamping(dampingFreq, sampleRate);

            allpass1.setFeedback(0.7f); allpass2.setFeedback(0.7f);
        }

        float process(float input)
        {
            preDelayLine.write(input);
            float delayedInput = preDelayLine.read(preDelaySamples);
            
            float combOutput = comb1.process(delayedInput) + comb2.process(delayedInput) + comb3.process(delayedInput) + comb4.process(delayedInput);
            
            float allpassOutput = allpass1.process(combOutput);
            allpassOutput = allpass2.process(allpassOutput);

            return allpassOutput;
        }

    private:
        double sampleRate = 44100.0;
        int preDelaySamples = 0;
        CircularBuffer<float> preDelayLine;
        CombFilter comb1, comb2, comb3, comb4;
        AllpassFilter allpass1, allpass2;
    };
}
`;
