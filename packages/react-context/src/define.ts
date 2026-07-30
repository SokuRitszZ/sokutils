import { CreateModelCtxSyncState } from './types';

export const DefineCreateModelCtxSyncState =
  <P extends any[], S extends CreateModelCtxSyncState>(builder: (...params: P) => S) => {
    return builder;
  };
