import * as Debug from 'debug';

const base = '@timescaledb';

const _debug = Debug.debug(`${base}`);
export const debug = (packageName: string) => {
  const __debug = _debug.extend(packageName);

  return (namespace: string) => {
    return __debug.extend(namespace);
  };
};
