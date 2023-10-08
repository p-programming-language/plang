import { platform } from "os";
import { spawnSync } from "child_process";

import { BindingError } from "./errors";
import { LocationSpan, Location, Token } from "./code-analysis/tokenization/token";
import { SingularTypeExpression } from "./code-analysis/parser/ast/type-nodes/singular-type";
import { LiteralTypeExpression } from "./code-analysis/parser/ast/type-nodes/literal-type";
import { UnionTypeExpression } from "./code-analysis/parser/ast/type-nodes/union-type";
import { ArrayTypeExpression } from "./code-analysis/parser/ast/type-nodes/array-type";
import { InterfaceTypeExpression } from "./code-analysis/parser/ast/type-nodes/interface-type";
import type { IndexType, InterfacePropertySignature, ValueType } from "./code-analysis/type-checker";
import type { Type } from "./code-analysis/type-checker/types/type";
import type Syntax from "./code-analysis/tokenization/syntax-type";
import type AST from "./code-analysis/parser/ast";
import ArrayType from "./code-analysis/type-checker/types/array-type";
import LiteralType from "./code-analysis/type-checker/types/literal-type";
import SingularType from "./code-analysis/type-checker/types/singular-type";
import UnionType from "./code-analysis/type-checker/types/union-type";
import InterfaceType from "./code-analysis/type-checker/types/interface-type";
import { FunctionTypeExpression } from "./code-analysis/parser/ast/type-nodes/function-type";
import FunctionType from "./code-analysis/type-checker/types/function-type";
import { statSync } from "fs";

export function clearTerminal(): void {
  const os = platform();

  if (os === "win32")
    spawnSync("cmd", ["/c", "cls"], { stdio: "inherit" });
  else
    spawnSync("clear", [], { stdio: "inherit" });
}

export function fileExists(path: string) {
  try {
    const stats = statSync(path);
    return stats.isFile() || stats.isDirectory();
  } catch(e) {
    return false;
  }
}

export function isDirectory(path: string) {
  return fileExists(path) && statSync(path).isDirectory();
}

export function fakeToken<V extends ValueType = ValueType, S extends Syntax = Syntax>(syntax: S, lexeme: string, value?: V): Token<V, S> {
  const pseudoLocation = new LocationSpan(new Location(-1, -1), new Location(-1, -1));
  return new Token<V, S>(syntax, lexeme, <V>value, pseudoLocation);
}

export function generateAddress() {
  return `0x${Math.random().toString(16).slice(2, 12)}`;
}

export function getTypeFromTypeRef<T extends Type = Type>(node: AST.TypeRef): T {
  if (node instanceof FunctionTypeExpression)
    return <T><unknown>new FunctionType(
      new Map(Array.from(node.parameterTypes.entries()).map(([name, type]) => [name, getTypeFromTypeRef(type)])),
      getTypeFromTypeRef(node.returnType)
    );
  else if (node instanceof ArrayTypeExpression)
    return <T><unknown>new ArrayType(getTypeFromTypeRef(node.elementType));
  else if (node instanceof LiteralTypeExpression)
    return <T><unknown>new LiteralType(node.literalToken.value);
  else if (node instanceof SingularTypeExpression)
    return <T><unknown>new SingularType(node.token.lexeme, node.typeArguments?.map(arg => getTypeFromTypeRef(arg)));
  else if (node instanceof UnionTypeExpression)
    return <T><unknown>new UnionType(node.types.map(singular => getTypeFromTypeRef<SingularType>(singular)));
  else if (node instanceof InterfaceTypeExpression) {
    const properties = new Map<LiteralType<string>, InterfacePropertySignature<Type>>();
    const indexSignatures = new Map<IndexType, Type>();
    for (const [key, { mutable, valueType }] of node.properties)
      properties.set(new LiteralType(key.token.value), {
        valueType: getTypeFromTypeRef(valueType),
        mutable
      });

    for (const [keyType, valueType] of node.indexSignatures)
      indexSignatures.set(getTypeFromTypeRef<IndexType>(keyType), getTypeFromTypeRef(valueType))

    return <T><unknown>new InterfaceType(properties, indexSignatures, node.name.lexeme);
  }

  throw new BindingError(`(BUG) Unhandled type expression: ${node}`, node.token);
}