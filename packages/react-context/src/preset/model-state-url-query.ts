import { DefineCreateModelCtxSyncState } from '../define';

interface CreateModelCtxPresetSyncStateUrlOption {
  Key: string;
}

export const CreateModelCtxPresetSyncStateUrl = DefineCreateModelCtxSyncState((options: CreateModelCtxPresetSyncStateUrlOption) => {
  return {
    Load: () => {
      const params = new URLSearchParams(location.search);
      const jsonString = params.get(options.Key) || '';
      try {
        return JSON.parse(jsonString);
      }
      catch { }
    },
    Save: (values) => {
      try {
        const jsonString = JSON.stringify(values);
        const url = new URL(location.href);
        url.searchParams.set(options.Key, jsonString);
        history.replaceState({}, '', url);
      }
      catch { }
    },
  };
});
