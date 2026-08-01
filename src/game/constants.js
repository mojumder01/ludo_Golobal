// Classic 15x15 Ludo board topology.
// Grid uses [row, col], 0-indexed, 0-14.

export const GRID_SIZE = 15;

export const COLORS = ['red', 'green', 'yellow', 'blue'];

export const COLOR_HEX = {
  red: '#e84142',
  green: '#2fb872',
  yellow: '#f0b429',
  blue: '#3b82f6',
};

// The 52-cell shared ring, traced clockwise starting just below the
// red base's exit square. Index i is one step of shared travel.
export const RING_PATH = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

// Each color's index into RING_PATH where its tokens enter the board.
export const START_INDEX = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Cells that are safe from capture: every start cell plus one star cell
// per arm (start index + 8).
export const SAFE_RING_INDICES = new Set(
  COLORS.flatMap((c) => [START_INDEX[c], (START_INDEX[c] + 8) % 52])
);

// Home stretch: 5 colored cells leading from the ring into the centre,
// private to each color (relative positions 51-55 of a token's journey).
export const HOME_COLUMNS = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

export const CENTER_CELL = [7, 7];

// Corner origin (top-left of each 6x6 base quadrant) and the four token
// resting slots within it, relative to that origin.
export const BASE_ORIGIN = {
  red: [0, 0],
  green: [0, 9],
  yellow: [9, 9],
  blue: [9, 0],
};

export const BASE_SLOT_OFFSETS = [
  [1, 1],
  [1, 4],
  [4, 1],
  [4, 4],
];

export function baseSlotCell(color, tokenIndex) {
  const [or, oc] = BASE_ORIGIN[color];
  const [dr, dc] = BASE_SLOT_OFFSETS[tokenIndex];
  return [or + dr, oc + dc];
}

// A token's progress is a single integer:
//   -1        -> sitting in base (not yet on board)
//   0..50     -> index of shared-travel step (51 steps on the ring)
//   51..55    -> index into that color's HOME_COLUMNS (5 cells)
//   56        -> finished (reached the centre)
export const STEPS_TO_FINISH = 56;
export const HOME_COLUMN_START = 51;

// Resolve a token's progress value to a concrete board cell (or null for
// base/finished, which are rendered specially).
export function cellForProgress(color, progress) {
  if (progress < 0 || progress > STEPS_TO_FINISH) return null;
  if (progress === STEPS_TO_FINISH) return CENTER_CELL;
  if (progress >= HOME_COLUMN_START) {
    return HOME_COLUMNS[color][progress - HOME_COLUMN_START];
  }
  const ringIndex = (START_INDEX[color] + progress) % 52;
  return RING_PATH[ringIndex];
}

// Whether a given progress value sits on the shared ring (and can
// therefore be captured / capture others).
export function isOnSharedRing(progress) {
  return progress >= 0 && progress < HOME_COLUMN_START;
}

export function ringIndexForProgress(color, progress) {
  if (!isOnSharedRing(progress)) return null;
  return (START_INDEX[color] + progress) % 52;
}

export function isSafeRingIndex(ringIndex) {
  return SAFE_RING_INDICES.has(ringIndex);
}
