# Doc Ock's Cipher Decryption

Spider-Man intercepts an encrypted message sent by Doctor Octopus. To check whether the transmission contains a dangerous virus command, Peter analyzes the letters in the message.

Given a string `S`, count the number of vowels and consonants in the message. Vowels include `a, e, i, o, u`, regardless of case. All other alphabetic characters are considered consonants. Spaces, digits, and punctuation are ignored.

If the absolute difference between the number of vowels and consonants is even, print `SAFE`. Otherwise, print `DANGER`.

## Input Format

The first and only line contains a string `S`, representing the encrypted message.

## Output Format

Print a single line containing:
* `SAFE` if the absolute difference between the number of vowels and consonants is even.
* `DANGER` if the absolute difference is odd.

## Constraints

* `1 <= |S| <= 1000`
* `S` contains spaces, letters, digits, or punctuation symbols.

## Sample Input 1

```
Spider-Man!
```

## Sample Output 1

```
DANGER
```

## Explanation 1

The vowels are `i, e, a`, giving a count of 3. The consonants are `S, p, d, r, M, n`, giving a count of 6.
The absolute difference is `|3 - 6| = 3`, which is odd. Therefore, `DANGER` is printed.

## Sample Input 2

```
Hero
```

## Sample Output 2

```
SAFE
```

## Explanation 2

The vowels are `e, o`, giving a count of 2. The consonants are `H, r`, giving a count of 2.
The absolute difference is `|2 - 2| = 0`, which is even. Therefore, `SAFE` is printed.
