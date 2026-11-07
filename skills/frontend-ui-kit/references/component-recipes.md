# 组件配方与接入契约

本包组件面向 React 18+ 的客户端交互，浏览器需支持 ResizeObserver 等现代 API。实测环境见项目验收记录；不能把参考组件称作经过所有浏览器验证的生产组件库。只有 React/React DOM 依赖，无 Tailwind、Framer Motion、Electron 或模型 API 依赖。

复制所需 `.tsx` 文件、`components.css` 与所需 tokens 后，按产品文案、既有组件和实际数据调整。组件源文件有 `'use client'`；SSR 框架仍需使用自己的构建和样式接入方式。不要为了一个配方搬走用户现有组件库。

| 文件 | 接入与保留理由 | 关键边界 |
|---|---|---|
| Button.tsx | `variant`、原生按钮属性、`busy`；默认 type=button | 真正提交表单时显式 type=submit；图标按钮由调用者提供 aria-label |
| SegmentedControl.tsx | 受控 `value/onChange/options/label`；方向键循环、Home/End、跳过 disabled、支持 RTL | 是互斥选项的 radiogroup，不是假 tablist。value 要有效，option.value 唯一；若切换标签页，使用项目的真实 Tabs |
| AttachmentCard.tsx | `name/detail/onOpen/onRemove`；tile/chip；扩展名保留，可键盘操作 | open/remove 分离为兄弟按钮；进度由真实上游值驱动；不上传文件。可自定义动作 label |
| Status.tsx | `state` 与必需的文字 children；可选 `announce` | 高频变化不要每次都播报；busy 动画在 reduced-motion 下静止，仍保留文字 |
| CodeBlock.tsx | 原样展示 `code`；异步复制成功后才反馈；失败可重试 | Clipboard 需安全上下文；可传 `copy` 接入原生桥或权限流程。保留空白，不执行代码，无语法高亮依赖；messages 可本地化 |
| Message.tsx | author、side、内容与可选 meta；无写死的模型或计时 | 不自带 Markdown/HTML 渲染器；流式区域不要反复朗读整段历史 |
| Composer.tsx | 本地草稿、`onSend(text)`、输入法保护、自适应高度；成功清理原草稿，失败保留 | `onSend` Promise 必须在真实提交完成后 resolve。发送中仍可写新草稿，新输入不被旧请求清除；无文件上传/模型选择；messages 可本地化 |
| Accordion.tsx | 原生 details/summary，键盘可操作，关闭时内部控件不参与 Tab | title 用文本，内容可交互；defaultOpen 是初始状态。避免嵌套按钮到 summary |

## 最小 React 接入

```tsx
import './tokens.css';
import './components.css';
import { Composer } from './Composer';

export function ReplyBox() {
  return <div className="fui-root">
    <Composer onSend={async text => {
      // 用项目已有服务保存。请求失败时抛出异常，让组件保留草稿。
      await saveReply(text);
    }} />
  </div>;
}
```

`saveReply` 是待替换的业务服务，不是本包提供的 API。产品若要求外部受控草稿、取消请求、富文本或提及功能，在目标项目中按需求扩展并验证；第一版没有宣称支持这些特性。

发送期间可继续编辑。如果旧请求失败且输入已变化，旧内容会留在恢复区，发送暂时禁用；“放回输入框”把旧内容追加到现有草稿，用户可以编辑或删除后继续发送。不会为恢复旧内容覆盖新草稿。

## 滚动跟随

`usePinnedScroll` 返回 `viewportRef/contentRef/showJump/jumpToLatest`。viewport 是固定/约束高度的 `overflow:auto` 元素，content 是内部包含全部消息的块。两个节点要在 hook 挂载时存在且保持同一实例。viewport 建议有 `tabIndex=0`、`role=region` 和可读名称。

ResizeObserver 跟随真实高度变化，仅在用户靠近底部时对齐；阅读历史时保留位置。插入历史消息、虚拟列表、移除 viewport、无限加载和倒序布局不在这个配方范围，需要项目专门的锚定逻辑。

## 尚未带入的组件

弹窗、复杂菜单、分栏拖动、可视化回写等没有纳入第一版。需要弹窗时优先使用项目已经验证的 dialog primitive，并检查初始焦点、焦点约束、Escape 与关闭后的焦点恢复。不要把原仓库带有缺陷的 ConfirmationDialog 复制进项目。
