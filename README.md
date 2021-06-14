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
            : LPAREN expr RPAREN

Pour exemple:

* `8 + 24 * 2`
* 8, 24 et 2 sont les facteurs (INT ou FLOAT).
* `24 * 2` représente un terme (un terme est créé quand il y a un facteur, puis MUL|DIV, puis un autre facteur OU juste un facteur)
* `8` est un terme à lui tout seul.
* Un terme plus/moins un autre terme représente une expression.

## Variables

Une variable doit contenir une valeur et être réutilisable à volonté sans déclencher une erreur "Illegal Character". Pour faire fonctionner nos variables, il nous faut trois types de tokens:

* IDENTIFIER
* KEYWORD
* EQ

VAR      variable_name     =     `<expr>`
 ^             ^           ^        
KEYWORD    IDENTIFIER    EQUALS

La déclaration d'une variable doit être ce qui prend le moins de priorité dans la grammaire. En effet, il faut absolument éviter le cas suivant :

* `VAR a = 5 + 5`
* `(VAR a = 5) + 5`

**Note:** maintenant, quand on cherche un facteur, il faut aussi penser à vérifier la présence d'un IDENTIFIER.

Ces variables représenteront des noeuds, comme le nombres etc dont il faudra vérifier la présence dans l'évaluation d'une expression. Une seule et même classe contiendra toutes les variables courantes ainsi que les méthodes permettant de créer, modifier ou supprimer des variables.

On programmera un système de suppression automatique des variables lorsque l'on change de contexte en définissant le tableau de variables parent.

En parallèle, il est possible ainsi de définir des variables globales.

## Opérations logiques

Les opérations logiques sont :

* `<` (inférieur à)
* `<=` (inférieur ou égal à)
* `>` (supérieur à)
* `>=` (supérieur ou égal à)
* `==` (égal à)

Au niveau de la grammaire, le comportement suivant est attendu :

* `5 + 5 == 2 + 8`
* `(5 + 5) == (2 + 8)`

+ `VAR is_equal = 5 == 5`
+ `VAR is_equal = (5 == 5)`

Il faut éviter :

* `5 + (5 == 2) + 8`
+ `(VAR is_equal = 5) == 5`

Pour réaliser ça, il nous faudra de nouveaux tokens et de nouveaux noeuds ainsi qu'une modification de la grammaire pour identifier les bonnes priorités. **Une comparaison logique doit prendre plus de priorité qu'une affectation de variable.**

### AND, OR

Avec `AND` (pareil qu'avec `OR`), on veut comparer deux membres qui doivent être vrais. Par exemple :

* `5 == 5 AND 6 == 6`
* `(5 == 5) AND (6 == 6)`

Il faut éviter :

* `5 == (5 AND 6) == 6`

**Cela signifie qu'un `AND` doit prendre moins de priorité qu'une comparaison logique.**

### NOT

Ceci va permettre de renvoyer l'inverse d'une comparaison logique. Exemple :

* `NOT 1 == 2`

Ceci doit se comporter de la manière suivante :

* `NOT (1 == 2)`

Ainsi, un `NOT` apparaîtra toujours avant une comparaison logique.

On pourra utiliser la grammaire suivante :

expr        : KEYWORD:VAR IDENTIFIER EQ expr
            : comp-expr ((KEYWORD:AND|KEYWORD:OR) comp-expr)*

comp-expr   : NOT comp-expr
            : arith-expr ((EE|LT|GT|LTE|GTE)* arith-expr)*

arith-expr  : term ((PLUS|MINUS) term)*

term        : factor ((MUL|DIV) factor)*

factor      : (PLUS|MINUS) factor
            : power

power       : atom (POWER factor)*

# most priority
atom        : INT|FLOAT|IDENTIFIER
            : LPAREN expr RPAREN

## Conditions

Une condition peut être interprétée de la manière suivante :

* `IF <condition> THEN <expr>`

Pour aller plus loin:

* `IF <condition> THEN <expr> ELIF <condition> THEN <expr> ELSE <expr>`

On pourrait alors utiliser les conditions de la manière suivante :

```
VAR age = 27
VAR price = IF age >= 18 THEN 40 ELSE 20
```

Pour coder cette fonctionnalité, on doit bien sûr ajouter les mots-clés `IF`, `THEN`, `ELIF` et `ELSE`. Contrairement aux autres fonctionnalités, il est inutile de se soucier de l'ordre de priorité. En effet, il est impossible que des parenthèses soient mal placées lors de la lecture du code. Ainsi, on peut modifier la grammaire de la façon suivante :

atom        : INT|FLOAT|IDENTIFIER
            : LPAREN expr RPAREN
            : if-expr

if-expr     : KEYWORD:IF expr KEYWORD:THEN expr
                (KEYWORD:ELIF expr KEYWORD:THEN expr)* // 0 ou plus
                (KEYWORD:ELSE expr)? // pas obligatoire

On va vérifier la présence du mot-clé `IF`, s'il est présent, alors on regarde la condition qui suit, puis la présence du mot-clé `THEN`, puis une expression. On vérifie ensuite toutes les `ELIF` potientiels avant de vérifier la présence de `ELSE`.

Dans l'interpreter, on verifira la valeur de chaque condition (on visite l'expression et on obtient un nombre,`1` pour `TRUE` et `0` pour `FALSE`). Si une condition est vraie, alors on retourne la valeur de l'expression qui y correspond.