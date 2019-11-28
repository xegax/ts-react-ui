import * as React from 'react';
import { Dialog, FormGroup, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { cn } from '../common/common';
import { showModal } from '../show-modal';
import { KeyCode } from '../common/keycode';

export interface LoginResult {
  login: string;
  pass: string;
}

export interface LoginArgs extends LoginResult {
  error?: string;
}

export interface Props {
  error?: string;
  onLogin(args: LoginArgs): void;
}

export class LoginForm extends React.Component<Props> {
  private login = React.createRef<HTMLInputElement>();
  private pass = React.createRef<HTMLInputElement>();

  private onLogin = () => {
    this.props.onLogin && this.props.onLogin({
      login: this.login.current.value,
      pass: this.pass.current.value
    });
  }

  private showError(): JSX.Element {
    if (!this.props.error)
      return null;

    return (
      <div className={cn(cs.CALLOUT, cs.INTENT_DANGER)}>
        <h4>Login failed</h4>
        {this.props.error}
      </div>
    );
  }

  private onKeyDown = (e: React.KeyboardEvent) => {
    if (e.keyCode == KeyCode.ENTER)
      this.onLogin();
  };

  render() {
    return (
      <Dialog
        isOpen
        isCloseButtonShown={false}
        title='Authorization'
      >
        <div className={cs.DIALOG_BODY}>
          {this.showError()}
          <FormGroup label='Login:' labelFor='login'>
            <input
              ref={this.login}
              autoFocus
              id='login'
              placeholder='Login'
              className={cn(cs.INPUT, cs.LARGE, cs.FILL)}
              onKeyDown={this.onKeyDown}
            />
          </FormGroup>
          <FormGroup label='Password:' labelFor='passwd'>
            <input
              ref={this.pass}
              id='passwd'
              placeholder='Password'
              className={cn(cs.INPUT, cs.LARGE, cs.FILL)}
            />
          </FormGroup>
        </div>
        <div className={cs.DIALOG_FOOTER}>
          <div className={cs.DIALOG_FOOTER_ACTIONS}>
            <Button
              text='Login'
              intent={Intent.PRIMARY}
              onClick={this.onLogin}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}

export function showLogin(error?: string): Promise<LoginResult> {
  return new Promise(resolve => {
    const dlg = showModal(
      <LoginForm
        onLogin={args => {
          dlg.close();
          resolve(args);
        }}
        error={error}
      />
    );
  });
}
