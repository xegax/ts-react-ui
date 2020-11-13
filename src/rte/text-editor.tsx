import * as React from 'react';
import { Editor } from 'draft-js';
import { CSSIcon } from '../cssicon';
import { findParent } from '../common/dom';
import * as DropDown from '../simple-drop-down';
import * as Color from '../color-swatches';
import { FontSize } from '../font-size';
import { TextEditorJSON, TextEditorModel } from './text-editor-model';
import { EntEditor } from './helpers';
import { PopoverIcon, Classes } from '../popover';
import { ListView, Item } from '../list-view2';
import { Position } from '@blueprintjs/core';
import { isEquals } from '../common/common';

export { TextEditorModel, TextEditorJSON };

const css = {
  textEditor: 'text-editor',
  textEditorWrapper: 'text-editor-wrapper'
};

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

const blockList = [
  'unstyled',
  'header-one',
  'header-two',
  'header-three',
  'header-four',
  'header-five',
  'header-six',
  'unordered-list-item',
  'ordered-list-item',
  'blockquote',
  'code-block',
  'atomic'
].map(value => ({ value }));

interface State {
  key?: string;
  model?: TextEditorModel;
  subscriber?(): void;
}

interface Props {
  width?: number;
  height?: number;
  model?: TextEditorModel;
  entEditorMap?: Record<string, EntEditor>;
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

    Object.keys(props.entEditorMap || {})
    .forEach(k => {
      m.appendEntEditor(k, props.entEditorMap[k]);
    });
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

  private renderEntTools() {
    const m = this.state.model;
    const editorMap = m.getEntEditorsMap();
    const entArr = Object.keys(editorMap).map(k => {
      return {
        value: k,
        render: editorMap[k].name
      };
    });

    if (entArr.length == 0)
      return null;

    const appendEnt = (itemArr: Array<Item>) => {
      const entType = itemArr[0].value;
      if (!entType)
        return;

      editorMap[entType].append()
      .then(res => {
        m.insertEnt(entType, res.text, res.data);
      })
      .catch(() => {
        m.focus();
      });
    };

    const editEnt = () => {
      const selEnt = m.getSelEnt();
      const editor = editorMap[selEnt.type];
      if (!editor)
        return;

      const args = { data: selEnt.data, text: selEnt.text };
      editor.edit({...args})
      .then(res => {
        if (!isEquals(res, args))
          m.updateEnt(selEnt.key, res.text, res.data);
        else
          m.focus();
      })
      .catch(() => {
        m.focus();
      });
    };

    return (
      <>
        <PopoverIcon
          icon='fa fa-plus'
          show={m.getSelEnt() == null}
          position={Position.BOTTOM_LEFT}
        >
          <ListView
            values={entArr}
            className={Classes.POPOVER_DISMISS}
            onSelect={appendEnt}
          />
        </PopoverIcon>
        <CSSIcon
          icon='fa fa-edit'
          width='1.2em'
          show={m.getSelEnt() != null}
          onClick={editEnt}
        />
      </>
    );
  }

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

    const blockTypes = this.state.model.getSelBlockTypes();
    const selBlockType = blockTypes.size == 1 ? Array.from(blockTypes)[0] : undefined;
    const cs = this.state.model.getCurrStyle();
    return (
      <div
        className='horz-panel-1'
        style={{...styles}}
      >
        {this.renderEntTools()}
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
        <DropDown.Control
          className={DropDown.css.border}
          width={100}
          values={blockList}
          value={{ value: selBlockType }}
          onSelect={block => {
            this.state.model.setBlockType(block.value);
          }}
        />
      </div>
    );
  }

  render() {
    const hiddenProps = { preserveSelectionOnBlur: true };
    return (
      <div
        className={css.textEditorWrapper}
        onMouseDown={e => {
          if (findParent(e.target as HTMLDivElement, this.ref.current.firstChild as HTMLDivElement))
            return;

          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {this.renderToolbar()}
        <div style={{ position: 'relative', flexGrow: 1 }}>
          <div
            className={css.textEditor}
            style={{ border: '1px solid gray' }}
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
      </div>
    );
  }
}
