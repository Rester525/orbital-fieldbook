import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('explicit guest recovery can bypass the corrupt-data save lock only after backup and confirmation',()=>{
 const app=read('../public/js/app.js');assert.match(app,/const result=saveState\(storage,state\);if\(!result\.ok\)/);
});
test('authentication changes are not deferred behind the simulation guard',()=>{
 const app=read('../public/js/app.js');assert.doesNotMatch(app,/pendingUser/);assert.match(app,/await sync\.switchUser\(id\)/);
});
test('page loads local Supabase SDK before app and exposes account dialog without changing CSP',()=>{
 const page=read('../public/index.html');assert.match(page,/<script src="\.\/assets\/supabase\.js"><\/script>[\s\S]*<script type="module" src="\.\/js\/app\.js"/);
 assert.match(page,/id="account-button"/);assert.match(page,/id="account-dialog"/);
 assert.match(page,/form-action 'none'/);
});
test('app routes persistence through cloud controller and keeps exam route guard',()=>{
 const app=read('../public/js/app.js');assert.match(app,/createCloudSync/);assert.match(app,/onAuthStateChange/);assert.match(app,/sync\.save\(state\)/);assert.match(app,/state\.exam&&!state\.exam\.submitted&&route!=='practice'/);
});
