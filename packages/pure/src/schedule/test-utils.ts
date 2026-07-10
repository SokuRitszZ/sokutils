export const deferred = <T = void>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { promise, reject, resolve };
};

export const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

export const barrier = (participants: number) => {
  let remaining = participants;
  const gate = deferred();

  return async () => {
    remaining -= 1;
    if (remaining === 0) {
      gate.resolve();
    }
    await gate.promise;
  };
};
