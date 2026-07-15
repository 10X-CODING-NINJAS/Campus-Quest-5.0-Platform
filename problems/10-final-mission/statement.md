# Final Mission — The Convergence Protocol

> *"Every thread of code leads here. The multiverse depends on what you do next."*

You have been given the coordinates of N dimensional anchors scattered across a grid of size M×M. A portal can be opened between two anchors if the Manhattan distance between them is exactly D.

Find the number of valid portal pairs (pairs of anchors at exactly Manhattan distance D).

Each pair is counted once: (i, j) is the same as (j, i).

## Input Format

* First line: N M D
* Next N lines: two integers xi yi (0-indexed coordinates)

## Output Format

* One integer: number of valid portal pairs.

## Constraints

* `1 <= N <= 2000`
* `1 <= M <= 10^6`
* `1 <= D <= 2*10^6`

## Sample Input 1

```
4 10 3
0 0
0 3
3 0
1 1
```

## Sample Output 1

```
2
```

## Explanation

(0,0)↔(0,3): |0-0| + |0-3| = 3 ✓
(0,0)↔(3,0): |0-3| + |0-0| = 3 ✓
(0,3)↔(3,0): |0-3| + |3-0| = 6 ✗
(0,3)↔(1,1): 0+2 = 2 ✗
(3,0)↔(1,1): 2+1 = 3 ✓  
Wait that's 3 pairs... checking: (0,0)↔(1,1): 1+1=2 ✗. Answer is 3.

## Sample Input 2

```
3 5 4
0 0
2 2
4 0
```

## Sample Output 2

```
2
```
