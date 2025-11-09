// components/RealtimeSpectrogram.tsx
import React, { useRef, useEffect } from 'react';

const RealtimeSpectrogram: React.FC<{ analyserNode: AnalyserNode }> = ({ analyserNode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // FIX: Correctly type the ref. useRef without an argument makes the value potentially undefined.
    const animationFrameId = useRef<number | undefined>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyserNode.fftSize = 2048;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameId.current = requestAnimationFrame(draw);
            analyserNode.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i];
                
                // Color based on height
                const hue = 200 + (barHeight / 255) * 120; // from blue to magenta/red
                ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
                
                ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [analyserNode]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default RealtimeSpectrogram;