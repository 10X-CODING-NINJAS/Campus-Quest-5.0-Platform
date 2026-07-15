#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<tuple<int,int,int>> nodes(n);
    for (auto& [v,l,r] : nodes) { cin >> v >> l >> r; l--; r--; }
    // Write your solution here
    return 0;
}
