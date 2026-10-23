import { useEffect, useRef, useState, type ReactNode } from 'react';

const PAL = { ink:'#141821', muted:'#5e6778', line:'#9ca4b4', surface:'#ffffff', accent:'#1d4ed8', accentSoft:'#e8effd', accentInk:'#173da6' };

function Code({ file, code, hl=[] }: {file:string; code:string; hl?:number[]}) {
  return <div className="code-panel"><div className="code-caption">{file}</div><pre>{code.split('\n').map((line,i)=><span key={i} className={`code-line ${hl.includes(i+1)?'highlight':''}`}>{line||' '}</span>)}</pre></div>;
}
function Worlds({hp=false}: {hp?:boolean}) {
  return <figure className="worlds"><img src="/images/slime-worlds-cutout.png" alt="森林、海洋、高山三张地图中的史莱姆" /><figcaption>{['森林地图','海洋地图','高山地图'].map(name=><span key={name}>{name}{hp&&<small>基础生命值 100</small>}</span>)}</figcaption></figure>;
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
      <img className="cover-art" src="/images/slime-cover-cutout.png" alt="绿色史莱姆站在草地上" />
      <div className="cover-copy"><p className="cover-name">Ripple</p><h1>一项配置更新<br />如何到达每张地图</h1><p className="cover-subtitle">源码阅读与可靠性分析</p><p className="cover-credit">面向对象程序设计课程汇报<br />盛泽辰</p></div>
    </div>,
  },
  {
    title:'三个地图进程共享一项配置', heading:'从一项游戏配置开始', layout:'scene-page',
    body:<div className="page-body">
      <p>网络游戏由多个进程协作运行。登录进程处理账号与连接，地图进程负责移动、怪物生成和战斗，需要保存的数据交给数据服务。</p>
      <p>森林、海洋、高山三个地图都会生成史莱姆，初始基础生命值都是 <strong>100</strong>。三个进程各自持有配置，修改森林一侧的数据，海洋和高山不会自动跟着改变。</p>
      <Worlds hp />
    </div>,
  },
  {
    title:'将基础生命值从 100 调整到 200', layout:'value-page',
    body:<div className="page-body">
      <p>现在，管理端希望把史莱姆的基础生命值改成 <strong>200</strong>，让三个地图后续生成的史莱姆都使用新值。</p>
      <div className="value-change"><span className="config-key">game / slime.baseHp</span><div><span className="old-value">100</span><span className="value-to">改为</span><strong>200</strong></div></div>
      <p>如果配置保存在各个进程的本地文件中，就需要逐台修改并重新加载；只在启动时读取配置的程序，还需要安排重启。</p>
      <p>当森林已经改成 200、海洋还停在 100 时，同一次数值调整就产生了两种结果。因此，我们需要一个系统接收这次修改，并把更新送到使用它的进程。</p>
    </div>,
  },
  {
    title:'订阅登记与配置发布', layout:'reading-page',
    body:<div className="page-body">
      <p>配置系统收到 <strong>200</strong> 后，首先要知道哪些进程在使用这项配置。森林、海洋地图提前登记自己的接收地址，并说明它们关心的是哪一项配置。</p>
      <div className="config-focus"><span>应用名 <code>game</code></span><span>配置键 <code>slime.baseHp</code></span></div>
      <p>这次登记就是<strong>订阅</strong>。管理端向同一配置键提交新值，就是一次<strong>发布</strong>。系统查找已登记的接收者，再把修改送过去。</p>
      <p>森林地图增加新实例时，新实例也来登记订阅。管理端仍然只提交一次修改，接收地址由配置系统维护。</p>
    </div>,
  },
  {
    title:'Ripple 的作用与一次更新的参与者', heading:'走进 Ripple', layout:'architecture-page',
    body:<div className="page-body">
      <p>Ripple 是面向大规模集群的发布订阅系统。在这个场景里，管理端通过 <strong>Ripple客户端 C1</strong> 写入配置；地图进程通过各自的 Ripple客户端订阅和读取配置。</p>
      <p>Ripple服务端接收请求、保存消息，再把消息传给其他 Ripple服务端和已订阅的 Ripple客户端。下面用 A 表示接收写入的 Ripple服务端，用 B 表示这次选定的同步目标。</p>
      <Route />
      <p>森林地图中的 <strong>Ripple客户端 C2</strong> 接收更新后，游戏逻辑读取新值，用它生成后续的史莱姆。</p>
    </div>,
  },
  {
    title:'Node 与协作对象', layout:'objects-page',
    body:<div className="page-body">
      <p>C1 的操作入口是 <code>RippleClient</code>，位于 <code>ripple-client</code>；A、B 上协调请求的是 <code>Node</code>，位于 <code>ripple-server</code>。</p>
      <p>Node 收到更新后，通过 Storage 保存消息，通过 Overlay 计算同步目标，通过 ClientDispatcher 通知订阅者。读取时由 Resolver 合并消息，Tracker 与 Worker 则处理同步进度和重试。</p>
      <div className="object-map"><NodeMap /></div>
      <p className="compact-copy">例如，把 Overlay 的实现从星型换成树形，Node 仍调用同一个 <code>calculateNodesToSync()</code> 接口；具体发送给谁，由所选策略决定。</p>
    </div>,
  },
  {
    title:'写入消息与读取当前值', layout:'storage-page',
    body:<div className="page-body">
      <p>C1 调用下面的接口，向 A 异步发送写入请求。A 上的 <code>PutRequestHandler</code> 取出应用名、配置键和新值，再调用 <code>Node.put()</code>。</p>
      <Code file="RippleClient.put()" code={'put("game", "slime.baseHp", "200");'} />
      <p>Node 为这次修改创建一条 UpdateMessage，其中包括值、时间、UUID 和源节点编号。SQLite 保存配置身份与消息历史；读取当前值时，Resolver 再从历史中选择消息。</p>
      <div className="message-history"><p><span>较早的全量消息</span><code>value = 100</code></p><p className="current-message"><span>较新的全量消息</span><code>value = 200</code></p></div>
      <p>这里选中的是较新的全量消息，因此 <code>Item.value</code> 被赋为 <strong>200</strong>。后续检查重复消息和记录同步进度，都使用这条消息的 UUID。</p>
    </div>,
  },
  {
    title:'成功响应与后台同步', layout:'response-page',
    body:<div className="page-body">
      <p>A 完成本地处理后，把同步任务提交到线程池，随后返回 <code>SUCCESS</code>。下面是 <code>Node.propagateMessage()</code> 中这段代码。</p>
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
      <p>代码没有等待这个任务结束。C1 收到 A 的成功响应时，B 可能已保存更新，也可能还没收到消息；这条响应路径没有把 B 的保存结果作为返回成功的条件。</p>
    </div>,
  },
  {
    title:'从 Ripple服务端通知到组内转发', layout:'dispatch-page',
    body:<div className="page-body">
      <p>B 保存更新后，查询此前登记的订阅关系。假设有六个 Ripple客户端订阅了这项配置，默认的分发器会先排序，再把它们分成三个组。</p>
      <p>假设森林地图的 C2 和海洋地图的 C3 同在一组，且 C2 排在前面。分发器用 <code>list.get(0)</code> 取出 C2，向它发送 Dispatch，并把 C3 留在待转发成员列表里。</p>
      <Route group />
      <p>C2 先把更新交给本地存储，再向 C3 发送 Sync。这一组的两次传输分别由 B 和 C2 完成；C3 取得更新后，海洋地图才有这次修改对应的消息。</p>
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
      <p>B 在目标列表中、却不在已确认列表中时，才会进入待重试集合。一旦写入 B 的确认，下一轮检查就会跳过它。</p>
      <p>因此，要判断失败后是否还会补发，需要继续查看 <strong>B 的确认是在什么时候写进去的</strong>。</p>
    </div>,
  },
  {
    title:'发送请求后立即记录确认', layout:'ack-page',
    body:<div className="page-body">
      <p>在 <code>Node.doSyncWithServer()</code> 中，A 找到通向 B 的连接后，先提交发送，紧接着就记录 B 的确认。</p>
      <Code file="Node.doSyncWithServer() · 省略中间日志" hl={[1,2,3]} code={`Api.sync(channel, message);
this.getTracker().recordAck(
    message.getUuid(), message.getLastUpdateServerId(), nodeMetadata.getId());`} />
      <p><code>Api.sync()</code> 只调用 <code>channel.writeAndFlush()</code> 发出请求，没有等 B 保存消息。B 返回的 SyncResponse 在处理器中只输出日志，没有用来更新 Tracker。</p>
      <div className="failure-state"><span>如果传输随后失败</span><strong>B 仍是 100</strong><span>但 A 已记录 B 的确认，下一轮重试会跳过 B。</span></div>
    </div>,
  },
  {
    title:'增量消息如何使用基消息', heading:'增量更新依赖历史', layout:'incremental-page',
    body:<div className="page-body">
      <p>再看一项配置 <code>game / slime.spawnMaps</code>，它记录哪些地图允许生成史莱姆。管理端先发布全量消息 M1，之后希望把高山地图加入列表。</p>
      <div className="message-spec"><p><strong>M1</strong><span>全量消息</span><code>森林地图,海洋地图</code></p><p><strong>M2</strong><span>以 M1 为基消息</span><code>add_entry ",高山地图"</code></p></div>
      <p>M2 只带追加的内容，以及 M1 的 UUID。读取时，Resolver 选出较新的 M2，按 UUID 找到 M1，再拼接两段字符串。</p>
      <div className="resolved-value">森林地图,海洋地图,高山地图</div>
      <p>这个结果需要同时用到 M1 和 M2。M2 更新得更晚，读取它时仍然需要 M1 的原始内容。</p>
    </div>,
  },
  {
    title:'回收后基消息缺失', layout:'recycle-page',
    body:<div className="page-body">
      <p>接着发布 M3，删除“海洋地图”，再发布 M4，追加“高山地图”。两条增量消息都引用 M1，四条消息的时间依次递增。</p>
      <p>默认存储只保留最近三条。四条写入后，下一次查询触发回收，M1 因为最旧而被删除；代码没有检查保留下来的 M4 是否还引用它。</p>
      <div className="retained-messages"><span className="removed">M1 <small>已删除</small></span><span>M2</span><span>M3</span><span>M4 <small>仍引用 M1</small></span></div>
      <Code file="LastWriteWinsResolver.merge()" hl={[1]} code={`if (baseMessage.isPresent()) {
    current.setValue(this.mergeValue(
        (IncrementalUpdateMessage) wins, baseMessage.get()));
}`} />
      <p>读取时虽然选中了 M4，却找不到 M1，上面的赋值不会执行。新建 Item 的值保持 <strong>null</strong>：最新的增量消息仍在，计算完整值需要的内容已经被删掉。</p>
    </div>,
  },
  {
    title:'回到游戏中的两种结果', layout:'closing-page',
    body:<div className="page-body">
      <p>回到游戏场景。管理端已经提交生命值 200，但如果消息发送失败，又提前记下了 B 的确认，B 就可能继续保留 100，而且被后续重试跳过。</p>
      <p>地图列表的更新则暴露了另一处依赖：即使最新消息已经保存，只要它引用的基消息被回收，读取时仍然算不出完整配置。</p>
      <p>沿源码追踪这两次更新，我们需要看到的不只是请求已经发出、最新消息已经写入，还包括<strong>接收结果如何进入同步进度，以及读取所需的历史是否仍然存在</strong>。</p>
      <Worlds />
    </div>,
  },
];

/* ---------- 外壳：翻页 / 缩放 / 目录 ---------- */
const TOTAL_PAGES = slides.length - 1; // 封面后为内容页
function readPage() {
  const n = Number(location.hash.slice(1));
  return Number.isInteger(n) && n >= 0 && n <= TOTAL_PAGES ? n : 0;
}

export function Presentation() {
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
      <main className={`slide ${page === 0 ? 'cover-slide' : ''} ${slide.layout ?? ''}`} data-page={page} style={{ transform: `translate(-50%, -50%) scale(${scale})` }} aria-label={page === 0 ? '封面' : `第 ${page} 页，共 ${TOTAL_PAGES} 页`}>
        {page === 0 ? (
          <div className="slide-content" key={page}>{slide.body}</div>
        ) : (
          <div className="slide-content" key={page}>
            {slide.heading && <header className="section-heading"><h1>{slide.heading}</h1></header>}
            {slide.body}
          </div>
        )}
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
