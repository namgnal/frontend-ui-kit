'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { compatiblePatch, equalValues, makePatch, parseJSON, validateConfig, validateValues,
  type DesignConfig, type DesignValues } from './model.mjs';

/** Mount only in the explicitly enabled development entry. Changing source starts a new baseline. */
export function useDesignTweaks(source: DesignConfig) {
  const encoded = JSON.stringify(validateConfig(source));
  const config = useMemo(() => validateConfig(JSON.parse(encoded)), [encoded]);
  const [draft, setDraft] = useState<DesignValues>(config.values);
  const [compare, setCompare] = useState(false);
  const [notice, setNotice] = useState('');
  const [saved, setSaved] = useState<DesignValues | null>(null);
  const key = `fui:tweaks:v1:${config.projectId}`;
  useEffect(() => {
    setDraft(config.values); setCompare(false); setSaved(null); setNotice('');
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const patch = compatiblePatch(config, parseJSON(stored));
        setDraft(patch.values); setSaved(patch.values); setNotice('已恢复本机保存的调整。');
      }
    } catch (error) { setNotice(`未恢复本机参数：${error instanceof Error ? error.message : '存储不可用。'} 可继续调整或导出。`); }
  }, [config, key]);
  const change = useCallback((next: DesignValues) => {
    setDraft(validateValues(next)); setCompare(false); setNotice('');
  }, []);
  function save() {
    try { localStorage.setItem(key, JSON.stringify(makePatch(config, draft))); setSaved(draft); setNotice('已保存到本机；源码尚未修改。'); }
    catch { setNotice('本机存储不可用；调整仍在，可导出文件保存。'); }
  }
  function reset() {
    setDraft(config.values); setCompare(false); setSaved(null);
    try { localStorage.removeItem(key); setNotice('已恢复原版并清除本机调整。'); }
    catch { setNotice('当前预览已恢复原版；本机记录无法清除，刷新可能再次加载。'); }
  }
  async function importFile(file: File) {
    if (file.size > 65536) throw Error('参数文件不能超过 64 KB。');
    const patch = compatiblePatch(config, parseJSON(await file.text()));
    change(patch.values); setNotice('已导入预览；可保存到本机或导出。');
  }
  function exportFile() {
    const blob = new Blob([JSON.stringify(makePatch(config, draft), null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `${config.projectId}.tweaks.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('已导出参数；源码尚未修改。');
  }
  return { values: draft, preview: compare ? config.values : draft, config, change, compare, setCompare,
    notice, setNotice, save, reset, importFile, exportFile,
    dirty: !equalValues(draft, saved ?? config.values), changed: !equalValues(draft, config.values) };
}
export type DesignTweaksController = ReturnType<typeof useDesignTweaks>;
