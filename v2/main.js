import fs from 'fs';
import { run } from './run.js';

let script = ``;
let fn = "example.runjs";

try {
    script = fs.readFileSync(fn, 'utf8');
} catch(e) {
    throw new Error(
        `Failed to load script "${fn}"\n` + e.toString(),
    );
}

run(script, fn);