### Multiverse Signal Decryption

Decrypt the $N$-th signal pulse of the Spider-Society communications wave.

The wave propagates in a sequence where each pulse frequency is the sum of the preceding two pulses:
- $F(0) = 0$
- $F(1) = 1$
- $F(i) = F(i-1) + F(i-2)$ for $i \ge 2$

Calculate the pulse value at index $N$.

#### Input Format
- A single integer $N$.

#### Output Format
- A single integer representing the $N$-th pulse frequency.
