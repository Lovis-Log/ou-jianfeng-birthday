import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function drawCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function createSourceCanvas(image) {
  const canvas = document.createElement("canvas");
  const maxEdge = 1800;
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function buildPattern(sourceCanvas, width, height, options) {
  const { inkColor, paperColor, mode, dotDensity, angle } = options;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = paperColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grid = Math.max(6, 18 - dotDensity * 0.1);
  const maxRadius = grid * 0.78;
  const sourceCtx = sourceCanvas.getContext("2d");
  const pixels = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;

  const drawChannel = (channelAngle, intensityFromPixel, color, alpha = 1) => {
    const rad = ((angle + channelAngle) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;

    for (let u = -grid; u < width + grid; u += grid) {
      for (let v = -grid; v < height + grid; v += grid) {
        const x = u * cos - v * sin;
        const y = u * sin + v * cos;
        const sx = clamp(Math.round((x / width) * (sourceCanvas.width - 1)), 0, sourceCanvas.width - 1);
        const sy = clamp(Math.round((y / height) * (sourceCanvas.height - 1)), 0, sourceCanvas.height - 1);
        const index = (sy * sourceCanvas.width + sx) * 4;
        const intensity = intensityFromPixel(
          pixels[index],
          pixels[index + 1],
          pixels[index + 2]
        );
        const radius = intensity * maxRadius;
        if (radius < 0.4) continue;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();
      }
    }
  };

  if (mode === "color") {
    drawChannel(15, (r) => 1 - r / 255, "#19b5fe", 0.92);
    drawChannel(75, (_, g) => 1 - g / 255, "#ff3d81", 0.92);
    drawChannel(0, (_, __, b) => 1 - b / 255, "#ffd200", 0.92);
    drawChannel(45, (r, g, b) => 1 - Math.max(r, g, b) / 255, inkColor, 0.9);
  } else {
    drawChannel(0, (r, g, b) => 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255, inkColor);
  }

  ctx.globalAlpha = 1;
  return canvas;
}

export default function HalftoneReveal({
  src,
  inkColor = "#141414",
  paperColor = "#f4efe4",
  mode = "mono",
  dotDensity = 90,
  angle = 28,
  revealRadius = 0.28,
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = 1;
    let height = 1;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let animationFrame = 0;
    let disposed = false;

    const state = {
      image: null,
      sourceCanvas: null,
      patternCanvas: null,
      pointerX: 0.5,
      pointerY: 0.5,
      targetX: 0.5,
      targetY: 0.5,
      reveal: 0,
    };

    const rebuildPattern = () => {
      if (!state.sourceCanvas) return;
      state.patternCanvas = buildPattern(state.sourceCanvas, width, height, {
        inkColor,
        paperColor,
        mode,
        dotDensity,
        angle,
      });
    };

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      rebuildPattern();
    };

    const frame = () => {
      if (disposed) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ease = reduceMotion ? 1 : 0.07;
      state.pointerX += (state.targetX - state.pointerX) * ease;
      state.pointerY += (state.targetY - state.pointerY) * ease;
      state.reveal += (revealRadius - state.reveal) * ease;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = paperColor;
      ctx.fillRect(0, 0, width, height);

      if (state.patternCanvas) {
        ctx.drawImage(state.patternCanvas, 0, 0, width, height);
      }

      if (state.sourceCanvas) {
        const centerX = state.pointerX * width;
        const centerY = state.pointerY * height;
        const radius = state.reveal * Math.min(width, height);
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(1, radius), 0, TAU);
        ctx.clip();
        drawCover(ctx, state.sourceCanvas, width, height);
        ctx.restore();
      }

      ctx.restore();
      animationFrame = requestAnimationFrame(frame);
    };

    const handlePointer = (event) => {
      const rect = wrapper.getBoundingClientRect();
      state.targetX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      state.targetY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    };

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      state.image = image;
      state.sourceCanvas = createSourceCanvas(image);
      rebuildPattern();
    };
    image.onerror = () => {
      const fallback = document.createElement("canvas");
      fallback.width = 1200;
      fallback.height = 800;
      const fallbackCtx = fallback.getContext("2d");
      const gradient = fallbackCtx.createLinearGradient(0, 0, 1200, 800);
      gradient.addColorStop(0, "#ffb26b");
      gradient.addColorStop(0.55, "#ff6b6b");
      gradient.addColorStop(1, "#5b8bff");
      fallbackCtx.fillStyle = gradient;
      fallbackCtx.fillRect(0, 0, 1200, 800);
      fallbackCtx.fillStyle = "rgba(20,20,20,0.18)";
      for (let i = 0; i < 34; i += 1) {
        fallbackCtx.save();
        fallbackCtx.translate(60 + ((i * 137) % 1080), 70 + ((i * 89) % 660));
        fallbackCtx.rotate((i * 47 * Math.PI) / 180);
        fallbackCtx.fillRect(-18, -7, 36, 14);
        fallbackCtx.restore();
      }
      state.sourceCanvas = fallback;
      rebuildPattern();
    };
    image.src = src;

    wrapper.addEventListener("pointermove", handlePointer);
    wrapper.addEventListener("pointerdown", handlePointer);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrapper);
    resize();
    animationFrame = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      wrapper.removeEventListener("pointermove", handlePointer);
      wrapper.removeEventListener("pointerdown", handlePointer);
    };
  }, [src, inkColor, paperColor, mode, dotDensity, angle, revealRadius]);

  return (
    <div ref={wrapperRef} className="halftone-reveal">
      <canvas ref={canvasRef} aria-label="半调照片" />
    </div>
  );
}
