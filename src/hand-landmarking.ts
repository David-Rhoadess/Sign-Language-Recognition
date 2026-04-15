import {DrawingUtils, FilesetResolver, HandLandmarker} from "@mediapipe/tasks-vision";

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

export function watchWebcam(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement) {
    console.debug("watching webcam");
    canvasEl.style.width = `${videoEl.videoWidth} px`;
    canvasEl.style.height = `${videoEl.videoHeight} px`;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    const ctx = canvasEl.getContext("2d") ?? throwNull("Canvas context is null");

    let lastVideoTime = -1;

    const drawingUtils = new DrawingUtils(ctx);

    function renderLoop() {
        if (videoEl.currentTime !== lastVideoTime) {
            const detections = handLandmarker.detectForVideo(videoEl, performance.now());
            lastVideoTime = videoEl.currentTime;
            ctx.save();
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
            if (detections.landmarks) {
                console.log("landmarks", detections.landmarks);
                for (const landmarks of detections.landmarks) {
                    drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                        color: "#00FF00",
                        lineWidth: 5
                    });
                    drawingUtils.drawLandmarks(landmarks, {color: "#FF0000", lineWidth: 2});
                }
            }
            ctx.restore();
        }

        requestAnimationFrame(() => {
            renderLoop();
        });
    }

    renderLoop();
}
