"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";

type Particle = { id: number; size: number; x: number; y: number; duration: number; delay: number };

function AnimatedBackgroundComponent() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        id: index,
        size: 2 + ((index * 7) % 6),
        x: (index * 43) % 100,
        y: (index * 31) % 100,
        duration: 5 + (index % 8),
        delay: (index % 6) * 0.35
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0D0D0D]" />
      <motion.div
        className="absolute inset-0"
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(0,209,255,0.22), transparent 40%), radial-gradient(circle at 80% 5%, rgba(108,92,231,0.24), transparent 42%), radial-gradient(circle at 50% 90%, rgba(255,255,255,0.07), transparent 45%)",
          backgroundSize: "180% 180%"
        }}
      />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-cyan-300/60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            boxShadow: "0 0 10px rgba(0, 209, 255, 0.8)"
          }}
          animate={{ y: [0, -30, 0], opacity: [0.25, 0.9, 0.25], scale: [1, 1.4, 1] }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
}

export const AnimatedBackground = memo(AnimatedBackgroundComponent);
