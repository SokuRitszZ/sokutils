import { FC, useState } from 'react';

export const promisifyComponent = <Output = void, Input = void, Config = void, Error = void>(RawComponent: FC) => {
  const ctx = {
    resolve: (r: Output) => {},
    reject: (e: Error) => {},
    visible: false,
    setVisible: (v: boolean) => {},
    config: undefined as Config,
    input: undefined as Input,
  };

  const Component = (config: Config) => {
    // TODO: 
    const [visible, setVisible] = useState(false);
    ctx.config = config;
    ctx.setVisible = (v: boolean) => {setVisible(v);};
    ctx.visible = visible;

    return <RawComponent />;
  };

  const useTools = () => {
    return {
      resolve: (r: Output) => {
        ctx.resolve(r);
        ctx.setVisible(false);
      },
      reject: (e: Error) => {
        ctx.reject(e);
        ctx.setVisible(false);
      },
      visible: ctx.visible,
      config: ctx.config as Config,
      input: ctx.input as Input | undefined,
    };
  };

  const func = (input: Input) => {
    ctx.input = input;
    ctx.setVisible(true);
    return new Promise<Output>((resolve, reject) => {
      ctx.resolve = resolve;
      ctx.reject = reject;
    });
  };
  return [Component, useTools, func] as const;
};