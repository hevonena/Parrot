const Color = {
    red: 0,
    green: 0,
    blue: 0,
    changeRate: 1,

    updateColor: function () {
        this.red = random(255);
        this.green = random(255);
        this.blue = random(255);
    }
};

const Threshold = {
    value1: 0.008,
    value2: 0.003,

    updateThreshold: function (value) {
        this.value1 += value;
        this.value2 += value;
        this.value1 = constrain(this.value1, 0.001, 0.1);
        this.value2 = constrain(this.value2, 0.001, 0.1);
    }
};

let mic, recorder, delay, state, sound, soundFiles = [], soundIndex = 0, hasRecording = false, temperature, extraTime, volCountdown = 0;
let reverb, dist, highpass;

function setup() {
    createCanvas(windowWidth, windowHeight);
    initializeAudio();
    initializeColor();
    state = 0;
}

function draw() {
    handleState();
}

function initializeAudio() {
    mic = new p5.AudioIn();
    mic.start();

    delay = new p5.Delay();
    reverb = new p5.Reverb();
    dist = new p5.Distortion();
    highpass = new p5.HighPass();

    recorder = new p5.SoundRecorder();
    recorder.setInput(mic);

    temperature = random(400, 2000);
}

function initializeColor() {
    Color.updateColor();
}

function handleState() {
    let vol = mic.getLevel();
    let volAmped = 60 * vol;
    backgroundColorChange(vol, volAmped);

    switch (state) {
        case 0: handlePassiveState(vol); break;
        case 1: handleRecordingState(vol); break;
        case 2: handleReplayingState(); break;
        case 4: startRecording(); break;
        case 5: stopRecording(); break;
        case 6: startReplaying(); break;
        case 7: stopReplaying(); break;
    }
}

function backgroundColorChange(vol, volAmped) {
    if (vol < Threshold.value1) vol -= Threshold.value1 / 10;
    if (volCountdown > 0) volCountdown -= 1;

    volAmped *= Color.changeRate;

    background(
        constrain(volAmped * Color.red + map(volCountdown * Color.red, 0, 200 * Color.red, 0, Color.red), 0, 255),
        constrain(volAmped * Color.green + map(volCountdown * Color.green, 0, 200 * Color.green, 0, Color.green), 0, 255),
        constrain(volAmped * Color.blue + map(volCountdown * Color.blue, 0, 200 * Color.blue, 0, Color.blue), 0, 255)
    );
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function handlePassiveState(vol) {
    if (vol > Threshold.value1) {
        state = 4;
    } else if (hasRecording && extraTime < 0) {
        state = 6;
    }
    extraTime -= 5;
}

function handleRecordingState(vol) {
    if (vol < Threshold.value2) {
        hasRecording = true;
        state = 5;
    }
}

function handleReplayingState() {
    soundIndex = floor(random(soundFiles.length));
    sound = soundFiles[soundIndex];

    applyRandomEffectsToSound();

    if (!sound.isPlaying()) {
        sound.play();
        state = 7;
    }
}

function startRecording() {
    soundFiles.push(new p5.SoundFile());
    recorder.record(soundFiles[soundFiles.length - 1]);
    state = 1;
}

function stopRecording() {
    recorder.stop();
    extraTime = random(temperature, 2 * temperature);
    state = 0;
}

function startReplaying() {
    state = 2;
}

function stopReplaying() {
    if (!sound.isPlaying()) {
        extraTime = random(temperature, 2 * temperature);
        volCountdown = random(10, 200);
        state = 0;
    }
}

function applyRandomEffectsToSound() {
    if (random(1) < 0.5) {
        delay.process(sound, random(0.1, 0.5), 0.5, 1000);
        delay.setType('pingPong');
    }

    let dryWet = random(0, 1);
    delay.drywet(dryWet);
    reverb.drywet(dryWet);
    dist.set(random(0, 1));

    if (random(1) < 0.5) {
        reverb.process(sound, random(2, 5), random(0, 1));
    }

    if (random(1) < 0.5) {
        highpass.freq(random(100, 1000));
    }
}

function keyPressed() {
    switch (keyCode) {
        case LEFT_ARROW: Threshold.updateThreshold(-0.001); break;
        case RIGHT_ARROW: Threshold.updateThreshold(0.001); break;
        case UP_ARROW: Color.changeRate += 0.1; break;
        case DOWN_ARROW: Color.changeRate -= 0.1; break;
    }

    Color.changeRate = constrain(Color.changeRate, 0.1, 5);
    console.log("t1: " + Threshold.value1, "t2: " + Threshold.value2, "colorChangeRate: " + Color.changeRate);
}

function mousePressed() {
    let fs = fullscreen();
    fullscreen(!fs);
}
