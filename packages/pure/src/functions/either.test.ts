import { describe, expect, it } from 'vitest';
import { either } from './either';

interface User {
  id: string;
}

describe('[either]', () => {
  const getUser = () => JSON.parse('') as User;
  const safeGetUser = () => either(getUser);

  it('type', () => {
    const [user, error] = safeGetUser();
    expect(user).toBeUndefined();
    expect(error).not.toBeUndefined();
  });
});