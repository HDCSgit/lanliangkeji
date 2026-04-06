import React, { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

interface BubbleBackgroundProps {
  bubbleCount?: number;
  className?: string;
}

const BubbleBackground: React.FC<BubbleBackgroundProps> = ({
  bubbleCount = 20,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initBubbles = () => {
      bubblesRef.current = [];
      for (let i = 0; i < bubbleCount; i++) {
        bubblesRef.current.push(createBubble(canvas.height));
      }
    };

    const createBubble = (canvasHeight: number): Bubble => ({
      x: Math.random() * canvas.width,
      y: canvasHeight + Math.random() * 100,
      size: Math.random() * 8 + 2,
      speed: Math.random() * 1 + 0.5,
      opacity: Math.random() * 0.3 + 0.1,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
    });

    const drawBubble = (bubble: Bubble) => {
      ctx.beginPath();
      
      // Create gradient for bubble
      const gradient = ctx.createRadialGradient(
        bubble.x - bubble.size * 0.3,
        bubble.y - bubble.size * 0.3,
        0,
        bubble.x,
        bubble.y,
        bubble.size
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(22, 93, 255, ${bubble.opacity * 0.3})`);
      gradient.addColorStop(1, `rgba(22, 93, 255, ${bubble.opacity * 0.1})`);
      
      ctx.fillStyle = gradient;
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();

      // Add shine effect
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.6})`;
      ctx.arc(
        bubble.x - bubble.size * 0.3,
        bubble.y - bubble.size * 0.3,
        bubble.size * 0.25,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach((bubble, index) => {
        // Update position
        bubble.y -= bubble.speed;
        bubble.wobble += bubble.wobbleSpeed;
        bubble.x += Math.sin(bubble.wobble) * 0.5;

        // Reset bubble if it goes off screen
        if (bubble.y < -bubble.size * 2) {
          bubblesRef.current[index] = createBubble(canvas.height);
        }

        drawBubble(bubble);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initBubbles();
    animate();

    window.addEventListener('resize', () => {
      resizeCanvas();
      initBubbles();
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bubbleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ background: 'transparent' }}
    />
  );
};

export default BubbleBackground;
