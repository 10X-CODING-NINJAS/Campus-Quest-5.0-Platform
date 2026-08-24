# Multiverse Villain Hunt

Doctor Strange accidentally opened rifts in the multiverse, and several variants of Spider-Man's villains have entered New York. Spider-Man's tracking system records the power levels of the villains in the exact order they appear.

To defeat them efficiently, Spider-Man's combat algorithm requires him to fight a sequence of villains whose power levels are strictly increasing.

Given an array of integer power levels, determine the maximum number of villains Spider-Man can fight while maintaining a strictly increasing sequence. Spider-Man can skip some villains, but he must follow the original chronological order.

## Input Format

The first line contains a single integer `N`, representing the number of villains.
The second line contains `N` space-separated integers, representing the power levels of the villains.

## Output Format

Print a single integer representing the maximum number of villains Spider-Man can fight while maintaining a strictly increasing sequence.

## Constraints

* `1 <= N <= 1000`
* `1 <= A[i] <= 10^6`

## Sample Input 1

```
8
10 9 2 5 3 7 101 18
```

## Sample Output 1

```
4
```

## Explanation 1

The maximum strictly increasing chronological sequence can be `[2, 3, 7, 101]` or `[2, 5, 7, 18]`, which has length 4.

## Sample Input 2

```
6
5 4 3 2 1 6
```

## Sample Output 2

```
2
```

## Explanation 2

The best increasing sequence is `[1, 6]`, which has length 2.
