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
      <div className="cover-copy"><p className="cover-name">Ripple 源码阅读</p><h1>一项配置更新<br />如何到达每张地图</h1><p className="cover-subtitle">源码阅读与可靠性分析</p><p className="cover-credit">面向对象程序设计课程汇报<br />盛泽辰</p></div>
    </div>,
  },
  {
    title:'三个地图进程共享一项配置', heading:'从一项游戏配置开始', layout:'scene-page',
    body:<div className="page-body">
      <p>假设你正在运营一款网络游戏，它的服务端由多个进程协作运行。登录进程处理账号与连接，地图进程负责移动、怪物生成和战斗，需要保存的数据交给数据服务。玩家数量增加后，这些进程可以分布在不同机器上，通过网络交换消息。</p>
      <p>这里关注森林、海洋、高山三个地图所在的服务端进程。它们都会生成史莱姆，生成时读取同一项怪物配置，将基础生命值设为 <strong>100</strong>。同一个数值会在多个进程中被使用。</p>
      <p>三个地图进程各自拥有独立的内存和本地状态。之后修改森林一侧的配置，需要通过网络把变化送到海洋和高山，再由各自的游戏逻辑读取并使用。这条更新路径，就是接下来引入 Ripple 的起点。</p>
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
      <p>地图进程仍然负责生成怪物，但配置更新有了统一的提交入口。接下来需要明确两件事：系统怎样知道哪些地图使用这项配置，以及一次修改如何从这个入口到达它们。</p>
    </div>,
  },
  {
    title:'订阅登记与配置发布', layout:'reading-page',
    body:<div className="page-body">
      <p>配置系统收到 <strong>200</strong> 后，首先要知道哪些进程在使用这项配置。森林、海洋地图提前登记自己的接收地址，并说明它们关心的是哪一项配置。</p>
      <div className="config-focus"><span>应用名 <code>game</code></span><span>配置键 <code>slime.baseHp</code></span></div>
      <p>这次登记就是<strong>订阅</strong>。管理端向同一应用名和配置键写入字符串 <code>200</code>，就是一次<strong>发布</strong>。系统根据这两个标识查找已登记的接收者，把这次修改送过去；地图进程取得新值后，再用它生成史莱姆。</p>
      <p>森林地图增加新实例时，新实例也来登记订阅。管理端仍然只提交配置键和新值，接收地址由配置系统维护。这样，发布一次修改的操作可以保持不变，接收者则随着地图实例的增减而变化。</p>
      <p>接收者增多后，配置系统还要承担更多发送工作。Ripple 将部分发送交给其他 Ripple服务端和 Ripple客户端继续完成；后面会沿一条具体路径，查看这些对象各自接手了哪一步。</p>
    </div>,
  },
  {
    title:'Ripple 的作用与一次更新的参与者', heading:'走进 Ripple', layout:'architecture-page',
    body:<div className="page-body">
      <p>Ripple 是面向大规模集群的发布订阅系统，提供配置写入、读取、删除、增量更新和订阅等操作。在这个场景里，管理端通过 <strong>Ripple客户端 C1</strong> 写入配置；地图进程通过各自的 Ripple客户端订阅和读取配置。</p>
      <p>Ripple服务端接收请求、保存消息，再把消息传给其他 Ripple服务端和已订阅的 Ripple客户端。下面用 A 表示接收写入的 Ripple服务端，用 B 表示这次选定的同步目标。</p>
      <Route />
      <p>森林地图中的 <strong>Ripple客户端 C2</strong> 接收并保存更新后，游戏逻辑读取新值，用它生成后续的史莱姆。接下来就沿着 C1、A、B、C2 这条路径，依次查看写入、保存、同步和订阅通知的代码。</p>
      <p>这里设定 C1 连接 A，C2 连接 B。RippleClient 会缓存配置项到 Ripple服务端的映射；首次访问没有映射时，由 NodeSelector 选择目标。随后，同一配置项的操作复用这个连接选择。</p>
    </div>,
  },
  {
    title:'Node 与协作对象', layout:'objects-page',
    body:<div className="page-body">
      <p>C1 的操作入口是 <code>RippleClient</code>，位于 <code>ripple-client</code>；A、B 上协调请求的是 <code>Node</code>，位于 <code>ripple-server</code>。两侧共用的配置项、消息、协议和存储接口放在 <code>ripple-common</code> 中。</p>
      <p>Node 收到更新后，通过 Storage 保存消息，通过 Overlay 计算同步目标，通过 ClientDispatcher 通知订阅者。读取时由 Resolver 合并消息，Tracker 与 Worker 则处理同步进度和重试。</p>
      <div className="object-map"><NodeMap /></div>
      <p className="compact-copy">以 Overlay 为例，星型实现让源节点向其他 Ripple服务端发送，树形实现返回当前节点的子节点，哈希实现则根据配置项选择候选节点。Node 始终调用 <code>calculateNodesToSync()</code>，发送目标随实现变化。后文设定 B 已被选入目标，再跟踪发送与确认。</p>
    </div>,
  },
  {
    title:'写入消息与读取当前值', layout:'storage-page',
    body:<div className="page-body">
      <p>C1 调用下面的接口，向 A 异步发送写入请求。A 上的 <code>PutRequestHandler</code> 取出应用名、配置键和新值，再调用 <code>Node.put()</code>。</p>
      <Code file="RippleClient.put()" code={'put("game", "slime.baseHp", "200");'} />
      <p>Node 为这次修改创建一条 UpdateMessage，其中包括值、时间、UUID 和源节点编号。SQLite 的 item 表登记应用名与配置键，message 表保存更新内容。同一配置项可以对应多条消息，读取当前值时再由 Resolver 从历史中选择。</p>
      <div className="message-history"><p><span>较早的全量消息</span><code>value = 100</code></p><p className="current-message"><span>较新的全量消息</span><code>value = 200</code></p></div>
      <p>这里选中的是较新的全量消息，因此 <code>Item.value</code> 被赋为 <strong>200</strong>。原来值为 100 的消息仍属于历史记录。消息的 UUID 则标识这一次修改：同一条更新在节点间传播时，重复检查和同步进度都围绕这个 UUID 进行。</p>
      <p>Item 的相等判断只使用应用名和配置键。因此，从 100 改成 200 后，订阅表仍能用同一个配置身份找到接收者；具体读到哪个值，则取决于该配置身份下保存的消息。</p>
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
      <p><code>submit()</code> 后紧接着返回 <code>SUCCESS</code>。Node.put() 把它转成 true，PutRequestHandler 将它写入成功响应并发回 C1。另一边，后台任务通过 Overlay 找到 B，向它发送 SyncRequest。</p>
      <p>B 收到请求后进入自己的 <code>propagateMessage()</code>，保存消息并通知订阅者。这两条执行路径独立推进，所以 C1 收到响应时，B 的处理可能已经完成，也可能仍在等待消息。接下来先沿正常到达 B 的路径继续往下看。</p>
    </div>,
  },
  {
    title:'从 Ripple服务端通知到组内转发', layout:'dispatch-page',
    body:<div className="page-body">
      <p>森林地图中的 C2、海洋地图中的 C3，此前都向 B 订阅了 <code>game / slime.baseHp</code>。Node.subscribe() 将配置项与它们的回调地址、端口关联起来。B 保存更新后，就用这张订阅表找到接收者。</p>
      <p>假设 B 上有六个 Ripple客户端订阅了这项配置。默认分发器先排序，再分成三个组；其中 C2、C3 同组，C2 排在前面。分发器用 <code>list.get(0)</code> 取出 C2，向它发送 Dispatch，并把 C3 留在待转发成员列表里。</p>
      <Route group />
      <p>C2 先把更新交给本地存储，取得组内成员列表后，再向 C3 发送 Sync。这一组的两次传输分别由 B 和 C2 完成。B 直接发送的目标减少了，C3 取得更新则需要 C2 继续转发；走完这一步，海洋地图才有这次修改对应的消息。</p>
      <p>如果 C2 还没有缓存成员列表，就先按 Dispatch 中的列表标识向 Ripple服务端请求地址，同时暂存这条消息。GetClientListResponseHandler 收到列表后，再取出暂存消息继续发送。</p>
    </div>,
  },
  {
    title:'问题分析 · 同步进度与重试', heading:'问题分析', layout:'tracker-page',
    body:<div className="page-body">
      <p>前面已经把更新从管理端跟踪到海洋地图。现在回到 A 向 B 发送的那一步：如果传输失败，B 仍保留 100，A 就需要记住这次发送尚未完成，随后继续补发。</p>
      <p>Tracker.initProgress() 从 Overlay 取得需要确认的 Ripple服务端编号，建立目标列表并记录 A 自己的确认。后台 Worker 周期性调用 Tracker.retry()，下面的条件决定哪些目标还需要发送。</p>
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
    title:'一次漏收之后的恢复 · 组内转发中断', layout:'recovery-page',
    body:<div className="page-body">
      <p>继续沿同一条传播路径往下看。这次 A 已把生命值 200 送到 B，B 也把它交给了森林地图的 Ripple客户端 C2。C2 保存消息并安排转发，但森林地图进程在向 C3 发出消息前退出，海洋地图就仍然使用 100。</p>
      <p>DispatchRequestHandler 在成员列表已缓存的分支中创建线程池，提交向组内成员发送的任务，然后调用 <code>pool.shutdown()</code>。这一步让已提交的任务继续运行；处理器随后将 DispatchResponse 的 success 设为 true，返回路径没有等待 C3 保存完成。</p>
      <Code file="DispatchRequestHandler.handle() · 返回响应" code={`DispatchResponse dispatchResponse = new DispatchResponse();
dispatchResponse.setUuid(dispatchRequest.getUuid());
dispatchResponse.setSuccess(true);`} />
      <p>B 收到这个响应后，DispatchResponseHandler 只记录日志。前面看到的 Tracker 列表来自 Ripple服务端的 Overlay，其中没有 C3 的接收状态。因此，C2 退出后，现有重试流程无法从这张列表中找出漏收的 C3。</p>
      <p>现在游戏里已经出现一个具体差异：B 保存了 200，海洋地图仍按 100 生成史莱姆。接下来让 B 也经历一次离线与重启，继续观察重新建立连接以后，这个差异怎样得到处理。</p>
    </div>,
  },
  {
    title:'一次漏收之后的恢复 · 重启后的数据与订阅', layout:'recovery-page',
    body:<div className="page-body">
      <p>B 离线期间，管理端又通过 A 发布了 250、300、350、400 等后续调整。B 的数据库仍停在此前保存的 200，海洋地图的 C3 仍停在漏收前的 100。B 重启后，数据恢复要先从这两个不同的旧值出发。</p>
      <Code file="Node.initCluster() · 后台工作与连接启动" code={`this.setWorkingThread(new Thread(this.getWorker()));
this.getWorkingThread().start();
this.reconnect(nodeList);`} />
      <p>Worker 会重连、检查健康状态并调用 Tracker.retry()。Tracker 从本地 ACK 表找出尚需发送的目标，再按 UUID 取出消息。这条启动与后台路径没有向同伴比较配置历史的步骤；B 得到后续更新，仍依赖 A 保留相应消息和待重试进度。</p>
      <p>A 的历史回收会删除旧消息，并清除对应 ACK。被删除的那次更新随之退出补发任务；仍保留的后续全量消息若成功到达 B，可以让 B 取得新值。恢复能继续到哪一步，取决于这些消息是否还在、B 是否仍被列为待重试目标。</p>
      <p>更新到达 B 后，还需要继续送往 C3。Node 构造时重新创建空的内存订阅表，C3 必须重新登记，B 才能按表向它推送。于是，前一页的漏收故事一直延伸到重启之后：连接恢复、数据补齐、订阅恢复，分别由不同代码处理，C3 最终取得新值需要把这些步骤重新接起来。</p>
    </div>,
  },
  {
    title:'增量消息与历史回收', layout:'recycle-page',
    body:<div className="page-body">
      <p>再看配置 <code>game / slime.spawnMaps</code>，它记录哪些地图允许生成史莱姆。管理端先发布全量消息 M1，再用增量消息 M2 追加高山地图。M2 保存追加内容和 M1 的 UUID，读取时需要找到 M1，才能拼出完整列表。</p>
      <div className="message-spec"><p><strong>M1</strong><span>全量消息</span><code>森林地图,海洋地图</code></p><p><strong>M2</strong><span>以 M1 为基消息</span><code>add_entry ",高山地图"</code></p></div>
      <p>接着发布 M3、M4，它们也都以 M1 为基消息，时间依次递增。Node 默认只保留三条历史消息；四条写入后，下一次查询触发回收，按时间留下 M2、M3、M4，删除最旧的 M1。</p>
      <div className="retained-messages"><span className="removed">M1 <small>已删除</small></span><span>M2</span><span>M3</span><span>M4 <small>仍引用 M1</small></span></div>
      <p>读取时，LastWriteWinsResolver 选中最新的 M4，再按 UUID 查找 M1。它只在找到基消息后才合并并赋值；此时 M1 已经被删除，新建 Item 的值便保持 <strong>null</strong>。</p>
      <p>回收策略按时间判断哪些消息可以删除，Resolver 却需要保留增量消息引用的基消息。两处各自完成了筛选和读取，但回收时没有检查这层引用关系，留下的最新消息也就无法还原完整配置。</p>
    </div>,
  },
  {
    title:'读取配置时承担的历史维护', layout:'maintenance-page',
    body:<div className="page-body">
      <p>历史回收还会影响一次普通读取。Ripple服务端读取史莱姆配置时，先查询配置项，再取得消息历史，最后计算当前值。前两个查询各自都会先触发一次历史清理，所以一次取值进入了两次清理流程。</p>
      <p>每次清理都要查询已有消息、确定保留范围、删除旧记录，再清除对应的同步确认。即使两次清理之间没有新增消息，也会重复查询和判断。读取请求必须等待这些维护操作完成，才能取得配置值。</p>
      <p>因此，读取频繁时，历史维护也随之反复执行；而前一页基消息被删除的过程，还可能发生在计算当前值之前。把清理放进查询方法，使一次普通读取同时承担了维护开销和修改历史的副作用。</p>
    </div>,
  },
  {
    title:'总结', heading:'总结', layout:'closing-page',
    body:<div className="page-body">
      <p>从史莱姆生命值由 100 调整到 200 出发，我们看到了 Ripple 的作用：管理端统一提交配置，地图进程登记订阅，更新经过保存、同步和转发，逐步到达使用它的进程。</p>
      <p>源码用不同对象承担这些工作：Node 协调请求，Storage 保存消息，Overlay 选择同步目标，ClientDispatcher 分发通知，Tracker 记录进度，Resolver 计算当前值。沿一次更新阅读，便能把这些类与实际执行过程联系起来。</p>
      <p>后半段分析了确认与实际接收之间的差异、漏收后的恢复条件、增量消息对历史的依赖，以及读取承担的清理开销。这些问题共同说明，评价对象之间的协作，还需要追踪一次操作完成后留下什么状态，以及后续对象如何使用这些状态。</p>
    </div>,
  },
  {
    title:'致谢', layout:'thanks-page',
    body:<div className="thanks-content"><p className="thanks-kicker">Ripple · 源码阅读与可靠性分析</p><h1>感谢聆听</h1></div>,
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
