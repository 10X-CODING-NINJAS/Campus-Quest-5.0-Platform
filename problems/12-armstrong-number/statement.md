# Armstrong Number

Peter Parker discovers a mysterious number pattern hidden in one of his web-shooter controls. A number is called an Armstrong number if the sum of each of its digits raised to the power of the total number of digits is equal to the original number.

Given an integer `N`, determine whether it is an Armstrong number.

For example, 153 is an Armstrong number because it has 3 digits, and `1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153`.

## Input Format

The first and only line contains a single integer `N`, representing the number to be checked.

## Output Format

Print a single line containing:
* `ARMSTRONG` if `N` is an Armstrong number.
* `NOT ARMSTRONG` otherwise.

## Constraints

* `0 <= N <= 10^9`

## Sample Input 1

```
153
```

## Sample Output 1

```
ARMSTRONG
```

## Explanation 1

153 has 3 digits. `1^3 + 5^3 + 3^3 = 153`, so it is an Armstrong number.

## Sample Input 2

```
123
```

## Sample Output 2

```
NOT ARMSTRONG
```

## Explanation 2

123 has 3 digits. `1^3 + 2^3 + 3^3 = 36 != 123`, so it is not an Armstrong number.
