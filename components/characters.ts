// Sprite format: each frame is a list of equal-length strings.
// 'X' = filled pixel (drawn in Base Blue).
// '.' or ' ' = transparent (the canvas BG / what's behind shows through).
//
// All STAND/RUN/JUMP frames are 14 cols × 15 rows  → 56 × 60 at pixel scale 4.
// All DUCK frames are              18 cols × 8 rows → 72 × 32 at pixel scale 4.
//
// Every character shares the same hitbox via these fixed dimensions, so only
// the silhouette varies — collision and difficulty are identical.

export type CharacterSprite = {
  run1: string[];
  run2: string[];
  jump: string[];
  duck: string[];
};

export type Character = {
  id: CharacterId;
  name: string;
  sprite: CharacterSprite;
};

export type CharacterId = 'dino' | 'ghost' | 'robot';

export const SPRITE_PIXEL = 4;
export const SPRITE_STAND_COLS = 14;
export const SPRITE_STAND_ROWS = 15;
export const SPRITE_DUCK_COLS = 18;
export const SPRITE_DUCK_ROWS = 8;

const DINO: Character = {
  id: 'dino',
  name: 'DINO',
  sprite: {
    run1: [
      '........XXXXXX',
      '........XXXXXX',
      '........XXX.XX',
      '........XXXXXX',
      '........XXXXXX',
      'XXX.....XXXXXX',
      'XXX.....XXXX..',
      'XXXXXXXXXXXX..',
      'XXXXXXXXXXX...',
      'XXXXXXXXXXX...',
      'XXXXXXXXXXX...',
      '.XXXXXXXXX....',
      '.XXXXXXXXX....',
      '..XX..XX......',
      '..XX..........',
    ],
    run2: [
      '........XXXXXX',
      '........XXXXXX',
      '........XXX.XX',
      '........XXXXXX',
      '........XXXXXX',
      'XXX.....XXXXXX',
      'XXX.....XXXX..',
      'XXXXXXXXXXXX..',
      'XXXXXXXXXXX...',
      'XXXXXXXXXXX...',
      'XXXXXXXXXXX...',
      '.XXXXXXXXX....',
      '.XXXXXXXXX....',
      '..XX..XX......',
      '......XX......',
    ],
    jump: [
      '........XXXXXX',
      '........XXXXXX',
      '........XXX.XX',
      '........XXXXXX',
      '........XXXXXX',
      'XXX.....XXXXXX',
      'XXX.....XXXX..',
      'XXXXXXXXXXXX..',
      'XXXXXXXXXXX...',
      'XXXXXXXXXXX...',
      'XXXXXXXXXXX...',
      '.XXXXXXXXX....',
      '.XXXXXXXXX....',
      '..XX..XX......',
      '..XX..XX......',
    ],
    duck: [
      '..................',
      'XXX.........XXXXXX',
      'XXX.........XXX.XX',
      'XXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXX...',
      '....XX...XX.......',
      '....XX............',
    ],
  },
};

const GHOST: Character = {
  id: 'ghost',
  name: 'GHOST',
  sprite: {
    run1: [
      '..............',
      '.....XXXXX....',
      '...XXXXXXXXX..',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XX.XX.XX.XX.',
      '..XX.XX.XX.XX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..X.XX.XX.XX.X',
    ],
    run2: [
      '..............',
      '.....XXXXX....',
      '...XXXXXXXXX..',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XX.XX.XX.XX.',
      '..XX.XX.XX.XX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XX.XX.XX.XX.',
    ],
    jump: [
      '.....XXXXX....',
      '...XXXXXXXXX..',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XX.XX.XX.XX.',
      '..XX.XX.XX.XX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XXXXXXXXXXX.',
      '..XX.XX.XX.XX.',
      'X.X.X.XXX.X.X.',
    ],
    duck: [
      '..................',
      '.....XXXXXXXX.....',
      '...XXXXXXXXXXXX...',
      '..XXXXXXXXXXXXXX..',
      '..XX.XX.XX.XX.XX..',
      '..XXXXXXXXXXXXXX..',
      '..XXXXXXXXXXXXXX..',
      '..XX.XX.XX.XX.XX..',
    ],
  },
};

const ROBOT: Character = {
  id: 'robot',
  name: 'ROBOT',
  sprite: {
    run1: [
      '......X.......',
      '......X.......',
      '....XXXXX.....',
      '....X.X.X.....',
      '....XXXXX.....',
      '.....XXX......',
      '..XXXXXXXXX...',
      '.X.XXXXXXX.X..',
      '.X.XXXXXXX.X..',
      '.X.XXXXXXX.X..',
      '...XXXXXXX....',
      '...XX.X.XX....',
      '...XX...XX....',
      '...XX...XX....',
      '..XXX...XXX...',
    ],
    run2: [
      '......X.......',
      '......X.......',
      '....XXXXX.....',
      '....X.X.X.....',
      '....XXXXX.....',
      '.....XXX......',
      '..XXXXXXXXX...',
      '.X.XXXXXXX.X..',
      '.X.XXXXXXX.X..',
      '.X.XXXXXXX.X..',
      '...XXXXXXX....',
      '...XX.X.XX....',
      '...XX...XX....',
      '...X.....X....',
      '..XX.....XX...',
    ],
    jump: [
      '......X.......',
      '......X.......',
      '....XXXXX.....',
      '....X.X.X.....',
      '....XXXXX.....',
      '.....XXX......',
      '..XXXXXXXXX...',
      '.X.XXXXXXX.X..',
      'X..XXXXXXX..X.',
      'X..XXXXXXX..X.',
      '...XXXXXXX....',
      '...XX.X.XX....',
      '...XX...XX....',
      '...XX...XX....',
      '...XX...XX....',
    ],
    duck: [
      '..................',
      '........X.........',
      '......XXXXX.......',
      '......X.X.X.......',
      '..XXXXXXXXXXXXXX..',
      'XX.XXXXXXXXXXXX.XX',
      '...XX.XX.XX.XX....',
      '..XXX.XX.XX.XXX...',
    ],
  },
};

export const CHARACTER_LIST: readonly Character[] = [DINO, GHOST, ROBOT];

export const CHARACTERS: Record<CharacterId, Character> = Object.fromEntries(
  CHARACTER_LIST.map((c) => [c.id, c]),
) as Record<CharacterId, Character>;

export const DEFAULT_CHARACTER_ID: CharacterId = 'dino';

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === 'string' && value in CHARACTERS;
}

export function nextCharacterId(current: CharacterId): CharacterId {
  const idx = CHARACTER_LIST.findIndex((c) => c.id === current);
  const next = CHARACTER_LIST[(idx + 1) % CHARACTER_LIST.length];
  return next.id;
}
