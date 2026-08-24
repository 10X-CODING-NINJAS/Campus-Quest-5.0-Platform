import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    if n <= 1:
        print("NOT PRIME")
        return
    if n <= 3:
        print("PRIME")
        return
    if n % 2 == 0 or n % 3 == 0:
        print("NOT PRIME")
        return
    i = 5
    is_prime = True
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            is_prime = False
            break
        i += 6
    if is_prime:
        print("PRIME")
    else:
        print("NOT PRIME")

if __name__ == '__main__':
    solve()
