import React, { useEffect, useState, type CSSProperties } from 'react';
import { Button } from '../skills/frontend-ui-kit/assets/react/Button';
import { SegmentedControl } from '../skills/frontend-ui-kit/assets/react/SegmentedControl';
import { AttachmentCard } from '../skills/frontend-ui-kit/assets/react/AttachmentCard';
import { Status } from '../skills/frontend-ui-kit/assets/react/Status';
import { CodeBlock } from '../skills/frontend-ui-kit/assets/react/CodeBlock';
import { Message } from '../skills/frontend-ui-kit/assets/react/Message';
import { Composer } from '../skills/frontend-ui-kit/assets/react/Composer';
import { Accordion } from '../skills/frontend-ui-kit/assets/react/Accordion';
import { usePinnedScroll } from '../skills/frontend-ui-kit/assets/react/usePinnedScroll';
import '../skills/frontend-ui-kit/assets/themes/tokens.css';
import '../skills/frontend-ui-kit/assets/react/components.css';
import './demo.css';

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function Chat({ title }: { title?: string }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [file, setFile] = useState(true);
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState('think');
  const { viewportRef, contentRef, showJump, jumpToLatest } = usePinnedScroll();
  return <main className="chat-layout">
    <aside className="chat-aside"><div className="demo-wordmark">澄明<span>CLARITY</span></div>
      <p>让想法慢慢清晰。</p><div className="aside-note">一个安静的思考空间<br />可交互的本地示例</div>
      <div className="aside-bottom"><Status state="success">内容仅保留在当前页面</Status></div></aside>
    <section className="chat-workspace" aria-label="对话空间"><div className="chat-heading"><div>
      <div className="eyebrow">工作空间 / 产品体验</div><h1>{title ?? "把复杂，留给设计。"}</h1></div>
      <SegmentedControl label="工作模式" value={mode} onChange={setMode} options={[
        { value: 'think', label: '思考' }, { value: 'draft', label: '起草' }, { value: 'review', label: '审阅' }]} /></div>
      <div className="chat-scroll" ref={viewportRef} tabIndex={0} role="region" aria-label="对话记录">
        <div ref={contentRef}>
          <Message author="你" side="end">希望我的产品用起来更轻松，有质感，但不要堆很多装饰。</Message>
          <Message author="设计伙伴"><p>可以从用户正在做的事情开始。</p><p>让重要信息一眼可见，让每次操作都有清楚的回应。把节奏留给内容，动效只负责解释变化。</p>
            <Accordion title="看看这次优化的思路"><p>先理顺信息顺序，再统一间距与控件反馈。这里的折叠区域可用 Enter 或空格打开。</p></Accordion>
          </Message>
          {messages.map((message, i) => <Message key={i} author="你" side="end">{message}</Message>)}
        </div>
      </div>
      <div className="chat-bottom">{showJump && <Button onClick={jumpToLatest}>回到最新消息 ↓</Button>}
        {file && <AttachmentCard name="产品体验优化方向与界面层次说明.pdf" detail="参考资料 · 240 KB"
          onOpen={() => setNotice('已选中参考资料：产品体验优化方向与界面层次说明.pdf')}
          onRemove={() => setFile(false)} />}
        <Composer placeholder={mode === 'draft' ? '写下需要起草的内容…' : mode === 'review' ? '描述需要审阅的设计…' : '描述一个你想改善的体验…'}
          onSend={async text => { await pause(250); setMessages(v => [...v, text]); }} />
        <span className="fui-sr-only" role="status">{notice}</span>
      </div>
    </section>
  </main>;
}
const tasks = [
  { name: '把首次使用变得更轻松', area: '新用户引导', state: '进行中', progress: 72 },
  { name: '让信息层次更清晰', area: '工作台', state: '待审阅', progress: 100 },
  { name: '完善输入与反馈', area: '全局组件', state: '进行中', progress: 48 },
];
function Dashboard({ title }: { title?: string }) {
  const [filter, setFilter] = useState('all');
  const [saved, setSaved] = useState(false);
  const visible = tasks.filter(t => filter === 'all' || t.state === '进行中');
  return <main className="dashboard"><div className="dashboard-heading"><div className="eyebrow">FIELDNOTES / 团队工作台</div><Status state="idle">示例数据</Status></div>
    <div className="section-heading"><div><h1>{title ?? "好的体验，来自每一处细节。"}</h1><p className="fui-muted">今天，把精力放在真正重要的事情上。</p></div>
      <Button variant="primary" onClick={() => setSaved(true)}>{saved ? '本次计划已标记完成' : '完成本次计划'}</Button></div>
    <div className="dashboard-grid"><section className="task-panel"><div className="section-heading"><h2>正在推进</h2>
      <SegmentedControl label="任务筛选" value={filter} onChange={setFilter} options={[{ value: 'all', label: '全部' }, { value: 'active', label: '进行中' }]} /></div>
      <div className="task-list">{visible.map(t => <article key={t.name} className="task-row"><div><span className="fui-muted">{t.area}</span><h3>{t.name}</h3>
        <progress aria-label={`${t.name}完成度`} value={t.progress} max={100} /></div><Status state={t.state === '待审阅' ? 'success' : 'idle'}>{t.state}</Status></article>)}</div>
      <div className="panel-foot">已显示 {visible.length} 项工作 · 本地交互演示</div></section>
      <aside className="focus-panel"><span className="eyebrow">本周关注</span><h2>少一点打断。<br />多一点确定。</h2><p>优先修复用户反复遇到的阻碍，再打磨那些让人感到舒适的细节。</p>
        <Accordion title="设计检查要点" defaultOpen><ul><li>下一步操作是否一眼可见</li><li>失败后是否保留已有输入</li><li>长内容是否仍然易读</li></ul></Accordion></aside></div>
    <section className="dashboard-code"><h2>把设计落在真实的规则里</h2><CodeBlock label="界面层次 · CSS" code={'/* 示例：重要内容用空间区分 */\n.content {\n  max-width: 72ch;\n  line-height: 1.8;\n}\n'} /></section>
    <span role="status" className="fui-sr-only">{saved ? '本次计划已标记完成' : ''}</span>
  </main>;
}
function Landing({ title }: { title?: string }) {
  return <main className="landing"><div className="landing-brand">序间<span>SPACE FOR FOCUS</span></div>
    <section className="landing-hero"><div className="hero-copy"><span className="eyebrow">为专注，留一点空间</span><h1>{title ?? <>让一天<br />有自己的节奏<span>。</span></>}</h1>
      <p>整理想法，找到重点。把繁杂的工作，<br className="desktop-break" />安放在一个清晰、从容的空间。</p>
      <a className="fui-button fui-button--primary" href="#chat">体验思考空间 <span aria-hidden="true">↗</span></a>
      <span className="hero-note">本地示例 · 无需账号</span></div>
      <div className="hero-art" aria-label="专注计划示意"><div className="orbit" aria-hidden="true"></div><div className="plan-sheet"><div className="sheet-top">今日 / FOCUS<span>周五</span></div>
        <h2>留给重要的事</h2><p>不是做更多，<br />而是把在意的事做好。</p><div className="sheet-rule"></div><ul><li><span>✓</span> 写下一个清晰的目标</li><li><span>✓</span> 为思考留一段时间</li><li><span>○</span> 从容地完成今天</li></ul><div className="sheet-bottom">ONE THING AT A TIME</div></div></div></section>
    <section className="landing-features" aria-label="产品特点"><article><h2>一眼就明白</h2><p>用清楚的信息层次，减少寻找和判断。</p></article><article><h2>每一步有回应</h2><p>输入、保存、切换，反馈准确而克制。</p></article><article><h2>按你的节奏</h2><p>不打断阅读，也不急着替你做决定。</p></article></section>
    <footer className="landing-footer">序间 · 界面设计示例<span>Frontend UI Kit / 0.1</span></footer>
  </main>;
}
function Lab() {
  const [selected, setSelected] = useState('a');
  const [sent, setSent] = useState<string[]>([]);
  const [fail, setFail] = useState(false);
  const [copyState, setCopyState] = useState('success');
  const [count, setCount] = useState(12);
  const [stream, setStream] = useState(false);
  const [action, setAction] = useState('');
  const [submitCount, setSubmitCount] = useState(0);
  const { viewportRef, contentRef, showJump, jumpToLatest } = usePinnedScroll();
  useEffect(() => { if (!stream) return; const id = setInterval(() => setCount(v => v + 1), 90); return () => clearInterval(id); }, [stream]);
  return <main className="lab"><h1>组件验收</h1>
    <form onSubmit={e => { e.preventDefault(); setSubmitCount(v => v + 1); }}><Button onClick={() => setAction('普通按钮')}>普通按钮</Button><output aria-label="表单提交次数">{submitCount}</output></form>
    <SegmentedControl label="键盘验收" value={selected} onChange={setSelected} options={[{ value: 'a', label: '第一项' }, { value: 'b', label: '禁用项', disabled: true }, { value: 'c', label: '最后一项' }]} />
    <AttachmentCard name="一个很长很长的用于测试溢出的中文附件文件名.pdf" detail="240 KB" onOpen={() => setAction('打开附件')} onRemove={() => setAction('移除附件')} />
    <output aria-label="操作结果">{action}</output>
    <Accordion title="可键盘打开的详情"><Button onClick={() => setAction('详情操作')}>详情内操作</Button></Accordion>
    <label><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)} />模拟发送失败</label>
    <Composer onSend={async text => { await pause(250); if (fail) throw Error('test'); setSent(v => [...v, text]); }} />
    <output aria-label="已发送消息">{JSON.stringify(sent)}</output>
    <label>剪贴板模拟<select value={copyState} onChange={e => setCopyState(e.target.value)}><option value="success">成功</option><option value="error">拒绝权限</option><option value="delay">延迟成功</option></select></label>
    <CodeBlock label="保留空白" code={'  第一行\n\n  最后一行\n'} copy={async () => { if (copyState === 'delay') await pause(800); if (copyState === 'error') throw Error('test'); }} />
    <div className="lab-scroll" tabIndex={0} role="region" aria-label="流式记录" ref={viewportRef}><div ref={contentRef}>{Array.from({ length: count }, (_, i) => <p key={i}>第 {i + 1} 条 · 阅读位置应该保持稳定。</p>)}</div></div>
    <Button onClick={() => setStream(v => !v)}>{stream ? '停止追加' : '开始追加'}</Button>{showJump && <Button onClick={jumpToLatest}>回到最新</Button>}
    <Status state="busy">处理中</Status>
  </main>;
}
export function App({ resolveDesign }: { resolveDesign?: (dark: boolean) => { style?: CSSProperties; title?: string; className?: string } } = {}) {
  const [page, setPage] = useState(location.hash.slice(1) || 'chat');
  const [dark, setDark] = useState(false);
  useEffect(() => { const handler = () => setPage(location.hash.slice(1) || 'chat'); addEventListener('hashchange', handler); return () => removeEventListener('hashchange', handler); }, []);
  const design = resolveDesign?.(dark);
  return <div className={`fui-root demo-root${design?.className ? ` ${design.className}` : ""}`} style={design?.style} data-fui-theme={dark ? 'dark' : 'light'} data-fui-palette={page === 'dashboard' ? 'ink' : undefined}>
    <header className="demo-toolbar"><a href="#chat" className="demo-kit-name">UI / 舒适界面</a><nav aria-label="验收示例">{[
      ['chat', '对话'], ['dashboard', '工作台'], ['landing', '品牌页'], ['lab', '组件验收'],
    ].map(([key, name]) => <a key={key} href={`#${key}`} aria-current={page === key ? 'page' : undefined}>{name}</a>)}</nav>
      <Button variant="quiet" onClick={() => setDark(v => !v)} aria-pressed={dark}>深色模式</Button></header>
    {page === 'dashboard' ? <Dashboard title={design?.title} /> : page === 'landing' ? <Landing title={design?.title} /> : page === 'lab' ? <Lab /> : <Chat title={design?.title} />}
  </div>;
}
