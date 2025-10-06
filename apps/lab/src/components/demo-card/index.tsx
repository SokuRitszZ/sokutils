import { w } from '@sokutils/react';
import { Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, toast } from '@sokutils/shadcn-ui';
import { ReactNode } from 'react';

interface Props {
  title: string;  
  description: string;
  noContent?: boolean;
  content: ReactNode;
  code: string;
}

const UI = {
  Content: w('div', {}, 'border-1 border-border rounded-md p-3'),
  Code: w('pre', {}, 'whitespace-pre-wrap', 'border-1 border-border rounded-md', 'p-6 overflow-auto', 'text-12px', 'max-h-320px'),
};

export const DemoCard = ({ title, description, noContent, content, code: _code }: Props) => {
  const code = _code.replace(
    /\n+export default \(\) => undefined;/,
    '',
  );
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
      .then(() => toast('The demo code has been copied', { position: 'top-center' }));
  };

  return (
    <Card className='h-fit w-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button size='icon' variant='ghost' onClick={handleCopy}>
            <div className='i-tabler:copy' />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        {!noContent && <UI.Content>{content}</UI.Content>}
        <UI.Code>{code}</UI.Code>
      </CardContent>
    </Card>
  );
};