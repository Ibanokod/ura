// Capture les etapes de l'ouverture d'un booster avec Edge headless pilote par CDP, sur le build
// servi par `npm run preview` (le navigateur integre de Claude rend mal pendant les animations).
// Usage : npm run preview, puis node scripts/capture-booster.mjs <dossier de sortie>
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const EDGE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync)
const outDir = process.argv[2] ?? '.'
mkdirSync(outDir, { recursive: true })
const port = 9333
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${port}`, `--user-data-dir=${join(process.env.TEMP, 'ura-shot-profile-' + Date.now())}`, '--window-size=412,915', 'about:blank'], { stdio: 'ignore' })
await sleep(3000)
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
const page = targets.find((t) => t.type === 'page')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m)
    pending.delete(m.id)
  }
}
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(outDir, name), Buffer.from(r.result.data, 'base64'))
  console.log('capture', name)
}

await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true })
await send('Page.enable')
await send('Page.navigate', { url: 'http://localhost:4173/' })
await sleep(3000)
await evaluate(`(() => { const d = new Date(); const day = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); const s = { version:1, settings:{ goalMl:1500, quickAddMl:150, setId:'A1', backdropCardId:null }, entries:[{ id:'e1', at:new Date().toISOString(), ml:1500 }], rewards:[{ id:'test-stack', at:new Date().toISOString(), day, kind:'booster', thresholdMl:1500, cardIds:['A1-025','A1-036','A1-058','A1-094','A1-219'], rarePack:false, revealed:0, seen:false }], collection:{} }; localStorage.setItem('ura.v1', JSON.stringify(s)); return 'seeded' })()`)
await send('Page.navigate', { url: 'http://localhost:4173/' })
await sleep(3500)
await shot('1-paquet.png')
await evaluate(`(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const dlg = () => document.querySelector('[role=dialog]'); const byText = t => [...dlg().querySelectorAll('button')].find(b => b.textContent.trim().startsWith(t)); byText('Ouvrir le booster').click(); for (let i = 0; i < 40; i++) { await sleep(100); if (dlg().querySelector('[role=button][tabindex="0"]')) break } await sleep(600); return 'opened' })()`)
await shot('2-pile-face-cachee.png')
await evaluate(`(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const dlg = document.querySelector('[role=dialog]'); const top = dlg.querySelector('[role=button][tabindex="0"]'); const fire = (type, x, y) => top.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true })); fire('pointerdown', 200, 400); fire('pointerup', 200, 400); await sleep(1200); return 'flipped' })()`)
await shot('3-pile-retournee.png')
await evaluate(`(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const dlg = document.querySelector('[role=dialog]'); const top = dlg.querySelector('[role=button][tabindex="0"]'); const fire = (type, x, y) => top.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true })); fire('pointerdown', 260, 400); await sleep(50); fire('pointermove', 200, 405); await sleep(50); fire('pointermove', 150, 410); await sleep(150); return 'dragging' })()`)
await shot('4-pendant-glissement.png')
await evaluate(`(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); const dlg = document.querySelector('[role=dialog]'); const top = dlg.querySelector('[role=button][tabindex="0"]'); const fire = (type, x, y) => top.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true })); fire('pointerup', 60, 410); await sleep(900); return 'swiped' })()`)
await shot('5-apres-glissement.png')
ws.close()
proc.kill()
console.log('fini')
