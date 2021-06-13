# Ce que je comprends de la conception d'un langage

## Comment lire du code ?

On définit une classe qui représentera une `Position`. Cette classe contiendra toutes les informations suivantes :

* index, comme dans une chaîne de caractères basique (`int`)
* numéro de ligne (`int`)
* colonne (`int`)
* nom du fichier (`string`)
* contenu du ficher (`string`)

## Comment lire des maths ?

On définit les identifiants principaux (alias `tokens`). On peut citer par exemple :

* `INT`
* `FLOAT`
* `PLUS`
* `MINUS`
* `MULTIPLY`
* `DIVIDE`
* `LEFT PARENTHESIS`
* `RIGHT PARENTHESIS`
* `END OF FILE`
* etc.

Il va falloir les différencier pendant la lecture du code source. On va ensuite les utiliser pour identifier l'ordre de priorité des opérations.

## Lexer

Pour lire ces mathématiques, même pour lire la **syntaxe**, il faut ce que l'on appelle un `Lexer`. Ce dernier va lire caractère par caractère le contenu du fichier source et agira en fonction. Par exemple, s'il identifie un signe "+", alors il créera le token correspondant.

On crée ainsi une liste de tokens dans l'ordre. Puis on avance au prochain caractère.

Bien sûr, s'il s'agit d'un espace ou d'une tabulation, on passe et on avance.

S'il s'agit d'un nombre, on identifie en premier lieu s'il s'agit d'un `int` ou d'un `float`. Ce qui permet ainsi de créer un token (`INT` ou `FLOAT`) que l'on ajoute à la liste de nos tokens.

On obtient ensuite:

```
4 + 7.9
# [INT, 4, PLUS, FLOAT, 7.9]
# [INT:4, PLUS, FLOAT:7.9]
# Bien sûr, les tokens n'ont pas de valeur attachée
```

## Parser

L'idée est de créer `l'arbre de syntaxe`. On représentera chaque partie d'une expression par des `noeuds`. Exemple :

* `1 + 2 * 3`

      [BinOp(PLUS)]
[Number 1] <-- --> [BinOp(MUL)]
                      <-- -->
               [Number 2] [Number 3]

Dans cet exemple, il faut traduire cet arbre pour obtenir :

* `(INT:1, PLUS, (INT:2, MUL, INT:3)`

**Note:** Il faut bien penser au fait que les parenthèses changent l'ordre et sont prioritaires.

### Noeuds

On aura ainsi trois types de noeuds:

* `BinOpNode`: pour les opérations binaires (donc +, -, *, /, % etc).
* `UnaryOpNode`: pour les opérations uniques (les nombres négatifs: -1, qui subiront juste une multiplication -1 * |1|).
* `NumberNode`: juste un nombre

### Grammaire

Ainsi, notre langage possédera une grammaire, du moins prioritaire au plus prioritaire :

expr        : term ((PLUS|MINUS) term)*

term        : factor ((MUL|DIV) factor)*

factor      : INT|FLOAT
            : (PLUS|MINUS) factor
            : LPAREN expre RPAREN

Pour exemple:

* `8 + 24 * 2`
* 8, 24 et 2 sont les facteurs (INT ou FLOAT).
* `24 * 2` représente un terme (un terme est créé quand il y a un facteur, puis MUL|DIV, puis un autre facteur OU juste un facteur)
* `8` est un terme à lui tout seul.
* Un terme plus/moins un autre terme représente une expression.