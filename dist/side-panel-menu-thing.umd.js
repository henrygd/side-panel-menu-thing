!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).sidePanel=e()}(this,(function(){function t(){}const e=t=>t;function n(t,e){for(const n in e)t[n]=e[n];return t}function o(t){return t()}function r(t){t.forEach(o)}function s(t){return"function"==typeof t}function i(t,e){return t!=t?e==e:t!==e}function u(e,n,o){e.$$.on_destroy.push(function(e,...n){if(null==e)return t;const o=e.subscribe(...n);return o.unsubscribe?()=>o.unsubscribe():o}(n,o))}function l(t,e,n){return t.set(n),e}let c=t=>requestAnimationFrame(t);const a=new Set;function d(t){a.forEach((e=>{e.c(t)||(a.delete(e),e.f())})),0!==a.size&&c(d)}function f(t,e){t.appendChild(e)}function p(t){return document.createElement(t)}function h(){return document.createTextNode(" ")}function $(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function g(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function m(t,e,n,o){null===n?t.style.removeProperty(e):t.style.setProperty(e,n)}function y(t,e,n){t.classList[n?"add":"remove"](e)}let b;function w(t){b=t}const x=[],v=[],S=[],_=[],C=Promise.resolve();let E=0;function k(t){S.push(t)}const O=new Set;let H=0;function A(){const t=b;do{for(;H<x.length;){const t=x[H];H++,w(t),Y(t.$$)}for(w(null),x.length=0,H=0;v.length;)v.pop()();for(let t=0;t<S.length;t+=1){const e=S[t];O.has(e)||(O.add(e),e())}S.length=0}while(x.length);for(;_.length;)_.pop()();E=0,O.clear(),w(t)}function Y(t){if(null!==t.fragment){t.update(),r(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(k)}}function P(t,e){-1===t.$$.dirty[0]&&(x.push(t),E||(E=1,C.then(A)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function T(e,n,i,u,l,c,a,d=[-1]){const f=b;w(e);const p=e.$$={fragment:null,ctx:null,props:c,update:t,not_equal:l,bound:{},on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(n.context||(f?f.$$.context:[])),callbacks:{},dirty:d,skip_bound:0,root:n.target||f.$$.root};a&&a(p.root);let h=0;p.ctx=i?i(e,n.props||{},((t,n,...o)=>{const r=o.length?o[0]:n;return p.ctx&&l(p.ctx[t],p.ctx[t]=r)&&(!p.skip_bound&&p.bound[t]&&p.bound[t](r),h&&P(e,t)),n})):[],p.update(),h=1,r(p.before_update),p.fragment=u?u(p.ctx):0,n.target&&(p.fragment&&p.fragment.c(),function(t,e,n,i){const{fragment:u,on_mount:l,on_destroy:c,after_update:a}=t.$$;u&&u.m(e,n),i||k((()=>{const e=l.map(o).filter(s);c?c.push(...e):r(e),t.$$.on_mount=[]})),a.forEach(k)}(e,n.target,n.anchor,n.customElement),A()),w(f)}const L=[];function z(t){const e=t-1;return e*e*e+1}function M(t,e){if(t===e||t!=t)return()=>t;const n=typeof t;if(Array.isArray(t)){const n=e.map(((e,n)=>M(t[n],e)));return t=>n.map((e=>e(t)))}if("number"===n){const n=e-t;return e=>t+e*n}}function X(o,r={}){const s=function(e,n=t){let o;const r=new Set;function s(t){if(s=t,((n=e)!=n?s==s:n!==s||n&&"object"==typeof n||"function"==typeof n)&&(e=t,o)){const t=!L.length;for(const t of r)t[1](),L.push(t,e);if(t){for(let t=0;t<L.length;t+=2)L[t][0](L[t+1]);L.length=0}}var n,s}return{set:s,update:function(t){s(t(e))},subscribe:function(i,u=t){const l=[i,u];return r.add(l),1===r.size&&(o=n(s)||t),i(e),()=>{r.delete(l),0===r.size&&(o(),o=null)}}}}(o);let i,u=o;function l(t,l){if(null==o)return s.set(o=t),Promise.resolve();u=t;let f=i,p=0,{delay:h=0,duration:$=400,easing:g=e,interpolate:m=M}=n(n({},r),l);if(0===$)return f&&(f.abort(),f=null),s.set(o=u),Promise.resolve();const y=window.performance.now()+h;let b;return i=function(t){let e;return 0===a.size&&c(d),{promise:new Promise((n=>{a.add(e={c:t,f:n})})),abort(){a.delete(e)}}}((e=>{if(e<y)return 1;p||(b=m(o,t),"function"==typeof $&&($=$(o,t)),p=1),f&&(f.abort(),f=null);const n=e-y;return n>$?(s.set(o=t),0):(s.set(o=b(g(n/$))),1)})),i.promise}return{set:l,update:(t,e)=>l(t(u,o),e),subscribe:s.subscribe}}let j,q,{documentElement:B,body:N}=document;function D(e){let n,o,i,u,l,c,a,d,b;return{c(){n=p("div"),o=p("div"),i=h(),u=p("div"),g(o,"class","spmt-overlay"),m(o,"opacity",e[9]),g(u,"class","spmt"),m(u,"width",e[0]+"px"),m(u,"transform","translateX("+(e[2]?-1*e[5]:e[5])+"%)"),g(u,"tabindex",l=e[8]?"0":0),y(u,"left",e[2]),g(n,"class",a="spmt-wrap "+e[3]),g(n,"data-no-panel",""),y(n,"novis",!e[8]),y(n,"fixed",e[1])},m(r,l){var a;!function(t,e,n){t.insertBefore(e,n||null)}(r,n,l),f(n,o),f(n,i),f(n,u),e[21](u),e[23](n),d||(b=[$(o,"click",e[4]),(a=c=e[12].call(null,u,e[8]),a&&s(a.destroy)?a.destroy:t),$(u,"keydown",e[22])],d=1)},p(t,[e]){512&e&&m(o,"opacity",t[9]),1&e&&m(u,"width",t[0]+"px"),36&e&&m(u,"transform","translateX("+(t[2]?-1*t[5]:t[5])+"%)"),256&e&&l!==(l=t[8]?"0":0)&&g(u,"tabindex",l),c&&s(c.update)&&256&e&&c.update.call(null,t[8]),4&e&&y(u,"left",t[2]),8&e&&a!==(a="spmt-wrap "+t[3])&&g(n,"class",a),264&e&&y(n,"novis",!t[8]),10&e&&y(n,"fixed",t[1])},i:t,o:t,d(t){var o;t&&(o=n).parentNode.removeChild(o),e[21](null),e[23](null),d=0,r(b)}}}function F(t,e,n){let o,r,s,i,c,a,d,f,p,{target:h=null}=e,{content:$=null}=e,{width:g=400}=e,{duration:m=450}=e,{fixed:y=1}=e,{left:b=0}=e,{dragOpen:w=1}=e,{onShow:x=null}=e,{onHide:S=null}=e,{preventScroll:_=1}=e,{wrapClass:C=""}=e;$.parentElement?.removeChild($);const E=X(100,{duration:m,easing:z});u(t,E,(t=>n(5,s=t)));const k=t=>{l(E,s=0,s),p=t?t.target:null},O=()=>{l(E,s=100,s)};function H(t){if(!r||!(9===t.keyCode))return;const e=d.querySelectorAll("*"),n=Array.from(e).filter((t=>t.tabIndex>=0));if(n.length){t.preventDefault();let e=n.indexOf(document.activeElement);e+=n.length+(t.shiftKey?-1:1),e%=n.length,n[e].focus()}}return t.$$set=t=>{"target"in t&&n(13,h=t.target),"content"in t&&n(14,$=t.content),"width"in t&&n(0,g=t.width),"duration"in t&&n(15,m=t.duration),"fixed"in t&&n(1,y=t.fixed),"left"in t&&n(2,b=t.left),"dragOpen"in t&&n(16,w=t.dragOpen),"onShow"in t&&n(17,x=t.onShow),"onHide"in t&&n(18,S=t.onHide),"preventScroll"in t&&n(19,_=t.preventScroll),"wrapClass"in t&&n(3,C=t.wrapClass)},t.$$.update=()=>{32&t.$$.dirty&&n(9,o=(100-s)/100),32&t.$$.dirty&&n(8,r=s<100)},[g,y,b,C,O,s,d,f,r,o,E,H,function(t){return $&&t.appendChild($),h.addEventListener("touchstart",(t=>{let e=t.target.closest("[data-no-panel]");if(i=t.changedTouches[0].pageX,c=t.changedTouches[0].pageY,!r&&(e||!w))return void(a=null);let n=h.getBoundingClientRect(),o=r;(b&&i-n.left<30||!b&&n.right-i<30)&&(o=1),a=o?{start:s,time:t.timeStamp}:null}),{passive:1}),h.addEventListener("touchmove",(t=>{if(!r&&!a)return;let e=t.changedTouches[0],n=e.pageX-i,o=e.pageY-c;if(!a.go&&t.timeStamp-a.time<150&&(a.go=Math.abs(n)>2*Math.abs(o)),a.go){const t=a.start+n/g*(b?-100:100);t<=100&&t>=0&&E.set(t,{duration:0})}}),{passive:1}),h.addEventListener("touchend",(t=>{if(r){let{start:e,time:n}=a,o=e-s;t.timeStamp-n<300&&Math.abs(o)>5?o>0?k():O():s>70?O():k()}})),{update:t=>{t?(y&&_&&B.scrollHeight>B.clientHeight&&(j=j||getComputedStyle(B).overflowY,q=q||getComputedStyle(N).overflowY,B.style.overflowY="hidden",N.style.overflowY="scroll"),setTimeout((()=>f.focus()),99),x?.(d)):(p?.focus({preventScroll:1}),y&&_&&(B.style.overflowY=j,N.style.overflowY=j),S?.())}}},h,$,m,w,x,S,_,k,function(t){v[t?"unshift":"push"]((()=>{f=t,n(7,f)}))},t=>27===t.keyCode?O():H(t),function(t){v[t?"unshift":"push"]((()=>{d=t,n(6,d)}))}]}class I extends class{$destroy(){!function(t,e){const n=t.$$;null!==n.fragment&&(r(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){this.$$set&&0!==Object.keys(t).length&&(this.$$.skip_bound=1,this.$$set(t),this.$$.skip_bound=0)}}{constructor(t){super(),T(this,t,F,D,i,{target:13,content:14,width:0,duration:15,fixed:1,left:2,dragOpen:16,onShow:17,onHide:18,preventScroll:19,wrapClass:3,show:20,hide:4})}get target(){return this.$$.ctx[13]}set target(t){this.$$set({target:t}),A()}get content(){return this.$$.ctx[14]}set content(t){this.$$set({content:t}),A()}get width(){return this.$$.ctx[0]}set width(t){this.$$set({width:t}),A()}get duration(){return this.$$.ctx[15]}set duration(t){this.$$set({duration:t}),A()}get fixed(){return this.$$.ctx[1]}set fixed(t){this.$$set({fixed:t}),A()}get left(){return this.$$.ctx[2]}set left(t){this.$$set({left:t}),A()}get dragOpen(){return this.$$.ctx[16]}set dragOpen(t){this.$$set({dragOpen:t}),A()}get onShow(){return this.$$.ctx[17]}set onShow(t){this.$$set({onShow:t}),A()}get onHide(){return this.$$.ctx[18]}set onHide(t){this.$$set({onHide:t}),A()}get preventScroll(){return this.$$.ctx[19]}set preventScroll(t){this.$$set({preventScroll:t}),A()}get wrapClass(){return this.$$.ctx[3]}set wrapClass(t){this.$$set({wrapClass:t}),A()}get show(){return this.$$.ctx[20]}get hide(){return this.$$.ctx[4]}}return t=>new I({...t,props:t})}));
