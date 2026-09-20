(() => {
  const META = window.PIANO365;
  const STORE_KEY = "piano365-progress-v1";
  const $ = (id) => document.getElementById(id);
  const state = {
    day: 1,
    progress: loadProgress(),
    timer: { seconds: 45 * 60, initial: 45 * 60, running: false, id: null, startedAt: null },
    metro: { bpm: 80, running: false, id: null, audio: null, beat: 0 },
    ear: { answer: null, correct: 0, total: 0, audio: null },
    chord: { answer: null, correct: 0, total: 0 },
    interval: { answer: null, correct: 0, total: 0 },
    recorder: { media: null, chunks: [], stream: null, url: null, startedAt: null, timer: null }
  };

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {completed:{},notes:{},minutes:0,activity:[]};
    } catch {
      return {completed:{},notes:{},minutes:0,activity:[]};
    }
  }
  function saveProgress() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state.progress));
    renderStats();
  }
  function isoDay(ts = Date.now()) {
    const d = new Date(ts);
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
  }
  function completedCount() { return Object.keys(state.progress.completed || {}).length; }
  function currentCourseDay() {
    for (let d=1; d<=365; d++) if (!state.progress.completed[d]) return d;
    return 365;
  }
  function phaseForDay(day) {
    return META.phases.find(p => day >= p.days[0] && day <= p.days[1]) || META.phases[11];
  }
  function weekForDay(day) { return Math.min(52, Math.ceil(day / 7)); }

  async function loadDay(day, push=true) {
    day = Math.max(1, Math.min(365, Number(day)||1));
    state.day = day;
    if (push) history.replaceState(null,"", "#day=" + day);

    let title = "Final Piano Day";
    let body = "";
    let weekFocus = "Фінальний день курсу";
    const week = weekForDay(day);

    try {
      if (day === 365) {
        const raw = await fetch("./course/day-365.md", {cache:"no-cache"}).then(r => {
          if (!r.ok) throw new Error("day 365");
          return r.text();
        });
        const lines = raw.split("\n");
        title = (lines.find(x => x.startsWith("# ")) || "# День 365").replace(/^#\s*/,"").replace(/^День 365\s*[—-]\s*/,"");
        body = lines.slice(1).join("\n");
      } else {
        const path = "./course/week-" + String(week).padStart(2,"0") + ".md";
        const raw = await fetch(path,{cache:"no-cache"}).then(r => {
          if (!r.ok) throw new Error(path);
          return r.text();
        });
        const dayMarker = new RegExp("^## День " + day + "\\s*[—-]\\s*(.+)$","m");
        const m = raw.match(dayMarker);
        if (!m) throw new Error("Lesson section not found");
        title = m[1].trim();
        const start = m.index + m[0].length;
        const rest = raw.slice(start);
        const next = rest.search(/^## День \d+/m);
        body = (next >= 0 ? rest.slice(0,next) : rest.replace(/\n## Після тижня[\s\S]*$/,"").replace(/\n## Рефлексія[\s\S]*$/,"").replace(/\n## Неділя:[\s\S]*$/,"").replace(/\n## Підсумок тижня[\s\S]*$/,"")).trim();
        const focusMatch = raw.match(/## (?:Фокус|Результат тижня|Навіщо цей тиждень|Головна навичка)\n([^\n]+)/);
        if (focusMatch) weekFocus = focusMatch[1].trim();
      }
    } catch (err) {
      title = "Урок тимчасово недоступний";
      body = "Не вдалося завантажити Markdown-файл. Перевір, чи сайт відкритий через GitHub Pages або локальний веб-сервер.";
    }

    const phase = phaseForDay(day);
    $("dayKicker").textContent = "День " + day + " із 365";
    $("lessonTitle").textContent = title;
    $("lessonSubtitle").textContent = META.weeks[week-1] || "Фінальний день";
    $("phaseLabel").textContent = "Фаза " + phase.id + " · " + phase.name;
    $("weekLabel").textContent = day === 365 ? "Фінал" : "Тиждень " + week;
    $("lessonContent").innerHTML = renderMarkdown(body);
    $("weekTitleRail").textContent = day === 365 ? "Фінал" : (META.weeks[week-1] || ("Тиждень "+week));
    $("weekFocusRail").textContent = day === 365 ? "Фінальний recital і оцінка року." : weekFocus;
    $("weekMdLink").href = day === 365 ? "./course/day-365.md" : "./course/week-" + String(week).padStart(2,"0") + ".md";
    $("dayNotes").value = state.progress.notes?.[day] || "";
    updateCompleteButton();
    renderYearMap();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function inlineMd(s) {
    const esc = s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return esc
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.+?)\*/g,"<em>$1</em>")
      .replace(/\`(.+?)\`/g,"<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
  }
  function renderMarkdown(md) {
    const lines = md.split("\n");
    let html="", list=null;
    const closeList=()=>{ if(list){html += list==="ul"?"</ul>":"</ol>"; list=null;} };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) { closeList(); continue; }
      if (/^###\s/.test(line)) { closeList(); html += "<h3>"+inlineMd(line.replace(/^###\s/,""))+"</h3>"; continue; }
      if (/^##\s/.test(line)) { closeList(); html += "<h2>"+inlineMd(line.replace(/^##\s/,""))+"</h2>"; continue; }
      if (/^#\s/.test(line)) { closeList(); html += "<h2>"+inlineMd(line.replace(/^#\s/,""))+"</h2>"; continue; }
      if (/^-\s/.test(line)) {
        if(list!=="ul"){closeList();html+="<ul>";list="ul";}
        html += "<li>"+inlineMd(line.replace(/^-\s/,""))+"</li>"; continue;
      }
      if (/^\d+\.\s/.test(line)) {
        if(list!=="ol"){closeList();html+="<ol>";list="ol";}
        html += "<li>"+inlineMd(line.replace(/^\d+\.\s/,""))+"</li>"; continue;
      }
      closeList(); html += "<p>"+inlineMd(line)+"</p>";
    }
    closeList(); return html;
  }

  function toggleComplete() {
    const d = state.day;
    state.progress.completed ||= {};
    state.progress.activity ||= [];
    if (state.progress.completed[d]) {
      delete state.progress.completed[d];
      state.progress.activity.unshift({type:"undo",day:d,at:Date.now()});
      toast("День " + d + " повернуто в роботу");
    } else {
      state.progress.completed[d] = Date.now();
      state.progress.activity.unshift({type:"done",day:d,at:Date.now()});
      state.progress.activity = state.progress.activity.slice(0,100);
      toast("День " + d + " виконано ✓");
    }
    saveProgress(); updateCompleteButton(); renderYearMap();
  }
  function updateCompleteButton() {
    const done = !!state.progress.completed?.[state.day];
    $("completeBtn").classList.toggle("done",done);
    $("completeText").textContent = done ? "Виконано" : "Позначити виконаним";
  }

  function streak() {
    const dates = [...new Set(Object.values(state.progress.completed||{}).map(isoDay))].sort().reverse();
    if (!dates.length) return 0;
    let s=0, cursor=new Date();
    const today=isoDay(cursor);
    const yesterday=isoDay(cursor.setDate(cursor.getDate()-1));
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    cursor = new Date(dates[0] + "T12:00:00");
    for (const date of dates) {
      if (isoDay(cursor) !== date) break;
      s++;
      cursor.setDate(cursor.getDate()-1);
    }
    return s;
  }

  function renderStats() {
    const done=completedCount(), pct=Math.round(done/365*100), st=streak(), mins=state.progress.minutes||0;
    $("progressLabel").textContent=done+" / 365";
    $("progressFill").style.width=(done/365*100)+"%";
    $("streakValue").textContent=st;
    $("minutesValue").textContent=mins;
    $("percentValue").textContent=pct+"%";
    $("metricDone").textContent=done;
    $("metricMinutes").textContent=mins;
    $("metricStreak").textContent=st;
    $("metricNotes").textContent=Object.values(state.progress.notes||{}).filter(Boolean).length;
    renderAchievements();
    renderPhaseProgress();
    renderActivity();
  }

  function renderAchievements(){
    const root=$("achievements"); if(!root) return;
    const done=state.progress.completed||{}, mins=state.progress.minutes||0;
    const defs=[
      {ok:!!done[1],icon:"♪",name:"Перший день",desc:"Завершити День 1"},
      {ok:!!done[7],icon:"7",name:"Перший тиждень",desc:"Дійти до Дня 7"},
      {ok:!!done[28],icon:"★",name:"Foundation",desc:"Пройти контроль Дня 28"},
      {ok:!!done[56],icon:"♬",name:"Chord Player",desc:"Пройти День 56"},
      {ok:!!done[182],icon:"½",name:"Half Year",desc:"Піврічний іспит"},
      {ok:!!done[273],icon:"✦",name:"Dream Piece",desc:"Performance Дня 273"},
      {ok:!!done[301],icon:"◉",name:"Play by Ear",desc:"Ear Playing Check"},
      {ok:mins>=1000,icon:"⌛",name:"1000 хв",desc:"1000 хв зафіксованої практики"},
      {ok:!!done[365],icon:"365",name:"Piano 365",desc:"Фінальний recital"}
    ];
    root.innerHTML="";
    defs.forEach(a=>{
      const el=document.createElement("div");el.className="achievement"+(a.ok?" unlocked":"");
      el.innerHTML="<div class='achievement-icon'>"+a.icon+"</div><div><strong>"+a.name+"</strong><span>"+a.desc+"</span></div>";
      root.appendChild(el);
    });
  }

  function renderPhaseProgress() {
    const root=$("phaseProgress"); root.innerHTML="";
    META.phases.forEach(p=>{
      const total=p.days[1]-p.days[0]+1;
      let done=0; for(let d=p.days[0];d<=p.days[1];d++) if(state.progress.completed?.[d]) done++;
      const row=document.createElement("div"); row.className="phase-row";
      row.innerHTML="<span>"+p.id+". "+p.name+"</span><div class='mini-track'><div class='mini-fill' style='width:"+(done/total*100)+"%'></div></div><strong>"+done+"/"+total+"</strong>";
      root.appendChild(row);
    });
  }
  function renderActivity(){
    const root=$("activityList"), acts=(state.progress.activity||[]).slice(0,12);
    root.innerHTML = acts.length ? "" : "<p class='muted'>Ще немає активності.</p>";
    acts.forEach(a=>{
      const div=document.createElement("div"); div.className="activity-item";
      const label = a.type==="done" ? "✓ Виконано День "+a.day : a.type==="practice" ? "◷ Практика "+(a.minutes||0)+" хв · День "+a.day : "↶ Скасовано День "+a.day;
      div.innerHTML="<span>"+label+"</span><span class='muted'>"+new Date(a.at).toLocaleString("uk-UA",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})+"</span>";
      root.appendChild(div);
    });
  }

  function renderYearMap(filter="all", query="") {
    const root=$("yearMap"); if(!root) return;
    root.innerHTML="";
    const q=query.trim().toLowerCase();
    for(let w=1;w<=52;w++){
      const start=(w-1)*7+1,end=start+6, phase=phaseForDay(start);
      if(filter!=="all" && Number(filter)!==phase.id) continue;
      const title=META.weeks[w-1]||("Тиждень "+w);
      if(q && !("тиждень "+w+" "+title+" "+start+" "+end).toLowerCase().includes(q)) continue;
      const block=document.createElement("div"); block.className="week-block";
      block.innerHTML="<h3>Тиждень "+w+"</h3><p>"+title+"</p><div class='days-grid'></div>";
      const grid=block.querySelector(".days-grid");
      for(let d=start;d<=end;d++){
        const b=document.createElement("button"); b.className="day-cell"; b.textContent=d;
        if(state.progress.completed?.[d]) b.classList.add("done");
        if(META.milestones?.includes(d)){ b.classList.add("milestone"); b.title="Контрольна точка — День "+d; }
        if(d===state.day) b.classList.add("current");
        b.onclick=()=>{switchPanel("lesson");loadDay(d);};
        grid.appendChild(b);
      }
      root.appendChild(block);
    }
    if((filter==="all"||Number(filter)===12) && (!q || ("365 final piano day фінал").includes(q))){
      const block=document.createElement("div"); block.className="week-block";
      block.innerHTML="<h3>Фінал</h3><p>Final Piano Day</p><div class='days-grid'></div>";
      const b=document.createElement("button");b.className="day-cell";b.textContent="365";
      if(state.progress.completed?.[365])b.classList.add("done");b.classList.add("milestone");b.title="Фінальний іспит";if(state.day===365)b.classList.add("current");
      b.onclick=()=>{switchPanel("lesson");loadDay(365);};block.querySelector(".days-grid").appendChild(b);root.appendChild(block);
    }
  }

  function buildPhaseFilters(){
    const root=$("phaseFilters");root.innerHTML="";
    [{id:"all",name:"Усі"},...META.phases].forEach((p,i)=>{
      const b=document.createElement("button");b.textContent=p.name;b.dataset.phase=p.id;
      if(i===0)b.classList.add("active");
      b.onclick=()=>{
        root.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");
        renderYearMap(p.id,$("courseSearch").value);
      };
      root.appendChild(b);
    });
  }

  function switchPanel(name){
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    $("panel-"+name).classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
    $("sidebar").classList.remove("open");
  }

  function setTimer(min){
    clearInterval(state.timer.id);state.timer.running=false;state.timer.initial=min*60;state.timer.seconds=min*60;updateTimer();
    document.querySelectorAll(".preset-row button").forEach(b=>b.classList.toggle("active",Number(b.dataset.minutes)===min));
    $("timerToggle").textContent="Старт";
  }
  function updateTimer(){
    const m=Math.floor(state.timer.seconds/60),s=state.timer.seconds%60;
    $("timerDisplay").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  }
  function finishTimer(){
    const elapsed=Math.max(0,state.timer.initial-state.timer.seconds);
    clearInterval(state.timer.id);state.timer.running=false;
    if(elapsed<60){toast("Сесія коротша за хвилину — не додаю її в статистику");setTimer(Math.round(state.timer.initial/60));return;}
    const mins=Math.max(1,Math.round(elapsed/60));
    state.progress.minutes=(state.progress.minutes||0)+mins;
    state.progress.activity ||= [];state.progress.activity.unshift({type:"practice",day:state.day,minutes:mins,at:Date.now()});
    state.progress.activity=state.progress.activity.slice(0,100);
    saveProgress();toast("Збережено "+mins+" хв практики");
    setTimer(Math.round(state.timer.initial/60));
  }
  function toggleTimer(){
    if(state.timer.running){
      clearInterval(state.timer.id);state.timer.running=false;$("timerToggle").textContent="Продовжити";return;
    }
    state.timer.running=true;state.timer.startedAt=Date.now();$("timerToggle").textContent="Пауза";
    state.timer.id=setInterval(()=>{
      state.timer.seconds--;updateTimer();
      if(state.timer.seconds<=0){
        clearInterval(state.timer.id);state.timer.running=false;$("timerToggle").textContent="Готово";
        const mins=Math.round(state.timer.initial/60);state.progress.minutes=(state.progress.minutes||0)+mins;
        state.progress.activity ||= []; state.progress.activity.unshift({type:"practice",day:state.day,minutes:mins,at:Date.now()});
        saveProgress();toast("Сесію завершено: +"+mins+" хв");
      }
    },1000);
  }

  function audioCtx(){
    if(!state.metro.audio) state.metro.audio=new (window.AudioContext||window.webkitAudioContext)();
    if(state.metro.audio.state==="suspended") state.metro.audio.resume();
    return state.metro.audio;
  }
  function clickBeat(){
    const ctx=audioCtx(), osc=ctx.createOscillator(), gain=ctx.createGain();
    const accent=state.metro.beat%4===0; osc.frequency.value=accent?1000:700;
    gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.18,ctx.currentTime+.005);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.06);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.07);
    const lights=[...$("beatLights").children];lights.forEach(x=>x.classList.remove("on"));lights[state.metro.beat%4].classList.add("on");
    state.metro.beat++;
  }
  function startMetro(){
    if(state.metro.running){clearInterval(state.metro.id);state.metro.running=false;$("metroToggle").textContent="Старт";return;}
    state.metro.running=true;state.metro.beat=0;$("metroToggle").textContent="Стоп";clickBeat();
    state.metro.id=setInterval(clickBeat,60000/state.metro.bpm);
  }
  function setBpm(v){
    state.metro.bpm=Math.max(40,Math.min(220,Number(v)));$("bpmValue").textContent=state.metro.bpm;$("bpmSlider").value=state.metro.bpm;
    if(state.metro.running){clearInterval(state.metro.id);state.metro.id=setInterval(clickBeat,60000/state.metro.bpm);}
  }

  function earCtx(){
    if(!state.ear.audio)state.ear.audio=new (window.AudioContext||window.webkitAudioContext)();
    if(state.ear.audio.state==="suspended")state.ear.audio.resume();return state.ear.audio;
  }
  function playTone(freq,when=.0){
    const ctx=earCtx(),osc=ctx.createOscillator(),g=ctx.createGain();osc.frequency.value=freq;
    g.gain.setValueAtTime(.0001,ctx.currentTime+when);g.gain.exponentialRampToValueAtTime(.14,ctx.currentTime+when+.01);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+when+.55);
    osc.connect(g);g.connect(ctx.destination);osc.start(ctx.currentTime+when);osc.stop(ctx.currentTime+when+.6);
  }
  function newEar(){
    const baseMidi=55+Math.floor(Math.random()*13);
    const direction=["down","same","up"][Math.floor(Math.random()*3)];
    const diff=direction==="same"?0:(direction==="up"?1:-1)*(1+Math.floor(Math.random()*5));
    const f=m=>440*Math.pow(2,(m-69)/12);
    state.ear.answer=direction;playTone(f(baseMidi),0);playTone(f(baseMidi+diff),.75);
    $("earStatus").textContent="Слухай…";
  }
  function answerEar(ans){
    if(!state.ear.answer){toast("Спочатку натисни «Нова вправа»");return;}
    state.ear.total++;const ok=ans===state.ear.answer;if(ok)state.ear.correct++;
    $("earStatus").textContent=ok?"Правильно ✓":"Не цього разу. Правильна відповідь: "+({up:"вище",down:"нижче",same:"та сама"})[state.ear.answer];
    $("earScore").textContent=state.ear.correct+" / "+state.ear.total;state.ear.answer=null;
  }

  function midiFreq(m){ return 440*Math.pow(2,(m-69)/12); }

  function playChord(root, quality){
    const ctx=earCtx();
    const semis=quality==="major"?[0,4,7]:[0,3,7];
    semis.forEach((s,i)=>{
      const osc=ctx.createOscillator(),g=ctx.createGain();
      osc.type="sine";osc.frequency.value=midiFreq(root+s);
      g.gain.setValueAtTime(.0001,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.06,ctx.currentTime+.02);
      g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.9);
      osc.connect(g);g.connect(ctx.destination);osc.start(ctx.currentTime+i*.015);osc.stop(ctx.currentTime+1);
    });
  }
  function newChord(){
    const q=Math.random()<.5?"major":"minor";
    const root=48+Math.floor(Math.random()*13);
    state.chord.answer=q;playChord(root,q);$("chordStatus").textContent="Слухай забарвлення акорду…";
  }
  function answerChord(ans){
    if(!state.chord.answer){toast("Спочатку натисни «Новий акорд»");return;}
    state.chord.total++;const ok=ans===state.chord.answer;if(ok)state.chord.correct++;
    $("chordStatus").textContent=ok?"Правильно ✓":"Правильна відповідь: "+(state.chord.answer==="major"?"Major":"Minor");
    $("chordScore").textContent=state.chord.correct+" / "+state.chord.total;state.chord.answer=null;
  }

  function newInterval(){
    const choices=[3,4,5,7,12], semi=choices[Math.floor(Math.random()*choices.length)], root=52+Math.floor(Math.random()*12);
    state.interval.answer=semi;playTone(midiFreq(root),0);playTone(midiFreq(root+semi),.75);
    $("intervalStatus").textContent="Слухай відстань між нотами…";
  }
  function answerInterval(semi){
    if(state.interval.answer===null){toast("Спочатку натисни «Новий інтервал»");return;}
    semi=Number(semi);state.interval.total++;const ok=semi===state.interval.answer;if(ok)state.interval.correct++;
    const names={3:"m3",4:"M3",5:"P4",7:"P5",12:"P8"};
    $("intervalStatus").textContent=ok?"Правильно ✓":"Правильна відповідь: "+names[state.interval.answer];
    $("intervalScore").textContent=state.interval.correct+" / "+state.interval.total;state.interval.answer=null;
  }

  function updateRecordClock(){
    if(!state.recorder.startedAt){$("recordingClock").textContent="00:00";return;}
    const sec=Math.floor((Date.now()-state.recorder.startedAt)/1000),m=Math.floor(sec/60),s=sec%60;
    $("recordingClock").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  }
  async function toggleRecorder(){
    if(state.recorder.media && state.recorder.media.state==="recording"){
      state.recorder.media.stop();clearInterval(state.recorder.timer);
      $("recordToggle").textContent="Почати запис";$("recordingClock").classList.remove("recording-live");
      $("recordStatus").textContent="Обробляю запис…";return;
    }
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){toast("Цей браузер не підтримує запис аудіо");return;}
    try{
      clearRecording();
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const media=new MediaRecorder(stream);
      state.recorder.stream=stream;state.recorder.media=media;state.recorder.chunks=[];state.recorder.startedAt=Date.now();
      media.ondataavailable=e=>{if(e.data?.size)state.recorder.chunks.push(e.data);};
      media.onstop=()=>{
        const type=media.mimeType||"audio/webm",blob=new Blob(state.recorder.chunks,{type});
        if(state.recorder.url)URL.revokeObjectURL(state.recorder.url);
        state.recorder.url=URL.createObjectURL(blob);
        $("recordingAudio").src=state.recorder.url;$("recordingAudio").hidden=false;
        $("recordDownload").href=state.recorder.url;$("recordDownload").download="piano-day-"+state.day+"-"+isoDay()+".webm";$("recordDownload").hidden=false;
        $("recordClear").disabled=false;$("recordStatus").textContent="Готово. Прослухай запис критично, але без самобичування.";
        stream.getTracks().forEach(t=>t.stop());state.recorder.stream=null;state.recorder.startedAt=null;
      };
      media.start(250);state.recorder.timer=setInterval(updateRecordClock,250);updateRecordClock();
      $("recordToggle").textContent="Зупинити";$("recordingClock").classList.add("recording-live");$("recordStatus").textContent="Запис іде…";
    }catch(e){$("recordStatus").textContent="Немає доступу до мікрофона або браузер його заблокував.";toast("Не вдалося отримати доступ до мікрофона");}
  }
  function clearRecording(){
    if(state.recorder.media?.state==="recording")return;
    if(state.recorder.url){URL.revokeObjectURL(state.recorder.url);state.recorder.url=null;}
    $("recordingAudio").removeAttribute("src");$("recordingAudio").hidden=true;
    $("recordDownload").hidden=true;$("recordClear").disabled=true;$("recordingClock").textContent="00:00";$("recordStatus").textContent="Мікрофон запитає дозвіл лише після натискання.";
  }

  function exportData(){
    const blob=new Blob([JSON.stringify(state.progress,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="piano365-progress.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function importData(file){
    const r=new FileReader();r.onload=()=>{
      try{const d=JSON.parse(r.result);if(!d.completed||!d.notes)throw new Error();state.progress=d;saveProgress();loadDay(currentCourseDay());toast("Прогрес імпортовано");}
      catch{toast("Не вдалося імпортувати файл");}
    };r.readAsText(file);
  }
  function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}

  function init(){
    buildPhaseFilters();renderStats();
    const hashDay=Number(location.hash.match(/day=(\d+)/)?.[1]);loadDay(hashDay||currentCourseDay(),false);
    document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>switchPanel(b.dataset.panel));
    $("continueBtn").onclick=()=>{switchPanel("lesson");loadDay(currentCourseDay());};
    $("prevDayBtn").onclick=()=>loadDay(state.day-1);$("nextDayBtn").onclick=()=>loadDay(state.day+1);
    $("jumpBtn").onclick=()=>{switchPanel("lesson");loadDay($("jumpInput").value);};$("jumpInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("jumpBtn").click();});
    $("completeBtn").onclick=toggleComplete;$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
    $("fontMinus").onclick=()=>{const v=Math.max(14,parseInt(getComputedStyle(document.documentElement).getPropertyValue("--lesson-font"))-1);document.documentElement.style.setProperty("--lesson-font",v+"px");};
    $("fontPlus").onclick=()=>{const v=Math.min(24,parseInt(getComputedStyle(document.documentElement).getPropertyValue("--lesson-font"))+1);document.documentElement.style.setProperty("--lesson-font",v+"px");};
    $("dayNotes").addEventListener("input",e=>{state.progress.notes||={};state.progress.notes[state.day]=e.target.value;saveProgress();$("noteStatus").textContent="Збережено";});
    document.querySelectorAll(".preset-row button").forEach(b=>b.onclick=()=>setTimer(Number(b.dataset.minutes)));
    $("timerToggle").onclick=toggleTimer;$("timerFinish").onclick=finishTimer;$("timerReset").onclick=()=>setTimer(Math.round(state.timer.initial/60));
    $("bpmSlider").oninput=e=>setBpm(e.target.value);$("bpmMinus").onclick=()=>setBpm(state.metro.bpm-5);$("bpmPlus").onclick=()=>setBpm(state.metro.bpm+5);$("metroToggle").onclick=startMetro;
    $("earPlay").onclick=newEar;document.querySelectorAll("[data-ear]").forEach(b=>b.onclick=()=>answerEar(b.dataset.ear));
    $("chordPlay").onclick=newChord;document.querySelectorAll("[data-chord]").forEach(b=>b.onclick=()=>answerChord(b.dataset.chord));
    $("intervalPlay").onclick=newInterval;document.querySelectorAll("[data-interval]").forEach(b=>b.onclick=()=>answerInterval(b.dataset.interval));
    $("recordToggle").onclick=toggleRecorder;$("recordClear").onclick=clearRecording;
    $("courseSearch").oninput=e=>{const active=$("phaseFilters").querySelector(".active")?.dataset.phase||"all";renderYearMap(active,e.target.value);};
    $("exportBtn").onclick=exportData;$("importInput").onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);};
    if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
  document.addEventListener("DOMContentLoaded",init);
})();