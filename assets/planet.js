/* Logic Sweep v1.3 — Little Planet
   Standalone spherical minefield, Canvas 2D projection of a 3D sphere.
   No network, CDN, external library, camera access or account required. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const canvas=$('planet-canvas'); if(!canvas)return;
const stage=canvas.closest('.planet-stage');
const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
const LEVELS={sprout:{rows:8,cols:12,mines:14},wanderer:{rows:10,cols:16,mines:30},explorer:{rows:12,cols:20,mines:51},legend:{rows:14,cols:24,mines:77}};
const PI=Math.PI,TAU=PI*2,MAXLAT=1.405;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const s={level:'sprout',mode:'explorer',rows:8,cols:12,mines:14,tiles:[],started:false,over:false,won:false,shields:2,opened:0,flags:0,defused:0,seconds:0,tools:'reveal',hints:[],hintType:'',yaw:-.34,pitch:.17,zoom:1,anim:null,pointer:null,visible:false};
const assets={};[['flag','meadow-flag.svg'],['mole','meadow-mole.svg']].forEach(([key,src])=>{const img=new Image();img.onload=()=>render();img.src='assets/'+src;assets[key]=img});
let cw=700,ch=580,dpr=1,cx=350,cy=301,radius=225;
let tickHandle=null,redrawScheduled=false;
const motionAllowed=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches;
const coord=i=>({row:Math.floor(i/s.cols),col:i%s.cols});
const neighbors=i=>{
  const row=Math.floor(i/s.cols),col=i%s.cols,out=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(!dr&&!dc)continue;const rr=row+dr;if(rr<0||rr>=s.rows)continue;
    const cc=(col+dc+s.cols)%s.cols;out.push(rr*s.cols+cc);
  }return out;
};
function read(key){try{return localStorage.getItem(key)}catch{return null}}
function write(key,value){try{localStorage.setItem(key,String(value))}catch{}}
const time=t=>`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
const bestKey=()=>`logic-sweep-planet-best-v1:${s.level}:${s.mode}`;
function best(){const b=Number(read(bestKey()));return Number.isFinite(b)&&b>0?time(b):'—'}
function message(text){$('planet-message').textContent=text}
function coach(text){$('planet-coach-text').textContent=text}
function planetStats(){
  $('planet-left').textContent=Math.max(0,s.mines-s.flags-s.defused);
  $('planet-time').textContent=time(s.seconds);$('planet-shields').textContent=s.mode==='classic'?'—':String(s.shields);
  $('planet-best').textContent=best();
  const percent=s.tiles.length?Math.round(s.opened/(s.tiles.length-s.mines)*100):0;
  $('planet-percent').textContent=percent+'%';$('planet-progress-fill').style.width=percent+'%';
}
function updateTarget(){
  const i=pick(cx,cy);if(i<0){$('planet-target-title').textContent='No tile selected';$('planet-target-state').textContent='Rotate to aim at the grassy surface.';return}
  const {row,col}=coord(i),tile=s.tiles[i];
  $('planet-target-title').textContent=`Latitude ${row+1} · Sector ${col+1}`;
  $('planet-target-state').textContent=s.over?'Round ended':tile.defused?'Discovered mine':tile.revealed?(tile.count?`${tile.count} neighboring mines`:'Safe clearing'):tile.flagged?'Flagged as a suspected mine':'Unexplored patch';
}
function modeUI(){
  document.querySelectorAll('[data-planet-mode]').forEach(b=>{let on=b.dataset.planetMode===s.mode;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  document.querySelectorAll('[data-planet-level]').forEach(b=>{let on=b.dataset.planetLevel===s.level;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  const isFlag=s.tools==='flag';$('planet-reveal').classList.toggle('active',!isFlag);$('planet-flag').classList.toggle('active',isFlag);
  $('planet-reveal').setAttribute('aria-pressed',String(!isFlag));$('planet-flag').setAttribute('aria-pressed',String(isFlag));
  $('planet-act').textContent=isFlag?'⚑ Flag at target':'✦ Dig at target';
}
function reset(level=s.level){
  const cfg=LEVELS[level];if(!cfg)return;
  Object.assign(s,{level,rows:cfg.rows,cols:cfg.cols,mines:cfg.mines,started:false,over:false,won:false,opened:0,flags:0,defused:0,seconds:0,shields:s.mode==='explorer'?2:0,hints:[],hintType:'',anim:null});
  s.tiles=Array.from({length:s.rows*s.cols},()=>({mine:false,count:0,revealed:false,flagged:false,defused:false,exploded:false}));
  modeUI();planetStats();message('A fresh little planet! Spin it to select a tile. Your first dig and adjacent patches are protected.');
  coach('Each number is the total number of mines in the eight neighboring patches, including diagonals. The planet wraps east–west. Find a move you can prove is safe.');
  updateTarget();render();
}
function plantMines(first){
  const blocked=new Set([first,...neighbors(first)]),avail=[];
  for(let i=0;i<s.tiles.length;i++)if(!blocked.has(i))avail.push(i);
  for(let i=avail.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[avail[i],avail[j]]=[avail[j],avail[i]]}
  for(let i=0;i<s.mines;i++)s.tiles[avail[i]].mine=true;
  for(let i=0;i<s.tiles.length;i++)if(!s.tiles[i].mine)s.tiles[i].count=neighbors(i).filter(n=>s.tiles[n].mine).length;
  s.started=true;
}
function victoryCheck(){
  if(s.over||s.opened!==s.tiles.length-s.mines)return;
  s.over=true;s.won=true;
  s.tiles.forEach(t=>{if(t.mine&&!t.defused)t.flagged=true});s.flags=s.tiles.filter(t=>t.flagged).length;
  const prev=Number(read(bestKey()));if(!prev||s.seconds<prev)write(bestKey(),Math.max(1,s.seconds));
  planetStats();message(`Planet cleared in ${time(s.seconds)}! Every safe patch discovered. ${!prev||s.seconds<prev?'New personal best!':''}`);
  coach('All safe land has been uncovered. Try a larger planet or Classic mode for a bigger deduction challenge.');
}
function dig(index){
  if(s.over||index<0)return;const t=s.tiles[index];if(t.revealed||t.flagged)return;
  s.hints=[];if(!s.started)plantMines(index);
  if(t.mine){
    t.revealed=true;
    if(s.mode==='explorer'&&s.shields>0){s.shields--;s.defused++;t.defused=true;message(`A mine burrow! One shield protected you. ${s.shields} shield${s.shields===1?'':'s'} left. Turn the planet and inspect the clues.`);coach('A shield saved this dig. The revealed burrow is now counted as a known mine when examining nearby clues.');}
    else{s.over=true;t.exploded=true;message('Mine uncovered! That expedition is over. Rotate the planet to review the exposed mine locations.');coach('The remaining mines are visible for review. Try again and use numbered clues to guide your decisions.');}
  }else{
    const stack=[index],seen=new Set();let num=0;
    while(stack.length){const i=stack.pop();if(seen.has(i))continue;seen.add(i);
      const tile=s.tiles[i];if(tile.mine||tile.revealed||tile.flagged)continue;
      tile.revealed=true;s.opened++;num++;
      if(tile.count===0)for(const n of neighbors(i))if(!seen.has(n)&&!s.tiles[n].flagged)stack.push(n);
    }
    message(num>1?`${num} safe patches discovered! Turn the globe to find the next clue.`:'Safe ground uncovered. Use its number to investigate the neighboring patches.');
    victoryCheck();
  }
  planetStats();updateTarget();render();
}
function flag(index){
  if(s.over||index<0)return;const t=s.tiles[index];if(t.revealed)return;
  t.flagged=!t.flagged;s.flags+=t.flagged?1:-1;s.hints=[];
  message(t.flagged?'Flag set. A flag is a hypothesis—check the neighboring clues before trusting it.':'Flag removed. Look for a deduction supported by the numbers.');
  planetStats();updateTarget();render();
}
function chord(index){
  if(s.over||index<0)return;const t=s.tiles[index];if(!t.revealed||t.mine||!t.count)return;
  const ns=neighbors(index),known=ns.filter(n=>s.tiles[n].flagged||s.tiles[n].defused).length;
  if(known!==t.count){message(`That ${t.count} needs ${t.count} neighboring flags or known mines; currently there are ${known}.`);return}
  for(let n of ns){if(s.over)break;if(!s.tiles[n].flagged&&!s.tiles[n].revealed)dig(n)}
}
function act(index,kind=s.tools){if(index<0||s.over)return;if(kind==='flag')flag(index);else if(s.tiles[index].revealed)chord(index);else dig(index)}
function deduction(){
  if(!s.started)return {type:'start',targets:[],text:'Start with any patch. The opening dig and all its immediate neighbors are safe.'};
  const rules=[];
  for(let i=0;i<s.tiles.length;i++){
    const t=s.tiles[i];if(!t.revealed||t.mine||!t.count)continue;
    const ns=neighbors(i),known=ns.filter(j=>s.tiles[j].defused).length;
    const unknown=ns.filter(j=>!s.tiles[j].revealed).sort((a,b)=>a-b);
    const needs=t.count-known;
    // Treat flags as unverified hypotheses: no hidden-board peeking; deductions are safe only for logically supported constraints.
    if(unknown.length&&needs>=0&&needs<=unknown.length)rules.push({origin:i,cells:unknown,needs});
  }
  for(const q of rules){
    const candidates=q.cells.filter(n=>!s.tiles[n].flagged);
    if(q.needs===q.cells.length&&candidates.length)return{type:'mine',targets:candidates,text:`The ${s.tiles[q.origin].count} at latitude ${coord(q.origin).row+1}, sector ${coord(q.origin).col+1} has exactly ${q.needs} hidden neighbors. All must be mines. Flag the highlighted patches.`};
    if(q.needs===0&&q.cells.length)return{type:'safe',targets:q.cells,text:'Every mine touching that numbered clue is already accounted for by discovered mine burrows. Its highlighted neighbors are safe to dig.'};
  }
  for(const a of rules)for(const b of rules){
    if(a===b||a.cells.length>=b.cells.length)continue;
    if(!a.cells.every(i=>b.cells.includes(i)))continue;
    const extra=b.cells.filter(i=>!a.cells.includes(i)),diff=b.needs-a.needs;
    if(extra.length&&diff===0)return {type:'safe',targets:extra,text:'Two overlapping numbered clues require the same number of mines. The extra highlighted patches in the larger group must be safe.'};
    if(extra.length&&diff===extra.length){const targets=extra.filter(i=>!s.tiles[i].flagged);if(targets.length)return{type:'mine',targets,text:'Comparing two overlapping clues proves that every extra highlighted patch contains a mine.'}}
  }
  return{type:'unknown',targets:[],text:'No certain move was found using the basic deduction rules. Some Minesweeper positions require a calculated guess. The coach never looks at hidden mine locations.'};
}
function hint(){
  if(s.over){coach('This round is finished. Start a new planet to keep practicing.');return}
  const h=deduction();s.hints=h.targets;s.hintType=h.type;coach(h.text);
  if(h.targets.length){const first=h.targets[0];focusOn(first);message(`Coach found ${h.targets.length} ${h.type==='safe'?'safe':'mined'} patch${h.targets.length===1?'':'es'}. The planet is turning toward one; use the visible clue to verify it.`)}
  else message(h.type==='start'?'Your first dig is protected. Pick a patch!':'No guaranteed deduction found; rotate to examine the whole clue pattern.');
  render();
}
function tileLatLon(index){const {row,col}=coord(index);return{lat:-MAXLAT+(row+.5)*(MAXLAT*2/s.rows),lon:-PI+(col+.5)*(TAU/s.cols)}}
function shortestAngle(a,b){let d=(((b-a+PI)%TAU)+TAU)%TAU-PI;return d}
function focusOn(index){
  const {lat,lon}=tileLatLon(index);const goalYaw=s.yaw+shortestAngle(s.yaw,-lon),goalPitch=clamp(lat,-1.32,1.32);
  if(!motionAllowed()){s.yaw=goalYaw;s.pitch=goalPitch;render();return}
  s.anim={start:performance.now(),fromYaw:s.yaw,toYaw:goalYaw,fromPitch:s.pitch,toPitch:goalPitch};animate();
}
function makeVec(lat,lon){return{x:Math.cos(lat)*Math.sin(lon),y:Math.sin(lat),z:Math.cos(lat)*Math.cos(lon)}}
function transform(p){const sy=Math.sin(s.yaw),cyaw=Math.cos(s.yaw),sp=Math.sin(s.pitch),cp=Math.cos(s.pitch);
  const x=p.x*cyaw+p.z*sy,z=p.z*cyaw-p.x*sy;
  return{x,y:p.y*cp-z*sp,z:p.y*sp+z*cp};
}
function project(p){return{x:cx+p.x*radius,y:cy-p.y*radius}}
function pick(px,py){
  const x=(px-cx)/radius,y=(cy-py)/radius,q=x*x+y*y;if(q>1)return -1;
  const z=Math.sqrt(Math.max(0,1-q)),sp=Math.sin(s.pitch),cp=Math.cos(s.pitch),sy=Math.sin(s.yaw),cyaw=Math.cos(s.yaw);
  const wy=y*cp+z*sp,wz=z*cp-y*sp,wx=x*cyaw-wz*sy,originalZ=x*sy+wz*cyaw;
  const lat=Math.asin(clamp(wy,-1,1));if(lat<-MAXLAT||lat>MAXLAT)return -1;
  const lon=Math.atan2(wx,originalZ),row=clamp(Math.floor((lat+MAXLAT)/(2*MAXLAT)*s.rows),0,s.rows-1),col=clamp(Math.floor((lon+PI)/TAU*s.cols),0,s.cols-1);
  return row*s.cols+col;
}
function ringBoundary(row,col){
  const bottom=-MAXLAT+row*(MAXLAT*2/s.rows),top=bottom+MAXLAT*2/s.rows;
  const left=-PI+col*TAU/s.cols,right=left+TAU/s.cols;
  const N=4,out=[];
  for(let j=0;j<=N;j++)out.push(transform(makeVec(top,left+(right-left)*j/N)));
  for(let j=1;j<=N;j++)out.push(transform(makeVec(top+(bottom-top)*j/N,right)));
  for(let j=1;j<=N;j++)out.push(transform(makeVec(bottom,right+(left-right)*j/N)));
  for(let j=1;j<N;j++)out.push(transform(makeVec(bottom+(top-bottom)*j/N,left)));
  return out;
}
function frontClip(points){
  const out=[],eps=.004;if(!points.length)return out;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],inside=a.z>=eps,other=b.z>=eps;
    if(inside)out.push(a);
    if(inside!==other){const f=(eps-a.z)/(b.z-a.z);out.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:eps})}
  }return out;
}
function polygon(points){if(points.length<3)return false;ctx.beginPath();let p=project(points[0]);ctx.moveTo(p.x,p.y);for(let i=1;i<points.length;i++){p=project(points[i]);ctx.lineTo(p.x,p.y)}ctx.closePath();return true}
const noise=n=>{const a=Math.sin(n*74.131+12.89)*43758.5453;return a-Math.floor(a)};
function drawCloud(x,y,size){ctx.save();ctx.globalAlpha=.75;ctx.fillStyle='#fffef4';ctx.shadowBlur=15;ctx.shadowColor='#ffffffcc';ctx.beginPath();ctx.ellipse(x,y,size*.7,size*.22,0,0,TAU);ctx.ellipse(x-size*.18,y-size*.11,size*.32,size*.24,0,0,TAU);ctx.ellipse(x+size*.19,y-size*.12,size*.31,size*.28,0,0,TAU);ctx.fill();ctx.restore()}
function backdrop(){
  const halo=ctx.createRadialGradient(cx,cy,Math.max(15,radius*.7),cx,cy,radius*1.36);
  halo.addColorStop(0,'rgba(255,252,176,.3)');halo.addColorStop(.6,'rgba(245,250,167,.28)');halo.addColorStop(1,'rgba(244,251,217,0)');
  ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,radius*1.36,0,TAU);ctx.fill();
  drawCloud(cx-radius*1.18,cy-radius*.7,radius*.22);drawCloud(cx+radius*1.18,cy+radius*.5,radius*.21);
  ctx.save();ctx.shadowColor='#264e3880';ctx.shadowBlur=35;ctx.shadowOffsetY=14;
  const under=ctx.createRadialGradient(cx-radius*.28,cy-radius*.35,radius*.12,cx,cy,radius*1.05);
  under.addColorStop(0,'#c5df92');under.addColorStop(.5,'#8bb46b');under.addColorStop(.88,'#4c8c63');under.addColorStop(1,'#2c654f');
  ctx.fillStyle=under;ctx.beginPath();ctx.arc(cx,cy,radius,0,TAU);ctx.fill();ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,TAU);ctx.clip();
  const glare=ctx.createLinearGradient(cx-radius,cy-radius,cx+radius*.4,cy+radius);
  glare.addColorStop(0,'#f3ffe438');glare.addColorStop(.45,'#00000000');glare.addColorStop(1,'#123d4172');
  ctx.fillStyle=glare;ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);
  ctx.restore();
}
function decoration(i,p,apparent){
  if(apparent<10)return;
  const seed=noise(i+12),x=p.x,y=p.y;
  if(seed<.42){
    // Tiny plants and daisies make opened land feel like a living world.
    ctx.save();ctx.globalAlpha=.5;ctx.fillStyle=seed<.15?'#e6f7a4':'#528e4d';
    const sc=Math.min(3,Math.max(1,apparent*.045));ctx.beginPath();ctx.ellipse(x-apparent*.24,y+apparent*.2,sc*1.5,sc*.7,.6,0,TAU);ctx.fill();ctx.restore();
  }
  if(seed>.78&&apparent>23){
    ctx.save();const sc=Math.min(2.2,apparent*.05);ctx.fillStyle='#fff4c9';for(let j=0;j<5;j++){const a=j*TAU/5;ctx.beginPath();ctx.arc(x+apparent*.24+Math.cos(a)*sc*2,y+apparent*.19+Math.sin(a)*sc*2,sc,0,TAU);ctx.fill()}ctx.fillStyle='#e8b761';ctx.beginPath();ctx.arc(x+apparent*.24,y+apparent*.19,sc,0,TAU);ctx.fill();ctx.restore();
  }
}
function drawFlag(p,size){if(assets.flag?.complete&&assets.flag.naturalWidth){ctx.drawImage(assets.flag,p.x-size*.5,p.y-size*.79,size,size)}else{ctx.fillStyle='#a85c30';ctx.fillRect(p.x-size*.18,p.y-size*.42,2,size*.65);ctx.fillStyle='#dd5942';ctx.beginPath();ctx.moveTo(p.x-size*.17,p.y-size*.42);ctx.lineTo(p.x+size*.42,p.y-size*.23);ctx.lineTo(p.x-size*.17,p.y-size*.08);ctx.fill()}}
function drawMole(p,size){if(assets.mole?.complete&&assets.mole.naturalWidth){ctx.drawImage(assets.mole,p.x-size*.55,p.y-size*.57,size*1.1,size*1.1)}else{ctx.fillStyle='#684f38';ctx.beginPath();ctx.arc(p.x,p.y,size*.28,0,TAU);ctx.fill();ctx.fillStyle='#f1e8d5';ctx.fillRect(p.x-size*.1,p.y-size*.12,size*.06,size*.06);ctx.fillRect(p.x+size*.07,p.y-size*.12,size*.06,size*.06)}}
function drawTiles(){
  const hovered=pick(cx,cy),lost=s.over&&!s.won;
  const tiles=[];
  for(let i=0;i<s.tiles.length;i++){
    const {lat,lon}=tileLatLon(i),v=transform(makeVec(lat,lon));if(v.z<-.17)continue;
    tiles.push({i,v,poly:frontClip(ringBoundary(Math.floor(i/s.cols),i%s.cols))});
  }
  tiles.sort((a,b)=>a.v.z-b.v.z);
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius-.4,0,TAU);ctx.clip();
  for(const {i,v,poly} of tiles){if(!polygon(poly))continue;
    const t=s.tiles[i],showMine=t.mine&&(t.revealed||lost),revealed=t.revealed||showMine,depth=clamp(v.z,0,1);
    const shade=18*(1-depth),n=noise(i*5+3);
    const color=revealed?(t.mine?'#66503d':`hsl(${92+n*13} ${37+n*17}% ${43+depth*13-shade*.3}%)`):`hsl(${28+n*8} ${30+n*10}% ${35+depth*17-shade*.4}%)`;
    ctx.fillStyle=color;ctx.fill();
    ctx.lineWidth=Math.max(.8,radius*.006);ctx.strokeStyle=revealed?'#5e995d55':'#5a4025a8';ctx.stroke();
    ctx.save();ctx.clip();
    if(!revealed){
      const p=project(v),side=Math.min(radius*.18,radius*TAU/s.cols*.59);const grad=ctx.createLinearGradient(p.x-side*.45,p.y-side*.55,p.x+side*.5,p.y+side*.55);
      grad.addColorStop(0,'#f0c5913b');grad.addColorStop(.45,'#edd5a81a');grad.addColorStop(1,'#3c2a2060');ctx.fillStyle=grad;ctx.fillRect(p.x-side,p.y-side,side*2,side*2);
    }
    if(s.hints.includes(i)){ctx.fillStyle=s.hintType==='mine'?'#ffad6178':'#fff3ab78';ctx.fill();ctx.strokeStyle='#fff7bd';ctx.lineWidth=3.2;ctx.stroke()}
    if(i===hovered&&!s.over){ctx.fillStyle='#fffbe72c';ctx.fill();ctx.strokeStyle='#fff4b9b0';ctx.lineWidth=1.9;ctx.stroke()}
    ctx.restore();
  }
  ctx.restore();
  // Surface markers above tile polygons so their labels remain legible.
  for(const {i,v} of tiles){if(v.z<.20)continue;
    const t=s.tiles[i],p=project(v),size=clamp(radius*2.1/s.cols,13,43)*(.63+.45*v.z),showMine=t.mine&&(t.revealed||lost);
    if(showMine){drawMole(p,size*1.7);continue}
    if(t.flagged){drawFlag(p,size*1.85);continue}
    if(!t.revealed){if(noise(i*13+7)>.87&&v.z>.65){ctx.fillStyle='#f2c99d53';ctx.beginPath();ctx.arc(p.x,p.y,size*.11,0,TAU);ctx.fill()}continue}
    if(t.count){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`1000 ${Math.round(size*.87)}px Trebuchet MS, system-ui, sans-serif`;
      const colors=['','#58bcfb','#c1ee5e','#ff8561','#c0acff','#ffbd6b','#68efe0','#ffffff','#fbdbb7'];
      ctx.lineWidth=Math.max(2,size*.16);ctx.strokeStyle='#21412a9c';ctx.strokeText(String(t.count),p.x,p.y+1);
      ctx.fillStyle=colors[t.count]||'#fff';ctx.shadowBlur=2;ctx.shadowColor='#213c2b';ctx.fillText(String(t.count),p.x,p.y+1);ctx.restore();
    }else decoration(i,p,size*2);
  }
}
function render(){
  if(!s.visible)return;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cw,ch);
  backdrop();drawTiles();
  ctx.save();ctx.strokeStyle='#f6f0b9aa';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(cx,cy,radius+.8,0,TAU);ctx.stroke();ctx.restore();
  updateTarget();
}
function resize(){
  if(!s.visible)return;
  const rect=stage.getBoundingClientRect();cw=Math.max(320,Math.floor(rect.width));ch=Math.max(350,Math.floor(rect.height));dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);canvas.style.width=cw+'px';canvas.style.height=ch+'px';
  cx=cw*.5;cy=ch*.52;radius=Math.min(cw*.435,ch*.40)*s.zoom;
  render();
}
function animate(){if(redrawScheduled)return;redrawScheduled=true;requestAnimationFrame(now=>{
  redrawScheduled=false;if(!s.visible)return;
  if(s.anim){let t=clamp((now-s.anim.start)/650,0,1),f=1-Math.pow(1-t,3);s.yaw=s.anim.fromYaw+(s.anim.toYaw-s.anim.fromYaw)*f;s.pitch=s.anim.fromPitch+(s.anim.toPitch-s.anim.fromPitch)*f;if(t>=1)s.anim=null}
  render();if(s.anim)animate();
})}
function pointerPos(event){const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top}}
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();canvas.focus({preventScroll:true});s.anim=null;
  const p=pointerPos(e);s.pointer={id:e.pointerId,x:p.x,y:p.y,startX:p.x,startY:p.y,moved:false};canvas.setPointerCapture?.(e.pointerId);canvas.classList.add('grabbing');
});
canvas.addEventListener('pointermove',e=>{
  if(!s.pointer||s.pointer.id!==e.pointerId)return;
  const p=pointerPos(e),dx=p.x-s.pointer.x,dy=p.y-s.pointer.y;
  if(Math.hypot(p.x-s.pointer.startX,p.y-s.pointer.startY)>6)s.pointer.moved=true;
  if(s.pointer.moved){s.yaw+=dx*.0072;s.pitch=clamp(s.pitch+dy*.0072,-1.32,1.32);render()}
  s.pointer.x=p.x;s.pointer.y=p.y;
});
function endPointer(e,cancel=false){
  if(!s.pointer||s.pointer.id!==e.pointerId)return;
  const p=pointerPos(e),wasMove=s.pointer.moved;canvas.classList.remove('grabbing');s.pointer=null;
  if(!cancel&&!wasMove){const i=pick(p.x,p.y);act(i)}render();
}
canvas.addEventListener('pointerup',e=>endPointer(e));canvas.addEventListener('pointercancel',e=>endPointer(e,true));
canvas.addEventListener('contextmenu',e=>{e.preventDefault();const p=pointerPos(e);flag(pick(p.x,p.y))});
canvas.addEventListener('wheel',e=>{if(!s.visible)return;e.preventDefault();s.zoom=clamp(s.zoom+(e.deltaY>0?-.04:.04),.73,1.09);resize()},{passive:false});
canvas.addEventListener('keydown',e=>{
  if(!s.visible)return;
  const movements={ArrowLeft:[.22,0],ArrowRight:[-.22,0],ArrowUp:[0,-.19],ArrowDown:[0,.19]};
  if(movements[e.key]){e.preventDefault();s.anim=null;s.yaw+=movements[e.key][0];s.pitch=clamp(s.pitch+movements[e.key][1],-1.32,1.32);render()}
  else if(e.key==='Enter'){e.preventDefault();act(pick(cx,cy),'reveal')}
  else if(e.key.toLowerCase()==='f'){e.preventDefault();act(pick(cx,cy),'flag')}
  else if(e.key===' '){e.preventDefault();act(pick(cx,cy))}
  else if(e.key==='+'||e.key==='='){e.preventDefault();s.zoom=clamp(s.zoom+.06,.73,1.09);resize()}
  else if(e.key==='-'){e.preventDefault();s.zoom=clamp(s.zoom-.06,.73,1.09);resize()}
});
function toggleView(name){
  const globe=name==='planet';s.visible=globe;
  document.body.classList.toggle('world-mode-3d',globe);
  $('planet-game').hidden=!globe;
  $('choose-flat').classList.toggle('active',!globe);$('choose-flat').setAttribute('aria-pressed',String(!globe));
  $('choose-planet').classList.toggle('active',globe);$('choose-planet').setAttribute('aria-pressed',String(globe));
  if(window.logicSweepFlatClock)window.logicSweepFlatClock(!globe);
  write('logic-sweep-view-v1',globe?'planet':'flat');
  if(globe){requestAnimationFrame(()=>{resize();render()})}
}
function setTool(tool){s.tools=tool;modeUI();updateTarget()}
$('choose-flat').addEventListener('click',()=>toggleView('flat'));
$('choose-planet').addEventListener('click',()=>toggleView('planet'));
$('planet-reveal').addEventListener('click',()=>setTool('reveal'));
$('planet-flag').addEventListener('click',()=>setTool('flag'));
$('planet-act').addEventListener('click',()=>act(pick(cx,cy)));
$('planet-hint').addEventListener('click',hint);
$('planet-new').addEventListener('click',()=>reset());
document.querySelectorAll('[data-planet-level]').forEach(b=>b.addEventListener('click',()=>reset(b.dataset.planetLevel)));
document.querySelectorAll('[data-planet-mode]').forEach(b=>b.addEventListener('click',()=>{if(s.mode!==b.dataset.planetMode){s.mode=b.dataset.planetMode;reset()}}));
window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&s.visible)resize()});
if('ResizeObserver' in window){new ResizeObserver(()=>{if(s.visible)resize()}).observe(stage)}
tickHandle=setInterval(()=>{if(s.visible&&s.started&&!s.over&&!document.hidden){s.seconds++;planetStats()}},1000);
reset('sprout');toggleView(read('logic-sweep-view-v1')==='flat'?'flat':'planet');
})();
