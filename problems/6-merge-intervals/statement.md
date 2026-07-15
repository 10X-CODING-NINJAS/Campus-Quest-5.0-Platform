# Merge Intervals

Given N intervals, merge all overlapping intervals and print the result sorted by start time.

## Input Format

* The first line contains N.
* Each of the next N lines contains two integers: start and end of an interval (start <= end).

## Output Format

* Print each merged interval on a separate line, space-separated.

## Constraints

* `1 <= N <= 10^4`
* `0 <= start <= end <= 10^9`

## Sample Input 1

```
4
1 3
2 6
8 10
15 18
```

## Sample Output 1

```
1 6
8 10
15 18
```
