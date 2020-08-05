import { IModuleDef } from './cp-host-decl';
import { CalcWatch, CalcHandler } from './test.worker';
import * as host from './cp-host-worker';

export interface Workers {
  'test.worker.js': IModuleDef<CalcWatch, CalcHandler>
};

export const cpHost = () => host.cpHost<Workers>();
