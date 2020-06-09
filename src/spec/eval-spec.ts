import { makeEval } from '../common/eval';

describe('eval.ts', () => {
  it('usage', () => {
    const res = makeEval('trim(" " + $rand + trim($col["col 1"]) + $recno + " ")');
    expect(Array.from(res.funcs)).toEqual(['trim']);
    expect(Array.from(res.vars)).toEqual(['rand', 'col', 'recno']);
    const r = res.f({
        trim: s => (s == null ? '' : s).trim()
      }, {
        rand: 'xyz',
        recno: 10,
        col: {["col 1"]: " [col1-data]  "}
      }
    );
    expect(r).toEqual('xyz[col1-data]10');
  });
});
