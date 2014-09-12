liine_Lemur
===========

Lemur Controller Script v. 1

===========

This script is fully based on the touchOSC controller script by Thomas Helzle (http://www.screendream.de/)
from Bitwig, thanks for that!
The Datamanager.js is done by Drew Meyer  http://www.sub-version.net ,thanks for that!!

It is supposed to provide nice functionality with Bitwig Studio 1.0.13.
According to new updates from Bitwig, this script will also be updated and extended.

===========

Current features:

1. Mixer page, with track & master volume faders, panorama control and transport.
2. Macro control page, control 8 macros with device selection, preset- /category- / and creatorswitch.
3. Map page, control 8 parameter of a device, with map selection and track- / devicechange.
4. Clip Launcher page, control bank with 5x8 selector and navigation.
5. Pad page, 16x Drum Pads, with transport-> Bitwig style. :)
6. Keys page, simple keys with transpose.
7. X/Y page, 4x X/Y pad for various applications.

===========

To be done:

1. getting datamanager.js to work proper for updateing clip colors and names.
2. setting up a new step sequencer page.
3. setting up canvas objects for leveling meter in mixing page.
4. making use of the physics engine in lemur with the help of user softcore.
5. hopefully a waveform display for the macro and map pages.
6. various visual eye candy improvements.


have fun!

cheers Mark

===========
===========

Installation on Win:

1. Make sure your pc and the lemur are in the same wifi network.
1.1. Download and install the Lemur Editor software from liine. https://liine.net/en/downloads/lemur
2. download + install loopMidi from here: http://www.tobias-erichsen.de/software/loopmidi.html
4. open Lemur, hit the settings dialogue and set the Midi target for Midi 0 to the Ports we just created:
   see pic here: http://abload.de/image.php?img=2014-09-1223.40.59viy7i.jpg
   Also add OSC target, select your pc and write in port number 8000. Usually this port should not be blocked by your 
   router, but it can happen. In that case you would need to enter your router configuration and forward the port 8000. 
   It could also be that your local firewall is blocking such a connection, so please check that as well, 
   and maybe turn it off for this installation.
5. Now open the deamon software wich comes bundled with the Lemur Editor: Lemur Deamon.exe
6. Make sure both of your created Midi Ports do show up there. If yes, everything is good!
7. Now open up the Lemur Editor: and see this pic: http://abload.de/image.php?img=lemur-editor-installk0xa4.jpg
    Step 1: open project, select Bitwig_Lemur.jzml
    Step 2: Hit the little play button,
    Step 3: a window appeares and shows your iPad, select it and connect.
        (if it does not show up, check this video please: https://www.youtube.com/watch?v=w5iY2mHUqaQ )

8. Now navigate to your personal documents folder
   usually its: C:\Users\yourname\Documents\Bitwig Studio\Controller Scripts
9: Create a new folder there, call it liine or whatever you want to, and place the Lemur.control.js 
   and the Datamanager.js into this folder.
10. Finally open up Bitwig, go to preferences/controller and hit Detect for available controllers. This can take a few 
   seconds so pls be patient.

The Lemur controller shows up correctly, and you can start using it. If any problems appear during installation, 
please refer to wich step ..

For discussion or help, please refer to this thread on 
KVR: http://www.kvraudio.com/forum/viewtopic.php?f=259&t=420303&p=5873588#p5873588

Installation on Mac:
tomorrow.../**
     * Created by Suloo on 13.09.2014.
     */



