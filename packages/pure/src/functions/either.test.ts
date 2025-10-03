import { describe, it } from 'node:test';
import { either } from './either';

interface User {
  id: string;
}

describe('either', () => {
  const getUser = () => JSON.parse('') as User;
  const safeGetUser = () => either(getUser);

  it('type', () => {
    const [user] = safeGetUser();
    console.log(user?.id);
  });
});