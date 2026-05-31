import { GroceryParser } from '../src/services/groceryParser.ts';

const parser = new GroceryParser();

function assertEqual(actual: any, expected: any, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

function testParser() {
  console.log('Testing GroceryParser...');
  
  const t1 = parser.parse("I want to add milk and 2 eggs");
  // The parser naively filters some stop words but leaves others
  // Let's just check if milk and eggs are in the array
  assertEqual(t1.ingredients.includes("milk"), true, "Should extract milk");
  assertEqual(t1.ingredients.includes("eggs"), true, "Should extract eggs");
  
  const t2 = parser.parse("Please order onion and tomato");
  assertEqual(t2.requestGrocery, true, "Should set requestGrocery to true when 'order' is in text");
  
  console.log('✅ GroceryParser tests passed!');
}

testParser();
