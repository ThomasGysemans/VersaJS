import { init_global_context } from '../context.js';
import { BooleanValue, ClassValue, DictionaryValue, FunctionValue, HtmlValue, ListValue, NoneValue, NumberValue, TagValue } from '../values.js';
import { RuntimeError } from '../Exceptions.js';
import { Types } from '../tokens.js';
import { assert } from 'chai';
import { run } from '../run.js';
import global_symbol_table, { SymbolTable } from '../symbol_table.js';

const fn = "<stdin>";
const context = init_global_context("tests");

beforeEach(() => {
    // delete the variables from the previous tests and keep the constants
    context.symbol_table = new SymbolTable(global_symbol_table);
});

const exec = (code: string): ListValue => run(code, fn, context)!.value as ListValue;

describe("Interpreter", function() {
    it("should work with numbers", () => {
        const result = exec("51.2");
        if (result) assert.deepStrictEqual(result.elements[0].value, 51.2);
    });

    it("should work with an addition", () => {
        const result = exec("27 + 14");
        if (result) assert.deepStrictEqual(result.elements[0].value, 41);
    });

    it("should work with a subtraction", () => {
        const result = exec("27 - 14");
        if (result) assert.deepStrictEqual(result.elements[0].value, 13);
    });

    it("should work with a multiplication", () => {
        const result = exec("27 * 14");
        if (result) assert.deepStrictEqual(result.elements[0].value, 378);
    });

    it("should work with a power", () => {
        const result = exec("10 ** 0");
        if (result) assert.deepStrictEqual(result.elements[0].value, 1);
    });

    it("should work with a division", () => {
        const result = exec("10 / 5");
        if (result) assert.deepStrictEqual(result.elements[0].value, 2);
    });

    it("should work with a modulo", () => {
        const result = exec("9 % 2");
        if (result) assert.deepStrictEqual(result.elements[0].value, 1);
    });

    it("should work with a negative number", () => {
        const result = exec("-5");
        if (result) assert.deepStrictEqual(result.elements[0].value, -5);
    });

    it("should work with a less than (<)", () => {
        const result = exec(`
            20 < 30;
            30 < 20
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as BooleanValue).state, 1);
        if (result) assert.deepStrictEqual((result.elements[1] as BooleanValue).state, 0);
    });

    it("should work with a less than or equal (<=)", () => {
        const result = exec(`
            20 <= 20;
            21 <= 20
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as BooleanValue).state, 1);
        if (result) assert.deepStrictEqual((result.elements[1] as BooleanValue).state, 0);
    });

    it("should work with a greater than (>)", () => {
        const result = exec(`
            30 > 20;
            20 > 30
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as BooleanValue).state, 1);
        if (result) assert.deepStrictEqual((result.elements[1] as BooleanValue).state, 0);
    });

    it("should work with a greater than or equal (>=)", () => {
        const result = exec(`
            20 >= 20;
            19 >= 20
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as BooleanValue).state, 1);
        if (result) assert.deepStrictEqual((result.elements[1] as BooleanValue).state, 0);
    });

    it("should work with an equality (==)", () => {
        const result = exec(`
            20 == 20;
            19 == 20
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as BooleanValue).state, 1);
        if (result) assert.deepStrictEqual((result.elements[1] as BooleanValue).state, 0);
    });

    it("should work with an inequality (!=)", () => {
        const result = exec(`
            19 != 20;
            20 != 20
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as BooleanValue).state, 1);
        if (result) assert.deepStrictEqual((result.elements[1] as BooleanValue).state, 0);
    });

    it("should work with a complex operation", () => {
        const result = exec(`
            5 ** (1 + 2 * 10 / 10)
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as NumberValue).value, 125);
    });

    it("should work with a complex operation including a binary shift to the right", () => {
        const result = exec(`
            256 >> 1 + 2 * 10 / 10
        `);
        if (result) assert.deepStrictEqual(result.elements[0].value, 32);
    });

    it("should work with a complex operation including a logical operation (^)", () => {
        const result = exec(`
            14 ^ 1 + 4 * 2
        `);
        if (result) assert.deepStrictEqual(result.elements[0].value, 7);
    });

    it("should work with a complex operation including a binary NOT (~)", () => {
        const result = exec(`
            6 + ~5
        `);
        if (result) assert.deepStrictEqual(result.elements[0].value, 0);
    });

    it("should work with a prefix operation", () => {
        const result = exec(`
            ++9;
            --9;
        `);
        if (result) assert.deepStrictEqual(result.elements[0].value, 10);
        if (result) assert.deepStrictEqual(result.elements[1].value, 8);
    });

    it("should work with a complex operation including prefix operation", () => {
        const result = exec(`
            5 - --2 - 5;
            5 + ++2 + 5
        `);
        if (result) assert.deepStrictEqual(result.elements[0].value, -1);
        if (result) assert.deepStrictEqual(result.elements[1].value, 13);
    });

    it("should work with none", () => {
        const result = exec(`
            none
        `);
        if (result) assert.deepStrictEqual(result.elements[0] instanceof NoneValue, true);
    });

    it("should work with an assignment to a variable", () => {
        const result = exec(`
            var variable = 1
        `);
        if (result) assert.deepStrictEqual(result.elements[0].value, 1);
    });

    it("should work with an access to a variable", () => {
        const result = exec(`
            var variable = 8;
            variable
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 8);
    });

    it("should work with a modification of a variable", () => {
        const result = exec(`
            var variable = 5;
            variable = 4;
            variable
        `);
        if (result) assert.deepStrictEqual(result.elements[2].value, 4);
    });

    it("should work with an assignment to a variable (with specified type)", () => {
        const result = exec(`
            var number: number = 5;
            var string: string = "hello";
            var list: list = ["list"];
            var dict: dict = {"type":"dict"}
            var anything: any = none
            var dynamic: dynamic = "anything but none"
            var bool: boolean = true
            var function: function = func (a, b) -> a + b;

            class Test: pass;

            var object: object = new Test();
        `);
        if (result) assert.deepStrictEqual(result.elements[0].type, Types.NUMBER);
        if (result) assert.deepStrictEqual(result.elements[1].type, Types.STRING);
        if (result) assert.deepStrictEqual(result.elements[2].type, Types.LIST);
        if (result) assert.deepStrictEqual(result.elements[3].type, Types.DICT);
        if (result) assert.deepStrictEqual(result.elements[4].type, Types.ANY);
        if (result) assert.deepStrictEqual(result.elements[5].type, Types.DYNAMIC);
        if (result) assert.deepStrictEqual(result.elements[6].type, Types.BOOLEAN);
        if (result) assert.deepStrictEqual(result.elements[7].type, Types.FUNCTION);
    });

    it("should work with a list", () => {
        const result = exec(`
            [0, 1]
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as ListValue).elements.map((v) => v.value), [0, 1]);
    });

    it("should work with a list (access)", () => {
        const result = exec(`
            var list = [1, 2, 3];
            list
        `);
        if (result) assert.deepStrictEqual((result.elements[1] as ListValue).elements.map((v) => v.value), [1, 2, 3]);
    });

    it("should work with a list (assignment)", () => {
        const result = exec(`
            var list = [1, 2, 3];
            list[4] = 5;
            list
        `);
        if (result) assert.deepStrictEqual((result.elements[2] as ListValue).elements.map((v) => v instanceof NoneValue ? 0 : v.value), [1, 2, 3, 0, 5]);
    });

    it("should work with a list (binary selector)", () => {
        const result = exec(`
            var list = [1, 2, 3, 0, 5];
            list[1:-1]
        `);
        if (result) assert.deepStrictEqual((result.elements[1] as ListValue).elements.map((v) => v.value), [2, 3, 0]);
    });

    it("should work with a delete keyword", () => {
        const result = exec(`
            var list = [1, 2]
            delete list[0]
            list
        `);
        if (result) assert.deepStrictEqual((result.elements[2] as ListValue).elements[0].value, 2);
    });

    it("should work with a nullish coalescing operator (??)", () => {
        const result = exec(`
            none ?? 1
        `);
        if (result) assert.deepStrictEqual(result.elements[0].value, 1);
    });

    it("should work with a function declaration", () => {
        const result = exec(`
            func add(a, b?, c?=1) -> if b != 0: a + b + c else: a + c;
            add(5)

            # tests for 'pass' keyword
            func singleline() -> pass
            func test():
                pass
            end
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 6);
    });

    it("should work with a function declaration (with types)", () => {
        const result = exec(`
            func add(a: number, b?: number, c?: number = 1) -> if b != 0: a + b + c else: a + c;
            add(5)
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 6);
    });

    it("should work with a double call to a function (function that returns a function, which we want to call)", () => {
        const result = exec(`
            func test() -> func(a, b) -> a + b;
            test()(5 + 5, 5)
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 15);
    });

    it("should work with a list that contains a function, which we want to call", () => {
        const result = exec(`
            var list = [func (a, b) -> a + b];
            list[0](1, 2)
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 3);
    });

    it("should work with a list that contains a function, which we want to call (ultimate test)", () => {
        const result = exec(`
            var list = [func () -> [1, func (a, b) -> a + b]];
            list[0]()[1](5, 1)
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 6);
    });

    it("should work with a for-loop", () => {
        const result = exec(`
            for i to 10: i;
            for i = 1 to 10: i;
            for i = 1 to 10 step 2: i;
        `);
        if (result) assert.deepStrictEqual((result.elements[0] as ListValue).elements.map((v) => v.value), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        if (result) assert.deepStrictEqual((result.elements[1] as ListValue).elements.map((v) => v.value), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        if (result) assert.deepStrictEqual((result.elements[2] as ListValue).elements.map((v) => v.value), [1, 3, 5, 7, 9]);
    });

    it("should work with a while-loop", () => {
        const result = exec(`
            var e = 0;
            while e < 10: e++;
        `);
        if (result) assert.deepStrictEqual((result.elements[1] as ListValue).elements.map((v) => v.value), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("should work with an if statement", () => {
        const result = exec(`
            var age = 19;
            if age > 18: "majeur" elif age == 18: "pile 18" else: "mineur";
            age = 18;
            if age > 18: "majeur" elif age == 18: "pile 18" else: "mineur";
            age = 5;
            if age > 18: "majeur" elif age == 18: "pile 18" else: "mineur";
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, "majeur");
        if (result) assert.deepStrictEqual(result.elements[3].value, "pile 18");
        if (result) assert.deepStrictEqual(result.elements[5].value, "mineur");
    });

    it("should work with postfix operation", () => {
        const result = exec(`
            var a = 5;
            a++++;
            a; # 7
            var b = 5;
            b----;
            b; # 3
        `);
        if (result) assert.deepStrictEqual(result.elements[2].value, 7);
        if (result) assert.deepStrictEqual(result.elements[4].value, 3);
    });

    it("should work with concatenation", () => {
        const result = exec(`
            var age = 17;
            var str = "I am {age}.";
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, "I am 17.");
    });

    it("should work with concatenation (with if statement)", () => {
        const result = exec(`
            var age = 18;
            "I am " + (if age > 18: "major" elif age == 18: "18" else: "minor") + "."
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, "I am 18.");
    });

    it("should work with a dictionary", () => {
        const result = exec(`
            { "yo": 5, 'test': 'coucou', 'list': [1, 2] }
        `);
        if (result) {
            assert.deepStrictEqual((result.elements[0] as DictionaryValue).elements.get('yo')?.value, 5);
            assert.deepStrictEqual((result.elements[0] as DictionaryValue).elements.get('test')?.value, "coucou");
            assert.deepStrictEqual(((result.elements[0] as DictionaryValue).elements.get('list') as ListValue)?.elements.map(v => v.value), [1, 2]);
        }
    });

    it("should work with a class", () => {
        const result = exec(`
            class Person:
                public property firstname
                private property lastname
                protected property fullname
                protected property age
                
                method __init(firstname, lastname, age):
                    self.firstname = firstname
                    self.lastname = lastname
                    self.age = age
                    self.fullname = self.assemble()
                end

                protected method assemble() -> self.firstname + " " + self.lastname

                get getFullname() -> self.fullname

                set setFirstname(new_name):
                    self.firstname = new_name
                    self.fullname = self.assemble()
                end

                set setAge(new_age?=self.age+1) -> self.age = new_age
            end

            var person = new Person("Thomas", "CodoPixel", 17)
            person.getFullname()

            # tests for 'pass' keyword
            class Test: pass
            class AnotherTest:
                pass
            end
        `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof ClassValue, true);
        if (result) assert.deepStrictEqual(result.elements[2].value, "Thomas CodoPixel");
    });

    it("should work with a class (with types)", () => {
        const result = exec(`
            class Test:
                property number: any = 5
                property thing: any
                property anotherthing: string = ""
                property withouttype

                method __init():
                    self.number = "yo"
                end

                method add(a: number, b?: number = 0) -> a + b
            end

            var t: Test = new Test();
            var t2: object = new Test();
            t.add(5)
        `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof ClassValue, true);
        if (result) assert.deepStrictEqual(result.elements[3].value, 5);
    });

    it("should work with several instances of the same class", () => {
        const result = exec(`
            class Cat:
                property name

                method __init(name):
                    self.name = name
                end

                method walk() -> self.name + " walks"
            end

            var cat = new Cat("A cat")
            var cat2 = new Cat("catty")
            cat.walk()
            cat2.walk()
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, "A cat walks");
        if (result) assert.deepStrictEqual(result.elements[4].value, "catty walks");
    });

    it("should work with several instances and default values in the __init method", () => {
        const result = exec(`
            class Dog:
                property name
                private property default_name = "default"

                method __init(name?=self.default_name):
                    self.name = name
                end

                method walk() -> self.name + " walks"
            end

            var dog = new Dog("A dog")
            var dog2 = new Dog()
            dog.walk()
            dog2.walk()
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, "A dog walks");
        if (result) assert.deepStrictEqual(result.elements[4].value, "default walks");
    });

    it("should work with a method call in the properties of a class", () => {
        const result = exec(`
            class Snake:
                property name
                private property default_name = self.get_default_name()

                private method get_default_name() -> "default"

                method __init(name?=self.default_name):
                    self.name = name
                end

                method walk() -> self.name + " walks"
            end

            var snake = new Snake("A snake")
            var snake2 = new Snake()
            snake.walk()
            snake2.walk()
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, "A snake walks");
        if (result) assert.deepStrictEqual(result.elements[4].value, "default walks");
    });

    it("should work with inheritance", () => {
        const result = exec(`
            class Animal:
                property name = "name"
                property type

                method __init(name, type):
                    self.name = name
                    self.type = type
                end

                method walk() -> self.name + " walks"
            end

            class Wolf extends Animal:
                method __init(name):
                    super(name, "Wolf")
                end

                override method walk() -> self.name + " runs"
            end

            var animal = new Animal("An animal", "cat")
            var wolf = new Wolf("Wolfy")
            animal.walk()
            wolf.walk()
        `);
        if (result) assert.deepStrictEqual(result.elements[4].value, "An animal walks");
        if (result) assert.deepStrictEqual(result.elements[5].value, "Wolfy runs");
    });

    it("should work with a complex inheritance", () => {
        const result = exec(`
            class LivingThing:
                property isalive = 1

                method __init(isalive):
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

                method walk() -> if self.isalive: self.name + " walks" else: self.name + " is dead"
            end

            class Wolf extends Animal:
                method __init(name):
                    super(name, "Wolf")
                end

                override method walk() -> if self.isalive: self.name + " runs" else: self.name + " is dead"
            end

            var wolf = new Wolf("Wolfy")
            var animal = new Animal("Animal", "Dog")
            var wolf2 = new Wolf("Wolf2");
            wolf.walk()
            wolf2.die()
            wolf2.walk()
            animal.walk()
            animal.isalive = 0
            animal.walk()
        `);
        if (result) assert.deepStrictEqual(result.elements[6].value, "Wolfy runs");
        if (result) assert.deepStrictEqual(result.elements[8].value, "Wolf2 is dead");
        if (result) assert.deepStrictEqual(result.elements[9].value, "Animal walks");
        if (result) assert.deepStrictEqual(result.elements[11].value, "Animal is dead");
    });

    it("should work with a complex inheritance (with super in another method than __init)", () => {
        const result = exec(`
            class LivingThing:
                property isalive = yes
                property walk_counter = 0

                method __init(isalive):
                    self.isalive = isalive
                end

                set die() -> self.isalive = no
                set resuscitate() -> self.isalive = yes

                method walk():
                    self.walk_counter = self.walk_counter + 1
                end
            end

            class Animal extends LivingThing:
                property name = "name"
                property type

                method __init(name, type):
                    super(yes)
                    self.name = name
                    self.type = type
                end

                override method walk():
                    super()
                    self.walk_counter = self.walk_counter * 10
                end
            end

            class Wolf extends Animal:
                method __init(name):
                    super(name, "Wolf")
                end

                override method walk():
                    if self.isalive:
                        super()
                        return self.name + " runs"
                    else:
                        return self.name + " is dead, but walked " + self.walk_counter + " times"
                    end
                end
            end

            var wolf = new Wolf("Wolfy")
            wolf.walk() # Wolfy runs
            wolf.die()
            wolf.walk() # Wolfy is dead, but walked 10 times
        `);
        if (result) assert.deepStrictEqual(result.elements[4].value, "Wolfy runs");
        if (result) assert.deepStrictEqual(result.elements[6].value, "Wolfy is dead, but walked 10 times");
    });

    it("should work with a method call as default value in __init", () => {
        const result = exec(`
            class Rat:
                property name

                private method get_default_name() -> "default"

                method __init(name?=self.get_default_name()):
                    self.name = name
                end

                method walk() -> self.name + " walks"
            end

            var rat = new Rat("A rat")
            var rat2 = new Rat()
            rat.walk()
            rat2.walk()
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, "A rat walks");
        if (result) assert.deepStrictEqual(result.elements[4].value, "default walks");
    });

    it("should not create any conflicts between different instances of the same class", () => {
        const result = exec(`
            class Test:
                property value = none
            end

            var t = new Test()
            t.value = 5
            var t2 = new Test()

            t.value # 5
            t2.value # none
        `);
        if (result) assert.deepStrictEqual(result.elements[4].value, 5);
        if (result) assert.deepStrictEqual(result.elements[5] instanceof NoneValue, true);
    });

    it("should work with static properties", () => {
        const result = exec(`
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
            t.__repr() # doesn't work properly in tests so we use __repr() directly
            Test::static_property
            Test::static_method()
            Test::__name
        `);
        if (result) assert.deepStrictEqual(result.elements[2].value, "self.test = static property");
        if (result) assert.deepStrictEqual(result.elements[3].value, "static property");
        if (result) assert.deepStrictEqual(result.elements[4].value, "static method");
        if (result) assert.deepStrictEqual(result.elements[5].value, "Test");
    });

    it("should work with the 'arguments' variable inside a function", () => {
        const result = exec(`
            func test_arguments(arg1):
                return arguments
            end

            test_arguments("yo")
        `);
        if (result) assert.deepStrictEqual((result.elements[1] as ListValue).elements.map((v) => v.value), ["yo"]);
    });

    it("should work with the rest parameter", () => {
        const result = exec(`
            func average_grade(number_of_marks, ...marks):
                var s = 0
                for i to number_of_marks:
                    s += marks[i]
                end
                return s / number_of_marks
            end
            average_grade(3, 10, 11, 12)
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 11);
    });

    it("should work with the rest parameter (set as optional)", () => {
        const result = exec(`
            func average_grade(number_of_marks, ...marks?):
                if not marks: return 0

                var s = 0
                for i to number_of_marks:
                    s += marks[i]
                end
                return s / number_of_marks
            end
            average_grade(3)
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 0);
    });

    it("should work with an enum", () => {
        const result = exec(`
            enum Status:
                running,
                paused,
            end

            var st = Status.running
            st = Status.paused

            # tests for 'pass' keyword
            # and single line declaration of an enum
            enum Thing: pass
            enum Count: one, two, three
            enum Other:
                pass
            end
        `);
        if (result) assert.deepStrictEqual(result.elements[1].value, 0);
        if (result) assert.deepStrictEqual(result.elements[2].value, 1);
    });

    it("should work with switch statement", () => {
        const result = exec(`
            var value = 5
            var response: dynamic = -1

            switch value:
                case 4:
                    response = "4"
                
                case 5:
                    response = "5"
            end

            response
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, "5");
    });

    it("should work with switch statement (with default)", () => {
        const result = exec(`
            var value = 0
            var response: dynamic = -1

            switch value:
                case 4:
                    response = "4"
                
                case 5:
                    response = "5"
                
                default:
                    response = "default"
            end

            response
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, "default");
    });

    it("should work with complex cases on switch statement", () => {
        const result = exec(`
            var value = 3
            var response: dynamic = -1

            switch value:
                case 4,3:
                    response = "4 or 3"
                
                default:
                    response = "default"
            end

            response
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, "4 or 3");
    });

    it("should work with a switch statement and an enum", () => {
        const result = exec(`
            enum State:
                stopped,
                paused,
                running
            end

            var stat = State.paused
            var response = none

            switch stat:
                case State.stopped: response = "stopped"
                case State.paused: response = "paused"
                case State.running: response = "running"
                default: response = no
            end

            response
        `);
        if (result) assert.deepStrictEqual(result.elements[4].value, "paused");
    });

    it("should work with a nullish assignment operator applied to a dictionary", () => {
        const result = exec(`
            var dict = { "duration": 50 }
            dict["duration"] ??= 10
            dict["duration"] # 50

            dict["speed"] ??= 25
            dict["speed"] # 25
        `);
        if (result) assert.deepStrictEqual(result.elements[2].value, 50);
        if (result) assert.deepStrictEqual(result.elements[4].value, 25);
    });

    it("should work with a nullish assignment operator applied to a list", () => {
        const result = exec(`
            var list = [1, 2]
            list[1] ??= 50
            list[1] # 2

            list[3] ??= 25
            list[3] # 25
        `);
        if (result) assert.deepStrictEqual(result.elements[2].value, 2);
        if (result) assert.deepStrictEqual(result.elements[4].value, 25);
    });

    it("should work with a nullish assignment operator applied to a variable", () => {
        const result = exec(`
            var nullish = none
            nullish ??= 5
            nullish

            var falsy = false
            falsy ??= true
            falsy
        `);
        if (result) assert.deepStrictEqual(result.elements[2].value, 5);
        if (result) assert.deepStrictEqual(result.elements[4] instanceof BooleanValue && result.elements[4].state  === 0, true);
    });

    it("should work with an and assignment", () => {
        const result = exec(`
            var a = 1
            var b = 0
            
            a &&= 2
            a # 2

            b &&= 2
            b # 0
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, 2);
        if (result) assert.deepStrictEqual(result.elements[5].value, 0);
    });

    it("should work with an or assignment", () => {
        const result = exec(`
            var a = {"duration": 50, "title": ""}

            a["duration"] ||= 10
            a["duration"] # expected: 50

            a["title"] ||= "title is empty"
            a["title"] # expected: "title is empty"
        `);
        if (result) assert.deepStrictEqual(result.elements[2].value, 50);
        if (result) assert.deepStrictEqual(result.elements[4].value, "title is empty");
    });

    it("should work with an optional chaining operator on properties", () => {
        const result = exec(`
            class Cat:
                property name = 'Dinah'
            end

            class Adventurer:
                property name = 'Alice'
                property cat
                
                method __init():
                    self.cat = new Cat()
                end
            end

            var adv = new Adventurer()
            var dogName = adv.dog?.name?.yo
            dogName # expected: none
        `);
        if (result) assert.deepStrictEqual(result.elements[4] instanceof NoneValue, true);
    });

    it("should work with an optional chaining operator on static properties", () => {
        const result = exec(`
            class Example:
                static property yo = 5
            end

            Example?::yoyo # expected: none
        `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with an optional chaining operator on method", () => {
        const result = exec(`
            class Cat:
                property name = 'Dinah'
            end

            class Adventurer:
                property name = 'Alice'
                property cat
                
                method __init():
                    self.cat = new Cat()
                end
            end

            var adv = new Adventurer()
            var ret_value = adv.imaginaryMethod?.()
            ret_value # expected: none
        `);
        if (result) assert.deepStrictEqual(result.elements[4] instanceof NoneValue, true);
    });

    it("should work with an optional chaining operator on method (complex situation)", () => {
        const result = exec(`
            class Cat:
                property name = 'Dinah'
            end

            class Adventurer:
                property name = 'Alice'
                property cat
                
                method __init():
                    self.cat = new Cat()
                end

                method imaginaryMethod():
                    return new Cat()
                end
            end

            var adv = new Adventurer()
            var ret_value = adv.imaginaryMethod?.().name
            ret_value
        `);
        if (result) assert.deepStrictEqual(result.elements[4].value, "Dinah");
    });

    it("should work with an optional chaining operator on list", () => {
        const result = exec(`
            var list = [1, 2]

            # should raise an error without "?.", none otherwise
            list[42]?.[42]
        `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with an optional chaining operator on dictionary", () => {
        const result = exec(`
            var dico = { "person": { "name": "thomas" } }
            dico["thing"]?.["name"]
        `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with a complex sequence of operations on properties (?.()?.()?.[])", () => {
        const result = exec(`
            class Adventurer:
                property test = 5

                method imaginaryMethod():
                    return func (a, b) -> if a == 0: none else: [a + b + self.test]
                end
            end

            var adv = new Adventurer()
            var first = adv.imaginaryMethod?.()?.(1, 2)?.[0] # expected: 8
            var second = adv.imaginaryMethod?.()?.(0, 2)?.[0] # we can use [0] even though we know it's null (none), thanks to '?.'
        `);
        if (result) assert.deepStrictEqual(result.elements[2].value, 8);
        if (result) assert.deepStrictEqual(result.elements[3] instanceof NoneValue, true);
    });

    it("should work with an optional call to a function", () => {
        const result = exec(`
            var variable = func () -> none
            variable()?.()
        `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with a variable and and optional chaining operator, called as a function", () => {
        const result = exec(`
            var variable = none
            variable?.()?.()
        `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with a variable and and optional chaining operator, called as a list", () => {
        const result = exec(`
            var variable = none
            variable?.[0]?.[0]
        `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with a short-circuit thanks to an optional chaining operator", () => {
        const result = exec(`
            var object = none
            var x = 0
            var variable = object?.[x++]

            x # should be 0
        `);
        if (result) assert.deepStrictEqual(result.elements[3].value, 0);
    });

    it("should work with 'typeof'", () => {
        const result = exec(`
            typeof 37 == "number"
            typeof 3.14 == "number"
            typeof (42) == "number"
            typeof 99 + 'Yo' == "numberYo"
            typeof (99 + "Yo") == "string"

            typeof "" == "string"
            typeof typeof 1 == "string"

            typeof true == "boolean"
            typeof false == "boolean"
            typeof (not not 1) == "boolean"
            typeof none == "any"

            class Test: pass
            typeof Test == "Test"
            `);
        if (result) {
            for (let i = 0; i < result.elements.length; ++i) {
                if (i === 11) continue; // class Test: pass
                const line = result.elements[i] as BooleanValue;
                if (typeof line.state === "undefined") {
                    console.error("line.state is undefined because it's:", line, "at line", i);
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
        }
    });

    it("should work with 'instanceof'", () => {
        const result = exec(`
            class Test: pass

            var t = new Test()
            t instanceof Test
            t instanceof console
            1 + 1 instanceof Test
            `);
        if (result) assert.deepStrictEqual((result.elements[2] as BooleanValue).state, 1);
        if (result) assert.deepStrictEqual((result.elements[3] as BooleanValue).state, 0);
        if (result) assert.deepStrictEqual((result.elements[4] as BooleanValue).state, 0);
    });

    it("should work with a custom tag", () => {
        const result = exec(`
            tag CustomTag:
                prop? items: list = []
                state count: number = self.init_counter()

                method __init():
                    self.count++
                end

                method init_counter() -> 0

                method render():
                    return;
                end
            end

            CustomTag
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof TagValue, true);
    });

    it("should work with a basic html structure", () => {
        const result = exec(`
            var url = "https://sciencesky.fr/";
            var div = <div#id.class1> "Content";
            var a = <a href={url}> "Go to my website";
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual((result.elements[1] as HtmlValue).tagname, "div");
        if (result) assert.deepStrictEqual((result.elements[1] as HtmlValue).id, "id");
        if (result) assert.deepStrictEqual((result.elements[1] as HtmlValue).classes, ["class1"]);
        if (result) assert.deepStrictEqual(result.elements[2] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual((result.elements[2] as HtmlValue).attributes[0][0], "href");
        if (result) assert.deepStrictEqual((result.elements[2] as HtmlValue).attributes[0][1].value, "https://sciencesky.fr/");
    });

    it("should work with a complex html structure", () => {
        const result = exec(`
            var url = "https://sciencesky.fr/";
            var element = <a href={url}> "Go to my website";
            var structure = <>
                <div> "Content"
                {element}
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(result.elements[2] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual((result.elements[2] as HtmlValue).children.length, 2); // the div & "{element}"
        if (result) assert.deepStrictEqual(((result.elements[2] as HtmlValue).children[0] as HtmlValue).tagname, "div");
        if (result) assert.deepStrictEqual(((result.elements[2] as HtmlValue).children[0] as HtmlValue).children[0].value, "Content");
        if (result) assert.deepStrictEqual((result.elements[2] as HtmlValue).children[1] instanceof HtmlValue, true); // {element} == <a>
    });

    it("should work with an even more complex html structure", () => {
        const result = exec(`
            var url = "https://sciencesky.fr/";
            var link = <>
                <a href={url}>
                    <span> "Go to my website"
            </>

            var structure = <>
                <div> "Content"
                {link}
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual((result.elements[1] as HtmlValue).children.length, 1); // just <a>
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).children.length, 1); // <span> from <a>
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0].value, "Go to my website");
        if (result) assert.deepStrictEqual(result.elements[2] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual((result.elements[2] as HtmlValue).children.length, 2);
        if (result) assert.deepStrictEqual(((result.elements[2] as HtmlValue).children[1] as HtmlValue).tagname, null); // the fragment of {link}
        if (result) assert.deepStrictEqual((((result.elements[2] as HtmlValue).children[1] as HtmlValue).children[0] as HtmlValue).tagname, "a");
    });

    it("should work with a complex html structure including an if-statement", () => {
        const result = exec(`
            var status = false
            var structure = <>
                <div>
                    if status:
                        <p> "status is true"
                    else:
                        <p> "status is false"
                    end
                    <p> "Good"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).tagname, "div");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "p");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0].value, "status is false");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[1] as HtmlValue).children[0].value, "Good");
    });

    it("should work with a complex html structure including an if-statement (complex)", () => {
        const result = exec(`
            var status = false
            var structure = <>
                <div>
                    if status:
                        <p> "status is true"
                    else:
                        <>
                            <p>
                                <span> "status is false"
                        </>
                    end
                    <p> "Good"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).tagname, "div");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, null);
        if (result) assert.deepStrictEqual(((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "p");
        if (result) assert.deepStrictEqual((((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "span");
        if (result) assert.deepStrictEqual((((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0].value, "status is false");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[1] as HtmlValue).children[0].value, "Good");
    });

    it("should work with a complex html structure including an if-statement (oneline)", () => {
        const result = exec(`
            var status = false
            var structure = <>
                <div>
                    if status: <p> "status is true" else: <p> "status is false"
                    <p> "Good"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).tagname, "div");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "p");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0].value, "status is false");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[1] as HtmlValue).children[0].value, "Good");
    });

    it("should work with a complex html structure including a for-loop", () => {
        const result = exec(`
            <>
                <ul>
                    for i to 10:
                        <li> "Item {i}"
                    end
                    <li> "Last item"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[0] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[0] as HtmlValue).children[0] as HtmlValue).children.length, 11);
        if (result) assert.deepStrictEqual((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "li");
        if (result) assert.deepStrictEqual((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[5] as HtmlValue).children[0].value, "Item 5");
        if (result) assert.deepStrictEqual((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[10] as HtmlValue).children[0].value, "Last item");
    });

    it("should work with a complex html structure including a for-loop (complex)", () => {
        const result = exec(`
            <>
                <ul>
                    for i to 10:
                        <>
                            <li>
                                <span> "Item {i}"
                        </>
                    end
                    <li> "Last item"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[0] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[0] as HtmlValue).children[0] as HtmlValue).children.length, 11);
        if (result) assert.deepStrictEqual((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, null);
        if (result) assert.deepStrictEqual(((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "li");
        if (result) assert.deepStrictEqual((((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "span");
        if (result) assert.deepStrictEqual((((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[5] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0].value, "Item 5");
        if (result) assert.deepStrictEqual((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[10] as HtmlValue).children[0].value, "Last item");
    });

    it("should work with a complex html structure including a for-loop (oneline)", () => {
        const result = exec(`
            <>
                <ul>
                    for i to 10: <li> "Item {i}"
                    <li> "Last item"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[0] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[0] as HtmlValue).children[0] as HtmlValue).children.length, 11);
        if (result) assert.deepStrictEqual((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "li");
        if (result) assert.deepStrictEqual((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[5] as HtmlValue).children[0].value, "Item 5");
        if (result) assert.deepStrictEqual((((result.elements[0] as HtmlValue).children[0] as HtmlValue).children[10] as HtmlValue).children[0].value, "Last item");
    });

    it("should work with a complex html structure including a foreach-loop", () => {
        const result = exec(`
            var list = [0, 1, 2]
            <>
                <ul>
                    foreach list as el:
                        <li> "Item {el}"
                    end
                    <li> "Last item"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).children.length, 4);
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "li");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[2] as HtmlValue).children[0].value, "Item 2");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[3] as HtmlValue).children[0].value, "Last item");
    });

    it("should work with a complex html structure including a foreach-loop (complex)", () => {
        const result = exec(`
            var list = [0, 1, 2]
            <>
                <ul>
                    foreach list as el:
                        <>
                            <li>
                                <span> "Item {el}"
                        </>
                    end
                    <li> "Last item"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).children.length, 4);
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, null);
        if (result) assert.deepStrictEqual(((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "li");
        if (result) assert.deepStrictEqual((((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "span");
        if (result) assert.deepStrictEqual((((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[2] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).children[0].value, "Item 2");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[3] as HtmlValue).children[0].value, "Last item");
    });

    it("should work with a complex html structure including a foreach-loop (oneline)", () => {
        const result = exec(`
            var list = [0, 1, 2]
            <>
                <ul>
                    foreach list as el: <li> "Item {el}"
                    <li> "Last item"
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).children.length, 4);
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[0] as HtmlValue).tagname, "li");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[2] as HtmlValue).children[0].value, "Item 2");
        if (result) assert.deepStrictEqual((((result.elements[1] as HtmlValue).children[0] as HtmlValue).children[3] as HtmlValue).children[0].value, "Last item");
    });

    it("should work with an event attached to a tag", () => {
        const result = exec(`
            var function = func() -> 5

            <>
                <div.class1#id @mousemove={function}>
            </>
            `);
        if (result) assert.deepStrictEqual(result.elements[1] instanceof HtmlValue, true);
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).tagname, "div");
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).events[0][0], "mousemove");
        if (result) assert.deepStrictEqual(((result.elements[1] as HtmlValue).children[0] as HtmlValue).events[0][1] instanceof FunctionValue, true);
    });
});
