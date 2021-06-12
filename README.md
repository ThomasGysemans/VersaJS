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

Pour lire ces mathémtiques, même pour lire la **syntaxe**, il faut ce que l'on appelle un `Lexer`. Ce dernier va lire caractère par caractère le contenu du fichier source et agira en fonction. Par exemple, s'il identifie un signe "+", alors il créera le token correspondant.

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