export const MIN_BOARD_SIZE = 10;
export const MAX_BOARD_SIZE = 58;

export function clampBoardSize(value) {
  return Math.max(MIN_BOARD_SIZE, Math.min(MAX_BOARD_SIZE, Number(value) || MIN_BOARD_SIZE));
}
