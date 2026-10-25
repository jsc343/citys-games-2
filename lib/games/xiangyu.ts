import type { GameDef } from "@/lib/games/types";
import { lv, opt } from "@/lib/games/helpers";

export const XIANGYU: GameDef = {
  id: "xiangyu",
  category: "war",
  accent: "destructive",
  title: { zh: "項羽傳", en: "The Ballad of Xiang Yu" },
  subtitle: { zh: "古代戰爭", en: "Ancient War" },
  blurb: {
    zh: "從會稽起兵到垓下絕境，每一次抉擇都在改寫霸王的命運。",
    en: "From the uprising at Kuaiji to the last stand at Gaixia, every choice rewrites the Hegemon-King's fate.",
  },
  levels: [
    lv(
      ["起兵會稽", "Uprising at Kuaiji"],
      [
        "秦二世元年，你與叔父項梁殺郡守起事，江東八千子弟隨你而起。",
        "In the first year of the Second Qin Emperor, you and your uncle seize Kuaiji. Eight thousand sons of Jiangdong rise with you.",
      ],
      ["秦郡兵", "Qin Garrison"],
      [
        "郡守府前，人心未穩。你如何立威？",
        "Before the governor's hall, loyalties waver. How do you command?",
      ],
      [
        opt(
          ["當眾斬殺郡守", "Cut down the governor in public"],
          ["震懾全城，但敵軍同仇敵愾，較難對付。事成可得 200 分。", "Cows the city, but the garrison fights desperately. Win for a 200 point bonus."],
          0.1,
          -1,
          200,
        ),
        opt(
          ["先安撫豪傑，再奪兵權", "Win over local leaders first"],
          ["慢了一步，卻換來可靠的後援，敵人較弱。", "Slower, but earns dependable backing. Foes are weaker."],
          -0.1,
          1,
        ),
      ],
    ),
    lv(
      ["鉅鹿破釜", "Julu: Burn the Boats"],
      [
        "秦將章邯圍困趙國，你率楚軍渡過漳水救援。",
        "Qin general Zhang Han besieges Zhao. You lead Chu across the river to relieve it.",
      ],
      ["秦軍先鋒 王離", "Wang Li, Qin Vanguard"],
      ["渡河之後，退路握在你手中。", "Across the river, your retreat is in your hands."],
      [
        opt(
          ["破釜沉舟，只帶三日糧", "Smash the pots, sink the boats"],
          ["士氣暴漲、敵人較弱；需犒賞軍士，立刻花費 300 分。", "Morale soars and foes weaken. Costs 300 points to reward the troops."],
          -0.12,
          0,
          -300,
        ),
        opt(
          ["保留船隻與糧草", "Keep the boats and rations"],
          ["穩妥但士氣平平，敵人略強；事成可得一件能量寶物。", "Safe but dull morale, foes stronger. Win to receive an energy item."],
          0.1,
          1,
          0,
          "energy",
        ),
      ],
    ),
    lv(
      ["斬宋義奪兵", "Execute Song Yi"],
      [
        "上將軍宋義按兵不動，軍中糧盡，士卒怨聲載道。",
        "General Song Yi stalls while the army starves and the soldiers mutter.",
      ],
      ["宋義親衛", "Song Yi's Guard"],
      ["奪權，還是服從？", "Seize command, or obey?"],
      [
        opt(
          ["斬宋義，自領上將軍", "Kill Song Yi and take command"],
          ["全軍歸心，但親衛拚死抵抗。事成可得 400 分。", "The army follows you, but his guard fights to the death. Win for 400 points."],
          0.1,
          -1,
          400,
        ),
        opt(
          ["上書請命，等待楚王詔令", "Petition the King of Chu and wait"],
          ["守住規矩，卻延誤戰機，敵人變強。", "Proper, but the delay strengthens the foe."],
          0.15,
          1,
        ),
      ],
    ),
    lv(
      ["章邯受降", "Zhang Han Yields"],
      [
        "連番大捷後，秦將章邯在洹水邊請降。",
        "After successive victories, Zhang Han asks to surrender at the Huan River.",
      ],
      ["章邯殘部", "Zhang Han's Remnants"],
      ["如何處置降軍？", "How will you treat the surrendering army?"],
      [
        opt(
          ["封章邯為雍王，收編降軍", "Crown him King of Yong, absorb his army"],
          ["降軍安心，敵人減弱。", "The host calms and the remnants weaken."],
          -0.1,
          1,
        ),
        opt(
          ["解除武裝，嚴加看管", "Disarm and guard them closely"],
          ["兵力吃緊，殘部仍有餘力；事成可得 150 分。", "Troops stretched thin, remnants stay dangerous. Win for 150 points."],
          0.1,
          0,
          150,
        ),
      ],
    ),
    lv(
      ["新安降卒", "Xin'an: The Captives"],
      [
        "二十萬降卒軍心浮動，糧草不足，營中暗流湧動。",
        "Two hundred thousand captives grow restless and food runs short.",
      ],
      ["降卒暴動", "Captive Mutiny"],
      ["暴動將起，你如何處置？", "A mutiny brews. What will you do?"],
      [
        opt(
          ["下令坑殺，永絕後患", "Order them buried and end the threat"],
          ["短期安全，但天下人心自此背離你。事成可得 500 分。", "Safe for now, but the realm turns from you. Win for 500 points."],
          -0.1,
          -2,
          500,
        ),
        opt(
          ["分批編入各軍，分糧安撫", "Split them across units and share rations"],
          ["耗費糧餉，立刻花費 400 分，換得民心。", "Costs 400 points in rations, wins hearts."],
          0.05,
          2,
          -400,
        ),
      ],
    ),
    lv(
      ["鴻門之宴", "The Feast at Hongmen"],
      [
        "劉邦先入關中，宴席上殺機四伏，范增頻頻舉起玉玦。",
        "Liu Bang entered Guanzhong first. At the feast Fan Zeng lifts his jade pendant again and again.",
      ],
      ["樊噲與漢軍護衛", "Fan Kuai and the Han Guards"],
      ["殺，還是放？", "To strike, or to spare?"],
      [
        opt(
          ["依范增之計，席間斬殺劉邦", "Follow Fan Zeng: strike at the table"],
          ["一擊可定天下，但衛士拚死護主，敵人較強。事成可得 600 分。", "One blow could end it, but the guards fight hard. Win for 600 points."],
          0.15,
          2,
          600,
        ),
        opt(
          ["聽項伯之言，放走劉邦", "Heed Xiang Bo and let him go"],
          ["賣一個人情，卻埋下日後禍根；敵人較弱。", "You gain a favor and sow future ruin. Foes are weaker."],
          -0.1,
          -2,
        ),
      ],
    ),
    lv(
      ["分封天下", "Dividing the Realm"],
      [
        "秦亡，你成為諸侯盟主，天下看你如何裁決。",
        "Qin has fallen and you lead the lords. The realm waits to see how you rule.",
      ],
      ["叛亂諸侯", "Rebel Lords"],
      ["定都何處？", "Where will you set the capital?"],
      [
        opt(
          ["定都關中，據險而守", "Hold the fortress of Guanzhong"],
          ["根基穩固，敵人較弱。", "Solid footing and weaker foes."],
          -0.12,
          2,
        ),
        opt(
          ["東歸彭城，衣錦還鄉", "Return east to Pengcheng in glory"],
          ["榮耀加身，卻失去地利，敵人較強。事成可得 500 分。", "Glory, but you lose the high ground. Win for 500 points."],
          0.12,
          -2,
          500,
        ),
      ],
    ),
    lv(
      ["彭城奇襲", "Raid at Pengcheng"],
      [
        "漢軍五十六萬趁你北上攻入彭城，你率三萬精騎回師。",
        "Han forces of 560,000 take Pengcheng while you march north. You ride back with 30,000 elite cavalry.",
      ],
      ["漢軍諸侯聯軍", "The Han Coalition"],
      ["如何反擊？", "How will you strike?"],
      [
        opt(
          ["親率精騎，清晨突襲", "Lead the cavalry in a dawn raid"],
          ["攻其不備，敵人減弱。事成可得 300 分。", "A surprise attack weakens them. Win for 300 points."],
          -0.1,
          0,
          300,
        ),
        opt(
          ["分兵三路合圍", "Split into three columns to encircle"],
          ["穩健卻需協調，敵人較強；事成可得援軍寶物。", "Steady but demanding, foes stronger. Win to receive an ally item."],
          0.1,
          1,
          0,
          "help",
        ),
      ],
    ),
    lv(
      ["廣武對峙", "Stalemate at Guangwu"],
      [
        "楚漢相持數月，糧道被彭越不斷騷擾。",
        "Months of standoff pass as Peng Yue raids your supply lines.",
      ],
      ["漢軍先鋒", "Han Vanguard"],
      ["如何打破僵局？", "How will you break the stalemate?"],
      [
        opt(
          ["陣前單挑，約戰劉邦", "Challenge Liu Bang to single combat"],
          ["勇武震懾全軍，但糧草依舊吃緊。事成可得 400 分。", "Awes both armies, but supplies stay thin. Win for 400 points."],
          0,
          -2,
          400,
        ),
        opt(
          ["分兵護糧，堅守待變", "Guard the supply line and wait"],
          ["保住補給，戰機漸失；事成可得能量寶物。", "Secure the grain, lose the initiative. Win to receive an energy item."],
          0.1,
          2,
          0,
          "energy",
        ),
      ],
    ),
    lv(
      ["垓下四面楚歌", "Gaixia: Songs of Chu"],
      [
        "漢軍四面高唱楚歌，兵敗如山倒。烏江亭長備船相候。",
        "Han soldiers sing songs of Chu on every side. At the Wu River a ferryman waits with a boat.",
      ],
      ["灌嬰追兵", "Guan Ying's Pursuers"],
      ["最後的抉擇。", "The final choice."],
      [
        opt(
          ["突圍東渡，圖謀東山再起", "Break out east and cross to rebuild"],
          ["背水一戰，追兵凶猛，敵人較強。", "A desperate run, and the pursuers press hard."],
          0.15,
          3,
        ),
        opt(
          ["無顏見江東父老，拔劍死戰", "Refuse to face Jiangdong, fight to the end"],
          ["以英雄之姿迎戰，敵人較弱。事成可得 1000 分。", "Meet them as a hero, foes weaker. Win for 1,000 points."],
          -0.1,
          -3,
          1000,
        ),
      ],
    ),
  ],
  endings: [
    {
      id: "rebirth",
      min: 5,
      title: { zh: "東山再起", en: "Rise from Jiangdong" },
      text: {
        zh: "你步步為營，終於渡過烏江。江東子弟再度聚首，天下尚未定局。",
        en: "Careful at every step, you cross the Wu River. Jiangdong's sons gather once more, and the realm is not yet decided.",
      },
    },
    {
      id: "wujiang",
      min: -4,
      title: { zh: "烏江自刎", en: "The Last Stand at Wu River" },
      text: {
        zh: "你力戰到底，在烏江畔留下一曲悲歌。成敗已定，英名長存。",
        en: "You fight to the very end and leave a lament on the riverbank. Fate is sealed, yet the name endures.",
      },
    },
    {
      id: "tragic",
      min: -999,
      title: { zh: "英雄末路", en: "A Hero's Twilight" },
      text: {
        zh: "驕矜與殺伐讓人心盡失。霸王獨立垓下，再無人願與他同行。",
        en: "Pride and slaughter cost you every ally. The Hegemon-King stands alone at Gaixia with no one left to follow.",
      },
    },
  ],
};
