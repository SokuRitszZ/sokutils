import { layout } from '@sokutils/react-component-kit';

const template = `
header  -       -
sidebar content news
+       +       tips
footer  -       corner
`;

const Layout = layout(template, {
  rows: 'auto 1fr auto auto',
  cols: 'auto 1fr auto',
});


export default () => {
  return (
    <Layout className='!h600px'>
      <Layout.Header className='bg-amber'>Header</Layout.Header>
      <Layout.Sidebar className='bg-blue'>Sidebar</Layout.Sidebar>
      <Layout.Content className='bg-green'>Content</Layout.Content>
      <Layout.Footer className='bg-red'>Footer</Layout.Footer>
      <Layout.News className='bg-indigo'>News</Layout.News>
      <Layout.Tips className='bg-yellow'>Tips</Layout.Tips>
      <Layout.Corner className='bg-cyan'>Corner</Layout.Corner>
    </Layout>
  );
};
