# VersaJS

A language made to create websites in a javascript-like way.

## Work in progress

At the moment, the language cannot be used to create websites because all the primitive features of any language such as javascript have not yet been created.

## Syntax

In the `src` folder, there is a text file which describes the grammar of the language. Inspired by `CodePulse`.

## Examples

* Variables

```
var big_number = 100_000 # == 100000
var true = yes
var false = no
var null = none
var list = ["Hello"]
var name = "Thomas"
var dictionnary = {"age": 17}
var concatenation = f"My name is $name, I'm " + dictionnary["age"] + "."
```

* Constants

```
define NAME = "Thomas"
```

* Logical comparisons

```
var variable = 5 == 5
var else_assignment = variable ?? "Oh no, 5 == 5 is false, 0 or null"
var condition = if 5 == 5: "5 == 5" elif 4 == 5: "4 == 5" else: "else"

if 5 == 5:
    # statements
elif 4 == 5:
    # statements
else:
    # statements
end
```

* Enum

```
enum Status:
    stopped,
    paused,
    running
end

var state = Status.paused

switch (state):
    case Status.stopped: log("stopped") # log is a temporary native function (same as console.log)
    case Status.paused: log("paused")
    case Status.running: log("running")
    default: log(no)
end
```

* Loops

```
# i = 0 optional, just write "i"
# step 1 is optional because 1 is the default value
for i = 0 to 10 step 1:
    log(i)
end

var digits = for i to 10: i # returns [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
```

```
var i = 0
while i < 10:
    i++
    log(i)
end
```

* Incrementation, Decrementation

```
++5 == 6
++++5 == 7

var number = 5
number++ # returns 6 and number = 6
```

```
--5 == 4
----5 == 3

var number = 5
number-- # returns 4 and number = 4
```

* Functions

```
func average_grade(...marks):
    var s = 0
    var length = len(marks)
    for i to length:
        s += marks[i]
    end
    return s / length
end

var average = average_grade(10, 11, 12) # == 11
```

```
func test_with_optional_args(a, b?, c?=1):
    log(a) # mandatory argument
    log(b) # default argument == none by default
    log(c) # default argument (1 by default)
end
```

* Classes

```
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

    method walk() -> log(if self.isalive: self.name + " walks" else: self.name + " is dead")
end

class Wolf extends Animal:
    method __init(name):
        super(name, "Wolf")
    end

    override method walk() -> log(if self.isalive: self.name + " runs" else: self.name + " is dead")
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
```

```
class Test:
    static property static_property = "static property"
    property test

    static method get_name() -> self::static_property

    method __init():
        self.test = self::get_name()
    end

    static method static_method() -> "static method"

    method __repr():
        return "self.test = " + self.test
    end
end

var t = new Test()
log(t) # __repr is called
Test::static_property
Test::static_method()
Test::__name # default static property, returns "Test"
```

## License

MIT License.