import assert from 'assert';
import { Context } from '../context.js';
import { run } from '../run.js';
import global_symbol_table, { SymbolTable } from '../symbol_table.js';
import { BooleanValue, ClassValue, NoneValue } from '../values.js';

const fn = "<stdin>";
const context = new Context("<tests>");

beforeEach(() => {
    // delete the variables from the previous tests and keep the constants
    context.symbol_table = new SymbolTable(global_symbol_table);
});

describe("Interpreter", function() {
    it("should work with numbers", () => {
        const result = run("51.2", fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 51.2);
    });

    it("should work with an addition", () => {
        const result = run("27 + 14", fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 41);
    });

    it("should work with a subtraction", () => {
        const result = run("27 - 14", fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 13);
    });

    it("should work with a multiplication", () => {
        const result = run("27 * 14", fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 378);
    });

    it("should work with a power", () => {
        const result = run("10 ** 0", fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 1);
    });

    it("should work with a division", () => {
        const result = run("10 / 5", fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 2);
    });

    it("should work with a modulo", () => {
        const result = run("9 % 2", fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 1);
    });

    it("should work with a negative number", () => {
        const result = run("-5", fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, -5);
    });

    it("should work with a less than (<)", () => {
        const result = run(`
            20 < 30;
            30 < 20
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].state, 1);
        if (result) assert.deepStrictEqual(result.elements[1].state, 0);
    });

    it("should work with a less than or equal (<=)", () => {
        const result = run(`
            20 <= 20;
            21 <= 20
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].state, 1);
        if (result) assert.deepStrictEqual(result.elements[1].state, 0);
    });

    it("should work with a greater than (>)", () => {
        const result = run(`
            30 > 20;
            20 > 30
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].state, 1);
        if (result) assert.deepStrictEqual(result.elements[1].state, 0);
    });

    it("should work with a greater than or equal (>=)", () => {
        const result = run(`
            20 >= 20;
            19 >= 20
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].state, 1);
        if (result) assert.deepStrictEqual(result.elements[1].state, 0);
    });

    it("should work with an equality (==)", () => {
        const result = run(`
            20 == 20;
            19 == 20
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].state, 1);
        if (result) assert.deepStrictEqual(result.elements[1].state, 0);
    });

    it("should work with an inequality (!=)", () => {
        const result = run(`
            19 != 20;
            20 != 20
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].state, 1);
        if (result) assert.deepStrictEqual(result.elements[1].state, 0);
    });

    it("should work with a complex operation", () => {
        const result = run(`
            5 ** (1 + 2 * 10 / 10)
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 125);
    });

    it("should work with a complex operation including a binary shift to the right", () => {
        const result = run(`
            256 >> 1 + 2 * 10 / 10
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 32);
    });

    it("should work with a complex operation including a logical operation (^)", () => {
        const result = run(`
            14 ^ 1 + 4 * 2
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 7);
    });

    it("should work with a complex operation including a binary NOT (~)", () => {
        const result = run(`
            6 + ~5
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 0);
    });

    it("should work with a prefix operation", () => {
        const result = run(`
            ++9;
            --9;
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 10);
        if (result) assert.deepStrictEqual(result.elements[1].value, 8);
    });

    it("should work with a complex operation including prefix operation", () => {
        const result = run(`
            5 - --2 - 5;
            5 + ++2 + 5
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, -1);
        if (result) assert.deepStrictEqual(result.elements[1].value, 13);
    });

    it("should work with none", () => {
        const result = run(`
            none
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0] instanceof NoneValue, true);
    });

    it("should work with an assignment to a variable", () => {
        const result = run(`
            var variable = 1
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 1);
    });

    it("should work with an access to a variable", () => {
        const result = run(`
            var variable = 8;
            variable
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, 8);
    });

    it("should work with a modification of a variable", () => {
        const result = run(`
            var variable = 5;
            variable = 4;
            variable
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].value, 4);
    });

    it("should work with a list", () => {
        const result = run(`
            [0, 1]
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].elements.map((v) => v.value), [0, 1]);
    });

    it("should work with a list (access)", () => {
        const result = run(`
            var list = [1, 2, 3];
            list
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].elements.map((v) => v.value), [1, 2, 3]);
    });

    it("should work with a list (assignment)", () => {
        const result = run(`
            var list = [1, 2, 3];
            list[4] = 5;
            list
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].elements.map((v) => v instanceof NoneValue ? 0 : v.value), [1, 2, 3, 0, 5]);
    });

    it("should work with a list (binary selector)", () => {
        const result = run(`
            var list = [1, 2, 3, 0, 5];
            list[1:-1]
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].elements.map((v) => v.value), [2, 3, 0]);
    });

    it("should work with a delete keyword", () => {
        const result = run(`
            var list = [1, 2]
            delete list[0]
            list
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].elements[0].value, 2);
    });

    it("should work with a nullish coalescing operator (??)", () => {
        const result = run(`
            none ?? 1
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].value, 1);
    });

    it("should work with a function declaration", () => {
        const result = run(`
            func add(a, b?, c?=1) -> if b != 0: a + b + c else: a + c;
            add(5)
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, 6);
    });

    it("should work with a double call to a function (function that returns a function, which we want to call)", () => {
        const result = run(`
            func test() -> func(a, b) -> a + b;
            test()(5 + 5, 5)
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, 15);
    });

    it("should work with a list that contains a function, which we want to call", () => {
        const result = run(`
            var list = [func (a, b) -> a + b];
            list[0](1, 2)
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, 3);
    });

    it("should work with a list that contains a function, which we want to call (ultimate test)", () => {
        const result = run(`
            var list = [func () -> [1, func (a, b) -> a + b]];
            list[0]()[1](5, 1)
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, 6);
    });

    it("should work with a for-loop", () => {
        const result = run(`
            for i to 10: i;
            for i = 1 to 10: i;
            for i = 1 to 10 step 2: i;
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[0].elements.map((v) => v.value), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        if (result) assert.deepStrictEqual(result.elements[1].elements.map((v) => v.value), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        if (result) assert.deepStrictEqual(result.elements[2].elements.map((v) => v.value), [1, 3, 5, 7, 9]);
    });

    it("should work with a while-loop", () => {
        const result = run(`
            var e = 0;
            while e < 10: e++;
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].elements.map((v) => v.value), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("should work with an if statement", () => {
        const result = run(`
            var age = 19;
            if age > 18: "majeur" elif age == 18: "pile 18" else: "mineur";
            age = 18;
            if age > 18: "majeur" elif age == 18: "pile 18" else: "mineur";
            age = 5;
            if age > 18: "majeur" elif age == 18: "pile 18" else: "mineur";
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, "majeur");
        if (result) assert.deepStrictEqual(result.elements[3].value, "pile 18");
        if (result) assert.deepStrictEqual(result.elements[5].value, "mineur");
    });

    it("should work with postfix operation", () => {
        const result = run(`
            var a = 5;
            a++++;
            a; # 7
            var b = 5;
            b----;
            b; # 3
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].value, 7);
        if (result) assert.deepStrictEqual(result.elements[4].value, 3);
    });

    it("should work with concatenation", () => {
        const result = run(`
            var age = 17;
            var str = f"I am $age.";
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, "I am 17.");
    });

    it("should work with concatenation (with if statement)", () => {
        const result = run(`
            var age = 18;
            "I am " + (if age > 18: "major" elif age == 18: "18" else: "minor") + "."
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, "I am 18.");
    });

    it("should work with a dictionnary", () => {
        const result = run(`
            { "yo": 5, 'test': 'coucou', 'list': [1, 2] }
        `, fn, context).value;
        if (result) {
            assert.deepStrictEqual(result.elements[0].elements.get('yo').value, 5);
            assert.deepStrictEqual(result.elements[0].elements.get('test').value, "coucou");
            assert.deepStrictEqual(result.elements[0].elements.get('list').elements.map((v) => v.value), [1, 2]);
        }
    });

    it("should work with a class", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1] instanceof ClassValue, true);
        if (result) assert.deepStrictEqual(result.elements[2].value, "Thomas CodoPixel");
    });

    it("should work with several instances of the same class", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, "A cat walks");
        if (result) assert.deepStrictEqual(result.elements[4].value, "catty walks");
    });

    it("should work with several instances and default values in the __init method", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, "A dog walks");
        if (result) assert.deepStrictEqual(result.elements[4].value, "default walks");
    });

    it("should work with a method call in the properties of a class", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, "A snake walks");
        if (result) assert.deepStrictEqual(result.elements[4].value, "default walks");
    });

    it("should work with inheritance", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[4].value, "An animal walks");
        if (result) assert.deepStrictEqual(result.elements[5].value, "Wolfy runs");
    });

    it("should work with a complex inheritance", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[6].value, "Wolfy runs");
        if (result) assert.deepStrictEqual(result.elements[8].value, "Wolf2 is dead");
        if (result) assert.deepStrictEqual(result.elements[9].value, "Animal walks");
        if (result) assert.deepStrictEqual(result.elements[11].value, "Animal is dead");
    });

    it("should work with a complex inheritance (with super in another method than __init)", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[4].value, "Wolfy runs");
        if (result) assert.deepStrictEqual(result.elements[6].value, "Wolfy is dead, but walked 10 times");
    });

    it("should work with a method call as default value in __init", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, "A rat walks");
        if (result) assert.deepStrictEqual(result.elements[4].value, "default walks");
    });

    it("should not create any conflicts between different instances of the same class", () => {
        const result = run(`
            class Test:
                property value = none
            end

            var t = new Test()
            t.value = 5
            var t2 = new Test()

            t.value # 5
            t2.value # none
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[4].value, 5);
        if (result) assert.deepStrictEqual(result.elements[5] instanceof NoneValue, true);
    });

    it("should work with static properties", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].value, "self.test = static property");
        if (result) assert.deepStrictEqual(result.elements[3].value, "static property");
        if (result) assert.deepStrictEqual(result.elements[4].value, "static method");
        if (result) assert.deepStrictEqual(result.elements[5].value, "Test");
    });

    it("should work with the 'arguments' variable inside a function", () => {
        const result = run(`
            func test_arguments(arg1):
                return arguments
            end

            test_arguments("yo")
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].elements.map((v) => v.value), ["yo"]);
    });

    it("should work with the rest parameter", () => {
        const result = run(`
            func average_grade(number_of_marks, ...marks):
                var s = 0
                for i to number_of_marks:
                    s += marks[i]
                end
                return s / number_of_marks
            end
            average_grade(3, 10, 11, 12)
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, 11);
    });

    it("should work with the rest parameter (set as optional)", () => {
        const result = run(`
            func average_grade(number_of_marks, ...marks?):
                if not marks: return 0

                var s = 0
                for i to number_of_marks:
                    s += marks[i]
                end
                return s / number_of_marks
            end
            average_grade(3)
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, 0);
    });

    it("should work with an enum", () => {
        const result = run(`
            enum Status:
                running,
                paused,
            end

            var st = Status.running;
            st = Status.paused
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1].value, 0);
        if (result) assert.deepStrictEqual(result.elements[2].value, 1);
    });

    it("should work with switch statement", () => {
        const result = run(`
            var value = 5
            var response = -1

            switch (value):
                case 4:
                    response = "4"
                
                case 5:
                    response = "5"
            end

            response
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, "5");
    });

    it("should work with switch statement (with default)", () => {
        const result = run(`
            var value = 0
            var response = -1

            switch (value):
                case 4:
                    response = "4"
                
                case 5:
                    response = "5"
                
                default:
                    response = "default"
            end

            response
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, "default");
    });

    it("should work with complex cases on switch statement", () => {
        const result = run(`
            var value = 3
            var response = -1

            switch (value):
                case 4,3:
                    response = "4 or 3"
                
                default:
                    response = "default"
            end

            response
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, "4 or 3");
    });

    it("should work with a switch statement and an enum", () => {
        const result = run(`
            enum State:
                stopped,
                paused,
                running
            end

            var state = State.paused
            var response = none

            switch (state):
                case State.stopped: response = "stopped"
                case State.paused: response = "paused"
                case State.running: response = "running"
                default: response = no
            end

            response
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[4].value, "paused");
    });

    it("should work with a nullish assignment operator applied to a dictionnary", () => {
        const result = run(`
            var dict = { "duration": 50 }
            dict["duration"] ??= 10
            dict["duration"] # 50

            dict["speed"] ??= 25
            dict["speed"] # 25
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].value, 50);
        if (result) assert.deepStrictEqual(result.elements[4].value, 25);
    });

    it("should work with a nullish assignment operator applied to a list", () => {
        const result = run(`
            var list = [1, 2]
            list[1] ??= 50
            list[1] # 2

            list[3] ??= 25
            list[3] # 25
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].value, 2);
        if (result) assert.deepStrictEqual(result.elements[4].value, 25);
    });

    it("should work with a nullish assignment operator applied to a variable", () => {
        const result = run(`
            var nullish = none
            nullish ??= 5
            nullish

            var falsy = false
            falsy ??= true
            falsy
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].value, 5);
        if (result) assert.deepStrictEqual(result.elements[4] instanceof BooleanValue && result.elements[4].state  === 0, true);
    });

    it("should work with an and assignment", () => {
        const result = run(`
            var a = 1
            var b = 0
            
            a &&= 2
            a # 2

            b &&= 2
            b # 0
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, 2);
        if (result) assert.deepStrictEqual(result.elements[5].value, 0);
    });

    it("should work with an or assignment", () => {
        const result = run(`
            var a = {"duration": 50, "title": ""}

            a["duration"] ||= 10
            a["duration"] # expected: 50

            a["title"] ||= "title is empty"
            a["title"] # expected: "title is empty"
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].value, 50);
        if (result) assert.deepStrictEqual(result.elements[4].value, "title is empty");
    });

    it("should work with an optional chaining operator on properties", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[4] instanceof NoneValue, true);
    });

    it("should work with an optional chaining operator on static properties", () => {
        const result = run(`
            class Example:
                static property yo = 5
            end

            Example?::yoyo # expected: none
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with an optional chaining operator on method", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[4] instanceof NoneValue, true);
    });

    it("should work with an optional chaining operator on method (complex situation)", () => {
        const result = run(`
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
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[4].value, "Dinah");
    });

    it("should work with an optional chaining operator on list", () => {
        const result = run(`
            var list = [1, 2]

            # should raise an error without "?.", none otherwise
            list[42]?.[42]
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with an optional chaining operator on dictionnary", () => {
        const result = run(`
            var dico = { "person": { "name": "thomas" } }
            dico["thing"]?.["name"]
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with a complex sequence of operations on properties (?.()?.()?.[])", () => {
        const result = run(`
            class Adventurer:
                property test = 5

                method imaginaryMethod():
                    return func (a, b) -> if a == 0: none else: [a + b + self.test]
                end
            end

            var adv = new Adventurer()
            var first = adv.imaginaryMethod?.()?.(1, 2)?.[0] # expected: 8
            var second = adv.imaginaryMethod?.()?.(0, 2)?.[0] # we can use [0] even though we know it's null (none), thanks to '?.'
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[2].value, 8);
        if (result) assert.deepStrictEqual(result.elements[3] instanceof NoneValue, true);
    });

    it("should work with an optional call to a function", () => {
        const result = run(`
            var variable = func () -> none
            variable()?.()
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with a variable and and optional chaining operator, called as a function", () => {
        const result = run(`
            var variable = none
            variable?.()?.()
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with a variable and and optional chaining operator, called as a list", () => {
        const result = run(`
            var variable = none
            variable?.[0]?.[0]
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[1] instanceof NoneValue, true);
    });

    it("should work with a short-circuit thanks to an optional chaining operator", () => {
        const result = run(`
            var object = none
            var x = 0
            var variable = object?.[x++]

            x # should be 0
        `, fn, context).value;
        if (result) assert.deepStrictEqual(result.elements[3].value, 0);
    });
});
