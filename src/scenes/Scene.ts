export interface Scene {
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  resize(w: number, h: number): void;
}
