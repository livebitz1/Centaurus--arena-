'use client';

import React, { useEffect, useRef, useState } from 'react';

type AnimateOn = 'hover' | 'view' | 'both';

interface Props {
  text: string;
  speed?: number; // ms per tick
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: AnimateOn;
  revealDirection?: 'left' | 'right' | 'center' | 'random';
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 30,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()',
  className = '',
  parentClassName = '',
  encryptedClassName = 'encrypted',
  animateOn = 'hover',
  revealDirection = 'left',
}: Props) {
  const [display, setDisplay] = useState<string[]>(() => text.split('').map(() => ''));
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const iterRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // initialize blanks
    setDisplay(text.split('').map(() => ''));
    setRevealed(false);
    setRunning(false);
    iterRef.current = 0;
  }, [text]);

  useEffect(() => {
    if (animateOn === 'view' || animateOn === 'both') {
      const el = containerRef.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !running && !revealed) {
              startAnimation();
              obs.disconnect();
            }
          });
        },
        { threshold: 0.3 },
      );
      obs.observe(el);
      return () => obs.disconnect();
    }
  }, [animateOn, running, revealed]);

  function pickChar() {
    return characters.charAt(Math.floor(Math.random() * characters.length));
  }

  function buildTargetIterations() {
    const len = text.length || 1;
    const center = (len - 1) / 2;
    return Array.from({ length: len }).map((_, i) => {
      let revealOrder = 0;
      const pos = len === 1 ? 0 : i / (len - 1);
      if (revealDirection === 'left') revealOrder = 1 - pos; // left sooner
      else if (revealDirection === 'right') revealOrder = pos; // right sooner
      else if (revealDirection === 'center') {
        const distance = Math.abs(i - center);
        const normalized = center === 0 ? 0 : distance / center;
        revealOrder = 1 - normalized; // center sooner
      } else revealOrder = Math.random();

      const target = Math.round(maxIterations * (1 - revealOrder));
      return Math.max(0, Math.min(maxIterations, target));
    });
  }

  function startAnimation() {
    if (running || revealed) return;
    setRunning(true);
    const targets = buildTargetIterations();
    iterRef.current = 0;

    animationRef.current = window.setInterval(() => {
      iterRef.current++;
      const it = iterRef.current;
      setDisplay((prev) =>
        prev.map((ch, i) => {
          if (it >= targets[i]) return text[i];
          // show random char
          return pickChar();
        }),
      );

      if (iterRef.current >= maxIterations) {
        if (animationRef.current) window.clearInterval(animationRef.current);
        animationRef.current = null;
        setDisplay(text.split(''));
        setRunning(false);
        setRevealed(true);
      }
    }, speed);
  }

  function resetAnimation() {
    if (animationRef.current) {
      window.clearInterval(animationRef.current);
      animationRef.current = null;
    }
    iterRef.current = 0;
    setDisplay(text.split('').map(() => ''));
    setRunning(false);
    setRevealed(false);
  }

  // hover handlers
  const onEnter = () => {
    if (animateOn === 'hover' || animateOn === 'both') startAnimation();
  };
  const onLeave = () => {
    if (animateOn === 'hover') resetAnimation();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) window.clearInterval(animationRef.current);
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className={`${parentClassName} ${className}`.trim()}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      aria-live="polite"
    >
      {display.map((ch, i) => {
        const isReal = revealed || ch === text[i];
        return (
          <span key={i} className={isReal ? undefined : encryptedClassName} aria-hidden={!isReal}>
            {isReal ? text[i] : ch}
          </span>
        );
      })}
    </span>
  );
}
