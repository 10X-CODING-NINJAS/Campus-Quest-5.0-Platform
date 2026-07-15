n, k = map(int, input().split())
a = list(map(int, input().split()))
k %= n
print(*a[-k:] + a[:-k] if k else a)
