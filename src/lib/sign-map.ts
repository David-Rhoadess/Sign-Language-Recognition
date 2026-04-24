
import type {Sign, SignData} from "./hand-landmarking.ts";

/**
 * 2 ppl: recognize sign (implement DTW/find DTW lib online/ask claude)
 * - elene
 * - julian
 * 2 ppl: add sign to associative list (make associative list struct/find some sort of way to make this persistent)
 * - david
 * - duc
 * 2 ppl: find llm model and try transformers.js
 * - maral
 * - linh
 */

export const unknownSign = "{???}"

interface SignMapEntry {
    embedding: SignData,
    word: string,
}

export class SignMap {
    #embeddingToWordMap: SignMapEntry[] = [];

    constructor() {
        const stored = localStorage.getItem('signDatabase');
        if (stored) {
            this.#embeddingToWordMap = JSON.parse(stored);
        }
    }

    // given sign data, return the ASL gloss for that data
    recognizeSign(sign: Sign) {
        // TODO: run DTW on sign data
        // TODO: assign sign.word
        sign.word = unknownSign;
        console.log("sign:", sign);
    }

    getDatabase(): SignMapEntry[] {
        return this.#embeddingToWordMap;
    }

    // adds sign to database
    addSignToDatabase(sign: Sign) {
        if (sign.word === null) {
            throw new Error("Cannot add sign to database without word");
        }
    
        this.#embeddingToWordMap.push({embedding: {frames: sign.frames}, word: sign.word});
        const json = JSON.stringify(this.#embeddingToWordMap);
        localStorage.setItem('signDatabase', json);
        fetch('/save-database', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: json})
            .then(() => console.log('Successfully updated database!'))
            .catch(err => console.error('Failed to write database file:', err));

    }
}
