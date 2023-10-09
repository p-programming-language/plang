import toCamelCase from "to-camel-case";
import fetch from "sync-fetch";

import type { ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import Intrinsic from "../../../values/intrinsic";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import LiteralType from "../../../../code-analysis/type-checker/types/literal-type";
import UnionType from "../../../../code-analysis/type-checker/types/union-type";
import InterfaceType from "../../../../code-analysis/type-checker/types/interface-type";
import FunctionType from "../../../../code-analysis/type-checker/types/function-type";

export default class HttpLib extends Intrinsic.Lib {
  public readonly name = "http";

  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    return {
      request: class Request extends Intrinsic.Function {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly returnType = new InterfaceType(
          new Map([
            [new LiteralType<string>("json"), {
              valueType: new FunctionType(new Map, new SingularType("any")),
              mutable: false
            }]
          ]),
          new Map
        )
        public readonly argumentTypes = {
          uri: new SingularType("string"),
          options: new InterfaceType(
            new Map([
              [new LiteralType("method"), {
                valueType: new UnionType([
                  new LiteralType("GET"),
                  new LiteralType("POST"),
                  new LiteralType("PUT"),
                  new LiteralType("PATCH"),
                  new LiteralType("DELETE")
                ]),
                mutable: false
              }]
            ]),
            new Map
          )
        };

        public call(uri: string, options: { method: string }): { json: Intrinsic.Function<[], any> } {
          const res = fetch(uri, { method: options.method });
          return {
            json: new (class ToJSON extends Intrinsic.Function<[], any> {
              public readonly name = `${libName}.Response.${toCamelCase(this.constructor.name)}`;
              public readonly returnType = new SingularType("any");
              public readonly argumentTypes = {};

              public call(): any {
                return res.json();
              }
            })(this.interpreter)
          };
        }
      }
    };
  }
}