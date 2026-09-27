'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
const LazyDiya = lazy(() => import('./DiyaScene'));

export default function Diya3D() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    // Skip heavy WebGL on small / low-end devices
    const lowEnd = /Android.*Chrome\/[1-6]|Mobile/i.test(navigator.userAgent) && window.devicePixelRatio > 2.5;
    const small = window.innerWidth < 640;
    setOk(!lowEnd && !small ? true : false);
    if (small) setOk(false);
    else setOk(true);
  }, []);
  if (!ok)
    return (
      <div className="text-center animate-float-slow" aria-label="Diya fallback">
        <div className="text-8xl drop-shadow-[0_0_25px_rgba(255,150,30,.8)]">🪔</div>
        <p className="text-gold/80 text-sm mt-2 font-display">Shubh Deepavali • Shubh Navratri</p>
      </div>
    );
  return (
    <Suspense fallback={<div className="text-7xl animate-float-slow">🪔</div>}>
      <LazyDiya />
    </Suspense>
  );
}
