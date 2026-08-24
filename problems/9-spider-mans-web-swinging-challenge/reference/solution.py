import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    heights = [int(x) for x in data[1:n+1]]
    res = [min(150, h + 20) for h in heights]
    print(*(res))

if __name__ == '__main__':
    solve()
