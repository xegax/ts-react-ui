import * as React from 'react';
import {
  Editor,
  EditorState,
  convertFromRaw,
  CompositeDecorator
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

const css = {
  textView: 'text-view',
  ent: 'text-view-ent'
};

interface Props extends React.HTMLProps<HTMLDivElement> {
  placeholder?: string;
  json?: TextEditorJSON;
  entRenderMap?: Record<string, React.SFC<EntRenderProps>>;
  renderEnt?(type: string, data: any): JSX.Element;
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
              <EntComponent data={data.data} styles={makeStyle(leaf.props.styleSet, this.props.json.styles)}>
                {data.label}
              </EntComponent>
            );
          }

          return this.renderEnt(type, data, props);
        }
      }
    ]);

    this.state = { decorator };
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

  private renderEnt(type: string, ent: EntData, props: EntProps) {
    let style: React.CSSProperties = {};
    Object.keys(ent.styles || {})
    .forEach(s => {
      style = {
        ...style,
        ...this.props.json.styles[s]
      };
    });

    return (
      <div
        data-offset-key={props.offsetKey}
        style={style}
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
      ...divProps
    } = this.props;

    return (
      <div {...divProps} className={css.textView}>
        <Editor
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
