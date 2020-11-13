import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { Publisher } from 'objio';
import { Subscriber } from '../src/subscriber';
import { startDragging } from '../src/common/start-dragging';

interface Category {
  value: string;
  count: number;
  order?: number;
  children?: Array<Category>;
}

interface Point {
  x: number;
  y: number;
}

interface Range {
  from: number;
  to: number;
}

interface PosSize {
  from: number;
  size: number;
}

const Pie: React.SFC<{ center: Point; r: number; innerR?: number; angle: PosSize; style?: React.CSSProperties }> = props => {
  const { center, r, innerR: outerR, angle } = props;
  if (Math.PI * 2 - angle.size < 0.0001) {
    return (
      <circle
        cx={center.x}
        cy={center.y}
        r={r}
        style={props.style}
      />
    );
  }

  const from = {
    x: -Math.cos(angle.from) * r,
    y: -Math.sin(angle.from) * r
  };
  const to = {
    x: -Math.cos(angle.from + angle.size) * r,
    y: -Math.sin(angle.from + angle.size) * r
  };

  const flags = angle.size < Math.PI ? '0 1' : '1 1';
  let d = Array<string>();
  if (props.innerR > 0) {
    const outerFrom = {
      x: -Math.cos(angle.from) * outerR,
      y: -Math.sin(angle.from) * outerR
    };
    const outerTo = {
      x: -Math.cos(angle.from + angle.size) * outerR,
      y: -Math.sin(angle.from + angle.size) * outerR
    };
    const innerFlags = angle.size < Math.PI ? '0 0' : '1 0';

    d = [
      `M ${center.x + outerFrom.x} ${center.y + outerFrom.y}`,
      `L ${center.x + from.x} ${center.y + from.y}`,
      `A ${props.r} ${props.r} 0 ${flags} ${center.x + to.x} ${center.y + to.y}`,
      `L ${center.x + outerTo.x} ${center.y + outerTo.y}`,
      `A ${props.innerR} ${props.innerR} 0 ${innerFlags} ${center.x + outerFrom.x} ${center.y + outerFrom.y}`,
      `Z`
    ];
  } else {
    d = [
      `M ${center.x} ${center.y}`,
      `L ${center.x + from.x} ${center.y + from.y}`,
      `A ${props.r} ${props.r} 0 ${flags}`,
      `${center.x + to.x} ${center.y + to.y} Z`
    ];
  }

  return (
    <path
      style={props.style}
      d={d.join(' ')}
    />
  );
}

interface Segment {
  percValue: number;
  label: string;
  fillColor: string;
}

function calcInnerRect(height: number, radius: number) {
  const halfh = height / 2;
  const offs = radius - Math.sqrt(Math.abs(radius * radius - halfh * halfh));
  return {
    x: -radius + offs,
    y: -halfh,
    width: radius * 2 - offs * 2,
    height
  };
}

const PieChart: React.SFC<{ center: Point; r: number; innerR?: number; segments: Array<Segment> }> = props => {
  let from = 0;
  const pieChart = props.segments.map((seg, i) => {
    const angle = from;
    from += Math.PI * 2 * seg.percValue;
    return (
      <Pie
        key={i}
        r={props.r}
        innerR={props.innerR}
        center={props.center}
        angle={{ from: 0, size: Math.PI * 2 * seg.percValue }}
        style={{
          transformOrigin: `${props.center.x}px ${props.center.y}px`,
          transform: `rotate(${angle}rad)`,
          transition: 'transform 0.5s',
          fill: seg.fillColor,
          stroke: 'black',
          strokeOpacity: 0.5,
          strokeWidth: 1,
        }}
      />
    );
  });

  return (
    <g>
      {pieChart}
    </g>
  );
}

interface LegendBarProps {
  iconColor: string;
  label: string;
  count: number;
  bar: Array<number>;
  barColor: Array<string>;
  marginTop: number;
}

const LegendBar: React.SFC<LegendBarProps> = props => {
  return (
    <div style={{ marginTop: props.marginTop }}>
      <div className='horz-panel-1' style={{ display: 'flex', flexDirection: 'row' }}>
        <i
          className='fa fa-square'
          style={{ color: props.iconColor }}
        />
        <div style={{ flexGrow: 1 }}>{props.label}</div>
        <span>{props.count}</span>
      </div>
      <div style={{ fontSize: 0, height: 5, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 5 }}>
          {props.bar.map((perc, n) => <div style={{ display: 'inline-block', fontSize: 0, height: 5, width: `${perc * 100}%`, backgroundColor: props.barColor[n] }}></div>)}
        </div>
      </div>
    </div>
  );
}

class Pub<T> extends Publisher {
  private state: Partial<T> = {};

  constructor(state?: Partial<T>) {
    super();
    this.state = {...state};
  }

  setState(state: T) {
    this.state = {...this.state, ...state};
    this.delayedNotify();
  }

  getState(): T {
    return this.state as T;
  }
}

function genSegments() {
  let segs = Array<Segment>();
  let total = 1;

  let percValue = 0.1 + Math.random() * 0.2;
  total -= percValue;
  segs.push({ percValue, label: 'orange', fillColor: 'orange' });
  percValue = 0.1 + Math.random() * 0.2;
  total -= percValue;
  segs.push({ percValue, label: 'green', fillColor: 'green' });

  segs.push({ percValue: total, label: 'red', fillColor: 'red' });
  return segs;
}

storiesOf('Chart', module)
  .add('Pie', () => {
    const segm = genSegments();
    const pub = new Pub<{ width: number; height: number; }>({ width: 200, height: 200 });
    return (
      <Subscriber model={pub}>
        {() => {
          const { width, height } = pub.getState();
          const r = Math.min(width, height) / 2 - 2;
          const rect = calcInnerRect(30, r / 2);
          return (
            <div
              style={{
                display: 'inline-block',
                border: '1px solid black',
                position: 'relative'
              }}
            >
              <div
                style={{ position: 'relative', width, height }}
              >
                <svg viewBox={`0 0 ${width} ${height}`}>
                  <PieChart
                    center={{ x: width / 2, y: height / 2 }}
                    r={r}
                    segments={segm}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    left: rect.x + width / 2,
                    top: rect.y + height / 2,
                    width: rect.width,
                    height: rect.height,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1,
                    textAlign: 'center'
                  }}
                >
                  text xxx ccvv  sdawdaw awd awda awda wdawdawdawda
                </div>
              </div>
              <div
                style={{
                  backgroundColor: 'silver',
                  width: 5,
                  height: 5,
                  position: 'absolute',
                  bottom: 0,
                  right: 0
                }}
                onMouseDown={e => {
                  startDragging({ x: width, y: height }, {
                    onDragging: evt => pub.setState({ width: evt.x, height: evt.y })
                  })(e.nativeEvent);
                }}
              >
              </div>
            </div>
          );
      }}
      </Subscriber>
    );
  })
  .add('Dashboard', () => {
    const pies: Array<Category> = [
      {
        value: 'Законопроекты',
        count: 0,
        children: [
          {
            value: 'Подготовка акта',
            count: 10
          }, {
            value: 'Внешнее согласование',
            count: 9
          }, {
            value: 'Рассмотрение правительством РФ',
            count: 7
          }, {
            value: 'Рассмотрение в СФ РФ',
            count: 9
          }, {
            value: 'Рассмотрение в ГД РФ',
            count: 7
          }, {
            value: 'Принятие акта',
            count: 6
          }
        ]
      }, {
        value: 'Акты правительства',
        count: 0,
        children: [
          {
            value: 'Подготовка акта',
            count: 15
          }, {
            value: 'Внешнее согласование',
            count: 12
          }, {
            value: 'Рассмотрение Правительством РФ',
            count: 8
          }, {
            value: 'Принятие акта',
            order: 5,
            count: 5
          }
        ]
      }, {
        value: 'Акты президента',
        count: 0,
        children: [
          {
            value: 'Подготовка акта',
            count: 6
          }, {
            value: 'Внешнее согласование',
            count: 2
          }, {
            value: 'Рассмотрение Правительством РФ',
            count: 8
          }, {
            value: 'Принятие акта',
            order: 5,
            count: 4
          }
        ]
      }, {
        value: 'Ведомственные акты',
        count: 0,
        children: [
          {
            value: 'Внешнее согласование',
            count: 4,
            order: 1,
          }, {
            value: 'Подготовка акта',
            order: 0,
            count: 7
          }, {
            value: 'Принятие акта',
            order: 5,
            count: 1
          }
        ]
      }
    ];

    const colors = ['#F44336', '#E91E63', '#94C843', '#07B1B1', '#673AB7', '#3F51B5'];
    const padding = 10;
    const width = 1000 - padding * 2;
    const colWidth = Math.floor((width - (pies.length - 1) * 10) / pies.length);
    const pieRadius = Math.floor(colWidth / 2) - 2;
    return (
      <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: 'silver', width, padding }}>
        {pies.map((col, cn) => {
          let total = 0;
          col.children?.forEach(v => {
            total += v.count;
          });

          const segs: Array<Segment> = col.children?.map((cat, i) => {
            return {
              percValue: cat.count / total,
              label: cat.value,
              fillColor: colors[i % colors.length]
            };
          }) || [];

          return (
            <div
              style={{
                width: colWidth,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 0,
                marginLeft: cn > 0 ? 10 : 0
              }}
            >
              <svg viewBox={`0 0 ${colWidth} ${colWidth}`}>
                <PieChart
                  r={pieRadius}
                  innerR={pieRadius / 1.5}
                  center={{ x: colWidth / 2, y: colWidth / 2 }}
                  segments={segs}
                />
              </svg>
              <div>
                {col.children?.map((item, i) => {
                  const color = colors[item.order != null ? item.order : i];
                  return (
                    <LegendBar
                      marginTop={i > 0 ? 10 : 0}
                      count={10}
                      iconColor={color}
                      bar={[0.2, 0.2, 0.6]}
                      barColor={['#4098D7', '#F2970D', '#E03E3E']}
                      label={item.value}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  })