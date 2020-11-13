import * as React from 'react';
import {
  Editor,
  EditorState,
  convertFromRaw,
  CompositeDecorator,
  SelectionState,
  convertToRaw
} from 'draft-js';
import type { TextEditorJSON } from './text-editor-model';
import {
  EntProps,
  EntData,
  LeafProps,
  makeEntFindStrategy,
  EntRenderProps,
  makeStyle
} from './helpers';
import { OrderedSet } from 'immutable';

const css = {
  textView: 'text-view',
  ent: 'text-view-ent'
};

interface Props extends React.HTMLProps<HTMLDivElement> {
  editorKey?: number;
  placeholder?: string;
  json?: TextEditorJSON;
  entRenderMap?: Record<string, React.SFC<EntRenderProps> | React.ComponentClass<EntRenderProps>>;
  renderEnt?(type: string, data: any): JSX.Element; // render entity that there is not in entRenderMap

  onChanged?(json: TextEditorJSON): void;
  onClickEnt?(type: string, data: any, e: React.MouseEvent): void;
}

interface State {
  editor?: EditorState;
  json?: TextEditorJSON;
  decorator?: CompositeDecorator;
}

export class TextView extends React.Component<Props, State> {
  state: State = {};

  constructor(props: Props) {
    super(props);

    const decorator = new CompositeDecorator([
      {
        strategy: makeEntFindStrategy(),
        component: (props: EntProps) => {
          const ent = props.contentState.getEntity(props.entityKey);
          const type = ent.getType();
          const data: EntData = ent.getData();
          const EntComponent = (this.props.entRenderMap || {})[type];
          const leaf = React.Children.toArray(props.children)[0] as React.ReactElement<LeafProps>;

          if (typeof EntComponent == 'function') {
            return (
              <EntComponent
                data={data}
                styles={makeStyle(leaf.props.styleSet, this.props.json.styles)}
                onChanged={this.onChanged}
                onClick={e => {
                  this.props.onClickEnt?.(type, data, e);
                }}
              >
                {leaf.props.text}
              </EntComponent>
            );
          }

          return (
            this.renderLink(type, data as any, leaf.props.text, leaf.props.styleSet) ||
            this.renderImg(type, data as any) || 
            this.renderEnt(type, data, props, leaf.props.styleSet)
          );
        }
      }
    ]);

    this.state = {
      decorator
    };
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (!props.json && !state.editor) {
      return {
        editor: EditorState.createEmpty()
      };
    }

    if (props.json != state.json) {
      return {
        json: props.json,
        editor: EditorState.createWithContent(
          convertFromRaw(props.json.content),
          state.decorator
        )
      };
    }

    return null;
  }

  private onChanged = () => {
    this.props.onChanged?.({
      content: convertToRaw(this.state.editor.getCurrentContent()),
      styles: this.props.json.styles
    });
  };

  private renderLink(type: string, data: { href: string; }, text: string, styleSet: OrderedSet<string>) {
    if (type != 'LINK')
      return null;

    return (
      <a
        href={data.href}
        style={makeStyle(styleSet, this.props.json.styles)}
        onClick={e => {
          this.props.onClickEnt?.(type, data, e);
        }}
      >
        {text}
      </a>
    );
  }

  private renderImg(type: string, data: { src: string; alt: string; }) {
    if (type != 'IMAGE')
      return null;

    return (
      <img
        alt={data.alt}
        src={data.src}
      />
    );
  }

  private renderEnt(type: string, ent: EntData, props: EntProps, styleSet: OrderedSet<string>) {
    return (
      <div
        data-offset-key={props.offsetKey}
        style={makeStyle(styleSet, this.props.json.styles)}
        className={css.ent}
      >
        {this.props.renderEnt?.(type, ent.data) ?? ent.label}
      </div>
    );
  }

  render() {
    const {
      renderEnt,
      json,
      placeholder,
      entRenderMap,
      onClickEnt,
      ...divProps
    } = this.props;

    return (
      <div {...divProps} className={css.textView}>
        <Editor
          key={this.props.editorKey}
          placeholder={placeholder}
          readOnly
          onChange={() => {}}
          editorState={this.state.editor}
          customStyleMap={this.state.json?.styles}
        />
      </div>
    );
  }
}
