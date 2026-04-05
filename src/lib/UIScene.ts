export interface UIScene {
  canvas: HTMLCanvasElement
  resize(w: number, h: number): void
  draw(t: number): void
  onMouseMove(x: number, y: number): void
  onMouseDown(x: number, y: number): void
  onMouseUp(): void
  onWheel(delta: number): void
  readonly zoom: number
}

interface BtnRect { x: number; y: number; w: number; h: number }

export async function createUIScene(w: number, h: number): Promise<UIScene> {
  const face = new FontFace('CozetteVector', 'url(/CozetteVector.woff2)')
  await face.load()
  document.fonts.add(face)

  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h

  let hoveredBtn = -1
  let pressedBtn = -1
  const btnRects: BtnRect[] = [
    { x: 0, y: 0, w: 0, h: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
  ]

  // zoom + drag state
  let winScale = 1.0
  let winDX = 0, winDY = 0
  let dragging = false
  let dragStartMouseX = 0, dragStartMouseY = 0
  let dragStartDX = 0, dragStartDY = 0

  // title bar rect — updated each draw(), used for hit-testing
  let titleBar: BtnRect = { x: 0, y: 0, w: 0, h: 0 }

  function hitTest(mx: number, my: number): number {
    for (let i = 0; i < btnRects.length; i++) {
      const r = btnRects[i]
      if (mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h) return i
    }
    return -1
  }

  function inTitleBar(mx: number, my: number): boolean {
    return mx >= titleBar.x && mx < titleBar.x + titleBar.w &&
           my >= titleBar.y && my < titleBar.y + titleBar.h
  }

  function draw(t: number): void {
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    ctx.textBaseline = 'top'

    ctx.font = '13px CozetteVector'
    const CW   = ctx.measureText('M').width
    const LH   = 13
    const COLS = 58                           // inner char columns

    const winW = CW * (COLS + 2)
    // 1 top + 2 stats + 1 div + 1 hdr + 5 log + 1 div + 1 hdr + 1 btns + 1 bot = 14 rows
    const winH = LH * 14

    // clamp so window stays fully on screen
    const halfFreeX = Math.max(0, Math.floor((W - winW) / 2))
    const halfFreeY = Math.max(0, Math.floor((H - winH) / 2))
    winDX = Math.max(-halfFreeX, Math.min(halfFreeX, winDX))
    winDY = Math.max(-halfFreeY, Math.min(halfFreeY, winDY))

    const wX = Math.floor((W - winW) / 2) + winDX
    const wY = Math.floor((H - winH) / 2) + winDY

    titleBar = { x: wX, y: wY, w: winW, h: LH }

    const BD  = dragging ? '#338833' : '#226622'  // title bar brightens while dragging
    const TTL = '#ccffcc'
    const VBR = '#88ff88'
    const VDM = '#447744'
    const AMB = '#aaaa44'
    const GRY = '#888888'
    const OK  = '#00cc44'
    const WRN = '#ffaa00'
    const ERR = '#ff3333'
    const BNM = '#22aa22'
    const BHV = '#aaffaa'
    const WTE = '#ffffff'

    const T = (s: string, x: number, y: number, c: string) => {
      ctx.fillStyle = c
      ctx.fillText(s, x, y)
    }

    const bars = (row: number) => {
      T('│', wX, wY + row * LH, '#226622')
      T('│', wX + (COLS + 1) * CW, wY + row * LH, '#226622')
    }

    let row = 0

    // ── top border with title ──────────────────────────────────────────────
    {
      const title = ' ACME Corp — Dashboard '
      const pad = COLS - title.length
      const lp  = Math.floor(pad / 2)
      const rp  = pad - lp
      T('┌' + '─'.repeat(lp) + title + '─'.repeat(rp) + '┐', wX, wY + row * LH, BD)
      T(title, wX + (lp + 1) * CW, wY + row * LH, TTL)
      row++
    }

    // ── stat values ────────────────────────────────────────────────────────
    {
      const vals   = ['99.98%', '14.2ms', '2.4M', '▲ 12%']
      const colors = [WTE, WTE, WTE, VBR]
      const q = Math.floor(COLS / 4)
      bars(row)
      for (let i = 0; i < 4; i++)
        T(vals[i], wX + (1 + i * q) * CW, wY + row * LH, colors[i])
      row++
    }

    // ── stat labels ────────────────────────────────────────────────────────
    {
      const lbls = ['Uptime', 'p99 Latency', 'Req / day', 'Growth']
      const q = Math.floor(COLS / 4)
      bars(row)
      for (let i = 0; i < 4; i++)
        T(lbls[i], wX + (1 + i * q) * CW, wY + row * LH, VDM)
      row++
    }

    // ── divider ────────────────────────────────────────────────────────────
    T('├' + '─'.repeat(COLS) + '┤', wX, wY + row * LH, '#226622')
    row++

    // ── recent activity header ─────────────────────────────────────────────
    bars(row)
    T(' RECENT ACTIVITY', wX + CW, wY + row * LH, AMB)
    row++

    // ── log entries ────────────────────────────────────────────────────────
    const log = [
      { badge: '[OK]  ', c: OK,  msg: 'Deploy v4.2.1 completed — 2m ago' },
      { badge: '[WARN]', c: WRN, msg: 'High memory on node-07 — 11m ago' },
      { badge: '[OK]  ', c: OK,  msg: 'Cert renewed for api.acme.io — 1h ago' },
      { badge: '[ERR] ', c: ERR, msg: 'Timeout on db-replica-3 — 2h ago' },
      { badge: '[OK]  ', c: OK,  msg: 'Backup 2026-03-20 verified — 3h ago' },
    ]
    for (const e of log) {
      bars(row)
      const py  = wY + row * LH
      const bx  = wX + CW * 2
      T(e.badge, bx, py, e.c)
      T(' ' + e.msg, bx + ctx.measureText(e.badge).width, py, GRY)
      row++
    }

    // ── divider ────────────────────────────────────────────────────────────
    T('├' + '─'.repeat(COLS) + '┤', wX, wY + row * LH, '#226622')
    row++

    // ── quick actions header ───────────────────────────────────────────────
    bars(row)
    T(' QUICK ACTIONS', wX + CW, wY + row * LH, AMB)
    row++

    // ── buttons ────────────────────────────────────────────────────────────
    {
      bars(row)
      const py     = wY + row * LH
      const labels = ['[ RUN DIAGNOSTICS ]', '[ RESTART SERVICES ]', '[ EXPORT LOGS ]']
      let   bx     = wX + CW * 2
      for (let i = 0; i < labels.length; i++) {
        const lw  = ctx.measureText(labels[i]).width
        const pad = 3
        btnRects[i] = { x: bx - pad, y: py - 2, w: lw + pad * 2, h: LH + 4 }
        if (i === pressedBtn) {
          ctx.fillStyle = '#113311'
          ctx.fillRect(btnRects[i].x, btnRects[i].y, btnRects[i].w, btnRects[i].h)
          T(labels[i], bx, py, BHV)
        } else if (i === hoveredBtn) {
          ctx.fillStyle = '#002200'
          ctx.fillRect(btnRects[i].x, btnRects[i].y, btnRects[i].w, btnRects[i].h)
          T(labels[i], bx, py, BHV)
        } else {
          T(labels[i], bx, py, BNM)
        }
        bx += lw + CW * 2
      }
      row++
    }

    // ── bottom border with cursor blink ───────────────────────────────────
    {
      const cur  = Math.floor(t * 2) % 2 === 0 ? '_' : ' '
      const line = '└── ' + cur + ' ' + '─'.repeat(COLS - 5) + '┘'
      T(line, wX, wY + row * LH, '#226622')
    }
  }

  return {
    canvas,
    resize(nw, nh) {
      canvas.width  = nw
      canvas.height = nh
    },
    draw,
    onWheel(delta: number) {
      // 10% zoom per scroll tick, clamped 0.4–4×
      const factor = delta > 0 ? 0.9 : 1 / 0.9
      winScale = Math.max(0.4, Math.min(4.0, winScale * factor))
    },
    onMouseMove(x, y) {
      if (dragging) {
        winDX = dragStartDX + (x - dragStartMouseX)
        winDY = dragStartDY + (y - dragStartMouseY)
      } else {
        hoveredBtn = hitTest(x, y)
      }
    },
    onMouseDown(x, y) {
      if (inTitleBar(x, y)) {
        dragging        = true
        dragStartMouseX = x
        dragStartMouseY = y
        dragStartDX     = winDX
        dragStartDY     = winDY
      } else {
        pressedBtn = hitTest(x, y)
      }
    },
    onMouseUp() {
      dragging   = false
      pressedBtn = -1
    },
    get zoom() { return winScale },
  }
}
