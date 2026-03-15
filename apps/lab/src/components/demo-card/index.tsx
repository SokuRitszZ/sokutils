import { divx, divy } from '@sokutils/react';
import { Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, toast } from '@sokutils/shadcn-ui';
import { ReactNode, useEffect, useMemo } from 'react';
import hljs from 'highlight.js/lib/core';
import ts from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

import 'highlight.js/styles/github.min.css';

hljs.registerLanguage('ts', ts);
hljs.registerLanguage('xml', xml);

interface Props {
  title: string;  
  description: string;
  noContent?: boolean;
  content: ReactNode;
  code: string;
}

const UI = {
  Content: divx({}, 'border-1 border-border rounded-md p-3'),
  CodeBlock: divy('pre', {}, 'whitespace-pre-wrap border-1 border-border rounded-md p-6 overflow-auto text-12px max-h-320px bg-muted/50 font-mono text-sm'),
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


  const codeHTML = useMemo(() => {
    return hljs.highlightAuto(code, ['ts', 'xml']).value;
  }, [code]);

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
        <UI.CodeBlock dangerouslySetInnerHTML={{ __html: codeHTML }} />
      </CardContent>
    </Card>
  );
};