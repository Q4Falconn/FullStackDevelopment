exports.id=704,exports.ids=[704],exports.modules={6814:(e,r,a)=>{"use strict";a.a(e,async(e,t)=>{try{a.r(r),a.d(r,{default:()=>m});var n=a(997);a(7562);var s=a(3291);a(6689);var o=a(4091),d=a(5640),i=a(2008),l=a(5557),u=e([s,o,d,i,l]);function c({Component:e,pageProps:r}){return(0,i.T)(),(0,n.jsxs)(n.Fragment,{children:[n.jsx(d.Z,{}),n.jsx("div",{className:"container",children:n.jsx(e,{...r})})]})}function m(e){return n.jsx(s.Provider,{store:o.h,children:n.jsx(c,{...e})})}[s,o,d,i,l]=u.then?(await u)():u,t()}catch(e){t(e)}})},7190:(e,r,a)=>{"use strict";a.d(r,{B:()=>n});let t=process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL??"http://localhost:4000/graphql";async function n(e,r){let a=localStorage.getItem("auth_token"),n=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json",...a?{Authorization:`Bearer ${a}`}:{}},body:JSON.stringify({query:e,variables:r})});if(!n.ok){let e=await n.text();throw Error(`GraphQL HTTP error ${n.status}: ${e}`)}let s=await n.json();if(s.errors?.length)throw Error(s.errors.map(e=>e.message).join("\n"));return s.data}},3518:(e,r,a)=>{"use strict";a.a(e,async(e,t)=>{try{a.d(r,{f:()=>d});var n=a(2024),s=a(77),o=e([n,s]);[n,s]=o.then?(await o)():o;let i=process.env.NEXT_PUBLIC_GRAPHQL_WS_URL??"ws://localhost:4000/graphql",l=null;function d(e,r){return new s.y(a=>{let t=(l||(l=(0,n.createClient)({url:i,connectionParams:()=>{let e=localStorage.getItem("auth_token");return e?{Authorization:`Bearer ${e}`}:{}}}))).subscribe({query:e,variables:r},{next:e=>{if(e.errors?.length){a.error(Error(e.errors.map(e=>e.message).join("\n")));return}a.next(e.data)},error:e=>a.error(e),complete:()=>a.complete()});return()=>{try{t()}catch{}}})}t()}catch(e){t(e)}})},1875:(e,r,a)=>{"use strict";a.d(r,{Ac:()=>d,D9:()=>s,FD:()=>l,KC:()=>y,MM:()=>m,O2:()=>t,Of:()=>u,Yx:()=>c,dd:()=>n,du:()=>i,qV:()=>o});let t=`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user { id username }
    }
  }
`,n=`
  mutation CreateUser($username: String!, $password: String!) {
    createUser(username: $username, password: $password) { id username }
  }
`,s=`
  query Me { me { id username } }
`,o=`
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
`,d=`
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
`,i=`
  mutation JoinGame($gameId: String!) { joinGame(gameId: $gameId) }
`,l=`
  mutation StartGame($gameId: String!) { startGame(gameId: $gameId) { id status state } }
`,u=`
  query Game($gameId: String!) {
    game(gameId: $gameId) {
      id status state
      players { id username }
      createdBy { id username }
      amountOfPlayers targetScore cardsPerPlayer
    }
  }
`,c=`
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
`,y=`
  mutation PlayCard($gameId: String!, $cardIndex: Int!, $nextColor: Color) {
    playCard(gameId: $gameId, cardIndex: $cardIndex, nextColor: $nextColor) { id status state }
  }
`},5640:(e,r,a)=>{"use strict";a.a(e,async(e,t)=>{try{a.d(r,{Z:()=>u});var n=a(997),s=a(1664),o=a.n(s);a(6689);var d=a(2008),i=a(5557),l=e([d,i]);function u(){let e=(0,d.T)(),{isAuthenticated:r,user:a}=(0,d.C)(e=>e.auth);return(0,n.jsxs)("nav",{className:"nav",children:[n.jsx(o(),{href:r?"/":"/login",style:{fontWeight:700,textDecoration:"none"},children:"UNO"}),r&&(0,n.jsxs)(n.Fragment,{children:[n.jsx(o(),{href:"/",children:"Setup"}),n.jsx(o(),{href:"/play",children:"Play"}),n.jsx(o(),{href:"/summary",children:"Summary"}),n.jsx("div",{className:"spacer"}),n.jsx("span",{style:{opacity:.8},children:a?.username}),n.jsx("button",{onClick:()=>{e((0,i.kS)()),"undefined"!=typeof document&&(document.cookie="auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT")},children:"Logout"})]})]})}[d,i]=l.then?(await l)():l,t()}catch(e){t(e)}})},5557:(e,r,a)=>{"use strict";a.a(e,async(e,t)=>{try{a.d(r,{ZP:()=>m,kS:()=>c,x4:()=>l,z2:()=>i});var n=a(3258),s=a(7190),o=a(1875),d=e([n]);n=(d.then?(await d)():d)[0];let i=(0,n.createAsyncThunk)("auth/register",async e=>{let r=e.username.trim(),a=e.password;if(!r||!a)throw Error("Username and password required");return await (0,s.B)(o.dd,{username:r,password:a}),(await (0,s.B)(o.O2,{username:r,password:a})).login}),l=(0,n.createAsyncThunk)("auth/login",async e=>{let r=e.username.trim(),a=e.password;if(!r||!a)throw Error("Username and password required");let t=await (0,s.B)(o.O2,{username:r,password:a});if(!t.login?.token||!t.login?.user)throw Error("Invalid username or password");return t.login}),u=(0,n.createAsyncThunk)("auth/refreshMe",async()=>null),c=(0,n.createAsyncThunk)("auth/logout",async()=>!0),m=(0,n.createSlice)({name:"auth",initialState:{user:null,isAuthenticated:!1,status:"idle"},reducers:{},extraReducers:e=>{e.addCase(l.pending,e=>{e.status="loading",e.error=void 0}).addCase(l.fulfilled,(e,r)=>{e.status="idle",e.user=r.payload.user,e.isAuthenticated=!0,r.payload.user}).addCase(l.rejected,(e,r)=>{e.status="error",e.error=r.error.message}).addCase(i.pending,e=>{e.status="loading",e.error=void 0}).addCase(i.fulfilled,(e,r)=>{e.status="idle",e.user=r.payload.user,e.isAuthenticated=!0,r.payload.user}).addCase(i.rejected,(e,r)=>{e.status="error",e.error=r.error.message}).addCase(u.fulfilled,(e,r)=>{e.user=r.payload,e.isAuthenticated=!!r.payload,r.payload}).addCase(c.fulfilled,e=>{e.user=null,e.isAuthenticated=!1,e.status="idle",e.error=void 0})}}).reducer;t()}catch(e){t(e)}})},394:(e,r,a)=>{"use strict";a.a(e,async(e,t)=>{try{a.d(r,{Oq:()=>g,ZP:()=>P,t:()=>y,tv:()=>h,wc:()=>c,zK:()=>m});var n=a(3258),s=a(7190),o=a(1875),d=a(3518),i=a(3451),l=e([n,d,i]);[n,d,i]=l.then?(await l)():l;let u=null,c=(0,n.createAsyncThunk)("game/load",async e=>{let r=await (0,s.B)(o.Of,{gameId:e.gameId});if(!r.game)throw Error("Game not found");return r.game}),m=(0,n.createAsyncThunk)("game/subscribe",async(e,{dispatch:r})=>(u?.unsubscribe(),u=(0,d.f)(o.Yx,{gameId:e.gameId}).subscribe({next:e=>{e?.gameUpdated&&(r(p.actions.setServerGame(e.gameUpdated)),r((0,i.kT)()))},error:e=>{console.error("gameUpdated subscription error",e)}}),!0));(0,n.createAsyncThunk)("game/unsubscribe",async()=>(u?.unsubscribe(),u=null,!0));let y=(0,n.createAsyncThunk)("game/start",async(e,{dispatch:r})=>{await (0,s.B)(o.FD,{gameId:e.gameId});let a=await (0,s.B)(o.Of,{gameId:e.gameId});return a.game&&r(p.actions.setServerGame(a.game)),!0}),h=(0,n.createAsyncThunk)("game/draw",async e=>(await (0,s.B)(o.MM,{gameId:e.gameId}),!0)),g=(0,n.createAsyncThunk)("game/play",async e=>(await (0,s.B)(o.KC,{gameId:e.gameId,cardIndex:e.cardIndex,nextColor:e.nextColor??null}),!0)),p=(0,n.createSlice)({name:"game",initialState:{currentPlayerName:null,serverGame:null,status:"idle"},reducers:{setCurrentPlayerName:(e,r)=>{e.currentPlayerName=r.payload},setServerGame:(e,r)=>{e.serverGame=r.payload},clearGame:e=>{e.serverGame=null}},extraReducers:e=>{e.addCase(c.pending,e=>{e.status="loading",e.error=void 0}).addCase(c.fulfilled,(e,r)=>{e.status="idle",e.serverGame=r.payload}).addCase(c.rejected,(e,r)=>{e.status="error",e.error=r.error.message})}}),{setCurrentPlayerName:f,setServerGame:I,clearGame:w}=p.actions,P=p.reducer;t()}catch(e){t(e)}})},3451:(e,r,a)=>{"use strict";a.a(e,async(e,t)=>{try{a.d(r,{Mu:()=>c,ZP:()=>h,kT:()=>l,yO:()=>u});var n=a(3258),s=a(7190),o=a(1875),d=e([n]);function i(e){return{id:e.id,host:e.createdBy?.username??"Unknown",players:(e.players??[]).map(e=>e.username),maxPlayers:e.amountOfPlayers,targetScore:e.targetScore,cardsPerPlayer:e.cardsPerPlayer,status:e.status}}n=(d.then?(await d)():d)[0];let l=(0,n.createAsyncThunk)("lobby/fetchGames",async()=>((await (0,s.B)(o.qV)).games??[]).map(i)),u=(0,n.createAsyncThunk)("lobby/create",async e=>{let r=await (0,s.B)(o.Ac,e);if(!r.createGame?.id)throw Error("Failed to create game");return r.createGame.id}),c=(0,n.createAsyncThunk)("lobby/join",async e=>(await (0,s.B)(o.du,{gameId:e.gameId}),e.gameId)),m=(0,n.createSlice)({name:"lobby",initialState:{games:[],currentGameId:null,status:"idle"},reducers:{setCurrentGameId:(e,r)=>{e.currentGameId=r.payload}},extraReducers:e=>{e.addCase(l.pending,e=>{e.status="loading",e.error=void 0}).addCase(l.fulfilled,(e,r)=>{e.status="idle",e.games=r.payload}).addCase(l.rejected,(e,r)=>{e.status="error",e.error=r.error.message}).addCase(u.fulfilled,(e,r)=>{e.currentGameId=r.payload}).addCase(c.fulfilled,(e,r)=>{e.currentGameId=r.payload})}}),{setCurrentGameId:y}=m.actions,h=m.reducer;t()}catch(e){t(e)}})},9865:(e,r,a)=>{"use strict";a.d(r,{a1:()=>o});let t=e=>Math.floor(Math.random()*e);function n(e){for(let r=0;r<e.length-1;r++){let a=Math.floor(Math.random()*(e.length-r)+r),t=e[a];e[a]=e[r],e[r]=t}}var s=a(2127);function o(e,r){if(e.players.length<2)throw Error("A game must have at least two players.");if(e.targetScore<=0)throw Error("Target score must be positive.");if(e.scores.some(e=>e<0))throw Error("Scores must be non-negative.");if(e.scores.length!==e.players.length)throw Error("Scores length must match players length.");if(e.scores.filter(r=>r>e.targetScore).length>1)throw Error("There can be at most one winner.");let a={randomizer:r?.randomizer??t,shuffler:r?.shuffler??n},o=(()=>{for(let r=0;r<e.scores.length;r++)if(e.scores[r]>=e.targetScore)return r})();if(void 0===o&&void 0===e.currentRound)throw Error("An unfinished game must have a current round in the memento.");let d=void 0===o?(0,s.a1)(e.currentRound,a.shuffler):void 0;return{state:{players:[...e.players],scores:[...e.scores],targetScore:e.targetScore,cardsPerPlayer:e.cardsPerPlayer,currentRound:d},runtime:a}}},2127:(e,r,a)=>{"use strict";a.d(r,{tW:()=>o,a1:()=>d,$m:()=>s});let t=["BLUE","GREEN","RED","YELLOW"],n=["SKIP","REVERSE","DRAW","NUMBERED","WILD","WILD DRAW"];function s(e,r){return e.hands[r]??[]}function o(e,r){if(e.hands.some(e=>0===e.length))return!1;let a=e.playerInTurn;if(void 0===a)return!1;let t=e.hands[a]??[];if(r<0||r>=t.length)return!1;let n=t[r],s=e.discardPile[0];if(!s)throw Error("Discard pile is empty");let o=t.some(r=>"WILD"!==r.type&&"WILD DRAW"!==r.type&&"color"in r&&r.color===e.currentColor);return("WILD DRAW"!==n.type||!o)&&("WILD"===n.type||"WILD DRAW"===n.type||"color"in n&&n.color===e.currentColor||n.type===s.type&&"NUMBERED"!==n.type||"NUMBERED"===n.type&&"NUMBERED"===s.type&&n.number===s.number)}function d(e,r){let a=[...e.players];(function(e){if(e.length<2||e.length>10)throw Error("A round requires at least 2 players and at most 10 players.")})(a);let s=e.hands.map(e=>[...e]),o=e.drawPile,d=e.discardPile;if(s.filter(e=>0===e.length).length>1)throw Error("There are two or more winners in the memento");if(s.length!==a.length)throw Error("Memento hands length does not match number of players");if(!d||0===d.length)throw Error("Memento discard pile is empty");if(void 0===e.currentColor||!t.includes(e.currentColor))throw Error("Memento is missing currentColor");if(e.dealer<0||e.dealer>=a.length)throw Error("Memento has invalid dealer index");let i=d[0];if("WILD"!==i.type&&"WILD DRAW"!==i.type&&i.color!==e.currentColor)throw Error("Memento currentColor does not match top card color");let l=s.some(e=>0===e.length);if(void 0===e.playerInTurn&&!l)throw Error("Memento is missing playerInTurn");if(e.playerInTurn<0||e.playerInTurn>=a.length)throw Error("Memento has invalid playerInTurn index");return{players:a,dealer:e.dealer,hands:s,drawPile:function(e){if(!function(e){if(!Array.isArray(e)||!e.every(e=>n.includes(e?.type)))return!1;for(let r of e)if("NUMBERED"===r.type){if(void 0===r.color||void 0===r.number)return!1}else if(["SKIP","REVERSE","DRAW"].includes(r.type)&&void 0===r.color)return!1;return!0}(e))throw Error("Invalid cards in deck memento");return{cards:[...e]}}(o),discardPile:d,currentColor:e.currentColor,currentDirection:e.currentDirection,playerInTurn:l?void 0:e.playerInTurn,unoCalledBy:[]}}},2008:(e,r,a)=>{"use strict";a.a(e,async(e,t)=>{try{a.d(r,{C:()=>d,T:()=>o});var n=a(3291),s=e([n]);let o=(n=(s.then?(await s)():s)[0]).useDispatch,d=n.useSelector;t()}catch(e){t(e)}})},4091:(e,r,a)=>{"use strict";a.a(e,async(e,t)=>{try{a.d(r,{h:()=>l});var n=a(3258),s=a(5557),o=a(3451),d=a(394),i=e([n,s,o,d]);[n,s,o,d]=i.then?(await i)():i;let l=(0,n.configureStore)({reducer:{auth:s.ZP,lobby:o.ZP,game:d.ZP}});t()}catch(e){t(e)}})},7562:()=>{}};