// Keycube typewriter – behaviour (typing, drawing, recording)

// ---------- Elements ----------
const input    = document.getElementById('input');
const speed    = document.getElementById('speed');
const recordCb = document.getElementById('record');
const statusEl = document.getElementById('status');
const canvas   = document.getElementById('output');
const ctx      = canvas.getContext('2d');

// ---------- Canvas layout (fixed size = video resolution) ----------
let W = canvas.width, H = canvas.height;
const PAD = 96;
let FONT_SIZE = 80;   // changed by the "Text size" slider

// Switch between 1920x1080 and 1080x1920
document.getElementById('size').addEventListener('change', e => {
  stopRecording(true);
  [W, H] = e.target.value.split('x').map(Number);
  canvas.width = W;
  canvas.height = H;
});
let LINE_H = FONT_SIZE * 1.2;
let FONT = `900 ${FONT_SIZE}px "Inter Tight", system-ui, sans-serif`;   // heavy, tight, modern

let typed = '';          // text shown so far
let fullText = '';       // the complete text being typed (used to place words on their final line)
let lastTypeTime = 0;    // keeps cursor solid while typing
let timer = null;
let runId = 0;           // cancels an old run when a new one starts

// ---------- Drawing ----------
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Split text into lines that fit the canvas width (wraps on words, breaks very long words)
function wrap(text, maxW) {
  const lines = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/(?<= )/)) {          // keep the trailing space on each word
      if (ctx.measureText((line + word).trimEnd()).width <= maxW) { line += word; continue; }
      if (line) { lines.push(line); line = ''; }
      for (const ch of Array.from(word)) {                 // word longer than a full line
        if (line && ctx.measureText(line + ch).width > maxW) { lines.push(line); line = ''; }
        line += ch;
      }
    }
    lines.push(line);
  }
  return lines;
}

// Lay out the FULL text, then keep only the letters typed so far.
// This way a long word starts directly on the line where it will end up.
function layout(full, count, maxW) {
  const chars = Array.from(full);
  const shown = [];
  let pos = 0;
  for (const line of wrap(full, maxW)) {
    const len = Array.from(line).length;
    const take = Math.min(count, len);
    shown.push(Array.from(line).slice(0, take).join(''));
    count -= take;
    pos += len;
    if (count <= 0) break;
    if (chars[pos] === '\n') { pos++; count--; }   // the line break itself counts as a typed character
  }
  return shown;
}

function draw() {
  // Read the text size slider
  FONT_SIZE = Number(document.getElementById('textsize').value);
  LINE_H = FONT_SIZE * 1.2;
  FONT = `900 ${FONT_SIZE}px "Inter Tight", system-ui, sans-serif`;

  ctx.fillStyle = document.getElementById('bg').value;   // background: green or blue screen
  ctx.fillRect(0, 0, W, H);

  ctx.font = FONT;
  ctx.letterSpacing = '-1px';   // tight letters like the reference
  ctx.textBaseline = 'top';
  ctx.fillStyle = document.getElementById('color').value;   // text and cursor color (picker)

  // Only show the last lines that fit (text scrolls up when it gets long)
  const maxLines = Math.floor((H - 2 * PAD) / LINE_H);
  const lines = layout(fullText, Array.from(typed).length, W - 2 * PAD).slice(-maxLines);
  const offset = (LINE_H - FONT_SIZE) / 2;
  lines.forEach((line, i) => ctx.fillText(line, PAD, PAD + i * LINE_H + offset));

  // Blinking cursor after the last character
  const now = performance.now();
  const solid = now - lastTypeTime < 500;
  if (solid || Math.floor(now / 500) % 2 === 0) {
    const last = lines[lines.length - 1] || '';
    const x = PAD + ctx.measureText(last).width;
    const y = PAD + (lines.length - 1) * LINE_H + offset;
    ctx.fillRect(x + 8, y, FONT_SIZE * 0.12, FONT_SIZE);   // thin modern bar cursor
  }
}

// Redraw every frame (also keeps the video stream fed with frames)
(function loop() { draw(); requestAnimationFrame(loop); })();

// ---------- Recording ----------
let recorder = null;
let chunks = [];
let discard = false;

function pickMimeType() {
  const options = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  return options.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
}

function startRecording() {
  const mimeType = pickMimeType();
  if (!window.MediaRecorder || !canvas.captureStream) {
    statusEl.textContent = 'Recording is not supported in this browser.';
    return false;
  }
  chunks = [];
  discard = false;
  recorder = new MediaRecorder(canvas.captureStream(30), mimeType ? { mimeType } : undefined);
  recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  recorder.onstop = () => {
    statusEl.classList.remove('rec');
    if (discard) { statusEl.textContent = ''; return; }
    const type = recorder.mimeType || mimeType || 'video/webm';
    const ext = type.includes('mp4') ? 'mp4' : 'webm';
    const url = URL.createObjectURL(new Blob(chunks, { type }));
    document.getElementById('preview').src = url;
    const link = document.getElementById('download');
    link.href = url;
    link.download = `typewriter.${ext}`;
    link.textContent = `Download video (.${ext})`;
    document.getElementById('result').style.display = 'block';
    statusEl.textContent = 'Recording ready.';
  };
  recorder.start();
  statusEl.textContent = 'Recording…';
  statusEl.classList.add('rec');
  return true;
}

function stopRecording(throwAway) {
  if (recorder && recorder.state !== 'inactive') {
    discard = throwAway;
    recorder.stop();
  }
}

// ---------- Typing ----------
function delay() {
  return 210 - Number(speed.value);   // slider left = slow, right = fast
}

async function typeOut() {
  clearTimeout(timer);
  stopRecording(true);                 // drop any unfinished recording
  const id = ++runId;

  // Make sure the typewriter font is ready before drawing/recording
  try { await document.fonts.load(FONT); } catch (e) {}
  if (id !== runId) return;

  fullText = input.value;
  const chars = Array.from(fullText);   // handles emoji correctly
  typed = '';
  const recording = recordCb.checked && chars.length > 0 && startRecording();

  let i = 0;
  function next() {
    if (id !== runId) return;
    if (i >= chars.length) {
      // Let the cursor blink for a moment at the end, then stop
      if (recording) timer = setTimeout(() => stopRecording(false), 1500);
      return;
    }
    const ch = chars[i++];
    typed += ch;
    lastTypeTime = performance.now();
    const extra = /[.,!?;:\n]/.test(ch) ? delay() * 3 : 0;   // pause after punctuation
    timer = setTimeout(next, delay() + extra + Math.random() * 30);
  }

  // Wait 3 seconds before the first letter when recording (empty box at the start of the video)
  timer = setTimeout(next, recording ? 3000 : 0);
}

document.getElementById('go').addEventListener('click', typeOut);
document.getElementById('clear').addEventListener('click', () => {
  runId++;
  clearTimeout(timer);
  stopRecording(true);
  statusEl.textContent = '';
  input.value = '';
  typed = '';
  fullText = '';
  input.focus();
});
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); typeOut(); }
});
