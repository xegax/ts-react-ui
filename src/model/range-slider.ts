import { Publisher } from 'objio/common/publisher';

export interface Range {
  from: number;
  to: number;
}

export type EventType = 'changing' | 'changed';
export type LastDrag = 'from' | 'to' | 'thumb';

export class RangeSliderModel extends Publisher<EventType> {
  private minMaxRange: Range = { from: 0, to: 1 };
  private range: Range = { from: 0, to: 1};
  private sliderSize: number = 10;
  private lastDrag: LastDrag;
  private round: boolean = false;

  setRound(round: boolean): void {
    this.round = round;
  }

  getRound(): boolean {
    return this.round;
  }

  getSliderSize() {
    return this.sliderSize;
  }

  getLastDrag(): LastDrag {
    return this.lastDrag;
  }

  setLastDrag(drag: LastDrag): void {
    this.lastDrag = drag;
  }

  getMinMax(): Range {
    return {...this.minMaxRange};
  }

  protected value(val: number): number {
    if (this.round)
      return Math.round(val);

    return val;
  }

  setMinMax(range: Range): void {
    this.minMaxRange = {
      from: this.value(Math.min(range.from, range.to)),
      to: this.value(Math.max(range.from, range.to))
    };

    this.range = {
      from: this.value(range.from),
      to: this.value(range.to)
    };

    this.delayedNotify({type: 'changing'});
  }

  getRange(): Range {
    return {...this.range};
  }

  setRange(range: Partial<Range>): void {
    if (range.from == null && range.to == null)
      return;

    const from = range.from != null;
    const to = range.to != null;

    range = {
      from: from ? this.value(range.from) : this.range.from,
      to: to ? this.value(range.to) : this.range.to
    };

    range = {
      from: Math.min(Math.max(range.from, this.minMaxRange.from), this.minMaxRange.to),
      to: Math.max(Math.min(range.to, this.minMaxRange.to), this.minMaxRange.from)
    };

    if (from && to) {
      this.range = {
        from: Math.min(range.from, range.to),
        to: Math.max(range.to, range.from)
      };
    }
    else if (to) {
      this.range = {
        to: Math.max(range.to, this.range.from),
        from: this.range.from
      };
    }
    else if (from) {
      this.range = {
        from: Math.min(range.from, this.range.to),
        to: this.range.to
      };
    }

    this.delayedNotify({ type: 'changing' });
  }

  getRangeForRender(width: number): Range {
    const size = this.minMaxRange.to - this.minMaxRange.from;
    return {
      from: Math.round((this.range.from - this.minMaxRange.from) * ( width - this.sliderSize * 2 ) / size),
      to: Math.round((this.range.to - this.minMaxRange.from) * ( width - this.sliderSize * 2 ) / size)
    };
  }

  getRenderForRange(pos: number, width: number): number {
    const size = this.minMaxRange.to - this.minMaxRange.from;
    return this.minMaxRange.from + size * pos / (width - this.sliderSize * 2);
  }
}
