import * as THREE from 'three'
import { asset } from '../utils/asset'
import { bindScene } from '../animations/scroll'
import { el, qs, seg, easeInOut, lerp } from '../utils/dom'
import { isMobile, reducedMotion, tier } from '../utils/device'

const VERT = `varying vec3 vN; varying vec2 vUv;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const FRAG = `uniform sampler2D day; uniform sampler2D night; uniform vec3 sunDir; uniform float hasNight;
varying vec3 vN; varying vec2 vUv;
void main(){
  vec3 n = normalize(vN); float d = dot(n, normalize(sunDir));
  float lit = smoothstep(-0.12, 0.38, d);
  vec3 dayC = texture2D(day, vUv).rgb;
  vec3 nightC = mix(dayC * 0.06, texture2D(night, vUv).rgb * vec3(1.0, 0.84, 0.58) * 3.1, hasNight);
  vec3 col = mix(nightC, dayC * (0.3 + 0.8 * max(d, 0.0)), lit);
  col += vec3(0.95, 0.5, 0.2) * pow(1.0 - abs(d), 9.0) * 0.28 * (1.0 - lit);
  gl_FragColor = vec4(col, 1.0);
}`
const ATM_V = `varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`
const ATM_F = `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 4.2); gl_FragColor = vec4(vec3(0.72, 0.60, 0.48) * f, f * 0.42); }`

/** Origins: Turkey/Lebanon/Egypt at 32°E, 36°N → Marlboro NJ at 74.3°W, 40.3°N. */
const FROM = { lon: 32, lat: 36 }, TO = { lon: -74.3065, lat: 40.3316 }

export function mountEarth(film: HTMLElement) {
  const section = el(`<section class="scene scene--pin s01" style="--len:${isMobile() ? 1.2 : 1.6}" data-scene="Origins" aria-label="From the Mediterranean to New Jersey">
    <div class="stage">
      <canvas class="s01__canvas" aria-hidden="true"></canvas>
      <div class="s01__copy">
        <p class="s01__line s01__line--a display">From the eastern Mediterranean</p>
        <p class="s01__line s01__line--b display">to a small stretch of <em class="warm">Route 9</em></p>
      </div>
      <div class="s01__origin"><span class="eyebrow">Recipes carried from</span><span class="display">Turkey · Lebanon · Egypt</span></div>
      <div class="scroll-hint">Scroll to arrive</div>
    </div></section>`)
  film.appendChild(section)
  const canvas = qs<HTMLCanvasElement>('.s01__canvas', section)
  const lineA = qs('.s01__line--a', section), lineB = qs('.s01__line--b', section), origin = qs('.s01__origin', section), hint = qs('.scroll-hint', section)

  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: tier > 0, alpha: true, powerPreference: 'high-performance' }) }
  catch { canvas.remove(); return { section, ready: Promise.resolve() } }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier === 2 ? 2 : 1.25))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200)
  const loader = new THREE.TextureLoader()
  const uniforms = { day: { value: null as THREE.Texture | null }, night: { value: null as THREE.Texture | null }, sunDir: { value: new THREE.Vector3(0.6, 0.35, 0.8) }, hasNight: { value: 0 } }
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1, tier > 0 ? 96 : 48, tier > 0 ? 96 : 48), new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG }))
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.04, 64, 64), new THREE.ShaderMaterial({ vertexShader: ATM_V, fragmentShader: ATM_F, transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false }))
  scene.add(globe, atmo)
  const n = tier === 2 ? 1800 : 700, pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { const r = 30 + Math.random() * 40, t = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); pos.set([r * Math.sin(ph) * Math.cos(t), r * Math.sin(ph) * Math.sin(t), r * Math.cos(ph)], i * 3) }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)), new THREE.PointsMaterial({ color: 0xfff1d6, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.85 }))
  scene.add(stars)

  const ready = new Promise<void>((res) => {
    loader.load(asset('assets/earth/earth_atmos_2048.jpg'), (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; uniforms.day.value = t; render(); res() })
    if (tier > 0) loader.load(asset('assets/earth/earth_lights_2048.png'), (t) => { t.colorSpace = THREE.SRGBColorSpace; uniforms.night.value = t; uniforms.hasNight.value = 1; render() })
  })

  const resize = () => { const w = section.clientWidth, h = Math.min(innerHeight, section.querySelector('.stage')!.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < 1 ? Math.min(70, 36 / camera.aspect) : 36; camera.updateProjectionMatrix(); render() }
  addEventListener('resize', resize, { passive: true })

  const face = (lon: number, lat: number) => globe.rotation.set(THREE.MathUtils.degToRad(lat), THREE.MathUtils.degToRad(-90 - lon), 0)
  let progress = 0, drift = 0
  const S0 = new THREE.Vector3(0.6, 0.35, 0.85), S1 = new THREE.Vector3(-0.9, 0.25, -0.3)
  function apply(p: number) {
    progress = p
    const t = easeInOut(seg(p, 0, 0.82))
    face(lerp(FROM.lon, TO.lon, t) + drift, lerp(FROM.lat, TO.lat, t))
    camera.position.z = lerp(isMobile() ? 3.7 : 3.2, isMobile() ? 1.7 : 1.55, easeInOut(seg(p, 0.42, 1)))
    uniforms.sunDir.value.copy(S0).lerp(S1, easeInOut(seg(p, 0.1, 0.9))).normalize()
    stars.rotation.y = p * 0.15
    // copy
    const a = 1 - seg(p, 0.3, 0.42), b = seg(p, 0.5, 0.62) * (1 - seg(p, 0.86, 0.95)), o = 1 - seg(p, 0.28, 0.4)
    lineA.style.opacity = `${a}`; lineA.style.transform = `translateY(${24 * (1 - a)}px)`
    lineB.style.opacity = `${b}`; lineB.style.transform = `translateY(${24 * (1 - b)}px)`
    origin.style.opacity = `${o}`; hint.style.opacity = `${1 - seg(p, 0, 0.08)}`
    // exit: the coastline lights dissolve into the map below
    const x = seg(p, 0.9, 1)
    canvas.style.filter = x ? `blur(${x * 14}px) brightness(${1 - x * 0.5})` : ''
    canvas.style.opacity = `${1 - x * 0.55}`
    render()
  }
  function render() { renderer.render(scene, camera) }
  let raf = 0
  const idle = () => { drift += 0.012; apply(progress); raf = requestAnimationFrame(idle) }
  bindScene(section, apply, {
    onEnter: () => { if (!raf && !reducedMotion && tier > 0) raf = requestAnimationFrame(idle) },
    onLeave: () => { cancelAnimationFrame(raf); raf = 0 },
  })
  if (reducedMotion) { face(TO.lon, TO.lat); camera.position.z = 1.6; lineA.style.opacity = lineB.style.opacity = origin.style.opacity = '1'; lineB.style.position = 'static' }
  resize(); if (!reducedMotion && tier > 0) raf = requestAnimationFrame(idle)
  return { section, ready }
}
