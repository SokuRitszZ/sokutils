
import { describe, expect, it } from 'vitest';
import { path } from '.';

describe('path/str', () => {
  interface Infomation {
    user: {
      id: string;
      name: string;
      age: number;
    };
    employee: {
      id: string;
      depart: string;
    }[]
  }

  it('preset/dot', () => {
    const P = path.str.preset.dot.typing<Infomation>();
    
    expect(P.$).toBe('');
    expect(P.employee.$).toBe('employee');
    expect(P.employee[0].id.$).toBe('employee.0.id');
    expect(P.employee[114514].depart.$).toBe('employee.114514.depart');

    // nested
    const PE = P.employee;

    expect(PE.$).toBe('employee');
    expect(PE[0].id.$).toBe('employee.0.id');
    expect(PE[114514].depart.$).toBe('employee.114514.depart');
  });

  it('preset/snake', () => {
    const P = path.str.preset.snake.typing<Infomation>();

    expect(P.employee.z).toBe('employee');
    expect(P.employee[0].id.z).toBe('employee_0_id');
    expect(P.employee[114514].depart.z).toBe('employee_114514_depart');

    // nested
    const PE = P.employee;

    expect(PE.z).toBe('employee');
    expect(PE[0].id.z).toBe('employee_0_id');
    expect(PE[114514].depart.z).toBe('employee_114514_depart');
  });
});

describe('path/sdk', () => {
  interface ApiMap {
    album: (id: string) => unknown[]
    photo: (id: string, mode: 'a' | 'b') => unknown[];
  }

  type Resolve<E extends string, T> = {
    [K in keyof T]: {
      [_E in E]: T[K];
    };
  };

  const api = path.sdk.core('req').define<Resolve<'req', ApiMap>>(({ prefix }) => {
    return (...params) => {
      const path = [...prefix, params.join('.')].join('/');
      return path;
    }
  });

  it('core', () => {
    expect(api.album.req('123')).toBe('album/123');
    expect(api.photo.req('123', 'a')).toBe('photo/123.a');
  })
})