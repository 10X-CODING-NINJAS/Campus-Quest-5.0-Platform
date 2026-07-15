n, m, d = map(int, input().split())
pts = [tuple(map(int, input().split())) for _ in range(n)]
count = 0
for i in range(n):
    for j in range(i+1, n):
        if abs(pts[i][0]-pts[j][0]) + abs(pts[i][1]-pts[j][1]) == d:
            count += 1
print(count)
