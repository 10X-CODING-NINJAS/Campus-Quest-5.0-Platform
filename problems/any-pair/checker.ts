import fs from 'fs';

function main() {
  try {
    const inputPath = process.argv[2];
    const _expectedPath = process.argv[3];
    const actualPath = process.argv[4];

    if (!inputPath || !actualPath) {
      console.log("Wrong Answer: Missing input or output file path");
      process.exit(1);
    }

    const inputData = fs.readFileSync(inputPath, 'utf-8').trim().split(/\s+/);
    if (inputData.length < 2) {
      console.log("Wrong Answer: Invalid input format");
      process.exit(1);
    }

    const n = parseInt(inputData[0]);
    const target = parseInt(inputData[1]);
    const nums: number[] = [];
    for (let i = 0; i < n; i++) {
      nums.push(parseInt(inputData[2 + i]));
    }

    const actualData = fs.readFileSync(actualPath, 'utf-8').trim().split(/\s+/);
    if (actualData.length !== 2) {
      console.log(`Wrong Answer: Expected 2 integers, got ${actualData.length} tokens`);
      process.exit(1);
    }

    const idx1 = parseInt(actualData[0]);
    const idx2 = parseInt(actualData[1]);

    if (isNaN(idx1) || isNaN(idx2)) {
      console.log("Wrong Answer: Non-integer output");
      process.exit(1);
    }

    if (idx1 < 0 || idx1 >= n || idx2 < 0 || idx2 >= n) {
      console.log(`Wrong Answer: Indices out of bounds (0 to ${n-1})`);
      process.exit(1);
    }

    if (idx1 === idx2) {
      console.log("Wrong Answer: Indices must be distinct");
      process.exit(1);
    }

    const sum = nums[idx1] + nums[idx2];
    if (sum !== target) {
      console.log(`Wrong Answer: nums[${idx1}] + nums[${idx2}] = ${nums[idx1]} + ${nums[idx2]} = ${sum}, but target = ${target}`);
      process.exit(1);
    }

    console.log("Accepted");
    process.exit(0);
  } catch (err: any) {
    console.log("Wrong Answer: Error running custom checker: " + err.message);
    process.exit(1);
  }
}

main();
