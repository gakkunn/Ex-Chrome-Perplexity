import { render } from 'preact';

import { App } from './App';

import { getUiLocale, t } from '@/shared/i18n';

import './styles/index.css';

document.title = t('popup_header_title');
document.documentElement.lang = getUiLocale();

const root = document.getElementById('root');

if (root) {
  render(<App />, root);
}
