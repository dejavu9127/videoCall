
console.log("Page Script Loaded");
var HOST=location.origin.replace(/^http/,'ws');
var ws=new WebSocket(HOST);
console.log(HOST);
console.log(ws);
var elem=document.getElementById('output');

ws.onopen=function(){
ws.send(JSON.stringify({action:"login",name:"ani"}));
};

ws.onmessage=function(event){
	elem.innerHTML=event.data;
};