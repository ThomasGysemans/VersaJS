import { init_global_context } from '../context.js';
import { Transcriber } from "../transcriber.js";
import { assert } from 'chai';
import global_symbol_table, { SymbolTable } from '../symbol_table.js';

const context = init_global_context("<tests>");

const evaluate  = (javascript: string, expected: any) => assert.deepStrictEqual(eval(javascript), expected);
const compare   = (javascript: string, expected: any) => assert.deepStrictEqual(javascript, expected);
const multiline = (javascript: string, expected: any) => {
    const expected_lines = expected.trim().split('\n');
    const actual_lines = javascript.trim().split('\n');
    // sometimes I forget lines
    // and it's annoying
    if (actual_lines.length !== expected_lines.length) {
        const length = actual_lines.length > expected_lines.length ? actual_lines.length : expected_lines.length;
        let problem = 0;
        for (let i = 0; i < length; ++i) {
            if (actual_lines[i].trim() !== expected_lines[i].trim()) {
                problem = i;
                break;
            }
        }
        console.log(`The error should be around here: (problem=${problem})`)
        console.group("--- Actual lines:");
        console.debug(actual_lines.slice(problem - 1, problem + 1));
        console.groupEnd();
        console.group("--- Expected lines:");
        console.debug(expected_lines.slice(problem - 1, problem + 1));
        console.groupEnd();
    }
    assert.deepStrictEqual(actual_lines.length, expected_lines.length);
    actual_lines.forEach((v, i) => assert.deepStrictEqual(v.trim(), expected_lines[i].trim()));
}

const compile = (versa: string | string[]) => {
    const transcriber = new Transcriber(Array.isArray(versa) ? versa.join('\n') : versa, "", "./", context);
    return transcriber.getJavaScript().trim();
};

beforeEach(() => {
    // delete the variables from the previous tests and keep the constants
    context.symbol_table = new SymbolTable(global_symbol_table);
});

describe("Compiler", function() {
    it("should work with a number", () => {
        const versa = `8`;
        const javascript = compile(versa);
        evaluate(javascript, 8);
    });

    it("should work with none", () => {
        const versa = `none`;
        const javascript = compile(versa);
        evaluate(javascript, null);
    });

    it("should work with a boolean", () => {
        const versa = `
            true
            yes
            no
            false
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            true
            true
            false
            false
        `);
    });

    it("should work with a variable declaration", () => {
        const versa = `var thing = 5`;
        const javascript = compile(versa);
        compare(javascript, "let thing = 5");
    });

    it("should work with a constant declaration", () => {
        const versa = `
            var a = 1
            define constant = 3.14
            var b = 2
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            const constant = 3.14
            let a = 1
            let b = 2
        `);
    });

    it("should work with an enum", () => {
        const versa = `
            var a = 1
            enum Status2:
                running,
                paused,
            end
            var b = 2
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            const Status2 = {
                running: 0,
                paused: 1
            }
            let a = 1
            let b = 2
        `);
    });

    it("should work with the access to a variable", () => {
        const versa = `
            var thing = 5;
            thing`;
        const javascript = compile(versa);
        multiline(javascript, `
            let thing = 5
            thing
        `);
    });

    it("should work with the modification of a variable", () => {
        const versa = `
            var something = 5
            something = 6
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let something = 5
            something = 6
        `);
    });

    it("should work with a list", () => {
        const versa = `[1, 2]`;
        const javascript = compile(versa);
        evaluate(javascript, [1, 2]);
    });

    it("should work with an addition", () => {
        const versa = `8 + 5`;
        const javascript = compile(versa);
        compare(javascript, "$.add(8, 5)");
    });

    it("should work with a subtraction", () => {
        const versa = `8 - 5`;
        const javascript = compile(versa);
        compare(javascript, "(8 - 5)");
    });

    it("should work with a multiplication", () => {
        const versa = `8 * 5`;
        const javascript = compile(versa);
        compare(javascript, "$.mul(8, 5)");
    });

    it("should work with a division", () => {
        const versa = `10 / 2`;
        const javascript = compile(versa);
        evaluate(javascript, 5);
    });

    it("should work with a power", () => {
        const versa = `10 ** 2`;
        const javascript = compile(versa);
        evaluate(javascript, 100);
    });

    it("should work with a modulo", () => {
        const versa = `10 % 2`;
        const javascript = compile(versa);
        evaluate(javascript, 0);
    });

    it("should work with a binary shift to the left", () => {
        const versa = `256 << 2`;
        const javascript = compile(versa);
        evaluate(javascript, 1024);
    });

    it("should work with a binary shift to the right", () => {
        const versa = `256 >> 2`;
        const javascript = compile(versa);
        evaluate(javascript, 64);
    });

    it("should work with an unsigned binary shift to the right", () => {
        const versa = `256 >>> 2`;
        const javascript = compile(versa);
        evaluate(javascript, 64);
    });

    it("should work with a logical 'AND' (&)", () => {
        const versa = `256 & 2`;
        const javascript = compile(versa);
        compare(javascript, "(256 & 2)");
    });

    it("should work with a logical 'OR' (|)", () => {
        const versa = `256 | 2`;
        const javascript = compile(versa);
        compare(javascript, "(256 | 2)");
    });

    it("should work with a logical 'XOR' (^)", () => {
        const versa = `256 ^ 2`;
        const javascript = compile(versa);
        compare(javascript, "(256 ^ 2)");
    });

    it("should work with a positive number", () => {
        const versa = `+2`;
        const javascript = compile(versa);
        compare(javascript, "+2");
    });

    it("should work with a negative number", () => {
        const versa = `-2`;
        const javascript = compile(versa);
        compare(javascript, "-2");
    });

    it("should work with a binary NOT", () => {
        const versa = `~2`;
        const javascript = compile(versa);
        compare(javascript, "~2");
    });

    it("should work with a prefix operation", () => {
        const versa = `
            ++2
            ----2
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            (2 + 1)
            (2 - 2)
        `);
    });

    it("should work with a postfix operation", () => {
        const versa = `
            var a = 5
            a++++
            a----
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let a = 5
            (a+=2)
            (a-=2)
        `);
    });

    it("should work with a less than (<)", () => {
        const versa = `256 < 2`;
        const javascript = compile(versa);
        compare(javascript, "$.lt(256, 2)");
    });

    it("should work with a greater than (>)", () => {
        const versa = `256 > 2`;
        const javascript = compile(versa);
        compare(javascript, "$.gt(256, 2)");
    });

    it("should work with a less than or equal (<=)", () => {
        const versa = `256 <= 2`;
        const javascript = compile(versa);
        compare(javascript, "$.lte(256, 2)");
    });


    it("should work with a greater than or equal (>=)", () => {
        const versa = `256 >= 2`;
        const javascript = compile(versa);
        compare(javascript, "$.gte(256, 2)");
    });

    it("should work with a string", () => {
        const versa = `
            var name = "Thomas"
            var str = "My name is {name}"
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let name = \`Thomas\`
            let str = \`My name is $\{$.concatenate([name])}\`
        `);
    });

    it("should work with a dictionary", () => {
        const versa = `{"name": "thomas"}`;
        const javascript = compile(versa);
        compare(javascript, '{ [`name`]: `thomas` }'); // eval doesn't work with this syntax
    });

    it("should work with the access to a list", () => {
        const versa = `
            var list = [[0, 1]]
            list[0]?.[0]
            list[0][0:5]
            list[0][0:]
            list[0][:]
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let list = [[0, 1]]
            list[0]?.[0]
            list[0].slice(0, 5)
            list[0].slice(0)
            list[0].slice(0)
        `);
    });

    it("should work with the assignment to a list", () => {
        const versa = `
            var list = [[0, 1]]
            list[0][0] = 5
            list[0][] = 6
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let list = [[0, 1]]
            list[0][0] = 5
            list[0].push(6)
        `);
    });

    it("should work with the declaration of a function", () => {
        const versa = `
            func add(a, b?, c?=5) -> a + b + c
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            function add(a, b = null, c = 5) {
                return $.add($.add(a, b), c)
            }
        `);
    });

    it("should work with the declaration of a function (anonymous)", () => {
        const versa = `
            var add = func (a, b?, c?=5) -> a + b + c
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let add = ((a, b = null, c = 5) => {
                return $.add($.add(a, b), c)
            })
        `);
    });

    it("should work with a return keyword (and a multiline function)", () => {
        const versa = `
            func add(a, b?, c?=5):
                return a + b + c
            end
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            function add(a, b = null, c = 5) {
                return $.add($.add(a, b), c)
            }
        `);
    });

    it("should work with real example (a function that calculates the average grade)", () => {
        const versa = `
            func average_grade(number_of_marks, ...marks?):
                if not marks: return 0

                var s = 0
                for i to number_of_marks:
                    s += marks[i]
                end
                return s / number_of_marks
            end
            average_grade(3)
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            function average_grade(number_of_marks, ...marks) {
                if ($.is_true($.not(marks))) {
                    return 0
                }
                
                let s = 0
                for (let i = 0; $.forcond(i, 1, number_of_marks); i += $.forinc(1, 0, number_of_marks)) {
                    s = $.add(s, marks[i])
                }
                return (s / number_of_marks)
            }
            average_grade(3)
        `);
    });

    it("should work with a call", () => {
        const versa = `
            func add(a, b?, c?=5) -> a + b + c
            add(5)
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            function add(a, b = null, c = 5) {
                return $.add($.add(a, b), c)
            }
            add(5)
        `);
    });

    it("should work with a call to a property", () => {
        const versa = 'console.log';
        const javascript = compile(versa);
        compare(javascript, 'console.log');
    });

    it("should work with a call to a method", () => {
        const versa = 'console.log("it works")';
        const javascript = compile(versa);
        compare(javascript, 'console.log(`it works`)');
    });

    it("should work with a nullish operator node", () => {
        const versa = 'none ?? 5';
        const javascript = compile(versa);
        compare(javascript, 'null ?? 5');
    });

    it("should work with a nullish assignment node", () => {
        const versa = `
            var list = [1, 2]
            list[5] ??= 6
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let list = [1, 2]
            list[5] ??= 6
        `);
    });

    it("should work with an 'and' assignment node", () => {
        const versa = `
            var variable = 0
            variable &&= 6
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let variable = 0
            variable &&= 6
        `);
    });

    it("should work with an 'or' assignment node", () => {
        const versa = `
            var variable = 0
            variable ||= 6
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let variable = 0
            variable ||= 6
        `);
    });

    it("should work with 'and'", () => {
        const versa = '1 and 1';
        const javascript = compile(versa);
        compare(javascript, '1 && 1');
    });

    it("should work with 'or'", () => {
        const versa = '1 or 0';
        const javascript = compile(versa);
        compare(javascript, '1 || 0');
    });

    it("should work with 'not'", () => {
        const versa = 'not 1';
        const javascript = compile(versa);
        compare(javascript, '$.not(1)');
    });

    it("should work with '!='", () => {
        const versa = '1 != 1';
        const javascript = compile(versa);
        compare(javascript, '$.inequality(1, 1)');
    });

    it("should work with '=='", () => {
        const versa = '1 == 1';
        const javascript = compile(versa);
        compare(javascript, '$.equality(1, 1)');
    });

    it("should work with '==' (and lists)", () => {
        const versa = '[5, 6] == [5, 6] == 1';
        const javascript = compile(versa);
        compare(javascript, '$.equality($.equality([5, 6], [5, 6]), 1)');
    });

    it("should work with a condition (if-statement) on a single line", () => {
        const versa = `
            if 1 == 1: "good" else: "weird"
            if 1 == 1: "good" elif 1 == 2: "not good" elif 1 == 3: "strange" else: "weird"
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            ($.is_true($.equality(1, 1)) ? \`good\` : \`weird\`)
            ($.is_true($.equality(1, 1)) ? \`good\` : ($.is_true($.equality(1, 2)) ? \`not good\` : ($.is_true($.equality(1, 3)) ? \`strange\` : \`weird\`)))
        `);
    });

    it("should work with a condition (if-statement) on several lines", () => {
        const versa = `
            if 1 == 1:
                "good"
            elif 1 == 2:
                "not good"
            elif 1 == 3:
                "strange"
            else:
                "weird"
            end
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            if ($.is_true($.equality(1, 1))) {
                \`good\`
            } else if ($.is_true($.equality(1, 2))) {
                \`not good\`
            } else if ($.is_true($.equality(1, 3))) {
                \`strange\`
            } else {
                \`weird\`
            }
        `);
    });

    it("should work with a for-loop on several lines", () => {
        const versa = `
            var list = []
            for i to 10 step 1:
                list[] = i
            end
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let list = []
            for (let i = 0; $.forcond(i, 1, 10); i += $.forinc(1, 0, 10)) {
                list.push(i)
            }
        `);
    });

    it("should work with a for-loop on a single line", () => {
        const versa = `
            var list = for i to 10: i
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let list = (() => {
                let $list = []
                for (let i = 0; $.forcond(i, 1, 10); i += $.forinc(1, 0, 10)) {
                    $list.push(i)
                }
                return $list
            })()
        `);
    });

    it("should work with a foreach-loop on several lines (with key)", () => {
        const versa = `
            var dict = {"age": 17, "name": "thomas"}
            var keys = []
            var values = []
            foreach dict as key => value:
                keys[] = key
                values[] = value
            end
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let dict = { [\`age\`]: 17, [\`name\`]: \`thomas\` }
            let keys = []
            let values = []
            $.foreach(dict, ($i) => {
                let key = Array.isArray(dict) ? $i : Object.keys(dict)[$i]
                let value = dict[key]
                keys.push(key)
                values.push(value)
            })
        `);
    });

    it("should work with a foreach-loop on several lines (without key)", () => {
        const versa = `
            var dict = {"age": 17, "name": "thomas"}
            var values = []
            foreach dict as value:
                values[] = value
            end
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let dict = { [\`age\`]: 17, [\`name\`]: \`thomas\` }
            let values = []
            $.foreach(dict, ($i) => {
                let value = Array.isArray(dict) ? dict[$i] : Object.values(dict)[$i]
                values.push(value)
            })
        `);
    });

    it("should work with a foreach-loop on a single line", () => {
        const versa = `
            var list = [1, 2]
            var loop = foreach list as key => value: [key, value]
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let list = [1, 2]
            let loop = $.foreach(list, ($i) => {
                let key = Array.isArray(list) ? $i : Object.keys(list)[$i]
                let value = list[key]
                return [key, value]
            })
        `);
    });

    it("should work with a while-loop on several lines", () => {
        const versa = `
            var i = 0
            while i < 10:
                i++
            end
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let i = 0
            while ($.is_true($.lt(i, 10))) {
                (i+=1)
            }
        `);
    });

    it("should work with a while-loop on a single line", () => {
        const versa = `
            var i = 0
            var list = while i < 10: i++
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let i = 0
            let list = (() => {
                let $list = []
                while ($.is_true($.lt(i, 10))) {
                    $list.push((i+=1))
                }
                return $list
            })()
        `);
    });

    it("should work with the 'delete' keyword (on a variable)", () => {
        const versa = `
            var a = 0
            delete a
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let a = 0
            a = undefined
        `);
    });

    it("should work with the 'delete' keyword (on a list, with binary selector)", () => {
        const versa = `
            var list = [0, [0, 1], 2]
            delete list[1:] # expected: [0]
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let list = [0, [0, 1], 2]
            $.del(() => {
                list.splice(1)
            })
        `);
    });

    it("should work with the 'delete' keyword (on a list, without binary selector)", () => {
        const versa = `
            var list = [0, [0, 1], 2]
            delete list[1][0] # expected: [0, [1], 2]
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let list = [0, [0, 1], 2]
            $.del(() => {
                list[1][0] = undefined
                list = list.filter(v => v !== undefined)
            })
        `);
    });

    it("should work with a switch (without default)", () => {
        const versa = `
            var value = 5
            switch value:
                case 1, 2:
                    "1 or 2"
                
                case 5:
                    "5"
            end
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let value = 5
            switch (value) {
                case 1: case 2:
                    \`1 or 2\`
                break
                
                case 5:
                    \`5\`
                break
            }
        `);
    });

    it("should work with a switch (with default)", () => {
        const versa = `
            var value = 5
            switch value:
                case 1, 2:
                    "1 or 2"
                
                case 5:
                    "5"
                
                default: 
                    "weird"
            end
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let value = 5
            switch (value) {
                case 1: case 2:
                    \`1 or 2\`
                break
                
                case 5:
                    \`5\`
                break
                
                default:
                    \`weird\`
            }
        `);
    });

    it("should work with 'typeof'", () => {
        const versa = `typeof 5`;
        const javascript = compile(versa);
        compare(javascript, `$.gettype(5)`);
    });

    it("should work with 'instanceof'", () => {
        const versa = `
            var c = console
            c instanceof console # very basic test
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            let c = console
            c instanceof console
        `);
    });

    it("should work with a class", () => {
        const versa = `
            class LivingThing:
                property isalive = 1
            
                method __init(isalive):
                    # the algorithm has to be smart
                    # in order to avoid repetition and conflict
                    # with the declared properties above
                    self.isalive = isalive
                end
            
                set die() -> self.isalive = 0
                set resuscitate() -> self.isalive = 1
            end
            
            class Animal extends LivingThing:
                property name = "name"
                property type
            
                method __init(name, type):
                    super(1)
                    self.name = name
                    self.type = type
                end
            
                method walk() -> if self.isalive: (self.name + " walks") else: (self.name + " is dead")
            end
            
            class Wolf extends Animal:
                method __init(name):
                    super(name, "Wolf")
                end
            
                override method walk() -> if self.isalive: (self.name + " runs") else: (self.name + " is dead")
            end
            
            var wolf = new Wolf("Wolfy")
            var animal = new Animal("Animal", "Dog")
            var wolf2 = new Wolf("Wolf2");
            
            wolf.walk() # Wolfy runs
            wolf2.die()
            wolf2.walk() # Wolf2 is dead
            
            animal.walk() # Animal walks
            animal.isalive = 0
            animal.walk() # Animal is dead
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            class LivingThing {
                static __name = "LivingThing"
            
                constructor(isalive) {
                    this.isalive = isalive
                }
                
                die() {
                    return this.isalive = 0
                }
                
                resuscitate() {
                    return this.isalive = 1
                }
            }
            
            class Animal extends LivingThing {
                static __name = "Animal"
                static __parent_name = "LivingThing"
            
                constructor(name, type) {
                    super(1)
                    this.name = name
                    this.type = type
                }
                
                walk() {
                    return ($.is_true(this.isalive) ? $.add(this.name, \` walks\`) : $.add(this.name, \` is dead\`))
                }
            }
            
            class Wolf extends Animal {
                static __name = "Wolf"
                static __parent_name = "Animal"
            
                constructor(name) {
                    super(name, \`Wolf\`)
                }
                
                /** @override */
                walk() {
                    return ($.is_true(this.isalive) ? $.add(this.name, \` runs\`) : $.add(this.name, \` is dead\`))
                }
            }
            
            let wolf = new Wolf(\`Wolfy\`)
            let animal = new Animal(\`Animal\`, \`Dog\`)
            let wolf2 = new Wolf(\`Wolf2\`)
            wolf.walk()
            wolf2.die()
            wolf2.walk()
            animal.walk()
            animal.isalive = 0
            animal.walk()
            
        `);
    });

    it("should work with static properties in a class", () => {
        const versa = `
            class Test:
                static property static_property = "static property"
                property test
            
                static method get_name() -> Test::static_property
            
                method __init():
                    self.test = Test::get_name()
                end
            
                static method static_method() -> "static method"
            
                method __repr():
                    return "self.test = " + self.test
                end
            end
            
            var t = new Test()
            Test::static_property
            Test::static_method()
            Test::__name # default static property, returns "Test"
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            class Test {
                static __name = "Test"
                static static_property = \`static property\`
                
                constructor() {
                    this.test = Test.get_name()
                }
                
                static get_name() {
                    return Test.static_property
                }
                
                static static_method() {
                    return \`static method\`
                }
            
                toString() {
                    return $.add(\`self.test = \`, this.test)
                }
            }
            
            let t = new Test()
            Test.static_property
            Test.static_method()
            Test.__name
        `);
    });

    it("should work with a complex class", () => {
        const versa = `
            class Adventurer:
                property test = 5
            
                method imaginaryMethod():
                    return func (a, b) -> if a == 0: none else: [a + b + self.test]
                end
            end
            
            var adv = new Adventurer()
            var first = adv.imaginaryMethod?.()?.(1, 2)?.[0]
            var second = adv.imaginaryMethod?.()?.(0, 2)?.[0] # we can use [0] even though we know it's null (none), thanks to '?.'
        `;
        const javascript = compile(versa);
        multiline(javascript, `
            class Adventurer {
                static __name = "Adventurer"
            
                constructor() {
                    this.test = 5
                }
                
                imaginaryMethod() {
                    return ((a, b) => {
                        return ($.is_true($.equality(a, 0)) ? null : [$.add($.add(a, b), this.test)])
                    })
                }
            }
            
            let adv = new Adventurer()
            let first = adv.imaginaryMethod?.()?.(1, 2)?.[0]
            let second = adv.imaginaryMethod?.()?.(0, 2)?.[0]
        `);
    });

    describe("Permutations of conditions", function() {
       it("should work with a basic redirected condition", () => {
           const versa = `
               func test(a):
                   if a == 1: return 0
               end
           `;
           const javascript = compile(versa);
           multiline(javascript, `
               function test(a) {
                   if ($.is_true($.equality(a, 1))) {
                       return 0
                   }
                   
               }
           `);
       });

        it("should work with a basic redirected condition on an assignment", () => {
            const versa = `
               func test(a):
                   var b = if a == 2: return 2 else: -1
               end
           `;
            const javascript = compile(versa);
            multiline(javascript, `
               function test(a) {
                   if ($.is_true($.equality(a, 2))) {
                       return 2
                   }
                   let b = -1
               }
           `);
        });

        it("should work with a basic redirected condition in a call", () => {
            const versa = `
                func another(c):
                    return c
                end
                func test(a):
                    another(if a == 5: return 5)
                end
           `;
            const javascript = compile(versa);
            multiline(javascript, `
                function another(c) {
                    return c
                }
                function test(a) {
                    if ($.is_true($.equality(a, 5))) {
                        return 5
                    }
                    another()
                }
           `);
        });

        it("should work with a basic redirected condition in a call (with else)", () => {
            const versa = `
                func another(c):
                    return c
                end
                func test(a):
                    another(if a == 3: return 3 else: 4)
                end
           `;
            const javascript = compile(versa);
            multiline(javascript, `
                function another(c) {
                    return c
                }
                function test(a) {
                    if ($.is_true($.equality(a, 3))) {
                        return 3
                    }
                    another(4)
                }
           `);
        });

        it("should work with a complex redirected condition in a call", () => {
            const versa = `
                func another(c):
                    return c
                end
                func test(a):
                    another(if a == 10: return 10 elif a == 11: return 11 elif a == 12: 12 else: 13)
                end
           `;
            const javascript = compile(versa);
            multiline(javascript, `
                function another(c) {
                    return c
                }
                function test(a) {
                    if ($.is_true($.equality(a, 10))) {
                        return 10
                    } else if ($.is_true($.equality(a, 11))) {
                        return 11
                    }
                    another(($.is_true($.equality(a, 12)) ? 12 : 13))
                }
           `);
        });

        it("should work with a one nested condition in a redirected condition", () => {
            const versa = `
                func another(c):
                    return c
                end
                func test(a):
                    return another(if a == 20: (if a + 1 == 21: 5 else: return -1))
                end
           `;
            const javascript = compile(versa);
            multiline(javascript, `
                function another(c) {
                    return c
                }
                function test(a) {
                    if ($.is_true($.equality(a, 20))) {
                        if ($.is_true($.equality($.add(a, 1), 21))) {
                            5
                        } else {
                            return -1
                        }
                    }
                    return another(($.is_true($.equality(a, 20)) ? ($.is_true($.equality($.add(a, 1), 21)) ? 5 : null) : null))
                }
           `);
        });
    });
});

/* IMPORTANT:

The transcription algorithm supports indentation to make the produced JavaScript code readable,
in order to help the user understand how his VersaJS code will react with the web.
To test if this works, copy this code into a sample file and observe the resulting JavaScript code.

class TabulationTest:
    property test = 5

    method imaginaryMethod():
        return func (a, b) -> if a == 0: none else: [a + b + self.test]
    end

    method oneline_method() -> 5

    method _enum():
        enum Status:
            running,
            paused,
        end
    end

    method _func():
        func add(a, b?, c?=5) -> a + b + c
        var sub = func (a, b?, c?=5) -> a - b - c
    end

    method _foreach():
        var dict = {"age": 17, "name": "thomas"}
        var values = []
        foreach dict as value:
            values[] = value
        end
        var list = [1, 2]
        var loop = foreach list as key => value: [key, value]
    end

    method _for():
        var list = for i to 10: i
        var list2 = []
        for i to 10 step 1:
            list2[] = i
        end
    end

    method cond():
        if 1 == 1:
            "good"
        elif 1 == 2:
            "not good"
        elif 1 == 3:
            "strange"
        else:
            "weird"
        end
        if 1 == 1: "good" elif 1 == 2: "not good" elif 1 == 3: "strange" else: "weird"
    end

    method _while():
        var i = 0
        while i < 10:
            i++
        end
        i = 0
        var list = while i < 10: i++
    end

    method _delete():
        var list = [0, [0, 1], 2]
        delete list[1:]
        var list2 = [0, [0, 1], 2]
        delete list2[1][0]
    end

    method _switch():
        var value = 5
        switch value:
            case 1, 2:
                "1 or 2"

            case 5:
                "5"

            default:
                "weird"
        end
    end
end

var adv = new TabulationTest()
var first = adv.imaginaryMethod?.()?.(1, 2)?.[0]
var second = adv.imaginaryMethod?.()?.(0, 2)?.[0]

 */