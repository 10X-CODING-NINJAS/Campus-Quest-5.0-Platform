#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, target;
    scanf("%d %d", &n, &target);
    
    int *nums = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    
    // TODO: Find two indices i, j such that nums[i] + nums[j] == target
    // Print i and j (0-indexed, separated by space)
    
    free(nums);
    return 0;
}
