-- Force Start a Tournament (Immediate Play)
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
    current_blind_level
)
VALUES (
    'force-start-' || floor(random() * 10000),
    '⚡ Turbo Sit & Go (Instant)', 
    'sit_and_go', 
    'running', 
    100, 
    0, 
    0, 
    6, 
    now(), 
    1
);
