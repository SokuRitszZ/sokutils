import { debounce } from 'es-toolkit';
import { DefineCreateModelCtxSyncState } from '../define';

export interface CreateModelCtxPresetStateLocalStorageOptions {
  Key: string;
}

export const CreateModelCtxPresetStateLocalStorage = DefineCreateModelCtxSyncState((options: CreateModelCtxPresetStateLocalStorageOptions) => {
  const localStorage = window.localStorage;

  return {
    Save: debounce(value => localStorage.setItem(options.Key, JSON.stringify(value)), 1000),
    Load: () => {
      try {
        return JSON.parse(localStorage.getItem(options.Key) || '');
      }
      catch {}
    },
    Dispose: () => { },
  };
});
