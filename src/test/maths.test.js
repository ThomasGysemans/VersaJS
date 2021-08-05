import assert from 'assert';
import { Context } from '../context.js';
import { RuntimeError } from '../Exceptions.js';
import { run } from '../run.js';
import global_symbol_table, { SymbolTable } from '../symbol_table.js';

const fn = "<stdin>";
const context = new Context("<maths>");

const check = (result) => {
    for (let line of result.elements) {
        if (typeof line.state === "undefined") {
            console.error("line.state is undefined because it's:", line);
        }
        if (line.state === 0) {
            const error = new RuntimeError(
                line.pos_start, line.pos_end,
                "Expected true, but got false",
                context
            );
            console.error(error.toString());
        }
        assert.deepStrictEqual(line.state, 1);
    }
};

beforeEach(() => {
    // delete the variables from the previous tests and keep the constants
    context.symbol_table = new SymbolTable(global_symbol_table);
});

describe("Maths (tests every possible combinations for every kind of arithmetic operation)", function() {
    it("should work with an equals node", () => {
        const result = run(`
            # Every possible combinations
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
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with an addition", () => {
        // todo: we would need to add additions including classes and enums in the future
        const result = run(`
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
            "string" + true == "stringtrue"
            false + "string" == "falsestring"
            "string" + yes == "stringyes"
            no + "string" == "nostring"

            # Every possible addition that returns a list
            [0] + 1 == [0, 1]
            1 + [0] == [1, 0]
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
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a multiplication", () => {
        const result = run(`
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
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a division", () => {
        const result = run(`
            # Every possible division that returns a number
            10 / 2 == 5
            none / 5 == 0
            5 / true == 5
            true / 2 == 0.5
            true / true == 1
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a modulo", () => {
        const result = run(`
            # Every possible modulo that returns a number
            10 % 2 == 0
            none % 5 == 0
            5 % true == 0
            true % 2 == 1
            true % true == 0
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a power operation", () => {
        const result = run(`
            # Every possible power operation that returns a number
            10 ** 2 == 100
            10 ** none == 1
            none ** 10 == 1
            none ** none == 1
            5 ** true == 5
            false ** 5 == 0
            true ** false == 1
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a not node", () => {
        const result = run(`
            # Every possible combinations
            not 0 == 1
            not none == 1
            not "something" == 0
            not true == 0
            not false == 1
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with less than node", () => {
        const result = run(`
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
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with less than or equal node", () => {
        const result = run(`
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
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with greater than node", () => {
        const result = run(`
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
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with greater than or equal node", () => {
        const result = run(`
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
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a not equals node", () => {
        const result = run(`
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
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a binary shift to the left", () => {
        const result = run(`
            # Every possible combinations
            256 << 2 == 1024
            256 << none == 256
            none << 256 == 0
            256 << true == 512
            true << 256 == 1
            true << true == 2
            5 + 256 << 2 == 1044
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a binary shift to the right", () => {
        const result = run(`
            # Every possible combinations
            256 >> 2 == 64
            256 >> none == 256
            none >> 256 == 0
            256 >> true == 128
            true >> 256 == 1
            true >> true == 0
            5 + 256 >> 2 == 65
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with an unsigned binary shift to the right", () => {
        const result = run(`
            # Every possible combinations
            256 >>> 2 == 64
            256 >>> none == 256
            none >>> 256 == 0
            256 >>> true == 128
            true >>> 256 == 1
            true >>> true == 0
            5 + 256 >>> 2 == 65
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a logical AND operation", () => {
        const result = run(`
            # Every possible combinations
            14 & 9 == 8
            14 & none == 0
            none & 14 == 0
            14 & true == 0
            true & 14 == 0
            true & true == 1
            1 + 13 & 9 == 8
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a logical OR operation", () => {
        const result = run(`
            # Every possible combinations
            14 | 9 == 15
            14 | none == 14
            none | 14 == 14
            14 | true == 15
            true | 14 == 15
            true | true == 1
            1 + 13 | 9 == 15
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a logical XOR operation", () => {
        const result = run(`
            # Every possible combinations
            14 ^ 9 == 7
            14 ^ none == 14
            none ^ 14 == 14
            14 ^ true == 15
            true ^ 14 == 15
            true ^ true == 0
            1 + 13 ^ 9 == 7
        `, fn, context).value;

        if (result) check(result);
    });

    it("should work with a binary NOT", () => {
        const result = run(`
            # Every possible combinations
            ~5 == -6
            ~none == -1
            ~true == -2
            ~-1 == 0
        `, fn, context).value;

        if (result) check(result);
    });
});