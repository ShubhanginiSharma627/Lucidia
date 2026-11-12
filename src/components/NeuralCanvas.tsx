import React, { useEffect, useRef } from 'react';

interface NeuralCanvasProps {
  intensity?: 'subtle' | 'vibrant';
  interactive?: boolean;
  className?: string;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  connections: number[];
  pulse: number;
  pulseSpeed: number;
}

interface Pulse {
  sourceIdx: number;
  targetIdx: number;
  progress: number;
  speed: number;
  color: string;
}

export const NeuralCanvas: React.FC<NeuralCanvasProps> = ({
  intensity = 'subtle',
  interactive = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 300);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 300;
    };
    window.addEventListener('resize', handleResize);

    // Generate synaptic nodes
    const nodeCount = Math.min(45, Math.floor((width * height) / 16000));
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 2 + Math.random() * 2.5,
        baseRadius: 2 + Math.random() * 2.5,
        connections: [],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    // Precalculate connections (K-nearest neighbors)
    const maxDistance = 140;
    const pulses: Pulse[] = [];

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    const colors = [
      'rgba(99, 102, 241, 0.9)', // indigo
      'rgba(168, 85, 247, 0.9)', // violet
      'rgba(56, 189, 248, 0.9)', // sky
      'rgba(52, 211, 153, 0.9)', // emerald
    ];

    let lastPulseTime = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Spawn action potential pulses along synaptic paths
      if (time - lastPulseTime > 400 && pulses.length < 16) {
        lastPulseTime = time;
        const sourceIdx = Math.floor(Math.random() * nodes.length);
        const source = nodes[sourceIdx];
        // Find a nearby node
        for (let j = 0; j < nodes.length; j++) {
          if (j !== sourceIdx) {
            const dx = nodes[j].x - source.x;
            const dy = nodes[j].y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDistance) {
              pulses.push({
                sourceIdx,
                targetIdx: j,
                progress: 0,
                speed: 0.015 + Math.random() * 0.02,
                color: colors[Math.floor(Math.random() * colors.length)],
              });
              break;
            }
          }
        }
      }

      // Update and draw connections (synapses)
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // Move nodes slowly
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;

        if (nodeA.x < 0 || nodeA.x > width) nodeA.vx *= -1;
        if (nodeA.y < 0 || nodeA.y > height) nodeA.vy *= -1;

        nodeA.pulse += nodeA.pulseSpeed;

        // Mouse hover interaction
        const mdx = mouseX - nodeA.x;
        const mdy = mouseY - nodeA.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 100) {
          nodeA.radius = nodeA.baseRadius + (1 - mDist / 100) * 3;
        } else {
          nodeA.radius = nodeA.baseRadius;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (intensity === 'vibrant' ? 0.35 : 0.18);
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Update and draw action potential pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const s = nodes[pulse.sourceIdx];
        const t = nodes[pulse.targetIdx];
        if (!s || !t) continue;

        const px = s.x + (t.x - s.x) * pulse.progress;
        const py = s.y + (t.y - s.y) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pulse.color;
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw nodes (neurons)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulseFactor = 0.5 + 0.5 * Math.sin(n.pulse);

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = intensity === 'vibrant' 
          ? `rgba(129, 140, 248, ${0.4 + 0.5 * pulseFactor})` 
          : `rgba(99, 102, 241, ${0.3 + 0.4 * pulseFactor})`;
        ctx.fill();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [intensity, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ display: 'block' }}
    />
  );
};
