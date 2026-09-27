import React from 'react';
import {act, create} from 'react-test-renderer';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import CaptainLogin from './CaptainLogin';

let view;
beforeEach(() => {
  const values = new Map();
  vi.stubGlobal('sessionStorage', {getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)});
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {act(()=>view?.unmount()); vi.unstubAllGlobals();});
it('does not mount the dashboard or request data before sign-in and offers no signup', () => {
  const mounted = vi.fn();
  function Dashboard() {mounted(); return <div>Private dashboard</div>;}
  act(()=>{view=create(<CaptainLogin><Dashboard /></CaptainLogin>);});
  expect(mounted).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  expect(JSON.stringify(view.toJSON())).not.toMatch(/sign up|signup/i);
});
it('only reveals the dashboard after a successful login and hides it on expiry', async () => {
  fetch.mockResolvedValue({ok:true,json:async()=>({token:'test-session',expires_at:Date.now()/1000+3600})});
  act(()=>{view=create(<CaptainLogin><div data-testid="private" /></CaptainLogin>);});
  await act(async()=>{await view.root.findByType('form').props.onSubmit({preventDefault(){}});});
  expect(view.root.findAllByProps({'data-testid':'private'})).toHaveLength(1);
  act(()=>window.dispatchEvent(new Event('captain-session-ended')));
  expect(view.root.findAllByProps({'data-testid':'private'})).toHaveLength(0);
});
it('keeps the dashboard hidden when credentials are rejected', async () => {
  fetch.mockResolvedValue({ok:false,json:async()=>({detail:'Incorrect captain ID or password.'})});
  act(()=>{view=create(<CaptainLogin><div data-testid="private" /></CaptainLogin>);});
  await act(async()=>{await view.root.findByType('form').props.onSubmit({preventDefault(){}});});
  expect(view.root.findAllByProps({'data-testid':'private'})).toHaveLength(0);
  expect(view.root.findByProps({role:'alert'}).children.join('')).toContain('Incorrect');
});
