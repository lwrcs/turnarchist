export class TypeRegistry {
  /* Individual maps keep runtime typing clean */
  private static itemCtors = new Map<string, new (...a: any[]) => any>();
  private static entityCtors = new Map<string, new (...a: any[]) => any>();
  private static projectileCtors = new Map<string, new (...a: any[]) => any>();
  private static tileCtors = new Map<string, new (...a: any[]) => any>();

  /* ---------- Registration helpers ---------- */
  static registerItem(key: string, ctor: new (...a: any[]) => any) {
    this.itemCtors.set(key, ctor);
  }
  static registerEntity(key: string, ctor: new (...a: any[]) => any) {
    this.entityCtors.set(key, ctor);
  }
  static registerProjectile(key: string, ctor: new (...a: any[]) => any) {
    this.projectileCtors.set(key, ctor);
  }
  static registerTile(key: string, ctor: new (...a: any[]) => any) {
    this.tileCtors.set(key, ctor);
  }

  /* ---------- Lookup ---------- */
  static itemCtor(key: string) {
    return this.itemCtors.get(key);
  }
  static entityCtor(key: string) {
    return this.entityCtors.get(key);
  }
  static projectileCtor(key: string) {
    return this.projectileCtors.get(key);
  }
  static tileCtor(key: string) {
    return this.tileCtors.get(key);
  }
}
