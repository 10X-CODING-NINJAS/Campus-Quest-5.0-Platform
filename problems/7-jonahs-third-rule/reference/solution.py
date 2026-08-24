import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    count5 = n // 5
    count3 = (n // 3) - (n // 15)
    other = n - count5 - count3
    total = count3 * 100 + other * 50
    print(total)

if __name__ == '__main__':
    solve()
