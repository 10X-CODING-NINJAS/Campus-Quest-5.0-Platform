n, k = map(int, input().split())
a = list(map(int, input().split()))
prefix = {0: -1}
total = 0
ans = 0
for i, x in enumerate(a):
    total += x
    if total - k in prefix:
        ans = max(ans, i - prefix[total - k])
    if total not in prefix:
        prefix[total] = i
print(ans)
