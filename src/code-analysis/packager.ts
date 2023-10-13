import type { Exportable } from "./parser/ast/classifications/exportable";

interface PackageInfo {
  readonly fileName: string;
  readonly exports: Export[];
}

interface Export {
  readonly declaration: Exportable
  readonly isPrivate: boolean;
}

export default class Packager {
  public readonly cache: Record<string, PackageInfo> = {};
  private currentExports: Export[] = [];

  public addExport(_export: Export): void {
    this.currentExports.push(_export);
  }

  public define(name: string, fileName: string): void {
    this.cache[name] = {
      fileName,
      exports: this.currentExports
    };
    this.currentExports = [];
  }

  public retrieve(name: string): PackageInfo {
    return this.cache[name];
  }
}