"use strict";

import fs from 'fs';
import { run } from './run.js';
import {Transcriber} from "./transcriber.js";

let script = ``;
let fn = "./examples/main.vjs";

try {
    script = fs.readFileSync(fn, 'utf8');
} catch(e) {
    throw new Error(
        `Failed to load script "${fn}"\n` + e.toString(),
    );
}

// run(script, fn);
const transcriber = new Transcriber(script, fn, "./compiled/");
transcriber.create();