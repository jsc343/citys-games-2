import type { GameDef } from "@/lib/games/types";
import { lv, opt } from "@/lib/games/helpers";

export const GLADIATOR: GameDef = {
  id: "gladiator",
  category: "brawl",
  accent: "primary",
  title: { zh: "角鬥士之怒", en: "Wrath of the Gladiator" },
  subtitle: { zh: "肉搏格鬥", en: "Hand-to-Hand Combat" },
  blurb: {
    zh: "在古羅馬競技場，用連擊與閃避換取榮耀，也換取自由。",
    en: "In the Roman arena, trade combos and dodges for glory, and for freedom.",
  },
  levels: [
    lv(
      ["初入競技場", "Into the Arena"],
      [
        "沙地灼熱，觀眾席山呼海嘯。你第一次握緊短劍。",
        "The sand burns and the stands roar. You grip a short sword for the very first time.",
      ],
      ["新手角鬥士", "Rookie Gladiator"],
      ["群眾等著看你的表演。", "The crowd waits for a show."],
      [
        opt(
          ["華麗取勝，取悅群眾", "Win with flourish to please the crowd"],
          ["觀眾歡呼，但動作更冒險。事成可得 300 分。", "The crowd cheers but your moves are riskier. Win for 300 points."],
          0.1,
          -1,
          300,
        ),
        opt(
          ["乾淨俐落結束比賽", "End the bout cleanly"],
          ["穩定而有效，敵人略弱。", "Steady and efficient, the foe is slightly weaker."],
          -0.05,
          1,
        ),
      ],
    ),
    lv(
      ["網鬥士", "The Net-Fighter"],
      [
        "對手手持漁網與三叉戟，擅長遠距離纏鬥。",
        "Your rival carries a net and trident and loves to fight at range.",
      ],
      ["網鬥士", "Retiarius"],
      ["如何應對？", "How will you counter?"],
      [
        opt(
          ["貼身近戰，壓縮距離", "Close in and crowd him"],
          ["敵人較弱，但容易被纏住。", "Foes weaker, but you risk being tangled."],
          -0.1,
          -1,
        ),
        opt(
          ["保持距離，伺機反擊", "Hold your distance and counter"],
          ["更穩健，敵人較強。", "Steadier, but the opponent is stronger."],
          0.1,
          1,
        ),
      ],
    ),
    lv(
      ["色雷斯人", "The Thracian"],
      [
        "彎刀閃著寒光，色雷斯人以速度著稱。",
        "A curved blade glints coldly. The Thracian is famed for speed.",
      ],
      ["色雷斯鬥士", "Thraex"],
      ["有人在暗處向你示意。", "Someone gestures to you from the shadows."],
      [
        opt(
          ["收買對手，讓他放水", "Bribe him to hold back"],
          ["敵人大幅減弱；賄賂耗費 400 分。", "The opponent weakens a lot. The bribe costs 400 points."],
          -0.15,
          -2,
          -400,
        ),
        opt(
          ["公平決鬥", "Fight it out fairly"],
          ["敵人較強，但贏得尊敬。", "A stronger foe, but you earn respect."],
          0.1,
          2,
        ),
      ],
    ),
    lv(
      ["獅籠之前", "Before the Lions"],
      [
        "鬥獸籠就在身後，同伴們沉默地磨著武器。",
        "The beast cages loom behind you while your fellows silently hone their blades.",
      ],
      ["訓練場教官", "Training-Yard Master"],
      ["武器只有一份。", "There is only one set of weapons to go around."],
      [
        opt(
          ["搶下最好的武器", "Seize the best weapon"],
          ["戰力提升、敵人較弱；同伴心生怨恨。", "Stronger odds and weaker foes, but your fellows resent you."],
          -0.1,
          -1,
        ),
        opt(
          ["與同伴共享裝備", "Share the gear with your fellows"],
          ["敵人略強；事成可得武器寶物。", "A tougher fight. Win to receive a weapon item."],
          0.05,
          1,
          0,
          "weapon",
        ),
      ],
    ),
    lv(
      ["兄弟對決", "Brothers' Duel"],
      [
        "對面的鬥士摘下頭盔，是與你一同被擄來的兄弟。",
        "Across from you a gladiator removes his helm: a brother taken captive beside you.",
      ],
      ["昔日兄弟", "Your Old Brother"],
      ["觀眾要的是一場生死戰。", "The crowd demands a fight to the death."],
      [
        opt(
          ["全力擊倒，不留情面", "Strike with everything you have"],
          ["敵人較弱，但你將背負這份重量。事成可得 500 分。", "Foes weaker, but you will carry the weight. Win for 500 points."],
          -0.1,
          -1,
          500,
        ),
        opt(
          ["手下留情，只求制服", "Hold back, aim only to subdue"],
          ["敵人變強；事成可得機會寶物。", "The foe is stronger. Win to receive a chance item."],
          0.15,
          2,
          0,
          "chance",
        ),
      ],
    ),
    lv(
      ["元老院觀禮", "Before the Senate"],
      [
        "貴族們坐上了包廂，今天的比賽將決定你的聲望。",
        "Nobles fill the private boxes and today's bout will define your renown.",
      ],
      ["貴族私兵", "A Noble's Champion"],
      ["要不要為貴族表演？", "Will you perform for the nobles?"],
      [
        opt(
          ["向貴族獻藝取寵", "Perform for the nobles' favor"],
          ["聲望上升，但動作需配合表演。事成可得 400 分。", "Renown rises, but your moves must serve the show. Win for 400 points."],
          -0.05,
          -1,
          400,
        ),
        opt(
          ["不理會看台，專心作戰", "Ignore the boxes and focus"],
          ["專心作戰，但對手依舊強悍。", "You stay focused, but the opponent remains formidable."],
          0.1,
          1,
        ),
      ],
    ),
    lv(
      ["復仇者", "The Avenger"],
      [
        "一名鬥士稱你殺了他的恩師，要與你不死不休。",
        "A gladiator swears you killed his mentor and demands a duel without mercy.",
      ],
      ["復仇的鬥士", "A Vengeful Rival"],
      ["如何面對他的怒火？", "How will you face his fury?"],
      [
        opt(
          ["以牙還牙，激怒他", "Answer fury with fury and provoke him"],
          ["激怒的敵人破綻較多，變弱了。", "An enraged foe leaves openings and grows weaker."],
          -0.1,
          -2,
        ),
        opt(
          ["解釋誤會，嘗試化解", "Explain the misunderstanding"],
          ["對方不信，敵人較強。", "He does not believe you and the foe is stronger."],
          0.1,
          2,
        ),
      ],
    ),
    lv(
      ["猛獸競技", "Beast Hunt"],
      [
        "鐵門升起，猛獸衝進場中，新來的鬥士嚇得僵住。",
        "The gates rise and beasts burst in while a new recruit freezes in terror.",
      ],
      ["競技場猛獸", "Arena Beast"],
      ["你會怎麼做？", "What will you do?"],
      [
        opt(
          ["以新人為誘餌拖住猛獸", "Use the recruit as bait"],
          ["猛獸被引開，敵人變弱。", "The beast is drawn away and weakens."],
          -0.1,
          -1,
        ),
        opt(
          ["站到新人身前保護他", "Step in front and shield him"],
          ["風險大增；事成可得能量寶物。", "The danger grows. Win to receive an energy item."],
          0.15,
          2,
          0,
          "energy",
        ),
      ],
    ),
    lv(
      ["冠軍賽", "Championship"],
      [
        "決賽之前，莊家悄悄遞來一份賭局。",
        "Before the final, a bookmaker slips you a wager.",
      ],
      ["衛冕挑戰者", "Defending Contender"],
      ["要不要接下賭局？", "Will you take the wager?"],
      [
        opt(
          ["接受賭局，押注自己", "Take the bet and back yourself"],
          ["壓力使對手更強；事成可得 800 分。", "The pressure strengthens the foe. Win for 800 points."],
          0.1,
          -1,
          800,
        ),
        opt(
          ["拒絕賭局，只為榮耀而戰", "Refuse and fight for honor alone"],
          ["心神清明，敵人略弱。", "A clear mind leaves the foe slightly weaker."],
          -0.05,
          1,
        ),
      ],
    ),
    lv(
      ["皇帝面前", "Before the Emperor"],
      [
        "不敗的冠軍站在你面前。皇帝抬起手，全場安靜下來。",
        "The undefeated champion stands before you. The Emperor raises a hand and the arena falls silent.",
      ],
      ["不敗冠軍", "The Undefeated Champion"],
      ["決定你一生的時刻。", "The moment that decides your life."],
      [
        opt(
          ["勝利後饒他一命，換取自由", "Spare him after winning and ask for freedom"],
          ["寬容的代價是更艱難的一戰。", "Mercy has a price: a harder fight."],
          0.15,
          3,
        ),
        opt(
          ["勝利後取他性命，成為傳說", "Take his life and become a legend"],
          ["殺意讓你更凌厲，敵人較弱。事成可得 1000 分。", "Bloodlust sharpens you and the foe weakens. Win for 1,000 points."],
          -0.1,
          -3,
          1000,
        ),
      ],
    ),
  ],
  endings: [
    {
      id: "freedom",
      min: 5,
      title: { zh: "自由之身", en: "A Free Man" },
      text: {
        zh: "皇帝賜你木劍。你走出競技場大門，沙塵在身後落定。",
        en: "The Emperor grants you the wooden sword. You walk out through the gates as the dust settles behind you.",
      },
    },
    {
      id: "legend",
      min: -4,
      title: { zh: "競技場傳奇", en: "Legend of the Arena" },
      text: {
        zh: "你的名字被刻在競技場的石壁上，世世代代傳頌。",
        en: "Your name is carved into the arena wall and spoken for generations.",
      },
    },
    {
      id: "blood",
      min: -999,
      title: { zh: "血染沙場", en: "Blood on the Sand" },
      text: {
        zh: "你贏了每一場，卻失去了一切。沙地上只剩下你一個人。",
        en: "You won every fight and lost everything else. Only you remain on the sand.",
      },
    },
  ],
};
