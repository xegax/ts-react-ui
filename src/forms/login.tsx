import * as React from 'react';
import { Dialog, FormGroup, Button, Intent, Classes as cs } from '@blueprintjs/core';
import { cn } from '../common/common';
import { showModal } from '../show-modal';
import { KeyCode } from '../common/keycode';

export interface LoginResult {
  login: string;
  pass: string;
}

export interface Props {
  onLogin(args: LoginResult): Promise<void>;
}

interface State {
  error?: string;
  req?: Promise<void>;
}

export class LoginForm extends React.Component<Props, State> {
  private login = React.createRef<HTMLInputElement>();
  private pass = React.createRef<HTMLInputElement>();
  state: State = {};

  private onLogin = () => {
    if (!this.props.onLogin || this.state.req)
      return;

    const req = this.props.onLogin({
      login: this.login.current.value,
      pass: this.pass.current.value
    }).catch((error: string) => {
      this.setState({ error, req: null })
    });

    this.setState({ req });
  }

  private showError(): JSX.Element {
    if (!this.state.error)
      return null;

    return (
      <div className={cn(cs.CALLOUT, cs.INTENT_DANGER)}>
        <h4>Login failed</h4>
        {this.state.error}
      </div>
    );
  }

  private onKeyDown = (e: React.KeyboardEvent) => {
    if (e.keyCode == KeyCode.ENTER)
      this.onLogin();
  };

  render() {
    const disabled = this.state.req != null;
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
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
              text={
                <div className='horz-panel-1'>
                  {disabled ? <i className='fa fa-spinner fa-spin' /> : null}
                  <span>Login</span>
                </div>
              }
              intent={Intent.PRIMARY}
              onClick={this.onLogin}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}

export function showLogin<T = any>(args: { login(args: LoginResult): Promise<T> }): Promise<T> {
  return new Promise(resolve => {
    const dlg = showModal(
      <LoginForm
        onLogin={p => {
          return (
            args.login(p)
            .then(res => {
              dlg.close();
              resolve(res);
            })
          );
        }}
      />
    );
  });
}
