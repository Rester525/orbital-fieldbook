import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('team roster RPC is owner-checked, bounded and summary-only',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261109201401_mentor_team_roster.sql',import.meta.url),'utf8');
 for(const pattern of [/public\.mentor_access_status\(\)/,/42501/,/security definer set search_path = ''/i,/p_limit > 100/,/p_offset < 0/,/last_sign_in_at is not null/,/not u.is_anonymous/,/u.deleted_at is null/,/email_confirmed_at is not null/,/jsonb_typeof/,/has_progress/,/completed_weeks/,/completed_steps/,/mcq_attempts/,/mcq_correct/,/grant execute.*authenticated/i,/revoke all.*public, anon/i])assert.match(sql,pattern);
 assert.doesNotMatch(sql,/create policy|grant select|raw_user_meta_data|encrypted_password|refresh_token|state\s*\)\s*as members/i);
});
