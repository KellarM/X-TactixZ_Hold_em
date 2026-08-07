// Optimized single-pass with multiple Ante threshold structures
const RANK_ORDER = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_COLOR = { spades:'black', hearts:'red', diamonds:'red', clubs:'black' };
const LOW_RANKS = ['2','3','4','5','6','7'];

const FIXED_HANDS = [
  [{rank:'A',suit:'diamonds'},{rank:'10',suit:'hearts'}],
  [{rank:'K',suit:'clubs'},{rank:'K',suit:'spades'}],
  [{rank:'Q',suit:'clubs'},{rank:'J',suit:'spades'}],
  [{rank:'Q',suit:'spades'},{rank:'10',suit:'spades'}],
  [{rank:'J',suit:'clubs'},{rank:'9',suit:'clubs'}],
  [{rank:'8',suit:'diamonds'},{rank:'6',suit:'diamonds'}],
  [{rank:'7',suit:'diamonds'},{rank:'7',suit:'spades'}],
  [{rank:'4',suit:'hearts'},{rank:'2',suit:'hearts'}],
  [{rank:'3',suit:'clubs'},{rank:'3',suit:'hearts'}],
  [{rank:'A',suit:'hearts'},{rank:'5',suit:'diamonds'}]
];

const DEALER_STOCK = [
  {rank:'A',suit:'spades'},{rank:'9',suit:'spades'},{rank:'8',suit:'spades'},{rank:'6',suit:'spades'},
  {rank:'5',suit:'spades'},{rank:'4',suit:'spades'},{rank:'3',suit:'spades'},{rank:'2',suit:'spades'},
  {rank:'K',suit:'hearts'},{rank:'Q',suit:'hearts'},{rank:'J',suit:'hearts'},{rank:'9',suit:'hearts'},
  {rank:'8',suit:'hearts'},{rank:'7',suit:'hearts'},{rank:'6',suit:'hearts'},{rank:'5',suit:'hearts'},
  {rank:'K',suit:'diamonds'},{rank:'Q',suit:'diamonds'},{rank:'J',suit:'diamonds'},{rank:'10',suit:'diamonds'},
  {rank:'9',suit:'diamonds'},{rank:'4',suit:'diamonds'},{rank:'3',suit:'diamonds'},{rank:'2',suit:'diamonds'},
  {rank:'A',suit:'clubs'},{rank:'10',suit:'clubs'},{rank:'8',suit:'clubs'},{rank:'7',suit:'clubs'},
  {rank:'6',suit:'clubs'},{rank:'5',suit:'clubs'},{rank:'4',suit:'clubs'},{rank:'2',suit:'clubs'}
];

const CAT_TO_LABEL = {0:'1 Pair',1:'2 Pair',2:'3 Of A Kind',3:'Straight',4:'Flush',5:'Full House',6:'4 Of A Kind'};
const RANK_BONUS_POS = ['4 Of A Kind','Full House','Flush','Straight','3 Of A Kind','2 Pair','1 Pair'];
const CR_BONUS_POS = ['3R','3B','4R','4B','5R','5B','low','high'];
const HE_CARD=0.15, HE_RANK=0.12, HE_COLOR=0.04, HE_RIVER=0.035, LOCKOUT=0.80;

function rv(r){return RANK_ORDER.indexOf(r)+2;}
function cardColor(c){return SUIT_COLOR[c.suit];}
function isLowRank(r){return LOW_RANKS.includes(r);}
function cardKey(c){return c.rank+'-'+c.suit;}
function payoutFromProb(p,he){if(p<=0)return null;return (1-he)/p-1;}

const evalCache=new Map();
function evaluate5(cards){
  const key=cards.map(c=>rv(c.rank)).sort((a,b)=>b-a).join(',')+'|'+cards.map(c=>c.suit).sort().join(',');
  if(evalCache.has(key))return evalCache.get(key);
  const vals=cards.map(c=>rv(c.rank)).sort((a,b)=>b-a);
  const suits=cards.map(c=>c.suit);
  const isFlush=suits[0]===suits[1]&&suits[1]===suits[2]&&suits[2]===suits[3]&&suits[3]===suits[4];
  const unique=[];const seen={};
  for(const v of vals){if(!seen[v]){seen[v]=true;unique.push(v);}}
  unique.sort((a,b)=>b-a);
  let isStraight=false,sh=0;
  if(unique.length===5){if(unique[0]-unique[4]===4){isStraight=true;sh=unique[0];}else if(unique[0]===14&&unique[1]===5&&unique[2]===4&&unique[3]===3&&unique[4]===2){isStraight=true;sh=5;}}
  const freq={};for(const v of vals)freq[v]=(freq[v]||0)+1;
  const groups=Object.keys(freq).map(v=>({val:+v,count:freq[v]})).sort((a,b)=>b.count-a.count||b.val-a.val);
  let result;
  if(isStraight&&isFlush){if(sh===14)result={c:8,t:[14]};else result={c:7,t:[sh]};}
  else if(groups[0].count===4)result={c:6,t:[groups[0].val,groups[1].val]};
  else if(groups[0].count===3&&groups[1].count===2)result={c:5,t:[groups[0].val,groups[1].val]};
  else if(isFlush)result={c:4,t:vals};
  else if(isStraight)result={c:3,t:[sh]};
  else if(groups[0].count===3)result={c:2,t:[groups[0].val,groups[1].val,groups[2].val]};
  else if(groups[0].count===2&&groups[1].count===2)result={c:1,t:[groups[0].val,groups[1].val,groups[2].val]};
  else if(groups[0].count===2)result={c:0,t:[groups[0].val,groups[1].val,groups[2].val,groups[3].val]};
  else result={c:-1,t:vals};
  evalCache.set(key,result);
  return result;
}

function compare5(a,b){
  if(a.c!==b.c)return a.c-b.c;
  const len=Math.max(a.t.length,b.t.length);
  for(let i=0;i<len;i++){const av=a.t[i]||0,bv=b.t[i]||0;if(av!==bv)return av-bv;}
  return 0;
}

const COMBO7_5=[];
(function(){function h(s,c){if(c.length===5){COMBO7_5.push(c.slice());return;}for(let i=s;i<7;i++){c.push(i);h(i+1,c);c.pop();}}h(0,[]);})();

const bhCache=new Map();
function bestHand(hole,community){
  const all=[hole[0],hole[1],community[0],community[1],community[2],community[3],community[4]];
  const key=all.map(c=>rv(c.rank)+'-'+c.suit).sort().join(',');
  if(bhCache.has(key))return bhCache.get(key);
  let best=null;
  for(let i=0;i<COMBO7_5.length;i++){const idx=COMBO7_5[i];const e=evaluate5([all[idx[0]],all[idx[1]],all[idx[2]],all[idx[3]],all[idx[4]]]);if(!best||compare5(e,best)>0)best=e;}
  bhCache.set(key,best);
  return best;
}

function combinations(arr,k){
  const result=[];function h(s,c){if(c.length===k){result.push(c.slice());return;}for(let i=s;i<arr.length;i++){c.push(arr[i]);h(i+1,c);c.pop();}}h(0,[]);return result;
}

// ── Threshold structures to test ──
// Each: [returnMin, bonus1Threshold, bonus1Mult, bonus2Threshold, bonus2Mult]
// returnMin = min boards to return ante
// bonus1 = at this many boards, pay bonus1Mult:1
// bonus2 = at this many boards, pay bonus2Mult:1
const structures = [
  { name: 'A: Original (1-2 ret, 3=1:1, 4=2:1)', ret:1, b1t:3, b1m:1, b2t:4, b2m:2 },
  { name: 'B: Tighter  (2 ret, 3=1:1, 4=2:1)',    ret:2, b1t:3, b1m:1, b2t:4, b2m:2 },
  { name: 'C: Tighter  (2 ret, 3=push, 4=1:1)',   ret:2, b1t:4, b1m:1, b2t:99, b2m:0 },
  { name: 'D: Hard     (3 ret, 4=1:1)',            ret:3, b1t:4, b1m:1, b2t:99, b2m:0 },
  { name: 'E: V.Hard   (3 ret, 4=2:1)',           ret:3, b1t:4, b1m:2, b2t:99, b2m:0 },
  { name: 'F: VeryHard (4 ret only)',              ret:4, b1t:99, b1m:0, b2t:99, b2m:0 },
];

// Init stats per structure
const structStats = structures.map(s => ({
  name: s.name, s: s,
  anteReturned:0, anteBonus:0, anteLost:0,
  totalRngBonus:0,
  boardPayout:0, boardBetsReturned:0,
  cardWins:0, rankWins:0, colorWins:0, riverWins:0,
  rngCB:0, rngRB:0, rngCRB:0, rngCT:0, rngRT:0, rngCRT:0,
}));

let totalRounds = 0;
let boardWinCount = 0;
const anteWins = {0:0,1:0,2:0,3:0,4:0};

const allFlops = combinations(DEALER_STOCK,3);
console.log('Flops: '+allFlops.length+', testing '+structures.length+' threshold structures...\n');

for(let fi=0;fi<allFlops.length;fi++){
  const flop=allFlops[fi];
  const fKeys=new Set(flop.map(cardKey));
  const rem=DEALER_STOCK.filter(c=>!fKeys.has(cardKey(c)));
  const trc=combinations(rem,2);

  const cardWC=new Array(10).fill(0);
  const rankWC={};
  const colorWC={'3R':0,'4R':0,'5R':0,'3B':0,'4B':0,'5B':0};
  let tot=0;
  const results=[];

  for(let c=0;c<trc.length;c++){
    const turn=trc[c][0],river=trc[c][1];
    const board=[flop[0],flop[1],flop[2],turn,river];
    const hr=FIXED_HANDS.map(h=>bestHand(h,board));
    const br=evaluate5(board);
    const bba=hr.every(r=>compare5(br,r)>0);
    let winCat,cardWinners=[];
    if(!bba){let best=hr[0];for(let i=1;i<10;i++)if(compare5(hr[i],best)>0)best=hr[i];for(let i=0;i<10;i++)if(compare5(hr[i],best)===0)cardWinners.push(i);winCat=best.c;for(const i of cardWinners)cardWC[i]++;rankWC[winCat]=(rankWC[winCat]||0)+1;}
    else{boardWinCount++;winCat=br.c;rankWC[winCat]=(rankWC[winCat]||0)+1;}
    let reds=0;for(let i=0;i<5;i++)if(cardColor(board[i])==='red')reds++;
    const blacks=5-reds;
    if(reds===3)colorWC['3R']++;if(reds===4)colorWC['4R']++;if(reds===5)colorWC['5R']++;
    if(blacks===3)colorWC['3B']++;if(blacks===4)colorWC['4B']++;if(blacks===5)colorWC['5B']++;
    tot++;
    const b4keys=new Set([flop[0],flop[1],flop[2],turn].map(cardKey));
    const rRem=DEALER_STOCK.filter(c=>!b4keys.has(cardKey(c)));
    const lc=rRem.filter(c=>isLowRank(c.rank)).length,hc=rRem.length-lc;
    results.push({cardWinners,winCat,bba,reds,blacks,riverLow:isLowRank(river.rank),pL:lc/rRem.length,pH:hc/rRem.length});
  }

  // Pick favorites
  let cardPick=-1,cardPP=-1,cardPay=null;
  for(let i=0;i<10;i++){const p=cardWC[i]/tot;const pay=payoutFromProb(p,HE_CARD);const locked=p===0||p>LOCKOUT||pay>400||pay<0.1;if(!locked&&p>cardPP){cardPP=p;cardPay=pay;cardPick=i;}}
  if(cardPick===-1)for(let i=0;i<10;i++){const p=cardWC[i]/tot;if(p>cardPP){cardPP=p;cardPay=payoutFromProb(p,HE_CARD);cardPick=i;}}

  let rankPickLabel=null,rankPay=null,rankPickCat=-1,rankPP=-1;
  for(const cat of Object.keys(CAT_TO_LABEL)){const p=(rankWC[cat]||0)/tot;const pay=payoutFromProb(p,HE_RANK);const locked=p===0||p>LOCKOUT||pay>400||pay<0.1;if(!locked&&p>rankPP){rankPP=p;rankPay=pay;rankPickLabel=CAT_TO_LABEL[cat];rankPickCat=+cat;}}
  if(rankPickLabel===null)for(const cat of Object.keys(CAT_TO_LABEL)){const p=(rankWC[cat]||0)/tot;if(p>rankPP){rankPP=p;rankPay=payoutFromProb(p,HE_RANK);rankPickLabel=CAT_TO_LABEL[cat];rankPickCat=+cat;}}

  let colorPick=null,colorPay=null,colorPP=-1;
  for(const k of['3R','4R','5R','3B','4B','5B']){const p=colorWC[k]/tot;const pay=payoutFromProb(p,HE_COLOR);const locked=p===0||p>LOCKOUT;if(!locked&&p>colorPP){colorPP=p;colorPay=pay;colorPick=k;}}
  if(colorPick===null)for(const k of['3R','4R','5R','3B','4B','5B']){const p=colorWC[k]/tot;if(p>colorPP){colorPP=p;colorPay=payoutFromProb(p,HE_COLOR);colorPick=k;}}

  for(let c=0;c<results.length;c++){
    const r=results[c];
    totalRounds++;
    let cardWon=r.cardWinners.includes(cardPick);
    let rankWon=rankPickCat===r.winCat;
    let colorWon=(colorPick==='3R'&&r.reds===3)||(colorPick==='4R'&&r.reds===4)||(colorPick==='5R'&&r.reds===5)||(colorPick==='3B'&&r.blacks===3)||(colorPick==='4B'&&r.blacks===4)||(colorPick==='5B'&&r.blacks===5);
    let rPick=null,rPay=null;
    if(r.pL>=r.pH&&r.pL>0&&r.pL<=LOCKOUT){rPick='low';rPay=payoutFromProb(r.pL,HE_RIVER);}
    else if(r.pH>0&&r.pH<=LOCKOUT){rPick='high';rPay=payoutFromProb(r.pH,HE_RIVER);}
    else if(r.pL>0){rPick='low';rPay=payoutFromProb(r.pL,HE_RIVER);}
    else if(r.pH>0){rPick='high';rPay=payoutFromProb(r.pH,HE_RIVER);}
    let riverWon=(rPick==='low'&&r.riverLow)||(rPick==='high'&&!r.riverLow);

    let bw=0;
    if(cardWon)bw++;if(rankWon)bw++;if(colorWon)bw++;if(riverWon)bw++;
    anteWins[bw]++;

    // RNG Bonus (same for all structures — compute once)
    const bCardIdx=Math.floor(Math.random()*10);
    let rngBonus=0,rngCB=0,rngRB=0,rngCRB=0,rngCT=0,rngRT=0,rngCRT=0;
    if(!r.bba&&r.cardWinners.includes(bCardIdx)&&bCardIdx===cardPick){rngCB=cardPay*4;rngCT++;}
    const bRankIdx=Math.floor(Math.random()*7);
    const bRL=RANK_BONUS_POS[bRankIdx];
    if(bRL===CAT_TO_LABEL[r.winCat]&&bRL===rankPickLabel){rngRB=rankPay*3;rngRT++;}
    const bCRIdx=Math.floor(Math.random()*8);
    if(bCRIdx<6){const ck=CR_BONUS_POS[bCRIdx];let ch=(ck==='3R'&&r.reds===3)||(ck==='4R'&&r.reds===4)||(ck==='5R'&&r.reds===5)||(ck==='3B'&&r.blacks===3)||(ck==='4B'&&r.blacks===4)||(ck==='5B'&&r.blacks===5);if(ch&&ck===colorPick){rngCRB=colorPay*2;rngCRT++;}}
    else{const rs=CR_BONUS_POS[bCRIdx];let rh=(rs==='low'&&r.riverLow)||(rs==='high'&&!r.riverLow);if(rh&&rs===rPick){rngCRB=rPay*2;rngCRT++;}}
    rngBonus=rngCB+rngRB+rngCRB;

    // Board payouts (same for all structures)
    let boardPay=0,boardRet=0;
    if(cardWon&&cardPay!==null){boardPay+=cardPay;boardRet++;}
    if(rankWon&&rankPay!==null){boardPay+=rankPay;boardRet++;}
    if(colorWon&&colorPay!==null){boardPay+=colorPay;boardRet++;}
    if(riverWon&&rPay!==null){boardPay+=rPay;boardRet++;}

    // Apply each threshold structure
    for(let si=0;si<structures.length;si++){
      const ss=structStats[si];
      const s=ss.s;
      // Ante resolution
      if(bw<s.ret){ss.anteLost++;}
      else{ss.anteReturned++;if(bw>=s.b1t){ss.anteBonus+=s.b1m;}if(bw>=s.b2t){ss.anteBonus+=s.b2m;}}
      // Board (same for all)
      ss.boardPayout+=boardPay;ss.boardBetsReturned+=boardRet;
      if(cardWon)ss.cardWins++;if(rankWon)ss.rankWins++;if(colorWon)ss.colorWins++;if(riverWon)ss.riverWins++;
      // RNG (same for all)
      ss.totalRngBonus+=rngBonus;ss.rngCB+=rngCB;ss.rngRB+=rngRB;ss.rngCRB+=rngCRB;ss.rngCT+=rngCT;ss.rngRT+=rngRT;ss.rngCRT+=rngCRT;
    }
  }
  if((fi+1)%500===0)console.log('  '+(fi+1)+'/'+allFlops.length+' flops...');
}

// Results
console.log('\n===================================================');
console.log('  ANTE THRESHOLD COMPARISON — '+totalRounds.toLocaleString()+' rounds');
console.log('===================================================\n');

console.log('-- ANTE BONUS DISTRIBUTION (all structures) --');
for(let i=0;i<=4;i++)console.log('  '+i+' boards: '+anteWins[i].toLocaleString()+' ('+(anteWins[i]/totalRounds*100).toFixed(4)+'%)');

console.log('\n-- PER-BOARD WIN RATES (favorite) --');
const ss0=structStats[0];
console.log('  Card:  '+(ss0.cardWins/totalRounds*100).toFixed(2)+'%');
console.log('  Rank:  '+(ss0.rankWins/totalRounds*100).toFixed(2)+'%');
console.log('  Color: '+(ss0.colorWins/totalRounds*100).toFixed(2)+'%');
console.log('  River: '+(ss0.riverWins/totalRounds*100).toFixed(2)+'%');

console.log('\n-- THRESHOLD STRUCTURE COMPARISON --');
console.log('Structure'.padEnd(45)+'Ante RTP   Board RTP  RNG%    Blended RTP  House Edge');
console.log('-'.repeat(95));

for(let si=0;si<structures.length;si++){
  const ss=structStats[si];
  const anteWag=totalRounds; // $1 per round
  const boardWag=totalRounds*4; // $4 per round
  const totalWag=anteWag+boardWag;
  
  const anteRet=ss.anteReturned;
  const anteBon=ss.anteBonus;
  const anteRtp=(anteRet+anteBon)/anteWag*100;
  
  const boardRet=ss.boardBetsReturned+ss.boardPayout;
  const boardRtp=boardRet/boardWag*100;
  
  const rngPct=ss.totalRngBonus/totalWag*100;
  
  const totalRet=anteRet+anteBon+boardRet+ss.totalRngBonus;
  const rtp=totalRet/totalWag*100;
  const he=100-rtp;
  
  console.log(ss.name.padEnd(45)+anteRtp.toFixed(2).padStart(7)+'%  '+boardRtp.toFixed(2).padStart(7)+'%  '+rngPct.toFixed(2).padStart(4)+'%  '+rtp.toFixed(2).padStart(8)+'%  '+he.toFixed(2).padStart(6)+'%');
}

console.log('\n-- DETAIL PER STRUCTURE --');
for(let si=0;si<structures.length;si++){
  const ss=structStats[si];
  const s=ss.s;
  const anteWag=totalRounds, boardWag=totalRounds*4, totalWag=anteWag+boardWag;
  const anteRet=ss.anteReturned, anteBon=ss.anteBonus;
  const boardRet=ss.boardBetsReturned+ss.boardPayout;
  const totalRet=anteRet+anteBon+boardRet+ss.totalRngBonus;
  const rtp=totalRet/totalWag*100;
  
  console.log('\n  '+ss.name);
  console.log('    Ante: lost='+(ss.anteLost/totalRounds*100).toFixed(2)+'%, returned='+(anteRet/totalRounds*100).toFixed(2)+'%, bonus=$'+anteBon.toFixed(0));
  console.log('    Ante RTP: '+((anteRet+anteBon)/anteWag*100).toFixed(2)+'%');
  console.log('    Board RTP: '+(boardRet/boardWag*100).toFixed(2)+'%');
  console.log('    RNG: $'+ss.totalRngBonus.toFixed(0)+' ('+(ss.totalRngBonus/totalWag*100).toFixed(2)+'%)');
  console.log('    BLENDED RTP: '+rtp.toFixed(2)+'% | House Edge: '+(100-rtp).toFixed(2)+'%');
}

console.log('\n===================================================');
