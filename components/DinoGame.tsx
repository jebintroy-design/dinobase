'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  CHARACTERS,
  DEFAULT_CHARACTER_ID,
  SPRITE_PIXEL,
  type CharacterId,
} from './characters';

export type DinoGameProps = {
  onGameOver?: (score: number) => void;
  onStartRequest?: () => void;
  startToken?: number;
  canStart?: boolean;
  idlePrompt?: string;
  gameOverPrompt?: string;
  characterId?: CharacterId;
};

type GameState = 'idle' | 'running' | 'gameOver';

const BLUE = '#0000FF';
const BLACK = '#000000';
const GRAY = '#9CA3AF';
const WHITE = '#FFFFFF';

const W = 800;
const H = 240;
const GROUND_Y = 200;

const GRAVITY = 2600;
const FAST_FALL_BONUS = 3000;
const JUMP_VY = -880;

const SPEED_INIT = 300;
const SPEED_MAX = 760;
const SPEED_GROW = 0.05;

const DINO_X = 60;
const DINO_W = 56;
const DINO_H = 60;
const DINO_DUCK_W = 72;
const DINO_DUCK_H = 32;

const FIXED_DT = 1 / 60;
const MAX_ACCUM = 0.25;

type Obstacle = {
  type: 'cactus' | 'bird';
  x: number;
  y: number;
  w: number;
  h: number;
  variant: number;
  anim: number;
};

type GameRef = {
  state: GameState;
  score: number;
  speed: number;
  dinoY: number;
  dinoVy: number;
  ducking: boolean;
  legPhase: number;
  obstacles: Obstacle[];
  groundScroll: number;
  spawnTimer: number;
  nextSpawn: number;
  holdDuck: boolean;
  jumpQueued: boolean;
  blink: number;
};

function freshGame(): GameRef {
  return {
    state: 'idle',
    score: 0,
    speed: SPEED_INIT,
    dinoY: GROUND_Y - DINO_H,
    dinoVy: 0,
    ducking: false,
    legPhase: 0,
    obstacles: [],
    groundScroll: 0,
    spawnTimer: 0,
    nextSpawn: 1.2,
    holdDuck: false,
    jumpQueued: false,
    blink: 0,
  };
}

const GLYPHS: Record<string, string[]> = {
  '0': ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  '1': ['XX.', '.X.', '.X.', '.X.', 'XXX'],
  '2': ['XXX', '..X', 'XXX', 'X..', 'XXX'],
  '3': ['XXX', '..X', 'XXX', '..X', 'XXX'],
  '4': ['X.X', 'X.X', 'XXX', '..X', '..X'],
  '5': ['XXX', 'X..', 'XXX', '..X', 'XXX'],
  '6': ['XXX', 'X..', 'XXX', 'X.X', 'XXX'],
  '7': ['XXX', '..X', '..X', '..X', '..X'],
  '8': ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
  '9': ['XXX', 'X.X', 'XXX', '..X', 'XXX'],
  H: ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'],
  I: ['XXX', '.X.', '.X.', '.X.', 'XXX'],
  ' ': ['...', '...', '...', '...', '...'],
};

function pxText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text) {
    const g = GLYPHS[ch.toUpperCase()] ?? GLYPHS[' '];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if (g[r][c] === 'X') ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
      }
    }
    cx += 4 * scale;
  }
}

function pxTextWidth(text: string, scale: number): number {
  return Math.max(0, text.length * 4 * scale - scale);
}

function drawSpriteFrame(
  ctx: CanvasRenderingContext2D,
  frame: string[],
  x: number,
  y: number,
  pixel: number,
  color: string,
) {
  ctx.fillStyle = color;
  for (let r = 0; r < frame.length; r++) {
    const row = frame[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === 'X') ctx.fillRect(x + c * pixel, y + r * pixel, pixel, pixel);
    }
  }
}

export default function DinoGame({
  onGameOver,
  onStartRequest,
  startToken = 0,
  canStart = true,
  idlePrompt = 'PRESS SPACE OR TAP TO START',
  gameOverPrompt = 'PRESS SPACE OR TAP TO RESTART',
  characterId = DEFAULT_CHARACTER_ID,
}: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameRef>(freshGame());
  const highScoreRef = useRef(0);

  // Mirror frequently-changing props into refs so the stable handlers
  // (and the rAF render loop) always see fresh values without re-binding.
  const onGameOverRef = useRef(onGameOver);
  const onStartRequestRef = useRef(onStartRequest);
  const canStartRef = useRef(canStart);
  const idlePromptRef = useRef(idlePrompt);
  const gameOverPromptRef = useRef(gameOverPrompt);
  const characterIdRef = useRef(characterId);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);
  useEffect(() => {
    onStartRequestRef.current = onStartRequest;
  }, [onStartRequest]);
  useEffect(() => {
    canStartRef.current = canStart;
  }, [canStart]);
  useEffect(() => {
    idlePromptRef.current = idlePrompt;
  }, [idlePrompt]);
  useEffect(() => {
    gameOverPromptRef.current = gameOverPrompt;
  }, [gameOverPrompt]);
  useEffect(() => {
    characterIdRef.current = characterId;
  }, [characterId]);

  // Reset and begin a run whenever the parent bumps startToken.
  useEffect(() => {
    if (startToken === 0) return;
    const g = gameRef.current;
    Object.assign(g, freshGame());
    g.state = 'running';
  }, [startToken]);

  // Input: in 'running' we queue a jump; otherwise we ask the parent for a start.
  const handleJumpPress = useCallback(() => {
    const g = gameRef.current;
    if (g.state === 'running') {
      g.jumpQueued = true;
    } else if (canStartRef.current) {
      onStartRequestRef.current?.();
    }
  }, []);

  const setDuck = useCallback((on: boolean) => {
    gameRef.current.holdDuck = on;
  }, []);

  // Mobile touch: tap = jump (fires instantly on press); hold past 150ms = duck.
  // A brief unintended pre-jump while reaching duck speed is harmless — by the
  // time fast-fall lands and the duck registers, the dino is on the ground
  // ducking, well clear of any incoming obstacle.
  const HOLD_MS = 150;
  const pressTimerRef = useRef<number | null>(null);
  const isHoldingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current !== null) clearTimeout(pressTimerRef.current);
    };
  }, []);

  const releaseHold = useCallback(() => {
    if (pressTimerRef.current !== null) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (isHoldingRef.current) {
      setDuck(false);
      isHoldingRef.current = false;
    }
  }, [setDuck]);

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (pressTimerRef.current !== null) clearTimeout(pressTimerRef.current);
      isHoldingRef.current = false;
      handleJumpPress();
      pressTimerRef.current = window.setTimeout(() => {
        isHoldingRef.current = true;
        pressTimerRef.current = null;
        setDuck(true);
      }, HOLD_MS);
    },
    [handleJumpPress, setDuck],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    let rafId = 0;
    let mounted = true;
    let last = performance.now();
    let accumulator = 0;

    const spawn = () => {
      const g = gameRef.current;
      const t = Math.min(1, g.score / 1500);
      const birdAllowed = g.score > 200;
      const birdChance = birdAllowed ? 0.15 + 0.3 * t : 0;
      const isBird = Math.random() < birdChance;

      if (isBird) {
        const w = 36;
        const h = 24;
        const high = Math.random() < 0.5;
        const y = high ? GROUND_Y - DINO_H + 4 : GROUND_Y - h;
        g.obstacles.push({
          type: 'bird',
          x: W + 24,
          y,
          w,
          h,
          variant: high ? 1 : 0,
          anim: 0,
        });
      } else {
        const variants = [
          { w: 16, h: 28 },
          { w: 22, h: 36 },
          { w: 36, h: 44 },
        ];
        const v = Math.floor(Math.random() * variants.length);
        const { w, h } = variants[v];
        g.obstacles.push({
          type: 'cactus',
          x: W + 24,
          y: GROUND_Y - h,
          w,
          h,
          variant: v,
          anim: 0,
        });
      }
    };

    const tick = (dt: number) => {
      const g = gameRef.current;
      g.blink += dt;

      if (g.state !== 'running') return;

      g.speed = Math.min(SPEED_MAX, SPEED_INIT + g.score * SPEED_GROW);
      g.score += g.speed * dt * 0.12;

      const prevH = g.ducking ? DINO_DUCK_H : DINO_H;
      const onGround = g.dinoY + prevH >= GROUND_Y - 0.001;

      if (g.jumpQueued) {
        g.jumpQueued = false;
        if (onGround) {
          g.dinoVy = JUMP_VY;
          g.ducking = false;
          g.dinoY = GROUND_Y - DINO_H;
        }
      }

      const fastFall = g.holdDuck && !onGround;
      const gravity = fastFall ? GRAVITY + FAST_FALL_BONUS : GRAVITY;
      g.dinoVy += gravity * dt;
      g.dinoY += g.dinoVy * dt;

      if (g.dinoY + DINO_H >= GROUND_Y) {
        if (g.holdDuck) {
          g.ducking = true;
          g.dinoY = GROUND_Y - DINO_DUCK_H;
        } else {
          g.ducking = false;
          g.dinoY = GROUND_Y - DINO_H;
        }
        g.dinoVy = 0;
        g.legPhase += dt * 14;
      } else {
        g.ducking = false;
      }

      for (const o of g.obstacles) {
        o.x -= g.speed * dt;
        o.anim += dt;
      }
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > -8);

      g.groundScroll += g.speed * dt;

      g.spawnTimer += dt;
      if (g.spawnTimer >= g.nextSpawn) {
        g.spawnTimer = 0;
        const minGapPx = 240;
        const maxGapPx = 520;
        g.nextSpawn = (minGapPx + Math.random() * (maxGapPx - minGapPx)) / g.speed;
        spawn();
      }

      // Shared hitbox — fairness across characters.
      const dW = g.ducking ? DINO_DUCK_W : DINO_W;
      const dH = g.ducking ? DINO_DUCK_H : DINO_H;
      const dBox = { x: DINO_X + 8, y: g.dinoY + 6, w: dW - 16, h: dH - 10 };
      for (const o of g.obstacles) {
        const ox = o.x + 4;
        const oy = o.y + 4;
        const ow = o.w - 8;
        const oh = o.h - 8;
        if (
          dBox.x < ox + ow &&
          dBox.x + dBox.w > ox &&
          dBox.y < oy + oh &&
          dBox.y + dBox.h > oy
        ) {
          g.state = 'gameOver';
          const final = Math.floor(g.score);
          if (final > highScoreRef.current) highScoreRef.current = final;
          onGameOverRef.current?.(final);
          break;
        }
      }
    };

    const drawCharacter = (g: GameRef) => {
      const char = CHARACTERS[characterIdRef.current] ?? CHARACTERS[DEFAULT_CHARACTER_ID];

      if (g.state === 'gameOver') {
        // Frozen standing pose on the ground.
        drawSpriteFrame(ctx, char.sprite.run1, DINO_X, GROUND_Y - DINO_H, SPRITE_PIXEL, BLUE);
        return;
      }

      if (g.ducking) {
        drawSpriteFrame(ctx, char.sprite.duck, DINO_X, g.dinoY, SPRITE_PIXEL, BLUE);
        return;
      }

      const inAir = g.dinoY + DINO_H < GROUND_Y - 0.001;
      if (inAir) {
        drawSpriteFrame(ctx, char.sprite.jump, DINO_X, g.dinoY, SPRITE_PIXEL, BLUE);
        return;
      }

      const phase = Math.floor(g.legPhase) % 2;
      const frame = phase === 0 ? char.sprite.run1 : char.sprite.run2;
      drawSpriteFrame(ctx, frame, DINO_X, g.dinoY, SPRITE_PIXEL, BLUE);
    };

    const drawCactus = (o: Obstacle) => {
      ctx.fillStyle = BLACK;
      const tw = o.variant === 2 ? 12 : 8;
      ctx.fillRect(o.x + (o.w - tw) / 2, o.y, tw, o.h);
      const armY = o.y + Math.floor(o.h * 0.35);
      ctx.fillRect(o.x, armY, 8, 6);
      ctx.fillRect(o.x, Math.max(o.y, armY - 14), 6, Math.min(16, armY - o.y + 4));
      const armY2 = o.y + Math.floor(o.h * 0.55);
      ctx.fillRect(o.x + o.w - 8, armY2, 8, 6);
      ctx.fillRect(o.x + o.w - 6, Math.max(o.y, armY2 - 18), 6, Math.min(20, armY2 - o.y + 4));
    };

    const drawBird = (o: Obstacle) => {
      ctx.fillStyle = BLACK;
      const flap = Math.floor(o.anim * 6) % 2;
      ctx.fillRect(o.x + 8, o.y + 8, 20, 8);
      ctx.fillRect(o.x + 22, o.y + 4, 8, 8);
      ctx.fillRect(o.x + 30, o.y + 8, 6, 4);
      ctx.fillRect(o.x, o.y + 8, 8, 4);
      if (flap === 0) ctx.fillRect(o.x + 10, o.y, 14, 6);
      else ctx.fillRect(o.x + 10, o.y + 16, 14, 6);
      ctx.fillStyle = WHITE;
      ctx.fillRect(o.x + 26, o.y + 6, 2, 2);
    };

    const render = () => {
      const g = gameRef.current;

      ctx.fillStyle = WHITE;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = BLACK;
      ctx.fillRect(0, GROUND_Y, W, 4);

      ctx.fillStyle = GRAY;
      const tile = 28;
      const off = Math.floor(g.groundScroll) % tile;
      for (let x = -off; x < W; x += tile) {
        ctx.fillRect(x, GROUND_Y + 10, 14, 4);
      }
      const pebbleTile = 140;
      const pebbleOff = Math.floor(g.groundScroll * 0.5) % pebbleTile;
      for (let x = -pebbleOff; x < W; x += pebbleTile) {
        ctx.fillRect(x + 20, GROUND_Y + 22, 8, 4);
      }

      for (const o of g.obstacles) {
        if (o.type === 'cactus') drawCactus(o);
        else drawBird(o);
      }

      drawCharacter(g);

      const cur = Math.floor(g.score).toString().padStart(5, '0');
      const hiVal = Math.max(highScoreRef.current, Math.floor(g.score));
      const hiStr = 'HI ' + hiVal.toString().padStart(5, '0');
      const scale = 3;
      const scoreW = pxTextWidth(cur, scale);
      pxText(ctx, cur, W - 16 - scoreW, 16, scale, BLACK);
      const hiW = pxTextWidth(hiStr, scale);
      pxText(ctx, hiStr, W - 16 - scoreW - 32 - hiW, 16, scale, GRAY);

      if (g.state === 'idle') {
        if (Math.floor(g.blink * 1.5) % 2 === 0) {
          ctx.fillStyle = BLACK;
          ctx.font = 'bold 30px ui-monospace, "Cascadia Mono", "Courier New", monospace';
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          ctx.fillText(idlePromptRef.current, W / 2, H / 2 - 12);
        }
      } else if (g.state === 'gameOver') {
        ctx.fillStyle = BLACK;
        ctx.font = 'bold 42px ui-monospace, "Cascadia Mono", "Courier New", monospace';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
        if (Math.floor(g.blink * 1.5) % 2 === 0) {
          ctx.font = 'bold 22px ui-monospace, "Cascadia Mono", "Courier New", monospace';
          ctx.fillText(gameOverPromptRef.current, W / 2, H / 2 + 12);
        }
      }
    };

    const loop = (now: number) => {
      if (!mounted) return;
      const delta = Math.min((now - last) / 1000, MAX_ACCUM);
      last = now;
      accumulator += delta;
      while (accumulator >= FIXED_DT) {
        tick(FIXED_DT);
        accumulator -= FIXED_DT;
      }
      render();
      rafId = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) {
        if (e.code === 'ArrowDown') e.preventDefault();
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJumpPress();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setDuck(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') setDuck(false);
    };
    const onBlur = () => setDuck(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    rafId = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [handleJumpPress, setDuck]);

  return (
    <div className="w-full max-w-[800px] mx-auto select-none">
      <canvas
        ref={canvasRef}
        aria-label="Dino runner game"
        className="block w-full h-auto bg-white border-2 border-black touch-none"
        style={{ imageRendering: 'pixelated', aspectRatio: '800 / 240' }}
        onPointerDown={onCanvasPointerDown}
        onPointerUp={releaseHold}
        onPointerCancel={releaseHold}
        onPointerLeave={releaseHold}
      />
      <p className="mt-3 font-mono text-[11px] sm:text-xs text-black/60 leading-tight text-center tracking-wider">
        TAP / SPACE / ↑ &nbsp;JUMP &nbsp;·&nbsp; HOLD / ↓ &nbsp;DUCK
      </p>
    </div>
  );
}
