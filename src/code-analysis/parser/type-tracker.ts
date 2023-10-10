import { INTRINSIC_TYPES } from "../type-checker/types/type-sets";
import type AST from "./ast";

export default class TypeTracker {
  private readonly customTypes = new Map<string, AST.TypeRef>;
  private readonly typeScopes: Set<string>[] = [INTRINSIC_TYPES];

  /**
   * @returns The TypeRef associated with `name`
   */
  public getRef<Ref extends AST.TypeRef = AST.TypeRef>(name: string): Ref | undefined {
    return <Ref>this.customTypes.get(name);
  }

  /**
   * @returns Whether or not `name` is a type created by the user
   */
  public isCustomType(name: string): boolean {
    return this.customTypes.has(name);
  }

  public beginTypeScope(): void {
    this.typeScopes.push(new Set);
  }

  public endTypeScope(): void {
    this.typeScopes.pop();
  }

  /**
   * @returns Whether or not `name` is a type recognized by P
   */
  public isTypeDefined(name: string): boolean {
    return this.typeScopes.some(scope => scope.has(name)) || this.isCustomType(name);
  }

  public defineType(name: string, ref: AST.TypeRef): void {
    this.declareType(name);
    this.customTypes.set(name, ref);
  }

  public declareType(name: string) {
    const typeScope = this.typeScopes.at(-1);
    typeScope?.add(name);
  }
}