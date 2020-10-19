import * as React from 'react';
import {
  EditorState,
  CompositeDecorator,
  ContentBlock,
  ContentState,
  Modifier,
  SelectionState,
  RawDraftContentState,
  convertToRaw,
  convertFromRaw
} from 'draft-js';
import { Publisher } from 'objio';
import { cn, clone } from '../common/common';
import { OrderedSet } from 'immutable';
import { EntProps, EntData, makeEntFindStrategy } from './helpers';

interface SelState {
  anchorOffset: number;
  anchorKey: string;
  focusOffset: number;
  focusKey: string;
  isBackward: boolean;
  hasFocus: boolean;
}

function makeSelectionFrom(orig: SelectionState, override?: Partial<SelState>): SelectionState {
  return new SelectionState({
    anchorOffset: orig.getStartOffset(),
    anchorKey: orig.getStartKey(),
    focusOffset: orig.getEndOffset(),
    focusKey: orig.getEndKey(),
    isBackward: false,
    hasFocus: true,
    ...override
  });
}

function makeBlockSelection(block: string, range: number[]): SelectionState {
  return new SelectionState({
    anchorOffset: range[0],
    anchorKey: block,
    focusOffset: range[1],
    focusKey: block,
    isBackward: false,
    hasFocus: true
  });
}

type CSSKeys = 'fontSize' | 'fontFamily' | 'color' | 'backgroundColor';
const cssKeyMap: Record<CSSKeys, string> = {
  'fontSize': 'fs',
  'fontFamily': 'ff',
  'color': 'color',
  'backgroundColor': 'bgc'
};

interface StyleState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  bgColor?: string;
}

interface Range {
  from: number;
  to: number;
}

type StyleMap = Record<string, React.CSSProperties>;

function isStyleAttrSame(s1: string, s2: string) {
  const [s1attr] = s1.split('-');
  return s2.startsWith(s1attr + '-');
}

export interface TextEditorJSON {
  content: RawDraftContentState;
  styles: StyleMap;
}

export class TextEditorModel extends Publisher {
  private state: EditorState;
  private decorator: CompositeDecorator;
  private selEnt?: string;
  private selBlock?: string;
  private key = 0;
  private styleMap: StyleMap = {};
  private currStyle: StyleState = {
    bold: false,
    italic: false,
    underline: false,
    fontFamily: 'Tahoma',
    fontSize: 14,
    textColor: '#000000'
  };

  constructor(content?: ContentState) {
    super();

    this.decorator = new CompositeDecorator([
      {
        strategy: makeEntFindStrategy(),
        component: (props: EntProps) => {
          const data = props.contentState.getEntity(props.entityKey).getData();
          return this.renderEnt(data, props);
        }
      }
    ]);
    this.state = content ? EditorState.createWithContent(content, this.decorator) : EditorState.createEmpty(this.decorator);
  }

  static create(json?: TextEditorJSON): TextEditorModel {
    const m = new TextEditorModel(json ? convertFromRaw(json.content) : undefined);
    m.styleMap = json?.styles || {};
    return m;
  }

  private renderEnt(data: EntData, props: EntProps): React.ReactChild {
    return (
      <div
        data-offset-key={props.offsetKey}
        className={cn('text-editor-ent', props.entityKey == this.selEnt && 'text-editor-focus-ent', data.className)}
        // style={data.style}
      >
        {props.children}
      </div>
    );
  }

  getStyleMap() {
    return this.styleMap;
  }

  getState() {
    return this.state;
  }

  getCurrStyle() {
    return this.currStyle;
  }

  getStateCopy() {
    return EditorState.createWithContent(this.state.getCurrentContent(), this.decorator);
  }

  getJSON(): TextEditorJSON {
    return {
      content: convertToRaw(this.state.getCurrentContent()),
      styles: clone(this.styleMap)
    };
  }

  setState(state: EditorState) {
    if (!state.getSelection().getHasFocus()) {
      return;
    }

    this.state = state;
    this.updateSelEnt();
    this.fixStyleOverride();
    this.updateCurrStyles();

    const blockKey = this.state.getSelection().getStartKey();
    if (blockKey != this.selBlock) {
      this.selBlock = blockKey;
      this.key++;
      this.delayedNotify();
    }
  }

  insertEnt<T>(type: string, data: EntData<T>) {
    data = { ...data };
    let content = this.state.getCurrentContent().createEntity(type, 'IMMUTABLE', data);
    const entKey = content.getLastCreatedEntityKey();

    const sel = this.state.getSelection();
    content = Modifier.insertText(content, sel, data.label, undefined, entKey);
    this.state = EditorState.push(this.state, content, 'insert-fragment');
    this.moveCursorToEnt('end', entKey);
    this.updateMacro();
  }

  updateEnt<T>(macroKey: string | undefined, newData: Partial<EntData<T>>) {
    let content = this.state.getCurrentContent();

    const ent = content.getEntity(macroKey);
    if (!ent)
      return;

    const blockKey = this.findBlockForEnt(macroKey);
    if (!blockKey)
      return;

    const entData: EntData<T> = ent.getData();
    if (!entData)
      return;

    const entType = ent.getType();
    newData = {
      ...entData,
      ...newData,
      data: {
        ...entData.data,
        ...newData.data
      }
    };
    content = content.createEntity(entType, 'IMMUTABLE', newData);
    const lastEntKey = content.getLastCreatedEntityKey();

    const entRange = this.getEntRange(macroKey, blockKey);
    const block = content.getBlockForKey(blockKey);
    
    const sel = makeBlockSelection(blockKey, entRange);

    content = Modifier.replaceText(content, sel, newData.label, block.getInlineStyleAt(entRange[0]), lastEntKey);
    this.state = EditorState.push(this.state, content, 'insert-fragment');

    this.updateMacro();
  }

  getSelEntKey() {
    return this.selEnt;
  }

  getKey() {  
    return this.key;
  }

  clearStyles() {
    const origSel = this.state.getSelection();
    if (origSel.isCollapsed() && !this.selEnt)
      return;

    let content = this.state.getCurrentContent();

    const sel = this.extendSel(origSel);
    const styleIdArr = [...Object.keys(this.styleMap), 'BOLD', 'ITALIC', 'UNDERLINE'];
    styleIdArr.forEach(key => {
      content = Modifier.removeInlineStyle(content, sel, key);
    });

    this.state = EditorState.push(this.state, content, 'change-inline-style');
    this.state = EditorState.forceSelection(this.state, origSel);

    this.updateCurrStyles();
    this.delayedNotify();
  }

  toggleBold() {
    this.setInlineStyle('BOLD', true);
  }

  toggleItalic() {
    this.setInlineStyle('ITALIC', true);
  }

  toggleUnderline() {
    this.setInlineStyle('UNDERLINE', true);
  }

  setStyle<TKey extends CSSKeys, TVal extends React.CSSProperties[TKey]>(cssKey: TKey, cssValue: TVal) {
    const key = cssKeyMap[cssKey];
    if (!key)
      throw 'Unsupported CSS property';

    const styleId = `${key}-${cssValue}`;
    this.styleMap[styleId] = { [cssKey]: cssValue };
    this.setInlineStyle(styleId, false);
  }

  private setInlineStyle(styleId: string, toggle?: boolean) {
    let state = this.state;
    let content = state.getCurrentContent();

    const origSel = state.getSelection();
    if (origSel.isCollapsed() && !this.selEnt) {
      const currStyles = new Set(this.state.getCurrentInlineStyle().toArray());
      if (toggle && currStyles.has(styleId)) {
        currStyles.delete(styleId);
      } else {
        Object.keys(this.styleMap)
        .forEach(key => {
          if (isStyleAttrSame(key, styleId))
            currStyles.delete(key);
        });
        currStyles.add(styleId);
      }

      this.state = EditorState.forceSelection(this.state, makeSelectionFrom(origSel));
      this.state = EditorState.setInlineStyleOverride(this.state, OrderedSet.of(...Array.from(currStyles.values())));

      this.updateCurrStyles();
      this.delayedNotify();
      return;
    }

    const sel = this.extendSel(origSel);
    if (toggle) {
      if (this.findStyles(origSel.isCollapsed() ? sel : origSel).has(styleId)) {
        content = Modifier.removeInlineStyle(content, sel, styleId);
      } else {
        content = Modifier.applyInlineStyle(content, sel, styleId);
      }
    } else {
      Object.keys(this.styleMap)
      .forEach(key => {
        if (isStyleAttrSame(styleId, key))
          content = Modifier.removeInlineStyle(content, sel, key);
      });
      content = Modifier.applyInlineStyle(content, sel, styleId);
    }

    state = EditorState.push(state, content, 'change-inline-style');
    state = EditorState.forceSelection(state, origSel);

    this.state = state;

    this.updateCurrStyles();
    this.delayedNotify();
  }

  getSelEntKeys(sel: SelectionState, types?: Array<string>): Array<string> {
    const typesArr = types || [];
    const filter = (r1: Range, r2: Range) => {
      return r1.to > r2.from && r2.to > r1.from;
    };

    const entKeys = Array<string>();
    const cc = this.state.getCurrentContent();
    const blocks = cc.getBlocksAsArray();
    const from = blocks.findIndex(b => b.getKey() == sel.getStartKey());
    const to = blocks.findIndex(b => b.getKey() == sel.getEndKey());
    for (let n = from; n <= to; n++) {
      const block = blocks[n];
      const selFrom = block.getKey() == sel.getStartKey() ? sel.getStartOffset() : 0;
      const selTo = block.getKey() == sel.getEndKey() ? sel.getEndOffset() : block.getLength() - 1;

      block.findEntityRanges(value => {
        const entKey = value.getEntity();
        if (!entKey)
          return false;

        const data = cc.getEntity(entKey);
        return data && (typesArr.length == 0 || typesArr.indexOf(data.getType()) != -1);
      }, (from, to) => {
        if (!filter({ from, to }, { from: selFrom, to: selTo }))
          return;

        const entKey = block.getEntityAt(from);
        if (!entKey)
          return;

        entKeys.push(entKey);
      });
    }
    return entKeys;
  }

  private updateSelEnt() {
    const selEnt = this.findSelEntKey();
    if (this.selEnt != selEnt) {
      this.selEnt = selEnt;
      console.log(selEnt);
      this.updateMacro();
    } else {
      this.delayedNotify();
    }
  }

  private updateCurrStyles() {
    const styleOverride = this.state.getInlineStyleOverride();
    const currStyle = this.state.getCurrentInlineStyle();
    const ss = new Set((styleOverride || currStyle).toArray());

    const ff = Array.from(ss).map(s => this.styleMap[s]).find(p => {
      return p?.fontFamily != null;
    });
    this.currStyle.fontFamily = ff ? ff.fontFamily : 'Tahoma';

    const color = Array.from(ss).map(s => this.styleMap[s]).find(p => {
      return p?.color != null;
    });
    this.currStyle.textColor = color ? color.color : '#000000';

    const bg = Array.from(ss).map(s => this.styleMap[s]).find(p => {
      return p?.backgroundColor != null;
    });
    this.currStyle.bgColor = bg ? bg.backgroundColor : undefined;

    const size = Array.from(ss).map(s => this.styleMap[s]).find(p => {
      return p?.fontSize != null;
    });
    this.currStyle.fontSize = size ? parseFloat(`${size.fontSize}`) : 14;

    this.currStyle.bold = ss.has('BOLD');
    this.currStyle.italic = ss.has('ITALIC');
    this.currStyle.underline = ss.has('UNDERLINE');
  }

  private findBlockForEnt(entKey: string) {
    const blockArr = this.state.getCurrentContent().getBlocksAsArray();
    let blockKey: string | undefined;
    blockArr.some(block => {
      block.findEntityRanges(metadata => {
        if (metadata.getEntity() != entKey)
          return false;

        blockKey = block.getKey();
        return true;
      }, () => {});

      return blockKey != null;
    });

    return blockKey;
  }

  private findStyles(sel: SelectionState): Set<string> {
    const styles = new Set<string>();
    const content = this.state.getCurrentContent();
    let block = content.getBlockForKey(sel.getStartKey());
    while (block) {
      let range = [sel.getStartOffset(), sel.getEndOffset() - 1];
      if (block.getKey() != sel.getStartKey())
        range[0] = 0;
      if (block.getKey() != sel.getEndKey())
        range[1] = block.getLength() - 1;

      for (let n = range[0]; n <= range[1]; n++) {
        block.getInlineStyleAt(n).toArray().forEach(s => styles.add(s));
      }

      if (block.getKey() == sel.getEndKey())
        break;
      block = content.getBlockAfter(block.getKey());
    }

    return styles;
  }

  private findSelEntKey(offset = 0): string | undefined {
    const block = this.getSelBlock();
    if (!block)
      return undefined;

    offset = Math.max(0, this.state.getSelection().getStartOffset() + offset);
    const entKey = block.getEntityAt(offset);
    if (!entKey || offset == 0 || block.getEntityAt(offset - 1) != entKey)
      return undefined;

    return entKey;
  }

  private getSelBlock(): ContentBlock | undefined {
    const sel = this.state.getSelection();
    const cc = this.state.getCurrentContent();
    return cc.getBlockForKey(sel.getStartKey());
  }

  private getEntRange(entKey: string, blockKey: string): Array<number> {
    const cc = this.state.getCurrentContent();
    const block = cc.getBlockForKey(blockKey);

    let range = Array<number>();
    block.findEntityRanges(metadata => {
      return metadata.getEntity() == entKey;
    }, (start, end) => {
      range = [start, end];
    });

    return range;
  }

  private getEntity(key?: string) {
    if (!key)
      return undefined;

    const entity = this.state.getCurrentContent().getEntity(key);
    if (!entity)
      return undefined;

    return entity;
  }

  private moveCursorToEnt(dir: 'start' | 'end', entKey: string): boolean {
    const ent = this.getEntity(entKey);
    const block = this.getSelBlock();
    if (!ent || !block)
      return false;

    const range = this.getEntRange(entKey, block.getKey());
    const sel = this.state.getSelection();
    if (dir == 'start' && sel.getStartOffset() == range[0])
      return false;

    const offset = dir == 'end' ? range[1] : range[0];
    const newsel = makeBlockSelection(block.getKey(), [offset, offset]);

    this.state = EditorState.forceSelection(this.state, newsel);
    this.updateSelEnt();
    return true;
  }

  onLeftArrow = (e: React.KeyboardEvent<{}>) => {
    const ent = this.findSelEntKey(-1);
    if (!ent)
      return;

    this.moveCursorToEnt('start', ent);
    this.updateCurrStyles();
    e.stopPropagation();
    e.preventDefault();
  };

  onRightArrow = (e: React.KeyboardEvent<{}>) => {
    const ent = this.findSelEntKey(1);
    if (!ent)
      return;

    this.moveCursorToEnt('end', ent);
    this.fixStyleOverride();
    this.updateCurrStyles();
    e.stopPropagation();
    e.preventDefault();
  };

  private fixStyleOverride() {
    const sel = this.state.getSelection();
    if (!this.selEnt && sel.isCollapsed() && this.findSelEntKey(-1))
      this.state = EditorState.setInlineStyleOverride(this.state, OrderedSet.of());
  }

  private updateMacro(sel?: SelectionState) {
    this.state = EditorState.forceSelection(this.state, sel || this.state.getSelection());
    this.delayedNotify();
  }

  private extendSel(sel: SelectionState): SelectionState {
    let upd = 0;
    let range = [sel.getStartOffset(), sel.getEndOffset()];

    const content = this.state.getCurrentContent();
    let bkey = sel.getStartKey();
    let block = content.getBlockForKey(bkey);
    let ofs = sel.getStartOffset();
    let ent = block.getEntityAt(ofs);
    if (ent) {
      const entRange = this.getEntRange(ent, bkey);
      range[0] = Math.min(entRange[0], range[0]);
      upd++;
    }

    bkey = sel.getEndKey();
    block = content.getBlockForKey(bkey);
    ofs = sel.getEndOffset();
    ent = block.getEntityAt(ofs);
    if (ent) {
      const entRange = this.getEntRange(ent, bkey);
      range[1] = Math.max(entRange[1], range[1]);
      upd++;
    }

    if (!upd)
      return sel;

    return makeSelectionFrom(sel, { anchorOffset: range[0], focusOffset: range[1] });
  }
}
