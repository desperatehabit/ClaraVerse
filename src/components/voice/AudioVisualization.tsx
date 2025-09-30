import * as React from 'react';
import { useRef, useEffect } from 'react';
import { useVoiceContext } from '../../contexts/Voice/VoiceContext';



const AudioVisualization: React.FC = () => {
  const { inputLevel, outputLevel } = useVoiceContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, width, height);

    // Draw User (input) bar
    const userBarWidth = width / 2 - 10;
    const userBarHeight = height * inputLevel;
    canvasCtx.fillStyle = 'rgb(100, 150, 255)';
    canvasCtx.fillRect(
      5,
      height - userBarHeight,
      userBarWidth,
      userBarHeight
    );

    // Draw Agent (output) bar
    const agentBarWidth = width / 2 - 10;
    const agentBarHeight = height * outputLevel;
    canvasCtx.fillStyle = 'rgb(255, 100, 150)';
    canvasCtx.fillRect(
      width / 2 + 5,
      height - agentBarHeight,
      agentBarWidth,
      agentBarHeight
    );
  }, [inputLevel, outputLevel]);

  return (
    <div>
      <h2>Audio Visualization</h2>
      <canvas ref={canvasRef} width="200" height="100"></canvas>
    </div>
  );
};

export default AudioVisualization;