import type { UserConfig } from 'vitepress';

const config: UserConfig = {
  base: '/',
  head: [
    [
      'link',
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
    [
      'meta',
      {
        name: 'viewport',
        content: 'width=device-width,initial-scale=1,user-scalable=no',
      },
    ],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'openGauss,open source,enterprise-grade,relational database,community',
      },
    ],
  ],
  appearance: true, // enable dynamic scripts for dark mode
  titleTemplate: false, //  vitepress supports pageTitileTemplate since 1.0.0
  locales: {
    '/': {
      lang: 'zh',
      title: 'openGauss',
      description:
        'openGauss是一款高性能、高安全、高可靠的企业级开源关系数据库。openGauss也是一个鼓励社区贡献和协作的开源数据库平台',
    },
    '/zh/': {
      lang: 'zh',
      title: 'openGauss',
      description:
        'openGauss是一款高性能、高安全、高可靠的企业级开源关系数据库。openGauss也是一个鼓励社区贡献和协作的开源数据库平台',
    },
    '/en/': {
      lang: 'en',
      title: 'openGauss',
      description:
        'openGauss is an enterprise-grade open source relational database with high-performance, high-security, high-reliability. openGauss is also an open source database platform that encourages community contribution and collaboration.',
    }
  },
  markdown: {
    config(md) {
      md.set({
        html: true,
        linkify: false,
      });
    },
  },
  themeConfig: {
    docsUrl: 'https://docs.opengauss.org',
  },
};
export default config;
