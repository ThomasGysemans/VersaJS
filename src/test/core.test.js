import assert from 'assert';
import { Context } from '../context.js';
import {Transcriber} from "../transcriber.js";
import global_symbol_table, { SymbolTable } from '../symbol_table.js';
import fs from 'fs';

/** @type {any} */
let $;
let versacode = "";
const context = new Context("<tests>");

const check = (javascript) => {
    const javascript_lines = javascript.trim().split("\n");
    for (let i = 0; i < javascript_lines.length; i++) {
        let evaluated = eval(javascript_lines[i]);
        if (evaluated !== true) {
            console.debug(`An error occured at line ${i} because '${javascript_lines[i]}' !== true. Indeed, it's '${evaluated}'`);
        }
        assert.deepStrictEqual(evaluated, true);
    }
};
const compile  = (versa) => {
    const transcriber = new Transcriber(Array.isArray(versa) ? versa.join('\n') : versa, "", "./", context);
    transcriber.javascript = ""; // remove the boilerplate
    transcriber.interpret_file();
    return transcriber.javascript.trim();
};

before(() => {
    versacode = fs.readFileSync('./template/jscore.js', {encoding:'utf8'});
    console.log(versacode);
    $ = eval(versacode);
});

beforeEach(() => {
    // delete the variables from the previous tests and keep the constants
    context.symbol_table = new SymbolTable(global_symbol_table);
});

describe("JavaScript core", function() {
    it("should work with $.gettype", () => {
        class Test {}
        let instance = new Test();
        assert.deepStrictEqual($.gettype(undefined), $.TYPES.any);
        assert.deepStrictEqual($.gettype(null), $.TYPES.any);
        assert.deepStrictEqual($.gettype(true), $.TYPES.boolean);
        assert.deepStrictEqual($.gettype(false), $.TYPES.boolean);
        assert.deepStrictEqual($.gettype([1]), $.TYPES.list);
        assert.deepStrictEqual($.gettype(1), $.TYPES.number);
        assert.deepStrictEqual($.gettype("string"), $.TYPES.string);
        assert.deepStrictEqual($.gettype(() => {}), $.TYPES.func);
        assert.deepStrictEqual($.gettype({running:0,paused:1}), $.TYPES.object);
        assert.deepStrictEqual($.gettype({age:17}), $.TYPES.dict);
        assert.deepStrictEqual($.gettype({}), $.TYPES.dict);
        assert.deepStrictEqual($.gettype(Test), "Test");
        assert.deepStrictEqual($.gettype(instance), "Test");
    });

    it("should work with $.dictionnary_equals", () => {
        assert.deepStrictEqual($.dictionnary_equals({[`name`]: "thomas"}, {[`name`]: "thomas"}), true);
    });

    it("should work with $.array_equals", () => {
        assert.deepStrictEqual($.array_equals([1], [1]), true);
        assert.deepStrictEqual($.array_equals([1, "yo"], [1, "yo"]), true);
        assert.deepStrictEqual($.array_equals([1, "yo", true], [1, "yo", true]), true);
        assert.deepStrictEqual($.array_equals([1, "yo", true, {[`name`]: "thomas"}], [1, "yo", true, {[`name`]: "thomas"}]), true);
    });

    it("should work with $.is_true", () => {
        class Yo {}
        assert.deepStrictEqual($.is_true(1), true);
        assert.deepStrictEqual($.is_true(0), false);
        assert.deepStrictEqual($.is_true([0]), true);
        assert.deepStrictEqual($.is_true([]), false);
        assert.deepStrictEqual($.is_true({age:17}), true);
        assert.deepStrictEqual($.is_true({}), false);
        assert.deepStrictEqual($.is_true("yo"), true);
        assert.deepStrictEqual($.is_true(""), false);
        assert.deepStrictEqual($.is_true(true), true);
        assert.deepStrictEqual($.is_true(false), false);
        assert.deepStrictEqual($.is_true(() => {}), true);
        assert.deepStrictEqual($.is_true(Yo), true);
        assert.deepStrictEqual($.is_true(new Yo()), true);
        assert.deepStrictEqual($.is_true(null), false);
    });

    it("should work with $.not", () => {
        class Yo {}
        assert.deepStrictEqual($.not(1), false);
        assert.deepStrictEqual($.not(0), true);
        assert.deepStrictEqual($.not([0]), false);
        assert.deepStrictEqual($.not([]), true);
        assert.deepStrictEqual($.not({age:17}), false);
        assert.deepStrictEqual($.not({}), true);
        assert.deepStrictEqual($.not("yo"), false);
        assert.deepStrictEqual($.not(""), true);
        assert.deepStrictEqual($.not(true), false);
        assert.deepStrictEqual($.not(false), true);
        assert.deepStrictEqual($.not(() => {}), false);
        assert.deepStrictEqual($.not(Yo), false);
        assert.deepStrictEqual($.not(new Yo()), false);
        assert.deepStrictEqual($.not(null), true);
    });

    it("should work with an equals node", () => {
        const versa = `
            0 == 0 == 1
            [5, 6] == [5, 6] == 1
            "5" == 5 == 1
            5 == "5" == 1
            {"age":17} == {"age":17} == 1
            none == none == 1
            none == 0 == 1
            0 == none == 1
            "str" == none == 0
            1 == true == 1
            false == 0 == 1
            true == true == 1
            false == false == 1
            [1, "yo", [5], {"age":17}, true, false, none] == [1, "yo", [5], {"age":17}, true, false, none] == 1
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with an addition", () => {
        const versa = `
            # Every possible addition that returns a number
            2 + 2 == 4
            2 + none == 2
            none + 2 == 2
            10 + true == 11
            false + 10 == 10
            true + true == 2
            none + none == 0

            # Every possible addition that returns a string
            2 + "string" == "2string"
            "string" + 2 == "string2"
            "string" + "string" == "stringstring"
            "string" + none == "string"
            none + "string" == "string"
            "string" + true == "string1"
            false + "string" == "0string"
            "string" + yes == "string1"
            no + "string" == "0string"

            # Every possible addition that returns a list
            [0] + 1 == [0, 1]
            
            [0] + "string" == [0, "string"]
            "string" + [0] == ["string", 0]
            [0] + [1] == [0, 1]
            [0] + {"age":17} == [0, {"age":17}]
            {"age":17} + [0] == [{"age":17}, 0]
            [0] + none == [0, none]
            none + [0] == [none, 0]
            [0] + true == [0, true]
            false + [0] == [false, 0]

            # Every possible addition that returns a dictionnary
            {"age":17} + {"name":"thomas"} == {"age":17,"name":"thomas"}
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a subtraction", () => {
        const versa = `
            # Every possible subtraction that returns a number
            5 - 5 == 0
            5 - none == 5
            none - 5 == -5
            none - none == 0
            5 - true == 4
            true - 1 == 0
            true - true == 0
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a multiplication", () => {
        const versa = `
            # Every possible multiplication that returns a number
            10 * 2 == 20
            10 * none == 0
            none * 10 == 0
            none * none == 0
            5 * true == 5
            true * 5 == 5
            true * false == 0

            # Every possible multiplication that returns a string
            "str" * 2 == "strstr"
            2 * "str" == "strstr"

            # Every possible multiplication that returns a list
            [0] * 3 == [0, 0, 0]
            3 * [0] == [0, 0, 0] 
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a division", () => {
        const versa = `
            # Every possible division that returns a number
            10 / 2 == 5
            none / 5 == 0
            5 / true == 5
            true / 2 == 0.5
            true / true == 1
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a modulo", () => {
        const versa = `
            # Every possible modulo that returns a number
            10 % 2 == 0
            none % 5 == 0
            5 % true == 0
            true % 2 == 1
            true % true == 0
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a binary shift to the left", () => {
        const versa = `
            # Every possible combinations
            256 << 2 == 1024
            256 << none == 256
            none << 256 == 0
            256 << true == 512
            true << 256 == 1
            true << true == 2
            5 + 256 << 2 == 1044
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a binary shift to the right", () => {
        const versa = `
            # Every possible combinations
            256 >> 2 == 64
            256 >> none == 256
            none >> 256 == 0
            256 >> true == 128
            true >> 256 == 1
            true >> true == 0
            5 + 256 >> 2 == 65
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with an unsigned binary shift to the right", () => {
        const versa = `
            # Every possible combinations
            256 >>> 2 == 64
            256 >>> none == 256
            none >>> 256 == 0
            256 >>> true == 128
            true >>> 256 == 1
            true >>> true == 0
            5 + 256 >>> 2 == 65
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a logical AND operation", () => {
        const versa = `
            # Every possible combinations
            14 & 9 == 8
            14 & none == 0
            none & 14 == 0
            14 & true == 0
            true & 14 == 0
            true & true == 1
            1 + 13 & 9 == 8
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a logical OR operation", () => {
        const versa = `
            # Every possible combinations
            14 | 9 == 15
            14 | none == 14
            none | 14 == 14
            14 | true == 15
            true | 14 == 15
            true | true == 1
            1 + 13 | 9 == 15
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a logical XOR operation", () => {
        const versa = `
            # Every possible combinations
            14 ^ 9 == 7
            14 ^ none == 14
            none ^ 14 == 14
            14 ^ true == 15
            true ^ 14 == 15
            true ^ true == 0
            1 + 13 ^ 9 == 7
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a binary NOT", () => {
        const versa = `
            # Every possible combinations
            ~5 == -6
            ~none == -1
            ~true == -2
            ~-1 == 0
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a power operation", () => {
        const versa = `
            # Every possible power operation that returns a number
            10 ** 2 == 100
            10 ** none == 1
            none ** 10 == 0
            none ** none == 1
            5 ** true == 5
            false ** 5 == 0
            true ** false == 1
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a 'not'", () => {
        const versa = `
            # Every possible combinations
            not 0 == 1
            not none == 1
            not "something" == 0
            not true == 0
            not false == 1
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with '<'", () => {
        const versa = `
            # Every possible combinations
            5 < 6 == 1
            5 < 5 == 0
            [5, 6] < 3 == 1
            [5, 6] < 1 == 0
            1 < [5, 6] == 1
            3 < [5, 6] == 0
            [5] < [5, 6] == 1
            [5, 6, 7] < [5, 6] == 0
            "str" < 5 == 1
            "str" < 1 == 0
            1 < "str" == 1
            5 < "str" == 0
            "str" < "string" == 1
            {} < {"a":1} == 1
            {"a":1} < {} == 0
            {"a":1} < 0 == 0
            0 < {"a":1} == 1
            none < none == 0
            none < 5 == 1
            none < 0 == 0
            -1 < none == 1
            5 < none == 0
            0 < true == 1
            1 < true == 0
            true < 2 == 1
            true < 0 == 0
            true < true == 0
            false < true == 1
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with '>'", () => {
        const versa = `
            # Every possible combinations
            6 > 4 == 1
            5 > 5 == 0
            3 > [5, 6] == 1
            1 > [5, 6] == 0
            [5, 6] > 1 == 1
            [5, 6] > 3 == 0
            [5, 6] > [5] == 1
            [5, 6] > [5, 6, 7] == 0
            5 > "str" == 1
            1 > "str" == 0
            "str" > 1 == 1
            "str" > 5 == 0
            {"a":1} > {} == 1
            {} > {"a":1} == 0
            0 > {"a":1} == 0
            {"a":1} > 0 == 1
            none > none == 0
            5 > none == 1
            0 > none == 0
            none > -1 == 1
            none > 5 == 0
            true > 0 == 1
            true > 1 == 0
            2 > true == 1
            0 > true == 0
            true > true == 0
            true > false == 1
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with '<='", () => {
        const versa = `
            # Every possible combinations
            5 <= 6 == 1
            5 <= 5 == 1
            [5, 6] <= 3 == 1
            [5, 6] <= 1 == 0
            1 <= [5, 6] == 1
            3 <= [5, 6] == 0
            [5] <= [5, 6] == 1
            [5, 6, 7] <= [5, 6] == 0
            "str" <= 5 == 1
            "str" <= 1 == 0
            1 <= "str" == 1
            5 <= "str" == 0
            {} <= {"a":1} == 1
            {"a":1} <= {} == 0
            {"a":1} <= 0 == 0
            0 <= {"a":1} == 1
            none <= none == 1
            none <= 5 == 1
            none <= 0 == 1
            -1 <= none == 1
            5 <= none == 0
            0 <= true == 1
            1 <= true == 1
            true <= 2 == 1
            true <= 0 == 0
            true <= true == 1
            false <= true == 1
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with '>='", () => {
        const versa = `
            # Every possible combinations
            6 >= 4 == 1
            5 >= 5 == 1
            3 >= [5, 6] == 1
            1 >= [5, 6] == 0
            [5, 6] >= 1 == 1
            [5, 6] >= 3 == 0
            [5, 6] >= [5] == 1
            [5, 6] >= [5, 6, 7] == 0
            5 >= "str" == 1
            1 >= "str" == 0
            "str" >= 1 == 1
            "str" >= 5 == 0
            {"a":1} >= {} == 1
            {} >= {"a":1} == 0
            0 >= {"a":1} == 0
            {"a":1} >= 0 == 1
            none >= none == 1
            5 >= none == 1
            0 >= none == 1
            none >= -1 == 1
            none >= 5 == 0
            true >= 0 == 1
            true >= 1 == 1
            2 >= true == 1
            0 >= true == 0
            true >= true == 1
            true >= false == 1
        `;
        const javascript = compile(versa);
        check(javascript);
    });

    it("should work with a not equals node", () => {
        const versa = `
            # Every possible combinations
            0 != 0 == 0
            [5, 6] != [5, 6] == 0
            "5" != 5 == 0
            5 != "5" == 0
            {"age":17} != {"age":17} == 0
            none != none == 0
            none != 0 == 0
            0 != none == 0
            "str" != none == 1
            1 != true == 0
            false != 0 == 0
            true != true == 0
            false != false == 0
        `;
        const javascript = compile(versa);
        check(javascript);
    });
});