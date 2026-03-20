<script lang="ts">
  let {
    // INTENSITY
    chromAb        = $bindable(1.0),
    bleed          = $bindable(1.0),
    scanlines      = $bindable(1.0),
    shadowmask     = $bindable(1.0),
    bloom          = $bindable(1.0),
    halation       = $bindable(0.0),
    vignette       = $bindable(0.0),
    ghosting       = $bindable(1.0),
    barrel         = $bindable(0.0),
    // BLOOM PSF
    bloomThresh    = $bindable(0.35),
    bloomKnee      = $bindable(0.1),
    bloomCoreSize  = $bindable(1.5),
    bloomCoreWeight = $bindable(0.5),
    bloomMidSize   = $bindable(4.0),
    bloomMidWeight = $bindable(0.35),
    bloomHaloSize  = $bindable(12.0),
    bloomHaloWeight = $bindable(0.15),
    halationRadius = $bindable(30.0),
    // BEAM
    scanFreq       = $bindable(1.0),
    scanSpeed      = $bindable(0.0),
    beamWidth      = $bindable(0.7),
    beamSoftness   = $bindable(0.15),
    phosphorDecay  = $bindable(0.0),
    beamDeposit    = $bindable(1.0),
    // MASK
    maskPurity     = $bindable(0.65),
    triadPitchX    = $bindable(3.0),
    triadPitchY    = $bindable(3.0),
    slotPixelPitch = $bindable(2.0),
    triadRowShift  = $bindable(0.0),
    rowBrickShift  = $bindable(0.5),
    colBrickShift  = $bindable(0.0),
    dotRadius      = $bindable(0.45),
    slotWeight     = $bindable(0.8),
    slotExponent   = $bindable(2.0),
    edgeSoftness   = $bindable(0.15),
    triadPhase     = $bindable(0.0),
    maskLodStart   = $bindable(1.0),
    maskLodEnd     = $bindable(2.0),
    virtualWeight  = $bindable(1.0),
    // OPTICS
    caOffset       = $bindable(0.004),
    caVertical     = $bindable(0.0),
    bleedKernel    = $bindable(0.25),
    ghostDecay     = $bindable(0.75),
    el             = $bindable<HTMLDivElement | undefined>(undefined),
  }: {
    chromAb?:        number
    bleed?:          number
    scanlines?:      number
    shadowmask?:     number
    bloom?:          number
    halation?:       number
    vignette?:       number
    ghosting?:       number
    barrel?:         number
    bloomThresh?:    number
    bloomKnee?:      number
    bloomCoreSize?:  number
    bloomCoreWeight?: number
    bloomMidSize?:   number
    bloomMidWeight?: number
    bloomHaloSize?:  number
    bloomHaloWeight?: number
    halationRadius?: number
    scanFreq?:       number
    scanSpeed?:      number
    beamWidth?:      number
    beamSoftness?:   number
    phosphorDecay?:  number
    beamDeposit?:    number
    maskPurity?:     number
    triadPitchX?:    number
    triadPitchY?:    number
    slotPixelPitch?: number
    triadRowShift?:  number
    rowBrickShift?:  number
    colBrickShift?:  number
    dotRadius?:      number
    slotWeight?:     number
    slotExponent?:   number
    edgeSoftness?:   number
    triadPhase?:     number
    maskLodStart?:   number
    maskLodEnd?:     number
    virtualWeight?:  number
    caOffset?:       number
    caVertical?:     number
    bleedKernel?:    number
    ghostDecay?:     number
    el?:             HTMLDivElement | undefined
  } = $props()

  let open = $state(true)
</script>

<div bind:this={el} class="crt-controls">
  <button class="toggle" onclick={() => open = !open}>CRT {open ? '▴' : '▾'}</button>
  {#if open}
    <div class="section-divider" style="border-top:none;">INTENSITY</div>
    <div class="sliders">
      <label>
        <span class="lbl">chrom-ab</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={chromAb} />
        <span class="val">{chromAb.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">bleed</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={bleed} />
        <span class="val">{bleed.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">scanlines</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={scanlines} />
        <span class="val">{scanlines.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">shadowmask</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={shadowmask} />
        <span class="val">{shadowmask.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">bloom</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={bloom} />
        <span class="val">{bloom.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">halation</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={halation} />
        <span class="val">{halation.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">vignette</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={vignette} />
        <span class="val">{vignette.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">ghosting</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={ghosting} />
        <span class="val">{ghosting.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">barrel</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={barrel} />
        <span class="val">{barrel.toFixed(2)}</span>
      </label>
    </div>

    <div class="section-divider">BLOOM</div>
    <div class="sliders">
      <label>
        <span class="lbl">bloom-thresh</span>
        <input type="range" min="0" max="0.9" step="0.01" bind:value={bloomThresh} />
        <span class="val">{bloomThresh.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">bloom-knee</span>
        <input type="range" min="0" max="0.5" step="0.01" bind:value={bloomKnee} />
        <span class="val">{bloomKnee.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">core-size</span>
        <input type="range" min="0.5" max="8" step="0.1" bind:value={bloomCoreSize} />
        <span class="val">{bloomCoreSize.toFixed(1)}</span>
      </label>
      <label>
        <span class="lbl">core-weight</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={bloomCoreWeight} />
        <span class="val">{bloomCoreWeight.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">mid-size</span>
        <input type="range" min="1" max="20" step="0.5" bind:value={bloomMidSize} />
        <span class="val">{bloomMidSize.toFixed(1)}</span>
      </label>
      <label>
        <span class="lbl">mid-weight</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={bloomMidWeight} />
        <span class="val">{bloomMidWeight.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">halo-size</span>
        <input type="range" min="4" max="60" step="1" bind:value={bloomHaloSize} />
        <span class="val">{bloomHaloSize.toFixed(0)}</span>
      </label>
      <label>
        <span class="lbl">halo-weight</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={bloomHaloWeight} />
        <span class="val">{bloomHaloWeight.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">halation-rad</span>
        <input type="range" min="5" max="80" step="1" bind:value={halationRadius} />
        <span class="val">{halationRadius.toFixed(0)}</span>
      </label>
    </div>

    <div class="section-divider">BEAM</div>
    <div class="sliders">
      <label>
        <span class="lbl">scan-freq</span>
        <input type="range" min="0.25" max="4" step="0.05" bind:value={scanFreq} />
        <span class="val">{scanFreq.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">scan-speed</span>
        <input type="range" min="0" max="120" step="1" bind:value={scanSpeed} />
        <span class="val">{scanSpeed.toFixed(0)}</span>
      </label>
      <label>
        <span class="lbl">beam-width</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={beamWidth} />
        <span class="val">{beamWidth.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">beam-soft</span>
        <input type="range" min="0.01" max="0.5" step="0.01" bind:value={beamSoftness} />
        <span class="val">{beamSoftness.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">phosphor-dec</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={phosphorDecay} />
        <span class="val">{phosphorDecay.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">beam-deposit</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={beamDeposit} />
        <span class="val">{beamDeposit.toFixed(2)}</span>
      </label>
    </div>

    <div class="section-divider">MASK</div>
    <div class="sliders">
      <label>
        <span class="lbl">mask-purity</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={maskPurity} />
        <span class="val">{maskPurity.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">triad-x</span>
        <input type="range" min="1" max="12" step="0.25" bind:value={triadPitchX} />
        <span class="val">{triadPitchX.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">triad-y</span>
        <input type="range" min="1" max="12" step="0.25" bind:value={triadPitchY} />
        <span class="val">{triadPitchY.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">slot-pitch</span>
        <input type="range" min="0.5" max="8" step="0.25" bind:value={slotPixelPitch} />
        <span class="val">{slotPixelPitch.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">row-shift</span>
        <input type="range" min="0" max="1" step="0.05" bind:value={triadRowShift} />
        <span class="val">{triadRowShift.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">row-brick</span>
        <input type="range" min="0" max="1" step="0.05" bind:value={rowBrickShift} />
        <span class="val">{rowBrickShift.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">col-brick</span>
        <input type="range" min="0" max="1" step="0.05" bind:value={colBrickShift} />
        <span class="val">{colBrickShift.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">dot-radius</span>
        <input type="range" min="0.1" max="0.9" step="0.01" bind:value={dotRadius} />
        <span class="val">{dotRadius.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">slot-weight</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={slotWeight} />
        <span class="val">{slotWeight.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">slot-exp</span>
        <input type="range" min="0.5" max="6" step="0.1" bind:value={slotExponent} />
        <span class="val">{slotExponent.toFixed(1)}</span>
      </label>
      <label>
        <span class="lbl">edge-soft</span>
        <input type="range" min="0" max="0.5" step="0.01" bind:value={edgeSoftness} />
        <span class="val">{edgeSoftness.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">triad-phase</span>
        <input type="range" min="0" max="1" step="0.01" bind:value={triadPhase} />
        <span class="val">{triadPhase.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">lod-start</span>
        <input type="range" min="0.5" max="4" step="0.25" bind:value={maskLodStart} />
        <span class="val">{maskLodStart.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">lod-end</span>
        <input type="range" min="1" max="6" step="0.25" bind:value={maskLodEnd} />
        <span class="val">{maskLodEnd.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">virtual-wt</span>
        <input type="range" min="0" max="2" step="0.01" bind:value={virtualWeight} />
        <span class="val">{virtualWeight.toFixed(2)}</span>
      </label>
    </div>

    <div class="section-divider">OPTICS</div>
    <div class="sliders">
      <label>
        <span class="lbl">ca-offset</span>
        <input type="range" min="0" max="0.02" step="0.001" bind:value={caOffset} />
        <span class="val">{caOffset.toFixed(3)}</span>
      </label>
      <label>
        <span class="lbl">ca-vertical</span>
        <input type="range" min="0" max="0.02" step="0.001" bind:value={caVertical} />
        <span class="val">{caVertical.toFixed(3)}</span>
      </label>
      <label>
        <span class="lbl">bleed-kern</span>
        <input type="range" min="0" max="0.5" step="0.01" bind:value={bleedKernel} />
        <span class="val">{bleedKernel.toFixed(2)}</span>
      </label>
      <label>
        <span class="lbl">ghost-decay</span>
        <input type="range" min="0.1" max="0.99" step="0.01" bind:value={ghostDecay} />
        <span class="val">{ghostDecay.toFixed(2)}</span>
      </label>
    </div>
  {/if}
</div>

<style>
  .crt-controls {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 10000;
    background: rgba(10, 10, 14, 0.92);
    border: 1px solid #2a2a35;
    border-radius: 8px;
    font-family: monospace;
    font-size: 11px;
    color: #aaa;
    min-width: 220px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    pointer-events: all;
  }

  .toggle {
    display: block;
    width: 100%;
    background: none;
    border: none;
    border-bottom: 1px solid #1e1e26;
    color: #888;
    font-family: monospace;
    font-size: 11px;
    text-align: left;
    padding: 6px 10px;
    cursor: pointer;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .toggle:hover { color: #ccc; }

  .sliders {
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .section-divider {
    padding: 4px 10px 3px;
    border-top: 1px solid #1e1e26;
    font-size: 10px;
    color: #444;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .lbl {
    width: 80px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  input[type="range"] {
    flex: 1;
    height: 3px;
    accent-color: #4a6cf7;
    cursor: pointer;
  }

  .val {
    width: 32px;
    text-align: right;
    color: #555;
    flex-shrink: 0;
  }
</style>
