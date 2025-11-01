export const filteredDelaySource = `
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
        
        T readInterpolated(float delaySamples) const
        {
            int d0 = static_cast<int>(delaySamples);
            int d1 = d0 + 1;
            float frac = delaySamples - d0;

            T s0 = read(d0);
            T s1 = read(d1);

            return s0 + frac * (s1 - s0);
        }

        int getCapacity() const { return (int)buffer.size(); }

    private:
        std::vector<T> buffer;
        int writePtr = 0;
    };

    // Filtered Delay with optional BPM Sync and Swing
    class FilteredDelay
    {
    public:
        void prepare(double sampleRate, int maxDelaySamples)
        {
            this->sampleRate = sampleRate;
            delayLine.prepare(maxDelaySamples);
            lpf.setCutoff(20000.0f, sampleRate);
            clear();
        }

        void clear()
        {
            delayLine.clear();
            lpf.reset();
        }

        void setDelayTime(float seconds) { delayTimeSamples = seconds * sampleRate; }
        void setFeedback(float newFeedback) { feedback = newFeedback; }
        void setLPFCutoff(float freq) { lpf.setCutoff(freq, sampleRate); }

        float process(float input)
        {
            float delayOutput = delayLine.readInterpolated(delayTimeSamples);
            float filteredDelay = lpf.process(delayOutput);
            delayLine.write(input + filteredDelay * feedback);
            return filteredDelay;
        }

    private:
        double sampleRate = 44100.0;
        CircularBuffer<float> delayLine;
        OnePoleLPF lpf;
        float delayTimeSamples = 0.0f;
        float feedback = 0.0f;
    };
}
`;
