import{_ as w,r as m,o as b,a as B,b as E,c as R,w as X,v as Y,d as y}from"./index-081d04d0.js";const g={class:"tip"},P={__name:"Ball",setup(k){const x=m(!0),u=m(null),_=m(null);return b(()=>{const l=u.value.getBoundingClientRect(),s=_.value,c=window.devicePixelRatio;s.width=c*l.width,s.height=c*l.height;const n=s.getContext("2d");n.scale(c,c);let o=null,a=null,r=null;const t={minX:0,minY:0,maxX:l.width,maxY:l.height};function d(e){this.x=e.x,this.y=e.y,this.radius=e.radius||16,this.color=e.color||"red"}d.prototype.changePosition=function(e){this.x=e.x,this.y=e.y},d.prototype.draw=function(){const{x:e,y:i,color:p,radius:v}=this;n.fillStyle=p,n.beginPath(),n.arc(e,i,v,0,2*Math.PI),n.fill(),n.closePath()};function h(){n.fillStyle="rgba(0, 0, 0,0.4)",n.fillRect(t.minX,t.minY,t.maxX,t.maxY);const e=o.radius,i={x:o.x+a.x,y:o.y+a.y};a.y*=.99,a.y+=.25,(i.x>t.maxX-e||i.x<t.minX+e)&&(a.x=-a.x),(i.y>t.maxY-e||i.y<t.minY+e)&&(a.y=-a.y),o.changePosition(i),o.draw(),r=window.requestAnimationFrame(h)}s.addEventListener("click",e=>{x.value=!1,n.clearRect(t.minX,t.minY,t.maxX,t.maxY),r&&window.cancelAnimationFrame(r),o=new d({x:e.clientX-l.left,y:e.clientY-l.top}),a={x:5,y:2},h()}),B(()=>window.cancelAnimationFrame(r))}),(f,l)=>(E(),R("div",{class:"box",ref_key:"boxElementRef",ref:u},[X(y("span",g,"请点击查看效果",512),[[Y,x.value]]),y("canvas",{class:"canvas",ref_key:"canvasElementRef",ref:_},null,512)],512))}},A=w(P,[["__scopeId","data-v-cdc03645"]]);export{A as default};
