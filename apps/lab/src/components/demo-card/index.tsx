import { w } from '@sokutils/react';
import { Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, toast } from '@sokutils/shadcn-ui';
import { ReactNode } from 'react';

interface Props {
  title: string;  
  description: string;
  content: ReactNode;
  code: string;
}

const UI = {
  Content: w('div', {}, 'border-1 border-border rounded-md p-3'),
  Code: w('pre', {}, 'whitespace-pre-wrap', 'border-1 border-border rounded-md', 'p-6 overflow-auto', 'text-12px'),
};

export const DemoCard = ({ title, description, content, code }: Props) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
      .then(() => toast('The demo code has been copied', { position: 'top-center' }));
  };

  return (
    <Card>
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
        <UI.Content>
          {content}
        </UI.Content>
        <UI.Code>{code}</UI.Code>
      </CardContent>
    </Card>
  );
};