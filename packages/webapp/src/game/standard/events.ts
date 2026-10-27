import type { EventCard } from '../card';
import type { GameState, ClientGameState } from '../store/store';

export const STANDARD_EVENTS: Omit<EventCard, 'id'>[] = [
  {name:'又老又窮啊', description:'本輪所有玩家皆不可成長星源樹。', function_name:'no_tree_growth', type:'standard'},
  {name:'GitHub 當機了', description:'本輪所有玩家皆不可執行發起人貢獻。', function_name:'no_owner_contribution', type:'standard'},
  {name:'猛漢肺炎來襲', description:'所有專案上的貢獻方塊後退 1 格，最低為 1。', function_name:'retreat_contributions', type:'standard'},
  {name:'鯊魚咬斷海底電纜', description:'場上已有 2 個以上專案時，本輪不可發起專案。', function_name:'limit_initiation', type:'standard'},
  {name:'抱歉了我的肝', description:'本輪每位玩家第一次執行招募後，可不花行動點再招募一次，仍須消耗人力卡與貢獻方塊。', function_name:'extra_recruit', type:'standard'},
  {name:'減薪休假啊', description:'本輪所有玩家皆不可加班。', function_name:'no_overtime', type:'standard'},
];
export function standardEvent(G: GameState | ClientGameState, name: string): boolean {
  return Boolean(G.standard && G.table.eventSlot?.function_name === name);
}
export function eventActionBlocked(G: GameState | ClientGameState, action: string): boolean {
  return (action === 'contributeOwnedProjects' && standardEvent(G, 'no_owner_contribution')) ||
    (action === 'createProject' && standardEvent(G, 'limit_initiation') && G.table.projectBoard.filter(s => s.card).length >= 2);
}
