import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    if n % 2 == 0:
        print("ACTIVATE")
    else:
        print("IGNORE")

if __name__ == '__main__':
    solve()
