# Mirror Dimension Palindrome

Peter Parker is traversing the Mirror Dimension, where a sequence number N can open a dimensional portal only if it reads the same forward and backward.

Given an integer `N`, determine whether Peter can open the portal by checking if the number is a palindrome.

## Input Format

The first and only line contains a single integer `N`, representing the sequence number.

## Output Format

Print a single line containing:
* `PALINDROME` if `N` reads the same forward and backward.
* `NOT PALINDROME` otherwise.

## Constraints

* `1 <= N <= 10^9`

## Sample Input 1

```
121
```

## Sample Output 1

```
PALINDROME
```

## Explanation 1

Reversing 121 gives 121, which matches the original number.

## Sample Input 2

```
123
```

## Sample Output 2

```
NOT PALINDROME
```

## Explanation 2

Reversing 123 gives 321, which does not match 123.
