import pip
import os
packages = ['pandas', 'datetime', 'json', 'time', 'riotwatcher']

for pkg in packages:
    try:
        __import__(pkg)
    except:
        pip.main(['install', pkg])

import pandas as pd
from datetime import date, datetime, timedelta
import json
import time
from riotwatcher import LolWatcher, ApiError

api_key = 'RGAPI-53949b86-ecf1-4867-9e1b-5f4186324a73'
# api_key = 'RGAPI-690ffe13-7230-4d4c-a177-e41b2d83d068'
lol_watcher = LolWatcher(api_key)

"""
Consts
"""
platforms = ["br1","eun1","euw1","jp1","kr","la1","la2","na1",
             "oc1","tr1","ru","ph2","sg2","th2","tw2","vn2"]
tiers = ['challenger', 'grandmaster', 'master']
position_map = {
    ('MID', 'SOLO'): 'middle',
    ('TOP', 'SOLO'): 'top',
    ('JUNGLE', None): 'jungle',
    ('BOT', 'DUO_CARRY'): 'bottom',
    ('BOT', 'DUO_SUPPORT'): 'utility'
}
queue_id = 420 # Ranked_solo_5x5

schema = {
    'summoners': ['platform', 'tier', 'summonerId', 'summonerName'],
    'matches_player': [
        'matchId',
        'puuid', 'lane', 'role', 'kills', 'deaths', 'assists', 'win', 
        'championName', 'championId', 'firstBloodKill', 'firstTowerKill', 
        'item0', 'totalDamageDealt', 'totalDamageDealtToChampions',
        'totalMinionsKilled', 'visionScore', 'goldEarned'
    ],
    'matches': [
        'matchId', 'gameStartTimestamp', 'gameEndTimestamp'
        'blueBans', 'blueBaronKills', 'blueChampKills', 'blueDragKills', 
        'blueInhibKills', 'blueHeraldKills', 'blueTowerKills', 'blueWin',
        'redBans', 'redBaronKills', 'redChampKills', 'redDragKills', 
        'redInhibKills', 'redHeraldKills', 'redTowerKills', 'redWin',
    ]
}

end_date = datetime(2023, 3, 12)
start_date = end_date - timedelta(weeks=1)
start_timestamp = int(start_date.timestamp())
end_timestamp = int(end_date.timestamp())

'''
Fetch users
'''
def get_summoners_list(region='na1', tier='challenger', queue='RANKED_SOLO_5x5'):
    sid_list, sname_list = [], []
    entries = None
    if tier == 'challenger':
        entries = lol_watcher.league.challenger_by_queue(region, queue)['entries']
    elif tier == 'master': 
        entries = lol_watcher.league.masters_by_queue(region, queue)['entries']
    elif tier == 'grandmaster':
        entries = lol_watcher.league.grandmaster_by_queue(region, queue)['entries']
    else:
        print('tier not supported')
        return
        
    for p in entries:
        sid_list.append(p['summonerId'])
        sname_list.append(p['summonerName'])
    return sid_list, sname_list

def make_summoners_csv():
    dfs = []
    for platform in platforms:
        for tier in tiers:
            sid_list, sname_list = get_summoners_list(region=platform, tier=tier)
            df = pd.DataFrame(
                columns=schema['summoners'],
                data={
                    'platform': [platform for i in range(len(sid_list))],
                    'tier': [tier for i in range(len(sid_list))],
                    'summonerId': sid_list,
                    'summonerName': sname_list
                }
            )
            dfs.append(df)
    summoners = pd.concat(dfs)
    summoners.to_csv('summoners.csv', index=False)
    

def get_tier_lst(summoners, tier, buffer_size=500, test=False):
    '''
    tier : ['challenger', 'master', 'grandmaster']
    '''
    group = summoners[summoners.tier == tier]
    print(f"Total {tier}s: {group.shape[0]}")
    
    id_by_platform = group.groupby('platform') \
        .apply(lambda x: iter(x.summonerId.tolist())).to_dict()
    
    buffer_id, buffer = 1, []
    done = False
    while not done:
        done = True
        for platform, it in id_by_platform.items():
            tmpId = next(it, None)
            if tmpId is None: continue
            else:
                done = False
                resp = None
                while resp is None:
                    try:
                        resp = lol_watcher.summoner.by_id(platform, tmpId)
                    except ApiError as err:
                        if err.response.status_code == 429:
                            print('Retry-after:', err.response.headers['Retry-After'])
                            time.sleep(err.response.headers['Retry-After'])
                        elif err.response.status_code == 404:
                            print('Acc not found:', tmpId)
                            break
                        else:
                            print(err.response._content)
                            print(err.response.reason) 
                            break
                if resp is not None:
                    buffer.append(resp)
        
        if len(buffer) >= buffer_size:
            print(f"Dumping Buffer: id: {buffer_id}, size: {len(buffer)}")
            with open(f'{tier}s_{buffer_id}.json', 'w') as f:
                f.write(json.dumps(buffer))
            buffer, buffer_id = [], buffer_id + 1
            
            if test: break
        

def test(tier):
    if os.path.exists('./summoners.csv'):
        print('summoners.csv exists')
    else:
        make_summoners_csv()
        print('Suc. generated summoners.csv')
        time.sleep(1)
    summoners = pd.read_csv('summoners.csv')
    get_tier_lst(summoners, tier)
    df = pd.read_json(f'{tier}s_1.json')
    print(df)

test('challenger')

'''
['_content', 'status_code', 'headers', 'url', 'history', 'encoding', 'reason', 'cookies', 'elapsed', 'request']
'''