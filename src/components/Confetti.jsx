import { useEffect, useRef } from "react";

const COLORS = ["#ff6b6b", "#ffd166", "#06d6a0", "#4cc9f0", "#141414"];

export default function Confetti({ duration = 8000 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pieces = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let disposed = false;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const spawn = () => {
      for (let i = 0; i < 150; i += 1) {
        pieces.push({
          x: Math.random() * width,
          y: -40 - Math.random() * height * 0.45,
          w: 7 + Math.random() * 8,
          h: 10 + Math.random() * 12,
          rotation: Math.random() * TAU,
          spin: -0.12 + Math.random() * 0.24,
          vx: -0.8 + Math.random() * 1.6,
          vy: 1.4 + Math.random() * 2.4,
          sway: Math.random() * TAU,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
    };

    const draw = (time) => {
      if (disposed) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      for (const piece of pieces) {
        piece.sway += 0.025;
        piece.rotation += piece.spin;
        piece.x += piece.vx + Math.sin(piece.sway) * 0.7;
        piece.y += piece.vy;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      }

      ctx.restore();
      if (time < duration && !reduceMotion) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    spawn();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return <canvas ref={canvasRef} className="confetti" aria-hidden="true" />;
}

const TAU = Math.PI * 2;
