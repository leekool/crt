<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import html2canvas from 'html2canvas'
  import { makeCRTNode } from './shader'
  import type { CRTFlags } from './shader'
  import {
    WebGPURenderer, MeshBasicNodeMaterial,
    Mesh, PlaneGeometry, Scene,
    OrthographicCamera, WebGLRenderTarget,
    CanvasTexture, LinearFilter, Vector2, SRGBColorSpace
  } from 'three/webgpu'
  import { uniform, texture as textureTSL, uv, vec2, float } from 'three/tsl'
  import type TextureNode from 'three/src/nodes/accessors/TextureNode.js'
  import type UniformNode from 'three/src/nodes/core/UniformNode.js'
  import type { Vector2 as Vector2Type } from 'three'

  let {
    target = null,
    fps = 20,
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
    dotRadius = 0.45,
    slotWeight = 0.8,
    slotExponent = 2.0,
    edgeSoftness = 0.15,
    triadPhase = 0.0,
    maskLodStart = 1.0,
    maskLodEnd = 2.0,
    virtualWeight = 1.0,
  }: {
    target?: HTMLElement | null
    fps?: number
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
    dotRadius?: number
    slotWeight?: number
    slotExponent?: number
    edgeSoftness?: number
    triadPhase?: number
    maskLodStart?: number
    maskLodEnd?: number
    virtualWeight?: number
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
  let srcCanvas: HTMLCanvasElement | undefined
  let srcCtx: CanvasRenderingContext2D | undefined
  let resUniform: UniformNode<'vec2', Vector2Type> | undefined
  let dtUniform: UniformNode<'float', number> | undefined
  let timeUniform: UniformNode<'float', number> | undefined
  let readIdx: number = 0

  let W: number = 0, H: number = 0
  let lastCapture: number = 0
  let lastFrame: number = 0
  let capturedCanvas: HTMLCanvasElement | null = null
  let capturing: boolean = false

  let flags = $state.raw<CRTFlags | undefined>(undefined)
  let hoverStyleEl: HTMLStyleElement | null = null

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
    if (srcCanvas) {
      srcCanvas.width = W
      srcCanvas.height = H
    }
  }

  async function doCapture(): Promise<void> {
    if (capturing) return
    capturing = true
    try {
      const el = target || document.body
      capturedCanvas = await html2canvas(el, {
        scale: 1.0,
        useCORS: false,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        ignoreElements: (el) => containerEl.contains(el) || (ignoreEl?.contains(el) ?? false),
      })
    } catch (e) {
      console.warn('html2canvas error:', e)
    }
    capturing = false
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

    // fixed-size staging canvas — dimensions match html2canvas scale:1.0 output
    // never swap .image, only drawImage into it so the GPU texture never reallocates
    srcCanvas = document.createElement('canvas')
    srcCanvas.width = W
    srcCanvas.height = H
    srcCtx = srcCanvas.getContext('2d')!
    srcTexture = new CanvasTexture(srcCanvas)
    srcTexture.colorSpace = SRGBColorSpace

    resUniform = uniform(new Vector2(W, H))
    dtUniform = uniform(1 / 60)
    timeUniform = uniform(0)
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
      dotRadius:       uniform(dotRadius),
      slotWeight:      uniform(slotWeight),
      slotExponent:    uniform(slotExponent),
      edgeSoftness:    uniform(edgeSoftness),
      triadPhase:      uniform(triadPhase),
      maskLodStart:    uniform(maskLodStart),
      maskLodEnd:      uniform(maskLodEnd),
      virtualWeight:   uniform(virtualWeight),
    }

    material = new MeshBasicNodeMaterial()
    material.colorNode = makeCRTNode(srcTexture, ghostTexUniform, resUniform, dtUniform, timeUniform, flags)
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

      if (now - lastCapture > 1000 / fps) {
        lastCapture = now
        doCapture()
      }

      if (capturedCanvas) {
        srcCtx!.drawImage(capturedCanvas, 0, 0, srcCanvas!.width, srcCanvas!.height)
        srcTexture!.needsUpdate = true
        capturedCanvas = null  // consumed — skip re-upload until next capture arrives
      }

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
    flags.dotRadius.value       = dotRadius
    flags.slotWeight.value      = slotWeight
    flags.slotExponent.value    = slotExponent
    flags.edgeSoftness.value    = edgeSoftness
    flags.triadPhase.value      = triadPhase
    flags.maskLodStart.value    = maskLodStart
    flags.maskLodEnd.value      = maskLodEnd
    flags.virtualWeight.value   = virtualWeight
  })

  // Scan document stylesheets and inject equivalent rules using plain classes
  // instead of pseudo-classes, since html2canvas clones the DOM and pseudo-class
  // states (:hover, :active) don't transfer to the clone.
  function buildHoverStyles(): void {
    const rules: string[] = []
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (!(rule instanceof CSSStyleRule)) continue
          if (rule.selectorText.includes(':hover'))
            rules.push(rule.cssText.replace(/:hover/g, '.crt-hover'))
          if (rule.selectorText.includes(':active'))
            rules.push(rule.cssText.replace(/:active/g, '.crt-active'))
        }
      } catch {} // cross-origin sheets are not readable
    }
    hoverStyleEl?.remove()
    hoverStyleEl = document.createElement('style')
    hoverStyleEl.textContent = rules.join('\n')
    document.head.appendChild(hoverStyleEl)
  }

  // Walk up the DOM from the hovered element, applying crt-hover to each
  // ancestor so parent:hover .child rules also work correctly.
  function onHover(e: Event): void {
    document.querySelectorAll('.crt-hover').forEach(el => el.classList.remove('crt-hover'))
    let el: Element | null = e.target as Element
    while (el && el !== document.documentElement) {
      if (!containerEl?.contains(el) && !(ignoreEl?.contains(el)))
        el.classList.add('crt-hover')
      el = el.parentElement
    }
    if (!capturing) doCapture()
  }

  function offHover(): void {
    document.querySelectorAll('.crt-hover').forEach(el => el.classList.remove('crt-hover'))
  }

  function onActive(e: Event): void {
    ;(e.target as Element)?.classList.add('crt-active')
    if (!capturing) doCapture()
  }

  function offActive(): void {
    document.querySelectorAll('.crt-active').forEach(el => el.classList.remove('crt-active'))
    if (!capturing) doCapture()
  }

  // fire an extra capture immediately on other interactions (scroll, focus, etc.)
  function interactionCapture(): void {
    if (!capturing) doCapture()
  }

  const INTERACTION_EVENTS = ['mousemove', 'focusin', 'focusout', 'scroll'] as const

  onMount(() => {
    window.addEventListener('resize', resize)
    INTERACTION_EVENTS.forEach(e => document.addEventListener(e, interactionCapture, { passive: true }))
    document.addEventListener('mouseover',  onHover,  { passive: true })
    document.addEventListener('mouseleave', offHover, { passive: true })
    document.addEventListener('mousedown',  onActive, { passive: true })
    document.addEventListener('mouseup',    offActive, { passive: true })
    buildHoverStyles()
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
    INTERACTION_EVENTS.forEach(e => document.removeEventListener(e, interactionCapture))
    document.removeEventListener('mouseover',  onHover)
    document.removeEventListener('mouseleave', offHover)
    document.removeEventListener('mousedown',  onActive)
    document.removeEventListener('mouseup',    offActive)
    document.querySelectorAll('.crt-hover, .crt-active').forEach(
      el => el.classList.remove('crt-hover', 'crt-active')
    )
    hoverStyleEl?.remove()
  })
</script>

<div bind:this={containerEl}
     style="position:fixed;inset:0;pointer-events:none;z-index:9999;"></div>
