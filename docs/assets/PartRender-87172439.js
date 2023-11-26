import{g as R,a as d}from"./index-4243d227.js";import{_,r as v,o as b,a as C,b as P,c as X}from"./index-9a21a5d4.js";const Y={__name:"PartRender",setup(E){const m=v(null);return b(()=>{const u=m.value;class x{constructor(t){this.domElement=document.createElement("canvas"),this.ctx=this.domElement.getContext("2d"),this.setCanvasSize(t),this.setCanvasAttrs(),this.ctx.scale(t.pixel,t.pixel)}setCanvasSize(t){const{width:e,height:s,pixel:n}=t;this.width=e*n,this.height=s*n,this.styleWidth=e,this.styleHeight=s}setCanvasAttrs(){const{width:t,height:e,styleWidth:s,styleHeight:n,domElement:i}=this;i.width=t,i.height=e,i.style.cssText=`width:${s}px;height:${n}px;`}}class p{constructor(t,e,s,n){this.radius=s,this.color=n,this.update(t,e)}update(t,e){this.x=t,this.y=e,this.enclosureBox=this.computeEnclosureBox()}computeEnclosureBox(){const{x:t,y:e,radius:s}=this;return{minX:t-s,minY:e-s,maxX:t+s,maxY:e+s}}render(t){const{x:e,y:s,radius:n,color:i}=this;t.save(),t.fillStyle=i,t.beginPath(),t.arc(e,s,n,0,Math.PI*2),t.fill(),t.closePath(),t.restore()}}class w{constructor(t){const{container:e,usePartRender:s}=t,n=e.getBoundingClientRect();this.container=e,this.canvas=new x({pixel:window.devicePixelRatio,width:n.width,height:n.height}),this.bounding=n,this.offset=20,this.raf=null,this.usePartRender=!!s,this.circles=this.createCircles(),this.mountCanvas(),this.globalRender()}mountCanvas(){this.container.appendChild(this.canvas.domElement)}createCircles(){const{bounding:t,offset:e}=this,{width:s,height:n}=t,i=[];for(let c=0;c<1e4;c++){const r=d(e,s-e),h=d(e,n-e),o=d(10,20),a=R();i.push(new p(r,h,o,a))}return i}renderCircles(){const{canvas:t,circles:e}=this,s=t.ctx;for(const n of e)n.render(s)}globalRender(){const t=this.canvas.ctx,{width:e,height:s}=this.bounding;t.clearRect(0,0,e,s),this.renderCircles()}partRender(){const t=[],{dirtyRect:e,circles:s}=this,n=this.canvas.ctx,{width:i,height:c}=this.bounding;if(i-e.width<=50&&c-e.height<=50){this.globalRender();return}for(const l of s){const y=l.enclosureBox;this.checkIsIntersect(e,y)&&t.push(l)}const{x:r,y:h,width:o,height:a}=e;n.clearRect(r,h,o,a),n.save(),n.beginPath(),n.rect(r,h,o,a),n.clip();for(const l of t)l.render(n);n.restore()}checkIsIntersect(t,e){const s={width:e.maxX-e.minX,height:e.maxY-e.minY},n={x:e.minX+s.width/2,y:e.minY+s.height/2},i={x:t.x+t.width/2,y:t.y+t.height/2},c=Math.abs(i.x-n.x),r=Math.abs(i.y-n.y);return c<=(s.width+t.width)/2&&r<=(s.height+t.height)/2}computeDirtyRect(t,e){const s=Math.min(t.minX,e.minX),n=Math.min(t.minY,e.minY),i=Math.max(t.maxX,e.maxX),c=Math.max(t.maxY,e.maxY);return{x:s,y:n,width:i-s,height:c-n}}update(){const{circles:t,offset:e,usePartRender:s}=this,{width:n,height:i}=this.bounding,c=d(0,t.length-1),r=d(e,n-e),h=d(e,i-e),o=t[c],a=o.enclosureBox;o.update(r,h),s&&(this.dirtyRect=this.computeDirtyRect(a,o.enclosureBox))}animate(){this.update(),this.usePartRender?this.partRender():this.globalRender(),this.raf=window.requestAnimationFrame(this.animate.bind(this))}destroy(){window.cancelAnimationFrame(this.raf)}}const g=new w({container:u,usePartRender:!0});g.animate(),C(()=>g.destroy())}),(u,x)=>(P(),X("div",{class:"box",ref_key:"boxElementRef",ref:m},null,512))}},k=_(Y,[["__scopeId","data-v-a13216d4"]]);export{k as default};
