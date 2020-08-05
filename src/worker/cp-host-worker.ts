import type { IMsgHolder, INode, ICPHost, IHostArgs, IModuleKey } from './cp-host-decl';

class CPWorkerImpl {
  private nodes = new Set<Worker>();
  private modules = new Map<string, Worker>();
  private msgIdCounter = 0;
  private waitResult = new Map<number, (args: any) => {}>();

  run<T1, T2>(args: IHostArgs<string>): INode<T1, T2> {
    const m = `${args.path || ''}${args.module}`;
    let cp = this.modules.get(m);
    if (args.createNew || !cp)
      cp = new Worker(m);

    this.nodes.add(cp);
    this.modules.set(m, cp);

    let handlers = Array<T1>();
    const invoke: any = (name: string, ...args: any[]) => {
      const msg: IMsgHolder = {
        type: 'invoke',
        msgData: { handler: name, args }
      };
      cp.postMessage(msg);
    };

    const get: any = (name: string, ...args: any[]) => {
      const msg: IMsgHolder = {
        type: 'get',
        id: this.msgIdCounter++,
        msgData: { handler: name, args }
      };

      const p = new Promise(resolve => {
        this.waitResult.set(msg.id, resolve as any);
      });

      cp.postMessage(msg);
      return p;
    };

    let onClose = () => {};
    const exit = () => {
      onClose();
      cp.terminate();
    };

    let node: INode<T1, T2> = {
      watch(h: T1) {
        const notAFunc = Object.keys(h).find(k => typeof h[k] != 'function');
        if (notAFunc)
          throw new Error(`"${notAFunc}" must be a function`);

        handlers.push(h);
        return node;
      },
      exit,
      invoke,
      get,
      promise: Promise.resolve()
    };

    cp.onmessage = (evt: MessageEvent) => {
      const msg: IMsgHolder = evt.data;
      if (msg.type == 'watch') {
        let unhandled = true;
        for (let n = 0; n < handlers.length; n++) {
          const hObj = handlers[n];
          const hFunc = hObj[msg.msgData.handler] as Function;
          if (!hFunc)
            continue;

          hFunc(msg.msgData.args);
          unhandled = false;
        }

        if (unhandled)
          console.log(`Unhandled message ${msg.msgData}`);
      } else if (msg.type == 'result') {
        this.waitResult.get(msg.id)(msg.msgData.args);
        this.waitResult.delete(msg.id);
      }
    };

    node.promise = new Promise(resolve => {
      onClose = () => {
        if (this.nodes.delete(cp)) {
          for (let m of this.modules.keys())
            if (this.modules.get(m) == cp)
              this.modules.delete(m);

          console.log('on close cp');
          resolve();
        }
      };
    });

    return node;
  }
}

export function cpHost<TMsg extends IModuleKey<TMsg>>(): ICPHost<TMsg> {
  return new CPWorkerImpl() as any;
}
