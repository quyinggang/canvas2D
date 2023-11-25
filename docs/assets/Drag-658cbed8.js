import{a as m,g as p}from"./index-4243d227.js";import{r as y,o as v,b as C,c as b}from"./index-081d04d0.js";const R={__name:"Drag",setup(w){const a=y(null);return v(()=>{const h=a.value;class d{constructor(e){this.domElement=document.createElement("canvas"),this.ctx=this.domElement.getContext("2d"),this.setCanvasSize(e),this.setCanvasAttrs(),this.ctx.scale(e.pixel,e.pixel)}setCanvasSize(e){const{width:t,height:s,pixel:i}=e;this.width=t*i,this.height=s*i,this.styleWidth=t,this.styleHeight=s}setCanvasAttrs(){const{width:e,height:t,styleWidth:s,styleHeight:i,domElement:n}=this;n.width=e,n.height=t,n.style.cssText=`width:${s}px;height:${i}px;`}}class x{constructor(e,t,s,i){this.x=e,this.y=t,this.radius=s,this.color=i}update(e,t){this.x=e,this.y=t}render(e){const{x:t,y:s,radius:i,color:n}=this;e.save(),e.fillStyle=n,e.beginPath(),e.arc(t,s,i,0,Math.PI*2),e.fill(),e.closePath(),e.restore()}}class f{constructor(e){this.container=e.container;const t=this.container.getBoundingClientRect();this.canvas=new d({pixel:window.devicePixelRatio,width:t.width,height:t.height}),this.bounding=t,this.selectedCircle=null,this.isDragging=!1,this.oldPosition=null,this.circles=this.createCircles(),this.bindEvents(),this.moundCanvas()}moundCanvas(){this.container.appendChild(this.canvas.domElement)}createCircles(){const{width:e,height:t}=this.bounding,s=[50,e-50],i=[50,t-50],n=30,c=[];for(let o=0;o<10;o++){const r=new x(m(s[0],s[1]),m(i[0],i[1]),n,p());c.push(r)}return c}isPointInCircle(e,t){const s={x:t.x-e.x,y:t.y-e.y},i=Math.sqrt(s.x*s.x+s.y*s.y);return i>=0&&i<=e.radius}getSelectedCircle(e){let t=null;const s=this.circles;for(const i of s)if(this.isPointInCircle(i,e)){t=i;break}return t}bindEvents(){const e=this.canvas.domElement;e.addEventListener("mousedown",this.onMouseDown.bind(this)),e.addEventListener("mousemove",this.onMouseMove.bind(this)),e.addEventListener("mouseup",this.onMouseUp.bind(this))}onMouseDown(e){const t=this.bounding,s={x:e.pageX-t.left,y:e.pageY-t.top};this.isDragging=!0,this.oldPosition=s,this.selectedCircle=this.getSelectedCircle(s)}onMouseMove(e){const{isDragging:t,selectedCircle:s,circles:i,oldPosition:n,bounding:c}=this;if(!t||!s)return;const o={x:e.pageX-c.left,y:e.pageY-c.top},r={x:o.x-n.x,y:o.y-n.y};for(const l of i)if(l===s){const g={x:l.x+r.x,y:l.y+r.y};l.update(g.x,g.y);break}this.oldPosition=o,this.renderFrame()}onMouseUp(){this.isDragging=!1,this.selectedCircle=null}renderFrame(){const{canvas:e,circles:t,bounding:s}=this,i=e.ctx;i.clearRect(0,0,s.width,s.height);for(const n of t)n.render(i)}}new f({container:h}).renderFrame()}),(h,d)=>(C(),b("div",{class:"box",ref_key:"boxElementRef",ref:a},null,512))}};export{R as default};
