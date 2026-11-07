'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('actual AppSettings form sends only approved fields; candidate custom choice and manual choices survive',async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../app/components/pages/app/AppSettings.jsx'),'utf8');
 const submit=source.slice(source.indexOf('    _onSubmit ='),source.indexOf('    _onClose =')).replace('_onSubmit =','submit =');
 const initial=source.slice(source.indexOf('    makeInitialValues()'),source.indexOf('    constructor(props)'));
 for(const endpoint of ['ws://127.0.0.1:8090','https://chosen.example/rpc','wss://manual.example/ws']) {
  let sent;const config={ws_connection_client:'wss://old.example',ws_connection_app:[{address:'wss://old.example'}],images:{use_img_proxy:true,img_proxy_prefix:'https://img.example/'},auth_service:{host:'https://auth.example'},notify_service:{host:'https://notify.example',host_ws:'wss://notify.example'},elastic_search:{url:'https://search.example'},main_app:'blogs'};
  const context={process:{env:{}},$STM_Config:config,window:{appSettings:{candidate:()=>endpoint,save:value=>{sent=value;return Promise.resolve();}}}};
  vm.runInNewContext('class Form {'+submit+initial+'}; globalThis.form=new Form()',context);
  context.form.makeInitialValues();assert.equal(context.form.initialValues.ws_connection_client,'custom');assert.equal(context.form.initialValues.custom_address,endpoint);
  await context.form.submit(context.form.initialValues);
  assert.equal(sent.ws_connection_client,endpoint);assert.equal(Object.keys(sent).length,8);assert.equal(sent.images,undefined);
 }
});
test('actual MainApp startup configures current client with reloaded selected endpoint, not merely settings UI',async()=>{
 let source=fs.readFileSync(path.join(__dirname,'../app/MainApp.js'),'utf8').replace(/^import .*\r?\n/gm,'').replace("require('app/cookieHelper')",'');
 source=source.slice(0,source.indexOf('initState().then('));
 const endpoint='https://chosen.example/rpc',set=[];
 const context={process:{env:{}},window:{appSettings:{load:()=>({ws_connection_client:endpoint})},location:{pathname:'/',hash:''},appSplash:{contentLoaded(){}}},golos:{importNativeLib:async()=>{},config:{set:(...v)=>set.push(v)}},getState:async()=>{assert.equal(set[0][1],endpoint);return {ok:true};},api:{},Math:{random:()=>0},setTimeout:()=>1,clearTimeout(){},console};
 vm.runInNewContext(source+'\nglobalThis.run=initState;',context);context.$STM_Config=context.window.$STM_Config;
 assert.equal((await context.run()).ok,true);assert.deepEqual(set,[['websocket',endpoint]]);
});
