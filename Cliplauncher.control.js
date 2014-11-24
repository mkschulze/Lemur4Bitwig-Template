loadAPI(1);
//load ("DataManager.js");

host.defineController("liine", "Lemur Cliplauncher", "1.0", "233f58d0-7366-11e4-82f8-0800200c9a66");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Daemon Input 1"], ["Daemon Output 1"]);


/////////////////////////////////////////////////////////////////////////////////////////

// Main variable:
var lem;
//var data;


/////////////////////////////////////////////////////////////////////////////////////////

// Main Constructor where all the basics are set up:
function Lemur() {
    lem = this;



    // Setting Callbacks for Midi and Sysex
    host.getMidiInPort(0).setMidiCallback(onMidi);
    host.getMidiInPort(0).setSysexCallback(onSysex);

    this.isWritingClipLauncherAutomationEnabled = false;
    this.isLauncherOverdubEnabled = false;
    this.transpHasChanged = true;


    // ClipLauncher:
    this.clIsPlaying = [];
    this.clIsRecording = [];
    this.clIsQueued = [];
    this.clHasContent = [];
    this.clColor = [];
    this.clBright = [];

    // Initializations:
    for (var i=0; i<8; i++) {




        for (var j=0; j<4; j++) {
            this.clIsPlaying[j+i*4] = false;
            this.clIsRecording[j+i*4] = false;
            this.clIsQueued[j+i*4] = false;
            this.clHasContent[j+i*4] = false;
            this.clColor[j+i*4] = 5;
            this.clColor[j+i*4] = false;
        }
    }
    // Creating Views:
    this.transport = host.createTransport();  // this creates the ability to control transport
    this.masterTrack = host.createMasterTrack(0);
    this.tracks = host.createMainTrackBank(8, 0, 0);
    this.cTrack = host.createCursorTrack(1, 0);
    this.cDevice = lem.cTrack.getPrimaryDevice();
    this.uMap = host.createUserControls(8);
    this.cClipWindow = host.createTrackBank(6, 0, 5);
    this.cScenes = lem.cClipWindow.getClipLauncherScenes();


    this.cMacro = [];
    this.cPage = [];
    this.cClipTrack = [];
    this.cSlots = [];


    // Change States:
    this.trackHasChanged = false;
    this.deviceHasChanged = false;
    this.presetHasChanged = false;
    this.categoryHasChanged = false;
    this.creatorHasChanged = false;
    this.pPageHasChanged = false;

}



function init()
{




    // instantiate a new Lemur Object:
    new Lemur()

    // Creating Observers, indications etc.:

    lem.transport.addLauncherOverdubObserver(function(on){
        lem.isLauncherOverdubEnabled = on;
        lem.transpHasChanged = true;
    });
    lem.transport.addIsWritingClipLauncherAutomationObserver(function(on){
        lem.isWritingClipLauncherAutomationEnabled = on;
        lem.transpHasChanged = true;
    });



    /*for (var j=0; j<6; j++) {
        lem.cClipTrack[j] = lem.cClipWindow.getTrack(j);
        lem.cSlots[j] = lem.cClipTrack[j].getClipLauncherSlots();
        lem.cSlots[j].setIndication(true);
        lem.cSlots[j].addIsPlayingObserver(getClipValueFunc(j, lem.clIsPlaying));
        lem.cSlots[j].addIsRecordingObserver(getClipValueFunc(j, lem.clIsRecording));
        lem.cSlots[j].addIsQueuedObserver(getClipValueFunc(j, lem.clIsQueued));
        lem.cSlots[j].addHasContentObserver(getClipValueFunc(j, lem.clHasContent));
    }
     */
    for (var i=0; i<5; i++) {

        // Clips
        for(var k=0; k<6; k++) {

        }

    }

    for( var t = 0; t < 8; t++ )
    {
        var clipLauncher = lem.cClipTrack.getClipLauncher();
        clipLauncher.addHasContentObserver (getClipObserverFunc( t, 1 ) );
        clipLauncher.addIsPlayingObserver( getClipObserverFunc( t, 2 ) );
        clipLauncher.addIsRecordingObserver( getClipObserverFunc( t, 3 ) );
        clipLauncher.addIsQueuedObserver( getClipObserverFunc( t, 4 ) );
        clipLauncher.setIndication( true );
    }


}


function flush()
{

// Check if transport has changed and if yes, update all of the controlls:
    if (lem.transpHasChanged) {

        sendChannelController(0, 110, lem.isLauncherOverdubEnabled ? 127 : 0);
        sendChannelController(0, 111, lem.isWritingClipLauncherAutomationEnabled ? 127 : 0);
        lem.transpHasChanged = false;
    }

/*
    // Add another 4 step Loop for the Clip Launcher Grid:
    for(var m=0; m<6; m++) {
     host.getMidiOutPort(0).sendMidi(146, m+k*6, lem.clColor[m+k*6]);
     host.getMidiOutPort(0).sendMidi(145, m+k*6, (lem.clBright[m+k*6]) ? 1 : 0);
     //println(lem.clColor[m+k*4]);
     }*/
}








// React to incoming MIDI:
function onMidi(status, data1, data2)
{
    printMidi(status, data1, data2);

    // Check if it's CC values:
    if (isChannelController(status))
    {

        if (data2 > 0)
        {
            // checking what CC value we get and react accordingly:
            switch (data1)  {

                // Transport CLip
                case 110:
                    lem.transport.toggleLauncherOverdub();
                    break;
                case 111:
                    lem.transport.toggleWriteClipLauncherAutomation();
                    break;

                // Moving the Grid
                case 95:
                    lem.cClipWindow.scrollTracksUp();
                    break;
                case 96:
                    lem.cClipWindow.scrollTracksDown();
                    break;
                case 97:
                    lem.cClipWindow.scrollScenesUp();
                    break;
                case 98:
                    lem.cClipWindow.scrollScenesDown();
                    break;


                //Launching Clips Scene 0

                case 0:
                    lem.cClipWindow.getTrack(0).getClipLauncherSlots().launch(0);
                    break;
                case 1:
                    lem.cClipWindow.getTrack(1).getClipLauncherSlots().launch(0);
                    break;
                case 2:
                    lem.cClipWindow.getTrack(2).getClipLauncherSlots().launch(0);
                    break;
                case 3:
                    lem.cClipWindow.getTrack(3).getClipLauncherSlots().launch(0);
                    break;
                case 4:
                    lem.cClipWindow.getTrack(4).getClipLauncherSlots().launch(0);
                    break;
                case 5:
                    lem.cClipWindow.getTrack(5).getClipLauncherSlots().launch(0);
                    break;

                //Launching Clips Scene 1

                case 6:
                    lem.cClipWindow.getTrack(0).getClipLauncherSlots().launch(1);
                    break;
                case 7:
                    lem.cClipWindow.getTrack(1).getClipLauncherSlots().launch(1);
                    break;
                case 8:
                    lem.cClipWindow.getTrack(2).getClipLauncherSlots().launch(1);
                    break;
                case 9:
                    lem.cClipWindow.getTrack(3).getClipLauncherSlots().launch(1);
                    break;
                case 10:
                    lem.cClipWindow.getTrack(4).getClipLauncherSlots().launch(1);
                    break;
                case 11:
                    lem.cClipWindow.getTrack(5).getClipLauncherSlots().launch(1);
                    break;

                //Launching Clips Scene 2

                case 12:
                    lem.cClipWindow.getTrack(0).getClipLauncherSlots().launch(2);
                    break;
                case 13:
                    lem.cClipWindow.getTrack(1).getClipLauncherSlots().launch(2);
                    break;
                case 14:
                    lem.cClipWindow.getTrack(2).getClipLauncherSlots().launch(2);
                    break;
                case 15:
                    lem.cClipWindow.getTrack(3).getClipLauncherSlots().launch(2);
                    break;
                case 16:
                    lem.cClipWindow.getTrack(4).getClipLauncherSlots().launch(2);
                    break;
                case 17:
                    lem.cClipWindow.getTrack(5).getClipLauncherSlots().launch(2);
                    break;

                //Launching Clips Scene 3

                case 18:
                    lem.cClipWindow.getTrack(0).getClipLauncherSlots().launch(3);
                    break;
                case 19:
                    lem.cClipWindow.getTrack(1).getClipLauncherSlots().launch(3);
                    break;
                case 20:
                    lem.cClipWindow.getTrack(2).getClipLauncherSlots().launch(3);
                    break;
                case 21:
                    lem.cClipWindow.getTrack(3).getClipLauncherSlots().launch(3);
                    break;
                case 22:
                    lem.cClipWindow.getTrack(4).getClipLauncherSlots().launch(3);
                    break;
                case 23:
                    lem.cClipWindow.getTrack(5).getClipLauncherSlots().launch(3);
                    break;

                //Launching Clips Scene 4

                case 24:
                    lem.cClipWindow.getTrack(0).getClipLauncherSlots().launch(4);
                    break;
                case 25:
                    lem.cClipWindow.getTrack(1).getClipLauncherSlots().launch(4);
                    break;
                case 26:
                    lem.cClipWindow.getTrack(2).getClipLauncherSlots().launch(4);
                    break;
                case 27:
                    lem.cClipWindow.getTrack(3).getClipLauncherSlots().launch(4);
                    break;
                case 28:
                    lem.cClipWindow.getTrack(4).getClipLauncherSlots().launch(4);
                    break;
                case 29:
                    lem.cClipWindow.getTrack(5).getClipLauncherSlots().launch(4);
                    break;

                //Stopping Tracks

                case 30:
                    lem.cClipWindow.getTrack(0).getClipLauncherSlots().stop();
                    break;
                case 31:
                    lem.cClipWindow.getTrack(1).getClipLauncherSlots().stop();
                    break;
                case 32:
                    lem.cClipWindow.getTrack(2).getClipLauncherSlots().stop();
                    break;
                case 33:
                    lem.cClipWindow.getTrack(3).getClipLauncherSlots().stop();
                    break;
                case 34:
                    lem.cClipWindow.getTrack(4).getClipLauncherSlots().stop();
                    break;
                case 35:
                    lem.cClipWindow.getTrack(5).getClipLauncherSlots().stop();
                    break;

                //Stopping Tracks

                case 36:
                    lem.cClipWindow.getTrack(0).getClipLauncherSlots().returnToArrangement();
                    break;
                case 37:
                    lem.cClipWindow.getTrack(1).getClipLauncherSlots().returnToArrangement();
                    break;
                case 38:
                    lem.cClipWindow.getTrack(2).getClipLauncherSlots().returnToArrangement();
                    break;
                case 39:
                    lem.cClipWindow.getTrack(3).getClipLauncherSlots().returnToArrangement();
                    break;
                case 40:
                    lem.cClipWindow.getTrack(4).getClipLauncherSlots().returnToArrangement();
                    break;
                case 41:
                    lem.cClipWindow.getTrack(5).getClipLauncherSlots().returnToArrangement();
                    break;

                //Stopping Tracks /Return them to arrangement

                case 47:
                    lem.cScenes.stop();
                    break;
                case 48:
                    lem.cScenes.returnToArrangement();
                    break;

                //Launching Scenes

                case 42:
                    lem.cScenes.launch(0);
                    break;
                case 43:
                    lem.cScenes.launch(1);
                    break;
                case 44:
                    lem.cScenes.launch(2);
                    break;
                case 45:
                    lem.cScenes.launch(3);
                    break;
                case 46:
                    lem.cScenes.launch(4);
                    break;


            }

        }


        else {
            // hack to get the Lemur buttons to light up correctly.
            // Many Controllers overwrite their own lights on buttons when the button is
            // released, so here I tell the flush() function to update the buttons to update on release also:
            lem.transpHasChanged = true;
        }
    }
}


// Now checking for some Note-On Commands I use for the Cliplauncher. First the Scenes:
/*else if (isNoteOnC2(status)) {
 if (data1 >=100 && data1 < 105) {
 lem.cScenes.launch(data1-100);
 }
 // and then for the Clip Matrix:
 else if (data1 >=0 && data1 <32) {
 // If the clip is Playing or Queued, Stop it:
 if (lem.clIsPlaying[data1] || lem.clIsQueued[data1]) {
 lem.cClipTrack[data1%6].getClipLauncherSlots().stop();
 }
 // otherwise launch it:
 else{
 lem.cClipTrack[data1%6].getClipLauncherSlots().launch(Math.floor(data1*0.25));
 }//println("what's this: " + 5);
 }
 }*/


//bank.getTrack(trackIndex).getClipLauncherSlots().launch(sceneIndex);

function onSysex(data)
{
    //printSysex(data);
}

// A function to create an indexed function for the Observers
function getValueObserverFunc(index, varToStore)
{
    return function(value)
    {
        varToStore[index] = value;
    }
}

// A function to create an indexed function for the Observers with an added state variable:
function getTrackValueFunc(index, varToStore, varToSet)
{
    return function(value)
    {
        varToStore[index] = value;
        varToSet[index] = true;
    }
}

// A function to create an indexed function for the Observers for Clips including a Color-Update:
function getClipValueFunc(slot, varToStore)
{
    return function(index, value)
    {
        varToStore[slot+index*4] = value;
        updateClipColors();
    }
}

// A function to set the Note Table for Midi Inputs and add / substract an Offset to Transpose:
function setNoteTable(midiIn, table, offset) {
    for (var i = 0; i < 128; i++)
    {
        table[i] = offset + i;
        // if the result is out of the MIDI Note Range, set it to -1 so the Note is not played:
        if (table[i] < 0 || table[i] > 127) {
            table[i] = -1;
        }
    }
    // finally set the Key Translation Table of the respective MidiIn:
    midiIn.setKeyTranslationTable(table);
}

// A function to update Clip Colors collecting all the Observerdata.
// Lemur only supports a very limited Palette,
// but in addition Colours can be "On" or "Off", brigher or dimmer:
function updateClipColors () {
    for (var i=0; i<8; i++) {
        for(var j=0; j<4; j++){
            if (lem.clIsQueued[j+i*4]) {
                lem.clColor[j+i*4] = 3; // Yellow
                lem.clBright[j+i*4] = true;
                //println("Yellow");
            }
            else if (lem.clIsRecording[j+i*4]) {
                lem.clColor[j+i*4] = 0; // Red
                lem.clBright[j+i*4] = true;
                //println("Green");
            }
            else if (lem.clIsPlaying[j+i*4]) {
                lem.clColor[j+i*4] = 1; // Green
                lem.clBright[j+i*4] = true;
                //println("Green");
            }
            else if (lem.clHasContent[j+i*4]) {
                lem.clColor[j+i*4] = 5; // Grau
                lem.clBright[j+i*4] = true;
                //println("Orange");
            }
            // if we got so far, the slot is empty:
            else {
                lem.clColor[j+i*4] = 5; // Grey
                lem.clBright[j+i*4] = false;
                //println("Grey");
            }
        }
    }
}

// Check for Note-Ons on Channel 2
function isNoteOnC2(status) { return (status & 0xF1) == 0x91; }


function exit()
{
    // nothing to do here ;-)
    // Au revoir, I hope you enjoy the Tool ;-)
}
