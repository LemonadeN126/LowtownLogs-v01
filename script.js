// ===========================
// 下城区日志 · script.js
// 完整版 v3.0（硬编码事件顺序）
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
    chosenRoute: null,
    routeLocked: false,
    triggeredAccidents: [],
    fragmentsTriggered: [],
    finalEndingType: null,
    // 阶段控制
    currentPhase: 0,
    phaseEventIndex: 0
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

// ---------- 工具函数 ----------
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function pick(arr) {
    return arr[rand(0, arr.length - 1)];
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
    runPhase();
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

// ---------- 数值修改 ----------
function addSurvival(v) {
    gameData.survival = clamp(gameData.survival + v, 0, 100);
    updateUI();
    if (gameData.survival <= 0) {
        showEnding('💀 很抱歉你去世了', '下城区的霓虹灯还在闪烁，但你已经看不到了。', 'death');
    }
}

function addSan(v) {
    gameData.san = clamp(gameData.san + v, 0, 100);
    updateUI();
    if (gameData.san <= 0) {
        showEnding('💀 很抱歉你去世了', '下城区的霓虹灯还在闪烁，但你已经看不到了。', 'death');
    }
}

function addBond(who, v) {
    if (gameData.gameOver) return;
    const key = who + 'Bond';
    const lockKey = who + 'Locked';
    if (gameData[lockKey]) return;
    gameData[key] = clamp(gameData[key] + v, 0, 100);
    if (gameData[key] >= 80) {
        gameData[lockKey] = true;
    }
    updateUI();
}

function showEnding(title, desc, type) {
    if (gameData.gameOver) return;
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

// ================================================================
// 碎片数据
// ================================================================

const fragmentData = {
    'fragM1': {
        title: '❄️ 那个冬天',
        content: `老大从追债的房子里跑出来的时候，身上只有一件薄外套。\n\n他在下城区的巷子里绕了半夜，踢到一团蜷在墙角的东西。\n\n低头一看，是个小孩。瘦得皮包骨，耳际还有没换完的绒毛——像一只被人从窝里丢出来的鸟崽子。\n\n老大蹲下来，小孩没躲，只是抬眼看了他一下，又垂下眼皮。\n\n老大伸手把他捞了起来。\n\n小孩轻得不像话，缩在他怀里，微微有一丝温热。\n\n老大想：鸟宝宝，当暖手宝揣着也行。\n\n他没想太多。他那时候也才十七岁。捡到的鸟崽子就是他当时拥有的所有。\n\n很多事情他都是后来才懂的。`
    },
    'fragM2': {
        title: '🩺 黑诊所的代价',
        content: `乌鸦流落到这个街区的时候，黑诊所里还躺着前任医生的尸体。\n\n他刚处理完。还没来得及喘口气，门口就有人来收保护费。\n\n乌鸦摸了摸口袋——只剩手上那枚婚戒了。\n\n他把戒指摘下来攥在手里，打算硬拼。\n\n门外有人替他把人打发了。\n\n敲门声响起来，乌鸦攥着戒指没松手。\n\n老大推门进来，身后跟着一个安安静静的小孩。\n\n"你是医生？"老大问。\n\n乌鸦没点头也没摇头。\n\n"帮我养他。"老大把小孩往前推了一点，"我给你挡麻烦。"\n\n乌鸦看了看小孩——瘦，安静，眼神不像活人，耳后有一点绒羽，是只鸟崽子。\n\n乌鸦心神恍惚了一下，盯着小孩。\n\n老大警惕地把小孩揽到身后，乌鸦才回过神，又看了看老大——身上有伤，眼神太沉。\n\n他把戒指戴回无名指上。\n\n"…进来吧。"\n\n他不收钱。他也不知道为什么。`
    },
    'fragM5': {
        title: '🥛 什么是家',
        content: `阿利什对以前的记忆已经模糊了。\n\n他只记得冷。记得饿。记得没有人叫他。\n\n后来有一双手把他捞起来。那双手很凉，但至少有温度。\n\n再后来，他被放在一个黑漆漆的房间里，有一个穿白衣服的人盯着他看了很久，然后开始喂他吃东西。\n\n他不认识"家"这个字。但他在绘本上见过——画里有大人，有小孩，围着一张桌子吃饭。\n\n阿利什对照了一下自己身边的人：\n\n乌鸦年纪最大，会做饭。乌鸦是爸爸。\n\n老大没有乌鸦年纪大，老大是哥哥。\n\n然后他转头看正在喝酸奶的你。\n\n"你是姐姐还是妈妈？"\n\n他问得很认真。\n\n你一口酸奶差点呛出来。`
    },
    'fragM7': {
        title: '🗡️ 手术刀落地的声音',
        content: `老大离开后，乌鸦一个人在诊室里坐了很久。\n\n他低头把脸埋在手里，指节泛白。\n\n他知道老大提的方案是合理的——联姻、洗白、新身份。对所有人都好。\n\n但他做不到。\n\n他曾经也有过一个家。他曾经也有过一个人愿意为他做任何事。\n\n后来那个人死了。被他连累的。\n\n他从此再也没有想过"重新开始"这件事。\n\n他没有解释原因。他只是把手术刀摔在了桌子上。\n\n然后说："不行。"\n\n老大沉默了很久。最后说："对不起。"\n\n乌鸦没有抬头。他不敢让老大看到自己的脸。`
    },
    'fragM9A': {
        title: '🔥 没有靠山的人',
        content: `野火的领导者和老大并排站着，看着下城区远处影影绰绰的霓虹。\n\n"你知道现在是什么局面吗？"野火的人开口，声音沙哑，"大帮派全是财阀的狗。狼爪背后是政部，暗星背后是科技公司，白十字直接替研究所收人——收的那种人，进去了就出不来。"\n\n野火的人转头看老大："你背后有谁？"\n\n老大没说话。\n\n"你什么都没有。"野火的人说，"你只有一家破诊所，一个医生，一个小孩，还有一群跟着你吃饭的兄弟。"\n\n"这不够。"\n\n老大看着远处，过了很久才说：\n\n"我会让它够的。"`
    },
    'fragM9B': {
        title: '🦉 轻轨站台的秘密',
        content: `阿利什回到住处的时候，老大还没睡。\n\n"我要去研究所。"阿利什说。\n\n老大靠在椅背上，没问为什么。\n\n"谁安排的？"\n\n"我自己想的。"\n\n老大看了他很久，然后说："乌鸦知道吗？"\n\n"…不知道。"\n\n老大没有拦他。\n\n阿利什走之前，没敢看乌鸦的诊室。他怕自己看了一眼就走不了了。\n\n他只告诉了你。他没说为什么——但他心里清楚，他希望自己走后，你替他说。\n\n他不想瞒着乌鸦。\n\n他只是不敢当面说。`
    },
    'fragM11C': {
        title: '📸 肆意风流人物',
        content: `乌鸦坐在诊室里，看着你穿着白大褂的背影。\n\n他忽然想起很多年前。\n\n帝国皇家医学院，他跳了两级入学，是整个师门最小的一个。\n\n师傅师娘惯着他，师兄师姐让着他。他那时候性格好，嘴甜，活儿也利落，走到哪儿都有人塞东西给他吃。\n\n他整天招猫逗狗，下了课就带着同门往外跑——下城区的夜市、地上的观景台、环道边上的露天酒吧，哪儿都去过。\n\n那是他这辈子最轻快的几年。\n\n后来他遇到了一个人。追了好几年，终于把人追到手，娶回了家。\n\n乌鸦停住了回忆。低头看了看自己的手。\n\n无名指上已经空了很久了。\n\n他收回目光，重新看着你。你正低头翻课本，没注意到他在走神。`
    },
    'fragM12A': {
        title: '💊 洗白的夜谈',
        content: `深夜。老大的办公室里只有两个人。\n\n"我要开一家医药公司。"老大说。\n\n乌鸦靠着椅背，没接话。\n\n"研究所前副所长愿意搭线。科技财团那边，私生子能拉来资金。"老大把一份文件推到乌鸦面前，"你负责研发。"\n\n乌鸦翻开文件，看了几行，停住了。\n\n他抬起头："你什么时候开始计划的？"\n\n"你说'不行'那天。"\n\n乌鸦沉默了很久。然后把文件合上了。\n\n"行。"\n\n他没问更多。他只是站起来，走到门口，又停了一下。\n\n"别太激进。"\n\n"我知道。"`
    },
    'fragM12C': {
        title: '🚗 深夜的新闻',
        content: `乌鸦在雨里站着。\n\n地上3层，繁华得像另一个世界。飞环一般的驰道在高楼间穿行，车灯连成流动的线。\n\n唯有一处堵住了。\n\n三辆私家车熊熊燃烧。火光把雨丝映成橘红色。\n\n主持人站在警戒线外，声音被风声切得断断续续：\n\n"…A区临空港环道突发连环车祸…"\n\n"…帝国皇家医学院赴联邦交流团全部遇难…"\n\n"…重大外交事故…"\n\n乌鸦站在楼顶，双手插兜，面无表情。\n\n他的衬衫湿透了。脸上不知道是雨，还是别的什么。\n\n他看了很久。一直看到火被扑灭，才转身下楼。\n\n回到诊所，他在药柜前站了一会儿，把一枚旧婚戒从抽屉深处翻出来，放进了贴身的衣袋里。`
    },
    'fragM13B': {
        title: '❤️ 白菜还是猪',
        content: `阿利什回到诊所的时候，老大正在二楼帮他换晒好的被子。\n\n两人许久未见，自然滚到了一起。\n\n乌鸦那天刚好回来得早，推门进屋，没在楼下找到人，就上了二楼。\n\n推开门——然后整个人石化了。\n\n他站在原地愣了三秒。然后转身就走，走到楼梯口又折回来，指着老大："你——"\n\n又指着阿利什："你——"\n\n他语无伦次，最后只憋出一句："你们什么时候——！？"\n\n老大没说话，默默扯过被子盖住阿利什。\n\n乌鸦气得手都在抖："他今年才——你当年把人交给我的时候他才——"\n\n阿利什趁乌鸦骂老大的空隙，悄悄从床上溜下来，光着脚从窗户翻走了。\n\n乌鸦没发现。还在骂。\n\n老大听着，脸上没什么表情，但微微有些心虚尴尬地侧过头。`
    },
    'fragM14C': {
        title: '📖 那些不在照片里的人',
        content: `晚上，你犹豫了很久，还是去敲了乌鸦的门。\n\n他开门的时候看到你，似乎并不意外。他把门让开，示意你进来。\n\n你坐在诊室的椅子上，踌躇了一会儿才开口："我看到了新闻…帝国那个交流团…"\n\n乌鸦没有说话。他把那张旧照片从抽屉里取出来，摊开在桌面上。\n\n你这才注意到，照片有折痕——像是被仔细折起了一半。\n\n他把折起的那一半展开。照片上，一个优雅的女子肚子微微隆起，怀里抱着一个小孩，正往穿着白大褂的年轻乌鸦怀里塞。\n\n"你师娘。"乌鸦说，语气很平。"还有你师兄，当时两岁。"\n\n他指了指女子隆起的腹部。\n\n"…还有你小师弟。三个月。"\n\n他停了一下。\n\n"如果当初没出事的话。"\n\n他的手指轻轻摩挲着照片上女子的脸。\n\n诊室里很安静。你什么也没说。你觉得这时候说什么都不对。\n\n你只是坐了一会儿，然后站起来，拍了拍他的肩。\n\n你的手放上去的时候，他动了一下。但他没有避开。`
    }
};

function showFragment(fragmentId) {
    if (gameData.fragmentsTriggered.includes(fragmentId)) return;
    gameData.fragmentsTriggered.push(fragmentId);

    const data = fragmentData[fragmentId];
    if (!data) return;

    const overlay = document.createElement('div');
    overlay.className = 'fragment-overlay';
    overlay.id = 'fragmentModal';

    overlay.innerHTML = `
        <div class="fragment-box">
            <div class="fragment-title">${data.title}</div>
            <div class="fragment-content">${data.content.replace(/\n/g, '<br>')}</div>
            <button class="fragment-close-btn" id="fragmentCloseBtn">✕ 收起</button>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = document.getElementById('fragmentCloseBtn');
    closeBtn.addEventListener('click', function() {
        overlay.remove();
    });

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

// ================================================================
// 硬编码事件顺序
// ================================================================

// ================================================================
// 事件定义（好感度已上调）
// ================================================================

const eventDefs = {
    // ---- 主线 ----
    'M1': {
        type: 'mainline',
        title: '隔壁搬来两个人',
        desc: '你听到隔壁铁皮棚有动静。一个少年牵着一个小孩走了进来。少年大约十七八岁，脸上带着伤，眼神却很冷静。小孩安安静静的，耳际还有未换的绒毛。小鸟崽子，你想着。',
        options: [
            { label: '👋 主动打招呼', effect: () => { addBond('boss', rand(6, 8)); } },
            { label: '🔍 先观察', effect: () => {} }
        ],
        fragment: 'fragM1'
    },
    'M2': {
        type: 'mainline',
        title: '黑诊所的医生',
        desc: '老大带着阿利什去了一间黑诊所。你认出那个医生——一个沉默寡言的中年男人，但手指很稳。他看了阿利什一眼，说："这孩子得调养。"',
        options: [
            { label: '🚶 跟过去看看', effect: () => { addBond('crow', rand(6, 8));
                    addSan(2); } },
            { label: '📌 留在原地', effect: () => {} }
        ],
        fragment: 'fragM2'
    },
    'M3': {
        type: 'mainline',
        title: '乌鸦的试探',
        desc: '乌鸦注意到了你。他偶尔会让你帮忙认药草，顺便聊几句。"你常来？"他问得漫不经心，但你知道他在观察。',
        options: [
            { label: '🌿 好好帮忙', effect: () => { addBond('crow', rand(6, 8));
                    addSan(3); } },
            { label: '😑 敷衍', effect: () => {} }
        ]
    },
    'M4': {
        type: 'mainline',
        title: '第一次跑腿',
        desc: '老大叫住你："帮我送个东西。"他递过来一个包裹，地址是野火的地盘。你接过的时候，他多看了你一眼。',
        options: [
            { label: '📦 接下', effect: () => { addSurvival(3);
                    addBond('boss', rand(6, 8)); } },
            { label: '🙅 婉拒', effect: () => {} }
        ]
    },
    'M5': {
        type: 'mainline',
        title: '阿利什的酸奶',
        desc: '某天下午，阿利什突然出现在你面前。他什么都没说，推了一杯酸奶到你手里。酸奶还是凉的。',
        options: [
            { label: '🥛 接过来喝掉', effect: () => { addBond('alish', rand(6, 8));
                    addSan(3); } },
            { label: '🙏 说谢谢但推回', effect: () => { addBond('alish', 3); } }
        ],
        fragment: 'fragM5'
    },
    'M6': {
        type: 'mainline',
        title: '乌鸦的过去',
        desc: '乌鸦喝醉了。他靠在药柜上，断断续续地提到了"帝国"、"逃出来"这样的词。你第一次看到他脸上有疲惫以外的表情。',
        options: [
            { label: '🤫 安静地听', effect: () => { addBond('crow', rand(6, 8));
                    addSan(2); } },
            { label: '❓ 追问', effect: () => { addBond('crow', 4);
                    addSan(-1); } }
        ]
    },
    'M7': {
        type: 'mainline',
        title: '手术刀落地的声音',
        desc: '你路过诊所时，听到了老大的声音，然后是乌鸦的声音。然后是什么东西落地的声音——金属的，清脆的，很响。你停下了脚步。',
        options: [
            { label: '👂 贴近门听', effect: () => { addBond('boss', 4);
                    addBond('crow', 4);
                    addSan(-2); } },
            { label: '🚶 走开', effect: () => {} }
        ],
        fragment: 'fragM7'
    },
    'M8': {
        type: 'branch',
        title: '下城区的岔路',
        desc: '下城区的冬天又来了。你站在轻轨站台边上，冷风从轨道深处灌上来。\n\n老大从野火的地盘回来，大衣上带着硝烟味。他看了你一眼，说："你大了，该自己选往哪走了。"\n\n乌鸦站在诊所门口抽烟，没看你。阿利什坐在候车长椅上，手里握着一杯没打开的酸奶。\n\n风灌进隧道。轻轨还没来。你知道他们在等你开口。',
        options: [
            { label: '🚬 走向老大', effect: () => { gameData.chosenRoute = 'boss'; } },
            { label: '🥛 走向阿利什', effect: () => { gameData.chosenRoute = 'alish'; } },
            { label: '🩺 走向乌鸦', effect: () => { gameData.chosenRoute = 'crow'; } }
        ]
    },
    // ---- 老大线 ----
    'M9A': {
        type: 'mainline',
        title: '暗流之下',
        desc: '老大带你去了野火的地盘——不是之前那种跑腿，是真的坐下来谈事情的那种。他把一杯酒推到你面前，看了你一眼："不用喝。"然后转向对面的人："他跟我来的。继续。"',
        options: [
            { label: '📋 认真听，不说话', effect: () => { addBond('boss', rand(6, 8));
                    addSan(2); } },
            { label: '❓ 开口问了一个问题', effect: () => { addBond('boss', rand(6, 8));
                    addSurvival(2); } }
        ],
        fragment: 'fragM9A'
    },
    'M10A': {
        type: 'mainline',
        title: '扩张',
        desc: '你跟着老大到-1层，见到了一个面目模糊的人。你没上谈判桌，只是在老大身后站着。终于，你认出对面的人是研究所前副所长，和科技财团董事的私生子。',
        options: [
            { label: '🗣️ 主动向老大问计划', effect: () => { addBond('boss', rand(6, 8));
                    addSan(2); } },
            { label: '🤐 沉默', effect: () => { addBond('boss', 4);
                    addSurvival(2); } }
        ]
    },
    'M11A': {
        type: 'mainline',
        title: '账本背后',
        desc: '老大把一本旧账本放在你面前。"看得懂吗？"他说。你翻开，里面是狼爪和政部的往来记录。每一笔都写着人命的价码。',
        options: [
            { label: '📖 一页一页翻完', effect: () => { addBond('boss', rand(6, 8));
                    addSan(2); } },
            { label: '✍️ 指着一处问"这是什么"', effect: () => { addBond('boss', 8);
                    addSurvival(2); } }
        ]
    },
    'M12A': {
        type: 'mainline',
        title: '集团',
        desc: '你抬头看着悬浮屏，新闻播报着研究所药剂科科长被撤职，及市面上出现的新特效药品牌。\n\n左看右看，你还是觉得新药很眼熟，似乎在乌鸦台面上红红绿绿的瓶子里见过。新医药品牌的logo也挺眼熟，似乎在阿利什的草稿纸上见过。',
        options: [
            { label: '📒 回去仔细翻账本，查看最近项目支出', effect: () => { addBond('boss', rand(6, 8));
                    addSan(3); } },
            { label: '🙈 不关我事', effect: () => { addSurvival(2); } }
        ],
        fragment: 'fragM12A'
    },
    'M13A': {
        type: 'mainline',
        title: '职业',
        desc: '老大让你从账本开始，在各个岗位轮了一圈。放在上个纪元，这可是轮值六部的太子待遇。你身手一般，算账还行，但老大对你和集团的安排似乎另有打算。',
        options: [
            { label: '✅ 表示接受安排', effect: () => { addBond('boss', 8);
                    addSan(2); } },
            { label: '🤐 沉默以示对高强度打工的抗议', effect: () => { addBond('boss', 4);
                    addSurvival(3); } }
        ]
    },
    'M14A': {
        type: 'routeEnd',
        title: '新生活',
        desc: '管账的活儿还是被老大自己接了回去。最近乌鸦和老大都神神秘秘的，阿利什好像也知道些什么。直到你生日这天，拆开礼物，看到了一张联邦中心大学法学院的录取通知书、一套一刀下去只能捅到合同法的《联邦民法总论》，和一张集团法务部的实习工牌。',
        options: [
            { label: '🗣️ 询问——老大我以后要负责继续帮集团洗白上市吗', effect: () => { addBond('boss', rand(6, 8));
                    addSan(2); } },
            { label: '😫 抗议——谁家大学生入学前就先去打工实习啊', effect: () => { addBond('boss', 4);
                    addSurvival(3); } }
        ]
    },
    // ---- 阿利什线 ----
    'M9B': {
        type: 'mainline',
        title: '研究所前夜',
        desc: '"我要去研究所了。"阿利什说这句话的时候看着轻轨轨道，没有看你。"卧底。老大安排的。乌鸦不知道。"停了一下。"你能在我走后，找时间告诉乌鸦吗？"',
        options: [
            { label: '✅ "好。"', effect: () => { addBond('alish', 8);
                    addSan(3); } },
            { label: '❓ "什么时候回来？"', effect: () => { addBond('alish', rand(6, 8));
                    addSan(2); } }
        ],
        fragment: 'fragM9B'
    },
    'M10B': {
        type: 'mainline',
        title: '来信',
        desc: '你收到一封没有署名的信，地址是研究所的内部邮箱，上面是阿利什的字迹："研究所已经安全了。"阿利什划掉了几行字，最终简洁地问："你来不来。"',
        options: [
            { label: '😊 好啊——想到能和阿利什成为同事，你很开心', effect: () => { addBond('alish', 8);
                    addSan(3); } },
            { label: '😧 震撼——什么叫"研究所已经安全了"你不敢懂', effect: () => { addBond('alish', rand(6, 8));
                    addSurvival(2); } }
        ]
    },
    'M11B': {
        type: 'mainline',
        title: '同事二五仔',
        desc: '你心惊胆战地和阿利什一起在研究所混日子。\n\n好吧其实只有你在混日子，阿利什已经从实习助理一路干到了低级研究员。他很少有表情，也没什么普世价值观，格外适合研究所的氛围。',
        options: [
            { label: '📩 和阿利什一起卷', effect: () => { addBond('alish', rand(6, 8));
                    addSan(3); } },
            { label: '✍️ 继续当咸鱼', effect: () => { addBond('alish', 8);
                    addSurvival(2); } }
        ]
    },
    'M12B': {
        type: 'mainline',
        title: '回家',
        desc: '轻轨车门打开，你和阿利什走下来，回到熟悉的街区。半夜阿利什把你叫醒，拎起你就跑，一路从上三层跑回地下，你才想起来问。"唔…我干了点事。"阿利什含混地说，"过两天你看新闻吧。"',
        options: [
            { label: '🥛 "你到底干什么了啊！"', effect: () => { addBond('alish', 8);
                    addSan(3); } },
            { label: '🤝 默默回家', effect: () => { addBond('alish', rand(6, 8));
                    addSurvival(2); } }
        ]
    },
    'M13B': {
        type: 'mainline',
        title: '午后',
        desc: '你津津有味地趴在窗口，看着对面诊所里，乌鸦指着阿利什训。从昨天的新闻里，你终于知道阿利什为什么拉着你跑路了，因为他炸了研究所样本库。\n\n诶但是，怎么老大也开始挨骂了？你疑惑地探头，发现阿利什不知道什么时候溜走了。',
        options: [
            { label: '😊 去找阿利什问问', effect: () => { addBond('alish', 8);
                    addSan(3); } },
            { label: '😧 继续看热闹', effect: () => { addBond('alish', rand(6, 8));
                    addSurvival(2); } }
        ],
        fragment: 'fragM13B'
    },
    'M14B': {
        type: 'routeEnd',
        title: '重新入职',
        desc: '随着老大的帮派——现在该叫集团了——逐步洗白，通过资金捐赠，在研究所也有了一定的份额。老大派你和阿利什去研究所待着，占两个名额。',
        options: [
            { label: '😊 高高兴兴入职', effect: () => { addBond('alish', 8);
                    addSan(3); } },
            { label: '🚗 被打包塞上车', effect: () => { addBond('alish', rand(6, 8));
                    addSurvival(2); } }
        ]
    },
    // ---- 乌鸦线 ----
    'M9C': {
        type: 'mainline',
        title: '深夜诊室',
        desc: '深夜，诊所的灯还亮着。乌鸦在灯下缝一个伤口的皮肤，针脚细得像他在做一件手艺活。"过来，"他头也没抬，"看清楚。下次你来缝。"',
        options: [
            { label: '🔪 凑近认真看', effect: () => { addBond('crow', rand(6, 8));
                    addSan(2); } },
            { label: '🩹 递给他一把干净的钳子', effect: () => { addBond('crow', rand(6, 8));
                    addSurvival(2); } }
        ]
    },
    'M10C': {
        type: 'mainline',
        title: '帝国的碎片',
        desc: '乌鸦翻出一张旧照片，边缘已经发黄。照片上是一间办公室，比他现在的诊所大很多也整洁得多，办公桌后坐着一个穿着白大褂的年轻人——年轻版的乌鸦。',
        options: [
            { label: '🗣️ 试着询问照片', effect: () => { addBond('crow', rand(6, 8));
                    addSan(2); } },
            { label: '🤐 什么都不问', effect: () => { addBond('crow', 4);
                    addSurvival(2); } }
        ]
    },
    'M11C': {
        type: 'mainline',
        title: '白大褂',
        desc: '乌鸦把一件白大褂放在诊桌上。"你的。穿上试试。"他说这句话的时候没有抬头，但你知道他等这一刻等了很久——他从来没有正式收过学生。',
        options: [
            { label: '🧥 穿上，一句话没说', effect: () => { addBond('crow', 8);
                    addSan(3); } },
            { label: '🙏 "谢谢。"', effect: () => { addBond('crow', rand(6, 8));
                    addSurvival(2); } }
        ],
        fragment: 'fragM11C'
    },
    'M12C': {
        type: 'mainline',
        title: '新闻',
        desc: '乌鸦开着悬浮屏播报新闻当背景音，突然他猛地抬头。"…帝国皇家医学院附属第一医院，院长及两名心外科专家前来交流…"主持人板正的声音里，你转头看到乌鸦垂下眼，捏了捏手骨。',
        options: [
            { label: '🗣️ 试着询问乌鸦', effect: () => { addBond('crow', rand(6, 8));
                    addSan(2); } },
            { label: '🤔 自己默默思考', effect: () => { addBond('crow', 4);
                    addSurvival(2); } }
        ],
        fragment: 'fragM12C'
    },
    'M13C': {
        type: 'mainline',
        title: '名字',
        desc: '诊室里很安静，你在看医学课本和乌鸦给你的教案。乌鸦从门口走进来，站在你旁边看着你写笔记，忽然说了一句："我本名叫沈文。"他指了指课本封面总责编后面那个名字，"这个沈文。"',
        options: [
            { label: '📝 "我记住了。"', effect: () => { addBond('crow', 8);
                    addSan(3); } },
            { label: '😧 震撼愣住', effect: () => { addBond('crow', rand(6, 8));
                    addSurvival(2); } }
        ]
    },
    'M14C': {
        type: 'routeEnd',
        title: '传承',
        desc: '"你出师了。"乌鸦说这句话的时候语气很平，但他在擦眼镜——他紧张的时候才会擦眼镜。"以后不用叫我老师了。"停了一下。"……但你想叫也可以。"',
        options: [
            { label: '🧑‍🏫 "老师。"', effect: () => { addBond('crow', 8);
                    addSan(3); } },
            { label: '🤝 "谢了。"', effect: () => { addBond('crow', rand(6, 8));
                    addSurvival(2); } }
        ],
        fragment: 'fragM14C'
    },
    'M15': {
        type: 'finale',
        title: '十年之后',
        desc: '你站在下城区边缘。身后是铁皮棚和轻轨，身前是通往地上的阶梯。\n\n老大、乌鸦、阿利什站在你面前。\n\n老大说："走吧，回地上。"\n\n你回头看了一下。轻轨还在下城区穿梭，霓虹灯还在闪。\n\n你没有犹豫。你走过去了。',
        options: [
            { label: '✅ 点头', effect: () => {
                    gameData.allEventsCompleted = true;
                    checkFinalEnding();
                } }
        ]
    },
    // ---- 日常（好感度 4-6） ----
    'D1': {
        type: 'daily',
        title: '帮乌鸦打扫诊所',
        desc: '乌鸦的诊所有几天没收拾了，药柜上落了一层灰。他难得没有赶人，只是抬了抬下巴示意你帮忙。',
        options: [
            { label: '🧹 帮忙打扫', effect: () => { addSurvival(2);
                    addSan(1);
                    addBond('crow', rand(4, 6)); } },
            { label: '🚶 装作没看见', effect: () => {} }
        ]
    },
    'D2': {
        type: 'daily',
        title: '轻轨偶遇阿利什',
        desc: '轻轨车厢里人不多，你看到阿利什一个人坐在角落，手里捧着一杯酸奶。他似乎在发呆。',
        options: [
            { label: '🪑 坐到他旁边', effect: () => { addBond('alish', rand(4, 6));
                    addSan(1); } },
            { label: '📏 隔一个座位坐下', effect: () => { addBond('alish', rand(2, 3)); } }
        ]
    },
    'D3': {
        type: 'daily',
        title: '下城区停电',
        desc: '整个街区陷入黑暗。邻居们在走廊里点起蜡烛，昏黄的光在铁皮棚之间摇晃。',
        options: [
            { label: '🔧 帮邻居修电路', effect: () => { addSurvival(3);
                    addSan(1); } },
            { label: '🏥 去黑诊所看看乌鸦', effect: () => { addBond('crow', rand(4, 6)); } }
        ]
    },
    'D4': {
        type: 'daily',
        title: '替老大跑腿',
        desc: '老大叫住你，递过来一个封好的信封。"送到野火的地盘，别让人看到。"',
        options: [
            { label: '📬 接下任务', effect: () => { addSurvival(2);
                    addBond('boss', rand(4, 6)); } },
            { label: '🙅 推脱', effect: () => {} }
        ]
    },
    'D5': {
        type: 'daily',
        title: '黑市换物资',
        desc: '下城区的黑市今天人很多，你需要换一批生存物资。',
        options: [
            { label: '🔩 用旧零件换', effect: () => { addSurvival(2);
                    addSan(1); } },
            { label: '📦 帮忙搬运货物抵债', effect: () => { addSurvival(3); } }
        ]
    },
    'D6': {
        type: 'daily',
        title: '乌鸦教你认药',
        desc: '乌鸦难得有耐心，指着药柜上的干草标本，一个一个讲给你听。',
        options: [
            { label: '📖 认真学', effect: () => { addSan(3);
                    addBond('crow', rand(4, 6)); } },
            { label: '😴 走神', effect: () => {} }
        ]
    },
    'D7': {
        type: 'daily',
        title: '阿利什推来酸奶',
        desc: '你正蹲在门口发呆，阿利什走过来，把一杯酸奶放在你脚边，转身走了。',
        options: [
            { label: '🥛 接过来喝掉', effect: () => { addBond('alish', rand(5, 6));
                    addSan(2); } },
            { label: '↩️ 推回去', effect: () => { addBond('alish', 2); } }
        ]
    },
    'D8': {
        type: 'daily',
        title: '火并后的清晨',
        desc: '昨夜下城区又有一场火并。街道上残留着痕迹，空气里有淡淡的金属味。',
        options: [
            { label: '🧹 帮忙清理', effect: () => { addSurvival(2);
                    addBond('boss', rand(3, 5)); } },
            { label: '🔄 绕道走', effect: () => {} }
        ]
    },
    'D9': {
        type: 'daily',
        title: '乌鸦熬夜',
        desc: '诊所的灯还亮着，乌鸦又熬了一夜。你路过时，看到他的侧影映在窗上。',
        options: [
            { label: '☕ 送一杯热水', effect: () => { addBond('crow', rand(4, 6));
                    addSan(1); } },
            { label: '🚶 不管', effect: () => {} }
        ]
    },
    'D10': {
        type: 'daily',
        title: '轻轨报站异常',
        desc: '轻轨的广播系统出了故障，重复播着同一句话："下一站是…下一站是…"',
        options: [
            { label: '🔊 去找维修员', effect: () => { addSurvival(1);
                    addSan(2); } },
            { label: '🙉 忽略', effect: () => { addSan(-1); } }
        ]
    },
    'D11': {
        type: 'daily',
        title: '帮老大整理账本',
        desc: '老大把一堆旧账本扔在桌上："按年份排好。别偷看。"说完就走了。',
        options: [
            { label: '📒 老老实实整理', effect: () => { addSurvival(2);
                    addBond('boss', rand(4, 6)); } },
            { label: '👀 翻了几页再排', effect: () => { addBond('boss', rand(2, 3));
                    addSan(1); } }
        ]
    },
    'D12': {
        type: 'daily',
        title: '阿利什在轻轨站等你',
        desc: '你路过轻轨站时，看到阿利什坐在长椅上。他没看你，但他面前放了两杯酸奶。',
        options: [
            { label: '🥛 坐过去拿了一杯', effect: () => { addBond('alish', rand(4, 6));
                    addSan(1); } },
            { label: '🚶 假装没看见', effect: () => {} }
        ]
    },
    'D13': {
        type: 'daily',
        title: '帮老大探听消息',
        desc: '老大递给你一张纸条："去野火的地盘，找这个人。问他最近谁在找我们麻烦。别让人注意到你。"你接过纸条塞进袖口，点了点头。',
        options: [
            { label: '🔍 去野火地盘打探', effect: () => { addBond('boss', rand(4, 6));
                    addSurvival(2); } },
            { label: '🚶 转了一圈就回来', effect: () => { addBond('boss', 2); } }
        ]
    },
    'D14': {
        type: 'daily',
        title: '下城区大雨',
        desc: '下城区难得下一场大雨，雨水从铁皮棚的缝隙里漏下来。你在屋檐下躲雨，看到有人从雨里跑过来。',
        options: [
            { label: '☂️ 递伞给路过的人', effect: () => { addSurvival(1);
                    addSan(2); } },
            { label: '🏃 跑进诊所躲雨', effect: () => { addBond('crow', rand(2, 3));
                    addSan(1); } }
        ]
    },
    'D15': {
        type: 'daily',
        title: '三人一起吃晚饭',
        desc: '乌鸦难得做了一桌菜。老大坐在桌边，阿利什端着酸奶坐在角落。气氛很安静，但你知道他们都习惯了。',
        options: [
            { label: '🪑 坐老大旁边', effect: () => { addBond('boss', rand(4, 6));
                    addSan(1); } },
            { label: '🪑 坐阿利什旁边', effect: () => { addBond('alish', rand(4, 6));
                    addSan(1); } },
            { label: '🪑 坐乌鸦旁边', effect: () => { addBond('crow', rand(4, 6));
                    addSan(1); } }
        ]
    },
    // ---- 意外（不变） ----
    'E1': {
        type: 'accident',
        title: '⚠️ 下层塌方',
        desc: '下城区-10层发生了塌方。你差点被困在里面，跑出来时满身灰尘。',
        effect: () => { addSurvival(-rand(5, 10)); }
    },
    'E2': {
        type: 'accident',
        title: '⚠️ 变异体出没',
        desc: '轻轨站附近出现了变异体。你被波及，虽然逃了出来，但精神受到了冲击。',
        effect: () => { addSan(-rand(5, 10)); }
    },
    'E3': {
        type: 'accident',
        title: '⚠️ 仇家上门',
        desc: '有人找到了黑诊所门口。乌鸦让你躲进密室，你听到外面有打斗声。',
        effect: () => { addBond('crow', 3);
                addSurvival(-3); }
    },
    'E4': {
        type: 'accident',
        title: '⚠️ 老大受伤',
        desc: '老大在一次任务中受了伤。你帮忙送药过去，他看了你一眼，什么也没说。',
        effect: () => { addBond('boss', 4);
                addSurvival(-2); }
    },
    'E5': {
        type: 'accident',
        title: '⚠️ 黑市暴动',
        desc: '黑市连续一周无法正常交易。你只能省着点用。',
        effect: () => { addSurvival(-rand(5, 8));
                addSan(-3); }
    }
};

// ================================================================
// 阶段定义（硬编码事件顺序）
// ================================================================

const routePhases = {
    // ---- 共同线（M1-M8） ----
    common: [
        // 阶段0: M1
        { events: ['M1'] },
        // 阶段1: D7
        { events: ['D7'] },
        // 阶段2: D2
        { events: ['D2'] },
        // 阶段3: D11
        { events: ['D11'] },
        // 阶段4: M2
        { events: ['M2'] },
        // 阶段5: D1
        { events: ['D1'] },
        // 阶段6: D12
        { events: ['D12'] },
        // 阶段7: D13 → E1
        { events: ['D13', 'E1'] },
        // 阶段8: M3
        { events: ['M3'] },
        // 阶段9: D3
        { events: ['D3'] },
        // 阶段10: D6
        { events: ['D6'] },
        // 阶段11: D9
        { events: ['D9'] },
        // 阶段12: M4
        { events: ['M4'] },
        // 阶段13: D4
        { events: ['D4'] },
        // 阶段14: D14
        { events: ['D14'] },
        // 阶段15: D10 → E2
        { events: ['D10', 'E2'] },
        // 阶段16: M5
        { events: ['M5'] },
        // 阶段17: D5
        { events: ['D5'] },
        // 阶段18: D8
        { events: ['D8'] },
        // 阶段19: D15
        { events: ['D15'] },
        // 阶段20: M6
        { events: ['M6'] },
        // 阶段21: D12
        { events: ['D12'] },
        // 阶段22: D13
        { events: ['D13'] },
        // 阶段23: D1 → E3
        { events: ['D1', 'E3'] },
        // 阶段24: M7
        { events: ['M7'] },
        // 阶段25: D2
        { events: ['D2'] },
        // 阶段26: D3
        { events: ['D3'] },
        // 阶段27: D6
        { events: ['D6'] },
        // 阶段28: M8（分支点）
        { events: ['M8'] }
    ],
    // ---- 老大线 ----
    boss: [
        // 阶段29: M9A
        { events: ['M9A'] },
        // 阶段30: D4
        { events: ['D4'] },
        // 阶段31: D11
        { events: ['D11'] },
        // 阶段32: D8 → E4
        { events: ['D8', 'E4'] },
        // 阶段33: M10A
        { events: ['M10A'] },
        // 阶段34: D7
        { events: ['D7'] },
        // 阶段35: D14
        { events: ['D14'] },
        // 阶段36: D9
        { events: ['D9'] },
        // 阶段37: M11A
        { events: ['M11A'] },
        // 阶段38: D5
        { events: ['D5'] },
        // 阶段39: D10
        { events: ['D10'] },
        // 阶段40: D15 → E5
        { events: ['D15', 'E5'] },
        // 阶段41: M12A
        { events: ['M12A'] },
        // 阶段42: D1
        { events: ['D1'] },
        // 阶段43: D2
        { events: ['D2'] },
        // 阶段44: D12
        { events: ['D12'] },
        // 阶段45: M13A
        { events: ['M13A'] },
        // 阶段46: D3
        { events: ['D3'] },
        // 阶段47: D6
        { events: ['D6'] },
        // 阶段48: D13
        { events: ['D13'] },
        // 阶段49: M14A
        { events: ['M14A'] },
        // 阶段50: M15
        { events: ['M15'] }
    ],
    // ---- 阿利什线 ----
    alish: [
        // 阶段29: M9B
        { events: ['M9B'] },
        // 阶段30: D7
        { events: ['D7'] },
        // 阶段31: D2
        { events: ['D2'] },
        // 阶段32: D12 → E4
        { events: ['D12', 'E4'] },
        // 阶段33: M10B
        { events: ['M10B'] },
        // 阶段34: D5
        { events: ['D5'] },
        // 阶段35: D14
        { events: ['D14'] },
        // 阶段36: D8
        { events: ['D8'] },
        // 阶段37: M11B
        { events: ['M11B'] },
        // 阶段38: D4
        { events: ['D4'] },
        // 阶段39: D10
        { events: ['D10'] },
        // 阶段40: D15 → E5
        { events: ['D15', 'E5'] },
        // 阶段41: M12B
        { events: ['M12B'] },
        // 阶段42: D1
        { events: ['D1'] },
        // 阶段43: D9
        { events: ['D9'] },
        // 阶段44: D13
        { events: ['D13'] },
        // 阶段45: M13B
        { events: ['M13B'] },
        // 阶段46: D3
        { events: ['D3'] },
        // 阶段47: D6
        { events: ['D6'] },
        // 阶段48: D11
        { events: ['D11'] },
        // 阶段49: M14B
        { events: ['M14B'] },
        // 阶段50: M15
        { events: ['M15'] }
    ],
    // ---- 乌鸦线 ----
    crow: [
        // 阶段29: M9C
        { events: ['M9C'] },
        // 阶段30: D1
        { events: ['D1'] },
        // 阶段31: D9
        { events: ['D9'] },
        // 阶段32: D13 → E4
        { events: ['D13', 'E4'] },
        // 阶段33: M10C
        { events: ['M10C'] },
        // 阶段34: D6
        { events: ['D6'] },
        // 阶段35: D15
        { events: ['D15'] },
        // 阶段36: D3
        { events: ['D3'] },
        // 阶段37: M11C
        { events: ['M11C'] },
        // 阶段38: D4
        { events: ['D4'] },
        // 阶段39: D5
        { events: ['D5'] },
        // 阶段40: D8 → E5
        { events: ['D8', 'E5'] },
        // 阶段41: M12C
        { events: ['M12C'] },
        // 阶段42: D2
        { events: ['D2'] },
        // 阶段43: D7
        { events: ['D7'] },
        // 阶段44: D12
        { events: ['D12'] },
        // 阶段45: M13C
        { events: ['M13C'] },
        // 阶段46: D10
        { events: ['D10'] },
        // 阶段47: D11
        { events: ['D11'] },
        // 阶段48: D14
        { events: ['D14'] },
        // 阶段49: M14C
        { events: ['M14C'] },
        // 阶段50: M15
        { events: ['M15'] }
    ]
};

// 当前使用的阶段列表
let currentPhases = [];

// 当前阶段内的事件索引
let eventIndexInPhase = 0;

// ---------- 阶段运行逻辑 ----------
let isProcessing = false;

function runPhase() {
    if (isProcessing || gameData.gameOver) return;
    isProcessing = true;

    // 检查是否所有事件已完成
    if (gameData.allEventsCompleted) {
        isProcessing = false;
        return;
    }

    // 确定当前使用的阶段列表
    if (!currentPhases.length) {
        // 初始使用共同线
        currentPhases = routePhases.common;
        gameData.currentPhase = 0;
        eventIndexInPhase = 0;
    }

    // 检查是否已完成所有阶段
    if (gameData.currentPhase >= currentPhases.length) {
        // 如果已完成共同线，检查是否已选择路线
        if (gameData.chosenRoute) {
            // 进入对应支线
            const routeMap = {
                'boss': routePhases.boss,
                'alish': routePhases.alish,
                'crow': routePhases.crow
            };
            currentPhases = routeMap[gameData.chosenRoute] || routePhases.boss;
            gameData.currentPhase = 0;
            eventIndexInPhase = 0;
            // 重新执行
            isProcessing = false;
            runPhase();
            return;
        } else {
            // 没有选择路线，但共同线已完成——理论上不会发生，因为M8会设置路线
            isProcessing = false;
            return;
        }
    }

    // 获取当前阶段
    const phase = currentPhases[gameData.currentPhase];
    if (!phase || !phase.events || phase.events.length === 0) {
        // 空阶段，跳过
        gameData.currentPhase++;
        eventIndexInPhase = 0;
        isProcessing = false;
        runPhase();
        return;
    }

    // 获取当前事件ID
    const eventId = phase.events[eventIndexInPhase];
    if (!eventId) {
        // 当前阶段所有事件已完成，进入下一阶段
        gameData.currentPhase++;
        eventIndexInPhase = 0;
        isProcessing = false;
        runPhase();
        return;
    }

    // 获取事件定义
    const eventDef = eventDefs[eventId];
    if (!eventDef) {
        // 事件未定义，跳过
        eventIndexInPhase++;
        isProcessing = false;
        runPhase();
        return;
    }

    // ---- 显示事件 ----
    if (eventDef.type === 'daily') {
        showDailyEvent(eventDef, () => {
            // 完成后，推进到下一个事件
            eventIndexInPhase++;
            // 月数+1（日常消耗1个月）
            gameData.month += 1;
            updateUI();
            isProcessing = false;
            runPhase();
        });
    } else if (eventDef.type === 'mainline') {
        showMainlineEvent(eventDef, () => {
            eventIndexInPhase++;
            // 主线消耗3个月（时间跳跃）
            gameData.month += 3;
            updateUI();
            isProcessing = false;
            runPhase();
        });
    } else if (eventDef.type === 'branch') {
        showBranchEvent(eventDef, () => {
            eventIndexInPhase++;
            // 分支点消耗1个月
            gameData.month += 1;
            updateUI();
            // 标记路线已锁定
            gameData.routeLocked = true;
            // 切换阶段列表
            const routeMap = {
                'boss': routePhases.boss,
                'alish': routePhases.alish,
                'crow': routePhases.crow
            };
            currentPhases = routeMap[gameData.chosenRoute] || routePhases.boss;
            gameData.currentPhase = 0;
            eventIndexInPhase = 0;
            isProcessing = false;
            runPhase();
        });
    } else if (eventDef.type === 'accident') {
        showAccidentEvent(eventDef, () => {
            eventIndexInPhase++;
            // 意外不消耗额外月份
            updateUI();
            isProcessing = false;
            runPhase();
        });
    } else if (eventDef.type === 'routeEnd') {
        showRouteEndEvent(eventDef, () => {
            eventIndexInPhase++;
            // 支线终点消耗1个月
            gameData.month += 1;
            updateUI();
            isProcessing = false;
            runPhase();
        });
    } else if (eventDef.type === 'finale') {
        showFinaleEvent(eventDef, () => {
            eventIndexInPhase++;
            isProcessing = false;
            // 终局会触发结局判定
        });
    } else {
        // 未知类型，跳过
        eventIndexInPhase++;
        isProcessing = false;
        runPhase();
    }
}

// ---------- 事件显示函数 ----------
function showDailyEvent(eventDef, callback) {
    eventContent.innerHTML = `
        <div class="event-title">📋 ${eventDef.title}</div>
        <div class="event-desc">${eventDef.desc}</div>
    `;
    eventOptions.innerHTML = '';
    eventFeedback.className = 'feedback-hidden';

    eventDef.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'event-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            disableOptions();
            // 记录变化前的数值
            const before = captureValues();
            opt.effect();
            // 记录变化后的数值，计算差值
            const changes = calcChanges(before);
            showFeedback(eventDef, changes);
            setTimeout(() => {
                callback();
            }, 1850);
        });
        eventOptions.appendChild(btn);
    });
}

function showMainlineEvent(eventDef, callback) {
    eventContent.innerHTML = `
        <div class="event-title" style="color:#b388ff;">✦ ${eventDef.title}</div>
        <div class="event-desc">${eventDef.desc}</div>
    `;
    eventOptions.innerHTML = '';
    eventFeedback.className = 'feedback-hidden';

    eventDef.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'event-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            disableOptions();
            const before = captureValues();
            opt.effect();
            const changes = calcChanges(before);
            if (eventDef.fragment) {
                showFragment(eventDef.fragment);
            }
            showFeedback(eventDef, changes);
            setTimeout(() => {
                callback();
            }, 6400);
        });
        eventOptions.appendChild(btn);
    });
}

function showBranchEvent(eventDef, callback) {
    eventContent.innerHTML = `
        <div class="event-title" style="color:#ffab40;">⚡ ${eventDef.title}</div>
        <div class="event-desc">${eventDef.desc}</div>
        <div class="event-flavor" style="color:#ffab40;margin-top:8px;">—— 你的选择将决定未来的道路 ——</div>
    `;
    eventOptions.innerHTML = '';
    eventFeedback.className = 'feedback-hidden';

    eventDef.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'event-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            disableOptions();
            const before = captureValues();
            opt.effect();
            const changes = calcChanges(before);
            showFeedback(eventDef, changes);
            setTimeout(() => {
                callback();
            }, 6400);
        });
        eventOptions.appendChild(btn);
    });
}

function showAccidentEvent(eventDef, callback) {
    eventContent.innerHTML = `
        <div class="event-title" style="color:#ff6b6b;">⚡ ${eventDef.title}</div>
        <div class="event-desc">${eventDef.desc}</div>
    `;
    eventOptions.innerHTML = '';
    eventFeedback.className = 'feedback-hidden';

    const btn = document.createElement('button');
    btn.className = 'event-option-btn';
    btn.textContent = '😰 …继续';
    btn.addEventListener('click', function() {
        if (this.disabled) return;
        this.disabled = true;
        const before = captureValues();
        eventDef.effect();
        const changes = calcChanges(before);
        showAccidentFeedback(eventDef, changes);
        setTimeout(() => {
            callback();
        }, 1850);
    });
    eventOptions.appendChild(btn);
}

function showRouteEndEvent(eventDef, callback) {
    eventContent.innerHTML = `
        <div class="event-title" style="color:#ffab40;">✦ ${eventDef.title}</div>
        <div class="event-desc">${eventDef.desc}</div>
        <div class="event-flavor" style="color:#ffab40;margin-top:8px;">—— 这条路的终点 ——</div>
    `;
    eventOptions.innerHTML = '';
    eventFeedback.className = 'feedback-hidden';

    eventDef.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'event-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            disableOptions();
            const before = captureValues();
            opt.effect();
            const changes = calcChanges(before);
            if (eventDef.fragment) {
                showFragment(eventDef.fragment);
            }
            showFeedback(eventDef, changes);
            setTimeout(() => {
                callback();
            }, 4500);
        });
        eventOptions.appendChild(btn);
    });
}

function showFinaleEvent(eventDef, callback) {
    eventContent.innerHTML = `
        <div class="event-title" style="color:#00e676;">✦ ${eventDef.title}</div>
        <div class="event-desc">${eventDef.desc}</div>
        <div class="event-flavor" style="color:#ffab40;margin-top:8px;">—— 这是最后的节点 ——</div>
    `;
    eventOptions.innerHTML = '';
    eventFeedback.className = 'feedback-hidden';

    eventDef.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'event-option-btn';
        btn.textContent = opt.label;
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            disableOptions();
            const before = captureValues();
            opt.effect();
            const changes = calcChanges(before);
            showFeedback(eventDef, changes);
            setTimeout(() => {
                callback();
            }, 6000);
        });
        eventOptions.appendChild(btn);
    });
}

function disableOptions() {
    document.querySelectorAll('.event-option-btn').forEach(b => b.disabled = true);
}

// ---------- 数值变化追踪 ----------
function captureValues() {
    return {
        survival: gameData.survival,
        san: gameData.san,
        boss: gameData.bossBond,
        crow: gameData.crowBond,
        alish: gameData.alishBond
    };
}

function calcChanges(before) {
    return {
        survival: gameData.survival - before.survival,
        san: gameData.san - before.san,
        boss: gameData.bossBond - before.boss,
        crow: gameData.crowBond - before.crow,
        alish: gameData.alishBond - before.alish
    };
}

function showFeedback(eventDef, changes) {
    const d = gameData;
    const feedbackDiv = eventFeedback;
    feedbackDiv.className = 'feedback-visible';
    
    let changeText = '';
    if (changes) {
        const parts = [];
        if (changes.survival !== 0) {
            parts.push(`生存点 ${changes.survival > 0 ? '+' : ''}${changes.survival}`);
        }
        if (changes.san !== 0) {
            parts.push(`San值 ${changes.san > 0 ? '+' : ''}${changes.san}`);
        }
        if (changes.boss !== 0) {
            parts.push(`老大 ${changes.boss > 0 ? '+' : ''}${changes.boss}`);
        }
        if (changes.crow !== 0) {
            parts.push(`乌鸦 ${changes.crow > 0 ? '+' : ''}${changes.crow}`);
        }
        if (changes.alish !== 0) {
            parts.push(`阿利什 ${changes.alish > 0 ? '+' : ''}${changes.alish}`);
        }
        changeText = parts.length > 0 ? parts.join(' ｜ ') : '无变化';
    } else {
        changeText = '无变化';
    }
    
    feedbackDiv.innerHTML = `
        <div>✅ 事件完成</div>
        <div style="font-size:13px;color:#ffab40;margin-top:4px;">
            ${changeText}
        </div>
        <div style="font-size:12px;color:#556688;margin-top:4px;border-top:1px solid #1a2a3a;padding-top:4px;">
            当前：生存 ${d.survival} ｜ San ${d.san} ｜ 老大 ${d.bossBond} ｜ 乌鸦 ${d.crowBond} ｜ 阿利什 ${d.alishBond}
        </div>
    `;
}

function showAccidentFeedback(eventDef, changes) {
    const d = gameData;
    const feedbackDiv = eventFeedback;
    feedbackDiv.className = 'feedback-visible';
    
    let changeText = '';
    if (changes) {
        const parts = [];
        if (changes.survival !== 0) {
            parts.push(`生存点 ${changes.survival > 0 ? '+' : ''}${changes.survival}`);
        }
        if (changes.san !== 0) {
            parts.push(`San值 ${changes.san > 0 ? '+' : ''}${changes.san}`);
        }
        if (changes.boss !== 0) {
            parts.push(`老大 ${changes.boss > 0 ? '+' : ''}${changes.boss}`);
        }
        if (changes.crow !== 0) {
            parts.push(`乌鸦 ${changes.crow > 0 ? '+' : ''}${changes.crow}`);
        }
        if (changes.alish !== 0) {
            parts.push(`阿利什 ${changes.alish > 0 ? '+' : ''}${changes.alish}`);
        }
        changeText = parts.length > 0 ? parts.join(' ｜ ') : '无变化';
    } else {
        changeText = '无变化';
    }
    
    feedbackDiv.innerHTML = `
        <div style="color:#ff6b6b;">⚠️ 意外事件结束</div>
        <div style="font-size:13px;color:#ffab40;margin-top:4px;">
            ${changeText}
        </div>
        <div style="font-size:12px;color:#556688;margin-top:4px;border-top:1px solid #1a2a3a;padding-top:4px;">
            当前：生存 ${d.survival} ｜ San ${d.san} ｜ 老大 ${d.bossBond} ｜ 乌鸦 ${d.crowBond} ｜ 阿利什 ${d.alishBond}
        </div>
    `;
}

function showAccidentFeedback(eventDef) {
    const d = gameData;
    const feedbackDiv = eventFeedback;
    feedbackDiv.className = 'feedback-visible';
    feedbackDiv.innerHTML = `
        <div style="color:#ff6b6b;">⚠️ 意外事件结束</div>
        <div style="font-size:12px;color:#556688;margin-top:4px;">
            生存点 ${d.survival} ｜ San值 ${d.san}
        </div>
    `;
}

// ================================================================
// 结局判定
// ================================================================

function checkFinalEnding() {
    const d = gameData;
    if (d.gameOver) return;
    if (!d.allEventsCompleted) return;

    const allBond = d.bossBond >= 80 && d.crowBond >= 80 && d.alishBond >= 80;
    const healthy = d.survival > 60 && d.san > 60;
    const alive = d.survival > 0 && d.san > 0;

    let routeName = '';
    let routeEmoji = '';
    let routeDesc = '';
    let routeAchievement = '';

    if (d.chosenRoute === 'boss') {
        routeName = '老大线';
        routeEmoji = '🦅';
        routeDesc = '你站在他身后，替他看住了整片下城区的暗流。';
        routeAchievement = d.bossBond >= 80 ? '🏆 成就解锁：与鹰同行' : '';
    } else if (d.chosenRoute === 'alish') {
        routeName = '阿利什线';
        routeEmoji = '🦉';
        routeDesc = '你接过了那半杯酸奶，和他一起坐在末班车上。';
        routeAchievement = d.alishBond >= 80 ? '🏆 成就解锁：夜行同鸟' : '';
    } else if (d.chosenRoute === 'crow') {
        routeName = '乌鸦线';
        routeEmoji = '🩺';
        routeDesc = '你穿上了那件白大褂，接过了他递来的手术刀。';
        routeAchievement = d.crowBond >= 80 ? '🏆 成就解锁：医者之心' : '';
    }

    let bondAchievements = [];
    if (d.bossBond >= 80) bondAchievements.push('🏆 成就解锁：过命之交（老大）');
    if (d.crowBond >= 80) bondAchievements.push('🏆 成就解锁：过命之交（乌鸦）');
    if (d.alishBond >= 80) bondAchievements.push('🏆 成就解锁：过命之交（阿利什）');

    // 惊喜
    if (!healthy && allBond && alive) {
        showEnding('🎁 很幸运你虽然废柴但被carry到地上',
            `你迷迷糊糊地被三个人拽着走出了下城区。\n阳光刺眼，但你活着。\n\n${routeAchievement}\n${bondAchievements.join('\n')}`,
            'surprise');
        return;
    }

    // BE
    if (alive && !allBond) {
        showEnding('🌑 刺目的阳光——你目送他们远去',
            `他们终于走出了下城区。\n你站在阴影里，看着他们的背影消失在光中。\n\n${routeAchievement}\n${bondAchievements.join('\n')}`,
            'be');
        return;
    }

    // HE
    if (healthy && allBond) {
        showEnding('✨ 你站在阳光里，回看来时路',
            `十年。\n你终于站在了上城区的阳光下。\n回头望去，轻轨还在下城区穿梭，\n而你已经走出来了。\n\n选择的道路：${routeEmoji} ${routeName}\n${routeDesc}\n\n${routeAchievement}\n${bondAchievements.join('\n')}\n\n—— 谢谢你，一直在。`,
            'he');
        return;
    }

    // 兜底
    showEnding('🌑 旅程结束',
        `你走完了在下城区的十年。\n虽然有些事没有圆满，但这就是你的故事。\n\n${routeAchievement}\n${bondAchievements.join('\n')}`,
        'be');
}

// ---------- 启动 ----------
document.addEventListener('DOMContentLoaded', function() {
    survivalDisplay.textContent = '??';
    sanDisplay.textContent = '??';
    confirmBtn.disabled = true;
});