import { describe, it } from 'node:test';
import { unwrap } from './unwrap';

interface User {
  id: string;
}

describe('unwrap', () => {
  const getUser = () => JSON.parse('') as User;
  const safeGetUser = () => unwrap(getUser);
  
  it('type', () => {
    const user = safeGetUser();
    console.log(user?.id);
  });
});