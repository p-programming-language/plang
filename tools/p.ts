import { readFileSync } from "fs";
import util from "util";
import "colors.ts";

import type { ValueType } from "../src/code-analysis/type-checker";
import type { BoundStatement } from "../src/code-analysis/binder/bound-node";
import type { Parser } from "../src/code-analysis/parser";
import type AST from "../src/code-analysis/parser/ast";
import Packager from "../src/code-analysis/packager";
import PValue from "../src/runtime/values/value";
import PHost from "./p-host";
import REPL from "./repl";
import pkg = require("../package.json");

interface PExecutionOptions {
  outputTokens: boolean;
  outputAST: boolean;
  outputBoundAST: boolean;
  outputResult: boolean;
}

export default class P {
  private readonly hosts: PHost[] = [];
  public readonly packager = new Packager;
  public readonly repl = new REPL(this);
  public readonly version = "v" + pkg.version;
  public readonly executionOptions: PExecutionOptions = {
    outputTokens: false,
    outputAST: false,
    outputBoundAST: false,
    outputResult: false
  };

  public constructor(
    private readonly fileName?: string
  ) {
    this.hosts.push(new PHost(this, fileName));
  }

  public doString(source: string, args: string[] = []): ValueType {
    if (!this.host.interpreter.definedArgv)
      this.host.interpreter.defineArgv(args);

    const parser = this.createParser(source);
    if (this.executionOptions.outputTokens)
      console.log(parser.input!.toString());

    const { packageDeclaration, imports, program: ast } = parser.parse();
    if (this.executionOptions.outputAST)
      console.log((<AST.Statement[]>imports).concat(...ast).toString());

    this.host.resolver.resolve(imports);
    const boundImports = this.host.binder.bindStatements(imports);
    this.host.typeChecker.check(boundImports);
    this.host.interpreter.evaluate(imports);

    if (packageDeclaration)
      this.host.resolver.resolve(packageDeclaration);

    this.host.resolver.resolve(ast);
    if (packageDeclaration) {
      this.packager.define(packageDeclaration.name.lexeme, this.host.interpreter.fileName);
      const [boundDeclaration] = this.host.binder.bindStatements([packageDeclaration]);
      this.host.typeChecker.check(boundDeclaration);
    }

    const boundAST = this.host.binder.bindStatements(ast);
    if (this.executionOptions.outputBoundAST)
      console.log((<BoundStatement[]>boundImports).concat(...boundAST).toString());

    this.host.typeChecker.check(boundAST);
    if (packageDeclaration)
      this.host.interpreter.evaluate(packageDeclaration);

    const result = this.host.interpreter.evaluate(ast);
    if (this.executionOptions.outputResult) {
      const stringified = result instanceof PValue ?
        result.toString()
        : util.inspect(result, { colors: true });

      console.log("↳".gray(8), stringified);
    }

    return result;
  }

  public doFile(filePath: string, args: string[] = []): ValueType {
    const fileContents = readFileSync(filePath, "utf-8");
    const result = this.doString(fileContents, args);
    this.newHost(filePath);
    return result;
  }

  public createParser(source: string): Parser {
    return this.host.createParser(source);
  }

  public newHost(fileName?: string): void {
    this.hosts.push(new PHost(this, fileName ?? this.fileName));
  }

  public get host(): PHost {
    return this.hosts.at(-1)!;
  }
}