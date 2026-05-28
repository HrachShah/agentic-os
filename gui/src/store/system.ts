import { create } from 'zustand'

interface SystemStore {
  time: Date
  batteryLevel: number
  batteryCharging: boolean
  wifiConnected: boolean
  wifiStrength: number  // 0-4
  volume: number        // 0-100
  brightness: number    // 0-100
  // actions
  tick: () => void
  setVolume: (v: number) => void
  setBrightness: (b: number) => void
}

export const useSystemStore = create<SystemStore>((set) => ({
  time: new Date(),
  batteryLevel: 85,
  batteryCharging: false,
  wifiConnected: true,
  wifiStrength: 3,
  volume: 70,
  brightness: 80,

  tick() { set({ time: new Date() }) },
  setVolume(v) { set({ volume: Math.max(0, Math.min(100, v)) }) },
  setBrightness(b) { set({ brightness: Math.max(0, Math.min(100, b)) }) },
}))

// Start clock
setInterval(() => useSystemStore.getState().tick(), 1000)
