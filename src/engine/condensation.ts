interface CondensationDrop {
  x: number;
  y: number;
  r: number;
  sliding: boolean;
  slideProgress: number;
  slideDistance: number;
}

const COUNT = 18;

/**
 * Small beads on the glass, drawn last (nearest the viewer) and
 * deliberately soft-focus. Shared across every ambiance: whatever's
 * happening outside, it's still the same window being looked through.
 */
export class Condensation {
  private width = 0;
  private height = 0;
  private drops: CondensationDrop[] = [];

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.drops.length === 0) {
      for (let i = 0; i < COUNT; i++) this.drops.push(this.makeDrop());
    }
  }

  private makeDrop(): CondensationDrop {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      r: 4 + Math.random() * 7,
      sliding: false,
      slideProgress: 0,
      slideDistance: 0,
    };
  }

  update(ctx: CanvasRenderingContext2D, dt: number): void {
    ctx.filter = 'blur(1.4px)';
    for (const cd of this.drops) {
      if (cd.sliding) {
        const slideSpeed = 26 + cd.r * 3;
        cd.y += slideSpeed * dt;
        cd.slideProgress += slideSpeed * dt;
        if (cd.slideProgress >= cd.slideDistance || cd.y > this.height) cd.sliding = false;
      } else if (Math.random() < 0.0006) {
        cd.sliding = true;
        cd.slideProgress = 0;
        cd.slideDistance = 40 + Math.random() * 120;
      }

      if (cd.y > this.height) {
        cd.y = -10;
        cd.x = Math.random() * this.width;
      }

      if (cd.sliding) {
        ctx.beginPath();
        ctx.moveTo(cd.x, cd.y - cd.slideProgress);
        ctx.lineTo(cd.x, cd.y);
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.18)';
        ctx.lineWidth = cd.r * 0.6;
        ctx.stroke();
      }

      const grad = ctx.createRadialGradient(cd.x - cd.r * 0.3, cd.y - cd.r * 0.3, 0, cd.x, cd.y, cd.r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      grad.addColorStop(0.5, 'rgba(210, 225, 245, 0.28)');
      grad.addColorStop(1, 'rgba(210, 225, 245, 0)');
      ctx.beginPath();
      ctx.arc(cd.x, cd.y, cd.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    ctx.filter = 'none';
  }
}
