import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = data[0]
    if s == s[::-1]:
        print("PALINDROME")
    else:
        print("NOT PALINDROME")

if __name__ == '__main__':
    solve()
