'use client';
import { useEffect, useId, useRef } from 'react';
import { LIMITS, type DesignValues } from './model.mjs';
import type { DesignTweaksController } from './useDesignTweaks';

const controls = [
  { key: 'fontSize', label: '正文字号', unit: 'px', fallback: 16 },
  { key: 'spacing', label: '内容间距', unit: 'px', fallback: 16 },
  { key: 'radius', label: '控件圆角', unit: 'px', fallback: 10 },
  { key: 'motion', label: '微反馈时长', unit: 'ms', fallback: 140 },
] as const;

/** Non-modal complementary panel. Closing it must not unmount the preview or erase product state. */
export function DesignTweaksPanel({ controller: c, onClose }: { controller: DesignTweaksController; onClose: () => void }) {
  const id = useId(), close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, []);
  function change<K extends keyof DesignValues>(key: K, value: DesignValues[K]) { c.change({ ...c.values, [key]: value }); }
  return <aside className="fuit-panel" aria-label="设计参数" onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
  }}>
    <header><div><span className="fuit-kicker">可选调节</span><h2>找到舒服的分寸</h2></div>
      <button ref={close} type="button" onClick={onClose} aria-label="关闭调节面板">×</button></header>
    <p className="fuit-note">改动即时预览。沿用原版时不覆盖页面原有设置。</p>
    <label className="fuit-field">强调色<select value={c.values.accent} onChange={e => change('accent', e.target.value as DesignValues['accent'])}>
      <option value="inherit">沿用产品配色</option><option value="jade">青绿</option><option value="ink">靛蓝</option><option value="plum">梅紫</option>
    </select></label>
    {controls.map(({ key, label, unit, fallback }) => <div className="fuit-field" key={key}>
      <div className="fuit-control-heading"><label htmlFor={`${id}-${key}`}>{label}</label>
        <output htmlFor={`${id}-${key}`}>{c.values[key] === null ? '沿用原版' : `${c.values[key]} ${unit}`}</output></div>
      <input id={`${id}-${key}`} type="range" min={LIMITS[key][0]} max={LIMITS[key][1]} step={LIMITS[key][2]}
        value={c.values[key] ?? fallback} aria-valuetext={c.values[key] === null ? '沿用原版，移动滑块开始调整' : `${c.values[key]} ${unit}`}
        onChange={e => change(key, Number(e.target.value))} />
      <button className="fuit-subtle" type="button" disabled={c.values[key] === null} aria-label={`${label}沿用原版`} onClick={() => change(key, null)}>沿用原版</button>
    </div>)}
    <label className="fuit-field">页面标题<input type="text" maxLength={80} placeholder="留空沿用原版" value={c.values.title ?? ''}
      onChange={e => change('title', e.target.value.trim() ? e.target.value : null)} /></label>
    <div className="fuit-actions"><button type="button" aria-pressed={c.compare} onClick={() => c.setCompare(!c.compare)}>{c.compare ? '返回调整' : '对比原版'}</button>
      <button type="button" onClick={c.reset}>恢复原版</button></div>
    <div className="fuit-save"><span>{c.dirty ? '有未保存的调整' : '当前调整已保存或与原版相同'}</span><button type="button" onClick={c.save}>保存到本机</button></div>
    <div className="fuit-actions"><button type="button" onClick={c.exportFile}>导出参数</button>
      <label className="fuit-file">导入参数<input type="file" accept=".json,application/json" aria-label="导入参数"
        onChange={async e => {
          const file = e.currentTarget.files?.[0]; e.currentTarget.value = '';
          if (!file) return;
          try { await c.importFile(file); } catch (error) { c.setNotice(error instanceof Error ? error.message : '导入失败，当前调整未改变。'); }
        }} /></label></div>
    <p className="fuit-note">导出后可让 Codex 应用到专用配置文件。保存到本机只影响此调节页。</p>
    <p className="fuit-notice" role="status">{c.notice}</p>
  </aside>;
}
