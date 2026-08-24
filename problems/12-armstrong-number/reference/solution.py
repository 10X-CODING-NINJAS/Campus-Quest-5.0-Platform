import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n_str = data[0]
    n = int(n_str)
    num_digits = len(n_str)
    arm_sum = sum(int(d) ** num_digits for d in n_str)
    if arm_sum == n:
        print("ARMSTRONG")
    else:
        print("NOT ARMSTRONG")

if __name__ == '__main__':
    solve()
