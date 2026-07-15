n = int(input())
intervals = [list(map(int, input().split())) for _ in range(n)]
intervals.sort()
merged = [intervals[0]]
for s, e in intervals[1:]:
    if s <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], e)
    else:
        merged.append([s, e])
for a, b in merged:
    print(a, b)
