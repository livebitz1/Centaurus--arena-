'use client';

import React, { useEffect, useRef } from 'react';

interface SquaresProps {
  speed?: number;
  squareSize?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'diagonal';
  borderColor?: string;
  hoverFillColor?: string;
}

const Squares: React.FC<SquaresProps> = ({
  speed = 0.5,
  squareSize = 40,
  direction = 'diagonal',
  borderColor = '#fff',
  hoverFillColor = '#222'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const squares: Array<{
      x: number;
      y: number;
      opacity: number;
      hovered: boolean;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Generate squares grid
      squares.length = 0;
      const cols = Math.ceil(canvas.width / squareSize) + 2;
      const rows = Math.ceil(canvas.height / squareSize) + 2;
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          squares.push({
            x: i * squareSize - squareSize,
            y: j * squareSize - squareSize,
            opacity: Math.random() * 0.3,
            hovered: false
          });
        }
      }
    };

    const getDirectionVector = () => {
      switch (direction) {
        case 'up': return { x: 0, y: -speed };
        case 'down': return { x: 0, y: speed };
        case 'left': return { x: -speed, y: 0 };
        case 'right': return { x: speed, y: 0 };
        case 'diagonal': return { x: speed * 0.5, y: speed * 0.5 };
        default: return { x: 0, y: 0 };
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const dirVector = getDirectionVector();
      
      squares.forEach((square) => {
        // Move square
        square.x += dirVector.x;
        square.y += dirVector.y;
        
        // Wrap around screen
        if (square.x > canvas.width + squareSize) square.x = -squareSize;
        if (square.x < -squareSize * 2) square.x = canvas.width + squareSize;
        if (square.y > canvas.height + squareSize) square.y = -squareSize;
        if (square.y < -squareSize * 2) square.y = canvas.height + squareSize;
        
        // Update opacity
        if (!square.hovered) {
          square.opacity += (Math.random() - 0.5) * 0.01;
          square.opacity = Math.max(0, Math.min(0.3, square.opacity));
        }
        
        // Draw square
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = square.opacity;
        
        if (square.hovered) {
          ctx.fillStyle = hoverFillColor;
          ctx.fillRect(square.x, square.y, squareSize, squareSize);
        }
        
        ctx.strokeRect(square.x, square.y, squareSize, squareSize);
      });
      
      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      squares.forEach((square) => {
        const distance = Math.sqrt(
          Math.pow(mouseX - (square.x + squareSize / 2), 2) +
          Math.pow(mouseY - (square.y + squareSize / 2), 2)
        );
        
        if (distance < squareSize) {
          square.hovered = true;
          square.opacity = 0.8;
        } else {
          square.hovered = false;
        }
      });
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [speed, squareSize, direction, borderColor, hoverFillColor]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default Squares;
