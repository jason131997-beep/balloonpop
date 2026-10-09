(function(){'use strict';
const $=id=>document.getElementById(id);
const cv=$('c'),cx=cv.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2.5);W=innerWidth;H=innerHeight;cv.width=W*DPR|0;cv.height=H*DPR|0;cx.setTransform(DPR,0,0,DPR,0,0);}
addEventListener('resize',resize);resize();
// ---------- storage ----------
const LS={get(k,d){try{const v=localStorage.getItem('bp_'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem('bp_'+k,JSON.stringify(v));}catch(e){}}};
let sfxOn=LS.get('sfx',true),musicOn=LS.get('music',true),spiky=LS.get('spiky',false);
let best={classic:LS.get('best',0),zen:LS.get('bestZen',0)};
// ---------- audio ----------
let AC=null,master,sfxBus,musBus;
function audio(){if(AC)return AC;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;AC=new C();
 master=AC.createDynamicsCompressor();master.threshold.value=-14;master.ratio.value=4;master.connect(AC.destination);
 sfxBus=AC.createGain();sfxBus.gain.value=sfxOn?0.9:0;sfxBus.connect(master);
 musBus=AC.createGain();musBus.gain.value=musicOn?0.28:0;musBus.connect(master);return AC;}
function unlock(){const a=audio();if(!a)return;if(a.state!=='running')a.resume();startMusic();}
let noiseBuf=null;function noise(){if(noiseBuf)return noiseBuf;const n=AC.sampleRate*0.3|0;noiseBuf=AC.createBuffer(1,n,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return noiseBuf;}
function sPop(size,pitchMul,kind){if(!AC||!sfxOn)return;const t=AC.currentTime;
 const src=AC.createBufferSource();src.buffer=noise();const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=(1400+Math.random()*500)*(60/size);bp.Q.value=0.9;
 const g=AC.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.9,t+0.004);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);
 src.connect(bp);bp.connect(g);g.connect(sfxBus);src.start(t);src.stop(t+0.15);
 const o=AC.createOscillator(),og=AC.createGain();o.type='sine';const f=(520*pitchMul)*(60/size);o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f*0.6,t+0.09);
 og.gain.setValueAtTime(0.0001,t);og.gain.exponentialRampToValueAtTime(0.35,t+0.005);og.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.connect(og);og.connect(sfxBus);o.start(t);o.stop(t+0.12);
 if(kind==='gold'){[0,0.07,0.14].forEach((d,i)=>bell(t+d,[1046,1318,1568][i],0.18));}
 else bell(t+0.02,pent(pitchMul),0.07);}
function pent(m){const n=[523,587,659,784,880,1046,1174,1318];return n[Math.min(n.length-1,Math.floor((m-1)*10))]||523;}
function bell(t,f,v){const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.008);g.gain.exponentialRampToValueAtTime(0.0008,t+0.35);o.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+0.4);}
function sBonk(){if(!AC||!sfxOn)return;const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(110,t+0.25);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.18,t+0.01);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;o.connect(lp);lp.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+0.32);}
function sMiss(){if(!AC||!sfxOn)return;const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(600,t);o.frequency.exponentialRampToValueAtTime(380,t+0.3);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.15,t+0.02);g.gain.exponentialRampToValueAtTime(0.001,t+0.35);o.connect(g);g.connect(sfxBus);o.start(t);o.stop(t+0.4);}
function sClick(){if(!AC||!sfxOn)return;bell(AC.currentTime,880,0.08);}
function sEnd(){if(!AC||!sfxOn)return;const t=AC.currentTime;[523,659,784,1046].forEach((f,i)=>bell(t+i*0.12,f,0.14));}
// music: gentle 4-chord pentatonic loop, 100 bpm, sequenced with lookahead
const BPM=100,STEP=60/BPM/2;let musStarted=false,nextT=0,step=0,musTimer=null;
const CH=[[261.6,329.6,392],[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7]];
const MEL=[0,2,4,2, 5,4,2,-1, 0,2,4,5, 4,2,1,-1, 2,4,5,7, 5,4,2,-1, 4,2,1,0, 1,-1,-1,-1];
const SC=[523.3,587.3,659.3,784,880,1046.5,1174.7,1318.5];
function mNote(t,f,dur,v,type){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.015);g.gain.exponentialRampToValueAtTime(0.0006,t+dur);o.connect(g);g.connect(musBus);o.start(t);o.stop(t+dur+0.05);}
function sched(){while(nextT<AC.currentTime+0.25){const bar=Math.floor(step/8)%4,s8=step%8;const ch=CH[bar];
 if(s8===0){mNote(nextT,ch[0]/2,STEP*7,0.32,'sine');}
 if(s8===4){mNote(nextT,ch[0]/2*1.5,STEP*3,0.18,'sine');}
 if(s8%2===1){ch.forEach(f=>mNote(nextT,f,STEP*0.9,0.05,'triangle'));}
 const m=MEL[step%32];if(m>=0&&(Math.floor(step/32)%2===0||s8%2===0))mNote(nextT,SC[m],STEP*1.8,0.13,'triangle');
 nextT+=STEP;step++;}}
function startMusic(){if(musStarted||!AC)return;musStarted=true;nextT=AC.currentTime+0.1;musTimer=setInterval(sched,60);}
document.addEventListener('visibilitychange',()=>{if(!AC)return;if(document.hidden){AC.suspend();if(state==='play')pause();}else AC.resume();});
// ---------- world ----------
const COLORS=['#ff5a7a','#ffa23a','#ffd93a','#4fd47b','#3ab8ff','#7a6bff','#ff6ad5','#2fd6c6'];
let balloons=[],parts=[],floaters=[],clouds=[];
for(let i=0;i<6;i++)clouds.push({x:Math.random()*W,y:Math.random()*H*0.8,s:0.6+Math.random()*0.9,v:6+Math.random()*10});
let state='title',mode='classic',score=0,lives=3,escaped=0,combo=0,comboT=0,maxCombo=0,popped=0,elapsed=0,spawnT=0,shake=0;
const MAXL=3;
function shade(hex,a){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(a<0?v*(1+a):v+(255-v)*a)));return `rgb(${f(r)},${f(g)},${f(b)})`;}
function spawn(){const zen=mode==='zen';const lvl=zen?0.4:Math.min(1,elapsed/150);
 let kind='n',r=Math.random();if(r<0.06)kind='gold';else if(spiky&&!zen&&elapsed>12&&r<0.06+0.05+lvl*0.07)kind='spike';
 const R=(kind==='gold'?30:34+Math.random()*14)*Math.min(1.15,Math.max(0.9,W/390));
 const sp=(zen?55:70+lvl*110)+Math.random()*(zen?30:50+lvl*60);
 balloons.push({x:R+Math.random()*(W-2*R),y:H+R*1.6,r:R,v:kind==='gold'?sp*1.25:sp,ph:Math.random()*6.28,sw:10+Math.random()*16,sf:0.8+Math.random()*1.2,col:kind==='gold'?'#ffc400':kind==='spike'?'#4a4560':COLORS[Math.random()*COLORS.length|0],kind,born:0});}
function burst(x,y,col,n,gold){for(let i=0;i<n;i++){const a=Math.random()*6.283,s=120+Math.random()*320;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,life:0.7+Math.random()*0.5,t:0,col:gold&&i%2?'#fff4a0':(i%3===0?'#fff':col),w:4+Math.random()*6,h:3+Math.random()*4,rot:Math.random()*6,vr:(Math.random()-.5)*14,shape:i%4===0?'c':'r'});}
 parts.push({ring:1,x,y,t:0,life:0.35,col});}
function floatText(x,y,txt,col,size){floaters.push({x,y,txt,col,size:size||26,t:0});}
// ---------- input ----------
cv.addEventListener('pointerdown',e=>{e.preventDefault();unlock();if(state!=='play')return;tap(e.clientX,e.clientY);},{passive:false});
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());
let lastTouch=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-lastTouch<350)e.preventDefault();lastTouch=n;},{passive:false});
function tap(px,py){let hit=-1,bd=1e9;for(let i=balloons.length-1;i>=0;i--){const b=balloons[i];const dx=px-b.x,dy=py-b.y;const d=Math.hypot(dx,dy*0.9);const pad=b.r+16;if(d<pad&&d<bd){bd=d;hit=i;}}
 if(hit<0)return;const b=balloons.splice(hit,1)[0];
 if(b.kind==='spike'){sBonk();Haptics.fire('bad');burst(b.x,b.y,'#8a85a0',14);shake=0.3;combo=0;floatText(b.x,b.y,'Oops!','#ffd0e0',30);loseLife();return;}
 comboT<=0?combo=1:combo++;comboT=1.1;maxCombo=Math.max(maxCombo,combo);popped++;
 const mult=Math.min(5,1+Math.floor((combo-1)/3));let pts=(b.kind==='gold'?50:10)*mult;score+=pts;
 sPop(b.r,1+Math.min(0.75,(combo-1)*0.05),b.kind==='gold'?'gold':'n');Haptics.fire(b.kind==='gold'?'gold':'pop');
 burst(b.x,b.y,b.col,b.kind==='gold'?34:20,b.kind==='gold');floatText(b.x,b.y-b.r*0.3,'+'+pts,b.kind==='gold'?'#fff3a0':'#fff',b.kind==='gold'?34:24);
 if(b.kind==='gold'&&mode==='classic'&&lives<MAXL&&Math.random()<0.5){lives++;floatText(b.x,b.y-40,'+❤️','#fff',28);}
 hud();}
function loseLife(){if(mode==='zen')return;lives--;hud();if(lives<=0)gameOver();}
// ---------- loop ----------
let last=performance.now();
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(frame);}
function update(dt){for(const c of clouds){c.x+=c.v*dt;if(c.x-140*c.s>W){c.x=-140*c.s;c.y=Math.random()*H*0.85;}}
 const play=state==='play';const title=state==='title'||state==='over';
 if(play){elapsed+=dt;const lvl=mode==='zen'?0.3:Math.min(1,elapsed/150);spawnT-=dt;if(spawnT<=0){spawn();if(Math.random()<lvl*0.35)spawn();spawnT=(mode==='zen'?1.0:1.05-lvl*0.62)*(0.7+Math.random()*0.6);}
  if(comboT>0){comboT-=dt;if(comboT<=0)combo=0;}}
 else if(title){spawnT-=dt;if(spawnT<=0&&balloons.length<9){const s=spiky;spiky=false;const m=mode;mode='zen';spawn();mode=m;spiky=s;spawnT=0.9+Math.random();}}
 if(state==='paused')return;
 for(let i=balloons.length-1;i>=0;i--){const b=balloons[i];b.born+=dt;b.y-=b.v*dt;b.ph+=dt*b.sf;
  if(b.y<-b.r*1.4){balloons.splice(i,1);if(play&&b.kind!=='spike'){combo=0;sMiss();Haptics.fire('miss');escaped++;if(mode==='classic'&&escaped%3===0){floatText(W/2,130,'💨 -1 ❤️','#fff',26);loseLife();}else if(mode==='classic')floatText(Math.min(W-50,Math.max(50,b.x)),130,'missed','rgba(255,255,255,.8)',18);hud();}}}
 for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.t+=dt;if(p.t>p.life){parts.splice(i,1);continue;}if(!p.ring){p.vy+=520*dt;p.vx*=0.985;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;}}
 for(let i=floaters.length-1;i>=0;i--){const f=floaters[i];f.t+=dt;f.y-=40*dt;if(f.t>0.9)floaters.splice(i,1);}
 if(shake>0)shake-=dt;}
function cloud(x,y,s){cx.save();cx.translate(x,y);cx.scale(s,s);cx.beginPath();cx.arc(0,0,34,0,6.3);cx.arc(38,-14,42,0,6.3);cx.arc(80,0,32,0,6.3);cx.arc(40,12,34,0,6.3);cx.fill();cx.restore();}
let skyG=null,skyH=0;
function draw(){if(!skyG||skyH!==H){skyG=cx.createLinearGradient(0,0,0,H);skyG.addColorStop(0,'#5fb4ef');skyG.addColorStop(0.6,'#a6dcf7');skyG.addColorStop(1,'#ffe3ee');skyH=H;}
 cx.fillStyle=skyG;cx.fillRect(0,0,W,H);
 cx.save();if(shake>0){cx.translate((Math.random()-.5)*12*shake/0.3,(Math.random()-.5)*12*shake/0.3);}
 cx.fillStyle='rgba(255,255,255,.75)';for(const c of clouds)cloud(c.x,c.y,c.s);
 // hills
 cx.fillStyle='#9be3a8';cx.beginPath();cx.moveTo(0,H);cx.quadraticCurveTo(W*0.25,H-90,W*0.55,H-40);cx.quadraticCurveTo(W*0.8,H-10,W,H-70);cx.lineTo(W,H);cx.fill();
 cx.fillStyle='#7fd28f';cx.beginPath();cx.moveTo(0,H-30);cx.quadraticCurveTo(W*0.4,H-5,W*0.7,H-30);cx.quadraticCurveTo(W*0.9,H-45,W,H-20);cx.lineTo(W,H);cx.lineTo(0,H);cx.fill();
 for(const b of balloons)drawBalloon(b);
 for(const p of parts){const k=1-p.t/p.life;if(p.ring){cx.strokeStyle=p.col;cx.globalAlpha=k;cx.lineWidth=5*k;cx.beginPath();cx.arc(p.x,p.y,20+p.t*220,0,6.3);cx.stroke();cx.globalAlpha=1;continue;}
  cx.globalAlpha=Math.min(1,k*1.5);cx.fillStyle=p.col;cx.save();cx.translate(p.x,p.y);cx.rotate(p.rot);if(p.shape==='c'){cx.beginPath();cx.arc(0,0,p.w/2,0,6.3);cx.fill();}else cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx.restore();}
 cx.globalAlpha=1;
 cx.textAlign='center';cx.textBaseline='middle';for(const f of floaters){const k=f.t/0.9;const sc=f.t<0.12?0.6+f.t/0.12*0.5:1.1-Math.min(0.1,(f.t-0.12));cx.globalAlpha=1-k*k;cx.font=`900 ${f.size*sc|0}px -apple-system,system-ui,sans-serif`;cx.lineWidth=5;cx.strokeStyle='rgba(30,80,140,.45)';cx.strokeText(f.txt,f.x,f.y);cx.fillStyle=f.col;cx.fillText(f.txt,f.x,f.y);}
 cx.globalAlpha=1;cx.restore();}
function drawBalloon(b){const sx=b.x+Math.sin(b.ph)*b.sw,y=b.y,r=b.r;const tilt=Math.cos(b.ph)*0.12;const appear=Math.min(1,b.born*4);
 // string
 cx.strokeStyle='rgba(80,90,110,.55)';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(sx,y+r*1.15);
 cx.bezierCurveTo(sx-8*Math.sin(b.ph*1.3),y+r*1.6,sx+10*Math.sin(b.ph*1.1+1),y+r*2.1,sx-4*Math.sin(b.ph),y+r*2.7);cx.stroke();
 cx.save();cx.translate(sx,y);cx.rotate(tilt);cx.scale(appear,appear);
 const g=cx.createRadialGradient(-r*0.35,-r*0.45,r*0.1,0,0,r*1.25);
 if(b.kind==='gold'){g.addColorStop(0,'#fffbd0');g.addColorStop(0.45,'#ffd23a');g.addColorStop(1,'#c98a00');}
 else{g.addColorStop(0,shade(b.col,0.55));g.addColorStop(0.5,b.col);g.addColorStop(1,shade(b.col,-0.35));}
 cx.fillStyle=g;cx.beginPath();cx.moveTo(0,r*1.12);cx.bezierCurveTo(r*1.25,r*0.6,r*1.1,-r*1.1,0,-r*1.1);cx.bezierCurveTo(-r*1.1,-r*1.1,-r*1.25,r*0.6,0,r*1.12);cx.fill();
 if(b.kind==='spike'){cx.fillStyle='#2f2b40';for(let i=0;i<10;i++){const a=i/10*6.283;cx.save();cx.rotate(a);cx.beginPath();cx.moveTo(-6,-r*0.98);cx.lineTo(0,-r*1.32);cx.lineTo(6,-r*0.98);cx.fill();cx.restore();}
  cx.fillStyle='#fff';cx.beginPath();cx.arc(-r*0.3,-r*0.1,r*0.13,0,6.3);cx.arc(r*0.3,-r*0.1,r*0.13,0,6.3);cx.fill();cx.fillStyle='#2f2b40';cx.beginPath();cx.arc(-r*0.3,-r*0.07,r*0.06,0,6.3);cx.arc(r*0.3,-r*0.07,r*0.06,0,6.3);cx.fill();}
 // knot
 cx.fillStyle=b.kind==='gold'?'#c98a00':shade(b.col,-0.3);cx.beginPath();cx.moveTo(0,r*1.06);cx.lineTo(-r*0.13,r*1.24);cx.lineTo(r*0.13,r*1.24);cx.closePath();cx.fill();
 // shine
 cx.fillStyle='rgba(255,255,255,.55)';cx.beginPath();cx.ellipse(-r*0.42,-r*0.45,r*0.14,r*0.3,-0.5,0,6.3);cx.fill();
 if(b.kind==='gold'){const s=(Math.sin(b.born*6)+1)/2;cx.fillStyle=`rgba(255,255,255,${0.4+s*0.6})`;star(r*0.5,-r*0.7,5+s*4);}
 cx.restore();}
function star(x,y,s){cx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?s*0.3:s;cx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}cx.fill();}
requestAnimationFrame(frame);
// ---------- UI ----------
function show(id){['title','paused','over'].forEach(s=>$(s).classList.toggle('hide',s!==id));$('hud').classList.toggle('on',id!=='title');$('pauseBtn').style.display=state==='play'?'block':'none';}
function hud(){$('score').textContent=score;$('bestHud').textContent=(mode==='zen'?'Zen best ':'Best ')+Math.max(best[mode],score);
 $('lives').textContent=mode==='zen'?'🌈':'❤️'.repeat(Math.max(0,lives))+'🤍'.repeat(Math.max(0,MAXL-lives));
 const mult=Math.min(5,1+Math.floor((combo-1)/3));$('combo').textContent=combo>=3?`Combo ${combo}${mult>1?' ×'+mult:''}`:(mode==='classic'&&escaped%3?'💨'.repeat(escaped%3):'');}
function start(m){unlock();sClick();Haptics.fire('click');mode=m;score=0;lives=MAXL;escaped=0;combo=0;comboT=0;maxCombo=0;popped=0;elapsed=0;spawnT=0.4;balloons=[];state='play';show(null);hud();}
function pause(){if(state!=='play')return;state='paused';show('paused');}
function gameOver(){state='over';sEnd();Haptics.fire('over');const nb=score>best[mode];if(nb){best[mode]=score;LS.set(mode==='zen'?'bestZen':'best',score);}
 $('finalScore').textContent=score;$('newBest').style.display=nb&&score>0?'block':'none';
 const msgs=['Great job! 🎉','Super popping! 🎈','Awesome! ⭐','Nice one! 🌟'];$('overTitle').textContent=msgs[Math.random()*msgs.length|0];
 $('overStats').textContent=`You popped ${popped} balloon${popped===1?'':'s'}! Biggest combo: ${maxCombo}`;show('over');}
function titleBest(){const t=[];if(best.classic)t.push('Best '+best.classic);if(best.zen)t.push('Zen best '+best.zen);$('bestTitle').textContent=t.join('  ·  ');}
function btn(id,fn){$(id).addEventListener('click',e=>{e.preventDefault();unlock();fn();});}
btn('playBtn',()=>start('classic'));btn('zenBtn',()=>start('zen'));btn('againBtn',()=>start(mode));
btn('menuBtn',()=>{sClick();state='title';balloons=[];titleBest();show('title');});
btn('quitBtn',()=>{sClick();if(mode==='zen')gameOver();else{state='title';balloons=[];titleBest();show('title');}});
btn('pauseBtn',()=>{sClick();Haptics.fire('click');pause();});btn('resumeBtn',()=>{sClick();state='play';show(null);});
function syncToggles(){$('sfxBtn').classList.toggle('off',!sfxOn);$('sfxBtn').textContent=sfxOn?'🔊':'🔇';$('musicBtn').classList.toggle('off',!musicOn);$('spikyTog').classList.toggle('on',spiky);
 if(AC){sfxBus.gain.setTargetAtTime(sfxOn?0.9:0,AC.currentTime,0.05);musBus.gain.setTargetAtTime(musicOn?0.28:0,AC.currentTime,0.2);}}
btn('sfxBtn',()=>{sfxOn=!sfxOn;LS.set('sfx',sfxOn);syncToggles();sClick();Haptics.fire('click');});
btn('musicBtn',()=>{musicOn=!musicOn;LS.set('music',musicOn);syncToggles();Haptics.fire('click');});
btn('spikyTog',()=>{spiky=!spiky;LS.set('spiky',spiky);syncToggles();sClick();Haptics.fire('click');});
syncToggles();titleBest();show('title');
window.__bp={get state(){return state},get balloons(){return balloons},tap,gameOver,get score(){return score}};
})();
