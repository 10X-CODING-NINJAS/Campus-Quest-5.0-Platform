# Graffiti Danger Signal

MJ hides a secret numeric signal in a piece of street graffiti to warn Peter. To decode it, Spider-Man adds up every digit of the number and checks whether the signal indicates danger.

Given an integer `N`, compute the sum of its digits. If the digit sum is strictly greater than 15, print `DANGER`. Otherwise, print `SAFE`.

## Input Format

The first and only line contains a single integer `N`, representing the secret numeric signal.

## Output Format

Print a single line containing:
* `DANGER` if the sum of the digits is greater than 15.
* `SAFE` otherwise.

## Constraints

* `0 <= N <= 10^9`

## Sample Input 1

```
4892
```

## Sample Output 1

```
DANGER
```

## Explanation 1

The sum of the digits is `4 + 8 + 9 + 2 = 23`. Since 23 is greater than 15, the signal indicates danger, so `DANGER` is printed.

## Sample Input 2

```
210
```

## Sample Output 2

```
SAFE
```

## Explanation 2

The sum of the digits is `2 + 1 + 0 = 3`. Since 3 is not greater than 15, the signal is safe, so `SAFE` is printed.
