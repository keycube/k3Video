# keycube – Typewriter Interface
 
A small web interface for the **keycube**, a cube‑shaped keyboard.
You type text, and it is written back **letter by letter** (typewriter style) in an output box.
The output box can be **recorded as a video** on a green or blue background, ready for video editing (chroma key).
 
 
## Features
 
- Typewriter effect, letter by letter, with a short pause after punctuation
- Adjustable **typing speed**
- Adjustable **text size** (40–200 px)
- Any **text color** (color picker)
- **Green screen** (`#00FF00`) or **blue screen** (`#0000FF`) background
- Two video formats: **1920 × 1080** (horizontal) and **1080 × 1920** (vertical)
- **Video recording** of the output box only, with a preview and a download link
- 3‑second empty pause at the start of each recording
- Long words start directly on the line where they will end up (no jumping)
 
## How to run it
 
1. Keep the three files **together in the same folder**:
```
keycube/
├── index.html
├── style.css
├── script.js
└── README.md
```
2. Double‑click `index.html` to open it in a browser (Chrome, Edge, Firefox or Safari).
No installation or server is needed.
An internet connection is only used to load the font (*Inter Tight* from Google Fonts). Offline, a default system font is used instead.
 
 
## How to use it
 
1. Type your text in **Your text**.
2. Pick the settings: video size, green/blue screen, text color, speed, text size.
3. *(Optional)* Tick **Record video**.
4. Click **Type it** (or press **Ctrl + Enter** / **⌘ + Enter**).
5. If recording, wait for the end: a preview appears with a **Download video** link.
The video is saved as `.mp4` in browsers that support it (recent Chrome, Safari), otherwise as `.webm`.
 
 
## The files
 
| File | Language | Role |
|---|---|---|
| `index.html` | HTML | **Structure** – what is on the page: title, text box, buttons, sliders, output box |
| `style.css` | CSS | **Appearance** – colors, fonts, buttons, spacing |
| `script.js` | JavaScript | **Behaviour** – typing, drawing the output box, recording |
 
`index.html` loads the two other files with:
```html
<link rel="stylesheet" href="style.css">
<script src="script.js"></script>
```
 
The HTML and the JavaScript are connected through **ids**.
For example, `<button id="go">` in the HTML is found in the JavaScript with `document.getElementById('go')`.
 
 
## How the code works (`script.js`)
 
The script is divided into four sections, marked with comments like `// ---------- Drawing ----------`.
 
### 1. Elements and settings
The script finds the page elements it needs (text box, sliders, output box…) and stores the main settings in variables:
 
| Variable | Meaning |
|---|---|
| `W`, `H` | Width and height of the output box (= video resolution) |
| `PAD` | Empty margin around the text inside the box |
| `FONT_SIZE`, `LINE_H`, `FONT` | Text size, line height and font |
| `fullText` | The complete text that will be typed |
| `typed` | The letters already shown |
 
### 2. Drawing
The output box is a **`<canvas>`**: a blank image that the code paints on.
A canvas is used (instead of a normal text box) because the browser can record a canvas as a video.
 
| Function | What it does |
|---|---|
| `draw()` | Paints the whole box: background color, the text in `typed`, the blinking cursor |
| `wrap(text, maxW)` | Splits text into lines that fit the width of the box |
| `layout(full, count, maxW)` | Wraps the **full** text first, then keeps only the first `count` letters, so every word is already on its final line |
| `loop` | Calls `draw()` about 60 times per second (like frames of an animation) |
 
Important idea: the typing code never draws anything itself. It only changes `typed`, and the next frame of `draw()` shows the new letter.
 
### 3. Recording
| Function | What it does |
|---|---|
| `startRecording()` | Turns the canvas into a video stream (`canvas.captureStream`) and starts a `MediaRecorder` |
| `stopRecording(throwAway)` | Stops the recorder. If `throwAway` is `true`, the recording is discarded; otherwise it becomes a video file shown in the preview |
| `pickMimeType()` | Chooses the video format the browser supports (MP4 or WebM) |
 
### 4. Typing
| Function | What it does |
|---|---|
| `typeOut()` | Runs when you click **Type it**: saves the full text, starts recording if needed, waits 3 s when recording, then adds the letters one by one |
| `delay()` | Returns the waiting time between two letters, based on the **Speed** slider |
 
Letters are added with `setTimeout`, which means *"run this again in X milliseconds"*.
`runId` makes sure that if you click **Type it** again (or **Clear**), the old typing stops.
 
### Events (how the page reacts)
At the end of the file, **event listeners** connect your actions to the code:
 
- Click **Type it** → `typeOut()`
- Click **Clear** → stop typing and recording, empty the text
- **Ctrl/⌘ + Enter** in the text box → `typeOut()`
- Change the **size** menu → resize the canvas
The text color, background and text size have no listener: `draw()` reads their current value on every frame.
 
### Overall flow
```
Click "Type it"
      │
      ▼
typeOut() ──► (if "Record video") startRecording()
      │
      ▼
add 1 letter to `typed` ──► wait delay() ms ──► repeat until done
                                                     │
loop (≈60×/s): draw() paints `typed` on the canvas   ▼
                                     stopRecording() → preview + download
```
 
 
## Quick customization
 
| I want to change… | Where |
|---|---|
| The orange accent color | `style.css` → `--orange:#FE5D26;` |
| The page background gray | `style.css` → `--bg:#787f87;` |
| The output font | `script.js` → `FONT` (inside `draw()`) |
| Default text size / its limits | `index.html` → `<input id="textsize" min="40" max="200" value="80">` |
| The background choices | `index.html` → `<select id="bg">` options |
| The margin inside the output box | `script.js` → `const PAD = 96;` |
| The 3‑second pause before recording | `script.js` → `recording ? 3000 : 0` in `typeOut()` |
| The 1.5‑second pause after recording | `script.js` → `stopRecording(false), 1500` in `typeOut()` |
| The pause after punctuation | `script.js` → `/[.,!?;:\n]/` in `typeOut()` |
 
 
## Known limitations
 
- **WebM** videos may need converting for some video editors (they prefer MP4).
- Very long texts scroll up: only the last lines that fit in the box are shown.
 
## Ideas for later
 
- **Import a JSON file** recorded from the keycube, to replay the text at the exact speed it was typed (including Backspace and line breaks).
 