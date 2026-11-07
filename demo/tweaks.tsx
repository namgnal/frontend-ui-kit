import React, { useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import source from './design.config.json';
import { validateConfig, previewVariables } from '../skills/frontend-ui-kit/assets/tweaks/model.mjs';
import { useDesignTweaks } from '../skills/frontend-ui-kit/assets/tweaks/useDesignTweaks';
import { DesignTweaksPanel } from '../skills/frontend-ui-kit/assets/tweaks/DesignTweaksPanel';
import '../skills/frontend-ui-kit/assets/tweaks/controls.css';
import '../skills/frontend-ui-kit/assets/tweaks/preview.css';
import './tweaks.css';

const config = validateConfig(source);
function Workbench() {
  const controller = useDesignTweaks(config);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <div className="fuit-workbench" data-panel-open={open}>
    <div className="fuit-toolbar"><div><p>可选设计调节台</p><small>可以直接用语言让 Codex 调整，也可以在这里亲手比较。</small></div>
      <button type="button" ref={trigger} aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? '收起调节面板' : '打开调节面板'}</button></div>
    <div className="fuit-layout"><div className="fuit-preview"><App resolveDesign={dark => ({
      style: previewVariables(controller.preview, dark) as CSSProperties,
      title: controller.preview.title ?? undefined, className: 'fui-live',
    })} /></div>
      {open && <DesignTweaksPanel controller={controller} onClose={close} />}
    </div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Workbench /></React.StrictMode>);
