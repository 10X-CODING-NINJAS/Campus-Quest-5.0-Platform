# Fibonacci Sequence

Compute the **n-th Fibonacci number** (0-indexed).

The Fibonacci sequence is defined as:
- `F(0) = 0`
- `F(1) = 1`
- `F(n) = F(n-1) + F(n-2)` for `n ≥ 2`

## Input Format

A single integer `n`.

## Output Format

A single integer — `F(n)`.

## Constraints

- `0 ≤ n ≤ 90`

## Sample Input 1

```
5
```

## Sample Output 1

```
5
```

**Explanation:** F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5

## Sample Input 2

```
10
```

## Sample Output 2

```
55
```

## Hint

Use dynamic programming or matrix exponentiation. Note that `F(90)` fits in a 64-bit integer.
