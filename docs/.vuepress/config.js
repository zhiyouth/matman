module.exports = {
    // 构建生成的文件路径，相对于根目录而言
    dest: './docs-dist',

    // 设置站点根路径，否则静态资源路径会有问题
    base: '/matman/',

    // 添加 github 链接，用于 gh-pages -d dist 命令
    repo: 'https://github.com/matmanjs/matman',

    title: 'matman.js',
    description: 'web 端对端测试解决方案',
    head: [
        ['link', { rel: 'icon', href: `/logo.png` }]
    ],
    themeConfig: {
        locales: {
            '/': {
                navs: [
                    { text: '帮助文档', link: '/wiki/' },
                    { text: '发布日志', link: '/release/' },
                    { text: 'Issues', link: 'https://github.com/matmanjs/matman/issues' }
                ],
                sidebar: {
                    '/wiki/': [
                        {
                            title: '关于 matman.js',
                            path: '/wiki/',
                            collapsable: false
                        }
                    ],
                    '/release/': true
                }
            }
        }
    }
};