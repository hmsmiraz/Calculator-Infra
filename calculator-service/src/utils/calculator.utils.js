const add      = (a, b) => ({ result: a + b, expression: `${a} + ${b} = ${a + b}`,     operation: 'addition'       });
const subtract = (a, b) => ({ result: a - b, expression: `${a} - ${b} = ${a - b}`,     operation: 'subtraction'    });
const multiply = (a, b) => ({ result: a * b, expression: `${a} × ${b} = ${a * b}`,     operation: 'multiplication' });
const divide   = (a, b) => {
  if (b === 0) throw new Error('Division by zero is not allowed');
  return { result: a / b, expression: `${a} ÷ ${b} = ${a / b}`, operation: 'division' };
};

const calculate = (a, b, operator) => {
  switch (operator) {
    case '+': return add(a, b);
    case '-': return subtract(a, b);
    case '*': return multiply(a, b);
    case '/': return divide(a, b);
    default:  throw new Error(`Unsupported operator: ${operator}`);
  }
};

module.exports = { calculate };
