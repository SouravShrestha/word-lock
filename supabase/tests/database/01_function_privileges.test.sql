begin;
select plan(4);

-- wl_claim_player merges any guest row into any account: only the server may call it.
select ok(not has_function_privilege('anon', 'public.wl_claim_player(uuid, text)', 'execute'), 'anon cannot claim players');
select ok(not has_function_privilege('authenticated', 'public.wl_claim_player(uuid, text)', 'execute'), 'authenticated cannot claim players');

-- The Realtime read policies depend on this helper; anon must not reach it.
select ok(not has_function_privilege('anon', 'public.wl_caller_player_ids()', 'execute'), 'anon cannot resolve caller ids');
select ok(has_function_privilege('authenticated', 'public.wl_caller_player_ids()', 'execute'), 'authenticated can resolve caller ids');

select * from finish();
rollback;
