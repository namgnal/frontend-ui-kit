// Example of shipping approved configuration without any panel or browser storage.
import React, { type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import source from './design.config.json';
import { validateConfig, previewVariables } from '../skills/frontend-ui-kit/assets/tweaks/model.mjs';
import '../skills/frontend-ui-kit/assets/tweaks/preview.css';
import './tweaks.css';
const { values } = validateConfig(source);
createRoot(document.getElementById('root')!).render(<React.StrictMode>
  <App resolveDesign={dark => ({ style: previewVariables(values, dark) as CSSProperties, title: values.title ?? undefined, className: 'fui-live' })} />
</React.StrictMode>);
