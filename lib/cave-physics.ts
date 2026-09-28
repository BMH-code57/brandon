export const WORLD_WIDTH = 1536;
export const WORLD_HEIGHT = 1024;
// Walkable floor follows the inside edge of the cave artwork.
export const floorBoundary = [
  [460, 290], [550, 170], [730, 155], [935, 230], [1080, 300],
  [1210, 310], [1325, 390], [1340, 545], [1190, 640], [1140, 760],
  [950, 830], [845, 855], [690, 920], [540, 890], [470, 785],
  [450, 680], [300, 595], [205, 515], [160, 440], [240, 365], [370, 330],
];
export function isWalkable(x: number, y: number) {
  let inside = false;
  for (let i = 0, j = floorBoundary.length - 1; i < floorBoundary.length; j = i++) {
    const [xi, yi] = floorBoundary[i], [xj, yj] = floorBoundary[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function movePlayer(x: number, y: number, dx: number, dy: number) {
  const nextX = isWalkable(x + dx, y) ? x + dx : x;
  return { x: nextX, y: isWalkable(nextX, y + dy) ? y + dy : y };
}
