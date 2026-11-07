// Original optional configuration contract, shared by browser controls and the file apply helper.
/** @typedef {{accent: 'inherit'|'jade'|'ink'|'plum', fontSize: number|null, spacing: number|null, radius: number|null, motion: number|null, title: string|null}} DesignValues */
/** @typedef {{kind:'frontend-ui-kit/design-config', version:1, projectId:string, revision:number, values:DesignValues}} DesignConfig */
/** @typedef {{kind:'frontend-ui-kit/tweaks', version:1, projectId:string, baseline:{revision:number,values:DesignValues}, values:DesignValues}} DesignPatch */

/** @type {Readonly<DesignValues>} */
export const DEFAULT_VALUES = Object.freeze({ accent: 'inherit', fontSize: null, spacing: null, radius: null, motion: null, title: null });
export const LIMITS = Object.freeze({ fontSize: [14, 20, 1], spacing: [8, 28, 2], radius: [0, 24, 2], motion: [0, 400, 10] });

/** @param {unknown} input @param {string[]} keys @returns {Record<string, any>} */
function exact(input, keys) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw Error('配置必须是普通 JSON 对象。');
  const object = /** @type {Record<string, any>} */ (input);
  if (Object.keys(object).length !== keys.length || keys.some(key => !Object.hasOwn(object, key))) {
    throw Error('配置字段缺失或包含不支持的字段。');
  }
  return object;
}
/** @param {unknown} input @returns {DesignValues} */
export function validateValues(input) {
  const v = exact(input, Object.keys(DEFAULT_VALUES));
  if (!['inherit', 'jade', 'ink', 'plum'].includes(v.accent)) throw Error('不支持的强调色。');
  for (const [key, [min, max, step]] of Object.entries(LIMITS)) {
    const n = v[key];
    if (n !== null && (!Number.isInteger(n) || n < min || n > max || (n - min) % step !== 0)) throw Error(`${key} 超出支持范围或步长。`);
  }
  if (v.title !== null && (typeof v.title !== 'string' || !v.title.trim() || v.title.length > 80 || /[\u0000-\u001f]/.test(v.title))) {
    throw Error('标题需为 1–80 字符的单行文字，或 null（沿用原版）。');
  }
  return { accent: v.accent, fontSize: v.fontSize, spacing: v.spacing, radius: v.radius, motion: v.motion, title: v.title };
}
/** @param {unknown} id */
function projectId(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(id)) throw Error('projectId 必须是 1–80 位字母、数字、点、下划线或短横线。');
  return id;
}
/** @param {unknown} n */
function revision(n) {
  if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0 || n >= Number.MAX_SAFE_INTEGER) throw Error('无效的配置版本号。');
  return n;
}
/** @param {unknown} input @returns {DesignConfig} */
export function validateConfig(input) {
  const c = exact(input, ['kind', 'version', 'projectId', 'revision', 'values']);
  if (c.kind !== 'frontend-ui-kit/design-config' || c.version !== 1) throw Error('不支持的配置格式版本。');
  return { kind: c.kind, version: 1, projectId: projectId(c.projectId), revision: revision(c.revision), values: validateValues(c.values) };
}
/** @param {unknown} input @returns {DesignPatch} */
export function validatePatch(input) {
  const p = exact(input, ['kind', 'version', 'projectId', 'baseline', 'values']);
  if (p.kind !== 'frontend-ui-kit/tweaks' || p.version !== 1) throw Error('不支持的参数文件格式版本。');
  const b = exact(p.baseline, ['revision', 'values']);
  return { kind: p.kind, version: 1, projectId: projectId(p.projectId), baseline: { revision: revision(b.revision), values: validateValues(b.values) }, values: validateValues(p.values) };
}
/** @param {string} text @returns {unknown} */
export function parseJSON(text) {
  if (new TextEncoder().encode(text).byteLength > 65536) throw Error('参数文件不能超过 64 KB。');
  try { return JSON.parse(text); } catch { throw Error('参数文件不是有效 JSON。'); }
}
/** @param {DesignValues} a @param {DesignValues} b */
export function equalValues(a, b) { return JSON.stringify(validateValues(a)) === JSON.stringify(validateValues(b)); }
/** @param {DesignConfig} config @param {DesignValues} values @returns {DesignPatch} */
export function makePatch(config, values) {
  const c = validateConfig(config);
  return { kind: 'frontend-ui-kit/tweaks', version: 1, projectId: c.projectId,
    baseline: { revision: c.revision, values: c.values }, values: validateValues(values) };
}
/** @param {DesignConfig} config @param {unknown} input @returns {DesignPatch} */
export function compatiblePatch(config, input) {
  const c = validateConfig(config), patch = validatePatch(input);
  if (patch.projectId !== c.projectId) throw Error('参数属于其他项目，未应用。');
  if (patch.baseline.revision !== c.revision || !equalValues(patch.baseline.values, c.values)) {
    throw Error('原版配置已变化，未覆盖。请重新加载最新原版后再调整。');
  }
  return patch;
}
/** @param {DesignConfig} config @param {unknown} input @returns {DesignConfig} */
export function applyPatch(config, input) {
  const c = validateConfig(config), patch = compatiblePatch(c, input);
  return { ...c, revision: c.revision + 1, values: patch.values };
}
/** @param {DesignValues} input @param {boolean} dark @returns {Record<string,string>} */
export function previewVariables(input, dark) {
  const values = validateValues(input);
  /** @type {Record<string,string>} */
  const result = {};
  const palettes = {
    jade: dark ? ['#94dfc2', '#12382c', '#29493b'] : ['#166653', '#ffffff', '#e0efe9'],
    ink: dark ? ['#b2c6ff', '#1e2d53', '#303c5b'] : ['#344c8c', '#ffffff', '#e8edf8'],
    plum: dark ? ['#e8b7e5', '#40203e', '#4b3449'] : ['#7a3975', '#ffffff', '#f3e6f1'],
  };
  if (values.accent !== 'inherit') {
    const [accent, onAccent, soft] = palettes[values.accent];
    Object.assign(result, { '--fui-accent': accent, '--fui-on-accent': onAccent, '--fui-accent-soft': soft, '--fui-focus': accent });
  }
  if (values.fontSize !== null) result['--fui-live-font-size'] = `${values.fontSize}px`;
  if (values.spacing !== null) result['--fui-live-spacing'] = `${values.spacing}px`;
  if (values.radius !== null) {
    result['--fui-radius-control'] = `${values.radius}px`;
    result['--fui-radius-panel'] = `${values.radius + 8}px`;
  }
  if (values.motion !== null) {
    result['--fui-motion-fast'] = `${values.motion}ms`;
    result['--fui-motion-settle'] = `${values.motion === 0 ? 0 : values.motion + 80}ms`;
  }
  return result;
}
