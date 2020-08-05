export type AnyFunc = (...args: any) => any;

type TParams<TF> = TF extends AnyFunc ? Parameters<TF> : [];
type TReturn<TF> = TF extends AnyFunc ? ReturnType<TF> : never;
type TPromise<T> = T extends Promise<any> ? T : Promise<T>;

export interface INode<TWatch, THandler> {
  watch(handler: TWatch): INode<TWatch, THandler>;
  get<K extends keyof THandler, TP extends THandler[K]>(key: K, ...args: TParams<TP> extends undefined ? [] : TParams<TP>): TPromise<TReturn<TP>>;
  invoke<K extends keyof THandler, TP extends THandler[K]>(key: K, ...args: TParams<TP> extends undefined ? [] : TParams<TP>): void;
  exit(): void;
  promise: Promise<void>;
}

export interface IHostArgs<T> {
  module: T;
  path?: string;
  createNew?: boolean;
}

export interface IModuleDef<TWatch, TCtrl> {
  watch: TWatch;
  ctrl: TCtrl;
}

export type IModuleKey<T> = {[K in keyof T]: IModuleDef<any, any>};
export interface ICPHost<TMsg extends IModuleKey<TMsg>> {
  run<
    TMsgKey extends keyof TMsg,
    TMsgHandler extends TMsg[TMsgKey]['watch'],
    TCtrlHandler extends TMsg[TMsgKey]['ctrl'],
    TNode extends INode<TMsgHandler, TCtrlHandler>
  >(args: IHostArgs<TMsgKey>): TNode;
}

export interface IMsgHolder {
  type: 'get' | 'invoke' | 'watch' | 'result';
  id?: number;
  msgData?: {
    handler: string;
    args?: any[];
  };
}
