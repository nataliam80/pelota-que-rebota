# AGENTS.md

Tiny p5.js demo ("Pelota que rebota" / bouncing ball). No build system, package manager, tests, or lint config — do not look for `package.json` or add tooling unless asked.

## Running
- Open `index.html` directly in a browser, or serve the folder statically (e.g. `python -m http.server`). There is no dev server, watcher, or hot reload — refresh the browser after edits.
- p5.js and p5.sound are loaded from the jsdelivr CDN (`p5@2.3.3` and `p5.sound@0.4.1`), so running requires internet access.
- `sketch.js` is loaded as a plain script, not a module. p5 finds the global `setup()` / `draw()` functions; keep them global (no `import`/`export`).

## Notes
- All code comments and UI text are in Spanish; match that when editing.
- p5.sound is a separate npm package now (`p5.sound@0.4.1`, built on Tone.js), not the old bundled `lib/addons/p5.sound.js`. Its API differs: connect with `osc.disconnect(); osc.connect(env);` then trigger `env.play()`.
- The p5.sound graph is created **inside** `activarAudio()` on the first gesture, not in `setup()`. Creating it at load makes Tone log "AudioContext was not allowed to start" warnings; creating it during a gesture avoids them.
- Browsers block Web Audio until the first user gesture; `activarAudio()` is wired to `pointerdown`/`keydown`/`touchstart`/`click` on `window`, so any first interaction enables sound (no way around the gesture requirement; `--autoplay-policy=no-user-gesture-required` is a Chrome dev-only workaround). `userStartAudio()` does not return the resume promise, so `activarAudio()` resumes `osc.ctx` (the oscillator's native `AudioContext`) before `osc.start()`.
- Ball physics: gravity + collisions on all four edges; each bounce injects a minimum energy (`REBOTE_MINIMO`) so it **never stops** bouncing. `enCadaRebote()` runs on every bounce: advances `colorIndex` through `ARCOIRIS` and randomizes `radio` between `RADIO_MIN`/`RADIO_MAX`. Collisions use the current `radio`, and a `constrain()` at the end of `rebotar()` prevents a size change from re-triggering a bounce.
- `rebotarSonido()` plays the notes of "Estrellita, ¿dónde estás?" (`ESTRELLITA`, note names like `C4`) one per bounce, looping. Hovering the cursor over the ball zeroes its velocity (it stops until the cursor leaves).
- Particle system: `actualizarParticulas()` emits ~2 particles/frame at the mouse, random `ARCOIRIS` color, each with `nacimiento = millis()` and a `VIDA_PARTICULA` of 10 s (alpha fades with age); capped at `MAX_PARTICULAS` for performance. Particles are plain objects in the `particulas` array, drawn with `red()/green()/blue()` + alpha.
- Title "Pelotita Loca" is `position: fixed` at top center; the CSS reset (`html, body { margin:0; overflow:hidden }`) removes the white border and lets the canvas fill the window. `<link rel="icon" href="data:,">` avoids a favicon 404.
