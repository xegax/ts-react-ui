import { IMsgHolder, AnyFunc } from './cp-host-decl';

interface IChild<TWatch> {
  invoke<K extends keyof TWatch, TF extends AnyFunc = TWatch[K] extends AnyFunc ? TWatch[K] : never>(key: K, args: Parameters<TF>[0]): Promise<ReturnType<TF>>;
}

const pm = postMessage as (msg: any) => void;
export function cpChild<TWatchHandler, THandler>(h: THandler) {
  onmessage = evt => {
    const msg: IMsgHolder = evt.data;
    if (!msg.msgData)
      return;

    const handler = h[msg.msgData.handler];
    if (!handler)
      return;

    if (msg.type == 'get') {
      Promise.resolve(handler(msg.msgData.args))
      .then(res => {
        let ret: IMsgHolder = {
          type: 'result',
          id: msg.id,
          msgData: {
            handler: msg.msgData.handler,
            args: res
          }
        };
        pm(ret);
      });
    } else if (msg.type == 'invoke') {
      handler(msg.msgData.args);
    }
  };

  let child = {
    invoke: (handler: string, args: any) => {
      let msg: IMsgHolder = {
        type: 'watch',
        msgData: {
          handler,
          args
        }
      };
      pm(msg);
    }
  } as IChild<TWatchHandler>;

  return child;
}
