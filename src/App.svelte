<script lang="ts">
  import CRTOverlay from './lib/CRTOverlay.svelte';
  import CRTControls from './lib/CRTControls.svelte';

  let x = $state(120), y = $state(80);
  let dragging = $state(false);
  let dragOffX: number = 0, dragOffY: number = 0;

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
    dotRadius: 0.45, slotWeight: 0.8, slotExponent: 2.0,
    edgeSoftness: 0.15, triadPhase: 0.0,
    maskLodStart: 1.0, maskLodEnd: 2.0, virtualWeight: 1.0,
  })
  let controlsEl = $state<HTMLDivElement | undefined>(undefined)

  function onMouseDown(e: MouseEvent): void {
    dragging = true;
    dragOffX = e.clientX - x;
    dragOffY = e.clientY - y;
    e.preventDefault();
  }

  function onMouseMove(e: MouseEvent): void {
    if (!dragging) return;
    x = e.clientX - dragOffX;
    y = e.clientY - dragOffY;
  }

  function onMouseUp(): void {
    dragging = false;
  }
</script>

<svelte:window on:mousemove={onMouseMove} on:mouseup={onMouseUp} />

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
  bind:dotRadius={effects.dotRadius}
  bind:slotWeight={effects.slotWeight}
  bind:slotExponent={effects.slotExponent}
  bind:edgeSoftness={effects.edgeSoftness}
  bind:triadPhase={effects.triadPhase}
  bind:maskLodStart={effects.maskLodStart}
  bind:maskLodEnd={effects.maskLodEnd}
  bind:virtualWeight={effects.virtualWeight}
/>

<CRTOverlay fps={20} ignoreEl={controlsEl}
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
  dotRadius={effects.dotRadius}
  slotWeight={effects.slotWeight}
  slotExponent={effects.slotExponent}
  edgeSoftness={effects.edgeSoftness}
  triadPhase={effects.triadPhase}
  maskLodStart={effects.maskLodStart}
  maskLodEnd={effects.maskLodEnd}
  virtualWeight={effects.virtualWeight}
/>

<div class="desktop">
  <div class="window" style="left:{x}px; top:{y}px;" class:dragging>

    <div class="titlebar" on:mousedown={onMouseDown} role="presentation">
      <div class="traffic-lights">
        <span class="tl red"></span>
        <span class="tl yellow"></span>
        <span class="tl green"></span>
      </div>
      <span class="title">ACME Corp — Dashboard</span>
    </div>

    <div class="toolbar">
      <button class="tb-btn active">Overview</button>
      <button class="tb-btn">Analytics</button>
      <button class="tb-btn">Reports</button>
      <button class="tb-btn">Settings</button>
    </div>

    <div class="body">
      <div class="stats">
        <div class="stat">
          <span class="stat-val">99.98%</span>
          <span class="stat-label">Uptime</span>
        </div>
        <div class="stat">
          <span class="stat-val">14.2ms</span>
          <span class="stat-label">p99 Latency</span>
        </div>
        <div class="stat">
          <span class="stat-val">2.4M</span>
          <span class="stat-label">Req / day</span>
        </div>
        <div class="stat">
          <span class="stat-val">&#9650; 12%</span>
          <span class="stat-label">Growth</span>
        </div>
      </div>

      <div class="section-label">Recent Activity</div>
      <ul class="log">
        <li><span class="badge ok">OK</span> Deploy <strong>v4.2.1</strong> completed &mdash; 2m ago</li>
        <li><span class="badge warn">WARN</span> High memory on <strong>node-07</strong> &mdash; 11m ago</li>
        <li><span class="badge ok">OK</span> Cert renewed for <strong>api.acme.io</strong> &mdash; 1h ago</li>
        <li><span class="badge err">ERR</span> Timeout on <strong>db-replica-3</strong> &mdash; 2h ago</li>
        <li><span class="badge ok">OK</span> Backup <strong>2026-03-20</strong> verified &mdash; 3h ago</li>
      </ul>

      <div class="section-label">Quick Actions</div>
      <div class="actions">
        <button class="btn-primary">&#9654; Run Diagnostics</button>
        <button class="btn-outline">&#8635; Restart Services</button>
        <button class="btn-outline">&#128196; Export Logs</button>
      </div>
    </div>

  </div>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { background: #1a1a2e; font-family: system-ui, sans-serif; overflow: hidden; }

  .desktop {
    width: 100vw; height: 100vh;
    background:
      radial-gradient(ellipse at 20% 50%, #0d1b4b 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, #1a0d3b 0%, transparent 60%),
      #0d0d14;
  }

  .window {
    position: absolute;
    width: 560px;
    background: #111116;
    border: 1px solid #2a2a35;
    border-radius: 10px;
    box-shadow: 0 30px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04);
    user-select: none;
  }
  .window.dragging { box-shadow: 0 40px 100px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.06); }

  /* title bar */
  .titlebar {
    display: flex; align-items: center; gap: .8rem;
    padding: .65rem 1rem;
    background: #18181f;
    border-bottom: 1px solid #222;
    border-radius: 10px 10px 0 0;
    cursor: grab;
  }
  .dragging .titlebar { cursor: grabbing; }
  .traffic-lights { display: flex; gap: .4rem; }
  .tl {
    width: 12px; height: 12px; border-radius: 50%;
    border: 1px solid rgba(0,0,0,.3);
  }
  .tl.red    { background: #ff5f57; }
  .tl.yellow { background: #febc2e; }
  .tl.green  { background: #28c840; }
  .title { font-size: .8rem; color: #555; flex: 1; text-align: center; margin-right: 2rem; }

  /* toolbar */
  .toolbar {
    display: flex; gap: .25rem; padding: .5rem .75rem;
    border-bottom: 1px solid #1e1e26; background: #14141a;
  }
  .tb-btn {
    background: none; border: none; color: #555; font-size: .8rem;
    padding: .3rem .7rem; border-radius: 5px; cursor: pointer;
  }
  .tb-btn:hover { color: #aaa; background: #1e1e28; }
  .tb-btn.active { color: #fff; background: #1e1e2e; }

  /* body */
  .body { padding: 1.25rem; }

  .stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: .75rem; margin-bottom: 1.25rem;
  }
  .stat {
    background: #16161e; border: 1px solid #1e1e28;
    border-radius: 8px; padding: .75rem;
    display: flex; flex-direction: column; align-items: center; gap: .2rem;
  }
  .stat-val { font-size: 1.2rem; font-weight: 700; color: #fff; }
  .stat-label { font-size: .7rem; color: #555; text-transform: uppercase; letter-spacing: .05em; }

  .section-label {
    font-size: .7rem; color: #444; text-transform: uppercase;
    letter-spacing: .08em; margin-bottom: .5rem;
  }

  .log {
    list-style: none; margin-bottom: 1.25rem;
    border: 1px solid #1a1a22; border-radius: 6px; overflow: hidden;
  }
  .log li {
    font-size: .82rem; color: #888;
    padding: .45rem .75rem; border-bottom: 1px solid #1a1a22;
    display: flex; align-items: center; gap: .5rem;
  }
  .log li:last-child { border-bottom: none; }
  .log li strong { color: #bbb; }

  .badge {
    font-size: .65rem; font-weight: 700; letter-spacing: .04em;
    padding: .15rem .4rem; border-radius: 4px; flex-shrink: 0;
  }
  .badge.ok   { background: #0d2e1a; color: #3ddc84; }
  .badge.warn { background: #2e250d; color: #febc2e; }
  .badge.err  { background: #2e0d0d; color: #ff5f57; }

  .actions { display: flex; gap: .5rem; flex-wrap: wrap; }

  .btn-primary {
    background: #2d4fd4; color: #fff; border: none;
    padding: .45rem 1rem; border-radius: 6px;
    font-size: .82rem; font-weight: 600; cursor: pointer;
  }
  .btn-primary:hover { background: #3d5fe4; }
  .btn-outline {
    background: transparent; color: #888; border: 1px solid #252530;
    padding: .45rem 1rem; border-radius: 6px;
    font-size: .82rem; cursor: pointer;
  }
  .btn-outline:hover { color: #ccc; border-color: #3a3a4a; }
</style>
