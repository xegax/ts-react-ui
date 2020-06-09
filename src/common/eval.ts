const funcRexp = new RegExp('[a-zA-Z][a-zA-Z0-9]*[ ]*[\\(\\.]','g');
const varsRexp = new RegExp('\\$[a-zA-Z][a-zA-Z0-9]* *(\\[ *"(\\\\"|[^"])*" *\\])*', 'g');

export function prepareEval(s: string) {
  const funcs = new Set<string>();
  const vars = new Set<string>();
  const varsKeys = Array<{ obj: string; key: string }>();

  s = s.replace(funcRexp, s => {
    s = s.substr(0, s.length - 1);
    funcs.add(s);
    return `f.${s}(`;
  });
  
  s = s.replace(varsRexp, s => {
    s = s.substr(1);
    const keys = s.split('[');
    if (keys.length == 2) {
      const v = keys[0].trim();
      vars.add(v);
      const k = keys[1].trim();
      varsKeys.push({ obj: v, key: k.substr(1, k.lastIndexOf('"') - 1) });
    } else {
      vars.add(s.trim());
    }
    return `v.${s}`;
  });
  
  return {
    s,
    funcs,
    vars,
    varsKeys
  };
}

export interface EvalResult {
  f(funcs: Object, vars: Object): any;
  s: string;
  vars: Set<string>;
  varsKeys: Array<{ obj: string; key: string }>;
  funcs: Set<string>;
}

export function makeEval(s: string): EvalResult {
  const ctx = prepareEval(s);
  return {
    vars: ctx.vars,
    varsKeys: ctx.varsKeys,
    funcs: ctx.funcs,
    f: eval(`(f, v) => ${ctx.s}`),
    s: ctx.s
  };
}
