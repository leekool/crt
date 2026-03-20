import {
  Fn, vec2, vec3, vec4, float,
  texture, uv,
  sin, cos, pow, mix, clamp, mod, abs, max, dot, select, length,
  exp, fract, floor, smoothstep
} from 'three/tsl'
import type { CanvasTexture, Vector2 } from 'three'
import type TextureNode from 'three/src/nodes/accessors/TextureNode.js'
import type UniformNode from 'three/src/nodes/core/UniformNode.js'

export type CRTFlags = {
  // INTENSITY
  chromAb:         UniformNode<'float', number>  // CA radial mix,      default 1.0
  bleed:           UniformNode<'float', number>  // color bleed mix,    default 1.0
  scanlines:       UniformNode<'float', number>  // scanline depth,     default 1.0
  shadowmask:      UniformNode<'float', number>  // mask overall,       default 1.0
  bloom:           UniformNode<'float', number>  // bloom add scale,    default 1.0
  halation:        UniformNode<'float', number>  // halation intensity, default 0.0
  vignette:        UniformNode<'float', number>  // vignette depth,     default 0.0
  ghosting:        UniformNode<'float', number>  // ghost mix,          default 1.0
  barrel:          UniformNode<'float', number>  // barrel distortion,  default 0.0

  // CHROMATIC ABERRATION
  caOffset:        UniformNode<'float', number>  // horizontal CA mag,  default 0.004
  caVertical:      UniformNode<'float', number>  // vertical CA mag,    default 0.0

  // COLOR BLEED & GHOSTING
  bleedKernel:     UniformNode<'float', number>  // adjacent tap wt,    default 0.25
  ghostDecay:      UniformNode<'float', number>  // decay base,         default 0.75

  // BLOOM PSF
  bloomThresh:     UniformNode<'float', number>  // knee hard floor,    default 0.35
  bloomKnee:       UniformNode<'float', number>  // knee width,         default 0.1
  bloomCoreSize:   UniformNode<'float', number>  // core sigma px,      default 1.5
  bloomCoreWeight: UniformNode<'float', number>  // core contribution,  default 0.5
  bloomMidSize:    UniformNode<'float', number>  // mid sigma px,       default 4.0
  bloomMidWeight:  UniformNode<'float', number>  // mid contribution,   default 0.35
  bloomHaloSize:   UniformNode<'float', number>  // halo sigma px,      default 12.0
  bloomHaloWeight: UniformNode<'float', number>  // halo contribution,  default 0.15
  halationRadius:  UniformNode<'float', number>  // halation sigma px,  default 30.0

  // SCANLINES / BEAM
  scanFreq:        UniformNode<'float', number>  // line density,       default 1.0
  scanSpeed:       UniformNode<'float', number>  // animated rate hz,   default 0.0
  beamWidth:       UniformNode<'float', number>  // flat-top fraction,  default 0.7
  beamSoftness:    UniformNode<'float', number>  // edge sigma,         default 0.15
  phosphorDecay:   UniformNode<'float', number>  // trough floor,       default 0.0
  beamDeposit:     UniformNode<'float', number>  // peak brightness,    default 1.0

  // SHADOW MASK
  maskPurity:      UniformNode<'float', number>  // mask contrast,      default 0.65
  triadPitchX:     UniformNode<'float', number>  // H pixels/triad,     default 3.0
  triadPitchY:     UniformNode<'float', number>  // V pixels/period,    default 3.0
  slotPixelPitch:  UniformNode<'float', number>  // slot open height px,default 2.0
  triadRowShift:   UniformNode<'float', number>  // per-row H shift,    default 0.0
  rowBrickShift:   UniformNode<'float', number>  // alt-row H offset,   default 0.5
  colBrickShift:   UniformNode<'float', number>  // alt-col V offset,   default 0.0
  dotRadius:       UniformNode<'float', number>  // dot half-width,     default 0.45
  slotWeight:      UniformNode<'float', number>  // V slot depth,       default 0.8
  slotExponent:    UniformNode<'float', number>  // profile sharpness,  default 2.0
  edgeSoftness:    UniformNode<'float', number>  // slot edge blend,    default 0.15
  triadPhase:      UniformNode<'float', number>  // H phase offset,     default 0.0
  maskLodStart:    UniformNode<'float', number>  // LOD lower px/triad, default 1.0
  maskLodEnd:      UniformNode<'float', number>  // LOD upper px/triad, default 2.0
  virtualWeight:   UniformNode<'float', number>  // LOD scale,          default 1.0
}

export const makeCRTNode = (
  srcTex:          CanvasTexture,
  ghostTexUniform: TextureNode,
  resUniform:      UniformNode<'vec2', Vector2>,
  dtUniform:       UniformNode<'float', number>,
  timeUniform:     UniformNode<'float', number>,  // auto-managed: performance.now()/1000
  flags:           CRTFlags
) => Fn(() => {
  const uvNode = uv()
  const resX = float(resUniform.x)
  const resY = float(resUniform.y)

  // 1. Barrel distortion — compute once, use everywhere
  const center = uvNode.sub(vec2(0.5))
  const r2 = dot(center, center)
  const barrelK = flags.barrel.mul(float(0.15))
  const warpedUV = center.mul(float(1.0).add(r2.mul(barrelK))).add(vec2(0.5)).toVar('warpedUV')

  // 2. Chromatic aberration — radial + vertical
  const caRadius = length(warpedUV.sub(vec2(0.5)))
  const ca  = flags.caOffset.mul(caRadius)
  const caV = flags.caVertical.mul(caRadius)
  const caFull = vec3(
    texture(srcTex, warpedUV.add(vec2(ca,  caV))).r,  // R: right+down
    texture(srcTex, warpedUV).g,                       // G: no shift
    texture(srcTex, warpedUV.sub(vec2(ca,  caV))).b   // B: left+up
  )
  const caBypass = texture(srcTex, warpedUV).rgb
  const col = mix(caBypass, caFull, flags.chromAb).toVar('col')

  // 3. Color bleed
  const bd = flags.bleedKernel
  const px = float(1.0).div(resX)
  const bleedSum = col
    .add(texture(srcTex, warpedUV.add(vec2(px, 0.0))).rgb.mul(bd))
    .add(texture(srcTex, warpedUV.add(vec2(px.mul(float(2.0)), 0.0))).rgb.mul(bd).mul(0.5))
    .add(texture(srcTex, warpedUV.sub(vec2(px, 0.0))).rgb.mul(bd).mul(0.3))
  const bleedEffect = mix(col, bleedSum.div(float(1.0 + 0.25 * (0.5 + 0.3) + 0.25)), 0.6)
  col.assign(mix(col, bleedEffect, flags.bleed))

  // 4. Shadow mask — full triad/slot system
  // triadPitchX=3.0 ≡ old maskScale=1.0 (mod(uv.x * resX * 3 / triadPitchX, 3))
  const TX = mod(warpedUV.x.mul(resX), flags.triadPitchX)
  const TY = mod(warpedUV.y.mul(resY), flags.triadPitchY)

  const rowIdx = floor(warpedUV.y.mul(resY).div(flags.triadPitchY))
  const colIdx = floor(warpedUV.x.mul(resX).div(flags.triadPitchX))

  // triadRowShift: per-row cumulative H shift (diagonal pattern, 0=none)
  // rowBrickShift: alternating-row H shift (brick/honeycomb, 0.5=typical shadow mask)
  // colBrickShift: alternating-col V shift
  const txShift = rowIdx.mul(flags.triadRowShift).mul(flags.triadPitchX)
               .add(mod(rowIdx, float(2.0)).mul(flags.rowBrickShift).mul(flags.triadPitchX))
  const tyShift = mod(colIdx, float(2.0)).mul(flags.colBrickShift).mul(flags.triadPitchY)

  const TXs = mod(TX.add(txShift), flags.triadPitchX)
  const TYs = mod(TY.add(tyShift), flags.triadPitchY)

  // horizontal: fracX in [0,3) over one R-G-B triad
  const fracX = TXs.mul(float(3.0)).div(flags.triadPitchX).add(flags.triadPhase.mul(float(3.0)))
  const TWO_PI_3 = float(Math.PI * 2.0 / 3.0)

  // cosine phosphor profile, slotExponent sharpens the peak
  const phosRraw = max(cos(fracX.mul(TWO_PI_3)), float(0.0))
  const phosGraw = max(cos(fracX.sub(float(1.0)).mul(TWO_PI_3)), float(0.0))
  const phosBraw = max(cos(fracX.sub(float(2.0)).mul(TWO_PI_3)), float(0.0))
  const exp_h = flags.slotExponent.mul(float(0.5))  // half-exponent on each cos
  const phosR = pow(phosRraw, exp_h)
  const phosG = pow(phosGraw, exp_h)
  const phosB = pow(phosBraw, exp_h)

  // vertical slot: open region centred at 0.5 of TYs/triadPitchY
  const slotFrac = TYs.div(flags.triadPitchY)       // [0,1)
  const halfSlot = flags.slotPixelPitch.div(flags.triadPitchY).mul(float(0.5))
  const edgeW    = flags.edgeSoftness
  const slotDist = slotFrac.sub(float(0.5)).abs()
  // smoothstep: 1=open, 0=closed, transitions over edgeSoftness
  const slotOpen = float(1.0).sub(smoothstep(halfSlot, halfSlot.add(edgeW), slotDist))
  const vertProf = float(1.0).sub(flags.slotWeight.mul(float(1.0).sub(slotOpen)))

  // combine + maskPurity
  const mask      = vec3(phosR, phosG, phosB).mul(vertProf)
  const maskBlend = mix(vec3(1.0), mask, flags.maskPurity)

  // LOD: mask visible only when triad is physically large enough
  // smoothstep(start, end, x): 0 when x≤start, 1 when x≥end
  // at default triadPitchX=3, start=1, end=2 → lodFactor=1.0 (full mask)
  // at triadPitchX=1 (very dense) → lodFactor=0.0 (mask fades away)
  const lodFactor = smoothstep(flags.maskLodStart, flags.maskLodEnd, flags.triadPitchX)
                     .mul(flags.virtualWeight)
  col.mulAssign(mix(vec3(1.0), maskBlend, lodFactor.mul(flags.shadowmask)))

  // 5. Bloom PSF — soft knee + 3-component gaussian
  // soft knee: quadratic ease-in through the threshold
  const pxW = float(1.0).div(resX)

  const sampleKnee = (tapUV: any) => {
    const s = texture(srcTex, tapUV).rgb
    const x = s.sub(flags.bloomThresh)
    const t = clamp(x.add(flags.bloomKnee.mul(float(0.5))).div(flags.bloomKnee), float(0.0), float(1.0))
    return max(x.mul(t.mul(t)), vec3(0.0))
  }

  // 7-tap normalized gaussian over sampleKnee; spacing = sigma*0.8 (adaptive tap stride)
  const bloomKernelBlur = (sigma: UniformNode<'float', number>, varName: string) => {
    const sp   = sigma.mul(float(0.8))
    const blur = vec3(0.0).toVar(`${varName}Blur`)
    const wSum = float(0.0).toVar(`${varName}WSum`)
    for (let i = -3; i <= 3; i++) {
      const d = float(i).mul(sp)
      const w = exp(d.mul(d).negate().div(float(2.0).mul(sigma.mul(sigma))))
      blur.addAssign(sampleKnee(warpedUV.add(vec2(d.mul(pxW), 0.0))).mul(w))
      wSum.addAssign(w)
    }
    blur.divAssign(wSum)
    return blur
  }

  const coreBlur = bloomKernelBlur(flags.bloomCoreSize, 'core')
  const midBlur  = bloomKernelBlur(flags.bloomMidSize,  'mid')
  const haloBlur = bloomKernelBlur(flags.bloomHaloSize, 'halo')

  const psfContrib = coreBlur.mul(flags.bloomCoreWeight)
    .add(midBlur.mul(flags.bloomMidWeight))
    .add(haloBlur.mul(flags.bloomHaloWeight))
  col.addAssign(psfContrib.mul(flags.bloom))

  // 6. Halation — 5-tap wide warm blur
  const sigHal = flags.halationRadius
  const spHal  = sigHal.mul(float(0.8))
  const halBlur = vec3(0.0).toVar('halBlur')
  const halWSum = float(0.0).toVar('halWSum')
  for (const i of [-2, -1, 0, 1, 2]) {
    const d = float(i).mul(spHal)
    const w = exp(d.mul(d).negate().div(float(2.0).mul(sigHal.mul(sigHal))))
    halBlur.addAssign(texture(srcTex, warpedUV.add(vec2(d.mul(pxW), 0.0))).rgb.mul(w))
    halWSum.addAssign(w)
  }
  halBlur.divAssign(halWSum)
  const warmTint = vec3(1.0, 0.35, 0.1)
  col.addAssign(halBlur.mul(warmTint).mul(flags.halation))

  // 7. Vignette — applied BEFORE ghosting so the ghost accumulates consistently vignetted values
  const uvc = warpedUV.mul(2.0).sub(vec2(1.0))
  const vigScale = vec2(0.65, 0.85)
  const vigFactor = pow(max(float(1.0).sub(dot(uvc.mul(vigScale), uvc.mul(vigScale))), float(0.0)), float(0.45))
  col.mulAssign(mix(float(1.0), vigFactor, flags.vignette))

  // 8. Ghosting — time-based persistence
  const persistence = pow(max(flags.ghostDecay, float(0.001)), dtUniform.mul(float(60.0)))
  col.assign(mix(col, ghostTexUniform.rgb, clamp(persistence.mul(flags.ghosting), float(0.0), float(0.98))))

  // 9. Scanlines — physical beam model, animated
  // scanSpeed=1  → one sweep per second (visible scan bar)
  // scanSpeed=60 → 60hz film-accurate (imperceptible at normal ghostDecay)
  // phosphorDecay > 0 bakes non-zero trough into ghost texture: at 20fps capture rate
  //   this creates 20hz flicker pulsing — default must be 0.0
  // scanSpeed > 0 with high ghostDecay creates scan-trail smearing
  const scanAnimPhase = timeUniform.mul(flags.scanSpeed)
  const linePhase = fract(
    warpedUV.y.mul(resY).mul(flags.scanFreq).mul(float(0.5)).add(scanAnimPhase)
  )
  // linePhase in [0,1): 0 = beam centre, 0.5 = midpoint between beams
  const beamDist    = linePhase.sub(float(0.5)).abs()         // dist from beam centre [0,0.5]
  const halfWidth   = flags.beamWidth.mul(float(0.5))         // half of flat-top lit region
  const outsideFlat = max(beamDist.sub(halfWidth), float(0.0))  // 0 inside flat top, grows outside
  const sigma2      = flags.beamSoftness.mul(flags.beamSoftness).mul(float(2.0)).add(float(0.0001))
  const beamProfile = clamp(exp(outsideFlat.mul(outsideFlat).negate().div(sigma2)), float(0.0), float(1.0))
  // mix: dark gap = phosphorDecay, lit centre = beamDeposit
  const scanFactor  = mix(flags.phosphorDecay, flags.beamDeposit, beamProfile)
  col.mulAssign(mix(float(1.0), scanFactor, flags.scanlines))

  // 10. Edge mask — pixels outside barrel warp draw black
  const inX = select(warpedUV.x.lessThan(float(0.0)), float(0.0),
                select(warpedUV.x.greaterThan(float(1.0)), float(0.0), float(1.0)))
  const inY = select(warpedUV.y.lessThan(float(0.0)), float(0.0),
                select(warpedUV.y.greaterThan(float(1.0)), float(0.0), float(1.0)))
  col.mulAssign(inX.mul(inY))

  return vec4(clamp(col, float(0.0), float(1.0)), float(1.0))
})()
