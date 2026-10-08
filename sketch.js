/*
Pelotita Loca:
una pelota que rebota sin parar contra el piso, el techo y las paredes
laterales. En cada rebote toca la siguiente nota de "Estrellita, ¿dónde
estás?", cambia de color del arcoiris y cambia de tamaño. Se detiene
mientras el cursor está encima.

Además, del mouse salen partículas de colores que viven 10 segundos.
*/

const RADIO_MIN = 12;
const RADIO_MAX = 45;
const GRAVEDAD = 0.7;
const VELOCIDAD_MAX = 30;
const REBOTE_MINIMO = 7; // energía mínima para que nunca deje de rebotar

const ARCOIRIS = [
    '#ff0000', '#ff8800', '#ffdd00', '#aaff00',
    '#33ff00', '#00ff88', '#00ffee', '#0088ff',
    '#4400ff', '#aa00ff', '#ff00cc', '#ff0044'
];

// Melodía de "Estrellita, ¿dónde estás?" (Twinkle Twinkle Little Star).
// El oscilador acepta nombres de nota (C4, D4, ...) directamente.
const ESTRELLITA = [
    'C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4',
    'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4',
    'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4',
    'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4',
    'C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4',
    'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'
];

// Partículas
const VIDA_PARTICULA = 10000; // 10 segundos en milisegundos
const MAX_PARTICULAS = 900;   // tope para no saturar el navegador

let posX;
let posY;
let velX;
let velY;
let radio = 25;
let colorIndex = 0;
let notaIndex = 0;

let particulas = [];

let osc = null;
let env = null;
let audioIniciado = false;

function setup(){
    createCanvas(windowWidth, windowHeight);
    posX = width / 2;
    posY = height / 3;
    velX = random(-7, 7);
    velY = random(-9, -3);

    // El audio se crea recién en el primer gesto del usuario. Así el
    // navegador no registra los warnings de "AudioContext not allowed".
    window.addEventListener('pointerdown', activarAudio);
    window.addEventListener('keydown', activarAudio);
    window.addEventListener('touchstart', activarAudio);
    window.addEventListener('click', activarAudio);
}

function draw(){
    background(120);

    // Pelota
    fill(ARCOIRIS[colorIndex]);
    noStroke();
    circle(posX, posY, radio * 2);

    if (cursorSobreLaPelota()){
        // El cursor la detiene mientras esté encima; al quitarlo vuelve a caer.
        velX = 0;
        velY = 0;
    } else {
        velY += GRAVEDAD;
        posX += velX;
        posY += velY;
    }

    rebotar();
    actualizarParticulas();

    if (!audioIniciado){
        fill(255);
        textAlign(CENTER, BOTTOM);
        textSize(16);
        text('Haz clic o toca la pantalla para activar el sonido', width / 2, height - 16);
    }
}

// ------------------------- Partículas -------------------------
// Emite partículas desde la posición del mouse y las hace vivir 10 segundos.
function actualizarParticulas(){
    // Emitir un par por frame desde el mouse.
    for (let i = 0; i < 2; i++){
        if (particulas.length >= MAX_PARTICULAS) break;
        particulas.push({
            x: mouseX,
            y: mouseY,
            vx: random(-2.5, 2.5),
            vy: random(-2.5, 2.5),
            tam: random(4, 14),
            col: ARCOIRIS[floor(random(ARCOIRIS.length))],
            nacimiento: millis()
        });
    }

    noStroke();
    for (let i = particulas.length - 1; i >= 0; i--){
        let p = particulas[i];
        let edad = millis() - p.nacimiento;
        if (edad >= VIDA_PARTICULA){
            particulas.splice(i, 1);
            continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // caída suave
        let alpha = map(edad, 0, VIDA_PARTICULA, 255, 0);
        fill(red(p.col), green(p.col), blue(p.col), alpha);
        circle(p.x, p.y, p.tam);
    }
}

// ------------------------- Pelota -------------------------
// Revisa las paredes laterales, el piso y el techo.
function rebotar(){
    if (posX > width - radio){
        posX = width - radio;
        velX = -max(abs(velX) * random(0.9, 1.0), random(2, 5));
        enCadaRebote();
    } else if (posX < radio){
        posX = radio;
        velX = max(abs(velX) * random(0.9, 1.0), random(2, 5));
        enCadaRebote();
    }

    if (posY > height - radio){
        posY = height - radio;
        // Nunca pierde toda la energía: siempre vuelve a subir, más alto o más bajo.
        let rebote = random(0.8, 1.0);
        if (random() < 0.15) rebote = random(1.0, 1.3);
        velY = -max(abs(velY) * rebote, random(REBOTE_MINIMO, 11));
        velY = constrain(velY, -VELOCIDAD_MAX, VELOCIDAD_MAX);
        velX += random(-0.6, 0.6);
        enCadaRebote();
    } else if (posY < radio){
        posY = radio;
        velY = max(abs(velY) * random(0.85, 1.0), random(REBOTE_MINIMO, 11));
        enCadaRebote();
    }

    // Si al cambiar de tamaño quedó fuera del área, la volvemos a meter
    // sin sonar (si no, encadenaría rebotes en el mismo lugar).
    posX = constrain(posX, radio, width - radio);
    posY = constrain(posY, radio, height - radio);
}

// Lo que pasa en cada rebote: color nuevo, tamaño nuevo y nota nueva.
function enCadaRebote(){
    cambiarColor();
    cambiarTamano();
    rebotarSonido();
}

function cambiarColor(){
    colorIndex = (colorIndex + 1) % ARCOIRIS.length;
}

function cambiarTamano(){
    radio = random(RADIO_MIN, RADIO_MAX);
}

function cursorSobreLaPelota(){
    return dist(mouseX, mouseY, posX, posY) < radio;
}

// ------------------------- Sonido -------------------------
// Cada rebote toca la siguiente nota de "Estrellita, ¿dónde estás?".
function rebotarSonido(){
    if (!audioIniciado || !osc || !env) return;
    osc.freq(ESTRELLITA[notaIndex]);
    notaIndex = (notaIndex + 1) % ESTRELLITA.length;
    env.play();
}

// Crea y arranca el audio en el primer gesto del usuario.
function activarAudio(){
    if (audioIniciado) return;
    audioIniciado = true;

    osc = new p5.Oscillator('sine');
    env = new p5.Envelope(0.001, 0.08, 0.05, 0.15);
    osc.disconnect();
    osc.connect(env);
    osc.amp(0.5);

    const ctx = osc.ctx; // AudioContext nativo del propio oscilador
    if (ctx.state === 'running'){
        osc.start();
    } else {
        ctx.resume().then(function(){ osc.start(); });
    }
}

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);
}
