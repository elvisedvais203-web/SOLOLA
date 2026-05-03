"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cvs = canvas;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const gl = ctx;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let raf = 0;
    let stopLoop = prefersReducedMotion();

    const COUNT = stopLoop ? 0 : 88;

    function initParticles() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.35,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        a: Math.random() * 0.42 + 0.14,
      }));
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = Math.floor(w * dpr);
      cvs.height = Math.floor(h * dpr);
      cvs.style.width = `${w}px`;
      cvs.style.height = `${h}px`;
      gl.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function tick() {
      if (stopLoop) return;
      gl.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        gl.beginPath();
        gl.fillStyle = `rgba(108, 92, 231, ${p.a})`;
        gl.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        gl.fill();
        gl.fillStyle = `rgba(0, 209, 255, ${p.a * 0.32})`;
        gl.beginPath();
        gl.arc(p.x + 0.55, p.y - 0.55, p.r * 0.42, 0, Math.PI * 2);
        gl.fill();
      }

      const linkDist = 112;
      const neighborSpan = 14;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        const end = Math.min(i + neighborSpan, particles.length);
        for (let j = i + 1; j < end; j++) {
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const t = 1 - d / linkDist;
            gl.strokeStyle = `rgba(108, 92, 231, ${t * 0.1})`;
            gl.lineWidth = 0.55;
            gl.beginPath();
            gl.moveTo(a.x, a.y);
            gl.lineTo(b.x, b.y);
            gl.stroke();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      const next = mq.matches;
      if (next === stopLoop) return;
      stopLoop = next;
      cancelAnimationFrame(raf);
      resize();
      if (!stopLoop) tick();
      else gl.clearRect(0, 0, w, h);
    };

    mq.addEventListener("change", onMotion);
    resize();
    if (!stopLoop) tick();

    window.addEventListener("resize", resize);
    return () => {
      mq.removeEventListener("change", onMotion);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="gateway-bg absolute inset-0" aria-hidden />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-[0.72] mix-blend-screen"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_18%,rgba(108,92,231,0.28),transparent_58%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_72%_52%_at_82%_88%,rgba(0,209,255,0.14),transparent_52%)]"
        aria-hidden
      />
      <div
        className="gateway-grid-mask absolute inset-0 opacity-[0.07]"
        aria-hidden
      />
    </div>
  );
}
