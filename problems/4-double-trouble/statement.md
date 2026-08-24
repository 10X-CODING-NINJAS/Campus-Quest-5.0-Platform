# Double Trouble

Spider-Man's HUD receives two threat scores for the same night — one from the NYPD scanner and one from his spider-drone. To decide how dangerous the situation is, he follows a simple rule: respond to whichever threat score is higher.

If both sensors report the same danger level, it's officially a "double trouble" night.

Given two integers `A` and `B` representing the threat scores, determine which score is higher. If both scores are equal, print `TIE`.

## Input Format

The first and only line contains two space-separated integers `A` and `B`, representing the threat scores.

## Output Format

Print a single line containing:
* The larger value between `A` and `B`.
* `TIE` if `A` and `B` are equal.

## Constraints

* `1 <= A, B <= 10^6`

## Sample Input 1

```
45 80
```

## Sample Output 1

```
80
```

## Explanation 1

The threat scores are 45 and 80. Since 80 is greater than 45, Spider-Man responds to the higher threat level, so 80 is printed.

## Sample Input 2

```
50 50
```

## Sample Output 2

```
TIE
```

## Explanation 2

Both threat sensors report a danger level of 50. Since the scores are equal, it is a "double trouble" situation, so `TIE` is printed.
