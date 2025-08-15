import React, { useState, useEffect, useRef } from "react";

const TextCursor = ({
  text = "✨",
  // eslint-disable-next-line no-unused-vars
  delay = 0.01,
  spacing = 80,
  followMouseDirection = true,
  randomFloat = true,
  exitDuration = 1.5,
  removalInterval = 50,
  maxPoints = 8,
}) => {
  const [trail, setTrail] = useState([]);
  const containerRef = useRef(null);
  const lastMoveTimeRef = useRef(Date.now());
  const idCounter = useRef(0);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTrail((prev) => {
      let newTrail = [...prev];
      if (newTrail.length === 0) {
        newTrail.push({
          id: idCounter.current++,
          x: mouseX,
          y: mouseY,
          angle: 0,
          ...(randomFloat && {
            randomX: Math.random() * 15 - 7.5,
            randomY: Math.random() * 15 - 7.5,
            randomRotate: Math.random() * 20 - 10,
          }),
        });
      } else {
        const last = newTrail[newTrail.length - 1];
        const dx = mouseX - last.x;
        const dy = mouseY - last.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= spacing) {
          let rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (rawAngle > 90) rawAngle -= 180;
          else if (rawAngle < -90) rawAngle += 180;
          const computedAngle = followMouseDirection ? rawAngle : 0;
          const steps = Math.floor(distance / spacing);
          for (let i = 1; i <= steps; i++) {
            const t = (spacing * i) / distance;
            const newX = last.x + dx * t;
            const newY = last.y + dy * t;
            newTrail.push({
              id: idCounter.current++,
              x: newX,
              y: newY,
              angle: computedAngle,
              ...(randomFloat && {
                randomX: Math.random() * 15 - 7.5,
                randomY: Math.random() * 15 - 7.5,
                randomRotate: Math.random() * 20 - 10,
              }),
            });
          }
        }
      }
      if (newTrail.length > maxPoints) {
        newTrail = newTrail.slice(newTrail.length - maxPoints);
      }
      return newTrail;
    });
    lastMoveTimeRef.current = Date.now();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastMoveTimeRef.current > 200) {
        setTrail((prev) => (prev.length > 0 ? prev.slice(1) : prev));
      }
    }, removalInterval);
    return () => clearInterval(interval);
  }, [removalInterval]);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0">
      <div className="absolute inset-0 pointer-events-none">
        {trail.map((item) => (
          <div
            key={item.id}
            className="absolute select-none whitespace-nowrap text-2xl opacity-80 transition-all duration-1000 ease-out"
            style={{ 
              left: item.x, 
              top: item.y,
              transform: `rotate(${item.angle + (item.randomRotate || 0)}deg) translate(${item.randomX || 0}px, ${item.randomY || 0}px)`,
              animation: `fadeInOut ${exitDuration}s ease-out forwards, float 3s ease-in-out infinite`
            }}
          >
            {text}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default TextCursor;