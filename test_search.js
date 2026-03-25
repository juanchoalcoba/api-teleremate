const { getAccentInsensitiveRegex } = require("./src/utils/searchUtils");

const testCases = [
  { input: "camara", match: "cámara", shouldMatch: true },
  { input: "CÁMARA", match: "camara", shouldMatch: true },
  { input: "sillón", match: "sillon", shouldMatch: true },
  { input: "Mesa de luz", match: "Mesa DE Luz", shouldMatch: true },
];

console.log("--- Testing getAccentInsensitiveRegex ---");

testCases.forEach(({ input, match, shouldMatch }) => {
  const pattern = getAccentInsensitiveRegex(input);
  const regex = new RegExp(pattern, "i");
  const isMatch = regex.test(match);
  
  console.log(`Input: "${input}" -> Pattern: /${pattern}/i`);
  console.log(`Testing against: "${match}" -> Result: ${isMatch} (Expected: ${shouldMatch})`);
  console.log(isMatch === shouldMatch ? "✅ PASS" : "❌ FAIL");
  console.log("------------------------------------------");
});
