import sys
sys.setrecursionlimit(20000)

def solve():
    n = int(input())
    nodes = []
    for _ in range(n):
        v, l, r = map(int, input().split())
        nodes.append((v, l-1, r-1))
    # Write your solution here
    pass

if __name__ == '__main__':
    solve()
