import toCamelCase from "to-camel-case";
import fetch from "sync-fetch";
import express from "express";

import type { InterfaceMemberSignature, ObjectType, ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import type { Callable } from "../../../values/callable";
import Intrinsic from "../../../values/intrinsic";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";
import LiteralType from "../../../../code-analysis/type-checker/types/literal-type";
import UnionType from "../../../../code-analysis/type-checker/types/union-type";
import InterfaceType from "../../../../code-analysis/type-checker/types/interface-type";
import FunctionType from "../../../../code-analysis/type-checker/types/function-type";
import ArrayType from "../../../../code-analysis/type-checker/types/array-type";
import Interpreter from "../../../interpreter";

interface HttpRequest {
  readonly hostname: string;
  readonly url: string;
  readonly ip: string;
  readonly method: string;
  readonly fresh: boolean;
  readonly protocol: string,
  readonly path: string,
  readonly xhr: boolean;
  readonly subdomains: string[],
  readonly params: {
    [k: string]: string;
  };
}

interface HttpResponse {

}

const mapToInterfaceSignature = ([name, valueType]: [string, Type]): [LiteralType<string>, InterfaceMemberSignature<Type>] =>
  [new LiteralType(name), {
    valueType,
    mutable: false
  }];

const HTTP_METHOD_TYPE = new UnionType([
  new LiteralType("GET"),
  new LiteralType("POST"),
  new LiteralType("PUT"),
  new LiteralType("PATCH"),
  new LiteralType("DELETE")
]);

const HTTP_REQUEST_TYPE = new InterfaceType(new Map<LiteralType<string>, InterfaceMemberSignature<Type>>((<[string, Type][]>[
  ["fresh", new SingularType("bool")],
  ["xhr", new SingularType("bool")],
  ["ip", new SingularType("string")],
  ["protocol", new SingularType("string")],
  ["path", new SingularType("string")],
  ["subdomains", new ArrayType(new SingularType("string"))],
  ["hostname", new SingularType("string")],
  ["url", new SingularType("string")],
  ["method", HTTP_METHOD_TYPE],
  ["params", new InterfaceType(new Map, new Map([
    [new SingularType("string"), new SingularType("string")]
  ]), "http.Request")]
]).map(mapToInterfaceSignature)), new Map, "http.Request");

const HTTP_RESPONSE_TYPE = new InterfaceType(new Map((<[string, Type][]>[
  ["append", new FunctionType(
    new Map<string, Type>([
      ["field", new SingularType("string")],
      ["value", new UnionType([
        new SingularType("string"),
        new ArrayType(new SingularType("string")),
        new SingularType("undefined")
      ])]
    ]),
    new SingularType("void")
  )],
  ["send", new FunctionType(
    new Map<string, Type>([
      ["body", new UnionType([
        new SingularType("any"),
        new SingularType("undefined")
      ])]
    ]),
    new SingularType("void")
  )],
  ["status", new FunctionType(
    new Map([ ["code", new SingularType("int")] ]),
    new SingularType("void")
  )],
  ["end", new FunctionType(
    new Map,
    new SingularType("void")
  )],
  ["json", new FunctionType(
    new Map,
    new InterfaceType(new Map, new Map([
      [new SingularType("string"), new SingularType("any")]
    ]))
  )]
]).map(mapToInterfaceSignature)), new Map, "http.Response");

export default class HttpLib extends Intrinsic.Lib {
  public get propertyTypes(): Record<string, Type> {
    return {};
  }

  public get members(): Record<string, ValueType> {
    const libName = this.name;
    const interpreter = this.intrinsics.interpreter;

    return {
      Server: class Server extends Intrinsic.Class {
        public readonly name = `${libName}.${toCamelCase(this.constructor.name)}`;
        public readonly constructorArgumentTypes = {};
        public readonly memberSignatures = {
          start: {
            modifiers: [],
            valueType: new FunctionType(
              new Map<string, Type>(Object.entries({
                port: new SingularType("int"),
                onRequest: new FunctionType(
                  new Map<string, Type>([
                    ["req", HTTP_REQUEST_TYPE],
                    ["res", HTTP_RESPONSE_TYPE]
                  ]),
                  new SingularType("void")
                )
              })),
              new SingularType("void")
            ),
            mutable: false
          }
        };

        public construct(): ObjectType {
          const httpServer = this;
          const server = express();

          return {
            start: new (class Start extends Intrinsic.Function {
              private readonly sig = httpServer.memberSignatures.start.valueType;
              public readonly name = `${libName}.Server.${toCamelCase(this.constructor.name)}`;
              public readonly returnType = this.sig.returnType;
              public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

              public call(port: number, onRequest: Callable<[Interpreter, HttpRequest, HttpResponse], void>): void {
                const responseSig = new Map(Array.from(HTTP_RESPONSE_TYPE.members.entries())
                  .map(([nameType, signature]) => [nameType.name.slice(1, -1), signature.valueType]));

                server.use((
                  { hostname, url, ip, method, params, fresh, protocol, path, xhr, subdomains },
                  res, next
                ) => {
                  onRequest.call(
                    interpreter,
                    {
                      hostname, url, ip, method, params, fresh, protocol, path, xhr, subdomains
                    },
                    {
                      append: new (class Append extends Intrinsic.Function {
                        public readonly name = `${libName}.Response.${toCamelCase(this.constructor.name)}`;
                        private readonly sig = <FunctionType>responseSig.get(this.name.split(".").at(-1)!);

                        public readonly returnType = this.sig.returnType;
                        public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

                        public call(field: string, value?: string | string[]): void {
                          res.append(field, value);
                        }
                      })(interpreter),
                      send: new (class Send extends Intrinsic.Function {
                        public readonly name = `${libName}.Response.${toCamelCase(this.constructor.name)}`;
                        private readonly sig = <FunctionType>responseSig.get(this.name.split(".").at(-1)!);

                        public readonly returnType = this.sig.returnType;
                        public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

                        public call(body?: any): void {
                          res.send(body);
                        }
                      })(interpreter),
                      status: new (class Status extends Intrinsic.Function {
                        public readonly name = `${libName}.Response.${toCamelCase(this.constructor.name)}`;
                        private readonly sig = <FunctionType>responseSig.get(this.name.split(".").at(-1)!);

                        public readonly returnType = this.sig.returnType;
                        public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

                        public call(code: number): void {
                          res.status(code);
                        }
                      })(interpreter),
                      end: new (class End extends Intrinsic.Function {
                        public readonly name = `${libName}.Response.${toCamelCase(this.constructor.name)}`;
                        private readonly sig = <FunctionType>responseSig.get(this.name.split(".").at(-1)!);

                        public readonly returnType = this.sig.returnType;
                        public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

                        public call(): void {
                          res.end();
                        }
                      })(interpreter),
                      json: new (class Json extends Intrinsic.Function {
                        public readonly name = `${libName}.Response.${toCamelCase(this.constructor.name)}`;
                        private readonly sig = <FunctionType>responseSig.get(this.name.split(".").at(-1)!);

                        public readonly returnType = this.sig.returnType;
                        public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

                        public call(): void {
                          res.json();
                        }
                      })(interpreter)
                    }
                  );
                  next();
                });
                server.listen(port);
              }
            })(interpreter)
          }
        }
      },
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
                valueType: HTTP_METHOD_TYPE,
                mutable: false
              }]
            ]),
            new Map
          )
        };

        public call(uri: string, options: { method: string }): { json: Intrinsic.Function<[], any> } {
          const interpreter = this.interpreter;
          const res = fetch(uri, { method: options.method });
          return {
            json: new (class ToJSON extends Intrinsic.Function<[], any> {
              public readonly name = `${libName}.Response.${toCamelCase(this.constructor.name)}`;
              public readonly returnType = new SingularType("any");
              public readonly argumentTypes = {};

              public call(): any {
                return res.json();
              }
            })(interpreter)
          };
        }
      }
    };
  }
}