<script lang="ts">
  import CRTOverlay from './lib/CRTOverlay.svelte';
  import CRTControls from './lib/CRTControls.svelte';

  let controlsEl = $state<HTMLDivElement | undefined>(undefined)

  let effects = $state({
    // INTENSITY
    chromAb: 1, bleed: 1, scanlines: 1, shadowmask: 1, bloom: 1,
    halation: 0, vignette: 0, ghosting: 1, barrel: 0,
    // CHROMATIC ABERRATION
    caOffset: 0.004, caVertical: 0.0,
    // COLOR BLEED & GHOSTING
    bleedKernel: 0.25, ghostDecay: 0.75,
    // BLOOM PSF
    bloomThresh: 0.35, bloomKnee: 0.1,
    bloomCoreSize: 1.5, bloomCoreWeight: 0.5,
    bloomMidSize: 4.0, bloomMidWeight: 0.35,
    bloomHaloSize: 12.0, bloomHaloWeight: 0.15,
    halationRadius: 30.0,
    // SCANLINES / BEAM
    scanFreq: 1.0, scanSpeed: 0.0,
    beamWidth: 0.7, beamSoftness: 0.15,
    phosphorDecay: 0.0, beamDeposit: 1.0,
    // SHADOW MASK
    maskPurity: 0.65,
    triadPitchX: 3.0, triadPitchY: 3.0,
    slotPixelPitch: 2.0,
    triadRowShift: 0.0, rowBrickShift: 0.5, colBrickShift: 0.0,
    slotWeight: 0.8, slotExponent: 2.0,
    edgeSoftness: 0.15, triadPhase: 0.0,
    // MASK TYPE & APERTURE GRILLE
    maskType: 0.0,
    stripePitch: 3.0, stripeExponent: 1.5, grillePurity: 0.7,
    numDampingWires: 2.0, wireWidth: 1.5, wireStrength: 0.35,
    // CONVERGENCE
    convergenceR: 0.0, convergenceB: 0.0,
  })
</script>

<CRTControls
  bind:el={controlsEl}
  bind:chromAb={effects.chromAb}
  bind:bleed={effects.bleed}
  bind:scanlines={effects.scanlines}
  bind:shadowmask={effects.shadowmask}
  bind:bloom={effects.bloom}
  bind:halation={effects.halation}
  bind:vignette={effects.vignette}
  bind:ghosting={effects.ghosting}
  bind:barrel={effects.barrel}
  bind:caOffset={effects.caOffset}
  bind:caVertical={effects.caVertical}
  bind:bleedKernel={effects.bleedKernel}
  bind:ghostDecay={effects.ghostDecay}
  bind:bloomThresh={effects.bloomThresh}
  bind:bloomKnee={effects.bloomKnee}
  bind:bloomCoreSize={effects.bloomCoreSize}
  bind:bloomCoreWeight={effects.bloomCoreWeight}
  bind:bloomMidSize={effects.bloomMidSize}
  bind:bloomMidWeight={effects.bloomMidWeight}
  bind:bloomHaloSize={effects.bloomHaloSize}
  bind:bloomHaloWeight={effects.bloomHaloWeight}
  bind:halationRadius={effects.halationRadius}
  bind:scanFreq={effects.scanFreq}
  bind:scanSpeed={effects.scanSpeed}
  bind:beamWidth={effects.beamWidth}
  bind:beamSoftness={effects.beamSoftness}
  bind:phosphorDecay={effects.phosphorDecay}
  bind:beamDeposit={effects.beamDeposit}
  bind:maskPurity={effects.maskPurity}
  bind:triadPitchX={effects.triadPitchX}
  bind:triadPitchY={effects.triadPitchY}
  bind:slotPixelPitch={effects.slotPixelPitch}
  bind:triadRowShift={effects.triadRowShift}
  bind:rowBrickShift={effects.rowBrickShift}
  bind:colBrickShift={effects.colBrickShift}
  bind:slotWeight={effects.slotWeight}
  bind:slotExponent={effects.slotExponent}
  bind:edgeSoftness={effects.edgeSoftness}
  bind:triadPhase={effects.triadPhase}
  bind:maskType={effects.maskType}
  bind:stripePitch={effects.stripePitch}
  bind:stripeExponent={effects.stripeExponent}
  bind:grillePurity={effects.grillePurity}
  bind:numDampingWires={effects.numDampingWires}
  bind:wireWidth={effects.wireWidth}
  bind:wireStrength={effects.wireStrength}
  bind:convergenceR={effects.convergenceR}
  bind:convergenceB={effects.convergenceB}
/>

<CRTOverlay
  ignoreEl={controlsEl}
  chromAb={effects.chromAb}
  bleed={effects.bleed}
  scanlines={effects.scanlines}
  shadowmask={effects.shadowmask}
  bloom={effects.bloom}
  halation={effects.halation}
  vignette={effects.vignette}
  ghosting={effects.ghosting}
  barrel={effects.barrel}
  caOffset={effects.caOffset}
  caVertical={effects.caVertical}
  bleedKernel={effects.bleedKernel}
  ghostDecay={effects.ghostDecay}
  bloomThresh={effects.bloomThresh}
  bloomKnee={effects.bloomKnee}
  bloomCoreSize={effects.bloomCoreSize}
  bloomCoreWeight={effects.bloomCoreWeight}
  bloomMidSize={effects.bloomMidSize}
  bloomMidWeight={effects.bloomMidWeight}
  bloomHaloSize={effects.bloomHaloSize}
  bloomHaloWeight={effects.bloomHaloWeight}
  halationRadius={effects.halationRadius}
  scanFreq={effects.scanFreq}
  scanSpeed={effects.scanSpeed}
  beamWidth={effects.beamWidth}
  beamSoftness={effects.beamSoftness}
  phosphorDecay={effects.phosphorDecay}
  beamDeposit={effects.beamDeposit}
  maskPurity={effects.maskPurity}
  triadPitchX={effects.triadPitchX}
  triadPitchY={effects.triadPitchY}
  slotPixelPitch={effects.slotPixelPitch}
  triadRowShift={effects.triadRowShift}
  rowBrickShift={effects.rowBrickShift}
  colBrickShift={effects.colBrickShift}
  slotWeight={effects.slotWeight}
  slotExponent={effects.slotExponent}
  edgeSoftness={effects.edgeSoftness}
  triadPhase={effects.triadPhase}
  maskType={effects.maskType}
  stripePitch={effects.stripePitch}
  stripeExponent={effects.stripeExponent}
  grillePurity={effects.grillePurity}
  numDampingWires={effects.numDampingWires}
  wireWidth={effects.wireWidth}
  wireStrength={effects.wireStrength}
  convergenceR={effects.convergenceR}
  convergenceB={effects.convergenceB}
/>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { background: #000; overflow: hidden; }
</style>
