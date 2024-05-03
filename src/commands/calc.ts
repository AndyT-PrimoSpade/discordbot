import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

enum Operator {
  Addition = "+",
  Subtraction = "-",
  Multiplication = "*",
  Division = "/",
  Modulus = "%",
}

const precedence: Record<Operator, number> = {
  [Operator.Addition]: 1,
  [Operator.Subtraction]: 1,
  [Operator.Multiplication]: 2,
  [Operator.Division]: 2,
  [Operator.Modulus]: 2,
};

const isOperator = (char: string): char is Operator => {
  return Object.values(Operator).includes(char as Operator);
};

const tokenize = (expression: string): (string | Operator)[] => {
  const tokens: (string | Operator)[] = [];
  let currentNumber = "";
  let isNegative = false;
  let parenthesesCount = 0;

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    console.log("This is the current character:", char, "\n");
    if (
      char === "-" &&
      (i === 0 || isOperator(expression[i - 1]) || expression[i - 1] === "(")
    ) {
      isNegative = true;
    } else if (isOperator(char)) {
      if (currentNumber !== "") {
        tokens.push(isNegative ? `-${currentNumber}` : currentNumber);
        currentNumber = "";
        isNegative = false;
      }
      if (i === expression.length - 1) {
        throw new Error("Invalid expression format.");
      }
      tokens.push(char as Operator);
    } else if (/\d/.test(char)) {
      currentNumber += char;
    } else if (char === " ") {
      continue;
    } else if (char === "(") {
      console.log("Have found a ( \n");
      parenthesesCount++;
      if (currentNumber !== "") {
        tokens.push(currentNumber);
        currentNumber = "";
      }
      tokens.push(char);
    } else if (char === ")") {
      console.log("Have found a ) \n")
      if (currentNumber !== "") {
        tokens.push(isNegative ? `-${currentNumber}` : currentNumber);
        currentNumber = "";
        isNegative = false;
      }
      if (parenthesesCount === 0) {
        throw new Error("Invalid expression format: Unmatched parentheses.");
      }
      parenthesesCount--;
      tokens.push(char);
    } else {
      throw new Error("Invalid expression format: Unexpected character.");
    }
  }

  if (currentNumber !== "") {
    tokens.push(isNegative ? `-${currentNumber}` : currentNumber);
  }

  if (parenthesesCount !== 0) {
    throw new Error("Invalid expression format: Unmatched parentheses.");
  }

  return tokens;
};

export const calculate = (expression: string): number => {
  if (typeof expression !== "string") {
    throw new Error("Invalid expression: Input must be a string.");
  }

  if (expression.trim() === "") {
    throw new Error("Invalid expression format.");
  }

  const tokens = tokenize(expression);
  const values = [parseFloat(tokens[0] as string)];
  const operators: Operator[] = [];

  if (!isOperator(tokens[1])) {
    throw new Error("Invalid expression format.");
  }

  for (let i = 1; i < tokens.length; i += 2) {
    const char = tokens[i];
    const operator = char as Operator;

    if (i === tokens.length - 1) {
      throw new Error("Invalid expression format.");
    }

    const value = parseFloat(tokens[i + 1] as string);

    if (
      precedence[operator] === precedence[Operator.Multiplication] ||
      precedence[operator] === precedence[Operator.Division]
    ) {
      while (
        operators.length &&
        (precedence[operators[operators.length - 1]] ===
          precedence[Operator.Multiplication] ||
          precedence[operators[operators.length - 1]] ===
          precedence[Operator.Division])
      ) {
        values.push(
          performOperation(operators.pop()!, values.pop()!, values.pop()!)
        );
      }
    }
    operators.push(operator);
    values.push(value);
  }

  while (operators.length) {
    const op = operators.pop()!;
    const a = values.pop()!;
    const b = values.pop()!;
    values.push(performOperation(op, b, a));
  }

  if (values.length !== 1) {
    throw new Error("Invalid expression format.");
  }

  return values[0];
};

const performOperation = (op: Operator, a: number, b: number): number => {
  switch (op) {
    case Operator.Addition:
      return a + b;
    case Operator.Subtraction:
      return a - b;
    case Operator.Multiplication:
      return a * b;
    case Operator.Division:
      if (b === 0) {
        throw new Error("Cannot divide by zero.");
      }
      return a / b;
    case Operator.Modulus:
      return a % b;
  }
};

export const data = new SlashCommandBuilder()
  .setName("calc")
  .setDescription("Perform a simple arithmetic calculation")
  .addStringOption((option) =>
    option
      .setName("expression")
      .setDescription("The mathematical expression to calculate")
      .setRequired(true)
  );

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const expression = interaction.options.getString("expression", true);
  try {
    const result = calculate(expression);
    await interaction.reply(
      `Expression: \\\`${expression}\\\`\nResult: \\\`${result}\\\``
    );
  } catch (error) {
    if (error instanceof Error) {
      await interaction.reply(`Error: ${error.message}`);
    } else {
      await interaction.reply("An unknown error occurred.");
    }
  }
};
