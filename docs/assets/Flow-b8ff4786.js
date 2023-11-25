import{a}from"./index-4243d227.js";import{r as g,o as x,a as f,b as w,c as v}from"./index-081d04d0.js";const E={__name:"Flow",setup(b){const l=g(null);return x(()=>{const c=l.value;let o=null;class p{constructor(t){this.domElement=document.createElement("canvas"),this.ctx=this.domElement.getContext("2d"),this.setCanvasSize(t),this.setCanvasAttrs(),this.ctx.scale(t.pixel,t.pixel)}setCanvasSize(t){const{width:e,height:s,pixel:i}=t;this.width=e*i,this.height=s*i,this.styleWidth=e,this.styleHeight=s}setCanvasAttrs(){const{width:t,height:e,styleWidth:s,styleHeight:i,domElement:n}=this;n.width=t,n.height=e,n.style.cssText=`width:${s}px;height:${i}px;`}}class u{constructor(t,e,s){this.x=t,this.y=e,this.color=s,this.speedRate=.4,this.speedX=0,this.speedY=0,this.nextX=t+this.speedX,this.nextY=e+this.speedY,this.life=a(20,600)}update(){this.x=this.nextX,this.y=this.nextY,this.speedX+=a(-1,1)*this.speedRate,this.speedY+=a(-1,1)*this.speedRate,this.nextX+=this.speedX,this.nextY+=this.speedY,this.life-=1}render(t){t.save(),t.lineWidth=3,t.lineCap="round",t.strokeStyle=this.color,t.beginPath(),t.moveTo(this.x,this.y),t.lineTo(this.nextX,this.nextY),t.stroke(),t.closePath(),t.restore()}}class m{constructor(t){this.container=t.container;const e=this.container.getBoundingClientRect();this.canvas=new p({pixel:window.devicePixelRatio,width:e.width,height:e.height}),this.bounding=e,this.particleTotal=300,this.particles=[],this.createParticles(),this.mountCanvas()}mountCanvas(){this.container.appendChild(this.canvas.domElement)}getParticleInstance(){const{width:t,height:e}=this.bounding,s=a(10,t),i=a(10,e);return new u(s,i,"rgb(167, 88, 185)")}createParticles(){const{particles:t,particleTotal:e}=this;for(let s=0;s<e;s++){const i=this.getParticleInstance();t.push(i)}this.particles=t}render(){const t=[],e=[],{particles:s,bounding:i,canvas:n}=this,r=n.ctx;r.fillStyle="rgba(0,0,0,.4)",r.fillRect(0,0,i.width,i.height);for(const h of s)h.update(),h.life>0?t.push(h):e.push(this.getParticleInstance());for(const h of t)h.render(r);this.particles=[...t,...e],o=window.requestAnimationFrame(this.render.bind(this))}}new m({container:c}).render(),f(()=>window.cancelAnimationFrame(o))}),(c,o)=>(w(),v("div",{class:"box",ref_key:"boxElementRef",ref:l},null,512))}};export{E as default};
