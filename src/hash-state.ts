import { Publisher } from 'objio/common/publisher';
import * as URI from 'urijs'

export class HashState<T> extends Publisher {
  private state: Partial<T> = {};

  constructor() {
    super();

    window.addEventListener('popstate', this.onPopState);
    this.state = this.parseHashState();
  }

  private onPopState = (e: PopStateEvent) => {
    this.state = this.parseHashState();
    this.notify();
  };

  private parseHashState(): Partial<T> {
    const fragments = URI.decode(document.location.hash || '#').substr(1).split('&').filter(d => d);

    const state: Partial<T> = {};
    fragments.forEach(keyValue => {
      const [key, value] = keyValue.split('=');
      state[key.trim()] = value;
    });

    return state;
  }

  private composeHashState(state: Partial<T>) {
    const keyValue = Object.keys(state)
    .filter(key => (state[key] != null ? ''  + state[key] : '').trim())
    .map(key => `${URI.encode(key)}=${URI.encode(state[key])}`);
    return '#' + keyValue.join('&');
  }

  pushState(state: Partial<T>) {
    location.hash = this.composeHashState({...this.parseHashState() as any, ...state as any});
  }

  getState(): Partial<T> {
    return this.state;
  }

  getString<K extends keyof T>(key: K, defaultValue: string = null): string {
    return (this.state[key] as any as string) || defaultValue;
  }

  getNumber<K extends keyof T>(key: K, defaultValue: number = null): number {
    if (this.state[key] == null)
      return defaultValue;

    return Number.parseFloat(this.state[key] as any);
  }

  getInteger<K extends keyof T>(key: K, defaultValue: number = null): number {
    if (this.state[key] == null)
      return defaultValue;

    return Number.parseInt(this.state[key] as any, 10);
  }
}
