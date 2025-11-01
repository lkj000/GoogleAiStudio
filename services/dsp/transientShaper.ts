export const transientShaperSource = `
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

    // Percussive Transient Shaper
    class TransientShaper
    {
    public:
        void prepare(double sampleRate)
        {
            this->sampleRate = sampleRate;
            envelopeFollowerLPF.setCutoff(200.0f, sampleRate); // Fast envelope
        }

        void setAttackAmount(float amount) { attackAmount = 1.0f + amount * 3.0f; } // 1x to 4x gain
        void setSustainAmount(float amount) { sustainAmount = 1.0f + amount * 3.0f; } // 1x to 4x gain

        float process(float input)
        {
            float absInput = std::abs(input);
            float fastEnv = envelopeFollowerLPF.process(absInput);
            
            // Simplified logic: compare fast and slow envelopes
            // For now, we'll use a placeholder for a slower envelope
            float slowEnv = fastEnv; // This should be a slower follower
            
            float gain = 1.0;
            if (fastEnv > slowEnv * 1.1) // If fast envelope is significantly higher, it's a transient
            {
                gain = attackAmount;
            }
            else // It's sustain
            {
                gain = sustainAmount;
            }
            
            // Simple smoothing
            smoothedGain = lastGain + (gain - lastGain) * 0.1f;
            lastGain = smoothedGain;

            return input * smoothedGain;
        }

    private:
        double sampleRate = 44100.0;
        float attackAmount = 1.0f;
        float sustainAmount = 1.0f;
        OnePoleLPF envelopeFollowerLPF;
        float lastGain = 1.0f;
        float smoothedGain = 1.0f;
    };
}
`;
