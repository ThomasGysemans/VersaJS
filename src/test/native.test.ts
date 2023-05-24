import type { ListValue } from '../values.js';
import { init_global_context } from '../context.js';
import { assert } from 'chai';
import { run } from '../run.js';
import global_symbol_table, { SymbolTable } from '../symbol_table.js';

const fn = "<stdin>";
const context = init_global_context("tests");

beforeEach(() => {
    // delete the variables from the previous tests and keep the constants
    context.symbol_table = new SymbolTable(global_symbol_table);
});

describe("Native functions", function() {
    it("should work with len()", () => {
        const result = run(`
            len([1, 2])
            len({"a":1, "b":2})
            len("hello")
        `, fn, context)!.value as ListValue;

        if (result) assert.deepStrictEqual(result.elements[0].value, 2);
        if (result) assert.deepStrictEqual(result.elements[1].value, 2);
        if (result) assert.deepStrictEqual(result.elements[2].value, 5);
    });
});

describe("Native classes", () => {
    describe("console", () => {
        it("console.log", () => {
            run(`
                console.log("it works")
            `, fn, context)!.value as ListValue;
        });

        it("console.assert", () => {
            run(`
                console.assert(false, "should be displayed")
                console.assert(true, "should NOT be displayed");
                console.assert(false, ["should", "be", "displayed"], "hey")
            `, fn, context)!.value as ListValue;
        });
    });
});