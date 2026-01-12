(()=>{var e={};e.id=888,e.ids=[888],e.modules={6814:(e,a,r)=>{"use strict";r.a(e,async(e,t)=>{try{r.r(a),r.d(a,{default:()=>m});var s=r(997);r(7562);var n=r(3291);r(6689);var d=r(4091),i=r(5640),u=r(2008),o=r(5557),c=e([n,d,i,u,o]);function l({Component:e,pageProps:a}){return(0,u.T)(),(0,s.jsxs)(s.Fragment,{children:[s.jsx(i.Z,{}),s.jsx("div",{className:"container",children:s.jsx(e,{...a})})]})}function m(e){return s.jsx(n.Provider,{store:d.h,children:s.jsx(l,{...e})})}[n,d,i,u,o]=c.then?(await c)():c,t()}catch(e){t(e)}})},7190:(e,a,r)=>{"use strict";r.d(a,{B:()=>s});let t=process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL??"http://localhost:4000/graphql";async function s(e,a){let r=localStorage.getItem("auth_token"),s=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...r?{Authorization:`Bearer ${r}`}:{}},body:JSON.stringify({query:e,variables:a})});if(!s.ok){let e=await s.text();throw Error(`GraphQL HTTP error ${s.status}: ${e}`)}let n=await s.json();if(n.errors?.length)throw Error(n.errors.map(e=>e.message).join("\n"));return n.data}},3518:(e,a,r)=>{"use strict";r.a(e,async(e,t)=>{try{r.d(a,{f:()=>i});var s=r(2024),n=r(77),d=e([s,n]);[s,n]=d.then?(await d)():d;let u=process.env.NEXT_PUBLIC_GRAPHQL_WS_URL??"ws://localhost:4000/graphql",o=null;function i(e,a){return new n.y(r=>{let t=(o||(o=(0,s.createClient)({url:u,connectionParams:()=>{let e=localStorage.getItem("auth_token");return e?{Authorization:`Bearer ${e}`}:{}}}))).subscribe({query:e,variables:a},{next:e=>{if(e.errors?.length){r.error(Error(e.errors.map(e=>e.message).join("\n")));return}r.next(e.data)},error:e=>r.error(e),complete:()=>r.complete()});return()=>{try{t()}catch{}}})}t()}catch(e){t(e)}})},1875:(e,a,r)=>{"use strict";r.d(a,{Ac:()=>i,D9:()=>n,FD:()=>o,KC:()=>g,MM:()=>m,O2:()=>t,Of:()=>c,Yx:()=>l,dd:()=>s,du:()=>u,qV:()=>d});let t=`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user { id username }
    }
  }
`,s=`
  mutation CreateUser($username: String!, $password: String!) {
    createUser(username: $username, password: $password) { id username }
  }
`,n=`
  query Me { me { id username } }
`,d=`
  query Games {
    games {
      id
      status
      amountOfPlayers
      targetScore
      cardsPerPlayer
      createdAt
      createdBy { id username }
      players { id username }
    }
  }
`,i=`
  mutation CreateGame($amountOfPlayers: Int!, $targetScore: Int!, $cardsPerPlayer: Int!) {
    createGame(amountOfPlayers: $amountOfPlayers, targetScore: $targetScore, cardsPerPlayer: $cardsPerPlayer) {
      id
      status
      amountOfPlayers
      targetScore
      cardsPerPlayer
      createdAt
    }
  }
`,u=`
  mutation JoinGame($gameId: String!) { joinGame(gameId: $gameId) }
`,o=`
  mutation StartGame($gameId: String!) { startGame(gameId: $gameId) { id status state } }
`,c=`
  query Game($gameId: String!) {
    game(gameId: $gameId) {
      id status state
      players { id username }
      createdBy { id username }
      amountOfPlayers targetScore cardsPerPlayer
    }
  }
`,l=`
  subscription GameUpdated($gameId: String!) {
    gameUpdated(gameId: $gameId) {
      id status state
      players { id username }
      createdBy { id username }
      amountOfPlayers targetScore cardsPerPlayer
    }
  }
`,m=`
  mutation DrawCard($gameId: String!) { drawCard(gameId: $gameId) { id status state } }
`,g=`
  mutation PlayCard($gameId: String!, $cardIndex: Int!, $nextColor: Color) {
    playCard(gameId: $gameId, cardIndex: $cardIndex, nextColor: $nextColor) { id status state }
  }
`},5640:(e,a,r)=>{"use strict";r.a(e,async(e,t)=>{try{r.d(a,{Z:()=>c});var s=r(997),n=r(1664),d=r.n(n);r(6689);var i=r(2008),u=r(5557),o=e([i,u]);function c(){let e=(0,i.T)(),{isAuthenticated:a,user:r}=(0,i.C)(e=>e.auth);return(0,s.jsxs)("nav",{className:"nav",children:[s.jsx(d(),{href:a?"/":"/login",style:{fontWeight:700,textDecoration:"none"},children:"UNO"}),a&&(0,s.jsxs)(s.Fragment,{children:[s.jsx(d(),{href:"/",children:"Setup"}),s.jsx(d(),{href:"/play",children:"Play"}),s.jsx(d(),{href:"/summary",children:"Summary"}),s.jsx("div",{className:"spacer"}),s.jsx("span",{style:{opacity:.8},children:r?.username}),s.jsx("button",{onClick:()=>{e((0,u.kS)()),"undefined"!=typeof document&&(document.cookie="auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT")},children:"Logout"})]})]})}[i,u]=o.then?(await o)():o,t()}catch(e){t(e)}})},5557:(e,a,r)=>{"use strict";r.a(e,async(e,t)=>{try{r.d(a,{ZP:()=>m,kS:()=>l,x4:()=>o,z2:()=>u});var s=r(3258),n=r(7190),d=r(1875),i=e([s]);s=(i.then?(await i)():i)[0];let u=(0,s.createAsyncThunk)("auth/register",async e=>{let a=e.username.trim(),r=e.password;if(!a||!r)throw Error("Username and password required");return await (0,n.B)(d.dd,{username:a,password:r}),(await (0,n.B)(d.O2,{username:a,password:r})).login}),o=(0,s.createAsyncThunk)("auth/login",async e=>{let a=e.username.trim(),r=e.password;if(!a||!r)throw Error("Username and password required");let t=await (0,n.B)(d.O2,{username:a,password:r});if(!t.login?.token||!t.login?.user)throw Error("Invalid username or password");return t.login}),c=(0,s.createAsyncThunk)("auth/refreshMe",async()=>null),l=(0,s.createAsyncThunk)("auth/logout",async()=>!0),m=(0,s.createSlice)({name:"auth",initialState:{user:null,isAuthenticated:!1,status:"idle"},reducers:{},extraReducers:e=>{e.addCase(o.pending,e=>{e.status="loading",e.error=void 0}).addCase(o.fulfilled,(e,a)=>{e.status="idle",e.user=a.payload.user,e.isAuthenticated=!0,a.payload.user}).addCase(o.rejected,(e,a)=>{e.status="error",e.error=a.error.message}).addCase(u.pending,e=>{e.status="loading",e.error=void 0}).addCase(u.fulfilled,(e,a)=>{e.status="idle",e.user=a.payload.user,e.isAuthenticated=!0,a.payload.user}).addCase(u.rejected,(e,a)=>{e.status="error",e.error=a.error.message}).addCase(c.fulfilled,(e,a)=>{e.user=a.payload,e.isAuthenticated=!!a.payload,a.payload}).addCase(l.fulfilled,e=>{e.user=null,e.isAuthenticated=!1,e.status="idle",e.error=void 0})}}).reducer;t()}catch(e){t(e)}})},394:(e,a,r)=>{"use strict";r.a(e,async(e,t)=>{try{r.d(a,{Oq:()=>h,ZP:()=>w,t:()=>g,tv:()=>y,wc:()=>l,zK:()=>m});var s=r(3258),n=r(7190),d=r(1875),i=r(3518),u=r(3451),o=e([s,i,u]);[s,i,u]=o.then?(await o)():o;let c=null,l=(0,s.createAsyncThunk)("game/load",async e=>{let a=await (0,n.B)(d.Of,{gameId:e.gameId});if(!a.game)throw Error("Game not found");return a.game}),m=(0,s.createAsyncThunk)("game/subscribe",async(e,{dispatch:a})=>(c?.unsubscribe(),c=(0,i.f)(d.Yx,{gameId:e.gameId}).subscribe({next:e=>{e?.gameUpdated&&(a(p.actions.setServerGame(e.gameUpdated)),a((0,u.kT)()))},error:e=>{console.error("gameUpdated subscription error",e)}}),!0));(0,s.createAsyncThunk)("game/unsubscribe",async()=>(c?.unsubscribe(),c=null,!0));let g=(0,s.createAsyncThunk)("game/start",async(e,{dispatch:a})=>{await (0,n.B)(d.FD,{gameId:e.gameId});let r=await (0,n.B)(d.Of,{gameId:e.gameId});return r.game&&a(p.actions.setServerGame(r.game)),!0}),y=(0,s.createAsyncThunk)("game/draw",async e=>(await (0,n.B)(d.MM,{gameId:e.gameId}),!0)),h=(0,s.createAsyncThunk)("game/play",async e=>(await (0,n.B)(d.KC,{gameId:e.gameId,cardIndex:e.cardIndex,nextColor:e.nextColor??null}),!0)),p=(0,s.createSlice)({name:"game",initialState:{currentPlayerName:null,serverGame:null,status:"idle"},reducers:{setCurrentPlayerName:(e,a)=>{e.currentPlayerName=a.payload},setServerGame:(e,a)=>{e.serverGame=a.payload},clearGame:e=>{e.serverGame=null}},extraReducers:e=>{e.addCase(l.pending,e=>{e.status="loading",e.error=void 0}).addCase(l.fulfilled,(e,a)=>{e.status="idle",e.serverGame=a.payload}).addCase(l.rejected,(e,a)=>{e.status="error",e.error=a.error.message})}}),{setCurrentPlayerName:f,setServerGame:I,clearGame:x}=p.actions,w=p.reducer;t()}catch(e){t(e)}})},3451:(e,a,r)=>{"use strict";r.a(e,async(e,t)=>{try{r.d(a,{Mu:()=>l,ZP:()=>y,kT:()=>o,yO:()=>c});var s=r(3258),n=r(7190),d=r(1875),i=e([s]);function u(e){return{id:e.id,host:e.createdBy?.username??"Unknown",players:(e.players??[]).map(e=>e.username),maxPlayers:e.amountOfPlayers,targetScore:e.targetScore,cardsPerPlayer:e.cardsPerPlayer,status:e.status}}s=(i.then?(await i)():i)[0];let o=(0,s.createAsyncThunk)("lobby/fetchGames",async()=>((await (0,n.B)(d.qV)).games??[]).map(u)),c=(0,s.createAsyncThunk)("lobby/create",async e=>{let a=await (0,n.B)(d.Ac,e);if(!a.createGame?.id)throw Error("Failed to create game");return a.createGame.id}),l=(0,s.createAsyncThunk)("lobby/join",async e=>(await (0,n.B)(d.du,{gameId:e.gameId}),e.gameId)),m=(0,s.createSlice)({name:"lobby",initialState:{games:[],currentGameId:null,status:"idle"},reducers:{setCurrentGameId:(e,a)=>{e.currentGameId=a.payload}},extraReducers:e=>{e.addCase(o.pending,e=>{e.status="loading",e.error=void 0}).addCase(o.fulfilled,(e,a)=>{e.status="idle",e.games=a.payload}).addCase(o.rejected,(e,a)=>{e.status="error",e.error=a.error.message}).addCase(c.fulfilled,(e,a)=>{e.currentGameId=a.payload}).addCase(l.fulfilled,(e,a)=>{e.currentGameId=a.payload})}}),{setCurrentGameId:g}=m.actions,y=m.reducer;t()}catch(e){t(e)}})},2008:(e,a,r)=>{"use strict";r.a(e,async(e,t)=>{try{r.d(a,{C:()=>i,T:()=>d});var s=r(3291),n=e([s]);let d=(s=(n.then?(await n)():n)[0]).useDispatch,i=s.useSelector;t()}catch(e){t(e)}})},4091:(e,a,r)=>{"use strict";r.a(e,async(e,t)=>{try{r.d(a,{h:()=>o});var s=r(3258),n=r(5557),d=r(3451),i=r(394),u=e([s,n,d,i]);[s,n,d,i]=u.then?(await u)():u;let o=(0,s.configureStore)({reducer:{auth:n.ZP,lobby:d.ZP,game:i.ZP}});t()}catch(e){t(e)}})},7562:()=>{},2785:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},6689:e=>{"use strict";e.exports=require("react")},997:e=>{"use strict";e.exports=require("react/jsx-runtime")},3258:e=>{"use strict";e.exports=import("@reduxjs/toolkit")},2024:e=>{"use strict";e.exports=import("graphql-ws")},3291:e=>{"use strict";e.exports=import("react-redux")},1395:e=>{"use strict";e.exports=import("tslib")}};var a=require("../webpack-runtime.js");a.C(e);var r=e=>a(a.s=e),t=a.X(0,[117,423],()=>r(6814));module.exports=t})();