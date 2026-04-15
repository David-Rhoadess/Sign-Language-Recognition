import Webcam from "react-webcam";
import "./App.css";
import {useCallback, useRef} from "react";
import {watchWebcam} from "./hand-landmarking.ts";

function App() {
    const webcamRef = useRef<Webcam | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleCamReady = useCallback(() => {
        if (canvasRef.current === null || webcamRef.current === null) return;
        if (webcamRef.current.video === null) return;

        watchWebcam(webcamRef.current.video, canvasRef.current)
    }, []);

    return <>
        <Webcam id={"webcam"} ref={webcamRef} onCanPlay={handleCamReady}></Webcam>
        <canvas id={"canvas"} ref={canvasRef}></canvas>
    </>;
}

export default App
