import sys

def solve():
    s = sys.stdin.read()
    vowels = set('aeiouAEIOU')
    v_count = 0
    c_count = 0
    for ch in s:
        if ch.isalpha():
            if ch in vowels:
                v_count += 1
            else:
                c_count += 1
    diff = abs(v_count - c_count)
    if diff % 2 == 0:
        print("SAFE")
    else:
        print("DANGER")

if __name__ == '__main__':
    solve()
