#include <stdio.h>
int main() {
    int n; scanf("%d", &n);
    int val[10001], left[10001], right[10001];
    for (int i = 0; i < n; i++) {
        scanf("%d %d %d", &val[i], &left[i], &right[i]);
        left[i]--; right[i]--;
    }
    // Write your solution here
    return 0;
}
