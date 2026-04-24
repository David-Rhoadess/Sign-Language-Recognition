import Webcam from "react-webcam";
import "./App.css";
import {useCallback, useEffect, useRef, useState} from "react";
import {watchWebcam} from "./lib/hand-landmarking.ts";
import type {Sign} from "./lib/hand-landmarking.ts";
import {SignMap} from "./lib/sign-map.ts";

const signDb = new SignMap();

function App() {
    const webcamRef = useRef<Webcam | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [text, setText] = useState("")
    const [pendingSign, setPendingSign] = useState<Sign | null>(null)

    useEffect(() => {
        signDb.mergeFromFile('/MappingDatabase.json');
    }, []);

    const handleExport = () => {
        const json = JSON.stringify(signDb.getDatabase(), null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MappingDatabase.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSave = () => {
        if (!pendingSign || !text) return;
        pendingSign.word = text;
        signDb.addSignToDatabase(pendingSign);
        setText("");
        setPendingSign(null);
    }

    const handleCamReady = useCallback(() => {
        if (canvasRef.current === null || webcamRef.current === null) return;
        if (webcamRef.current.video === null) return;

        // TODO: internal tool team probably needs to add some sort
        //  of button that can switch the passed in signDbFn
        // this returns a reference to the signs
        const signs = watchWebcam(webcamRef.current.video, canvasRef.current, signDb.recognizeSign, setPendingSign)
        console.log("signs:", signs)
    }, []);

    return <>
        <Webcam id={"webcam"} ref={webcamRef} onCanPlay={handleCamReady}></Webcam>
        <canvas id={"canvas"} ref={canvasRef}></canvas>
        <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter Word Here"
        />
        <button onClick={handleSave}>
            Save
        </button>
        <button onClick={handleExport}>
            Export Database
        </button>
    </>;
}

export default App
