# Contribute
Feel free to contribute! We greatly appreciate it!
## Commit Name
This can be anything as long as it is clear what the commit chnaged.

Examples:
- `fix: Fixed issue #12 (Fixed compiler issue)`
- `feat: create os() intrinsic function`
## Docs/Guides
We currently don't have any documentation or guides for P. Feel free to create some yourself using the **docs/** folder!

## Project Hierarchy Guide
### src/
#### Files
- code-analysis/
    - parser/
        * This is where all parsing code resides
        - ast/
            - expressions/
                * This is where all expression node classes are stored.
            - statements/
                * This is where all statement node classes are stored.
            - type-nodes/
                * This is where all type reference node classes are stored.
    - tokenization/
        * This is where anything to do with tokenization resides. This includes the lexer, keywords, syntax types, etc.
    - resolver.ts
        * This is P's resolver. It assures variables are being used and referenced properly.
    - type-checker/
        * This is where all type checking code resides.
        - types/
            * This is where all of the type constructs recognized by the type checker and created by the binder are stored.
        - binder/
            * This is where all binding code resides.
            - bound-expressions/
                * This is where all bound expression node classes are stored.
            - bound-statements/
                * This is where all bound statement node classes are stored.
            - bound-operators/
                * This is where binary/unary expression operand types are evaluated.
- runtime/
    * This is where all runtime code resides. This includes the interpreter, and all runtime types that the interpreter may use.
    - values/
        * This is where custom value constructs are stored, such as functions, classes, intrinsic constructs, etc.
    - intrinsics/
        * This is where all intrinsic functions and libraries are defined.
        - index.ts
            * This is where added functions/libraries are defined in the scope. Every time you create a new intrinsic function/library you will need to define it here.

- utility.ts
    - This is where the utilities used by the **tools/** reside.
- errors.ts
    - This is where error handling and logging code resides.
- main.ts
    - This is a placeholder for testing as of right now.

### tools/
#### Adding tools
When adding a public tool (used by **npm** or **yarn** or any other JS runtime), you create a file in **tools/**. Please make sure to name the file the exact name of your tool. You will then need to add it to the `scripts` field in the `package.json` as well as the `bin` field.json

When adding a private tool: Do everything the same, but don't add it to `package.json`

**If the tool has like a category like `unit-tests`, create a folder for it.**
#### Files
- pint.ts
    - This is the CLI for the P Interpreter (PInt).
    - Info:
        - Name: pint
- repl.ts
    - This is an interactive terminal where you can run P line by line.
    - Info:
        - Name: prepl
- ast-viewer.ts
    - This is an interactive terminal where you can inspect the AST node-by-node.
    - Info:
        - Name: ast-viewer
- p.ts
    - This is a tool used to execute a P string or file, or start a REPL. Used by `pint` and `prepl`.
- unit-tests/
    - This is where all unit tests reside (via mocha). These tests assure that each aspect of the lexer, parser, binder, resolver, type checker, and interpreter works as expected.

### tests/
Here are simple example files written in P that are executed during unit tests. When writing new examples, keep in mind that if any element of P errors during execution, unit tests will fail.