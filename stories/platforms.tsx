import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { KeyCode } from '../src/common/keycode';
import { Rect } from '../src/common/rect';
import { clamp } from '../src/common/common';

interface Block {
  img: string;
  mask: string;
  imgEl?: HTMLImageElement;
  maskData?: Uint8ClampedArray;
  bbox?: Rect;
  w?: number;
  h?: number;
}

function loadImage(img: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('img');
    el.src = img;
    el.addEventListener('load', () => {
      resolve(el);
    });
    el.addEventListener('error', reject);
  });
}

let gc = document.createElement('canvas');
function prepareBlock(block: Block): Promise<void> {
  return (
    Promise.all([
      loadImage(block.img),
      loadImage(block.mask)
    ]).then(([img, mask]) => {
      const ctx = gc.getContext('2d');
      gc.width = Math.max(block.w = mask.width, gc.width);
      gc.height = Math.max(block.h = mask.height, gc.height);
      ctx.drawImage(mask, 0, 0);
      const maskData = ctx.getImageData(0, 0, block.w, block.h).data;
      block.maskData = new Uint8ClampedArray(block.w * block.h);
      block.imgEl = img;
      block.bbox = { x: 0, y: 0, width: 16, height: 16 };
      for (let p = 0; p < maskData.length; p++)
        block.maskData[p] = maskData[p * 4];
    })
  );
}

function loadBlocks(map: Map<string, Block>): Promise<void> {
  let p = Promise.resolve();
  for (const b of map.values()) {
    p = p.then(() => prepareBlock(b));
  }
  return p;
}

let mario = document.createElement('img');
mario.src= 'mario.png';

const blocks = new Map<string, Block>();
blocks.set('*', {
  img: 'wood-one.png',
  mask: 'mask-full.png'
});

blocks.set('[', {
  img: 'wood-left.png',
  mask: 'mask-full.png'
});

blocks.set(']', {
  img: 'wood-right.png',
  mask: 'mask-full.png'
});

blocks.set('#', {
  img: 'wood-mid.png',
  mask: 'mask-full.png'
});

blocks.set('?', {
  img: 'quest.png',
  mask: 'mask-full.png'
});

blocks.set('_', {
  img: 'wood-one-half-bottom.png',
  mask: 'mask-half-bottom.png'
});

blocks.set('=', {
  img: 'bwood-half-bottom.png',
  mask: 'back-half-bottom.png'
});

blocks.set('n', {
  img: 'stair.png',
  mask: 'stair-mask.png'
});

function makeScene(rows: Array<string>, s: number) {
  let w = 16, h = 16;
  let res: Array<BPos> = [];
  for (let r = 0; r < rows.length; r++) {
    let row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const tile = row[c];
      if (tile == ' ')
        continue;

      res.push({
        y: r * h,
        x: c * w,
        sy: r * h * s,
        sx: c * w * s,
        block: tile,
        prev: { y: r * h * s, x: c * w * s }
      });
    }
  }
  return res;
}

// r1[x, size]
function isIntersect(r1: number[], r2: number[]) {
  return Math.max(r1[0], r1[0] + r1[1], r2[0], r2[0] + r2[1]) - Math.min(r1[0], r1[0] + r1[1], r2[0], r2[0] + r2[1]) < r1[1] + r2[1];
}

interface BPos {
  x: number;
  y: number;
  sx: number;
  sy: number;
  prev: { x: number; y: number };
  block: string;
}

interface EntRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface MoveResult {
  hit?: BPos;
}

interface Ent {
  x: number;
  y: number;
  sx: number;
  sy: number;
  prev: {
    x: number;
    y: number;
  },

  xdir: number;
  lastXDir: number;

  jump: number;
  jumpTime: number;

  air: boolean;
  airTime: number;

  width: number;
  height: number;
  onBlock?: BPos;
}

let marioEnt: Ent = {
  x: 105,
  y: 31,
  sx: 0,
  sy: 0,
  prev: { x: 105, y: 31 },
  air: false,
  airTime: 0,
  xdir: 0,
  lastXDir: 0,
  width: 6,
  height: 16,
  jump: 0,
  jumpTime: 0
};

let fall = [
  1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 4, 5, 6, 6, 5, 5, 6
];

let jump = [
  -6, -6, -6, -6, -5, -5, -4, -5, -4, -3, -3, -3, -3, -2, -2, -1, -2, 0, -1, 0, 0, 0
];

enum InputMask {
  Left = 1 << 0,
  Right = 1 << 1,
  Up = 1 << 2,
  Down = 1 << 3,
  A = 1 << 4,
  B = 1 << 5
};

interface MoveBlock {
  block: BPos;
  movement: Array<{ n: number; vx: number; vy: number }>;
  n: number;
  m: number;
}

class Dummy extends React.Component {
  private cnv = React.createRef<HTMLCanvasElement>();
  
  private keyMap = [];
  private input: number = 0;
  private frames = 0;
  private skipFrame = 0;
  private timeStart?: number;
  private scale = 3;

  private blocks = makeScene([
    '                ',
    '    == n=  **   ',
    '   =  ?         ',
    '  =  =   ?      ',
    '      =   ??    ',
    ' **    _         ',
    '##########]  [##'
  ], this.scale);

  private movedBlocks = Array<MoveBlock>();

  constructor(props) {
    super(props);

    const b = { x: 0, y: 16, sx: 0, sy: 16 * this.scale, block: '=', prev: { x: 0, y: 0 } };
    this.blocks.push(b);
    this.movedBlocks.push({
      block: b,
      movement: [{ n: 16 * 3 * 2, vx: 0.5, vy: 0 }, { n: 16 * 3 * 2, vx: -0.5, vy: 0 }],
      n: 0,
      m: 0
    });
  }

  componentDidMount() {
    loadBlocks(blocks)
    .then(() => {
      this.timeStart = Date.now();
      setInterval(() => this.tick(), 1);
    });
  }

  private isWallFree(currx: number, curry: number, ysize: number, mask: number) {
    let xsize = 1;
    if (currx != Math.floor(currx)) {
      currx = Math.floor(currx);
      xsize++;
    }

    if (curry != Math.floor(curry)) {
      curry = Math.floor(curry);
      ysize++;
    }

    const rx = [currx, xsize];
    const ry = [curry, ysize];
    for (let n = 0; n < this.blocks.length; n++) {
      const bi = this.blocks[n];
      const b = blocks.get(bi.block);
      if (!isIntersect([bi.x + b.bbox.x, b.bbox.width], rx) || !isIntersect([bi.y + b.bbox.y, b.bbox.height], ry))
        continue;
        
      for (let y = 0; y < ysize; y++)
      for (let x = 0; x < xsize; x++) {
        let xp = currx + x - bi.x;
        let yp = curry + y - bi.y;
        if (xp < 0 || xp >= b.w || yp < 0 || yp >= b.h)
          continue;

        if ((b.maskData[yp * b.w + xp] & mask) == 0) {
          return bi;
        }
      }
    }

    return null;
  }

  private isFloorFree(currx: number, curry: number, xsize: number, mask: number) {
    let ysize = 1;
    if (currx != Math.floor(currx)) {
      currx = Math.floor(currx);
      xsize++;
    }

    if (curry != Math.floor(curry)) {
      curry = Math.floor(curry);
      ysize++;
    }

    const rx = [currx, xsize];
    const ry = [curry, ysize];
    for (let n = 0; n < this.blocks.length; n++) {
      const bi = this.blocks[n];
      const bix = Math.floor(bi.x);
      const biy = Math.floor(bi.y);
      const b = blocks.get(bi.block);
      if (!isIntersect([bix + b.bbox.x, b.bbox.width], rx) || !isIntersect([biy + b.bbox.y, b.bbox.height], ry))
        continue;
        
      for (let y = 0; y < ysize; y++)
      for (let x = 0; x < xsize; x++) {
        let xp = currx + x - bix;
        let yp = curry + y - biy;
        if (xp < 0 || xp >= b.w || yp < 0 || yp >= b.h)
          continue;

        if ((b.maskData[yp * b.w + xp] & mask) == 0)
          return bi;
      }
    }

    return null;
  }

  private moveDir(ent: EntRect, dirx: number, diry: number, mask: number): MoveResult {
    if (dirx == 0 && diry == 0)
      return {};

    if (dirx && Math.abs(dirx) <= 1 || diry && Math.abs(diry) <= 1)
      return this.moveDirImpl(ent, dirx, diry, mask);

    let perx = Math.abs(dirx) / dirx || 0;
    let pery = Math.abs(diry) / diry || 0;
    let sx = perx;
    let sy = pery;

    let len = Math.ceil(Math.max(Math.abs(dirx), Math.abs(diry)));
    for (let n = 0; n < len; n++) {
      const moveRes = this.moveDirImpl(ent, perx, pery, mask);
      if (moveRes.hit)
        return moveRes;

      if (Math.abs(sx) > Math.abs(dirx)) {
        perx = (sx - dirx);
        perx = Math.floor(perx * 100) / 100;
      }

      if (Math.abs(sy) > Math.abs(diry)) {
        const sign = pery;
        pery = (1 - Math.abs(sy - diry));
        pery = sign * Math.floor(pery * 10) / 10;
      }

      sx += perx;
      sy += pery;
    }

    return {};
  }

  private moveDirImpl(ent: EntRect, dirx: number, diry: number, mask: number): MoveResult {
    const nextx = ent.x + dirx;
    const nexty = ent.y + diry;

    let block: BPos | undefined;
    if (dirx) {
      block = this.isWallFree(dirx < 0 ? nextx : nextx + ent.w - 1, ent.y - ent.h + 1, ent.h, mask);
      if (!block) {
        ent.x = nextx;
        return {};
      }
    } else if (diry > 0) {  // down
      block = this.isFloorFree(ent.x, nexty, ent.w, mask);
      if (block && this.isFloorFree(ent.x, ent.y, ent.w, mask))
        block = undefined;

      if (!block) {
        ent.y = nexty;
        return {};
      }
    } else if (diry < 0) { // up
      block = this.isFloorFree(ent.x, nexty - ent.h + 1, ent.w, mask);
      if (!block) {
        ent.y = nexty;
        return {};
      }
    } else {
      return {};
    }

    if (dirx > 0)
      ent.x = Math.ceil(ent.x);
    else if (dirx < 0)
      ent.x = Math.floor(ent.x);

    if (diry > 0)
      ent.y = Math.ceil(ent.y);
    else if (diry < 0)
      ent.y = Math.floor(ent.y);

    return { hit: block };
  };

  updateTime() {
    const t = Date.now() - this.timeStart;

    const msPerFrame = 1000 / 50;
    const nf = t / msPerFrame - this.skipFrame;
    const nextFrame = Math.floor(nf);
    if (nextFrame - this.frames == 0) {
      this.interpolate(nf - nextFrame);
      return false;
    }

    this.skipFrame += (nextFrame - this.frames - 1);
    this.frames++;
    return true;
  }

  updateEnt(ent: Ent, prevInput: number) {
    const prevA = (prevInput & InputMask.A) != 0;
    const nextA = (this.input & InputMask.A) != 0;
    const nextDown = (this.input & InputMask.Down) != 0;

    if (!prevA && nextA && !ent.jump && ent.onBlock) {
      if (nextDown && ent.onBlock.block == '=') {
        ent.y += 0.1;
      } else if (!nextDown) {
        ent.jump = 1;
        ent.jumpTime = this.frames + 1;
      }
    }

    if (ent.jump && !nextA) {
      ent.jump = 0;
      ent.airTime = this.frames + 1;
    }

    let newXdir = 0;
    if (this.input & InputMask.Left)
      newXdir = -1;
    else if (this.input & InputMask.Right)
      newXdir = 1;

    if (newXdir != ent.xdir) {
      ent.xdir = newXdir;
      if (ent.xdir)
        ent.lastXDir = ent.xdir;
    }

    let falldir = fall[Math.min(this.frames - ent.airTime, fall.length - 1)];
    let ydir = falldir;
    if (ent.jump) {
      const f = this.frames - ent.jumpTime;
      if (f < jump.length)
        ydir = jump[f];
      else {
        ent.jump = 0;
        ent.airTime = this.frames + 1;
      }
    }

    const entRect = {
      x: ent.x,
      y: ent.y,
      w: ent.width,
      h: ent.height
    };

    if (ent.xdir) {
      const res = this.moveDir(entRect, ent.xdir, 0, 0x80);
      if (res.hit && res.hit.block == '=') {
        entRect.x = ent.x;
        this.moveDir(entRect, ent.xdir, 0, 0xff);
      } else if (res.hit) {
        this.moveDir(entRect, 0, -1, 0x80);
        this.moveDir(entRect, 0.1, 0, 0x80);
      }
    }

    let air = ent.air;
    const res = this.moveDir(entRect, 0, ydir, ydir < 0 ? 0xff : 0x80);
    if (res.hit) {
      ent.jump = 0;
      if (ydir > 0)
        air = false;
    } else {
      air = true;
    }

    if (air != ent.air)
      ent.airTime = this.frames + 1;

    ent.air = air;
    ent.onBlock = res.hit;
    if (air)
      ent.onBlock = undefined;

    ent.x = entRect.x;
    ent.y = entRect.y;
  }

  updateInput() {
    this.input = 0;
    if (this.keyMap[KeyCode.ARROW_LEFT])
      this.input |= InputMask.Left;

    if (this.keyMap[KeyCode.ARROW_RIGHT])
      this.input |= InputMask.Right;

    if (this.keyMap[KeyCode.ARROW_UP])
      this.input |= InputMask.Up;

    if (this.keyMap[KeyCode.ARROW_DOWN])
      this.input |= InputMask.Down;

    if (this.keyMap[KeyCode.SPACE])
      this.input |= InputMask.A;
  }

  drawEnt(ctx: CanvasRenderingContext2D, pos: { x: number, y: number }, img: HTMLImageElement) {
    let flip = marioEnt.lastXDir == 1;
    ctx.setTransform(
      flip ? -1 : 1,
      0, 0,
      1,
      Math.floor(pos.x - 5 * this.scale + (flip ? img.width : 0)),
      Math.floor(pos.y - 15 * this.scale)
    );
    ctx.drawImage(img, 0, 0);
  }

  tick() {
    if (!this.cnv.current || !this.updateTime())
      return;

    let prevInput = this.input;
    this.updateInput();
    marioEnt.prev.x = marioEnt.sx;
    marioEnt.prev.y = marioEnt.sy;
    this.updateEnt(marioEnt, prevInput);
    this.updateMovedBlocks();
    marioEnt.sx = marioEnt.x * this.scale;
    marioEnt.sy = marioEnt.y * this.scale;
    this.interpolate(0);
  }

  interpolate(t: number) {
    if (!this.cnv.current)
      return;

    const ctx = this.cnv.current.getContext('2d');
    ctx.clearRect(0, 0, this.cnv.current.width, this.cnv.current.height);
    this.blocks.forEach(b => {
      const bl = blocks.get(b.block);
      if (!bl)
        return;

      if (b.x == b.prev.x && b.y == b.prev.y) {
        ctx.drawImage(bl.imgEl, b.sx, b.sy);
      } else {
        let vx = b.sx - b.prev.x;
        let vy = b.sy - b.prev.y;
        ctx.drawImage(bl.imgEl, Math.floor(b.prev.x + vx * t), Math.floor(b.prev.y + vy * t));
      }
    });
  
    let vx = marioEnt.sx - marioEnt.prev.x;
    let vy = marioEnt.sy - marioEnt.prev.y;
    let pos = {
      x: marioEnt.prev.x + vx * t,
      y: marioEnt.prev.y + vy * t
    };
    this.drawEnt(ctx, pos, mario);
    ctx.resetTransform();
  
    ctx.strokeStyle = 'black';
    const fps = this.frames / (Date.now() - this.timeStart) * 1000;
    ctx.strokeText(`${Math.floor(fps)}, ${this.frames}, ${this.skipFrame}`, 0, 12);
    // this.setState({});
  }

  private updateMovedBlocks() {
    let ent = {
      x: marioEnt.x,
      y: marioEnt.y,
      w: marioEnt.width,
      h: marioEnt.height
    };

    for (let b = 0; b < this.movedBlocks.length; b++) {
      const mb = this.movedBlocks[b];
      const move = mb.movement[mb.m];
      mb.block.prev.x = mb.block.sx;
      mb.block.prev.y = mb.block.sy;

      mb.block.x += move.vx;
      if (marioEnt.onBlock == mb.block && move.vx)
        this.moveDir(ent, move.vx, 0, 0xff);

      mb.block.y += move.vy;
      if (marioEnt.onBlock == mb.block && move.vy)
        this.moveDir(ent, 0, move.vy, 0xff);

      mb.block.sx = mb.block.x * this.scale;
      mb.block.sy = mb.block.y * this.scale;

      mb.n++;
      if (mb.n >= move.n) {
        mb.n = 0;
        mb.m++;
        if (mb.m >= mb.movement.length)
          mb.m = 0;
      }
    }

    marioEnt.x = ent.x;
    marioEnt.y = ent.y;
  }

  private onKeyDown = (e: React.KeyboardEvent) => {
    this.keyMap[e.keyCode] = 1;
  };

  private onKeyUp = (e: React.KeyboardEvent) => {
    this.keyMap[e.keyCode] = 0;
  };

  render() {
    return (
      <div
        tabIndex={0}
        style={{ position: 'relative', outline: 'none', zoom: 1 }}
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
      >
        <canvas
          ref={this.cnv}
          width={250 * this.scale}
          height={150 * this.scale}
        />
      </div>
    );
  }
}


storiesOf('platforms', module)
  .add('game', () => {
    return <Dummy/>;
  });
