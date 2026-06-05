'use client';

import { useEffect, useRef } from 'react';
import {
  CHARACTERS,
  DEFAULT_CHARACTER_ID,
  nextCharacterId,
  type Character,
  type CharacterId,
} from './characters';

const BLUE = '#0000FF';
const WHITE = '#FFFFFF';
const PREVIEW_PIXEL = 3;

function SpriteThumb({ character }: { character: Character }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const frame = character.sprite.run1;
    const cols = frame[0]?.length ?? 0;
    const rows = frame.length;
    canvas.width = cols * PREVIEW_PIXEL;
    canvas.height = rows * PREVIEW_PIXEL;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BLUE;
    for (let r = 0; r < rows; r++) {
      const row = frame[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === 'X') {
          ctx.fillRect(c * PREVIEW_PIXEL, r * PREVIEW_PIXEL, PREVIEW_PIXEL, PREVIEW_PIXEL);
        }
      }
    }
  }, [character]);

  return (
    <canvas
      ref={canvasRef}
      style={{ imageRendering: 'pixelated', display: 'block' }}
      aria-hidden
    />
  );
}

export default function CharacterCycleButton({
  current,
  disabled,
  onCycle,
}: {
  current: CharacterId;
  disabled?: boolean;
  onCycle: (next: CharacterId) => void;
}) {
  const character = CHARACTERS[current] ?? CHARACTERS[DEFAULT_CHARACTER_ID];
  const upcoming = CHARACTERS[nextCharacterId(character.id)];

  return (
    <button
      type="button"
      onClick={() => onCycle(upcoming.id)}
      disabled={disabled}
      aria-label={`Character: ${character.name}. Tap to switch to ${upcoming.name}.`}
      className={[
        'w-full flex items-center justify-between gap-4 py-4 px-5',
        'bg-black text-white border-2 border-black',
        'active:bg-white active:text-black transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-none select-none',
      ].join(' ')}
    >
      <span className="bg-white border-2 border-black p-1.5 flex items-center justify-center shrink-0">
        <SpriteThumb character={character} />
      </span>
      <span className="font-mono text-2xl sm:text-3xl font-bold tracking-widest flex-1 text-center">
        {character.name}
      </span>
      <span className="font-mono text-[10px] sm:text-xs opacity-70 tracking-widest text-right shrink-0">
        TAP TO
        <br />
        SWAP
      </span>
    </button>
  );
}
