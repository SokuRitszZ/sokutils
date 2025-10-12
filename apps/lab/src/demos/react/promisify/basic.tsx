import { promisify } from '@sokutils/react';
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input, toast, Toaster } from '@sokutils/shadcn-ui';
import { get } from 'lodash-es';
import { useEffect, useState } from 'react';

interface Props {
  default?: string;
}

const [confirmNode, confirm] = promisify<Props, string>(({ visible, setVisible, resolve, reject, props }) => {
  const [input, setInput] = useState('');

  useEffect(() => {
    setInput(props.default ?? '');
  }, [props]);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            <Input value={input} onInput={(e) => setInput(get(e.target, 'value')! as string)} />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => reject('')}>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={() => resolve(input)}>OK</Button>
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
      {confirmNode}
      <Button onClick={handleClick}>Confirm</Button>
    </div>
  );
};