# Web-Shooter Calibration

Spider-Man is manually tweaking the pressure valves on his mechanical web-shooters after a fight with the Vulture. He has recorded the pressure outputs of various test web-blasts in an array, but the data is completely scrambled.

To properly calibrate the shooters, the pressure values must be arranged in ascending order so that the suit's diagnostic system can process them correctly.

Given an array of integer pressure values, sort them from lowest to highest.

*Note: The use of any inbuilt sorting functions such as sort(), sorted(), or Arrays.sort() is strictly prohibited. You must implement your own sorting logic from scratch.*

## Input Format

The first line contains a single integer `N`, representing the number of test web-blasts.
The second line contains `N` space-separated integers, representing the recorded pressure values.

## Output Format

Print a single line containing the `N` sorted pressure values separated by spaces, arranged from lowest to highest.

## Constraints

* `1 <= N <= 1000`
* `-10^6 <= A[i] <= 10^6`

## Sample Input 1

```
6
85 12 -5 59 45 72
```

## Sample Output 1

```
-5 12 45 59 72 85
```

## Explanation 1

The recorded pressure values are reorganized from lowest to highest using a manually implemented sorting method.

## Sample Input 2

```
5
30 -10 25 0 15
```

## Sample Output 2

```
-10 0 15 25 30
```

## Explanation 2

The pressure values are arranged in ascending order.
