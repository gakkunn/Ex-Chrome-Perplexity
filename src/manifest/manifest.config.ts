import { defineManifest } from '@crxjs/vite-plugin';

const matches = ['https://www.perplexity.ai/*'];

export default defineManifest({
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extension_name__',
  description: '__MSG_extension_description__',
  version: '1.0.0',
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_title: '__MSG_action_default_title__',
    default_icon: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
    default_popup: 'src/popup/index.html',
  },
  options_ui: {
    page: 'src/popup/index.html',
    open_in_tab: true,
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  host_permissions: matches,
  permissions: ['storage'],
  content_scripts: [
    {
      matches,
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['src/inject/index.js'],
      matches,
    },
  ],
});
