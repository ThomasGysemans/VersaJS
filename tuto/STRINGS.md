# Créer des strings

* `"Text"`
* `"Text with \"quotes\""`
* `"Text with \\ backslashes \\"`
* `"Text \nwith \nnewlines"`

## Lexer

String sera un `Token`. On pensera qu'il faut prendre en compte le `\`.

## Noeud

String sera également un noeud qui permettra de concaténer (même principe qu'une addition entre deux nombres). On pourra customiser certaines actions telles que la répétition. En effet, on peut implémenter une méthode depuis Value qui permet de multiplier une string avec un autre noeud.

## Grammaire

La grammaire est assez simple pour le coup :

atom    : INT|FLOAT|STRING|IDENTIFIER
        : LPAREN expr RPAREN
        : if-expr
        : for-expr
        : while-expr
        : func-def

## Interpreter

On crée un noeud, il faut bien sûr le visiter lors de l'évaluation du code.