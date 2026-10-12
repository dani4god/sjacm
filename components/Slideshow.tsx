"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { slides } from "@/lib/slides";
export default function Slideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || motion.matches) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      3000,
    );
    return () => clearInterval(timer);
  }, [paused]);
  return (
    <div className="slideshow" aria-label="Church photographs">
      <div className="slides">
        {slides.map((s, i) => (
          <div
            className={`slide ${i === active ? "active" : ""}`}
            key={s.src}
            aria-hidden={i !== active}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              sizes="(max-width: 800px) 100vw, 55vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      <div className="slide-caption">
        <span>{slides[active].caption}</span>
        <div className="slide-controls">
          <button
            type="button"
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? "Play" : "Pause"}
          </button>
          {slides.map((s, i) => (
            <button
              type="button"
              key={s.src}
              className={`dot ${active === i ? "selected" : ""}`}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={active === i}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
