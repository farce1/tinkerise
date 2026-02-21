import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  site: 'https://farce1.github.io',
  base: '/tinkerise',
  integrations: [
    starlight({
      title: 'tinkerise',
      logo: {
        src: './src/assets/logo.svg',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/farce1/tinkerise' },
      ],
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      defaultLocale: 'root',
      sidebar: [
        {
          label: 'Guides',
          items: [
            { slug: 'guides/getting-started' },
            { label: 'Scaffolders', autogenerate: { directory: 'guides/scaffolders' } },
            { label: 'Enhancements', autogenerate: { directory: 'guides/enhancements' } },
          ],
        },
        { label: 'Reference', autogenerate: { directory: 'reference' } },
        { label: 'Recipes', autogenerate: { directory: 'recipes' } },
      ],
      customCss: ['./src/styles/custom.css'],
      expressiveCode: {
        themes: ['github-dark', 'github-light'],
      },
    }),
  ],
})
