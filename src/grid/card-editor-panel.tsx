import * as React from 'react';
import { getBoxXAxis, getBoxYAxis, getBoxRect } from '../box-layout/box-layout-editor-model';
import { Subscriber } from '../subscriber';
import { DropDownString, SwitchPropItem, TextPropItem, PropSeparator } from '../prop-sheet/prop-item';
import { GridViewModel } from './grid-view-model';
import { FontProp, FontAppr } from '../prop-sheet/font-prop';
import { ColorProp } from '../prop-sheet/color-prop';
import { Tabs, Tab } from '../tabs';
import { BoxAppr, BoxContentType, Overflow, ValueType, ContentValue } from './grid-view-appr';
import { ApprObject } from '../common/appr-object';

interface Props {
  model: GridViewModel;
}

interface BaseApprProps {
  excludeKey?: Array<keyof BoxAppr>;
  base: Partial<BoxAppr>;
  appr: Partial<BoxAppr>;
  apprRef: ApprObject<any>;
  path: Array<string>;
  contCols?: Array<string>;
  hrefCols?: Array<string>;
  tipCols?: Array<string>;
  onChange(obj: Partial<BoxAppr>): void;
  onReset(key: keyof BoxAppr): void;
}

const contetTypeValues: Array<BoxContentType> = ['text', 'image', 'auto'];
const overflowValues: Array<Overflow> = ['auto', 'clip', 'hidden', 'scroll', 'visible'];
const valueCont: Array<ValueType> = ['custom', 'table', 'none'];

const ContentAppr: React.SFC<{ label: string; content: Partial<ContentValue>; columns?: Array<string>; onChange: (v: Partial<ContentValue>) => void }> = props => {
  return (
    <>
      <DropDownString
        show={props.columns && props.columns.length > 0}
        label={props.label}
        values={valueCont}
        value={props.content.type || 'table'}
        onChange={(type: ValueType) => {
          props.onChange({ type });
        }}
      />
      {props.content.type == 'custom' ?
        <TextPropItem
          label={`${props.label} text`}
          value={props.content.custom || ''}
          onEnter={custom => {
            props.onChange({ custom });
          }}
        /> : undefined}
      {props.content.type == 'table' ?
        <DropDownString
          label={`${props.label} column`}
          values={props.columns}
          value={props.content.value || ''}
          onChange={value => {
            props.onChange({ value });
          }}
        /> : undefined}
    </>
  );
};

const BaseAppr: React.SFC<BaseApprProps> = props => {
  return (
    <>
      {props.contCols ?
        <ContentAppr
          label='Content'
          columns={props.contCols}
          content={{...props.appr.content}}
          onChange={content => {
            props.onChange({ content });
          }}
        />
        : undefined}
      {props.hrefCols ?
        <ContentAppr
          label='Hyperlink'
          columns={props.hrefCols}
          content={{...props.appr.href}}
          onChange={href => {
            props.onChange({ href });
          }}
        /> : undefined}
      {props.tipCols ?
        <ContentAppr
          label='Tooltip'
          columns={props.tipCols}
          content={{...props.appr.tooltip}}
          onChange={tooltip => {
            props.onChange({ tooltip });
          }}
        /> : undefined}
      {props.contCols || props.hrefCols || props.tipCols ? <PropSeparator/> : undefined}
      <FontProp
        font={{ ...props.base?.font, ...props.appr?.font } as FontAppr}
        modified={props.apprRef.isModified(...props.path, 'font')}
        onChange={font => {
          props.onChange({ font });
        }}
        onReset={() => {
          props.onReset('font');
        }}
      />
      {!props.excludeKey || props.excludeKey.indexOf('contentType') == -1 ? (
        <DropDownString
          label='Content'
          values={contetTypeValues}
          value={props.appr.contentType || 'text'}
          onChange={(contentType: BoxContentType) => {
            props.onChange({ contentType });
          }}
        />
      ) : undefined}
      <DropDownString
        label='Overflow'
        values={overflowValues}
        value={props.appr.overflow || 'visible'}
        onChange={(overflow: Overflow) => {
          props.onChange({ overflow });
        }}
      />
      <SwitchPropItem
        label='Border'
        value={props.appr.border}
        onChanged={border => {
          props.onChange({ border });
        }}
      />
      <TextPropItem
        label='Padding'
        value={props.appr.padding || 0}
        onEnterNum={padding => {
          props.onChange({ padding });
        }}
      />
      <ColorProp
        label='Background'
        color={props.appr.background}
        onChange={background => {
          props.onChange({ background });
        }}
      />
    </>
  );
}

export const CardEditorPanel: React.SFC<Props> = props => {
  const m = props.model;
  const editor = m.getCardEditor();

  const render = () => {
    const active = editor.getActiveBoxKey();
    const box = editor.getBoxByKey(active);

    const appr = m.getAppr();
    const apprRef = m.getApprRef();
    const { width, height } = appr.cardsView;
    return (
      <Tabs defaultSelect='base'>
        <Tab id='base' icon='fa fa-id-card-o'>
          <BaseAppr
            base={{}}
            appr={appr.cardsView.boxAppr}
            apprRef={apprRef as ApprObject<any>}
            path={['cardsView', 'boxAppr']}
            excludeKey={['contentType']}
            onChange={boxAppr => {
              m.setApprChange({ cardsView: { boxAppr } });
              editor.delayedNotify();
            }}
            onReset={key => {
              m.modifyAppr(ref => ref.resetToDefault('cardsView', 'boxAppr', key));
              editor.delayedNotify();
            }}
          />
        </Tab>
        {box != null ? <Tab id='box' icon='fa fa-vcard'>
          <BaseAppr
            base={appr.cardsView.boxAppr}
            appr={{...appr.cardsView.boxMap[box.key]}}
            apprRef={apprRef as ApprObject<any>}
            path={['cardsView', 'boxMap', box.key]}
            onChange={boxAppr => {
              m.setApprChange({ cardsView: { boxMap: { [box.key]: boxAppr } } });
              editor.delayedNotify();
            }}
            onReset={key => {
              m.modifyAppr(ref => ref.resetToDefault('cardsView', 'boxMap', box.key, key));
              editor.delayedNotify();
            }}
            contCols={m.getAllColumns()}
            hrefCols={m.getAllColumns()}
            tipCols={m.getAllColumns()}
          />
          <DropDownString
            label='X'
            values={['left', 'right', 'stretch']}
            value={getBoxXAxis(box.rect)}
            onChange={(value: 'left' | 'right' | 'stretch') => {
              box.rect = getBoxRect({ box, x: value, contSize: { width, height } });
              editor.delayedNotify();
            }}
          />
          <DropDownString
            label='Y'
            values={['top', 'bottom', 'stretch']}
            value={getBoxYAxis(box.rect)}
            onChange={(value: 'top' | 'bottom' | 'stretch') => {
              box.rect = getBoxRect({ box, y: value, contSize: { width, height } });
              editor.delayedNotify();
            }}
          />
        </Tab> : <Tab id='box' icon='fa fa-vcard'/>}
      </Tabs>
    );
  };

  return (
    <Subscriber
      model={props.model.getCardEditor()}
      render={render}
    />
  );
};
