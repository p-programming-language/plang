import net from "net";

import type { ObjectType, ValueType } from "../../../../code-analysis/type-checker";
import type { Type } from "../../../../code-analysis/type-checker/types/type";
import Intrinsic from "../../../values/intrinsic";
import toCamelCase from "to-camel-case";
import FunctionType from "../../../../code-analysis/type-checker/types/function-type";
import SingularType from "../../../../code-analysis/type-checker/types/singular-type";

class SyncSocketWrapper {
  private readonly sock = new net.Socket;

  public connect(host: string, port: number): void {

  }

  public send(data: string): void {

  }

  public recv() {

  }

  public close(): void {
  }
}

export default class SocketLib extends Intrinsic.Lib {
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
          connect: {
            modifiers: [],
            valueType: new FunctionType(new Map<string, Type>(Object.entries({
              host: new SingularType("string"),
              port: new SingularType("int")
            })), new SingularType("void")),
            mutable: false
          },
          send: {
            modifiers: [],
            valueType: new FunctionType(new Map<string, Type>(Object.entries({
              data: new SingularType("string")
            })), new SingularType("void")),
            mutable: false
          },
          recv: {
            modifiers: [],
            valueType: new FunctionType(new Map, new SingularType("string")),
            mutable: false
          },
          close: {
            modifiers: [],
            valueType: new FunctionType(new Map, new SingularType("void")),
            mutable: false
          }
        };

        public construct(): ObjectType {
          const webSocket = this;
          const sock = new SyncSocketWrapper;

          return {
            connect: new (class Connect extends Intrinsic.Function {
              private readonly sig = webSocket.memberSignatures.connect.valueType;
              public readonly name = `${libName}.Server.${toCamelCase(this.constructor.name)}`;
              public readonly returnType = this.sig.returnType;
              public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

              public call(host: string, port: number): void {
                sock.connect(host, port);
              }
            })(interpreter),
            send: new (class Send extends Intrinsic.Function {
              private readonly sig = webSocket.memberSignatures.send.valueType;
              public readonly name = `${libName}.Server.${toCamelCase(this.constructor.name)}`;
              public readonly returnType = this.sig.returnType;
              public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

              public call(data: string): void {
                sock.send(data);
              }
            })(interpreter),
            recv: new (class Recv extends Intrinsic.Function {
              private readonly sig = webSocket.memberSignatures.recv.valueType;
              public readonly name = `${libName}.Server.${toCamelCase(this.constructor.name)}`;
              public readonly returnType = this.sig.returnType;
              public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

              public call() {
                // return sock.recv();
              }
            })(interpreter),
            close: new (class Close extends Intrinsic.Function {
              private readonly sig = webSocket.memberSignatures.close.valueType;
              public readonly name = `${libName}.Server.${toCamelCase(this.constructor.name)}`;
              public readonly returnType = this.sig.returnType;
              public readonly argumentTypes = Object.fromEntries(this.sig.parameterTypes);

              public call(): void {
                sock.close();
              }
            })(interpreter)
          }
        }
      }
    };
  }
}