import { Tokenizer, TokenManager } from "./fe/tokenizer";
import { Parser } from "./fe/parser";
import { Runner } from "./be/runner";

// Test program
const code = `
  x = 10;
  y = 20;
  sum = x + y;
  print("Sum is", sum);
  
  if (sum > 25) {
    print("Big number!");
  } else {
    print("Small number!");
  }
  
  i = 0;
  while (i < 3) {
    print("Loop:", i);
    i = i + 1;
  }

  fn add(a,b){
    return a+b;
  }
  z=add(3,4);
  print("The fucntion call sum is ",z);
`;

// Tokenize
const tokenizer = new Tokenizer(code);
const tokens = tokenizer.tokenize();

// // Print tokens for debugging
// console.log("=== TOKENS ===");
// tokens.forEach(t => console.log(`${t.type}: ${(t as any).val ?? ''}`));

const tokenManager = new TokenManager(tokens);

// Parse
const parser = new Parser(tokenManager);
const ast = parser.parse();

// Run
const runner = new Runner();
runner.run(ast);

// Show output
console.log("=== OUTPUT ===");
runner.printed.forEach(line => console.log(line));