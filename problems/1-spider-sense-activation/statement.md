# Spider Sense Activation

Peter Parker's Spider Sense activates only when the danger level is even.

Given an integer `N` representing the danger level, determine whether Spider-Man should activate his Spider Sense.

If the danger level is even, print `ACTIVATE`. Otherwise, print `IGNORE`.

## Input Format

The first and only line contains a single integer `N`, representing the danger level.

## Output Format

Print a single line containing:
* `ACTIVATE` if `N` is even.
* `IGNORE` otherwise.

## Constraints

* `1 <= N <= 10^9`

## Sample Input 1

```
8
```

## Sample Output 1

```
ACTIVATE
```

## Explanation 1

The danger level is 8, which is an even number. Therefore, Spider-Man's Spider Sense activates.

## Sample Input 2

```
7
```

## Sample Output 2

```
IGNORE
```

## Explanation 2

The danger level is 7, which is an odd number. Therefore, Spider-Man's Spider Sense does not activate.
