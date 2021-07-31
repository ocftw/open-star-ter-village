// Utils function
const withCache = (func, key) => (...args) => {
  const k = key ? key : `${func.name}-${JSON.stringify(args)}`;
  if (CacheService.getScriptCache().get(k) !== null) {
    Logger.log(`get cache from key ${k}`);
    return JSON.parse(CacheService.getScriptCache().get(k));
  }
  Logger.log(`set cache on key ${k}`);
  const result = func(...args);
  CacheService.getScriptCache().put(k, JSON.stringify(result));
  return result;
};
