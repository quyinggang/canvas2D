import{r as P,o as b,b as u,c as x,d as M}from"./index-081d04d0.js";const I={__name:"Clock",setup(T){const i=P(null),h=P(null);return b(()=>{const s=i.value,a=h.value,g=s.clientWidth,k=s.clientHeight,d=window.devicePixelRatio,n=d*g,r=d*k;a.width=n,a.height=r;const e=a.getContext("2d"),f=()=>{e.save(),e.translate(n/2,r/2),e.rotate(-Math.PI/2),e.scale(2,2);const c=new Date,l=c.getSeconds(),m=c.getMinutes();let o=c.getHours();o=o>=12?o-12:o,e.save(),e.strokeStyle="rgb(129, 129, 129)",e.lineWidth=2;for(let t=0;t<12;t++)e.beginPath(),e.moveTo(60,0),e.lineTo(70,0),e.stroke(),e.closePath(),e.rotate(2*Math.PI/12);e.restore(),e.save(),e.strokeStyle="rgb(172, 172, 172)";for(let t=0;t<60;t++)t%5!==0&&(e.beginPath(),e.moveTo(63,0),e.lineTo(70,0),e.stroke(),e.closePath()),e.rotate(Math.PI/30);e.restore(),e.save(),e.rotate(2*Math.PI/12*o+2*Math.PI/12/60*m+2*Math.PI/12/60/60*l),e.strokeStyle="#000",e.lineWidth=4,e.beginPath(),e.moveTo(-10,0),e.lineTo(36,0),e.stroke(),e.closePath(),e.restore(),e.save(),e.rotate(2*Math.PI/60*m+2*Math.PI/60/60*l),e.strokeStyle="rgb(156, 156, 156)",e.lineWidth=3,e.beginPath(),e.moveTo(-13,0),e.lineTo(46,0),e.stroke(),e.closePath(),e.restore(),e.save(),e.rotate(2*Math.PI/60*l),e.strokeStyle="rgb(161, 82, 82)",e.lineWidth=2,e.beginPath(),e.moveTo(-16,0),e.lineTo(54,0),e.stroke(),e.closePath(),e.restore(),e.restore()},v=()=>{requestAnimationFrame(v),e.clearRect(0,0,n,r),f()};v()}),(s,a)=>(u(),x("div",{class:"box",ref_key:"boxElementRef",ref:i},[M("canvas",{class:"canvas",ref_key:"canvasElementRef",ref:h},null,512)],512))}};export{I as default};
