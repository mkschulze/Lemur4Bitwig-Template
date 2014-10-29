// DataManager.js
// Drew Meyer
// http://www.sub-version.net


// DataManager stores information collected from observers, and lets you access the data with static indicies, independently of bank offsets.
// For example, getTrackName(0) will always return the name of the first track in your set.
//printMidi(status, data1, data2);

// Currently, this module allows access to the following information:
// Track and scene count (filters unused tracks/scenes in the bank), track name, track color, track mute status, track solo status, scene name, clip name, clip color, clip playing status, clip queued status.


// DataManager also collects wh ich data has changed in your set, giving better control over observers and how the changes are handled.
// This allows you to control the order that changes are handled, ignore changes that aren't needed, and limit the amount of feedback created by observers.
// The function getChanges() is designed to be called by flush(), followed by a call to clearChanges().  It returns an object with indicies of what's changed.


// The changes object can be accessed by calling getChanges() and contains arrays of indicies for each type of data that has changed since the last time clearChanges() was called.  Object structure:

// Track and scene count provide a positive number of tracks/scenes that have been added, or a negative number of tracks/scenes that have been removed.  For example, -2 if you remove two tracks.
// changes.trackCount, changes.sceneCount

// Track and scene data changes provide an array of indicies for tracks or scenes that have had data changed.  For example, [0, 1, 2] if the first three tracks or scenes have changed data.
// changes.trackNames, changes.trackColors, changes.trackMuteStatuses, changes.trackSoloStatuses, changes.sceneNames

// Clip data changes provide a 2d array (x/y indicies) for scenes that have had data changed.  For example, [[0, 0], [0, 1], [0, 2]] if the first three clips on a track have changed data.
// changes.clipNames, changes.clipColors, changes.clipPlayingStatuses, changes.clipQueuedStatuses


// These indicies can then be used to request the updated data from flush() in .control.js. 29.10.2014

/*
 function flush() {
 // get the changes object
 var changes = data.getChanges();

 // print the number of tracks that have been added or removed
 println("track count: " + changes.trackCount);

 // print the names of tracks that have name changes
 for (var index = 0; index < changes.trackNames.length; index++) {
 println("track: " + changes.trackNames[index] + " name: " + data.getTrackName(changes.trackNames[index]));
 }

 // print the names of clips that have name changes
 for (var index = 0; index < changes.clipNames.length; index++) {
 var clipIndicies = changes.clipNames[index];
 println("clip: " + clipIndicies[0] + "/" + clipIndicies[1] + " name: " + data.getClipName(clipIndicies[0], clipIndicies[1]));
 }

 // clear changes
 data.clearChanges();
 }
 */

var bank;
var trackCount;
var changes = {};
var trackNames = [];
var trackColors = [];
var trackMuteStatuses = [];
var trackSoloStatuses = [];
var sceneNames = [];
var clipNames = [];
var clipColors = [];
var clipPlayingStatuses = [];
var clipQueuedStatuses = [];
var MAX_PACKET_LENGTH = [];

function DataManager(maximumTracks, maximumScenes) {
    var self = this;
    trackCount = 0;
    sceneCount = 0;
    self.enableListeners = false;
    changes.trackCount = 0;
    changes.sceneCount = 0;
    changes.trackNames = [];
    changes.trackColors = [];
    changes.trackMuteStatuses = [];
    changes.trackSoloStatuses = [];
    changes.sceneNames = [];
    changes.clipNames = [];
    changes.clipColors = [];
    changes.clipPlayingStatuses = [];
    changes.clipQueuedStatuses = [];
    bank = host.createMainTrackBank(maximumTracks, 0, maximumScenes);
    for (var trackIndex = 0; trackIndex < maximumTracks; trackIndex++) {
        trackNames.push("");
        trackColors.push("");
        trackMuteStatuses.push("");
        trackSoloStatuses.push("");
    }
    for (var sceneIndex = 0; sceneIndex < maximumScenes; sceneIndex++) {
        sceneNames.push("");
    }
    for (var trackIndex = 0; trackIndex < maximumTracks; trackIndex++) {
        var clipNameArray = [];
        var clipColorArray = [];
        var clipPlayingStatusesArray = [];
        var clipQueuedStatusesArray = [];
        for (var sceneIndex = 0; sceneIndex < maximumScenes; sceneIndex++) {
            clipNameArray.push("");
            clipColorArray.push("");
            clipPlayingStatusesArray.push("");
            clipQueuedStatusesArray.push("");
        }
        clipNames.push(clipNameArray);
        clipColors.push(clipColorArray);
        clipPlayingStatuses.push(clipPlayingStatusesArray);
        clipQueuedStatuses.push(clipQueuedStatusesArray);
    }
    for (var trackIndex = 0; trackIndex < maximumTracks; trackIndex++) {
        var track = bank.getTrack(trackIndex);
        track.addNameObserver(MAX_PACKET_LENGTH, "", makeNameIndexFunction(trackIndex, function(index, name) {
            if (self.enableListeners) {
                if (trackNames[index] != name) {
                    changes.trackNames.push(index);
                    changes.trackNames = changes.trackNames.filter(function(element, position) {
                        return changes.trackNames.indexOf(element) == position;
                    });
                }
            }
            trackNames[index] = name;
            var count = 0;
            for (var index = 0; index < trackNames.length; index++) {
                if (trackNames[index].length > 0) {
                    count++;
                }
            }
            if (self.enableListeners) {
                changes.trackCount += (count - trackCount);
            }
            trackCount = count;
        }));
        track.addColorObserver(makeColorIndexFunction(trackIndex, function(index, red, green, blue) {
            if (self.enableListeners) {
                if (!arraysEqual(trackColors[index], [red, green, blue])) {
                    changes.trackColors.push(index);
                    changes.trackColors = changes.trackColors.filter(function(element, position) {
                        return changes.trackColors.indexOf(element) == position;
                    });
                }
            }
            trackColors[index] = [red, green, blue];
            changes.trackColors = changes.trackColors.filter(function(item) {
                return (item < trackCount);
            });
        }));
        track.getMute().addValueObserver(makeValueIndexFunction(trackIndex, function(index, value) {
            if (self.enableListeners) {
                if (trackMuteStatuses[index] != value) {
                    changes.trackMuteStatuses.push(index);
                    changes.trackMuteStatuses = changes.trackMuteStatuses.filter(function(element, position) {
                        return changes.trackMuteStatuses.indexOf(element) == position;
                    });
                }
            }
            trackMuteStatuses[index] = value;
        }));
        track.getSolo().addValueObserver(makeValueIndexFunction(trackIndex, function(index, value) {
            if (self.enableListeners) {
                if (trackSoloStatuses[index] != value) {
                    changes.trackSoloStatuses.push(index);
                    changes.trackSoloStatuses = changes.trackSoloStatuses.filter(function(element, position) {
                        return changes.trackSoloStatuses.indexOf(element) == position;
                    });
                }
            }
            trackSoloStatuses[index] = value;
        }));
    }
    bank.getClipLauncherScenes().addNameObserver(function(index, name) {
        if (self.enableListeners) {
            if (sceneNames[index] != name) {
                changes.sceneNames.push(index);
                changes.sceneNames = changes.sceneNames.filter(function(element, position) {
                    return changes.sceneNames.indexOf(element) == position;
                });
            }
        }
        sceneNames[index] = name;
        var lastSceneFound = false;
        for (var index = 0; index < sceneNames.length; index++) {
            if (sceneNames[index] == 0) {
                lastSceneFound = true;
            }
            if (lastSceneFound) {
                sceneNames[index] = "";
            }
        }
        var count = 0;
        for (var index = 0; index < sceneNames.length; index++) {
            if (sceneNames[index].length > 0) {
                count++;
            }
        }
        if (self.enableListeners) {
            changes.sceneCount += (count - sceneCount);
        }
        sceneCount = count;
    });
    for (var trackIndex = 0; trackIndex < maximumTracks; trackIndex++) {
        var slots = bank.getTrack(trackIndex).getClipLauncherSlots();
        slots.addNameObserver(makeClipNameIndexFunction(trackIndex, function(xIndex, yIndex, name) {
            if (self.enableListeners) {
                if (clipNames[xIndex][yIndex] != name) {
                    var exists = false;
                    for (var index = 0; index < changes.clipNames.length; index++) {
                        if (arraysEqual(changes.clipNames[index], [xIndex, yIndex])) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        changes.clipNames.push([xIndex, yIndex]);
                    }
                }
            }
            clipNames[xIndex][yIndex] = name;
        }));
        slots.addColorObserver(makeClipColorIndexFunction(trackIndex, function(xIndex, yIndex, red, green, blue) {
            if (self.enableListeners) {
                if (!arraysEqual(clipColors[xIndex][yIndex], [red, green, blue])) {
                    var exists = false;
                    for (var index = 0; index < changes.clipColors.length; index++) {
                        if (arraysEqual(changes.clipColors[index], [xIndex, yIndex])) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        changes.clipColors.push([xIndex, yIndex]);
                    }
                }
            }
            clipColors[xIndex][yIndex] = [red, green, blue];
        }));
        slots.addIsPlayingObserver(makeClipPlayingStatusIndexFunction(trackIndex, function(xIndex, yIndex, playingStatus) {
            if (self.enableListeners) {
                if (clipPlayingStatuses[xIndex][yIndex] != playingStatus) {
                    var exists = false;
                    for (var index = 0; index < changes.clipPlayingStatuses.length; index++) {
                        if (arraysEqual(changes.clipPlayingStatuses[index], [xIndex, yIndex])) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        changes.clipPlayingStatuses.push([xIndex, yIndex]);
                    }
                }
            }
            clipPlayingStatuses[xIndex][yIndex] = playingStatus;
        }));
        slots.addIsQueuedObserver(makeClipQueuedStatusIndexFunction(trackIndex, function(xIndex, yIndex, queuedStatus) {
            if (self.enableListeners) {
                if (clipQueuedStatuses[xIndex][yIndex] != queuedStatus) {
                    var exists = false;
                    for (var index = 0; index < changes.clipQueuedStatuses.length; index++) {
                        if (arraysEqual(changes.clipQueuedStatuses[index], [xIndex, yIndex])) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        changes.clipQueuedStatuses.push([xIndex, yIndex]);
                    }
                }
            }
            clipQueuedStatuses[xIndex][yIndex] = queuedStatus;
        }));
    }
}

function filterChanges() {
    println("filter changes");
    changes.trackNames = changes.trackNames.filter(function(item) {
        return (item < trackCount);
    });
    changes.clipNames = changes.clipNames.filter(function(item) {
        return ((item[0] < trackCount) && (item[1] < sceneCount));
    });
    changes.trackMuteStatuses = changes.trackMuteStatuses.filter(function(item) {
        return (item < trackCount);
    });
    changes.trackSoloStatuses = changes.trackSoloStatuses.filter(function(item) {
        return (item < trackCount);
    });
    changes.sceneNames = changes.sceneNames.filter(function(item) {
        return (item < sceneCount);
    });
    changes.clipColors = changes.clipColors.filter(function(item) {
        return ((item[0] < trackCount) && (item[1] < sceneCount));
    });
    changes.clipPlayingStatuses = changes.clipPlayingStatuses.filter(function(item) {
        return ((item[0] < trackCount) && (item[1] < sceneCount));
    });
    changes.clipQueuedStatuses = changes.clipQueuedStatuses.filter(function(item) {
        return ((item[0] < trackCount) && (item[1] < sceneCount));
    });
}

DataManager.prototype.getTrackCount = function() {
    return trackCount;
}

DataManager.prototype.getSceneCount = function() {
    return sceneCount;
}

DataManager.prototype.getTrackName = function(trackIndex) {
    return trackNames[trackIndex];
}

DataManager.prototype.getTrackColor = function(trackIndex) {
    return trackColors[trackIndex];
}

DataManager.prototype.getTrackMuteStatus = function(trackIndex) {
    return trackMuteStatuses[trackIndex];
}

DataManager.prototype.getTrackSoloStatus = function(trackIndex) {
    return trackSoloStatuses[trackIndex];
}

DataManager.prototype.getSceneName = function(sceneIndex) {
    return sceneNames[sceneIndex];
}

DataManager.prototype.getClipName = function(trackIndex, sceneIndex) {
    return clipNames[trackIndex][sceneIndex];
}

DataManager.prototype.getClipColor = function(trackIndex, sceneIndex) {
    return clipColors[trackIndex][sceneIndex];
}

DataManager.prototype.getClipPlayingStatus = function(trackIndex, sceneIndex) {
    return clipPlayingStatuses[trackIndex][sceneIndex];
}

DataManager.prototype.getClipQueuedStatus = function(trackIndex, sceneIndex) {
    return clipQueuedStatuses[trackIndex][sceneIndex];
}

DataManager.prototype.getChanges = function() {
    filterChanges();
    return clone(changes);
}

DataManager.prototype.clearChanges = function() {
    changes.trackCount = 0;
    changes.sceneCount = 0;
    changes.trackNames = [];
    changes.trackColors = [];
    changes.trackMuteStatuses = [];
    changes.trackSoloStatuses = [];
    changes.sceneNames = [];
    changes.clipNames = [];
    changes.clipColors = [];
    changes.clipPlayingStatuses = [];
    changes.clipQueuedStatuses = [];
}

function makeNameIndexFunction(index, f) {
    return function(name) {
        f(index, name);
    }
}

function makeColorIndexFunction(index, f) {
    return function(red, green, blue) {
        f(index, red, green, blue);
    }
}

function makeValueIndexFunction(index, f) {
    return function(value) {
        f(index, value);
    }
}

function makeClipNameIndexFunction(xIndex, f) {
    return function(yIndex, name) {
        f(xIndex, yIndex, name);
    }
}

function makeClipColorIndexFunction(xIndex, f) {
    return function(yIndex, red, green, blue) {
        f(xIndex, yIndex, red, green, blue);
    }
}

function makeClipPlayingStatusIndexFunction(xIndex, f) {
    return function(yIndex, playingStatus) {
        f(xIndex, yIndex, playingStatus);
    }
}

function makeClipQueuedStatusIndexFunction(xIndex, f) {
    return function(yIndex, queuedStatus) {
        f(xIndex, yIndex, queuedStatus);
    }
}

function arraysEqual(array1, array2) {
    if (array1.length !== array2.length)
        return false;
    for (var index = array1.length; index--;) {
        if (array1[index] !== array2[index])
            return false;
    }
    return true;
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}