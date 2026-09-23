import type { Metadata } from 'next';
import Link from 'next/link';
import LobbyNav from '@/components/lobby/LobbyNav';

export const metadata: Metadata = {
  title: '遊戲規則 | 開源星手村',
  description: '了解開源星手村線上版的回合流程、行動與計分方式。',
};

const actions = [
  {
    icon: '🚀',
    title: '發起專案',
    cost: '2 AP',
    description: '從手牌選一張專案卡，搭配符合需求的人力卡放到桌面，立即獲得 2 點影響力。',
  },
  {
    icon: '🤝',
    title: '招募人才',
    cost: '1 AP',
    description: '選擇桌面上的人力卡，加入一個需要這種人才、且你尚未加入該職務的專案。',
  },
  {
    icon: '✨',
    title: '貢獻自己的專案',
    cost: '1 AP',
    description: '在你發起的專案中，分配最多 4 點貢獻。只能貢獻已有你的人才標記的職務。',
  },
  {
    icon: '🌱',
    title: '貢獻參與的專案',
    cost: '1 AP',
    description: '在其他玩家發起、且你已參與的專案中，分配最多 5 點貢獻。',
  },
  {
    icon: '🔄',
    title: '人才探索',
    cost: '1 AP',
    description: '更換桌面上至少 1 張人力卡並補滿，立即獲得 1 點影響力。',
  },
] as const;

export default function RulesPage() {
  return (
    <main className="rules-page">
      <LobbyNav />
      <div className="rules-wrap">
        <section className="rules-hero" aria-labelledby="rules-title">
          <span className="sticker">🎲 線上版 · 簡化規則</span>
          <h1 id="rules-title" className="h-display">一起玩開源星手村</h1>
          <p>
            你和其他玩家一起發起專案、招募人才並完成貢獻。遊戲結束時，
            <strong>影響力最高</strong>的玩家獲勝。
          </p>
          <div className="rules-hero-actions">
            <Link href="/lobby" className="btn-sticker" data-analytics-id="rules_start_game">
              開始遊戲 · Play online
            </Link>
            <a href="#turns" className="btn-sticker ghost">閱讀玩法 ↓</a>
          </div>
          <div className="rules-facts" aria-label="遊戲概要">
            <span>👥 3–6 位玩家</span>
            <span>⏱ 約 60 分鐘</span>
            <span>⚡ 每回合 4 個行動點</span>
          </div>
        </section>

        <nav className="rules-toc" aria-label="規則目錄">
          <a href="#start">開始遊戲</a>
          <a href="#turns">回合流程</a>
          <a href="#actions">可選行動</a>
          <a href="#scoring">如何計分</a>
        </nav>

        <section id="start" className="rules-section">
          <div className="rules-section-heading"><span className="rules-number">01</span><h2>開始遊戲</h2></div>
          <div className="rules-grid">
            <article className="rules-card">
              <h3>建立或加入房間</h3>
              <p>到遊戲大廳建立房間，邀請朋友加入。3–6 人就座後即可開始。</p>
            </article>
            <article className="rules-card">
              <h3>認識桌面</h3>
              <p>每人起始有 2 張專案卡、12 枚人才標記與 4 個行動點。桌面提供 8 張可選的人力卡。</p>
            </article>
          </div>
        </section>

        <section id="turns" className="rules-section">
          <div className="rules-section-heading"><span className="rules-number">02</span><h2>每輪怎麼進行</h2></div>
          <ol className="rules-steps">
            <li><strong>事件翻開</strong><span>每輪開始時會翻開一張事件卡；先讀效果，再決定這輪要做什麼。</span></li>
            <li><strong>輪流行動</strong><span>玩家依序花費行動點。同一種行動每回合只能做一次；點選行動後，依畫面提示選卡並確認。</span></li>
            <li><strong>結束回合</strong><span>用完行動點，或按「結束回合」提前結束。完成的專案會結算，行動點和手牌會補回。</span></li>
            <li><strong>進入下一輪</strong><span>所有玩家都行動後，起始玩家換到下一位，並翻開新事件。</span></li>
          </ol>
          <p className="rules-note">⏰ 每回合有一枚加班 token：可再做一次本回合已做過的 1 AP 行動，仍需支付該行動的 1 AP。</p>
        </section>

        <section id="actions" className="rules-section">
          <div className="rules-section-heading"><span className="rules-number">03</span><h2>選擇你的行動</h2></div>
          <div className="rules-grid">
            {actions.map((action) => (
              <article className="rules-card" key={action.title}>
                <div className="rules-action-head"><span aria-hidden>{action.icon}</span><h3>{action.title}</h3><span className="rules-cost">{action.cost}</span></div>
                <p>{action.description}</p>
              </article>
            ))}
          </div>
          <p className="rules-note">專案卡會列出所需職務與貢獻點數。貢獻不可超過專案的需求；事件卡可能暫時改變行動效果。</p>
        </section>

        <section id="scoring" className="rules-section">
          <div className="rules-section-heading"><span className="rules-number">04</span><h2>完成專案與計分</h2></div>
          <div className="rules-grid">
            <article className="rules-card">
              <h3>專案完成時</h3>
              <p>每位參與者每貢獻 1 點，獲得 1 點影響力。發起者再得 2 點；完成最後一筆貢獻的玩家再得 2 點。兩項獎勵可以由同一人取得。</p>
            </article>
            <article className="rules-card">
              <h3>遊戲結束時</h3>
              <p>翻到最後的「是芥末日」事件後，所有玩家仍會完成這一輪，未使用的每個行動點可得 1 點影響力。未完成專案中，每位玩家累計每 2 點貢獻再得 1 點影響力；影響力最高者獲勝。</p>
            </article>
          </div>
        </section>

        <footer className="rules-footer">
          <p>想查看完整桌遊規則、進階模式與常見問題？</p>
          <a href="https://drive.google.com/file/d/1gBGKhavLdDQ-J1elxQNN6E7Sdz0ZBTeO/view?usp=drive_link" target="_blank" rel="noreferrer" data-analytics-id="full_rulebook">
            閱讀完整規則書 ↗
          </a>
        </footer>
      </div>
    </main>
  );
}
