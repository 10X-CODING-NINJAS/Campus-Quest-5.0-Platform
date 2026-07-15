import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] val = new int[n], left = new int[n], right = new int[n];
        for (int i = 0; i < n; i++) {
            val[i] = sc.nextInt();
            left[i] = sc.nextInt() - 1;
            right[i] = sc.nextInt() - 1;
        }
        // Write your solution here
    }
}
