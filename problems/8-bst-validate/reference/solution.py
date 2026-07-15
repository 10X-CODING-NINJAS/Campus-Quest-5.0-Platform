import sys
sys.setrecursionlimit(20000)
n = int(input())
nodes = []
for _ in range(n):
    v, l, r = map(int, input().split())
    nodes.append((v, l-1, r-1))

def valid(i, lo, hi):
    if i < 0: return True
    v, l, r = nodes[i]
    if v <= lo or v >= hi: return False
    return valid(l, lo, v) and valid(r, v, hi)

print("YES" if valid(0, float('-inf'), float('inf')) else "NO")
