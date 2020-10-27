import * as React from 'react';
import { Editor } from 'draft-js';
import { CSSIcon } from '../cssicon';
import { findParent } from '../common/dom';
import * as DropDown from '../simple-drop-down';
import * as Color from '../color-swatches';
import { FontSize } from '../font-size';
import { TextEditorJSON, TextEditorModel } from './text-editor-model';

export { TextEditorModel, TextEditorJSON };

const fontList = [
  'Arial',
  'Impact',
  'Georgia',
  'Roboto',
  'Tahoma',
  'Verdana',
  'Times New Roman',
  'Courier New'
].sort().map(value => ({ value }));

interface State {
  key?: string;
  model?: TextEditorModel;
  subscriber?(): void;
}

interface Props {
  model?: TextEditorModel;
  toolbar?: boolean | ((m: TextEditorModel) => JSX.Element);
}

export class TextEditor extends React.Component<Props, State> {
  state: State = {};
  private ref = React.createRef<HTMLDivElement>();
  private editor = React.createRef<Editor>();

  constructor(props: Props) {
    super(props);

    let m: TextEditorModel;
    this.state = {
      model: m = props.model || new TextEditorModel(),
      subscriber: () => {
        this.setState({});
      }
    };

    m.subscribe(this.state.subscriber);
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (!props.model)
      return null;

    if (props.model != state.model) {
      state.model.unsubscribe(state.subscriber);
      props.model.subscribe(state.subscriber);
      return { model: props.model };
    }

    return null;
  }

  componentDidMount() {
    this.editor.current.focus();
  }

  private onContextMenu = (e: React.MouseEvent) => {
    const m = this.state.model;
    const entKey = m.getSelEntKey();
    if (!entKey)
      return;

    e.preventDefault();
  };

  private preventEntBreak = () => {
    if (this.state.model.getSelEntKey())
      return 'handled';

    return 'not-handled';
  };

  private renderToolbar() {
    if (this.props.toolbar == false)
      return undefined;

    const styles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 2
    };

    if (typeof this.props.toolbar == 'function') {
      return (
        <div
          className='horz-panel1'
          style={{...styles}}
        >
          {this.props.toolbar(this.state.model)}
        </div>
      );
    }

    const cs = this.state.model.getCurrStyle();
    return (
      <div
          className='horz-panel-1'
          style={{...styles}}
        >
          <CSSIcon
            icon='fa fa-bold'
            checked={cs.bold}
            onMouseDown={e => {
              this.state.model.toggleBold();
            }}
          />
          <CSSIcon
            icon='fa fa-italic'
            checked={cs.italic}
            onMouseDown={e => {
              this.state.model.toggleItalic();
            }}
          />
          <CSSIcon
            icon='fa fa-underline'
            checked={cs.underline}
            onMouseDown={e => {
              this.state.model.toggleUnderline();
            }}
          />
          <Color.Button
            cssIcon='fa fa-font'
            color={cs.textColor}
            onSelect={color => {
              this.state.model.setStyle('color', color);
            }}
          />
          <Color.Button
            cssIcon='fa fa-square'
            color={cs.bgColor}
            onSelect={color => {
              this.state.model.setStyle('backgroundColor', color);
            }}
          />
          <DropDown.Control
            className={DropDown.css.border}
            width={100}
            values={fontList}
            value={{ value: cs.fontFamily }}
            onSelect={font => {
              this.state.model.setStyle('fontFamily', font.value);
            }}
          />
          <FontSize
            value={cs.fontSize}
            onChange={v => {
              this.state.model.setStyle('fontSize', v + 'px');
            }}
          />
          <CSSIcon
            icon='fa fa-trash'
            onMouseDown={e => {
              this.state.model.clearStyles();
            }}
          />
      </div>
    );
  }

  render() {
    const hiddenProps = { preserveSelectionOnBlur: true };
    return (
      <div
        onMouseDown={e => {
          if (findParent(e.target as HTMLDivElement, this.ref.current))
            return;

          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {this.renderToolbar()}
        <div
          className='text-editor'
          style={{ border: '1px solid gray', padding: 5 }}
          ref={this.ref}
          onContextMenu={this.onContextMenu}
        >
          <Editor
            {...hiddenProps}
            key={this.state.model.getKey()}
            ref={this.editor}
            editorState={this.state.model.getState()}
            onChange={state => {
              this.state.model.setState(state);
            }}
            customStyleMap={this.state.model.getStyleMap()}
            handleReturn={this.preventEntBreak}
            handleBeforeInput={this.preventEntBreak}
            onLeftArrow={this.state.model.onLeftArrow}
            onRightArrow={this.state.model.onRightArrow}
          />
        </div>
      </div>
    );
  }
}
