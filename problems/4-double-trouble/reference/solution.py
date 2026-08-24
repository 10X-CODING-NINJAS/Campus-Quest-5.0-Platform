import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    a = int(data[0])
    b = int(data[1])
    if a > b:
        print(a)
    elif b > a:
        print(b)
    else:
        print("TIE")

if __name__ == '__main__':
    solve()
