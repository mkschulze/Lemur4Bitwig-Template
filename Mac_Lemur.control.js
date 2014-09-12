// Lemur Controller Script based on the touchOSC controller script by Thomas Helzle. Thanks for that!

// Things to do

/*
 * Adding the Datamanager.js by Drew Meyer  http://www.sub-version.net ,thanks for that!
 * to callback the Clip colors and track names.
 * Adding a step sequencer like in the Launchpad controller script.
 * Optimisation of the clip launcher in the Lemur template
 */

loadAPI(1);
load ("DataManager.js");

host.defineController("liine", "Lemur", "1.0", "434bb2e0-3932-11e4-916c-0800200c9a66");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Daemon Input 0"], ["Daemon Output 0"]);

// Main variable:
var lem;


// Main Constructor where all the basics are set up:
function Lemur() {
    lem = this;

    // Constants:
    this.FADERS = 101; // Start of Fader Range - 8 x track volume + 1 x master volume
    this.PANS = 91; // Start of Pan Range - 8 x track pan
    this.XY = 12; // Start of the XY Pads - 4 x X and Y, 8 total
    this.MACROS = 20; // Start of Device Macro Range - 8 macro knobs on the cursor device
    this.PARAMS = 40; // Start of Device Parameter Mappings - 8 parameter mappings on the cursor device
    this.PADCENTER = 36; // Start Offset of Pads
    this.PADSTEP = 16; // Pad Pagesize per Step
    this.KEYCENTER = 36; // Start Offset of Pads
    this.KEYSTEP = 12; // Pad Pagesize per Step

    // Midi Ports:
    this.midiInKeys = host.getMidiInPort(0).createNoteInput("Lemur Keys", "?0????");
    this.midiInPads = host.getMidiInPort(0).createNoteInput("Lemur Pads", "?9????");
    // Disable the consuming of events by the NoteInputs, so they are also available for mapping
    this.midiInKeys.setShouldConsumeEvents(false);
    this.midiInPads.setShouldConsumeEvents(false);

    // Setting Callbacks for Midi and Sysex
    host.getMidiInPort(0).setMidiCallback(onMidi);
    host.getMidiInPort(0).setSysexCallback(onSysex);

    // States:

    // Transport States:
    this.isPlaying = false;
    this.isRecording = false;
    this.isOverdubEnabled = false;
    this.transpHasChanged = true;

    // Tracks:
    this.masterVolume = 0;
    this.masterVolumeHasChanged = false;
    this.trackVolume = [];
    this.trackVolumeHasChanged = [];
    this.trackPan = [];
    this.trackPanHasChanged = [];

    // Macros:
    this.deviceMacro = [];
    this.deviceMacroHasChanged = [];

    // Device Mappings:
    this.deviceMapping = [];
    this.deviceMappingHasChanged = [];
    this.pageNames = [];

    // XY Pads:
    this.xyPad = [];
    this.xyPadHasChanged = [];

    // ClipLauncher:
    this.clIsPlaying = [];
    this.clIsRecording = [];
    this.clIsQueued = [];
    this.clHasContent = [];
    this.clColor = [];
    this.clBright = [];

    // Initializations:
    for (var i=0; i<8; i++) {
        this.trackVolume[i] = 0;
        this.trackVolumeHasChanged[i] = false;
        this.trackPan[i] = 0;
        this.trackPanHasChanged[i] = false;
        this.deviceMacro[i] = 0;
        this.deviceMacroHasChanged[i] = false;
        this.deviceMapping[i] = 0;
        this.deviceMappingHasChanged[i] = false;
        this.xyPad[i] = 0;
        this.xyPadHasChanged[i] = false;
        for (var j=0; j<4; j++) {
            this.clIsPlaying[j+i*4] = false;
            this.clIsRecording[j+i*4] = false;
            this.clIsQueued[j+i*4] = false;
            this.clHasContent[j+i*4] = false;
            this.clColor[j+i*4] = 5;
            this.clColor[j+i*4] = false;
        }
    }

    // Change States:
    this.trackHasChanged = false;
    this.deviceHasChanged = false;
    this.presetHasChanged = false;
    this.categoryHasChanged = false;
    this.creatorHasChanged = false;
    this.pPageHasChanged = false;

    // Translation Tables:
    this.padTranslation = initArray(0, 128);
    this.padOffset = 0;
    this.keyTranslation = initArray(0, 128);
    this.keyOffset = 0;

    // Creating Views:
    this.transport = host.createTransport();  // this creates the ability to control transport
    this.masterTrack = host.createMasterTrack(0);
    this.tracks = host.createMainTrackBank(8, 0, 0);
    this.cTrack = host.createCursorTrack(1, 0);
    this.cDevice = lem.cTrack.getPrimaryDevice();
    this.uMap = host.createUserControls(8);
    this.cClipWindow = host.createTrackBank(5, 0, 9);
    this.cScenes = lem.cClipWindow.getClipLauncherScenes();

    this.cMacro = [];
    this.cPage = [];
    this.cClipTrack = [];
    this.cSlots = [];

}


function init()
{
    data = new DataManager(128, 1024);

    // instantiate a new Lemur Object:
    new Lemur()

    // Creating Observers, indications etc.:

    lem.transport.addIsPlayingObserver(function(on){
        lem.isPlaying = on;
        lem.transpHasChanged = true;
    });
    lem.transport.addIsRecordingObserver(function(on){
        lem.isRecording = on;
        lem.transpHasChanged = true;
    });
    lem.transport.addOverdubObserver(function(on){
        lem.isOverdubEnabled = on;
        lem.transpHasChanged = true;
    });

    lem.masterTrack.getVolume().setIndication(true);

    lem.masterTrack.getVolume().addValueObserver(128, function(volume){
        lem.masterVolume = volume;
        lem.masterVolumeHasChanged = true;
    })

    for (var j=0; j<5; j++) {
        lem.cClipTrack[j] = lem.cClipWindow.getTrack(j);
        lem.cSlots[j] = lem.cClipTrack[j].getClipLauncherSlots();
        lem.cSlots[j].setIndication(true);
        lem.cSlots[j].addIsPlayingObserver(getClipValueFunc(j, lem.clIsPlaying));
        lem.cSlots[j].addIsRecordingObserver(getClipValueFunc(j, lem.clIsRecording));
        lem.cSlots[j].addIsQueuedObserver(getClipValueFunc(j, lem.clIsQueued));
        lem.cSlots[j].addHasContentObserver(getClipValueFunc(j, lem.clHasContent));
    }

    for (var i=0; i<8; i++) {
        // Volume
        lem.tracks.getTrack(i).getVolume().setIndication(true);
        lem.tracks.getTrack(i).getVolume().addValueObserver(127, getTrackValueFunc(i, lem.trackVolume, lem.trackVolumeHasChanged));
        // Pan
        lem.tracks.getTrack(i).getPan().setIndication(true);
        lem.tracks.getTrack(i).getPan().addValueObserver(127, getTrackValueFunc(i, lem.trackPan, lem.trackPanHasChanged));
        // Macro
        lem.cMacro[i] = lem.cDevice.getMacro(i);
        lem.cMacro[i].getAmount().setIndication(true);
        lem.cMacro[i].getAmount().addValueObserver(127, getTrackValueFunc(i, lem.deviceMacro, lem.deviceMacroHasChanged));
        // Parameter Mapping
        lem.cPage[i] = lem.cDevice.getParameter(i);
        lem.cPage[i].setIndication(true);
        lem.cPage[i].addValueObserver(127, getTrackValueFunc(i, lem.deviceMapping, lem.deviceMappingHasChanged));
        // XY Pads
        lem.uMap.getControl(i).setLabel("XY Pad " + (Math.ceil(i/2+0.2)) + " - " + ((i%2<1) ? "X":"Y"))
        lem.uMap.getControl(i).addValueObserver(127, getTrackValueFunc(i, lem.xyPad, lem.xyPadHasChanged));
        // Clips
        for(var k=0; k<4; k++) {

        }

    }

    lem.tracks.addCanScrollTracksUpObserver(function (on)
    {
        host.getMidiOutPort(0).sendMidi(177, 99, ((on) ? 5 : 0) );
    });

    lem.tracks.addCanScrollTracksDownObserver(function (on)
    {
        host.getMidiOutPort(0).sendMidi(177, 100, ((on) ? 5 : 0) );
    });

    lem.cDevice.addPresetNameObserver(50, "None", function(on)
    {
        if(lem.presetHasChanged) {
            host.showPopupNotification(on);
            lem.presetHasChanged = false;
        }
    });
    lem.cDevice.addPresetCategoryObserver(50, "None", function(on)
    {
        if(lem.categoryHasChanged) {
            host.showPopupNotification(on);
            lem.categoryHasChanged = false;
        }
    });
    lem.cDevice.addPresetCreatorObserver(50, "None", function(on)
    {
        if(lem.creatorHasChanged) {
            host.showPopupNotification(on);
            lem.creatorHasChanged = false;
        }
    });
    lem.cDevice.addNameObserver(50, "None", function(on)
    {
        if(lem.deviceHasChanged) {
            host.showPopupNotification(on);
            lem.deviceHasChanged = false;
        }
    });
    lem.cTrack.addNameObserver(50, "None", function(on)
    {
        if(lem.trackHasChanged) {
            host.showPopupNotification(on);
            lem.trackHasChanged = false;
        }
    });
    lem.cDevice.addPageNamesObserver(function(names)
    {
        lem.pageNames = [];
        for(var i=0; i<arguments.length; i++) {
            lem.pageNames[i] = arguments[i];
        }
    });
    lem.cDevice.addSelectedPageObserver(0, function(on)
    {
        if(lem.pPageHasChanged) {
            host.showPopupNotification(lem.pageNames[on]);
            lem.pPageHasChanged = false;
        }
    });

    // Pheww, that was a lot of Boilerplate ;-)

}

// Updates the controller in an orderly manner when needed
// so that LEDs, Motors etc. react to changes in the Software
// without drowning the Controller with data
function flush()
{
    // Check if transport has changed and if yes, update all of the controlls:
    if (lem.transpHasChanged) {
        sendChannelController(0, 118, lem.isPlaying ? 127 : 0);
        sendChannelController(0, 117, lem.isPlaying ? 0 : 127);
        sendChannelController(0, 119, lem.isRecording ? 127 : 0);
        sendChannelController(0, 114, lem.isOverdubEnabled ? 127 : 0);
        lem.transpHasChanged = false;
    }
    // Update the Master Volume if it has changed:
    if (lem.masterVolumeHasChanged) {
        sendChannelController(0, lem.FADERS + 8, lem.masterVolume);
        lem.masterVolumeHasChanged = false;
        return;
    }
    // Go through an 8-step Loop to check for all the stuff that could have changed:
    for (var k=0; k<8; k++) {
        if (lem.trackVolumeHasChanged[k]) {
            sendChannelController(0, lem.FADERS + k, lem.trackVolume[k]);
            //sendChannelController(1, lem.FADERS + k, lem.trackVolume[k]);
            lem.trackVolumeHasChanged[k] = false;
        }
        if (lem.trackPanHasChanged[k]) {
            sendChannelController(0, lem.PANS + k, lem.trackPan[k]);
            lem.trackPanHasChanged[k] = false;
        }
        if (lem.deviceMacroHasChanged[k]) {
            sendChannelController(0, lem.MACROS + k, lem.deviceMacro[k]);
            lem.deviceMacroHasChanged[k] = false;
        }
        if (lem.deviceMappingHasChanged[k]) {
            sendChannelController(0, lem.PARAMS + k, lem.deviceMapping[k]);
            lem.deviceMappingHasChanged[k] = false;
        }
        if (lem.xyPadHasChanged[k]) {
            sendChannelController(0, lem.XY + k, lem.xyPad[k]);
            printMidi(0,lem.XY + k, lem.xyPad[k]);
            lem.xyPadHasChanged[k] = false;
        }
        // Add another 4 step Loop for the Clip Launcher Grid:
        for(var m=0; m<4; m++) {
            host.getMidiOutPort(0).sendMidi(146, m+k*4, lem.clColor[m+k*4]);
            host.getMidiOutPort(0).sendMidi(145, m+k*4, (lem.clBright[m+k*4]) ? 1 : 0);
            //println(lem.clColor[m+k*4]);
        }
    }
    var changes = data.getChanges();
     if (changes.trackCount < 0) {
     bufferSysexMessage(getRemoveTracksMessage(-changes.trackCount));
     }
     else if (changes.trackCount > 0) {
     bufferSysexMessage(getAddTracksMessage(changes.trackCount));
     }
     if (changes.sceneCount < 0) {
     bufferSysexMessage(getRemoveScenesMessage(-changes.sceneCount));
     }
     else if (changes.sceneCount > 0) {
     bufferSysexMessage(getAddScenesMessage(changes.sceneCount));
     }
     /*for (var index = 0; index < changes.trackNames.length; index++) {
     bufferSysexMessage(getTrackNameMessage(changes.trackNames[index], data.getTrackName(changes.trackNames[index])));
     }*/
     for (var index = 0; index < changes.trackColors.length; index++) {
     bufferSysexMessage(getTrackColorMessage(changes.trackColors[index], data.getTrackColor(changes.trackColors[index])));
     }
     for (var index = 0; index < changes.trackMuteStatuses.length; index++) {
     bufferSysexMessage(getTrackMuteStatusMessage(changes.trackMuteStatuses[index], data.getTrackMuteStatus(changes.trackMuteStatuses[index])));
     }
     for (var index = 0; index < changes.trackSoloStatuses.length; index++) {
     bufferSysexMessage(getTrackSoloStatusMessage(changes.trackSoloStatuses[index], data.getTrackSoloStatus(changes.trackSoloStatuses[index])));
     }
     for (var index = 0; index < changes.sceneNames.length; index++) {
     bufferSysexMessage(getSceneNameMessage(changes.sceneNames[index], data.getSceneName(changes.sceneNames[index])));
     }
     for (var index = 0; index < changes.clipNames.length; index++) {
     var clipNameChange = changes.clipNames[index];
     bufferSysexMessage(getClipNameMessage(clipNameChange[0], clipNameChange[1], data.getClipName(clipNameChange[0], clipNameChange[1])));
     }
     for (var index = 0; index < changes.clipColors.length; index++) {
     var clipColorChange = changes.clipColors[index];
     bufferSysexMessage(getClipColorMessage(clipColorChange[0], clipColorChange[1], data.getClipColor(clipColorChange[0], clipColorChange[1])));
     }
     for (var index = 0; index < changes.clipPlayingStatuses.length; index++) {
     var clipPlayingStatusChange = changes.clipPlayingStatuses[index];
     bufferSysexMessage(getClipPlayingStatusMessage(clipPlayingStatusChange[0], clipPlayingStatusChange[1], data.getClipPlayingStatus(clipPlayingStatusChange[0], clipPlayingStatusChange[1])));
     }
     for (var index = 0; index < changes.clipQueuedStatuses.length; index++) {
     var clipQueuedStatusChange = changes.clipQueuedStatuses[index];
     bufferSysexMessage(getClipQueuedStatusMessage(clipQueuedStatusChange[0], clipQueuedStatusChange[1], data.getClipQueuedStatus(clipQueuedStatusChange[0], clipQueuedStatusChange[1])));
     }
    for (var index = 0; index < changes.trackNames.length; index++) {
        var changedIndex = changes.trackNames[index];
        var trackName = data.getTrackName(changedIndex);
        println("track " + changedIndex + " changed name to " + trackName);
    }
     data.clearChanges();*/

}

// React to incoming MIDI:
function onMidi(status, data1, data2)
{
    //printMidi(status, data1, data2);

    // Check if it's CC values:
    if (isChannelController(status))
    {
        // Check if its the Volume Faders:
        if (data1 >= lem.FADERS && data1 < lem.FADERS + 9 ) {
            // Is it the Master Fader?
            if (data1 === lem.FADERS+8) {
                lem.masterTrack.getVolume().set(data2, 128);
            }
            // Otherwise its a Track Volume Fader:
            else {
                lem.tracks.getTrack(data1 - lem.FADERS).getVolume().set(data2, 128);
            }
        }
        // Check for Track Panning:
        else if (data1 >= lem.PANS && data1 < lem.PANS + 8 ) {
            lem.tracks.getTrack(data1 - lem.PANS).getPan().set(data2, 128);
        }
        // Check for Device Macros:
        else if (data1 >= lem.MACROS && data1 < lem.MACROS + 8 ) {
            lem.cMacro[data1 - lem.MACROS].getAmount().set(data2, 128);
        }
        // Check for Device Mappings:
        else if (data1 >= lem.PARAMS && data1 < lem.PARAMS + 8 ) {
            lem.cPage[data1 - lem.PARAMS].set(data2, 128);
        }
        // Check for XY Pads:
        else if (data1 >= lem.XY && data1 < lem.XY + 8 ) {
            lem.uMap.getControl(data1 - lem.XY).set(data2, 128);
        }
        // If we got this far, it's not a continuous controller but some one-off Button.
        // We only want to react to it when it's pressed (usually the value is 127 then),
        // not on release, which usually sends a value of 0:
        else if (data2 > 0)
        {
            // checking what CC value we get and react accordingly:
            switch (data1)  {
                case 99:
                    lem.tracks.scrollTracksUp();
                    break;
                case 100:
                    lem.tracks.scrollTracksDown();
                    break;
                case 29:
                    lem.cTrack.selectPrevious();
                    lem.trackHasChanged = true;
                    break;
                case 30:
                    lem.cTrack.selectNext();
                    lem.trackHasChanged = true;
                    break;
                case 31:
                    lem.cDevice.switchToDevice(DeviceType.ANY,ChainLocation.PREVIOUS);
                    lem.deviceHasChanged = true;
                    break;
                case 32:
                    lem.cDevice.switchToDevice(DeviceType.ANY,ChainLocation.NEXT);
                    lem.deviceHasChanged = true;
                    break;
                case 33:
                    lem.cDevice.switchToPreviousPreset();
                    lem.presetHasChanged = true;
                    break;
                case 34:
                    lem.cDevice.switchToNextPreset();
                    lem.presetHasChanged = true;
                    break;
                case 35:
                    lem.cDevice.switchToPreviousPresetCategory();
                    lem.categoryHasChanged = true;
                    break;
                case 36:
                    lem.cDevice.switchToNextPresetCategory();
                    lem.categoryHasChanged = true;
                    break;
                case 37:
                    lem.cDevice.switchToPreviousPresetCreator();
                    lem.creatorHasChanged = true;
                    break;
                case 38:
                    lem.cDevice.switchToNextPresetCreator();
                    lem.creatorHasChanged = true;
                    break;
                case 50:
                    lem.cDevice.previousParameterPage();
                    lem.pPageHasChanged = true;
                    break;
                case 51:
                    lem.cDevice.nextParameterPage();
                    lem.pPageHasChanged = true;
                    break;
                case 53:
                    // Checking if the Key-Offset is in a sensible Range before applaying the Offset:
                    if (lem.keyOffset < 127-lem.KEYCENTER-lem.KEYSTEP) {
                        lem.keyOffset += lem.KEYSTEP;
                        setNoteTable(lem.midiInKeys, lem.keyTranslation, lem.keyOffset);
                    }
                    break;
                case 54:
                    // Same in the other direction:
                    if (lem.keyOffset > 0-lem.KEYCENTER+lem.KEYSTEP-1) {
                        lem.keyOffset -= lem.KEYSTEP;
                        setNoteTable(lem.midiInKeys, lem.keyTranslation, lem.keyOffset);
                    }
                    break;
                case 55:
                    // Same for Pads
                    if (lem.padOffset < 127-lem.PADCENTER-lem.PADSTEP) {
                        lem.padOffset += lem.PADSTEP;
                        setNoteTable(lem.midiInPads, lem.padTranslation, lem.padOffset);
                    }
                    break;
                case 56:
                    // And the other way:
                    if (lem.padOffset > 0-lem.PADCENTER+lem.PADSTEP-1) {
                        lem.padOffset -= lem.PADSTEP;
                        setNoteTable(lem.midiInPads, lem.padTranslation, lem.padOffset);
                    }
                    break;
                case 57:
                    lem.cClipWindow.scrollTracksUp();
                    break;
                case 58:
                    lem.cClipWindow.scrollTracksDown();
                    break;
                case 59:
                    lem.cClipWindow.scrollScenesUp();
                    break;
                case 60:
                    lem.cClipWindow.scrollScenesDown();
                    break;
                case 117:
                    lem.transport.stop();
                    break;
                case 118:
                    lem.transport.play();
                    break;
                case 113:
                    lem.transport.toggleLoop();
                    break;
                case 119:
                    lem.transport.record();
                    break;
                case 114:
                    lem.transport.toggleOverdub();
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
    // Now checking for some Note-On Commands I use for the Cliplauncher. First the Scenes:
    else if (isNoteOnC2(status)) {
        if (data1 >=100 && data1 < 108) {
            lem.cScenes.launch(data1-100);
        }
        // and then for the Clip Matrix:
        else if (data1 >=0 && data1 <32) {
            // If the clip is Playing or Queued, Stop it:
            if (lem.clIsPlaying[data1] || lem.clIsQueued[data1]) {
                lem.cClipTrack[data1%4].getClipLauncherSlots().stop();
            }
            // otherwise launch it:
            else{
                lem.cClipTrack[data1%4].getClipLauncherSlots().launch(Math.floor(data1*0.25));
            }
        }
    }
}

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
