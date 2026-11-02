import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jjnfakxngdgplucjjqkg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_h4rSMO-NhJ1V8iQLYq1LFg_1hG7ItLW";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const state = { user:null, videos:[], category:"All", search:"", view:"Home", currentVideo:null, authMode:"signin" };
const categories = ["All","Music","Movies & Entertainment","Education","Sports"];
const safe = (s="") => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initials = (s="U") => s.trim().slice(0,1).toUpperCase() || "U";
const show = id => $(id).classList.remove("hidden");
const hide = id => $(id).classList.add("hidden");
function message(id, text, error=false){ $(id).textContent=text; $(id).style.color=error?"#ff9eae":"#7cdbcb"; }
function openModal(id){ show(id); document.body.style.overflow="hidden"; }
function closeModal(id){ hide(id); if(!document.querySelector(".modal-backdrop:not(.hidden)")) document.body.style.overflow=""; }
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
document.querySelectorAll(".modal-backdrop").forEach(b=>b.addEventListener("click",e=>{if(e.target===b)closeModal(b.id)}));
$("year").textContent = new Date().getFullYear();

async function loadVideos(){
  let q=supabase.from("videos").select("id,user_id,title,description,category,video_url,thumbnail_url,views,created_at,profiles(username,full_name,avatar_url)").eq("visibility","public").order("created_at",{ascending:false}).limit(100);
  const {data,error}=await q;
  if(error){$("videoGrid").innerHTML=`<p class="no-results">Could not load videos: ${safe(error.message)}</p>`;return;}
  state.videos=data||[];
  renderVideos();
}
function filteredVideos(){
  let arr=[...state.videos];
  if(state.category!=="All") arr=arr.filter(v=>v.category===state.category);
  if(state.search){const s=state.search.toLowerCase();arr=arr.filter(v=>(v.title+" "+v.description+" "+v.category+" "+(v.profiles?.username||"")).toLowerCase().includes(s));}
  if($("sortSelect").value==="popular") arr.sort((a,b)=>(b.views||0)-(a.views||0));
  return arr;
}
function renderVideos(){
  const arr=filteredVideos();
  $("resultCount").textContent=`${arr.length} video${arr.length===1?"":"s"}`;
  $("videoGrid").innerHTML=arr.map(v=>{
    const creator=v.profiles?.full_name||v.profiles?.username||"Elimind creator";
    const thumb=v.thumbnail_url?`<img src="${safe(v.thumbnail_url)}" alt="">`:`<div class="thumb-placeholder">▶</div>`;
    return `<article class="video-card" data-video="${v.id}"><div class="thumb">${thumb}<span class="duration">${safe(v.category)}</span></div><div class="card-info"><div class="creator-avatar">${initials(creator)}</div><div><h3>${safe(v.title)}</h3><p>${safe(creator)} · ${Number(v.views||0).toLocaleString()} views</p><p>${new Date(v.created_at).toLocaleDateString()}</p></div></div></article>`;
  }).join("");
  $("emptyState").classList.toggle("hidden",arr.length!==0);
  $("videoGrid").classList.toggle("hidden",arr.length===0);
  document.querySelectorAll(".video-card").forEach(card=>card.addEventListener("click",()=>openVideo(card.dataset.video)));
}
function setCategory(c){
  state.category=c;
  document.querySelectorAll("[data-category]").forEach(b=>b.classList.toggle("selected",b.dataset.category===c));
  document.querySelectorAll(".category-link").forEach(b=>b.classList.toggle("active",b.dataset.category===c));
  $("sectionTitle").textContent=c==="All"?"Popular videos":c;
  renderVideos();
}
document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>setCategory(b.dataset.category)));
$("searchForm").addEventListener("submit",e=>{e.preventDefault();state.search=$("searchInput").value.trim();state.view="Search";$("sectionTitle").textContent=state.search?`Search: ${state.search}`:"Popular videos";renderVideos();});
$("searchInput").addEventListener("input",()=>{state.search=$("searchInput").value.trim();renderVideos();});
$("sortSelect").addEventListener("change",renderVideos);
$("exploreBtn").addEventListener("click",()=>{setCategory("All");$("sectionTitle").textContent="Explore videos";$("videoGrid").scrollIntoView({behavior:"smooth"});});
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
function navigate(view){
  state.view=view;$("sidebar").classList.remove("open");$("sectionTitle").textContent=view;
  $("sectionEyebrow").textContent=view==="Home"?"THE COMMUNITY FEED":"YOUR ELIMIND TV";
  state.category="All";document.querySelectorAll("[data-category]").forEach(b=>b.classList.toggle("selected",b.dataset.category==="All"));
  if(view==="History") loadHistory();
  else if(view==="Subscriptions") loadSubscriptions();
  else if(view==="My Channel") loadMyChannel();
  else if(view==="Playlists") loadPlaylists();
  else {state.search="";$("searchInput").value="";renderVideos();}
}
async function loadHistory(){
  if(!requireUser())return;
  const {data,error}=await supabase.from("watch_history").select("watched_at,videos(id,title,category,video_url,views,profiles(username,full_name))").eq("user_id",state.user.id).order("watched_at",{ascending:false}).limit(50);
  if(error){$("videoGrid").innerHTML=`<p class="no-results">${safe(error.message)}</p>`;return;}
  renderSpecialVideos((data||[]).map(x=>x.videos).filter(Boolean));
}
async function loadSubscriptions(){
  if(!requireUser())return;
  const {data,error}=await supabase.from("subscriptions").select("creator_id").eq("subscriber_id",state.user.id);
  if(error){$("videoGrid").innerHTML=`<p class="no-results">${safe(error.message)}</p>`;return;}
  const ids=(data||[]).map(x=>x.creator_id);
  renderSpecialVideos(state.videos.filter(v=>ids.includes(v.user_id)));
}
async function loadMyChannel(){
  if(!requireUser())return;
  renderSpecialVideos(state.videos.filter(v=>v.user_id===state.user.id));
}
function renderSpecialVideos(arr){
  $("resultCount").textContent=`${arr.length} video${arr.length===1?"":"s"}`;
  $("videoGrid").innerHTML=arr.map(v=>`<article class="video-card" data-video="${v.id}"><div class="thumb"><div class="thumb-placeholder">▶</div><span class="duration">${safe(v.category||"Video")}</span></div><div class="card-info"><div class="creator-avatar">E</div><div><h3>${safe(v.title)}</h3><p>${safe(v.profiles?.full_name||v.profiles?.username||"Your channel")}</p></div></div></article>`).join("")||'<p class="no-results">Nothing to show yet.</p>';
  document.querySelectorAll(".video-card").forEach(c=>c.addEventListener("click",()=>openVideo(c.dataset.video)));
}
async function loadPlaylists(){
  if(!requireUser())return;
  const {data,error}=await supabase.from("playlists").select("id,title,is_public").eq("user_id",state.user.id).order("created_at",{ascending:false});
  if(error){$("videoGrid").innerHTML=`<p class="no-results">${safe(error.message)}</p>`;return;}
  $("videoGrid").innerHTML=`<div class="no-results"><button class="primary-btn" id="newPlaylist">＋ Create playlist</button><div style="margin-top:20px">${(data||[]).map(p=>`<p>▤ ${safe(p.title)} ${p.is_public?"· Public":"· Private"}</p>`).join("")||"You have no playlists yet."}</div></div>`;
  $("newPlaylist")?.addEventListener("click",async()=>{const title=prompt("Playlist name?");if(!title)return;const r=await supabase.from("playlists").insert({user_id:state.user.id,title});if(r.error)alert(r.error.message);else loadPlaylists();});
}
function requireUser(){if(!state.user){openAuth("signin");return false;}return true;}

async function openVideo(id){
  const v=state.videos.find(x=>x.id===id);if(!v)return;
  state.currentVideo=v;
  $("videoPlayer").src=v.video_url;$("playerTitle").textContent=v.title;
  $("playerMeta").textContent=`${v.profiles?.full_name||v.profiles?.username||"Elimind creator"} · ${v.category}`;
  $("playerDescription").textContent=v.description||"";
  openModal("playerModal");$("videoPlayer").play().catch(()=>{});
  if(state.user) await supabase.from("watch_history").upsert({user_id:state.user.id,video_id:v.id,watched_at:new Date().toISOString()},{onConflict:"user_id,video_id"});
  await loadReactions();await loadComments();await loadSubscribeState();
}
$("videoPlayer").addEventListener("error",()=>message("commentMessage","This video could not be played. Check the uploaded video URL.",true));
async function loadReactions(){
  const v=state.currentVideo;if(!v)return;
  const {data}=await supabase.from("reactions").select("reaction").eq("video_id",v.id);
  const likes=(data||[]).filter(x=>x.reaction==="like").length;
  $("likeCount").textContent=likes;$("likeBtn").classList.remove("active");$("dislikeBtn").classList.remove("active");
  if(state.user){const mine=(data||[]);const {data:r}=await supabase.from("reactions").select("reaction").eq("video_id",v.id).eq("user_id",state.user.id).maybeSingle();if(r?.reaction==="like")$("likeBtn").classList.add("active");if(r?.reaction==="dislike")$("dislikeBtn").classList.add("active");}
}
async function react(type){
  if(!requireUser())return;const v=state.currentVideo;if(!v)return;
  const {data:old}=await supabase.from("reactions").select("id,reaction").eq("video_id",v.id).eq("user_id",state.user.id).maybeSingle();
  let r;
  if(old?.reaction===type)r=await supabase.from("reactions").delete().eq("id",old.id);
  else if(old)r=await supabase.from("reactions").update({reaction:type}).eq("id",old.id);
  else r=await supabase.from("reactions").insert({video_id:v.id,user_id:state.user.id,reaction:type});
  if(r.error)alert(r.error.message);else loadReactions();
}
$("likeBtn").addEventListener("click",()=>react("like"));$("dislikeBtn").addEventListener("click",()=>react("dislike"));
async function loadComments(){
  const {data,error}=await supabase.from("comments").select("id,body,created_at,profiles(username,full_name)").eq("video_id",state.currentVideo.id).order("created_at",{ascending:false}).limit(60);
  if(error){$("commentList").textContent=error.message;return;}
  $("commentList").innerHTML=(data||[]).map(c=>`<div class="comment-item"><strong>${safe(c.profiles?.full_name||c.profiles?.username||"Member")} · ${new Date(c.created_at).toLocaleDateString()}</strong><span>${safe(c.body)}</span></div>`).join("")||'<p class="modal-sub">Be the first to comment.</p>';
}
$("commentForm").addEventListener("submit",async e=>{e.preventDefault();if(!requireUser())return;const body=$("commentInput").value.trim();if(!body)return;const {error}=await supabase.from("comments").insert({video_id:state.currentVideo.id,user_id:state.user.id,body});if(error)message("commentMessage",error.message,true);else{$("commentInput").value="";message("commentMessage","Comment posted.");loadComments();}});
async function loadSubscribeState(){
  const v=state.currentVideo;if(!v)return;
  if(!state.user){$("subscribeBtn").textContent="＋ Subscribe";return;}
  const {data}=await supabase.from("subscriptions").select("id").eq("subscriber_id",state.user.id).eq("creator_id",v.user_id).maybeSingle();
  $("subscribeBtn").textContent=data?"✓ Subscribed":"＋ Subscribe";
}
$("subscribeBtn").addEventListener("click",async()=>{if(!requireUser())return;const v=state.currentVideo;if(v.user_id===state.user.id)return;const {data}=await supabase.from("subscriptions").select("id").eq("subscriber_id",state.user.id).eq("creator_id",v.user_id).maybeSingle();const r=data?await supabase.from("subscriptions").delete().eq("id",data.id):await supabase.from("subscriptions").insert({subscriber_id:state.user.id,creator_id:v.user_id});if(r.error)alert(r.error.message);else loadSubscribeState();});

function openAuth(mode="signin"){
  state.authMode=mode;$("authTitle").textContent=mode==="signup"?"Create your account":"Welcome back";
  $("authSubtitle").textContent=mode==="signup"?"Join the Elimind TV community.":"Sign in to continue to your account.";
  $("nameField").classList.toggle("hidden",mode!=="signup");$("authSubmit").textContent=mode==="signup"?"Create account":"Sign in";
  $("switchText").textContent=mode==="signup"?"Already have an account?":"New to Elimind TV?";
  $("switchAuth").textContent=mode==="signup"?"Sign in":"Create account";message("authMessage","");openModal("authModal");
}
$("authTop").addEventListener("click",()=>state.user?openModal("accountModal"):openAuth("signin"));
$("avatarTop").addEventListener("click",()=>openModal("accountModal"));
$("switchAuth").addEventListener("click",()=>openAuth(state.authMode==="signup"?"signin":"signup"));
$("authForm").addEventListener("submit",async e=>{
  e.preventDefault();const email=$("email").value.trim(),password=$("password").value;
  $("authSubmit").disabled=true;message("authMessage","Please wait…");
  let result;
  if(state.authMode==="signup"){
    result=await supabase.auth.signUp({email,password,options:{data:{full_name:$("fullName").value.trim()}}});
    if(!result.error&&result.data.user){
      await supabase.from("profiles").upsert({id:result.data.user.id,full_name:$("fullName").value.trim()||email.split("@")[0]});
      message("authMessage",result.data.session?"Account created. You are signed in.":"Account created. Check your email to confirm, then sign in.");
    }
  }else result=await supabase.auth.signInWithPassword({email,password});
  $("authSubmit").disabled=false;
  if(result.error){message("authMessage",result.error.message,true);return;}
  if(state.authMode==="signin"||result.data.session){closeModal("authModal");await refreshUser();}
});
$("logoutBtn").addEventListener("click",async()=>{await supabase.auth.signOut();closeModal("accountModal");await refreshUser();});
$("profileBtn").addEventListener("click",async()=>{const full_name=prompt("Enter the name shown on your profile:",state.user?.user_metadata?.full_name||"");if(full_name===null)return;const {error}=await supabase.from("profiles").upsert({id:state.user.id,full_name});message("accountMessage",error?error.message:"Profile updated.",!!error);});
$("historyBtn").addEventListener("click",()=>{closeModal("accountModal");navigate("History");});
async function refreshUser(){
  const {data}=await supabase.auth.getUser();state.user=data.user||null;
  $("authTop").classList.toggle("hidden",!!state.user);$("avatarTop").classList.toggle("hidden",!state.user);
  if(state.user){const name=state.user.user_metadata?.full_name||state.user.email||"User";$("avatarTop").textContent=initials(name);$("accountName").textContent=name;$("accountEmail").textContent=state.user.email||"";}
}
supabase.auth.onAuthStateChange(()=>{refreshUser();});
$("uploadTop").addEventListener("click",()=>{if(requireUser())openModal("uploadModal");});
$("heroUpload").addEventListener("click",()=>{if(requireUser())openModal("uploadModal");});
$("emptyUpload").addEventListener("click",()=>{if(requireUser())openModal("uploadModal");});
$("uploadForm").addEventListener("submit",async e=>{
  e.preventDefault();if(!requireUser())return;
  const file=$("videoFile").files[0];if(!file)return;
  if(file.size>1024*1024*1024){message("uploadMessage","File is larger than the 1 GB upload limit.",true);return;}
  const ext=(file.name.split(".").pop()||"mp4").toLowerCase();const path=`${state.user.id}/${crypto.randomUUID()}.${ext}`;
  $("uploadSubmit").disabled=true;show("uploadProgress");$("uploadProgress").firstElementChild.style.width="25%";message("uploadMessage","Uploading video…");
  const {error:upErr}=await supabase.storage.from("elimind-videos").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type||"video/mp4"});
  if(upErr){message("uploadMessage",upErr.message,true);$("uploadSubmit").disabled=false;hide("uploadProgress");return;}
  $("uploadProgress").firstElementChild.style.width="75%";
  const {data:urlData}=supabase.storage.from("elimind-videos").getPublicUrl(path);
  const {error:dbErr}=await supabase.from("videos").insert({user_id:state.user.id,title:$("videoTitle").value.trim(),description:$("videoDescription").value.trim(),category:$("videoCategory").value,video_url:urlData.publicUrl});
  $("uploadSubmit").disabled=false;hide("uploadProgress");
  if(dbErr){message("uploadMessage",`File uploaded but video record failed: ${dbErr.message}`,true);return;}
  message("uploadMessage","Your video is live on Elimind TV.");$("uploadForm").reset();await loadVideos();setTimeout(()=>closeModal("uploadModal"),1100);
});

async function init(){
  await refreshUser();await loadVideos();
}
init();
