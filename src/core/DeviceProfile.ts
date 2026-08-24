export interface DeviceProfile {
  isMobile: boolean;
  dpr: number;
  maxParticles: number;
}

export function getDeviceProfile(): DeviceProfile {
  const isMobile = Math.min(screen.width, screen.height) < 768;
  return {
    isMobile,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    maxParticles: isMobile ? 250 : 600,
  };
}
