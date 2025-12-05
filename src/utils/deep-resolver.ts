async function deepResolvePromises(input) {
  if (input instanceof Promise) {
    return await input;
  }

  if (Array.isArray(input)) {
    return await Promise.all(input.map(deepResolvePromises));
  }

  if (input instanceof Date) {
    return input;
  }

  if (typeof input === 'object' && input !== null) {
    const proto = Object.getPrototypeOf(input);
    const isPlainObject = proto === Object.prototype || proto === null;

    // If this is a class instance (non-plain object), resolve properties in-place
    // to preserve the actual instance and any attached metadata used by class-transformer.
    if (!isPlainObject) {
      const keys = Object.keys(input);
      for (const key of keys) {
        input[key] = await deepResolvePromises(input[key]);
      }
      return input;
    }

    // For plain objects, create a fresh plain object with resolved values
    const keys = Object.keys(input);
    const resolvedObject: any = {};
    for (const key of keys) {
      resolvedObject[key] = await deepResolvePromises(input[key]);
    }

    return resolvedObject;
  }

  return input;
}

export default deepResolvePromises;
