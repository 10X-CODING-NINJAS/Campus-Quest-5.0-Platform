import bisect
n, q = map(int, input().split())
a = list(map(int, input().split()))
import sys
input2 = sys.stdin.read().split()
for t in input2:
    x = int(t)
    i = bisect.bisect_left(a, x)
    print(i if i < n and a[i] == x else -1)
