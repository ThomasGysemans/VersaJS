# Créer des listes

* `[]`
* `[1, 2, 3, 4, 5]`

## Features

* `[1, 2] + 3 => [1, 2, 3]`
* `[1, 2] * [2, 3] => [1, 2, 2, 3]`
* `[1, 2, 3] - 1 => [1, 3]` (retire l'élément à l'index 1)
* `[1, 2, 3] - 0 => [2, 3]`
* `[1, 2, 3] - -1 => [1, 2]`
* `[1, 2, 3] / 0 => 1` (obtient l'élément à l'index 0)

## Lexer

Il faut bien sûr ajouter les tokens `[` et `]`.

## Grammaire

On oublie pas de modifier la grammaire :

atom        : INT|FLOAT|STRING|IDENTIFIER
            : LPAREN expr RPAREN
            : list-expr
            : if-expr
            : for-expr
            : while-expr
            : func-def

list-expr   : LSQUARE (expr (COMMA expr)*)? RSQUARE

## Noeud

Bien entendu, on crée un nouveau noeud.

## Parser

On modifie la grammaire, donc on modifie le parser en fonction des nouvelles règles.

## Interpreter

On crée un noeud, il faut modifier l'interpreter (sans oublier d'ajouter le type: List).
La fonction de visit permet ainsi de créer l'instance de type List.