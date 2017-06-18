Lemur4Bitwig Template 1.1 (Stripped Down)
Now ready for Bitwig 2.1.1
===========



This is a stripped down version of the Lemur4Bitwig Template.
Please use the <a href="https://github.com/git-moss/OSC4Bitwig">OSC4Bitwig</a> script by <a href="http://www.mossgrabers.de/Software/Bitwig/Bitwig.html">Moss</a>.</p>
In this version i removed the device, pads, cliplauncher and XY pages, because they were not working correctly due to several limitations. After one year of waiting and trying they remained in an unfinished or buggy state, so we now just have mixer and keyboard page. The mixer page has been improved with basic group actions and volume meters.





===========

Current features:

1.  Mixer page, with track & master volume faders, transport, track/bank selection, mute/solo/rec, crossfades, tempo,
    track activation, panel modes, arranger modes, mixer modes, add tracks, metronome, save, undo/redo , toggle banks, group I/O, VU Meters
2.  Keys page, Modwheel/Pitchbend/Breath/Expression/After Touch with friction and tension control using Lemur physics
3.  Compatible with Bitwig 1.3.x

===========

Installation on Win/Mac/Linux:

1. Grab the Drivenbymoss.zip by Moss: <a href="http://www.mossgrabers.de/Software/Bitwig/Bitwig.html">here</a>
2. Follow the install instructions <a href="https://github.com/git-moss/DrivenByMoss/wiki/Installation">here</a>
3. Go to the Bitwig preferences and add Open Sound Control (OSC) script.
4. Type in your device (iPad/Android) IP and Portnumber 8000. See screenshot:<a href="https://raw.githubusercontent.com/Lucid-Network/Lemur4Bitwig-Template/master/images/Bitwig-setup.png">here</a></li>
5. In Lemur, type in your host IP as OSC Target 0 and port 8000.
   See Screenshot: <a href="https://raw.githubusercontent.com/Lucid-Network/Lemur4Bitwig-Template/master/images/Lemur-setup.png">here</a>  
6. Restart Bitwig
7. Make sure you do not block port 8000 in your firewall if it doesn't work.


For discussion or help, please refer to this thread on
KVR:  <a href="http://www.kvraudio.com/forum/viewtopic.php?f=259&t=420303&p=5873588#p5873588">here</a>



Now you should be ready to go! Have Fun!


=======
