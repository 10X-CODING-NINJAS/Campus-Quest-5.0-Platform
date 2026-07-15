#include <stdio.h>
#include <stdlib.h>
int cmp(const void* a, const void* b) { return ((int*)a)[0] - ((int*)b)[0]; }
int main() {
    int n; scanf("%d", &n);
    int intervals[10001][2];
    for (int i = 0; i < n; i++) scanf("%d %d", &intervals[i][0], &intervals[i][1]);
    // Write your solution here
    return 0;
}
