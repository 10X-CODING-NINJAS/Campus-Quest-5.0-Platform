# Validate BST

A Binary Search Tree (BST) is a binary tree where for every node:
- All values in its left subtree are **strictly less** than the node value.
- All values in its right subtree are **strictly greater** than the node value.

You are given a binary tree as a list of nodes. Node 1 is the root. Each node has a value, a left child index, and a right child index (0 = no child).

Determine if this tree is a valid BST.

## Input Format

* First line: N (number of nodes)
* Next N lines: three integers — value, left_child, right_child (1-indexed; 0 means none)

## Output Format

* Print `YES` if valid BST, `NO` otherwise.

## Constraints

* `1 <= N <= 10^4`
* `-10^9 <= values <= 10^9`

## Sample Input 1

```
3
5 2 3
3 0 0
7 0 0
```

## Sample Output 1

```
YES
```

## Sample Input 2

```
3
5 2 3
6 0 0
7 0 0
```

## Sample Output 2

```
NO
```
