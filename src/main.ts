import './style.css';
import { Engine } from './core/Engine';
import { getDeviceProfile } from './core/DeviceProfile';
import { Scheduler } from './core/Scheduler';
import { AudioManager } from './audio/AudioManager';
import { CabinScene } from './scenes/CabinScene';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const gate = document.getElementById('gate')!;
const enterBtn = document.getElementById('enter')!;

enterBtn.addEventListener('click', () => {
  gate.classList.add('hidden');

  const profile = getDeviceProfile();
  const scheduler = new Scheduler();
  const audio = new AudioManager();
  audio.resume();

  const scene = new CabinScene(scheduler, audio, profile);
  const engine = new Engine(canvas, scene, profile);

  // le scheduler tourne dans la même boucle que la scène
  const origUpdate = scene.update.bind(scene);
  (scene as any).update = (dt: number) => {
    scheduler.update(dt);
    origUpdate(dt);
  };

  engine.start();
});
