import * as React from 'react';
import { ListView } from './list-view2';
import { KeyCode } from './common/keycode';

const css = {
  fontSize: 'font-size',
  fontSizeValue: 'font-size-value'
};

interface Props {
  onChange(v: number): void;
  value: number;
}

interface State {
  open?: boolean;
  edit?: string;
}

const fontSizes = [ '8', '9', '10', '11', '12', '14', '18', '24', '30', '36', '48', '60', '72', '96' ].map(value => ({ value }));

const numRange = ['0'.charCodeAt(0), '9'.charCodeAt(0)];
export class FontSize extends React.Component<Props, State> {
  private ref = React.createRef<HTMLInputElement>();
  state: State = {
    open: false
  };

  render() {
    const propsSize = '' + this.props.value;
    const value = fontSizes.find(v => v.value == propsSize);
    return (
      <div className={css.fontSize}>
        <div
          className={css.fontSizeValue}
          tabIndex={0}
          ref={this.ref}
          onMouseDown={e => {
            e.stopPropagation();
            this.setState({ open: true });
          }}
          onBlur={() => {
            this.setState({ open: false, edit: undefined });
          }}
          onKeyDown={e => {
            let edit = this.state.edit ?? '';
            if (e.keyCode >= numRange[0] && e.keyCode <= numRange[1]) {
              edit += e.key;
              this.setState({ edit: '' + Math.min(100, parseFloat(edit)) });
            } else if (e.keyCode == KeyCode.ENTER) {
              this.props.onChange(parseFloat(edit));
              this.setState({ edit: undefined, open: false });
            } else if (e.keyCode == KeyCode.BACKSPACE) {
              edit = edit.slice(0, edit.length - 1);
              this.setState({ edit: edit.length ? edit : undefined });
            }
          }}
        >
          {this.state.edit == null ? this.props.value : this.state.edit + ' '}
        </div>
        <ListView
          style={{
            display: !this.state.open ? 'none' : undefined,
            minWidth: this.ref.current?.offsetWidth,
            position: 'absolute'
          }}
          values={fontSizes}
          value={value ? [value] : undefined}
          onSelect={item => {
            this.props.onChange(+item[0].value);
          }}
        />
      </div>
    );
  }
}
