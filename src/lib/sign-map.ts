/*
Todo:
 - Make data persistant
 - auto flush to data structure
    - add text field in react
 - Import from youtube link (optional)
*/





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

    constructor(embeddingToWordMap?: SignMapEntry[]) {
        if (embeddingToWordMap) {
            this.#embeddingToWordMap = embeddingToWordMap;
        } else {
            const saved = localStorage.getItem('signDatabase');
            if (saved) {
                this.#embeddingToWordMap = JSON.parse(saved);
            }
        }
    }

    // given sign data, return the ASL gloss for that data
    recognizeSign(sign: Sign) {
        // TODO: run DTW on sign data
        // TODO: assign sign.word
        sign.word = unknownSign;
        console.log("sign:", sign);
    }

    // merge entries from a JSON file, skipping words already present
    async mergeFromFile(url: string): Promise<void> {
        try {
            const response = await fetch(url);
            if (!response.ok) return;
            const entries: SignMapEntry[] = await response.json();
            const existingWords = new Set(this.#embeddingToWordMap.map(e => e.word));
            for (const entry of entries) {
                if (!existingWords.has(entry.word)) {
                    this.#embeddingToWordMap.push(entry);
                    existingWords.add(entry.word);
                }
            }
            localStorage.setItem('signDatabase', JSON.stringify(this.#embeddingToWordMap));
        } catch {
            // file not found or invalid — first run, nothing to merge
        }
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

export type SignDatabaseFunction = SignMap["recognizeSign"] | SignMap["addSignToDatabase"]