"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
}

export function FlameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = [
      "rgba(245, 158, 11, ", // amber
      "rgba(251, 191, 36, ", // golden yellow
      "rgba(239, 68, 68, ",  // fiery red
      "rgba(217, 119, 6, ",  // dark amber
    ];

    const particles: Particle[] = [];
    const maxParticles = 45;

    function createParticle(x?: number, y?: number): Particle {
      const maxLife = 80 + Math.random() * 80;
      return {
        x: x ?? Math.random() * width,
        y: y ?? height + Math.random() * 20,
        size: 1 + Math.random() * 2.5,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: -(0.5 + Math.random() * 1.5),
        life: 0,
        maxLife,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.1 + Math.random() * 0.5,
      };
    }

    // Initialize initial particle pool
    for (let i = 0; i < maxParticles; i++) {
      const p = createParticle();
      p.y = Math.random() * height;
      particles.push(p);
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.6 && particles.length < maxParticles + 10) {
        particles.push(createParticle(e.clientX + (Math.random() - 0.5) * 40, e.clientY + (Math.random() - 0.5) * 40));
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    function render() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;

        // Fade in and out
        const lifeProgress = p.life / p.maxLife;
        let currentAlpha = p.alpha;
        if (lifeProgress < 0.2) {
          currentAlpha = p.alpha * (lifeProgress / 0.2);
        } else if (lifeProgress > 0.7) {
          currentAlpha = p.alpha * ((1 - lifeProgress) / 0.3);
        }

        ctx.fillStyle = `${p.color}${Math.max(0, currentAlpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Recycle dead particle
        if (p.life >= p.maxLife || p.y < -10) {
          particles[i] = createParticle();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-40"
      aria-hidden="true"
    />
  );
}
