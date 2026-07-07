// ===========================
// 下城区日志 · script.js
// ===========================

// ---------- 数据 ----------
const gameData = {
    playerId: '',
    survival: 60,
    san: 60,
    month: 1,
    bossBond: 0,
    crowBond: 0,
    alishBond: 0,
    bossLocked: false,
    crowLocked: false,
    alishLocked: false,
    gameOver: false,
    started: false,
    allEventsCompleted: false,
    sequenceIndex: 0,
    waitingForContinue: false
};

// ---------- 变化值记录 ----------
let lastChanges = {
    survival: 0,
    san: 0,
    boss: 0,
    crow: 0,
    alish: 0
};

// ---------- DOM 缓存 ----------
const $ = id => document.getElementById(id);
const page1 = $('page1');
const page2 = $('page2');
const page3 = $('page3');
const enterBtn = $('enterBtn');
const confirmBtn = $('confirmBtn');
const playerIdInput = $('playerId');
const survivalDisplay = $('survivalDisplay');
const sanDisplay = $('sanDisplay');
const rollSurvival = $('rollSurvival');
const rollSan = $('rollSan');
const creationError = $('creationError');

const displayId = $('displayId');
const displayMonth = $('displayMonth');
const displaySurvival = $('displaySurvival');
const displaySan = $('displaySan');
const survivalBar = $('survivalBar');
const sanBar = $('sanBar');

const eventContent = $('eventContent');
const eventOptions = $('eventOptions');
const eventFeedback = $('eventFeedback');

const bondBoss = $('bondBoss');
const bondCrow = $('bondCrow');
const bondAlish = $('bondAlish');
const bondBossText = $('bondBossText');
const bondCrowText = $('bondCrowText');
const bondAlishText = $('bondAlishText');
const bossStatus = $('bossStatus');
const crowStatus = $('crowStatus');
const alishStatus = $('alishStatus');

const endingModal = $('endingModal');
const endingTitle = $('endingTitle');
const endingDesc = $('endingDesc');
const endingRestartBtn = $('endingRestartBtn');

// ---------- 工具 ----------
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

// ---------- ROLL 点 ----------
let survivalRolled = false;
let sanRolled = false;

function rollStat() {
    return rand(60, 100);
}

rollSurvival.addEventListener('click', function() {
    const val = rollStat();
    gameData.survival = val;
    survivalDisplay.textContent = val;
    survivalRolled = true;
    checkCreationReady();
});

rollSan.addEventListener('click', function() {
    const val = rollStat();
    gameData.san = val;
    sanDisplay.textContent = val;
    sanRolled = true;
    checkCreationReady();
});

function checkCreationReady() {
    const id = playerIdInput.value.trim();
    if (id && survivalRolled && sanRolled) {
        confirmBtn.disabled = false;
        creationError.textContent = '';
    } else {
        confirmBtn.disabled = true;
    }
}

playerIdInput.addEventListener('input', checkCreationReady);

// ---------- 进入 PAGE 2 ----------
enterBtn.addEventListener('click', function() {
    page1.style.display = 'none';
    page2.style.display = 'block';
});

// ---------- 确认创角 ----------
confirmBtn.addEventListener('click', function() {
    const id = playerIdInput.value.trim();
    if (!id) {
        creationError.textContent = '请输入你的代号。';
        return;
    }
    if (!survivalRolled || !sanRolled) {
        creationError.textContent = '请先 roll 点。';
        return;
    }

    gameData.playerId = id;
    gameData.survival = parseInt(survivalDisplay.textContent);
    gameData.san = parseInt(sanDisplay.textContent);
    gameData.started = true;

    page2.style.display = 'none';
    page3.style.display = 'block';

    updateUI();
    startNextEvent();
});

// ---------- 更新 UI ----------
function updateUI() {
    const d = gameData;
    displayId.textContent = d.playerId;
    displayMonth.textContent = `第 ${d.month} 月`;
    displaySurvival.textContent = d.survival;
    displaySan.textContent = d.san;
    survivalBar.style.width = Math.min(100, d.survival) + '%';
    sanBar.style.width = Math.min(100, d.san) + '%';

    bondBoss.style.width = Math.min(100, d.bossBond) + '%';
    bondCrow.style.width = Math.min(100, d.crowBond) + '%';
    bondAlish.style.width = Math.min(100, d.alishBond) + '%';
    bondBossText.textContent = d.bossBond;
    bondCrowText.textContent = d.crowBond;
    bondAlishText.textContent = d.alishBond;

    bossStatus.textContent = getStatusLabel(d.bossBond);
    crowStatus.textContent = getStatusLabel(d.crowBond);
    alishStatus.textContent = getStatusLabel(d.alishBond);

    document.querySelector('.npc-card[data-npc="boss"]').classList.toggle('locked', d.bossLocked);
    document.querySelector('.npc-card[data-npc="crow"]').classList.toggle('locked', d.crowLocked);
    document.querySelector('.npc-card[data-npc="alish"]').classList.toggle('locked', d.alishLocked);
}

function getStatusLabel(bond) {
    if (bond >= 80) return '❤️ 生死之交';
    if (bond >= 60) return '🤝 信任';
    if (bond >= 40) return '👥 熟悉';
    if (bond >= 20) return '📌 认识';
    return '🌫️ 初识';
}

// ---------- 结局判定 ----------
function checkDeathEnding() {
    const d = gameData;
    if (d.gameOver) return;
    if (!d.started) return;

    if (d.survival <= 0 || d.san <= 0) {
        showEnding('💀 很抱歉你去世了', '下城区的霓虹灯还在闪烁，但你已经看不到了。', 'death');
        return true;
    }
    return false;
}

function checkFinalEnding() {
    const d = gameData;
    if (d.gameOver) return;
    if (!d.allEventsCompleted) return;

    const allBond = d.bossBond >= 60 && d.crowBond >= 60 && d.alishBond >= 60;
    const healthy = d.survival > 60 && d.san > 60;
    const alive = d.survival > 0 && d.san > 0;

    if (!healthy && allBond && alive) {
        showEnding('🎁 很幸运你虽然废柴但被carry到地上',
            '你迷迷糊糊地被三个人拽着走出了下城区。\n阳光刺眼，但你活着。',
            'surprise');
        return;
    }

    if (alive && !allBond) {
        showEnding('🌑 刺目的阳光——你目送他们远去',
            '他们终于走出了下城区。\n你站在阴影里，看着他们的背影消失在光中。',
            'be');
        return;
    }

    if (healthy && allBond) {
        showEnding('✨ 你站在阳光里，回看来时路',
            '十年。\n你终于站在了上城区的阳光下。\n回头望去，轻轨还在下城区穿梭，\n而你已经走出来了。\n\n—— 谢谢你，一直在。',
            'he');
        return;
    }
}

function showEnding(title, desc, type) {
    gameData.gameOver = true;
    endingTitle.textContent = title;
    endingDesc.textContent = desc;
    endingModal.style.display = 'flex';

    const colors = {
        death: '#ff6b6b',
        surprise: '#ffab40',
        be: '#556688',
        he: '#00e676'
    };
    endingTitle.style.color = colors[type] || '#c8d6e5';
    document.querySelector('.modal-box').style.borderColor = colors[type] || '#2a3a5a';
}

endingRestartBtn.addEventListener('click', function() {
    location.reload();
});

// ---------- 日常事件 ----------
const dailyEventsMap = {
    'D1': {
        id: 'D1',
        title: '帮乌鸦打扫诊所',
        desc: '乌鸦的诊所有几天没收拾了，药柜上落了一层灰。他难得没有赶人，只是抬了抬下巴示意你帮忙。',
        options: [
            { label: '🧹 帮忙打扫', effect: () => { addSurvival(rand(2, 4));
                    addSan(1);
                    addBond('crow', rand(5, 7)); } },
            { label: '🚶 装作没看见', effect: () => {} }
        ]
    },
    'D2': {
        id: 'D2',
        title: '轻轨偶遇阿利什',
        desc: '轻轨车厢里人不多，你看到阿利什一个人坐在角落，手里捧着一杯酸奶。他似乎在发呆。',
        options: [
            { label: '🪑 坐到他旁边', effect: () => { addSurvival(rand(1, 2));
                    addBond('alish', rand(5, 7));
                    addSan(1); } },
            { label: '📏 隔一个座位坐下', effect: () => { addSurvival(rand(1, 2));
                    addBond('alish', rand(3, 5)); } }
        ]
    },
    'D3': {
        id: 'D3',
        title: '下城区停电',
        desc: '整个街区陷入黑暗。邻居们在走廊里点起蜡烛，昏黄的光在铁皮棚之间摇晃。',
        options: [
            { label: '🔧 帮邻居修电路', effect: () => { addSurvival(-rand(2, 4));
                    addSan(1); } },
            { label: '🏥 去黑诊所看看乌鸦', effect: () => { addSurvival(-rand(1, 2));
                    addBond('crow', rand(5, 7)); } }
        ]
    },
    'D4': {
        id: 'D4',
        title: '替老大跑腿',
        desc: '老大叫住你，递过来一个封好的信封。“送到野火的地盘，别让人看到。”',
        options: [
            { label: '📬 接下任务', effect: () => { addSurvival(-rand(2, 4));
                    addBond('boss', rand(5, 7)); } },
            { label: '🙅 推脱', effect: () => { addSurvival(-rand(1, 2)); } }
        ]
    },
    'D5': {
        id: 'D5',
        title: '黑市换物资',
        desc: '下城区的黑市今天人很多，你需要换一批生存物资。',
        options: [
            { label: '🔩 用旧零件换', effect: () => { addSurvival(rand(2, 4));
                    addSan(1); } },
            { label: '📦 帮忙搬运货物抵债', effect: () => { addSurvival(rand(3, 5)); } }
        ]
    },
    'D6': {
        id: 'D6',
        title: '乌鸦教你认药',
        desc: '乌鸦难得有耐心，指着药柜上的干草标本，一个一个讲给你听。',
        options: [
            { label: '📖 认真学', effect: () => { addSurvival(rand(1, 2));
                    addSan(3);
                    addBond('crow', rand(5, 7)); } },
            { label: '😴 走神', effect: () => { addSurvival(rand(1, 2)); } }
        ]
    },
    'D7': {
        id: 'D7',
        title: '阿利什推来酸奶',
        desc: '你正蹲在门口发呆，阿利什走过来，把一杯酸奶放在你脚边，转身走了。',
        options: [
            { label: '🥛 接过来喝掉', effect: () => { addSurvival(rand(1, 2));
                    addBond('alish', rand(5, 7));
                    addSan(2); } },
            { label: '↩️ 推回去', effect: () => { addSurvival(rand(1, 2));
                    addBond('alish', 2); } }
        ]
    },
    'D8': {
        id: 'D8',
        title: '火并后的清晨',
        desc: '昨夜下城区又有一场火并。街道上残留着痕迹，空气里有淡淡的金属味。',
        options: [
            { label: '🧹 帮忙清理', effect: () => { addSurvival(rand(2, 4));
                    addBond('boss', rand(3, 5)); } },
            { label: '🔄 绕道走', effect: () => { addSurvival(rand(1, 2)); } }
        ]
    },
    'D9': {
        id: 'D9',
        title: '乌鸦熬夜',
        desc: '诊所的灯还亮着，乌鸦又熬了一夜。你路过时，看到他的侧影映在窗上。',
        options: [
            { label: '☕ 送一杯热水', effect: () => { addSurvival(rand(1, 2));
                    addBond('crow', rand(5, 7));
                    addSan(1); } },
            { label: '🚶 不管', effect: () => { addSurvival(rand(1, 2)); } }
        ]
    },
    'D10': {
        id: 'D10',
        title: '轻轨报站异常',
        desc: '轻轨的广播系统出了故障，重复播着同一句话：“下一站是…下一站是…”',
        options: [
            { label: '🔊 去找维修员', effect: () => { addSurvival(-rand(1, 3));
                    addSan(2); } },
            { label: '🙉 忽略', effect: () => { addSurvival(-rand(1, 2));
                    addSan(-2); } }
        ]
    }
};

// ---------- 主线事件 ----------
const mainlineEvents = [{
    id: 'M1',
    title: '隔壁搬来两个人',
    desc: '你听到隔壁铁皮棚有动静。一个少年牵着一个小孩走了进来。\n少年大约十七八岁，脸上带着伤，眼神却很稳。小孩安安静静的，像一只收拢翅膀的鸟。',
    options: [
        { label: '👋 主动打招呼', effect: () => { addBond('boss', rand(8, 10)); } },
        { label: '🔍 先观察', effect: () => {} }
    ],
    jump: 1
}, {
    id: 'M2',
    title: '黑诊所的医生',
    desc: '老大带着阿利什去了一间黑诊所。你认出那个医生——一个沉默寡言的中年男人，但手指很稳。\n他看了阿利什一眼，说：“这孩子得调养。”',
    options: [
        { label: '🚶 跟过去看看', effect: () => { addBond('crow', rand(8, 10));
                addSan(2); } },
        { label: '📌 留在原地', effect: () => {} }
    ],
    jump: 3
}, {
    id: 'M3',
    title: '乌鸦的试探',
    desc: '乌鸦注意到了你。他偶尔会让你帮忙认药草，顺便聊几句。\n“你常来？”他问得漫不经心，但你知道他在观察。',
    options: [
        { label: '🌿 好好帮忙', effect: () => { addBond('crow', rand(8, 10));
                addSan(3); } },
        { label: '😐 敷衍', effect: () => {} }
    ],
    jump: 3
}, {
    id: 'M4',
    title: '第一次跑腿',
    desc: '老大叫住你：“帮我送个东西。”\n他递过来一个包裹，地址是野火的地盘。你接过的时候，他多看了你一眼。',
    options: [
        { label: '📦 接下', effect: () => { addSurvival(-rand(4, 6));
                addBond('boss', rand(8, 10)); } },
        { label: '🙅 婉拒', effect: () => { addSurvival(-rand(2, 4)); } }
    ],
    jump: 3
}, {
    id: 'M5',
    title: '阿利什的酸奶',
    desc: '某天下午，阿利什突然出现在你面前。他什么都没说，推了一杯酸奶到你手里。\n酸奶还是凉的。',
    options: [
        { label: '🥛 接过来喝掉', effect: () => { addBond('alish', rand(8, 10));
                addSan(3); } },
        { label: '🙏 说谢谢但推回', effect: () => { addBond('alish', 3); } }
    ],
    jump: 4
}, {
    id: 'M6',
    title: '乌鸦的过去',
    desc: '乌鸦喝醉了。他靠在药柜上，断断续续地提到了“帝国”、“逃出来”这样的词。\n你第一次看到他脸上有疲惫以外的表情。',
    options: [
        { label: '🤫 安静地听', effect: () => { addBond('crow', rand(8, 10));
                addSan(2); } },
        { label: '❓ 追问', effect: () => { addBond('crow', 4);
                addSan(-3); } }
    ],
    jump: 5
}, {
    id: 'M7',
    title: '手术刀落地的声音',
    desc: '你路过诊所时，听到了老大的声音，然后是乌鸦的声音。\n然后是什么东西落地的声音——金属的，清脆的，很响。\n你停下了脚步。',
    options: [
        { label: '👂 贴近门听', effect: () => { addBond('boss', 5);
                addBond('crow', 5);
                addSan(-3); } },
        { label: '🚶 走开', effect: () => {} }
    ],
    jump: 5
}, {
    id: 'M8',
    title: '火并之后',
    desc: '乌鸦把两个浑身是血的人带了回来。一个是老大，一个是阿利什。\n乌鸦的表情很冷，但手很稳。他在处理伤口，你在旁边递东西。',
    options: [
        { label: '🩹 帮忙处理伤口', effect: () => { addSurvival(-rand(4, 6));
                addBond('boss', rand(8, 10));
                addBond('crow', rand(8, 10));
                addBond('alish', rand(8, 10));
                addSan(2); } },
        { label: '🚪 在外面守着', effect: () => { addSurvival(-rand(2, 4));
                addBond('boss', 3);
                addBond('crow', 3);
                addBond('alish', 3); } }
    ],
    jump: 6
}, {
    id: 'M9',
    title: '消息传开了',
    desc: '下城区在传一件事：老大端掉了一个部长级的人物。\n你听到这个消息时，正在诊所门口。乌鸦低着头擦手术刀，什么也没说。',
    options: [
        { label: '🗣️ 问老大', effect: () => { addBond('boss', rand(8, 10)); } },
        { label: '🗣️ 问乌鸦', effect: () => { addBond('crow', rand(8, 10)); } },
        { label: '🤐 不问', effect: () => { addSan(2); } }
    ],
    jump: 6
}, {
    id: 'M10',
    title: '新身份',
    desc: '乌鸦换了一身干净的衣服，出现在老大集团的大楼里。\n他现在的身份是“首席医疗官”。\n你看着他，觉得他好像终于找回了一点当年的影子。',
    options: [
        { label: '🎉 恭喜乌鸦', effect: () => { addBond('crow', rand(8, 10)); } },
        { label: '🤝 和平时一样', effect: () => { addBond('crow', 4); } }
    ],
    jump: 6
}, {
    id: 'M11',
    title: '研究所',
    desc: '阿利什要去研究所卧底了。你送他到轻轨站。他手里拿着一杯酸奶，没喝，就这么握着。\n轻轨要开了，他才开口：“…我走了。”',
    options: [
        { label: '💬 “早点回来。”', effect: () => { addBond('alish', rand(8, 10)); } },
        { label: '🥛 递给他一盒酸奶', effect: () => { addBond('alish', 10);
                addSan(3); } },
        { label: '🤐 什么都不说', effect: () => { addBond('alish', 4); } }
    ],
    jump: 6
}, {
    id: 'M12',
    title: '十年之后',
    desc: '你站在下城区边缘。\n身后是铁皮棚和轻轨，身前是通往地上的阶梯。\n老大、乌鸦、阿利什站在你面前。\n老大说：“走吧，回地上。”',
    options: [
        { label: '✅ 点头', effect: () => {
                gameData.allEventsCompleted = true;
                checkFinalEnding();
            } },
        { label: '❓ “为什么？”', effect: () => { addBond('boss', 3);
                addBond('crow', 3);
                addBond('alish', 3); } }
    ],
    jump: 0,
    isFinal: true
}];

// ---------- 意外事件 ----------
const accidentEventsMap = {
    'E1': {
        id: 'E1',
        title: '⚠️ 下层塌方',
        desc: '下城区-10层发生了塌方。你差点被困在里面，跑出来时满身灰尘。',
        effect: () => { addSurvival(-rand(7, 9));
                addSan(-rand(3, 5)); }
    },
    'E2': {
        id: 'E2',
        title: '⚠️ 变异体出没',
        desc: '轻轨站附近出现了变异体。你被波及，虽然逃了出来，但精神受到了冲击。',
        effect: () => { addSurvival(-rand(3, 5));
                addSan(-rand(7, 9)); }
    },
    'E3': {
        id: 'E3',
        title: '⚠️ 仇家上门',
        desc: '有人找到了黑诊所门口。乌鸦让你躲进密室，你听到外面有打斗声。',
        effect: () => { addSurvival(-rand(7, 9));
                addBond('crow', 3); }
    },
    'E4': {
        id: 'E4',
        title: '⚠️ 老大受伤',
        desc: '老大在一次任务中受了伤。你帮忙送药过去，他看了你一眼，什么也没说。',
        effect: () => { addSurvival(-rand(7, 9));
                addBond('boss', 3); }
    },
    'E5': {
        id: 'E5',
        title: '⚠️ 黑市暴动',
        desc: '黑市连续一周无法正常交易。你只能省着点用。',
        effect: () => { addSurvival(-rand(7, 9));
                addSan(-rand(4, 6)); }
    }
};

// ============================================================
// 固定事件序列
// ============================================================
const eventSequence = [
    { type: 'daily', id: 'D5' },
    { type: 'daily', id: 'D8' },
    { type: 'accident', id: 'E1' },
    { type: 'mainline', id: 'M1' },
    { type: 'daily', id: 'D2' },
    { type: 'daily', id: 'D4' },
    { type: 'daily', id: 'D10' },
    { type: 'mainline', id: 'M2' },
    { type: 'daily', id: 'D1' },
    { type: 'daily', id: 'D7' },
    { type: 'accident', id: 'E2' },
    { type: 'mainline', id: 'M3' },
    { type: 'daily', id: 'D3' },
    { type: 'daily', id: 'D9' },
    { type: 'daily', id: 'D6' },
    { type: 'mainline', id: 'M4' },
    { type: 'daily', id: 'D1' },
    { type: 'daily', id: 'D2' },
    { type: 'accident', id: 'E3' },
    { type: 'mainline', id: 'M5' },
    { type: 'daily', id: 'D3' },
    { type: 'daily', id: 'D4' },
    { type: 'daily', id: 'D5' },
    { type: 'mainline', id: 'M6' },
    { type: 'daily', id: 'D6' },
    { type: 'daily', id: 'D7' },
    { type: 'accident', id: 'E4' },
    { type: 'mainline', id: 'M7' },
    { type: 'daily', id: 'D8' },
    { type: 'daily', id: 'D9' },
    { type: 'daily', id: 'D10' },
    { type: 'mainline', id: 'M8' },
    { type: 'daily', id: 'D4' },
    { type: 'daily', id: 'D2' },
    { type: 'accident', id: 'E5' },
    { type: 'mainline', id: 'M9' },
    { type: 'daily', id: 'D3' },
    { type: 'daily', id: 'D1' },
    { type: 'daily', id: 'D5' },
    { type: 'mainline', id: 'M10' },
    { type: 'daily', id: 'D9' },
    { type: 'daily', id: 'D7' },
    { type: 'mainline', id: 'M11' },
    { type: 'daily', id: 'D8' },
    { type: 'daily', id: 'D10' },
    { type: 'daily', id: 'D6' },
    { type: 'mainline', id: 'M12' }
];

// ---------- 数值修改函数（记录变化值） ----------
function addSurvival(v) {
    lastChanges.survival = v;
    gameData.survival = clamp(gameData.survival + v, 0, 100);
    updateUI();
    if (checkDeathEnding()) return;
}

function addSan(v) {
    lastChanges.san = v;
    gameData.san = clamp(gameData.san + v, 0, 100);
    updateUI();
    if (checkDeathEnding()) return;
}

function addBond(who, v) {
    if (gameData.gameOver) return;
    const key = who + 'Bond';
    const lockKey = who + 'Locked';
    if (gameData[lockKey]) return;

    // 记录变化
    if (who === 'boss') lastChanges.boss = v;
    else if (who === 'crow') lastChanges.crow = v;
    else if (who === 'alish') lastChanges.alish = v;

    gameData[key] = clamp(gameData[key] + v, 0, 100);
    if (gameData[key] >= 80) {
        gameData[lockKey] = true;
    }
    updateUI();
}

// ---------- 重置变化值 ----------
function resetChanges() {
    lastChanges = { survival: 0, san: 0, boss: 0, crow: 0, alish: 0 };
}

// ---------- 事件调度 ----------
let eventLock = false;

function startNextEvent() {
    if (eventLock || gameData.gameOver) return;
    eventLock = true;

    eventFeedback.className = 'feedback-hidden';
    eventFeedback.innerHTML = '';
    resetChanges();

    if (gameData.sequenceIndex >= eventSequence.length) {
        gameData.allEventsCompleted = true;
        eventLock = false;
        checkFinalEnding();
        return;
    }

    const step = eventSequence[gameData.sequenceIndex];
    gameData.sequenceIndex++;

    if (step.type === 'daily') {
        const daily = dailyEventsMap[step.id];
        if (daily) {
            showDaily(daily);
        } else {
            eventLock = false;
            startNextEvent();
        }
    } else if (step.type === 'mainline') {
        const mainIndex = parseInt(step.id.replace('M', '')) - 1;
        const main = mainlineEvents[mainIndex];
        if (main) {
            showMainline(main);
        } else {
            eventLock = false;
            startNextEvent();
        }
    } else if (step.type === 'accident') {
        const accident = accidentEventsMap[step.id];
        if (accident) {
            showAccident(accident);
        } else {
            eventLock = false;
            startNextEvent();
        }
    }
}

function continueToNext() {
    if (gameData.gameOver) return;
    gameData.month += 1;
    updateUI();
    eventLock = false;
    startNextEvent();
}

// ---------- 显示事件 ----------
function showDaily(event) {
    eventContent.innerHTML = `
        <div class="event-title">📋 ${event.title}</div>
        <div class="event-desc">${event.desc}</div>
    `;
    eventOptions.innerHTML = '';
    event.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'event-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            disableOptions();
            opt.effect();
            showFeedbackWithContinue();
            updateUI();
        });
        eventOptions.appendChild(btn);
    });
    eventFeedback.className = 'feedback-hidden';
}

function showMainline(event) {
    const isFinal = event.isFinal || false;
    eventContent.innerHTML = `
        <div class="event-title" style="color:#b388ff;">✦ ${event.title}</div>
        <div class="event-desc">${event.desc}</div>
        ${isFinal ? '<div class="event-flavor" style="color:#ffab40;">—— 这是最后的节点 ——</div>' : ''}
    `;
    eventOptions.innerHTML = '';
    event.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'event-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            disableOptions();
            opt.effect();
            if (isFinal && opt.label.includes('为什么')) {
                setTimeout(() => {
                    enableOptions();
                    eventFeedback.className = 'feedback-hidden';
                    setTimeout(() => {
                        if (!gameData.gameOver) {
                            continueToNext();
                        }
                    }, 300);
                }, 600);
                return;
            }
            showFeedbackWithContinue();
            updateUI();
        });
        eventOptions.appendChild(btn);
    });
    eventFeedback.className = 'feedback-hidden';
}

function showAccident(event) {
    eventContent.innerHTML = `
        <div class="event-title" style="color:#ff6b6b;">⚡ ${event.title}</div>
        <div class="event-desc">${event.desc}</div>
    `;
    eventOptions.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'event-option-btn';
    btn.textContent = '😰 …继续';
    btn.addEventListener('click', function() {
        if (this.disabled) return;
        this.disabled = true;
        event.effect();
        showAccidentFeedbackWithContinue();
        updateUI();
    });
    eventOptions.appendChild(btn);
    eventFeedback.className = 'feedback-hidden';
}

// ---------- 格式化变化值 ----------
function formatChange(val) {
    if (val === 0) return '<span style="color:#556688;">0</span>';
    if (val > 0) return `<span style="color:#00e676;">+${val}</span>`;
    return `<span style="color:#ff6b6b;">${val}</span>`;
}

// ---------- 带"继续"按钮的反馈（显示变化值） ----------
function showFeedbackWithContinue() {
    const fb = eventFeedback;
    const c = lastChanges;
    fb.className = 'feedback-visible';

    let html = '<div style="font-weight:600;margin-bottom:8px;">变化</div>';
    html += `<div style="font-size:13px;line-height:2;">`;

    // 生存点
    if (c.survival !== 0) {
        html += `生存点 ${formatChange(c.survival)}<br>`;
    }
    // San值
    if (c.san !== 0) {
        html += `San值 ${formatChange(c.san)}<br>`;
    }
    // 好感度
    if (c.boss !== 0) {
        html += `老大好感 ${formatChange(c.boss)}<br>`;
    }
    if (c.crow !== 0) {
        html += `乌鸦好感 ${formatChange(c.crow)}<br>`;
    }
    if (c.alish !== 0) {
        html += `阿利什好感 ${formatChange(c.alish)}<br>`;
    }

    // 如果没有任何变化
    if (c.survival === 0 && c.san === 0 && c.boss === 0 && c.crow === 0 && c.alish === 0) {
        html += `<span style="color:#556688;">无变化</span><br>`;
    }

    html += `</div>`;
    html += `<button id="continueBtn" class="btn-continue">继续 →</button>`;

    fb.innerHTML = html;

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            this.disabled = true;
            this.textContent = '加载中...';
            fb.className = 'feedback-hidden';
            setTimeout(() => {
                if (!gameData.gameOver) {
                    continueToNext();
                }
            }, 200);
        });
    }
}

function showAccidentFeedbackWithContinue() {
    const fb = eventFeedback;
    const c = lastChanges;
    fb.className = 'feedback-visible';

    let html = '<div style="font-weight:600;margin-bottom:8px;color:#ff6b6b;">⚡ 意外影响</div>';
    html += `<div style="font-size:13px;line-height:2;">`;

    if (c.survival !== 0) {
        html += `生存点 ${formatChange(c.survival)}<br>`;
    }
    if (c.san !== 0) {
        html += `San值 ${formatChange(c.san)}<br>`;
    }
    if (c.boss !== 0) {
        html += `老大好感 ${formatChange(c.boss)}<br>`;
    }
    if (c.crow !== 0) {
        html += `乌鸦好感 ${formatChange(c.crow)}<br>`;
    }
    if (c.alish !== 0) {
        html += `阿利什好感 ${formatChange(c.alish)}<br>`;
    }

    html += `</div>`;
    html += `<button id="continueBtn" class="btn-continue">继续 →</button>`;

    fb.innerHTML = html;

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            this.disabled = true;
            this.textContent = '加载中...';
            fb.className = 'feedback-hidden';
            setTimeout(() => {
                if (!gameData.gameOver) {
                    continueToNext();
                }
            }, 200);
        });
    }
}

function disableOptions() {
    document.querySelectorAll('.event-option-btn').forEach(b => b.disabled = true);
}

function enableOptions() {
    document.querySelectorAll('.event-option-btn').forEach(b => b.disabled = false);
}

// ---------- 启动 ----------
document.addEventListener('DOMContentLoaded', function() {
    survivalDisplay.textContent = '??';
    sanDisplay.textContent = '??';
    confirmBtn.disabled = true;
});