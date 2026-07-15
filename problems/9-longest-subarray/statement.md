# Longest Subarray with Target Sum

Given an array of N integers and a target sum K, find the length of the longest subarray whose elements sum to exactly K.

If no such subarray exists, output 0.

## Input Format

* First line: N K
* Second line: N integers

## Output Format

* One integer: the length of the longest subarray with sum K.

## Constraints

* `1 <= N <= 10^5`
* `-10^9 <= arr[i] <= 10^9`
* `-10^14 <= K <= 10^14`

## Sample Input 1

```
8 5
1 -1 5 -2 3
```

## Sample Output 1

```
4
```

## Explanation 1

Subarray `[1, -1, 5, -2]` (index 0 to 3) has sum 3+2=...actually `1+(-1)+5+(-2)=3` — the subarray of length 4 from 0 to 3 has sum 3. The subarray of length 2 from 2 to 3: `5 + (-2) = 3`. Longest is 4.

Wait — let us clarify: subarray `[-1, 5, -2, 3]` (indices 1–4) = 5. Length 4.

## Sample Input 2

```
5 0
1 2 3 -3 -2
```

## Sample Output 2

```
5
```
