import { CacheStrategy } from './types';

const expired = (time: number): CacheStrategy => {
  return (_, ctx: any) => {
    const hit = Date.now() > time;
    return { hit, ctx };
  }; 
};

const duration = (dur: number): CacheStrategy => {
  return (key: string, _ctx?: Partial<Record<string, number>>) => {
    const ctx = { ..._ctx };
    const timestamp = ctx?.[key] || 0;
    const now = Date.now();
    const hit = now - timestamp <= dur;
    
    if (!hit) ctx[key] = now;

    return {
      hit,
      ctx,
    }; 
  };
};

const lru = (cap: number): CacheStrategy => {
  return (key: string, _ctx?: string[]) => {
    const ctx = _ctx ?? [];
    const hit = ctx.includes(key);
    
    if (!hit) {
      ctx.push(key);
    }
    if (ctx.length > cap) {
      ctx.shift();
    }

    return { hit, ctx };
  };
};

export const strategy = {
  expired,
  duration,
  lru,
};