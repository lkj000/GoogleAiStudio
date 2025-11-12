
import React, { useRef, useEffect } from 'react';

const RealtimeOscilloscope: React.FC<{ analyserNode: AnalyserNode }> = ({ analyserNode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // FIX: Initialize useRef with null to provide an initial value.
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserNode.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameId.current = requestAnimationFrame(draw);
            analyserNode.getByteTimeDomainData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, '#4CC9F0');
            gradient.addColorStop(1, '#F72585');
            ctx.strokeStyle = gradient;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(76, 201, 240, 0.5)';
            ctx.lineWidth = 2;

            ctx.beginPath();
            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
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

export default RealtimeOscilloscope;