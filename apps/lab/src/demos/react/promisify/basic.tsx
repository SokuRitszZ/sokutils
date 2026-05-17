import { promisify } from '@sokutils/react';
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, toast, Toaster } from '@sokutils/shadcn-ui';
import { get } from 'lodash-es';
import { useEffect, useState } from 'react';

interface Input {
  default?: string;
}

type Output = string

interface Config {
  title: string;
}

export const [ConfirmRegister, useConfirmTools, confirm] = promisify.component<Output, Input, Config>(() => {
  const { input, visible, resolve, reject, config } = useConfirmTools();
  const [text, setText] = useState('');

  useEffect(() => {
    setText(input?.default ?? '');
  }, [input?.default]);

  return (
    <Dialog open={visible}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            <Input value={text} onInput={(e) => setText(get(e.target, 'value')! as string)} />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => reject(undefined)}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={() => resolve(text)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default () => {
  const handleClick = async () => {
    const input = await confirm({ default: 'abcde' });
    toast(input, { position: 'top-center' });
  };

  return (
    <div>
      <Toaster />
      <ConfirmRegister title='NoName Title' />
      <Button onClick={handleClick}>Confirm</Button>
    </div>
  );
};