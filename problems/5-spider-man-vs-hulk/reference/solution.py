import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = int(data[0])
    h = int(data[1])
    if s > h:
        if (s - h) < 20:
            print("SPIDER-MAN IS STRONGER")
        else:
            print("HULK SHOULD BE CAREFUL")
    elif h > s:
        print("HULK IS STRONGER")
    else:
        print("BOTH HAVE EQUAL STRENGTH")

if __name__ == '__main__':
    solve()
