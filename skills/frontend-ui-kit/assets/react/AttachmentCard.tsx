// Adapted from open-claude-ui (MIT). Open/remove are sibling buttons, never nested.
'use client';
export interface AttachmentCardProps {
  name: string;
  detail: string;
  layout?: 'tile' | 'chip';
  onOpen?: () => void;
  onRemove?: () => void;
  openLabel?: string;
  removeLabel?: string;
  progress?: number;
}
export function AttachmentCard({ name, detail, layout = 'chip', onOpen, onRemove,
  openLabel = `打开 ${name}`, removeLabel = `移除 ${name}`, progress }: AttachmentCardProps) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const body = <><span className="fui-file-badge" aria-hidden="true">{ext.slice(1, 5).toUpperCase() || 'FILE'}</span>
    <span className="fui-file-info"><span className="fui-filename" title={name}>
      <span>{stem}</span><span>{ext}</span></span><span className="fui-muted">{detail}</span></span></>;
  return <div className={`fui-attachment fui-attachment--${layout}`}>
    {onOpen ? <button type="button" className="fui-file-main" onClick={onOpen} aria-label={openLabel}>{body}</button>
      : <div className="fui-file-main">{body}</div>}
    {onRemove && <button className="fui-file-remove" type="button" onClick={onRemove} aria-label={removeLabel}>×</button>}
    {progress !== undefined && <progress aria-label={`${name} 上传进度`} max={100}
      value={Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0} />}
  </div>;
}
