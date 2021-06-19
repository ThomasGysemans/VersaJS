# Créer des fonctions

* Créer une function

```
FUNC add(a, b) -> a + b
add(5, 6) # 11 
```

* Réassigner des fonctions

```
VAR some_func = add
some_func(5, 6) # 11
```

* Créer une fonction anonyme

```
VAR some_func = FUNC (a, b) -> a + b
some_func(5, 6) # 11
```

## Lexer

Bien entendu, les tokens nécessaires sont : 

* `COMMA`
* `ARROW`

Et le mot-clé `FUNC`.

On n'oublie pas que le signe "->" est composé d'un moins "-", donc on crée une fonction qui construit le bon token.

## Grammaire

On met une fonction au sein de la règle "atom" :

```
// ...

power       : call (POWER factor)*

// atom OU atom (expr, )
call        : atom (LPAREN (expr (COMMA expr)*)? RPAREN)?

atom        : INT|FLOAT|IDENTIFIER
            : LPAREN expr RPAREN
            : if-expr
            : for-expr
            : while-expr
            : func-def

// ...

// FUNC identifier (identifier, ) -> expr
// "?" signifie optionel
func-def    : KEYWORD:FUNC IDENTIFIER?
                LPAREN (IDENTIFIER (COMMA IDENTIFIER)*)? RPAREN
                ARROW expr
```

## Noeuds

Il faut maintenant ajouter les noeuds nécessaires.

* `FuncDefNode`, the node that corresponds to the declaration of a new function.
* `CallNode`, the node that corresponds to a call to a function.

## Parser

On devra modifier le Parser de façon à ce qu'il puisse lire des functions et des calls.

## Interpreter

Pour le moment il n'existe qu'un seul de type de données : des nombres, or une fonction n'est pas un nombre. On créera une classe parente pour chaque type qui contiendra toutes les fonctions. On pense à personnaliser les classes (@override).

# Aller plus loin

On va tenter de mettre en place des arguments optionnels ainsi que des valeurs par défaut.

```
FUNC test(arg, default_arg?, default_arg_with_default? = "value") -> log(a)
```

Les arguments optionnels ont une valeur par défaut définie à `null`. On peut changer ça en donnant une valeur par défaut précise.

Pour cela, il faut modifier la grammaire :

// QMARK = "?"
func-def    : KEYWORD:FUNC IDENTIFIER?
                LPAREN (IDENTIFIER (QMARK (EQ expr))? (COMMA IDENTIFIER)*)? RPAREN
                ARROW expr

# Return

Pour préparer la lecture de fichiers, on doit préparer d'abord:

```
FUNC add(a, b)
    RETURN a + b
END

FUNC example()
    # do stuff
    IF ... THEN
        RETURN
    END
    # do more stuff
END
```