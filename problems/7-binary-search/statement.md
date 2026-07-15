# Binary Search

Given a sorted array of N distinct integers and Q queries, for each query find the index of the target value. If not found, output -1.

Implement binary search — brute force linear search will TLE.

## Input Format

* First line: N Q
* Second line: N sorted distinct integers
* Next Q lines: one integer (the target)

## Output Format

* Q lines, each with the 0-indexed position of the target, or -1.

## Constraints

* `1 <= N, Q <= 10^5`
* `-10^9 <= values <= 10^9`

## Sample Input 1

```
5 3
1 3 5 7 9
3
6
9
```

## Sample Output 1

```
1
-1
4
```
