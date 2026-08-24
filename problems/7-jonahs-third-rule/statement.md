# Jonah's Third Rule

Peter drops a stack of N photos on Jameson's desk. Jonah follows a strange payment rule: he pays extra for every third photo, but every fifth photo is thrown back without payment.

For each photo numbered from 1 to N:
* If the photo number is a multiple of 5, Jonah pays 0.
* Otherwise, if it is a multiple of 3, Jonah pays 100.
* Otherwise, Jonah pays 50.

Given an integer `N`, calculate the total amount Peter earns.

## Input Format

The first and only line contains a single integer `N`, representing the number of photos.

## Output Format

Print a single integer representing the total amount Peter earns.

## Constraints

* `1 <= N <= 10^6`

## Sample Input 1

```
10
```

## Sample Output 1

```
550
```

## Explanation 1

For the first 10 photos, payment is:
Photos 1, 2, 4, 7, 8 -> 50 each
Photos 3, 6, 9 -> 100 each
Photos 5, 10 -> 0 each
Total earnings = `5 * 50 + 3 * 100 + 2 * 0 = 550`.

## Sample Input 2

```
6
```

## Sample Output 2

```
350
```

## Explanation 2

For the first 6 photos, payment is:
Photos 1, 2, 4 -> 50 each
Photos 3, 6 -> 100 each
Photo 5 -> 0
Total earnings = `3 * 50 + 2 * 100 + 1 * 0 = 350`.
