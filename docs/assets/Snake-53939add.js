import{g as D,a as _}from"./index-4243d227.js";import{r as A,o as F,a as N,b as H,c as L,d as G}from"./index-081d04d0.js";const q={__name:"Snake",setup(T){const x=A(null),y=A(null);return F(()=>{const d=x.value.getBoundingClientRect(),w=y.value,h=window.devicePixelRatio;w.width=h*d.width,w.height=h*d.height;const r=w.getContext("2d");r.scale(h,h);let E=null;const i=20,m=d.width,f=d.height,O="red",g="gray",l={up:0,right:1,down:2,left:3};class k{constructor(e,n,t,o,a){this.x=e,this.y=n,this.w=t,this.h=o,this.color=a}draw(){const{x:e,y:n,w:t,h:o,color:a}=this;r.save(),r.fillStyle=a,r.beginPath(),r.fillRect(e,n,t,o),r.strokeRect(e,n,t,o),r.closePath(),r.restore()}}class P{constructor(){const e=[];for(let t=0;t<4;t++){const o=new k(20*t,0,i,i,g);e.splice(0,0,o)}const n=e[0];n.color=O,this.head=n,this.snakeParts=e,this.direction=l.right,this.isEatFood=!1}draw(){this.snakeParts.forEach(e=>{e.draw()})}move(){const{head:e,direction:n,snakeParts:t,isEatFood:o}=this,a=new k(e.x,e.y,e.w,e.h,g);switch(t.splice(1,0,a),!o&&t.pop(),n){case l.up:e.y-=e.h;break;case l.right:e.x+=e.w;break;case l.down:e.y+=e.h;break;case l.left:e.x-=e.w;break}}setIsEat(e){this.isEatFood=e}}class p{constructor(e){this.snake=e;const{x:n,y:t}=this.computeRandomPosition(),o=D();this.rect=new k(n,t,i,i,o)}computeRandomPosition(){let e=null,n=null,t=!0;const o=this.snake.snakeParts;for(;t;)e=_(0,m/20-1),n=_(0,f/20-1),t=o.some(a=>a.x===e&&a.y===n);return{x:e*i,y:n*i}}get x(){return this.rect.x}get y(){return this.rect.y}draw(){this.rect.draw()}}const c=new P;let u=new p(c);const S=()=>{const{head:s}=c;return s.x===u.x&&s.y===u.y},C=()=>{r.clearRect(0,0,m,f),u.draw();const s=S();c.setIsEat(s),c.move(),c.draw(),s&&(u=new p(c))},B=()=>{const{head:s,snakeParts:e}=c,n=s.x<0||s.x>=m||s.y<0||s.y>=f,t=e.slice(1).some(o=>o.x===s.x&&o.y===s.y);return n||t},v=s=>{s.preventDefault();const{up:e,right:n,down:t,left:o}=l,a=c.direction;switch(s.keyCode){case 87:a!==t&&(c.direction=e);break;case 68:a!==o&&(c.direction=n);break;case 83:a!==e&&(c.direction=t);break;case 65:a!==n&&(c.direction=o);break}};let b=Date.now();const R=()=>{if(B())return;const e=Date.now();e-b>200&&(C(),b=e),E=window.requestAnimationFrame(R)};R(),document.addEventListener("keydown",v),N(()=>{document.removeEventListener("keydown",v),window.cancelAnimationFrame(E)})}),(I,d)=>(H(),L("div",{class:"box",ref_key:"boxElementRef",ref:x},[G("canvas",{class:"canvas",ref_key:"canvasElementRef",ref:y},null,512)],512))}};export{q as default};
