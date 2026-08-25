/**
 * Pool of 36 basic programming questions for first-year students.
 * Each question has exactly one correct answer.
 */
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export const QUESTION_POOL: Question[] = [
  {
    id: 1,
    question: "Peter stores the number of web cartridges in a variable called 'webs'. What is a variable?",
    options: ["A stored value", "A loop", "A compiler", "A comment"],
    correctAnswer: "A stored value"
  },
  {
    id: 2,
    question: "Which keyword/concept is commonly used to store a value that can change?",
    options: ["Variable", "Loop", "Comment", "Compiler"],
    correctAnswer: "Variable"
  },
  {
    id: 3,
    question: "Peter wants to store the name 'Miles'. Which type of data is most appropriate?",
    options: ["String", "Boolean", "Loop", "Array"],
    correctAnswer: "String"
  },
  {
    id: 4,
    question: "Peter wants to store whether his web shooter is ready. Which type of value is most appropriate?",
    options: ["Boolean", "String", "Array", "Function"],
    correctAnswer: "Boolean"
  },
  {
    id: 5,
    question: "What is the purpose of an assignment statement?",
    options: ["To give a value to a variable", "To repeat code", "To stop the computer", "To create a loop"],
    correctAnswer: "To give a value to a variable"
  },
  {
    id: 6,
    question: "Which of these is a valid example of a variable name?",
    options: ["webCount", "web-count", "web count", "5web"],
    correctAnswer: "webCount"
  },
  {
    id: 7,
    question: "Spider-Man checks whether a bridge is safe before crossing. Which programming structure is appropriate?",
    options: ["if", "array", "loop", "comment"],
    correctAnswer: "if"
  },
  {
    id: 8,
    question: "What is the purpose of an 'if' statement?",
    options: ["Make a decision based on a condition", "Store multiple values", "Repeat code automatically", "Create a string"],
    correctAnswer: "Make a decision based on a condition"
  },
  {
    id: 9,
    question: "Peter wants one action when a condition is true and another when it is false. Which structure is appropriate?",
    options: ["if/else", "array", "loop", "variable"],
    correctAnswer: "if/else"
  },
  {
    id: 10,
    question: "Which value represents a true/false condition?",
    options: ["Boolean", "String", "Array", "Integer"],
    correctAnswer: "Boolean"
  },
  {
    id: 11,
    question: "Peter checks whether his web shooter is ready before using it. Which of these is a condition?",
    options: ["webShooterReady == true", "webShooter", "print", "array"],
    correctAnswer: "webShooterReady == true"
  },
  {
    id: 12,
    question: "Which operator is commonly used to check whether two values are equal?",
    options: ["==", "=", "=>", "++"],
    correctAnswer: "=="
  },
  {
    id: 13,
    question: "Which operator means 'not equal'?",
    options: ["!=", "==", "=", ">="],
    correctAnswer: "!="
  },
  {
    id: 14,
    question: "Which operator means 'greater than'?",
    options: [">", "<", "==", "!="],
    correctAnswer: ">"
  },
  {
    id: 15,
    question: "Which operator means 'less than'?",
    options: ["<", ">", "==", "="],
    correctAnswer: "<"
  },
  {
    id: 16,
    question: "Spider-Man wants to repeat the same action several times. What programming structure is commonly used?",
    options: ["Loop", "Variable", "String", "Boolean"],
    correctAnswer: "Loop"
  },
  {
    id: 17,
    question: "Which loop is commonly used when the number of repetitions is known?",
    options: ["for", "if", "switch", "class"],
    correctAnswer: "for"
  },
  {
    id: 18,
    question: "Which loop continues while a condition remains true?",
    options: ["while", "if", "array", "function"],
    correctAnswer: "while"
  },
  {
    id: 19,
    question: "What is the main purpose of a loop?",
    options: ["Repeat instructions", "Store a value", "Store text", "Compare two variables"],
    correctAnswer: "Repeat instructions"
  },
  {
    id: 20,
    question: "Peter wants to keep swinging while his web is attached. Which structure would be appropriate?",
    options: ["while loop", "array", "variable", "string"],
    correctAnswer: "while loop"
  },
  {
    id: 21,
    question: "What happens if a loop's condition never becomes false?",
    options: ["The loop may continue indefinitely", "The program automatically becomes faster", "The computer shuts down", "The variable becomes a string"],
    correctAnswer: "The loop may continue indefinitely"
  },
  {
    id: 22,
    question: "Which of these is commonly associated with repeating code?",
    options: ["for", "if", "boolean", "string"],
    correctAnswer: "for"
  },
  {
    id: 23,
    question: "Peter wants to store the names of several villains in one collection. What could he use?",
    options: ["Array", "Boolean", "if statement", "Loop"],
    correctAnswer: "Array"
  },
  {
    id: 24,
    question: "In many common programming languages, what is the first index of an array?",
    options: ["0", "1", "-1", "10"],
    correctAnswer: "0"
  },
  {
    id: 25,
    question: "An array contains: [Web, Shield, Suit]. Which index refers to 'Web'?",
    options: ["0", "1", "2", "3"],
    correctAnswer: "0"
  },
  {
    id: 26,
    question: "An array contains: [Web, Shield, Suit]. Which index refers to 'Shield'?",
    options: ["0", "1", "2", "3"],
    correctAnswer: "1"
  },
  {
    id: 27,
    question: "What is the main purpose of an array?",
    options: ["Store multiple values in an ordered collection", "Make decisions", "Repeat code", "Compile a program"],
    correctAnswer: "Store multiple values in an ordered collection"
  },
  {
    id: 28,
    question: "Peter has a list of Spider-Drones. Which structure is suitable for storing the list?",
    options: ["Array", "Boolean", "if statement", "comment"],
    correctAnswer: "Array"
  },
  {
    id: 29,
    question: "If an array has 5 elements and indexing starts at 0, what is the index of the last element?",
    options: ["0", "4", "5", "6"],
    correctAnswer: "4"
  },
  {
    id: 30,
    question: "Peter has code that performs the same task whenever he needs it. What should he use?",
    options: ["Function", "Array", "Boolean", "Loop"],
    correctAnswer: "Function"
  },
  {
    id: 31,
    question: "What is the main benefit of a function?",
    options: ["Reuse a piece of code", "Turn numbers into strings", "Automatically fix errors", "Shut down the program"],
    correctAnswer: "Reuse a piece of code"
  },
  {
    id: 32,
    question: "What does a function call do?",
    options: ["Runs the function", "Deletes the function", "Creates a computer", "Stops all loops"],
    correctAnswer: "Runs the function"
  },
  {
    id: 33,
    question: "A function can receive information from the code that calls it. What are these values commonly called?",
    options: ["Arguments", "Loops", "Arrays", "Comments"],
    correctAnswer: "Arguments"
  },
  {
    id: 34,
    question: "What can a function return?",
    options: ["A result/value", "Only a loop", "Only a comment", "Only an array"],
    correctAnswer: "A result/value"
  },
  {
    id: 35,
    question: "Peter wants to store 'Spider-Man'. Which data type is most appropriate?",
    options: ["String", "Boolean", "Array", "Loop"],
    correctAnswer: "String"
  },
  {
    id: 36,
    question: "Consider: name = 'Peter'. What type of value is stored in name?",
    options: ["String", "Boolean", "Array", "Loop"],
    correctAnswer: "String"
  }
];
