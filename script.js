let libraryData=[],currentAlbum=[],albumIndex=0,index=0;
let playing=false,shuffle=false,repeat=0;

const audio=document.getElementById("audio");
const canvas=document.getElementById("visualizer");
const ctx=canvas.getContext("2d");

const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
const source=audioCtx.createMediaElementSource(audio);
const analyser=audioCtx.createAnalyser();
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize=256;
const bufferLength=analyser.frequencyBinCount;
const dataArray=new Uint8Array(bufferLength);

function resize(){
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
}
window.addEventListener("resize",resize);
resize();

function draw(){
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const cx=canvas.width/2;
  const cy=canvas.height/2;
  const radius=220;
  const bars=bufferLength;
  const step=(Math.PI*2)/bars;

  for(let i=0;i<bars;i++){
    const value=dataArray[i]/255;
    const length=radius + value*120;
    const angle=i*step;

    const x1=cx + Math.cos(angle)*radius;
    const y1=cy + Math.sin(angle)*radius;
    const x2=cx + Math.cos(angle)*length;
    const y2=cy + Math.sin(angle)*length;

    ctx.strokeStyle="rgba(29,185,84,0.5)";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
  }
}
draw();

const cover=document.getElementById("cover");
const title=document.getElementById("title");
const albumName=document.getElementById("albumName");
const queue=document.getElementById("queue");
const library=document.getElementById("library");
const progress=document.getElementById("progress");
const volume=document.getElementById("volume");
const playIcon=document.getElementById("playIcon");
const shuffleBtn=document.getElementById("shuffleBtn");
const repeatBtn=document.getElementById("repeatBtn");

fetch("playlist.json").then(r=>r.json()).then(d=>{libraryData=d;renderLibrary();});

function renderLibrary(){
 library.innerHTML="";
 libraryData.forEach((a,i)=>{
  const div=document.createElement("div");
  div.className="album";
  div.innerHTML=`<img src="${a.cover}"><div class="album-title">${a.album}</div>`;
  div.onclick=()=>loadAlbum(i);
  library.appendChild(div);
 });
}

function loadAlbum(i){
 albumIndex=i;
 currentAlbum=libraryData[i].songs;
 index=0;
 albumName.innerText=libraryData[i].album;
 loadSong();renderQueue();
}

function loadSong(){
 const s=currentAlbum[index];
 audio.src=s.src;
 title.innerText=s.title;
 cover.style.backgroundImage=`url("${s.cover||libraryData[albumIndex].cover}")`;
}

function playPause(){
 if(audioCtx.state==="suspended") audioCtx.resume();
 if(playing){audio.pause();playIcon.innerText="play_arrow";}
 else{audio.play();playIcon.innerText="pause";}
 playing=!playing;
}

function next(){index=(index+1)%currentAlbum.length;loadSong();audio.play();playing=true;playIcon.innerText="pause";renderQueue()}
function prev(){index=(index-1+currentAlbum.length)%currentAlbum.length;loadSong();audio.play();playing=true;playIcon.innerText="pause";renderQueue()}

function toggleShuffle(){shuffle=!shuffle;shuffleBtn.classList.toggle("active",shuffle)}
function toggleRepeat(){
 repeat=(repeat+1)%3;
 repeatBtn.classList.toggle("active",repeat>0);
 repeatBtn.querySelector("span").innerText=repeat===2?"repeat_one":"repeat";
}

audio.addEventListener("ended",()=>{if(repeat===2)audio.play();else if(repeat===1)next()});
audio.addEventListener("timeupdate",()=>{progress.value=(audio.currentTime/audio.duration)*100||0});
progress.oninput=()=>audio.currentTime=(progress.value/100)*audio.duration;
volume.oninput=()=>audio.volume=volume.value;

function renderQueue(){
 queue.querySelectorAll(".song").forEach(e=>e.remove());
 currentAlbum.forEach((s,i)=>{
  const d=document.createElement("div");
  d.className="song";
  d.innerText=s.title;
  if(i===index)d.classList.add("active");
  d.onclick=()=>{index=i;loadSong();audio.play();playing=true;playIcon.innerText="pause";renderQueue()};
  queue.appendChild(d);
 });
}

function toggleQueue(){queue.classList.toggle("closed")}
