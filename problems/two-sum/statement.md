# Two Sum

Given an array of `n` integers and a target integer, find **two distinct indices** `i` and `j` (0-indexed) such that `nums[i] + nums[j] == target`.

You may assume exactly one solution exists, and you may not use the same element twice.

## Input Format

- Line 1: Two integers `n` and `target` — the array size and target sum
- Line 2: `n` space-separated integers representing the array

## Output Format

Print two space-separated integers: the indices `i` and `j` (0-indexed, in any order, `i < j`).

## Constraints

- `2 ≤ n ≤ 10^5`
- `-10^9 ≤ nums[i] ≤ 10^9`
- `-2 × 10^9 ≤ target ≤ 2 × 10^9`
- Exactly one valid answer exists.

## Sample Input 1

```
4 9
2 7 11 15
```

## Sample Output 1

```
0 1
```

**Explanation:** `nums[0] + nums[1] = 2 + 7 = 9 = target`

## Sample Input 2

```
3 6
3 2 4
```

## Sample Output 2

```
1 2
```

**Explanation:** `nums[1] + nums[2] = 2 + 4 = 6 = target`

## Hint

Think about what data structure allows O(1) lookups. Can you solve this in O(n)?
