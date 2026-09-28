export const SECRET_BOOK = { x: 768, y: 230, radius: 155 };
export function nextBookCount(current: number, action: "book" | "move" | "other") {
  return action === "book" ? Math.min(4, current + 1) : 0;
}
