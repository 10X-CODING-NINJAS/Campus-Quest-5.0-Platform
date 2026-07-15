# Two Sum

Given an array of integers `nums` and an integer `target`, find the indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

## Input Format

* The first line contains two integers: `N` (the size of the array) and `target`.
* The second line contains `N` space-separated integers representing the array `nums`.

## Output Format

* Output the indices of the two numbers (0-indexed) separated by a space, in ascending order.

## Constraints

* `2 <= N <= 10^4`
* `-10^9 <= nums[i] <= 10^9`
* `-10^9 <= target <= 10^9`

## Sample Input 1

```
4 9
2 7 11 15
```

## Sample Output 1

```
0 1
```

## Explanation 1

Because `nums[0] + nums[1] == 2 + 7 == 9`, we output `0 1`.
