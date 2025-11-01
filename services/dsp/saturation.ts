export const saturationSource = `
namespace AmapianoDSP
{
    // Analog-style saturation (tanH approximation)
    class Saturation
    {
    public:
        float process(float input, float drive) // drive is 0 to 1
        {
            float g = 1.0f + drive * 5.0f;
            return std::tanh(input * g) / std::tanh(g);
        }
    };
}
`;
