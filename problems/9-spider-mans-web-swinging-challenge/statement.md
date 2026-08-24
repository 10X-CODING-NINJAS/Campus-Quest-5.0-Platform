# Spider-Man's Web-Swinging Challenge

Spider-Man wants to swing across N buildings in New York. Each building has a different height, and his web-shooter can help him reach up to 20 meters above each building.

However, Spider-Man cannot reach a height greater than 150 meters.

Given the height of each building, calculate the maximum height Spider-Man can reach for every building. If the calculated height is more than 150 meters, use 150 meters instead.

## Input Format

The first line contains a single integer `N`, representing the number of buildings.
The second line contains `N` space-separated integers, representing the heights of the buildings.

## Output Format

Print a single line containing the resulting array of maximum heights Spider-Man can reach for each building.

## Constraints

* `1 <= N <= 100`
* `1 <= Height of each building <= 150`

## Sample Input 1

```
4
50 80 140 120
```

## Sample Output 1

```
70 100 150 140
```

## Explanation 1

For each building, Spider-Man can reach 20 meters above its height, up to a maximum allowed height of 150 meters.
Building 1: `50 + 20 = 70`
Building 2: `80 + 20 = 100`
Building 3: `140 + 20 = 160`, capped at 150
Building 4: `120 + 20 = 140`

## Sample Input 2

```
3
100 130 150
```

## Sample Output 2

```
120 150 150
```

## Explanation 2

Building 1: `100 + 20 = 120`
Building 2: `130 + 20 = 150`
Building 3: `150 + 20 = 170`, capped at 150
