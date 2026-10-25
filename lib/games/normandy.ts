import type { GameDef } from "@/lib/games/types";
import { lv, opt } from "@/lib/games/helpers";

export const NORMANDY: GameDef = {
  id: "normandy",
  category: "gun",
  accent: "accent",
  title: { zh: "諾曼第突圍", en: "Normandy Breakout" },
  subtitle: { zh: "時代槍戰", en: "Era Gunfight" },
  blurb: {
    zh: "從登陸艇到撤離點，你的每個決定都牽動隊友的生死。",
    en: "From landing craft to extraction, every decision decides who comes home.",
  },
  levels: [
    lv(
      ["登陸艇", "Landing Craft"],
      [
        "黎明，浪濤拍打艇身，艇門即將放下，灘頭的機槍已開始掃射。",
        "Dawn. Waves slam the hull, the ramp is about to drop, and machine guns already rake the beach.",
      ],
      ["灘頭機槍巢", "Beach Machine-Gun Nest"],
      ["艇門放下之前，你選擇？", "Before the ramp falls, what do you do?"],
      [
        opt(
          ["第一個衝出艇門", "Rush out first"],
          ["搶占先機、敵人較弱，但你將完全暴露。", "You seize the initiative and weaken them, but you are fully exposed."],
          -0.1,
          -1,
        ),
        opt(
          ["掩護隊友先行", "Cover your squad as they exit"],
          ["隊友存活率更高，節奏較慢、敵人略強。", "Your squad survives better, but the pace slows and the foe is stronger."],
          0.05,
          1,
        ),
      ],
    ),
    lv(
      ["灘頭突擊", "Beach Assault"],
      [
        "沙灘上屍橫遍野，彈著點在你身邊炸開。",
        "Bodies litter the sand and shells burst around you.",
      ],
      ["灘頭守軍", "Beach Defenders"],
      ["如何推進？", "How will you advance?"],
      [
        opt(
          ["沿浪線快速推進", "Sprint along the waterline"],
          ["速度快、敵人較弱。事成可得 200 分。", "Fast and weakens the defenders. Win for 200 points."],
          -0.05,
          -1,
          200,
        ),
        opt(
          ["利用障礙物逐段推進", "Leapfrog from cover to cover"],
          ["較為安全，但需要更準的槍法。", "Safer, but you will need sharper aim."],
          0.1,
          1,
        ),
      ],
    ),
    lv(
      ["鐵蒺藜障礙", "Hedgehog Obstacles"],
      [
        "鋼製障礙卡住前進道路，必須在火力下打開缺口。",
        "Steel hedgehogs block the way and a gap must be opened under fire.",
      ],
      ["防線守備隊", "Defense Line Squad"],
      ["如何開路？", "How will you breach?"],
      [
        opt(
          ["引爆炸藥直接炸開", "Blow it open with explosives"],
          ["快速有效，敵人較弱；彈藥耗費 250 分。", "Fast and effective, foes weaker. Costs 250 points of ordnance."],
          -0.1,
          -1,
          -250,
        ),
        opt(
          ["工兵拆除，隊友掩護", "Engineers clear it under covering fire"],
          ["耗時較久、敵人較強；事成可得能量寶物。", "Slower, foes stronger. Win to receive an energy item."],
          0.1,
          1,
          0,
          "energy",
        ),
      ],
    ),
    lv(
      ["壕溝清剿", "Trench Clearing"],
      [
        "敵軍壕溝縱橫交錯，每個轉角都可能有槍口。",
        "Enemy trenches twist and fork, with a rifle behind every corner.",
      ],
      ["壕溝守軍", "Trench Garrison"],
      ["如何清剿？", "How will you clear them?"],
      [
        opt(
          ["手榴彈先行，快速清壕", "Grenades first, move fast"],
          ["效率高、敵人較弱；耗費 200 分。", "Efficient and weakens them. Costs 200 points."],
          -0.1,
          -1,
          -200,
        ),
        opt(
          ["逐段肅清，保持隊形", "Clear section by section in formation"],
          ["隊友較安全，敵人略強。", "Safer for the squad, foes slightly stronger."],
          0.1,
          1,
        ),
      ],
    ),
    lv(
      ["村落巷戰", "Village Street Fight"],
      [
        "石屋間槍聲此起彼落，平民躲在地窖裡。",
        "Gunfire echoes between stone houses while civilians hide in cellars.",
      ],
      ["村落守軍", "Village Defenders"],
      ["優先順序是什麼？", "What comes first?"],
      [
        opt(
          ["直取鐘樓狙擊點", "Storm the bell tower sniper nest"],
          ["解除最大威脅，但敵人較強。事成可得 500 分。", "Removes the biggest threat but foes are stronger. Win for 500 points."],
          0.1,
          -1,
          500,
        ),
        opt(
          ["先救助平民與傷員", "Rescue civilians and the wounded first"],
          ["戰況更危險，但事成可得智慧寶物。", "A more dangerous fight, but win to receive a wisdom item."],
          0.15,
          2,
          0,
          "wisdom",
        ),
      ],
    ),
    lv(
      ["海岸砲台", "Coastal Battery"],
      [
        "混凝土砲台俯瞰整片海灘，是任務的關鍵目標。",
        "A concrete battery overlooks the whole beach and is the key objective.",
      ],
      ["砲台守備隊", "Battery Garrison"],
      ["任務與小隊，孰輕孰重？", "Mission or squad, which weighs more?"],
      [
        opt(
          ["全力主攻，任務優先", "All-out assault, mission first"],
          ["突擊力強、敵人較弱；傷亡難免。", "A hard-hitting push that weakens them, at a price."],
          -0.1,
          -2,
        ),
        opt(
          ["分兵牽制，保全小隊", "Split to pin them down, protect the squad"],
          ["保住隊友，敵人較強。事成可得 300 分。", "Keeps your squad alive but foes are stronger. Win for 300 points."],
          0.1,
          2,
          300,
        ),
      ],
    ),
    lv(
      ["橋樑奪取", "Seize the Bridge"],
      [
        "石橋是整條突圍路線的咽喉，敵人已佈下火力網。",
        "The stone bridge is the throat of the breakout and the enemy has laid a crossfire.",
      ],
      ["橋頭守軍", "Bridgehead Guards"],
      ["如何奪橋？", "How will you take it?"],
      [
        opt(
          ["夜間偷渡，奇襲橋頭", "Wade across at night for a surprise strike"],
          ["敵人較弱，但無人支援。事成可得 300 分。", "Foes weaker, but no reinforcements. Win for 300 points."],
          -0.1,
          0,
          300,
        ),
        opt(
          ["等待空降部隊會合", "Wait for the paratroopers to link up"],
          ["敵人較強；事成可得援軍寶物。", "Foes stronger. Win to receive an ally item."],
          0.1,
          1,
          0,
          "help",
        ),
      ],
    ),
    lv(
      ["樹籬迷宮", "Hedgerow Maze"],
      [
        "厚實的樹籬把田野切成無數死角，敵人藏身其後。",
        "Thick hedgerows carve the fields into blind corners where the enemy hides.",
      ],
      ["樹籬伏兵", "Hedgerow Ambushers"],
      ["如何穿越？", "How will you cross?"],
      [
        opt(
          ["坦克開路，硬闖樹籬", "Let the tanks bulldoze through"],
          ["推進迅速、敵人較弱，但步兵暴露。", "Quick progress and weaker foes, with infantry exposed."],
          -0.1,
          -1,
        ),
        opt(
          ["步兵搜索前進", "Advance with infantry sweeps"],
          ["緩慢但安全，敵人略強。", "Slow but safe, foes slightly stronger."],
          0.1,
          1,
        ),
      ],
    ),
    lv(
      ["補給站", "Supply Depot"],
      [
        "你攻下敵軍補給站，裡面的物資足以改變接下來的戰局。",
        "You capture an enemy depot whose stores could swing what comes next.",
      ],
      ["補給站守軍", "Depot Guards"],
      ["物資怎麼分配？", "How do you share the spoils?"],
      [
        opt(
          ["全數運走，確保後續任務", "Take everything for the mission ahead"],
          ["任務更有把握。事成可得 600 分。", "Secures the mission. Win for 600 points."],
          -0.05,
          -1,
          600,
        ),
        opt(
          ["留下部分給傷兵與平民", "Leave part for the wounded and civilians"],
          ["損失 300 分補給，卻贏得人心。", "Costs 300 points of supplies, wins goodwill."],
          0.05,
          2,
          -300,
        ),
      ],
    ),
    lv(
      ["撤離點", "Extraction"],
      [
        "撤離艇已在遠方等候，敵軍追兵逼近，時間所剩無幾。",
        "The extraction boat waits offshore while the enemy closes in and time runs out.",
      ],
      ["追擊部隊", "Pursuit Force"],
      ["最後的抉擇。", "The final decision."],
      [
        opt(
          ["先撤離傷員，自己斷後", "Evacuate the wounded first, cover the rear"],
          ["背負最大風險，敵人較強。", "You carry the greatest risk and foes are stronger."],
          0.15,
          3,
        ),
        opt(
          ["護送機密文件先走", "Escort the classified documents out first"],
          ["任務得以完成，敵人較弱。事成可得 800 分。", "Mission accomplished, foes weaker. Win for 800 points."],
          -0.1,
          -3,
          800,
        ),
      ],
    ),
  ],
  endings: [
    {
      id: "allreturn",
      min: 5,
      title: { zh: "全員生還", en: "Everyone Comes Home" },
      text: {
        zh: "你把每個人都帶回了船上。灘頭安靜下來，沒有人被留在身後。",
        en: "You bring every last soldier aboard. The beach falls quiet and no one is left behind.",
      },
    },
    {
      id: "pyrrhic",
      min: -4,
      title: { zh: "慘烈的勝利", en: "A Costly Victory" },
      text: {
        zh: "任務完成了，但名冊上多了許多名字。勝利的滋味很苦。",
        en: "The mission succeeds, but the roll of the fallen is long. Victory tastes bitter.",
      },
    },
    {
      id: "lone",
      min: -999,
      title: { zh: "孤身突圍", en: "Lone Survivor" },
      text: {
        zh: "你完成了所有目標，卻是唯一站在撤離點的人。",
        en: "You achieved every objective, yet you alone stand at the extraction point.",
      },
    },
  ],
};
