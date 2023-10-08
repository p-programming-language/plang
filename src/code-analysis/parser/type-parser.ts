import { ParserSyntaxError } from "../../errors";
import { fakeToken } from "../../utility";

import type { Token } from "../tokenization/token";
import type { InterfacePropertySignature, TypeLiteralValueType, TypeNameSyntax } from "../type-checker";
import { LiteralExpression } from "./ast/expressions/literal";
import { SingularTypeExpression } from "./ast/type-nodes/singular-type";
import { LiteralTypeExpression } from "./ast/type-nodes/literal-type";
import { UnionTypeExpression } from "./ast/type-nodes/union-type";
import { ArrayTypeExpression } from "./ast/type-nodes/array-type";
import { InterfaceTypeExpression } from "./ast/type-nodes/interface-type";
import { FunctionTypeExpression } from "./ast/type-nodes/function-type";
import type TypeAnalyzer from "./type-analyzer";
import type AST from "./ast";
import TokenStepper from "./token-stepper";
import Syntax from "../tokenization/syntax-type";

export default abstract class TypeParser extends TokenStepper {
  protected abstract readonly typeAnalyzer: TypeAnalyzer;

  protected parseTypeAlias(): [Token<undefined, Syntax.Identifier>, AST.TypeRef] {
    this.consume<undefined>(Syntax.Identifier, "'type' keyword");
    const identifier = this.consume<undefined, Syntax.Identifier>(Syntax.Identifier, "identifier");
    this.consume(Syntax.Equal, "'='");
    const aliasedType = this.parseType();
    return [identifier, aliasedType];
  }

  /**
   * This has no precedence, since it's a declaration
   *
   * This is the reason it's not grouped with the below methods.
   */
  protected parseInterfaceType(): InterfaceTypeExpression {
    const name = this.consume<undefined>(Syntax.Identifier);
    this.consume<undefined>(Syntax.LBrace, "'{'");
    const properties = new Map<LiteralExpression<string, Syntax>, InterfacePropertySignature<AST.TypeRef>>();
    const indexSignatures = new Map<AST.TypeRef, AST.TypeRef>();

    if (!this.match(Syntax.RBrace)) {
      const contents = this.parseInterfaceContents();
      for (const [key, prop] of contents)
        if (key instanceof LiteralExpression)
          properties.set(key, prop);
        else
          indexSignatures.set(key, prop.valueType);

      this.consume<undefined>(Syntax.RBrace, "'}'");
    }

    return new InterfaceTypeExpression(name, properties, indexSignatures);
  }

  protected parseInterfaceContents(): Map<LiteralExpression<string, Syntax> | AST.TypeRef, InterfacePropertySignature<AST.TypeRef>> {
    const keyValuePairs = [ this.parseInterfaceKeyValuePair() ];
    while ((this.match(Syntax.Comma, Syntax.Semicolon) || this.checkType() || this.check(Syntax.Mut)) && !this.check(Syntax.RBrace))
      keyValuePairs.push(this.parseInterfaceKeyValuePair());

    return new Map(keyValuePairs);
  }

  protected parseInterfaceKeyValuePair(): [LiteralExpression<string, Syntax> | AST.TypeRef, InterfacePropertySignature<AST.TypeRef>] {
    let key: AST.TypeRef;
    let valueType: AST.TypeRef;
    let isMutable = false;
    if (this.match(Syntax.LBracket)) {
      key = this.parseType();
      this.consume(Syntax.RBracket, "']'");
      this.consume(Syntax.Colon, "':'");
      valueType = this.parseType();
    } else {
      ({ isMutable, valueType, key } = this.parseNamedType(true));
    }

    return [key, {
      valueType,
      mutable: isMutable
    }];
  }

  private parseNamedType(allowMutable = false) {
    const isMutable = allowMutable ? this.match(Syntax.Mut) : false;
    const valueType = this.parseType();
    const identifier = this.consume<undefined>(Syntax.Identifier);
    const key = new LiteralExpression(fakeToken(Syntax.String, `"${identifier.lexeme}"`, identifier.lexeme));
    return { isMutable, valueType, key };
  }

  /**
   * Parses a type reference
   */
  protected parseType(): AST.TypeRef {
    return this.parseFunctionType();
  }

  protected parseFunctionType(): AST.TypeRef {
    if (this.match(Syntax.LParen)) {
      const parameterTypes = new Map<string, AST.TypeRef>();
      if (!this.match(Syntax.RParen)) {
        const parseParameter = () => {
          const param = this.parseNamedType();
          parameterTypes.set(param.key.token.value, param.valueType);
        }

        parseParameter();
        while (this.match(Syntax.Comma))
          parseParameter();

        this.consume(Syntax.RParen);
      }


      this.consume(Syntax.ColonColon, "'::'");
      const returnType = this.parseType();
      return new FunctionTypeExpression(parameterTypes, returnType);
    }

    return this.parseUnionType();
  }

  protected parseUnionType(): AST.TypeRef {
    let left = this.parseArrayType();

    while (this.match(Syntax.Pipe)) {
      const singularTypes: (SingularTypeExpression | ArrayTypeExpression)[] = [];
      if (left instanceof UnionTypeExpression)
        singularTypes.push(...left.types);
      else if (left instanceof SingularTypeExpression || left instanceof ArrayTypeExpression)
        singularTypes.push(left);

      singularTypes.push(this.parseSingularType());
      left = new UnionTypeExpression(singularTypes);
    }

    return left;
  }

  protected parseArrayType(): AST.TypeRef {
    let left: AST.TypeRef = this.parseSingularType();

    while (this.match(Syntax.LBracket)) {
      this.consume(Syntax.RBracket, "']'");
      left = new ArrayTypeExpression(left);
    }

    if (this.match(Syntax.Question))
      left = new UnionTypeExpression([
        <SingularTypeExpression>left,
        new SingularTypeExpression(fakeToken(Syntax.Undefined, "undefined"))
      ]);

    return left;
  }

  protected parseSingularType(): SingularTypeExpression {
    if (!this.checkType())
      throw new ParserSyntaxError(`Expected type, got '${this.current.lexeme}'`, this.current);

    const typeKeyword = this.advance<TypeLiteralValueType | undefined, TypeNameSyntax>();
    if (typeKeyword.value !== undefined)
      return new LiteralTypeExpression(<Token<TypeLiteralValueType, TypeNameSyntax>>typeKeyword);

    const typeName = typeKeyword.lexeme;
    let typeArgs: AST.TypeRef[] | undefined;
    if (this.match(Syntax.LT)) {
      typeArgs = this.parseTypeList();
      this.consume(Syntax.GT, "'>'");
    }

    if (this.typeAnalyzer!.typeTracker.isCustomType(typeName))
      return this.typeAnalyzer!.typeTracker.getRef(typeName)!;

    return new SingularTypeExpression(typeKeyword, typeArgs);
  }

  /**
   * Parses a list of type references separated by commas
   *
   * Must have at least one type
   */
  protected parseTypeList(): AST.TypeRef[] {
    const types = [ this.parseType() ];
    while (this.match(Syntax.Comma))
      types.push(this.parseType());

    return types;
  }

  /**
   * @returns Whether or not we matched a type reference
   */
  protected matchType(offset = 0): boolean {
    if (this.checkType(offset)) {
      this.advance();
      return true;
    }
    return false;
  }

  /**
   * @returns Whether or not we're currently at a type reference
   */
  protected checkType(offset = 0): boolean {
    return (this.check(Syntax.LParen, offset) && (
      this.checkType(offset + 1)
      || (this.check(Syntax.RParen, offset + 1) && this.check(Syntax.ColonColon, offset + 2))
    ))
    || (
      this.checkMultiple([Syntax.Identifier, Syntax.Undefined, Syntax.Null], offset)
      && this.typeAnalyzer!.typeTracker.isTypeDefined(this.peek(offset)!.lexeme)
    )
    || this.checkMultiple([Syntax.String, Syntax.Boolean, Syntax.Int, Syntax.Float], offset)
  }
}