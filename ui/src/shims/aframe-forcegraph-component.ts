import './aframe'

const AFRAME: any = (typeof window !== 'undefined' && (window as any).AFRAME) || null

if (AFRAME && typeof AFRAME.registerComponent === 'function') {
  // Register a no-op component to satisfy imports without requiring real A-Frame.
  AFRAME.registerComponent('forcegraph', {
    schema: {},
    init() {},
  })
}

export default AFRAME
