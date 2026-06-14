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
            { label: 'Getting Started', slug: 'guides/getting-started' },
            { label: 'Stack Builder', slug: 'guides/stack-builder' },
            { label: 'Reproducible Projects', slug: 'guides/reproducible-projects' },
            { label: 'External Sources & Trust', slug: 'guides/external-sources' },
            { label: 'Scaffolder Guides', autogenerate: { directory: 'guides/scaffolders' } },
            { label: 'Enhancement Guides', autogenerate: { directory: 'guides/enhancements' } },
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
