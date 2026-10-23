import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const PAL = { ink:'#141821', muted:'#5e6778', line:'#9ca4b4', surface:'#ffffff', accent:'#1d4ed8', accentSoft:'#e8effd', accentInk:'#173da6' };

function Code({ file, code, hl=[] }: {file:string; code:string; hl?:number[]}) {
  return <div className="code-panel"><div className="code-caption">{file}</div><pre>{code.split('\n').map((line,i)=><span key={i} className={`code-line ${hl.includes(i+1)?'highlight':''}`}>{line||' '}</span>)}</pre></div>;
}
function Worlds({hp=false}: {hp?:boolean}) {
  return <figure className="worlds"><img src={`${import.meta.env.BASE_URL}images/slime-worlds-cutout.png`} alt="森林、海洋、高山三张地图中的史莱姆" /><figcaption>{['森林地图','海洋地图','高山地图'].map(name=><span key={name}>{name}{hp&&<small>基础生命值 100</small>}</span>)}</figcaption></figure>;
}
function Route({group=false}:{group?:boolean}) {
  const nodes=group ? [
    ['Ripple服务端 B','保存更新并通知订阅者'],
    ['Ripple客户端 C2','森林地图 · 组内入口'],
    ['Ripple客户端 C3','海洋地图 · 接收转发'],
  ] : [
    ['Ripple客户端 C1','管理端 · 提交修改'],
    ['Ripple服务端 A','接收并保存更新'],
    ['Ripple服务端 B','本次选定的同步目标'],
    ['Ripple客户端 C2','森林地图 · 接收更新'],
  ];
  return <div className="route" role="img" aria-label={nodes.map(n=>n.join('，')).join('，然后')}>
    {nodes.map(([name,detail],i)=><div className="route-stop" key={name}><strong>{name}</strong><span>{detail}</span>{i<nodes.length-1&&<span aria-hidden="true" className="route-arrow">→</span>}</div>)}
  </div>;
}

function NodeMap() {
  const collaborators = [
    ['Storage', 'SqliteStorage', '保存配置、消息与 ACK'],
    ['Overlay', 'calculateNodesToSync()', '计算同步目标'],
    ['ClientDispatcher', 'EqualDivision', '分组通知订阅者'],
    ['MessageBasedResolver', 'merge()', '从消息历史计算值'],
    ['Tracker / Worker', 'retry()', '记录进度并安排重试'],
  ];
  return (
    <svg className="arch-diagram" viewBox="0 0 1200 260" role="img" aria-label="RippleClient 请求 Node，Node 协调存储、同步目标、分组通知、读取合并和重试五项职责">
      <defs><marker id="nm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill={PAL.line} /></marker></defs>
      <rect x={135} y={8} width={240} height={64} rx={6} fill={PAL.surface} stroke={PAL.line} />
      <text x={255} y={35} textAnchor="middle" fontSize={20} fontWeight={600} fill={PAL.ink}>RippleClient</text>
      <text x={255} y={57} textAnchor="middle" fontSize={16} fill={PAL.muted}>ripple-client</text>
      <path d="M375 40 H475" stroke={PAL.line} strokeWidth={1.5} markerEnd="url(#nm-arrow)" />
      <text x={425} y={29} textAnchor="middle" fontSize={16} fill={PAL.muted}>请求</text>
      <rect x={480} y={8} width={240} height={64} rx={6} fill={PAL.accentSoft} stroke={PAL.accent} />
      <text x={600} y={35} textAnchor="middle" fontSize={22} fontWeight={700} fill={PAL.accentInk}>Node</text>
      <text x={600} y={57} textAnchor="middle" fontSize={16} fill={PAL.muted}>ripple-server</text>
      <path d="M600 72 V112 M116 112 H1084" stroke={PAL.line} strokeWidth={1.5} fill="none" />
      {collaborators.map(([title, method, detail], i) => {
        const x=6+i*242;
        return <g key={title}>
          <path d={`M${x+110} 112 V146`} stroke={PAL.line} strokeWidth={1.5} markerEnd="url(#nm-arrow)" />
          <rect x={x} y={150} width={220} height={100} rx={6} fill={PAL.surface} stroke={PAL.line} />
          <text x={x+110} y={179} textAnchor="middle" fontSize={title.length>18 ? 17 : 19} fontWeight={600} fill={PAL.ink}>{title}</text>
          <text x={x+110} y={204} textAnchor="middle" fontSize={15.5} fill={PAL.accentInk}>{method}</text>
          <text x={x+110} y={230} textAnchor="middle" fontSize={16} fill={PAL.muted}>{detail}</text>
        </g>;
      })}
    </svg>
  );
}

type Slide = { title:string; heading?:string; layout?:string; body:ReactNode };
const slides: Slide[] = [
  {
    title:'Ripple 源码阅读与可靠性分析', layout:'cover',
    body:<div className="cover-content">
      <img className="cover-art" src={`${import.meta.env.BASE_URL}images/slime-cover-cutout.png`} alt="绿色史莱姆站在草地上" />
      <div className="cover-copy"><p className="cover-name">Ripple</p><h1>一项配置更新<br />如何到达每张地图</h1><p className="cover-subtitle">源码阅读与可靠性分析</p><p className="cover-credit">面向对象程序设计课程汇报<br />盛泽辰</p></div>
    </div>,
  },
  {
    title:'三个地图进程共享一项配置', heading:'从一项游戏配置开始', layout:'scene-page',
    body:<div className="page-body">
      <p>网络游戏由多个进程协作运行。登录进程处理账号与连接，地图进程负责移动、怪物生成和战斗，需要保存的数据交给数据服务。玩家数量增加后，这些进程可以分布在不同机器上，通过网络交换消息。</p>
      <p>这里关注森林、海洋、高山三个地图进程。它们都会生成史莱姆，生成时读取基础生命值 <strong>100</strong>。每个进程都有自己的内存和本地状态；即使使用同一个配置键，修改森林一侧的数据，海洋和高山也不会自动跟着改变。</p>
      <Worlds hp />
    </div>,
  },
  {
    title:'将基础生命值从 100 调整到 200', layout:'value-page',
    body:<div className="page-body">
      <p>现在，管理端希望把史莱姆的基础生命值改成 <strong>200</strong>，让三个地图后续生成的史莱姆都使用新值。</p>
      <div className="value-change"><span className="config-key">game / slime.baseHp</span><div><span className="old-value">100</span><span className="value-to">改为</span><strong>200</strong></div></div>
      <p>如果配置保存在各个进程的本地文件中，就需要逐台修改并重新加载；只在启动时读取配置的程序，还需要安排重启。地图实例越多，这次调整需要协调的文件和加载时机也越多。</p>
      <p>当森林已经改成 200、海洋还停在 100 时，两张地图新生成的史莱姆就有了不同的生命值。我们因此引入配置分发系统：管理端提交一次修改，由它保存新值、找到接收者，再把更新送到各个地图进程。</p>
    </div>,
  },
  {
    title:'订阅登记与配置发布', layout:'reading-page',
    body:<div className="page-body">
      <p>配置系统收到 <strong>200</strong> 后，首先要知道哪些进程在使用这项配置。森林、海洋地图提前登记自己的接收地址，并说明它们关心的是哪一项配置。</p>
      <div className="config-focus"><span>应用名 <code>game</code></span><span>配置键 <code>slime.baseHp</code></span></div>
      <p>这次登记就是<strong>订阅</strong>。管理端向同一应用名和配置键写入字符串 <code>200</code>，就是一次<strong>发布</strong>。系统根据这两个标识查找已登记的接收者，把这次修改送过去；地图进程取得新值后，再用它生成史莱姆。</p>
      <p>森林地图增加新实例时，新实例也来登记订阅。管理端仍然只提交配置键和新值，接收地址由配置系统维护。这样，发布一次修改的操作可以保持不变，接收者则随着地图实例的增减而变化。</p>
    </div>,
  },
  {
    title:'Ripple 的作用与一次更新的参与者', heading:'走进 Ripple', layout:'architecture-page',
    body:<div className="page-body">
      <p>Ripple 是面向大规模集群的发布订阅系统。在这个场景里，管理端通过 <strong>Ripple客户端 C1</strong> 写入配置；地图进程通过各自的 Ripple客户端订阅和读取配置。</p>
      <p>Ripple服务端接收请求、保存消息，再把消息传给其他 Ripple服务端和已订阅的 Ripple客户端。下面用 A 表示接收写入的 Ripple服务端，用 B 表示这次选定的同步目标。</p>
      <Route />
      <p>森林地图中的 <strong>Ripple客户端 C2</strong> 接收并保存更新后，游戏逻辑读取新值，用它生成后续的史莱姆。接下来就沿着 C1、A、B、C2 这条路径，依次查看写入、保存、同步和订阅通知的代码。</p>
    </div>,
  },
  {
    title:'Node 与协作对象', layout:'objects-page',
    body:<div className="page-body">
      <p>C1 的操作入口是 <code>RippleClient</code>，位于 <code>ripple-client</code>；A、B 上协调请求的是 <code>Node</code>，位于 <code>ripple-server</code>。</p>
      <p>Node 收到更新后，通过 Storage 保存消息，通过 Overlay 计算同步目标，通过 ClientDispatcher 通知订阅者。读取时由 Resolver 合并消息，Tracker 与 Worker 则处理同步进度和重试。</p>
      <div className="object-map"><NodeMap /></div>
      <p className="compact-copy">例如，把 Overlay 的实现从星型换成树形，Node 仍调用同一个 <code>calculateNodesToSync()</code> 接口，具体发送给谁由所选策略决定。阅读源码时，可以先跟踪 Node 的调用顺序，再进入各个实现，确认它们接收什么数据、返回什么结果。</p>
    </div>,
  },
  {
    title:'写入消息与读取当前值', layout:'storage-page',
    body:<div className="page-body">
      <p>C1 调用下面的接口，向 A 异步发送写入请求。A 上的 <code>PutRequestHandler</code> 取出应用名、配置键和新值，再调用 <code>Node.put()</code>。</p>
      <Code file="RippleClient.put()" code={'put("game", "slime.baseHp", "200");'} />
      <p>Node 为这次修改创建一条 UpdateMessage，其中包括值、时间、UUID 和源节点编号。SQLite 保存配置身份与消息历史；读取当前值时，Resolver 再从历史中选择消息。</p>
      <div className="message-history"><p><span>较早的全量消息</span><code>value = 100</code></p><p className="current-message"><span>较新的全量消息</span><code>value = 200</code></p></div>
      <p>这里选中的是较新的全量消息，因此 <code>Item.value</code> 被赋为 <strong>200</strong>。原来值为 100 的消息仍属于历史记录。消息的 UUID 则标识这一次修改：同一条更新在节点间传播时，重复检查和同步进度都围绕这个 UUID 进行。</p>
    </div>,
  },
  {
    title:'成功响应与后台同步', layout:'response-page',
    body:<div className="page-body">
      <p>A 在 <code>Node.propagateMessage()</code> 中检查消息是否重复、写入本地存储、初始化同步进度并通知订阅者，随后把向其他 Ripple服务端同步的任务提交到线程池。</p>
      <Code file="Node.propagateMessage()" hl={[1,10]} code={`this.getExecutorService().submit(new Callable<Void>() {
    @Override
    public Void call() throws Exception {
        try {
            doSyncWithServer(message, sourceId, fromId, currentId);
            return null;
        } catch (Exception exception) { exception.printStackTrace(); return null; }
    }
});
return Result.SUCCESS;`} />
      <p><code>submit()</code> 后紧接着返回 <code>SUCCESS</code>，代码没有等待任务结束。C1 收到 A 的成功响应时，B 可能已保存更新，也可能还没收到消息。要知道这次修改是否继续送达，接下来还需要跟踪后台任务和它记录的同步进度。</p>
    </div>,
  },
  {
    title:'从 Ripple服务端通知到组内转发', layout:'dispatch-page',
    body:<div className="page-body">
      <p>B 保存更新后，查询此前登记的订阅关系。假设有六个 Ripple客户端订阅了这项配置，默认的分发器会先排序，再把它们分成三个组。</p>
      <p>假设森林地图的 C2 和海洋地图的 C3 同在一组，且 C2 排在前面。分发器用 <code>list.get(0)</code> 取出 C2，向它发送 Dispatch，并把 C3 留在待转发成员列表里。</p>
      <Route group />
      <p>C2 先把更新交给本地存储，取得组内成员列表后，再向 C3 发送 Sync。这一组的两次传输分别由 B 和 C2 完成。B 直接发送的目标减少了，C3 取得更新则需要 C2 继续转发；走完这一步，海洋地图才有这次修改对应的消息。</p>
    </div>,
  },
  {
    title:'Tracker 怎样筛选待重试目标', heading:'同步如何被记为完成', layout:'tracker-page',
    body:<div className="page-body">
      <p>如果 A 发给 B 的更新没有送达，B 仍保留 100。Ripple 为每条更新记录目标节点和已确认节点，后台 Worker 周期性调用 Tracker 重试。</p>
      <Code file="Tracker.getNodesToRetry()" hl={[2,3]} code={`for (Integer id : ack.getNodeList()) {
    if (!ack.getAckNodes().contains(id)) {
        ret.add(id);
    }
}`} />
      <p>这里的两个列表属于同一条更新消息。目标列表记录需要收集确认的节点，已确认列表记录代码已经记下的节点编号。B 在目标列表中、却不在已确认列表中时，才会被加入 <code>ret</code>，进入待重试集合。</p>
      <p>一旦写入 B 的确认，下一轮检查就会跳过它，即使 B 仍在使用 100。因此，要判断失败后是否还会补发，需要继续查看 <strong>B 的确认是在什么时候写进去的</strong>。</p>
    </div>,
  },
  {
    title:'发送请求后立即记录确认', layout:'ack-page',
    body:<div className="page-body">
      <p>在 <code>Node.doSyncWithServer()</code> 中，A 找到通向 B 的连接后，先提交发送，紧接着就记录 B 的确认。</p>
      <Code file="Node.doSyncWithServer() · 省略中间日志" hl={[1,2,3]} code={`Api.sync(channel, message);
this.getTracker().recordAck(
    message.getUuid(), message.getLastUpdateServerId(), nodeMetadata.getId());`} />
      <p><code>Api.sync()</code> 调用 <code>channel.writeAndFlush()</code> 后返回，没有等待发送完成或 B 保存消息。紧接着的 <code>recordAck()</code> 就把 B 的编号记进同步进度。B 返回的 SyncResponse 在处理器中只输出日志，没有用来更新 Tracker。</p>
      <div className="failure-state"><span>假设发送已提交，但消息在到达 B 之前传输失败</span><strong>B 仍是 100</strong><span>A 已把 B 记为已确认节点。下一轮重试检查列表时会跳过 B，这条补发路径因此没有再次发送 200。</span></div>
    </div>,
  },
  {
    title:'增量消息如何使用基消息', heading:'增量更新依赖历史', layout:'incremental-page',
    body:<div className="page-body">
      <p>再看一项配置 <code>game / slime.spawnMaps</code>，它记录哪些地图允许生成史莱姆。管理端先发布全量消息 M1，之后希望把高山地图加入列表。</p>
      <div className="message-spec"><p><strong>M1</strong><span>全量消息</span><code>森林地图,海洋地图</code></p><p><strong>M2</strong><span>以 M1 为基消息</span><code>add_entry ",高山地图"</code></p></div>
      <p>M2 只带追加的内容，以及 M1 的 UUID。读取时，Resolver 选出较新的 M2，按 UUID 找到 M1。源码中的 <code>add_entry</code> 将基消息的值与新字符串拼接，得到下面的地图列表。</p>
      <div className="resolved-value">森林地图,海洋地图,高山地图</div>
      <p>这个结果需要同时用到 M1 和 M2。M2 更新得更晚，却只保存了追加的部分；如果读取时只剩下 M2，就没有“森林地图,海洋地图”这段原始内容可供拼接。</p>
    </div>,
  },
  {
    title:'回收后基消息缺失', layout:'recycle-page',
    body:<div className="page-body">
      <p>接着发布 M3，删除“海洋地图”，再发布 M4，追加“高山地图”。两条增量消息都引用 M1，四条消息的时间依次递增。</p>
      <p>Node 创建默认 SQLite 存储时，把历史保留数量设为 3。四条写入后，下一次查询触发回收，按时间留下 M2、M3、M4，删除最旧的 M1；这个筛选过程没有检查 M4 中的基消息 UUID。</p>
      <div className="retained-messages"><span className="removed">M1 <small>已删除</small></span><span>M2</span><span>M3</span><span>M4 <small>仍引用 M1</small></span></div>
      <Code file="LastWriteWinsResolver.merge()" hl={[1]} code={`if (baseMessage.isPresent()) {
    current.setValue(this.mergeValue(
        (IncrementalUpdateMessage) wins, baseMessage.get()));
}`} />
      <p>读取时选中了最新的 M4，再从剩下的历史中查找 M1。由于查找结果为空，上面的赋值不会执行，新建 Item 的值保持 <strong>null</strong>。M4 本身仍然存在，但它只有追加内容，计算完整值需要的 M1 已被回收。</p>
    </div>,
  },
  {
    title:'回到游戏中的两种结果', layout:'closing-page',
    body:<div className="page-body">
      <p>回到最初的游戏场景。管理端只提交一次生命值 200，Ripple 将它保存成消息，再通过 Ripple服务端之间的同步和 Ripple客户端之间的转发，逐步送到使用这项配置的地图进程。</p>
      <p>沿着这条路径，第一处问题出现在发送与确认之间。A 提交发送后立即记录 B 的确认；如果消息随后没有到达 B，B 仍然保留 100，而 Tracker 又会因为这个确认跳过 B。此时需要核对的是<strong>进度记录与实际接收结果是否一致</strong>。</p>
      <p>第二处问题出现在历史回收与读取之间。地图列表的最新消息 M4 已经保存，但它引用的全量消息 M1 被删除。Resolver 找不到基消息，也就无法拼出完整列表。此时需要核对的是<strong>保留下来的历史是否足够重建当前值</strong>。</p>
      <p>从对象协作来看，Node 把发送、进度记录、存储和合并交给了不同对象。逐个阅读这些方法后，还要把它们串回同一次更新：谁产生确认，谁使用确认；谁删除历史，谁又需要这段历史。这两处调用关系，就是本次源码阅读中最值得继续分析的地方。</p>
    </div>,
  },
  {
    title:'致谢', layout:'thanks-page',
    body:<div className="thanks-content"><p className="thanks-kicker">Ripple · 源码阅读与可靠性分析</p><h1>感谢聆听</h1><p className="thanks-invitation">欢迎提问与交流</p><p className="thanks-credit">盛泽辰 · 面向对象程序设计</p></div>,
  },
];

/* ---------- 外壳：翻页 / 缩放 / 目录 ---------- */
const TOTAL_PAGES = slides.length - 1; // 封面后为内容页
function readPage() {
  const n = Number(location.hash.slice(1));
  return Number.isInteger(n) && n >= 0 && n <= TOTAL_PAGES ? n : 0;
}

export function Presentation() {
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState(readPage);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [notice, setNotice] = useState('');
  const [overview, setOverview] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const go = (p: number) => setPage(Math.min(TOTAL_PAGES, Math.max(0, p)));

  async function enterFullscreen() {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); }
    catch { setNotice('浏览器未允许全屏，请点击右下角的全屏按钮。'); }
  }
  async function exitFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); }
    catch { setNotice('可按 Esc 退出浏览器全屏。'); }
  }

  useEffect(() => {
    const resize = () => { const r = viewport.current!.getBoundingClientRect(); setScale(Math.min(r.width / 1440, r.height / 810)); };
    const observer = new ResizeObserver(resize); observer.observe(viewport.current!); resize();
    const hashChange = () => setPage(readPage());
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('hashchange', hashChange); document.addEventListener('fullscreenchange', changed);
    return () => { observer.disconnect(); window.removeEventListener('hashchange', hashChange); document.removeEventListener('fullscreenchange', changed); };
  }, []);

  useEffect(() => {
    history.replaceState(null, '', page === 0 ? '#0' : `#${page}`);
    document.title = page === 0 ? 'Ripple 配置更新的传播机制与可靠性分析' : `第 ${page} 页 / 共 ${TOTAL_PAGES} 页 · ${slides[page].title}`;
  }, [page]);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || (e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)))) return;
      if (overview) return;
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageDown', 'PageUp'].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setPage(p => Math.min(TOTAL_PAGES, p + 1));
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setPage(p => Math.max(0, p - 1));
      if (e.key === 'Home') go(0);
      if (e.key === 'End') go(TOTAL_PAGES);
      if (e.key === 'ArrowUp') void enterFullscreen();
      if (e.key === 'ArrowDown') void exitFullscreen();
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [overview]);

  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (overview) menu.current?.showModal(); else if (menu.current?.open) { menu.current.close(); menuButton.current?.focus(); } }, [overview]);

  const slide = slides[page];
  const pageLabel = page === 0 ? '封面' : `${String(page).padStart(2, '0')} / ${TOTAL_PAGES}`;

  return (
    <div className="viewport" ref={viewport}
      onTouchStart={e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={e => { const s = touchStart.current; touchStart.current = null; if (!s || overview) return; const dx = e.changedTouches[0].clientX - s.x; const dy = e.changedTouches[0].clientY - s.y; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(page + (dx < 0 ? 1 : -1)); }}>
      <main className="slide" data-page={page} style={{ transform: `translate(-50%, -50%) scale(${scale})` }} aria-label={page === 0 ? '封面' : `第 ${page} 页，共 ${TOTAL_PAGES} 页`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div className={`slide-content ${slide.layout ?? ''}`} key={page} data-rendered-page={page}
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -5 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}>
            {slide.heading && <header className="section-heading"><h1>{slide.heading}</h1></header>}
            {slide.body}
          </motion.div>
        </AnimatePresence>
        <span className="page-number mono" aria-label="页码">{pageLabel}</span>
      </main>
      <nav className="controls" aria-label="演示控制">
        <button onClick={() => go(page - 1)} disabled={page === 0} aria-label="上一页">←</button>
        <button ref={menuButton} onClick={() => setOverview(true)} aria-label="打开目录">目录</button>
        <button onClick={() => go(page + 1)} disabled={page === TOTAL_PAGES} aria-label="下一页">→</button>
        <button onClick={() => void (fullscreen ? exitFullscreen() : enterFullscreen())}>{fullscreen ? '退出全屏' : '全屏'}</button>
      </nav>
      {notice && <div className="notice" role="status">{notice}</div>}
      <dialog ref={menu} className="overview" onCancel={() => setOverview(false)} onClick={e => { if (e.target === e.currentTarget) setOverview(false); }}>
        <div className="overview-heading"><h2>报告目录</h2><button onClick={() => setOverview(false)}>关闭</button></div>
        <div className="overview-list">
          {slides.map((s, i) => (
            <button key={i} className={i === page ? 'selected' : ''} onClick={() => { go(i); setOverview(false); }}>
              <span className="mono">{String(i).padStart(2, '0')}</span>{i === 0 ? `封面 · ${s.title}` : s.title}
            </button>
          ))}
        </div>
      </dialog>
      <div className="sr-only" aria-live="polite">{page === 0 ? '封面' : `第 ${page} 页 / 共 ${TOTAL_PAGES} 页`}，{slide.title}</div>
    </div>
  );
}
