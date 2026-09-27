'use client';
import { useEffect, useRef } from 'react';

// Lightweight canvas particles: diyas/sparkles/petals drifting up
export default function Particles({ density = 60 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const parts = Array.from({ length: density }, () => spawn());
    function spawn() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 3,
        s: 0.2 + Math.random() * 0.8,
        drift: (Math.random() - 0.5) * 0.4,
        hue: [45, 30, 15, 50, 330][Math.floor(Math.random() * 5)],
        a: 0.3 + Math.random() * 0.6,
      };
    }
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.s; p.x += p.drift;
        if (p.y < -10) Object.assign(p, spawn(), { y: h + 10 });
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue},95%,65%,${p.a})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onResize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [density]);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" aria-hidden />;
}
