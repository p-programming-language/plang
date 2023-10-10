import { spawnSync } from "child_process";
import { statSync } from "fs";
import { platform } from "os";

import type { ClassMemberSignature, IndexType, InterfaceMemberSignature, ValueType } from "./code-analysis/type-checker";
import type { Type } from "./code-analysis/type-checker/types/type";
import { BindingError } from "./errors";
import { LocationSpan, Location, Token } from "./code-analysis/tokenization/token";
import { SingularTypeExpression } from "./code-analysis/parser/ast/type-nodes/singular-type";
import { LiteralTypeExpression } from "./code-analysis/parser/ast/type-nodes/literal-type";
import { UnionTypeExpression } from "./code-analysis/parser/ast/type-nodes/union-type";
import { ArrayTypeExpression } from "./code-analysis/parser/ast/type-nodes/array-type";
import { FunctionTypeExpression } from "./code-analysis/parser/ast/type-nodes/function-type";
import { InterfaceTypeExpression } from "./code-analysis/parser/ast/type-nodes/interface-type";
import type Syntax from "./code-analysis/tokenization/syntax-type";
import type AST from "./code-analysis/parser/ast";
import ArrayType from "./code-analysis/type-checker/types/array-type";
import LiteralType from "./code-analysis/type-checker/types/literal-type";
import SingularType from "./code-analysis/type-checker/types/singular-type";
import UnionType from "./code-analysis/type-checker/types/union-type";
import FunctionType from "./code-analysis/type-checker/types/function-type";
import InterfaceType from "./code-analysis/type-checker/types/interface-type";
import { ClassTypeExpression } from "./code-analysis/parser/ast/type-nodes/class-type";
import ClassType from "./code-analysis/type-checker/types/class-type";
import TypeTracker from "./code-analysis/parser/type-tracker";

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

export function getTypeFromTypeRef<T extends Type = Type>(typeTracker: TypeTracker, node: AST.TypeRef): T {
  if (node instanceof FunctionTypeExpression)
    return <T><unknown>new FunctionType(
      new Map(Array.from(node.parameterTypes.entries()).map(([name, type]) => [name, getTypeFromTypeRef(typeTracker, type)])),
      getTypeFromTypeRef(typeTracker, node.returnType)
    );
  else if (node instanceof ArrayTypeExpression)
    return <T><unknown>new ArrayType(getTypeFromTypeRef(typeTracker, node.elementType));
  else if (node instanceof LiteralTypeExpression)
    return <T><unknown>new LiteralType(node.literalToken.value);
  else if (node instanceof SingularTypeExpression)
    return <T><unknown>new SingularType(node.token.lexeme, node.typeArguments?.map(arg => getTypeFromTypeRef(typeTracker, arg)));
  else if (node instanceof UnionTypeExpression)
    return <T><unknown>new UnionType(node.types.map(singular => getTypeFromTypeRef<SingularType>(typeTracker, singular)));
  else if (node instanceof InterfaceTypeExpression) {
    const members = new Map<LiteralType<string>, InterfaceMemberSignature<Type>>();
    const indexSignatures = new Map<IndexType, Type>();
    for (const [key, { mutable, valueType }] of node.members)
      members.set(new LiteralType(key.token.value), {
        valueType: getTypeFromTypeRef(typeTracker, valueType),
        mutable
      });

    for (const [keyType, valueType] of node.indexSignatures)
      indexSignatures.set(getTypeFromTypeRef<IndexType>(typeTracker, keyType), getTypeFromTypeRef(typeTracker, valueType))

    return <T><unknown>new InterfaceType(members, indexSignatures, node.name.lexeme);
  } else if (node instanceof ClassTypeExpression) {
    const members = new Map<LiteralType<string>, ClassMemberSignature<Type>>();
    for (const [key, { modifiers, mutable, valueType }] of node.members)
      members.set(new LiteralType(key), {
        valueType: getTypeFromTypeRef(typeTracker, valueType),
        modifiers, mutable
      });

    const mixinTypes = node.mixinTypes
      .map(typeIdent => typeTracker.getRef(typeIdent.name.lexeme))
      .filter((typeRef): typeRef is AST.TypeRef => typeRef !== undefined)
      .map(typeRef => getTypeFromTypeRef(typeTracker, typeRef));

    const superclassTypeRef = node.superclassType ? typeTracker.getRef(node.superclassType.name.lexeme) : undefined;
    const superclassType = superclassTypeRef ? getTypeFromTypeRef(typeTracker, superclassTypeRef) : undefined;
    return <T><unknown>new ClassType(node.name.lexeme, members, mixinTypes, superclassType);
  }

  throw new BindingError(`(BUG) Unhandled type expression: ${node}`, node.token);
}

export function optional(type: SingularType): UnionType {
  return new UnionType([ type, new SingularType("undefined") ]);
}