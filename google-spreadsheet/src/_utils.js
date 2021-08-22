// Utils function
const withCache = (func, key) => (...args) => {
  const k = key ? key : `${func.name}-${JSON.stringify(args)}`;
  if (CacheService.getScriptCache().get(k) !== null) {
    return JSON.parse(CacheService.getScriptCache().get(k));
  }
  const result = func(...args);
  CacheService.getScriptCache().put(k, JSON.stringify(result));
  return result;
};
