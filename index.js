// Declare variables
let mic, recorder
let soundFiles = [];
let temperature;
let t1 = 0.008;
let t2 = 0.003;
let extraTime = 400;
let hasRecording = false;
let isFullScreen = false;
let r, g, b;
let pvol = 0;
let volCountdown = 0;
let delay;
let state;
let sound;
let soundIndex = 0;


// Handle user input for toggling full screen mode
function mousePressed() {
    if (mouseX > 0 && mouseX < windowWidth && mouseY > 0 && mouseY < windowHeight) {
        let fs = fullscreen();
        fullscreen(!fs);
    }
}


function setup() {
    // Set up canvas
    createCanvas(windowWidth, windowHeight);

    // Initialize microphone input
    mic = new p5.AudioIn();
    mic.start();

    // Initialize delay effect
    delay = new p5.Delay();

    // Initialize sound recorder
    recorder = new p5.SoundRecorder();
    recorder.setInput(mic);

    temperature = random(400, 2000);

    // Initialize background color
    r = random(255);
    g = random(255);
    b = random(255);

    state = 0;
}

function draw() {
    switchState();
}

function switchState() {
    let vol = mic.getLevel();
    let volSmooth = 60 * smoothy(vol, pvol, 0.9999);
    pvol = mic.getLevel();
    bgReact(vol, volSmooth);

    switch (state) {
        case 0: // passive
            if (vol > t1) {
                state = 4;
            } else if (hasRecording && extraTime < 0) {
                state = 6;
            }
            extraTime -= 5;
            break;
        case 1: // recording
            if (vol < t2) {
                hasRecording = true;
                state = 5;
            }
            break;
        case 2: // replaying
            soundIndex = floor(random(soundFiles.length));
            sound = soundFiles[soundIndex];

            if (random(1) < 0.5) {
                // Apply delay effect to
                delay.process(sound, random(0.1, 0.5), 0.5, 1000);
                delay.setType('pingPong'); // a stereo effect
            }
            if (!sound.isPlaying()) {
                sound.play();
                state = 7;
            }

            break;
        case 3:
            break;
        case 4: // from passive to recording
            soundFiles.push(new p5.SoundFile());
            recorder.record(soundFiles[soundFiles.length - 1]);
            state = 1;
            break;
        case 5: // from recording to passive
            recorder.stop();
            extraTime = random(temperature, 2 * temperature);
            state = 0;
            break;
        case 6: // from passive to replaying
            state = 2;
            break;
        case 7: // from replaying to passive
            if (!sound.isPlaying()) {
                extraTime = random(temperature, 2 * temperature);
                volCountdown = random(10, 200);
                state = 0;
            }
            break;
    }
}

function bgReact(vol, volSmooth) {
    if (vol < t1) {
        vol -= t1 / 10;
    }
    if (volCountdown > 0) {
        volCountdown -= 1;
    }
    background(constrain(volSmooth * r + volCountdown, 0, 255),
        constrain(volSmooth * g + volCountdown, 0, 255),
        constrain(volSmooth * b + volCountdown, 0, 255));
}

// P5JS windowResized
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function smoothy(value, previousValue, alpha) {
    return alpha * value + (1 - alpha) * previousValue;
}