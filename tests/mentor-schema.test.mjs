import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const migration=new URL('../supabase/migrations/20261109140917_mentor_activation.sql',import.meta.url);
test('mentor activation schema fails closed and does not broaden private fieldbook access',()=>{
  assert.ok(fs.existsSync(migration),'mentor activation migration exists');
  const sql=fs.readFileSync(migration,'utf8');
  for(const name of ['mentor_accounts','mentor_activation_secrets','mentor_activation_attempts']){
    assert.match(sql,new RegExp(`alter table public\\.${name} enable row level security`,'i'));
  }
  assert.match(sql,/email_confirmed_at is not null/);
  assert.match(sql,/is_anonymous/);
  assert.match(sql,/for update/i);
  assert.match(sql,/interval '15 minutes'/);
  assert.match(sql,/failed_attempts >= 5/);
  assert.match(sql,/failed_attempts >= 30/);
  assert.match(sql,/extensions\.crypt\(p_code, secret\.code_hash\)/);
  assert.match(sql,/security definer set search_path = ''/i);
  assert.match(sql,/revoke all on function public\.redeem_mentor_code\(text\) from public, anon/);
  assert.match(sql,/revoked_at/);
  assert.ok(!sql.includes('user_fieldbooks'),'owner-only fieldbook permissions untouched');
  assert.ok(!/insert into public\.mentor_activation_secrets/i.test(sql),'no production secret provisioned by tracked migration');
});
