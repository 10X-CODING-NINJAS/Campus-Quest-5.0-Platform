# Any Pair

Given an array of `n` integers and a target integer, find **any two distinct indices** `i` and `j` (0-indexed) such that `nums[i] + nums[j] == target`.

There could be multiple valid index pairs. Any valid pair will be accepted by the custom checker.

## Input Format

- Line 1: Two integers `n` and `target`
- Line 2: `n` space-separated integers representing the array

## Output Format

Print two space-separated integers: the indices `i` and `j` (0-indexed, in any order).

## Constraints

- `2 ≤ n ≤ 10^5`
- `-10^9 ≤ nums[i] ≤ 10^9`
- `-2 × 10^9 ≤ target ≤ 2 × 10^9`
- At least one solution exists.

## Sample Input 1

```
4 9
2 7 2 7
```

## Sample Output 1

```
0 1
```

**Explanation:** Other valid outputs include `0 3`, `2 1`, or `2 3`. All are accepted.
