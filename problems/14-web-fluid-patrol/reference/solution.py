import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    k = int(data[1])
    arr = [int(x) for x in data[2:2+n]]
    total = sum(arr)
    if k >= total:
        print(f"YES {k - total}")
    else:
        print(f"NO {total - k}")

if __name__ == '__main__':
    solve()
