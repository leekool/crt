<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { createUIScene } from './UIScene'
  import type { UIScene } from './UIScene'
  import { makeCRTNode } from './shader'
  import type { CRTFlags } from './shader'
  import {
    WebGPURenderer, MeshBasicNodeMaterial,
    Mesh, PlaneGeometry, Scene,
    OrthographicCamera, WebGLRenderTarget,
    CanvasTexture, LinearFilter, NearestFilter, Vector2, SRGBColorSpace
  } from 'three/webgpu'
  import { uniform, texture as textureTSL, uv, vec2, float } from 'three/tsl'
  import type TextureNode from 'three/src/nodes/accessors/TextureNode.js'
  import type UniformNode from 'three/src/nodes/core/UniformNode.js'
  import type { Vector2 as Vector2Type } from 'three'

  let {
    // INTENSITY
    chromAb = 1.0,
    bleed = 1.0,
    scanlines = 1.0,
    shadowmask = 1.0,
    bloom = 1.0,
    halation = 0.0,
    vignette = 0.0,
    ghosting = 1.0,
    barrel = 0,
    ignoreEl = null,
    // CHROMATIC ABERRATION
    caOffset = 0.004,
    caVertical = 0.0,
    // COLOR BLEED & GHOSTING
    bleedKernel = 0.25,
    ghostDecay = 0.75,
    // BLOOM PSF
    bloomThresh = 0.35,
    bloomKnee = 0.1,
    bloomCoreSize = 1.5,
    bloomCoreWeight = 0.5,
    bloomMidSize = 4.0,
    bloomMidWeight = 0.35,
    bloomHaloSize = 12.0,
    bloomHaloWeight = 0.15,
    halationRadius = 30.0,
    // SCANLINES / BEAM
    scanFreq = 1.0,
    scanSpeed = 0.0,
    beamWidth = 0.7,
    beamSoftness = 0.15,
    phosphorDecay = 0.0,
    beamDeposit = 1.0,
    // SHADOW MASK
    maskPurity = 0.65,
    triadPitchX = 3.0,
    triadPitchY = 3.0,
    slotPixelPitch = 2.0,
    triadRowShift = 0.0,
    rowBrickShift = 0.5,
    colBrickShift = 0.0,
    slotWeight = 0.8,
    slotExponent = 2.0,
    edgeSoftness = 0.15,
    triadPhase = 0.0,
    // MASK TYPE & APERTURE GRILLE
    maskType = 0.0,
    stripePitch = 3.0,
    stripeExponent = 1.5,
    grillePurity = 0.7,
    numDampingWires = 2.0,
    wireWidth = 1.5,
    wireStrength = 0.35,
    // CONVERGENCE
    convergenceR = 0.0,
    convergenceB = 0.0,
  }: {
    chromAb?: number
    bleed?: number
    scanlines?: number
    shadowmask?: number
    bloom?: number
    halation?: number
    vignette?: number
    ghosting?: number
    barrel?: number
    ignoreEl?: HTMLElement | null
    caOffset?: number
    caVertical?: number
    bleedKernel?: number
    ghostDecay?: number
    bloomThresh?: number
    bloomKnee?: number
    bloomCoreSize?: number
    bloomCoreWeight?: number
    bloomMidSize?: number
    bloomMidWeight?: number
    bloomHaloSize?: number
    bloomHaloWeight?: number
    halationRadius?: number
    scanFreq?: number
    scanSpeed?: number
    beamWidth?: number
    beamSoftness?: number
    phosphorDecay?: number
    beamDeposit?: number
    maskPurity?: number
    triadPitchX?: number
    triadPitchY?: number
    slotPixelPitch?: number
    triadRowShift?: number
    rowBrickShift?: number
    colBrickShift?: number
    slotWeight?: number
    slotExponent?: number
    edgeSoftness?: number
    triadPhase?: number
    maskType?: number
    stripePitch?: number
    stripeExponent?: number
    grillePurity?: number
    numDampingWires?: number
    wireWidth?: number
    wireStrength?: number
    convergenceR?: number
    convergenceB?: number
  } = $props()

  let containerEl: HTMLDivElement
  let renderer: WebGPURenderer | undefined
  let scene: Scene | undefined
  let camera: OrthographicCamera | undefined
  let material: MeshBasicNodeMaterial | undefined
  let displayMat: MeshBasicNodeMaterial | undefined
  let displayScene: Scene | undefined
  let ghostTargets: WebGLRenderTarget[] = []
  let ghostTexUniform: TextureNode | undefined
  let srcTexture: CanvasTexture | undefined
  let uiScene: UIScene | undefined
  let resUniform: UniformNode<'vec2', Vector2Type> | undefined
  let dtUniform: UniformNode<'float', number> | undefined
  let timeUniform: UniformNode<'float', number> | undefined
  let zoomUniform: UniformNode<'float', number> | undefined
  let readIdx: number = 0

  let W: number = 0, H: number = 0
  let lastFrame: number = 0

  let flags = $state.raw<CRTFlags | undefined>(undefined)

  function resize(): void {
    W = window.innerWidth
    H = window.innerHeight
    if (renderer) renderer.setSize(W, H)
    if (resUniform) resUniform.value.set(W, H)
    if (ghostTargets.length) {
      ghostTargets.forEach(t => t.setSize(W, H))
      if (renderer) {
        for (const gt of ghostTargets) {
          renderer.setRenderTarget(gt)
          renderer.clear()
        }
        renderer.setRenderTarget(null)
      }
    }
    uiScene?.resize(W, H)
    if (srcTexture) srcTexture.needsUpdate = true
  }

  async function initThree(): Promise<void> {
    W = window.innerWidth
    H = window.innerHeight

    const gpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator && navigator.gpu != null
    console.log('[CRT] navigator.gpu available:', gpuAvailable)
    if (gpuAvailable) {
      try {
        const adapter = await navigator.gpu.requestAdapter()
        console.log('[CRT] WebGPU adapter:', adapter ?? 'null (no compatible GPU)')
      } catch (e) {
        console.warn('[CRT] WebGPU requestAdapter threw:', e)
      }
    }

    renderer = new WebGPURenderer({ antialias: false, alpha: false })
    try {
      await renderer.init()
    } catch (e) {
      console.error('[CRT] renderer.init() threw (no fallback available):', e)
      throw e
    }
    const backendName = (renderer as any).backend?.constructor?.name ?? 'unknown'
    console.log('[CRT] renderer backend:', backendName)
    renderer.setSize(W, H)
    renderer.domElement.style.pointerEvents = 'none'
    containerEl.appendChild(renderer.domElement)

    camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    scene = new Scene()

    ghostTargets = [0, 1].map(() => new WebGLRenderTarget(W, H, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    }))

    // clear both ghost targets so the texture is initialized before the first sample
    for (const gt of ghostTargets) {
      renderer.setRenderTarget(gt)
      renderer.clear()
    }
    renderer.setRenderTarget(null)

    // UIScene: immediate-mode retro terminal drawn to offscreen canvas each frame
    uiScene = await createUIScene(W, H)
    srcTexture = new CanvasTexture(uiScene.canvas)
    srcTexture.minFilter = NearestFilter
    srcTexture.magFilter = NearestFilter
    srcTexture.colorSpace = SRGBColorSpace

    resUniform = uniform(new Vector2(W, H))
    dtUniform = uniform(1 / 60)
    timeUniform = uniform(0)
    zoomUniform = uniform(1.0)
    // GLSLNodeBuilder.isFlipY()=true auto-flips render target textures (y → 1-y) in the
    // shader. pre-invert Y so the double-flip cancels: 1-(1-y)=y → correct orientation.
    const preFlippedUV = vec2(uv().x, float(1.0).sub(uv().y))
    ghostTexUniform = textureTSL(ghostTargets[0].texture, preFlippedUV)

    flags = {
      // INTENSITY
      chromAb:         uniform(chromAb),
      bleed:           uniform(bleed),
      scanlines:       uniform(scanlines),
      shadowmask:      uniform(shadowmask),
      bloom:           uniform(bloom),
      halation:        uniform(halation),
      vignette:        uniform(vignette),
      ghosting:        uniform(ghosting),
      barrel:          uniform(barrel),
      // CHROMATIC ABERRATION
      caOffset:        uniform(caOffset),
      caVertical:      uniform(caVertical),
      // COLOR BLEED & GHOSTING
      bleedKernel:     uniform(bleedKernel),
      ghostDecay:      uniform(ghostDecay),
      // BLOOM PSF
      bloomThresh:     uniform(bloomThresh),
      bloomKnee:       uniform(bloomKnee),
      bloomCoreSize:   uniform(bloomCoreSize),
      bloomCoreWeight: uniform(bloomCoreWeight),
      bloomMidSize:    uniform(bloomMidSize),
      bloomMidWeight:  uniform(bloomMidWeight),
      bloomHaloSize:   uniform(bloomHaloSize),
      bloomHaloWeight: uniform(bloomHaloWeight),
      halationRadius:  uniform(halationRadius),
      // SCANLINES / BEAM
      scanFreq:        uniform(scanFreq),
      scanSpeed:       uniform(scanSpeed),
      beamWidth:       uniform(beamWidth),
      beamSoftness:    uniform(beamSoftness),
      phosphorDecay:   uniform(phosphorDecay),
      beamDeposit:     uniform(beamDeposit),
      // SHADOW MASK
      maskPurity:      uniform(maskPurity),
      triadPitchX:     uniform(triadPitchX),
      triadPitchY:     uniform(triadPitchY),
      slotPixelPitch:  uniform(slotPixelPitch),
      triadRowShift:   uniform(triadRowShift),
      rowBrickShift:   uniform(rowBrickShift),
      colBrickShift:   uniform(colBrickShift),
      slotWeight:      uniform(slotWeight),
      slotExponent:    uniform(slotExponent),
      edgeSoftness:    uniform(edgeSoftness),
      triadPhase:      uniform(triadPhase),
      // MASK TYPE & APERTURE GRILLE
      maskType:        uniform(maskType),
      stripePitch:     uniform(stripePitch),
      stripeExponent:  uniform(stripeExponent),
      grillePurity:    uniform(grillePurity),
      numDampingWires: uniform(numDampingWires),
      wireWidth:       uniform(wireWidth),
      wireStrength:    uniform(wireStrength),
      // CONVERGENCE
      convergenceR:    uniform(convergenceR),
      convergenceB:    uniform(convergenceB),
    }

    material = new MeshBasicNodeMaterial()
    material.colorNode = makeCRTNode(srcTexture, ghostTexUniform, resUniform, dtUniform, timeUniform, zoomUniform, flags)
    scene.add(new Mesh(new PlaneGeometry(2, 2), material))

    // Passthrough scene: just blits the ghost write target to screen.
    // CRT shader runs once (to ghost target); the screen gets a plain copy.
    // This avoids the two-shader-variant problem: three.js compiles different
    // GLSL for render-target vs screen (different outputColorSpace context),
    // so rendering the CRT shader twice produced two visually different frames.
    const displayTexNode = textureTSL(ghostTargets[0].texture, preFlippedUV)
    displayMat = new MeshBasicNodeMaterial()
    displayMat.colorNode = displayTexNode
    displayScene = new Scene()
    displayScene.add(new Mesh(new PlaneGeometry(2, 2), displayMat))

    lastFrame = performance.now()
    renderer.setAnimationLoop(() => {
      const now = performance.now()
      dtUniform!.value = Math.min((now - lastFrame) / 1000, 0.1)
      timeUniform!.value = now / 1000
      lastFrame = now

      zoomUniform!.value = uiScene!.zoom
      uiScene!.draw(now / 1000)
      srcTexture!.needsUpdate = true

      const writeIdx = 1 - readIdx
      ghostTexUniform!.value = ghostTargets[readIdx].texture

      // pass 1: CRT → ghost write target
      renderer!.setRenderTarget(ghostTargets[writeIdx])
      renderer!.render(scene!, camera!)

      // pass 2: blit ghost write target → screen (no CRT recompute)
      displayTexNode.value = ghostTargets[writeIdx].texture
      renderer!.setRenderTarget(null)
      renderer!.render(displayScene!, camera!)

      readIdx = writeIdx
    })
  }

  $effect(() => {
    if (!flags) return
    flags.chromAb.value         = chromAb
    flags.bleed.value           = bleed
    flags.scanlines.value       = scanlines
    flags.shadowmask.value      = shadowmask
    flags.bloom.value           = bloom
    flags.halation.value        = halation
    flags.vignette.value        = vignette
    flags.ghosting.value        = ghosting
    flags.barrel.value          = barrel
    flags.caOffset.value        = caOffset
    flags.caVertical.value      = caVertical
    flags.bleedKernel.value     = bleedKernel
    flags.ghostDecay.value      = ghostDecay
    flags.bloomThresh.value     = bloomThresh
    flags.bloomKnee.value       = bloomKnee
    flags.bloomCoreSize.value   = bloomCoreSize
    flags.bloomCoreWeight.value = bloomCoreWeight
    flags.bloomMidSize.value    = bloomMidSize
    flags.bloomMidWeight.value  = bloomMidWeight
    flags.bloomHaloSize.value   = bloomHaloSize
    flags.bloomHaloWeight.value = bloomHaloWeight
    flags.halationRadius.value  = halationRadius
    flags.scanFreq.value        = scanFreq
    flags.scanSpeed.value       = scanSpeed
    flags.beamWidth.value       = beamWidth
    flags.beamSoftness.value    = beamSoftness
    flags.phosphorDecay.value   = phosphorDecay
    flags.beamDeposit.value     = beamDeposit
    flags.maskPurity.value      = maskPurity
    flags.triadPitchX.value     = triadPitchX
    flags.triadPitchY.value     = triadPitchY
    flags.slotPixelPitch.value  = slotPixelPitch
    flags.triadRowShift.value   = triadRowShift
    flags.rowBrickShift.value   = rowBrickShift
    flags.colBrickShift.value   = colBrickShift
    flags.slotWeight.value      = slotWeight
    flags.slotExponent.value    = slotExponent
    flags.edgeSoftness.value    = edgeSoftness
    flags.triadPhase.value      = triadPhase
    flags.maskType.value        = maskType
    flags.stripePitch.value     = stripePitch
    flags.stripeExponent.value  = stripeExponent
    flags.grillePurity.value    = grillePurity
    flags.numDampingWires.value = numDampingWires
    flags.wireWidth.value       = wireWidth
    flags.wireStrength.value    = wireStrength
    flags.convergenceR.value    = convergenceR
    flags.convergenceB.value    = convergenceB
  })

  const _onWheel = (e: WheelEvent) => {
    if (!ignoreEl?.contains(e.target as Node)) {
      uiScene?.onWheel(e.deltaY)
      e.preventDefault()
    }
  }
  const toCanvasX = (sx: number) => { const z = uiScene?.zoom ?? 1; return ((sx / W - 0.5) / z + 0.5) * W }
  const toCanvasY = (sy: number) => { const z = uiScene?.zoom ?? 1; return ((sy / H - 0.5) / z + 0.5) * H }
  const _onMouseMove = (e: MouseEvent) => uiScene?.onMouseMove(toCanvasX(e.clientX), toCanvasY(e.clientY))
  const _onMouseDown = (e: MouseEvent) => {
    if (!ignoreEl?.contains(e.target as Node)) {
      uiScene?.onMouseDown(toCanvasX(e.clientX), toCanvasY(e.clientY))
      e.preventDefault()  // prevent text selection during window drag
    }
  }
  const _onMouseUp = () => uiScene?.onMouseUp()

  onMount(() => {
    window.addEventListener('resize', resize)
    document.addEventListener('mousemove', _onMouseMove, { passive: true })
    document.addEventListener('mousedown', _onMouseDown)
    document.addEventListener('mouseup',   _onMouseUp,   { passive: true })
    document.addEventListener('wheel',     _onWheel,     { passive: false })
    initThree()
  })

  onDestroy(() => {
    renderer?.setAnimationLoop(null)
    renderer?.dispose()
    ghostTargets.forEach(t => t.dispose())
    srcTexture?.dispose()
    material?.dispose()
    displayMat?.dispose()
    ;[scene, displayScene].forEach(s => {
      s?.children.forEach(child => {
        const mesh = child as unknown as { geometry?: { dispose(): void } }
        mesh.geometry?.dispose()
      })
    })
    window.removeEventListener('resize', resize)
    document.removeEventListener('mousemove', _onMouseMove)
    document.removeEventListener('mousedown', _onMouseDown)
    document.removeEventListener('mouseup',   _onMouseUp)
    document.removeEventListener('wheel',     _onWheel)
  })
</script>

<div bind:this={containerEl}
     style="position:fixed;inset:0;pointer-events:none;z-index:9999;"></div>
