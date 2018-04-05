var VideoExporter = function () {
    
    var VERBOSE = false; 
    var worker;
    
    var self = this; 
    self.currentCallback;

    self.exportedVideoData;
    
    self.percentCallback = function (percent) {
        console.log(percent); 
    }
    
    self.completedCallback = function (videoBuffer) {
        self.downloadFile(videoBuffer, "output.mp4"); 
        console.log("Completed!"); 
    }
    
    var downloadItem; 
    var videoLength = 5000; // milliseconds 
    var running = false;
    var isWorkerLoaded = false;
    
    var isSupported = (function() {
     return document.querySelector && window.URL && window.Worker;
    });

    this.init = function () {
        initWorker(); 
    } 
    
    this.setVerbose = function (bool) {
        VERBOSE = bool; 
    }
    
    this.outputWorkerMessage = function (message) {
        if (message === undefined || message === -1) {
            if (VERBOSE) {
                console.log("Undefined message from worker:");
                console.log(message)
            }
        } else if (message.indexOf("Parsed_showinfo") !== -1) {
                self.percentCallback(self.getPercentageComplete(message)); 
        } else {
             if (VERBOSE) {
                    console.log(message);  
             }
        }
    }
    
    function initWorker() {
        worker = new Worker("lib/video-export/worker-asm.js");
        worker.onmessage = function (event) {
            var message = event.data;
            if (message.type == "ready") {
                isWorkerLoaded = true;
                /*worker.postMessage({
                    type: "command",
                    arguments: ["-help"]
                });*/
            } else if (message.type == "stdout") {
                self.outputWorkerMessage(message.data); 
            } else if (message.type == "start") {
                self.outputWorkerMessage("Worker has received command\n"); 
            } else if (message.type == "done") {
                stopRunning();
                self.outputWorkerMessage("Worker has sent done message."); 
                console.log(message.data)
                if(message.data instanceof Array) {
                    console.log('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD')
                    console.log(message.data[0])
                    self.currentCallback(message.data[0].data);
                } else if(message.data instanceof ArrayBuffer) {
                    self.currentCallback(message.data);
                }
            };
        };
    }
    
    function isReady() {
        return !running && isWorkerLoaded;
    }

    function startRunning() {
        running = true;
    }

    function stopRunning() {
        running = false;
    }

    function parseArguments(text) {
        text = text.replace(/\s+/g, ' ');
        var args = [];
        // Allow double quotes to not split args.
        text.split('"').forEach(function(t, i) {
            t = t.trim();
            if ((i % 2) === 1) {
                args.push(t);
            } else {
                args = args.concat(t.split(" "));
            }
        });
        return args;
    }

    var audioTracks = [];
    this.addAudioTrack = function (buffer, trimStart, trimEnd, delay) {
        audioTracks.push({
            buffer: buffer,
            trimStart, trimStart,
            trimEnd: trimEnd,
            delay: delay
        })
    }

    this.mergeAudioTracks = function (args) {
        var ffmpegCommandFormat = '-i in1.mp3 -i in2.mp3 -i in3.mp3 -filter_complex "[0]atrim=1:2[a]; [1]adelay=3000|3000[b]; [2]adelay=2000|2000[c]; [a][b][c]amix=3,volume=3" out.ogg'
        var ffmpegCommand = ''

        var sampleFilenames = [];
        for(var i = 0; i < audioTracks.length; i++) {
            var filename = 'in'+(i+1)+'.mp3';
            sampleFilenames.push(filename);
            ffmpegCommand += '-i ' + filename + ' ';
        }

        ffmpegCommand += '-filter_complex "'

        var letters = ['a','b','c']
        var sampleBuffers = [];
        for(var i = 0; i < audioTracks.length; i++) {
            var audioTrack = audioTracks[i];
            sampleBuffers.push(audioTrack.buffer);
            ffmpegCommand += '['+i+']adelay='+audioTrack.delay+'|'+audioTrack.delay+'['+String.fromCharCode(97 + i)+']; '
        }

        var letters = ''
        for(var i = 0; i < audioTracks.length; i++) {
            letters += '[' + String.fromCharCode(97 + i) + ']';
        }
        ffmpegCommand += letters+'amix='+audioTracks.length+',volume='+audioTracks.length+'" out.ogg'

        console.log(ffmpegCommand)
        console.log(audioTracks)

        this.runCommand(
            ffmpegCommand, 
            sampleFilenames, 
            sampleBuffers, 
            'audio_track_generation', 
            function (o) {
                audioTracks = [];
                args.callback(o)
            }
        );
    }

    //  renderVideoFromFrames (args)
    //  args.frames,                  type: Image Array
    //  args.framerate,               type: Number
    //  args.width,                   type: Number
    //  args.height,                  type: Number
    //  args.codec,                   type: String
    //  args.bitrate,                 type: String
    //  args.pixel_format,            type: String
    //  args.callback                 type: Function
    this.renderVideoFromFrames = function (args) {
        var commandFormat = '-r <FRAMERATE> -f image2 -s <WIDTH>x<HEIGHT> -i pic%12d.jpg -vcodec <CODEC> -vb <BITRATE> test.mp4';
        
        var framerate = args.framerate || 30;
        var width = args.width || 720;
        var height = args.height || 480;
        var codec = args.codec || 'mpeg4';
        var bitrate = args.bitrate || '20M';
        var frames = args.frames;
        var callback = args.callback;

        self.currentCallback = args.completedCallback;
        
        var command = commandFormat;
        command = command.replace('<FRAMERATE>', framerate)
        command = command.replace('<WIDTH>', width)
        command = command.replace('<HEIGHT>', height)
        command = command.replace('<BITRATE>', bitrate)
        command = command.replace('<CODEC>', codec)

        var files = [];
        frames.forEach(function (frame) {
            var i = frames.indexOf(frame);
            var paddedIndex = zeroFill(i, 12)
            var frameData = convertDataURIToBinary(frame.src);
            files.push({
                name: 'pic'+paddedIndex+'.jpg',
                data: frameData,
            })
        })

        var parsedArgs = parseArguments(command);
        worker.postMessage({
            commandName: 'convert_frames_to_video',
            type: "command",
            arguments: parsedArgs,
            files: files
        });
    }

    // Requires webm and ogg input. 
    
    //  args parameters
    //  videoBuffer,             type: Uint8Array;           // REQUIRED, video input
    //  soundBuffer,             type: Uint8Array;           // REQUIRED, sound input
    //  framerate,               type: Number;               // desired export framerate
    //  filename,                type: String;               // output filename
    //  videoLengthMs,           type: Number;               // full length of video in milliseconds
    //  percentCallback,         type: function              // function should receive a number of percentage complete
    //  completedCallback,       type: function              // function should receive a Uint8Array buffer with completed video
    this.exportVideo = function(args) {

        console.log(args)
            
            if (args.videoBuffer === undefined) {
                console.log("Error: No video data submitted"); 
                return; 
            } else if (args.soundBuffer === undefined) {
                console.log("Error: No sound data submitted"); 
                return; 
            } 
        
            if (args.framerate === undefined) {
                args.framerate = 30; 
            }

            if (args.filename === undefined) {
                args.filename = "wick-output.mp4"; 
            }

            if (args.videoLengthMs === undefined) {
                videoLength = 5000; // milliseconds
            } else {
                videoLength = args.videoLengthMs; 
            }
        
            if (args.percentCallback !== undefined) {
                self.percentCallback = args.percentCallback; 
            }
        
            if (args.completedCallback !== undefined) {
                self.currentCallback = args.completedCallback;
            }
    
            var videoExtension = "mp4"; 
            var soundExtension = "ogg";
            if (isReady()) {
                startRunning();
                var videoFilename = "video." + videoExtension; 
                var soundFilename = "input." + soundExtension;

                var command = "-i " + videoFilename + " -i " + soundFilename + " -vf showinfo -strict -2 " + "-r " + args.framerate + " " + args.filename; 

                var videoArgs = parseArguments(command);
                worker.postMessage({
                    commandName: 'video_audio_merge',
                    type: "command",
                    arguments: videoArgs,
                    files: [
                        {
                            "name": videoFilename,
                            "data": args.videoBuffer
                        },
                        {
                            "name": soundFilename,
                            "data": args.soundBuffer
                        }
                    ]
            });
        } else {
            if (VERBOSE) console.log("Video Exporter not yet ready"); 
        }
    }
    
    // command:         String                     // ffmpeg command
    // fileNames:       String array               // list of file names
    // fileBuffers:     Uint8Array array           // list of buffers corresponding to the fileNames
    // commandName:     String                     // name of the command being sent in, this will be added to all posted messages sent by the worker for this processed command.
    // commandCallback: function(Uint8Array)       // the function to callback when the worker has completed your command.
    // length of fileNames and fileBuffers must be equal. fileNames[i] should be the name fo the file for fileBuffers[i]; 
    this.runCommand = function(command, fileNames, fileBuffers, commandName, commandCallback) {

        // set callback for command.
        self.currentCallback = commandCallback; 

        // parse command arguments
        var commandArgs = parseArguments(command);
        var allFiles = []; 

        // Update filenames for fileInfo
        if (fileNames.length !== fileBuffers.length) {
            console.error("Files are not the same!"); 
            return; 
        }

        for (var i=0; i<fileNames.length; i++) {
            var fileInfo = {
                "name": fileNames[i],
                "data": fileBuffers[i],
            }
            allFiles.push(fileInfo); 
        }

        // Send command to worker
        worker.postMessage({
            type: "command",
            arguments: commandArgs,
            files: allFiles,
            commandName: commandName, 
        });
    
    }

    this.downloadFile = function(fileData, fileName) {
        var dl = document.createElement('a');
        dl.id = "invisibleDownloadElement"; 
        dl.style.display = "none"; 
        var blob = new Blob([fileData]);
        var src = window.URL.createObjectURL(blob);
        dl.download = fileName; 
        dl.href = src; 
        dl.dispatchEvent(new MouseEvent('click'));
    }
    
    this.getPercentageComplete = function(input) {
        var splitInput = input.split("pts:");
        var pts = splitInput[1].split(" ")[0];
        var value = pts/videoLength; 
        
        if (!isNaN(value)) {
            return value; 
        } else {
            return -1; 
        }
    }
}
