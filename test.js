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
    var jointData = { "SpineBase": null, "SpineMid": null, "Neck": null, "Head": null, "ShoulderLeft": null, "ElbowLeft": null, "WristLeft": null, "HandLeft": null, "ShoulderRight": null, "ElbowRight": null, "WristRight": null, "HandRight": null, "HipLeft": null, "KneeLeft": null, "AnkleLeft": null, "FootLeft": null, "HipRight": null, "KneeRight": null, "AnkleRight": null, "FootRight": null, "SpineShoulder": null, "HandTipLeft": null, "ThumbLeft": null, "HandTipRight": null, "ThumbRight": null };
    var rightHandState = "Unknown";
    var leftHandState = "Unknown";

    var JoinedHands = false;
    var WaveRight = false;
    var WaveLeft = false;
    var SwipeLeft = false;
    var SwipeRight = false;
    var SwipeUp = false;
    var SwipeDown = false;
    

    var connection = new WebSocket('ws://localhost:8181/');
    ext.connect = function (address, port)
    {
        connection = new WebSocket('ws://' + address + ':' + port + '/');
    };

    connection.onopen = function () {
        console.log('Connection open!');
    }

    connection.onclose = function () {
        console.log('Connection closed');
    }

    connection.onerror = function (error) {
        console.log('Error detected: ' + error.toString());
    }

    connection.onmessage = function (e) {        
        var kdata = JSON.parse(e.data);
         console.log(JSON.stringify(kdata));
        // Check if it's a body (could be a face etc.)
        if (kdata.type == "body") {
            jointData = kdata.joints;
            rightHandState = kdata.rightHandState;
            leftHandState = kdata.leftHandState;            
        }
        else if (kdata.type == "gesture") {
            switch(kdata.gesture)
            {
                //     Hands joined in front of chest.
                case "JoinedHands":
                    JoinedHands = true;
                    break;
                //     Waving using the right hand.
                case "WaveRight":
                    WaveRight = true;
                    break;
                //     Waving using the left hand.
                case "WaveLeft":
                    WaveLeft = true;
                    break;
                //     Hand moved horizontally from right to left.
                case "SwipeLeft":
                    SwipeLeft = true;
                    break;
                //     Hand moved horizontally from left to right.
                case "SwipeRight":
                    SwipeRight = true;
                    break;
                //     Hand moved vertically from hip center to head.
                case "SwipeUp":
                    SwipeUp = true;
                    break;
                //     Hand moved vertically from head to hip center.
                case "SwipeDown":
                    SwipeDown = true;
                    break;
                
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

    ext.getLimbValue = function (coordinate, side, bodyPart) {
        var joint = jointData[bodyPart + side];
        if (coordinate == "x")
            return joint[0];
        else if (coordinate == "y")
            return joint[1];
        else if (coordinate == "z")
            return joint[2];
        else
            return 0;
    };

    //jointData.Head[0]        
    ext.getTorsoValue = function (coordinate, torsoJoint) {        
        var joint = jointData[torsoJoint];        
        if (coordinate == "x")
            return joint[0];
        else if (coordinate == "y")
            return joint[1];
        else if (coordinate == "z")
            return joint[2];
        else
            return 0;
    };

    ext.getHandState = function (side, state) {
        if (side == "Right" && rightHandState == state)
            return true;

        if (side == "Left" && leftHandState == state)
            return true;

        return false;
    };

    // Leaving these out for now...
    /*
    ext.joinedHandsDetected = function () {
        var j = handStateData[side + "Hand"];
        return JSON.stringify(j[state]);
    };

    ext.waveDetected = function (side) {
        console.log("In WaveDetected");
        var waveVal = false;
        if (side == "Right")
        {
            waveVal = WaveRight;
            WaveRight = false;
        }
        else if (side == "Left")
        {
            waveVal = WaveLeft;
            WaveLeft = false;
        }
        return waveVal;
    };

    ext.swipeDetected = function (swipeDirection) {

        return false;
    };
    */
    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            //['w', 'Listen to Kinect at address %n on port %n', 'connect', 'localhost', '8181'],
            ['r', 'get %m.coordinate of %m.side %m.limbs', 'getLimbValue', 'x', 'Right', 'Hand'],
			['r', 'get %m.coordinate position of %m.side %m.limbs', 'getLimbValue', 'y', 'Right', 'Hand'],
			['r', 'get %m.coordinate position of %m.torso', 'getTorsoValue', 'x', 'Head'],
			['b', '%m.side Hand is %m.state', 'getHandState', 'Right', 'Closed'],
            ['b', '%m.side Hand is %m.state', 'getHandState', 'Left', 'Lasso'],
            //['b', 'hands joined', 'handsJoined'],
			//['h', 'When User Enters View', 'userEntered'],
			//['h', 'When User Exits View', 'userLost'],
			//['h', 'When Wave %m.side detected', 'waveDetected', 'Right'],
			//['h', 'When Swipe %m.swipeDirections detected', 'swipeDetected', 'Right'],
			//['h', 'When Joined Hands detected', 'joinedHandsDetected']
        ],
        menus: {
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
    ScratchExtensions.register('Kinectv2 To ScratchX 3.14', descriptor, ext);

})({});




