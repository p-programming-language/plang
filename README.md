# Plang
The P programming language

![Last Commit](https://img.shields.io/github/last-commit/p-programming-language/plang)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/p-programming-language/plang)
![GitHub top language](https://img.shields.io/github/languages/top/p-programming-language/plang)
![npm](https://img.shields.io/npm/dt/%40p-lang/plang)


![license](https://img.shields.io/github/license/p-programming-language/plang)

[![testing](https://github.com/KevinAlavik/plang/actions/workflows/test.yml/badge.svg)](https://github.com/KevinAlavik/plang/actions/workflows/test.yml)
[![njsscan sarif](https://github.com/p-programming-language/plang/actions/workflows/njsscan.yml/badge.svg)](https://github.com/p-programming-language/plang/actions/workflows/njsscan.yml)

## Why?
becuz im bored

## Examples
Check out **[examples/](https://github.com/p-programming-language/plang/tree/main/examples)** for some examples.

## Tools
- pint
    - The P interpreter CLI
- repl
    - A read-eval-print loop to run P interactively inside of your terminal
- ast-viewer
    - This is an interactive terminal where you can inspect the AST or bound AST of a provided source code node-by-node

### Developer only tools
- test
    - Runs unit tests

## Installation
### NPM:
```bash
npm i -g @p-lang/plang
``` 
**Then you can access our [tools](https://github.com/p-programming-language/plang?tab=readme-ov-file#tools) using:**
```bash
npm run <tool>
```
or:
```bash
yarn run <tool>
```

## Current Features
- Type analysis & hoisting before parsing
- Tokenizing:
    - Number literals (int, float)
    - String literals, supports both single and double quotes
    - Boolean literals
    - Identifiers
    - Keywords
    - Symbols (`+`, `-`, etc.)
    - Comments (`## single line`, `##: multi line :##`)
- Parsing + Binding + Type checking + Interpreting:
    - Literals
        - Basics (numbers, strings, booleans)
        - String interpolations
        - Ranges
        - Array literals/types
        - Object literals/types
    - Array/object indexing
    - Binary expressions (including compound assignment, `is`, `is in`, etc.)
    - Unary expressions (including `++`, `--`, `#`, `typeof`, etc.)
    - Variable declarations (mutability optional)
    - Variable assignment (`:=` and `=` operators)
    - Property assignment
    - Function declarations and calls

## Planned Features
- Type guards (`value is T`, `T extends U`, `asserts T`, `T extends U ? V : Q`)
- Intrinsic types
- Spread types
- Parenthesized types
- Type casting (`value as T`)
- Throw statement
- Switch statement
- Classes (in progress)
