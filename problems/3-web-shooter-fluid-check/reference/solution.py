import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    f = int(data[0])
    if f >= 50:
        print("SWING")
    else:
        print("RECHARGE")

if __name__ == '__main__':
    solve()
