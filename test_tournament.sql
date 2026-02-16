-- Manual Test Tournament
INSERT INTO public.tournaments (
    id,
    name,
    type,
    status,
    buy_in,
    prize_pool,
    players_count,
    max_players,
    scheduled_start_time,
    current_blind_level,
    created_at
) VALUES (
    'test_tourney_' || floor(random() * 1000),
    'Manual Test Game',
    'sitgo',
    'registering',
    100,
    0,
    0,
    6,
    NOW() + interval '10 minutes',
    1,
    NOW()
);
