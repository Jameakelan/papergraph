// Minimal AFRAME shim to satisfy optional VR imports in react-force-graph
// Provides no-op registration methods and stores reference on window.
const existing = (typeof window !== 'undefined' && (window as any).AFRAME) || null
const AFRAME: any = existing || {
  components: {},
  systems: {},
  registerComponent: () => {},
  registerSystem: () => {},
  utils: {},
  version: 'shim',
}
if (typeof window !== 'undefined') {
  ;(window as any).AFRAME = AFRAME
}
export default AFRAME
