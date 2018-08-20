import { Publisher } from 'objio/common/publisher';

interface Range {
  from: number;
  to: number;
}

export type EventType = 'changed';

export class RangeSliderModel extends Publisher<EventType> {
  private minMaxRange: Range = { from: 0, to: 1 };
  private range: Range = { from: 0, to: 1};

  getMinMax(): Range {
    return {...this.minMaxRange};
  }

  setMinMax(range: Range): void {
    this.minMaxRange = {
      from: Math.min(range.from, range.to),
      to: Math.max(range.from, range.to)
    };

    this.range = {...range};
    this.delayedNotify({type: 'changed'});
  }

  getRange(): Range {
    return {...this.range};
  }

  setRange(range: Partial<Range>): void {
    if (range.from == null && range.to == null)
      return;

    range = {
      from: range.from != null ? range.from : this.range.from,
      to: range.to != null ? range.to : this.range.to
    };

    range = {
      from: Math.min(Math.max(range.from, this.minMaxRange.from), this.minMaxRange.to),
      to: Math.max(Math.min(range.to, this.minMaxRange.to), this.minMaxRange.from)
    };

    if (range.from != null && range.to != null) {
      this.range = {
        from: Math.min(range.from, range.to),
        to: Math.max(range.to, range.from)
      };
    }
    else if (range.to != null) {
      this.range = {
        to: Math.max(range.to, this.range.from),
        from: this.range.from
      };
    }
    else if (range.from != null ) {
      this.range = {
        from: Math.min(range.from, this.range.to),
        to: this.range.to
      };
    }

    this.delayedNotify({ type: 'changed' });
  }

  getRangeForRender(width: number): Range {
    const size = this.minMaxRange.to - this.minMaxRange.from;
    return {
      from: Math.round(this.range.from * ( width - 20 ) / size),
      to: Math.round(this.range.to * ( width - 20 ) / size)
    };
  }

  getRenderForRange(pos: number, width: number): number {
    const size = this.minMaxRange.to - this.minMaxRange.from;
    return size * pos / (width - 20);
  }
}
