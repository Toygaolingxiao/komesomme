# KomeSomme FlavorMatrix 设计变更方案

## 0. 修改目标

请对当前 `src/components/FlavorMatrix.tsx` 进行一次完整的设计与交互重构。

本次重构目标不是增加更多科技感，而是将当前偏 **AI Dashboard / Cyber UI / 数据面板** 的界面，升级为更符合 KomeSomme 品牌气质的：

> **温润的日式高级米品鉴体验**
>
> A warm cinematic Japanese rice tasting table — quiet, tactile, editorial, and intelligent beneath the surface.

核心关键词：

- warm dark
- rice white
- washi texture
- dark ceramic
- restrained gold
- Japanese rice sommelier
- premium tasting table
- subtle glassmorphism
- quiet motion
- food pairing
- tactile interaction

避免关键词：

- pure black
- neon
- cyberpunk
- AI dashboard
- SaaS card
- crypto analytics
- generic scatter plot
- cold tech interface

---

## 1. 当前问题诊断

### 1.1 视觉问题

当前页面虽然功能结构清楚，但视觉气质偏向：

- 纯黑背景；
- 薄荷绿科技感 accent；
- 普通 dashboard 卡片；
- 标准散点图；
- 结果列表缺乏层级；
- AI 感强于“米的气质”。

这会让用户感觉它是一个技术 demo，而不是一个值得信任的选米服务。

### 1.2 品牌气质错位

大米的核心情绪应该是：

- 温润；
- 自然；
- 安心；
- 日常但讲究；
- 土地感；
- 季节感；
- 日式料理感；
- 高级但不冰冷。

因此，页面不应该像科技产品，而应该像：

- 高级米铺；
- 日式料理品鉴台；
- 和纸上的风味图谱；
- 侍米师为用户挑选今日一膳。

### 1.3 交互逻辑需要解耦

当前需要明确拆分两套逻辑：

#### A. 坐标推荐

由以下交互触发：

- 矩阵点击；
- 探针拖拽；
- 硬度 slider；
- 甘味 slider。

它只负责：

> 根据 hardness × sweetness 的二维物理坐标，实时计算附近的大米。

特点：

- 即时；
- 快速；
- 所点即所得；
- 不触发 LLM；
- 不触发语义检索；
- 不显示复杂 loading。

#### B. 侍米师语义推荐

由下方文本输入触发。

例如用户输入：

- `刺身に合う米`
- `冷めても美味しいお弁当用`
- `カレーに負けない粒感`
- `今日は少し甘めで、やさしいご飯が食べたい`

它才负责：

> 使用 AI / embedding / pgvector / semantic recommendation 进行语义推荐。

特点：

- 场景理解；
- 料理搭配；
- 用户情绪；
- 生活语境；
- 可出现轻量 loading；
- 与坐标推荐互不干扰。

---

## 2. 本次重构范围

目标文件：

```txt
src/components/FlavorMatrix.tsx

可以在同文件内拆分内部子组件，例如：

FlavorMap
TasteProbe
RiceDot
RankingPanel
BestMatchCard
RunnerUpList
SommelierConsultation
TasteSlider
但不要在没有必要的情况下新增大量文件。


3. 不允许做的事情
请严格避免以下行为：

不要删除 Supabase 数据流；
不要把真实数据替换成 mock data；
不要伪造 API；
不要引入项目中未安装的依赖；
不要使用纯黑 #000000 作为主背景；
不要使用廉价 neon / cyberpunk 风格；
不要把界面做成普通 analytics dashboard；
不要让 slider 或矩阵点击触发 LLM；
不要让文本语义推荐反向污染当前坐标探针状态，除非代码中已有明确需求；
不要在 JSX 中堆大段业务逻辑；
不要使用 any；
不要忽略 loading / error / empty 状态；
不要输出伪代码。
4. 设计方向
4.1 设计一句话
KomeSomme 不是一个 AI 选米工具，而是一张可以被触摸的日式米味品鉴图。

4.2 视觉氛围
页面应让用户感受到：

像站在高级米铺的品鉴台前；
像在暗色陶器、和纸、稻穗金之间探索米的风味；
AI 存在于背后，但界面前台是“侍米师”和“今日一膳”。
4.3 色彩方向
从当前：



pure black + mint green
调整为：



warm charcoal + rice white + dark ceramic + restrained gold + washi beige
建议色彩变量：



const theme = {
  background: "#171411",      // warm charcoal
  backgroundDeep: "#100e0c",  // deep warm black, not pure black
  surface: "#211d18",         // dark ceramic
  surfaceSoft: "#2b251e",     // warm slate / roasted clay
  riceWhite: "#f3ead8",       // warm rice white
  mutedRice: "#c8bda9",       // aged washi paper
  mutedText: "#9d927f",       // muted beige gray
  gold: "#d6b56d",            // restrained rice-straw gold
  goldSoft: "#b99a5f",
  goldGlow: "rgba(214, 181, 109, 0.22)",
  wood: "#7a5638",
  moss: "#8f9b76",
  border: "rgba(243, 234, 216, 0.12)",
};
如果代码中使用 Tailwind class，可用 arbitrary value：



bg-[#171411]
bg-[#211d18]
text-[#f3ead8]
text-[#c8bda9]
border-[#f3ead8]/10
from-[#171411]
to-[#100e0c]
4.4 材质方向
需要增加以下质感：

背景
不要纯色黑；
使用 warm radial gradient；
可以叠加非常轻微的 noise / washi texture；
页面底部或矩阵周围可以有微弱 vignette；
不要过强对比。
示例方向：



background:
  radial-gradient(circle at 30% 20%, rgba(214,181,109,0.08), transparent 32%),
  radial-gradient(circle at 70% 80%, rgba(122,86,56,0.12), transparent 36%),
  linear-gradient(135deg, #171411 0%, #100e0c 100%);
卡片
使用深陶色 glassmorphism；
边框极细；
内发光非常克制；
不要普通 SaaS 白边卡片；
不要强阴影。
示例：



bg-[#211d18]/70
backdrop-blur-xl
border border-[#f3ead8]/10
shadow-[0_24px_80px_rgba(0,0,0,0.35)]
高亮
主高亮不再使用 mint green，改用 restrained gold：



text-[#d6b56d]
border-[#d6b56d]/30
shadow-[0_0_40px_rgba(214,181,109,0.16)]
5. 信息架构调整
当前布局可以继续保持左右两栏，但需要重构层级。

建议布局：



┌──────────────────────────────────────────────┬──────────────────────────────┐
│ 左侧：Flavor Map / 品鉴矩阵                   │ 右侧：当前味わい + 推荐结果   │
│                                              │                              │
│ 标题 + 品牌化说明                             │ 当前の味わい                  │
│                                              │ - 粒感 slider                 │
│ 2D 风味矩阵                                  │ - 甘み slider                 │
│ - 和纸质感背景                                │                              │
│ - 克制网格                                    │ 侍米師の一番手                │
│ - 米粒光点                                    │ [No.1 大卡片]                 │
│ - 探针 ripple                                 │                              │
│                                              │ 次点候補                      │
│ 坐标轴说明                                    │ [No.2] [No.3] [No.4]          │
│                                              │                              │
│                                              │ 侍米師に相談                  │
│                                              │ [文本输入]                    │
│                                              │ [一膳を提案してもらう]         │
└──────────────────────────────────────────────┴──────────────────────────────┘
移动端时：



1. 标题
2. 矩阵
3. slider
4. 推荐结果
5. 侍米师输入
6. 文案修改
6.1 页面标题
当前：



風味マトリクス
建议保留，但可增加副标题：



風味マトリクス
硬さと甘みから、今日の一膳を探します。
或：



KomeSomme Flavor Map
好みの一膳を、硬さと甘みから探します。
6.2 矩阵说明文
当前偏工具说明：



探針を置いた座標から、硬さと甘みの近さで銘柄を並べ替えます。
改为更品牌化：



探針を置くと、味わいの近い銘柄が静かに浮かび上がります。
或：



硬さと甘みの地図をたどりながら、食卓に合うお米を見つけます。
6.3 轴文案
X 轴：



粒感
やわらか —— しっかり
Y 轴：



甘み
すっきり —— ふくよか
尽量将「硬さ」保留在数据层，将用户可见文案更多使用「粒感」。

6.4 Slider 文案
当前：



硬さ
硬さを調整

甘み
甘みを調整
改为：



粒感
やわらか / ほどよい / 粒立ち / しっかり

甘み
すっきり / ほの甘い / 甘み豊か / ふくよか
Slider label：



粒感を選ぶ
甘みを選ぶ
6.5 推荐区标题
当前：



AIが選んだ銘柄
改为：



侍米師のおすすめ
No.1 区块：



侍米師の一番手
No.2-4：



次点候補
或：



同席にすすめたい銘柄
6.6 AI 输入区
当前：



献立から探す
AIに相談
改为：



侍米師に相談
料理や気分から選ぶ
输入 placeholder：



例：刺身に合う、冷めても美味しい、カレーに負けない粒感
按钮文案：



一膳を提案してもらう
不要在用户主界面强调：



pgvector
embedding
LLM
vectorize
如果必须保留技术说明，请弱化为小字：



料理や好みの言葉から、味わいの近い銘柄を探します。
7. 交互逻辑设计
7.1 坐标模式
触发来源：

矩阵点击；
探针拖拽；
粒感 slider；
甘み slider。
更新内容：

当前 probe 坐标；
当前 hardness；
当前 sweetness；
推荐结果 top matches；
矩阵中相关点高亮；
No.1 推荐卡片；
No.2-4 次选列表。
不应该触发：

LLM；
semantic API；
pgvector 请求；
文本推荐 loading。
推荐计算：

如果当前 interaction 是坐标模式，优先使用 hardness/sweetness 的二维距离。
如果已有本地 embedding，也可以作为次要排序因子，但不要让坐标体验变慢。
坐标模式必须即时响应。
7.2 语义推荐模式
触发来源：

用户在「侍米師に相談」输入文本；
点击「一膳を提案してもらう」。
更新内容：

semantic recommendation 结果；
可以在推荐区显示语义推荐状态；
可以显示“料理に合う理由”。
不应该：

自动移动当前坐标探针；
覆盖用户通过 slider 选择的坐标；
与坐标推荐混为一谈。
建议状态字段：



type RecommendationMode = "coordinate" | "semantic";
当用户操作矩阵 / slider：



setRecommendationMode("coordinate");
当用户提交文本：



setRecommendationMode("semantic");
7.3 “座標に戻す”
如果当前已经存在「座標に戻す」，它应只做：



从 semantic recommendation 结果回到当前坐标推荐结果。
或者：



清除语义查询，显示基于当前探针坐标的推荐。
8. 矩阵视觉重构
8.1 矩阵容器
矩阵不应像普通 chart，而应像一个温润的“品鉴台”。

设计要求：

背景为 dark ceramic / warm charcoal；
网格线低对比；
边缘有轻微 vignette；
内部有微弱金色暖光；
可叠加 washi/noise 质感；
四角或四象限可放置非常淡的语义提示。
建议 class 风格：



relative overflow-hidden rounded-[2rem]
bg-[#211d18]/70
border border-[#f3ead8]/10
backdrop-blur-xl
shadow-[0_30px_100px_rgba(0,0,0,0.45)]
8.2 网格
网格应：

低对比；
不抢视觉；
像和纸上的淡墨线；
不要像 trading chart。
网格颜色：



rgba(243, 234, 216, 0.06)
主要轴线可稍强：



rgba(243, 234, 216, 0.10)
8.3 四象限提示
可以在矩阵四角放置小字：

左下：



軽やか
すっきり
左上：



やわらか
ふくよか
右下：



粒立ち
淡麗
右上：



しっかり
甘み豊か
样式：



text-[10px]
tracking-[0.24em]
uppercase
text-[#c8bda9]/35
8.4 点位 Rice Dots
每款大米点位：

默认状态：

小圆点；
米白或浅金色；
opacity 较低；
有极轻微 pulse；
不要大面积发光。
Hover 状态：

点位变亮；
出现小 halo；
显示 rice name tooltip；
cursor pointer。
Selected 状态：

金色细环；
halo 稍强；
name label 可以常驻；
对应右侧详情更新。
Top matches：

top 1 最亮；
top 2-4 次亮；
非相关点 opacity 降低。
建议视觉层级：



No.1 dot:
- bg gold
- ring gold/40
- glow gold/25

No.2-4 dot:
- bg riceWhite
- ring riceWhite/20
- opacity 0.9

Other dots:
- bg mutedRice
- opacity 0.35
8.5 探针 Taste Probe
探针是用户当前选择的味觉坐标。

视觉要求：

不要做科技准星；
像水滴、香气、墨迹涟漪；
使用 gold/rice white warm glow；
拖动时柔和跟随；
点击时产生 ripple。
探针结构建议：



outer ripple circle
middle soft halo
inner rice-gold dot
Motion：

点击矩阵时 ripple 从探针中心扩散并淡出；
拖拽时探针使用 spring transition；
推荐结果 stagger 更新。
避免：

扫描线；
激光；
大幅旋转；
夸张 bounce；
科幻 HUD。
9. 推荐区重构
9.1 当前问题
当前 4 个推荐项视觉权重相同，缺少“侍米师帮你做判断”的感觉。

9.2 新结构
推荐区分为：



1. 当前の味わい
2. 侍米師の一番手
3. 次点候補
4. 侍米師に相談
9.3 当前の味わい
展示当前坐标状态：



現在の味わい

粒感     2.20    やわらか
[slider]

甘み     3.36    ほの甘い
[slider]
状态词规则示例：



function getHardnessLabel(value: number) {
  if (value < 2.5) return "やわらか";
  if (value < 3.5) return "ほどよい";
  if (value < 4.3) return "粒立ち";
  return "しっかり";
}

function getSweetnessLabel(value: number) {
  if (value < 2.5) return "すっきり";
  if (value < 3.5) return "ほの甘い";
  if (value < 4.3) return "甘み豊か";
  return "ふくよか";
}
9.4 No.1 首选卡
标题：



侍米師の一番手
卡片内容：



No.1
銘柄名
産地 / 品種 / 生産者
Match score
推荐理由
味わい指标
示例文案：



現在の座標に最も近い、やわらかさと甘みの均衡がよい一膳。
卡片视觉：

比其他项更大；
有细金边；
轻微 warm glow；
可带“推薦”印章；
不要太花。
建议字段兼容：



name
origin
prefecture
variety
producer
sweetness
hardness
aroma
texture
finish
flavor_notes
9.5 No.2-4 次选列表
标题：



次点候補
每项内容：



排名
名称
产地
match score
一句差异说明
差异说明可以基于坐标生成，例如：

より粒立ちを感じたいときに。
甘みを少し抑えたい食卓に。
冷めてもまとまりやすい候補。
如果没有足够数据，不要强行编造太具体内容，使用保守文案：



現在の味わいに近い候補です。
9.6 Match Score
当前截图里 score 是 60、57 这种数字。

建议显示为：



60%
或：



Match 60
但对消费者更友好的是：



相性 60
推荐：



相性 60
或者：



Taste Match 60
整体保持日文产品感时用：



相性
10. 侍米师输入区
10.1 目的
文本输入不再是普通 AI 搜索框，而是：

用户告诉侍米师今天的料理、心情、需求，由系统推荐合适的大米。

10.2 UI 文案
标题：



侍米師に相談
副标题：



料理や気分から、今日の一膳を探します。
输入 placeholder：



例：刺身に合う、冷めても美味しい、カレーに負けない粒感
按钮：



一膳を提案してもらう
10.3 触发逻辑
只在用户点击按钮或提交表单时触发。

不要在输入过程中实时触发 LLM。

10.4 Loading 状态
Loading 不要写成：



Loading...
建议：



味わいを読み解いています
或：



料理に合う一膳を探しています
视觉：

小型 spinner；
或 gentle pulse；
不要大面积 loading skeleton；
不要科技扫描动画。
10.5 Error 状态
错误文案：



うまく読み取れませんでした。少し言葉を変えて、もう一度お試しください。
不要直接暴露技术错误。

11. 数据与类型要求
11.1 类型定义
请确保类型安全，避免 any。

建议定义：



type RiceProfile = {
  id: string;
  name: string;
  variety?: string | null;
  origin?: string | null;
  prefecture?: string | null;
  producer?: string | null;
  sweetness?: number | null;
  hardness?: number | null;
  aroma?: string | null;
  texture?: string | null;
  finish?: string | null;
  flavor_notes?: string[] | string | null;
  embedding?: number[] | null;
  taste_vector?: number[] | null;
};

type MatrixPoint = {
  rice: RiceProfile;
  x: number;
  y: number;
};

type MatchResult = {
  rice: RiceProfile;
  score: number;
  distance: number;
  reason?: string;
};

type ProbePosition = {
  hardness: number;
  sweetness: number;
};

type RecommendationMode = "coordinate" | "semantic";
根据当前项目实际字段进行适配，不要因为字段不存在而崩溃。

11.2 字段兼容
请兼容类似字段：



id
name
variety
origin
prefecture
producer
sweetness
hardness
aroma
texture
finish
flavor_notes
embedding
taste_vector
如果 origin 不存在但有 prefecture，使用 prefecture。

如果 flavor_notes 是字符串或数组，都要安全处理。

11.3 数值范围
假设 hardness / sweetness 是 1-5 或 0-5 之间。

请根据当前数据自动做安全处理：

如果值为空，给中性值；
如果超出范围， clamp；
不要让点位跑出矩阵。
建议：



const MIN_TASTE_VALUE = 1;
const MAX_TASTE_VALUE = 5;
如果当前代码已使用 0-5，则保持现有逻辑，不要破坏数据。

12. 核心函数要求
请将核心计算从 JSX 中抽出。

需要至少整理以下函数：



function clamp(value: number, min: number, max: number): number

function normalizeTasteValue(value: number | null | undefined): number

function valueToPosition(
  value: number,
  min: number,
  max: number
): number

function positionToValue(
  position: number,
  min: number,
  max: number
): number

function getHardnessLabel(value: number): string

function getSweetnessLabel(value: number): string

function calculateCoordinateDistance(
  target: ProbePosition,
  rice: RiceProfile
): number

function calculateCoordinateScore(
  distance: number
): number

function cosineSimilarity(a: number[], b: number[]): number

function getRiceVector(rice: RiceProfile): number[] | null

function calculateTopMatches(
  riceList: RiceProfile[],
  target: ProbePosition
): MatchResult[]
如果已有 768/3072 维 embedding，则保留 vector similarity 逻辑，但坐标交互应优先保证即时。

12.1 坐标推荐算法
推荐简单、稳定、可解释：



distance = sqrt((rice.hardness - target.hardness)^2 + (rice.sweetness - target.sweetness)^2)
score = 100 - normalizedDistance * 100
score clamp 到 0-100。

排序：



distance 越小越靠前
12.2 语义推荐算法
如果已有 API / Supabase RPC / pgvector 查询，请保留。

如果尚未实现，不要伪造请求。保留清晰 handler：



const handleSemanticRecommend = async () => {
  if (!query.trim()) return;

  setRecommendationMode("semantic");

  // TODO: connect to existing semantic recommendation API or Supabase RPC.
  // Do not fake API response here.
};
如果项目中已经有可用接口，请接入现有接口。

13. Motion 要求
使用 Framer Motion 时，动效要克制。

13.1 适合使用
fade in；
slight scale；
soft spring；
subtle stagger；
layout animation；
ripple fade；
hover lift 1-2px；
opacity transition。
13.2 避免使用
夸张 bounce；
大幅旋转；
粒子爆炸；
扫描线；
闪烁 neon；
cyber HUD；
快速高频动画。
13.3 推荐参数


const spring = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.8,
};

const softFade = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};
13.4 Ripple
点击矩阵时：

在探针位置产生一圈淡金色 ripple；
0.6-0.9 秒淡出；
不要持续无限扩散。
视觉：



border border-[#d6b56d]/30
bg-[#d6b56d]/10
scale from 0.4 to 2.2
opacity from 0.6 to 0
14. Loading / Empty / Error 状态
14.1 Loading
不要普通 skeleton。

建议：



銘柄を読み込んでいます
视觉：

温暖暗色卡片；
一个米粒状 pulse；
小字说明；
不要强烈 spinner。
14.2 Empty
文案：



まだ銘柄が登録されていません。
副文案：



味わいの地図に表示するお米を追加してください。
14.3 Error
文案：



銘柄を読み込めませんでした。
副文案：



時間をおいてもう一度お試しください。
不要暴露完整技术错误，除非开发环境。

15. Responsive 要求
Desktop
左侧矩阵占主要视觉；
右侧 panel 控制在 360-420px；
整体有充足留白；
推荐区不拥挤。
建议：



grid-cols-[minmax(0,1fr)_380px]
Tablet
两栏可以缩小；
推荐区仍在右侧或下方。
Mobile
改为单列：



1. header
2. matrix
3. sliders
4. recommendation
5. sommelier input
矩阵高度：



min-h-[360px]
避免横向溢出。

16. 可访问性
请确保：

button 有明确 hover / disabled 状态；
输入框有 label 或 aria-label；
矩阵点位可点击；
tooltip 不遮挡主要操作；
颜色对比足够；
loading 状态有文本；
不仅依赖颜色表达 selected/top match，也使用 ring/size/label。
17. 代码结构建议
建议组件内部结构：



export default function FlavorMatrix() {
  // 1. state
  // 2. fetch Supabase data
  // 3. derived values via useMemo
  // 4. handlers
  // 5. render states
  // 6. main render
}
内部子组件：



function FlavorMap(...)
function RiceDot(...)
function TasteProbe(...)
function TasteSlider(...)
function RankingPanel(...)
function BestMatchCard(...)
function RunnerUpItem(...)
function SommelierConsultation(...)
核心计算函数放在组件外部，位于同文件顶部或底部。

18. 验收标准
完成后应满足以下标准：

18.1 视觉验收
页面不再是纯黑科技风；
整体呈现 warm dark / rice white / restrained gold 气质；
矩阵像品鉴台，不像普通散点图；
推荐区有明显 No.1 主次层级；
视觉上有“高级米铺 / 日式品鉴”的温度；
没有廉价 neon；
没有 generic SaaS dashboard 感。
18.2 交互验收
点击矩阵可以移动探针；
拖拽探针可以更新坐标；
slider 可以更新坐标；
推荐结果实时变化；
top match 点位明显高亮；
No.1 卡片随坐标更新；
文本输入只在提交时触发语义推荐逻辑；
坐标推荐和语义推荐互不干扰；
「座標に戻す」可以回到坐标推荐结果。
18.3 技术验收
TypeScript 无明显类型错误；
不使用 any；
不引入未安装依赖；
不删除 Supabase 数据流；
没有 mock data 替代真实数据；
loading / empty / error 状态完整；
坐标转换、相似度计算、推荐排序逻辑清晰；
JSX 中没有大量复杂业务计算。
19. 最终输出要求
请直接输出完整的：



src/components/FlavorMatrix.tsx
要求：

可直接运行；
代码干净；
类型安全；
UI 高级；
动效克制；
逻辑清晰；
保留 Supabase 数据流；
坐标推荐与语义推荐解耦；
不输出长篇解释；
不输出伪代码。
