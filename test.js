// The MIT License (MIT)

// Copyright (c) 2015 Stephen Howell, stephenhowell@outlook.com

//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

(function (ext) {
    
    var jointData = { rightHandState: "Unknown", leftHandState: "Unknown", "SpineBase": null, "SpineMid": null, "Neck": null, "Head": null, "ShoulderLeft": null, "ElbowLeft": null, "WristLeft": null, "HandLeft": null, "ShoulderRight": null, "ElbowRight": null, "WristRight": null, "HandRight": null, "HipLeft": null, "KneeLeft": null, "AnkleLeft": null, "FootLeft": null, "HipRight": null, "KneeRight": null, "AnkleRight": null, "FootRight": null, "SpineShoulder": null, "HandTipLeft": null, "ThumbLeft": null, "HandTipRight": null, "ThumbRight": null };    

    var bodies = [jointData, jointData, jointData, jointData, jointData, jointData, jointData]; // Closest and 6 maximum bodies
    
    var entry = false;
    var exit = false;


    var connection = new WebSocket('ws://localhost:8181/');
    
    ext.connect = function (address, port)
    {
        connection = new WebSocket('ws://' + address + ':' + port + '/');
    };

    connection.onopen = function () {
        console.log('Connection to localhost:8181 open!');
    }

    connection.onclose = function () {
        console.log('Connection to localhost:8181 closed!');
    }

    connection.onerror = function (error) {
        console.log('Error detected: ' + error.toString());
    }

    connection.onmessage = function (e) {        
        var kdata = JSON.parse(e.data); // console.log(JSON.stringify(kdata));

        // Check if it's a body (could be a face etc.)
        if (kdata.type == "body") {
            bodies[kdata.index] = kdata.joints;
            bodies[kdata.index]["rightHandState"] = kdata.rightHandState;
            bodies[kdata.index]["leftHandState"] = kdata.leftHandState;            
        }
        else if (kdata.type == "event")
        {
            if(kdata.eventType == "entry")
            {
                entry = true;
            }
            else if(kdata.eventType == "exit")
            {
                exit = true;
            }
                     
        }
    }

    // Cleanup function when the extension is unloaded
    ext._shutdown = function () { if (connection.socket.connected) { connection.socket.disconnect(); } };

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function () {
        if (connection.readyState == 1) {
            return { status: 2, msg: 'Connected' };
        }
        else {
            connection = new WebSocket('ws://localhost:8181/'); // Does nae work at all
            return { 
                status: 1, msg: 'Not connected, attempting reconnection, make sure Kinect2ScratchX is running!' 
            };
        }
    };

    ext.Disconnect = function (callback) {
        if (!(connection === null)) {
            if (connection.readyState == 1) {
                //console.log("disconnecting from server");
                connection.close();
            } else { console.log("Disconnect: socket already disconnected"); }
        }
    };
    
    // There must be a nicer way to do this
    ext.convertDescToIndex = function (bodyDesc) {
        switch (bodyDesc)
        {
            case 'Closest Person': return 0; break;
            case 'Person 1': return 1; break;
            case 'Person 2': return 2; break;
            case 'Person 3': return 3; break;
            case 'Person 4': return 4; break;
            case 'Person 5': return 5; break;
            case 'Person 6': return 6; break;
        }
        return 0;
    };

    ext.getLimbValue = function (coordinate, side, bodyPart, desc)
    {
        var index = convertDescToIndex(desc);
        var joint = bodies[index].jointData[bodyPart + side]; // bodies...index...
        console.log(JSON.stringify(joint));
        if (coordinate == "x")
            return joint[0];
        else if (coordinate == "y")
            return joint[1];
        else if (coordinate == "z")
            return joint[2];
        else
            return 0;
    };
      
    ext.getTorsoValue = function (coordinate, torsoJoint, index) {        
        var joint = bodiesjointData[torsoJoint];        
        if (coordinate == "x")
            return joint[0];
        else if (coordinate == "y")
            return joint[1];
        else if (coordinate == "z")
            return joint[2];
        else
            return 0;
    };

    ext.getHandState = function (side, state, index) {
        if (side == "Right" && rightHandState == state)
            return true;

        if (side == "Left" && leftHandState == state)
            return true;

        return false;
    };

    ext.userEntered = function () {
        var result = entry;
        entry = false;
        return result;
    };

    ext.userLost = function () {
        var result = exit;
        exit = false;
        return result;
    };

    // Block and block menu descriptions
    var descriptor = {
        blocks: [            
            ['h', 'When a person enters view', 'userEntered'],
            ['r', 'number of tracked people', 'getTrackedUsers'],
            ['r', '%m.coordinate of %m.side %m.limbs of %m.index', 'getLimbValue', 'x', 'Right', 'Hand', 'Closest Person'],
            ['r', '%m.coordinate of %m.side %m.limbs of %m.index', 'getLimbValue', 'y', 'Right', 'Hand', 'Closest Person'],
            ['r', '%m.coordinate of %m.side %m.limbs of %m.index', 'getLimbValue', 'z', 'Right', 'Hand', 'Closest Person'],			
			['r', '%m.coordinate of %m.torso of %m.index', 'getTorsoValue', 'x', 'Head', 'Closest Person'],
			['b', '%m.index %m.side Hand is %m.state', 'Closest Person', 'getHandState', 'Right', 'Closed'],
            ['b', '%m.index %m.side Hand is %m.state', 'Closest Person', 'getHandState', 'Left', 'Lasso'],
            ['h', 'When a person exits view', 'userLost']
        ],
        menus: {
            index: ["Closest Person", "Person 1", "Person 2", "Person 3", "Person 4", "Person 5", "Person 6"],
            coordinate: ["x", "y", "z"],
            side: ["Right", "Left"],
            swipeDirections: ["Right", "Left", "Up", "Down"],
            state: ["Open", "Closed", "Lasso", "Unknown"],
            torso: ["Head", "Neck", "SpineShoulder", "SpineMid", "SpineBase"],
            limbs: ["Shoulder", "Elbow", "Wrist", "Hand", "HandTip", "Thumb", "Hip", "Knee", "Ankle", "Foot"]
        },
        url: 'http://stephenhowell.github.io'
    };

    // Register the extension
    ScratchExtensions.register('Kinect To ScratchX 3', descriptor, ext);

})({});




