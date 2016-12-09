
var express=require('express');
var http=require('http');
var app=express();
var port=9090;
var path=__dirname+'/public';

var server=http.Server(app);


app.use('/',express.static(path));


server.listen(port,function(){
    console.log(server.address());
    console.log("RTC Signaling Server Listening on Port "+port);
});


var WebSocketServer=require('ws').Server;
var wss=new WebSocketServer({server:server});

var client=[];
var users={};



wss.on('connection',function(connection){
    console.log("**************New Connection**************************");
    //sendTo(connection,"Welcome");
    connection.on('message', function(message){
       //Process incoming JSON data
       
       console.log("- - - - - - - - - - - - - - - - - - - - - - - - - - - - ");
    
console.log("RTCSignalingServer>>>"+message);

var data;
try{
    data=JSON.parse(message);
}catch(e){
    console.log("Invlaid JSON format");
    data={};
}


//check type of action
switch (data.action) { 
         //when a user tries to login 
			
         case "login": 
            console.log("User logged", data.name); 
				
            //if anyone is logged in with this username then refuse 
            if(users[data.name]) { 
               sendTo(connection, { 
                  action: "login", 
                  success: false 
               }); 
               
            } else { 
               //save user connection on the server 
               users[data.name] = connection; 
               connection.name = data.name; 
               // save user info locally
               client.push({name:data.name,session:connection});
               
               sendTo(connection, { 
                  action: "login", 
                  success: true 
               }); 
            } 
				
            break; 
				
         case "offer": 
            //for ex. UserA wants to call UserB 
            console.log("Sending offer to: ", data.name); 
				
            //if UserB exists then send him offer details 
            var conn = users[data.name];
				
            if(conn != null) { 
               //setting that UserA connected with UserB 
               connection.otherName = data.name; 
					
               sendTo(conn, { 
                  action: "offer", 
                  offer: data.offer, 
                  name: connection.name 
               }); 
            } 
				
            break;  
				
         case "answer": 
            console.log("Sending answer to: ", data.name); 
            //for ex. UserB answers UserA 
            var conn = users[data.name]; 
				
            if(conn != null) { 
               connection.otherName = data.name; 
               sendTo(conn, { 
                  action: "answer", 
                  answer: data.answer 
               }); 
            } 
				
            break;  
				
         case "candidate": 
            console.log("Sending candidate to:",data.name); 
            var conn = users[data.name];  
				
            if(conn != null) { 
               sendTo(conn, { 
                  action: "candidate", 
                  candidate: data.candidate 
               });
               console.log(data.candidate.candidate);
            } 
				
            break;  
				
         case "leave": 
            console.log("Disconnecting from", data.name); 
            var conn = users[data.name]; 
            conn.otherName = null; 
				
            //notify the other user so he can disconnect his peer connection 
            if(conn != null) { 
               sendTo(conn, { 
                  action: "leave" 
               }); 
            }  
				
            break;  
				
         default: 
            sendTo(connection, { 
               action: "error", 
               message: "Command not found: " + data.action 
            }); 
				
            break; 
      }  
   });  
     
    connection.on('close',function(){
        if(connection.name){
            console.log("Deleted records for "+connection.name);
            delete users[connection.name];
        }
        
    });
    });
       
function sendTo(connection, message) { 
   connection.send(JSON.stringify(message)); 
}



 