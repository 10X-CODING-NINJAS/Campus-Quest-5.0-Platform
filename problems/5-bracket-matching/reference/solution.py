s = input().strip()
stack = []
match = {')': '(', ']': '[', '}': '{'}
for c in s:
    if c in '([{':
        stack.append(c)
    elif c in ')]}':
        if not stack or stack[-1] != match[c]:
            print("INVALID")
            exit()
        stack.pop()
print("VALID" if not stack else "INVALID")
