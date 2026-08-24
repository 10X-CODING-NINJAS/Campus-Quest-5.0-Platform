# Web-Fluid Patrol

Spider-Man is preparing for a patrol across N sectors of New York City. Each sector requires a certain amount of web-fluid, and Peter Parker needs to make sure he has enough fluid to complete the entire patrol.

Given N sectors, K units of initial web-fluid, and the web-fluid required for each sector, determine whether Spider-Man can complete the patrol.

If he has enough web-fluid, print `YES` followed by the remaining units. Otherwise, print `NO` followed by the extra units of web-fluid required.

## Input Format

The first line contains two space-separated integers `N` and `K`, representing the number of sectors and initial web-fluid units.
The second line contains `N` space-separated integers representing the web-fluid required for each sector.

## Output Format

Print a single line containing:
* `YES <remaining_fluid>` if Spider-Man has enough fluid.
* `NO <missing_fluid>` otherwise.

## Constraints

* `1 <= N <= 10^5`
* `1 <= K <= 10^9`
* `1 <= A[i] <= 10^4`

## Sample Input 1

```
4 50
10 15 5 10
```

## Sample Output 1

```
YES 10
```

## Explanation 1

Total web-fluid needed = `10 + 15 + 5 + 10 = 40`. Peter has 50 units, so 10 units remain.

## Sample Input 2

```
3 20
10 15 10
```

## Sample Output 2

```
NO 15
```

## Explanation 2

Total web-fluid needed = `10 + 15 + 10 = 35`. Peter has only 20 units, so he needs 15 more units.
