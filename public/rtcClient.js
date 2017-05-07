
console.log("Page Script Loaded");
var HOST=location.origin.replace(/^http/,'ws');



console.log("WebRTC CLient Page Initialized");



var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

var loginName=document.querySelector("#loginName");
var clientName=document.querySelector("#clientName");
var loginBtn=document.querySelector("#loginBtn");
var connectBtn=document.querySelector("#connectBtn");
var localVideo=document.querySelector("#player");
var remoteVideo=document.querySelector("#remotePlayer");


var localStreamVideo,remoteStreamVideo;


var rtcconnection=new WebSocket(HOST); 
console.log("Signaling Server"+rtcconnection);
var name = "";
var winName=window.name;

console.log("WebSocketServerConnection with Signaling Server");
console.log(rtcconnection);


var connectedUser, localConnection, localChannel,receiveChannel;


rtcconnection.onclose=function(){
    console.log("SIgnaling Server Connection closed");
};

//when a user clicks the login button 
rtcconnection.onopen= function(event) { 
    console.log("RTC-WebSocket Connection open");
   
    
}; 

loginBtn.onclick=function(){
    console.log("login Btn clicked");
    
      name=loginName.value;
    if(name.length > 0) { 
      send({ 
         action: "login", 
         name: name 
      }); 
   }
     
};	
   



//on receiving JSON message over websocket connection
rtcconnection.onmessage=function (message){
    console.log("*************************************************************");
    //console.log(localChannel);
    //console.log(localConnection);
    //parse incoming data
    var data=JSON.parse(message.data);
    console.log(data);
    //Callback as per required action
    switch(data.action) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer":
         handleAnswer(data.answer); 
         break; 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      default: 
         break; 
 }
    
};


function handleLogin(success){
    
    //setup webRTC connection
    if(success===false){
        alert("Username not available");
        console.log("Username taken. Please try different username");
    }else{
        //local video
        var mediaOptions={audio:true,video:true};

if(!navigator.getUserMedia){
    navigator.getUserMedia=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia;
}
if(!navigator.getUserMedia)
{
    alert('Get user media not supported');
    
}

navigator.getUserMedia(mediaOptions,function(localStream){
    localVideo.src=window.URL.createObjectURL(localStream);
    localStreamVideo=localStream;
        //alert("Login success");
        //STUN public servers
        var servers={iceServers:[{url:"stun:stun.l.google.com:19302"}],iceTransportPolicy:"all"};
    var pcConstraints = {};pcConstraints.optional=[{'googIPv6': true}];
    //local connection
   
    localConnection=new PeerConnection(servers,pcConstraints);
    console.log("RTC Peer connection was setup:");
    console.log(localConnection);
    //alert(localConnection);
    //on ICE candidate call function to add ICE candidate
    localConnection.onicecandidate=icecallback;
    localConnection.ondatachannel=channelCallback;
    localConnection.addStream(localStream);
    
    localConnection.onaddstream=function(event){
        console.log("Stream added");
        remoteVideo.src=window.URL.createObjectURL(event.stream);
    };
    
    //create Data Channel
    localChannel=localConnection.createDataChannel('sendDataChannel',{reliable:false});
    console.log("Local Data Channel created");
        console.log(localChannel);
    
    //handle data channel changes
    localChannel.onopen = onlocalChannelStateChange;
    localChannel.onclose = onlocalChannelStateChange;
    localChannel.onmessage=onlocalChannelMsgCallback;
    

    },function(err){
        console.log(err);
    });
}
}

function channelCallback(event){
    receiveChannel=event.channel;
    //handle data channel changes
    receiveChannel.onopen = onlocalChannelStateChange;
    receiveChannel.onclose = onlocalChannelStateChange;
    receiveChannel.onmessage=onrcvChannelMsgCallback;
}

connectBtn.onclick=function(){
    //Send offer to rtc echo server
   
   connectedUser = clientName.value;
    console.log("ConnectButton clicked"+connectedUser);
	  
   if (connectedUser.length > 0) 
   { 
      //make an offer 
      localConnection.createOffer().then(gotDescription1);
  }
          
    
};

function handleOffer(offer,name){
    
    connectedUser=name;
    localConnection.setRemoteDescription(new RTCSessionDescription(offer));
    localConnection.createAnswer().then(gotDescription2);
        
    
    }

    

function gotDescription2(answer){
localConnection.setLocalDescription(answer).then(
    send({
        action:"answer",
        answer:answer
    }));
        
}

function icecallback(event){
    
    //send candidate to other client
    if(event.candidate){
        send({
           action:"candidate",
           candidate:event.candidate
        });
    }
}

function onlocalChannelStateChange(){
   var readyState = localChannel.readyState;
  console.log('Local channel state is: ' + readyState);
  if (readyState === 'open') {
    
    //alert("Channel Open");
    localConnection.addStream(localStreamVideo); 
    
  } else {
    
    alert("Channel Closed");
  }
}



function gotDescription1(offer){
    //set localdescription of local connection
    localConnection.setLocalDescription(offer).then(//send offer to the client to be connected
    send({
        action:"offer",
        offer:offer
    }));
    console.log("Created offer:"+offer.sdp);
    
    
    //on receiving offer the client needs to set its remote description as offer
  
}





//if connecting client sends its answer
function handleAnswer(ans){
    console.log("Got answer"+ans);
    localConnection.setRemoteDescription(new RTCSessionDescription(ans));
}

function handleCandidate(candidate){
    //add the received ice candidate to local connection
    console.log("Got candidate");
    var tempCand=new RTCIceCandidate(candidate);
    console.log(tempCand.candidate);
    
    localConnection.addIceCandidate(tempCand);
}





function onlocalChannelMsgCallback(event){
    console.log("Local Channel message received");
}


function onrcvChannelMsgCallback(event){
    console.log("Receive Channel message received");
    
}

function send(message){
    if(connectedUser){
        message.name=connectedUser;
        
    }
    rtcconnection.send(JSON.stringify(message));
}







