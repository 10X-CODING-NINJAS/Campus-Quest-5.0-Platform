import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = data[0]
    rev = str(int(s[::-1]))
    print(rev)

if __name__ == '__main__':
    solve()
