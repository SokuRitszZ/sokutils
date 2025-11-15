
import { describe, expect, it } from 'vitest';
import { times } from 'lodash-es';
import { hash } from '../mock/hash';
import { either } from './either';
import { infinity } from './infinity';

interface User {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

type Filterify<T> = {
  [K in keyof T]?: T[K][];
}

interface ListRequest<T> {
  filter?: Filterify<T>;
  page?: {
    size?: number;
    index?: number;
  }
}

interface ListResponse<T> {
  items: T[];
  page: {
    size: number;
    index: number;
    total: number;
  }
}

const listUsers = async (req: ListRequest<User>): Promise<ListResponse<User>> => {
  const totalCount = hash.number(req.filter, 256);
  const { size = 10, index = 1 } = req.page ?? {};
  const count = Math.min(totalCount - size * (index - 1), size);
  
  const items = times(count, (i): User => {
    return {
      id: '' + (size * (index - 1) + i + 1),
      name: hash.string(size * (index - 1) + i + 1),
      gender: hash.boolean(size * (index - 1) + i + 1) ? 'male' : 'female',
    };
  });

  return {
    items,
    page: {
      size,
      index,
      total: totalCount,
    },
  };
};

describe('[infinity]', () => {
  it('normal', async () => {
    const infinityListUsers = infinity.preset.normal(
      (filter: ListRequest<User>['filter']) => 
        listUsers({ 
          filter, 
          page: { size: 1, index: 1 },
        })
          .then(({ page: { size, index, total } }) => [index, size, total]),
      ([index, size], filter) => 
        listUsers({ 
          filter, 
          page: { index, size }, 
        }).then(r => r.items),
    );
    const checkResp = await listUsers({ filter: { gender: ['male'] }, page: { size: 1, index: 1 } });
    const users = await infinityListUsers({ gender: ['male'] });

    expect(users.length).toEqual(checkResp.page.total);
  });
});