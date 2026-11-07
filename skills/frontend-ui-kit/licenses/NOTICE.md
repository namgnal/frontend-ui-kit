# 来源、许可与修改说明

Frontend UI Kit 0.2.0 是个人维护的前端设计 Skill 工具包，与 Anthropic 或 Claude 无关联，也不是其官方设计系统。仅参考以下两个公开项目，不包含 REA、huashu-design、Anthropic 品牌标识、字体文件或闭源产品资源；没有吸收或修改用户本机另行安装的 frontend-design 技能。

## open-claude-ui

- 作者：Caho1；仓库：https://github.com/Caho1/open-claude-ui
- 固定版本：c1f923ae0051a871941b98a0e2e3183a545e6a85
- 原许可：MIT；完整文本：[open-claude-ui-MIT.txt](open-claude-ui-MIT.txt)
- 保留其组件分工、语义 tokens 思路、附件名称与扩展名布局、复制状态反馈、输入法保护、滚动跟随等模式。React 配方均作实质重写：使用局部 CSS、消除品牌/模型硬编码、移除 Framer Motion/Tailwind/Electron 依赖、修复交互及可访问性问题。
- 原来的 ConfirmationDialog、可拖动分栏、假多 Agent、音频和 iframe 通信不在本版本。

## open-claude-design

- 作者/项目：imsai-sh/open-claude-design；仓库：https://github.com/imsai-sh/open-claude-design
- 固定版本：19b48b1096f97c96cc21f58b1af9c411da65b46f
- 原许可：Apache-2.0；完整文本：[open-claude-design-Apache-2.0.txt](open-claude-design-Apache-2.0.txt)
- `references/prototype-flow.md` 与验收方法提炼自其内置 Skill 和可预览、可检查的工作方式，已改写为普通 Agent 环境可执行的流程。相关衍生文档保留 Apache-2.0 许可。该固定版本未发现独立 NOTICE 文件。
- 0.2.0 的可选调节流程参考 `make-tweakable/SKILL.md` 中少量参数、合理默认值和实时预览的思路；`references/optional-tweaks.md` 保留 Apache-2.0 许可。参数契约、控件、状态 hook 和专用配置应用脚本为本包重新编写，没有复制其 EDITMODE、宿主 tweaks proxy 或 iframe bridge 实现。
- 不包含其应用壳、Agent 引擎、Cloudflare 存储、API key 管理、iframe 执行器、DOM 回写和工具注册系统。

## 本包新增内容

新的语义配色、通用接入规范、中文任务路由、示例页面、测试、检查脚本，以及 `assets/tweaks/` 和 `scripts/apply-tweaks.mjs` 采用 [MIT](frontend-ui-kit-MIT.txt)。来源模块继续受各自许可约束，不以本包许可替换上游许可。复制本包组件或衍生文档到其他项目时一并保留适用的许可和归属说明。

修改日期：2026-10-24。具体对应关系见 `../sources.lock.json`。保留上游声明不等于独立核实了上游关于逆向来源的所有主张。
