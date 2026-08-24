type Task = { time: number; fn: () => void };

export class Scheduler {
  private tasks: Task[] = [];

  /** Exécute fn après delay secondes */
  after(delay: number, fn: () => void): void {
    this.tasks.push({ time: delay, fn });
  }

  /** Exécute fn après un délai aléatoire entre min et max */
  afterRandom(min: number, max: number, fn: () => void): void {
    this.after(min + Math.random() * (max - min), fn);
  }

  /** Répète fn indéfiniment avec des intervalles aléatoires [min, max] */
  everyRandom(min: number, max: number, fn: () => void): void {
    const loop = () => {
      fn();
      this.afterRandom(min, max, loop);
    };
    this.afterRandom(min, max, loop);
  }

  update(dt: number): void {
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      this.tasks[i].time -= dt;
      if (this.tasks[i].time <= 0) {
        const task = this.tasks.splice(i, 1)[0];
        task.fn();
      }
    }
  }
}
