import type { Token } from "../tokenization/token";
import type AST from "./ast";
import ArrayStepper from "../array-stepper";

const INTRINSIC_TYPES = ["int", "float", "string", "bool", "undefined", "null", "void", "any", "Array"];
export default class TypeAnalyzer extends ArrayStepper<Token> {
  private static readonly customTypes = new Map<string, AST.TypeRef>;
  private static readonly typeScopes: string[][] = [INTRINSIC_TYPES];

  /**
   * @returns The TypeRef associated with `name`
   */
  public static getRef<Ref extends AST.TypeRef = AST.TypeRef>(name: string): Ref | undefined {
    return <Ref>this.customTypes.get(name);
  }

  /**
   * @returns Whether or not `name` is a type created by the user
   */
  public static isCustomType(name: string): boolean {
    return this.customTypes.has(name);
  }

  /**
   * @returns Whether or not `name` is a type recognized by P
   */
  public static isTypeDefined(name: string): boolean {
    return this.typeScopes.flat().includes(name) || this.isCustomType(name);
  }

  public static defineType(name: string, ref: AST.TypeRef): void {
    const typeScope = this.typeScopes.at(-1);
    this.customTypes.set(name, ref);
    typeScope?.push(name);
  }

  public static beginTypeScope(): void {
    this.typeScopes.push([]);
  }

  public static endTypeScope(): void {
    this.typeScopes.pop();
  }
}