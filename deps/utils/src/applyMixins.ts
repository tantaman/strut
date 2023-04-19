export default function applyMixins(derivedCtor: any, mixins: any[]) {
  mixins.forEach((mixin) => {
    Object.getOwnPropertyNames(mixin).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(mixin, name) || Object.create(null)
      );
    });
  });
}
