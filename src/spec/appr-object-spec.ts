import { ApprObject } from '../common/appr-object';
import { FontAppr } from '../common/font-appr';

interface TableAppr {
  columns: Record<string, { rename?: string; discard?: boolean; width?: number }>;
  sort: { cols: Array<{ name: string; reverse: boolean }>; reverse?: boolean };
  body: {
    font?: Partial<FontAppr>;
  }
}

describe('appr-object', () => {
  let appr: ApprObject<TableAppr>;
  beforeEach(() => {
    appr = new ApprObject<TableAppr>({
      columns: {},
      sort: { cols: [], reverse: false },
      body: {
        font: {
          family: 'Arial',
          sizePx: 10,
          bold: false,
          italic: false,
          color: 'black',
          align: 'left'
        }
      }
    });
  });

  it('set 1', () => {
    appr.set({ body: { font: { family: '111' } } });
    expect(appr.get().body.font.family).toEqual('111');
  });

  it('set 2', () => {
    appr.set({ body: { font: { family: '222', sizePx: 666 } } });
    const { family, sizePx } = appr.get().body.font;
    expect([ family, sizePx ]).toEqual(['222', 666]);
    expect(appr.isModified('body', 'font', 'family')).toBeTruthy();
    expect(appr.isModified('body', 'font', 'sizePx')).toBeTruthy();
  });

  it('set to reset', () => {
    appr.set({ body: { font: { family: '333', sizePx: 0 } }});
    appr.set({ body: { font: { family: null, sizePx: null } }});
    const { family, sizePx } = appr.get().body.font;
    expect([family, sizePx]).toEqual(['Arial', 10]);
  });

  it('set array', () => {
    const col = { name: 'column', reverse: false };
    appr.set({ sort: { cols: [col, col, col] } });
    const cols = appr.get().sort.cols;
    expect(cols).toEqual([col, col, col]);
    expect(cols[0] != col && cols[1] != col && cols[2] != col).toBeTruthy();
  });
})
