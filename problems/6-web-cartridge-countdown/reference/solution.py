import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    for i in range(n, 0, -1):
        print(i)
    print("WEB'S OUT!")

if __name__ == '__main__':
    solve()
