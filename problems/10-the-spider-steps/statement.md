# The Spider Steps

Doc Ock has trapped Spider-Man in a deep underground silo. To escape, Spider-Man must jump his way to the top of the well.

Given three integers `H`, `C`, and `S`, representing the height of the well, the distance Spider-Man climbs in each step, and the distance he slips after each step, determine the minimum number of steps required to escape.

In every step, Spider-Man first climbs `C` units. If he reaches or exceeds the top of the well after climbing, he escapes immediately and does not slip back. Otherwise, he slips down by `S` units.

If Spider-Man cannot escape, print -1.

## Input Format

The first and only line contains three space-separated integers `H`, `C`, and `S`.

## Output Format

Print a single integer representing the minimum number of steps required to escape. Print -1 if Spider-Man cannot escape.

## Constraints

* `1 <= H <= 10^9`
* `1 <= C <= 10^9`
* `0 <= S <= 10^9`

## Sample Input 1

```
200 50 1
```

## Sample Output 1

```
5
```

## Explanation 1

Step 1: Climbs to 50, slips to 49.
Step 2: Climbs to 99, slips to 98.
Step 3: Climbs to 148, slips to 147.
Step 4: Climbs to 197, slips to 196.
Step 5: Climbs to 246 >= 200, escapes!

## Sample Input 2

```
100 30 10
```

## Sample Output 2

```
5
```

## Explanation 2

Step 1: Climbs to 30, slips to 20.
Step 2: Climbs to 50, slips to 40.
Step 3: Climbs to 70, slips to 60.
Step 4: Climbs to 90, slips to 80.
Step 5: Climbs to 110 >= 100, escapes!
