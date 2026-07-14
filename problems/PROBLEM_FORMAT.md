# Problem Creation Format Guide

Welcome! This guide outlines the required directory structure and file format for creating new coding problems for the **Campus Quest 5.0 Platform**. 

Each problem must be contained in its own folder under the `/problems` directory. Please follow this format precisely so the platform's automatic problem loader can parse, validate, and host your question correctly.

---

## 📁 Directory Structure Overview

Every problem folder must be named using a URL-safe unique ID (typically `[number]-[slug]`, e.g., `1-web-anchor`). Inside that folder, the structure must look like this:

```text
problems/
└── <problem-id>/                 # e.g., "1-web-anchor" (use lowercase, numbers, and hyphens)
    ├── problem.json              # Metadata configurations (limits, checker, etc.)
    ├── statement.md              # Markdown containing the problem description
    ├── starter/                  # Starter code templates for competitors
    │   ├── c.c
    │   ├── cpp.cpp
    │   ├── java.java
    │   └── python.py
    ├── samples/                  # Public sample test cases (shown in description)
    │   ├── 1.in
    │   ├── 1.out
    │   ├── 2.in
    │   └── 2.out
    ├── hidden/                   # Hidden evaluation test cases (used for grading)
    │   ├── 1.in
    │   ├── 1.out
    │   ├── 2.in
    │   └── 2.out
    └── reference/                # Reference working solutions
        └── solution.py           # Can be solution.py, solution.cpp, solution.java, or solution.c
```

---

## 📄 File Details and Formats

### 1. `problem.json` (Metadata Configuration)
This file defines key settings, execution resource limits, and behaviors.

```json
{
  "id": "1-web-anchor",
  "title": "Web Anchor Synchronization",
  "difficulty": "Easy",
  "timeLimit": 2000,
  "memoryLimit": 256,
  "supportedLanguages": [
    "c",
    "cpp",
    "java",
    "python"
  ],
  "checkerType": "default",
  "order": 1
}
```

#### Fields Description:
- **`id`** *(string, required)*: Unique string identifier, must match the folder name exactly.
- **`title`** *(string, required)*: The title of the problem shown to users.
- **`difficulty`** *(string, required)*: Must be one of: `"Easy"` | `"Medium"` | `"Hard"`.
- **`timeLimit`** *(number, required)*: The execution time limit for user submissions in **milliseconds** (e.g., `2000` for 2 seconds).
- **`memoryLimit`** *(number, required)*: The memory limit in **MB** (e.g., `256` for 256 Megabytes).
- **`supportedLanguages`** *(array of strings)*: Allowed programming language identifiers. Options: `"c"`, `"cpp"`, `"java"`, `"python"`.
- **`checkerType`** *(string, required)*: How user outputs are compared to the reference outputs:
  - `"default"`: Standard exact token-by-token matching, ignoring extra whitespace/newlines.
  - `"float"`: Float comparisons (allows small tolerance).
  - `"unordered"`: Order-independent comparison (for sets/list matching).
  - `"case-insensitive"`: Case-insensitive string comparison.
  - `"custom"`: Programmatic checker.
- **`order`** *(number, optional)*: Ordering/index of the problem on the dashboard.

---

### 2. `statement.md` (Problem Description)
A standard markdown file outlining the problem statement. Ensure clear sections for description, input format, and output format.

```markdown
### Web Anchor Synchronization

Spider-Man needs to synchronize two dimensional anchors in the Web of Life and Destiny to stabilize the portal.

You are given an array of integers representing the signal frequencies of active anchors, and a target frequency. Find **two indices** of the anchors whose frequencies sum up to the target frequency.

Return the two indices (0-indexed) in any order. You may assume that each input has exactly one solution, and you cannot use the same anchor twice.

#### Input Format
- First line contains two integers: $N$ (number of anchors) and $Target$.
- Second line contains $N$ space-separated integers representing the anchor frequencies.

#### Output Format
- Two space-separated integers representing the indices.
```

---

### 3. `starter/` Directory (Boilerplate Templates)
This directory should contain boilerplate code templates that competitor contestants will start with. Competitors generally read input from standard input (`stdin`) and write output to standard output (`stdout`).

#### Python template (`starter/python.py`):
```python
import sys
input = sys.stdin.readline

def solve():
    n, target = map(int, input().split())
    nums = list(map(int, input().split()))
    
    # TODO: Find two indices i, j such that nums[i] + nums[j] == target
    # Print i and j (0-indexed, separated by space)
    pass

solve()
```

#### C++ template (`starter/cpp.cpp`):
```cpp
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n, target;
    if (!(cin >> n >> target)) return 0;
    
    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    
    // TODO: Solve and output indices
    
    return 0;
}
```

---

### 4. `samples/` and `hidden/` Directories (Test Cases)
Test cases are stored as paired `.in` (input) and `.out` (expected output) files. 

- **`samples/`**: Sample test cases shown directly to users inside the problem description for testing. Keep these simple and explanatory.
- **`hidden/`**: Hidden test cases used to evaluate submissions. Make sure to cover edge cases, large bounds, empty arrays, limits, and random tests.

#### Requirements:
- File naming must be numerical (e.g. `1.in`/`1.out`, `2.in`/`2.out`, etc.).
- There must be a matching `.out` file for every `.in` file.
- The input/output sizes must be within limits.

---

### 5. `reference/` Directory (Solution)
Include at least one complete working solution that passes all test cases (samples and hidden). The judge system uses the reference directory to double-check output consistency and benchmark the performance under the defined time limits.
- Valid names: `solution.py`, `solution.cpp`, `solution.java`, or `solution.c`.

---

## 🚀 Checklist for Members
Before submitting a new problem directory, verify that:
1. [ ] Folder name matches `problem.json` ID.
2. [ ] All JSON attributes (`timeLimit`, `memoryLimit`, `checkerType`) are populated correctly.
3. [ ] `statement.md` clearly explains inputs, outputs, and constraints.
4. [ ] Starter files read correctly from standard input.
5. [ ] Sample inputs exactly match their corresponding output files.
6. [ ] Hidden inputs cover all edge cases and boundary limits.
7. [ ] Reference solution is fully correct and runs within limits.
