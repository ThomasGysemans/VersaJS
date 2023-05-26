"use strict";

import type { CustomError } from "./Exceptions.js";
import { init_global_context } from "./context.js";
import { Transcriber } from "./transcriber.js";
import fs from 'fs';

// NOTE: paths are relative to root of the project (so here the location of package.json)
// Therefore, no matter where we are in the project, "." refers to that root.

const fn = "examples/main.vjs";
let script = ``;

try {
    const context = init_global_context();

    script = fs.readFileSync(fn, { encoding: 'utf8' });
    const transcriber = new Transcriber(script, fn, undefined, context);
    transcriber.create();
} catch(e) {
    // console.warn(e);
    throw new Error(
        `Failed to load script "${fn}"\n` + (e as CustomError | Error).toString(), // might be both type of error
    );
}
