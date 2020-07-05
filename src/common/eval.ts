const isSpace = (chr: string) => {
	return chr == ' ' || chr == '\t';
};

const abcRange1 = ['a'.charCodeAt(0), 'z'.charCodeAt(0)];
const abcRange2 = ['A'.charCodeAt(0), 'Z'.charCodeAt(0)];
const isAlpha = (chr: string) => {
	const code = chr.charCodeAt(0);
	return (
		code >= abcRange1[0] && code <= abcRange1[1] ||
		code >= abcRange2[0] && code <= abcRange2[1]
	);
}

const makeToken = (chr: string) => {
	if (isSpace(chr))
		return undefined;

	let v = chr;
	if (chr == '$') {
		return (next: string) => {
			if (v.length == 1) {
				if (isAlpha(next))
					v += next;
				else if (!isSpace(next))
					throw 'syntax error';
			} else {
				if (!isAlpha(next)) {
          if (next != '[')
            next = '';

          return {
            type: 'var',
            key: v.substr(1),
            v: `v.${v.substr(1)}${next}`
          };
        }
				v += next;
			}
		};
	} else if (chr == '"') {
		return (next: string) => {
			v += next;
			if (next == '"') {
				return { type: 'str', key: v, v };
			}
		};
	} else if (isAlpha(chr)) {
		return (next: string) => {
			if (next == '(') {
				return {
          type: 'func',
          key: v,
					v: `f.${v}(`
				};
			}
			v += next;
		};
	}
}

const prepare = (s: string, funcs: Set<string>, vars: Set<string>) => {
  let token: ((chr: string) => { type: string; v: string; key: string; });
  let v = '';
  let res = '';
	for (let n = 0; n <= s.length; n++) {
		const chr = s[n] || '';
		if (!token) {
			token = makeToken(chr);
			if (token) {
				res += v;
				v = '';
			}
		} else {
			let tmp = token(chr);
			if (!tmp)
        continue;
      token = undefined;
      if (tmp.type == 'func')
        funcs.add(tmp.key);
      else if (tmp.type == 'var')
        vars.add(tmp.key);
			res += tmp.v;
			continue;
		}
		
		if (!token)
			v += chr;
	}
	res += v;
	return res;
};


export function prepareEval(s: string) {
  const funcs = new Set<string>();
  const vars = new Set<string>();

  s = prepare(s, funcs, vars);
  return {
    s,
    funcs,
    vars
  };
}

export interface EvalResult {
  f(funcs: Object, vars: Object): any;
  s: string;
  vars: Set<string>;
  funcs: Set<string>;
}

export function makeEval(s: string): EvalResult {
  const ctx = prepareEval(s);
  return {
    vars: ctx.vars,
    funcs: ctx.funcs,
    f: eval(`(f, v) => ${ctx.s}`),
    s: ctx.s
  };
}
