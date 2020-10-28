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

export interface PromptArgs {
  title?: string;
  value?: string;
  prompt?: string;
  placeholder?: string;
  type?: 'password';
}

interface Props extends PromptArgs {
  onOk(value: string);
  onCancel();
}

export class Prompt extends React.Component<Props, {}> {
  private input: React.RefObject<HTMLInputElement> = React.createRef();

  private onOk = () => {
    this.props.onOk(this.input.current.value);
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
    return (
      <Dialog isOpen isCloseButtonShown={false} title={this.props.title}>
        <div className={cs.DIALOG_BODY}>
          <FormGroup label={this.props.prompt} labelFor='prompt'>
            <input
              autoFocus
              ref={this.input}
              id='prompt'
              type={this.props.type}
              placeholder={this.props.placeholder}
              className={cn(cs.INPUT, cs.LARGE, cs.FILL)}
              defaultValue={this.props.value}
              onKeyDown={this.keyDown}
            />
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

export function prompt(args: PromptArgs): Promise<string> {
  return new Promise((resolve, reject) => {
    const onOk = (text: string) => {
      dlg.close();
      resolve(text);
    };

    const onCancel = () => {
      dlg.close();
      reject();
    };

    const dlg = showModal(<Prompt {...args} onOk={onOk} onCancel={onCancel}/>);
  });
}

export interface SelectArgs extends PromptArgs {
  items: Array<string>;
}

interface SelectProps extends Props {
  items: Array<string>;
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
              className={cn(cs.SELECT, cs.LARGE, cs.FILL)}
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
