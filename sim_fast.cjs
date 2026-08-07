// Optimized: single-pass per flop, with evaluate5 cache
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

function rv(rank){return RANK_ORDER.indexOf(rank)+2;}
function cardColor(c){return SUIT_COLOR[c.suit];}
function isLowRank(r){return LOW_RANKS.includes(r);}
function cardKey(c){return c.rank+'-'+c.suit;}
function payoutFromProb(p,he){if(p<=0)return null;return (1-he)/p-1;}

// ── evaluate5 with cache ──
const evalCache = new Map();
function evaluate5(cards) {
  const key = cards.map(c=>rv(c.rank)).sort((a,b)=>b-a).join(',') + '|' + cards.map(c=>c.suit).sort().join(',');
  if (evalCache.has(key)) return evalCache.get(key);
  const vals = cards.map(c=>rv(c.rank)).sort((a,b)=>b-a);
  const suits = cards.map(c=>c.suit);
  const isFlush = suits[0]===suits[1]&&suits[1]===suits[2]&&suits[2]===suits[3]&&suits[3]===suits[4];
  const unique=[];const seen={};
  for(const v of vals){if(!seen[v]){seen[v]=true;unique.push(v);}}
  unique.sort((a,b)=>b-a);
  let isStraight=false,straightHigh=0;
  if(unique.length===5){
    if(unique[0]-unique[4]===4){isStraight=true;straightHigh=unique[0];}
    else if(unique[0]===14&&unique[1]===5&&unique[2]===4&&unique[3]===3&&unique[4]===2){isStraight=true;straightHigh=5;}
  }
  const freq={};
  for(const v of vals)freq[v]=(freq[v]||0)+1;
  const groups=Object.keys(freq).map(v=>({val:+v,count:freq[v]})).sort((a,b)=>b.count-a.count||b.val-a.val);
  let result;
  if(isStraight&&isFlush){if(straightHigh===14)result={category:8,tiebreakers:[14]};else result={category:7,tiebreakers:[straightHigh]};}
  else if(groups[0].count===4)result={category:6,tiebreakers:[groups[0].val,groups[1].val]};
  else if(groups[0].count===3&&groups[1].count===2)result={category:5,tiebreakers:[groups[0].val,groups[1].val]};
  else if(isFlush)result={category:4,tiebreakers:vals};
  else if(isStraight)result={category:3,tiebreakers:[straightHigh]};
  else if(groups[0].count===3)result={category:2,tiebreakers:[groups[0].val,groups[1].val,groups[2].val]};
  else if(groups[0].count===2&&groups[1].count===2)result={category:1,tiebreakers:[groups[0].val,groups[1].val,groups[2].val]};
  else if(groups[0].count===2)result={category:0,tiebreakers:[groups[0].val,groups[1].val,groups[2].val,groups[3].val]};
  else result={category:-1,tiebreakers:vals};
  evalCache.set(key,result);
  return result;
}

function compare5(a,b){
  if(a.category!==b.category)return a.category-b.category;
  const len=Math.max(a.tiebreakers.length,b.tiebreakers.length);
  for(let i=0;i<len;i++){const av=a.tiebreakers[i]||0,bv=b.tiebreakers[i]||0;if(av!==bv)return av-bv;}
  return 0;
}

// 7C5 indices
const COMBO7_5=[];
(function(){function h(s,c){if(c.length===5){COMBO7_5.push(c.slice());return;}for(let i=s;i<7;i++){c.push(i);h(i+1,c);c.pop();}}h(0,[]);})();

// bestHand with cache
const bhCache = new Map();
function bestHand(hole,community) {
  const all = [hole[0],hole[1],community[0],community[1],community[2],community[3],community[4]];
  const key = all.map(c=>rv(c.rank)+'-'+c.suit).sort().join(',');
  if (bhCache.has(key)) return bhCache.get(key);
  let best = null;
  for(let i=0;i<COMBO7_5.length;i++){
    const idx=COMBO7_5[i];
    const e=evaluate5([all[idx[0]],all[idx[1]],all[idx[2]],all[idx[3]],all[idx[4]]]);
    if(!best||compare5(e,best)>0)best=e;
  }
  bhCache.set(key,best);
  return best;
}

function combinations(arr,k){
  const result=[];
  function h(s,c){if(c.length===k){result.push(c.slice());return;}for(let i=s;i<arr.length;i++){c.push(arr[i]);h(i+1,c);c.pop();}}
  h(0,[]);
  return result;
}

// ── Main ──
const allFlops = combinations(DEALER_STOCK,3);
console.log('Flops: '+allFlops.length+', starting...\n');

const S = {
  totalRounds:0,boardWinCount:0,
  anteWins:{0:0,1:0,2:0,3:0,4:0},
  cardWins:0,rankWins:0,colorWins:0,riverWins:0,
  totalAnteBet:0,totalAnteReturned:0,totalAnteBonus:0,
  totalBoardPayout:0,totalBoardBet:0,totalRngBonus:0,
  cardBP:0,rankBP:0,colorBP:0,riverBP:0,
  rngCB:0,rngRB:0,rngCRB:0,rngCT:0,rngRT:0,rngCRT:0,
};

for(let fi=0;fi<allFlops.length;fi++){
  const flop=allFlops[fi];
  const fKeys=new Set(flop.map(cardKey));
  const rem=DEALER_STOCK.filter(c=>!fKeys.has(cardKey(c)));
  const trc=combinations(rem,2); // 406

  // Single pass: compute odds AND store results
  const cardWC=new Array(10).fill(0);
  const rankWC={};
  const colorWC={'3R':0,'4R':0,'5R':0,'3B':0,'4B':0,'5B':0};
  let bwCnt=0,tot=0;

  // Store per-combo results for second pass
  const results = [];

  for(let c=0;c<trc.length;c++){
    const turn=trc[c][0],river=trc[c][1];
    const board=[flop[0],flop[1],flop[2],turn,river];
    const hr=FIXED_HANDS.map(h=>bestHand(h,board));
    const br=evaluate5(board);
    const bba=hr.every(r=>compare5(br,r)>0);

    let winCat, cardWinners=[];
    if(!bba){
      let best=hr[0];
      for(let i=1;i<10;i++)if(compare5(hr[i],best)>0)best=hr[i];
      for(let i=0;i<10;i++)if(compare5(hr[i],best)===0)cardWinners.push(i);
      winCat=best.category;
      for(const i of cardWinners)cardWC[i]++;
      rankWC[winCat]=(rankWC[winCat]||0)+1;
    } else {
      bwCnt++;
      winCat=br.category;
      rankWC[winCat]=(rankWC[winCat]||0)+1;
    }

    let reds=0;for(let i=0;i<5;i++)if(cardColor(board[i])==='red')reds++;
    const blacks=5-reds;
    if(reds===3)colorWC['3R']++;if(reds===4)colorWC['4R']++;if(reds===5)colorWC['5R']++;
    if(blacks===3)colorWC['3B']++;if(blacks===4)colorWC['4B']++;if(blacks===5)colorWC['5B']++;
    tot++;

    // River odds post-turn
    const b4keys=new Set([flop[0],flop[1],flop[2],turn].map(cardKey));
    const rRem=DEALER_STOCK.filter(c=>!b4keys.has(cardKey(c)));
    const lc=rRem.filter(c=>isLowRank(c.rank)).length,hc=rRem.length-lc;
    const pL=lc/rRem.length,pH=hc/rRem.length;

    results.push({cardWinners,winCat,bba,reds,blacks,riverLow:isLowRank(river.rank),pL,pH,lc,hc,riverCard:river});
  }

  // Pick favorites
  let cardPick=-1,cardPP=-1,cardPay=null;
  for(let i=0;i<10;i++){const p=cardWC[i]/tot;const pay=payoutFromProb(p,HE_CARD);const locked=p===0||p>LOCKOUT||pay>400||pay<0.1;if(!locked&&p>cardPP){cardPP=p;cardPay=pay;cardPick=i;}}
  if(cardPick===-1)for(let i=0;i<10;i++){const p=cardWC[i]/tot;if(p>cardPP){cardPP=p;cardPay=payoutFromProb(p,HE_CARD);cardPick=i;}}

  let rankPickLabel=null,rankPP=-1,rankPay=null,rankPickCat=-1;
  for(const cat of Object.keys(CAT_TO_LABEL)){const p=(rankWC[cat]||0)/tot;const pay=payoutFromProb(p,HE_RANK);const locked=p===0||p>LOCKOUT||pay>400||pay<0.1;if(!locked&&p>rankPP){rankPP=p;rankPay=pay;rankPickLabel=CAT_TO_LABEL[cat];rankPickCat=+cat;}}
  if(rankPickLabel===null)for(const cat of Object.keys(CAT_TO_LABEL)){const p=(rankWC[cat]||0)/tot;if(p>rankPP){rankPP=p;rankPay=payoutFromProb(p,HE_RANK);rankPickLabel=CAT_TO_LABEL[cat];rankPickCat=+cat;}}

  let colorPick=null,colorPP=-1,colorPay=null;
  for(const k of['3R','4R','5R','3B','4B','5B']){const p=colorWC[k]/tot;const pay=payoutFromProb(p,HE_COLOR);const locked=p===0||p>LOCKOUT;if(!locked&&p>colorPP){colorPP=p;colorPay=pay;colorPick=k;}}
  if(colorPick===null)for(const k of['3R','4R','5R','3B','4B','5B']){const p=colorWC[k]/tot;if(p>colorPP){colorPP=p;colorPay=payoutFromProb(p,HE_COLOR);colorPick=k;}}

  // Second pass: resolve with picks
  for(let c=0;c<results.length;c++){
    const r=results[c];
    S.totalRounds++;

    let cardWon=r.cardWinners.includes(cardPick);
    let rankWon=rankPickCat===r.winCat;
    let colorWon=(colorPick==='3R'&&r.reds===3)||(colorPick==='4R'&&r.reds===4)||(colorPick==='5R'&&r.reds===5)||(colorPick==='3B'&&r.blacks===3)||(colorPick==='4B'&&r.blacks===4)||(colorPick==='5B'&&r.blacks===5);

    // River pick
    let rPick=null,rPay=null;
    if(r.pL>=r.pH&&r.pL>0&&r.pL<=LOCKOUT){rPick='low';rPay=payoutFromProb(r.pL,HE_RIVER);}
    else if(r.pH>0&&r.pH<=LOCKOUT){rPick='high';rPay=payoutFromProb(r.pH,HE_RIVER);}
    else if(r.pL>0){rPick='low';rPay=payoutFromProb(r.pL,HE_RIVER);}
    else if(r.pH>0){rPick='high';rPay=payoutFromProb(r.pH,HE_RIVER);}
    let riverWon=(rPick==='low'&&r.riverLow)||(rPick==='high'&&!r.riverLow);

    if(r.bba)S.boardWinCount++;

    let bw=0;
    if(cardWon){bw++;S.cardWins++;}
    if(rankWon){bw++;S.rankWins++;}
    if(colorWon){bw++;S.colorWins++;}
    if(riverWon){bw++;S.riverWins++;}
    S.anteWins[bw]++;

    S.totalAnteBet+=1;
    if(bw===1||bw===2)S.totalAnteReturned+=1;
    else if(bw===3){S.totalAnteReturned+=1;S.totalAnteBonus+=1;}
    else if(bw===4){S.totalAnteReturned+=1;S.totalAnteBonus+=2;}

    S.totalBoardBet+=4;
    if(cardWon&&cardPay!==null){S.totalBoardPayout+=cardPay;S.cardBP+=cardPay;}
    if(rankWon&&rankPay!==null){S.totalBoardPayout+=rankPay;S.rankBP+=rankPay;}
    if(colorWon&&colorPay!==null){S.totalBoardPayout+=colorPay;S.colorBP+=colorPay;}
    if(riverWon&&rPay!==null){S.totalBoardPayout+=rPay;S.riverBP+=rPay;}

    // RNG Bonus (Monte Carlo — random position selection)
    const bCardIdx=Math.floor(Math.random()*10);
    if(!r.bba&&r.cardWinners.includes(bCardIdx)&&bCardIdx===cardPick){const b=cardPay*4;S.totalRngBonus+=b;S.rngCB+=b;S.rngCT++;}
    const bRankIdx=Math.floor(Math.random()*7);
    const bRL=RANK_BONUS_POS[bRankIdx];
    if(bRL===CAT_TO_LABEL[r.winCat]&&bRL===rankPickLabel){const b=rankPay*3;S.totalRngBonus+=b;S.rngRB+=b;S.rngRT++;}
    const bCRIdx=Math.floor(Math.random()*8);
    if(bCRIdx<6){const ck=CR_BONUS_POS[bCRIdx];let ch=(ck==='3R'&&r.reds===3)||(ck==='4R'&&r.reds===4)||(ck==='5R'&&r.reds===5)||(ck==='3B'&&r.blacks===3)||(ck==='4B'&&r.blacks===4)||(ck==='5B'&&r.blacks===5);if(ch&&ck===colorPick){const b=colorPay*2;S.totalRngBonus+=b;S.rngCRB+=b;S.rngCRT++;}}
    else{const rs=CR_BONUS_POS[bCRIdx];let rh=(rs==='low'&&r.riverLow)||(rs==='high'&&!r.riverLow);if(rh&&rs===rPick){const b=rPay*2;S.totalRngBonus+=b;S.rngCRB+=b;S.rngCRT++;}}
  }

  if((fi+1)%500===0)console.log('  '+(fi+1)+'/'+allFlops.length+' flops, cache: '+evalCache.size+' eval, '+bhCache.size+' bh');
}

// Results
console.log('\n===================================================');
console.log('  ANTE BONUS + RNG BONUS — RTP SIMULATION RESULTS');
console.log('===================================================\n');
console.log('Total rounds: '+S.totalRounds.toLocaleString());
console.log('Board beats all: '+S.boardWinCount.toLocaleString()+' ('+(S.boardWinCount/S.totalRounds*100).toFixed(2)+'%)\n');

console.log('-- ANTE BONUS DISTRIBUTION --');
for(let i=0;i<=4;i++)console.log('  '+i+' boards: '+S.anteWins[i].toLocaleString()+' ('+(S.anteWins[i]/S.totalRounds*100).toFixed(4)+'%)');

console.log('\n-- PER-BOARD WIN RATES (favorite) --');
console.log('  Card:  '+(S.cardWins/S.totalRounds*100).toFixed(2)+'%');
console.log('  Rank:  '+(S.rankWins/S.totalRounds*100).toFixed(2)+'%');
console.log('  Color: '+(S.colorWins/S.totalRounds*100).toFixed(2)+'%');
console.log('  River: '+(S.riverWins/S.totalRounds*100).toFixed(2)+'%');

const bbRet=S.cardWins+S.rankWins+S.colorWins+S.riverWins;
const totalBoardRet=bbRet+S.totalBoardPayout;
const totalWag=S.totalAnteBet+S.totalBoardBet;
const totalRet=S.totalAnteReturned+S.totalAnteBonus+totalBoardRet+S.totalRngBonus;
const rtp=totalRet/totalWag*100;

console.log('\n-- FINANCIAL (per $1 Ante) --');
console.log('  Wagered: $'+totalWag.toLocaleString()+' ($1 ante + $4 boards)');
console.log('  Returned: $'+totalRet.toLocaleString(undefined,{maximumFractionDigits:2}));
console.log('  BLENDED RTP: '+rtp.toFixed(2)+'%');
console.log('  House Edge: '+(100-rtp).toFixed(2)+'%\n');

console.log('-- BREAKDOWN --');
console.log('  Ante: wagered $'+S.totalAnteBet+', returned $'+S.totalAnteReturned+', bonus $'+S.totalAnteBonus.toFixed(2));
console.log('    Ante RTP: '+((S.totalAnteReturned+S.totalAnteBonus)/S.totalAnteBet*100).toFixed(2)+'%');
console.log('  Boards: wagered $'+S.totalBoardBet+', returned $'+totalBoardRet.toFixed(2));
console.log('    Board RTP: '+(totalBoardRet/S.totalBoardBet*100).toFixed(2)+'%');
console.log('    Card:  $'+S.cardBP.toFixed(2)+' + $'+S.cardWins+' returns');
console.log('    Rank:  $'+S.rankBP.toFixed(2)+' + $'+S.rankWins+' returns');
console.log('    Color: $'+S.colorBP.toFixed(2)+' + $'+S.colorWins+' returns');
console.log('    River: $'+S.riverBP.toFixed(2)+' + $'+S.riverWins+' returns');
console.log('  RNG: $'+S.totalRngBonus.toFixed(2)+' ('+(S.totalRngBonus/totalWag*100).toFixed(2)+'% of wagered)');
console.log('    Card(x5): '+S.rngCT+' hits, $'+S.rngCB.toFixed(2));
console.log('    Rank(x4): '+S.rngRT+' hits, $'+S.rngRB.toFixed(2));
console.log('    CR(x3):   '+S.rngCRT+' hits, $'+S.rngCRB.toFixed(2));

console.log('\n-- ANTE EV --');
console.log('  Net EV/round: $'+((S.totalAnteReturned+S.totalAnteBonus-S.totalAnteBet)/S.totalRounds).toFixed(4));
console.log('  Returned: '+(S.totalAnteReturned/S.totalAnteBet*100).toFixed(2)+'%');
console.log('  Bonus: '+(S.totalAnteBonus/S.totalAnteBet*100).toFixed(2)+'%');
console.log('  Lost: '+((S.totalAnteBet-S.totalAnteReturned)/S.totalAnteBet*100).toFixed(2)+'%');
console.log('\n===================================================');
