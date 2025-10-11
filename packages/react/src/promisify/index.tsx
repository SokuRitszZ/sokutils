import { ReactNode, useState } from 'react';

interface Opt<P, R> {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  props: P;
  resolve: (r: R) => void;
  reject: (e: any) => void;
}

interface Ctx<P, R> {
  setProps: (props: P) => void;
  setVisible: (visible: boolean) => void;
  resolve: (r: R) => void;
  reject: (e: any) => void;
}

export const promisify = <P, R>(F: (opt: Opt<P, R>) => ReactNode): [ReactNode, (r: P) => Promise<R>] => {
  const ctx: Ctx<P, R> = {
    setProps: () => {
      throw new Error('void setProps');
    },
    setVisible: () => {
      throw new Error('void setVisible');
    },
    resolve: () => {
      throw new Error('void resolve');
    },
    reject: () => {
      throw new Error('void reject');
    },
  };

  const ResolvedF = () => {
    const [visible, setVisible] = useState(false);
    const [props, setProps] = useState<P>();

    ctx.setVisible = setVisible;
    ctx.setProps = setProps;
    
    return props && 
    <F
      props={props}
      visible={visible} 
      setVisible={r => {
        ctx.setVisible(r);
      }}
      resolve={(r) => {
        ctx.resolve(r);
        setVisible(false);
      }}
      reject={r => {
        ctx.reject(r);
        setVisible(false);
      }}
    />
    ;
  };

  const fn = (p: P): Promise<R> => {
    const promise = new Promise<R>((resolve, reject) => {
      ctx.resolve = resolve;
      ctx.reject = reject;
    });

    ctx.setProps(p);
    ctx.setVisible(true);

    return promise;
  };

  return [<ResolvedF />, fn] as const;
};