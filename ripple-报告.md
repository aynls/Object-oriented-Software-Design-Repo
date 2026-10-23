# Ripple 配置更新的传播机制与可靠性分析

## 第 1 页

假设你正在运营一款网络游戏。玩家进入游戏时，由登录相关进程处理账号与连接；进入地图后，再由游戏逻辑进程处理移动、怪物生成和战斗；需要保存的数据则交给相应的数据服务。随着玩家数量增加，这些工作分布在多个进程和机器上，通过网络协作。

接下来，我们把视线放到其中三个游戏逻辑进程：它们分别承载森林地图、海洋地图和高山地图。三个地图中都会生成史莱姆，生成时读取同一项怪物配置，将史莱姆的基础生命值设为 100。

但三个地图进程各自拥有独立的内存和本地状态。森林地图进程读取到 100，并不会让海洋地图进程自动取得相同的值；之后修改其中一处配置，也需要有一条路径把变化送到其他进程。

图示内容：先展示登录、地图逻辑、数据保存几个进程的协作，再聚焦森林地图、海洋地图、高山地图。三个地图中的史莱姆与“基础生命值 100”随后淡入。

## 第 2 页

有一天，你希望加强史莱姆，将基础生命值从 100 调整为 200。我们希望三个地图进程在运行期间取得新配置，随后生成的史莱姆都使用 200。

先考虑每个地图进程各自保存配置文件的做法。管理者需要修改森林地图的文件，再修改海洋地图和高山地图的文件，并让各进程重新加载。如果程序只在启动时加载配置，这次调整还需要安排进程重启。随着地图实例增多，逐台修改和安排加载的工作也会增加。

假设森林地图已经完成更新，而海洋地图还没有完成。此时，森林地图新生成的史莱姆有 200 生命值，海洋地图新生成的史莱姆却仍然只有 100。同一次数值调整，在两个地图中产生了不同结果。

为了把这次修改送到所有使用它的地图进程，我们引入一个配置分发系统。管理端向它提交 200，由它保存更新、找到相关接收者，并把变化送过去。

图示内容：管理端将 100 改为 200；森林地图已取得新值，海洋地图仍使用旧值，高山地图等待更新，随后出现连接这些进程的配置系统。

## 第 3 页

配置系统接到“史莱姆基础生命值改为 200”后，首先需要知道哪些游戏进程使用这项配置。森林地图和海洋地图可以提前向它登记：当这项配置发生变化时，请通知自己。这个登记过程就是订阅。

我们用 `game / slime.baseHp` 标识这项配置，其中 `game` 是应用名，`slime.baseHp` 是配置键。管理端向这个配置项写入字符串 `200`，构成一次发布。配置系统找到已登记的接收者，分别通知它们；地图进程取得新值后，再将它用于后续的史莱姆生成。

这样，管理端提交修改时，只需要给出配置项和新值。森林地图后来增加了一个实例，这个实例可以再登记订阅；它的接收地址由配置系统维护，管理端仍然提交同样的一次修改。

图示内容：先出现地图进程向 `game / slime.baseHp` 登记订阅的箭头，再出现管理端发布 200，最后出现配置系统向各地图进程通知更新的箭头。

## 第 4 页

继续增加地图实例。假设一项公共怪物配置有六个接收者，如果由一台配置服务器逐一发送，它需要直接向六个目标传输更新。接收者增长到更多区服和地图实例时，这些发送工作仍然落在同一处。

可以让其中一部分节点继续转发。例如，配置源先向两个节点发送，再由这两个节点分别通知自己的下游。配置源直接发送的目标变少了，但下游能否得到更新，还取决于中间节点有没有继续发送。

假设通向海洋地图的中间节点断线。另一条分支已经把 200 送到森林地图，海洋地图所在的分支却停在旧值 100。只有重新建立这条传播路径，或者由其他节点接手发送，海洋地图才能取得新配置。

接下来阅读 Ripple 时，我们先沿着一条能够正常完成的传播路径走到底，再逐段检查发送失败、转发进程退出和节点重启时，代码会继续做什么。

图示内容：从配置源逐一发送切换成树形转发。标出一个断线的中间节点，以及因这条路径中断而仍使用 100 的下游地图进程。

## 第 5 页

Ripple 的 README 将项目描述为面向大规模集群的灵活发布订阅系统。对应到前面的游戏场景，我们可以通过 Ripple 写入史莱姆配置、读取已有值，并订阅后续修改。仓库还提供删除、增量更新、取消订阅和 Web 管理入口。

我们在管理端中使用 Ripple客户端提交修改，在地图进程中使用 Ripple客户端登记订阅、接收消息和读取配置。Ripple服务端接收这些请求，保存配置消息，并把消息传给其他 Ripple服务端和已订阅的 Ripple客户端。

例如，管理端把 `game / slime.baseHp` 写为 `200`。这条修改先进入 Ripple服务端，之后到达森林地图进程中的 Ripple客户端。地图逻辑读取取得的新值，在下一次生成史莱姆时将基础生命值设为 200。

游戏进程如何解释这个数值、何时用它生成怪物，由游戏代码完成。我们接下来阅读的是 Ripple 接收、保存和送达这条配置更新的代码。

图示内容：将管理端、Ripple服务端、地图进程分成三个区域，在管理端和地图进程内部画出 Ripple客户端，展示 200 穿过这些区域的过程。

## 第 6 页

为了跟踪后续调用，我们给参与这次修改的对象命名。管理端中的 Ripple客户端称为 C1；接收这次写入的 Ripple服务端称为 A。另一个 Ripple服务端 B 是这项配置的同步目标。森林地图进程中的 Ripple客户端 C2 连接到 B，并已经订阅史莱姆配置。

C1 提交新值后，A 接收并保存更新，再把同一条更新传给 B。B 保存后，找到订阅 `game / slime.baseHp` 的 Ripple客户端，并向 C2 通知。C2 将消息交给自己的本地存储，森林地图的游戏逻辑随后读取配置值。

海洋地图中的 Ripple客户端称为 C3。后面分析分组分发时，我们会让 C2 继续向 C3 转发同一条更新，跟踪生命值 200 如何从森林地图这一侧到达海洋地图这一侧。

在这次场景中，管理端 C1 选中 A，地图中的 C2 选中 B。源码里的 `RippleClient.findOrConnectToServer()` 会查询配置项到 Ripple服务端的映射；没有映射时调用 NodeSelector 选择，再缓存结果。后面的读写与订阅请求沿着这个连接发送。

图示内容：标清“管理端中的 Ripple客户端 C1”“Ripple服务端 A”“Ripple服务端 B”“森林地图中的 Ripple客户端 C2”，随后补上海洋地图中的 Ripple客户端 C3。

源码中的连接选择见 [RippleClient.findOrConnectToServer()](D:/UCAS/OOPLab/Ripple/ripple-client/src/main/java/ripple/client/RippleClient.java:438)。

## 第 7 页

C1 把修改交给 A 后，A 还需要决定向哪些 Ripple服务端发送。这一步由 Overlay 提供的 `calculateNodesToSync()` 计算，Node 再逐一取出返回的目标，建立发送过程。

可以先采用源码中的星型策略理解这一步。StarOverlay 在消息源节点上遍历 Ripple服务端列表，把源节点之外的节点加入发送目标。B 收到消息后，因为自己不是源节点，这个策略返回空目标列表，B 不再向其他 Ripple服务端继续转发。

如果改用 TreeOverlay，计算过程会找到当前节点在树中的位置，返回它的子节点，接收更新的节点便会继续向下一层发送。HashingBasedOverlay 则先根据应用名和配置键取得候选节点，再从候选中选择发送目标。

因此，阅读一次具体发送前，需要先知道使用的是哪种 Overlay。后文跟踪 A 向 B 发送时，设定 B 已经被选入发送目标，再继续观察网络发送与进度记录。

图示内容：先展示星型策略下 A 到 B 的发送，再切换到树形策略下中间节点继续转发的路径；两种路径按顺序出现。

这三种目标计算分别见 [StarOverlay](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/overlay/StarOverlay.java)、[TreeOverlay](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/overlay/tree/TreeOverlay.java) 和 [HashingBasedOverlay](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/overlay/hashing/HashingBasedOverlay.java)。

## 第 8 页

现在进入仓库。C1 使用的入口类 RippleClient 位于 `ripple-client` 模块；A、B 上协调请求的 Node 位于 `ripple-server` 模块。两侧都会使用配置项、更新消息、网络协议和存储等基础能力，这些实现放在 `ripple-common` 中。

当 A 接到写入时，Node 会通过 Storage 取得消息存储服务，保存这次更新。当前构造函数为它创建 SqliteStorage，因此这条调用最终进入 SQLite。需要通知已订阅的 Ripple客户端时，Node 调用 ClientDispatcher，当前创建的是 EqualDivisionClientDispatcher。需要向其他 Ripple服务端发送时，则调用前一页看到的 Overlay。

另一些对象在稍后的流程中才会用到：读取配置值时，MessageBasedResolver 根据存储中的消息计算值；跟踪同步时，Tracker 保存目标和确认信息，后台 Worker 调用它执行重试。

Node 持有的是这些职责对应的接口或对象。比如，把星型策略换成树形策略后，Node 仍然调用 `calculateNodesToSync()`，而返回的目标随实现变化。后面检查可靠性时，就继续沿这些调用查看返回结果如何被使用。

图示内容：先显示 RippleClient 到 Node 的请求，再随着叙述依次展开 Node 到 Storage、ClientDispatcher、Overlay、MessageBasedResolver、Tracker 的调用关系。

默认对象的创建见 [Node 构造函数](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:294)。

## 第 9 页

管理端使用 Ripple客户端 C1 调用 `put("game", "slime.baseHp", "200")`。RippleClient.put() 通过选定的连接异步发送写入请求。A 上的 PutRequestHandler 取出应用名、配置键和新值，调用 Node.put()。

Node.put() 创建一条 UpdateMessage，把字符串 `200`、当前时间和源 Ripple服务端的编号放入消息，再进入 `propagateMessage()`。消息同时带有 UUID，后续检查重复消息和记录同步进度都会使用这个标识。

在当前 SQLite 实现中，`item` 表登记应用名与配置键，`message` 表保存这次更新的内容。假设历史中已有一条值为 100 的全量消息，这次又写入一条时间较新的、值为 200 的全量消息。读取时，LastWriteWinsResolver 对历史消息排序，取出排在最前面的消息；当它是 UpdateMessage，就把其中的值赋给 Item.value。在这个例子中，读取结果便是 200。

所以，沿这条读取路径寻找 200，需要查看保存的更新消息以及合并代码。`item` 表中的配置身份用于找到同一配置的历史，当前值由读取时选出的消息提供。

图示内容：C1 的 put 请求进入 A，产生带 UUID 的更新消息；再展示同一配置下的 100、200 两条历史消息，读取时选择较新的全量消息。

请求创建与保存见 [RippleClient.put()](D:/UCAS/OOPLab/Ripple/ripple-client/src/main/java/ripple/client/RippleClient.java:355)、[Node.put()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:350) 和 [Node.applyMessageToStorage()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:483)；值的计算见 [LastWriteWinsResolver.merge()](D:/UCAS/OOPLab/Ripple/ripple-common/src/main/java/ripple/common/resolver/LastWriteWinsResolver.java:43)。

## 第 10 页

继续跟踪 A 上的 `Node.propagateMessage()`。它先通过 UUID 检查消息是否重复，再调用本地存储。对于源自 A 的更新，接下来初始化同步进度，然后通知连接到 A 的订阅者。完成这些调用后，它把向其他 Ripple服务端同步的工作提交到线程池。

这里可以直接看源码的返回位置：

```java
this.getExecutorService().submit(new Callable<Void>() {
    @Override
    public Void call() throws Exception {
        try {
            doSyncWithServer(message, sourceId, fromId, currentId);
            return null;
        } catch (Exception exception) {
            exception.printStackTrace();
            return null;
        }
    }
});

return Result.SUCCESS;
```

提交任务后，代码没有保存 submit() 返回的 Future，也没有等待任务完成，就返回 Result.SUCCESS。Node.put() 将这个结果转成 true，PutRequestHandler 再把它写入成功响应，由网络处理器发回 C1。

与此同时，后台任务通过 Overlay 找到 B，发送 SyncRequest。B 收到请求后再次进入自己的 `propagateMessage()`，调用存储并通知订阅者。因此，C1 收到 A 的成功响应时，B 可能已经保存，也可能尚未收到；这条返回路径没有以 B 的保存结果作为成功条件。

图示内容：在 A 提交任务的位置分出两条执行路径。一条向 C1 返回成功，另一条执行 A 到 B 的同步，再由 B 通知 C2。

后台提交与返回见 [Node.propagateMessage()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:384)，响应生成见 [PutRequestHandler](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/tcp/handler/PutRequestHandler.java:56)，B 的接收路径见 [SyncRequestHandler](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/tcp/handler/SyncRequestHandler.java:97)。

## 第 11 页

现在，Ripple服务端 B 已经收到史莱姆基础生命值 200，接下来要把它交给订阅这项配置的游戏进程。

森林地图中的 Ripple客户端 C2、海洋地图中的 Ripple客户端 C3，此前都向 B 订阅了 `game / slime.baseHp`。处理订阅时，Node.subscribe() 把配置项与 Ripple客户端的回调地址、端口关联起来。B 收到更新后，便可以据此找到接收者。

假设 B 上共有六个 Ripple客户端订阅这项配置。EqualDivisionClientDispatcher 先将它们排序，再划分成默认的三个分组。假设排序后 C2、C3 位于同一组，并且 C2 排在前面。源码通过 `list.get(0)` 取出 C2，把其余成员 C3 留在待转发列表中，向 C2 发送 Dispatch。

C2 上的 DispatchRequestHandler 先将更新消息交给本地存储，再安排向 C3 发送 Sync。C3 收到并保存消息后，海洋地图的游戏逻辑才能在后续生成史莱姆时读取到 200。如果 C2 尚未取得 C3 的地址列表，它会先通过列表标识向 Ripple服务端请求地址，并将消息暂存到队列中，取得列表后继续发送。

对于 C2、C3 这一组，原本由 B 分别发送的两次传输，变成 B 向 C2 发送一次、C2 再向 C3 发送一次。因而观察 B 是否已经发出 Dispatch 之后，还需要继续查看 C2 到 C3 的那次 Sync。

图示内容：先显示 B 上的订阅登记，再显示六个 Ripple客户端被分成三组，最后依次突出 B → C2 的 Dispatch 和 C2 → C3 的 Sync。

订阅登记见 [Node.subscribe()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:544)，分组与入口选择见 [EqualDivisionClientDispatcher.notifyClients()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/dispatcher/EqualDivisionClientDispatcher.java:62)，继续转发见 [DispatchRequestHandler.dispatchMessage()](D:/UCAS/OOPLab/Ripple/ripple-client/src/main/java/ripple/client/core/tcp/handler/DispatchRequestHandler.java:142)。

## 第 12 页

先回到 A 向 B 的同步。假设 A 已保存生命值 200，但发给 B 的请求没有完成，B 仍使用 100。要让这次更新继续传过去，A 需要记住还有哪些 Ripple服务端没有完成接收。

Tracker.initProgress() 先向 Overlay 取得需要收集确认的 Ripple服务端列表，将节点编号写入 ACK 记录，再记录 A 自己的确认。这里的 ACK 记录包含目标编号列表和已确认编号列表。后台 Worker 周期性调用 Tracker.retry()，重新检查这些记录。

真正决定是否还向 B 发送的是 `getNodesToRetry()` 中的判断：

```java
for (Integer id : ack.getNodeList()) {
    if (!ack.getAckNodes().contains(id)) {
        ret.add(id);
    }
}
```

当 B 在目标列表里、但没有出现在已确认列表里时，它会被加入返回结果，重试代码再尝试向 B 发送。若 B 已被写进已确认列表，这个条件就不成立。接下来，需要检查的便是源码在什么时刻把 B 写进这个列表。

图示内容：展示这条更新的目标列表与已确认列表，先让 B 留在待重试结果中，再演示写入 B 的确认后，筛选结果如何变化。

进度初始化与筛选见 [Tracker.initProgress()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Tracker.java:98) 和 [Tracker.getNodesToRetry()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Tracker.java:127)，后台调用见 [Worker.run()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Worker.java:38)。

## 第 13 页

在 A 的 `doSyncWithServer()` 中，找到指向 B 的连接后，代码先调用 Api.sync()，紧接着就记录 B 的 ACK。省略中间的日志后，两次调用如下：

```java
Api.sync(channel, message);
this.getTracker().recordAck(message.getUuid(), message.getLastUpdateServerId(), nodeMetadata.getId());
```

再进入 Api.sync()，可以看到它构造 SyncRequest 后调用 `channel.writeAndFlush(syncRequest)`，没有等待 B 保存消息。B 返回 SyncResponse 后，A 上的 SyncResponseHandler 只输出响应日志，没有根据响应结果更新 Tracker。Tracker 自己的重试发送也在调用 Api.sync() 后立即记录 ACK。

现在代入一次具体失败：A 已成功保存 200，提交向 B 的异步发送后记录了 B 的 ACK，随后这次传输失败。B 没收到更新，仍然保存 100；A 的确认列表却已经包含 B。下一轮运行前一页的筛选条件时，B 被跳过，这条更新不会再因 B 漏收而进入相应补发。

要让这个例子中的 B 保持在待重试列表中，记录确认的时机就需要移到 B 成功保存、A 收到相应成功结果之后。发送失败或等待超时，应当继续留下这项未完成的同步任务。

图示内容：依次展示 A 保存 200、提交发送、立即记录 B 的 ACK、传输失败，以及下一轮重试跳过 B。旁边保留 B 的旧值 100。

发送与记录顺序见 [Node.doSyncWithServer()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:442)，异步发送见 [Api.sync()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/helper/Api.java:79)，响应处理见 [SyncResponseHandler](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/tcp/handler/SyncResponseHandler.java:45)。

## 第 14 页

接着观察 B 到 C2、再到 C3 的分组分发。假设 B 已保存 200，并且 C2 也已经保存。此时，如果森林地图进程在转发前退出，C3 就没有取得这次更新，海洋地图仍按 100 生成史莱姆。

源码中的 DispatchRequestHandler 调用 dispatchMessage() 安排转发，随后把 DispatchResponse 的 success 设为 true。在已有成员列表的分支里，dispatchMessage() 创建线程池并提交转发任务，最后调用 shutdown()。shutdown() 停止接收新任务，但这里没有等待这些任务结束，也没有等待 C3 的保存结果。

因此，即使 B 已经收到 C2 返回的成功响应，也只能沿着代码追到 C2 已经安排了转发，不能由这个响应得出 C3 已保存 200。再查看 Tracker，它的目标编号来自 Ripple服务端的 Overlay，其中没有 C3 这样的 Ripple客户端接收进度。

在这个退出场景中，要补上 C3 漏收的更新，需要有一处记录它尚未完成，并在 C2 退出后重新安排发送。后续重构可以让 Ripple服务端保存组内接收进度，收到各成员保存结果后再结束这一组的分发任务。

图示内容：B → C2 已完成，C2 → C3 尚未完成；在 C2 退出后保留 C3 的旧值 100，再画出需要由其他节点接手的补发路径。

安排任务、结束线程池与成功响应的顺序见 [DispatchRequestHandler](D:/UCAS/OOPLab/Ripple/ripple-client/src/main/java/ripple/client/core/tcp/handler/DispatchRequestHandler.java:130)，Tracker 的目标来源见 [Tracker.initProgress()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Tracker.java:98)。

## 第 15 页

再让 Ripple服务端 B 离线一段时间。它的本地数据库中仍保存生命值 100，而 A 在此期间接收了 200，以及后续的数值调整。B 重启后，首先面对的是自己的旧数据。

查看 Node.initCluster()，启动集群关系时依次设置节点列表、初始化健康信息、构造 Overlay、启动 Worker 并建立连接。Worker 后续执行重连、健康检查和 Tracker 重试。这条路径没有向同伴发送“比较本地配置并拉取缺失消息”的请求；B 能否获得新值，要继续查看源头 A 还会向它补发哪些消息。

A 的 Tracker 每次从 ACK 表取得记录，再按消息 UUID 找到要重试的消息。因此，恢复过程不仅需要网络连接重新建立，还需要 A 上保留着相应消息和进度。历史回收代码删除旧消息后，也会删除对应的 ACK，这条旧消息便不再通过这些记录进入重试。后续仍保留的更新能否送达 B，需要继续沿它们各自的重试状态检查。

B 还在构造 Node 时创建了一份空的订阅映射。C2 此前登记在 B 内存中的地址不会从 SQLite 自动恢复。要继续接收之后的通知，B 需要重新取得这些订阅登记。

图示内容：B 带着旧数据库重启，先恢复连接；随后分别追踪 A 上仍保留的消息与 ACK，以及 B 上需要重新登记的订阅关系。

启动与重连见 [Node.initCluster()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:589) 和 [Worker.run()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Worker.java:38)，重试消息来源见 [Tracker.getPendingMessages()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Tracker.java:60)，回收与 ACK 删除见 [SqliteMaxNumberRecycleStrategy](D:/UCAS/OOPLab/Ripple/ripple-common/src/main/java/ripple/common/storage/sqlite/SqliteMaxNumberRecycleStrategy.java:53)。

## 第 16 页

为了继续检查历史消息为什么还要保留，我们再增加一项游戏配置：`game / slime.spawnMaps`，表示哪些地图允许生成史莱姆。管理端先发布一条全量消息，值为 `森林地图,海洋地图`，把这条消息记为 M1。

后来希望在高山地图也生成史莱姆。管理端可以发布增量消息 M2，指定基消息 UUID 为 M1，操作为 add_entry，追加内容为 `,高山地图`。读取时，LastWriteWinsResolver 先选出时间较新的 M2，再按它记录的 UUID 从历史中寻找 M1。

找到 M1 后，mergeValue() 执行字符串拼接：把 M1 中的 `森林地图,海洋地图` 与 M2 中的 `,高山地图` 连接，得到 `森林地图,海洋地图,高山地图`。这里的地图列表是游戏代码约定的字符串格式，Ripple 执行的操作就是源码中的字符串追加。remove_entry 分支则用字符串替换，删除指定片段。

这次读取要得到完整的三张地图，需要同时拿到 M1 的原始内容和 M2 的追加内容。下一页继续让消息数量增加，查看历史回收会保留什么。

图示内容：先展示 M1 的完整字符串，再让 M2 通过 UUID 指向 M1，最后将两段内容拼接成三个地图名称。

基消息查找与具体字符串操作见 [LastWriteWinsResolver.merge()](D:/UCAS/OOPLab/Ripple/ripple-common/src/main/java/ripple/common/resolver/LastWriteWinsResolver.java:43) 和 [mergeValue()](D:/UCAS/OOPLab/Ripple/ripple-common/src/main/java/ripple/common/resolver/LastWriteWinsResolver.java:30)。

## 第 17 页

沿用 M1、M2。之后管理端又基于 M1 发布 M3，通过 remove_entry 删除 `,海洋地图`，暂时只开放森林地图；再发布 M4，基于 M1 追加 `,高山地图`，恢复三张地图。设定 M1 到 M4 的时间依次递增。最新消息 M4 要得到完整值，仍然需要找到 M1。

Node 创建默认 SqliteStorage 时，将每项配置的消息保留参数设为 3。回收代码按时间降序查询最近三条记录，以其中最旧的时间作为界限，删除时间更早的消息。因此，当这四条消息都已写入后，下一次查询触发回收，会保留 M2、M3、M4，删除 M1。这个删除条件没有检查 M4 是否还引用 M1。

接着执行读取。SqliteItemService 先构造一个只有应用名、配置键的 Item，此时 value 为 null。LastWriteWinsResolver 选出 M4，但在剩余历史中找不到 M1，下面的条件不成立：

```java
if (baseMessage.isPresent()) {
    current.setValue(this.mergeValue((IncrementalUpdateMessage) wins, baseMessage.get()));
}
```

于是这条读取路径没有给 Item.value 赋出三张地图的字符串，值仍为 null。最新的增量消息虽然还在数据库里，却已经失去了它所需的原始内容。

对于这个例子，回收前可以先把 M4 的结果物化为一条完整快照，或者继续保留它引用的 M1，再决定删除哪些消息。前面用于补发的消息和这里用于合并的消息，都需要在删除前检查是否仍有后续工作依赖它们。

图示内容：先展示 M1 至 M4 和它们对 M1 的引用，再按时间回收 M1，最后沿 M4 的引用寻找基消息，显示查找失败与读取值 null。

默认保留参数见 [Node 构造函数](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:295)，时间删除条件见 [SqliteMaxNumberRecycleStrategy](D:/UCAS/OOPLab/Ripple/ripple-common/src/main/java/ripple/common/storage/sqlite/SqliteMaxNumberRecycleStrategy.java:68)，缺少基消息后的赋值分支见 [LastWriteWinsResolver](D:/UCAS/OOPLab/Ripple/ripple-common/src/main/java/ripple/common/resolver/LastWriteWinsResolver.java:51)。

## 第 18 页

历史回收不仅影响保留结果，也发生在日常读取路径中。假设现在通过 Ripple服务端的 Node.getWithValue() 读取史莱姆配置，先看这一次调用会访问哪些对象。

getWithValue() 先调用 get()，进入 SqliteItemService.getItem()。getItem() 在查询配置项之前调用一次 recycle()。取得 Item 后，getWithValue() 再调用 findMessages() 读取消息历史，而 SqliteMessageService.findMessages() 的开头又调用了一次 recycle()。之后才轮到 Resolver 排序并计算值。

再进入 recycle()，可以看到它先查询回收前的消息 UUID，再查询最近消息以确定时间界限、删除旧消息，随后查询回收后的 UUID，最后为已删除消息移除 ACK。同一次读取中的两处调用，会分别进入这段数据库操作。

写入也会经过这条路径：applyMessageToStorage() 在插入消息前先调用 getItem()，因此也会触发回收。重构时可以先明确由哪个操作负责调度回收，让读取配置身份和读取历史的过程复用一次检查，再用保留消息依赖的条件控制实际删除。

图示内容：从 Node.getWithValue() 向下依次展开 getItem()、第一次回收、findMessages()、第二次回收和 merge()，突出两次进入同一段 SQL 操作的位置。

读取调用链见 [Node.getWithValue()](D:/UCAS/OOPLab/Ripple/ripple-server/src/main/java/ripple/server/core/Node.java:340)、[SqliteItemService.getItem()](D:/UCAS/OOPLab/Ripple/ripple-common/src/main/java/ripple/common/storage/sqlite/SqliteItemService.java:43) 和 [SqliteMessageService.findMessages()](D:/UCAS/OOPLab/Ripple/ripple-common/src/main/java/ripple/common/storage/sqlite/SqliteMessageService.java:183)。

## 第 19 页

再看 Ripple客户端 C2 转发消息时使用的执行资源。假设它已经缓存 C3 的地址列表，这次收到生命值 200 的 Dispatch，dispatchMessage() 会创建一个线程池，线程数取地址列表的长度，再把向 C3 发送的任务提交进去。

这次调用结束前，代码对线程池调用 shutdown()，让已提交的任务继续执行。此时如果另一条配置更新也到达 C2，新的 dispatchMessage() 会再创建一个线程池，而前一次任务可能还在执行。随着多条消息重叠到达，这些线程池的数量随调用次数增加；这里没有把所有分发任务交给同一个执行器来统一限制并发。

成员列表尚未缓存时，消息先进入待发送队列。GetClientListResponseHandler 取得地址后也会创建线程池，把队列中消息的转发任务提交进去。这是另一处需要一起纳入资源调度的发送入口。

重构时可以让 C2 复用一个有并发上限和有界队列的执行器。队列满时，再明确是向上游返回未完成、延迟接收，还是保留任务等待重试。这样，任务有没有被接纳可以进入前面讨论的分发进度，执行资源也有具体上限。

图示内容：先展示连续两次 Dispatch 各创建一个线程池，前一批任务尚未结束，后一批已开始；随后将这些入口接入共享执行器与有界队列。

每次创建线程池的位置见 [DispatchRequestHandler.dispatchMessage()](D:/UCAS/OOPLab/Ripple/ripple-client/src/main/java/ripple/client/core/tcp/handler/DispatchRequestHandler.java:158)，取得成员列表后的转发见 [GetClientListResponseHandler](D:/UCAS/OOPLab/Ripple/ripple-client/src/main/java/ripple/client/core/tcp/handler/GetClientListResponseHandler.java:74)。

## 第 20 页

回到最开始的修改：管理端发布生命值 200，森林地图已经取得新值，海洋地图仍使用 100。前面的源码阅读把这个差异定位到了几段具体过程。

A 向 B 异步发送后立即记录 ACK，会使尚未收到消息的 B 被排除在重试之外。重构时，发送模块需要把远端保存结果、失败和超时交给 Tracker，由这些结果决定是否记录确认，以及何时继续发送。B 的保存操作也需要把数据库写入是否成功传出来，才能让确认对应到实际结果。

B 将更新交给 C2 后，C2 安排了转发就返回成功，C3 是否保存还没有进入这份分发进度。重构时可以给组内各成员登记接收状态，让 Ripple服务端在 C2 退出后仍能找到尚未完成的目标并接手发送。B 重启时，再通过配置版本或快照比较取得遗漏内容，并重新建立订阅登记。

消息删除则要同时考虑这些补发任务和增量依赖。M4 还引用 M1 时，可以保留 M1，或先生成能够独立读取的完整快照；某条消息还承担补发时，也要让回收过程看到这份进度。确定这些保留条件后，再集中调度回收，减少重复查询，并把各发送入口接到共享的有界执行器。

这些修改可以沿现有的 Storage、Overlay、ClientDispatcher 和 Tracker 职责展开：先把一条更新的保存结果传到确认与重试流程，再把 Ripple客户端的最终接收状态纳入分发，最后让恢复、回收和资源调度使用这些状态。检验时仍然回到同一组场景，观察发送失败、转发退出或重启之后，海洋地图能否重新取得 200。

图示内容：重新展示 C1 → A → B → C2 → C3，在对应位置补上保存结果、待重试目标、组内接收进度、重连追赶和历史依赖；每一处都连接到前面已展开的失败过程。
