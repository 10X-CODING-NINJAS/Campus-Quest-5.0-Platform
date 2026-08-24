# Spider-Man vs Hulk — Strength Battle

Spider-Man encounters Hulk during a dangerous situation in New York. To understand who has the advantage, their strength levels are compared.

Given the strength levels of Spider-Man and Hulk, determine the appropriate message based on their strength levels.

* If Spider-Man is stronger and the difference is less than 20, print `SPIDER-MAN IS STRONGER`.
* If Spider-Man is stronger and the difference is 20 or more, print `HULK SHOULD BE CAREFUL`.
* If Hulk is stronger, print `HULK IS STRONGER`.
* If both have equal strength, print `BOTH HAVE EQUAL STRENGTH`.

## Input Format

The first line contains a single integer `S`, representing Spider-Man's strength.
The second line contains a single integer `H`, representing Hulk's strength.

## Output Format

Print a single line containing the appropriate message based on their strength levels.

## Constraints

* `1 <= S, H <= 1000`

## Sample Input 1

```
85
75
```

## Sample Output 1

```
SPIDER-MAN IS STRONGER
```

## Explanation 1

Spider-Man's strength is 85 and Hulk's strength is 75. The difference is `85 - 75 = 10`. Since Spider-Man is stronger and the difference is less than 20, `SPIDER-MAN IS STRONGER` is printed.

## Sample Input 2

```
100
70
```

## Sample Output 2

```
HULK SHOULD BE CAREFUL
```

## Explanation 2

Spider-Man's strength is 100 and Hulk's strength is 70. The difference is `100 - 70 = 30`. Since the difference is 20 or more, `HULK SHOULD BE CAREFUL` is printed.
