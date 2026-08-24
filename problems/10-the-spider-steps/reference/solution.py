import sys, math

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    h = int(data[0])
    c = int(data[1])
    s = int(data[2])
    
    if c >= h:
        print(1)
        return
    if c <= s:
        print(-1)
        return
    
    needed = h - c
    net = c - s
    steps = math.ceil(needed / net) + 1
    print(steps)

if __name__ == '__main__':
    solve()
