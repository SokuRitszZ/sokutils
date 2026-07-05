import { layout } from "@sokutils/react";

const Layout = layout(`
  header  -       -
  sidebar content -
  sidebar footer  -
  `, {
    rows: 'auto 1fr auto',
    cols: 'auto 1fr auto'
  })


export const App = () => {

  return (
    <Layout className='bg-blue-200 gap-3'>
      <Layout.Header className='bg-red-100'>header</Layout.Header>
      <Layout.Sidebar className='bg-red-300'>sidebar</Layout.Sidebar>
      <Layout.Content className='bg-green-100'>content</Layout.Content>
      <Layout.Footer className='bg-green-300'>footer</Layout.Footer>
    </Layout>
  );
}
