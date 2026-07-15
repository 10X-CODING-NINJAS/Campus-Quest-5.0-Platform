#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, target;
    if (scanf("%d %d", &n, &target) != 2) return 0;
    
    int* nums = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &nums[i]);
    }
    
    // Write your solution here
    
    free(nums);
    return 0;
}
