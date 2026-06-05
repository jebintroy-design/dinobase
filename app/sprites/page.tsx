'use client';

import { useEffect, useRef } from 'react';
import { CHARACTER_LIST, type Character } from '@/components/characters';

const BLUE = '#0000FF';
const WHITE = '#FFFFFF';
const PREVIEW_PIXEL = 8;

const FRAME_LABELS: Array<{ key: keyof Character['sprite']; label: string }> = [
  { key: 'run1', label: 'RUN 1' },
  { key: 'run2', label: 'RUN 2' },
  { key: 'jump', label: 'JUMP' },
  { key: 'duck', label: 'DUCK' },
];

function FrameCanvas({ frame, label }: { frame: string[]; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cols = frame[0]?.length ?? 0;
  const rows = frame.length;
  const w = cols * PREVIEW_PIXEL;
  const h = rows * PREVIEW_PIXEL;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = BLUE;
    for (let r = 0; r < frame.length; r++) {
      const row = frame[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === 'X') {
          ctx.fillRect(c * PREVIEW_PIXEL, r * PREVIEW_PIXEL, PREVIEW_PIXEL, PREVIEW_PIXEL);
        }
      }
    }
  }, [frame, w, h]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="border border-black/30 bg-white">
        <canvas
          ref={canvasRef}
          style={{ width: w, height: h, imageRendering: 'pixelated', display: 'block' }}
        />
      </div>
      <span className="font-mono text-[10px] tracking-widest text-black/70">
        {label} · {cols}×{rows}
      </span>
    </div>
  );
}

function CharacterPreview({ character }: { character: Character }) {
  return (
    <section className="flex flex-col gap-4 border-2 border-black p-6">
      <h2 className="font-mono text-lg font-bold tracking-widest text-black">
        {character.name}
        <span className="ml-3 text-xs text-black/40">/{character.id}</span>
      </h2>
      <div className="flex flex-wrap gap-8 items-end">
        {FRAME_LABELS.map(({ key, label }) => (
          <FrameCanvas key={key} frame={character.sprite[key]} label={label} />
        ))}
      </div>
    </section>
  );
}

export default function SpritesPreviewPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 flex flex-col items-center">
      <div className="w-full max-w-[1100px] flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="font-mono text-3xl font-bold tracking-tight text-black lowercase">
            sprite preview
          </h1>
          <p className="font-mono text-xs text-black/60">
            Every character&apos;s four frames at {PREVIEW_PIXEL}× scale. Stand /
            run / jump frames are 14×15. Duck frames are 18×8. All rendered in
            Base Blue #0000FF.
          </p>
        </header>
        <div className="flex flex-col gap-6">
          {CHARACTER_LIST.map((c) => (
            <CharacterPreview key={c.id} character={c} />
          ))}
        </div>
      </div>
    </main>
  );
}
