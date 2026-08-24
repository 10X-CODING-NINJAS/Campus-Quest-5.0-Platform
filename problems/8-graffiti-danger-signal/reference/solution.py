import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n_str = data[0]
    digit_sum = sum(int(ch) for ch in n_str if ch.isdigit())
    if digit_sum > 15:
        print("DANGER")
    else:
        print("SAFE")

if __name__ == '__main__':
    solve()
