import {DrawingUtils, FilesetResolver, HandLandmarker, type NormalizedLandmark} from "@mediapipe/tasks-vision";

const vision = await FilesetResolver.forVisionTasks(
    "/wasm"
);

const handLandmarker = await HandLandmarker.createFromOptions(
    vision,
    {
        baseOptions: {
            modelAssetPath: "/hand_landmarker.task"
        },
        numHands: 2,
        runningMode: "VIDEO",
    });


function throwNull(msg: string): never {
    throw new Error(msg);
}

type Frame = NormalizedLandmark[][]

export interface SignData {
    frames: Frame[],
}

interface BaseSign extends SignData {
    word: string | null
}

export type Sign = BaseSign;

const signs: Sign[] = [];

function appendSignFrame(sign: Sign, frame: Frame) {
    sign.frames.push(structuredClone(frame));
}

function flushSign(sign: Sign, signDbFn: (sign: Sign) => void) {
    // pass it to our "classification" model
    // i.e. through web worker or just normally if it's not too slow
    signDbFn(sign);
    signs.push(sign);
}

export function watchWebcam(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement, signDbFn: (sign: Sign) => void) {
    console.debug("watching webcam");
    canvasEl.style.width = `${videoEl.videoWidth} px`;
    canvasEl.style.height = `${videoEl.videoHeight} px`;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    const ctx = canvasEl.getContext("2d") ?? throwNull("Canvas context is null");

    let lastVideoTime = -1;

    const drawingUtils = new DrawingUtils(ctx);
    let currSign: Sign | null = null;

    function renderLoop() {
        if (videoEl.currentTime !== lastVideoTime) {
            // ask mediapipe to find landmarks
            const detections = handLandmarker.detectForVideo(videoEl, performance.now());
            lastVideoTime = videoEl.currentTime;
            ctx.save();
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            if (detections.landmarks.length > 0) {
                // if we have landmarks
                if (currSign === null) {
                    // start new sign
                    console.log("starting new sign")
                    currSign = {frames: [], word: null};
                }
                appendSignFrame(currSign, detections.landmarks);
                // draw hand overlay
                for (const landmarks of detections.landmarks) {
                    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                        color: "#00FF00",
                        lineWidth: 5
                    });
                    drawingUtils.drawLandmarks(landmarks, {color: "#FF0000", lineWidth: 2});
                }
            } else if (currSign) {
                // if we don't have landmarks (hand off screen) but we have a sign, flush it'
                console.log("no hands detected, flushing sign", currSign)
                // TODO: internal tool team probably needs to assign sign.word here since
                //  this is the last chance you can modify sign before it is flushed away,
                //  ...
                //  ideally you should pass in the text element that holds the word's label
                //  into watchWebcam and pass the ref through
                flushSign(currSign, signDbFn);
                currSign = null;
                console.log("flushed sign, signs:", structuredClone(signs))
            }
            ctx.restore();
        }

        requestAnimationFrame(() => {
            renderLoop();
        });
    }

    renderLoop();
    return signs;
}