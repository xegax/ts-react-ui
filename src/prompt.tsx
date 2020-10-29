import * as React from 'react';
import { showModal } from './show-modal';
import {
  Dialog,
  FormGroup,
  Button,
  Intent,
  Classes as cs,
  IconName
} from '@blueprintjs/core';
import { cn } from './common/common';

export { Intent };

type PromptRecord = Record<string, number | string>;
export interface PromptArgs<T> {
  title?: string;
  value?: T;
  prompt?: string;
  placeholder?: string;
  type?: 'password';
}

interface Props extends PromptArgs<PromptRecord> {
  onOk(res: PromptRecord): void;
  onCancel(): void;
}

interface State {
  values: PromptRecord;
}

export class Prompt extends React.Component<Props, State> {
  private inputRef: Record<string, React.RefObject<HTMLInputElement>> = {};

  constructor(props: Props) {
    super(props);

    this.state = {
      values: {...this.props.value}
    };

    Object.keys(this.props.value).forEach(key => {
      this.inputRef[key] = React.createRef();
    });
  }

  private onOk = () => {
    let res: PromptRecord = {};
    Object.keys(this.state.values)
    .forEach(key => {
      res[key] = this.inputRef[key].current.value;
    });
    this.props.onOk(res);
  };

  private onCancel = () => {
    this.props.onCancel();
  };

  private keyDown = (e: React.KeyboardEvent) => {
    if (e.key == 'Enter') {
      this.onOk();
    } else if (e.key == 'Escape') {
      this.onCancel();
    }
  };

  render() {
    const form = Object.keys(this.state.values).map((key, n) => {
      const value = this.state.values[key];
      const label = this.props.prompt;
      return (
        <FormGroup label={label != null ? label : key} labelFor={key}>
          <input
            autoFocus={n == 0}
            ref={this.inputRef[key]}
            id={key}
            className={cn(cs.INPUT, cs.FILL)}
            defaultValue={`${value ?? ''}`}
            onKeyDown={this.keyDown}
          />
        </FormGroup>
      );
    });

    return (
      <Dialog isOpen isCloseButtonShown={false} title={this.props.title}>
        <div className={cs.DIALOG_BODY}>
          {form}
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button text='OK' intent={Intent.PRIMARY} onClick={this.onOk}/>
            <Button text='Cancel' onClick={this.onCancel}/>
          </div>
        </div>
      </Dialog>
    );
  }
}

export function promptRecord<T extends PromptRecord>(args: PromptArgs<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const onOk = (res: PromptRecord) => {
      dlg.close();
      resolve(res as T);
    };

    const onCancel = () => {
      dlg.close();
      reject();
    };

    const dlg = showModal(<Prompt {...args} onOk={onOk} onCancel={onCancel}/>);
  });
}

export function prompt(args: PromptArgs<string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const onOk = (res: { str: string }) => {
      dlg.close();
      resolve(res.str);
    };

    const onCancel = () => {
      dlg.close();
      reject();
    };

    const props: PromptArgs<{ str: string }> = {
      prompt: '',
      ...args,
      value: { str: args.value }
    };

    const dlg = showModal(
      <Prompt
        {...props}
        onOk={onOk}
        onCancel={onCancel}
      />
    );
  });
}

export interface SelectArgs extends PromptArgs<string> {
  items: Array<string>;
}

interface SelectProps {
  title?: string;
  value?: string;
  prompt?: string;
  placeholder?: string;
  items: Array<string>;

  onOk(value: string): void;
  onCancel(): void;
}

export class Select extends React.Component<SelectProps, {}> {
  private input: React.RefObject<HTMLSelectElement> = React.createRef();

  onOk = () => {
    this.props.onOk(this.input.current.value);
  };

  onCancel = () => {
    this.props.onCancel();
  };

  render() {
    return (
      <Dialog isOpen isCloseButtonShown={false} title={this.props.title}>
        <div className={cs.DIALOG_BODY}>
          <FormGroup label={this.props.prompt} labelFor='prompt'>
            <select
              ref={this.input}
              id='prompt'
              placeholder={this.props.placeholder}
              className={cn(cs.SELECT, cs.FILL)}
            >
              {this.props.items.map((item, i) => {
                return <option key={i} value={item}>{item}</option>
              })}
            </select>
          </FormGroup>
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button text='OK' intent={Intent.PRIMARY} onClick={this.onOk}/>
            <Button text='Cancel' onClick={this.onCancel}/>
          </div>
        </div>
      </Dialog>
    );
  }
}

export function select(args: SelectArgs): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const onOk = (text: string) => {
      dlg.close();
      resolve(text);
    };

    const onCancel = () => {
      dlg.close();
      reject();
    };

    const dlg = showModal(<Select {...args} onOk={onOk} onCancel={onCancel}/>);
  });
}

export interface Action {
  text?: string;
  intent?: Intent;
  onAction(): void;
}

export interface ActionProps {
  icon?: IconName;
  intent?: Intent;
  title?: string;
  body: string | JSX.Element;
  actions?: Array<Action>;
}

export class ActionPrompt extends React.Component<ActionProps, {}> {
  onClick(action: Action) {
    action.onAction();
  }

  render() {
    return (
      <Dialog isOpen isCloseButtonShown={false} icon={this.props.icon} title={this.props.title}>
        <div className={cs.DIALOG_BODY}>
          {this.props.body}
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            {(this.props.actions || []).map(a => {
              return (
                <Button
                  text={a.text}
                  intent={a.intent || Intent.NONE}
                  onClick={() => {
                    this.onClick(a);
                  }}
                />
              );
            })}
          </div>
        </div>
      </Dialog>
    );
  }
}

export function action<T extends Action = Action>(props: ActionProps) {
  return new Promise<T>(resolve => {
    const actionProps = {...props};
    const onAction = (action: Action) => {
      dlg.close();
      resolve(action as T);
    };

    actionProps.actions = props.actions.map(a => {
      return {
        ...a,
        onAction: () => onAction(a)
      };
    });

    const dlg = showModal(<ActionPrompt {...actionProps}/>);
  });
}

export const OK: Action = {
  text: 'OK',
  intent: Intent.WARNING,
  onAction: () => {}
};

export const Cancel: Action = {
  text: 'Cancel',
  onAction: () => {}
};

export function confirm<T extends Action = Action>(props: ActionProps) {
  props = {...props};
  props.icon = props.icon;
  props.title = props.title || 'Confirm';
  props.intent = props.intent || Intent.WARNING;

  props.actions = props.actions || [ OK, Cancel ];
  return (
    action<T>(props)
    .then(action => {
      if (action == Cancel)
        return Promise.reject(new Error('cancel'));
      return Promise.resolve(action);
    })
  );
}
