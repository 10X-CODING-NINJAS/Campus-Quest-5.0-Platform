# Oscorp Prime Energy Core

An Oscorp energy core is stable only if its core frequency N is a prime number. A prime number is greater than 1 and has no divisors other than 1 and itself.

Given an integer `N`, help Peter determine whether the energy core is stable.

## Input Format

The first and only line contains a single integer `N`, representing the core frequency.

## Output Format

Print a single line containing:
* `PRIME` if `N` is a prime number.
* `NOT PRIME` otherwise.

## Constraints

* `1 <= N <= 10^9`

## Sample Input 1

```
13
```

## Sample Output 1

```
PRIME
```

## Explanation 1

13 has no divisors other than 1 and 13, so it is a prime number.

## Sample Input 2

```
10
```

## Sample Output 2

```
NOT PRIME
```

## Explanation 2

10 is divisible by 2 and 5, so it is not a prime number.
