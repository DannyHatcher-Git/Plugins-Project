'use strict';

var obsidian = require('obsidian');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class SoundSettingTab extends obsidian.PluginSettingTab {
    // ??
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        // Prevents added containers on open.
        containerEl.empty();
        // Adds information.
        containerEl.createEl('h2', { text: 'Heading 2' });
        // Adds line. Then information.	
        new obsidian.Setting(containerEl)
            // Adds name and description.
            .setName('Setting Name')
            .setDesc('A description')
            // Adds input box.
            .addText(text => text
            // Creates a value to save information.
            .setValue(this.plugin.settings.mySetting)
            // Placeholder text.
            .setPlaceholder('Placeholder text')
            // When text is changed trigger.
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            // Change the mySetting value.
            this.plugin.settings.mySetting = value;
            // ??
            yield this.plugin.saveSettings();
        })));
    }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var howler = {};

/*!
 *  howler.js v2.2.3
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

(function (exports) {
	(function() {

	  /** Global Methods **/
	  /***************************************************************************/

	  /**
	   * Create the global controller. All contained methods and properties apply
	   * to all sounds that are currently playing or will be in the future.
	   */
	  var HowlerGlobal = function() {
	    this.init();
	  };
	  HowlerGlobal.prototype = {
	    /**
	     * Initialize the global Howler object.
	     * @return {Howler}
	     */
	    init: function() {
	      var self = this || Howler;

	      // Create a global ID counter.
	      self._counter = 1000;

	      // Pool of unlocked HTML5 Audio objects.
	      self._html5AudioPool = [];
	      self.html5PoolSize = 10;

	      // Internal properties.
	      self._codecs = {};
	      self._howls = [];
	      self._muted = false;
	      self._volume = 1;
	      self._canPlayEvent = 'canplaythrough';
	      self._navigator = (typeof window !== 'undefined' && window.navigator) ? window.navigator : null;

	      // Public properties.
	      self.masterGain = null;
	      self.noAudio = false;
	      self.usingWebAudio = true;
	      self.autoSuspend = true;
	      self.ctx = null;

	      // Set to false to disable the auto audio unlocker.
	      self.autoUnlock = true;

	      // Setup the various state values for global tracking.
	      self._setup();

	      return self;
	    },

	    /**
	     * Get/set the global volume for all sounds.
	     * @param  {Float} vol Volume from 0.0 to 1.0.
	     * @return {Howler/Float}     Returns self or current volume.
	     */
	    volume: function(vol) {
	      var self = this || Howler;
	      vol = parseFloat(vol);

	      // If we don't have an AudioContext created yet, run the setup.
	      if (!self.ctx) {
	        setupAudioContext();
	      }

	      if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
	        self._volume = vol;

	        // Don't update any of the nodes if we are muted.
	        if (self._muted) {
	          return self;
	        }

	        // When using Web Audio, we just need to adjust the master gain.
	        if (self.usingWebAudio) {
	          self.masterGain.gain.setValueAtTime(vol, Howler.ctx.currentTime);
	        }

	        // Loop through and change volume for all HTML5 audio nodes.
	        for (var i=0; i<self._howls.length; i++) {
	          if (!self._howls[i]._webAudio) {
	            // Get all of the sounds in this Howl group.
	            var ids = self._howls[i]._getSoundIds();

	            // Loop through all sounds and change the volumes.
	            for (var j=0; j<ids.length; j++) {
	              var sound = self._howls[i]._soundById(ids[j]);

	              if (sound && sound._node) {
	                sound._node.volume = sound._volume * vol;
	              }
	            }
	          }
	        }

	        return self;
	      }

	      return self._volume;
	    },

	    /**
	     * Handle muting and unmuting globally.
	     * @param  {Boolean} muted Is muted or not.
	     */
	    mute: function(muted) {
	      var self = this || Howler;

	      // If we don't have an AudioContext created yet, run the setup.
	      if (!self.ctx) {
	        setupAudioContext();
	      }

	      self._muted = muted;

	      // With Web Audio, we just need to mute the master gain.
	      if (self.usingWebAudio) {
	        self.masterGain.gain.setValueAtTime(muted ? 0 : self._volume, Howler.ctx.currentTime);
	      }

	      // Loop through and mute all HTML5 Audio nodes.
	      for (var i=0; i<self._howls.length; i++) {
	        if (!self._howls[i]._webAudio) {
	          // Get all of the sounds in this Howl group.
	          var ids = self._howls[i]._getSoundIds();

	          // Loop through all sounds and mark the audio node as muted.
	          for (var j=0; j<ids.length; j++) {
	            var sound = self._howls[i]._soundById(ids[j]);

	            if (sound && sound._node) {
	              sound._node.muted = (muted) ? true : sound._muted;
	            }
	          }
	        }
	      }

	      return self;
	    },

	    /**
	     * Handle stopping all sounds globally.
	     */
	    stop: function() {
	      var self = this || Howler;

	      // Loop through all Howls and stop them.
	      for (var i=0; i<self._howls.length; i++) {
	        self._howls[i].stop();
	      }

	      return self;
	    },

	    /**
	     * Unload and destroy all currently loaded Howl objects.
	     * @return {Howler}
	     */
	    unload: function() {
	      var self = this || Howler;

	      for (var i=self._howls.length-1; i>=0; i--) {
	        self._howls[i].unload();
	      }

	      // Create a new AudioContext to make sure it is fully reset.
	      if (self.usingWebAudio && self.ctx && typeof self.ctx.close !== 'undefined') {
	        self.ctx.close();
	        self.ctx = null;
	        setupAudioContext();
	      }

	      return self;
	    },

	    /**
	     * Check for codec support of specific extension.
	     * @param  {String} ext Audio file extention.
	     * @return {Boolean}
	     */
	    codecs: function(ext) {
	      return (this || Howler)._codecs[ext.replace(/^x-/, '')];
	    },

	    /**
	     * Setup various state values for global tracking.
	     * @return {Howler}
	     */
	    _setup: function() {
	      var self = this || Howler;

	      // Keeps track of the suspend/resume state of the AudioContext.
	      self.state = self.ctx ? self.ctx.state || 'suspended' : 'suspended';

	      // Automatically begin the 30-second suspend process
	      self._autoSuspend();

	      // Check if audio is available.
	      if (!self.usingWebAudio) {
	        // No audio is available on this system if noAudio is set to true.
	        if (typeof Audio !== 'undefined') {
	          try {
	            var test = new Audio();

	            // Check if the canplaythrough event is available.
	            if (typeof test.oncanplaythrough === 'undefined') {
	              self._canPlayEvent = 'canplay';
	            }
	          } catch(e) {
	            self.noAudio = true;
	          }
	        } else {
	          self.noAudio = true;
	        }
	      }

	      // Test to make sure audio isn't disabled in Internet Explorer.
	      try {
	        var test = new Audio();
	        if (test.muted) {
	          self.noAudio = true;
	        }
	      } catch (e) {}

	      // Check for supported codecs.
	      if (!self.noAudio) {
	        self._setupCodecs();
	      }

	      return self;
	    },

	    /**
	     * Check for browser support for various codecs and cache the results.
	     * @return {Howler}
	     */
	    _setupCodecs: function() {
	      var self = this || Howler;
	      var audioTest = null;

	      // Must wrap in a try/catch because IE11 in server mode throws an error.
	      try {
	        audioTest = (typeof Audio !== 'undefined') ? new Audio() : null;
	      } catch (err) {
	        return self;
	      }

	      if (!audioTest || typeof audioTest.canPlayType !== 'function') {
	        return self;
	      }

	      var mpegTest = audioTest.canPlayType('audio/mpeg;').replace(/^no$/, '');

	      // Opera version <33 has mixed MP3 support, so we need to check for and block it.
	      var ua = self._navigator ? self._navigator.userAgent : '';
	      var checkOpera = ua.match(/OPR\/([0-6].)/g);
	      var isOldOpera = (checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33);
	      var checkSafari = ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1;
	      var safariVersion = ua.match(/Version\/(.*?) /);
	      var isOldSafari = (checkSafari && safariVersion && parseInt(safariVersion[1], 10) < 15);

	      self._codecs = {
	        mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType('audio/mp3;').replace(/^no$/, ''))),
	        mpeg: !!mpegTest,
	        opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
	        ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
	        oga: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
	        wav: !!(audioTest.canPlayType('audio/wav; codecs="1"') || audioTest.canPlayType('audio/wav')).replace(/^no$/, ''),
	        aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
	        caf: !!audioTest.canPlayType('audio/x-caf;').replace(/^no$/, ''),
	        m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
	        m4b: !!(audioTest.canPlayType('audio/x-m4b;') || audioTest.canPlayType('audio/m4b;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
	        mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
	        weba: !!(!isOldSafari && audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')),
	        webm: !!(!isOldSafari && audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')),
	        dolby: !!audioTest.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ''),
	        flac: !!(audioTest.canPlayType('audio/x-flac;') || audioTest.canPlayType('audio/flac;')).replace(/^no$/, '')
	      };

	      return self;
	    },

	    /**
	     * Some browsers/devices will only allow audio to be played after a user interaction.
	     * Attempt to automatically unlock audio on the first user interaction.
	     * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
	     * @return {Howler}
	     */
	    _unlockAudio: function() {
	      var self = this || Howler;

	      // Only run this if Web Audio is supported and it hasn't already been unlocked.
	      if (self._audioUnlocked || !self.ctx) {
	        return;
	      }

	      self._audioUnlocked = false;
	      self.autoUnlock = false;

	      // Some mobile devices/platforms have distortion issues when opening/closing tabs and/or web views.
	      // Bugs in the browser (especially Mobile Safari) can cause the sampleRate to change from 44100 to 48000.
	      // By calling Howler.unload(), we create a new AudioContext with the correct sampleRate.
	      if (!self._mobileUnloaded && self.ctx.sampleRate !== 44100) {
	        self._mobileUnloaded = true;
	        self.unload();
	      }

	      // Scratch buffer for enabling iOS to dispose of web audio buffers correctly, as per:
	      // http://stackoverflow.com/questions/24119684
	      self._scratchBuffer = self.ctx.createBuffer(1, 1, 22050);

	      // Call this method on touch start to create and play a buffer,
	      // then check if the audio actually played to determine if
	      // audio has now been unlocked on iOS, Android, etc.
	      var unlock = function(e) {
	        // Create a pool of unlocked HTML5 Audio objects that can
	        // be used for playing sounds without user interaction. HTML5
	        // Audio objects must be individually unlocked, as opposed
	        // to the WebAudio API which only needs a single activation.
	        // This must occur before WebAudio setup or the source.onended
	        // event will not fire.
	        while (self._html5AudioPool.length < self.html5PoolSize) {
	          try {
	            var audioNode = new Audio();

	            // Mark this Audio object as unlocked to ensure it can get returned
	            // to the unlocked pool when released.
	            audioNode._unlocked = true;

	            // Add the audio node to the pool.
	            self._releaseHtml5Audio(audioNode);
	          } catch (e) {
	            self.noAudio = true;
	            break;
	          }
	        }

	        // Loop through any assigned audio nodes and unlock them.
	        for (var i=0; i<self._howls.length; i++) {
	          if (!self._howls[i]._webAudio) {
	            // Get all of the sounds in this Howl group.
	            var ids = self._howls[i]._getSoundIds();

	            // Loop through all sounds and unlock the audio nodes.
	            for (var j=0; j<ids.length; j++) {
	              var sound = self._howls[i]._soundById(ids[j]);

	              if (sound && sound._node && !sound._node._unlocked) {
	                sound._node._unlocked = true;
	                sound._node.load();
	              }
	            }
	          }
	        }

	        // Fix Android can not play in suspend state.
	        self._autoResume();

	        // Create an empty buffer.
	        var source = self.ctx.createBufferSource();
	        source.buffer = self._scratchBuffer;
	        source.connect(self.ctx.destination);

	        // Play the empty buffer.
	        if (typeof source.start === 'undefined') {
	          source.noteOn(0);
	        } else {
	          source.start(0);
	        }

	        // Calling resume() on a stack initiated by user gesture is what actually unlocks the audio on Android Chrome >= 55.
	        if (typeof self.ctx.resume === 'function') {
	          self.ctx.resume();
	        }

	        // Setup a timeout to check that we are unlocked on the next event loop.
	        source.onended = function() {
	          source.disconnect(0);

	          // Update the unlocked state and prevent this check from happening again.
	          self._audioUnlocked = true;

	          // Remove the touch start listener.
	          document.removeEventListener('touchstart', unlock, true);
	          document.removeEventListener('touchend', unlock, true);
	          document.removeEventListener('click', unlock, true);
	          document.removeEventListener('keydown', unlock, true);

	          // Let all sounds know that audio has been unlocked.
	          for (var i=0; i<self._howls.length; i++) {
	            self._howls[i]._emit('unlock');
	          }
	        };
	      };

	      // Setup a touch start listener to attempt an unlock in.
	      document.addEventListener('touchstart', unlock, true);
	      document.addEventListener('touchend', unlock, true);
	      document.addEventListener('click', unlock, true);
	      document.addEventListener('keydown', unlock, true);

	      return self;
	    },

	    /**
	     * Get an unlocked HTML5 Audio object from the pool. If none are left,
	     * return a new Audio object and throw a warning.
	     * @return {Audio} HTML5 Audio object.
	     */
	    _obtainHtml5Audio: function() {
	      var self = this || Howler;

	      // Return the next object from the pool if one exists.
	      if (self._html5AudioPool.length) {
	        return self._html5AudioPool.pop();
	      }

	      //.Check if the audio is locked and throw a warning.
	      var testPlay = new Audio().play();
	      if (testPlay && typeof Promise !== 'undefined' && (testPlay instanceof Promise || typeof testPlay.then === 'function')) {
	        testPlay.catch(function() {
	          console.warn('HTML5 Audio pool exhausted, returning potentially locked audio object.');
	        });
	      }

	      return new Audio();
	    },

	    /**
	     * Return an activated HTML5 Audio object to the pool.
	     * @return {Howler}
	     */
	    _releaseHtml5Audio: function(audio) {
	      var self = this || Howler;

	      // Don't add audio to the pool if we don't know if it has been unlocked.
	      if (audio._unlocked) {
	        self._html5AudioPool.push(audio);
	      }

	      return self;
	    },

	    /**
	     * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
	     * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
	     * @return {Howler}
	     */
	    _autoSuspend: function() {
	      var self = this;

	      if (!self.autoSuspend || !self.ctx || typeof self.ctx.suspend === 'undefined' || !Howler.usingWebAudio) {
	        return;
	      }

	      // Check if any sounds are playing.
	      for (var i=0; i<self._howls.length; i++) {
	        if (self._howls[i]._webAudio) {
	          for (var j=0; j<self._howls[i]._sounds.length; j++) {
	            if (!self._howls[i]._sounds[j]._paused) {
	              return self;
	            }
	          }
	        }
	      }

	      if (self._suspendTimer) {
	        clearTimeout(self._suspendTimer);
	      }

	      // If no sound has played after 30 seconds, suspend the context.
	      self._suspendTimer = setTimeout(function() {
	        if (!self.autoSuspend) {
	          return;
	        }

	        self._suspendTimer = null;
	        self.state = 'suspending';

	        // Handle updating the state of the audio context after suspending.
	        var handleSuspension = function() {
	          self.state = 'suspended';

	          if (self._resumeAfterSuspend) {
	            delete self._resumeAfterSuspend;
	            self._autoResume();
	          }
	        };

	        // Either the state gets suspended or it is interrupted.
	        // Either way, we need to update the state to suspended.
	        self.ctx.suspend().then(handleSuspension, handleSuspension);
	      }, 30000);

	      return self;
	    },

	    /**
	     * Automatically resume the Web Audio AudioContext when a new sound is played.
	     * @return {Howler}
	     */
	    _autoResume: function() {
	      var self = this;

	      if (!self.ctx || typeof self.ctx.resume === 'undefined' || !Howler.usingWebAudio) {
	        return;
	      }

	      if (self.state === 'running' && self.ctx.state !== 'interrupted' && self._suspendTimer) {
	        clearTimeout(self._suspendTimer);
	        self._suspendTimer = null;
	      } else if (self.state === 'suspended' || self.state === 'running' && self.ctx.state === 'interrupted') {
	        self.ctx.resume().then(function() {
	          self.state = 'running';

	          // Emit to all Howls that the audio has resumed.
	          for (var i=0; i<self._howls.length; i++) {
	            self._howls[i]._emit('resume');
	          }
	        });

	        if (self._suspendTimer) {
	          clearTimeout(self._suspendTimer);
	          self._suspendTimer = null;
	        }
	      } else if (self.state === 'suspending') {
	        self._resumeAfterSuspend = true;
	      }

	      return self;
	    }
	  };

	  // Setup the global audio controller.
	  var Howler = new HowlerGlobal();

	  /** Group Methods **/
	  /***************************************************************************/

	  /**
	   * Create an audio group controller.
	   * @param {Object} o Passed in properties for this group.
	   */
	  var Howl = function(o) {
	    var self = this;

	    // Throw an error if no source is provided.
	    if (!o.src || o.src.length === 0) {
	      console.error('An array of source files must be passed with any new Howl.');
	      return;
	    }

	    self.init(o);
	  };
	  Howl.prototype = {
	    /**
	     * Initialize a new Howl group object.
	     * @param  {Object} o Passed in properties for this group.
	     * @return {Howl}
	     */
	    init: function(o) {
	      var self = this;

	      // If we don't have an AudioContext created yet, run the setup.
	      if (!Howler.ctx) {
	        setupAudioContext();
	      }

	      // Setup user-defined default properties.
	      self._autoplay = o.autoplay || false;
	      self._format = (typeof o.format !== 'string') ? o.format : [o.format];
	      self._html5 = o.html5 || false;
	      self._muted = o.mute || false;
	      self._loop = o.loop || false;
	      self._pool = o.pool || 5;
	      self._preload = (typeof o.preload === 'boolean' || o.preload === 'metadata') ? o.preload : true;
	      self._rate = o.rate || 1;
	      self._sprite = o.sprite || {};
	      self._src = (typeof o.src !== 'string') ? o.src : [o.src];
	      self._volume = o.volume !== undefined ? o.volume : 1;
	      self._xhr = {
	        method: o.xhr && o.xhr.method ? o.xhr.method : 'GET',
	        headers: o.xhr && o.xhr.headers ? o.xhr.headers : null,
	        withCredentials: o.xhr && o.xhr.withCredentials ? o.xhr.withCredentials : false,
	      };

	      // Setup all other default properties.
	      self._duration = 0;
	      self._state = 'unloaded';
	      self._sounds = [];
	      self._endTimers = {};
	      self._queue = [];
	      self._playLock = false;

	      // Setup event listeners.
	      self._onend = o.onend ? [{fn: o.onend}] : [];
	      self._onfade = o.onfade ? [{fn: o.onfade}] : [];
	      self._onload = o.onload ? [{fn: o.onload}] : [];
	      self._onloaderror = o.onloaderror ? [{fn: o.onloaderror}] : [];
	      self._onplayerror = o.onplayerror ? [{fn: o.onplayerror}] : [];
	      self._onpause = o.onpause ? [{fn: o.onpause}] : [];
	      self._onplay = o.onplay ? [{fn: o.onplay}] : [];
	      self._onstop = o.onstop ? [{fn: o.onstop}] : [];
	      self._onmute = o.onmute ? [{fn: o.onmute}] : [];
	      self._onvolume = o.onvolume ? [{fn: o.onvolume}] : [];
	      self._onrate = o.onrate ? [{fn: o.onrate}] : [];
	      self._onseek = o.onseek ? [{fn: o.onseek}] : [];
	      self._onunlock = o.onunlock ? [{fn: o.onunlock}] : [];
	      self._onresume = [];

	      // Web Audio or HTML5 Audio?
	      self._webAudio = Howler.usingWebAudio && !self._html5;

	      // Automatically try to enable audio.
	      if (typeof Howler.ctx !== 'undefined' && Howler.ctx && Howler.autoUnlock) {
	        Howler._unlockAudio();
	      }

	      // Keep track of this Howl group in the global controller.
	      Howler._howls.push(self);

	      // If they selected autoplay, add a play event to the load queue.
	      if (self._autoplay) {
	        self._queue.push({
	          event: 'play',
	          action: function() {
	            self.play();
	          }
	        });
	      }

	      // Load the source file unless otherwise specified.
	      if (self._preload && self._preload !== 'none') {
	        self.load();
	      }

	      return self;
	    },

	    /**
	     * Load the audio file.
	     * @return {Howler}
	     */
	    load: function() {
	      var self = this;
	      var url = null;

	      // If no audio is available, quit immediately.
	      if (Howler.noAudio) {
	        self._emit('loaderror', null, 'No audio support.');
	        return;
	      }

	      // Make sure our source is in an array.
	      if (typeof self._src === 'string') {
	        self._src = [self._src];
	      }

	      // Loop through the sources and pick the first one that is compatible.
	      for (var i=0; i<self._src.length; i++) {
	        var ext, str;

	        if (self._format && self._format[i]) {
	          // If an extension was specified, use that instead.
	          ext = self._format[i];
	        } else {
	          // Make sure the source is a string.
	          str = self._src[i];
	          if (typeof str !== 'string') {
	            self._emit('loaderror', null, 'Non-string found in selected audio sources - ignoring.');
	            continue;
	          }

	          // Extract the file extension from the URL or base64 data URI.
	          ext = /^data:audio\/([^;,]+);/i.exec(str);
	          if (!ext) {
	            ext = /\.([^.]+)$/.exec(str.split('?', 1)[0]);
	          }

	          if (ext) {
	            ext = ext[1].toLowerCase();
	          }
	        }

	        // Log a warning if no extension was found.
	        if (!ext) {
	          console.warn('No file extension was found. Consider using the "format" property or specify an extension.');
	        }

	        // Check if this extension is available.
	        if (ext && Howler.codecs(ext)) {
	          url = self._src[i];
	          break;
	        }
	      }

	      if (!url) {
	        self._emit('loaderror', null, 'No codec support for selected audio sources.');
	        return;
	      }

	      self._src = url;
	      self._state = 'loading';

	      // If the hosting page is HTTPS and the source isn't,
	      // drop down to HTML5 Audio to avoid Mixed Content errors.
	      if (window.location.protocol === 'https:' && url.slice(0, 5) === 'http:') {
	        self._html5 = true;
	        self._webAudio = false;
	      }

	      // Create a new sound object and add it to the pool.
	      new Sound(self);

	      // Load and decode the audio data for playback.
	      if (self._webAudio) {
	        loadBuffer(self);
	      }

	      return self;
	    },

	    /**
	     * Play a sound or resume previous playback.
	     * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
	     * @param  {Boolean} internal Internal Use: true prevents event firing.
	     * @return {Number}          Sound ID.
	     */
	    play: function(sprite, internal) {
	      var self = this;
	      var id = null;

	      // Determine if a sprite, sound id or nothing was passed
	      if (typeof sprite === 'number') {
	        id = sprite;
	        sprite = null;
	      } else if (typeof sprite === 'string' && self._state === 'loaded' && !self._sprite[sprite]) {
	        // If the passed sprite doesn't exist, do nothing.
	        return null;
	      } else if (typeof sprite === 'undefined') {
	        // Use the default sound sprite (plays the full audio length).
	        sprite = '__default';

	        // Check if there is a single paused sound that isn't ended.
	        // If there is, play that sound. If not, continue as usual.
	        if (!self._playLock) {
	          var num = 0;
	          for (var i=0; i<self._sounds.length; i++) {
	            if (self._sounds[i]._paused && !self._sounds[i]._ended) {
	              num++;
	              id = self._sounds[i]._id;
	            }
	          }

	          if (num === 1) {
	            sprite = null;
	          } else {
	            id = null;
	          }
	        }
	      }

	      // Get the selected node, or get one from the pool.
	      var sound = id ? self._soundById(id) : self._inactiveSound();

	      // If the sound doesn't exist, do nothing.
	      if (!sound) {
	        return null;
	      }

	      // Select the sprite definition.
	      if (id && !sprite) {
	        sprite = sound._sprite || '__default';
	      }

	      // If the sound hasn't loaded, we must wait to get the audio's duration.
	      // We also need to wait to make sure we don't run into race conditions with
	      // the order of function calls.
	      if (self._state !== 'loaded') {
	        // Set the sprite value on this sound.
	        sound._sprite = sprite;

	        // Mark this sound as not ended in case another sound is played before this one loads.
	        sound._ended = false;

	        // Add the sound to the queue to be played on load.
	        var soundId = sound._id;
	        self._queue.push({
	          event: 'play',
	          action: function() {
	            self.play(soundId);
	          }
	        });

	        return soundId;
	      }

	      // Don't play the sound if an id was passed and it is already playing.
	      if (id && !sound._paused) {
	        // Trigger the play event, in order to keep iterating through queue.
	        if (!internal) {
	          self._loadQueue('play');
	        }

	        return sound._id;
	      }

	      // Make sure the AudioContext isn't suspended, and resume it if it is.
	      if (self._webAudio) {
	        Howler._autoResume();
	      }

	      // Determine how long to play for and where to start playing.
	      var seek = Math.max(0, sound._seek > 0 ? sound._seek : self._sprite[sprite][0] / 1000);
	      var duration = Math.max(0, ((self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000) - seek);
	      var timeout = (duration * 1000) / Math.abs(sound._rate);
	      var start = self._sprite[sprite][0] / 1000;
	      var stop = (self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000;
	      sound._sprite = sprite;

	      // Mark the sound as ended instantly so that this async playback
	      // doesn't get grabbed by another call to play while this one waits to start.
	      sound._ended = false;

	      // Update the parameters of the sound.
	      var setParams = function() {
	        sound._paused = false;
	        sound._seek = seek;
	        sound._start = start;
	        sound._stop = stop;
	        sound._loop = !!(sound._loop || self._sprite[sprite][2]);
	      };

	      // End the sound instantly if seek is at the end.
	      if (seek >= stop) {
	        self._ended(sound);
	        return;
	      }

	      // Begin the actual playback.
	      var node = sound._node;
	      if (self._webAudio) {
	        // Fire this when the sound is ready to play to begin Web Audio playback.
	        var playWebAudio = function() {
	          self._playLock = false;
	          setParams();
	          self._refreshBuffer(sound);

	          // Setup the playback params.
	          var vol = (sound._muted || self._muted) ? 0 : sound._volume;
	          node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
	          sound._playStart = Howler.ctx.currentTime;

	          // Play the sound using the supported method.
	          if (typeof node.bufferSource.start === 'undefined') {
	            sound._loop ? node.bufferSource.noteGrainOn(0, seek, 86400) : node.bufferSource.noteGrainOn(0, seek, duration);
	          } else {
	            sound._loop ? node.bufferSource.start(0, seek, 86400) : node.bufferSource.start(0, seek, duration);
	          }

	          // Start a new timer if none is present.
	          if (timeout !== Infinity) {
	            self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
	          }

	          if (!internal) {
	            setTimeout(function() {
	              self._emit('play', sound._id);
	              self._loadQueue();
	            }, 0);
	          }
	        };

	        if (Howler.state === 'running' && Howler.ctx.state !== 'interrupted') {
	          playWebAudio();
	        } else {
	          self._playLock = true;

	          // Wait for the audio context to resume before playing.
	          self.once('resume', playWebAudio);

	          // Cancel the end timer.
	          self._clearTimer(sound._id);
	        }
	      } else {
	        // Fire this when the sound is ready to play to begin HTML5 Audio playback.
	        var playHtml5 = function() {
	          node.currentTime = seek;
	          node.muted = sound._muted || self._muted || Howler._muted || node.muted;
	          node.volume = sound._volume * Howler.volume();
	          node.playbackRate = sound._rate;

	          // Some browsers will throw an error if this is called without user interaction.
	          try {
	            var play = node.play();

	            // Support older browsers that don't support promises, and thus don't have this issue.
	            if (play && typeof Promise !== 'undefined' && (play instanceof Promise || typeof play.then === 'function')) {
	              // Implements a lock to prevent DOMException: The play() request was interrupted by a call to pause().
	              self._playLock = true;

	              // Set param values immediately.
	              setParams();

	              // Releases the lock and executes queued actions.
	              play
	                .then(function() {
	                  self._playLock = false;
	                  node._unlocked = true;
	                  if (!internal) {
	                    self._emit('play', sound._id);
	                  } else {
	                    self._loadQueue();
	                  }
	                })
	                .catch(function() {
	                  self._playLock = false;
	                  self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
	                    'on mobile devices and Chrome where playback was not within a user interaction.');

	                  // Reset the ended and paused values.
	                  sound._ended = true;
	                  sound._paused = true;
	                });
	            } else if (!internal) {
	              self._playLock = false;
	              setParams();
	              self._emit('play', sound._id);
	            }

	            // Setting rate before playing won't work in IE, so we set it again here.
	            node.playbackRate = sound._rate;

	            // If the node is still paused, then we can assume there was a playback issue.
	            if (node.paused) {
	              self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
	                'on mobile devices and Chrome where playback was not within a user interaction.');
	              return;
	            }

	            // Setup the end timer on sprites or listen for the ended event.
	            if (sprite !== '__default' || sound._loop) {
	              self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
	            } else {
	              self._endTimers[sound._id] = function() {
	                // Fire ended on this audio node.
	                self._ended(sound);

	                // Clear this listener.
	                node.removeEventListener('ended', self._endTimers[sound._id], false);
	              };
	              node.addEventListener('ended', self._endTimers[sound._id], false);
	            }
	          } catch (err) {
	            self._emit('playerror', sound._id, err);
	          }
	        };

	        // If this is streaming audio, make sure the src is set and load again.
	        if (node.src === 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA') {
	          node.src = self._src;
	          node.load();
	        }

	        // Play immediately if ready, or wait for the 'canplaythrough'e vent.
	        var loadedNoReadyState = (window && window.ejecta) || (!node.readyState && Howler._navigator.isCocoonJS);
	        if (node.readyState >= 3 || loadedNoReadyState) {
	          playHtml5();
	        } else {
	          self._playLock = true;
	          self._state = 'loading';

	          var listener = function() {
	            self._state = 'loaded';
	            
	            // Begin playback.
	            playHtml5();

	            // Clear this listener.
	            node.removeEventListener(Howler._canPlayEvent, listener, false);
	          };
	          node.addEventListener(Howler._canPlayEvent, listener, false);

	          // Cancel the end timer.
	          self._clearTimer(sound._id);
	        }
	      }

	      return sound._id;
	    },

	    /**
	     * Pause playback and save current position.
	     * @param  {Number} id The sound ID (empty to pause all in group).
	     * @return {Howl}
	     */
	    pause: function(id) {
	      var self = this;

	      // If the sound hasn't loaded or a play() promise is pending, add it to the load queue to pause when capable.
	      if (self._state !== 'loaded' || self._playLock) {
	        self._queue.push({
	          event: 'pause',
	          action: function() {
	            self.pause(id);
	          }
	        });

	        return self;
	      }

	      // If no id is passed, get all ID's to be paused.
	      var ids = self._getSoundIds(id);

	      for (var i=0; i<ids.length; i++) {
	        // Clear the end timer.
	        self._clearTimer(ids[i]);

	        // Get the sound.
	        var sound = self._soundById(ids[i]);

	        if (sound && !sound._paused) {
	          // Reset the seek position.
	          sound._seek = self.seek(ids[i]);
	          sound._rateSeek = 0;
	          sound._paused = true;

	          // Stop currently running fades.
	          self._stopFade(ids[i]);

	          if (sound._node) {
	            if (self._webAudio) {
	              // Make sure the sound has been created.
	              if (!sound._node.bufferSource) {
	                continue;
	              }

	              if (typeof sound._node.bufferSource.stop === 'undefined') {
	                sound._node.bufferSource.noteOff(0);
	              } else {
	                sound._node.bufferSource.stop(0);
	              }

	              // Clean up the buffer source.
	              self._cleanBuffer(sound._node);
	            } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
	              sound._node.pause();
	            }
	          }
	        }

	        // Fire the pause event, unless `true` is passed as the 2nd argument.
	        if (!arguments[1]) {
	          self._emit('pause', sound ? sound._id : null);
	        }
	      }

	      return self;
	    },

	    /**
	     * Stop playback and reset to start.
	     * @param  {Number} id The sound ID (empty to stop all in group).
	     * @param  {Boolean} internal Internal Use: true prevents event firing.
	     * @return {Howl}
	     */
	    stop: function(id, internal) {
	      var self = this;

	      // If the sound hasn't loaded, add it to the load queue to stop when capable.
	      if (self._state !== 'loaded' || self._playLock) {
	        self._queue.push({
	          event: 'stop',
	          action: function() {
	            self.stop(id);
	          }
	        });

	        return self;
	      }

	      // If no id is passed, get all ID's to be stopped.
	      var ids = self._getSoundIds(id);

	      for (var i=0; i<ids.length; i++) {
	        // Clear the end timer.
	        self._clearTimer(ids[i]);

	        // Get the sound.
	        var sound = self._soundById(ids[i]);

	        if (sound) {
	          // Reset the seek position.
	          sound._seek = sound._start || 0;
	          sound._rateSeek = 0;
	          sound._paused = true;
	          sound._ended = true;

	          // Stop currently running fades.
	          self._stopFade(ids[i]);

	          if (sound._node) {
	            if (self._webAudio) {
	              // Make sure the sound's AudioBufferSourceNode has been created.
	              if (sound._node.bufferSource) {
	                if (typeof sound._node.bufferSource.stop === 'undefined') {
	                  sound._node.bufferSource.noteOff(0);
	                } else {
	                  sound._node.bufferSource.stop(0);
	                }

	                // Clean up the buffer source.
	                self._cleanBuffer(sound._node);
	              }
	            } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
	              sound._node.currentTime = sound._start || 0;
	              sound._node.pause();

	              // If this is a live stream, stop download once the audio is stopped.
	              if (sound._node.duration === Infinity) {
	                self._clearSound(sound._node);
	              }
	            }
	          }

	          if (!internal) {
	            self._emit('stop', sound._id);
	          }
	        }
	      }

	      return self;
	    },

	    /**
	     * Mute/unmute a single sound or all sounds in this Howl group.
	     * @param  {Boolean} muted Set to true to mute and false to unmute.
	     * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
	     * @return {Howl}
	     */
	    mute: function(muted, id) {
	      var self = this;

	      // If the sound hasn't loaded, add it to the load queue to mute when capable.
	      if (self._state !== 'loaded'|| self._playLock) {
	        self._queue.push({
	          event: 'mute',
	          action: function() {
	            self.mute(muted, id);
	          }
	        });

	        return self;
	      }

	      // If applying mute/unmute to all sounds, update the group's value.
	      if (typeof id === 'undefined') {
	        if (typeof muted === 'boolean') {
	          self._muted = muted;
	        } else {
	          return self._muted;
	        }
	      }

	      // If no id is passed, get all ID's to be muted.
	      var ids = self._getSoundIds(id);

	      for (var i=0; i<ids.length; i++) {
	        // Get the sound.
	        var sound = self._soundById(ids[i]);

	        if (sound) {
	          sound._muted = muted;

	          // Cancel active fade and set the volume to the end value.
	          if (sound._interval) {
	            self._stopFade(sound._id);
	          }

	          if (self._webAudio && sound._node) {
	            sound._node.gain.setValueAtTime(muted ? 0 : sound._volume, Howler.ctx.currentTime);
	          } else if (sound._node) {
	            sound._node.muted = Howler._muted ? true : muted;
	          }

	          self._emit('mute', sound._id);
	        }
	      }

	      return self;
	    },

	    /**
	     * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
	     *   volume() -> Returns the group's volume value.
	     *   volume(id) -> Returns the sound id's current volume.
	     *   volume(vol) -> Sets the volume of all sounds in this Howl group.
	     *   volume(vol, id) -> Sets the volume of passed sound id.
	     * @return {Howl/Number} Returns self or current volume.
	     */
	    volume: function() {
	      var self = this;
	      var args = arguments;
	      var vol, id;

	      // Determine the values based on arguments.
	      if (args.length === 0) {
	        // Return the value of the groups' volume.
	        return self._volume;
	      } else if (args.length === 1 || args.length === 2 && typeof args[1] === 'undefined') {
	        // First check if this is an ID, and if not, assume it is a new volume.
	        var ids = self._getSoundIds();
	        var index = ids.indexOf(args[0]);
	        if (index >= 0) {
	          id = parseInt(args[0], 10);
	        } else {
	          vol = parseFloat(args[0]);
	        }
	      } else if (args.length >= 2) {
	        vol = parseFloat(args[0]);
	        id = parseInt(args[1], 10);
	      }

	      // Update the volume or return the current volume.
	      var sound;
	      if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
	        // If the sound hasn't loaded, add it to the load queue to change volume when capable.
	        if (self._state !== 'loaded'|| self._playLock) {
	          self._queue.push({
	            event: 'volume',
	            action: function() {
	              self.volume.apply(self, args);
	            }
	          });

	          return self;
	        }

	        // Set the group volume.
	        if (typeof id === 'undefined') {
	          self._volume = vol;
	        }

	        // Update one or all volumes.
	        id = self._getSoundIds(id);
	        for (var i=0; i<id.length; i++) {
	          // Get the sound.
	          sound = self._soundById(id[i]);

	          if (sound) {
	            sound._volume = vol;

	            // Stop currently running fades.
	            if (!args[2]) {
	              self._stopFade(id[i]);
	            }

	            if (self._webAudio && sound._node && !sound._muted) {
	              sound._node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
	            } else if (sound._node && !sound._muted) {
	              sound._node.volume = vol * Howler.volume();
	            }

	            self._emit('volume', sound._id);
	          }
	        }
	      } else {
	        sound = id ? self._soundById(id) : self._sounds[0];
	        return sound ? sound._volume : 0;
	      }

	      return self;
	    },

	    /**
	     * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
	     * @param  {Number} from The value to fade from (0.0 to 1.0).
	     * @param  {Number} to   The volume to fade to (0.0 to 1.0).
	     * @param  {Number} len  Time in milliseconds to fade.
	     * @param  {Number} id   The sound id (omit to fade all sounds).
	     * @return {Howl}
	     */
	    fade: function(from, to, len, id) {
	      var self = this;

	      // If the sound hasn't loaded, add it to the load queue to fade when capable.
	      if (self._state !== 'loaded' || self._playLock) {
	        self._queue.push({
	          event: 'fade',
	          action: function() {
	            self.fade(from, to, len, id);
	          }
	        });

	        return self;
	      }

	      // Make sure the to/from/len values are numbers.
	      from = Math.min(Math.max(0, parseFloat(from)), 1);
	      to = Math.min(Math.max(0, parseFloat(to)), 1);
	      len = parseFloat(len);

	      // Set the volume to the start position.
	      self.volume(from, id);

	      // Fade the volume of one or all sounds.
	      var ids = self._getSoundIds(id);
	      for (var i=0; i<ids.length; i++) {
	        // Get the sound.
	        var sound = self._soundById(ids[i]);

	        // Create a linear fade or fall back to timeouts with HTML5 Audio.
	        if (sound) {
	          // Stop the previous fade if no sprite is being used (otherwise, volume handles this).
	          if (!id) {
	            self._stopFade(ids[i]);
	          }

	          // If we are using Web Audio, let the native methods do the actual fade.
	          if (self._webAudio && !sound._muted) {
	            var currentTime = Howler.ctx.currentTime;
	            var end = currentTime + (len / 1000);
	            sound._volume = from;
	            sound._node.gain.setValueAtTime(from, currentTime);
	            sound._node.gain.linearRampToValueAtTime(to, end);
	          }

	          self._startFadeInterval(sound, from, to, len, ids[i], typeof id === 'undefined');
	        }
	      }

	      return self;
	    },

	    /**
	     * Starts the internal interval to fade a sound.
	     * @param  {Object} sound Reference to sound to fade.
	     * @param  {Number} from The value to fade from (0.0 to 1.0).
	     * @param  {Number} to   The volume to fade to (0.0 to 1.0).
	     * @param  {Number} len  Time in milliseconds to fade.
	     * @param  {Number} id   The sound id to fade.
	     * @param  {Boolean} isGroup   If true, set the volume on the group.
	     */
	    _startFadeInterval: function(sound, from, to, len, id, isGroup) {
	      var self = this;
	      var vol = from;
	      var diff = to - from;
	      var steps = Math.abs(diff / 0.01);
	      var stepLen = Math.max(4, (steps > 0) ? len / steps : len);
	      var lastTick = Date.now();

	      // Store the value being faded to.
	      sound._fadeTo = to;

	      // Update the volume value on each interval tick.
	      sound._interval = setInterval(function() {
	        // Update the volume based on the time since the last tick.
	        var tick = (Date.now() - lastTick) / len;
	        lastTick = Date.now();
	        vol += diff * tick;

	        // Round to within 2 decimal points.
	        vol = Math.round(vol * 100) / 100;

	        // Make sure the volume is in the right bounds.
	        if (diff < 0) {
	          vol = Math.max(to, vol);
	        } else {
	          vol = Math.min(to, vol);
	        }

	        // Change the volume.
	        if (self._webAudio) {
	          sound._volume = vol;
	        } else {
	          self.volume(vol, sound._id, true);
	        }

	        // Set the group's volume.
	        if (isGroup) {
	          self._volume = vol;
	        }

	        // When the fade is complete, stop it and fire event.
	        if ((to < from && vol <= to) || (to > from && vol >= to)) {
	          clearInterval(sound._interval);
	          sound._interval = null;
	          sound._fadeTo = null;
	          self.volume(to, sound._id);
	          self._emit('fade', sound._id);
	        }
	      }, stepLen);
	    },

	    /**
	     * Internal method that stops the currently playing fade when
	     * a new fade starts, volume is changed or the sound is stopped.
	     * @param  {Number} id The sound id.
	     * @return {Howl}
	     */
	    _stopFade: function(id) {
	      var self = this;
	      var sound = self._soundById(id);

	      if (sound && sound._interval) {
	        if (self._webAudio) {
	          sound._node.gain.cancelScheduledValues(Howler.ctx.currentTime);
	        }

	        clearInterval(sound._interval);
	        sound._interval = null;
	        self.volume(sound._fadeTo, id);
	        sound._fadeTo = null;
	        self._emit('fade', id);
	      }

	      return self;
	    },

	    /**
	     * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
	     *   loop() -> Returns the group's loop value.
	     *   loop(id) -> Returns the sound id's loop value.
	     *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
	     *   loop(loop, id) -> Sets the loop value of passed sound id.
	     * @return {Howl/Boolean} Returns self or current loop value.
	     */
	    loop: function() {
	      var self = this;
	      var args = arguments;
	      var loop, id, sound;

	      // Determine the values for loop and id.
	      if (args.length === 0) {
	        // Return the grou's loop value.
	        return self._loop;
	      } else if (args.length === 1) {
	        if (typeof args[0] === 'boolean') {
	          loop = args[0];
	          self._loop = loop;
	        } else {
	          // Return this sound's loop value.
	          sound = self._soundById(parseInt(args[0], 10));
	          return sound ? sound._loop : false;
	        }
	      } else if (args.length === 2) {
	        loop = args[0];
	        id = parseInt(args[1], 10);
	      }

	      // If no id is passed, get all ID's to be looped.
	      var ids = self._getSoundIds(id);
	      for (var i=0; i<ids.length; i++) {
	        sound = self._soundById(ids[i]);

	        if (sound) {
	          sound._loop = loop;
	          if (self._webAudio && sound._node && sound._node.bufferSource) {
	            sound._node.bufferSource.loop = loop;
	            if (loop) {
	              sound._node.bufferSource.loopStart = sound._start || 0;
	              sound._node.bufferSource.loopEnd = sound._stop;

	              // If playing, restart playback to ensure looping updates.
	              if (self.playing(ids[i])) {
	                self.pause(ids[i], true);
	                self.play(ids[i], true);
	              }
	            }
	          }
	        }
	      }

	      return self;
	    },

	    /**
	     * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
	     *   rate() -> Returns the first sound node's current playback rate.
	     *   rate(id) -> Returns the sound id's current playback rate.
	     *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
	     *   rate(rate, id) -> Sets the playback rate of passed sound id.
	     * @return {Howl/Number} Returns self or the current playback rate.
	     */
	    rate: function() {
	      var self = this;
	      var args = arguments;
	      var rate, id;

	      // Determine the values based on arguments.
	      if (args.length === 0) {
	        // We will simply return the current rate of the first node.
	        id = self._sounds[0]._id;
	      } else if (args.length === 1) {
	        // First check if this is an ID, and if not, assume it is a new rate value.
	        var ids = self._getSoundIds();
	        var index = ids.indexOf(args[0]);
	        if (index >= 0) {
	          id = parseInt(args[0], 10);
	        } else {
	          rate = parseFloat(args[0]);
	        }
	      } else if (args.length === 2) {
	        rate = parseFloat(args[0]);
	        id = parseInt(args[1], 10);
	      }

	      // Update the playback rate or return the current value.
	      var sound;
	      if (typeof rate === 'number') {
	        // If the sound hasn't loaded, add it to the load queue to change playback rate when capable.
	        if (self._state !== 'loaded' || self._playLock) {
	          self._queue.push({
	            event: 'rate',
	            action: function() {
	              self.rate.apply(self, args);
	            }
	          });

	          return self;
	        }

	        // Set the group rate.
	        if (typeof id === 'undefined') {
	          self._rate = rate;
	        }

	        // Update one or all volumes.
	        id = self._getSoundIds(id);
	        for (var i=0; i<id.length; i++) {
	          // Get the sound.
	          sound = self._soundById(id[i]);

	          if (sound) {
	            // Keep track of our position when the rate changed and update the playback
	            // start position so we can properly adjust the seek position for time elapsed.
	            if (self.playing(id[i])) {
	              sound._rateSeek = self.seek(id[i]);
	              sound._playStart = self._webAudio ? Howler.ctx.currentTime : sound._playStart;
	            }
	            sound._rate = rate;

	            // Change the playback rate.
	            if (self._webAudio && sound._node && sound._node.bufferSource) {
	              sound._node.bufferSource.playbackRate.setValueAtTime(rate, Howler.ctx.currentTime);
	            } else if (sound._node) {
	              sound._node.playbackRate = rate;
	            }

	            // Reset the timers.
	            var seek = self.seek(id[i]);
	            var duration = ((self._sprite[sound._sprite][0] + self._sprite[sound._sprite][1]) / 1000) - seek;
	            var timeout = (duration * 1000) / Math.abs(sound._rate);

	            // Start a new end timer if sound is already playing.
	            if (self._endTimers[id[i]] || !sound._paused) {
	              self._clearTimer(id[i]);
	              self._endTimers[id[i]] = setTimeout(self._ended.bind(self, sound), timeout);
	            }

	            self._emit('rate', sound._id);
	          }
	        }
	      } else {
	        sound = self._soundById(id);
	        return sound ? sound._rate : self._rate;
	      }

	      return self;
	    },

	    /**
	     * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
	     *   seek() -> Returns the first sound node's current seek position.
	     *   seek(id) -> Returns the sound id's current seek position.
	     *   seek(seek) -> Sets the seek position of the first sound node.
	     *   seek(seek, id) -> Sets the seek position of passed sound id.
	     * @return {Howl/Number} Returns self or the current seek position.
	     */
	    seek: function() {
	      var self = this;
	      var args = arguments;
	      var seek, id;

	      // Determine the values based on arguments.
	      if (args.length === 0) {
	        // We will simply return the current position of the first node.
	        if (self._sounds.length) {
	          id = self._sounds[0]._id;
	        }
	      } else if (args.length === 1) {
	        // First check if this is an ID, and if not, assume it is a new seek position.
	        var ids = self._getSoundIds();
	        var index = ids.indexOf(args[0]);
	        if (index >= 0) {
	          id = parseInt(args[0], 10);
	        } else if (self._sounds.length) {
	          id = self._sounds[0]._id;
	          seek = parseFloat(args[0]);
	        }
	      } else if (args.length === 2) {
	        seek = parseFloat(args[0]);
	        id = parseInt(args[1], 10);
	      }

	      // If there is no ID, bail out.
	      if (typeof id === 'undefined') {
	        return 0;
	      }

	      // If the sound hasn't loaded, add it to the load queue to seek when capable.
	      if (typeof seek === 'number' && (self._state !== 'loaded' || self._playLock)) {
	        self._queue.push({
	          event: 'seek',
	          action: function() {
	            self.seek.apply(self, args);
	          }
	        });

	        return self;
	      }

	      // Get the sound.
	      var sound = self._soundById(id);

	      if (sound) {
	        if (typeof seek === 'number' && seek >= 0) {
	          // Pause the sound and update position for restarting playback.
	          var playing = self.playing(id);
	          if (playing) {
	            self.pause(id, true);
	          }

	          // Move the position of the track and cancel timer.
	          sound._seek = seek;
	          sound._ended = false;
	          self._clearTimer(id);

	          // Update the seek position for HTML5 Audio.
	          if (!self._webAudio && sound._node && !isNaN(sound._node.duration)) {
	            sound._node.currentTime = seek;
	          }

	          // Seek and emit when ready.
	          var seekAndEmit = function() {
	            // Restart the playback if the sound was playing.
	            if (playing) {
	              self.play(id, true);
	            }

	            self._emit('seek', id);
	          };

	          // Wait for the play lock to be unset before emitting (HTML5 Audio).
	          if (playing && !self._webAudio) {
	            var emitSeek = function() {
	              if (!self._playLock) {
	                seekAndEmit();
	              } else {
	                setTimeout(emitSeek, 0);
	              }
	            };
	            setTimeout(emitSeek, 0);
	          } else {
	            seekAndEmit();
	          }
	        } else {
	          if (self._webAudio) {
	            var realTime = self.playing(id) ? Howler.ctx.currentTime - sound._playStart : 0;
	            var rateSeek = sound._rateSeek ? sound._rateSeek - sound._seek : 0;
	            return sound._seek + (rateSeek + realTime * Math.abs(sound._rate));
	          } else {
	            return sound._node.currentTime;
	          }
	        }
	      }

	      return self;
	    },

	    /**
	     * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
	     * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
	     * @return {Boolean} True if playing and false if not.
	     */
	    playing: function(id) {
	      var self = this;

	      // Check the passed sound ID (if any).
	      if (typeof id === 'number') {
	        var sound = self._soundById(id);
	        return sound ? !sound._paused : false;
	      }

	      // Otherwise, loop through all sounds and check if any are playing.
	      for (var i=0; i<self._sounds.length; i++) {
	        if (!self._sounds[i]._paused) {
	          return true;
	        }
	      }

	      return false;
	    },

	    /**
	     * Get the duration of this sound. Passing a sound id will return the sprite duration.
	     * @param  {Number} id The sound id to check. If none is passed, return full source duration.
	     * @return {Number} Audio duration in seconds.
	     */
	    duration: function(id) {
	      var self = this;
	      var duration = self._duration;

	      // If we pass an ID, get the sound and return the sprite length.
	      var sound = self._soundById(id);
	      if (sound) {
	        duration = self._sprite[sound._sprite][1] / 1000;
	      }

	      return duration;
	    },

	    /**
	     * Returns the current loaded state of this Howl.
	     * @return {String} 'unloaded', 'loading', 'loaded'
	     */
	    state: function() {
	      return this._state;
	    },

	    /**
	     * Unload and destroy the current Howl object.
	     * This will immediately stop all sound instances attached to this group.
	     */
	    unload: function() {
	      var self = this;

	      // Stop playing any active sounds.
	      var sounds = self._sounds;
	      for (var i=0; i<sounds.length; i++) {
	        // Stop the sound if it is currently playing.
	        if (!sounds[i]._paused) {
	          self.stop(sounds[i]._id);
	        }

	        // Remove the source or disconnect.
	        if (!self._webAudio) {
	          // Set the source to 0-second silence to stop any downloading (except in IE).
	          self._clearSound(sounds[i]._node);

	          // Remove any event listeners.
	          sounds[i]._node.removeEventListener('error', sounds[i]._errorFn, false);
	          sounds[i]._node.removeEventListener(Howler._canPlayEvent, sounds[i]._loadFn, false);
	          sounds[i]._node.removeEventListener('ended', sounds[i]._endFn, false);

	          // Release the Audio object back to the pool.
	          Howler._releaseHtml5Audio(sounds[i]._node);
	        }

	        // Empty out all of the nodes.
	        delete sounds[i]._node;

	        // Make sure all timers are cleared out.
	        self._clearTimer(sounds[i]._id);
	      }

	      // Remove the references in the global Howler object.
	      var index = Howler._howls.indexOf(self);
	      if (index >= 0) {
	        Howler._howls.splice(index, 1);
	      }

	      // Delete this sound from the cache (if no other Howl is using it).
	      var remCache = true;
	      for (i=0; i<Howler._howls.length; i++) {
	        if (Howler._howls[i]._src === self._src || self._src.indexOf(Howler._howls[i]._src) >= 0) {
	          remCache = false;
	          break;
	        }
	      }

	      if (cache && remCache) {
	        delete cache[self._src];
	      }

	      // Clear global errors.
	      Howler.noAudio = false;

	      // Clear out `self`.
	      self._state = 'unloaded';
	      self._sounds = [];
	      self = null;

	      return null;
	    },

	    /**
	     * Listen to a custom event.
	     * @param  {String}   event Event name.
	     * @param  {Function} fn    Listener to call.
	     * @param  {Number}   id    (optional) Only listen to events for this sound.
	     * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
	     * @return {Howl}
	     */
	    on: function(event, fn, id, once) {
	      var self = this;
	      var events = self['_on' + event];

	      if (typeof fn === 'function') {
	        events.push(once ? {id: id, fn: fn, once: once} : {id: id, fn: fn});
	      }

	      return self;
	    },

	    /**
	     * Remove a custom event. Call without parameters to remove all events.
	     * @param  {String}   event Event name.
	     * @param  {Function} fn    Listener to remove. Leave empty to remove all.
	     * @param  {Number}   id    (optional) Only remove events for this sound.
	     * @return {Howl}
	     */
	    off: function(event, fn, id) {
	      var self = this;
	      var events = self['_on' + event];
	      var i = 0;

	      // Allow passing just an event and ID.
	      if (typeof fn === 'number') {
	        id = fn;
	        fn = null;
	      }

	      if (fn || id) {
	        // Loop through event store and remove the passed function.
	        for (i=0; i<events.length; i++) {
	          var isId = (id === events[i].id);
	          if (fn === events[i].fn && isId || !fn && isId) {
	            events.splice(i, 1);
	            break;
	          }
	        }
	      } else if (event) {
	        // Clear out all events of this type.
	        self['_on' + event] = [];
	      } else {
	        // Clear out all events of every type.
	        var keys = Object.keys(self);
	        for (i=0; i<keys.length; i++) {
	          if ((keys[i].indexOf('_on') === 0) && Array.isArray(self[keys[i]])) {
	            self[keys[i]] = [];
	          }
	        }
	      }

	      return self;
	    },

	    /**
	     * Listen to a custom event and remove it once fired.
	     * @param  {String}   event Event name.
	     * @param  {Function} fn    Listener to call.
	     * @param  {Number}   id    (optional) Only listen to events for this sound.
	     * @return {Howl}
	     */
	    once: function(event, fn, id) {
	      var self = this;

	      // Setup the event listener.
	      self.on(event, fn, id, 1);

	      return self;
	    },

	    /**
	     * Emit all events of a specific type and pass the sound id.
	     * @param  {String} event Event name.
	     * @param  {Number} id    Sound ID.
	     * @param  {Number} msg   Message to go with event.
	     * @return {Howl}
	     */
	    _emit: function(event, id, msg) {
	      var self = this;
	      var events = self['_on' + event];

	      // Loop through event store and fire all functions.
	      for (var i=events.length-1; i>=0; i--) {
	        // Only fire the listener if the correct ID is used.
	        if (!events[i].id || events[i].id === id || event === 'load') {
	          setTimeout(function(fn) {
	            fn.call(this, id, msg);
	          }.bind(self, events[i].fn), 0);

	          // If this event was setup with `once`, remove it.
	          if (events[i].once) {
	            self.off(event, events[i].fn, events[i].id);
	          }
	        }
	      }

	      // Pass the event type into load queue so that it can continue stepping.
	      self._loadQueue(event);

	      return self;
	    },

	    /**
	     * Queue of actions initiated before the sound has loaded.
	     * These will be called in sequence, with the next only firing
	     * after the previous has finished executing (even if async like play).
	     * @return {Howl}
	     */
	    _loadQueue: function(event) {
	      var self = this;

	      if (self._queue.length > 0) {
	        var task = self._queue[0];

	        // Remove this task if a matching event was passed.
	        if (task.event === event) {
	          self._queue.shift();
	          self._loadQueue();
	        }

	        // Run the task if no event type is passed.
	        if (!event) {
	          task.action();
	        }
	      }

	      return self;
	    },

	    /**
	     * Fired when playback ends at the end of the duration.
	     * @param  {Sound} sound The sound object to work with.
	     * @return {Howl}
	     */
	    _ended: function(sound) {
	      var self = this;
	      var sprite = sound._sprite;

	      // If we are using IE and there was network latency we may be clipping
	      // audio before it completes playing. Lets check the node to make sure it
	      // believes it has completed, before ending the playback.
	      if (!self._webAudio && sound._node && !sound._node.paused && !sound._node.ended && sound._node.currentTime < sound._stop) {
	        setTimeout(self._ended.bind(self, sound), 100);
	        return self;
	      }

	      // Should this sound loop?
	      var loop = !!(sound._loop || self._sprite[sprite][2]);

	      // Fire the ended event.
	      self._emit('end', sound._id);

	      // Restart the playback for HTML5 Audio loop.
	      if (!self._webAudio && loop) {
	        self.stop(sound._id, true).play(sound._id);
	      }

	      // Restart this timer if on a Web Audio loop.
	      if (self._webAudio && loop) {
	        self._emit('play', sound._id);
	        sound._seek = sound._start || 0;
	        sound._rateSeek = 0;
	        sound._playStart = Howler.ctx.currentTime;

	        var timeout = ((sound._stop - sound._start) * 1000) / Math.abs(sound._rate);
	        self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
	      }

	      // Mark the node as paused.
	      if (self._webAudio && !loop) {
	        sound._paused = true;
	        sound._ended = true;
	        sound._seek = sound._start || 0;
	        sound._rateSeek = 0;
	        self._clearTimer(sound._id);

	        // Clean up the buffer source.
	        self._cleanBuffer(sound._node);

	        // Attempt to auto-suspend AudioContext if no sounds are still playing.
	        Howler._autoSuspend();
	      }

	      // When using a sprite, end the track.
	      if (!self._webAudio && !loop) {
	        self.stop(sound._id, true);
	      }

	      return self;
	    },

	    /**
	     * Clear the end timer for a sound playback.
	     * @param  {Number} id The sound ID.
	     * @return {Howl}
	     */
	    _clearTimer: function(id) {
	      var self = this;

	      if (self._endTimers[id]) {
	        // Clear the timeout or remove the ended listener.
	        if (typeof self._endTimers[id] !== 'function') {
	          clearTimeout(self._endTimers[id]);
	        } else {
	          var sound = self._soundById(id);
	          if (sound && sound._node) {
	            sound._node.removeEventListener('ended', self._endTimers[id], false);
	          }
	        }

	        delete self._endTimers[id];
	      }

	      return self;
	    },

	    /**
	     * Return the sound identified by this ID, or return null.
	     * @param  {Number} id Sound ID
	     * @return {Object}    Sound object or null.
	     */
	    _soundById: function(id) {
	      var self = this;

	      // Loop through all sounds and find the one with this ID.
	      for (var i=0; i<self._sounds.length; i++) {
	        if (id === self._sounds[i]._id) {
	          return self._sounds[i];
	        }
	      }

	      return null;
	    },

	    /**
	     * Return an inactive sound from the pool or create a new one.
	     * @return {Sound} Sound playback object.
	     */
	    _inactiveSound: function() {
	      var self = this;

	      self._drain();

	      // Find the first inactive node to recycle.
	      for (var i=0; i<self._sounds.length; i++) {
	        if (self._sounds[i]._ended) {
	          return self._sounds[i].reset();
	        }
	      }

	      // If no inactive node was found, create a new one.
	      return new Sound(self);
	    },

	    /**
	     * Drain excess inactive sounds from the pool.
	     */
	    _drain: function() {
	      var self = this;
	      var limit = self._pool;
	      var cnt = 0;
	      var i = 0;

	      // If there are less sounds than the max pool size, we are done.
	      if (self._sounds.length < limit) {
	        return;
	      }

	      // Count the number of inactive sounds.
	      for (i=0; i<self._sounds.length; i++) {
	        if (self._sounds[i]._ended) {
	          cnt++;
	        }
	      }

	      // Remove excess inactive sounds, going in reverse order.
	      for (i=self._sounds.length - 1; i>=0; i--) {
	        if (cnt <= limit) {
	          return;
	        }

	        if (self._sounds[i]._ended) {
	          // Disconnect the audio source when using Web Audio.
	          if (self._webAudio && self._sounds[i]._node) {
	            self._sounds[i]._node.disconnect(0);
	          }

	          // Remove sounds until we have the pool size.
	          self._sounds.splice(i, 1);
	          cnt--;
	        }
	      }
	    },

	    /**
	     * Get all ID's from the sounds pool.
	     * @param  {Number} id Only return one ID if one is passed.
	     * @return {Array}    Array of IDs.
	     */
	    _getSoundIds: function(id) {
	      var self = this;

	      if (typeof id === 'undefined') {
	        var ids = [];
	        for (var i=0; i<self._sounds.length; i++) {
	          ids.push(self._sounds[i]._id);
	        }

	        return ids;
	      } else {
	        return [id];
	      }
	    },

	    /**
	     * Load the sound back into the buffer source.
	     * @param  {Sound} sound The sound object to work with.
	     * @return {Howl}
	     */
	    _refreshBuffer: function(sound) {
	      var self = this;

	      // Setup the buffer source for playback.
	      sound._node.bufferSource = Howler.ctx.createBufferSource();
	      sound._node.bufferSource.buffer = cache[self._src];

	      // Connect to the correct node.
	      if (sound._panner) {
	        sound._node.bufferSource.connect(sound._panner);
	      } else {
	        sound._node.bufferSource.connect(sound._node);
	      }

	      // Setup looping and playback rate.
	      sound._node.bufferSource.loop = sound._loop;
	      if (sound._loop) {
	        sound._node.bufferSource.loopStart = sound._start || 0;
	        sound._node.bufferSource.loopEnd = sound._stop || 0;
	      }
	      sound._node.bufferSource.playbackRate.setValueAtTime(sound._rate, Howler.ctx.currentTime);

	      return self;
	    },

	    /**
	     * Prevent memory leaks by cleaning up the buffer source after playback.
	     * @param  {Object} node Sound's audio node containing the buffer source.
	     * @return {Howl}
	     */
	    _cleanBuffer: function(node) {
	      var self = this;
	      var isIOS = Howler._navigator && Howler._navigator.vendor.indexOf('Apple') >= 0;

	      if (Howler._scratchBuffer && node.bufferSource) {
	        node.bufferSource.onended = null;
	        node.bufferSource.disconnect(0);
	        if (isIOS) {
	          try { node.bufferSource.buffer = Howler._scratchBuffer; } catch(e) {}
	        }
	      }
	      node.bufferSource = null;

	      return self;
	    },

	    /**
	     * Set the source to a 0-second silence to stop any downloading (except in IE).
	     * @param  {Object} node Audio node to clear.
	     */
	    _clearSound: function(node) {
	      var checkIE = /MSIE |Trident\//.test(Howler._navigator && Howler._navigator.userAgent);
	      if (!checkIE) {
	        node.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
	      }
	    }
	  };

	  /** Single Sound Methods **/
	  /***************************************************************************/

	  /**
	   * Setup the sound object, which each node attached to a Howl group is contained in.
	   * @param {Object} howl The Howl parent group.
	   */
	  var Sound = function(howl) {
	    this._parent = howl;
	    this.init();
	  };
	  Sound.prototype = {
	    /**
	     * Initialize a new Sound object.
	     * @return {Sound}
	     */
	    init: function() {
	      var self = this;
	      var parent = self._parent;

	      // Setup the default parameters.
	      self._muted = parent._muted;
	      self._loop = parent._loop;
	      self._volume = parent._volume;
	      self._rate = parent._rate;
	      self._seek = 0;
	      self._paused = true;
	      self._ended = true;
	      self._sprite = '__default';

	      // Generate a unique ID for this sound.
	      self._id = ++Howler._counter;

	      // Add itself to the parent's pool.
	      parent._sounds.push(self);

	      // Create the new node.
	      self.create();

	      return self;
	    },

	    /**
	     * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
	     * @return {Sound}
	     */
	    create: function() {
	      var self = this;
	      var parent = self._parent;
	      var volume = (Howler._muted || self._muted || self._parent._muted) ? 0 : self._volume;

	      if (parent._webAudio) {
	        // Create the gain node for controlling volume (the source will connect to this).
	        self._node = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
	        self._node.gain.setValueAtTime(volume, Howler.ctx.currentTime);
	        self._node.paused = true;
	        self._node.connect(Howler.masterGain);
	      } else if (!Howler.noAudio) {
	        // Get an unlocked Audio object from the pool.
	        self._node = Howler._obtainHtml5Audio();

	        // Listen for errors (http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror).
	        self._errorFn = self._errorListener.bind(self);
	        self._node.addEventListener('error', self._errorFn, false);

	        // Listen for 'canplaythrough' event to let us know the sound is ready.
	        self._loadFn = self._loadListener.bind(self);
	        self._node.addEventListener(Howler._canPlayEvent, self._loadFn, false);

	        // Listen for the 'ended' event on the sound to account for edge-case where
	        // a finite sound has a duration of Infinity.
	        self._endFn = self._endListener.bind(self);
	        self._node.addEventListener('ended', self._endFn, false);

	        // Setup the new audio node.
	        self._node.src = parent._src;
	        self._node.preload = parent._preload === true ? 'auto' : parent._preload;
	        self._node.volume = volume * Howler.volume();

	        // Begin loading the source.
	        self._node.load();
	      }

	      return self;
	    },

	    /**
	     * Reset the parameters of this sound to the original state (for recycle).
	     * @return {Sound}
	     */
	    reset: function() {
	      var self = this;
	      var parent = self._parent;

	      // Reset all of the parameters of this sound.
	      self._muted = parent._muted;
	      self._loop = parent._loop;
	      self._volume = parent._volume;
	      self._rate = parent._rate;
	      self._seek = 0;
	      self._rateSeek = 0;
	      self._paused = true;
	      self._ended = true;
	      self._sprite = '__default';

	      // Generate a new ID so that it isn't confused with the previous sound.
	      self._id = ++Howler._counter;

	      return self;
	    },

	    /**
	     * HTML5 Audio error listener callback.
	     */
	    _errorListener: function() {
	      var self = this;

	      // Fire an error event and pass back the code.
	      self._parent._emit('loaderror', self._id, self._node.error ? self._node.error.code : 0);

	      // Clear the event listener.
	      self._node.removeEventListener('error', self._errorFn, false);
	    },

	    /**
	     * HTML5 Audio canplaythrough listener callback.
	     */
	    _loadListener: function() {
	      var self = this;
	      var parent = self._parent;

	      // Round up the duration to account for the lower precision in HTML5 Audio.
	      parent._duration = Math.ceil(self._node.duration * 10) / 10;

	      // Setup a sprite if none is defined.
	      if (Object.keys(parent._sprite).length === 0) {
	        parent._sprite = {__default: [0, parent._duration * 1000]};
	      }

	      if (parent._state !== 'loaded') {
	        parent._state = 'loaded';
	        parent._emit('load');
	        parent._loadQueue();
	      }

	      // Clear the event listener.
	      self._node.removeEventListener(Howler._canPlayEvent, self._loadFn, false);
	    },

	    /**
	     * HTML5 Audio ended listener callback.
	     */
	    _endListener: function() {
	      var self = this;
	      var parent = self._parent;

	      // Only handle the `ended`` event if the duration is Infinity.
	      if (parent._duration === Infinity) {
	        // Update the parent duration to match the real audio duration.
	        // Round up the duration to account for the lower precision in HTML5 Audio.
	        parent._duration = Math.ceil(self._node.duration * 10) / 10;

	        // Update the sprite that corresponds to the real duration.
	        if (parent._sprite.__default[1] === Infinity) {
	          parent._sprite.__default[1] = parent._duration * 1000;
	        }

	        // Run the regular ended method.
	        parent._ended(self);
	      }

	      // Clear the event listener since the duration is now correct.
	      self._node.removeEventListener('ended', self._endFn, false);
	    }
	  };

	  /** Helper Methods **/
	  /***************************************************************************/

	  var cache = {};

	  /**
	   * Buffer a sound from URL, Data URI or cache and decode to audio source (Web Audio API).
	   * @param  {Howl} self
	   */
	  var loadBuffer = function(self) {
	    var url = self._src;

	    // Check if the buffer has already been cached and use it instead.
	    if (cache[url]) {
	      // Set the duration from the cache.
	      self._duration = cache[url].duration;

	      // Load the sound into this Howl.
	      loadSound(self);

	      return;
	    }

	    if (/^data:[^;]+;base64,/.test(url)) {
	      // Decode the base64 data URI without XHR, since some browsers don't support it.
	      var data = atob(url.split(',')[1]);
	      var dataView = new Uint8Array(data.length);
	      for (var i=0; i<data.length; ++i) {
	        dataView[i] = data.charCodeAt(i);
	      }

	      decodeAudioData(dataView.buffer, self);
	    } else {
	      // Load the buffer from the URL.
	      var xhr = new XMLHttpRequest();
	      xhr.open(self._xhr.method, url, true);
	      xhr.withCredentials = self._xhr.withCredentials;
	      xhr.responseType = 'arraybuffer';

	      // Apply any custom headers to the request.
	      if (self._xhr.headers) {
	        Object.keys(self._xhr.headers).forEach(function(key) {
	          xhr.setRequestHeader(key, self._xhr.headers[key]);
	        });
	      }

	      xhr.onload = function() {
	        // Make sure we get a successful response back.
	        var code = (xhr.status + '')[0];
	        if (code !== '0' && code !== '2' && code !== '3') {
	          self._emit('loaderror', null, 'Failed loading audio file with status: ' + xhr.status + '.');
	          return;
	        }

	        decodeAudioData(xhr.response, self);
	      };
	      xhr.onerror = function() {
	        // If there is an error, switch to HTML5 Audio.
	        if (self._webAudio) {
	          self._html5 = true;
	          self._webAudio = false;
	          self._sounds = [];
	          delete cache[url];
	          self.load();
	        }
	      };
	      safeXhrSend(xhr);
	    }
	  };

	  /**
	   * Send the XHR request wrapped in a try/catch.
	   * @param  {Object} xhr XHR to send.
	   */
	  var safeXhrSend = function(xhr) {
	    try {
	      xhr.send();
	    } catch (e) {
	      xhr.onerror();
	    }
	  };

	  /**
	   * Decode audio data from an array buffer.
	   * @param  {ArrayBuffer} arraybuffer The audio data.
	   * @param  {Howl}        self
	   */
	  var decodeAudioData = function(arraybuffer, self) {
	    // Fire a load error if something broke.
	    var error = function() {
	      self._emit('loaderror', null, 'Decoding audio data failed.');
	    };

	    // Load the sound on success.
	    var success = function(buffer) {
	      if (buffer && self._sounds.length > 0) {
	        cache[self._src] = buffer;
	        loadSound(self, buffer);
	      } else {
	        error();
	      }
	    };

	    // Decode the buffer into an audio source.
	    if (typeof Promise !== 'undefined' && Howler.ctx.decodeAudioData.length === 1) {
	      Howler.ctx.decodeAudioData(arraybuffer).then(success).catch(error);
	    } else {
	      Howler.ctx.decodeAudioData(arraybuffer, success, error);
	    }
	  };

	  /**
	   * Sound is now loaded, so finish setting everything up and fire the loaded event.
	   * @param  {Howl} self
	   * @param  {Object} buffer The decoded buffer sound source.
	   */
	  var loadSound = function(self, buffer) {
	    // Set the duration.
	    if (buffer && !self._duration) {
	      self._duration = buffer.duration;
	    }

	    // Setup a sprite if none is defined.
	    if (Object.keys(self._sprite).length === 0) {
	      self._sprite = {__default: [0, self._duration * 1000]};
	    }

	    // Fire the loaded event.
	    if (self._state !== 'loaded') {
	      self._state = 'loaded';
	      self._emit('load');
	      self._loadQueue();
	    }
	  };

	  /**
	   * Setup the audio context when available, or switch to HTML5 Audio mode.
	   */
	  var setupAudioContext = function() {
	    // If we have already detected that Web Audio isn't supported, don't run this step again.
	    if (!Howler.usingWebAudio) {
	      return;
	    }

	    // Check if we are using Web Audio and setup the AudioContext if we are.
	    try {
	      if (typeof AudioContext !== 'undefined') {
	        Howler.ctx = new AudioContext();
	      } else if (typeof webkitAudioContext !== 'undefined') {
	        Howler.ctx = new webkitAudioContext();
	      } else {
	        Howler.usingWebAudio = false;
	      }
	    } catch(e) {
	      Howler.usingWebAudio = false;
	    }

	    // If the audio context creation still failed, set using web audio to false.
	    if (!Howler.ctx) {
	      Howler.usingWebAudio = false;
	    }

	    // Check if a webview is being used on iOS8 or earlier (rather than the browser).
	    // If it is, disable Web Audio as it causes crashing.
	    var iOS = (/iP(hone|od|ad)/.test(Howler._navigator && Howler._navigator.platform));
	    var appVersion = Howler._navigator && Howler._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
	    var version = appVersion ? parseInt(appVersion[1], 10) : null;
	    if (iOS && version && version < 9) {
	      var safari = /safari/.test(Howler._navigator && Howler._navigator.userAgent.toLowerCase());
	      if (Howler._navigator && !safari) {
	        Howler.usingWebAudio = false;
	      }
	    }

	    // Create and expose the master GainNode when using Web Audio (useful for plugins or advanced usage).
	    if (Howler.usingWebAudio) {
	      Howler.masterGain = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
	      Howler.masterGain.gain.setValueAtTime(Howler._muted ? 0 : Howler._volume, Howler.ctx.currentTime);
	      Howler.masterGain.connect(Howler.ctx.destination);
	    }

	    // Re-run the setup on Howler.
	    Howler._setup();
	  };

	  // Add support for CommonJS libraries such as browserify.
	  {
	    exports.Howler = Howler;
	    exports.Howl = Howl;
	  }

	  // Add to global in Node.js (for testing, etc).
	  if (typeof commonjsGlobal !== 'undefined') {
	    commonjsGlobal.HowlerGlobal = HowlerGlobal;
	    commonjsGlobal.Howler = Howler;
	    commonjsGlobal.Howl = Howl;
	    commonjsGlobal.Sound = Sound;
	  } else if (typeof window !== 'undefined') {  // Define globally in case AMD is not available or unused.
	    window.HowlerGlobal = HowlerGlobal;
	    window.Howler = Howler;
	    window.Howl = Howl;
	    window.Sound = Sound;
	  }
	})();


	/*!
	 *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
	 *  
	 *  howler.js v2.2.3
	 *  howlerjs.com
	 *
	 *  (c) 2013-2020, James Simpson of GoldFire Studios
	 *  goldfirestudios.com
	 *
	 *  MIT License
	 */

	(function() {

	  // Setup default properties.
	  HowlerGlobal.prototype._pos = [0, 0, 0];
	  HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0];

	  /** Global Methods **/
	  /***************************************************************************/

	  /**
	   * Helper method to update the stereo panning position of all current Howls.
	   * Future Howls will not use this value unless explicitly set.
	   * @param  {Number} pan A value of -1.0 is all the way left and 1.0 is all the way right.
	   * @return {Howler/Number}     Self or current stereo panning value.
	   */
	  HowlerGlobal.prototype.stereo = function(pan) {
	    var self = this;

	    // Stop right here if not using Web Audio.
	    if (!self.ctx || !self.ctx.listener) {
	      return self;
	    }

	    // Loop through all Howls and update their stereo panning.
	    for (var i=self._howls.length-1; i>=0; i--) {
	      self._howls[i].stereo(pan);
	    }

	    return self;
	  };

	  /**
	   * Get/set the position of the listener in 3D cartesian space. Sounds using
	   * 3D position will be relative to the listener's position.
	   * @param  {Number} x The x-position of the listener.
	   * @param  {Number} y The y-position of the listener.
	   * @param  {Number} z The z-position of the listener.
	   * @return {Howler/Array}   Self or current listener position.
	   */
	  HowlerGlobal.prototype.pos = function(x, y, z) {
	    var self = this;

	    // Stop right here if not using Web Audio.
	    if (!self.ctx || !self.ctx.listener) {
	      return self;
	    }

	    // Set the defaults for optional 'y' & 'z'.
	    y = (typeof y !== 'number') ? self._pos[1] : y;
	    z = (typeof z !== 'number') ? self._pos[2] : z;

	    if (typeof x === 'number') {
	      self._pos = [x, y, z];

	      if (typeof self.ctx.listener.positionX !== 'undefined') {
	        self.ctx.listener.positionX.setTargetAtTime(self._pos[0], Howler.ctx.currentTime, 0.1);
	        self.ctx.listener.positionY.setTargetAtTime(self._pos[1], Howler.ctx.currentTime, 0.1);
	        self.ctx.listener.positionZ.setTargetAtTime(self._pos[2], Howler.ctx.currentTime, 0.1);
	      } else {
	        self.ctx.listener.setPosition(self._pos[0], self._pos[1], self._pos[2]);
	      }
	    } else {
	      return self._pos;
	    }

	    return self;
	  };

	  /**
	   * Get/set the direction the listener is pointing in the 3D cartesian space.
	   * A front and up vector must be provided. The front is the direction the
	   * face of the listener is pointing, and up is the direction the top of the
	   * listener is pointing. Thus, these values are expected to be at right angles
	   * from each other.
	   * @param  {Number} x   The x-orientation of the listener.
	   * @param  {Number} y   The y-orientation of the listener.
	   * @param  {Number} z   The z-orientation of the listener.
	   * @param  {Number} xUp The x-orientation of the top of the listener.
	   * @param  {Number} yUp The y-orientation of the top of the listener.
	   * @param  {Number} zUp The z-orientation of the top of the listener.
	   * @return {Howler/Array}     Returns self or the current orientation vectors.
	   */
	  HowlerGlobal.prototype.orientation = function(x, y, z, xUp, yUp, zUp) {
	    var self = this;

	    // Stop right here if not using Web Audio.
	    if (!self.ctx || !self.ctx.listener) {
	      return self;
	    }

	    // Set the defaults for optional 'y' & 'z'.
	    var or = self._orientation;
	    y = (typeof y !== 'number') ? or[1] : y;
	    z = (typeof z !== 'number') ? or[2] : z;
	    xUp = (typeof xUp !== 'number') ? or[3] : xUp;
	    yUp = (typeof yUp !== 'number') ? or[4] : yUp;
	    zUp = (typeof zUp !== 'number') ? or[5] : zUp;

	    if (typeof x === 'number') {
	      self._orientation = [x, y, z, xUp, yUp, zUp];

	      if (typeof self.ctx.listener.forwardX !== 'undefined') {
	        self.ctx.listener.forwardX.setTargetAtTime(x, Howler.ctx.currentTime, 0.1);
	        self.ctx.listener.forwardY.setTargetAtTime(y, Howler.ctx.currentTime, 0.1);
	        self.ctx.listener.forwardZ.setTargetAtTime(z, Howler.ctx.currentTime, 0.1);
	        self.ctx.listener.upX.setTargetAtTime(xUp, Howler.ctx.currentTime, 0.1);
	        self.ctx.listener.upY.setTargetAtTime(yUp, Howler.ctx.currentTime, 0.1);
	        self.ctx.listener.upZ.setTargetAtTime(zUp, Howler.ctx.currentTime, 0.1);
	      } else {
	        self.ctx.listener.setOrientation(x, y, z, xUp, yUp, zUp);
	      }
	    } else {
	      return or;
	    }

	    return self;
	  };

	  /** Group Methods **/
	  /***************************************************************************/

	  /**
	   * Add new properties to the core init.
	   * @param  {Function} _super Core init method.
	   * @return {Howl}
	   */
	  Howl.prototype.init = (function(_super) {
	    return function(o) {
	      var self = this;

	      // Setup user-defined default properties.
	      self._orientation = o.orientation || [1, 0, 0];
	      self._stereo = o.stereo || null;
	      self._pos = o.pos || null;
	      self._pannerAttr = {
	        coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : 360,
	        coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : 360,
	        coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : 0,
	        distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : 'inverse',
	        maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : 10000,
	        panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : 'HRTF',
	        refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : 1,
	        rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : 1
	      };

	      // Setup event listeners.
	      self._onstereo = o.onstereo ? [{fn: o.onstereo}] : [];
	      self._onpos = o.onpos ? [{fn: o.onpos}] : [];
	      self._onorientation = o.onorientation ? [{fn: o.onorientation}] : [];

	      // Complete initilization with howler.js core's init function.
	      return _super.call(this, o);
	    };
	  })(Howl.prototype.init);

	  /**
	   * Get/set the stereo panning of the audio source for this sound or all in the group.
	   * @param  {Number} pan  A value of -1.0 is all the way left and 1.0 is all the way right.
	   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
	   * @return {Howl/Number}    Returns self or the current stereo panning value.
	   */
	  Howl.prototype.stereo = function(pan, id) {
	    var self = this;

	    // Stop right here if not using Web Audio.
	    if (!self._webAudio) {
	      return self;
	    }

	    // If the sound hasn't loaded, add it to the load queue to change stereo pan when capable.
	    if (self._state !== 'loaded') {
	      self._queue.push({
	        event: 'stereo',
	        action: function() {
	          self.stereo(pan, id);
	        }
	      });

	      return self;
	    }

	    // Check for PannerStereoNode support and fallback to PannerNode if it doesn't exist.
	    var pannerType = (typeof Howler.ctx.createStereoPanner === 'undefined') ? 'spatial' : 'stereo';

	    // Setup the group's stereo panning if no ID is passed.
	    if (typeof id === 'undefined') {
	      // Return the group's stereo panning if no parameters are passed.
	      if (typeof pan === 'number') {
	        self._stereo = pan;
	        self._pos = [pan, 0, 0];
	      } else {
	        return self._stereo;
	      }
	    }

	    // Change the streo panning of one or all sounds in group.
	    var ids = self._getSoundIds(id);
	    for (var i=0; i<ids.length; i++) {
	      // Get the sound.
	      var sound = self._soundById(ids[i]);

	      if (sound) {
	        if (typeof pan === 'number') {
	          sound._stereo = pan;
	          sound._pos = [pan, 0, 0];

	          if (sound._node) {
	            // If we are falling back, make sure the panningModel is equalpower.
	            sound._pannerAttr.panningModel = 'equalpower';

	            // Check if there is a panner setup and create a new one if not.
	            if (!sound._panner || !sound._panner.pan) {
	              setupPanner(sound, pannerType);
	            }

	            if (pannerType === 'spatial') {
	              if (typeof sound._panner.positionX !== 'undefined') {
	                sound._panner.positionX.setValueAtTime(pan, Howler.ctx.currentTime);
	                sound._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime);
	                sound._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime);
	              } else {
	                sound._panner.setPosition(pan, 0, 0);
	              }
	            } else {
	              sound._panner.pan.setValueAtTime(pan, Howler.ctx.currentTime);
	            }
	          }

	          self._emit('stereo', sound._id);
	        } else {
	          return sound._stereo;
	        }
	      }
	    }

	    return self;
	  };

	  /**
	   * Get/set the 3D spatial position of the audio source for this sound or group relative to the global listener.
	   * @param  {Number} x  The x-position of the audio source.
	   * @param  {Number} y  The y-position of the audio source.
	   * @param  {Number} z  The z-position of the audio source.
	   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
	   * @return {Howl/Array}    Returns self or the current 3D spatial position: [x, y, z].
	   */
	  Howl.prototype.pos = function(x, y, z, id) {
	    var self = this;

	    // Stop right here if not using Web Audio.
	    if (!self._webAudio) {
	      return self;
	    }

	    // If the sound hasn't loaded, add it to the load queue to change position when capable.
	    if (self._state !== 'loaded') {
	      self._queue.push({
	        event: 'pos',
	        action: function() {
	          self.pos(x, y, z, id);
	        }
	      });

	      return self;
	    }

	    // Set the defaults for optional 'y' & 'z'.
	    y = (typeof y !== 'number') ? 0 : y;
	    z = (typeof z !== 'number') ? -0.5 : z;

	    // Setup the group's spatial position if no ID is passed.
	    if (typeof id === 'undefined') {
	      // Return the group's spatial position if no parameters are passed.
	      if (typeof x === 'number') {
	        self._pos = [x, y, z];
	      } else {
	        return self._pos;
	      }
	    }

	    // Change the spatial position of one or all sounds in group.
	    var ids = self._getSoundIds(id);
	    for (var i=0; i<ids.length; i++) {
	      // Get the sound.
	      var sound = self._soundById(ids[i]);

	      if (sound) {
	        if (typeof x === 'number') {
	          sound._pos = [x, y, z];

	          if (sound._node) {
	            // Check if there is a panner setup and create a new one if not.
	            if (!sound._panner || sound._panner.pan) {
	              setupPanner(sound, 'spatial');
	            }

	            if (typeof sound._panner.positionX !== 'undefined') {
	              sound._panner.positionX.setValueAtTime(x, Howler.ctx.currentTime);
	              sound._panner.positionY.setValueAtTime(y, Howler.ctx.currentTime);
	              sound._panner.positionZ.setValueAtTime(z, Howler.ctx.currentTime);
	            } else {
	              sound._panner.setPosition(x, y, z);
	            }
	          }

	          self._emit('pos', sound._id);
	        } else {
	          return sound._pos;
	        }
	      }
	    }

	    return self;
	  };

	  /**
	   * Get/set the direction the audio source is pointing in the 3D cartesian coordinate
	   * space. Depending on how direction the sound is, based on the `cone` attributes,
	   * a sound pointing away from the listener can be quiet or silent.
	   * @param  {Number} x  The x-orientation of the source.
	   * @param  {Number} y  The y-orientation of the source.
	   * @param  {Number} z  The z-orientation of the source.
	   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
	   * @return {Howl/Array}    Returns self or the current 3D spatial orientation: [x, y, z].
	   */
	  Howl.prototype.orientation = function(x, y, z, id) {
	    var self = this;

	    // Stop right here if not using Web Audio.
	    if (!self._webAudio) {
	      return self;
	    }

	    // If the sound hasn't loaded, add it to the load queue to change orientation when capable.
	    if (self._state !== 'loaded') {
	      self._queue.push({
	        event: 'orientation',
	        action: function() {
	          self.orientation(x, y, z, id);
	        }
	      });

	      return self;
	    }

	    // Set the defaults for optional 'y' & 'z'.
	    y = (typeof y !== 'number') ? self._orientation[1] : y;
	    z = (typeof z !== 'number') ? self._orientation[2] : z;

	    // Setup the group's spatial orientation if no ID is passed.
	    if (typeof id === 'undefined') {
	      // Return the group's spatial orientation if no parameters are passed.
	      if (typeof x === 'number') {
	        self._orientation = [x, y, z];
	      } else {
	        return self._orientation;
	      }
	    }

	    // Change the spatial orientation of one or all sounds in group.
	    var ids = self._getSoundIds(id);
	    for (var i=0; i<ids.length; i++) {
	      // Get the sound.
	      var sound = self._soundById(ids[i]);

	      if (sound) {
	        if (typeof x === 'number') {
	          sound._orientation = [x, y, z];

	          if (sound._node) {
	            // Check if there is a panner setup and create a new one if not.
	            if (!sound._panner) {
	              // Make sure we have a position to setup the node with.
	              if (!sound._pos) {
	                sound._pos = self._pos || [0, 0, -0.5];
	              }

	              setupPanner(sound, 'spatial');
	            }

	            if (typeof sound._panner.orientationX !== 'undefined') {
	              sound._panner.orientationX.setValueAtTime(x, Howler.ctx.currentTime);
	              sound._panner.orientationY.setValueAtTime(y, Howler.ctx.currentTime);
	              sound._panner.orientationZ.setValueAtTime(z, Howler.ctx.currentTime);
	            } else {
	              sound._panner.setOrientation(x, y, z);
	            }
	          }

	          self._emit('orientation', sound._id);
	        } else {
	          return sound._orientation;
	        }
	      }
	    }

	    return self;
	  };

	  /**
	   * Get/set the panner node's attributes for a sound or group of sounds.
	   * This method can optionall take 0, 1 or 2 arguments.
	   *   pannerAttr() -> Returns the group's values.
	   *   pannerAttr(id) -> Returns the sound id's values.
	   *   pannerAttr(o) -> Set's the values of all sounds in this Howl group.
	   *   pannerAttr(o, id) -> Set's the values of passed sound id.
	   *
	   *   Attributes:
	   *     coneInnerAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
	   *                      inside of which there will be no volume reduction.
	   *     coneOuterAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
	   *                      outside of which the volume will be reduced to a constant value of `coneOuterGain`.
	   *     coneOuterGain - (0 by default) A parameter for directional audio sources, this is the gain outside of the
	   *                     `coneOuterAngle`. It is a linear value in the range `[0, 1]`.
	   *     distanceModel - ('inverse' by default) Determines algorithm used to reduce volume as audio moves away from
	   *                     listener. Can be `linear`, `inverse` or `exponential.
	   *     maxDistance - (10000 by default) The maximum distance between source and listener, after which the volume
	   *                   will not be reduced any further.
	   *     refDistance - (1 by default) A reference distance for reducing volume as source moves further from the listener.
	   *                   This is simply a variable of the distance model and has a different effect depending on which model
	   *                   is used and the scale of your coordinates. Generally, volume will be equal to 1 at this distance.
	   *     rolloffFactor - (1 by default) How quickly the volume reduces as source moves from listener. This is simply a
	   *                     variable of the distance model and can be in the range of `[0, 1]` with `linear` and `[0, ∞]`
	   *                     with `inverse` and `exponential`.
	   *     panningModel - ('HRTF' by default) Determines which spatialization algorithm is used to position audio.
	   *                     Can be `HRTF` or `equalpower`.
	   *
	   * @return {Howl/Object} Returns self or current panner attributes.
	   */
	  Howl.prototype.pannerAttr = function() {
	    var self = this;
	    var args = arguments;
	    var o, id, sound;

	    // Stop right here if not using Web Audio.
	    if (!self._webAudio) {
	      return self;
	    }

	    // Determine the values based on arguments.
	    if (args.length === 0) {
	      // Return the group's panner attribute values.
	      return self._pannerAttr;
	    } else if (args.length === 1) {
	      if (typeof args[0] === 'object') {
	        o = args[0];

	        // Set the grou's panner attribute values.
	        if (typeof id === 'undefined') {
	          if (!o.pannerAttr) {
	            o.pannerAttr = {
	              coneInnerAngle: o.coneInnerAngle,
	              coneOuterAngle: o.coneOuterAngle,
	              coneOuterGain: o.coneOuterGain,
	              distanceModel: o.distanceModel,
	              maxDistance: o.maxDistance,
	              refDistance: o.refDistance,
	              rolloffFactor: o.rolloffFactor,
	              panningModel: o.panningModel
	            };
	          }

	          self._pannerAttr = {
	            coneInnerAngle: typeof o.pannerAttr.coneInnerAngle !== 'undefined' ? o.pannerAttr.coneInnerAngle : self._coneInnerAngle,
	            coneOuterAngle: typeof o.pannerAttr.coneOuterAngle !== 'undefined' ? o.pannerAttr.coneOuterAngle : self._coneOuterAngle,
	            coneOuterGain: typeof o.pannerAttr.coneOuterGain !== 'undefined' ? o.pannerAttr.coneOuterGain : self._coneOuterGain,
	            distanceModel: typeof o.pannerAttr.distanceModel !== 'undefined' ? o.pannerAttr.distanceModel : self._distanceModel,
	            maxDistance: typeof o.pannerAttr.maxDistance !== 'undefined' ? o.pannerAttr.maxDistance : self._maxDistance,
	            refDistance: typeof o.pannerAttr.refDistance !== 'undefined' ? o.pannerAttr.refDistance : self._refDistance,
	            rolloffFactor: typeof o.pannerAttr.rolloffFactor !== 'undefined' ? o.pannerAttr.rolloffFactor : self._rolloffFactor,
	            panningModel: typeof o.pannerAttr.panningModel !== 'undefined' ? o.pannerAttr.panningModel : self._panningModel
	          };
	        }
	      } else {
	        // Return this sound's panner attribute values.
	        sound = self._soundById(parseInt(args[0], 10));
	        return sound ? sound._pannerAttr : self._pannerAttr;
	      }
	    } else if (args.length === 2) {
	      o = args[0];
	      id = parseInt(args[1], 10);
	    }

	    // Update the values of the specified sounds.
	    var ids = self._getSoundIds(id);
	    for (var i=0; i<ids.length; i++) {
	      sound = self._soundById(ids[i]);

	      if (sound) {
	        // Merge the new values into the sound.
	        var pa = sound._pannerAttr;
	        pa = {
	          coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : pa.coneInnerAngle,
	          coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : pa.coneOuterAngle,
	          coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : pa.coneOuterGain,
	          distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : pa.distanceModel,
	          maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : pa.maxDistance,
	          refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : pa.refDistance,
	          rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : pa.rolloffFactor,
	          panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : pa.panningModel
	        };

	        // Update the panner values or create a new panner if none exists.
	        var panner = sound._panner;
	        if (panner) {
	          panner.coneInnerAngle = pa.coneInnerAngle;
	          panner.coneOuterAngle = pa.coneOuterAngle;
	          panner.coneOuterGain = pa.coneOuterGain;
	          panner.distanceModel = pa.distanceModel;
	          panner.maxDistance = pa.maxDistance;
	          panner.refDistance = pa.refDistance;
	          panner.rolloffFactor = pa.rolloffFactor;
	          panner.panningModel = pa.panningModel;
	        } else {
	          // Make sure we have a position to setup the node with.
	          if (!sound._pos) {
	            sound._pos = self._pos || [0, 0, -0.5];
	          }

	          // Create a new panner node.
	          setupPanner(sound, 'spatial');
	        }
	      }
	    }

	    return self;
	  };

	  /** Single Sound Methods **/
	  /***************************************************************************/

	  /**
	   * Add new properties to the core Sound init.
	   * @param  {Function} _super Core Sound init method.
	   * @return {Sound}
	   */
	  Sound.prototype.init = (function(_super) {
	    return function() {
	      var self = this;
	      var parent = self._parent;

	      // Setup user-defined default properties.
	      self._orientation = parent._orientation;
	      self._stereo = parent._stereo;
	      self._pos = parent._pos;
	      self._pannerAttr = parent._pannerAttr;

	      // Complete initilization with howler.js core Sound's init function.
	      _super.call(this);

	      // If a stereo or position was specified, set it up.
	      if (self._stereo) {
	        parent.stereo(self._stereo);
	      } else if (self._pos) {
	        parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
	      }
	    };
	  })(Sound.prototype.init);

	  /**
	   * Override the Sound.reset method to clean up properties from the spatial plugin.
	   * @param  {Function} _super Sound reset method.
	   * @return {Sound}
	   */
	  Sound.prototype.reset = (function(_super) {
	    return function() {
	      var self = this;
	      var parent = self._parent;

	      // Reset all spatial plugin properties on this sound.
	      self._orientation = parent._orientation;
	      self._stereo = parent._stereo;
	      self._pos = parent._pos;
	      self._pannerAttr = parent._pannerAttr;

	      // If a stereo or position was specified, set it up.
	      if (self._stereo) {
	        parent.stereo(self._stereo);
	      } else if (self._pos) {
	        parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
	      } else if (self._panner) {
	        // Disconnect the panner.
	        self._panner.disconnect(0);
	        self._panner = undefined;
	        parent._refreshBuffer(self);
	      }

	      // Complete resetting of the sound.
	      return _super.call(this);
	    };
	  })(Sound.prototype.reset);

	  /** Helper Methods **/
	  /***************************************************************************/

	  /**
	   * Create a new panner node and save it on the sound.
	   * @param  {Sound} sound Specific sound to setup panning on.
	   * @param {String} type Type of panner to create: 'stereo' or 'spatial'.
	   */
	  var setupPanner = function(sound, type) {
	    type = type || 'spatial';

	    // Create the new panner node.
	    if (type === 'spatial') {
	      sound._panner = Howler.ctx.createPanner();
	      sound._panner.coneInnerAngle = sound._pannerAttr.coneInnerAngle;
	      sound._panner.coneOuterAngle = sound._pannerAttr.coneOuterAngle;
	      sound._panner.coneOuterGain = sound._pannerAttr.coneOuterGain;
	      sound._panner.distanceModel = sound._pannerAttr.distanceModel;
	      sound._panner.maxDistance = sound._pannerAttr.maxDistance;
	      sound._panner.refDistance = sound._pannerAttr.refDistance;
	      sound._panner.rolloffFactor = sound._pannerAttr.rolloffFactor;
	      sound._panner.panningModel = sound._pannerAttr.panningModel;

	      if (typeof sound._panner.positionX !== 'undefined') {
	        sound._panner.positionX.setValueAtTime(sound._pos[0], Howler.ctx.currentTime);
	        sound._panner.positionY.setValueAtTime(sound._pos[1], Howler.ctx.currentTime);
	        sound._panner.positionZ.setValueAtTime(sound._pos[2], Howler.ctx.currentTime);
	      } else {
	        sound._panner.setPosition(sound._pos[0], sound._pos[1], sound._pos[2]);
	      }

	      if (typeof sound._panner.orientationX !== 'undefined') {
	        sound._panner.orientationX.setValueAtTime(sound._orientation[0], Howler.ctx.currentTime);
	        sound._panner.orientationY.setValueAtTime(sound._orientation[1], Howler.ctx.currentTime);
	        sound._panner.orientationZ.setValueAtTime(sound._orientation[2], Howler.ctx.currentTime);
	      } else {
	        sound._panner.setOrientation(sound._orientation[0], sound._orientation[1], sound._orientation[2]);
	      }
	    } else {
	      sound._panner = Howler.ctx.createStereoPanner();
	      sound._panner.pan.setValueAtTime(sound._stereo, Howler.ctx.currentTime);
	    }

	    sound._panner.connect(sound._node);

	    // Update the connections.
	    if (!sound._paused) {
	      sound._parent.pause(sound._id, true).play(sound._id, true);
	    }
	  };
	})();
} (howler));

var audioMp3 = "data:audio/mpeg;base64,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";

var doorMp3 = "data:audio/mpeg;base64,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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/75GQAD/AYAIADoAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABDpC80xBTUUzLjk5LjWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuOTkuNaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==";

const DEFAULT_SETTINGS = {
    mySetting: ''
};
class SoundPlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            // Status bar item. Does not work on mobile apps.
            const statusBarItemEl = this.addStatusBarItem();
            statusBarItemEl.setText('🔊');
            // Adds settings tab.
            this.addSettingTab(new SoundSettingTab(this.app, this));
            // Add a command to play me audio
            this.addCommand({
                id: 'play-me-audio',
                name: 'Play me audio',
                callback: () => {
                    let sound = new howler.Howl({
                        src: [audioMp3],
                        html5: true
                    });
                    sound.play();
                }
            });
            // Add a command to play door audio
            this.addCommand({
                id: 'play-door-audio',
                name: 'Play door audio',
                callback: () => {
                    let sound = new howler.Howl({
                        src: [doorMp3],
                        html5: true
                    });
                    sound.play();
                }
            });
            // Listens for file creation.
            this.registerEvent(this.app.vault.on('create', () => {
                console.log('a new file was made');
            }));
            // Listens for file deltion.
            this.registerEvent(this.app.vault.on('delete', () => {
                console.log('a new file was deleted');
            }));
            // Not working for some reason.
            this.registerEvent(this.app.workspace.on('click', () => {
                console.log('a file was click');
            }));
            // Listens for file open.
            this.registerEvent(this.app.workspace.on('file-open', () => {
                console.log('a file was opened');
            }));
            // Listens for file menu open.
            this.registerEvent(this.app.workspace.on('file-menu', () => {
                console.log('a file menu was shown');
            }));
            // Listens for pasting in files.
            this.registerEvent(this.app.workspace.on('editor-paste', () => {
                console.log('something was pasted');
            }));
            // Listens for a new window.
            this.registerEvent(this.app.workspace.on('window-open', () => {
                console.log('opened window');
            }));
            // Listens for closing a window.
            this.registerEvent(this.app.workspace.on('window-close', () => {
                console.log('closed window');
            }));
        });
    }
    onunload() {
    }
    // Load the settings. 
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    // Save the settings.
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
}

module.exports = SoundPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNldHRpbmdzLnRzIiwibm9kZV9tb2R1bGVzL2hvd2xlci9kaXN0L2hvd2xlci5qcyIsInNvdW5kIGZpbGVzL2F1ZGlvLm1wMyIsInNvdW5kIGZpbGVzL2Rvb3IubXAzIiwibWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxyXG5cclxuUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XHJcbnB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC5cclxuXHJcblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcclxuUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXHJcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcclxuSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXHJcbkxPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXHJcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcclxuUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwgcCkpIGRbcF0gPSBiW3BdOyB9O1xyXG4gICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcclxuICAgIGlmICh0eXBlb2YgYiAhPT0gXCJmdW5jdGlvblwiICYmIGIgIT09IG51bGwpXHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNsYXNzIGV4dGVuZHMgdmFsdWUgXCIgKyBTdHJpbmcoYikgKyBcIiBpcyBub3QgYSBjb25zdHJ1Y3RvciBvciBudWxsXCIpO1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcclxuICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XHJcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xyXG4gICAgICAgIHdoaWxlIChfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19jcmVhdGVCaW5kaW5nID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtLCBrKTtcclxuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XHJcbiAgICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgZGVzYyk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkSW4oc3RhdGUsIHJlY2VpdmVyKSB7XHJcbiAgICBpZiAocmVjZWl2ZXIgPT09IG51bGwgfHwgKHR5cGVvZiByZWNlaXZlciAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcmVjZWl2ZXIgIT09IFwiZnVuY3Rpb25cIikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgdXNlICdpbicgb3BlcmF0b3Igb24gbm9uLW9iamVjdFwiKTtcclxuICAgIHJldHVybiB0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyID09PSBzdGF0ZSA6IHN0YXRlLmhhcyhyZWNlaXZlcik7XHJcbn1cclxuIiwiaW1wb3J0IFNvdW5kUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNvdW5kU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xyXG5cdHBsdWdpbjogU291bmRQbHVnaW47XHJcblx0Ly8gPz9cclxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBTb3VuZFBsdWdpbikge1xyXG5cdFx0c3VwZXIoYXBwLCBwbHVnaW4pO1xyXG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcblx0fVxyXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcclxuXHRcdGNvbnN0IHtjb250YWluZXJFbH0gPSB0aGlzO1xyXG5cdFx0Ly8gUHJldmVudHMgYWRkZWQgY29udGFpbmVycyBvbiBvcGVuLlxyXG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcclxuXHRcdC8vIEFkZHMgaW5mb3JtYXRpb24uXHJcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDInLCB7dGV4dDogJ0hlYWRpbmcgMid9KTtcclxuXHJcblx0XHQvLyBBZGRzIGxpbmUuIFRoZW4gaW5mb3JtYXRpb24uXHRcclxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG5cdFx0XHQvLyBBZGRzIG5hbWUgYW5kIGRlc2NyaXB0aW9uLlxyXG5cdFx0XHQuc2V0TmFtZSgnU2V0dGluZyBOYW1lJylcclxuXHRcdFx0LnNldERlc2MoJ0EgZGVzY3JpcHRpb24nKVxyXG5cdFx0XHQvLyBBZGRzIGlucHV0IGJveC5cclxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XHJcblx0XHRcdFx0Ly8gQ3JlYXRlcyBhIHZhbHVlIHRvIHNhdmUgaW5mb3JtYXRpb24uXHJcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm15U2V0dGluZylcclxuXHRcdFx0XHQvLyBQbGFjZWhvbGRlciB0ZXh0LlxyXG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignUGxhY2Vob2xkZXIgdGV4dCcpXHJcblx0XHRcdFx0Ly8gV2hlbiB0ZXh0IGlzIGNoYW5nZWQgdHJpZ2dlci5cclxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XHJcblx0XHRcdFx0XHQvLyBDaGFuZ2UgdGhlIG15U2V0dGluZyB2YWx1ZS5cclxuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLm15U2V0dGluZyA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0Ly8gPz9cclxuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG5cdFx0XHRcdH0pKVxyXG5cdH1cclxufSIsIi8qIVxuICogIGhvd2xlci5qcyB2Mi4yLjNcbiAqICBob3dsZXJqcy5jb21cbiAqXG4gKiAgKGMpIDIwMTMtMjAyMCwgSmFtZXMgU2ltcHNvbiBvZiBHb2xkRmlyZSBTdHVkaW9zXG4gKiAgZ29sZGZpcmVzdHVkaW9zLmNvbVxuICpcbiAqICBNSVQgTGljZW5zZVxuICovXG5cbihmdW5jdGlvbigpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqIEdsb2JhbCBNZXRob2RzICoqL1xuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgdGhlIGdsb2JhbCBjb250cm9sbGVyLiBBbGwgY29udGFpbmVkIG1ldGhvZHMgYW5kIHByb3BlcnRpZXMgYXBwbHlcbiAgICogdG8gYWxsIHNvdW5kcyB0aGF0IGFyZSBjdXJyZW50bHkgcGxheWluZyBvciB3aWxsIGJlIGluIHRoZSBmdXR1cmUuXG4gICAqL1xuICB2YXIgSG93bGVyR2xvYmFsID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbml0KCk7XG4gIH07XG4gIEhvd2xlckdsb2JhbC5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSB0aGUgZ2xvYmFsIEhvd2xlciBvYmplY3QuXG4gICAgICogQHJldHVybiB7SG93bGVyfVxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcblxuICAgICAgLy8gQ3JlYXRlIGEgZ2xvYmFsIElEIGNvdW50ZXIuXG4gICAgICBzZWxmLl9jb3VudGVyID0gMTAwMDtcblxuICAgICAgLy8gUG9vbCBvZiB1bmxvY2tlZCBIVE1MNSBBdWRpbyBvYmplY3RzLlxuICAgICAgc2VsZi5faHRtbDVBdWRpb1Bvb2wgPSBbXTtcbiAgICAgIHNlbGYuaHRtbDVQb29sU2l6ZSA9IDEwO1xuXG4gICAgICAvLyBJbnRlcm5hbCBwcm9wZXJ0aWVzLlxuICAgICAgc2VsZi5fY29kZWNzID0ge307XG4gICAgICBzZWxmLl9ob3dscyA9IFtdO1xuICAgICAgc2VsZi5fbXV0ZWQgPSBmYWxzZTtcbiAgICAgIHNlbGYuX3ZvbHVtZSA9IDE7XG4gICAgICBzZWxmLl9jYW5QbGF5RXZlbnQgPSAnY2FucGxheXRocm91Z2gnO1xuICAgICAgc2VsZi5fbmF2aWdhdG9yID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5uYXZpZ2F0b3IpID8gd2luZG93Lm5hdmlnYXRvciA6IG51bGw7XG5cbiAgICAgIC8vIFB1YmxpYyBwcm9wZXJ0aWVzLlxuICAgICAgc2VsZi5tYXN0ZXJHYWluID0gbnVsbDtcbiAgICAgIHNlbGYubm9BdWRpbyA9IGZhbHNlO1xuICAgICAgc2VsZi51c2luZ1dlYkF1ZGlvID0gdHJ1ZTtcbiAgICAgIHNlbGYuYXV0b1N1c3BlbmQgPSB0cnVlO1xuICAgICAgc2VsZi5jdHggPSBudWxsO1xuXG4gICAgICAvLyBTZXQgdG8gZmFsc2UgdG8gZGlzYWJsZSB0aGUgYXV0byBhdWRpbyB1bmxvY2tlci5cbiAgICAgIHNlbGYuYXV0b1VubG9jayA9IHRydWU7XG5cbiAgICAgIC8vIFNldHVwIHRoZSB2YXJpb3VzIHN0YXRlIHZhbHVlcyBmb3IgZ2xvYmFsIHRyYWNraW5nLlxuICAgICAgc2VsZi5fc2V0dXAoKTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldC9zZXQgdGhlIGdsb2JhbCB2b2x1bWUgZm9yIGFsbCBzb3VuZHMuXG4gICAgICogQHBhcmFtICB7RmxvYXR9IHZvbCBWb2x1bWUgZnJvbSAwLjAgdG8gMS4wLlxuICAgICAqIEByZXR1cm4ge0hvd2xlci9GbG9hdH0gICAgIFJldHVybnMgc2VsZiBvciBjdXJyZW50IHZvbHVtZS5cbiAgICAgKi9cbiAgICB2b2x1bWU6IGZ1bmN0aW9uKHZvbCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcbiAgICAgIHZvbCA9IHBhcnNlRmxvYXQodm9sKTtcblxuICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhbiBBdWRpb0NvbnRleHQgY3JlYXRlZCB5ZXQsIHJ1biB0aGUgc2V0dXAuXG4gICAgICBpZiAoIXNlbGYuY3R4KSB7XG4gICAgICAgIHNldHVwQXVkaW9Db250ZXh0KCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygdm9sICE9PSAndW5kZWZpbmVkJyAmJiB2b2wgPj0gMCAmJiB2b2wgPD0gMSkge1xuICAgICAgICBzZWxmLl92b2x1bWUgPSB2b2w7XG5cbiAgICAgICAgLy8gRG9uJ3QgdXBkYXRlIGFueSBvZiB0aGUgbm9kZXMgaWYgd2UgYXJlIG11dGVkLlxuICAgICAgICBpZiAoc2VsZi5fbXV0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdoZW4gdXNpbmcgV2ViIEF1ZGlvLCB3ZSBqdXN0IG5lZWQgdG8gYWRqdXN0IHRoZSBtYXN0ZXIgZ2Fpbi5cbiAgICAgICAgaWYgKHNlbGYudXNpbmdXZWJBdWRpbykge1xuICAgICAgICAgIHNlbGYubWFzdGVyR2Fpbi5nYWluLnNldFZhbHVlQXRUaW1lKHZvbCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMb29wIHRocm91Z2ggYW5kIGNoYW5nZSB2b2x1bWUgZm9yIGFsbCBIVE1MNSBhdWRpbyBub2Rlcy5cbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX2hvd2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKCFzZWxmLl9ob3dsc1tpXS5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAgIC8vIEdldCBhbGwgb2YgdGhlIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAgICAgICAgICB2YXIgaWRzID0gc2VsZi5faG93bHNbaV0uX2dldFNvdW5kSWRzKCk7XG5cbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgc291bmRzIGFuZCBjaGFuZ2UgdGhlIHZvbHVtZXMuXG4gICAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8aWRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX2hvd2xzW2ldLl9zb3VuZEJ5SWQoaWRzW2pdKTtcblxuICAgICAgICAgICAgICBpZiAoc291bmQgJiYgc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgICAgICBzb3VuZC5fbm9kZS52b2x1bWUgPSBzb3VuZC5fdm9sdW1lICogdm9sO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmLl92b2x1bWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBtdXRpbmcgYW5kIHVubXV0aW5nIGdsb2JhbGx5LlxuICAgICAqIEBwYXJhbSAge0Jvb2xlYW59IG11dGVkIElzIG11dGVkIG9yIG5vdC5cbiAgICAgKi9cbiAgICBtdXRlOiBmdW5jdGlvbihtdXRlZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcblxuICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhbiBBdWRpb0NvbnRleHQgY3JlYXRlZCB5ZXQsIHJ1biB0aGUgc2V0dXAuXG4gICAgICBpZiAoIXNlbGYuY3R4KSB7XG4gICAgICAgIHNldHVwQXVkaW9Db250ZXh0KCk7XG4gICAgICB9XG5cbiAgICAgIHNlbGYuX211dGVkID0gbXV0ZWQ7XG5cbiAgICAgIC8vIFdpdGggV2ViIEF1ZGlvLCB3ZSBqdXN0IG5lZWQgdG8gbXV0ZSB0aGUgbWFzdGVyIGdhaW4uXG4gICAgICBpZiAoc2VsZi51c2luZ1dlYkF1ZGlvKSB7XG4gICAgICAgIHNlbGYubWFzdGVyR2Fpbi5nYWluLnNldFZhbHVlQXRUaW1lKG11dGVkID8gMCA6IHNlbGYuX3ZvbHVtZSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCBhbmQgbXV0ZSBhbGwgSFRNTDUgQXVkaW8gbm9kZXMuXG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5faG93bHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFzZWxmLl9ob3dsc1tpXS5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAvLyBHZXQgYWxsIG9mIHRoZSBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgICAgICAgIHZhciBpZHMgPSBzZWxmLl9ob3dsc1tpXS5fZ2V0U291bmRJZHMoKTtcblxuICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgc291bmRzIGFuZCBtYXJrIHRoZSBhdWRpbyBub2RlIGFzIG11dGVkLlxuICAgICAgICAgIGZvciAodmFyIGo9MDsgajxpZHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX2hvd2xzW2ldLl9zb3VuZEJ5SWQoaWRzW2pdKTtcblxuICAgICAgICAgICAgaWYgKHNvdW5kICYmIHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9ub2RlLm11dGVkID0gKG11dGVkKSA/IHRydWUgOiBzb3VuZC5fbXV0ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgc3RvcHBpbmcgYWxsIHNvdW5kcyBnbG9iYWxseS5cbiAgICAgKi9cbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgSG93bHMgYW5kIHN0b3AgdGhlbS5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzZWxmLl9ob3dsc1tpXS5zdG9wKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbmxvYWQgYW5kIGRlc3Ryb3kgYWxsIGN1cnJlbnRseSBsb2FkZWQgSG93bCBvYmplY3RzLlxuICAgICAqIEByZXR1cm4ge0hvd2xlcn1cbiAgICAgKi9cbiAgICB1bmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcblxuICAgICAgZm9yICh2YXIgaT1zZWxmLl9ob3dscy5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG4gICAgICAgIHNlbGYuX2hvd2xzW2ldLnVubG9hZCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgQXVkaW9Db250ZXh0IHRvIG1ha2Ugc3VyZSBpdCBpcyBmdWxseSByZXNldC5cbiAgICAgIGlmIChzZWxmLnVzaW5nV2ViQXVkaW8gJiYgc2VsZi5jdHggJiYgdHlwZW9mIHNlbGYuY3R4LmNsb3NlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzZWxmLmN0eC5jbG9zZSgpO1xuICAgICAgICBzZWxmLmN0eCA9IG51bGw7XG4gICAgICAgIHNldHVwQXVkaW9Db250ZXh0KCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBmb3IgY29kZWMgc3VwcG9ydCBvZiBzcGVjaWZpYyBleHRlbnNpb24uXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBleHQgQXVkaW8gZmlsZSBleHRlbnRpb24uXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBjb2RlY3M6IGZ1bmN0aW9uKGV4dCkge1xuICAgICAgcmV0dXJuICh0aGlzIHx8IEhvd2xlcikuX2NvZGVjc1tleHQucmVwbGFjZSgvXngtLywgJycpXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0dXAgdmFyaW91cyBzdGF0ZSB2YWx1ZXMgZm9yIGdsb2JhbCB0cmFja2luZy5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgX3NldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIC8vIEtlZXBzIHRyYWNrIG9mIHRoZSBzdXNwZW5kL3Jlc3VtZSBzdGF0ZSBvZiB0aGUgQXVkaW9Db250ZXh0LlxuICAgICAgc2VsZi5zdGF0ZSA9IHNlbGYuY3R4ID8gc2VsZi5jdHguc3RhdGUgfHwgJ3N1c3BlbmRlZCcgOiAnc3VzcGVuZGVkJztcblxuICAgICAgLy8gQXV0b21hdGljYWxseSBiZWdpbiB0aGUgMzAtc2Vjb25kIHN1c3BlbmQgcHJvY2Vzc1xuICAgICAgc2VsZi5fYXV0b1N1c3BlbmQoKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgYXVkaW8gaXMgYXZhaWxhYmxlLlxuICAgICAgaWYgKCFzZWxmLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgICAgLy8gTm8gYXVkaW8gaXMgYXZhaWxhYmxlIG9uIHRoaXMgc3lzdGVtIGlmIG5vQXVkaW8gaXMgc2V0IHRvIHRydWUuXG4gICAgICAgIGlmICh0eXBlb2YgQXVkaW8gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciB0ZXN0ID0gbmV3IEF1ZGlvKCk7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBjYW5wbGF5dGhyb3VnaCBldmVudCBpcyBhdmFpbGFibGUuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRlc3Qub25jYW5wbGF5dGhyb3VnaCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgc2VsZi5fY2FuUGxheUV2ZW50ID0gJ2NhbnBsYXknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgc2VsZi5ub0F1ZGlvID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi5ub0F1ZGlvID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUZXN0IHRvIG1ha2Ugc3VyZSBhdWRpbyBpc24ndCBkaXNhYmxlZCBpbiBJbnRlcm5ldCBFeHBsb3Jlci5cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciB0ZXN0ID0gbmV3IEF1ZGlvKCk7XG4gICAgICAgIGlmICh0ZXN0Lm11dGVkKSB7XG4gICAgICAgICAgc2VsZi5ub0F1ZGlvID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgLy8gQ2hlY2sgZm9yIHN1cHBvcnRlZCBjb2RlY3MuXG4gICAgICBpZiAoIXNlbGYubm9BdWRpbykge1xuICAgICAgICBzZWxmLl9zZXR1cENvZGVjcygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgZm9yIGJyb3dzZXIgc3VwcG9ydCBmb3IgdmFyaW91cyBjb2RlY3MgYW5kIGNhY2hlIHRoZSByZXN1bHRzLlxuICAgICAqIEByZXR1cm4ge0hvd2xlcn1cbiAgICAgKi9cbiAgICBfc2V0dXBDb2RlY3M6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcbiAgICAgIHZhciBhdWRpb1Rlc3QgPSBudWxsO1xuXG4gICAgICAvLyBNdXN0IHdyYXAgaW4gYSB0cnkvY2F0Y2ggYmVjYXVzZSBJRTExIGluIHNlcnZlciBtb2RlIHRocm93cyBhbiBlcnJvci5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF1ZGlvVGVzdCA9ICh0eXBlb2YgQXVkaW8gIT09ICd1bmRlZmluZWQnKSA/IG5ldyBBdWRpbygpIDogbnVsbDtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgaWYgKCFhdWRpb1Rlc3QgfHwgdHlwZW9mIGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgdmFyIG1wZWdUZXN0ID0gYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9tcGVnOycpLnJlcGxhY2UoL15ubyQvLCAnJyk7XG5cbiAgICAgIC8vIE9wZXJhIHZlcnNpb24gPDMzIGhhcyBtaXhlZCBNUDMgc3VwcG9ydCwgc28gd2UgbmVlZCB0byBjaGVjayBmb3IgYW5kIGJsb2NrIGl0LlxuICAgICAgdmFyIHVhID0gc2VsZi5fbmF2aWdhdG9yID8gc2VsZi5fbmF2aWdhdG9yLnVzZXJBZ2VudCA6ICcnO1xuICAgICAgdmFyIGNoZWNrT3BlcmEgPSB1YS5tYXRjaCgvT1BSXFwvKFswLTZdLikvZyk7XG4gICAgICB2YXIgaXNPbGRPcGVyYSA9IChjaGVja09wZXJhICYmIHBhcnNlSW50KGNoZWNrT3BlcmFbMF0uc3BsaXQoJy8nKVsxXSwgMTApIDwgMzMpO1xuICAgICAgdmFyIGNoZWNrU2FmYXJpID0gdWEuaW5kZXhPZignU2FmYXJpJykgIT09IC0xICYmIHVhLmluZGV4T2YoJ0Nocm9tZScpID09PSAtMTtcbiAgICAgIHZhciBzYWZhcmlWZXJzaW9uID0gdWEubWF0Y2goL1ZlcnNpb25cXC8oLio/KSAvKTtcbiAgICAgIHZhciBpc09sZFNhZmFyaSA9IChjaGVja1NhZmFyaSAmJiBzYWZhcmlWZXJzaW9uICYmIHBhcnNlSW50KHNhZmFyaVZlcnNpb25bMV0sIDEwKSA8IDE1KTtcblxuICAgICAgc2VsZi5fY29kZWNzID0ge1xuICAgICAgICBtcDM6ICEhKCFpc09sZE9wZXJhICYmIChtcGVnVGVzdCB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL21wMzsnKS5yZXBsYWNlKC9ebm8kLywgJycpKSksXG4gICAgICAgIG1wZWc6ICEhbXBlZ1Rlc3QsXG4gICAgICAgIG9wdXM6ICEhYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9vZ2c7IGNvZGVjcz1cIm9wdXNcIicpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIG9nZzogISFhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL29nZzsgY29kZWNzPVwidm9yYmlzXCInKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBvZ2E6ICEhYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9vZ2c7IGNvZGVjcz1cInZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgd2F2OiAhIShhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3dhdjsgY29kZWNzPVwiMVwiJykgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby93YXYnKSkucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgYWFjOiAhIWF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vYWFjOycpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIGNhZjogISFhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3gtY2FmOycpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIG00YTogISEoYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby94LW00YTsnKSB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL200YTsnKSB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL2FhYzsnKSkucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgbTRiOiAhIShhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3gtbTRiOycpIHx8IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vbTRiOycpIHx8IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vYWFjOycpKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBtcDQ6ICEhKGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8veC1tcDQ7JykgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9tcDQ7JykgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9hYWM7JykpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIHdlYmE6ICEhKCFpc09sZFNhZmFyaSAmJiBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3dlYm07IGNvZGVjcz1cInZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sICcnKSksXG4gICAgICAgIHdlYm06ICEhKCFpc09sZFNhZmFyaSAmJiBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3dlYm07IGNvZGVjcz1cInZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sICcnKSksXG4gICAgICAgIGRvbGJ5OiAhIWF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vbXA0OyBjb2RlY3M9XCJlYy0zXCInKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBmbGFjOiAhIShhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3gtZmxhYzsnKSB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL2ZsYWM7JykpLnJlcGxhY2UoL15ubyQvLCAnJylcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTb21lIGJyb3dzZXJzL2RldmljZXMgd2lsbCBvbmx5IGFsbG93IGF1ZGlvIHRvIGJlIHBsYXllZCBhZnRlciBhIHVzZXIgaW50ZXJhY3Rpb24uXG4gICAgICogQXR0ZW1wdCB0byBhdXRvbWF0aWNhbGx5IHVubG9jayBhdWRpbyBvbiB0aGUgZmlyc3QgdXNlciBpbnRlcmFjdGlvbi5cbiAgICAgKiBDb25jZXB0IGZyb206IGh0dHA6Ly9wYXVsYmFrYXVzLmNvbS90dXRvcmlhbHMvaHRtbDUvd2ViLWF1ZGlvLW9uLWlvcy9cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgX3VubG9ja0F1ZGlvOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIC8vIE9ubHkgcnVuIHRoaXMgaWYgV2ViIEF1ZGlvIGlzIHN1cHBvcnRlZCBhbmQgaXQgaGFzbid0IGFscmVhZHkgYmVlbiB1bmxvY2tlZC5cbiAgICAgIGlmIChzZWxmLl9hdWRpb1VubG9ja2VkIHx8ICFzZWxmLmN0eCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHNlbGYuX2F1ZGlvVW5sb2NrZWQgPSBmYWxzZTtcbiAgICAgIHNlbGYuYXV0b1VubG9jayA9IGZhbHNlO1xuXG4gICAgICAvLyBTb21lIG1vYmlsZSBkZXZpY2VzL3BsYXRmb3JtcyBoYXZlIGRpc3RvcnRpb24gaXNzdWVzIHdoZW4gb3BlbmluZy9jbG9zaW5nIHRhYnMgYW5kL29yIHdlYiB2aWV3cy5cbiAgICAgIC8vIEJ1Z3MgaW4gdGhlIGJyb3dzZXIgKGVzcGVjaWFsbHkgTW9iaWxlIFNhZmFyaSkgY2FuIGNhdXNlIHRoZSBzYW1wbGVSYXRlIHRvIGNoYW5nZSBmcm9tIDQ0MTAwIHRvIDQ4MDAwLlxuICAgICAgLy8gQnkgY2FsbGluZyBIb3dsZXIudW5sb2FkKCksIHdlIGNyZWF0ZSBhIG5ldyBBdWRpb0NvbnRleHQgd2l0aCB0aGUgY29ycmVjdCBzYW1wbGVSYXRlLlxuICAgICAgaWYgKCFzZWxmLl9tb2JpbGVVbmxvYWRlZCAmJiBzZWxmLmN0eC5zYW1wbGVSYXRlICE9PSA0NDEwMCkge1xuICAgICAgICBzZWxmLl9tb2JpbGVVbmxvYWRlZCA9IHRydWU7XG4gICAgICAgIHNlbGYudW5sb2FkKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNjcmF0Y2ggYnVmZmVyIGZvciBlbmFibGluZyBpT1MgdG8gZGlzcG9zZSBvZiB3ZWIgYXVkaW8gYnVmZmVycyBjb3JyZWN0bHksIGFzIHBlcjpcbiAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjQxMTk2ODRcbiAgICAgIHNlbGYuX3NjcmF0Y2hCdWZmZXIgPSBzZWxmLmN0eC5jcmVhdGVCdWZmZXIoMSwgMSwgMjIwNTApO1xuXG4gICAgICAvLyBDYWxsIHRoaXMgbWV0aG9kIG9uIHRvdWNoIHN0YXJ0IHRvIGNyZWF0ZSBhbmQgcGxheSBhIGJ1ZmZlcixcbiAgICAgIC8vIHRoZW4gY2hlY2sgaWYgdGhlIGF1ZGlvIGFjdHVhbGx5IHBsYXllZCB0byBkZXRlcm1pbmUgaWZcbiAgICAgIC8vIGF1ZGlvIGhhcyBub3cgYmVlbiB1bmxvY2tlZCBvbiBpT1MsIEFuZHJvaWQsIGV0Yy5cbiAgICAgIHZhciB1bmxvY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIENyZWF0ZSBhIHBvb2wgb2YgdW5sb2NrZWQgSFRNTDUgQXVkaW8gb2JqZWN0cyB0aGF0IGNhblxuICAgICAgICAvLyBiZSB1c2VkIGZvciBwbGF5aW5nIHNvdW5kcyB3aXRob3V0IHVzZXIgaW50ZXJhY3Rpb24uIEhUTUw1XG4gICAgICAgIC8vIEF1ZGlvIG9iamVjdHMgbXVzdCBiZSBpbmRpdmlkdWFsbHkgdW5sb2NrZWQsIGFzIG9wcG9zZWRcbiAgICAgICAgLy8gdG8gdGhlIFdlYkF1ZGlvIEFQSSB3aGljaCBvbmx5IG5lZWRzIGEgc2luZ2xlIGFjdGl2YXRpb24uXG4gICAgICAgIC8vIFRoaXMgbXVzdCBvY2N1ciBiZWZvcmUgV2ViQXVkaW8gc2V0dXAgb3IgdGhlIHNvdXJjZS5vbmVuZGVkXG4gICAgICAgIC8vIGV2ZW50IHdpbGwgbm90IGZpcmUuXG4gICAgICAgIHdoaWxlIChzZWxmLl9odG1sNUF1ZGlvUG9vbC5sZW5ndGggPCBzZWxmLmh0bWw1UG9vbFNpemUpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGF1ZGlvTm9kZSA9IG5ldyBBdWRpbygpO1xuXG4gICAgICAgICAgICAvLyBNYXJrIHRoaXMgQXVkaW8gb2JqZWN0IGFzIHVubG9ja2VkIHRvIGVuc3VyZSBpdCBjYW4gZ2V0IHJldHVybmVkXG4gICAgICAgICAgICAvLyB0byB0aGUgdW5sb2NrZWQgcG9vbCB3aGVuIHJlbGVhc2VkLlxuICAgICAgICAgICAgYXVkaW9Ob2RlLl91bmxvY2tlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgYXVkaW8gbm9kZSB0byB0aGUgcG9vbC5cbiAgICAgICAgICAgIHNlbGYuX3JlbGVhc2VIdG1sNUF1ZGlvKGF1ZGlvTm9kZSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgc2VsZi5ub0F1ZGlvID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbnkgYXNzaWduZWQgYXVkaW8gbm9kZXMgYW5kIHVubG9jayB0aGVtLlxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5faG93bHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoIXNlbGYuX2hvd2xzW2ldLl93ZWJBdWRpbykge1xuICAgICAgICAgICAgLy8gR2V0IGFsbCBvZiB0aGUgc291bmRzIGluIHRoaXMgSG93bCBncm91cC5cbiAgICAgICAgICAgIHZhciBpZHMgPSBzZWxmLl9ob3dsc1tpXS5fZ2V0U291bmRJZHMoKTtcblxuICAgICAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCBzb3VuZHMgYW5kIHVubG9jayB0aGUgYXVkaW8gbm9kZXMuXG4gICAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8aWRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX2hvd2xzW2ldLl9zb3VuZEJ5SWQoaWRzW2pdKTtcblxuICAgICAgICAgICAgICBpZiAoc291bmQgJiYgc291bmQuX25vZGUgJiYgIXNvdW5kLl9ub2RlLl91bmxvY2tlZCkge1xuICAgICAgICAgICAgICAgIHNvdW5kLl9ub2RlLl91bmxvY2tlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc291bmQuX25vZGUubG9hZCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRml4IEFuZHJvaWQgY2FuIG5vdCBwbGF5IGluIHN1c3BlbmQgc3RhdGUuXG4gICAgICAgIHNlbGYuX2F1dG9SZXN1bWUoKTtcblxuICAgICAgICAvLyBDcmVhdGUgYW4gZW1wdHkgYnVmZmVyLlxuICAgICAgICB2YXIgc291cmNlID0gc2VsZi5jdHguY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgIHNvdXJjZS5idWZmZXIgPSBzZWxmLl9zY3JhdGNoQnVmZmVyO1xuICAgICAgICBzb3VyY2UuY29ubmVjdChzZWxmLmN0eC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgLy8gUGxheSB0aGUgZW1wdHkgYnVmZmVyLlxuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZS5zdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBzb3VyY2Uubm90ZU9uKDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNvdXJjZS5zdGFydCgwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGxpbmcgcmVzdW1lKCkgb24gYSBzdGFjayBpbml0aWF0ZWQgYnkgdXNlciBnZXN0dXJlIGlzIHdoYXQgYWN0dWFsbHkgdW5sb2NrcyB0aGUgYXVkaW8gb24gQW5kcm9pZCBDaHJvbWUgPj0gNTUuXG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZi5jdHgucmVzdW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgc2VsZi5jdHgucmVzdW1lKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXR1cCBhIHRpbWVvdXQgdG8gY2hlY2sgdGhhdCB3ZSBhcmUgdW5sb2NrZWQgb24gdGhlIG5leHQgZXZlbnQgbG9vcC5cbiAgICAgICAgc291cmNlLm9uZW5kZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzb3VyY2UuZGlzY29ubmVjdCgwKTtcblxuICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgdW5sb2NrZWQgc3RhdGUgYW5kIHByZXZlbnQgdGhpcyBjaGVjayBmcm9tIGhhcHBlbmluZyBhZ2Fpbi5cbiAgICAgICAgICBzZWxmLl9hdWRpb1VubG9ja2VkID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgdG91Y2ggc3RhcnQgbGlzdGVuZXIuXG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHVubG9jaywgdHJ1ZSk7XG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB1bmxvY2ssIHRydWUpO1xuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdW5sb2NrLCB0cnVlKTtcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdW5sb2NrLCB0cnVlKTtcblxuICAgICAgICAgIC8vIExldCBhbGwgc291bmRzIGtub3cgdGhhdCBhdWRpbyBoYXMgYmVlbiB1bmxvY2tlZC5cbiAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5faG93bHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNlbGYuX2hvd2xzW2ldLl9lbWl0KCd1bmxvY2snKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9O1xuXG4gICAgICAvLyBTZXR1cCBhIHRvdWNoIHN0YXJ0IGxpc3RlbmVyIHRvIGF0dGVtcHQgYW4gdW5sb2NrIGluLlxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHVubG9jaywgdHJ1ZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHVubG9jaywgdHJ1ZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHVubG9jaywgdHJ1ZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdW5sb2NrLCB0cnVlKTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhbiB1bmxvY2tlZCBIVE1MNSBBdWRpbyBvYmplY3QgZnJvbSB0aGUgcG9vbC4gSWYgbm9uZSBhcmUgbGVmdCxcbiAgICAgKiByZXR1cm4gYSBuZXcgQXVkaW8gb2JqZWN0IGFuZCB0aHJvdyBhIHdhcm5pbmcuXG4gICAgICogQHJldHVybiB7QXVkaW99IEhUTUw1IEF1ZGlvIG9iamVjdC5cbiAgICAgKi9cbiAgICBfb2J0YWluSHRtbDVBdWRpbzogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMgfHwgSG93bGVyO1xuXG4gICAgICAvLyBSZXR1cm4gdGhlIG5leHQgb2JqZWN0IGZyb20gdGhlIHBvb2wgaWYgb25lIGV4aXN0cy5cbiAgICAgIGlmIChzZWxmLl9odG1sNUF1ZGlvUG9vbC5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuX2h0bWw1QXVkaW9Qb29sLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICAvLy5DaGVjayBpZiB0aGUgYXVkaW8gaXMgbG9ja2VkIGFuZCB0aHJvdyBhIHdhcm5pbmcuXG4gICAgICB2YXIgdGVzdFBsYXkgPSBuZXcgQXVkaW8oKS5wbGF5KCk7XG4gICAgICBpZiAodGVzdFBsYXkgJiYgdHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnICYmICh0ZXN0UGxheSBpbnN0YW5jZW9mIFByb21pc2UgfHwgdHlwZW9mIHRlc3RQbGF5LnRoZW4gPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgIHRlc3RQbGF5LmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignSFRNTDUgQXVkaW8gcG9vbCBleGhhdXN0ZWQsIHJldHVybmluZyBwb3RlbnRpYWxseSBsb2NrZWQgYXVkaW8gb2JqZWN0LicpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBBdWRpbygpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYW4gYWN0aXZhdGVkIEhUTUw1IEF1ZGlvIG9iamVjdCB0byB0aGUgcG9vbC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgX3JlbGVhc2VIdG1sNUF1ZGlvOiBmdW5jdGlvbihhdWRpbykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcblxuICAgICAgLy8gRG9uJ3QgYWRkIGF1ZGlvIHRvIHRoZSBwb29sIGlmIHdlIGRvbid0IGtub3cgaWYgaXQgaGFzIGJlZW4gdW5sb2NrZWQuXG4gICAgICBpZiAoYXVkaW8uX3VubG9ja2VkKSB7XG4gICAgICAgIHNlbGYuX2h0bWw1QXVkaW9Qb29sLnB1c2goYXVkaW8pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXV0b21hdGljYWxseSBzdXNwZW5kIHRoZSBXZWIgQXVkaW8gQXVkaW9Db250ZXh0IGFmdGVyIG5vIHNvdW5kIGhhcyBwbGF5ZWQgZm9yIDMwIHNlY29uZHMuXG4gICAgICogVGhpcyBzYXZlcyBwcm9jZXNzaW5nL2VuZXJneSBhbmQgZml4ZXMgdmFyaW91cyBicm93c2VyLXNwZWNpZmljIGJ1Z3Mgd2l0aCBhdWRpbyBnZXR0aW5nIHN0dWNrLlxuICAgICAqIEByZXR1cm4ge0hvd2xlcn1cbiAgICAgKi9cbiAgICBfYXV0b1N1c3BlbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBpZiAoIXNlbGYuYXV0b1N1c3BlbmQgfHwgIXNlbGYuY3R4IHx8IHR5cGVvZiBzZWxmLmN0eC5zdXNwZW5kID09PSAndW5kZWZpbmVkJyB8fCAhSG93bGVyLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiBhbnkgc291bmRzIGFyZSBwbGF5aW5nLlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX2hvd2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzZWxmLl9ob3dsc1tpXS5fd2ViQXVkaW8pIHtcbiAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8c2VsZi5faG93bHNbaV0uX3NvdW5kcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKCFzZWxmLl9ob3dsc1tpXS5fc291bmRzW2pdLl9wYXVzZWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxmLl9zdXNwZW5kVGltZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGYuX3N1c3BlbmRUaW1lcik7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIHNvdW5kIGhhcyBwbGF5ZWQgYWZ0ZXIgMzAgc2Vjb25kcywgc3VzcGVuZCB0aGUgY29udGV4dC5cbiAgICAgIHNlbGYuX3N1c3BlbmRUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghc2VsZi5hdXRvU3VzcGVuZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuX3N1c3BlbmRUaW1lciA9IG51bGw7XG4gICAgICAgIHNlbGYuc3RhdGUgPSAnc3VzcGVuZGluZyc7XG5cbiAgICAgICAgLy8gSGFuZGxlIHVwZGF0aW5nIHRoZSBzdGF0ZSBvZiB0aGUgYXVkaW8gY29udGV4dCBhZnRlciBzdXNwZW5kaW5nLlxuICAgICAgICB2YXIgaGFuZGxlU3VzcGVuc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlbGYuc3RhdGUgPSAnc3VzcGVuZGVkJztcblxuICAgICAgICAgIGlmIChzZWxmLl9yZXN1bWVBZnRlclN1c3BlbmQpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBzZWxmLl9yZXN1bWVBZnRlclN1c3BlbmQ7XG4gICAgICAgICAgICBzZWxmLl9hdXRvUmVzdW1lKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEVpdGhlciB0aGUgc3RhdGUgZ2V0cyBzdXNwZW5kZWQgb3IgaXQgaXMgaW50ZXJydXB0ZWQuXG4gICAgICAgIC8vIEVpdGhlciB3YXksIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSBzdGF0ZSB0byBzdXNwZW5kZWQuXG4gICAgICAgIHNlbGYuY3R4LnN1c3BlbmQoKS50aGVuKGhhbmRsZVN1c3BlbnNpb24sIGhhbmRsZVN1c3BlbnNpb24pO1xuICAgICAgfSwgMzAwMDApO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQXV0b21hdGljYWxseSByZXN1bWUgdGhlIFdlYiBBdWRpbyBBdWRpb0NvbnRleHQgd2hlbiBhIG5ldyBzb3VuZCBpcyBwbGF5ZWQuXG4gICAgICogQHJldHVybiB7SG93bGVyfVxuICAgICAqL1xuICAgIF9hdXRvUmVzdW1lOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgaWYgKCFzZWxmLmN0eCB8fCB0eXBlb2Ygc2VsZi5jdHgucmVzdW1lID09PSAndW5kZWZpbmVkJyB8fCAhSG93bGVyLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZi5zdGF0ZSA9PT0gJ3J1bm5pbmcnICYmIHNlbGYuY3R4LnN0YXRlICE9PSAnaW50ZXJydXB0ZWQnICYmIHNlbGYuX3N1c3BlbmRUaW1lcikge1xuICAgICAgICBjbGVhclRpbWVvdXQoc2VsZi5fc3VzcGVuZFRpbWVyKTtcbiAgICAgICAgc2VsZi5fc3VzcGVuZFRpbWVyID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcgfHwgc2VsZi5zdGF0ZSA9PT0gJ3J1bm5pbmcnICYmIHNlbGYuY3R4LnN0YXRlID09PSAnaW50ZXJydXB0ZWQnKSB7XG4gICAgICAgIHNlbGYuY3R4LnJlc3VtZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2VsZi5zdGF0ZSA9ICdydW5uaW5nJztcblxuICAgICAgICAgIC8vIEVtaXQgdG8gYWxsIEhvd2xzIHRoYXQgdGhlIGF1ZGlvIGhhcyByZXN1bWVkLlxuICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc2VsZi5faG93bHNbaV0uX2VtaXQoJ3Jlc3VtZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHNlbGYuX3N1c3BlbmRUaW1lcikge1xuICAgICAgICAgIGNsZWFyVGltZW91dChzZWxmLl9zdXNwZW5kVGltZXIpO1xuICAgICAgICAgIHNlbGYuX3N1c3BlbmRUaW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5zdGF0ZSA9PT0gJ3N1c3BlbmRpbmcnKSB7XG4gICAgICAgIHNlbGYuX3Jlc3VtZUFmdGVyU3VzcGVuZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cbiAgfTtcblxuICAvLyBTZXR1cCB0aGUgZ2xvYmFsIGF1ZGlvIGNvbnRyb2xsZXIuXG4gIHZhciBIb3dsZXIgPSBuZXcgSG93bGVyR2xvYmFsKCk7XG5cbiAgLyoqIEdyb3VwIE1ldGhvZHMgKiovXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBhdWRpbyBncm91cCBjb250cm9sbGVyLlxuICAgKiBAcGFyYW0ge09iamVjdH0gbyBQYXNzZWQgaW4gcHJvcGVydGllcyBmb3IgdGhpcyBncm91cC5cbiAgICovXG4gIHZhciBIb3dsID0gZnVuY3Rpb24obykge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFRocm93IGFuIGVycm9yIGlmIG5vIHNvdXJjZSBpcyBwcm92aWRlZC5cbiAgICBpZiAoIW8uc3JjIHx8IG8uc3JjLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5lcnJvcignQW4gYXJyYXkgb2Ygc291cmNlIGZpbGVzIG11c3QgYmUgcGFzc2VkIHdpdGggYW55IG5ldyBIb3dsLicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNlbGYuaW5pdChvKTtcbiAgfTtcbiAgSG93bC5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhIG5ldyBIb3dsIGdyb3VwIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG8gUGFzc2VkIGluIHByb3BlcnRpZXMgZm9yIHRoaXMgZ3JvdXAuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbihvKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gQXVkaW9Db250ZXh0IGNyZWF0ZWQgeWV0LCBydW4gdGhlIHNldHVwLlxuICAgICAgaWYgKCFIb3dsZXIuY3R4KSB7XG4gICAgICAgIHNldHVwQXVkaW9Db250ZXh0KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHVwIHVzZXItZGVmaW5lZCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gICAgICBzZWxmLl9hdXRvcGxheSA9IG8uYXV0b3BsYXkgfHwgZmFsc2U7XG4gICAgICBzZWxmLl9mb3JtYXQgPSAodHlwZW9mIG8uZm9ybWF0ICE9PSAnc3RyaW5nJykgPyBvLmZvcm1hdCA6IFtvLmZvcm1hdF07XG4gICAgICBzZWxmLl9odG1sNSA9IG8uaHRtbDUgfHwgZmFsc2U7XG4gICAgICBzZWxmLl9tdXRlZCA9IG8ubXV0ZSB8fCBmYWxzZTtcbiAgICAgIHNlbGYuX2xvb3AgPSBvLmxvb3AgfHwgZmFsc2U7XG4gICAgICBzZWxmLl9wb29sID0gby5wb29sIHx8IDU7XG4gICAgICBzZWxmLl9wcmVsb2FkID0gKHR5cGVvZiBvLnByZWxvYWQgPT09ICdib29sZWFuJyB8fCBvLnByZWxvYWQgPT09ICdtZXRhZGF0YScpID8gby5wcmVsb2FkIDogdHJ1ZTtcbiAgICAgIHNlbGYuX3JhdGUgPSBvLnJhdGUgfHwgMTtcbiAgICAgIHNlbGYuX3Nwcml0ZSA9IG8uc3ByaXRlIHx8IHt9O1xuICAgICAgc2VsZi5fc3JjID0gKHR5cGVvZiBvLnNyYyAhPT0gJ3N0cmluZycpID8gby5zcmMgOiBbby5zcmNdO1xuICAgICAgc2VsZi5fdm9sdW1lID0gby52b2x1bWUgIT09IHVuZGVmaW5lZCA/IG8udm9sdW1lIDogMTtcbiAgICAgIHNlbGYuX3hociA9IHtcbiAgICAgICAgbWV0aG9kOiBvLnhociAmJiBvLnhoci5tZXRob2QgPyBvLnhoci5tZXRob2QgOiAnR0VUJyxcbiAgICAgICAgaGVhZGVyczogby54aHIgJiYgby54aHIuaGVhZGVycyA/IG8ueGhyLmhlYWRlcnMgOiBudWxsLFxuICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IG8ueGhyICYmIG8ueGhyLndpdGhDcmVkZW50aWFscyA/IG8ueGhyLndpdGhDcmVkZW50aWFscyA6IGZhbHNlLFxuICAgICAgfTtcblxuICAgICAgLy8gU2V0dXAgYWxsIG90aGVyIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgICAgIHNlbGYuX2R1cmF0aW9uID0gMDtcbiAgICAgIHNlbGYuX3N0YXRlID0gJ3VubG9hZGVkJztcbiAgICAgIHNlbGYuX3NvdW5kcyA9IFtdO1xuICAgICAgc2VsZi5fZW5kVGltZXJzID0ge307XG4gICAgICBzZWxmLl9xdWV1ZSA9IFtdO1xuICAgICAgc2VsZi5fcGxheUxvY2sgPSBmYWxzZTtcblxuICAgICAgLy8gU2V0dXAgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgc2VsZi5fb25lbmQgPSBvLm9uZW5kID8gW3tmbjogby5vbmVuZH1dIDogW107XG4gICAgICBzZWxmLl9vbmZhZGUgPSBvLm9uZmFkZSA/IFt7Zm46IG8ub25mYWRlfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ubG9hZCA9IG8ub25sb2FkID8gW3tmbjogby5vbmxvYWR9XSA6IFtdO1xuICAgICAgc2VsZi5fb25sb2FkZXJyb3IgPSBvLm9ubG9hZGVycm9yID8gW3tmbjogby5vbmxvYWRlcnJvcn1dIDogW107XG4gICAgICBzZWxmLl9vbnBsYXllcnJvciA9IG8ub25wbGF5ZXJyb3IgPyBbe2ZuOiBvLm9ucGxheWVycm9yfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ucGF1c2UgPSBvLm9ucGF1c2UgPyBbe2ZuOiBvLm9ucGF1c2V9XSA6IFtdO1xuICAgICAgc2VsZi5fb25wbGF5ID0gby5vbnBsYXkgPyBbe2ZuOiBvLm9ucGxheX1dIDogW107XG4gICAgICBzZWxmLl9vbnN0b3AgPSBvLm9uc3RvcCA/IFt7Zm46IG8ub25zdG9wfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ubXV0ZSA9IG8ub25tdXRlID8gW3tmbjogby5vbm11dGV9XSA6IFtdO1xuICAgICAgc2VsZi5fb252b2x1bWUgPSBvLm9udm9sdW1lID8gW3tmbjogby5vbnZvbHVtZX1dIDogW107XG4gICAgICBzZWxmLl9vbnJhdGUgPSBvLm9ucmF0ZSA/IFt7Zm46IG8ub25yYXRlfV0gOiBbXTtcbiAgICAgIHNlbGYuX29uc2VlayA9IG8ub25zZWVrID8gW3tmbjogby5vbnNlZWt9XSA6IFtdO1xuICAgICAgc2VsZi5fb251bmxvY2sgPSBvLm9udW5sb2NrID8gW3tmbjogby5vbnVubG9ja31dIDogW107XG4gICAgICBzZWxmLl9vbnJlc3VtZSA9IFtdO1xuXG4gICAgICAvLyBXZWIgQXVkaW8gb3IgSFRNTDUgQXVkaW8/XG4gICAgICBzZWxmLl93ZWJBdWRpbyA9IEhvd2xlci51c2luZ1dlYkF1ZGlvICYmICFzZWxmLl9odG1sNTtcblxuICAgICAgLy8gQXV0b21hdGljYWxseSB0cnkgdG8gZW5hYmxlIGF1ZGlvLlxuICAgICAgaWYgKHR5cGVvZiBIb3dsZXIuY3R4ICE9PSAndW5kZWZpbmVkJyAmJiBIb3dsZXIuY3R4ICYmIEhvd2xlci5hdXRvVW5sb2NrKSB7XG4gICAgICAgIEhvd2xlci5fdW5sb2NrQXVkaW8oKTtcbiAgICAgIH1cblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGlzIEhvd2wgZ3JvdXAgaW4gdGhlIGdsb2JhbCBjb250cm9sbGVyLlxuICAgICAgSG93bGVyLl9ob3dscy5wdXNoKHNlbGYpO1xuXG4gICAgICAvLyBJZiB0aGV5IHNlbGVjdGVkIGF1dG9wbGF5LCBhZGQgYSBwbGF5IGV2ZW50IHRvIHRoZSBsb2FkIHF1ZXVlLlxuICAgICAgaWYgKHNlbGYuX2F1dG9wbGF5KSB7XG4gICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGV2ZW50OiAncGxheScsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYucGxheSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIExvYWQgdGhlIHNvdXJjZSBmaWxlIHVubGVzcyBvdGhlcndpc2Ugc3BlY2lmaWVkLlxuICAgICAgaWYgKHNlbGYuX3ByZWxvYWQgJiYgc2VsZi5fcHJlbG9hZCAhPT0gJ25vbmUnKSB7XG4gICAgICAgIHNlbGYubG9hZCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTG9hZCB0aGUgYXVkaW8gZmlsZS5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgbG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgdXJsID0gbnVsbDtcblxuICAgICAgLy8gSWYgbm8gYXVkaW8gaXMgYXZhaWxhYmxlLCBxdWl0IGltbWVkaWF0ZWx5LlxuICAgICAgaWYgKEhvd2xlci5ub0F1ZGlvKSB7XG4gICAgICAgIHNlbGYuX2VtaXQoJ2xvYWRlcnJvcicsIG51bGwsICdObyBhdWRpbyBzdXBwb3J0LicpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIE1ha2Ugc3VyZSBvdXIgc291cmNlIGlzIGluIGFuIGFycmF5LlxuICAgICAgaWYgKHR5cGVvZiBzZWxmLl9zcmMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHNlbGYuX3NyYyA9IFtzZWxmLl9zcmNdO1xuICAgICAgfVxuXG4gICAgICAvLyBMb29wIHRocm91Z2ggdGhlIHNvdXJjZXMgYW5kIHBpY2sgdGhlIGZpcnN0IG9uZSB0aGF0IGlzIGNvbXBhdGlibGUuXG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5fc3JjLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBleHQsIHN0cjtcblxuICAgICAgICBpZiAoc2VsZi5fZm9ybWF0ICYmIHNlbGYuX2Zvcm1hdFtpXSkge1xuICAgICAgICAgIC8vIElmIGFuIGV4dGVuc2lvbiB3YXMgc3BlY2lmaWVkLCB1c2UgdGhhdCBpbnN0ZWFkLlxuICAgICAgICAgIGV4dCA9IHNlbGYuX2Zvcm1hdFtpXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIHNvdXJjZSBpcyBhIHN0cmluZy5cbiAgICAgICAgICBzdHIgPSBzZWxmLl9zcmNbaV07XG4gICAgICAgICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBzZWxmLl9lbWl0KCdsb2FkZXJyb3InLCBudWxsLCAnTm9uLXN0cmluZyBmb3VuZCBpbiBzZWxlY3RlZCBhdWRpbyBzb3VyY2VzIC0gaWdub3JpbmcuJyk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBFeHRyYWN0IHRoZSBmaWxlIGV4dGVuc2lvbiBmcm9tIHRoZSBVUkwgb3IgYmFzZTY0IGRhdGEgVVJJLlxuICAgICAgICAgIGV4dCA9IC9eZGF0YTphdWRpb1xcLyhbXjssXSspOy9pLmV4ZWMoc3RyKTtcbiAgICAgICAgICBpZiAoIWV4dCkge1xuICAgICAgICAgICAgZXh0ID0gL1xcLihbXi5dKykkLy5leGVjKHN0ci5zcGxpdCgnPycsIDEpWzBdKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZXh0KSB7XG4gICAgICAgICAgICBleHQgPSBleHRbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMb2cgYSB3YXJuaW5nIGlmIG5vIGV4dGVuc2lvbiB3YXMgZm91bmQuXG4gICAgICAgIGlmICghZXh0KSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdObyBmaWxlIGV4dGVuc2lvbiB3YXMgZm91bmQuIENvbnNpZGVyIHVzaW5nIHRoZSBcImZvcm1hdFwiIHByb3BlcnR5IG9yIHNwZWNpZnkgYW4gZXh0ZW5zaW9uLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhpcyBleHRlbnNpb24gaXMgYXZhaWxhYmxlLlxuICAgICAgICBpZiAoZXh0ICYmIEhvd2xlci5jb2RlY3MoZXh0KSkge1xuICAgICAgICAgIHVybCA9IHNlbGYuX3NyY1tpXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXVybCkge1xuICAgICAgICBzZWxmLl9lbWl0KCdsb2FkZXJyb3InLCBudWxsLCAnTm8gY29kZWMgc3VwcG9ydCBmb3Igc2VsZWN0ZWQgYXVkaW8gc291cmNlcy4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxmLl9zcmMgPSB1cmw7XG4gICAgICBzZWxmLl9zdGF0ZSA9ICdsb2FkaW5nJztcblxuICAgICAgLy8gSWYgdGhlIGhvc3RpbmcgcGFnZSBpcyBIVFRQUyBhbmQgdGhlIHNvdXJjZSBpc24ndCxcbiAgICAgIC8vIGRyb3AgZG93biB0byBIVE1MNSBBdWRpbyB0byBhdm9pZCBNaXhlZCBDb250ZW50IGVycm9ycy5cbiAgICAgIGlmICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonICYmIHVybC5zbGljZSgwLCA1KSA9PT0gJ2h0dHA6Jykge1xuICAgICAgICBzZWxmLl9odG1sNSA9IHRydWU7XG4gICAgICAgIHNlbGYuX3dlYkF1ZGlvID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSBhIG5ldyBzb3VuZCBvYmplY3QgYW5kIGFkZCBpdCB0byB0aGUgcG9vbC5cbiAgICAgIG5ldyBTb3VuZChzZWxmKTtcblxuICAgICAgLy8gTG9hZCBhbmQgZGVjb2RlIHRoZSBhdWRpbyBkYXRhIGZvciBwbGF5YmFjay5cbiAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICBsb2FkQnVmZmVyKHNlbGYpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGxheSBhIHNvdW5kIG9yIHJlc3VtZSBwcmV2aW91cyBwbGF5YmFjay5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmcvTnVtYmVyfSBzcHJpdGUgICBTcHJpdGUgbmFtZSBmb3Igc3ByaXRlIHBsYXliYWNrIG9yIHNvdW5kIGlkIHRvIGNvbnRpbnVlIHByZXZpb3VzLlxuICAgICAqIEBwYXJhbSAge0Jvb2xlYW59IGludGVybmFsIEludGVybmFsIFVzZTogdHJ1ZSBwcmV2ZW50cyBldmVudCBmaXJpbmcuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSAgICAgICAgICBTb3VuZCBJRC5cbiAgICAgKi9cbiAgICBwbGF5OiBmdW5jdGlvbihzcHJpdGUsIGludGVybmFsKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgaWQgPSBudWxsO1xuXG4gICAgICAvLyBEZXRlcm1pbmUgaWYgYSBzcHJpdGUsIHNvdW5kIGlkIG9yIG5vdGhpbmcgd2FzIHBhc3NlZFxuICAgICAgaWYgKHR5cGVvZiBzcHJpdGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gc3ByaXRlO1xuICAgICAgICBzcHJpdGUgPSBudWxsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc3ByaXRlID09PSAnc3RyaW5nJyAmJiBzZWxmLl9zdGF0ZSA9PT0gJ2xvYWRlZCcgJiYgIXNlbGYuX3Nwcml0ZVtzcHJpdGVdKSB7XG4gICAgICAgIC8vIElmIHRoZSBwYXNzZWQgc3ByaXRlIGRvZXNuJ3QgZXhpc3QsIGRvIG5vdGhpbmcuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc3ByaXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBVc2UgdGhlIGRlZmF1bHQgc291bmQgc3ByaXRlIChwbGF5cyB0aGUgZnVsbCBhdWRpbyBsZW5ndGgpLlxuICAgICAgICBzcHJpdGUgPSAnX19kZWZhdWx0JztcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIHNpbmdsZSBwYXVzZWQgc291bmQgdGhhdCBpc24ndCBlbmRlZC5cbiAgICAgICAgLy8gSWYgdGhlcmUgaXMsIHBsYXkgdGhhdCBzb3VuZC4gSWYgbm90LCBjb250aW51ZSBhcyB1c3VhbC5cbiAgICAgICAgaWYgKCFzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICAgIHZhciBudW0gPSAwO1xuICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9zb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChzZWxmLl9zb3VuZHNbaV0uX3BhdXNlZCAmJiAhc2VsZi5fc291bmRzW2ldLl9lbmRlZCkge1xuICAgICAgICAgICAgICBudW0rKztcbiAgICAgICAgICAgICAgaWQgPSBzZWxmLl9zb3VuZHNbaV0uX2lkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChudW0gPT09IDEpIHtcbiAgICAgICAgICAgIHNwcml0ZSA9IG51bGw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlkID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHRoZSBzZWxlY3RlZCBub2RlLCBvciBnZXQgb25lIGZyb20gdGhlIHBvb2wuXG4gICAgICB2YXIgc291bmQgPSBpZCA/IHNlbGYuX3NvdW5kQnlJZChpZCkgOiBzZWxmLl9pbmFjdGl2ZVNvdW5kKCk7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBkb2Vzbid0IGV4aXN0LCBkbyBub3RoaW5nLlxuICAgICAgaWYgKCFzb3VuZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gU2VsZWN0IHRoZSBzcHJpdGUgZGVmaW5pdGlvbi5cbiAgICAgIGlmIChpZCAmJiAhc3ByaXRlKSB7XG4gICAgICAgIHNwcml0ZSA9IHNvdW5kLl9zcHJpdGUgfHwgJ19fZGVmYXVsdCc7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCB3ZSBtdXN0IHdhaXQgdG8gZ2V0IHRoZSBhdWRpbydzIGR1cmF0aW9uLlxuICAgICAgLy8gV2UgYWxzbyBuZWVkIHRvIHdhaXQgdG8gbWFrZSBzdXJlIHdlIGRvbid0IHJ1biBpbnRvIHJhY2UgY29uZGl0aW9ucyB3aXRoXG4gICAgICAvLyB0aGUgb3JkZXIgb2YgZnVuY3Rpb24gY2FsbHMuXG4gICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnKSB7XG4gICAgICAgIC8vIFNldCB0aGUgc3ByaXRlIHZhbHVlIG9uIHRoaXMgc291bmQuXG4gICAgICAgIHNvdW5kLl9zcHJpdGUgPSBzcHJpdGU7XG5cbiAgICAgICAgLy8gTWFyayB0aGlzIHNvdW5kIGFzIG5vdCBlbmRlZCBpbiBjYXNlIGFub3RoZXIgc291bmQgaXMgcGxheWVkIGJlZm9yZSB0aGlzIG9uZSBsb2Fkcy5cbiAgICAgICAgc291bmQuX2VuZGVkID0gZmFsc2U7XG5cbiAgICAgICAgLy8gQWRkIHRoZSBzb3VuZCB0byB0aGUgcXVldWUgdG8gYmUgcGxheWVkIG9uIGxvYWQuXG4gICAgICAgIHZhciBzb3VuZElkID0gc291bmQuX2lkO1xuICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICBldmVudDogJ3BsYXknLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnBsYXkoc291bmRJZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc291bmRJZDtcbiAgICAgIH1cblxuICAgICAgLy8gRG9uJ3QgcGxheSB0aGUgc291bmQgaWYgYW4gaWQgd2FzIHBhc3NlZCBhbmQgaXQgaXMgYWxyZWFkeSBwbGF5aW5nLlxuICAgICAgaWYgKGlkICYmICFzb3VuZC5fcGF1c2VkKSB7XG4gICAgICAgIC8vIFRyaWdnZXIgdGhlIHBsYXkgZXZlbnQsIGluIG9yZGVyIHRvIGtlZXAgaXRlcmF0aW5nIHRocm91Z2ggcXVldWUuXG4gICAgICAgIGlmICghaW50ZXJuYWwpIHtcbiAgICAgICAgICBzZWxmLl9sb2FkUXVldWUoJ3BsYXknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VuZC5faWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgQXVkaW9Db250ZXh0IGlzbid0IHN1c3BlbmRlZCwgYW5kIHJlc3VtZSBpdCBpZiBpdCBpcy5cbiAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICBIb3dsZXIuX2F1dG9SZXN1bWUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZXJtaW5lIGhvdyBsb25nIHRvIHBsYXkgZm9yIGFuZCB3aGVyZSB0byBzdGFydCBwbGF5aW5nLlxuICAgICAgdmFyIHNlZWsgPSBNYXRoLm1heCgwLCBzb3VuZC5fc2VlayA+IDAgPyBzb3VuZC5fc2VlayA6IHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzBdIC8gMTAwMCk7XG4gICAgICB2YXIgZHVyYXRpb24gPSBNYXRoLm1heCgwLCAoKHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzBdICsgc2VsZi5fc3ByaXRlW3Nwcml0ZV1bMV0pIC8gMTAwMCkgLSBzZWVrKTtcbiAgICAgIHZhciB0aW1lb3V0ID0gKGR1cmF0aW9uICogMTAwMCkgLyBNYXRoLmFicyhzb3VuZC5fcmF0ZSk7XG4gICAgICB2YXIgc3RhcnQgPSBzZWxmLl9zcHJpdGVbc3ByaXRlXVswXSAvIDEwMDA7XG4gICAgICB2YXIgc3RvcCA9IChzZWxmLl9zcHJpdGVbc3ByaXRlXVswXSArIHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzFdKSAvIDEwMDA7XG4gICAgICBzb3VuZC5fc3ByaXRlID0gc3ByaXRlO1xuXG4gICAgICAvLyBNYXJrIHRoZSBzb3VuZCBhcyBlbmRlZCBpbnN0YW50bHkgc28gdGhhdCB0aGlzIGFzeW5jIHBsYXliYWNrXG4gICAgICAvLyBkb2Vzbid0IGdldCBncmFiYmVkIGJ5IGFub3RoZXIgY2FsbCB0byBwbGF5IHdoaWxlIHRoaXMgb25lIHdhaXRzIHRvIHN0YXJ0LlxuICAgICAgc291bmQuX2VuZGVkID0gZmFsc2U7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgcGFyYW1ldGVycyBvZiB0aGUgc291bmQuXG4gICAgICB2YXIgc2V0UGFyYW1zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNvdW5kLl9wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgc291bmQuX3NlZWsgPSBzZWVrO1xuICAgICAgICBzb3VuZC5fc3RhcnQgPSBzdGFydDtcbiAgICAgICAgc291bmQuX3N0b3AgPSBzdG9wO1xuICAgICAgICBzb3VuZC5fbG9vcCA9ICEhKHNvdW5kLl9sb29wIHx8IHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzJdKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEVuZCB0aGUgc291bmQgaW5zdGFudGx5IGlmIHNlZWsgaXMgYXQgdGhlIGVuZC5cbiAgICAgIGlmIChzZWVrID49IHN0b3ApIHtcbiAgICAgICAgc2VsZi5fZW5kZWQoc291bmQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEJlZ2luIHRoZSBhY3R1YWwgcGxheWJhY2suXG4gICAgICB2YXIgbm9kZSA9IHNvdW5kLl9ub2RlO1xuICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgIC8vIEZpcmUgdGhpcyB3aGVuIHRoZSBzb3VuZCBpcyByZWFkeSB0byBwbGF5IHRvIGJlZ2luIFdlYiBBdWRpbyBwbGF5YmFjay5cbiAgICAgICAgdmFyIHBsYXlXZWJBdWRpbyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gZmFsc2U7XG4gICAgICAgICAgc2V0UGFyYW1zKCk7XG4gICAgICAgICAgc2VsZi5fcmVmcmVzaEJ1ZmZlcihzb3VuZCk7XG5cbiAgICAgICAgICAvLyBTZXR1cCB0aGUgcGxheWJhY2sgcGFyYW1zLlxuICAgICAgICAgIHZhciB2b2wgPSAoc291bmQuX211dGVkIHx8IHNlbGYuX211dGVkKSA/IDAgOiBzb3VuZC5fdm9sdW1lO1xuICAgICAgICAgIG5vZGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZSh2b2wsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgIHNvdW5kLl9wbGF5U3RhcnQgPSBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgICAgLy8gUGxheSB0aGUgc291bmQgdXNpbmcgdGhlIHN1cHBvcnRlZCBtZXRob2QuXG4gICAgICAgICAgaWYgKHR5cGVvZiBub2RlLmJ1ZmZlclNvdXJjZS5zdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHNvdW5kLl9sb29wID8gbm9kZS5idWZmZXJTb3VyY2Uubm90ZUdyYWluT24oMCwgc2VlaywgODY0MDApIDogbm9kZS5idWZmZXJTb3VyY2Uubm90ZUdyYWluT24oMCwgc2VlaywgZHVyYXRpb24pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VuZC5fbG9vcCA/IG5vZGUuYnVmZmVyU291cmNlLnN0YXJ0KDAsIHNlZWssIDg2NDAwKSA6IG5vZGUuYnVmZmVyU291cmNlLnN0YXJ0KDAsIHNlZWssIGR1cmF0aW9uKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTdGFydCBhIG5ldyB0aW1lciBpZiBub25lIGlzIHByZXNlbnQuXG4gICAgICAgICAgaWYgKHRpbWVvdXQgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSA9IHNldFRpbWVvdXQoc2VsZi5fZW5kZWQuYmluZChzZWxmLCBzb3VuZCksIHRpbWVvdXQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaW50ZXJuYWwpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3BsYXknLCBzb3VuZC5faWQpO1xuICAgICAgICAgICAgICBzZWxmLl9sb2FkUXVldWUoKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoSG93bGVyLnN0YXRlID09PSAncnVubmluZycgJiYgSG93bGVyLmN0eC5zdGF0ZSAhPT0gJ2ludGVycnVwdGVkJykge1xuICAgICAgICAgIHBsYXlXZWJBdWRpbygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIFdhaXQgZm9yIHRoZSBhdWRpbyBjb250ZXh0IHRvIHJlc3VtZSBiZWZvcmUgcGxheWluZy5cbiAgICAgICAgICBzZWxmLm9uY2UoJ3Jlc3VtZScsIHBsYXlXZWJBdWRpbyk7XG5cbiAgICAgICAgICAvLyBDYW5jZWwgdGhlIGVuZCB0aW1lci5cbiAgICAgICAgICBzZWxmLl9jbGVhclRpbWVyKHNvdW5kLl9pZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZpcmUgdGhpcyB3aGVuIHRoZSBzb3VuZCBpcyByZWFkeSB0byBwbGF5IHRvIGJlZ2luIEhUTUw1IEF1ZGlvIHBsYXliYWNrLlxuICAgICAgICB2YXIgcGxheUh0bWw1ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbm9kZS5jdXJyZW50VGltZSA9IHNlZWs7XG4gICAgICAgICAgbm9kZS5tdXRlZCA9IHNvdW5kLl9tdXRlZCB8fCBzZWxmLl9tdXRlZCB8fCBIb3dsZXIuX211dGVkIHx8IG5vZGUubXV0ZWQ7XG4gICAgICAgICAgbm9kZS52b2x1bWUgPSBzb3VuZC5fdm9sdW1lICogSG93bGVyLnZvbHVtZSgpO1xuICAgICAgICAgIG5vZGUucGxheWJhY2tSYXRlID0gc291bmQuX3JhdGU7XG5cbiAgICAgICAgICAvLyBTb21lIGJyb3dzZXJzIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhpcyBpcyBjYWxsZWQgd2l0aG91dCB1c2VyIGludGVyYWN0aW9uLlxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcGxheSA9IG5vZGUucGxheSgpO1xuXG4gICAgICAgICAgICAvLyBTdXBwb3J0IG9sZGVyIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcm9taXNlcywgYW5kIHRodXMgZG9uJ3QgaGF2ZSB0aGlzIGlzc3VlLlxuICAgICAgICAgICAgaWYgKHBsYXkgJiYgdHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnICYmIChwbGF5IGluc3RhbmNlb2YgUHJvbWlzZSB8fCB0eXBlb2YgcGxheS50aGVuID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICAvLyBJbXBsZW1lbnRzIGEgbG9jayB0byBwcmV2ZW50IERPTUV4Y2VwdGlvbjogVGhlIHBsYXkoKSByZXF1ZXN0IHdhcyBpbnRlcnJ1cHRlZCBieSBhIGNhbGwgdG8gcGF1c2UoKS5cbiAgICAgICAgICAgICAgc2VsZi5fcGxheUxvY2sgPSB0cnVlO1xuXG4gICAgICAgICAgICAgIC8vIFNldCBwYXJhbSB2YWx1ZXMgaW1tZWRpYXRlbHkuXG4gICAgICAgICAgICAgIHNldFBhcmFtcygpO1xuXG4gICAgICAgICAgICAgIC8vIFJlbGVhc2VzIHRoZSBsb2NrIGFuZCBleGVjdXRlcyBxdWV1ZWQgYWN0aW9ucy5cbiAgICAgICAgICAgICAgcGxheVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgc2VsZi5fcGxheUxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIG5vZGUuX3VubG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIGlmICghaW50ZXJuYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZW1pdCgncGxheScsIHNvdW5kLl9pZCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2FkUXVldWUoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBzZWxmLl9lbWl0KCdwbGF5ZXJyb3InLCBzb3VuZC5faWQsICdQbGF5YmFjayB3YXMgdW5hYmxlIHRvIHN0YXJ0LiBUaGlzIGlzIG1vc3QgY29tbW9ubHkgYW4gaXNzdWUgJyArXG4gICAgICAgICAgICAgICAgICAgICdvbiBtb2JpbGUgZGV2aWNlcyBhbmQgQ2hyb21lIHdoZXJlIHBsYXliYWNrIHdhcyBub3Qgd2l0aGluIGEgdXNlciBpbnRlcmFjdGlvbi4nKTtcblxuICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGVuZGVkIGFuZCBwYXVzZWQgdmFsdWVzLlxuICAgICAgICAgICAgICAgICAgc291bmQuX2VuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIHNvdW5kLl9wYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghaW50ZXJuYWwpIHtcbiAgICAgICAgICAgICAgc2VsZi5fcGxheUxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgc2V0UGFyYW1zKCk7XG4gICAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3BsYXknLCBzb3VuZC5faWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZXR0aW5nIHJhdGUgYmVmb3JlIHBsYXlpbmcgd29uJ3Qgd29yayBpbiBJRSwgc28gd2Ugc2V0IGl0IGFnYWluIGhlcmUuXG4gICAgICAgICAgICBub2RlLnBsYXliYWNrUmF0ZSA9IHNvdW5kLl9yYXRlO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGUgbm9kZSBpcyBzdGlsbCBwYXVzZWQsIHRoZW4gd2UgY2FuIGFzc3VtZSB0aGVyZSB3YXMgYSBwbGF5YmFjayBpc3N1ZS5cbiAgICAgICAgICAgIGlmIChub2RlLnBhdXNlZCkge1xuICAgICAgICAgICAgICBzZWxmLl9lbWl0KCdwbGF5ZXJyb3InLCBzb3VuZC5faWQsICdQbGF5YmFjayB3YXMgdW5hYmxlIHRvIHN0YXJ0LiBUaGlzIGlzIG1vc3QgY29tbW9ubHkgYW4gaXNzdWUgJyArXG4gICAgICAgICAgICAgICAgJ29uIG1vYmlsZSBkZXZpY2VzIGFuZCBDaHJvbWUgd2hlcmUgcGxheWJhY2sgd2FzIG5vdCB3aXRoaW4gYSB1c2VyIGludGVyYWN0aW9uLicpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNldHVwIHRoZSBlbmQgdGltZXIgb24gc3ByaXRlcyBvciBsaXN0ZW4gZm9yIHRoZSBlbmRlZCBldmVudC5cbiAgICAgICAgICAgIGlmIChzcHJpdGUgIT09ICdfX2RlZmF1bHQnIHx8IHNvdW5kLl9sb29wKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2VuZFRpbWVyc1tzb3VuZC5faWRdID0gc2V0VGltZW91dChzZWxmLl9lbmRlZC5iaW5kKHNlbGYsIHNvdW5kKSwgdGltZW91dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIEZpcmUgZW5kZWQgb24gdGhpcyBhdWRpbyBub2RlLlxuICAgICAgICAgICAgICAgIHNlbGYuX2VuZGVkKHNvdW5kKTtcblxuICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoaXMgbGlzdGVuZXIuXG4gICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlbmRlZCcsIHNlbGYuX2VuZFRpbWVyc1tzb3VuZC5faWRdLCBmYWxzZSk7XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgc2VsZi5fZW1pdCgncGxheWVycm9yJywgc291bmQuX2lkLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB0aGlzIGlzIHN0cmVhbWluZyBhdWRpbywgbWFrZSBzdXJlIHRoZSBzcmMgaXMgc2V0IGFuZCBsb2FkIGFnYWluLlxuICAgICAgICBpZiAobm9kZS5zcmMgPT09ICdkYXRhOmF1ZGlvL3dhdjtiYXNlNjQsVWtsR1JpZ0FBQUJYUVZaRlptMTBJQklBQUFBQkFBRUFSS3dBQUloWUFRQUNBQkFBQUFCa1lYUmhBZ0FBQUFFQScpIHtcbiAgICAgICAgICBub2RlLnNyYyA9IHNlbGYuX3NyYztcbiAgICAgICAgICBub2RlLmxvYWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBsYXkgaW1tZWRpYXRlbHkgaWYgcmVhZHksIG9yIHdhaXQgZm9yIHRoZSAnY2FucGxheXRocm91Z2gnZSB2ZW50LlxuICAgICAgICB2YXIgbG9hZGVkTm9SZWFkeVN0YXRlID0gKHdpbmRvdyAmJiB3aW5kb3cuZWplY3RhKSB8fCAoIW5vZGUucmVhZHlTdGF0ZSAmJiBIb3dsZXIuX25hdmlnYXRvci5pc0NvY29vbkpTKTtcbiAgICAgICAgaWYgKG5vZGUucmVhZHlTdGF0ZSA+PSAzIHx8IGxvYWRlZE5vUmVhZHlTdGF0ZSkge1xuICAgICAgICAgIHBsYXlIdG1sNSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gdHJ1ZTtcbiAgICAgICAgICBzZWxmLl9zdGF0ZSA9ICdsb2FkaW5nJztcblxuICAgICAgICAgIHZhciBsaXN0ZW5lciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5fc3RhdGUgPSAnbG9hZGVkJztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQmVnaW4gcGxheWJhY2suXG4gICAgICAgICAgICBwbGF5SHRtbDUoKTtcblxuICAgICAgICAgICAgLy8gQ2xlYXIgdGhpcyBsaXN0ZW5lci5cbiAgICAgICAgICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihIb3dsZXIuX2NhblBsYXlFdmVudCwgbGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihIb3dsZXIuX2NhblBsYXlFdmVudCwgbGlzdGVuZXIsIGZhbHNlKTtcblxuICAgICAgICAgIC8vIENhbmNlbCB0aGUgZW5kIHRpbWVyLlxuICAgICAgICAgIHNlbGYuX2NsZWFyVGltZXIoc291bmQuX2lkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc291bmQuX2lkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQYXVzZSBwbGF5YmFjayBhbmQgc2F2ZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgVGhlIHNvdW5kIElEIChlbXB0eSB0byBwYXVzZSBhbGwgaW4gZ3JvdXApLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgcGF1c2U6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkIG9yIGEgcGxheSgpIHByb21pc2UgaXMgcGVuZGluZywgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIHBhdXNlIHdoZW4gY2FwYWJsZS5cbiAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcgfHwgc2VsZi5fcGxheUxvY2spIHtcbiAgICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgICAgZXZlbnQ6ICdwYXVzZScsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYucGF1c2UoaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIGlkIGlzIHBhc3NlZCwgZ2V0IGFsbCBJRCdzIHRvIGJlIHBhdXNlZC5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIGVuZCB0aW1lci5cbiAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihpZHNbaV0pO1xuXG4gICAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICAgIGlmIChzb3VuZCAmJiAhc291bmQuX3BhdXNlZCkge1xuICAgICAgICAgIC8vIFJlc2V0IHRoZSBzZWVrIHBvc2l0aW9uLlxuICAgICAgICAgIHNvdW5kLl9zZWVrID0gc2VsZi5zZWVrKGlkc1tpXSk7XG4gICAgICAgICAgc291bmQuX3JhdGVTZWVrID0gMDtcbiAgICAgICAgICBzb3VuZC5fcGF1c2VkID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIFN0b3AgY3VycmVudGx5IHJ1bm5pbmcgZmFkZXMuXG4gICAgICAgICAgc2VsZi5fc3RvcEZhZGUoaWRzW2ldKTtcblxuICAgICAgICAgIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgc291bmQgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgICAgICAgICAgaWYgKCFzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh0eXBlb2Ygc291bmQuX25vZGUuYnVmZmVyU291cmNlLnN0b3AgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLm5vdGVPZmYoMCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLnN0b3AoMCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBDbGVhbiB1cCB0aGUgYnVmZmVyIHNvdXJjZS5cbiAgICAgICAgICAgICAgc2VsZi5fY2xlYW5CdWZmZXIoc291bmQuX25vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghaXNOYU4oc291bmQuX25vZGUuZHVyYXRpb24pIHx8IHNvdW5kLl9ub2RlLmR1cmF0aW9uID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5wYXVzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpcmUgdGhlIHBhdXNlIGV2ZW50LCB1bmxlc3MgYHRydWVgIGlzIHBhc3NlZCBhcyB0aGUgMm5kIGFyZ3VtZW50LlxuICAgICAgICBpZiAoIWFyZ3VtZW50c1sxXSkge1xuICAgICAgICAgIHNlbGYuX2VtaXQoJ3BhdXNlJywgc291bmQgPyBzb3VuZC5faWQgOiBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcCBwbGF5YmFjayBhbmQgcmVzZXQgdG8gc3RhcnQuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBUaGUgc291bmQgSUQgKGVtcHR5IHRvIHN0b3AgYWxsIGluIGdyb3VwKS5cbiAgICAgKiBAcGFyYW0gIHtCb29sZWFufSBpbnRlcm5hbCBJbnRlcm5hbCBVc2U6IHRydWUgcHJldmVudHMgZXZlbnQgZmlyaW5nLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24oaWQsIGludGVybmFsKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gc3RvcCB3aGVuIGNhcGFibGUuXG4gICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnIHx8IHNlbGYuX3BsYXlMb2NrKSB7XG4gICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGV2ZW50OiAnc3RvcCcsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuc3RvcChpZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gaWQgaXMgcGFzc2VkLCBnZXQgYWxsIElEJ3MgdG8gYmUgc3RvcHBlZC5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIGVuZCB0aW1lci5cbiAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihpZHNbaV0pO1xuXG4gICAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICAgIC8vIFJlc2V0IHRoZSBzZWVrIHBvc2l0aW9uLlxuICAgICAgICAgIHNvdW5kLl9zZWVrID0gc291bmQuX3N0YXJ0IHx8IDA7XG4gICAgICAgICAgc291bmQuX3JhdGVTZWVrID0gMDtcbiAgICAgICAgICBzb3VuZC5fcGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICBzb3VuZC5fZW5kZWQgPSB0cnVlO1xuXG4gICAgICAgICAgLy8gU3RvcCBjdXJyZW50bHkgcnVubmluZyBmYWRlcy5cbiAgICAgICAgICBzZWxmLl9zdG9wRmFkZShpZHNbaV0pO1xuXG4gICAgICAgICAgaWYgKHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBzb3VuZCdzIEF1ZGlvQnVmZmVyU291cmNlTm9kZSBoYXMgYmVlbiBjcmVhdGVkLlxuICAgICAgICAgICAgICBpZiAoc291bmQuX25vZGUuYnVmZmVyU291cmNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2Uuc3RvcCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5ub3RlT2ZmKDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2Uuc3RvcCgwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBDbGVhbiB1cCB0aGUgYnVmZmVyIHNvdXJjZS5cbiAgICAgICAgICAgICAgICBzZWxmLl9jbGVhbkJ1ZmZlcihzb3VuZC5fbm9kZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWlzTmFOKHNvdW5kLl9ub2RlLmR1cmF0aW9uKSB8fCBzb3VuZC5fbm9kZS5kdXJhdGlvbiA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUuY3VycmVudFRpbWUgPSBzb3VuZC5fc3RhcnQgfHwgMDtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUucGF1c2UoKTtcblxuICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgbGl2ZSBzdHJlYW0sIHN0b3AgZG93bmxvYWQgb25jZSB0aGUgYXVkaW8gaXMgc3RvcHBlZC5cbiAgICAgICAgICAgICAgaWYgKHNvdW5kLl9ub2RlLmR1cmF0aW9uID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgICAgIHNlbGYuX2NsZWFyU291bmQoc291bmQuX25vZGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFpbnRlcm5hbCkge1xuICAgICAgICAgICAgc2VsZi5fZW1pdCgnc3RvcCcsIHNvdW5kLl9pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNdXRlL3VubXV0ZSBhIHNpbmdsZSBzb3VuZCBvciBhbGwgc291bmRzIGluIHRoaXMgSG93bCBncm91cC5cbiAgICAgKiBAcGFyYW0gIHtCb29sZWFufSBtdXRlZCBTZXQgdG8gdHJ1ZSB0byBtdXRlIGFuZCBmYWxzZSB0byB1bm11dGUuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCAgICBUaGUgc291bmQgSUQgdG8gdXBkYXRlIChvbWl0IHRvIG11dGUvdW5tdXRlIGFsbCkuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBtdXRlOiBmdW5jdGlvbihtdXRlZCwgaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBtdXRlIHdoZW4gY2FwYWJsZS5cbiAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCd8fCBzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICBldmVudDogJ211dGUnLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLm11dGUobXV0ZWQsIGlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBhcHBseWluZyBtdXRlL3VubXV0ZSB0byBhbGwgc291bmRzLCB1cGRhdGUgdGhlIGdyb3VwJ3MgdmFsdWUuXG4gICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAodHlwZW9mIG11dGVkID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICBzZWxmLl9tdXRlZCA9IG11dGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzZWxmLl9tdXRlZDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBpZCBpcyBwYXNzZWQsIGdldCBhbGwgSUQncyB0byBiZSBtdXRlZC5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gR2V0IHRoZSBzb3VuZC5cbiAgICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkc1tpXSk7XG5cbiAgICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgICAgc291bmQuX211dGVkID0gbXV0ZWQ7XG5cbiAgICAgICAgICAvLyBDYW5jZWwgYWN0aXZlIGZhZGUgYW5kIHNldCB0aGUgdm9sdW1lIHRvIHRoZSBlbmQgdmFsdWUuXG4gICAgICAgICAgaWYgKHNvdW5kLl9pbnRlcnZhbCkge1xuICAgICAgICAgICAgc2VsZi5fc3RvcEZhZGUoc291bmQuX2lkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8gJiYgc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUobXV0ZWQgPyAwIDogc291bmQuX3ZvbHVtZSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgc291bmQuX25vZGUubXV0ZWQgPSBIb3dsZXIuX211dGVkID8gdHJ1ZSA6IG11dGVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuX2VtaXQoJ211dGUnLCBzb3VuZC5faWQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQvc2V0IHRoZSB2b2x1bWUgb2YgdGhpcyBzb3VuZCBvciBvZiB0aGUgSG93bCBncm91cC4gVGhpcyBtZXRob2QgY2FuIG9wdGlvbmFsbHkgdGFrZSAwLCAxIG9yIDIgYXJndW1lbnRzLlxuICAgICAqICAgdm9sdW1lKCkgLT4gUmV0dXJucyB0aGUgZ3JvdXAncyB2b2x1bWUgdmFsdWUuXG4gICAgICogICB2b2x1bWUoaWQpIC0+IFJldHVybnMgdGhlIHNvdW5kIGlkJ3MgY3VycmVudCB2b2x1bWUuXG4gICAgICogICB2b2x1bWUodm9sKSAtPiBTZXRzIHRoZSB2b2x1bWUgb2YgYWxsIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAgICogICB2b2x1bWUodm9sLCBpZCkgLT4gU2V0cyB0aGUgdm9sdW1lIG9mIHBhc3NlZCBzb3VuZCBpZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsL051bWJlcn0gUmV0dXJucyBzZWxmIG9yIGN1cnJlbnQgdm9sdW1lLlxuICAgICAqL1xuICAgIHZvbHVtZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHZhciB2b2wsIGlkO1xuXG4gICAgICAvLyBEZXRlcm1pbmUgdGhlIHZhbHVlcyBiYXNlZCBvbiBhcmd1bWVudHMuXG4gICAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBvZiB0aGUgZ3JvdXBzJyB2b2x1bWUuXG4gICAgICAgIHJldHVybiBzZWxmLl92b2x1bWU7XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAxIHx8IGFyZ3MubGVuZ3RoID09PSAyICYmIHR5cGVvZiBhcmdzWzFdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGlzIGlzIGFuIElELCBhbmQgaWYgbm90LCBhc3N1bWUgaXQgaXMgYSBuZXcgdm9sdW1lLlxuICAgICAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoKTtcbiAgICAgICAgdmFyIGluZGV4ID0gaWRzLmluZGV4T2YoYXJnc1swXSk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgaWQgPSBwYXJzZUludChhcmdzWzBdLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdm9sID0gcGFyc2VGbG9hdChhcmdzWzBdKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgIHZvbCA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1sxXSwgMTApO1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgdGhlIHZvbHVtZSBvciByZXR1cm4gdGhlIGN1cnJlbnQgdm9sdW1lLlxuICAgICAgdmFyIHNvdW5kO1xuICAgICAgaWYgKHR5cGVvZiB2b2wgIT09ICd1bmRlZmluZWQnICYmIHZvbCA+PSAwICYmIHZvbCA8PSAxKSB7XG4gICAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gY2hhbmdlIHZvbHVtZSB3aGVuIGNhcGFibGUuXG4gICAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCd8fCBzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgZXZlbnQ6ICd2b2x1bWUnLFxuICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi52b2x1bWUuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZ3JvdXAgdm9sdW1lLlxuICAgICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHNlbGYuX3ZvbHVtZSA9IHZvbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSBvbmUgb3IgYWxsIHZvbHVtZXMuXG4gICAgICAgIGlkID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8aWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgICAgIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkW2ldKTtcblxuICAgICAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICAgICAgc291bmQuX3ZvbHVtZSA9IHZvbDtcblxuICAgICAgICAgICAgLy8gU3RvcCBjdXJyZW50bHkgcnVubmluZyBmYWRlcy5cbiAgICAgICAgICAgIGlmICghYXJnc1syXSkge1xuICAgICAgICAgICAgICBzZWxmLl9zdG9wRmFkZShpZFtpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbyAmJiBzb3VuZC5fbm9kZSAmJiAhc291bmQuX211dGVkKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUodm9sLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc291bmQuX25vZGUgJiYgIXNvdW5kLl9tdXRlZCkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS52b2x1bWUgPSB2b2wgKiBIb3dsZXIudm9sdW1lKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3ZvbHVtZScsIHNvdW5kLl9pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VuZCA9IGlkID8gc2VsZi5fc291bmRCeUlkKGlkKSA6IHNlbGYuX3NvdW5kc1swXTtcbiAgICAgICAgcmV0dXJuIHNvdW5kID8gc291bmQuX3ZvbHVtZSA6IDA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGYWRlIGEgY3VycmVudGx5IHBsYXlpbmcgc291bmQgYmV0d2VlbiB0d28gdm9sdW1lcyAoaWYgbm8gaWQgaXMgcGFzc2VkLCBhbGwgc291bmRzIHdpbGwgZmFkZSkuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBmcm9tIFRoZSB2YWx1ZSB0byBmYWRlIGZyb20gKDAuMCB0byAxLjApLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gdG8gICBUaGUgdm9sdW1lIHRvIGZhZGUgdG8gKDAuMCB0byAxLjApLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gbGVuICBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byBmYWRlLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgICBUaGUgc291bmQgaWQgKG9taXQgdG8gZmFkZSBhbGwgc291bmRzKS5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIGZhZGU6IGZ1bmN0aW9uKGZyb20sIHRvLCBsZW4sIGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gZmFkZSB3aGVuIGNhcGFibGUuXG4gICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnIHx8IHNlbGYuX3BsYXlMb2NrKSB7XG4gICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGV2ZW50OiAnZmFkZScsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuZmFkZShmcm9tLCB0bywgbGVuLCBpZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgLy8gTWFrZSBzdXJlIHRoZSB0by9mcm9tL2xlbiB2YWx1ZXMgYXJlIG51bWJlcnMuXG4gICAgICBmcm9tID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgcGFyc2VGbG9hdChmcm9tKSksIDEpO1xuICAgICAgdG8gPSBNYXRoLm1pbihNYXRoLm1heCgwLCBwYXJzZUZsb2F0KHRvKSksIDEpO1xuICAgICAgbGVuID0gcGFyc2VGbG9hdChsZW4pO1xuXG4gICAgICAvLyBTZXQgdGhlIHZvbHVtZSB0byB0aGUgc3RhcnQgcG9zaXRpb24uXG4gICAgICBzZWxmLnZvbHVtZShmcm9tLCBpZCk7XG5cbiAgICAgIC8vIEZhZGUgdGhlIHZvbHVtZSBvZiBvbmUgb3IgYWxsIHNvdW5kcy5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhIGxpbmVhciBmYWRlIG9yIGZhbGwgYmFjayB0byB0aW1lb3V0cyB3aXRoIEhUTUw1IEF1ZGlvLlxuICAgICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgICAvLyBTdG9wIHRoZSBwcmV2aW91cyBmYWRlIGlmIG5vIHNwcml0ZSBpcyBiZWluZyB1c2VkIChvdGhlcndpc2UsIHZvbHVtZSBoYW5kbGVzIHRoaXMpLlxuICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgIHNlbGYuX3N0b3BGYWRlKGlkc1tpXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSWYgd2UgYXJlIHVzaW5nIFdlYiBBdWRpbywgbGV0IHRoZSBuYXRpdmUgbWV0aG9kcyBkbyB0aGUgYWN0dWFsIGZhZGUuXG4gICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmICFzb3VuZC5fbXV0ZWQpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50VGltZSA9IEhvd2xlci5jdHguY3VycmVudFRpbWU7XG4gICAgICAgICAgICB2YXIgZW5kID0gY3VycmVudFRpbWUgKyAobGVuIC8gMTAwMCk7XG4gICAgICAgICAgICBzb3VuZC5fdm9sdW1lID0gZnJvbTtcbiAgICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUoZnJvbSwgY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgc291bmQuX25vZGUuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSh0bywgZW5kKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLl9zdGFydEZhZGVJbnRlcnZhbChzb3VuZCwgZnJvbSwgdG8sIGxlbiwgaWRzW2ldLCB0eXBlb2YgaWQgPT09ICd1bmRlZmluZWQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhcnRzIHRoZSBpbnRlcm5hbCBpbnRlcnZhbCB0byBmYWRlIGEgc291bmQuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBzb3VuZCBSZWZlcmVuY2UgdG8gc291bmQgdG8gZmFkZS5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGZyb20gVGhlIHZhbHVlIHRvIGZhZGUgZnJvbSAoMC4wIHRvIDEuMCkuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSB0byAgIFRoZSB2b2x1bWUgdG8gZmFkZSB0byAoMC4wIHRvIDEuMCkuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBsZW4gIFRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIGZhZGUuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCAgIFRoZSBzb3VuZCBpZCB0byBmYWRlLlxuICAgICAqIEBwYXJhbSAge0Jvb2xlYW59IGlzR3JvdXAgICBJZiB0cnVlLCBzZXQgdGhlIHZvbHVtZSBvbiB0aGUgZ3JvdXAuXG4gICAgICovXG4gICAgX3N0YXJ0RmFkZUludGVydmFsOiBmdW5jdGlvbihzb3VuZCwgZnJvbSwgdG8sIGxlbiwgaWQsIGlzR3JvdXApIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciB2b2wgPSBmcm9tO1xuICAgICAgdmFyIGRpZmYgPSB0byAtIGZyb207XG4gICAgICB2YXIgc3RlcHMgPSBNYXRoLmFicyhkaWZmIC8gMC4wMSk7XG4gICAgICB2YXIgc3RlcExlbiA9IE1hdGgubWF4KDQsIChzdGVwcyA+IDApID8gbGVuIC8gc3RlcHMgOiBsZW4pO1xuICAgICAgdmFyIGxhc3RUaWNrID0gRGF0ZS5ub3coKTtcblxuICAgICAgLy8gU3RvcmUgdGhlIHZhbHVlIGJlaW5nIGZhZGVkIHRvLlxuICAgICAgc291bmQuX2ZhZGVUbyA9IHRvO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIHZvbHVtZSB2YWx1ZSBvbiBlYWNoIGludGVydmFsIHRpY2suXG4gICAgICBzb3VuZC5faW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSB2b2x1bWUgYmFzZWQgb24gdGhlIHRpbWUgc2luY2UgdGhlIGxhc3QgdGljay5cbiAgICAgICAgdmFyIHRpY2sgPSAoRGF0ZS5ub3coKSAtIGxhc3RUaWNrKSAvIGxlbjtcbiAgICAgICAgbGFzdFRpY2sgPSBEYXRlLm5vdygpO1xuICAgICAgICB2b2wgKz0gZGlmZiAqIHRpY2s7XG5cbiAgICAgICAgLy8gUm91bmQgdG8gd2l0aGluIDIgZGVjaW1hbCBwb2ludHMuXG4gICAgICAgIHZvbCA9IE1hdGgucm91bmQodm9sICogMTAwKSAvIDEwMDtcblxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIHZvbHVtZSBpcyBpbiB0aGUgcmlnaHQgYm91bmRzLlxuICAgICAgICBpZiAoZGlmZiA8IDApIHtcbiAgICAgICAgICB2b2wgPSBNYXRoLm1heCh0bywgdm9sKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2b2wgPSBNYXRoLm1pbih0bywgdm9sKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoYW5nZSB0aGUgdm9sdW1lLlxuICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICBzb3VuZC5fdm9sdW1lID0gdm9sO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYudm9sdW1lKHZvbCwgc291bmQuX2lkLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZ3JvdXAncyB2b2x1bWUuXG4gICAgICAgIGlmIChpc0dyb3VwKSB7XG4gICAgICAgICAgc2VsZi5fdm9sdW1lID0gdm9sO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgZmFkZSBpcyBjb21wbGV0ZSwgc3RvcCBpdCBhbmQgZmlyZSBldmVudC5cbiAgICAgICAgaWYgKCh0byA8IGZyb20gJiYgdm9sIDw9IHRvKSB8fCAodG8gPiBmcm9tICYmIHZvbCA+PSB0bykpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKHNvdW5kLl9pbnRlcnZhbCk7XG4gICAgICAgICAgc291bmQuX2ludGVydmFsID0gbnVsbDtcbiAgICAgICAgICBzb3VuZC5fZmFkZVRvID0gbnVsbDtcbiAgICAgICAgICBzZWxmLnZvbHVtZSh0bywgc291bmQuX2lkKTtcbiAgICAgICAgICBzZWxmLl9lbWl0KCdmYWRlJywgc291bmQuX2lkKTtcbiAgICAgICAgfVxuICAgICAgfSwgc3RlcExlbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIG1ldGhvZCB0aGF0IHN0b3BzIHRoZSBjdXJyZW50bHkgcGxheWluZyBmYWRlIHdoZW5cbiAgICAgKiBhIG5ldyBmYWRlIHN0YXJ0cywgdm9sdW1lIGlzIGNoYW5nZWQgb3IgdGhlIHNvdW5kIGlzIHN0b3BwZWQuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBUaGUgc291bmQgaWQuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBfc3RvcEZhZGU6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuXG4gICAgICBpZiAoc291bmQgJiYgc291bmQuX2ludGVydmFsKSB7XG4gICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4uY2FuY2VsU2NoZWR1bGVkVmFsdWVzKEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xlYXJJbnRlcnZhbChzb3VuZC5faW50ZXJ2YWwpO1xuICAgICAgICBzb3VuZC5faW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICBzZWxmLnZvbHVtZShzb3VuZC5fZmFkZVRvLCBpZCk7XG4gICAgICAgIHNvdW5kLl9mYWRlVG8gPSBudWxsO1xuICAgICAgICBzZWxmLl9lbWl0KCdmYWRlJywgaWQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0L3NldCB0aGUgbG9vcCBwYXJhbWV0ZXIgb24gYSBzb3VuZC4gVGhpcyBtZXRob2QgY2FuIG9wdGlvbmFsbHkgdGFrZSAwLCAxIG9yIDIgYXJndW1lbnRzLlxuICAgICAqICAgbG9vcCgpIC0+IFJldHVybnMgdGhlIGdyb3VwJ3MgbG9vcCB2YWx1ZS5cbiAgICAgKiAgIGxvb3AoaWQpIC0+IFJldHVybnMgdGhlIHNvdW5kIGlkJ3MgbG9vcCB2YWx1ZS5cbiAgICAgKiAgIGxvb3AobG9vcCkgLT4gU2V0cyB0aGUgbG9vcCB2YWx1ZSBmb3IgYWxsIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAgICogICBsb29wKGxvb3AsIGlkKSAtPiBTZXRzIHRoZSBsb29wIHZhbHVlIG9mIHBhc3NlZCBzb3VuZCBpZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsL0Jvb2xlYW59IFJldHVybnMgc2VsZiBvciBjdXJyZW50IGxvb3AgdmFsdWUuXG4gICAgICovXG4gICAgbG9vcDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHZhciBsb29wLCBpZCwgc291bmQ7XG5cbiAgICAgIC8vIERldGVybWluZSB0aGUgdmFsdWVzIGZvciBsb29wIGFuZCBpZC5cbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIGdyb3UncyBsb29wIHZhbHVlLlxuICAgICAgICByZXR1cm4gc2VsZi5fbG9vcDtcbiAgICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICBsb29wID0gYXJnc1swXTtcbiAgICAgICAgICBzZWxmLl9sb29wID0gbG9vcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBSZXR1cm4gdGhpcyBzb3VuZCdzIGxvb3AgdmFsdWUuXG4gICAgICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQocGFyc2VJbnQoYXJnc1swXSwgMTApKTtcbiAgICAgICAgICByZXR1cm4gc291bmQgPyBzb3VuZC5fbG9vcCA6IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIGxvb3AgPSBhcmdzWzBdO1xuICAgICAgICBpZCA9IHBhcnNlSW50KGFyZ3NbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gaWQgaXMgcGFzc2VkLCBnZXQgYWxsIElEJ3MgdG8gYmUgbG9vcGVkLlxuICAgICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKGlkKTtcbiAgICAgIGZvciAodmFyIGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgICBzb3VuZC5fbG9vcCA9IGxvb3A7XG4gICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmIHNvdW5kLl9ub2RlICYmIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZSkge1xuICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmxvb3AgPSBsb29wO1xuICAgICAgICAgICAgaWYgKGxvb3ApIHtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmxvb3BTdGFydCA9IHNvdW5kLl9zdGFydCB8fCAwO1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UubG9vcEVuZCA9IHNvdW5kLl9zdG9wO1xuXG4gICAgICAgICAgICAgIC8vIElmIHBsYXlpbmcsIHJlc3RhcnQgcGxheWJhY2sgdG8gZW5zdXJlIGxvb3BpbmcgdXBkYXRlcy5cbiAgICAgICAgICAgICAgaWYgKHNlbGYucGxheWluZyhpZHNbaV0pKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5wYXVzZShpZHNbaV0sIHRydWUpO1xuICAgICAgICAgICAgICAgIHNlbGYucGxheShpZHNbaV0sIHRydWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQvc2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIGEgc291bmQuIFRoaXMgbWV0aG9kIGNhbiBvcHRpb25hbGx5IHRha2UgMCwgMSBvciAyIGFyZ3VtZW50cy5cbiAgICAgKiAgIHJhdGUoKSAtPiBSZXR1cm5zIHRoZSBmaXJzdCBzb3VuZCBub2RlJ3MgY3VycmVudCBwbGF5YmFjayByYXRlLlxuICAgICAqICAgcmF0ZShpZCkgLT4gUmV0dXJucyB0aGUgc291bmQgaWQncyBjdXJyZW50IHBsYXliYWNrIHJhdGUuXG4gICAgICogICByYXRlKHJhdGUpIC0+IFNldHMgdGhlIHBsYXliYWNrIHJhdGUgb2YgYWxsIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAgICogICByYXRlKHJhdGUsIGlkKSAtPiBTZXRzIHRoZSBwbGF5YmFjayByYXRlIG9mIHBhc3NlZCBzb3VuZCBpZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsL051bWJlcn0gUmV0dXJucyBzZWxmIG9yIHRoZSBjdXJyZW50IHBsYXliYWNrIHJhdGUuXG4gICAgICovXG4gICAgcmF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHZhciByYXRlLCBpZDtcblxuICAgICAgLy8gRGV0ZXJtaW5lIHRoZSB2YWx1ZXMgYmFzZWQgb24gYXJndW1lbnRzLlxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIFdlIHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCByYXRlIG9mIHRoZSBmaXJzdCBub2RlLlxuICAgICAgICBpZCA9IHNlbGYuX3NvdW5kc1swXS5faWQ7XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoaXMgaXMgYW4gSUQsIGFuZCBpZiBub3QsIGFzc3VtZSBpdCBpcyBhIG5ldyByYXRlIHZhbHVlLlxuICAgICAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoKTtcbiAgICAgICAgdmFyIGluZGV4ID0gaWRzLmluZGV4T2YoYXJnc1swXSk7XG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgaWQgPSBwYXJzZUludChhcmdzWzBdLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmF0ZSA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgcmF0ZSA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1sxXSwgMTApO1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgdGhlIHBsYXliYWNrIHJhdGUgb3IgcmV0dXJuIHRoZSBjdXJyZW50IHZhbHVlLlxuICAgICAgdmFyIHNvdW5kO1xuICAgICAgaWYgKHR5cGVvZiByYXRlID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCwgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIGNoYW5nZSBwbGF5YmFjayByYXRlIHdoZW4gY2FwYWJsZS5cbiAgICAgICAgaWYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJyB8fCBzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgICAgZXZlbnQ6ICdyYXRlJyxcbiAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmF0ZS5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHRoZSBncm91cCByYXRlLlxuICAgICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHNlbGYuX3JhdGUgPSByYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIG9uZSBvciBhbGwgdm9sdW1lcy5cbiAgICAgICAgaWQgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxpZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRbaV0pO1xuXG4gICAgICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgICAgICAvLyBLZWVwIHRyYWNrIG9mIG91ciBwb3NpdGlvbiB3aGVuIHRoZSByYXRlIGNoYW5nZWQgYW5kIHVwZGF0ZSB0aGUgcGxheWJhY2tcbiAgICAgICAgICAgIC8vIHN0YXJ0IHBvc2l0aW9uIHNvIHdlIGNhbiBwcm9wZXJseSBhZGp1c3QgdGhlIHNlZWsgcG9zaXRpb24gZm9yIHRpbWUgZWxhcHNlZC5cbiAgICAgICAgICAgIGlmIChzZWxmLnBsYXlpbmcoaWRbaV0pKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9yYXRlU2VlayA9IHNlbGYuc2VlayhpZFtpXSk7XG4gICAgICAgICAgICAgIHNvdW5kLl9wbGF5U3RhcnQgPSBzZWxmLl93ZWJBdWRpbyA/IEhvd2xlci5jdHguY3VycmVudFRpbWUgOiBzb3VuZC5fcGxheVN0YXJ0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291bmQuX3JhdGUgPSByYXRlO1xuXG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIHBsYXliYWNrIHJhdGUuXG4gICAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8gJiYgc291bmQuX25vZGUgJiYgc291bmQuX25vZGUuYnVmZmVyU291cmNlKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5wbGF5YmFja1JhdGUuc2V0VmFsdWVBdFRpbWUocmF0ZSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9ub2RlLnBsYXliYWNrUmF0ZSA9IHJhdGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlc2V0IHRoZSB0aW1lcnMuXG4gICAgICAgICAgICB2YXIgc2VlayA9IHNlbGYuc2VlayhpZFtpXSk7XG4gICAgICAgICAgICB2YXIgZHVyYXRpb24gPSAoKHNlbGYuX3Nwcml0ZVtzb3VuZC5fc3ByaXRlXVswXSArIHNlbGYuX3Nwcml0ZVtzb3VuZC5fc3ByaXRlXVsxXSkgLyAxMDAwKSAtIHNlZWs7XG4gICAgICAgICAgICB2YXIgdGltZW91dCA9IChkdXJhdGlvbiAqIDEwMDApIC8gTWF0aC5hYnMoc291bmQuX3JhdGUpO1xuXG4gICAgICAgICAgICAvLyBTdGFydCBhIG5ldyBlbmQgdGltZXIgaWYgc291bmQgaXMgYWxyZWFkeSBwbGF5aW5nLlxuICAgICAgICAgICAgaWYgKHNlbGYuX2VuZFRpbWVyc1tpZFtpXV0gfHwgIXNvdW5kLl9wYXVzZWQpIHtcbiAgICAgICAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihpZFtpXSk7XG4gICAgICAgICAgICAgIHNlbGYuX2VuZFRpbWVyc1tpZFtpXV0gPSBzZXRUaW1lb3V0KHNlbGYuX2VuZGVkLmJpbmQoc2VsZiwgc291bmQpLCB0aW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5fZW1pdCgncmF0ZScsIHNvdW5kLl9pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZCk7XG4gICAgICAgIHJldHVybiBzb3VuZCA/IHNvdW5kLl9yYXRlIDogc2VsZi5fcmF0ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldC9zZXQgdGhlIHNlZWsgcG9zaXRpb24gb2YgYSBzb3VuZC4gVGhpcyBtZXRob2QgY2FuIG9wdGlvbmFsbHkgdGFrZSAwLCAxIG9yIDIgYXJndW1lbnRzLlxuICAgICAqICAgc2VlaygpIC0+IFJldHVybnMgdGhlIGZpcnN0IHNvdW5kIG5vZGUncyBjdXJyZW50IHNlZWsgcG9zaXRpb24uXG4gICAgICogICBzZWVrKGlkKSAtPiBSZXR1cm5zIHRoZSBzb3VuZCBpZCdzIGN1cnJlbnQgc2VlayBwb3NpdGlvbi5cbiAgICAgKiAgIHNlZWsoc2VlaykgLT4gU2V0cyB0aGUgc2VlayBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgc291bmQgbm9kZS5cbiAgICAgKiAgIHNlZWsoc2VlaywgaWQpIC0+IFNldHMgdGhlIHNlZWsgcG9zaXRpb24gb2YgcGFzc2VkIHNvdW5kIGlkLlxuICAgICAqIEByZXR1cm4ge0hvd2wvTnVtYmVyfSBSZXR1cm5zIHNlbGYgb3IgdGhlIGN1cnJlbnQgc2VlayBwb3NpdGlvbi5cbiAgICAgKi9cbiAgICBzZWVrOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdmFyIHNlZWssIGlkO1xuXG4gICAgICAvLyBEZXRlcm1pbmUgdGhlIHZhbHVlcyBiYXNlZCBvbiBhcmd1bWVudHMuXG4gICAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gV2Ugd2lsbCBzaW1wbHkgcmV0dXJuIHRoZSBjdXJyZW50IHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBub2RlLlxuICAgICAgICBpZiAoc2VsZi5fc291bmRzLmxlbmd0aCkge1xuICAgICAgICAgIGlkID0gc2VsZi5fc291bmRzWzBdLl9pZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGlzIGlzIGFuIElELCBhbmQgaWYgbm90LCBhc3N1bWUgaXQgaXMgYSBuZXcgc2VlayBwb3NpdGlvbi5cbiAgICAgICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKCk7XG4gICAgICAgIHZhciBpbmRleCA9IGlkcy5pbmRleE9mKGFyZ3NbMF0pO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1swXSwgMTApO1xuICAgICAgICB9IGVsc2UgaWYgKHNlbGYuX3NvdW5kcy5sZW5ndGgpIHtcbiAgICAgICAgICBpZCA9IHNlbGYuX3NvdW5kc1swXS5faWQ7XG4gICAgICAgICAgc2VlayA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgc2VlayA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1sxXSwgMTApO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBJRCwgYmFpbCBvdXQuXG4gICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBzZWVrIHdoZW4gY2FwYWJsZS5cbiAgICAgIGlmICh0eXBlb2Ygc2VlayA9PT0gJ251bWJlcicgJiYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJyB8fCBzZWxmLl9wbGF5TG9jaykpIHtcbiAgICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgICAgZXZlbnQ6ICdzZWVrJyxcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5zZWVrLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuXG4gICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZWVrID09PSAnbnVtYmVyJyAmJiBzZWVrID49IDApIHtcbiAgICAgICAgICAvLyBQYXVzZSB0aGUgc291bmQgYW5kIHVwZGF0ZSBwb3NpdGlvbiBmb3IgcmVzdGFydGluZyBwbGF5YmFjay5cbiAgICAgICAgICB2YXIgcGxheWluZyA9IHNlbGYucGxheWluZyhpZCk7XG4gICAgICAgICAgaWYgKHBsYXlpbmcpIHtcbiAgICAgICAgICAgIHNlbGYucGF1c2UoaWQsIHRydWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE1vdmUgdGhlIHBvc2l0aW9uIG9mIHRoZSB0cmFjayBhbmQgY2FuY2VsIHRpbWVyLlxuICAgICAgICAgIHNvdW5kLl9zZWVrID0gc2VlaztcbiAgICAgICAgICBzb3VuZC5fZW5kZWQgPSBmYWxzZTtcbiAgICAgICAgICBzZWxmLl9jbGVhclRpbWVyKGlkKTtcblxuICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc2VlayBwb3NpdGlvbiBmb3IgSFRNTDUgQXVkaW8uXG4gICAgICAgICAgaWYgKCFzZWxmLl93ZWJBdWRpbyAmJiBzb3VuZC5fbm9kZSAmJiAhaXNOYU4oc291bmQuX25vZGUuZHVyYXRpb24pKSB7XG4gICAgICAgICAgICBzb3VuZC5fbm9kZS5jdXJyZW50VGltZSA9IHNlZWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2VlayBhbmQgZW1pdCB3aGVuIHJlYWR5LlxuICAgICAgICAgIHZhciBzZWVrQW5kRW1pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gUmVzdGFydCB0aGUgcGxheWJhY2sgaWYgdGhlIHNvdW5kIHdhcyBwbGF5aW5nLlxuICAgICAgICAgICAgaWYgKHBsYXlpbmcpIHtcbiAgICAgICAgICAgICAgc2VsZi5wbGF5KGlkLCB0cnVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5fZW1pdCgnc2VlaycsIGlkKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgLy8gV2FpdCBmb3IgdGhlIHBsYXkgbG9jayB0byBiZSB1bnNldCBiZWZvcmUgZW1pdHRpbmcgKEhUTUw1IEF1ZGlvKS5cbiAgICAgICAgICBpZiAocGxheWluZyAmJiAhc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAgIHZhciBlbWl0U2VlayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBpZiAoIXNlbGYuX3BsYXlMb2NrKSB7XG4gICAgICAgICAgICAgICAgc2Vla0FuZEVtaXQoKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGVtaXRTZWVrLCAwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZW1pdFNlZWssIDApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWVrQW5kRW1pdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAgIHZhciByZWFsVGltZSA9IHNlbGYucGxheWluZyhpZCkgPyBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lIC0gc291bmQuX3BsYXlTdGFydCA6IDA7XG4gICAgICAgICAgICB2YXIgcmF0ZVNlZWsgPSBzb3VuZC5fcmF0ZVNlZWsgPyBzb3VuZC5fcmF0ZVNlZWsgLSBzb3VuZC5fc2VlayA6IDA7XG4gICAgICAgICAgICByZXR1cm4gc291bmQuX3NlZWsgKyAocmF0ZVNlZWsgKyByZWFsVGltZSAqIE1hdGguYWJzKHNvdW5kLl9yYXRlKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzb3VuZC5fbm9kZS5jdXJyZW50VGltZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgc3BlY2lmaWMgc291bmQgaXMgY3VycmVudGx5IHBsYXlpbmcgb3Igbm90IChpZiBpZCBpcyBwcm92aWRlZCksIG9yIGNoZWNrIGlmIGF0IGxlYXN0IG9uZSBvZiB0aGUgc291bmRzIGluIHRoZSBncm91cCBpcyBwbGF5aW5nIG9yIG5vdC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICBpZCBUaGUgc291bmQgaWQgdG8gY2hlY2suIElmIG5vbmUgaXMgcGFzc2VkLCB0aGUgd2hvbGUgc291bmQgZ3JvdXAgaXMgY2hlY2tlZC5cbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIGlmIHBsYXlpbmcgYW5kIGZhbHNlIGlmIG5vdC5cbiAgICAgKi9cbiAgICBwbGF5aW5nOiBmdW5jdGlvbihpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBDaGVjayB0aGUgcGFzc2VkIHNvdW5kIElEIChpZiBhbnkpLlxuICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkKTtcbiAgICAgICAgcmV0dXJuIHNvdW5kID8gIXNvdW5kLl9wYXVzZWQgOiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gT3RoZXJ3aXNlLCBsb29wIHRocm91Z2ggYWxsIHNvdW5kcyBhbmQgY2hlY2sgaWYgYW55IGFyZSBwbGF5aW5nLlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX3NvdW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIXNlbGYuX3NvdW5kc1tpXS5fcGF1c2VkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGR1cmF0aW9uIG9mIHRoaXMgc291bmQuIFBhc3NpbmcgYSBzb3VuZCBpZCB3aWxsIHJldHVybiB0aGUgc3ByaXRlIGR1cmF0aW9uLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgVGhlIHNvdW5kIGlkIHRvIGNoZWNrLiBJZiBub25lIGlzIHBhc3NlZCwgcmV0dXJuIGZ1bGwgc291cmNlIGR1cmF0aW9uLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gQXVkaW8gZHVyYXRpb24gaW4gc2Vjb25kcy5cbiAgICAgKi9cbiAgICBkdXJhdGlvbjogZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBkdXJhdGlvbiA9IHNlbGYuX2R1cmF0aW9uO1xuXG4gICAgICAvLyBJZiB3ZSBwYXNzIGFuIElELCBnZXQgdGhlIHNvdW5kIGFuZCByZXR1cm4gdGhlIHNwcml0ZSBsZW5ndGguXG4gICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgIGR1cmF0aW9uID0gc2VsZi5fc3ByaXRlW3NvdW5kLl9zcHJpdGVdWzFdIC8gMTAwMDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGR1cmF0aW9uO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGxvYWRlZCBzdGF0ZSBvZiB0aGlzIEhvd2wuXG4gICAgICogQHJldHVybiB7U3RyaW5nfSAndW5sb2FkZWQnLCAnbG9hZGluZycsICdsb2FkZWQnXG4gICAgICovXG4gICAgc3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbmxvYWQgYW5kIGRlc3Ryb3kgdGhlIGN1cnJlbnQgSG93bCBvYmplY3QuXG4gICAgICogVGhpcyB3aWxsIGltbWVkaWF0ZWx5IHN0b3AgYWxsIHNvdW5kIGluc3RhbmNlcyBhdHRhY2hlZCB0byB0aGlzIGdyb3VwLlxuICAgICAqL1xuICAgIHVubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIFN0b3AgcGxheWluZyBhbnkgYWN0aXZlIHNvdW5kcy5cbiAgICAgIHZhciBzb3VuZHMgPSBzZWxmLl9zb3VuZHM7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8c291bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIFN0b3AgdGhlIHNvdW5kIGlmIGl0IGlzIGN1cnJlbnRseSBwbGF5aW5nLlxuICAgICAgICBpZiAoIXNvdW5kc1tpXS5fcGF1c2VkKSB7XG4gICAgICAgICAgc2VsZi5zdG9wKHNvdW5kc1tpXS5faWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBzb3VyY2Ugb3IgZGlzY29ubmVjdC5cbiAgICAgICAgaWYgKCFzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICAgIC8vIFNldCB0aGUgc291cmNlIHRvIDAtc2Vjb25kIHNpbGVuY2UgdG8gc3RvcCBhbnkgZG93bmxvYWRpbmcgKGV4Y2VwdCBpbiBJRSkuXG4gICAgICAgICAgc2VsZi5fY2xlYXJTb3VuZChzb3VuZHNbaV0uX25vZGUpO1xuXG4gICAgICAgICAgLy8gUmVtb3ZlIGFueSBldmVudCBsaXN0ZW5lcnMuXG4gICAgICAgICAgc291bmRzW2ldLl9ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgc291bmRzW2ldLl9lcnJvckZuLCBmYWxzZSk7XG4gICAgICAgICAgc291bmRzW2ldLl9ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoSG93bGVyLl9jYW5QbGF5RXZlbnQsIHNvdW5kc1tpXS5fbG9hZEZuLCBmYWxzZSk7XG4gICAgICAgICAgc291bmRzW2ldLl9ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgc291bmRzW2ldLl9lbmRGbiwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gUmVsZWFzZSB0aGUgQXVkaW8gb2JqZWN0IGJhY2sgdG8gdGhlIHBvb2wuXG4gICAgICAgICAgSG93bGVyLl9yZWxlYXNlSHRtbDVBdWRpbyhzb3VuZHNbaV0uX25vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRW1wdHkgb3V0IGFsbCBvZiB0aGUgbm9kZXMuXG4gICAgICAgIGRlbGV0ZSBzb3VuZHNbaV0uX25vZGU7XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIGFsbCB0aW1lcnMgYXJlIGNsZWFyZWQgb3V0LlxuICAgICAgICBzZWxmLl9jbGVhclRpbWVyKHNvdW5kc1tpXS5faWQpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgdGhlIHJlZmVyZW5jZXMgaW4gdGhlIGdsb2JhbCBIb3dsZXIgb2JqZWN0LlxuICAgICAgdmFyIGluZGV4ID0gSG93bGVyLl9ob3dscy5pbmRleE9mKHNlbGYpO1xuICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgSG93bGVyLl9ob3dscy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuXG4gICAgICAvLyBEZWxldGUgdGhpcyBzb3VuZCBmcm9tIHRoZSBjYWNoZSAoaWYgbm8gb3RoZXIgSG93bCBpcyB1c2luZyBpdCkuXG4gICAgICB2YXIgcmVtQ2FjaGUgPSB0cnVlO1xuICAgICAgZm9yIChpPTA7IGk8SG93bGVyLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoSG93bGVyLl9ob3dsc1tpXS5fc3JjID09PSBzZWxmLl9zcmMgfHwgc2VsZi5fc3JjLmluZGV4T2YoSG93bGVyLl9ob3dsc1tpXS5fc3JjKSA+PSAwKSB7XG4gICAgICAgICAgcmVtQ2FjaGUgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2FjaGUgJiYgcmVtQ2FjaGUpIHtcbiAgICAgICAgZGVsZXRlIGNhY2hlW3NlbGYuX3NyY107XG4gICAgICB9XG5cbiAgICAgIC8vIENsZWFyIGdsb2JhbCBlcnJvcnMuXG4gICAgICBIb3dsZXIubm9BdWRpbyA9IGZhbHNlO1xuXG4gICAgICAvLyBDbGVhciBvdXQgYHNlbGZgLlxuICAgICAgc2VsZi5fc3RhdGUgPSAndW5sb2FkZWQnO1xuICAgICAgc2VsZi5fc291bmRzID0gW107XG4gICAgICBzZWxmID0gbnVsbDtcblxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExpc3RlbiB0byBhIGN1c3RvbSBldmVudC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgZXZlbnQgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gICAgTGlzdGVuZXIgdG8gY2FsbC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICAgaWQgICAgKG9wdGlvbmFsKSBPbmx5IGxpc3RlbiB0byBldmVudHMgZm9yIHRoaXMgc291bmQuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSAgIG9uY2UgIChJTlRFUk5BTCkgTWFya3MgZXZlbnQgdG8gZmlyZSBvbmx5IG9uY2UuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24oZXZlbnQsIGZuLCBpZCwgb25jZSkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGV2ZW50cyA9IHNlbGZbJ19vbicgKyBldmVudF07XG5cbiAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZXZlbnRzLnB1c2gob25jZSA/IHtpZDogaWQsIGZuOiBmbiwgb25jZTogb25jZX0gOiB7aWQ6IGlkLCBmbjogZm59KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGN1c3RvbSBldmVudC4gQ2FsbCB3aXRob3V0IHBhcmFtZXRlcnMgdG8gcmVtb3ZlIGFsbCBldmVudHMuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSAgIGV2ZW50IEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuICAgIExpc3RlbmVyIHRvIHJlbW92ZS4gTGVhdmUgZW1wdHkgdG8gcmVtb3ZlIGFsbC5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICAgaWQgICAgKG9wdGlvbmFsKSBPbmx5IHJlbW92ZSBldmVudHMgZm9yIHRoaXMgc291bmQuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uKGV2ZW50LCBmbiwgaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSBzZWxmWydfb24nICsgZXZlbnRdO1xuICAgICAgdmFyIGkgPSAwO1xuXG4gICAgICAvLyBBbGxvdyBwYXNzaW5nIGp1c3QgYW4gZXZlbnQgYW5kIElELlxuICAgICAgaWYgKHR5cGVvZiBmbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWQgPSBmbjtcbiAgICAgICAgZm4gPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBpZiAoZm4gfHwgaWQpIHtcbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGV2ZW50IHN0b3JlIGFuZCByZW1vdmUgdGhlIHBhc3NlZCBmdW5jdGlvbi5cbiAgICAgICAgZm9yIChpPTA7IGk8ZXZlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFyIGlzSWQgPSAoaWQgPT09IGV2ZW50c1tpXS5pZCk7XG4gICAgICAgICAgaWYgKGZuID09PSBldmVudHNbaV0uZm4gJiYgaXNJZCB8fCAhZm4gJiYgaXNJZCkge1xuICAgICAgICAgICAgZXZlbnRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChldmVudCkge1xuICAgICAgICAvLyBDbGVhciBvdXQgYWxsIGV2ZW50cyBvZiB0aGlzIHR5cGUuXG4gICAgICAgIHNlbGZbJ19vbicgKyBldmVudF0gPSBbXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENsZWFyIG91dCBhbGwgZXZlbnRzIG9mIGV2ZXJ5IHR5cGUuXG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc2VsZik7XG4gICAgICAgIGZvciAoaT0wOyBpPGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoKGtleXNbaV0uaW5kZXhPZignX29uJykgPT09IDApICYmIEFycmF5LmlzQXJyYXkoc2VsZltrZXlzW2ldXSkpIHtcbiAgICAgICAgICAgIHNlbGZba2V5c1tpXV0gPSBbXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExpc3RlbiB0byBhIGN1c3RvbSBldmVudCBhbmQgcmVtb3ZlIGl0IG9uY2UgZmlyZWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSAgIGV2ZW50IEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuICAgIExpc3RlbmVyIHRvIGNhbGwuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSAgIGlkICAgIChvcHRpb25hbCkgT25seSBsaXN0ZW4gdG8gZXZlbnRzIGZvciB0aGlzIHNvdW5kLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgb25jZTogZnVuY3Rpb24oZXZlbnQsIGZuLCBpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBTZXR1cCB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gICAgICBzZWxmLm9uKGV2ZW50LCBmbiwgaWQsIDEpO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW1pdCBhbGwgZXZlbnRzIG9mIGEgc3BlY2lmaWMgdHlwZSBhbmQgcGFzcyB0aGUgc291bmQgaWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBldmVudCBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgICAgU291bmQgSUQuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBtc2cgICBNZXNzYWdlIHRvIGdvIHdpdGggZXZlbnQuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBfZW1pdDogZnVuY3Rpb24oZXZlbnQsIGlkLCBtc2cpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSBzZWxmWydfb24nICsgZXZlbnRdO1xuXG4gICAgICAvLyBMb29wIHRocm91Z2ggZXZlbnQgc3RvcmUgYW5kIGZpcmUgYWxsIGZ1bmN0aW9ucy5cbiAgICAgIGZvciAodmFyIGk9ZXZlbnRzLmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcbiAgICAgICAgLy8gT25seSBmaXJlIHRoZSBsaXN0ZW5lciBpZiB0aGUgY29ycmVjdCBJRCBpcyB1c2VkLlxuICAgICAgICBpZiAoIWV2ZW50c1tpXS5pZCB8fCBldmVudHNbaV0uaWQgPT09IGlkIHx8IGV2ZW50ID09PSAnbG9hZCcpIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGlkLCBtc2cpO1xuICAgICAgICAgIH0uYmluZChzZWxmLCBldmVudHNbaV0uZm4pLCAwKTtcblxuICAgICAgICAgIC8vIElmIHRoaXMgZXZlbnQgd2FzIHNldHVwIHdpdGggYG9uY2VgLCByZW1vdmUgaXQuXG4gICAgICAgICAgaWYgKGV2ZW50c1tpXS5vbmNlKSB7XG4gICAgICAgICAgICBzZWxmLm9mZihldmVudCwgZXZlbnRzW2ldLmZuLCBldmVudHNbaV0uaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBQYXNzIHRoZSBldmVudCB0eXBlIGludG8gbG9hZCBxdWV1ZSBzbyB0aGF0IGl0IGNhbiBjb250aW51ZSBzdGVwcGluZy5cbiAgICAgIHNlbGYuX2xvYWRRdWV1ZShldmVudCk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBRdWV1ZSBvZiBhY3Rpb25zIGluaXRpYXRlZCBiZWZvcmUgdGhlIHNvdW5kIGhhcyBsb2FkZWQuXG4gICAgICogVGhlc2Ugd2lsbCBiZSBjYWxsZWQgaW4gc2VxdWVuY2UsIHdpdGggdGhlIG5leHQgb25seSBmaXJpbmdcbiAgICAgKiBhZnRlciB0aGUgcHJldmlvdXMgaGFzIGZpbmlzaGVkIGV4ZWN1dGluZyAoZXZlbiBpZiBhc3luYyBsaWtlIHBsYXkpLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgX2xvYWRRdWV1ZTogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgaWYgKHNlbGYuX3F1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIHRhc2sgPSBzZWxmLl9xdWV1ZVswXTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhpcyB0YXNrIGlmIGEgbWF0Y2hpbmcgZXZlbnQgd2FzIHBhc3NlZC5cbiAgICAgICAgaWYgKHRhc2suZXZlbnQgPT09IGV2ZW50KSB7XG4gICAgICAgICAgc2VsZi5fcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICBzZWxmLl9sb2FkUXVldWUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJ1biB0aGUgdGFzayBpZiBubyBldmVudCB0eXBlIGlzIHBhc3NlZC5cbiAgICAgICAgaWYgKCFldmVudCkge1xuICAgICAgICAgIHRhc2suYWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpcmVkIHdoZW4gcGxheWJhY2sgZW5kcyBhdCB0aGUgZW5kIG9mIHRoZSBkdXJhdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtTb3VuZH0gc291bmQgVGhlIHNvdW5kIG9iamVjdCB0byB3b3JrIHdpdGguXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBfZW5kZWQ6IGZ1bmN0aW9uKHNvdW5kKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgc3ByaXRlID0gc291bmQuX3Nwcml0ZTtcblxuICAgICAgLy8gSWYgd2UgYXJlIHVzaW5nIElFIGFuZCB0aGVyZSB3YXMgbmV0d29yayBsYXRlbmN5IHdlIG1heSBiZSBjbGlwcGluZ1xuICAgICAgLy8gYXVkaW8gYmVmb3JlIGl0IGNvbXBsZXRlcyBwbGF5aW5nLiBMZXRzIGNoZWNrIHRoZSBub2RlIHRvIG1ha2Ugc3VyZSBpdFxuICAgICAgLy8gYmVsaWV2ZXMgaXQgaGFzIGNvbXBsZXRlZCwgYmVmb3JlIGVuZGluZyB0aGUgcGxheWJhY2suXG4gICAgICBpZiAoIXNlbGYuX3dlYkF1ZGlvICYmIHNvdW5kLl9ub2RlICYmICFzb3VuZC5fbm9kZS5wYXVzZWQgJiYgIXNvdW5kLl9ub2RlLmVuZGVkICYmIHNvdW5kLl9ub2RlLmN1cnJlbnRUaW1lIDwgc291bmQuX3N0b3ApIHtcbiAgICAgICAgc2V0VGltZW91dChzZWxmLl9lbmRlZC5iaW5kKHNlbGYsIHNvdW5kKSwgMTAwKTtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIC8vIFNob3VsZCB0aGlzIHNvdW5kIGxvb3A/XG4gICAgICB2YXIgbG9vcCA9ICEhKHNvdW5kLl9sb29wIHx8IHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzJdKTtcblxuICAgICAgLy8gRmlyZSB0aGUgZW5kZWQgZXZlbnQuXG4gICAgICBzZWxmLl9lbWl0KCdlbmQnLCBzb3VuZC5faWQpO1xuXG4gICAgICAvLyBSZXN0YXJ0IHRoZSBwbGF5YmFjayBmb3IgSFRNTDUgQXVkaW8gbG9vcC5cbiAgICAgIGlmICghc2VsZi5fd2ViQXVkaW8gJiYgbG9vcCkge1xuICAgICAgICBzZWxmLnN0b3Aoc291bmQuX2lkLCB0cnVlKS5wbGF5KHNvdW5kLl9pZCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlc3RhcnQgdGhpcyB0aW1lciBpZiBvbiBhIFdlYiBBdWRpbyBsb29wLlxuICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmIGxvb3ApIHtcbiAgICAgICAgc2VsZi5fZW1pdCgncGxheScsIHNvdW5kLl9pZCk7XG4gICAgICAgIHNvdW5kLl9zZWVrID0gc291bmQuX3N0YXJ0IHx8IDA7XG4gICAgICAgIHNvdW5kLl9yYXRlU2VlayA9IDA7XG4gICAgICAgIHNvdW5kLl9wbGF5U3RhcnQgPSBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lO1xuXG4gICAgICAgIHZhciB0aW1lb3V0ID0gKChzb3VuZC5fc3RvcCAtIHNvdW5kLl9zdGFydCkgKiAxMDAwKSAvIE1hdGguYWJzKHNvdW5kLl9yYXRlKTtcbiAgICAgICAgc2VsZi5fZW5kVGltZXJzW3NvdW5kLl9pZF0gPSBzZXRUaW1lb3V0KHNlbGYuX2VuZGVkLmJpbmQoc2VsZiwgc291bmQpLCB0aW1lb3V0KTtcbiAgICAgIH1cblxuICAgICAgLy8gTWFyayB0aGUgbm9kZSBhcyBwYXVzZWQuXG4gICAgICBpZiAoc2VsZi5fd2ViQXVkaW8gJiYgIWxvb3ApIHtcbiAgICAgICAgc291bmQuX3BhdXNlZCA9IHRydWU7XG4gICAgICAgIHNvdW5kLl9lbmRlZCA9IHRydWU7XG4gICAgICAgIHNvdW5kLl9zZWVrID0gc291bmQuX3N0YXJ0IHx8IDA7XG4gICAgICAgIHNvdW5kLl9yYXRlU2VlayA9IDA7XG4gICAgICAgIHNlbGYuX2NsZWFyVGltZXIoc291bmQuX2lkKTtcblxuICAgICAgICAvLyBDbGVhbiB1cCB0aGUgYnVmZmVyIHNvdXJjZS5cbiAgICAgICAgc2VsZi5fY2xlYW5CdWZmZXIoc291bmQuX25vZGUpO1xuXG4gICAgICAgIC8vIEF0dGVtcHQgdG8gYXV0by1zdXNwZW5kIEF1ZGlvQ29udGV4dCBpZiBubyBzb3VuZHMgYXJlIHN0aWxsIHBsYXlpbmcuXG4gICAgICAgIEhvd2xlci5fYXV0b1N1c3BlbmQoKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2hlbiB1c2luZyBhIHNwcml0ZSwgZW5kIHRoZSB0cmFjay5cbiAgICAgIGlmICghc2VsZi5fd2ViQXVkaW8gJiYgIWxvb3ApIHtcbiAgICAgICAgc2VsZi5zdG9wKHNvdW5kLl9pZCwgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDbGVhciB0aGUgZW5kIHRpbWVyIGZvciBhIHNvdW5kIHBsYXliYWNrLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgVGhlIHNvdW5kIElELlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgX2NsZWFyVGltZXI6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGlmIChzZWxmLl9lbmRUaW1lcnNbaWRdKSB7XG4gICAgICAgIC8vIENsZWFyIHRoZSB0aW1lb3V0IG9yIHJlbW92ZSB0aGUgZW5kZWQgbGlzdGVuZXIuXG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZi5fZW5kVGltZXJzW2lkXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGNsZWFyVGltZW91dChzZWxmLl9lbmRUaW1lcnNbaWRdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuICAgICAgICAgIGlmIChzb3VuZCAmJiBzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgc291bmQuX25vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBzZWxmLl9lbmRUaW1lcnNbaWRdLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGVsZXRlIHNlbGYuX2VuZFRpbWVyc1tpZF07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIHNvdW5kIGlkZW50aWZpZWQgYnkgdGhpcyBJRCwgb3IgcmV0dXJuIG51bGwuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBTb3VuZCBJRFxuICAgICAqIEByZXR1cm4ge09iamVjdH0gICAgU291bmQgb2JqZWN0IG9yIG51bGwuXG4gICAgICovXG4gICAgX3NvdW5kQnlJZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIGFsbCBzb3VuZHMgYW5kIGZpbmQgdGhlIG9uZSB3aXRoIHRoaXMgSUQuXG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5fc291bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpZCA9PT0gc2VsZi5fc291bmRzW2ldLl9pZCkge1xuICAgICAgICAgIHJldHVybiBzZWxmLl9zb3VuZHNbaV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBhbiBpbmFjdGl2ZSBzb3VuZCBmcm9tIHRoZSBwb29sIG9yIGNyZWF0ZSBhIG5ldyBvbmUuXG4gICAgICogQHJldHVybiB7U291bmR9IFNvdW5kIHBsYXliYWNrIG9iamVjdC5cbiAgICAgKi9cbiAgICBfaW5hY3RpdmVTb3VuZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHNlbGYuX2RyYWluKCk7XG5cbiAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IGluYWN0aXZlIG5vZGUgdG8gcmVjeWNsZS5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9zb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHNlbGYuX3NvdW5kc1tpXS5fZW5kZWQpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi5fc291bmRzW2ldLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gaW5hY3RpdmUgbm9kZSB3YXMgZm91bmQsIGNyZWF0ZSBhIG5ldyBvbmUuXG4gICAgICByZXR1cm4gbmV3IFNvdW5kKHNlbGYpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBEcmFpbiBleGNlc3MgaW5hY3RpdmUgc291bmRzIGZyb20gdGhlIHBvb2wuXG4gICAgICovXG4gICAgX2RyYWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBsaW1pdCA9IHNlbGYuX3Bvb2w7XG4gICAgICB2YXIgY250ID0gMDtcbiAgICAgIHZhciBpID0gMDtcblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIGxlc3Mgc291bmRzIHRoYW4gdGhlIG1heCBwb29sIHNpemUsIHdlIGFyZSBkb25lLlxuICAgICAgaWYgKHNlbGYuX3NvdW5kcy5sZW5ndGggPCBsaW1pdCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIENvdW50IHRoZSBudW1iZXIgb2YgaW5hY3RpdmUgc291bmRzLlxuICAgICAgZm9yIChpPTA7IGk8c2VsZi5fc291bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzZWxmLl9zb3VuZHNbaV0uX2VuZGVkKSB7XG4gICAgICAgICAgY250Kys7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIGV4Y2VzcyBpbmFjdGl2ZSBzb3VuZHMsIGdvaW5nIGluIHJldmVyc2Ugb3JkZXIuXG4gICAgICBmb3IgKGk9c2VsZi5fc291bmRzLmxlbmd0aCAtIDE7IGk+PTA7IGktLSkge1xuICAgICAgICBpZiAoY250IDw9IGxpbWl0KSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbGYuX3NvdW5kc1tpXS5fZW5kZWQpIHtcbiAgICAgICAgICAvLyBEaXNjb25uZWN0IHRoZSBhdWRpbyBzb3VyY2Ugd2hlbiB1c2luZyBXZWIgQXVkaW8uXG4gICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmIHNlbGYuX3NvdW5kc1tpXS5fbm9kZSkge1xuICAgICAgICAgICAgc2VsZi5fc291bmRzW2ldLl9ub2RlLmRpc2Nvbm5lY3QoMCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVtb3ZlIHNvdW5kcyB1bnRpbCB3ZSBoYXZlIHRoZSBwb29sIHNpemUuXG4gICAgICAgICAgc2VsZi5fc291bmRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICBjbnQtLTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIElEJ3MgZnJvbSB0aGUgc291bmRzIHBvb2wuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBpZCBPbmx5IHJldHVybiBvbmUgSUQgaWYgb25lIGlzIHBhc3NlZC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX0gICAgQXJyYXkgb2YgSURzLlxuICAgICAqL1xuICAgIF9nZXRTb3VuZElkczogZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIGlkcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5fc291bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWRzLnB1c2goc2VsZi5fc291bmRzW2ldLl9pZCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaWRzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFtpZF07XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExvYWQgdGhlIHNvdW5kIGJhY2sgaW50byB0aGUgYnVmZmVyIHNvdXJjZS5cbiAgICAgKiBAcGFyYW0gIHtTb3VuZH0gc291bmQgVGhlIHNvdW5kIG9iamVjdCB0byB3b3JrIHdpdGguXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBfcmVmcmVzaEJ1ZmZlcjogZnVuY3Rpb24oc291bmQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgLy8gU2V0dXAgdGhlIGJ1ZmZlciBzb3VyY2UgZm9yIHBsYXliYWNrLlxuICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlID0gSG93bGVyLmN0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5idWZmZXIgPSBjYWNoZVtzZWxmLl9zcmNdO1xuXG4gICAgICAvLyBDb25uZWN0IHRvIHRoZSBjb3JyZWN0IG5vZGUuXG4gICAgICBpZiAoc291bmQuX3Bhbm5lcikge1xuICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UuY29ubmVjdChzb3VuZC5fcGFubmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5jb25uZWN0KHNvdW5kLl9ub2RlKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0dXAgbG9vcGluZyBhbmQgcGxheWJhY2sgcmF0ZS5cbiAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5sb29wID0gc291bmQuX2xvb3A7XG4gICAgICBpZiAoc291bmQuX2xvb3ApIHtcbiAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmxvb3BTdGFydCA9IHNvdW5kLl9zdGFydCB8fCAwO1xuICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UubG9vcEVuZCA9IHNvdW5kLl9zdG9wIHx8IDA7XG4gICAgICB9XG4gICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlLnNldFZhbHVlQXRUaW1lKHNvdW5kLl9yYXRlLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgbWVtb3J5IGxlYWtzIGJ5IGNsZWFuaW5nIHVwIHRoZSBidWZmZXIgc291cmNlIGFmdGVyIHBsYXliYWNrLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gbm9kZSBTb3VuZCdzIGF1ZGlvIG5vZGUgY29udGFpbmluZyB0aGUgYnVmZmVyIHNvdXJjZS5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIF9jbGVhbkJ1ZmZlcjogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGlzSU9TID0gSG93bGVyLl9uYXZpZ2F0b3IgJiYgSG93bGVyLl9uYXZpZ2F0b3IudmVuZG9yLmluZGV4T2YoJ0FwcGxlJykgPj0gMDtcblxuICAgICAgaWYgKEhvd2xlci5fc2NyYXRjaEJ1ZmZlciAmJiBub2RlLmJ1ZmZlclNvdXJjZSkge1xuICAgICAgICBub2RlLmJ1ZmZlclNvdXJjZS5vbmVuZGVkID0gbnVsbDtcbiAgICAgICAgbm9kZS5idWZmZXJTb3VyY2UuZGlzY29ubmVjdCgwKTtcbiAgICAgICAgaWYgKGlzSU9TKSB7XG4gICAgICAgICAgdHJ5IHsgbm9kZS5idWZmZXJTb3VyY2UuYnVmZmVyID0gSG93bGVyLl9zY3JhdGNoQnVmZmVyOyB9IGNhdGNoKGUpIHt9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5vZGUuYnVmZmVyU291cmNlID0gbnVsbDtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc291cmNlIHRvIGEgMC1zZWNvbmQgc2lsZW5jZSB0byBzdG9wIGFueSBkb3dubG9hZGluZyAoZXhjZXB0IGluIElFKS5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG5vZGUgQXVkaW8gbm9kZSB0byBjbGVhci5cbiAgICAgKi9cbiAgICBfY2xlYXJTb3VuZDogZnVuY3Rpb24obm9kZSkge1xuICAgICAgdmFyIGNoZWNrSUUgPSAvTVNJRSB8VHJpZGVudFxcLy8udGVzdChIb3dsZXIuX25hdmlnYXRvciAmJiBIb3dsZXIuX25hdmlnYXRvci51c2VyQWdlbnQpO1xuICAgICAgaWYgKCFjaGVja0lFKSB7XG4gICAgICAgIG5vZGUuc3JjID0gJ2RhdGE6YXVkaW8vd2F2O2Jhc2U2NCxVa2xHUmlnQUFBQlhRVlpGWm0xMElCSUFBQUFCQUFFQVJLd0FBSWhZQVFBQ0FCQUFBQUJrWVhSaEFnQUFBQUVBJztcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqIFNpbmdsZSBTb3VuZCBNZXRob2RzICoqL1xuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBTZXR1cCB0aGUgc291bmQgb2JqZWN0LCB3aGljaCBlYWNoIG5vZGUgYXR0YWNoZWQgdG8gYSBIb3dsIGdyb3VwIGlzIGNvbnRhaW5lZCBpbi5cbiAgICogQHBhcmFtIHtPYmplY3R9IGhvd2wgVGhlIEhvd2wgcGFyZW50IGdyb3VwLlxuICAgKi9cbiAgdmFyIFNvdW5kID0gZnVuY3Rpb24oaG93bCkge1xuICAgIHRoaXMuX3BhcmVudCA9IGhvd2w7XG4gICAgdGhpcy5pbml0KCk7XG4gIH07XG4gIFNvdW5kLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGEgbmV3IFNvdW5kIG9iamVjdC5cbiAgICAgKiBAcmV0dXJuIHtTb3VuZH1cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBwYXJlbnQgPSBzZWxmLl9wYXJlbnQ7XG5cbiAgICAgIC8vIFNldHVwIHRoZSBkZWZhdWx0IHBhcmFtZXRlcnMuXG4gICAgICBzZWxmLl9tdXRlZCA9IHBhcmVudC5fbXV0ZWQ7XG4gICAgICBzZWxmLl9sb29wID0gcGFyZW50Ll9sb29wO1xuICAgICAgc2VsZi5fdm9sdW1lID0gcGFyZW50Ll92b2x1bWU7XG4gICAgICBzZWxmLl9yYXRlID0gcGFyZW50Ll9yYXRlO1xuICAgICAgc2VsZi5fc2VlayA9IDA7XG4gICAgICBzZWxmLl9wYXVzZWQgPSB0cnVlO1xuICAgICAgc2VsZi5fZW5kZWQgPSB0cnVlO1xuICAgICAgc2VsZi5fc3ByaXRlID0gJ19fZGVmYXVsdCc7XG5cbiAgICAgIC8vIEdlbmVyYXRlIGEgdW5pcXVlIElEIGZvciB0aGlzIHNvdW5kLlxuICAgICAgc2VsZi5faWQgPSArK0hvd2xlci5fY291bnRlcjtcblxuICAgICAgLy8gQWRkIGl0c2VsZiB0byB0aGUgcGFyZW50J3MgcG9vbC5cbiAgICAgIHBhcmVudC5fc291bmRzLnB1c2goc2VsZik7XG5cbiAgICAgIC8vIENyZWF0ZSB0aGUgbmV3IG5vZGUuXG4gICAgICBzZWxmLmNyZWF0ZSgpO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCBzZXR1cCBhIG5ldyBzb3VuZCBvYmplY3QsIHdoZXRoZXIgSFRNTDUgQXVkaW8gb3IgV2ViIEF1ZGlvLlxuICAgICAqIEByZXR1cm4ge1NvdW5kfVxuICAgICAqL1xuICAgIGNyZWF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGFyZW50ID0gc2VsZi5fcGFyZW50O1xuICAgICAgdmFyIHZvbHVtZSA9IChIb3dsZXIuX211dGVkIHx8IHNlbGYuX211dGVkIHx8IHNlbGYuX3BhcmVudC5fbXV0ZWQpID8gMCA6IHNlbGYuX3ZvbHVtZTtcblxuICAgICAgaWYgKHBhcmVudC5fd2ViQXVkaW8pIHtcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBnYWluIG5vZGUgZm9yIGNvbnRyb2xsaW5nIHZvbHVtZSAodGhlIHNvdXJjZSB3aWxsIGNvbm5lY3QgdG8gdGhpcykuXG4gICAgICAgIHNlbGYuX25vZGUgPSAodHlwZW9mIEhvd2xlci5jdHguY3JlYXRlR2FpbiA9PT0gJ3VuZGVmaW5lZCcpID8gSG93bGVyLmN0eC5jcmVhdGVHYWluTm9kZSgpIDogSG93bGVyLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHNlbGYuX25vZGUuZ2Fpbi5zZXRWYWx1ZUF0VGltZSh2b2x1bWUsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICBzZWxmLl9ub2RlLnBhdXNlZCA9IHRydWU7XG4gICAgICAgIHNlbGYuX25vZGUuY29ubmVjdChIb3dsZXIubWFzdGVyR2Fpbik7XG4gICAgICB9IGVsc2UgaWYgKCFIb3dsZXIubm9BdWRpbykge1xuICAgICAgICAvLyBHZXQgYW4gdW5sb2NrZWQgQXVkaW8gb2JqZWN0IGZyb20gdGhlIHBvb2wuXG4gICAgICAgIHNlbGYuX25vZGUgPSBIb3dsZXIuX29idGFpbkh0bWw1QXVkaW8oKTtcblxuICAgICAgICAvLyBMaXN0ZW4gZm9yIGVycm9ycyAoaHR0cDovL2Rldi53My5vcmcvaHRtbDUvc3BlYy1hdXRob3Itdmlldy9zcGVjLmh0bWwjbWVkaWFlcnJvcikuXG4gICAgICAgIHNlbGYuX2Vycm9yRm4gPSBzZWxmLl9lcnJvckxpc3RlbmVyLmJpbmQoc2VsZik7XG4gICAgICAgIHNlbGYuX25vZGUuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBzZWxmLl9lcnJvckZuLCBmYWxzZSk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciAnY2FucGxheXRocm91Z2gnIGV2ZW50IHRvIGxldCB1cyBrbm93IHRoZSBzb3VuZCBpcyByZWFkeS5cbiAgICAgICAgc2VsZi5fbG9hZEZuID0gc2VsZi5fbG9hZExpc3RlbmVyLmJpbmQoc2VsZik7XG4gICAgICAgIHNlbGYuX25vZGUuYWRkRXZlbnRMaXN0ZW5lcihIb3dsZXIuX2NhblBsYXlFdmVudCwgc2VsZi5fbG9hZEZuLCBmYWxzZSk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciB0aGUgJ2VuZGVkJyBldmVudCBvbiB0aGUgc291bmQgdG8gYWNjb3VudCBmb3IgZWRnZS1jYXNlIHdoZXJlXG4gICAgICAgIC8vIGEgZmluaXRlIHNvdW5kIGhhcyBhIGR1cmF0aW9uIG9mIEluZmluaXR5LlxuICAgICAgICBzZWxmLl9lbmRGbiA9IHNlbGYuX2VuZExpc3RlbmVyLmJpbmQoc2VsZik7XG4gICAgICAgIHNlbGYuX25vZGUuYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBzZWxmLl9lbmRGbiwgZmFsc2UpO1xuXG4gICAgICAgIC8vIFNldHVwIHRoZSBuZXcgYXVkaW8gbm9kZS5cbiAgICAgICAgc2VsZi5fbm9kZS5zcmMgPSBwYXJlbnQuX3NyYztcbiAgICAgICAgc2VsZi5fbm9kZS5wcmVsb2FkID0gcGFyZW50Ll9wcmVsb2FkID09PSB0cnVlID8gJ2F1dG8nIDogcGFyZW50Ll9wcmVsb2FkO1xuICAgICAgICBzZWxmLl9ub2RlLnZvbHVtZSA9IHZvbHVtZSAqIEhvd2xlci52b2x1bWUoKTtcblxuICAgICAgICAvLyBCZWdpbiBsb2FkaW5nIHRoZSBzb3VyY2UuXG4gICAgICAgIHNlbGYuX25vZGUubG9hZCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVzZXQgdGhlIHBhcmFtZXRlcnMgb2YgdGhpcyBzb3VuZCB0byB0aGUgb3JpZ2luYWwgc3RhdGUgKGZvciByZWN5Y2xlKS5cbiAgICAgKiBAcmV0dXJuIHtTb3VuZH1cbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGFyZW50ID0gc2VsZi5fcGFyZW50O1xuXG4gICAgICAvLyBSZXNldCBhbGwgb2YgdGhlIHBhcmFtZXRlcnMgb2YgdGhpcyBzb3VuZC5cbiAgICAgIHNlbGYuX211dGVkID0gcGFyZW50Ll9tdXRlZDtcbiAgICAgIHNlbGYuX2xvb3AgPSBwYXJlbnQuX2xvb3A7XG4gICAgICBzZWxmLl92b2x1bWUgPSBwYXJlbnQuX3ZvbHVtZTtcbiAgICAgIHNlbGYuX3JhdGUgPSBwYXJlbnQuX3JhdGU7XG4gICAgICBzZWxmLl9zZWVrID0gMDtcbiAgICAgIHNlbGYuX3JhdGVTZWVrID0gMDtcbiAgICAgIHNlbGYuX3BhdXNlZCA9IHRydWU7XG4gICAgICBzZWxmLl9lbmRlZCA9IHRydWU7XG4gICAgICBzZWxmLl9zcHJpdGUgPSAnX19kZWZhdWx0JztcblxuICAgICAgLy8gR2VuZXJhdGUgYSBuZXcgSUQgc28gdGhhdCBpdCBpc24ndCBjb25mdXNlZCB3aXRoIHRoZSBwcmV2aW91cyBzb3VuZC5cbiAgICAgIHNlbGYuX2lkID0gKytIb3dsZXIuX2NvdW50ZXI7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIVE1MNSBBdWRpbyBlcnJvciBsaXN0ZW5lciBjYWxsYmFjay5cbiAgICAgKi9cbiAgICBfZXJyb3JMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIEZpcmUgYW4gZXJyb3IgZXZlbnQgYW5kIHBhc3MgYmFjayB0aGUgY29kZS5cbiAgICAgIHNlbGYuX3BhcmVudC5fZW1pdCgnbG9hZGVycm9yJywgc2VsZi5faWQsIHNlbGYuX25vZGUuZXJyb3IgPyBzZWxmLl9ub2RlLmVycm9yLmNvZGUgOiAwKTtcblxuICAgICAgLy8gQ2xlYXIgdGhlIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgc2VsZi5fbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIHNlbGYuX2Vycm9yRm4sIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSFRNTDUgQXVkaW8gY2FucGxheXRocm91Z2ggbGlzdGVuZXIgY2FsbGJhY2suXG4gICAgICovXG4gICAgX2xvYWRMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGFyZW50ID0gc2VsZi5fcGFyZW50O1xuXG4gICAgICAvLyBSb3VuZCB1cCB0aGUgZHVyYXRpb24gdG8gYWNjb3VudCBmb3IgdGhlIGxvd2VyIHByZWNpc2lvbiBpbiBIVE1MNSBBdWRpby5cbiAgICAgIHBhcmVudC5fZHVyYXRpb24gPSBNYXRoLmNlaWwoc2VsZi5fbm9kZS5kdXJhdGlvbiAqIDEwKSAvIDEwO1xuXG4gICAgICAvLyBTZXR1cCBhIHNwcml0ZSBpZiBub25lIGlzIGRlZmluZWQuXG4gICAgICBpZiAoT2JqZWN0LmtleXMocGFyZW50Ll9zcHJpdGUpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBwYXJlbnQuX3Nwcml0ZSA9IHtfX2RlZmF1bHQ6IFswLCBwYXJlbnQuX2R1cmF0aW9uICogMTAwMF19O1xuICAgICAgfVxuXG4gICAgICBpZiAocGFyZW50Ll9zdGF0ZSAhPT0gJ2xvYWRlZCcpIHtcbiAgICAgICAgcGFyZW50Ll9zdGF0ZSA9ICdsb2FkZWQnO1xuICAgICAgICBwYXJlbnQuX2VtaXQoJ2xvYWQnKTtcbiAgICAgICAgcGFyZW50Ll9sb2FkUXVldWUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYXIgdGhlIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgc2VsZi5fbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKEhvd2xlci5fY2FuUGxheUV2ZW50LCBzZWxmLl9sb2FkRm4sIGZhbHNlKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSFRNTDUgQXVkaW8gZW5kZWQgbGlzdGVuZXIgY2FsbGJhY2suXG4gICAgICovXG4gICAgX2VuZExpc3RlbmVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBwYXJlbnQgPSBzZWxmLl9wYXJlbnQ7XG5cbiAgICAgIC8vIE9ubHkgaGFuZGxlIHRoZSBgZW5kZWRgYCBldmVudCBpZiB0aGUgZHVyYXRpb24gaXMgSW5maW5pdHkuXG4gICAgICBpZiAocGFyZW50Ll9kdXJhdGlvbiA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSBwYXJlbnQgZHVyYXRpb24gdG8gbWF0Y2ggdGhlIHJlYWwgYXVkaW8gZHVyYXRpb24uXG4gICAgICAgIC8vIFJvdW5kIHVwIHRoZSBkdXJhdGlvbiB0byBhY2NvdW50IGZvciB0aGUgbG93ZXIgcHJlY2lzaW9uIGluIEhUTUw1IEF1ZGlvLlxuICAgICAgICBwYXJlbnQuX2R1cmF0aW9uID0gTWF0aC5jZWlsKHNlbGYuX25vZGUuZHVyYXRpb24gKiAxMCkgLyAxMDtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHNwcml0ZSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSByZWFsIGR1cmF0aW9uLlxuICAgICAgICBpZiAocGFyZW50Ll9zcHJpdGUuX19kZWZhdWx0WzFdID09PSBJbmZpbml0eSkge1xuICAgICAgICAgIHBhcmVudC5fc3ByaXRlLl9fZGVmYXVsdFsxXSA9IHBhcmVudC5fZHVyYXRpb24gKiAxMDAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUnVuIHRoZSByZWd1bGFyIGVuZGVkIG1ldGhvZC5cbiAgICAgICAgcGFyZW50Ll9lbmRlZChzZWxmKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYXIgdGhlIGV2ZW50IGxpc3RlbmVyIHNpbmNlIHRoZSBkdXJhdGlvbiBpcyBub3cgY29ycmVjdC5cbiAgICAgIHNlbGYuX25vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBzZWxmLl9lbmRGbiwgZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvKiogSGVscGVyIE1ldGhvZHMgKiovXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgdmFyIGNhY2hlID0ge307XG5cbiAgLyoqXG4gICAqIEJ1ZmZlciBhIHNvdW5kIGZyb20gVVJMLCBEYXRhIFVSSSBvciBjYWNoZSBhbmQgZGVjb2RlIHRvIGF1ZGlvIHNvdXJjZSAoV2ViIEF1ZGlvIEFQSSkuXG4gICAqIEBwYXJhbSAge0hvd2x9IHNlbGZcbiAgICovXG4gIHZhciBsb2FkQnVmZmVyID0gZnVuY3Rpb24oc2VsZikge1xuICAgIHZhciB1cmwgPSBzZWxmLl9zcmM7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgYnVmZmVyIGhhcyBhbHJlYWR5IGJlZW4gY2FjaGVkIGFuZCB1c2UgaXQgaW5zdGVhZC5cbiAgICBpZiAoY2FjaGVbdXJsXSkge1xuICAgICAgLy8gU2V0IHRoZSBkdXJhdGlvbiBmcm9tIHRoZSBjYWNoZS5cbiAgICAgIHNlbGYuX2R1cmF0aW9uID0gY2FjaGVbdXJsXS5kdXJhdGlvbjtcblxuICAgICAgLy8gTG9hZCB0aGUgc291bmQgaW50byB0aGlzIEhvd2wuXG4gICAgICBsb2FkU291bmQoc2VsZik7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoL15kYXRhOlteO10rO2Jhc2U2NCwvLnRlc3QodXJsKSkge1xuICAgICAgLy8gRGVjb2RlIHRoZSBiYXNlNjQgZGF0YSBVUkkgd2l0aG91dCBYSFIsIHNpbmNlIHNvbWUgYnJvd3NlcnMgZG9uJ3Qgc3VwcG9ydCBpdC5cbiAgICAgIHZhciBkYXRhID0gYXRvYih1cmwuc3BsaXQoJywnKVsxXSk7XG4gICAgICB2YXIgZGF0YVZpZXcgPSBuZXcgVWludDhBcnJheShkYXRhLmxlbmd0aCk7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5sZW5ndGg7ICsraSkge1xuICAgICAgICBkYXRhVmlld1tpXSA9IGRhdGEuY2hhckNvZGVBdChpKTtcbiAgICAgIH1cblxuICAgICAgZGVjb2RlQXVkaW9EYXRhKGRhdGFWaWV3LmJ1ZmZlciwgc2VsZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIExvYWQgdGhlIGJ1ZmZlciBmcm9tIHRoZSBVUkwuXG4gICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICB4aHIub3BlbihzZWxmLl94aHIubWV0aG9kLCB1cmwsIHRydWUpO1xuICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHNlbGYuX3hoci53aXRoQ3JlZGVudGlhbHM7XG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcblxuICAgICAgLy8gQXBwbHkgYW55IGN1c3RvbSBoZWFkZXJzIHRvIHRoZSByZXF1ZXN0LlxuICAgICAgaWYgKHNlbGYuX3hoci5oZWFkZXJzKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHNlbGYuX3hoci5oZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKGtleSwgc2VsZi5feGhyLmhlYWRlcnNba2V5XSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBnZXQgYSBzdWNjZXNzZnVsIHJlc3BvbnNlIGJhY2suXG4gICAgICAgIHZhciBjb2RlID0gKHhoci5zdGF0dXMgKyAnJylbMF07XG4gICAgICAgIGlmIChjb2RlICE9PSAnMCcgJiYgY29kZSAhPT0gJzInICYmIGNvZGUgIT09ICczJykge1xuICAgICAgICAgIHNlbGYuX2VtaXQoJ2xvYWRlcnJvcicsIG51bGwsICdGYWlsZWQgbG9hZGluZyBhdWRpbyBmaWxlIHdpdGggc3RhdHVzOiAnICsgeGhyLnN0YXR1cyArICcuJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVjb2RlQXVkaW9EYXRhKHhoci5yZXNwb25zZSwgc2VsZik7XG4gICAgICB9O1xuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gZXJyb3IsIHN3aXRjaCB0byBIVE1MNSBBdWRpby5cbiAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgc2VsZi5faHRtbDUgPSB0cnVlO1xuICAgICAgICAgIHNlbGYuX3dlYkF1ZGlvID0gZmFsc2U7XG4gICAgICAgICAgc2VsZi5fc291bmRzID0gW107XG4gICAgICAgICAgZGVsZXRlIGNhY2hlW3VybF07XG4gICAgICAgICAgc2VsZi5sb2FkKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBzYWZlWGhyU2VuZCh4aHIpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogU2VuZCB0aGUgWEhSIHJlcXVlc3Qgd3JhcHBlZCBpbiBhIHRyeS9jYXRjaC5cbiAgICogQHBhcmFtICB7T2JqZWN0fSB4aHIgWEhSIHRvIHNlbmQuXG4gICAqL1xuICB2YXIgc2FmZVhoclNlbmQgPSBmdW5jdGlvbih4aHIpIHtcbiAgICB0cnkge1xuICAgICAgeGhyLnNlbmQoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB4aHIub25lcnJvcigpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGVjb2RlIGF1ZGlvIGRhdGEgZnJvbSBhbiBhcnJheSBidWZmZXIuXG4gICAqIEBwYXJhbSAge0FycmF5QnVmZmVyfSBhcnJheWJ1ZmZlciBUaGUgYXVkaW8gZGF0YS5cbiAgICogQHBhcmFtICB7SG93bH0gICAgICAgIHNlbGZcbiAgICovXG4gIHZhciBkZWNvZGVBdWRpb0RhdGEgPSBmdW5jdGlvbihhcnJheWJ1ZmZlciwgc2VsZikge1xuICAgIC8vIEZpcmUgYSBsb2FkIGVycm9yIGlmIHNvbWV0aGluZyBicm9rZS5cbiAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuX2VtaXQoJ2xvYWRlcnJvcicsIG51bGwsICdEZWNvZGluZyBhdWRpbyBkYXRhIGZhaWxlZC4nKTtcbiAgICB9O1xuXG4gICAgLy8gTG9hZCB0aGUgc291bmQgb24gc3VjY2Vzcy5cbiAgICB2YXIgc3VjY2VzcyA9IGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgaWYgKGJ1ZmZlciAmJiBzZWxmLl9zb3VuZHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjYWNoZVtzZWxmLl9zcmNdID0gYnVmZmVyO1xuICAgICAgICBsb2FkU291bmQoc2VsZiwgYnVmZmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9yKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIERlY29kZSB0aGUgYnVmZmVyIGludG8gYW4gYXVkaW8gc291cmNlLlxuICAgIGlmICh0eXBlb2YgUHJvbWlzZSAhPT0gJ3VuZGVmaW5lZCcgJiYgSG93bGVyLmN0eC5kZWNvZGVBdWRpb0RhdGEubGVuZ3RoID09PSAxKSB7XG4gICAgICBIb3dsZXIuY3R4LmRlY29kZUF1ZGlvRGF0YShhcnJheWJ1ZmZlcikudGhlbihzdWNjZXNzKS5jYXRjaChlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIEhvd2xlci5jdHguZGVjb2RlQXVkaW9EYXRhKGFycmF5YnVmZmVyLCBzdWNjZXNzLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNvdW5kIGlzIG5vdyBsb2FkZWQsIHNvIGZpbmlzaCBzZXR0aW5nIGV2ZXJ5dGhpbmcgdXAgYW5kIGZpcmUgdGhlIGxvYWRlZCBldmVudC5cbiAgICogQHBhcmFtICB7SG93bH0gc2VsZlxuICAgKiBAcGFyYW0gIHtPYmplY3R9IGJ1ZmZlciBUaGUgZGVjb2RlZCBidWZmZXIgc291bmQgc291cmNlLlxuICAgKi9cbiAgdmFyIGxvYWRTb3VuZCA9IGZ1bmN0aW9uKHNlbGYsIGJ1ZmZlcikge1xuICAgIC8vIFNldCB0aGUgZHVyYXRpb24uXG4gICAgaWYgKGJ1ZmZlciAmJiAhc2VsZi5fZHVyYXRpb24pIHtcbiAgICAgIHNlbGYuX2R1cmF0aW9uID0gYnVmZmVyLmR1cmF0aW9uO1xuICAgIH1cblxuICAgIC8vIFNldHVwIGEgc3ByaXRlIGlmIG5vbmUgaXMgZGVmaW5lZC5cbiAgICBpZiAoT2JqZWN0LmtleXMoc2VsZi5fc3ByaXRlKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHNlbGYuX3Nwcml0ZSA9IHtfX2RlZmF1bHQ6IFswLCBzZWxmLl9kdXJhdGlvbiAqIDEwMDBdfTtcbiAgICB9XG5cbiAgICAvLyBGaXJlIHRoZSBsb2FkZWQgZXZlbnQuXG4gICAgaWYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJykge1xuICAgICAgc2VsZi5fc3RhdGUgPSAnbG9hZGVkJztcbiAgICAgIHNlbGYuX2VtaXQoJ2xvYWQnKTtcbiAgICAgIHNlbGYuX2xvYWRRdWV1ZSgpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogU2V0dXAgdGhlIGF1ZGlvIGNvbnRleHQgd2hlbiBhdmFpbGFibGUsIG9yIHN3aXRjaCB0byBIVE1MNSBBdWRpbyBtb2RlLlxuICAgKi9cbiAgdmFyIHNldHVwQXVkaW9Db250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBhbHJlYWR5IGRldGVjdGVkIHRoYXQgV2ViIEF1ZGlvIGlzbid0IHN1cHBvcnRlZCwgZG9uJ3QgcnVuIHRoaXMgc3RlcCBhZ2Fpbi5cbiAgICBpZiAoIUhvd2xlci51c2luZ1dlYkF1ZGlvKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgd2UgYXJlIHVzaW5nIFdlYiBBdWRpbyBhbmQgc2V0dXAgdGhlIEF1ZGlvQ29udGV4dCBpZiB3ZSBhcmUuXG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgQXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBIb3dsZXIuY3R4ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2Via2l0QXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBIb3dsZXIuY3R4ID0gbmV3IHdlYmtpdEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgSG93bGVyLnVzaW5nV2ViQXVkaW8gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIEhvd2xlci51c2luZ1dlYkF1ZGlvID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGF1ZGlvIGNvbnRleHQgY3JlYXRpb24gc3RpbGwgZmFpbGVkLCBzZXQgdXNpbmcgd2ViIGF1ZGlvIHRvIGZhbHNlLlxuICAgIGlmICghSG93bGVyLmN0eCkge1xuICAgICAgSG93bGVyLnVzaW5nV2ViQXVkaW8gPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiBhIHdlYnZpZXcgaXMgYmVpbmcgdXNlZCBvbiBpT1M4IG9yIGVhcmxpZXIgKHJhdGhlciB0aGFuIHRoZSBicm93c2VyKS5cbiAgICAvLyBJZiBpdCBpcywgZGlzYWJsZSBXZWIgQXVkaW8gYXMgaXQgY2F1c2VzIGNyYXNoaW5nLlxuICAgIHZhciBpT1MgPSAoL2lQKGhvbmV8b2R8YWQpLy50ZXN0KEhvd2xlci5fbmF2aWdhdG9yICYmIEhvd2xlci5fbmF2aWdhdG9yLnBsYXRmb3JtKSk7XG4gICAgdmFyIGFwcFZlcnNpb24gPSBIb3dsZXIuX25hdmlnYXRvciAmJiBIb3dsZXIuX25hdmlnYXRvci5hcHBWZXJzaW9uLm1hdGNoKC9PUyAoXFxkKylfKFxcZCspXz8oXFxkKyk/Lyk7XG4gICAgdmFyIHZlcnNpb24gPSBhcHBWZXJzaW9uID8gcGFyc2VJbnQoYXBwVmVyc2lvblsxXSwgMTApIDogbnVsbDtcbiAgICBpZiAoaU9TICYmIHZlcnNpb24gJiYgdmVyc2lvbiA8IDkpIHtcbiAgICAgIHZhciBzYWZhcmkgPSAvc2FmYXJpLy50ZXN0KEhvd2xlci5fbmF2aWdhdG9yICYmIEhvd2xlci5fbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIGlmIChIb3dsZXIuX25hdmlnYXRvciAmJiAhc2FmYXJpKSB7XG4gICAgICAgIEhvd2xlci51c2luZ1dlYkF1ZGlvID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBleHBvc2UgdGhlIG1hc3RlciBHYWluTm9kZSB3aGVuIHVzaW5nIFdlYiBBdWRpbyAodXNlZnVsIGZvciBwbHVnaW5zIG9yIGFkdmFuY2VkIHVzYWdlKS5cbiAgICBpZiAoSG93bGVyLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgIEhvd2xlci5tYXN0ZXJHYWluID0gKHR5cGVvZiBIb3dsZXIuY3R4LmNyZWF0ZUdhaW4gPT09ICd1bmRlZmluZWQnKSA/IEhvd2xlci5jdHguY3JlYXRlR2Fpbk5vZGUoKSA6IEhvd2xlci5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgSG93bGVyLm1hc3RlckdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZShIb3dsZXIuX211dGVkID8gMCA6IEhvd2xlci5fdm9sdW1lLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgIEhvd2xlci5tYXN0ZXJHYWluLmNvbm5lY3QoSG93bGVyLmN0eC5kZXN0aW5hdGlvbik7XG4gICAgfVxuXG4gICAgLy8gUmUtcnVuIHRoZSBzZXR1cCBvbiBIb3dsZXIuXG4gICAgSG93bGVyLl9zZXR1cCgpO1xuICB9O1xuXG4gIC8vIEFkZCBzdXBwb3J0IGZvciBBTUQgKEFzeW5jaHJvbm91cyBNb2R1bGUgRGVmaW5pdGlvbikgbGlicmFyaWVzIHN1Y2ggYXMgcmVxdWlyZS5qcy5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBIb3dsZXI6IEhvd2xlcixcbiAgICAgICAgSG93bDogSG93bFxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEFkZCBzdXBwb3J0IGZvciBDb21tb25KUyBsaWJyYXJpZXMgc3VjaCBhcyBicm93c2VyaWZ5LlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgZXhwb3J0cy5Ib3dsZXIgPSBIb3dsZXI7XG4gICAgZXhwb3J0cy5Ib3dsID0gSG93bDtcbiAgfVxuXG4gIC8vIEFkZCB0byBnbG9iYWwgaW4gTm9kZS5qcyAoZm9yIHRlc3RpbmcsIGV0YykuXG4gIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgIGdsb2JhbC5Ib3dsZXJHbG9iYWwgPSBIb3dsZXJHbG9iYWw7XG4gICAgZ2xvYmFsLkhvd2xlciA9IEhvd2xlcjtcbiAgICBnbG9iYWwuSG93bCA9IEhvd2w7XG4gICAgZ2xvYmFsLlNvdW5kID0gU291bmQ7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHsgIC8vIERlZmluZSBnbG9iYWxseSBpbiBjYXNlIEFNRCBpcyBub3QgYXZhaWxhYmxlIG9yIHVudXNlZC5cbiAgICB3aW5kb3cuSG93bGVyR2xvYmFsID0gSG93bGVyR2xvYmFsO1xuICAgIHdpbmRvdy5Ib3dsZXIgPSBIb3dsZXI7XG4gICAgd2luZG93Lkhvd2wgPSBIb3dsO1xuICAgIHdpbmRvdy5Tb3VuZCA9IFNvdW5kO1xuICB9XG59KSgpO1xuXG5cbi8qIVxuICogIFNwYXRpYWwgUGx1Z2luIC0gQWRkcyBzdXBwb3J0IGZvciBzdGVyZW8gYW5kIDNEIGF1ZGlvIHdoZXJlIFdlYiBBdWRpbyBpcyBzdXBwb3J0ZWQuXG4gKiAgXG4gKiAgaG93bGVyLmpzIHYyLjIuM1xuICogIGhvd2xlcmpzLmNvbVxuICpcbiAqICAoYykgMjAxMy0yMDIwLCBKYW1lcyBTaW1wc29uIG9mIEdvbGRGaXJlIFN0dWRpb3NcbiAqICBnb2xkZmlyZXN0dWRpb3MuY29tXG4gKlxuICogIE1JVCBMaWNlbnNlXG4gKi9cblxuKGZ1bmN0aW9uKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvLyBTZXR1cCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIEhvd2xlckdsb2JhbC5wcm90b3R5cGUuX3BvcyA9IFswLCAwLCAwXTtcbiAgSG93bGVyR2xvYmFsLnByb3RvdHlwZS5fb3JpZW50YXRpb24gPSBbMCwgMCwgLTEsIDAsIDEsIDBdO1xuXG4gIC8qKiBHbG9iYWwgTWV0aG9kcyAqKi9cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogSGVscGVyIG1ldGhvZCB0byB1cGRhdGUgdGhlIHN0ZXJlbyBwYW5uaW5nIHBvc2l0aW9uIG9mIGFsbCBjdXJyZW50IEhvd2xzLlxuICAgKiBGdXR1cmUgSG93bHMgd2lsbCBub3QgdXNlIHRoaXMgdmFsdWUgdW5sZXNzIGV4cGxpY2l0bHkgc2V0LlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHBhbiBBIHZhbHVlIG9mIC0xLjAgaXMgYWxsIHRoZSB3YXkgbGVmdCBhbmQgMS4wIGlzIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgKiBAcmV0dXJuIHtIb3dsZXIvTnVtYmVyfSAgICAgU2VsZiBvciBjdXJyZW50IHN0ZXJlbyBwYW5uaW5nIHZhbHVlLlxuICAgKi9cbiAgSG93bGVyR2xvYmFsLnByb3RvdHlwZS5zdGVyZW8gPSBmdW5jdGlvbihwYW4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBTdG9wIHJpZ2h0IGhlcmUgaWYgbm90IHVzaW5nIFdlYiBBdWRpby5cbiAgICBpZiAoIXNlbGYuY3R4IHx8ICFzZWxmLmN0eC5saXN0ZW5lcikge1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gTG9vcCB0aHJvdWdoIGFsbCBIb3dscyBhbmQgdXBkYXRlIHRoZWlyIHN0ZXJlbyBwYW5uaW5nLlxuICAgIGZvciAodmFyIGk9c2VsZi5faG93bHMubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuICAgICAgc2VsZi5faG93bHNbaV0uc3RlcmVvKHBhbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldC9zZXQgdGhlIHBvc2l0aW9uIG9mIHRoZSBsaXN0ZW5lciBpbiAzRCBjYXJ0ZXNpYW4gc3BhY2UuIFNvdW5kcyB1c2luZ1xuICAgKiAzRCBwb3NpdGlvbiB3aWxsIGJlIHJlbGF0aXZlIHRvIHRoZSBsaXN0ZW5lcidzIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHggVGhlIHgtcG9zaXRpb24gb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHkgVGhlIHktcG9zaXRpb24gb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHogVGhlIHotcG9zaXRpb24gb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcmV0dXJuIHtIb3dsZXIvQXJyYXl9ICAgU2VsZiBvciBjdXJyZW50IGxpc3RlbmVyIHBvc2l0aW9uLlxuICAgKi9cbiAgSG93bGVyR2xvYmFsLnByb3RvdHlwZS5wb3MgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gU3RvcCByaWdodCBoZXJlIGlmIG5vdCB1c2luZyBXZWIgQXVkaW8uXG4gICAgaWYgKCFzZWxmLmN0eCB8fCAhc2VsZi5jdHgubGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgZGVmYXVsdHMgZm9yIG9wdGlvbmFsICd5JyAmICd6Jy5cbiAgICB5ID0gKHR5cGVvZiB5ICE9PSAnbnVtYmVyJykgPyBzZWxmLl9wb3NbMV0gOiB5O1xuICAgIHogPSAodHlwZW9mIHogIT09ICdudW1iZXInKSA/IHNlbGYuX3Bvc1syXSA6IHo7XG5cbiAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSB7XG4gICAgICBzZWxmLl9wb3MgPSBbeCwgeSwgel07XG5cbiAgICAgIGlmICh0eXBlb2Ygc2VsZi5jdHgubGlzdGVuZXIucG9zaXRpb25YICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci5wb3NpdGlvblguc2V0VGFyZ2V0QXRUaW1lKHNlbGYuX3Bvc1swXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIucG9zaXRpb25ZLnNldFRhcmdldEF0VGltZShzZWxmLl9wb3NbMV0sIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLnBvc2l0aW9uWi5zZXRUYXJnZXRBdFRpbWUoc2VsZi5fcG9zWzJdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIuc2V0UG9zaXRpb24oc2VsZi5fcG9zWzBdLCBzZWxmLl9wb3NbMV0sIHNlbGYuX3Bvc1syXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzZWxmLl9wb3M7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldC9zZXQgdGhlIGRpcmVjdGlvbiB0aGUgbGlzdGVuZXIgaXMgcG9pbnRpbmcgaW4gdGhlIDNEIGNhcnRlc2lhbiBzcGFjZS5cbiAgICogQSBmcm9udCBhbmQgdXAgdmVjdG9yIG11c3QgYmUgcHJvdmlkZWQuIFRoZSBmcm9udCBpcyB0aGUgZGlyZWN0aW9uIHRoZVxuICAgKiBmYWNlIG9mIHRoZSBsaXN0ZW5lciBpcyBwb2ludGluZywgYW5kIHVwIGlzIHRoZSBkaXJlY3Rpb24gdGhlIHRvcCBvZiB0aGVcbiAgICogbGlzdGVuZXIgaXMgcG9pbnRpbmcuIFRodXMsIHRoZXNlIHZhbHVlcyBhcmUgZXhwZWN0ZWQgdG8gYmUgYXQgcmlnaHQgYW5nbGVzXG4gICAqIGZyb20gZWFjaCBvdGhlci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB4ICAgVGhlIHgtb3JpZW50YXRpb24gb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHkgICBUaGUgeS1vcmllbnRhdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0geiAgIFRoZSB6LW9yaWVudGF0aW9uIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB4VXAgVGhlIHgtb3JpZW50YXRpb24gb2YgdGhlIHRvcCBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0geVVwIFRoZSB5LW9yaWVudGF0aW9uIG9mIHRoZSB0b3Agb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHpVcCBUaGUgei1vcmllbnRhdGlvbiBvZiB0aGUgdG9wIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHJldHVybiB7SG93bGVyL0FycmF5fSAgICAgUmV0dXJucyBzZWxmIG9yIHRoZSBjdXJyZW50IG9yaWVudGF0aW9uIHZlY3RvcnMuXG4gICAqL1xuICBIb3dsZXJHbG9iYWwucHJvdG90eXBlLm9yaWVudGF0aW9uID0gZnVuY3Rpb24oeCwgeSwgeiwgeFVwLCB5VXAsIHpVcCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFN0b3AgcmlnaHQgaGVyZSBpZiBub3QgdXNpbmcgV2ViIEF1ZGlvLlxuICAgIGlmICghc2VsZi5jdHggfHwgIXNlbGYuY3R4Lmxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGRlZmF1bHRzIGZvciBvcHRpb25hbCAneScgJiAneicuXG4gICAgdmFyIG9yID0gc2VsZi5fb3JpZW50YXRpb247XG4gICAgeSA9ICh0eXBlb2YgeSAhPT0gJ251bWJlcicpID8gb3JbMV0gOiB5O1xuICAgIHogPSAodHlwZW9mIHogIT09ICdudW1iZXInKSA/IG9yWzJdIDogejtcbiAgICB4VXAgPSAodHlwZW9mIHhVcCAhPT0gJ251bWJlcicpID8gb3JbM10gOiB4VXA7XG4gICAgeVVwID0gKHR5cGVvZiB5VXAgIT09ICdudW1iZXInKSA/IG9yWzRdIDogeVVwO1xuICAgIHpVcCA9ICh0eXBlb2YgelVwICE9PSAnbnVtYmVyJykgPyBvcls1XSA6IHpVcDtcblxuICAgIGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHNlbGYuX29yaWVudGF0aW9uID0gW3gsIHksIHosIHhVcCwgeVVwLCB6VXBdO1xuXG4gICAgICBpZiAodHlwZW9mIHNlbGYuY3R4Lmxpc3RlbmVyLmZvcndhcmRYICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci5mb3J3YXJkWC5zZXRUYXJnZXRBdFRpbWUoeCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIuZm9yd2FyZFkuc2V0VGFyZ2V0QXRUaW1lKHksIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLmZvcndhcmRaLnNldFRhcmdldEF0VGltZSh6LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci51cFguc2V0VGFyZ2V0QXRUaW1lKHhVcCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIudXBZLnNldFRhcmdldEF0VGltZSh5VXAsIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLnVwWi5zZXRUYXJnZXRBdFRpbWUoelVwLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIuc2V0T3JpZW50YXRpb24oeCwgeSwgeiwgeFVwLCB5VXAsIHpVcCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBvcjtcbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvKiogR3JvdXAgTWV0aG9kcyAqKi9cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQWRkIG5ldyBwcm9wZXJ0aWVzIHRvIHRoZSBjb3JlIGluaXQuXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBfc3VwZXIgQ29yZSBpbml0IG1ldGhvZC5cbiAgICogQHJldHVybiB7SG93bH1cbiAgICovXG4gIEhvd2wucHJvdG90eXBlLmluaXQgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG8pIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgLy8gU2V0dXAgdXNlci1kZWZpbmVkIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgICAgIHNlbGYuX29yaWVudGF0aW9uID0gby5vcmllbnRhdGlvbiB8fCBbMSwgMCwgMF07XG4gICAgICBzZWxmLl9zdGVyZW8gPSBvLnN0ZXJlbyB8fCBudWxsO1xuICAgICAgc2VsZi5fcG9zID0gby5wb3MgfHwgbnVsbDtcbiAgICAgIHNlbGYuX3Bhbm5lckF0dHIgPSB7XG4gICAgICAgIGNvbmVJbm5lckFuZ2xlOiB0eXBlb2Ygby5jb25lSW5uZXJBbmdsZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLmNvbmVJbm5lckFuZ2xlIDogMzYwLFxuICAgICAgICBjb25lT3V0ZXJBbmdsZTogdHlwZW9mIG8uY29uZU91dGVyQW5nbGUgIT09ICd1bmRlZmluZWQnID8gby5jb25lT3V0ZXJBbmdsZSA6IDM2MCxcbiAgICAgICAgY29uZU91dGVyR2FpbjogdHlwZW9mIG8uY29uZU91dGVyR2FpbiAhPT0gJ3VuZGVmaW5lZCcgPyBvLmNvbmVPdXRlckdhaW4gOiAwLFxuICAgICAgICBkaXN0YW5jZU1vZGVsOiB0eXBlb2Ygby5kaXN0YW5jZU1vZGVsICE9PSAndW5kZWZpbmVkJyA/IG8uZGlzdGFuY2VNb2RlbCA6ICdpbnZlcnNlJyxcbiAgICAgICAgbWF4RGlzdGFuY2U6IHR5cGVvZiBvLm1heERpc3RhbmNlICE9PSAndW5kZWZpbmVkJyA/IG8ubWF4RGlzdGFuY2UgOiAxMDAwMCxcbiAgICAgICAgcGFubmluZ01vZGVsOiB0eXBlb2Ygby5wYW5uaW5nTW9kZWwgIT09ICd1bmRlZmluZWQnID8gby5wYW5uaW5nTW9kZWwgOiAnSFJURicsXG4gICAgICAgIHJlZkRpc3RhbmNlOiB0eXBlb2Ygby5yZWZEaXN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLnJlZkRpc3RhbmNlIDogMSxcbiAgICAgICAgcm9sbG9mZkZhY3RvcjogdHlwZW9mIG8ucm9sbG9mZkZhY3RvciAhPT0gJ3VuZGVmaW5lZCcgPyBvLnJvbGxvZmZGYWN0b3IgOiAxXG4gICAgICB9O1xuXG4gICAgICAvLyBTZXR1cCBldmVudCBsaXN0ZW5lcnMuXG4gICAgICBzZWxmLl9vbnN0ZXJlbyA9IG8ub25zdGVyZW8gPyBbe2ZuOiBvLm9uc3RlcmVvfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ucG9zID0gby5vbnBvcyA/IFt7Zm46IG8ub25wb3N9XSA6IFtdO1xuICAgICAgc2VsZi5fb25vcmllbnRhdGlvbiA9IG8ub25vcmllbnRhdGlvbiA/IFt7Zm46IG8ub25vcmllbnRhdGlvbn1dIDogW107XG5cbiAgICAgIC8vIENvbXBsZXRlIGluaXRpbGl6YXRpb24gd2l0aCBob3dsZXIuanMgY29yZSdzIGluaXQgZnVuY3Rpb24uXG4gICAgICByZXR1cm4gX3N1cGVyLmNhbGwodGhpcywgbyk7XG4gICAgfTtcbiAgfSkoSG93bC5wcm90b3R5cGUuaW5pdCk7XG5cbiAgLyoqXG4gICAqIEdldC9zZXQgdGhlIHN0ZXJlbyBwYW5uaW5nIG9mIHRoZSBhdWRpbyBzb3VyY2UgZm9yIHRoaXMgc291bmQgb3IgYWxsIGluIHRoZSBncm91cC5cbiAgICogQHBhcmFtICB7TnVtYmVyfSBwYW4gIEEgdmFsdWUgb2YgLTEuMCBpcyBhbGwgdGhlIHdheSBsZWZ0IGFuZCAxLjAgaXMgYWxsIHRoZSB3YXkgcmlnaHQuXG4gICAqIEBwYXJhbSAge051bWJlcn0gaWQgKG9wdGlvbmFsKSBUaGUgc291bmQgSUQuIElmIG5vbmUgaXMgcGFzc2VkLCBhbGwgaW4gZ3JvdXAgd2lsbCBiZSB1cGRhdGVkLlxuICAgKiBAcmV0dXJuIHtIb3dsL051bWJlcn0gICAgUmV0dXJucyBzZWxmIG9yIHRoZSBjdXJyZW50IHN0ZXJlbyBwYW5uaW5nIHZhbHVlLlxuICAgKi9cbiAgSG93bC5wcm90b3R5cGUuc3RlcmVvID0gZnVuY3Rpb24ocGFuLCBpZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFN0b3AgcmlnaHQgaGVyZSBpZiBub3QgdXNpbmcgV2ViIEF1ZGlvLlxuICAgIGlmICghc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gY2hhbmdlIHN0ZXJlbyBwYW4gd2hlbiBjYXBhYmxlLlxuICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcpIHtcbiAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICBldmVudDogJ3N0ZXJlbycsXG4gICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2VsZi5zdGVyZW8ocGFuLCBpZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgUGFubmVyU3RlcmVvTm9kZSBzdXBwb3J0IGFuZCBmYWxsYmFjayB0byBQYW5uZXJOb2RlIGlmIGl0IGRvZXNuJ3QgZXhpc3QuXG4gICAgdmFyIHBhbm5lclR5cGUgPSAodHlwZW9mIEhvd2xlci5jdHguY3JlYXRlU3RlcmVvUGFubmVyID09PSAndW5kZWZpbmVkJykgPyAnc3BhdGlhbCcgOiAnc3RlcmVvJztcblxuICAgIC8vIFNldHVwIHRoZSBncm91cCdzIHN0ZXJlbyBwYW5uaW5nIGlmIG5vIElEIGlzIHBhc3NlZC5cbiAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gUmV0dXJuIHRoZSBncm91cCdzIHN0ZXJlbyBwYW5uaW5nIGlmIG5vIHBhcmFtZXRlcnMgYXJlIHBhc3NlZC5cbiAgICAgIGlmICh0eXBlb2YgcGFuID09PSAnbnVtYmVyJykge1xuICAgICAgICBzZWxmLl9zdGVyZW8gPSBwYW47XG4gICAgICAgIHNlbGYuX3BvcyA9IFtwYW4sIDAsIDBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuX3N0ZXJlbztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGFuZ2UgdGhlIHN0cmVvIHBhbm5pbmcgb2Ygb25lIG9yIGFsbCBzb3VuZHMgaW4gZ3JvdXAuXG4gICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKGlkKTtcbiAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkc1tpXSk7XG5cbiAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICBpZiAodHlwZW9mIHBhbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICBzb3VuZC5fc3RlcmVvID0gcGFuO1xuICAgICAgICAgIHNvdW5kLl9wb3MgPSBbcGFuLCAwLCAwXTtcblxuICAgICAgICAgIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgLy8gSWYgd2UgYXJlIGZhbGxpbmcgYmFjaywgbWFrZSBzdXJlIHRoZSBwYW5uaW5nTW9kZWwgaXMgZXF1YWxwb3dlci5cbiAgICAgICAgICAgIHNvdW5kLl9wYW5uZXJBdHRyLnBhbm5pbmdNb2RlbCA9ICdlcXVhbHBvd2VyJztcblxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYSBwYW5uZXIgc2V0dXAgYW5kIGNyZWF0ZSBhIG5ldyBvbmUgaWYgbm90LlxuICAgICAgICAgICAgaWYgKCFzb3VuZC5fcGFubmVyIHx8ICFzb3VuZC5fcGFubmVyLnBhbikge1xuICAgICAgICAgICAgICBzZXR1cFBhbm5lcihzb3VuZCwgcGFubmVyVHlwZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwYW5uZXJUeXBlID09PSAnc3BhdGlhbCcpIHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWC5zZXRWYWx1ZUF0VGltZShwYW4sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25ZLnNldFZhbHVlQXRUaW1lKDAsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25aLnNldFZhbHVlQXRUaW1lKDAsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIuc2V0UG9zaXRpb24ocGFuLCAwLCAwKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5wYW4uc2V0VmFsdWVBdFRpbWUocGFuLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLl9lbWl0KCdzdGVyZW8nLCBzb3VuZC5faWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzb3VuZC5fc3RlcmVvO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldC9zZXQgdGhlIDNEIHNwYXRpYWwgcG9zaXRpb24gb2YgdGhlIGF1ZGlvIHNvdXJjZSBmb3IgdGhpcyBzb3VuZCBvciBncm91cCByZWxhdGl2ZSB0byB0aGUgZ2xvYmFsIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHggIFRoZSB4LXBvc2l0aW9uIG9mIHRoZSBhdWRpbyBzb3VyY2UuXG4gICAqIEBwYXJhbSAge051bWJlcn0geSAgVGhlIHktcG9zaXRpb24gb2YgdGhlIGF1ZGlvIHNvdXJjZS5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB6ICBUaGUgei1wb3NpdGlvbiBvZiB0aGUgYXVkaW8gc291cmNlLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIChvcHRpb25hbCkgVGhlIHNvdW5kIElELiBJZiBub25lIGlzIHBhc3NlZCwgYWxsIGluIGdyb3VwIHdpbGwgYmUgdXBkYXRlZC5cbiAgICogQHJldHVybiB7SG93bC9BcnJheX0gICAgUmV0dXJucyBzZWxmIG9yIHRoZSBjdXJyZW50IDNEIHNwYXRpYWwgcG9zaXRpb246IFt4LCB5LCB6XS5cbiAgICovXG4gIEhvd2wucHJvdG90eXBlLnBvcyA9IGZ1bmN0aW9uKHgsIHksIHosIGlkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gU3RvcCByaWdodCBoZXJlIGlmIG5vdCB1c2luZyBXZWIgQXVkaW8uXG4gICAgaWYgKCFzZWxmLl93ZWJBdWRpbykge1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBjaGFuZ2UgcG9zaXRpb24gd2hlbiBjYXBhYmxlLlxuICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcpIHtcbiAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICBldmVudDogJ3BvcycsXG4gICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2VsZi5wb3MoeCwgeSwgeiwgaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBkZWZhdWx0cyBmb3Igb3B0aW9uYWwgJ3knICYgJ3onLlxuICAgIHkgPSAodHlwZW9mIHkgIT09ICdudW1iZXInKSA/IDAgOiB5O1xuICAgIHogPSAodHlwZW9mIHogIT09ICdudW1iZXInKSA/IC0wLjUgOiB6O1xuXG4gICAgLy8gU2V0dXAgdGhlIGdyb3VwJ3Mgc3BhdGlhbCBwb3NpdGlvbiBpZiBubyBJRCBpcyBwYXNzZWQuXG4gICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIFJldHVybiB0aGUgZ3JvdXAncyBzcGF0aWFsIHBvc2l0aW9uIGlmIG5vIHBhcmFtZXRlcnMgYXJlIHBhc3NlZC5cbiAgICAgIGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc2VsZi5fcG9zID0gW3gsIHksIHpdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuX3BvcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGFuZ2UgdGhlIHNwYXRpYWwgcG9zaXRpb24gb2Ygb25lIG9yIGFsbCBzb3VuZHMgaW4gZ3JvdXAuXG4gICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKGlkKTtcbiAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkc1tpXSk7XG5cbiAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgc291bmQuX3BvcyA9IFt4LCB5LCB6XTtcblxuICAgICAgICAgIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYSBwYW5uZXIgc2V0dXAgYW5kIGNyZWF0ZSBhIG5ldyBvbmUgaWYgbm90LlxuICAgICAgICAgICAgaWYgKCFzb3VuZC5fcGFubmVyIHx8IHNvdW5kLl9wYW5uZXIucGFuKSB7XG4gICAgICAgICAgICAgIHNldHVwUGFubmVyKHNvdW5kLCAnc3BhdGlhbCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdW5kLl9wYW5uZXIucG9zaXRpb25YICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWC5zZXRWYWx1ZUF0VGltZSh4LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblkuc2V0VmFsdWVBdFRpbWUoeSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25aLnNldFZhbHVlQXRUaW1lKHosIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5zZXRQb3NpdGlvbih4LCB5LCB6KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLl9lbWl0KCdwb3MnLCBzb3VuZC5faWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzb3VuZC5fcG9zO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdldC9zZXQgdGhlIGRpcmVjdGlvbiB0aGUgYXVkaW8gc291cmNlIGlzIHBvaW50aW5nIGluIHRoZSAzRCBjYXJ0ZXNpYW4gY29vcmRpbmF0ZVxuICAgKiBzcGFjZS4gRGVwZW5kaW5nIG9uIGhvdyBkaXJlY3Rpb24gdGhlIHNvdW5kIGlzLCBiYXNlZCBvbiB0aGUgYGNvbmVgIGF0dHJpYnV0ZXMsXG4gICAqIGEgc291bmQgcG9pbnRpbmcgYXdheSBmcm9tIHRoZSBsaXN0ZW5lciBjYW4gYmUgcXVpZXQgb3Igc2lsZW50LlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHggIFRoZSB4LW9yaWVudGF0aW9uIG9mIHRoZSBzb3VyY2UuXG4gICAqIEBwYXJhbSAge051bWJlcn0geSAgVGhlIHktb3JpZW50YXRpb24gb2YgdGhlIHNvdXJjZS5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB6ICBUaGUgei1vcmllbnRhdGlvbiBvZiB0aGUgc291cmNlLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIChvcHRpb25hbCkgVGhlIHNvdW5kIElELiBJZiBub25lIGlzIHBhc3NlZCwgYWxsIGluIGdyb3VwIHdpbGwgYmUgdXBkYXRlZC5cbiAgICogQHJldHVybiB7SG93bC9BcnJheX0gICAgUmV0dXJucyBzZWxmIG9yIHRoZSBjdXJyZW50IDNEIHNwYXRpYWwgb3JpZW50YXRpb246IFt4LCB5LCB6XS5cbiAgICovXG4gIEhvd2wucHJvdG90eXBlLm9yaWVudGF0aW9uID0gZnVuY3Rpb24oeCwgeSwgeiwgaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBTdG9wIHJpZ2h0IGhlcmUgaWYgbm90IHVzaW5nIFdlYiBBdWRpby5cbiAgICBpZiAoIXNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCwgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIGNoYW5nZSBvcmllbnRhdGlvbiB3aGVuIGNhcGFibGUuXG4gICAgaWYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJykge1xuICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgIGV2ZW50OiAnb3JpZW50YXRpb24nLFxuICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlbGYub3JpZW50YXRpb24oeCwgeSwgeiwgaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBkZWZhdWx0cyBmb3Igb3B0aW9uYWwgJ3knICYgJ3onLlxuICAgIHkgPSAodHlwZW9mIHkgIT09ICdudW1iZXInKSA/IHNlbGYuX29yaWVudGF0aW9uWzFdIDogeTtcbiAgICB6ID0gKHR5cGVvZiB6ICE9PSAnbnVtYmVyJykgPyBzZWxmLl9vcmllbnRhdGlvblsyXSA6IHo7XG5cbiAgICAvLyBTZXR1cCB0aGUgZ3JvdXAncyBzcGF0aWFsIG9yaWVudGF0aW9uIGlmIG5vIElEIGlzIHBhc3NlZC5cbiAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gUmV0dXJuIHRoZSBncm91cCdzIHNwYXRpYWwgb3JpZW50YXRpb24gaWYgbm8gcGFyYW1ldGVycyBhcmUgcGFzc2VkLlxuICAgICAgaWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykge1xuICAgICAgICBzZWxmLl9vcmllbnRhdGlvbiA9IFt4LCB5LCB6XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzZWxmLl9vcmllbnRhdGlvbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDaGFuZ2UgdGhlIHNwYXRpYWwgb3JpZW50YXRpb24gb2Ygb25lIG9yIGFsbCBzb3VuZHMgaW4gZ3JvdXAuXG4gICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKGlkKTtcbiAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkc1tpXSk7XG5cbiAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgc291bmQuX29yaWVudGF0aW9uID0gW3gsIHksIHpdO1xuXG4gICAgICAgICAgaWYgKHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhIHBhbm5lciBzZXR1cCBhbmQgY3JlYXRlIGEgbmV3IG9uZSBpZiBub3QuXG4gICAgICAgICAgICBpZiAoIXNvdW5kLl9wYW5uZXIpIHtcbiAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgYSBwb3NpdGlvbiB0byBzZXR1cCB0aGUgbm9kZSB3aXRoLlxuICAgICAgICAgICAgICBpZiAoIXNvdW5kLl9wb3MpIHtcbiAgICAgICAgICAgICAgICBzb3VuZC5fcG9zID0gc2VsZi5fcG9zIHx8IFswLCAwLCAtMC41XTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNldHVwUGFubmVyKHNvdW5kLCAnc3BhdGlhbCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHNvdW5kLl9wYW5uZXIub3JpZW50YXRpb25YICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLm9yaWVudGF0aW9uWC5zZXRWYWx1ZUF0VGltZSh4LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5vcmllbnRhdGlvblkuc2V0VmFsdWVBdFRpbWUoeSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIub3JpZW50YXRpb25aLnNldFZhbHVlQXRUaW1lKHosIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5zZXRPcmllbnRhdGlvbih4LCB5LCB6KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLl9lbWl0KCdvcmllbnRhdGlvbicsIHNvdW5kLl9pZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHNvdW5kLl9vcmllbnRhdGlvbjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQvc2V0IHRoZSBwYW5uZXIgbm9kZSdzIGF0dHJpYnV0ZXMgZm9yIGEgc291bmQgb3IgZ3JvdXAgb2Ygc291bmRzLlxuICAgKiBUaGlzIG1ldGhvZCBjYW4gb3B0aW9uYWxsIHRha2UgMCwgMSBvciAyIGFyZ3VtZW50cy5cbiAgICogICBwYW5uZXJBdHRyKCkgLT4gUmV0dXJucyB0aGUgZ3JvdXAncyB2YWx1ZXMuXG4gICAqICAgcGFubmVyQXR0cihpZCkgLT4gUmV0dXJucyB0aGUgc291bmQgaWQncyB2YWx1ZXMuXG4gICAqICAgcGFubmVyQXR0cihvKSAtPiBTZXQncyB0aGUgdmFsdWVzIG9mIGFsbCBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgKiAgIHBhbm5lckF0dHIobywgaWQpIC0+IFNldCdzIHRoZSB2YWx1ZXMgb2YgcGFzc2VkIHNvdW5kIGlkLlxuICAgKlxuICAgKiAgIEF0dHJpYnV0ZXM6XG4gICAqICAgICBjb25lSW5uZXJBbmdsZSAtICgzNjAgYnkgZGVmYXVsdCkgQSBwYXJhbWV0ZXIgZm9yIGRpcmVjdGlvbmFsIGF1ZGlvIHNvdXJjZXMsIHRoaXMgaXMgYW4gYW5nbGUsIGluIGRlZ3JlZXMsXG4gICAqICAgICAgICAgICAgICAgICAgICAgIGluc2lkZSBvZiB3aGljaCB0aGVyZSB3aWxsIGJlIG5vIHZvbHVtZSByZWR1Y3Rpb24uXG4gICAqICAgICBjb25lT3V0ZXJBbmdsZSAtICgzNjAgYnkgZGVmYXVsdCkgQSBwYXJhbWV0ZXIgZm9yIGRpcmVjdGlvbmFsIGF1ZGlvIHNvdXJjZXMsIHRoaXMgaXMgYW4gYW5nbGUsIGluIGRlZ3JlZXMsXG4gICAqICAgICAgICAgICAgICAgICAgICAgIG91dHNpZGUgb2Ygd2hpY2ggdGhlIHZvbHVtZSB3aWxsIGJlIHJlZHVjZWQgdG8gYSBjb25zdGFudCB2YWx1ZSBvZiBgY29uZU91dGVyR2FpbmAuXG4gICAqICAgICBjb25lT3V0ZXJHYWluIC0gKDAgYnkgZGVmYXVsdCkgQSBwYXJhbWV0ZXIgZm9yIGRpcmVjdGlvbmFsIGF1ZGlvIHNvdXJjZXMsIHRoaXMgaXMgdGhlIGdhaW4gb3V0c2lkZSBvZiB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICBgY29uZU91dGVyQW5nbGVgLiBJdCBpcyBhIGxpbmVhciB2YWx1ZSBpbiB0aGUgcmFuZ2UgYFswLCAxXWAuXG4gICAqICAgICBkaXN0YW5jZU1vZGVsIC0gKCdpbnZlcnNlJyBieSBkZWZhdWx0KSBEZXRlcm1pbmVzIGFsZ29yaXRobSB1c2VkIHRvIHJlZHVjZSB2b2x1bWUgYXMgYXVkaW8gbW92ZXMgYXdheSBmcm9tXG4gICAqICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIuIENhbiBiZSBgbGluZWFyYCwgYGludmVyc2VgIG9yIGBleHBvbmVudGlhbC5cbiAgICogICAgIG1heERpc3RhbmNlIC0gKDEwMDAwIGJ5IGRlZmF1bHQpIFRoZSBtYXhpbXVtIGRpc3RhbmNlIGJldHdlZW4gc291cmNlIGFuZCBsaXN0ZW5lciwgYWZ0ZXIgd2hpY2ggdGhlIHZvbHVtZVxuICAgKiAgICAgICAgICAgICAgICAgICB3aWxsIG5vdCBiZSByZWR1Y2VkIGFueSBmdXJ0aGVyLlxuICAgKiAgICAgcmVmRGlzdGFuY2UgLSAoMSBieSBkZWZhdWx0KSBBIHJlZmVyZW5jZSBkaXN0YW5jZSBmb3IgcmVkdWNpbmcgdm9sdW1lIGFzIHNvdXJjZSBtb3ZlcyBmdXJ0aGVyIGZyb20gdGhlIGxpc3RlbmVyLlxuICAgKiAgICAgICAgICAgICAgICAgICBUaGlzIGlzIHNpbXBseSBhIHZhcmlhYmxlIG9mIHRoZSBkaXN0YW5jZSBtb2RlbCBhbmQgaGFzIGEgZGlmZmVyZW50IGVmZmVjdCBkZXBlbmRpbmcgb24gd2hpY2ggbW9kZWxcbiAgICogICAgICAgICAgICAgICAgICAgaXMgdXNlZCBhbmQgdGhlIHNjYWxlIG9mIHlvdXIgY29vcmRpbmF0ZXMuIEdlbmVyYWxseSwgdm9sdW1lIHdpbGwgYmUgZXF1YWwgdG8gMSBhdCB0aGlzIGRpc3RhbmNlLlxuICAgKiAgICAgcm9sbG9mZkZhY3RvciAtICgxIGJ5IGRlZmF1bHQpIEhvdyBxdWlja2x5IHRoZSB2b2x1bWUgcmVkdWNlcyBhcyBzb3VyY2UgbW92ZXMgZnJvbSBsaXN0ZW5lci4gVGhpcyBpcyBzaW1wbHkgYVxuICAgKiAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlIG9mIHRoZSBkaXN0YW5jZSBtb2RlbCBhbmQgY2FuIGJlIGluIHRoZSByYW5nZSBvZiBgWzAsIDFdYCB3aXRoIGBsaW5lYXJgIGFuZCBgWzAsIOKInl1gXG4gICAqICAgICAgICAgICAgICAgICAgICAgd2l0aCBgaW52ZXJzZWAgYW5kIGBleHBvbmVudGlhbGAuXG4gICAqICAgICBwYW5uaW5nTW9kZWwgLSAoJ0hSVEYnIGJ5IGRlZmF1bHQpIERldGVybWluZXMgd2hpY2ggc3BhdGlhbGl6YXRpb24gYWxnb3JpdGhtIGlzIHVzZWQgdG8gcG9zaXRpb24gYXVkaW8uXG4gICAqICAgICAgICAgICAgICAgICAgICAgQ2FuIGJlIGBIUlRGYCBvciBgZXF1YWxwb3dlcmAuXG4gICAqXG4gICAqIEByZXR1cm4ge0hvd2wvT2JqZWN0fSBSZXR1cm5zIHNlbGYgb3IgY3VycmVudCBwYW5uZXIgYXR0cmlidXRlcy5cbiAgICovXG4gIEhvd2wucHJvdG90eXBlLnBhbm5lckF0dHIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgdmFyIG8sIGlkLCBzb3VuZDtcblxuICAgIC8vIFN0b3AgcmlnaHQgaGVyZSBpZiBub3QgdXNpbmcgV2ViIEF1ZGlvLlxuICAgIGlmICghc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIERldGVybWluZSB0aGUgdmFsdWVzIGJhc2VkIG9uIGFyZ3VtZW50cy5cbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIFJldHVybiB0aGUgZ3JvdXAncyBwYW5uZXIgYXR0cmlidXRlIHZhbHVlcy5cbiAgICAgIHJldHVybiBzZWxmLl9wYW5uZXJBdHRyO1xuICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgbyA9IGFyZ3NbMF07XG5cbiAgICAgICAgLy8gU2V0IHRoZSBncm91J3MgcGFubmVyIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICAgIGlmICh0eXBlb2YgaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgaWYgKCFvLnBhbm5lckF0dHIpIHtcbiAgICAgICAgICAgIG8ucGFubmVyQXR0ciA9IHtcbiAgICAgICAgICAgICAgY29uZUlubmVyQW5nbGU6IG8uY29uZUlubmVyQW5nbGUsXG4gICAgICAgICAgICAgIGNvbmVPdXRlckFuZ2xlOiBvLmNvbmVPdXRlckFuZ2xlLFxuICAgICAgICAgICAgICBjb25lT3V0ZXJHYWluOiBvLmNvbmVPdXRlckdhaW4sXG4gICAgICAgICAgICAgIGRpc3RhbmNlTW9kZWw6IG8uZGlzdGFuY2VNb2RlbCxcbiAgICAgICAgICAgICAgbWF4RGlzdGFuY2U6IG8ubWF4RGlzdGFuY2UsXG4gICAgICAgICAgICAgIHJlZkRpc3RhbmNlOiBvLnJlZkRpc3RhbmNlLFxuICAgICAgICAgICAgICByb2xsb2ZmRmFjdG9yOiBvLnJvbGxvZmZGYWN0b3IsXG4gICAgICAgICAgICAgIHBhbm5pbmdNb2RlbDogby5wYW5uaW5nTW9kZWxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5fcGFubmVyQXR0ciA9IHtcbiAgICAgICAgICAgIGNvbmVJbm5lckFuZ2xlOiB0eXBlb2Ygby5wYW5uZXJBdHRyLmNvbmVJbm5lckFuZ2xlICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmVyQXR0ci5jb25lSW5uZXJBbmdsZSA6IHNlbGYuX2NvbmVJbm5lckFuZ2xlLFxuICAgICAgICAgICAgY29uZU91dGVyQW5nbGU6IHR5cGVvZiBvLnBhbm5lckF0dHIuY29uZU91dGVyQW5nbGUgIT09ICd1bmRlZmluZWQnID8gby5wYW5uZXJBdHRyLmNvbmVPdXRlckFuZ2xlIDogc2VsZi5fY29uZU91dGVyQW5nbGUsXG4gICAgICAgICAgICBjb25lT3V0ZXJHYWluOiB0eXBlb2Ygby5wYW5uZXJBdHRyLmNvbmVPdXRlckdhaW4gIT09ICd1bmRlZmluZWQnID8gby5wYW5uZXJBdHRyLmNvbmVPdXRlckdhaW4gOiBzZWxmLl9jb25lT3V0ZXJHYWluLFxuICAgICAgICAgICAgZGlzdGFuY2VNb2RlbDogdHlwZW9mIG8ucGFubmVyQXR0ci5kaXN0YW5jZU1vZGVsICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmVyQXR0ci5kaXN0YW5jZU1vZGVsIDogc2VsZi5fZGlzdGFuY2VNb2RlbCxcbiAgICAgICAgICAgIG1heERpc3RhbmNlOiB0eXBlb2Ygby5wYW5uZXJBdHRyLm1heERpc3RhbmNlICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmVyQXR0ci5tYXhEaXN0YW5jZSA6IHNlbGYuX21heERpc3RhbmNlLFxuICAgICAgICAgICAgcmVmRGlzdGFuY2U6IHR5cGVvZiBvLnBhbm5lckF0dHIucmVmRGlzdGFuY2UgIT09ICd1bmRlZmluZWQnID8gby5wYW5uZXJBdHRyLnJlZkRpc3RhbmNlIDogc2VsZi5fcmVmRGlzdGFuY2UsXG4gICAgICAgICAgICByb2xsb2ZmRmFjdG9yOiB0eXBlb2Ygby5wYW5uZXJBdHRyLnJvbGxvZmZGYWN0b3IgIT09ICd1bmRlZmluZWQnID8gby5wYW5uZXJBdHRyLnJvbGxvZmZGYWN0b3IgOiBzZWxmLl9yb2xsb2ZmRmFjdG9yLFxuICAgICAgICAgICAgcGFubmluZ01vZGVsOiB0eXBlb2Ygby5wYW5uZXJBdHRyLnBhbm5pbmdNb2RlbCAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5lckF0dHIucGFubmluZ01vZGVsIDogc2VsZi5fcGFubmluZ01vZGVsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoaXMgc291bmQncyBwYW5uZXIgYXR0cmlidXRlIHZhbHVlcy5cbiAgICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQocGFyc2VJbnQoYXJnc1swXSwgMTApKTtcbiAgICAgICAgcmV0dXJuIHNvdW5kID8gc291bmQuX3Bhbm5lckF0dHIgOiBzZWxmLl9wYW5uZXJBdHRyO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIG8gPSBhcmdzWzBdO1xuICAgICAgaWQgPSBwYXJzZUludChhcmdzWzFdLCAxMCk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHRoZSB2YWx1ZXMgb2YgdGhlIHNwZWNpZmllZCBzb3VuZHMuXG4gICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKGlkKTtcbiAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgLy8gTWVyZ2UgdGhlIG5ldyB2YWx1ZXMgaW50byB0aGUgc291bmQuXG4gICAgICAgIHZhciBwYSA9IHNvdW5kLl9wYW5uZXJBdHRyO1xuICAgICAgICBwYSA9IHtcbiAgICAgICAgICBjb25lSW5uZXJBbmdsZTogdHlwZW9mIG8uY29uZUlubmVyQW5nbGUgIT09ICd1bmRlZmluZWQnID8gby5jb25lSW5uZXJBbmdsZSA6IHBhLmNvbmVJbm5lckFuZ2xlLFxuICAgICAgICAgIGNvbmVPdXRlckFuZ2xlOiB0eXBlb2Ygby5jb25lT3V0ZXJBbmdsZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLmNvbmVPdXRlckFuZ2xlIDogcGEuY29uZU91dGVyQW5nbGUsXG4gICAgICAgICAgY29uZU91dGVyR2FpbjogdHlwZW9mIG8uY29uZU91dGVyR2FpbiAhPT0gJ3VuZGVmaW5lZCcgPyBvLmNvbmVPdXRlckdhaW4gOiBwYS5jb25lT3V0ZXJHYWluLFxuICAgICAgICAgIGRpc3RhbmNlTW9kZWw6IHR5cGVvZiBvLmRpc3RhbmNlTW9kZWwgIT09ICd1bmRlZmluZWQnID8gby5kaXN0YW5jZU1vZGVsIDogcGEuZGlzdGFuY2VNb2RlbCxcbiAgICAgICAgICBtYXhEaXN0YW5jZTogdHlwZW9mIG8ubWF4RGlzdGFuY2UgIT09ICd1bmRlZmluZWQnID8gby5tYXhEaXN0YW5jZSA6IHBhLm1heERpc3RhbmNlLFxuICAgICAgICAgIHJlZkRpc3RhbmNlOiB0eXBlb2Ygby5yZWZEaXN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLnJlZkRpc3RhbmNlIDogcGEucmVmRGlzdGFuY2UsXG4gICAgICAgICAgcm9sbG9mZkZhY3RvcjogdHlwZW9mIG8ucm9sbG9mZkZhY3RvciAhPT0gJ3VuZGVmaW5lZCcgPyBvLnJvbGxvZmZGYWN0b3IgOiBwYS5yb2xsb2ZmRmFjdG9yLFxuICAgICAgICAgIHBhbm5pbmdNb2RlbDogdHlwZW9mIG8ucGFubmluZ01vZGVsICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmluZ01vZGVsIDogcGEucGFubmluZ01vZGVsXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBwYW5uZXIgdmFsdWVzIG9yIGNyZWF0ZSBhIG5ldyBwYW5uZXIgaWYgbm9uZSBleGlzdHMuXG4gICAgICAgIHZhciBwYW5uZXIgPSBzb3VuZC5fcGFubmVyO1xuICAgICAgICBpZiAocGFubmVyKSB7XG4gICAgICAgICAgcGFubmVyLmNvbmVJbm5lckFuZ2xlID0gcGEuY29uZUlubmVyQW5nbGU7XG4gICAgICAgICAgcGFubmVyLmNvbmVPdXRlckFuZ2xlID0gcGEuY29uZU91dGVyQW5nbGU7XG4gICAgICAgICAgcGFubmVyLmNvbmVPdXRlckdhaW4gPSBwYS5jb25lT3V0ZXJHYWluO1xuICAgICAgICAgIHBhbm5lci5kaXN0YW5jZU1vZGVsID0gcGEuZGlzdGFuY2VNb2RlbDtcbiAgICAgICAgICBwYW5uZXIubWF4RGlzdGFuY2UgPSBwYS5tYXhEaXN0YW5jZTtcbiAgICAgICAgICBwYW5uZXIucmVmRGlzdGFuY2UgPSBwYS5yZWZEaXN0YW5jZTtcbiAgICAgICAgICBwYW5uZXIucm9sbG9mZkZhY3RvciA9IHBhLnJvbGxvZmZGYWN0b3I7XG4gICAgICAgICAgcGFubmVyLnBhbm5pbmdNb2RlbCA9IHBhLnBhbm5pbmdNb2RlbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSBhIHBvc2l0aW9uIHRvIHNldHVwIHRoZSBub2RlIHdpdGguXG4gICAgICAgICAgaWYgKCFzb3VuZC5fcG9zKSB7XG4gICAgICAgICAgICBzb3VuZC5fcG9zID0gc2VsZi5fcG9zIHx8IFswLCAwLCAtMC41XTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgcGFubmVyIG5vZGUuXG4gICAgICAgICAgc2V0dXBQYW5uZXIoc291bmQsICdzcGF0aWFsJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvKiogU2luZ2xlIFNvdW5kIE1ldGhvZHMgKiovXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIEFkZCBuZXcgcHJvcGVydGllcyB0byB0aGUgY29yZSBTb3VuZCBpbml0LlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gX3N1cGVyIENvcmUgU291bmQgaW5pdCBtZXRob2QuXG4gICAqIEByZXR1cm4ge1NvdW5kfVxuICAgKi9cbiAgU291bmQucHJvdG90eXBlLmluaXQgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBhcmVudCA9IHNlbGYuX3BhcmVudDtcblxuICAgICAgLy8gU2V0dXAgdXNlci1kZWZpbmVkIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgICAgIHNlbGYuX29yaWVudGF0aW9uID0gcGFyZW50Ll9vcmllbnRhdGlvbjtcbiAgICAgIHNlbGYuX3N0ZXJlbyA9IHBhcmVudC5fc3RlcmVvO1xuICAgICAgc2VsZi5fcG9zID0gcGFyZW50Ll9wb3M7XG4gICAgICBzZWxmLl9wYW5uZXJBdHRyID0gcGFyZW50Ll9wYW5uZXJBdHRyO1xuXG4gICAgICAvLyBDb21wbGV0ZSBpbml0aWxpemF0aW9uIHdpdGggaG93bGVyLmpzIGNvcmUgU291bmQncyBpbml0IGZ1bmN0aW9uLlxuICAgICAgX3N1cGVyLmNhbGwodGhpcyk7XG5cbiAgICAgIC8vIElmIGEgc3RlcmVvIG9yIHBvc2l0aW9uIHdhcyBzcGVjaWZpZWQsIHNldCBpdCB1cC5cbiAgICAgIGlmIChzZWxmLl9zdGVyZW8pIHtcbiAgICAgICAgcGFyZW50LnN0ZXJlbyhzZWxmLl9zdGVyZW8pO1xuICAgICAgfSBlbHNlIGlmIChzZWxmLl9wb3MpIHtcbiAgICAgICAgcGFyZW50LnBvcyhzZWxmLl9wb3NbMF0sIHNlbGYuX3Bvc1sxXSwgc2VsZi5fcG9zWzJdLCBzZWxmLl9pZCk7XG4gICAgICB9XG4gICAgfTtcbiAgfSkoU291bmQucHJvdG90eXBlLmluaXQpO1xuXG4gIC8qKlxuICAgKiBPdmVycmlkZSB0aGUgU291bmQucmVzZXQgbWV0aG9kIHRvIGNsZWFuIHVwIHByb3BlcnRpZXMgZnJvbSB0aGUgc3BhdGlhbCBwbHVnaW4uXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBfc3VwZXIgU291bmQgcmVzZXQgbWV0aG9kLlxuICAgKiBAcmV0dXJuIHtTb3VuZH1cbiAgICovXG4gIFNvdW5kLnByb3RvdHlwZS5yZXNldCA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGFyZW50ID0gc2VsZi5fcGFyZW50O1xuXG4gICAgICAvLyBSZXNldCBhbGwgc3BhdGlhbCBwbHVnaW4gcHJvcGVydGllcyBvbiB0aGlzIHNvdW5kLlxuICAgICAgc2VsZi5fb3JpZW50YXRpb24gPSBwYXJlbnQuX29yaWVudGF0aW9uO1xuICAgICAgc2VsZi5fc3RlcmVvID0gcGFyZW50Ll9zdGVyZW87XG4gICAgICBzZWxmLl9wb3MgPSBwYXJlbnQuX3BvcztcbiAgICAgIHNlbGYuX3Bhbm5lckF0dHIgPSBwYXJlbnQuX3Bhbm5lckF0dHI7XG5cbiAgICAgIC8vIElmIGEgc3RlcmVvIG9yIHBvc2l0aW9uIHdhcyBzcGVjaWZpZWQsIHNldCBpdCB1cC5cbiAgICAgIGlmIChzZWxmLl9zdGVyZW8pIHtcbiAgICAgICAgcGFyZW50LnN0ZXJlbyhzZWxmLl9zdGVyZW8pO1xuICAgICAgfSBlbHNlIGlmIChzZWxmLl9wb3MpIHtcbiAgICAgICAgcGFyZW50LnBvcyhzZWxmLl9wb3NbMF0sIHNlbGYuX3Bvc1sxXSwgc2VsZi5fcG9zWzJdLCBzZWxmLl9pZCk7XG4gICAgICB9IGVsc2UgaWYgKHNlbGYuX3Bhbm5lcikge1xuICAgICAgICAvLyBEaXNjb25uZWN0IHRoZSBwYW5uZXIuXG4gICAgICAgIHNlbGYuX3Bhbm5lci5kaXNjb25uZWN0KDApO1xuICAgICAgICBzZWxmLl9wYW5uZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmVudC5fcmVmcmVzaEJ1ZmZlcihzZWxmKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29tcGxldGUgcmVzZXR0aW5nIG9mIHRoZSBzb3VuZC5cbiAgICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICB9O1xuICB9KShTb3VuZC5wcm90b3R5cGUucmVzZXQpO1xuXG4gIC8qKiBIZWxwZXIgTWV0aG9kcyAqKi9cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHBhbm5lciBub2RlIGFuZCBzYXZlIGl0IG9uIHRoZSBzb3VuZC5cbiAgICogQHBhcmFtICB7U291bmR9IHNvdW5kIFNwZWNpZmljIHNvdW5kIHRvIHNldHVwIHBhbm5pbmcgb24uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFR5cGUgb2YgcGFubmVyIHRvIGNyZWF0ZTogJ3N0ZXJlbycgb3IgJ3NwYXRpYWwnLlxuICAgKi9cbiAgdmFyIHNldHVwUGFubmVyID0gZnVuY3Rpb24oc291bmQsIHR5cGUpIHtcbiAgICB0eXBlID0gdHlwZSB8fCAnc3BhdGlhbCc7XG5cbiAgICAvLyBDcmVhdGUgdGhlIG5ldyBwYW5uZXIgbm9kZS5cbiAgICBpZiAodHlwZSA9PT0gJ3NwYXRpYWwnKSB7XG4gICAgICBzb3VuZC5fcGFubmVyID0gSG93bGVyLmN0eC5jcmVhdGVQYW5uZXIoKTtcbiAgICAgIHNvdW5kLl9wYW5uZXIuY29uZUlubmVyQW5nbGUgPSBzb3VuZC5fcGFubmVyQXR0ci5jb25lSW5uZXJBbmdsZTtcbiAgICAgIHNvdW5kLl9wYW5uZXIuY29uZU91dGVyQW5nbGUgPSBzb3VuZC5fcGFubmVyQXR0ci5jb25lT3V0ZXJBbmdsZTtcbiAgICAgIHNvdW5kLl9wYW5uZXIuY29uZU91dGVyR2FpbiA9IHNvdW5kLl9wYW5uZXJBdHRyLmNvbmVPdXRlckdhaW47XG4gICAgICBzb3VuZC5fcGFubmVyLmRpc3RhbmNlTW9kZWwgPSBzb3VuZC5fcGFubmVyQXR0ci5kaXN0YW5jZU1vZGVsO1xuICAgICAgc291bmQuX3Bhbm5lci5tYXhEaXN0YW5jZSA9IHNvdW5kLl9wYW5uZXJBdHRyLm1heERpc3RhbmNlO1xuICAgICAgc291bmQuX3Bhbm5lci5yZWZEaXN0YW5jZSA9IHNvdW5kLl9wYW5uZXJBdHRyLnJlZkRpc3RhbmNlO1xuICAgICAgc291bmQuX3Bhbm5lci5yb2xsb2ZmRmFjdG9yID0gc291bmQuX3Bhbm5lckF0dHIucm9sbG9mZkZhY3RvcjtcbiAgICAgIHNvdW5kLl9wYW5uZXIucGFubmluZ01vZGVsID0gc291bmQuX3Bhbm5lckF0dHIucGFubmluZ01vZGVsO1xuXG4gICAgICBpZiAodHlwZW9mIHNvdW5kLl9wYW5uZXIucG9zaXRpb25YICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWC5zZXRWYWx1ZUF0VGltZShzb3VuZC5fcG9zWzBdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblkuc2V0VmFsdWVBdFRpbWUoc291bmQuX3Bvc1sxXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25aLnNldFZhbHVlQXRUaW1lKHNvdW5kLl9wb3NbMl0sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc291bmQuX3Bhbm5lci5zZXRQb3NpdGlvbihzb3VuZC5fcG9zWzBdLCBzb3VuZC5fcG9zWzFdLCBzb3VuZC5fcG9zWzJdKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBzb3VuZC5fcGFubmVyLm9yaWVudGF0aW9uWCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc291bmQuX3Bhbm5lci5vcmllbnRhdGlvblguc2V0VmFsdWVBdFRpbWUoc291bmQuX29yaWVudGF0aW9uWzBdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgc291bmQuX3Bhbm5lci5vcmllbnRhdGlvblkuc2V0VmFsdWVBdFRpbWUoc291bmQuX29yaWVudGF0aW9uWzFdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgc291bmQuX3Bhbm5lci5vcmllbnRhdGlvblouc2V0VmFsdWVBdFRpbWUoc291bmQuX29yaWVudGF0aW9uWzJdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdW5kLl9wYW5uZXIuc2V0T3JpZW50YXRpb24oc291bmQuX29yaWVudGF0aW9uWzBdLCBzb3VuZC5fb3JpZW50YXRpb25bMV0sIHNvdW5kLl9vcmllbnRhdGlvblsyXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvdW5kLl9wYW5uZXIgPSBIb3dsZXIuY3R4LmNyZWF0ZVN0ZXJlb1Bhbm5lcigpO1xuICAgICAgc291bmQuX3Bhbm5lci5wYW4uc2V0VmFsdWVBdFRpbWUoc291bmQuX3N0ZXJlbywgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgfVxuXG4gICAgc291bmQuX3Bhbm5lci5jb25uZWN0KHNvdW5kLl9ub2RlKTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgY29ubmVjdGlvbnMuXG4gICAgaWYgKCFzb3VuZC5fcGF1c2VkKSB7XG4gICAgICBzb3VuZC5fcGFyZW50LnBhdXNlKHNvdW5kLl9pZCwgdHJ1ZSkucGxheShzb3VuZC5faWQsIHRydWUpO1xuICAgIH1cbiAgfTtcbn0pKCk7XG4iLCJleHBvcnQgZGVmYXVsdCBcImRhdGE6YXVkaW8vbXBlZztiYXNlNjQsLy91UVpBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBV0dsdVp3QUFBQThBQUFCakFBQzA1d0FFQmdzTkR4SVVGeGtiSGlFakpTZ3JMUzh5TkRrOVFFSkVSMGxNVDFKV1dWdGRZR0psYUd0dGNISjFkM2w4ZjRPRmg0cU5qNUdVbHBxY242S2twNm1ycnJDeXRiZTZ2TDdCdzhYSHlzek8wZFBXMmR2ZDRPTGs1dW5yN3ZEejl2bjcvdjhBQUFCUVRFRk5SVE11TVRBd0JMa0FBQUFBQUFBQUFEVWdKQU1sVFFBQjRBQUF0T2RWLzRkc0FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQS8vdkFaQUFBQWJjQTBIZ2dBQWdBQUEvd0FBQUJFQzB2Sll3a2JZQzdnR05nRUFBQUVDaVdSWGR0dDl0ZHhnUU1GQXdvSUhDaGtRSms1UUVISmlkL09LeFBJWWdHTy9CQjNFN3k3d1FwVy8vN3VVODUrWFNDRHZ3eElFUFdOSnBWWlZSK0JDaEk3WmdzRmtJaEdoWWphaHVoVkE2aTFsL0JBc0g0RHhrbEpHREpDQ0VwbG4rSGhCSmUyWnlSMHZaQmJVMkwxZVpXSWVHQjV5UTBBTmlETENCS05oSFl6S3ViTGxjVUVwUUY5MGhxM0MvcHpYTjN2bWlGMVNyOHBYczhTVU5NVzhNNTBtaHRvU2dBRExITU1qMk1ZcksxMk5TS050N21COXBEWHZvVERnV2JwZWxpQkFIeW5mVWg0eDliMTVudUNiV0wrelhxZTIzZCsrdi9WWTNjdi8rcTM2SDcvMVgxS2lINDNXa015cXVvSVJvUnVtSUNNOWZaRlI0a21uYlVYVDJhL050U2Q2UktWcUFZRnFPTEJqcmNDOTdHN3pHVSsvcjNkaGZvdjY2cU54cUtiM3Rtd2F4UFVyK3U1WmNrV1BjM2JUTjdtRGJaVDVXaWo1YnJ5YVMzYUxjaTdGL01jZ0d5TFpVSUpFWmhSVXlvZXBZbWhhR0NaaEFRRkdwRnpGcW5GV21rTXN1WFJYZGJwUnNweFpaUkNJa1JwOUFnTTJseEllcGUvTUxNaGNsRXlmb01wKzJTTUpTUUZ1UWwwTVhqRmhDejdiOU4xSHJ4MzAwMUorMy85U0I5cWtSUm1VUmNFMHB6Q0pIZ3hFU3Bnbmljb3hwQkJnQmVOSE5KNW9jTXFIUktYaG9BQ1NVcE56Y2NMSENjWm03a1NESlQwQ3BoZWNQT0wybFpNVllTVFFlaWNtcVN4NTBFalhOVEVxUnRyejhXY1NRamk5cUNxWm9yVU9jODRlbGFIcUgrMm5XT1d2Mld2YithcHM3TnJwbll5NzRkRDdqNFgrWDNMSjJWWDhYUFV1NnRqUHMvUnc3UkFEMzJZVTFsWWtmWVBBTE81bnlYOTBSREg2cjMrQTNYWkxFcWdpQWFLSllhTG5CTDFFQzI4SU94TUxsVVBldnVrcjJsR1VhOWExMVVrMjF0OXpOK0d2UnY3Zi8vNlA3ZTZtb3lHSGhIZG1OMWgyYnpTWnlOdE5CRTNqQUJBREFjQXNOTTZGQ0NBSllCekFXNmtic3pRZzFTb3hvWUdnUjZvUEp3Y2pNbUpCd2F4MEQzdFRnWml0Zi8rNUJrNTRBRUhrRkpZd3diOERaZ0dOa0VBQUFVUVdNaGxaV0FDTXlBWTJhQ0FBQUFyQmRBRUFzdFlLWnhTUFRKd29IRFR3bzhyR1E1TkxUdGFjQVFVUDJUQUlBbUlCWjZWU2Q3OU9lM1o4NFVta3FDVG9hdE5ZVkFqbHdFMUZrNyt1NWNpRUNORVlERjJVc2liMW1jc3A3RXAxRzZSL0pkU3Y1cVVSbHcyL2Ira2JsTndOYjNLNzltY2pjN2Fsa3B1dy9JNkNYeTNMbEhReG1DYTJObWtsRlNWV0paUzFxZlBMa1UxbFlpbFBkcTAwSXIxNVRjbDlXNWFwYVREOHN2eXl3NS8vM3V2K041VzdHRkoyMWhWcTRYSzBtcjNjNVpaczYrdHovdTJ0N3Q3L1BlUDU5LzlmLy8vLy8vLy8vMmQvMzhmMStXdi8vLy8vLy8vLy8vOS9WNDJSWGlGTkxzZGxrZGtpa1FhQVFBQVRFVmVMd0tkYURvaklpUklDT0FVNjk1Rm9FRmtDVUhRZ0wxdmJVSVE0TEJVUEJldjRvUWk5OS8rdHh5Ti8vcHAybTRabVJtWkhNMWdqTFNqVmFqZE50V1RFRjAwZWZDSVV3OGRVS05DQlFZUkJteWFvTW9zREF1WVFZR01CQkVsbVpDckpCR0ZHTVlaUXh4dEdzU0xBS0JHQUFYaU1JYVB2T1dBRitnZ0V3bFZOQUFFWXdVQ3R1dU1BaVEyTXYvKzlCazNnQUpBb1RJL21zZ0FqekF1UzNCZ0FBbnhkVXYrYnlBQVFnQUpIY0FBQUF2ckdWRmxFQUtXQ295OHBucXBIS1pOOURaZTJBVkJvYlgyeVVJUFVZaXpMRkpBQW9pQlo0blV2WmlRVUJobVVYbHl3MDZJT0lCVDhpK1pvMnVJZG1OdEJxeTJNbzhvZFoxNzdNUWpVRG1TR3ZlTVY0RGdjdUlpaEJ6d096Rkd1dnkvOG9pN09YU2JrN1c3bERXZmpGZ2podVBkdDVKZ1A2d2RMY3VPMjJFTU9pMWxyc2FmYU1NYWoxNkszWkhhbC9LS1NTTjlvWFBQNVNsNEZxY1VEVjNmdE9BNGtIdzRwT0JGUHZSRkdiTU9ZYllkR25rTUJSRzVGcWJjVXU0MVlWbStzdm5LVis2WG1HSDU5MXZYUC9uLy8vLy8vLy8vODFWQlVYVzVQK0xraUlwdEtPUk5weGtva0lBQUFBWWM4aXR6eFFNdVBHRmhNSkFxRWpoY0h6RVhwRVVxTkRvdVNQREhsUmFrSWpVb3VkcVo2aWdkY2UvLy8vLy8vLy8vLy8wVlhSSGVKVkdNcWFyUVBBdEs3Qko4YUVheUVYTXhUNExvb0NGN0NSYkxaajRaYjBwRHdJeDJsQXdxV3FqMUY2MnZIY0NGTWEwckV0cGEwdHF2TEtnOVBycmYxNnFkcFRGM2F6U3U3WjNiTVFwVWpsSFdHYXVsNnk5cGxtNm5sclVWYjNwcmpyWno4RjZyYzJETytiNUhiYll6WC8zT3AxdjNhOWxzck5OdFczNzdQWG91Vk1TMVczMnB2OUJHOU9mWE5aL09kZDNMUzFlN0Y1bWNlbElWMFBtOVhoU0RTWk1sV1dSNFpVd0pxVzBWc2M2ZWVIWG41OWVoQlRxdTluczlBdWI5UDhVMTVYdTZ0VEw5MzlYbHRxMGZTa3lWcFprUXlSRnBqTUVZMFBXUUhoaGtOQTVBNFlJZXhaR1ZNUlArVlN4ejJ1TjZ5T0c1SE1BcVZrak43VFJPeFN4UW5kd281RTFzMXJRaElvYUlqVVVEZXYxQjlYbDVPU2szVzNpTlFjSnRVSWlBa09LVGEzZHhlYmJFOWc4Z2drV0VjSTVPTzVJSENDMDdsd09xb0RCaUlpbWpsR2htaFgwOUo2cWxDay9TVW9yeXdFa0QybWpnaFRtWVkyTXlJaUtjcDl1Q2xLTC9ZNzcwa3RzbE43WGtVcUpwVmtYbGZkamdBTVFDWW82MStPcjhpeDZ0cks3dDMrei8vOW42YUdHLzk2dHlvMHdMaUNWQXNaYUF6b1ZWRVVrZUNCaUpxVWhkbEYxN25jV2VpbzJTSXMwWnJjYVd5eVF4ZkNENElodVYxOGxPb2xHc2tsQ1Znb2puYmpVallwaEtuTUY1RzR5Tk5PZGFHVG5idWRiNDJtWFRwbWQxdVZlb3I2S2RPeVNpRVFRV25zSnNLUnkvL3VRWlA2QUJSZGp5L2RsZ0FJd0lDanM0UUFBRTEyZEtjd2tjY0NUaCtQd0VJaDRPKy9KOEZXQWlWQnlVNmgxWFUzTFVpemVuRGx5TjBrVmt5M3NyMGd6djl3WkxpelhkOWZoUWRvY0VseC9TSzd2dm9FYWhybHBWYWk1NTRtNTl6VVdMdnYzV3BWamRhekRXNHNmSlY3eWpuSSt6UTQ1eW1wNUppbjYvdiszM3BSN2VjUWk3bzBpV0ZhVXJpMkZCT2F5b0xsNWdzY295T0hGcExvUW9TTmYxeFdiczVhWEtYcWVGMnBMSkwyWUVJRVpBWkNySWhDcUFXRWRySVVaMW1lSW1kcGx6NWtMM3FIV1I4aE14Vm5OQTA1QWlKQ1pjMXNqcGRvMVB5blNuWXcvbVE3QzdUU00rd3dyblNRN2EvbFQwNzhvUVVEY1l3UXYxZzZOZWxzZHM3cXBXNzYzT3BTN1RNK0ZYdzF3ZVNlbWhtSm0vMnJqOGJmdjNINTJ0ZnZQMWsvUVZnc2tta2tTQkJVZE9Gbm43Z3dlV1NFU0hLMG41a0RhbHJLeVFYdTNKb1gzN3Y5ZGVLZi8rM1QvMmYrdEtmMVZyTFNOS0JoRm1ndlp3RFc1QThISUFLRE1aQUdoelM5VHRZNVlvbTVyZ0VJeURJanJreVIxQWphdFdKNU02MFRiTG4vV1BPVlRrQmxlNjI0dzRydGlBTVlVYWhjM3ZNV3piaUVHLy91UVpQT0FCTnhqeWVNSkhkQXdvQWpwQUFBQUUvRnJJNHdrYzhpMGdHVDBFQUFFdWtSUnJGZkVZbW9vNCtKaHYzUlVrcENuaGxubG5OcWxhL1RhSm8xak5iWVhuNkZQclVwMjgrZjc4djltWnc2Y2ExZENaUmlLUnRJNzAvZGt6ZThqcldqSzJlLzNqUC9ZbzNYekxsZmY3cXNxcFFORlRSaGFuRnBXK2dQbGZWMFhmMXZ0YTc5anY5MG4wQzJuN3VaR3A2Nis3dnY5My8wb0RQTW96R1QzZlVTZ2d5VVNCRWtURWVMMnBhanFaRWdGRHkxb2t1ZzJOS05QUXRsYWJGdVVRRXV5UlRyMHY4T3hpVUhtRkNCVXk4VEErNkVCU2hKUzZ6a1FpcWtEU1J4cU1pUlJHaFhUaks4VlJ4am1wV2ExbkxVUW5JNzVJcHlpVHlTTTB0UGM1Q3Q0cTYxU3V1cVd4anNqRkpTcE9mYURFcEk0ZVo4VmtwSVd0NmpVRkdLTnNwMkVxRVVLNk1meWtmM3VRSll4VEQxbFNJeFoyd09tRlh3Rk1wSW1sVkVCZzdjSW1COG1LRGlDeVM5NkJTY0sxcVNBSDQ2TDZFRk5iTjUxaTdFNjZmK3ovcWNoMUpycjFlenF1Kzc3YTBBb2gxZGpLNnY2T0owYkdDRVlpRGw2UkRrazJ0VU5oSWhTSUpvbzBMS2srbTd3OEx5K1ZTT3hJaHNhOHZXdS8vdVFaT1dBQk05VXlPTU1NOUlyZ0JqcEJBQUFGQ21SSmN5a2M4RFZnR053a0FBQVpleUJoeWJldXFxaVk2K25xbTlZSys2Rk1TRE5KYmE1Ump4NlBGQ0FtQ09MZ3VDVkQ2aGljZFhSQzJBYXBhR0ZaNFRoM1YwUnpEQlFwTDdNbHBvMGhFZHpYajRZci9FSjlqcHcwR29rTnhvSERnSnlaRmdCY01La1FmVUlkbE9ydEZrNlVRa1NvU3NxZ0dGTi9rKzllUU9FVVRPMjF4Uk55UmlhV3ZGKzMxMVZLOGtwblUxdFgvNnQxMUgrNzdHSjdKcXovZEM5cTlDWkZWQWxpSW1nNEJNd1VJaEdrc0FRRnhXd0V3b3N3MUpGakRJbTBVSWFRcnkyMW1TVHRxbWkwTlN5NVlIQTBCU0FBQmhqa0pNQlNMbXN3b3VCNU4wNUpqMDRObEtybVlYdSthM1lTbFM4OWd1TnRmR21qRmVzZnFmRjF0Mm5oemQ5alRoeko0YzEwSVZwMmJkNTUyNldZSE11LzRTbDYyTUZHVHllN2ZyMkxyN3ZDN1YvelBmVGo0TkhzM3YxZ1ZBRzJtazJZMGttaXdxZXJNbURwbDBnNFBYTnRPdVl2VkRiaHR6YkgxeUJ0WkVhSXd3bHJYVmpFcFdVbzBiQzlOSHR1UTE3VVRWaUkxbUl0bjYxUjExVWdVMVZVWlJrTVRETXZ5TFZCU2lBNDFBd29VREEvL3VnWk5ZQUJKSlZ5Zk1zRzlBeElVamNCQU1RRWowN0lZd1lWWWo1QUdQMEVBQUE1QytGQWxEU3NBVXlkdHJrQk9TL2xCLzJHaDM4ZFVrbDF5WWl0dUxTMFltb2loNHpCdnpqRkFxeGtaT015ZzV1VGpCVHhVMkNJcU9jRks5REpqaDZOUVpxNGhqZFFpdGljWFRZVWhobWVkY21Ub2xXS1lNamNkU2pyYzV3NHhzYmxURkxiU2xqSkt5ZGJjSmxzM0tLelJ4eFNFT1FuVmtmK3ZncnNTR2Q5LytmK2hPaVNOMU9OcHRsRjJqWG90VzkxcEdmcldqYXRqR2x0TTFvUzJwbXI3ZFNMbmNYMDFzY3E1R2lmcE81eFAvL29RYzFkVU5jMnlIR0Fqd0tSYWcrVUhJQ1FNY01RRkFRaFNORFJFcVdYc01YT3VabDhRbHNVQ2dRRHdqSG03Wk9JQVRKemdjTllUanl6MDR3UUlCSUlVaDNVSVZieTE4WVF6MXIwbGhta01YZTBkVXFCbUNpQWd4WWdJTEJoMFlReVNUeUEzZEJsSGxHRDdKN3poYUk3TzArNTlqSnV3TlNCbTJERXBZeHFRTDlHZFJ4YzBweUx2eHBtYW9PdDh0UC9hOEovZ0gveCtPdlg2RWs0U1hLcXBraEhHRno1eHE5N3pnR0VNalpIRzlDbmp0QjhaZmFkdS9pNnI3N1MrbTFuL0xOUnNvRVRrSlF2N2YvWi9yVmlmdlRaU3N5b1Jqa3FJaEhCM0pqREtCQ1hhODBsVVhDeVFrV0l4SmZKYnF6ckR4dXJEdFJjUkppRmNJS2g5eDZZMks2bWhISTVicVI0VmJXUU5tejZTVE9wcG5ZYzZ4Qm5xZTdZZ2VzcmFmMVZOUHpheUh1dkxUVThpNlBaaElPN0VraUd4Y20vL3VRWlA4QUJNOWl5T01KSFRJdjRCa2RCQUFBRXpWUEk0d2tjVWpQZ0dQd0VBQUFaWU9zR0ZlVjNCRlR6T253bVdqclVJbE5EdFpTdUwzVUkwS3BLTzVxRmUwclgydHN2dmgxczdaLysyK1Q3ZitvZ21rNUVxdE1CeldxV2xDV09Ca0JyRExXVDNaNm5Lby9tbEtOc1NnREtXTE94VVk0d2l6RmZ4blNZMXpGZ0FmS2ZwaGx0VXFVczBpZ2tNeFNJcm9RQkFva3d3TVlGbFVVWWdCYkRocWw2QlVQdWVxYVJVZ2pBTXJiMkF6SWtSZ0tKUVJRSWNiRmVtaVZBNkRwbzBMYXFPNExOeVRSUEQ4WG5JcElTbVhCcEtFUWttSkZzbzRJS01PQkQwRGFneVFTSTA0NHhEbjBWb0xESUlFdlg5Q0s2cENxMndUaVRKc3FzV01VOHlJcTNrdjI5M3BWeVdkSzB0STBjK2lPWHNBTWtJc28yL1d1M2E5NjczLzdmeklXT3RUS3JEc2VNWWtCRmFEalNiSjQ5ZVBMc2JsL3NaK2UvTUYwL3VlNy9SOVNJNWRYOU5wMFNCVXdrZElZNjlLQjYyMnhPS050SkJyQWhnTVFuU1ZSTTVTdEd1SUZrSTA2RUpJcXBsN3hyM2NKbkI0UlRnYkdKeVBRbmhTcWJpNkJrdk1RSVVzbGxxVDVEV3Bjb2N1ekNhSW5vcVBPMk1qeFBIVTEzSzNyLy91UVpQR0FCS3hVU0dNcEhISXlBRGpzR0FBQUU0V0JJWTBrY1VqQkFDT2tBQUFBRFJkblJZbmFRcEdLQmdKM1d1MXhVNFZ2QXdFU01Lb3d5QTVLOEYrZExyQnZ6a2tOVFNIa1ZnME5zeUtFK1VKU1ZzeWhTaDh0bGI1TGVLVEdUak5Zd0FMWXFuKzBIT01JY0pTcldVN0tBMjZDQTlHck5qZ0ZESEZhQjY5OUNGaENxTS8yS1RNblFJT1NXWkwwZS9JK05NV2JaLzBVOSt6bzlWbSsvN0dCSGx5WnlPVm9CRXhEb0xFSVpNQ2gxQmhBUklvSUdFQVFSdnlxSTJKcWR4ZWI4UHk1REwyendxYjVYZnlEcmxMTlNpays1WjdJRW5TY1RSaWJMUHpYb0lrVXRiazZ4RDBmYkdBNFhTMGVqU25QaURUZWx1c2pWMHNrYTVKSmRubGJKcFdJOTlKdmxudStFblFTam1IUUlGT1IwTThHVVh0VzBrOGpWd3BPZFhQeXdZZlBKTWFGQ1pvTTFkOURXM3JhRWpHM0Jra08zTWR5Q2Nqa2FscWFocTR1WER6Z0d3V0RBVkkwMWEvdEpXSkhrVDdrWm1MV2FFSmF2KzNSVDFKU2J6MjFsc1Z0WlEzTTl2WHFSU0pkWE1ZV2xJa21GRW1LWVNTUnBXRFNqQUZUY0ZJWmlnc3NkcFNrNFJJMjhaMHZXbWtUODNiOTJKUERMSDB0WGorMC8vdVFaT1lBQkxKalNXc01HL0ExZ1Rqc0JDSU1FejJqSjh5WWQyRFFBR1B3WUFBQXJrU0xDaXdsTTA0VlJodUNHUG96aFdtWkpxWkt5YVNDS1pLU1FMZUF0M0JCTTU0R3JKREtDOENTU0kxOHk3N0Vjd3BFVU1HU0tNcEhzZTYwaVdQVG5ocVk1MGhsZE52T3hZMjBxblQwdVlZK21NUk0zdG1kWEZuendIZVBtZlgrc1Yzc0JiamwwZjlYZTV3ZlNXQ3dGa2c2Q0xTNnRBOUtta0gzd2cvNzYxNlA3S20xOUhaLytwKzlHdDl2M3ZlK20rL1ZEOVVxMG90NlVURGpBNEdxRUlWamdBSEFySVFzRlRxVVFYU3k1S04zNjBZWElqTjFBWkVnNVNpbzNYblZpZVVyRjAyT3l0Ylhxdm5yRzZ1US9XdjMwK3VVa3AxRXhFNWlxOVRpS1ppOEtMZUhMazVJaXlrMXJKYnBBKzdUZ3o3MHcyUnVrN2xuNTdxWmVsUWRjVTJQYnV6WHk3YmxWYXRmYmd0L3MwaXh6MWQyMTVFdnY5Wm1NVnZES3cvbmtTN1VLZ2dPUnRmMzdQL1hEZHkvcERpR05KbUJwbTJXNUJrTk9KdUYzSmViT0xIYjdHRUJHUG82cldmOStucDlLSEgwaGFrV0o1aEx3Q0xJUUtyZmRJdlhFaWIvcjV4OTl2RlAxbUx2bHFrWW8yeWtaZkMyeVZhL0c2SFUvL3VnWk5lQUJLaGhTV3NHSFZBdjRBa2NBQUFBRStsaklZMHd6NGpuQUNPd0FBQUFRanFwV0hJWnNrSVZpbGFUY2JaRzNSK0huY21ISTRoRmJsZ2tnbWZaYmt0NFFhRVFoSlRaQVhUdWF0YTZ4WmlXblVaZVJKRk1FRkcwb1RoSm1NVUNra1RMTXJNUmhCQ3huM1U2bkxVb0pha01LVlZZWUpDSm40MlovYjUvTXVmc1diUTR1U21IVWx6UEk4d1pIYnQxTU5yQ0kyS1RHR2lwSE54c2ZNQ2pXcTNxK3R0SVFkVjAwYWNSSkpZdUtxV1hFeEpybHNRN25kZy9paGFZcTdLNC9YOTdydEh3QjlTcEUzNkp0T1VULy8xME1MK1RXTlJ0cEpJWUdJb2hFSmNGd1BZRFhveENGUzNHNExEdk9sazNLUE15WVlPZ29BRlVCRUNKR0NTRVNseENvWWl1Z1ZaRlFSd2gwTExXUVVnWEJoQW9najlRTHN5cnRJT3cxOFdmTkhGbkU1dEdvL2swdmNRNWVTMDdmM2wzWmpNaG12NjdSRDF1YTcwWmhsWjh2N3RUNXovWExLQ1lQckE1UlN4cElTQ0VCakk1Q0Q2QWdJaEFCaE9sWVhsUkI4MmpSN2lVb2xFbGRxeUJtN3RKYkZHUEdIblVhY21LWlFXVGp3U0xTWWo5S3ZjelZYK2gzYWR1SlowWi8rcTcvMmYvKzZwQVoxWkVnelRrYWFTTExtekErSk00R0RFU0FNSUdMS0FNNkhTcytTWFgrMkZQdVhRSE5VazAyZ1NaUEFPQ3dDa3hBeWl0R3hOZGRBeXNXaTR5c2RhUW5SVXNObkIxb1lZSllUOEVKQ2laVmhBczFnMGMzanE5Z01vR05pc1NkRENXZ2M0MG90WEdyWUp6aC92Q0M2YWwvL3VRWlB1QUJLVmpTV3NKSEhBdGdBazlBQUFCRXBVckphd2t6d0MrQkdPd0VJZ29KRjBoRmhMYUtRd1lMZTFveWtvUlQ4NUNNcFh2ZTBxOE5YVXZyUXo3YWV2am5VMnlPMlUyVElTYkNjVHI1cVVXQ3FBbTlkN2dxY1hsZ2ZjT3U3dDlwbWhVZHNuYUVmOWRhRlVWV1hvcm1OQzFlaWlNLzJmOTY5QUx1ajhTTFJrU1NmazVTTmFFTFJhakQxQkRLTmNJSldYZnpTbllPL2o5cU9XSEt6ajdpaWM3eU1JTUs1QTVKeTVLS0ZkTG1GWldUc0lrU2NVazBVTDdydXQ2ZllqWWFOazBEU05CV09WT2wxWFJVU1lQbWt2RnpLU0pIYzlTRlFBampyRzFJNm1vV01SU2w4TWtoeE1KMm9RL0NnTWp4TWJRUWxPOHN0bWIyRU1Ka0ttWlZtekp5VzVGS1psMDhFTCtmcm1KSG9VWWsyd1cvc2xZU2drbFFqUEozSWFGV0IxWjhhVWZQT3NPcmpZWkFJbnEwNlg1b2Z1L3VxN052TnQ5bFczNUpUV215eEdUcG9ubjBTSnEzR1N2VEtnN1k2SUZoQzRUTGdzOGlhZ3VpT2xZZzR5dEROT0IxbmJUN1o4ckVrUnk4aEZoQ1F3TUhLMVV5Y0pZVktSaG1oODhlUyt2Y1dzbi91b1pVV1g1NEVjUWhTTldjNXpFVGpVREtJbkZwNXE3Ly91UVpQYUFCTUZueVhzSkhGQXd3Qmo4QkFBQUVzbWpJNndrY2NEZkFHT3dJQUFBUXlrcE9xYnN2NWpRbVROWDhsemszYlRGUHlrdDkxbWJ1VWRreTMzWDZzYXZ1dXFxeDRqYnZjWDlidlg1OXg4TXg1dWFyK0wyb3JMYU1Rc1c1b2w4ZGJwN3luOS93cWl6bVA1Um9PMjJXK3lXTmdCQXFwRUpSUFI2TXBHTmtjcWVlbXBXT3ZIRmcyaEVPRDRxbWJrMnNVVHRhS2lZR1B1L3EvLzhXcC91LzI2NkZDSmVGVm1HN1lCWkVJdEJZUzdqYThGQ0dtbkV5a0MxU2U2bVk0VkxHUlN4dVVGU05zbGVid0RCeVl6Q25RQnpmMHFDVWppU1NaRlpQUE5oejBFRG1GR0xsekVpNXpZaEhVN2RvV3VaeHppNU9VZGFwekpRdlpTTXNvSnNxbm03UE5XdlRwRlRLZDZsSExvTlBLcXBvU2xsU2M0VFZMa3FuV0lvYWtlaHNRYkJ6c1RLRUhsTDVNZGdjY2Nibi9mMk5oekVOTGk3eFJxTDJjOElwb25TQUpIczZQc3NweFN2eDVuYzU5R1Rxby85WG9zc1ozcEVpWGxWQlVsY3FkclRLcllSSE5RMHJqVVJROE1Fd3FDQXFRS2lTa2FPUkJUa2Y5ZURvdkRHb1UyaE5Ja0FRTTBUa0p3aFJJZzBRampSNVdSUlFsRHNtOWlxTU1NNi8vdVFaT21BQlF4aHgrTU1NOUkxdzBsTkJDTlBFU0Y3S2N3WWNlakJBS1J3WUFBQXAwMkY0d2J1T0dId1lLN1M5UVE1Rk5PYVRDQit5bmp2czVQVVlTUnVyR0prRlh0U01XTzVCelNpSXJXTWVSSk9pM0JvMlU1SERuajYxM21abi9WR3A4YW15dXZpQTdmRUhFNExxMmVhRSs3LzVsLzlaZDdiUlNqVGRwOUpSbElTTVFJSFNZbExNQTRiQzhxbXhqOVhROEprVWxqS01JS28vZDliL1YwUjFIN2Y3dEgvL3FJZS91alNha1NhUy9RYU1NWlNsVUlXQU5VVTdHcUpOR2dvaUNPRkdtUjlMK3crajN5SjEzZkU0aU9FUXFySEloVVFIVU1HaUJFeEFuUVJtUU1sOWt5MmlvcUorV0hUN2NvVDZGVnUwRDBUcmtka3VpTHlrV3JxVTNycTVFYlFHNm1jYnVhMVNQamhSS29jT1VXam5kWGpXeDJWZk15UXdYZHdXaEZIZjNnTXdxbm5PS3hDMHVPRkpoQVVCSWk5MjlwSzRnN3FvRmR1bHRjYlRrVFE0eWtXR2gwSktPQmx4RlZEeGYweHIwVnAvMEowc1F0bEQ5REFreFRWQXQvOXZSWjIvMUpGZk5ScEVuU3BrTU9XQWpqU002aExQaUdTQ1F5ak1haVlTNzNZSGtRaWxlTmZ5OWFXT1JLamZ0OVlZWXZHcVdlcjBqV3QvL3VRWk4rQUJNVk5TR01KSEhJdTRCajhDQUFBRXFsZEphd2tjWUMzZ0dTMEFBQUFLUWdCVVJQa3NLeTdqSnkwcVhPS3BzbHRYamkwb2F5eW8zaE1ZYUlITm1zWkQ0V1RiaXlxeW8xR3BrVzBuSWNoQkljZ0dKbE55VVFrR0hiOTJZT2VZNVlPS0xJM0VwQzNIUjJwa3pQTFRXQTZpeW5yRkk3TG5tZVk5SFRYSXNId2MxTXYyWml6T2tDMjNCejVyWENTOTdEdExWTlBOdENtU0xpeEo2b25kUHFXRWRSL1k5aW9FT2JWb09YKzVkQnh6YWhNaXJZa3VqcTZQL1ZidVVaSC8vMzkzL1VIYnE1Q2R2dVVGVkM0anAwRkNPTWdBa0RjTGhBNVM3d0ZsYUxyRVFKWW9NMk5hRHJRTkdIVjFuSnBvT25tV0dFQTJGaElVRzNTWHA5V2FpcWRKamt0UUw0VHRCSElMcnE5Tm5vaktHSzZtTHdwdXlGWGR1dTlBcVp2T29odTNLVGphR29zTTk4dXhwRXFZbEZJem9HRjFRbEdpVXBKZW1FY1VPMVBLS1htaUZ4Z1lFdXV6a3lnLzBFdFRRcEQ3R2w2dXVMeU1WQ29xcVZ6SkVLcUpVekFCU0pOTExyWkU0eUFYSVFmUUtDNzBpTWFmR0xmU2xGdmtwVlNFWlVlNWdzc3lHQTRoaUJWQkp6bEoyYUx2MjllcmEvcTlQMVZRR2FHLy91Z1pOaUFCVEZyeCtNSkhWSXlBQWpwQUFBQUZDbVRJWXdrYzhEUUFDVDBBQUFFUkdKSEkzR21ndEVMZ0V6c1hMWGpWeGxheEhjTlNWcGtSMVpGd1M5Z2oyUUJCQ3gzbm5zcTh0anJqVHRMSDlZVloyZWxzdTYrOE5TK0pWSnl1Y0ZIRXJJdHA2NERRZ3FPa1BYSmJydzNMZUhnK0dpRGdiZm83NjNRS1VqTVptZkNLalBTb2pUZGk4VXhwdzlvZVQxdWZVTktjck51Q0ova0NITzhvTUdGaDRKQjBBbUJZV0t2S0RENUNUQzR3SzA5RmYxNlEyb3BITEhKSVdpb0VXcHBCYnh4VkJFRXdJTG1UaXFDQms5SmpTSXNoeHRLZ0UxaVZCUUNIZ0x3VWFoL3IvcHBsTGtQN0tQc2V6N2YxVkdUTk54V3BST1FqS29wS1RYR01QYWFvSVN3aHlDSkRvbmlrc3R0T2w2bzYwbVV2WkRVUHY5SUlKY05yRU4xMytodDdSS1kwbmxoSVZvdzJUTGE1YlUrYXhxWnhHeThsUktuYmtvTmRmWWE5aUYyaFd4YXp5WFJNc1JLNnBBalRjY2xTVXlMRHlPOFFxYnhqcWJDd1FQYVFySVppVFk1eXEzN21ibklpLzN5YzRmT3NMc0tJMU05VVVVQ3BZcGUvaUNxZmN2dnMvKzdabEp1aTJ2MXA4cm1TcEUraFNXQ2xTWTU3Mk1qNXhwajZYZTJNbXFoWm93dHZ1UUU4b3RTTnVnWGJrM01YMWYvMHM3K3RIVXFZZCtrYVcxMHNibEFReG5PUkxPZzJzR2JLc2hmOENHYmcxZ2NFM1dVSnlRTzU3elFFK2txQVpkVVpFaDRXaUsyd0NpQUZSS2pVaXltOVUwa1NFS0ZHMmdKVzFJNHhGREtzcUNmLy91UVpQU0FCTEpTeWZzR0hrQTVvQmtOQkFBQUU3MS9INHdrZFVpOWdDT2tBQUFBMGtOREtUS3ZWMUNyYWxpQ2RRSzVKbGVHTDlkTDAxVkVsUUJCMlViQktoSUlTYzV1ZWc0UEVtWnZsNmtseU5xaTU2M3FBc3lhbWxLT1R1ZzJSdFVZOWN6U1p0VDdlZUhDeTJ0N1NtNzVkbDlqUDhVSTVZcFkyWVFBbzV3b1RjMXBVR0Q1a1NpcHJjNTZ4L3ZheFR1dDl1bm9DdXZadVY4Y3hPcHlFSWVuUmxMT2JyUjIvK2tEWFJWb1ZIU3JIeStoVFYzdzVoOFVHREVCUllaUUl0VkZXZk5uYmk0U1hVcVpRODBOUVdJZ1JObUJTZ1FhVUVKT1NXd3FjV29uSnlJeHR1a1dhUkV4bUtVTXJidWVzZTk1V2JReVJvb0kzMFVYYlY4azA2M3BLcHo3V3Q5b0hvaURXQktsUTFWTmN1TFZJN3JSc2pUTEhzcHVYWWQrUGVzWk5kek9sZzArVWNVaTVCVThXWnEwcVdDNW5nMzM3N3Y5NGZ2ZjhrejRpdEU4cEtpSVFoTm9kVnBQTENMRm1VdnVVaS9kdDlsd1RjbWg2ZTNyeFArQUgwYWEvdTl2cjJ2bDZMdDdHZi83ZEEwSmFWSm9xNnFyQmd5UjNPUmdFUUdGcHhDVldWRHFnNW9PS3NNazIvTHN3OHp0L1pwa2tKSWtBZ0RRa0ZDaC8vdVFaT1FBQlBGb1NHTUpISEl5NEJrY0JBQUJFdDFaSVl3a2NjaklnR05rSUFBQW82eVJtejJ0S2t4ODJoYk1yVWdneWw2d3BpQ0xvMlFrMmw3UnVwaFRKcXFFZHV5SVN5S2twUU5kSzZsS1FLTGlFS3c0eTZDd2JPUjU3cHRBMVF5TXRNNWRxMmgwR0NDTnRFdi9laHJWck40c2lHK0haUldHSHV2MVQrUGdla3ZUYTlRM3ZXR1FGRWkxRWpHaUYwcy90Z1U1UytlenpmTlZReFVCaElGaGlUdEdRZEMremU1VGJXaDh1TU1rRHBZeUpWbkNwZGxKRUpNcHZkU25yU2IzT2JyZ2t2TWFLMzFxOEluSW9ZdThTNElRZ0ZiT2g3TDFnSmlzY3VXZllkaXkzWmxVaGdTTjZRa2hNZE5rb3pHYzVNRmorbzlSMVRLWXlqVUkzZUJxdkpGY0pIUkF5SjAyMDYwcWF6Q2syT2hmVEdMSkJxWW5ZVFVmU0dMckJlM1podXlzYUxIQ0JVQ0NEZGE0czJXd0VOQWdJaElDZ3F1Ylo4STcvN0pJUVJQckxubkk0c1BKbGh4aUNSZ2ZXWGhpdWVYcm9BTDg3M212Tit0WE9oeVNvaVNYSFJnZmk3elpxdXNtYmVqVHhuTVhzYWlMQ2dHSEhnZGQ3SlpYOUd2L3BGVUxYK2xIVSsvOTZyYWxJa0pIaDBaVVJ5T3lOSUFDSGJvemo0aFovL3VnWk5XQUJKQk9TR01KSEZJOVF5ajlCQ05PRXhsdEk0d2tjWWpIQUNPb0FBQUFxVllZb0xLUjRqRkFUQmhCUWIycXRiYXdGU0ltQUlzOENXUk9UbllFUkFtcWtVU2loWEVMejY1eEFzeE9hR0tLS09VS3hPZEp3bXhjNEVjRzJNWlN1L0Uyb2dkN0RTRXF1R0ZhQUR1eUtoSUpXakxYdUtRaVNzYlJGdVdaYnEwaEtqWm1icHhzMXlLK3pHUmRYa1BNOW1VOVFZVytSdkRwVVJDZ1hjQ3YrbmJyR0x0ZHNHUURvSEsxZ2RnOVY2SVdPT0R0QW9MbUpFUUFtaDcvNHBWU3JGYWQ1WXdJMVVQTUk5MUZxTm4vVHJyUlovWi8rbUt5NDJrdFVxSjhBYnpnRnhxa1FxTGpEeVVXQzViWFVja2VvUFVsS1hWVjR3MFNVWEZrVGtKeGFVOG9taUNwMWR0bTdFNHUybkN5eVFjeGRUMXBpYWFlWmpxOTFEZzczai9NR0ZEbWx4ZStvY2IxMWQ3OFh0dU5yM3JTVzJJQ3NwaUk4cGVWL2lMaWtXRnAvdjR4Zkd2dUg4UE4rYW52NmErNlYxZk9yZkgrYlUvcFNuKzhlYiszOTc2OTdVcG5PZFhudXREV09nVG5lQXA2TEdIcG9GcnY5YStvK3A3Vit1UTVKUkpLMjJtVWlZakhPQVVmd29YVXRMZ2NHTHRrNmRvcXh1WVF6L3VzcFUwMHhWWDRwOUg2ZlhzYmEremY5cTRKcFprNWRJZzRrNWEvUDRiRDFTR0lSRGF3QjVWK2JJZmhrYVp0REZRVk1rQURLd013b2hNTENnTVNBZ0dEQ1V5UUhYQVpXSHFDcDJDakVnUjRJTkduNHBZS0FWZ0huaEZSQUV3RVFwVXlWOHgxSHhkZzlSK0IvL3VRWlB1QUJKQmRTbnNKRy9BMFFBalpBQUFBRlFWdElaV0hnQWpCZ0dRMmdBQUFMb1lOYXJpcjJVQ0x4bDR3b1JleU5Ka0FMQUhpTy9KWDFqcmNxWlRWWXJzeVpwcnZTK2tkVi9tS05NbDdPSTFYWWMvTVJocWZvcnJpYVowd0JMb0lTdE5iTHVBWnp2dSt1eGpscHk0RlhZcVJsbVY2VjBsUGJoa09rMEY3RnlPMnBSY2Z0dWRxTk9zK2NMdFQyY0VTOTc2OUsvc2F5N1dxUmlXWjVWTWFHbXAyNXFuM0x1djcyWW5MMlVNU2VwWHZSK2ZsdDJ6V3A2YnR5N050UExXSU9LV01YZUIxRzN4bklsbjJMd1hIcWswNVUzQXNabDBwcGFiVkRWNU01Mkt0SkxxbSthN2puLy8vLy8vLy8vL2I3L2Z3enh5NXZQWC8vLy8vLy8vLy8zTm93MmhJblUybzVYSFpIVzNHMGtpZ0NrL1Q5QURySlhHNjJHU3Yxb2UzMkdON1BCaEdMM2Q3MWUyeFpCMFRjK3ZFUHRKS0V4WVNoUUFBMEVob1JLRERqMUFuRmkxemlZWlh2T3MzdWxHQ24vZjFOWGZXbUtya0ErOFVVMXNXLy8vLy9RK2xGUjRaMVpWaGtCU0NWYU8wMnh4dHN3QzhXbG40Q25TYkJTUVlRbVpzK1pBb1pkc1o0eUhmalBCUUtzRmpKakFKZHcxcU1DajFOQzZkLy92UVpPcUFDZCtEU241dkJBSmY0OGtOeEpnQUp5WWpJL21zZ0FGeWphT3pDakFBa1NMSDBUMVhkSnI4Qm9KR1VLUHNQTnVzNTgxSDBpRnF1WXJHbXFuMC9vRy9OWVpUQks1ZmtTZnBqRW1GVFVEbDN4T0hDRVlTRWJPeHgyNE1abEkxK1ROUERqeVhManlST2ZnVkJHdU5GTllLR2MzTGtiV0o2bGdGcGNPU3Q5NGhENjFDMmFLYnozcTFKQmp1dmZLYk1uZStJemNVZ3ZDam1JaEU1MmZhV3NOcFRkNjNIWnU3Y0d4cXhjeHBPNHgvR1VRL2pMSm1VVjZ0aVZ4MTM3Y2xkOXg0RWZlM1N4dXV5U1N5MkFwVFVyVEZ4K29lc1QvWjc1aXZxRC9yNm5wYnlscVZjNk93enRxelMyenZ4ZGhiTkxkcWtrMldVUDVmclhPNncvR3h6Ly8vLy8vLy8vLzk1Zi81WmE1aHYvLy8vLy8vLy8vL3R5aWt2ZHFkNTNmZnZFS010b3N0aEUwelNrcUNBMFdpemtPbEZrTlI3dzdRdmNucDA3ZUY3RkQzWEpEeFVpd0diaFFuS1R4Y3VOSXJRVlZRNTNBUkFnd0lqbW55TFdIaXhJek9zWXRJc3Vuckdsa3RRRElIZWdXM1ZyTFA3RVhmN2EvLzQ1QSs2b0ZwV1dCaUF3QUNBSk1nV0hBb0N4REFBUWJhRzBnc3JOUWlNMDBDTllKR2dLbURISU5BaWdReVJNeHFNQUt6QkN4SnVKRlFJRUFoVTFKQWNBQUlNV3FIQkphODRKd0JFUllFYzQ3SWgwSzV3SklBNFFLakFVaU1sUVRHUDRaSUJxQ05TeFZCcTZJeVNUbndFbzBKRFJrU0Nsc1NJaXlFeDNtVnJ4VnpSU1YxbFlrUkJ3STU2aTZDZ0JDandJRUJKNk5PK3V4bUR6bU1Od09nVFh5dEJ1YkJTWVUwWnRuVWRWUFJ5bEJJZFp6UFRNUWwwaWEzRGpQSjFwcXYyNndURmVJOG8xTEdkS21remc4dnhxV3RiZ2l2Y3N1cTNKdThhcEtXcFN5VjNwZkhHN1M1M1hKbVk5U05VY1JlT005alMyWmZBMEpsVHZTbUwwMVdKdGlsa3FpTWp1M3JHNTZ1bzAyaTgyZ1F3L2t2ck5OZkNVVWx2NVREend5eUJic3IxTjYxRjg1SGxiN2hadzNqYzF6UDhOZi8vLy8vLy8vL3ZTMmVPMmFYVC95K1ZicDZaMzhXRGJ4Y3VKY1ZaQ21tdzIwM0NvbWswbWlVUmVzeWI2bngvQWRJdEpPR25vOEtHUnpsUGF3Y282UlMrZ1ZOaTUxU3Q0cUh3OVlvVU1GWU5IeWNKMHdWYUhVb2FWQ2dvRkVCUzBsUE9yWjhhdWhQRlZCZzBsTzUzLy9TaHMwdWhpWUJCMVJlb3NTT2ZRc1VRVEhzcEFqb2d1cEtzTUVvZXFtNmo3dDlJLy83c0dUaEFBcFdla24rYTBDQVZTQ3BIY1lBQUJSNWZ5bmRoZ0FBcW9BanA0QUFBSHZFMVNUR1JJQkZrd3FoRFdJSk5ua2EyeGlvV3B5cWNwZFlQUkpKb2sxZnI3MSs3YTFydFpydFo2VXhrdFBhSDN4UjlCZUE1em1OZmlmZDY3bGwzc3gyM1AvM1dZRHFORDdxMTc4eGRhMmQwZjdmcVhyMVB5MlRQVjVtbG9laXkwODcwL2VhNTFxVTNxM3BsYjVPZDFQNmptYjlwZ0hCc2dwUVBGSyt0SW9yNlZGZFBGVFVxdmVrR1JJUWJTUklydVc0ZlU1RHh0N01oOTlOOGNpNVI5ZGFVNnZ0NWIvVWovLyszMXBxYm0yc0tBU1piY1lQV1ozbDd5V1JDTmlBT0lCUklBU3lDZEF6Tm5qQ1ZhRXNpS2hNSUM2clQxZVhqcGNpR2dyazVNT2l0U1MxMWlVNldCMVpNbnJKZXF1cEJkUTg4MDJwTnhGSnhGamJ4Wk5YKzVxQ1BIL2FzdWJNRDFoUzUvMVhMcXNWb2MwdTEvYlRlM0s3cmMyeGphVy9taW1qVWVZSEQ5VjNXYytzemZaeTlZOHJya2RXb1hUNWRDWXR1VllmWmhrK0tzdXJTeWNqMFBNRVpxVHpBZVJKTFVTRVFWd3RMVHViRkh6ajhXNUhXWGcyS0Erczk4UEdSR25ibzFXMUUwazgrTEVHckppNExuS3lES3p4dERITHhWaFhYNmFpamJQZDlWZnMvL2R0dDE5WDZ6TWxlQ1UwQWZ2cWp4VitGUkRzQjBERlFjQlp4Z2dEbGcyYXVIeFROak1LV0JWdmQ1ZkVVaEEvZ3dJQUtWUTJ3TzhCa3NJVGRmd3RDVFQrWHdsMDdXdktUbDd1c3BveEtZZ3B5Q08zS09OZ1hnTXJpK3dPc2d0MjBDTWRJNnBLMXJIUFNEb0pSbGthaHJYcHMwRWsxYzN6S1N0cGRWdE1UTHl4QzZscTZrMEI4S25wSWFMbWFCVGlTU0gwR1NzTi9uWnAvczgrLy8vLy8vOHVRWXNqbGI3L3FoTkxpeGhoZExna3lNWEMxS2JOSDcwTDhiUlF1aFgwZjJQLy8vdWdaTkNBQmRKbHltc1lZR0Fxd0FrZEFBQUFFMjBySjh3eEVRaWRnR1J3QUFBQS85MzkraTNacmpObmFYVkVBaFJJRW9TU0JabkFxQWM0QlFoTkV3Q3gzUVlsVWpod1FqUWtReFphcXhsRG1zcnVTZEwvSVdTT09pSkZiSkdLRnpEUWtNVXlUT2F4YTEwRlp0d1gxSkNJbWFKME54eGFsN1lWNml5ald3WHlGREtNWUpxeXhscWtMOGpzcWVSZnE3UHV5dE5XZ3VaWHF1RnhkY25KM1VqTW9oYVhwSFM2RFZlSE1qN1RXc1JCNUJ3VVRYdDJDT1JOQ2YvZ1VydGpjZGpVVFNjTEpDd0hJc09IVEVPVXVYb1JlZldaTEdUWTJvYU02dkxpZ0xMYkZRQjcyLy96S21NN05WZGZJbysxNkdwdjNrVUc0NDIyZ2xFZ3FJQkFnZFFIUWFNS2hCVmdJSWhVbUxHa1lJeElKQzAySVlPNUFLd01KcjN3MDlsQVBwdVRtMjZJbG1QWUo5VU5pQ0NBVWtWb1ZmYXI1eGoxYW1ra3d3MUNrQ3JOK0U0SFpvS0tUWVd4S1NwM01LZURSRERtTmxubWJCTWxla1RrSnhqeEptQ3Ayd2gwS3BTNGFrYlExSVdSelJZWTZuQTNKUWE2bGdtVENwc2VnNm5kK0pjWXdTTDkybi9ud3pER0RIdnZOTkhvR0tlU09iSXN4dFlSNjdpYWFteUt4bjZLRjNISzlYN3lQVi83VjBsK3B2L1IvMVVpUlhoR1V5V1dBV3NETXpVMFpPSktmc3ZTRGxvZGhCSlpZSkVqMG1yTk9tbVk0QUR3UVdCeUV3bEU4bm56aUd3MGljMHF2bGF4ZFZIZHNXN3dPK0hDeTg5YmU2L2Vkc3R5U3BZTWQyalpXZGFRWUtObS8vdVFaTytBQkkxY3kzc0pITm8wWUFrZEFBQUFFd21YSjZ3a2M0Q3RnQ1F3QUFBQWtMc3RjSTBuS2FmK0pIWHpMbnVjaDlWdVAvcHNJNjlONW5LZDQ3NTRrMHgvTmFZMFliNDNlMVpGUHkzcWR2NjhSTm43RUllT0h4S05ORnh3RExrOWcxVkNlN1dFRTBWQ21qRWtrZ0M0eEtRbXJFTW5jNFZmUVdPZXRjeWx4OEpsdCtyWmZVbzNtZTNWSkJaRkRBYlE3N2FOLzJmMXVaMnBKaHo3T1JFT0p0SkpNNEwxQXJpMVFtMFlDRTdFamdhNm9BTEJDNVNwV2hlRVRZNDV6WlcrcFgxaXRXL00wMkVacnlIS2FzOWxrMUJiOXVwQjc2UitIcFphaUVmalQ3dE9maGRhN0lheDdIcUxDQ1NyY1RSbEdKQ056enV5a3AxVVgybVhxTHNRTWFobGNMckd0eE5OclVvZ2xjR1J1c09LOVUxZ2t5bEl1Q0NOYlRpMk12V2x5dGx1ZmtLeFluSjc4a3FqRWpRS0cxd2NRb1VNa2FtckphWC9RUUltbVVxcVZXWjFjUXNRRWpLNGxoOUVHNXRTb3VMeW5vYWVNMGF2cisybWpSWDdPcExLT1d5akpiMWJYcCtyN2Y5U1IxOWtqalNqYWFZWlFReEE0aEVNM0JHSEdJVFZ4SjZRZ01RbWtsTXl4V3hvRGVRSUNBTkFPRUJNZEpBSEFrSUwvL3VRWk9rQUJNbGJTZk1NTThnMHdCajlCQUFBRkRsMUphd2tlb0RJQWlPd0VJd0loOEJFYTZzd2NTYXdsSFhGcHpoRzExWUpOTVc5WkdKQndsSFQ0ckZqTWQ1V202UndhYmtSTFNBUkljWFFwZFJoTnVLcWI2bWV4R2NYODBJV0RkUlJVT3FVS0pNeUVHWVVRQzhGbVIvNUdGcXVSeU1SclRVNVRFc2NZTWhqRUg2eDB4cW5TVTdCTERNY0N4VG9GN05pN1RFRGlDMmJhMkpKb2tweklzWEtpR1BlZWloZzdVbGxmMTZPbTJ6cXMvU0pmOU5qZEcyK2owYXY5WHl1enBqMitjakZWK3NGMGhCaWJ0b0ZUQ0xoQWlnb1JCZ0l3RXVBcFJBTWoxVHd0UlJuRGV0VWxzN0VYa2pWSkFoN1gwWk54QTR2bUp6NXdjVnFka3BhdTFrK1dPMllxbGNWclRoZTQxV0NHa3N3UlF2MDlZdk9HaXVYRjhHcVBaV3BGYUFwSlJvRTRjQjJQaGFOVG1CQ2JyQlZyazBkYk94VHRmaVl5dGgxRGR2WFAvVkRJa3lXa1ZKbGpxMmdrTWFUMytLME1YUE9VUkdseXdmcG5SQkVKQUVGbjZXUDZrMTFVdHFJTnR6VFpWR3JBelFxK1RQT3VkTG9ZUjYvb0lDeG8xQVNQNU5ldXBYL1pSdWQvUit2Ky83TGUvVFZRMmVJUkVVRzIzRWt3NElBLy91Z1pOYUFCUkZseVdzSkcvQXJZQWxOQUFBQkZPMlJJNHl3YzhDdEFHUHdZQUFBMEd3TUpiR1FTQW5RSUVIT2xxekRFSGlpeWpTa3czbWxERklnLzhlZ2Q1bHhnTkFJWlk3eXFFKzBvZ1dORDVLakN6MkVjajJJK1pRclF3aERiMlJ6SEVxcm43QmliQ052Q1Njdy9uMVZuVFpLeEJGS1dJQ1hVU0dibWNoQW54bW5rRGMzSVdEdEladnhuaDk3eWs1TUR6VGFGekluMmtJeXlsbnkwMWI1VWRaWXhNSmRLQVJrTm9qeUk0bzAyMzYva1pYdGFZVm1RNExJV0JWSUFLcVZ1Y0hDenVkZ1d2cHNSSk4vNjBsTk1mRE90S2s4cGVoZjFUcjFkRG5kU1A1M1l6U0pLa09pb0JkLzFTa2hoSWZHTFFBcmdpQUN3YVFBd1dXaEFUUVZBZ1lTS1VFaURENlYvb205RFdFWFBvZy9ZMlRFSjFBQ1NoNGtIcGs0dkpLQ1FnSFNoZ3lpRFVDTS9TVVlxRE80aVpKb0txUlRJbUZjakZ0dUhLMU56Q2kxeDl5UktUVzZtdWtDcDRrUWVQWFZGTUhnbkJlVzNGV3VUNkVRZVR6emh3YzVMZFdUYnJmRjhucEx1d2tiQmRNcE9ja25GN1NVT3Q1bFAvcTd2My82blZwWWk1bVVFaGtYU0l6bzl4bDFya1dYdVl0aUJ5N3Btd0NLMVdoTSsrZjlLQ3BRK2h0UWJodGVuWVB0VEtPNlkvUU9GMDcvLy8vdDZGZnJuWW5mZjFPY1lmVVlCbVNDQVJSRmRURkxOQXhwWmFCcnhRdHQyQ3JDditqRTRzRGltZllFQUkwaEtPVUpvK0w1d1hVcVVlV2lrMjhVejhLQkhPR2xmUkxGa2s3VWZWa3FSd3M5Ly91UVpQa0FCT2hveVhzcEhIQXhJQmpwQ0FBQUU3VnRJOHlrY2NqbEFHTmtJQUFBQWl4WjBITG1pQnZTSmNyb253MDg1elpUaThsVG4zYWNPcjJzL0lxZDUyZWYyK2Z0OW5IemI4WHRQNDNkeTk1bHY5aTZyUGlLbmszZ2RBS0RoeFVhWUlDSTJnK1JlVFlaZW05Vzd2cGFiYUNZbjNWU0FNc1VhdDdMREpPcENBd1BYYXNhd3Y3aWliWFZaZDcrblZSRFNmN0NreUxuNlRWOTFsVmZyMGYrNHQ3OWJMdDlyWnB1cWdNQWNzQkZCQ2pHOW5DWUFjcFlZcWpScEZSaUlKV3VXUXB6bzYyUjJJUkVwQTZ1aEJzODJXSnp3a1BHeEUyYkdRWWVpSmxQZEplTTFYWTVjV013Wm4zZGRsUWZDQUpta1hNRk1DV3B6bTI4MCtDc08yRGtyZmMxSE15TWMxT3RMM3hkOHg4ZHNpY1lEWGJYclRuM1hRS3c0elNEbFFnZmRzWjN1OUt4c3p0clcvdTVhbjNLdHJsNzk2ODZuNC90M0pSWDBtN0RmbTEzKzN2NHJ0amF6MnFVVVFJb3NQbGpxZ1VBcGFiRjNKR3Ria2tuUmJwaXVqK3JOekdyM011cGUzL0thNnVwRmpsQ2xTZi9kVnRxK25wcU1WaG1WV1EwMGs0a2hzZ3gwd0NKY01oSkFhQ29Rd0VJSlRhVUhIUkVsUko2WVYrOC8vdVFaT1VBQk5KVlNXTU1NOEEwSUNqOERBQUFGSFdmSTR3azBValFBR05rRUFBQXRPMVNWVjVaWGljVm1RMExLTEVwUkVKMmtaQXlVSkFjcG9qcEVpT3ZhWXQwbVZ5bHBRUmRDblNyRTBtMVdvN3MxOGxUMHN1TDVOU2VwM2JrZGJ0Y3hLZUtzUklmWHVMVFlpVUluVm9xYVd3eFRISTRxMEloaG9GVm13bTBOVnFWd2FLQ2ZDMSs2WXdTS3BISDNKVWVBalNoOFdDSXNxWC9kdHVReGpQTmJTQXpJT0pYUkpNNGFkSExGeTQxWmg0YUN3WFlzb3RLNzc3MEd6bzlyN1JPb2JsOWNWcXBIZit2Zm85SFQvc2VkKzFEYjJXTnFOdHBKRkd4Q0VacS9BNWV1WlNvK2hFVkpoVWpnSnZwMVFFdkZvVDlSeDQ3RXNOU0tBaVREUVVPVk1SRVh3bkd5eFBFUUV5QlZJUTNqSkRJalBGMTE4bm1vblRaTlBRbFVqRVlzb1R5cy9UUzA1b3ZKbzZVMlB0bmtVRGhzTzhxNXFNRERvbDRNc01NQ1RpYmkzNVl5NU9zT0p6bytXMUJQUk1aUVJVSWFtM2tEUTMwYzVUSGZVZGlsS2xPUndSRU1HRWJsdlFHMm9HNWtYQlVJSU9TUk5MYklmUmRJREVFZ0ZJYWF1Y3BhMll0L3A2bnRwZlNVRkNiUU0yV0lEVW5mL3JkOHJsMDBhOUgvL3VnWk5DQUJQZFh5WHNwSFBBMUlValpCQUl3RS9tWEphd2tjY0M0Z0NQd0FBQUEwdXQ3WHBFNDQyMG1lWUFYQUhZbHBtb0M2Um9JTEJDQWQ1eStLZ2FVcmNvMG9JNHphRHlPd1ZKaU9ZZ2dnbGpvTFpWWElSNXFlZWJKS2owYWg3UkpxS3lqVk5VeUo1V1NhSmIwVTRKeFBObGtFcG83RERjNGV1NFpKN3BpN0xRV1B2Zzg5ejV0Wk05MjY1dUdVdjczMWJXMThVOWxVOWZsM1UxTjN3NzV1YmF5OTB4dXB0c1BYUi9mdXZVcGlpRGtaMnZmVlJNUG0zUDNUdTN6R201YWprWGxXMm9SUkNTRU1GTUVOUm5xWkRLMEpNVTRtb2tITXBWZVBPc3BwdVljYWZtVzVOUTFxMXB1NnVtY1ZzLzA2WDAwMHJ2cyt6OXhVUUNicENBb0hyM2x0a2tra1lBQWlvR2lNcU13SHpHQVlJVUJvZkRqOHhnNE41UGdTZkVvWUhESVFUbmdRSnY2QUVINGhGQkpTUW1uV25RSERERUVzV0ZRVUJ2bTc0MGptWmxoclFaQzJLbU5BNlY3TWMxT3pId01rSWpPQUF4RURUa1Z0S29NTEE4SVowbWV6NVI0ME03Q2dBL0JWREE0c01CQUl5NlVQTGdZTllmaHNUL3cra2toOHhNdWdvczB4eGxnM09penRVTXVmUjVYMmk4dGVwNVk1VFJwbGpndjlRUU5CY1B0T3N1MVZjZW1meWlrMGlmZWtqVHVTZUc1ZGZqTXJmV1UxNjhSZUtPeHVjaHlINjhjaGlXMFVkY2lPUUpHWXErMHJmaW1rY1l0UytSU2R4SlZQWHAzQjA5OHRSS21zVGNSbFVya01ZaEZtdlJXTGNPMDFhWHUvSTdjTjA5U2JsdG4vL3V3WlBLQUJUbG9TZTFsWUFBdmdBajhvSUFBSi9Ibkk3bTlnQUZpRE9TM0JtQUFHanVTR21tNXV2U3c3dW1uSjJacVY1dXB2OFAvV0g0Zlo1Ly8vLy8vLy8vL1k3ZC91c3QvdXdyK1VObUJLRWdkRGlkUWRMb3VRc1dja1Vqa1RqVGNjM0ZQUE9SR1U5aWk5aDNzdHRxUDgxbWQyaCs3YW1rWVBCdXRCR0pIb0NVSjN2V1FNVGdJQUZnc3lMR2dJeDRVSEVObXBxUkNBa0VWRGpZb1BOM2g1VjNxS0ZwMTdlRlZTN2gxTUVZZ0JNaFU4ZXk5T3dsTVZGaklCYzBpWU5lRVFhQW1yRmdPZGpOUjg0eXNQWGhqRzJBMVlWQVJJWlNNbjFGQmlvWU1KNWhnSVRJQVFIUEdKQmcwR3dUQkdob21wZ3NJRUZqUHVENFBqR21BRU5OZ25SWEZnRFdJYU1xNUVJOXVJUURGQXlRaGp6U1J4V1FZTzhpWGo2R2ZHdENsOHFjUXQ1QWxoVkpRcUZQNjVONm1qS3ZFZW5ralVDTyt1eHBMdXdEU1c4TTU2aXR3TkIyRTFLNlowRnlXTlIrV1NSbjFHMnRQSXBWUDI3R2RXSDM3ZHV6QWxpeDFya1RyUEJFb0ZoMlU1VTF6TzlmczRXTE5yWE5Na25JbTltby9uUFIrR0djUlY3RkJvakU1WFJWcWtuZjZsNTNlc2MrWjh4dTd3d2pkblBPa3E2d3g3djduY0lXL1VEMXBYdTN6UHRYZTVUU1dkY3JTSk1jZi8wZi84b1ZVQVVBZ0FjQWNBZEE2bmtDQUFBQUEzdG01dWtBbzZmYXUrRXd1Mkdmc0FRMmNBN1pZcWh6VGFoVWpBVHdPT0NxeUo3cDJBQXhPVExzRVJJOVJzeENvMkFFaUlrb0V5Z3dFc3d2bk1VaEdGSVl2TU81THJHaEZtUExtdGhtMkxtZ3FHbUxHR2RIS1NEaFl3aEVlUmdvWU9CekJrak5EQkFLTnc0UUJHdVhBSlk4RDFnNEhFVEdtVENnQUNKRkFTbG9RU0FSb0NHVEZnUlltMFZUQ2Z1NTB6OHN3cktQdHMvK2QyY2R5UlNILys3Qms0Z0FJc21oTVZtOUVBRFBoNmEvRERCSWZEWjgwZmEwQUFLOEFaemVBQUFTa1o0OHNoa2YwKzhjK3l1NSs5Ly9QL24vaDlQTDVmbnV2R0xHRjkySDRqRXRvNmxTNzI3SzdkSk1OZnQzODRoT1VtZHY2SGZjT1lPQkJhNzR4REZlUXlmdVAvaEY3Rnk1ZHc3YXY3K0x4dmJ6MVpaUlF4WGxsdVlsbVZTeitXV056ZWVQNzdmMVl0ODdselBmNnBjNlNHTjJJM0Y2UzNaQlBXcnk0aFdCS0hDMmlvWE5mZGdRUmNMazJ6N0VhZ2djN2NlLzEveFg2YTlQY2xWbGc5TzNlS29ySml3RmMrSHZSY2xXQkFrQUFBQlhKVHR1S3VGd0lmRFdDVVVxSElNb01UVmd5OUs3eTVyalB3eUZGbEtoVjZFMEVMaVNIVjFWYlZ5bDluaUZRQTBDR3pWa1p6VWRUR3UxaGwwTlVoQ0tYV242YVNrRmNyUUJJTG5mK1ptUjFVZWs2amh4VXV2VHFMSlg1ZXEyY044dC95ZXpPMEgwcFZYbjAwTjJOdEl0VDliSkloYnE3clBmaGY5RGFSQlJkSjlmLzlvenNkMmN1d1BYUUVjMlRmTWhuOC9HeG9uWGJQZXRyUEdmSGpZdXRHVXExWGdpbTBVaWw5OEFDQ0xEcm0zV3RzRVVTOWxQN2FtVzEraFViVjJMWVRDa0VRQ0FBTnJNNHVVVFBrY0NaUk5nb2RBZzZVTkNNOVF2Um1ZL3hQdFI1dmgwcFc5RjlyNnFLYWE3VUFiU29zcG5PU0tDQlUwTGlnMFZsNjBxNjJud2JyS1dIeVdTMWlvTTN6d3pVQjJiVnZIZEdGQzROaFBvcUoySDRpa0RMV0pkb2J0cmlqeVh5UllKQlpwYWR2T28xRFlrMmhtN1RoRWhWNUVmLy8vZXpzTEVHVm4vLzhWMk94b0wyVTJGaFJEQlpXMDUwL3hmaWU2YUcvdTlHTGJZY3E2NVUwMXJBYTB3U1liREh0QUFRaVFTUlRZMFhMMnhkdGpUOW5pMmhncHE2alBxVmdLZ1lBQUFmeWVyVUIxWkZtYUtFTkVld2RNRDR0di83b0dUUmhBVk5aZEpyQ1RiS0gwQVozUUFBQVJUOW0wbnNvTnFnYmdCbTZBQUFCR1JhVVdTdVI0QXdtZk9PV0NPb09qYTJwaVp4REJFdm13VWFmNjZVN2JhZC9HbU0yakx2dnEwMTRZeXh1NWJsVWpTeHZUbFdSVStmNXBRcE96OHFiYnhJU2poVTJPTXRWcm0wNTF0NVM5YkRKaGdWK0JPN2YvLzdxN2xCZjBsdGF3MDRqdXQvWDhmZUNsTXlNZ3dmTTc0MWVTYnJkK05VeWdMR2hnZE9vREw1TVM4bjRyZHFQM3NQNXBHM2RZZHBxQXRta2hLTDMwQUxjNVRuamp5bHdwV3Rlc2F2ZDBKUnYvY3J6NHJYMFZ6RUt3U0lBQUUxZHZqSlVpVWc2VVlVNkpxRUppc0N0dzE5OW5vdXdyU1pKdFNpMURUSXZaS3hIa05PNDFsYWx5alduTXZ3SFlKWHR5ckZVNkdHakpCZG5hSWlwZGFacHZ2R293Um5ERUNHcEp3bEJjSXh4aDR0WHRVUjFIM2R6cVlJUXhvWnVmaWs4d2w3WlJlWE1ENFFRakNuMW9rREVHSUVRY09VSVFmS0tFVFBWMy9mb3BGd0Q0aGxzTUxhNzkxU3I5WTNYclZaaTR2czZ0UmU2RlE0SEhRUFlOQmtTWXArSklRaE1peEpPeE50bW83Ui9vNy9kWWhENlgxWldoV2xRZ2dBQUN6dVh0MUhQbEpIUUp5cCtLWWpDaWdGOG1uYmFuR2xZNWxLSzgycXdLMkh4WkF1K0owQzRwVlNSR0VTVk1CZVFqRmxBMHViRFB5bWhaSlROVmFOQnJmTmh1NzVTWmFRTU5ySEJVWldIRUJISTNsS2RmKzcveXRUV1NZNi9ldDBRSUtFRGRkZmJxNVg3cC82MnFOcndKRTFGZi83a0dUK0FCVXNaVkxyQ1JiYUlDQUp6UUFBQVJSTm5VMnNQUXZnY1FCbk5BQUFCTi9xU2Z4UlV5WGtSaGs3RmV2Q05UTmQ4Mm9xSzBIcG9VTHREYlYvNlBTRjV4alR6R2F3cFAzMlJjYVdEY2FTcElld1loRTJ5NTl3QUNTSkJLVXBRTEtwNnVoYkYvdFdxbGk3cDd0SnJva014TWdBQUJObTkyZG1FaGtTMU93ZWlwTEJ3TWtFRnB5UU9IQW5wVXFZMm9NdmtRQW9nYjZvQjdhQ09vOU90U0lia09aZDVRc2dnTTlHdG1qQ25tYVZObytFNGowY3hMZGIyeFhGb05tTmN2V0pNVVVtUWpMRDR3U09rVHpqbHYvZVRyVmdRVXkyaXZycTUwcWpPN3FCTUlCNVFpaTlUUEx6YzJXSFlQa2dLQ083dmY3M2Z6UTVSbzZRb0hZVWNvWEJXTHZMazVhakZiUGlxNzFnWWUvM1JhQ0s3TWU0U0NDY281YWd0S0lLMmdCem5EbHZXOWx4MncxdHMyRzAvMGFyZmQrcXhjdTlqMEtFZ3dBUkFBQUUvYnZIaWdwZ1Awa2loNkVpRk1paVNySm00QkVrS1JXaVdydHJGL1ZoR3lQc21sR0M2MGlocUdJNUxucGxNYnJsZ05laWpzS2wwTXpqenFmY2ZiRUlDZmFnaXQyWW4xNXFHcGFPQ1VPZWhLZUlZZXFleXJ5MGo3cGt1TGl5SVAvN2tHVDZBQ1ZCWnRMckNVYktIS0FaelFBQUFSV0ptVTN0UFErb2RvQW05QUFBQkVZVkRidnRFejh6ZnVRcjhISEJDT2c0Um4vNGFOVGhBUExFbEQxdWYzVHY5YnVic1dCZWU0TklGcElZcldIYUdlNXZXazdIVDN6d1B1YVpROXN3K0ZqVUEyakExdDRBQmpuUGU1MDdZemJic1RSK2p0VTZpUHFlL1ovcmlrU1FBQUF1N1c2dkJqUkZGUHdKV1ZTbFFRekVMS1dDQzBYWUw5enk1bkVHY3pnK3p0RFhrRmZLMVhxbUFlWnV3RStqUkhRTWh1cGhYdHllTXA2UGlkZ2F4dnFnLzNGdmdYaTQ3N0dvTFU5ZmVhQStjU0hHa25qUGNscHBadFkrVHFoYkJvd2V0ZkQ5cTgyVFpFOUtNdzRzUWN1dm40K01ZZ2hGaHlQbnYreS85SnFCSFB1YUVRRlVDY09CUkJrTzcyVzR2YUdJbVloazNMemQzUXAyczFROFVKSXVWRkloa3FGcmFnQUtjOWJHdll4clE5UzFvazBxcit5N285WGRhcXB4a2tnQUFHYnVYdEJGTUZRNmZZbktLRkNGaERjWGdqSkRDNkl1aC9IMlZ1cWxSYXdPNnVaU2taVEVWaWNncHE1S1lRV3VodnRaNnl5ckM0UEJJV0l5TEFvRlJSbDFmSDNhakJDZlpneFpJK1dtNzdMelc4ZjF6TG5kYVp4bkUvLzdrR1R4QUFValpsTjdMMFdhSEtBSnpRQUFBUlN4bTAyc1BRM29id0FtOUFBQUJQeGx5ZFBxUXE1MWpmbnovTm1Odit0WDdPd2FlVXR2N3pUZGQ1cFBOZU0xUHQ0MzgvRnRYemp4TVczQTgyYjdqUkpzV250dkdaOHdkdll2MWF2aHlROXdKZFlwU1BEbGI4WXpldG5RamUxU1FVeTZvL3RnQUtwUWhWYTNMdUFESFcyb1JFbmpML3MvTjl0WkFheTdOR3dBbFpPelNJQVRKck1OT09nelM0UkltbUVBYVl0RUJpbUhHdlY2WjNCSnVHQUdUeTJZZ0g1azh0bUoweVpmTFJtOXRBd1lHSXdtY0hmbWh1cHNHcVl3ZW1HSFpqWlFZbUFHcEl4QUZHSWxCaWc2TW5hTm9XQVNBVU5OSUI1cE1lT0RIRTQ0QkVNWE1EQ1NveDRYSmdRWkFSZ0dYNlpBZW9zT0JYWUViYWFFd0hITERzalNBdGVXWTFFVFNvQVF4T1haV3hLMnVtR2ExNXJxaXNjaU1WNU5RL0Vva3RsZE13MTZWVDB2Wmkrei9PM1ltOElnLytGcWtselBaSXJlMWRQcU04dlVzajVFVmhvWFh2VzRneWlmWVpBbmNxRGNFdnRTZlhwN2Nzd3UxYUNmejFqWnJZNDNxZmN4cmU1UmQzY3BxbU5XazdyZk81MG1WMnEvTWZsTkpkeTd2RG41Y3p5MytYUC8vLy83b0dUdUFBVnVaZE50WWVBS0lRQVp6YUFBQVNYdDV6eDV6WklBaHdBbk53QUFBZi8vK2ZyV1BMRlAzRFBsL0gvLy8vLy8vLy8vOHNMdEpFYXRiZExMcFVIditqUVNpUWlrUzlLNVdnQUFBQUFBQkF1RFE4aS9lUXk5NDJzbWE0VEFqOVZZLzcvMWhCQUFBQUFkemo3akNNZ1cvMFBHS0toaVRFQTlSYUpLaFVUZmY0dWN1bFFWUzRZd1IrQ0REZmc2Z1l4SXFOSW9DcEZ3V0Fnd2VtV2dicEM0UmFpbVA0NGo0OEM4SjhicEtENkRieVJJRVpMZnBtYWlNTlRRMFFMYUpra1NKdW16TWNWb0pyU1VuZXlTYkVjc1p4SW5ITTFyWkJhMUlUTXlXOVNrSitabmpaUmVaU0oxYWllTVM4WkVVUGs2bzZwRm0yc2hUU2RyT25VNktTMHpOSkE4blFRTURJdUlvcXBkelZGUzBIVWtpYUpJMk1VRFU0a2l0OU16Z0pBVFRpciswQUNudWU1alNCbVRJVW9xckhqRjMrMWc1T1pUcGQ2MDZGczcrQ1FBQS9uWnloWW8waXMwUU9DdHNOWUlDSFVLQ1F5TGNOTjZVSXl4bERsYUNVSVlMQ0ttSFJFSU1lb2ppY0djSUtPV080cWhZcWFEVFRJd21pS2wwUmtSWVowZ0lvVU43RnprUkpoMzUweUpnekw1dWdZbXhkUm9tcUJRWTJSUm1CeEV3VWxRU1hNRUM0c255aVRST0U0NjB5NGd6S1d0Ym1Da1VYU1JQS1FMVTNNeXdrWW5TeWJsY3VrNDVWTGJyUlRUVGRPZ3RKSm5VWXRiVldtdGRkenlrMFZIaThveFc2NmtwbW1iL01aVUowZ3J4Q296R0VGcFRLUDhlOGE1NTFqV01zYXdnLy83b0dUUkJCWFFhTkh2WmdBSUlVQUp2ZUFBQVJiUmYwbTFpSUFvYUlBbmRvQUFCRkhWdjhyZTdla25ieTRBQUFBQ0FrZloyVnZFc0F3VUZoWWpHU3prWXdhUmdWWW1qQlVaQ0dRR1JSZ1pXR1dqQVlVb0pnWVlCQXdBSVpNdUI1QkVMQTB3NG5SSjRZVUdic0laVllmdE1ZY2lyaEpJeUFZYWVESmQrek1DUUsyT2FZU29nVXN1eUVkSUdSQkFFT1JEQU1KUU1NU0lNR09JaTZaOWpHR3pMZ0VxbWdMM1pzYVZjcVdFUDRZa1lpayt6TG4xaHFORFU5WVZuY0hSKzBRQTFDbGROZXBLZWxxekR0ckNTbUVaV29CVWRFSXQxQXNCdXdEYWFLMGhaN3VUY0Uzb05vYTB0dXhhbXBxK1dFcGVpUlM3Q2x3a0V2dk9DNk05YnBvdGN1Vkxrc3I0WGU3djcxUWZldjRaMHVQTE5xM0VzNlhHcjZFTUVSbElKckZvWGEwNVV4WUN3ei8vOUFwLzIwZ2lnQVFBZ0FoZ3FGQ0pwZ0FBQUFBQUFoeVVrT0lEeXBmV21NKzVHV3hqSXg2T3ZNNysvZ1Y0MEpBU0lBQUIyMXZMVWdDZUdKaENRSmg0NFdTTkJoc3hZQkRGT3d2TWdQaUs2WUJWaVQySHdkVHFVN0ZVaFdGYTFGdlFKTEZFWE5LbWdvcndGSWwxdDRQeGFFT2FUVExDMFd0NzNqcWxnWmxNeTFueGo3K3RXL3BudzhhenV0TTUvck01dzZKMXlnd013WkhqWkIxckZwN3c4N3ZuTjRyM2RZR284cU50YWttTlZ4VFc5VS8vM3Zmclp1WmM0emJkYmIzVFY4MHovYlgrNzMzbUhha0h3cDZhM25WUG5XTjYzckVUMEVTbVJKQmtrdi83b0dUdUFBZ1hVRkJXYzBDUUo0T0tEOEdJRWxYQmpVZTlwNEFvYmdBbk40QUFCTnN2MkFBV09ITGVLUGptV2JUaHAzY2VKZWxtN01ia1VTRkZVa0NBYnJydklTQmNTTEVEd29ZQ2l3Q2dXSkNZUjBSZzFSWmExVnpJNndSd2dHaUVJM29lbE9pcEFUcmpDcmJSc2lSR3hqRjVLUitoeGo2Y0dWNjU4K1dXekloRmhkYm1qdFk4V1JadnZlRXBRU0wyZitiQzJEVEZWWjJoSjVFNUxQV202K0FiSkFxamhSK1FTTlJLVEpPYnV5N0pGT2JTUnVVczU0WkxQdXQzSzAzK2MrVkxNOGQ2NXVVOG14bjdpRW41UWtwbUt3RGJ0dTMyKytnQUppZzRndEtFRmExcWNpbEJyckl0ZjBlK2w1WnltRUVvclo5UFFsZ0VPTUlFT2Y2N1BvYk9qV3phSW9LMVZBa1FrSGk5TkNGQlhkZEpDcWtUbWdrZ0dSR2lIbFlGcUFreGFySEltRFVvRUZTajdsdGZLYWtna0ZJYkpGODFwQi9ISlhhTmVuZDdwNm1xVXBvdVBPdEo4OFVlVEJ5SVNNVmc0a2xnc2V2ZjR0NGRHTE9VYUV1U3A3OWI3K05meTkySzd4Vjc2WnJSTXFNQ0dhOGZjQmdNcnI3aGQ0dGJYL1N4N24rSXdZS0wyM3V1MGdBREptcEJTMktwV1ZkVW93bktyU0tON2x1U3pYcnMrWFVCeUxWeEVMZjdheUlMUkNSUUVmRW5FT0FRU0lSQWNDU0JFSU1sYUZBcUNHWlphdjFMYkY5WWRtWGtpa3drSmtpWkNtRDA0RTU2Nm5hb2ZPRXdKQ2pIdGZmTE9XRlJ4R2RYVGMrTlR5dkJhTVdWZFhTYmhmbk5XQjV0R1hTMmwwVFRtZi83a0dUbkFBVEpXMUhyTERQcUpDQVp2UUFBQVJIeEwwR3NNTStvZXdCbU5CQUFCS2s4c1VxeUlJMmN5azZhYVJsaDczWElZZWJJclFnWkplaFE3YUhBY1dNSjZhbGxMdWpXQUd6ckVQVTdmV2dBTUpMaXFoTEZsb0FKYmVoRmE4c2xmS1pGZi8xQTBkMkZBaWI2Nkl1c0FkRW96QURNdzBRR0ZBYktqT1FCTGdKT29BRVl4QnJMTDJSNUN1eFVPMGtUVlluU3VoTDBkaFhaZnAyNTlIZlNUd2RSbHR5VUNMV0ZoeWYwcGlKRFV5SVNLRk9WWlhhNGM0Y1dKU1dyK3NKanBEZVBzd0xVclY5YXQzakpqY1BEMkx0bDE1UC9tMjVjVDZqWnZTQzgwNTMxV1NuelBYTkgrMzJyVWc3dENDakFNY2hhS0xNdEJRWUt1OXYvMUFpckRRN3cyMjFZZElpaGFLaVFyalJ6MTcyTHJyYkg1K2lVR3FRM1hvVFVBQmNoVE15U2c3a2xUUUFBQUFQeWJNY1ZDbU13YmtWM0FWYWFFZVc1RHFoaVd4aVVnR3dpVTB0S2prVmhRTWlHaEEwakhRQ0pTQWtxRHpHcERrRXdBbWFrZ2VXNUpBb1dDR1lBQlFXMFIvbzZGQUFZUURBTGNSZ00vWWNEYnBQRGdOb3l2UmdIRUMralRaUzlNRkp2cUJxL1llN3ROSHF1T2R5WWxkSkx0MTRGaXYvN2dHVHZnQlEvVHRCcktSem9IWUFacndBQUFSTHhIVG0xbDRBZ2dBQm1mb0FBQkZIZzRsYis2L3YyYjJINmtGU3h6K1ZRYXRlUVVMQ2h1R3EvbkZ0S3V4cDUxekFYbWRINVc0TjFDM3ZyYWovdW9hai82bUFxT1VBYWQ3YUM0QUFBQUFBQU9ac3gxRWpmN3Bjb2NWR2pRelVMcCtIakJZOENxQ3dTd0FNQUtBRWp1dkhtK1hSTWI4eVpZZUhvQUNpRUlZbVdtZE9tQkNtakRRR1pjbWFvZWFTa09qVExEdzQ2WmNpcVl3WUtOT1hIcUwvSjVwQ2hRbk5ZUHg3bU1ERUUwUVVLcTNzblVDT0tiREIxZ0RPcGtvT1lzVnZxR0JUU1hpYkNobWh1VUpCajVhVEVaUWJpUVlqMkpBYXVtdjNtcnFsU3ZRSklubVRqSmc0U1lRTENFRktEeE1pRFlCdU8vQ0pTcld6TmxLakxmcTNPSXNBcXhPdDNTM0RGR0R5eTdYdTB6cVBmRGtGdi9EYjIyWk5mMUU1RmpLNmFUVzc5NTRiYmx3L1lqYmF6ODdCY013OC9NRHhlYy9ENi9hQmxFVXZSdXZoZHd1U0cxRDhqaWN2MVhtbzVTdjNVdVN4NjRIN3ovL3V3Wk9XQUJhMHdTdTVyUUFBaGdibDl3SWdBSlQyeFQvbXRvZ0NoQUNhL0FBQUJYTWJlcmxqZjh6M3FJdWkxdUcyUzNKSTE3REMzOXkvZXJyQ1IxcGNDWVNPSlNubTZzcnpuN0Z6bnkvVjZrMzNLeC8zbHlRTm9SQ1JFV0dOWEVsRUMxNG9BQUFBQUFleEllOWF3b2ZoQ1M2VGFyZ1d4LytySG5ydCtqVi8vN3VxY3g2bVloQ1FWMzIzR3FBcUNZSnh4aGhxZ0JOTDBJVkRBYnNxTEpOaHdMV1dpMm9JWWM2RFFmNFQ0M3BLbGhVZW1MNzUwWnVvUzc5TVVvZEk1SkluT1FIUkJIeDFDd2VRTlBPdk13cEQwc0ZiUkFFZGxrU1doN3MyR282bEprd1V4ZlNwbytqcWNueDdDbUx6c1ZOdEFsVzVSY2NNUHdzYkZDdFBWejFsRVZLWHZTejFMMXV6cjdTMTFobUQ2dHUxcWpkYVozRnpUOHJHNzZkSDE0bHNWNExXUVhTdE84WGozRTBHMW52eXM3THRKeXN6WG1ZNGdvRlJXUjFSb1pLSEx1QUF4SWFIelc4YW5TQVhpUHFpMWJxZml0elY3cmQrMnRlMm1tYzNNbVlka1lVa1RlRm1tTkpiRXdSS29SR3N0K0ZGbFkzdlI5V3BkcDBJSWFZYTNOdnB5dFdrcjAwa2JhVWlvVkdtS1hiSjZXZVVYSWZnS0JWRTBrUkJzZFFJQkNPV3Q1N0dsU0dRc0o0dXEyRnFtNUNteEQ4TWRaQjgwVEFqTVNxMVgzcWtMRnJ5c3FVTk4waG1CNUtrbEh6UmhLL0dxMU1SZFVxQ3lyU283VU54WjBnZWJDdmJoNE5ZUFNSQWpyVlZwb0gxL2NqcjVpU1VPSlNOUk9OdlRzQUM3RER4NWhwaHIxRFYyMkcyMkhWSGZXbFZhSDU3MDJJcUtxb3FXWTBZVWJiZUV4bDV3YkExQ0x0aU1KakFoeEFRVVlnQVJ6WW95MWoxcHFjTkRrTWlhTzFYQ0JFNlNrcVpLT2g4cVFuU2xBdU1tb1NudHg0VnZLTGV6MFNrUGdXbU1EWlJVVDVURHhDRjVoNUhxc2pELys1Qms5NEFGekdiVi8yV0FBaU1BR1ovZ2dBQVRqWjFWN0NVVGFIcUFKTEFBQUFEclpwU0diMDJ2bDFnNjRwT0Z0QjZISkcwM0l0WTNHSDB0S2ZYTmJRLyt1M2Nhejh6TlpYTlhyYkhNMG9UQTlhUU9oWTJsTnFmdVNoMXJpbTM4NG1FYlNzZGRXd0FJb05CWkNsUGNwZzlSQmxpdFdHV1hMcVpzN2ZmeDlLR3RRME1pQ0FvNDIrUFBtTU1iTTVNY0JDZzVBUmxDcTVNdWo1eEFjcW94RXVISzM4WjQ0YlozS2dhSk94QlU2M0pSSkNPbG95akhwTnVKd1J4WmhHYmNJenlpSStoSFJXaVVwczRKcUkyOWg0UnZtWFl2RkZWUy8yYVI1SldPVzduVk5YMTFNN1ZTelVDRjN1NHl6RFIzQXlHSmloOFN1K3k4REdHckxiTTJqc1JyQjEvMU5TcThNT0dLQ0lnaTRnbEZqYlBLaDZwcWFEcjFpSmFFa2VHNUVDQXJ3N005dTBqQUExVGt3SWJJc1RjZ3NvWjZGSzJtOUxHSjd2cTFmdGFMVlVVVE5saHlNeEFMZFRtcGdDQUlxQm5FRlJRU1BRa3NrQ2g2Z2dKQk1FUTlXZzdVZGFnbXBMb2ZjbUFJM0gzRGlVVWdDU3pCOVdCRVZHbDFCY29pSmo5QjhnelUyaGRYZE5nR1FvRHZXcGEvV3dsQnYyZXhVOGhnbVZqTTh5ai8rNUJrNmdBRXJGOVRld3hEMmgyZ0dUd0VBQUVVSVp0RjdLVVQ2SW9BWmp3QUFBU1FJSHpUdFRWYWFwaXZ1ZFZNMmNCMjJmNm1xMnliTWlnK3hEYXVmam01ODhjcTgrRVBlNmpKV0dXSEkrRTJhNDV0QjhIQTg3aXBzR2cyaXNVTWlCejMvL1NSSmRiWTQyMkFBQmpMVXRiR0dESTlpd0lOVFRTd2N2Uzc2N2ZkZDFhV1ExV0dSREFveVZQWWVOQURSaXVKN3FrQUp4c1RoeEJrak5ZRmtsQm1lcDByNGQ1bVRNM3ZjR1d3OEpnVk11V2NGbDNFelNJN0RSa0RoNFZJbkQ3MXRkSG5SZ3V4WlVTVk5BMXNDN21LYWxPdHRHZVZ0QkpVc1poQlp0Q1VQanJLS2NKeGpsWGZjWnROaE1McGU1TWo2azBUQ3J5dDhYak02a3VhKzVxSHJhNVJqRGptVlhWWUdQM1JWVWcram1hMXRMdHViaDR1YnVkS3VPUnM1aFlraGF2UnlKc2tBQkNGVWxwUlJPV08xVGRwZGxuWXRWa2tZc1VFWGc4YS8zTmVudFRMcWxKU1dJUlNBZ054T01EMk9XSUdiQW9XaUVDaW4yVlhLQVRIQlplaEdndkFzTXdFM0o2ODREZDBZME5HNXBISFlGUmlJZ0U3bWtrUU93Q3hCUFZWS1NRbEtoaVJQQnhLdmNPcE5VVklrNmRTV1dSdVk0a1VJV0wvKzVCazdRQUU5bHJRZXdsRmVoN0FDVjBBQUFFVDBaMUI3S1VSNkpTQVpQUUFBQVRmRnBXT2g5dExmTzMzTm8vOFdMSEpQbXlSMmRqMENsTGZveXhaY05zOXNiSmNxaXQyMEcrYmg4NkJmTnI0eFZZSlp2R1czL3AxVm5xWHU3OUJ4aVZxUnVRQWNDcGw5NlVFNzB4RjRzeHpHT1BDcXZhejZXSFB0c01TN3FxeEVPaG13N3Z0NkV1Z2dFNkdVaHhDRmdKRk5zR0NDRW9kQ1FUc21RVElTbVMxbWdOc0hnQTBtU1lzaVdzYlB5b2VsZ25ybmlwZW1uTHJDbXR6cHhTMGZNekN0UG9MeHBOMzdRMlNwWTRiMTBxWGxDZ3pJYkx0ZG5GckxDaVAxMldlNjJ1N0xydGZpdEN6RlMxdTd2VHJjcmZYWmZtV045dVhyOWZabnArT1o3WDdWOTNtN1AvMi9TdWUyQ0UwbVdUdHJYYkY3V3FxUUFTT25oR1FZV2NMRlhXTFhwUElPdDdTVlpHUXE3ZWJOUEQ4MGh2dS8vcHYzZlIvci95ZFNKYzN5K1cwVGtyY0FBQUFBQU1Ra2RFejJvQ0ZBQTROZ21JcGlzWjNCc29LMkNrVElDREdCQVdGSmdBT1htSVhyTWFnQ1NIR1FPc29HOWl4UzhpRDRnMER5b2xFR1RNSXlBZm9MclZDaHhhVWdRZ053RjNJQTB2RTlWVmhZUzhJMnU3Lys1Qms2b0FFbzFOTit5azBlaDhBQ1J3QUFBRVNtVkUzOVpZQUFLb0FJMmFBQUFCRjFITjQyeG9QaFFhd05BcXBTVEQreGxsRHNWYnJvdXpTdzQ1YzdOdHhmUmcxUndIY2xpN0hjdXNwb0dkb1dsbkVxVlFWS2E2eTUvbktnWjNKWmVuSlJ5dkdPUHZTdHhrV1VFdk5LcXM5eTdkenMvWnN5L0xDWDVjcDg5Mzg2YVZSZUdwcXRYbFZOaDNXdTQ3NVZzNDcvdmM4OExIM3Vmci8vNVZMYldkTlZ2WTQ3djgzenVILyt2Ny80L3JQdVdIL3p2ZWMzLy8zLy8vLy8vLy8vL1dzNy84eHI0Q0VJLzBQSG56clNSQjJIWmZEakFBQUFBQUFHTWhHNm5zM29VcVA5NTZveFdXVDVtTmtVUUpIcWYvLzlObi8vL2YvcFJyditTU1h0K0ZZd29XSVRSNFFSb2dsWVdHVFZTOFJoZm9CQ3FycGZKSUp0d0c3d09IeFhQTk1VcWM4SXA2UHkyR2k0NzdxT0YvUFZ1N0dobkVMWmNQcFAwcFBYVVY0eE5iMjZsYVBXbXRtL1BkdDFacmFPdTVXOHRUVDd4WmRxLzVNejJZb3E5MzAzNDJIY1kxK2EvUDlHTEVFMXRKTTdYeVN0bGxJeU9Dcy8vZTYrUE05WncrYzR0TG9TRzVSSmJlNVFCcDBjMHRIenJITk9qVjJYMkx1aWoyOUMrMy8rNkJrNzRBSWVYakpibXNBQUNtaldSckJDQUFSblBzdG5aWUFDRytBSkxPQUFBUjZmcFV5TVZnak1oaTliamlzYTBBSm1SYUNveThXSkZ4NHdrcHVVZVVWYm8zU05zUmRLd2xGOWZVbWtvOVVPeEsyNEN5dkhDQmE3VjhWRTh4dlNDT0tyanFWNWRJNUpkYmRveDFlMkRYZmY1cnVnZWJlbzZ0aVpkM3JYY3JlZnZHOVErN0xiTTVuOTFxVE9mMDlhM05Yek9wTTJuTTJlbmI3L1UvNldqMjJVeis3L3JUS1h6cis5Wnp1N2M5MXBWOUxVbmJ0bmZqTElMWWlhMjZBRXRJT0tzcVlZb2l1ZmZTK1hhamwyTm9jOWVoekZ1ZHozKzluLy8vLy85S0l6UThSQ3c2TTZxdXVjaFNBQUFBQmdOaVhSNjR4aUhJQUNtcWVtMUltdUluZkVHK1BHWENHUUttNEhtTUdteFNtaU9BQUVBUno4QXdnSmFWc0F3RG9Kb0tPam1MMUxXUjVPa0RWU0JTdlV2UUxRQU0wVGtZR1RKVWNiR2hLY051NnhsNXRxK0xkbVlLblFHTkpiZDhrNER5UUhTeWpPVXMzRTFmdmtudXArSFd2dXU3VC9NOWw4Z3crclZvTFdHY29mdUczWlZ2VXZpbExPWDJlcmcxdjlieDMzK1lkNUYvdzdoVXg1Y3ZkMTlOS3N0Zm5qcmVHUGVhc2Uva3M3U1Y2ZTlyOVNxaGoxTmhmNS84MS9lOTUvNjdqL2VXSjZHSWNrZFN4Ui8rZmVkNXVyRE5tN1o1dm1zZnl2Ni8vNy9QMS9NUC8vLy8vLy8vLy8vWE85eDMzR3YwSC84Y0ZWaXlXTEczRzRtbTJoZ0FBQUFMblJUYVV1WEpWZmpoVmk1cVJRS2drVkU0c2Q2di8rNkJrOFlBRW5WVktkV0dBQWlaQUNQeWdBQUFoRmVVbithd0FBSk9GcEhNR01BQVAvLy85YWxwbWxFbERjMGRFZEo0cUF3Q0FBQURBeVJHRzZhb2VKeXc4R3RKQ1pVRFpta1ptWVJLWmlGSVVEaEVZQXdHQVlZaXdNQW9aR0FPcklIQkVTQVVjQ0RCOWh4d3BnRm5nWXdnWENJOUJ0QUhEQ3c4QmdRRFFScEJnZ09JQnQ4UjZPSVBsQzNnRzhvSW5oWXFBQU1DSVF2bUlZRGVFTG9Fd0xLRmJpbmpKZzJaRmFocW9NdUZnVzhkd2tROEVQTmlDRlozSE1KdEZFeVNRTnl1YmtNSXVjUUhHa29qamg4elFUUEU0VEpjSFBMNkpUSXN4ODFNMUdOU2trRWxWbWh1UllvcU1HVW1tZFk2WW5FMERxUjEydTc2NnpSRXlOaXF4c1pxTURxajdzbXRBOGltWEtyTXlHdHZxVmROUnV0a2l5WUpyVFROMHpOWjV6QXRvcU1XTlRaRC8vMlZmOWYvL29URjBUTkZrSFBuaVZXbEZWU0FBRGdBTmQ3bk5qYUc5SnlraHhESjZqTmthNUNTNzMweFFRQjhrL1lzYTFUQWlwczhkVFdpcUxuVDVvS2E2RW1CSUsrd0lKczJzQ3REcUJDL1dCUmFiTmo2N1pvZ2gxWC9kLy9hV1JNQUlBS0FZT0NPSklBQUFBR0dZOG1UNG5tSWhlbUQwNkdDWVBHSHJQR0RBUUdJWTJtVVlsbUlUSm1Zb0VHU0NRbUw0cGhnZm1QcE1Dd1JnNXZTOFptQkNlSmloNWhBcGh4S3RiM2dJdWhMQkNvMVk0SEVURmxnV2RNV1ZBU2RBb0lDU2NxRGlxVUwrcVlJM21wSXNzaENJN0o1RXNTWGd3QVRBbDdpcEV0ei8rN0JrOElBSWZJaEsvbkprRUZNaXFOakJqQUFleVdjbldkMEFBSkNDcGZjRUFBSFFzSHBGWmt4SHpwSDluY0lySEpkUzAxdkFvQ3dmVW5NcUsvWXBhMVhHdnF6VFcrU3FwU1VkdTlNWEsySFB6L3VXUE1lOXRhNy9jZThxWVVuZWZocmVlSE9jNXovNTNIR25zL3pmY3NONnRXT2ZoclhQLzlmLzYvUC93Ly81ekNvWFVKWGpYcUNoaENialNtRHYra1dVc2dLUC9sQ0NDZEVBWUNRc3R6dWQxQUFBQUFBQUFzV1VGQlR1RFNubk9jVFAzaGl0N0dtVEQvOTBocWNBQXRBRTlyZldjaUVxMTBBdXk4UndES1Z4Z1FVUENVZ3U2WTRPQ2ltUzJtYUwyaVJrSjFWSDdlTGxPUFROTHllYjR4NFRsQ2tVWklUS2Q3ZmF2bGloSzVza214cjZSQ0VvczFZT1Z2Ni8rYi9HNWZKN04wQ1RNdTg0cEFiRVRCY25DNy8vVi83MTh0THVjdVU0MnlVa3pTMTY0cmplcSsvMXFsTlRUTWJtOXNwNlMydm1GaUZqZWFTMHh1TzhpVzhEZG9uclZtZUs4RndZYWlXZlY1NXhZdVFFQU1DS0hkN1A3Z0FGcktsa0ZYRlhuSHhBTHVUcjlWbDE0eHg1NytlT1EyczhrNEtKWUEzdFo2dXNrS3hJVEVpZ0RIeGxjb1RLaGl3U2hQQW8rS2hnQ2hBc0FNcmtTM0gxN0FjdGRtbmxFY2kwTlEvTU1qZmVNWTBoRG9KS2tmaExPdWF5ZFh4UGx3N1ZWdjVlQkFCckl4SzZsbVBKbWJzMGsyVUh1SUdSVUh1MlFEN3FTSC9rM3YzOHZsTEpySGhNTk9vNnluSFQ4UjlMVVJNSGlBaFlzV3hKOE1IOExKdTdqaFpzNFlkWnFEaHZqbEtGcEZCVXNXWVpJMkltMDI5Q2dRQUpMNzc5YXdCTnB3eGhhRGlOcUdLYmZGRzIwc3BDaDNuRFZ4Nzk4WUpJdnE2S0FBcmdFTCt6MVQ0NFBqUitJbDRhQXpIYVVJT1RCU0JMRVJrQXFvN3ZCeWdDaG9LajlxS1BHNXU1cXYvN2tHVFpDQVVTVmMvWGFlQUlKQ0FKcitBQUFST2RZVDlOc1JUZ2pRR21kQkNJQk5UMEw1ZTdqUmtONWZHS0NYNXhTbVhTOERyeTZrb3JkK2VzRUxmOWM0b1JvZ0pDNVN2Ly9VTm0yNjBkSWpURDBEL3JUQ3hGVGFPWlVsUitGUm5maDlrbElsQ2dRYmZLUzhvNS9WeHVXMTczeVNldTJ4QlEyZ1VSSXAxQ0U2bnNwMWsybS9HL2tjUWpLSm5GWXBteUxSZVlJT3FZZ2pTQUFETnZOdnJRQUp1Q2hNWW9SZzB0QkszU3BNQ2wwU3lESytsa2pkNittWVhISUFEZ0F6dmJzbW9WQjBtVHlGVVN2TU1qU0k3R1FBYUNSQUpQK0dBd2tGd0F0MWpkSE1QMDlHZmNOMjVxcXo1NUhHWEcwc1pON293YkJSR2JaMCtkL1V3TGE2MldYSllseHhkSFdabVptWnlleXR5OHFXYy9kLzJXd3ErWFlQZFl5disvL1VxTkduaDJHekpjNHd3ZEVHV1BHaDVNSmNWY0ZLWTVVSERoNDRTaXN3dnp6K3Nvc0pGVkJ4WmxCR01MR25SWHpQdDNlY29WT2xJbnJoY1FBQkltZUUrLzNvQW00S0RlTVM4dThkV3BVZFBsblhDbGhkeEhzNllvd3V3ZEdzbUxWdlFkazN5bFFBQUV6QUtXMHZ6ZWlJNkRvd3hNTXlKSmNZZFNVQWJVc0dFK0N2LzdrR1RVQUFVSlYxQlRlRXA0SWdCcHJRUkZBUk85ZjBOTnNSVmdxb0dtL0JFSUJCSVVGM2FiVk11Sk5JSm9oQmUxdHhwR1hVWk1NRWNpbk43SzNQZHNwS1RyaE1FdithdzQ5c2IzdFdOQ05oczFwc2IvL3BxM3ZtUGJ1Tzk2clRYczZTbFkvenZlN2YwLy94bTNueGFNcWRZK2JVelcwQjdCZDExak9iYjNxa2JFYUhWd2NvKzlSbjFOZi9HTGFoYmd3ZFp2V1hOTTIzdUZURjg2K040Mzg1K3RZeGFEdWVNYTdjcUFBSy9GKy8yQUE2Y01HOVNIMUsrUFNGVUNmaTdlTjlqaittbXZXQUFBQVVLU1NBRUJFbkxxNVFVQUFBWndaUjMvTm1kd1laVU81ZzUybmJMNmRqSHBrVURtMVRHWnZJUnZObUduaFVacERZR0NnaUJCbWdpbVZ6d1pmQjRjT1I4TVdCUnJOSDhOdmFWT3ZNV1pzSkwxalJJUUVCNHdUYTJVbVBLTnlwSGRDakdLellVRGpqU0MzNWNpS08yZ1RmOXBVbWdoSkJqTEUzdG5rcTBlRWM0cGIxcDBFRnBITDVWYXNod09VV3M1Wkc3RlN0ZTFyNVZJYVN6WHMzNGRpS1h0QmxJYlAvK3NmL24vLzl6M2xsM2ZNS1cxbjNETDlhMWxydi8vLy80Ynh5Ly8vLzVuVnNPMzlQNnZkVW4vLytnRUFCKy9WLy83b0dUTWdBVWZZRkR0YWVBS0hNQnB2YUdBQVJwdE5USDV6UUFBaXdJbWR3WUFBYVczYkFBQUFBQUFCQU0xb0NQanhqMHRpL0grdVA5dGY2ckhmMXJmOFFBQUpOQVRIdnQ4ekVSQVRaZ0FyZU1ZRE1OUkE2b3dZQXZTRndRYzVXZytnVkFxd3ZhczZqUVNmUTB6ZXVwSGNHZFFuSW9wWXlRc2tkQm5uRFRWZnZiZzJKbThDbDYxd2hDbXZIY28wVEd2LzYvZWNhbGQycHFQWmpocHhWSTUzUEN6aUxqT3FaeG0zK0lGL005ZVpqV3h2NHUxUWQzeTh4SDM5ZlZOVnppc0NORmV2bjBTdTV2ak9kWHhUTjUvQnUrMVNCV1ovRTNxZjUvejhZMXIvK3U2Mi8zaUhpRzU3b21NQUF4ZDRodmYvZ0FDYkNhQ0UrNjFMR3lOam0rMWY5Vis0U082S0lBQ0U3Z2s1L3I4UEZ4RVRJcnhEY0RIaGdCNDNMYU9SQ1FTTEdrcThrTENFSEsxWkllZzJjYUx2SHg1bEwxOTY1VGxCenJYS0llQldSR3ZOclY3dktPdkYxYS9iRktyVWZPZlRweC8rL2ZPb1ZvRlcxenU2dEd6ZCt5eldZVkcrZVA5VHkwaVYxRXMreHV6SkpVN3I0eFlkQXJNMU9JYWRhZXpTVUV4UmFKV0ZJSkJsTGVmc2VUYUtsdmVwNmtCQXlUSXJaM2wzVElKSVlpQUFFd0FCQWp6RWU3M1VBSFRCS09nbGF5MXptdFl3K3c1M3NkeGRHbEgvVkdkS2R5QjZ1QUFWUGtYSi90K2xVSENDSjhRc0NLUUZqQkdHSVJiMmlwa2VPdXdWaG5wZVlrVGk2VnA0clRkWkU3TTd2Tm5MS242S2lFbjRZRnRRclZuR3MrRFE4SEtkLy83a0dUa0FBVktZbER2YWVBSUhNQVp6K0FBQVJPTlQwT3RQTkhnakFIbS9EQ0lSRjJ1R3hMb2tENnl2L21ZaUNpeVdUejdEaGVtZllva1B4Tko0Z3pWL0xicjVuNm1tVkxEU2wrR3Byc1ZhWnpTRS96VjJ3NHVTRXRQV0tEaUJZa1pWZTFrdWlydmJEKzJ5bWZtcjRtTzd1Zlp2M3luYkt2czZmR2R6MUFBQWtpWmpYL2FBQnBJRVdra1g3a0NxeHJkL2pFMWF0M3ArdnEvclFBQVR0QU1ldnUxWUtGQ0tVRnlndHdNRjBEcndpTXFGakI5eXd1TklqaFZBUzlaZDV5dkEwdUh4REtMUWs2N2NYajJHU0ZXR05ETkI3c3hPL21nM0lpRnNPM2s0RWdJa0JrVEJmLy82M3pRc0Q1cFNDaDZOZEFVQzRJQmhQWFVUeHJFTzV4eFluQm9DOE94NVVPeGVMREt1N0dKY1ZqTjNadytha1dCZ2dDV3hFUnBWbk94M0V3MHhIVUxjZlB4ejNOTnF5M1NTMVdoN1Y4SUFBQUozaGJyNUFBR1RKUWdldGJsMHZGSG9TVHhLZlZUUVhxMyt6ZDNXVmtxQUFZRDBCVGwxLzhMRVJ3bVJHRlVrVVFHK2k3QUVKSS9HTUZPV0lDWVlSTUtUVitvRk5LMHdHeDFrRTI2ZHFhb0xOUi9IU2N5UnhlOUJGL0d3eVNVWTBWK253VEcyUzAwZGYvN2tHVGZnQVRnWXRIclQxdFlIY0FaendRQUFSTlJpMFd0TVE5b2hRR21mQkNZQkZYUS9VTnc5SURvV1cvKzRpSVNRU05VVnorMCtlU0JJRDJHaHMxdGYxLzNWUlRuUEhVWmw4TXUvbkxqVW5MRnVWbWh4OHFyS255bW83Y0dab0FlT0F5RHVKVkkrdEJQTWFic3AyV3BWQkJDMnlGNjB6QkZiclc4a3lVQjhGMkxWeUlBQUdBTERwTnZhd0JKallLVVVXQXl5RWFxalBERnVwdVorTW9KMmFsZjBLOTRBd1lBdVIyYnRpRUVwb1lJdWx6emJ3Um9pQ2w3Q3dZSlFKbHFnS0pNU2VNdVhEaGFLOUtuN1RRL0J0elU1RUxVQlA2cjV0WEFsMW1VUUxIbzZyaHZHa1NTVFZwbHcwR3BxTmp5dGZ0TW12azJIOGtQYXovN3VWVHlKc25KdTJvNUpRZnp6K3YvKzdxVHp6ZGc4a0FHQldPZzhkbytTMmtZNEF5RVNlSFRNZ3I0NzF0Wm1BWW9XY1RJaENVZlZGNmg4ZG45TTd1RmtBdEVwUm9vMFFCZ2hNRVdUb2xYcGpTT2tDcVNudXlDcjM5MkFBb0RzN1A3d0FJS0Roekt4d21EOXU2bFhESG83b1BXYTNwNjJpekJvUk1oR2dCUUlBVzFVL2J3TDBCakJvVktJbmdnWFBUR1ZUR2twNGxDVU5jRVVQWVlEZ0lreGF2UHgvLzdrR1RqQUFWUFgxSHJTMjVZSWNCcHJ3UWxBUllwajBWTkxOa29ob0dtdENFSUJPdTdkMTU1V3UxU3Rycld5U082OUJVVUlRMW96Rk1uVkhZQ1MyWW84dHViTjdIbEtyVnZRTHJXeisycmoxamM0TGIwTFhkdUVWQnBtaHQvcjQvdDF0bW1YdnJtRmNvWUNNYWtjckhOTE9ydW4wbW1iTE9JRUpBa0VjUEFHQUg1YWJHcEthYkhHelZWTnRldTFJcE1CdEhvYlNjWEQ0Ym5KT2RjZGJmdUhyTWNiRXoxVWdBRVJBSndkbSs4QUNnQVVhbFZybjFwS3R2ZXB1dTNvUlQycDZXbTg0NzZnQzVTQ1FEUDdIdS9waGVZZ0RCa2p3RUFqSUxKUXBRRkpEbHJuU1MrWjRvRWc4eE5uVk5EMk1IekZhVnhCYUs1V2M0dnpLbmFhMUxycmx6S0ZDcFdnQk13bkg3L2JVOFJ0SmxNbjUvLy8wdkJVZEdSaXlMSGxSRWFBcStYWWd0ZWJtZnR2cDRiL2U3eWFrREN3a2pJWlpVMnJjYWFtZGpselZGWlRsSXBJM0VmdXh0U3gwNjlzZTVZUEFHVVJTUlhPTEFWQXJXQkZuWnFnQksrSzZYNzhIQlVNSUZYaFFzV1NuQlU2NFJNb2FaZCtuTHFsVTJPc1dyamFnRXBTWVFUUGJKb3VNNVB4d1FGeG1VVUlEQW9VRFF3c0kxa3dRaStjUC83a0dUU0FCVlhYOUpUTEYxSUlHQUp6d0FBQVJNcGJVdXNKTmJnZ3dCbk5BQUFCTkw1UTdMZVZ0aDlLMktzb2h3ekpoS0t4TlF3TG1KeVBwZWIvemcrUFZOa2ZyRDBzSjhOdGQvczFRK2JERmFtVDliSy9xdlZyTmE0d09pbUlGZ21Ba0l5c3ppRHhtM2FXeDBXaE1KVlB4c1c3cEk4d1lQY1dsSWV0Q3JIN0Rhb3F3WEM1S3M0NkJrUXJRVlk0czJZSHVVb0ZRMUFUZTFkQUFpdTZ2RVA5OXVBQVZTRUJVNGVrUTJHNkRibDJDdS92VzVHenBLc05OQVN6QWRLQm1KM0V3QkZGR1ExUDlycW5tSFZBdzRiYlhlQVZ6NkpNVUN5WEdTSVJYYk15WkJBekZDVEVqbFhOQ29hWDdDMnE5K28xYXdIT3pMcHRib0xsQlVWSXNKd25PUzc3TC9XUHVzYXRmV1ZsK3M1cEhnWjlxL0ZuMW5LZVBqZWxUMFVwNEUzM3FETnJIMXV0SGQ5U3l6V3RKdjJ4ZlVGbHMzV2M1OEsySnZPb0gzZW0vOHdjNDNFbW4zOFRTNDlLVnJTKzlRL1BmL0dveEJ0aUY0cTlqRGhHMHkyNFFBMVZYaUk5K2xZQVNSV2RMSlNLdGNwTFNiRWk0bmRReW1oaEcxbk1MNk1ySFY5ZTlsYWFnQUF5QUtBQVdMQTFBU0FBQUFEamtTTkNxazMvekROWi8vN29HVE5nQVNyVkUvckxFUllKNkFKcndBQUFSUFJWVCsxbDRBZ213QW1mb0FBQkJNNlRBeHlhakdJV01VQVFtVlJpZ0FtVXlVYVNGUmlZZUdIa0lZUkR4Z1lRbUh3T1lBQUJSZlRiQUtBd1FrMTRrUURqREMxOG9ZcGFqQnRHeENnM2lBWVR1eXRKWWpCRVZ3S05Wc1VOTmVIT3FkQWhJV0NFUjR0NUFUV0phTkFYdGtyWlhTQlNSRE52MXJ4Q1EvWjNYcVZhK2Y0WFVyRk1HU1haeGdlLzN6dU9PT09VdHh2NTI1SEhKMnBZdS9yUEQvdzFjMy9kNTRaNTRiM3ZmOHI0WVZPYTdoM3ZOYi8vL1YvZi9qdjhOOXQxeEFBdyswcWxDekE1QkZ6MDJ4Z1FHcnNNQmRySENyRS8xYTMzZnk3ME1VWkFEQ1RycmtMaGtnQUFBQUFBQUFIQW5CUjc1S0tYdnplVCsrcHZ6SWUvNHRFMnFKOEFRRVJFRUFnQUNFbkl5ODFTR0RHYVFSRXhnUWdJZ3d4VGVOR1VqS1Vzem8vR2pKc0psWk9ZZ0hCWXdVREM0bUdBaGhnb1lLQ3I5QnpjK0lLQkRBZ1FvQ0RGaFZHUXo1TFZuR0FOZmJPakxCWUFBWm5LUVlQR0FKSkNvcUNDZENjWU1McG5tQWdJUVBtSGc1a0lJRmpkTFFlRHk3akJnS0RLQ3Q4K3RvS2dZTkZCb1hmaFdKa3FLalFHbUJ3STF4dlpsb3JkWUhsa3V1R0JBRXFkaGFoYkJXdFo4M0RnaEFXMmFZOXNTbjdrQ3JQWlZPMXJFd3JjNkw5emNEd1c5OVBMcVdjWnM5c2VoTDdTOWR6S2JENnhDTFFBOGxMZmQrbnBic3FoY3VtOEpXNUVnamwrSFdrUXhUUHhaemh1dmF3cGYvN3NHVC9BQWRJVE1udWMwQUFKRUJwVGNHQUFHUUZrMEc1dlpCQWtBQW5Qd0FBQWJtR3BqR3p5M2h1dHZERG40eS9QOS96bGpIS3hleHlwZVgrZnovL3RuTzUrWDYrN2lXVGVMSk8vLy8vZUZSbFltQ0lxeENNeHNnaTJtQUFBQUFBQUZxTEJyejdCaXU4TGViWHI3ZDc0ZVZjYWQvUnRRQTk2aUFBSkU1ZjVubXBxWmZqVVRvSk1FQWlLcGt5R0ZEU0lUUE5XemUxZHQxOXFpNjE0RkFXbHdlN3NPdGJkd09Zb1BFSXd3ZTQ4VGh2MHpWRUZ0MDlKZERUL3Jrbm9XN1Q4MCtmTjFOL3ZmT2F5N3pLVmN4N2xLWnkxam5sVFdybU8vNXZ2Lyt2NVZ5dll5OTRwZmgrSGU1YjVoamIvRHZiV3JWZUIzK3d5c1g5NTI4TWVYYmVIL3JEZlA3bGhZc2J5NS83Ly8xMzg4Y2Njcm1OREs3Vm1OM0tlY3IwKzlieXVYdVlmcm0rYS9XKzRjbXNLdUhmM24vTjFNeEFWZUtkaUt5LytnQStTTU1JdUlJYXg3dEI5T3NkS2ZHMTdITDJYdXAzci82UUFDaURNUUFBU2tPZUhqV0RMaGg4UVlXSG9tZVltNG9lRnh4R1VvUERibXFvUkJsYk01SkFiNHhFWUFjUkFZdXhSbFlpQ0pKRXlBUnArT0tIdGRaUStjSEpnTHFSUEJDWWRHbEcxbEw4c0J3OUc0WlQ0cVg4TkkycjFYemZId1BsVW9pam1FejJGVTZMKy8vcDVQRWNRWUk2Ri9VZjl0UTZuaWJRRXZDTEVKTkhUVW9RbjM5UHQxTzZaYjJ0L3Y0WWhWblNRT29VUkFDTVFiMklFYzZjUHZvbEVremNPMG9TMjJ4aWtWU0ptYnQ0dW4zRDlFQUFvZG5ZUkFQdEFBUWswZUhzSlI3RnMyQnYxdnQ5Ym45Zlg5M0xxZ0FOdFVBQVBrWS9CaGtwREo2YVFydW1hUE9zOEdpRzVyalREQnhNRk82Z1ZHRjBQQjF6S0dRcWpjVkZ0bjBvTDlaaGp3akNaeXR4Vzk4clRHSkt4SktzeFFGTktCWE0vL3VRWlAwQUJlNW9VZTlqQUFnaHdCbmY0QUFCRnJtalJleVplbUJ6Z0NhOEFBQUVtVjB6UjIydXo4ZXBjUE9na1J4WUVpVkdzbkR4dXB5cUZBNHpiK2I0cmlUNUFGZzVWR3NkaER2NWh2L1NKMDF2MnkwRXNCQWJTUWJqd21jSFlid3UycVFmL2ZQODlkUC8vNWp1V1pVckRoM0xEQWdEVXVtMmJlVGlMMXByaXJoMncxT1U4SU04QVFGNGQ0SVVwL1FBRk5hNXl6Q3NiVGp2TFpyOWpFdDAyUlQ2Z0FEYTBVZ0FBWG91ZDFBUmtSM0I1QUhRb0VGVGlUd2xqU0FhTk90VXpJbnhWTzRqVmhqaDhFMlFZMEMxMFJVUThXVVE4aHdDR0NNZ2FwREp5UEJ2QU9ZUWc1WXM4T01CdVlHQUFEeGhpY1hDRGhCZmNZQXdSelJ4a214NUl1SDNRWXcydGwxSkl6Uk5tTlZtWkdIREptMUtmU1V4ZU1Cc2xRWllQWExqcVVrNi9VeDVOUG9reVZ5SkZ3dWtxYnJUUEduWjFLK3BWbFBXaWg2R2ZTUlBzdEU1Tmk2V2pGaWRZMk5uWmJ1dGwzODZwcWtqeG5hSFhmTUFCR3VKZ3hJZjlnQVdTY1RjZUNpekFjSmxVMUwrOUwvVzAxNk9TLzFQK0swQUFBQzNRUU1BRUFLZ2ZlT3lRbEFBd1U4TXRYZ0p2bi9UbzZvR2RUaG5JcVRBLy91UVpPSUFCV2hqVWVzbVhwb2JRQW5QQUFBQkZ4bVBSL1dKZ0NpQ2dDYytnQUFFcHRKTXZjMTBUQndZWWN1bStyQnJTMmFJNWdKTVE0bUFJQ0lhMndqT21IRG1FaFFRRkR3RHZtY0pHaXpua3NHUktETUk3VUVNVmdaV1pkSWFNUVRhaDBPRmRCaVpJRzhtSWRDS2dZUU1lWXNjd1lJUWFyZUJwY0FDV3RaOE00S0pCcXo1SHR0NE92d1BEcm90MWZHUzFhYkZzam9RMU96ak01Qnlnc01yWHlNRHE5Sk5VYmhGd0N6VUh5K09VelNXNXNyWUxGczYwMUthRjhteExXbDBweXBYVmtFTGU0V0J3M2J1MGJqV0ljbE16di8vUHY0Ly8zK2EvdHpmUCt0bUpHQVF5eVo5S1ZHYnVrai8vLy8vK3NBSVNOcWxIWURRamJQQUFBQUFBQUFoR2lKM2M1aElLZmVlZlU0cG16SHlsSmpFVkk2d0JaL0VBQUwycGY0cW0rbyt5SXIwR1FjVWFTQmZwWVVRQmlFSk1GRmRjalVYYnZFa1B4V0dtTFFIN0NUaHE4T05ERVFGUkJlNEJsWU54aDdnWFVoQ1ViWmdJZ1JjTjdHYURZQUxsRGl5RGhiK0dvaVNqRUgyUVlaeFNMRk5CRzZxQ2FtV3pKb0txWmFKT2ptSHl2OVRKcEYrNU5rSU9BK1M0bVJKbFoxNzltV21pVVQ1VzB6TS8vdWdaTStBQjVKTFRYNXZRQUFsUXZuL3dJeUFGb2x6UjcyWmdDaDBnR2MvZ0FBRThYUnkwaUlHU0JtYnRzdW4xTzl6SXlXaXBFOTFLZGJUNkNkQlRvSk9heTg5dTZLNXhiL29veWhjOWR1UUFCWGgzWkFRWDJBQWFOaGtheFRySkUvU2ZYMFJmNjFkMWt2UitoUUFDdU1nQUJjaFcrS0tuM0l4b0VqQ01pSkZ5c0NTZ1lmTDZKMk44dnhSUnFMUUc3VDc5d1hUT3UvTEtnaGFJZ1VCSUFpSVFaOGtEcUsrbzJBQUNRYTkzK1hpSXdTSnBnRmlVYXpVNTBFUUtHd1JDMmVTTmFNanA4VEV0ZnJaQzF6UkN4bzV6SEFDcURrRExTWDdycUswUjRrdVFSNURXRndEbEhaeGRQVFV2c1NacWdneTZWc3JubG1wem4vT2JDbC9mNVc2UnVGMVZaRHh3dU9DdE0yUkt3M0ZwMDJQRHdJR0htRFQvVWYzSkFBR0ZkMkFBRnZnQUdEQ2FGSnVZdmRTNzJTSC9TTkpGV1UzK2xhUUFOODJBQUwwYmZlSUQwUHhzUWRqSlNScGRwaFlMZWdJVkZoMDVHSGwxM0FlVnJjTU51OEZ0dzB1bzR2cFMxRlJadzhjSFZncFJIMVZWTzJLUzV1emZwOU1ZZjBpUlVWanBOZzYxZzZXRnZOeUU1VVRyUDlmRzN0TjV4bjVrekEveHJSTVRqVVgveE03alVGaEtxS0g0QVUyeUJ6L3hVL01CRFE2UkQydUJTYkQwY01iVnc4SDg4UkNGa1NINXhsQzlvL3o4aklxbGVQNDUyR1NYMzdjUlY3dFp0MVo1Zm9BRGIvc0VQMW8wbXVGcUhqcjJUYmw5RlBqUDMvdko3MkxJQWRzUUFBbmJ2K2dxb1ZtRHFtbC8vdWdaTTRBRlg1VjBHdE5Ucmdjd0JtdkFBQUJGUEZqUjZ5OUdLaGtBR2IwQUFBRWd5RVMwaFlDQVBNN1FrRUJrVHh3bU9ZTE1aak9XRXVRcG81Z2ZxQk9zdWc2RFhJUU9VUUZYSWFvMEV1cGpTQm1seVJCekU5TjllWVhtbnJsTCtHaG4vVzFmRDdVTy9hUllGUWgvLzlyTG1CMnh0alJZT2ppdzdFQThkY1YwWjZBMktOczliTW9pTElPTXVOekZsOUdNUU93VzJXYU5HQzY3L3h5UUxqanBVaDZPb05HRnJZMjZLVk1qbU1XUUJOL1UycjlvQUZFanp6aUdKRnBrV2RNalhkdGEvTmFWYUtxWkZ5V0N1NVRWSUFPc2dBQVROdmR0ajFVUVpUdkYyRnlBcTRhQ0NWMnd1QkQ4Uytrb2VKMjMwY3BScjRwUVI4MElEUVp4a0VGQUhnaHhyRmlUNlRkSWcvZzZBR2t4Qm9Mc2VzNXJJbHZleU1FZHpqaDBiZTlHMWpxM09vL2ZucVpBZUN2di9qTzJORkdQR1NhSVVraUtlRDRyODJjSGpYYk5NTVJOeWZib2VObTd2UmJIL0JvNEZvdWtIM2Q0OXVLNXE1Z2pEdUVtK25jYTR3Z0x5ai9hbDlOOG5FYStrQWlqUENJZGYvMkFBVFFwYWszVnBQNVFPdnpHOXBOa1YreDJoWDMrTmRiVEJsTkpKa2lJQUFYam03WGhkeGdnSk9Ha2dVZ3hoQzAxbVphcXNOR0lnUzFnRHFzK3d0TlRjMTRIM2NWMW4wMnd0dWpEbGpoVVYraWNScGM5eDQwbG5paDVwME96NWFFeDZqbXVMbjVFVVVUSFA4eDROQmVkN2VJcUJZSEEvbTY2dlp3ZkZCd29Md05hZzljZGxPYmV4QWxCNFVsSlROTy8vdVFaUHFBQk45VjBtc1BRdmdpQUFtOUFBQUJFK0ZsUjZ3OUMraUxBR2Q4QUFBRVJoUFI3MjdYRGJYd0xZL2hsZ1BqUHA5VmNjNXhuL1hkanVMamlybFk2NGYvdWNhNTZCOENKc0pRbTF0aGMrd0FDU0lDWWVTNnhLa1BXd1c2dXo3cTMzTnZSRmJLRzBxQVFjaEFBQmV5ZThwQ0dBM0FPdVlUZ1FhYVJsS3pjYU9sb2hHaGZGR3dQQXV4dkxhbTczTERQY3J4MEl2Y25sMkJRZ1FwTlJpRUlhYktNSDBaa2pZbG8xRlNNWWgwdENTdVRWaVVyWThIb21IcUh6dS9sSitHay90T25kVHIxMGFoM08yRmFoc2h5b2pWc3UydERidjUvZTlRZ01zc09MK2ZZeU9YUEtwMEt6NzRLM0JMSUVDd0drT29zLzJWUGNncTYvenQ3bDdWWHRYYmxIeW5zOVdyejlKM1ZXb1FxU0ZFSXIvckZIL3ZBQU1XZFBtamNvNTU1MlJNSTZKODh6M0sxK1AzTFNoQzdiZjZsU0FGVWdRQUg2NXUwZzFoQUpHR3JCRXhSZ29NdWlnWEtKQ3RNWGV1Q0NXcXJ3dHJKUTFZakJVZHBLc0VVMG1pTHhJSVZJdDFaRmhGcGREMGVhVkRiVjdGdVhFbFR2WnpXcW9DeVFvaTFWNi81YW4vTlo2Y3BQb2dkUGtmUWZrdTBaT1J5T0lXNHByMVJPdHAvL3VRWlBrQUJPeGdVZXNNUmdnZXdBbTlBQUFCRlFtSlJhd3hPT0NIQUdjMEFBQUVVMmpzQXZBaW1pUWc2ZDZtem1RcDMrNHVaY1ZEOGl4SUhRZ2hvWHBiK0tXcVdabVd5bXVudWJuNTVpcm1STXBrMStpK3NFUzA0UVJRbTFWVG4vMUFBUFhDd1ZXNFdXN1pXNW14OGs3ZmMxblVHRUJISDlia1B0ZFhrMU1RbVJnZ2dQeVQ4YUNmQUNKaFVZbTZjaERCaXl4WFJkNmNnZ0F3cFRPSnFkTGFaL1RpeElhZWQyODMwa1UzTXFQdUdnbllnK0R4VmFhV3hHZ3AybVJ5WnltaVhkamJhWjVTUWVIUUpRenVIcW1jbnZ2YStlcUF5UUo1SE45M1kyWEhGcStiVlhkNTcrTk1GeGttSjFEOFdYUGx2enZtT28xRkFka2ZtRk9Id053RmdqRTU3ZDhUa3ZIS1VZemxraXFRVWtmcCszaVFGd2dxdjNkL0JROW9JMzlCS0ZRMjV5cy94Z1VLQ0p5bHhWRnBuQ3lrN3EzZ09FR0NFWVdwdnRUc3AwVkNpa1VvQUFDMGErZGt4VFFBMGx1QlVnNVllWEJ4Z1BKVXdnQkdaOUVtbktwMHhtcVJNUUJPVmFoYjB4cUd1dDNZQ2w2bHdFRHRNVEdqamRxdE0wRkRSaDZ0MlZ1T0puV1JvV3ZsOHNRMkpvOERtSlUxbVpvL24wNzhyOWJXLy91UVpQUUFGUlJqVWVzTVJqZ2tJQm05QUFBQkZIbVBSNndsR1NpRUFDYjBBQUFFVGdXUEhoazM2UkxBQmhBZGpiclg1UXVFY1NOQmdOd0ZDUndTQ3dpWFMrbHo2N1ZISm84Mml4Q29XRWNEd2s0TVd6SldYTUxMTVJoWkJnbE5KRkM0K2VyNWpSb0VtMHR4SGJZOFpZMllPa2FReEl3WlVPRmIyMWdBTHNJbW5LVENpcXh5eEtaNk5VaDNNOVRpOFBmNzg0dnFCSEFCckw5YWVBREZqaFNGQXN3UmdBaU5Gamdxc2FoeENDU2h3STlHS2l5K2tLblVidThiK08xVE5rcFpWZUx4Q1NLMEhtYVU0Q25wMm1WUVNzWFJCa0JRNVNTWEtHSTdTQURCNUxzUVpZUGoxNHJ1NDErci9aN0pENnZOczltbVdpbm04eEhHM0hNKzBpT2NISVVEZDgwakdkakUrT1ArTGNjS0M0Zmtod2NGQUNCZGFSMGQxY1lPbnhRcGpSd2hDaE1OMTEvLytvOUdNRlFyV1pHb012U1BLTzd3QUE0MFZYRjZpT3hsRENqcnV2MUk0SFNOUXB6ZlJVU0RhUUFBSHROOFhtTVp5YzFDYTJ0WVhDQThsbjFudFBBcFVVQWNsSW1iZDFrMHJSc2hmWU5xZGxFdW9HMUtoMU9GUXZwQmR1Y3BzRllpQUNUaVU0V0VKbFZZNm80bXFLNE10RUU4Mm9xdS8vdVFaT3lFQldaazBGTXNSaW9oUUFtL0FBQUJFODExUVV5dEdPQnhBR2EwQUFBRThJM2tmUC9yRmhNYmZtWjJwS3NBMmtrbkhLcmN2eXAvdFdtM2NOTklueVZrWVJtbVA1YlAxVXR0RFNSOExJa1JLVEJZUEJPR3hSb2VMUmtsKzVpbGxhb2h6a05SV091VytiRGIyQ3psSklUYk9tWDYyQUI3ejZBK2xEa3F0MW83MHV6VWNwMysxaWRscTN6UGRWMGtBQ0VBQUFMMXZSc0FhUVBZanNVV1JpQVZ6c0E2aWN3djJBbkpsUmhlTVpYd3RvRU1YVXVWbi95cWhnK2RhMDJBWFNnRWk3ZDI4VlpHcThBdlVvc2hURHJueGZnQmlFYzFFUUdHYXM2czB2ZS8vM3lpalM3RjVDTDJ6cGdlOVZjYWdqVkVKNnNsVzdsZjVMWVozSUhqNk5ib2lId1VPYkZ4eVU4bGQ3LzUzOVhMMEtxQWtMR0Nvc0xwQ0QzOXlpMVdpVFpmTEJKSFpCbXJlVFpYV1FRSkljSXBZd0FHWVRNd290UXBubjNUR2E0WjhWcnV1M0MxU21TanFRUUF0L2QrN0lHa3FjVWNXV1FRZ25nTWdVTzZQRUN4aEVOQ0F2Vy9Mek14VndIRHVPZThNdXBhQ0p1MnlCbE1RbjhOUmlYWTE1Yk1yUWk4MVh2UHd2ZHlKWHlmMUk2VE16SU5BM0lCRTBlNmk2VnovL3VRWk9hQUJQRlUwT3NKUmVnZ1FBbXRBQUFCRTZsVFBhd2xHV0JyQUdYMEVBQUVsT3ZleUx2ZWVQUC9oeXhpWWw3SzQ0Ky9XTDFuU1luaDVOQURWeTAwSkp4NFJBS0Zqd2x6WVNiK2ZuYVVFRmc5T0ZnYWlmdEhTYTRSaUhRc0l4UjBZYmFlL1VmeHZNMTNWcktkc01sbG9rcWdSTzFObmx0b0FEeEVMRVNpd0dscjE0c2RORkI4cG1XV1kvcUZ2dmtGTlB4OVNDMEtBQUcvbTlDalF0ODJzRVVCSGtJUUhVSm1wNG9RSzVLd3BzSUNWanB3Z28reDhFblJhdVlGRythbVloTHdhNHhrT1JzZkNWalEwMlNJNFJxcjc5d2ZJUWpGYkxwc1VVdkZ5QWtEYkZOa25KQjRxMWt1cTgyNWtLS1N4dDRzZ0F3dVQxM1g4NkhVeVlpV1dLeUhMd2tob0l3bG9Pa0hMTTMydmRWZHNZRU1DUExWYk1RdFZjamFuT2M1WWhEM1V2SjlaL0YybjY2WWlIcExYVkkyQUFQQ2pURGcydU5JN0ZwRHQ3S05qWnBPV0p0em5xL3JZSTJqQkFBMzdtaktqR1lEWVpvRG1BNFl3RU9JdllZYXRJeHBTYmR0U3VPTEhkUUZrSVVaYnV5RndXZGdNSVNJNzAxRW5lc0t3M01iYW1oQ1RLYkk4a3l0a1lwY1I1RTNzUnhaaE1PaENGdXNXTGt0Ly91UVpPbUFCVEppMFdzTFJyZ2hZQm1kQUFBQkV4MVhRYXc5RGFCNkFDWDBBQUFFdG5kME1LVXVaWEtrVUI4U2lES2NSRGZDaVBYZWhnd2s0U3lNRDFyRG91TEVXK3F2bCtvOVhvcG1tYTY2Y2g1aUZTb0dVbDBRTkd3RmtYN21xbHRGNjcwbUJFb05LS2tka1lBQWNRTHViSGhFRW1TVVVxUTZoOXpzbW4yTnZRcWgydDlUQVNrSUlBSCtsdEVJQXI4S21EbUZFekZZeGxFdGhRYWxZMDRxaFRXWm1zSTB0UnA1QTJ6c0ZRZ3hTRkhLeEkwRkloSkR6MVhEQ3JrcGVPM2tvUnBPMk4yOGp0YmZGUmtzQ0MzS3g0WnFtVXNiYzdIalc0MThZaWF6TFdXOGZjUExkWDF4VFc0Q2xwSGp5VnhmL1dlMVl6OFo4T2w1bnVtTjNhSGgwMzJ2bk9iVzk3Mjk5N3ZhVEcvVys5ZjIzdW4veDhidHI2OW9UNkVPUzF6WHVjbGcxMXlickJka08zVjF5VzJBQUNwQWNrWGVYT0VHdWRLVmEySCs1MmpSU1pldXFLRDhmUWdBQ1VBUkVGQWpkWEVrZ0FBREtHUTBKek16Q0ROMVloRHdFMEF0U0pCWTlzeU1GQ0RUeHBTWUVHQWdHRlJBeXMwTFVFQ0tZWUVad0ljNmFrZWIwNEpIakNCRGVveVp1RnZSMld4aEJaQ21Oc1BWUlg0ai8vdVFaT2lBQkt0VXoyc1BROWdoUUJsL0FBQUJGSTFUUDdXSGdDQitnQ1kyZ0FBRStFUHdjWEFBMHhERTN3UUlEbHdrRFRGRmI0S0VLWUxoZCsrWXN3SEJoNDh6cXV3T3ltKzl0NktTdTdVc1hvQmtsdC9kVkkxU1VtZXJuNGFyWVpZMSthZ0NtL0hlZU91NGYvL054dTNkNyt1Y3hsc3pabzdYNzNxeFBhcU5wLzZIMmJkZlYvKy8vLy8vMW16Q0JzeXViS3pNMGZnQUFBQUFBQUVRb01lOTlvVk1BMSthNTJ0YmZNMnpnWi9ySVl0RXdvaURTbSsvNGlDRlpsVmgzT1BHUjVBVEJlWnFTTERTNVFhZDFjNDZCbGprbzhhRjBkTnFJMjhWa2MvRUpjSGtad2tmckxWQlhURTRxcVYxZk1hQzR2dFBYUE1SVWFoc2IvY1NsOS94S1VwU3ljWk5YaHY5K1BlOS91UjVBY01iM3IvN3hqMHQ4NTlKTnpSbUhFRnRqdjN5WE9oazc5L0V5ejNwOFUxQWhlU0JFbVkzK1o0OU5YZ1ZtbnBqLzUzNy9PS1Z6RCtkL0h4WGM5WnJXZWEzUlNRZ2FyQ2txYTJ5QUFDd2ZRUFF3Wll6T0NHTDNDOUtKVkRhOWhPclNUdHphTlJBT2FNQUFCL3UydDBEY2hRSUpuUkZSUWpPWGRLS0t4cGRscVV4WWd6aDltVk5Tb1dWdXJBc20ySkovL3VRWk9tQUJmOCt5KzV2UUFBalFBblB3QUFBVkdscFIvMkhnQ0NHQUdYL2dBQUVQWDVMVWE0UklFQy8xamQwT1hXNDMxbUZpUnM2aG02R25TclhTbU9aenJSOUdoTTdMaUVmSUxJTUlES1ExT21pdkZ1UTU3RWhQcktZM2tlTGpCV0s0YlB1dTVNNzA5UGZla05hV1dVNmdnQVdFTW1qeVRTOGFCS1hENi96V3N6WnFDNVZMSk9NWFQ2a3VscjlhL0s3dVo5K2dqbldlc3RtMDh3QzBvWVV3ZzZWZ1UvNVdlY0lEbnYzbXRrYkFBMW9xZ28xUXRKRExDcUNibE1VbHBGa3I3OHBXaDErbitQYmJkcUFST0hNZ0lHcHZwTlpNWXpHdUpjc3JLUUFGeHhVRXJXY1hBUTVQTW1NMUtVTmFUbFBVekNIbHVHV1dCSEdpaFpibnIyRzBIVmxOTWNiYVVIRU53NnlsMUsvUlRIMUV5UFVOaXp0eSs4ZlBmTlRHODE4U0pGWVc1cFBXZC8yYVBJcVRMYW9EMHFQcGFldHFnVm1rcFJvODg0UkJZUEJJRlJjUUVBRUJwM0RiUDl4S05NZTkxVnFMRWpKTWdwM2lPYW9mRFhMeEM3VktsR2hJMnBhRlFvaFM5QklpQW4vSTQ1TFhFQUFxa2l1ODgwNmtWcFpmVEthaFpkN0wxYy82bXRNUHovUm9vVW1BQktIZHlFVTUvM2JaOFRpLy91Z1pOUUFCWXBZeitzUFpIb2tBQmw5QUFBQkZHMWpQK3c5RCtDTWdHVzBBQUFFQURqWGxwQ0ZJT282SWdnRmdwdW9hRjFvc21XelJRTjk2VnVqN3YyR0REaXdRRFlFeHNYa3pibEZoV0dCV29xaWlxSHlGSnRCRk9LS3dXaWhIWW9uVkU5T1RjWXJKekJwMVFrVVZmV09VUlRiV1hXM2Y0Mzg4UHZ2NnBoWkprYmg2VVhCS0U0MEI0SkJ3N1MwT2lKY2VVYWdhcnhDTXRPRy9jclUrYnZxRXVKbjFVblZwUGpJSkpFNThsZlpJR0FFMFo0WjNlNjV3QUJDVm5FQnBMbEtrdDFqY3VHN3ZkaUIvMDZzYUFLczFEQ1lOVDd1V3NtQTdoQzVEWVF2QXdUNGRwcE5kSkpLVXR5QUF1VkJFVTJ6QTZOZ2dDVkFhY0VoSW14UFNkVmVTY3FJZ25XcU45azZKNGxVRXZUaTdGMDR3YlI1TjlLK2M2Z3E5QS9OYXl6ckZ6U0VrRklzYWJJcjVYOWF0RXBhS1ZZZzZCNmJqSE9CaUIzdkRjWGYxSzIvZVV5YVQ5Y1YyTVpqcVdoeTFTeFJ2d3pENHcvK1RIUStmSkwrYlFBaXd6TWlOWlpLQUFPZ3FBbk9XdWk5QXUwZnpXbCtOcXE4Q2t2UzhrUWJUUU5HV0hRa0sxNzYyMTd3TVVLUmJFZ2FGU0U0UVVST1FlT1pTbDIyZEFJQ1hyZ21CL281YU90UHpOYTRRdU13djJtSWNpekRoS3BtZ0tjY1IzSWhuckkxU01EMWR1Mzdmdk82djRiZXEzTE9NUXJqemFsSzBhQXl5V1ZFSjJGbjNXa3VUSnBibW5wdlo2Mzg1aDgzYWFLVkRtTm9KQUpHS1Myc3p0RmREKy91Wjd6Ky83d3ZkZDIzLy91QVpQa0FCTlpUei9zSlhIZ2M0QW1mQUFBQkVoRm5QZXdsRCtpQ0FHVzhBQUFFNWxTMVUyR01ac0dSSnAxRm5TNkhIT3cvZVllYm1sdXNqYkFBUTRBT1c4QVVsbW1yQ0o4RXhHcktHbUN2czlXcmZqR3FNMEp1WFdHQmt5eVNSQkVFdUVRUkZGbGd5b3lpVXFMOURBRXJ6T0FCYVY2WFZZSzJGcE9MbXo3cFJXckozNE1ERjZ6dytHbHg0Tmxza0VteFhhK3ZYVmppbFpjZ2FXaDY2aW9WMXFwZERyS1U1ZnBCWmpEN205dzZ5OVZyc1pXVk95eTZzWWZidTZRRDJLeVBPcnYxckU2eEEvN2F0a1FIYW1nUW1GN2tXSWdoTlk2aVhOT2xZejJ2ME1ZWnRzbUZEVFk4eVZGUDZiTnNVb3lyY2xUWHBCVVRjampqYmFBQ1ZxRkZwQXR6QTZ6dGRTMzIyWFBkMy9zK2p0K2xMZjltSkJKY2RiWWxCQzFpUWFTR3l5NFNFV29yaFFCTkZNeFlGSUNIMlJ0RFpkQUwvdnBCODlLcmNjQ3JROGpaSlpiVnlURHJJc25QRTltSVJaWkVpdENpYWd5TW9RT0pvK1ZaZE4weks4eTZXcXRkdjJVNzNyUC8rNUJrNlFBRTRWWFBldzh6ZWlHQUNWMEFBQUVUeFlVM3JEQno0SFFBSkxRQUFBQmxUMHRXR3lhYktTcGxkaFBHVlcvTGtCcGFFY0tNWEQ0T2JUQnVXc1pxU05iZmFhSHl0SEJIZ2JhUklzSkUxSWNoNXNmb3NoUlliY3RyZTcxQUhPRGhkd3FSV0o2cGdzVGI3ZmFTZTJkSEs3dTZsbjJmZG9WSmVGVmxJQ25KR2tUWVRKeWpsUkd6QXNLTGVoQ2hjVXh5a0VRa016c21CTFd5Q0p0ckFRTlN5R29MRldpa2tsRThlamhkdXk1VjB2Z3hUbFZYQ3R6TmVvb1RyenAya3pTeUlwMzZEL2M1NW15cmhraW0zRXJ0S3pQaitzZyt5cWNVOGJjWjJabUpPYzZLOFF6MDFheVF1RHNZTzVYMHlvZXJKTWlGejBKMjB5Qy83dCt1Zi8vLzc1LzIyRTIzRlczNVVCbDF2SXFzdEVJYzNLcDdVMEZ6VEtkckcrcTNWMUxBYW5yUDh5aHQzeXdJb3VOcEpBYnRyd1VETW9OUmNoSUtVd2dBdThJZ2s1Vi9xaUloSWNhYzVEd0NCb1lOTENNaE9BSWNQa2FFVU5SVWJvNmhRSHRqNlZNRHloSVFIMEN6MDVXUWpDRTFGclBqK2xCaWRvbFlkTXQxUWtCaVNFUVlkcXFpN3BUb000cFlnazZzSVVrUXpJdENpTWNQbDN3VlVQYXAyU0QvKzVCazZ3QUVmVkhOYXdrYytCL2dHU3dFQUFFUmhQMHg3TERQcUltQVpMQVFBQVRyWE5EM2JNT0lENnVzZDNjaEY3dFcrMldzdjZHN0hJMjJtM0VBRDdVaFpMa0VzNUYwSDZ0Rnd3NGxpUit0N3E1Mjl5OStFN3RxZGNLMWpvQVNValRST1VzMTF3b3dzQVh1SURCME1aQWJtWEdVa2hrWDJVQmRCZDcwSnBob0JqQVZDYm1DVUxxdmd3Q2xpY2FiVUN5RWVqTmROOGlKRVVFMEVBNWZTUFFFZzBrclBJa1M1U2xVT1dUdzg5TFJPM3VvS01uYnhLSzJ6RzFtMk1lR2JNbnN5WnRYR3VQeUpobmMzNDB0TjdHZVpZNW8rdC9rVFhmVy9PRHl6VDFGcGhSY1V5RTR4R283VjEydHJmVWFmMy9WMEFJRERKV05jV1dRT3VUYzZkc2I0dmZ0T0dUcy9ZOHVqYXQ3YWtyZTVGamwvLy8vLy8xS0JkMWpJWDMveUdGQWxDVXBxV1lGdHlNSmdkUUFrQkttT3Rxa29qUXZpRXMwY0VmZ1l0blIwWUhTVWFEaUZrZ0hKbW1MTXEyMEllQ2M4cWpYZTFhZmRxYlZYMkxXSDNMam1uTlJ1cUQwZ2duRmhUSXdnenRIRkN4Wm5SQUQyblRNalVRQ05qamd3UnFyREc1UVFJV0Uxek5HdXl0UkowTzhGbWpXSDJod0doTENDeE9MTk5yLys0Qmsrb0FFWTFiTDZ5a2I2aVBBQ1IwQUFBQVNnVWtscktUUFFLa0FZK1FRQUFDeTQ1QmxhaDNQTitVM0svUGkyVytXNk9Sc2dCcElyU0ZHQkZjaVFIMGlOZGxLYWhjYXRkRnN6VElOVE0ydlZ2bVg4WUJNend6RVpKUnRvRURVQjRSdVV3c1JoUW5BQnJPbDdtQ0NGeGpLTUVaMnNWWVZ1VWFnT0Q2S1pwSEdsVmNQaU1aSEVEWmFpWlpDc0tVSzdNemtCU3dSa2FFbElkdisxSVVQZEVzeWdnV1RwcHAxVDlta2VvMUVwK1ppT3R5bE9FWVR4V1ZKb1RUYTduclRYWC90U1UrcXhMbVQzOUdtWlRaVk5XNlZxOUJISTVZSlpUckJBWUlOYk5FajR2SXJXNFhZZFBOWC8vWFRoRmNKQUFWSWtoTGtMeXdHSFRaNTZROWEzbEtmczJ1Y1pKTVIvMTVkM1ovWCszZTdkLy8rbi91MTFTSlA2MURFM0kyeWNqTTRCVWk0Qlpnd1RCeW1DbGhSYndCRlJ5UTZMVGZNMUJ3NElKeEVGaCtHU2c0UFZMcTUwWEZ5RlJBZkxvMzRvRDF4NTkyeGhGemRLcDFHVWE4aDdGT1pKcGNxRWhTc1pVc0RVZi83a0dUbmdBU1RTRWxqREJ2Z0pnQVpUUVFBQVJMWlV5bnNKSFBnckFBalpBQUFBR3RTUTZKb2taTk5Xd25NcmxYR1poSTFoenhDbmNISUtSS3d4eTdEM0dWOHRsY3hGL1NGSXlYVGxWVFVtNWd3SXFBWi8wbkhEeGF0QkFWZmNSZnhsOUlZOWxGbGtzTFFBYVpZSWdVb3ZPREtsT0ZlbFpGRFI1aFN6eVcrN3hnams3VWtpQVpTaHVweGtwNlZ0RXpWVWdrb0I2QnVRZThJbUJFbERRaWdWQ29PRHBNbVVXU2JmTmFqY1lMbll2aytJNG1jZUhGY1VYRW80dWNOSUppYzJ1K01hYlJsU2Z1eGx6TzBvMmZYMStwV2dHZHBnUTZDQkxqUFdFTExrTFMyd3c1S0JxU0h4TXFaZzJIcXFqcDA4c1dKVkVEN2pHeDRnb1daZUxRTWNDcGxzSnRITVRMUlJZKzU1SE9Sc2pSWFMzSWhaaUtZbWtpZ2tySWdEdU1QTU9tbUsxM2g1UkRZcGkxTGxvMXZMdnVwbk45ZjdseWJhK3F2L3EwLzdIdjJPLy8vdC9RcERldVdoYWFqYlRRazhFb2E0YVhoaEcvWnVNRlhXSVRnMHk4NG9VRGN0ZGphSmR0MHBuSnhRdHdFUTJUamNqa2w0bjNxaUVUZ2JSRGlwdGx0NUU1V1drODIzcms2RjZpY25JelZkeURFbDFLZEtiL2VwYXRpMC8vN2tHVG9nQVNmVWtsckRFTmdLS0FaVFFRQUFSR0JFU0dNSkhGQXdRQ2pjQ0FBQUUycWxDN2JUMFdFMk5sZkdaaEx5T1BUR3ZGellwR0h5bldNdHlMdXo0a0VEbStGS3BRVjFHcWtrL2p0NUd4dXV6cXFYWXZsN1Zzd1MvZDlPemVwcnRWVFNBYWE5eWk5NkVMVXkwYUp2RCs4NzgycSs0amF1S3V5UjgzYTlRZ1YyLy8vLy8vLy8vMWRhQWpRNUlpRS95Z0RUZ2VJT2hRRVk0RGNRQU1XUkJ5UVZHUUdweldrdXJiR0pDNzd3UlJ1OEhoYmtLQUpRa3VzMmhPcnZSRncyZlRjWFhvUHRzbnBpU0xaQWpXYmluclpHMmFXUXpVRGpoSURRR0tDV0NBQUlpVUxob2RsYlBqRVEzelpXY0VMZFZVY3BkelpJL1d5aDlkT1dHOWJmZlJqbm5NT2t6RDdubklQa3p5andGUUYxS2ZORWhQYjMxMldheENpazAwMG8wZ0FpeHg1dzJwaGM2dU5YUFZVc1lNWHI0akVpQ1MzeWo0cnQyMG52cmN4YW9MZm5Jak5WTUJoQ2JRWGNvMEtaUXlIQWxKUzlJSEtVSGhxSm8xd0tFd0lFZ0Rwc2pIVmFZWE8xVEdQcVc3b01iOVRmWEw4ZFdueXdjM2hjVVVhck5ZUFR2d3QzcHRuTWJNNmFOTlNyc0tDU0M2WkdqcXBoRTVNSE1YQkN2LzdrR1RxZ0FTcFo4bHJDUnh3SzBBSTZRQUFBQklWVVNmTXBIRmdtWUJrTkJBQUFOWXNiWlNQeVI1R3ZhSzRoTms1Z2pNSSt5S3BvM0tZT0xtQm4rVTF2YnQvM2hPZkV6R2xyTC80L3JsVzRGcHUvZWhjWk1IZGhidFczR3lBSG5paHR0MWFBcTRQdDFQVGI5U1FJeGswMUxFL1pjTXJpdlNpTkljMVVqdFgveU1XQ2pnT0ZCT29DSEtNUU9VNUtSRGtreEgwWXE3eXRsMHU5elcrakVuM3Q0VWdxcjdTOWl6K2hXS3NxaXhLc2F4b3RyTEdpWnN3WmxLYlRyZWg4RXNWdU9Ra3RwZWJFMjV1Z0NFNit1VWdwRUV5bXlpVGNTVVpKZmR3eU4wV0pGQWdCRGZJQTNJd1JNWThFbVcwUUJPbFVpUFNPMkhDSEdLRFJBUklLSUtnSnVMSkZtQ1N1enEwVjRyT28xWnRWUkdGcXNIMUZpMTlPQWJrS29qbTBXMExzaFBoZ21HVERoQ0tnRjd0MnIvLy8ycy85cTlWTUJXRVJWUmVyK3BYNHk4bkM2NE9VM3k4UjV3MUFMcFhha09sV2h2U3FraTdudnV5YU9QMW5GSjJHNVBEalc0dFBvR0FuQ3NhdElHMXphYzFEdHFIeWpQYUdaY1kzVTVLak13bVRzMnFUY3VhTXRpQ00ySE50TTlHMHpVTVNVYUhWSVdiRmYxTlVZVWNLdi83a0dUdEFCU0RVVWhqREJ0eUkyQUpUUUFBQVJKTlR5T01KSFVBcGdCanBCQUFBUCtoWlpKNTh2Z3lYT0QvVUJNVitYSXJEUFh1TUIyRUZFS2dnQ0NnYllDYkZzMjFzdFNtdExWYnl0S2tnQUw2V1UwSkRjL1h1dlAvSzBqaDRtMUxKNE9zS0RaaFljd2poSGRVcEJxc3hqLzdmZi8vVjJmMmFQcy83bEsvL1NRNDA4eWF2NlJNc1FySGoyeUJVNENsSW5vY0VEVUw0K2pPcWt5TmRzQUtLUzkwb3BhMXNQQTZPaXpCYUVUU0lST0VoS1FKS01rV0hTZEdzeW0rUlkxRlo4MmlkUkF2blFzTU1NRlErc0lZdFVNUnhKSjB1b2E0Q0lrTjNETXcrUzdMdEhjK3o1U3VYMzRoZWhvdjc4WjhycFYyT2sxMkxlbjcrcnRQdnRaVGZ0U2RBc3ZBUjdjNVhDdi85ZlBYdTl6ZERYSmErZXg5SDd5MUszV2lrVVlTaUl5VUFCQjJMbkt0VGFBajFJY01qeEhmUytSMUdZZUNFd1FYRlVHUmV5KzluM1pFZWRDWXFtTEJ4SDdQK2p0OWYvK3RmK1kvUWtBMmgwUmxLS1J1UkU2RUJVc1dCSEFoSVdlUUVBMEZZTks0V0lRL0xxdEFmVlpzQlJiVmRZa1FneWRaUkVRZzlFcXNHUW1MQjhnUlNiZUt6TFozQkdPcllxWkQ4RkVqMGYvN2tHVHpnQVNKVzBsekJoMVFOa1FJMmd3anNoT1pTeCtNSk5HSTZnMWpkRENJK0VBd3hJOXRSSEF5dC9pZ2JJRkwzbFp1ZUR1Vlc3ZlZNdkJ3V2pCL2Z3dTF1MkhuOTFHcGZDYVJDdFZoME5aczJXODR4bXp1WG50My8vZjV2cmEvM1N2ZTk3Vm9ZS3IyT0lMc0ZGM2FMYmFuTEZrRjBtMGtVWkFEalljWEVCOHdscytPV0UwelkrU2NJbGlXRTV6eWs4WEJacFpDa0puaGNJdDM5Q0NkeWFhcitxVDQ4MXhOZ2FZS0lWVUw2WnJtS1JqVTFRTGxYckZGcngxd0dTZ1lEaHhaUUZ3d1ZsVjlRc29sZ2lzYnJDTGRwbzYxWSsxZU5taFRhT21LUFpIRVdQOHZ0ckt3ZFc2eUZpa29xMng5Qko1T2VwTGE0Y2JqR3VLVWVHVlFvZ1RldXRsQjBVcnhVcU80UjJKblBnS1ZJeG1TTlhScXdwS1RrSWlDbHAraGdWVG9UdmNoWDd5R0IvMy8vK2ovaVhqYVkxMnNSemJXeXQxcHhoTEI0T2s3V0FxUFlHMkhrRlUzcWxRV0pBSjdyblB4N0U5Uk1XWGVsRjFsQ1NBM2FVVlRhdnNBT1p4RWtTdWg2WURyQm1aSWpDQ2hJb2tDQWNpeWl4TU5vcGsrOFFoNXB0R2RKSkFBQmdxRXpCYURac2pSVTBjRERNTml6TmRDc2ppcEp2LzdrR1RpZ0JUR1ZVbDdLVFN3S21BSlBRQUFBUkwxVnlHTU1HL0lvUUFrOUFBQUJGRkNXbDE0NmJWa1ljZ1RsNHRJYXJVYU5iVWVOT3BSUHRta01Jc3VRcExFWnp3YlFFZm9vT21JZVd6YUx1VU5NbHNnTzVSUkp1WkdkVzF6UXlRaVhuQkMyZ0I0NWJBOHdlMWhKUVROMW1qNmsyYWV3TlNhUjJTeUpOQUhXdExEdzBTZVpVa2hFclZwWUxFQ284ZXExQmdRL3E5L3UxNXFtdDh1ejZhNktZSnJWRzVHMjBraUIra0docFI4ekhNWlVWQkFFc0dJQXdvZEZkS09xRVN4Vk9HSFNtV3IzNEhrbExHWWd1S0JZWWdDbEdzRER4aXVXUG5oTVVvMW1wcXFrcEhpdDUrdllZdW1mZjMrdzRWNHVydFdydzNwZUdVOVF6ZzJodHBNWGN5MXdzUjZGSXNjbFhPSTVNNndwWUM1RmtEVGRTTHNkS3pZVVRQSEFZc0lBT2NGd3FzVUVMTG1uMHh0WmtSejBVcWg5WnlidFY3UkpKWEhIZHdBRXBvQUlJWWFXaGlIMkkwSnZBQ3BIRmlxeXJYNkZXcC9aN2QycWlGclZJakNzb0FFSWhpMW9JZ093VllBc0FZU1Y0VmJBWTRCbEJFQ0MwQlQrdEdDUTdJWmNJVUJpOExrQllWeTdBWmlBWEZVdG9TRmQ1ZFZwVkd1WXR0YmUvWGJhdi83a0dUZmdBU3NWVW56Q1J4NEtvQUpIUUFBQUJMeEx5T3NzSFVBaUFCa3NCQUFCUHJTbEoybGV0bDczNm11M2ptRlh6ek4ydnU5V2l0OXRqTFh5YmQ3MWIydEJNMzc1ZzN0dDI3V09DOTU2WmQ1c2pqY2M3RlVYNzNMcyt4OXdlZ2N0K0N1L0hZelZFendHcjZPOWttTi9MSndOVTc3V0RRMWE1WTVlaUFOTk1HZ3NrRUNva1dpOHNzK01vdGFnRkJaeW5zM2pOODUxdGRUYlNiUmluSENCcTFNek16SXFxcHlORmdRQ2dNQUdRc2F4NHd5Q0FBSStoM044Z3hTRGZKQlV3dU9ZU1ppS2lBcGl3UTRhaGdLSU1vVjhGbkVid2dpZ2hmUk1SZHpsSjVNZWhJa0FMamJ5S0s3WkpNSmNJRTBmV1R2aVhiZWR2NHl3R2pzMDBDeWlDNHZDSmlLQVlDZEZtVS9xbXFmbm52VnlCQzhaYk5YNm03WC8vUGw3RFZlNXZEZDdGMTZOd0hrUi9aZmE1enYvK2U4dngzdnV0YTd4LzVIWmlkdHJETE9iLzk2NS8vV3czbGx2ZVAvMy9sa1lsa1AzK1owOXJ1SDd5N3ZMOHVmKzlmdjhOZnY4TlpiL25MWjRQMkFoUkVqQTRBeENFajM4RW9lSUNwOXY5QnhpTnlBTnlSeHM0QUFBQUFlTUpIRUJvWmdWZ2ROaWRSbFNEN0tlYnVOcy8vN29HVGhBQVRPUkVmbFlZQUNKNkFKSEtBQUFSd3RlVEg1bkJJQW1ZQ2tzd1lBQVAvLy8vLy8vL1ZWaGxlNmVLbDVSbUlrVWdqZHRiaFJBT21ZakVVZzBaVkJvK1pRV0VST2h5R0RneDRHTUJKRnZBUU5Obkx6SmpzMThlQmdxVGNCZ3dtRXJpUUlLQ0RpaFFOTmRiWm1HZzRsZ2lQcGRaajZZY1RFQXhwQ3NhR2wxaHBZaXNwU3paUkpLeWpFUXFnUUNSV3ExdGNnT0JjQ0dHWnNzdU1pWU8xeGhsTFRvWlVzaGlMOU1xbnBoblVCdmRERGp4R1BOOFcrYTAxT09OS2FtcW0rckpaeXRSMVd0dk04a2lwTEZDWFZsa01KeXZvNGFZeU9xMWRYNnZjc0t2YnM1VDl3M2xjM25EVDlPRzBweHBVL3NnclhINjN2OGVhNS83L0xlSGUvai8vekxWdXRXM1pMQ3dVWFhaWFV5bjNBRVZjU1ZtT05icnRkZHZiUUFBQUFBQUF3aHpzdnRNMlROV09FZFhGTk1KaUhZcEVjNGkxTjg3TzgxVE95S2dWSmJhSXd4LzhwVU1WQURSTm5BVVR1TUhNMFFlSmdoTWhJMXRKaWJhaVR4R0dKUFBZMDQ5blJUZFdpU2wrTXFwYU5Ta1N5OHcwMUdmV2ViNnRXcjR3K3ltYWMzM24yRHE5RVNXalRHV3JuTCs2ektaZnlyR0s3UzM0dGJ5R08yTlVkaXZWcGZXYXJzbkt3UjF6TW1abUd1Mml4dW11Zk9UUC8wem56djJ5T3RKeWR5MUsxeXVVYSs3RDIwWFROYTF0ZjdXNm5kOFBlVEx4Mm1FSkZHbjBnQUkwYnFFWUNjZUlwV3JjSjlkcVJnc2x5ZDNaLzlxSmplaEI2dFNONVoxaFdOQXBOdVAvN29HVHZBQWR0VTB4K2J5QUFKSUFwZmNFQUFGUWxqekg5bGdBSWhRQmtNNElBQk1iR2NtalNpMHlOZ01pRjBRNUtBVUVSRUJSUXNKYTB1VGtVdGFldk4vSU5yUUhMbXV1VU5JYVdmWkZnTW1TY3RFa2VUaFZBSEtvdEpTM0xVSmdrREJpMmxGVG4wcEVXenc2S1dNWTRvcXNzVlAzWmk4dVl6MFZvTFVtbGVHOGxwbnNab1dkWTFtNVpRaWNuakJhaFIzckxlRXd2SXdFYWVPdXc1WGZVMnM0SmZRSUdOK2dETVNaQ1RMU0Fna1FVZEJRK2h1aHpuVzJSaTFiL0xDbU1iclF4cUtUYmJtZjNLLy8vLy8rMy82MGY5SmtzeXlxaklRVTVKSVdCRUJUVUV1ZUFHSjdGNlJxQ0Y4S1F1WG1JQkN3bHJMbWQ2UHlTQ3NJaFpxUzk5MjF3ajB0bXIweDlKY25OOGxKWjY0emRUQ1VFamFJYmhWeksrb0N3dVpLVnFDL3N5WVNTeUhwT0JxWjdSTGxPcENBaTRTeGlPT2xVbUUwazNvazBXaVU5U0xJdXVKemNFR0lyV1ZWN1dRMk9OZE94QlVWRGhacnlXbjFQZ0lxRVN3SmdadjlZYkF0ZERxbFFEcUJtRkM0MlhHN3V4MnQrdGxXMkthMVN6bi93S3lqZFlTVksyNTF0RE5mUkdGRGtjNnByaU40c3dGQ1JJR2tNVE1vUzFLd0NlZXFyaE5ndnVDNU5nVkVBYkxPc2pIbSttelBSVkxvaEltUmtVMlRSZnA0Y0VhN0wxWlNPanN6TEVudGpHYzlpTlduRG9FcXg2VVV4cnhLWHh6L25vU3QyMnZ0eEpqKzVqTlR1czdGNmcvbDAzek51blQ3MHpzNm94UkpRVEVvakNDVmh4b1ZZOGYvN2dHVDNnQVJ5VXNyN0JoemlLK0FZN0FRQUFCSXhpeXZzR0hWQWY0QWtzQUFBQk0wd1hJRlJoVVVCSzJLSWhsT3I5c1l3RVVPMU5mUW9CaHFuTGNMdVBPM1hxV3BKaDZVMXIyVFA5cW9zbXk5U2tTZHpSSEtERnRSYy9VS2tpUWdqTkNJYUpWWDNGNUJVNE9NZ25Dd1F5VHJpb1crYnFLcVFpWUVUTHZzMmlzc094U2FFa3NFOVVkQ09KakRpeHlIVlNwQWJoZG9sU21SN2g5WXVhVmk0UXRvTU9va2ttcU5FSVpROXlvWGxFT2lLb2toYVBGNElGOFNuT050enJpNnNqSVc5eUhiaVRvK2ZyYnI3N3FPN1kzbTNXdTdicUtaYmFWczZlWU5JaU1DcEhFbElIQ1FpWVBEQlk0Q3JIRkhXVTFSRW4wRDl2c3piQUFlMGlUWUdFR0hzRzd5bDJjdDR0V2pmVUczdVBpbzNxdmJTK3QzR3U5L2YvcVVGUzU2cDZ0MUt3WTRrNUpkVU8wWHRLeHB1aVNpMHdjaGk4ZEVyTlVYeSs3QzQrMTV4YUNXWEtXVUtid2ZCczIyUUFybUR4RUxyRXNLSTdRam1LRUNPclQ4V3NiYVZRMC9MVzYxUTFkSkUvL3VRWk9ZQUJKNUt5V01KTkZBcllCa2NBQUFCRXRGVEpjd3hEd0NiZ0dPa0VBQUFoU1lZUU9qRFRKYkpiTGFUakpKVmxKamE1MGg2NG40S1FFMVZqVWtXWXJqVmx4K1Y5QUdKYUdZcEtram9ha2oxV0hhQTNSREkyTnpNOURJM0hsMkZZb28xWWIvZmZ6RHZML3QrTkgyN2RWa25hMWxSQUxnRWpjMTRpWTJQS0lXMU5iOUVpK3cvMFdxUnJHcFBJdHE5bjBwK3FSWXRZVS8vOVA5WC8xL3M2aEJZWnlReUZwdHhKRkJZUWNFeE05RVZsakthRTZRTlV0UWwrNGpMU2d6dFFjbzFCc3VuRzhscHNRaWhBRFUxbTRveUZoRXloc1pBbVM2bzRvZEVEa2xTU0FFSVNRa1BLOUppVEMybTNycm9KTnExU09hYzEzaGhCQXVwSkV1em13V3FFRlVZU1Jsb3hvTVFKSm0zWVdjYkJuMDJRYmN6bmhrQmZXRkdqU0R3a2JoaFlxQnpJb2NGdzBzdytENlhxTnkyd2QwQzE1NG5zcFhoN2UrMDhCTVdpaXluaXBaUXZWbUxIMlY2bDIvOUtVSkZ3MldTK1NwVFZuUk8xbi8rajlQN1ZRSjRhVVpsT3VSc29sR013Q0dwdUlDampsMDVBSWhDeE5ZeUJId3R6VnFlMWRWYU4ybWVQSkRhTVVoNEMyenNvUmFGYVpJa2ZTTUI4Vm1DLy91UVpPWUFCUEpleUdNSkhWSXZ3QWpaQUFBQUUwVTVJK3drY2NDZ2dpT2tFQXhBQll1MHF0TklTMktTQlFUV25sNWkzZHZCNEI1eDRZYkUybzE4VzJPaFMwRERHZHJJWnFHUkR0NHdsdHZUb3Y1OTE3cGZTTG95NFNaeUxaR2FmeXdvNzdsMDNSNmJDcUtZd1N0N0Z0ZmwrK2xMWVV1bjJDbW9tVW0xQzBRSE9qWkd3bVcwSEtYNVN6TWdxY0N2OCtaMWpDSXlsZmJoazIrSFN1Nmh0MnRIN2RURzM4MWtoY0pCSU5FRU9KcUF1WXRPUWhZYUpnTDFtWXlUWU5RaHhoNllWQXNCQnp4d014YVFHeFEwTWdvR1JrdWpCc2tIUmdOcldzSTZNYkRUNUtoTXJFck5hYmV5VGJBWmZwMmJEWHpVNm1jVzNqM09mTEtpMzMyeVRWRnluT1kyeFBtTlQyWSt3S21XbkMvdHAvSWE3dWJTUWwyc3huNzNjMjdWaG9qWUlBbzRXTGpYWE1FbEJ1TEN3RFE1b1MwSVIvZDFoTVcyMnkvbEFBaEw1dEQwTmhkcWJjZXByVkllRUVTRFJXdUkydFlwWlg5ejVOamgrNTlYUy9kckJ1c2VrTFVjU0xJdEVIVElKcExCV1FrSUtvTDFJRFZXTEVVR1FRdi9FbkNXMGpjN3IvUVE3am8xSWxMSEJkU3BCcVNkTklKR2lZMlhpU0NwQ2g3ZC8vdVFaTndBQkgxSVN2c0pORW9yUTlqOUJDSmVFb2svSjZ3azBXQ25nR1N3RUFBRUNkM2JRTU10M0pHZDF1S0thUi9UMEd5MCtoSUNkSnBSRERBM2RYUm9TNXgwRkVMWVpaM1IrR1dKdVI4dWNzeld3MzJ2K3doMTFKQ0JFRm5EbkdGdWhvT01jUERWays0cE9NWW9Vb21WZnJBVEZPV3VvRk5pUnhveEFBQUlvcEFxMWFsQnZRSGRyRjljSWlRNmwxdjMvYmYraCtpaE56TlNJZFZLZytFTVdYTlNHTUdtQ2drRkF3d3FGUWlyZ0tITHBwQ3NCVzYvQ3hta3REZEdISWsrd25zNlFraHQ3aXdQNFNDWXRJaHBBMGlJd1BrZkE5WkdYMGNKQ1J1ZmJxU05RbHpOWDBpNnNwK2YyZUdGR01XTHdRN3NidWdPdUJKKytyVUZvRjFDRUFrV3pIejBEV2tFRzJ6dmJCcjhyMDNVa05kOG5XZW1sVy9lTHRLZG45Yk1yUFRNdHFtVC8vZitiSDN0dmxtTVpuWmdXeEdvbmRkSUFEejNua24wc0JWUVl1anRneFJkeHBrOXFGU1Q2bHZaZUxmVTYyWTlscXZxWnhvaDIxdU5ULzBwclhsSm9FRE1VY3VLRjBFS0JVRUNod1dnRWFBcFdsdzBGaDc5dGJwSXk1dW5ybGNwdUh0VEloOVZaQUtpZVJkMFZwMG93T2k1SXhRZ1VnZDEvL3VRWk40QUJKeFZTT3NKSE5BZ1FCa2RCQUFCRTNuWEg0MGtjWWlsZ0dQd0VBQUFHK2NJQ0ZpQ3FVSlF3eXVvcDBFTmQzMnpiMGFEVjRKbUozc0llam1ncXhZZEhMSGVSRUR3azB6TXhnUlYzWjB3TThlbkRQamUzWWZtVjIyblB6MU9ML2tYbFZiNWtlY1VXSGtxaDRhc1VOSlJ2WXVxd3VFZ21vMkZFMGtBRFRnL0VvZ2pBaktDUWpSam5COEVtZ1lSSk1MalZnb0FtNkdNdWhrZzZTZk05VDVacFo3Ly83ZnM3Zi82ZlRyQXplRlIxTTBxNDJrakdVdUVKN2NvZk9SQ2NvbzBERmtCQ1VTdDY3eFpEOFA4bFNoMGFhekpvTVBodFFSQThSQzVNRjUrb29DL0lrQktwR0srQ0VQeFVESzR1VElxeFNrU0R3WHpIV0NDMUluT0xzWFp3WGh0SHh1dlZOdW5wUEpWdEIyemxaWFRmYVY2OTQ5dXVpSUFPZ0VHUlhBQVNBUlVxSUZtaFlWV2RNSm1XaFlFUjJJMUhZQmFBWnd5a0cxZHQyUTBCTndKdHZ2cmdORUNKYzNURUN5TTFOVm5uRzZLWEhVdllHaEFhYXIzTitjY3FpWUd1RENVbkhPZDFOb1JMSW9INzV5Uk9TeUpwQWRRS29ZWElwTXlDUWtTbUt0Wktxd2FScDdwRVJXWTExUDF3Y0hETlhucjVXSTZ5alZhLy91UVpPQUFCTU5reUdNcEhPQTI0QWp0QUFBQUVuejNKZXdrMFFDNWdDUHdBQUFBdEp6OXYzbEExdDhXbTVhUXo4N1piWmZiUUpYRlBUTmV3dVg0ZjkyZ2dlTVQ1K0xRMHFDWmZKU2UzaEkwK3ppUm56TTEvRDR6ZW55WWhITThQT0NYeGpHeXRPTTgwVlJ2VUZGTkVBdU96QWFMcm5jcDRadXRYbzNtbXFZN2l5UGxuLzcvKy8vL1Avbmg0YkVja3JxcVFEQlZwY1RpeVpsSmNJdUEyM2F0WXhUMVg5TVBCdzRwK2phdGJ5UWFJaXpGdW9DS2pRTTAwblFTaWJhQkN6aGxBK1FWR2F5cnNNcEI2NWFGaG9RcFJ0UUllQXU1SCtZaDkra09DMFgxWklFM2hOV29idlFFaUV6TXNFekE3N2FPQ0ZzaGFPNWdsSmJnNURsSklKeU1LTjNCVVRzUnhERno5U2FTVW9WcnM1c0pEY3gxTVNKZFNPVDQwL3BHb3ZhT3F4bXlqUG5sVGprSm1GbWJmV3QzK3pma29WeWIzNzlqT1BIZnk3b1FuUTdldFNmcC80ZTlmbC9jaHpIbW9xV09RT09TdHJIRGorRzM1eHJiNkZjL0VKRVNrZm8xaCtUQ3lKN3V0TU91cnZTemU3Ly8vLy8vLytvRVJuaG1SRmNTTElCRm9FUmpEY0VoQ2dTKzVtQ0JVSVhPZ2hvcWRCaG9DS2xNdEovcC8vdVFaTldBQkx0R3lXc01NK0lxd0JrY0FBQUJFc3ovSWF3azBZaTJBQ09rQUFBQWMyQjFvSmdvR3d1UDZrUkEza0JnVnNDSk1qRURBTnFJaGRpcG84MWVKNjdyYW5GanMyaHVUV1pLT3haOVJqcHBrU2tCR1NVeW13aVVobGE4RUtIanVsOWtwVGJ2dDNhTm55Yk1TRTlOYkEyWnRRWk5yRmhsbHpYZHJlTjJhU3Z1UlExS2tMUTBCeXZEUlZjRXB2bzFiNnhzS3Z2NzBEaTFEZERHSlNXUWZjMUpkYVNkQmdCa3pxbE55RnlFS2owVkN5MHZIUEpYYlRDR0FyVTc5VlljOXpqU3F1cVFWR0hSN3Bic0hzTEpITkFtWXpoQlFsbUVnUlFqVVhrWi9BclBMTDlXbmxnUTBJeS9UNkZIR2pJcUZMbWhLWlVPTGlmV3g5UlhTR1RsRTQyb2doYjhaWDJpZEZlSTBhU0ZqSklHR3lVQ1VoREFvZmgxRHZrcFl3UEV1VXNHZHhkaFUyQzJWdFVSQ3hHNlJUbUN5M1VIa2d4ZVptUnpLa0p0Q24vVDJ4YmlDb3gvSDFnNlJ3MytaYy81U3VjbHYzTHYyRC91bGNxZ0FlY2txVUhtSElPTHFxMHFRaEsvV3l2MVRRMmhEYmxQMDFwWmV1TC8vLy8vMGYvOVBwb1FTRlZFVWpMYmppU0FNSmxqQ3lpNFFVSUpJRVJBMGU1cUxncUQvL3VRWk5FQUJLNW5TZnNKSEhndElBajVBQUFBRXdWVklZd2tjWWlxQUNPa0FBQUFWRVFEeXZQQ1hLWDI2N09JalRvenFaS0VENVFuRmJwV2phZzJSQmdsTXoxbE9aUm1TR3RtZmJ5VGVucmNsQzhaWnB1Q3hYcXNiajVvR0lqQnFFL3lRSWFzQ0Jpd2daaGJpNkRNb0ZRTXpDcjhVemZMZUxUSUhWS3VtU2VXcHRybVNNNUYvV21wZ2paQWNEa2xFYWlRNDJSUzRja1JvWnJ1TVNLOVZvSlFNQVNYUVVHSVZJWk1tRWw2R21JdVlpQmxsd1pBb0NMTmVsMFg5bi9USFQrUjlOYUgvcTQ2aW9YZi90MXpHenIvcUMzL2UwVVVraWJaektBbUI0MDVTSFFKRVlTekxRWjRJbVNFUThhSEJpL1phMlI5SUdoOWR6NnhTaGlMeVUxUGp3UUN5SmdUR0lzVzlNNXZJMEtLTkt0RW13MXRpZDRzMmhnR1ZadDNVSUc1SWZpU3NNZ2xzT3RVWlhFNHBLekM1OVN6TXN4SmY2dGtoTks1UFQ3WVQ1eXFSanBwZWFOQTMwVDJkSjZoVW1MVm1Iam5raEhZbzQweEF3S3NhYkw3N2Yvc0Vjc2NiZjBxQVNFRG5ISEtTSTlFQ3VRbFlYSlY2N3ExMFVoeWo2VVN0REtUYm5XR3FnSjRlRFZVT1hzQllFRm9vaWx2UnVRT28rb1hLRGhvLy91Z1pNeUFCTUZXeVhzcEhHQXlvQmpjQkFBQUVrbC9KNndrZFVDUkFHUndFQUFFNWcwQ2FiWWw3d0s5YnRzS2tPVFQ1Y1FFSVpEUU1uM01GRkNFVHJ2U1hZZTI2WkNreTFycFN6d1pnUnF0MG1qa3YwYVJPdlVVazVyVmtGSTl5U1pmcEliUXhjVE52UlNraHpTbnZoamZieUI0dTZSU1BkeURDMmZjQ3VkS0hWOHpCV0k1V2tqV2Fsa2pJdDNyK1MxVlFFWXFzZ3drRXlReGdOQkhkNkxHK2dOMk10cHhxdFJBSjBpb0FjdkoyaXUzeTNxY2xMeC83MkxUT3hvSEZaMmZ4dVRLS2tVUlJpRGdtUkNTMituU2dJOE9ySWFYYWdJTUdGSXhRbHVnVUNVT0t6Rk1Tb0FvWTZ3T0xXNFBGc0RmUll6NWxKS2dpM24zUnloVm45VGNyc0lsVHREZy9HNWJmRXR4cWpNUHJOOUhrTERKMnNsN3J1dnZNRkVPQ0pib1pxRDVtUVFHNHZiSmNta1BPRUVHUkhwVXFidWF3d3F6cjE2anc2Wk9adEZPT3VNRHZEcEYrWlY1NW4wcVdiNzBzdjNUUGhadERUSFVFVWYvdTN1bEUzRWhjb3lGMzBnUWt3cWxLSXYxdit5bjNhcXZUOTc5aTkrVytoTmFyOVYydi8vL1QvLzQ2aUI1WlVWME92b0JBVEN6WmhkREJ6Q1NnTlIzY0ZpakFFQ1NpN3VwTk00WGRLMkV6N0VvNDJBbEtENlF1UXBLVTBlS3FHVGFtbExDaUFreWhjVGdrcUlTTVZKYmNrVVlZbWZWaWtoSHA2eGRzMU5qcyswL2V4SkY1U1N5TWRwWEJOVm1TblJOa0pxWnJtVHJJVXpJbDNibjJsdk81OE0xWkJiOExoL0NUaEUvLy91UVpQNkFCTEpkeWZNSkhIZ3VwQ2tORENOZUVkbVhKOHl3YjZDamdDTmdBQUFBZlhjWGtwdWw2WlNEalV0QlZLempGOXlRM0dHN0pNU0FGdXlRQ3k5S0hZWXcrYlV4RkdTS3Zldjl0Z09zTkdybHFtbEhoWTZMcXMwNk1kTEVTVkRXbEVIcFhZaXo5VWhyQkZBSGdGa2trSFlCdzBEeWhVQUYyR0NNckhoUCs5UzVhZG9qZ1ZIaUowSW9KeFdZNjdLejlNTVJFeVFzZ0JlME9wMUMyTkxzUm1zS1FwUExiVGpUYThVcEpNUmlzek5OcWZQZGlOeWg0NzU1TzdsRkRtQ1pWeWlPN1F5UElyb3RjbzVpUVFmQkprQ09Ha1dyMlFwQVcyQjVobW9OcWJ0SVpGWTlPNTVxbHNSUVJtbXZHSG1nWW5RbUZHRGt0dk50a0ZpS1hSeHE1WE1ZSUE4Q2dQeHg0KzFhTisxVEZhN21mS29HdVFocjJLWlFsbGEvc1ZWRjk3T3FKT3NjYU1YYzBkTWtwQVIxZ0ltSm9JS0FLc0dGREFnY2t2Y2xPeVp4VlFRSTJKMjBpL0plaDdNeVN0UHE4YlpGWkViMmFhRTR2VmV0U2JtWS91TkNpVHdaYVNxZCsraFFXQjduTDZFOXBDZ3hva0tGWFg5T3R6UG5Dc2VKR2h6VDl3a294d0kwT3ozVnQvR3I2dGY0MWVONE84WnAvVGRLVXBuZS8vdVFaUDZBRkl4aHlmTUpISGd1Z1ZrTUJDTU5FeldGSVl3a2NjQ2dnQ1J3QUFBRTgvelVqWi8rOVYzL210czdyV21iK0JYVzlYM3UvdGJmdDV0WjNqVi9tMmFRTjA4MTc2djZRdEs1YlYvK0xaZDNUcW8wajJrRnhneHQwc29BeDRQQklMWURDQ1NCTmpsb2MzQXllN285U0NKZENPbDlWbnhNdi8vLytyOVAvK21URVB2ZXNtaXJza2lUSklBQUFBTUVHekFRVTRHVU9IRGpTamRiQmg1NklDUXc4WEw5S1NNZFNCNFZHUlVMa29YSFRHeEFPQmdFZ0xwam1qdEFhd2U0SE5ER3BEUThnZE9TZ2VvSEFEbEU4R05oalJuQXVaRkpBL0JoWWt4TXhOeENoa1VNUUNOeThQZ1pjYklnZ1FZa1F5OFNCRFJZaTJpYUZXYm1ac1hTTUw1YU1TNmtUcGFMQTVadWROajVzWnBLSncwSzVmZWROMXJtQjkwYURJMFVsSU9YMW5LRHBHODNPTExaa211Nm1Mem16SnJVWnpOVTJXaFdndTh6WSt5MEtKMmJIVTAwa0ZUeTcxTXlra1ZvMXB1ZlpVeE5sSm15QmpRWlNDYk02MVdVNmExZi84OGZRU2RhZE5hYmYvK21iMUxORTdFMVFJdXF2cWUxUUFBQUFHS05GNFRNelpsMVNkWXpncnRNdkxnMmZtWk5PVE02RVFjWXdxOVEvL3VnWlB3QUJZQmxTR1ZoNEFJckFBanNvQUFBSHNvWEg3bTRnQWo5RHlQbkFqQUFjY2tVN3Y5Q0ZMM0lYLzZldmFtN3UxLzYvZi8vMGYvK3FrVTVpcWFhYUhXR2FNdTVZN0JHbzBnS2dBQW9TQkhBTW1SUEdCQ2pWMDRSWTFEQXdnWTB3UXdCTXpRc1dCQjRJdnNaY2trcUJpeEE0RlF3eEFpUEw4cWNPeUl4VVpRQ01rMkZFMURGN0Y4MFRUQkhSSFRzSEFBY0FBaUFzWTA4UWxpaFJ0dW5HdVBEaGc0Z0lYeVlRNGtMQlZQQWhvQW9TMWRORFVzVTNDb0lZR0toalE3ZVNFbEJSTk1CRk9pcmhMSEJhMnJhQWhCSVl1Z3c5R2lra0VzcFphNEtsVFhtRFRjV3VjWmpGMnNvbU41RkRUTlNTQlFpRjhRdlJhT09Fd0ZVckRhOVNyRkdLdjVGSDBqTWJ1MkhiY3VMdnh1a2JkTkJBWTJlYzd4K3JUMHZxM0dCYnROY3ZXcnMvVzcybW1zODhHRHNJUTBMOXpVWWpqWElvMStYeTk1SGJmNTlZNDE1MlhKcFk4MTUyb0Z0NVdjOTYvdWY4M1c3V3JmblY3YWRoK0hRY1RqL3orK1o5Ly8vLy8vLy8vLzVWZ3BoMDFOeTZOWlZmNXYvLy8vLy8vLy8vRGQ3THROZHhFcE5wV1J0d3BKZmxBQUFBQTBHRmhrd1lCRmdHQUpSaFlsTGhhOVJwQmsyRUJwUkRlc2xPTWdYL3AvLy8vL3AraTcvMk4wcFNDb21zSDlFV1RDREFBVkV2czJRNDJHR0tIaHc2THI3cldpVEtGY0VqSmV3dURHLzJ4S2lHMnVjK0kwQ0MyeXlWanVjYmNrR3o5OCtoTDdOR2ZRZE5lcXo0MXQ5Ty94STNVWm4vL3V3Wk9hQUNtMkdUSDVySUFJdm9Ba2N3QUFBRm5uRks1MlhnQUNpQUdRM2dnQUFqMXdWc2o3d3JmUDlONHZhTHFlYXNMVnQzdTNYenV2aDFyU2RnbnRUVjdiMzYxekpIdlgzMWovUDFpMi8vZjdtdmlER3JiK3Z6NlgrTTAxYk5xMXJhOWMxeG5HUGo2M1RkSzJpMjFYNTFuL1B4YWtiY21NYWkzM3F1bzJ0NnRqeFdCUnE3ZzYyMDRtb2kya0FsQm9GWG1Ibnp4YW5MbXQ3UktNVzZ0TDdOZGpFQ3V1SHpDdXBYL0NQd3I2S1JWVm9VeVUxS1M0cWpuS01MbUFCQUVnQXBzc3VnSUJRS3N5VkFZeWx5bGc5ajl1VXNZQ1NFYndCQjhHaHNDUk5RcEpKY2lGK0Q5S0RCWmg2WExnNDRUZVpnMHVCOEpmNkp5VVV3YktTTFFBZ2NnVmhXZkV0VjhUM1habzdrZXJFOGEzYU1QTWd0Qy9IdS9uZVAyaEhIaWZwVFZsV2haaHRBUS9NM2NrMm13MzNMSFRFbTlydDV6OW15TVpwL0hIUE9QL1d2OCt4OEpOYmJib2dRL2NNZWlxTUNLalRjVjFUUUlrTWNOT0gzQzZ6MExzTm5GdUxrR3IybGFrVlYzYVV1TS9KLzBkR1piMG80MWVnajNvU0JJenlpbVp5MHF3Y2tFVUVORjBDcElJTFhBQXJOVWZ3Z1FVYXpWRWwxWGpkMU5kMDhJZm1ZaEVwcUFJZm81UExuY3VYSUxwY3FBYXlJU1NOWEVETUFJa01UU3RrT0NhaWFvMDVBOUFscUFPUUV3NHJLUFhtN3JNK3VpZm03bGJSMFZLeGVYaGRTdzZKVERURlBXL2xoTk0xNmRxbGNldU1KZ3dVMVM1Vk9ta0pjdlpUWXNLRGxOMDBKZ3FtWXB2SWpQTWs2eUxTK3FFb2s4WmlaRldVYS9mMjMxSDZpN1VVdzBKd09JYkFOeE1ZTE1tTDBPb1ZUdDAvcXU2SkRYcjZLbFkrckg2Zi8rbmY5bi8vL29wQVpZZFhZemJjYVRiRHhERWRCUjhUQzVBY09zdENCRUlJRFNNUlpqSk02NWJMbGNyLys1Qms0SUFGRUd2S2N5a3pvQ3pnR1B3RUFBQVViYnNsekJoM1NLa0FJMkFBQUFBU1pERXBocjlOODlFQWFRTVd5b0cwYlNpMU5RbVhzM0RtVjFXRWJSOUtSQ1ZKQkd5Nk04bTkrcFBKN2EyOWFXbkRVcjJFdHlud1FYay9iOFJUbmxJc2w1SnhLNXJOZmZ1WXhLemt6QzZhQ3RaY1VHQ0lUZng1bkZQNTN6U3Q1NFZuQjhCdFdFRTNqcVpLMmptL2toU0N3VWZHMnVwb0NTY1lrVFVSVENCQUVCUlVZSG00cVdNcXhRMkpLSXMwRENnSXNzM2RQMjMvQ0x6Ymp5Sk1jci8rWFIvVldUTGFwRWtkVVZGUVcwT0pZS0FyM0FLWmtDTEFJWGhjQmNRTURWVVZCR202dHphQ0NpOUJJUTZpUW11VVhTbUlUM05QTFVMMzV0dU92TlgxR29vbWJRclhpV3BOY2hQbWpGS3dyUmhZUFVNT1lLcVpyRU5JRGdFSnl2Q1d1RW9CMXNRT2dJVEJZcmhIRHI2ZDluaDU1ZWYyWkhxeGFtYUdyczdEZG9ScjBHc285OWc2SDZVTm02NDM5RWtQb0R2bU5hRXZ2K3U4bENqa2FpbFZJQU1BQ2NvQkRRZHZOSWNoeWVaWU8yMm9oTk5Tcmp4c1NsQmdmeG8yT2tNM0xzMjJXYTFSTmFkVlZ0dnRyQzA5Y0YxQzFqWkVTQUVESXdpdzBLSC8rNkJrMElBRTBHZEtleWtjOEMyZ0dRMEVBQUFTeFVraGpMQnZpTHlBWkRBUUFBUTZqQWxlbzFsRm9ERmZSQU0yR1NKZ21GeWduUklKbzg5MW1VaXZsdW5WMHlPTDAzblZGek9NbkxoeVVtRnowRDhVN2pWekZnNkRsS2haWGJ0V0tQSEZtT0R4OGtvTk41Mm9iV1ZNWEJyWlIzTkxOUkxTdFFzMDlXM0VIZHJWc3N0TW0wY0s3MFRVRFNMT0Z1YUpWSHJpMS90YjlwNHNsNHNKWll0UENVamVwNmdhRHF1ZDlZS1lTQXBhSkFEU3NWcm51a0UzTjVZZVpvc3FLMFZVaG9rRFRiRU9XNDdjU1BLSS9VU1FSWldHY1lVRkJPcmlWRW9yLzZXbVorMFZhdFN3VEVTbFZTWk1RVTFGTXk0eE1EQ3FxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxci8rMUJrL1FQMDBWN0lZd3hENENhZ0dPd0VBQUVESkE4UW9ZaGdLQUFBUDhBQUFBU3FxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFcIiIsImV4cG9ydCBkZWZhdWx0IFwiZGF0YTphdWRpby9tcGVnO2Jhc2U2NCxTVVF6QkFBQUFBQUpJVlJKVkRJQUFBQVJBQUFEUkc5dmNpQkZlSFFnVDNCbGJpQXlBRlJRUlRFQUFBQU9BQUFEVTBaWUlGQnliMlIxWTJWeUFGUkRUMDRBQUFBS0FBQURTVzVrZFhOMGNua0FWRmxGVWdBQUFBWUFBQU15TURFMEFGUkpWRE1BQUFBSUFBQURUV1ZrYVhWdEFGUkRUMDBBQUFBT0FBQURVMFpZSUZCeWIyUjFZMlZ5QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFQLzc1R1FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFFbHVabThBQUFBUEFBQUFJUUFBZjRBQUJ3Y0hEdzhQRnhjWEh4OGZKaVltTGk0dU5qWTJQajQrUlVWRlRVMU5WVlZWWFYxZFpHUmtiR3hzZEhSMGZIeDhnNE9EaTR1TGs1T1RtNXVib3FLaXFxcXFzckt5dXJxNndjSEJ5Y25KMGRIUjJkblo0T0RnNk9qbzhQRHcrUGo0Ly8vL0FBQUFPVXhCVFVVekxqazVjZ0hOQUFBQUFDNGpBQUEwL3lRRVFJMEFBVUFBQUgrQXFXZVRtQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVAvNzVHUUFEL2d4ZVR1RGVXTndBQUFOSUFBQUFURmw2UHdWM1lBSUFBQTBnb0FBQkRHUWcwWXFOUHNUZ3pnN1I0TXRiUmw2TitFRFEwVXhBbk0vSHpJbjQ1eG1DcTJiS2puamViWUI5ZEh1ZW5HRkREWVFRUWdvOFJERHdvR0hTOFNZTUVWVEpiaTczZmQ5OUYxeGFUTzNMbUdRaU9RNm1JOGtCdS84TnI0WnF5ZWVZaEJzWCtHNDlCMFh2aUFXQTdEOGNCOEhNRDVWSGNjeC9FQlRpZFd2b2RpR080RkFNRmRHditBd1RwaTZSeEVlSkI2VDdMSFhpWWtKaFRMYkhIQnlxTndhTFQvMWxGaUdnQ0dRZzhPejk0d2RQSVgvS2lBSWFwWlpPYm1HNUMrd3JwQ3ZzU0VYbDhEQkxQenVNNE1LbWEwL0tob1p2K2NSSEVXYisyWkxhK2JHQXJGNWhXeS81eXE4dUtTMzZnYzFiQklSTDh2bEZrUysrT2VrTEY4Yk00MWo3RlY5L1djWmRuNlovaFVhVEY2Q3NxTUtSWE1ORzlQSFlsTXd5SE1LQTlNdWd6TVZsTUlsZE02VEZNWWs1TjhWZkF4UEdPWUdHSFF3R25vQlZIekFXdzZLYU42QVRXMWN5MGFNaUNSQU5HU2lKYU14NHFNUUhEQUFjdW1NZ1JqUXd5d2hCakdob3VTWGpSckxBRVlzS0FJZ0VZS3RSU2xyUmdRTUFBWXc0Q0Nna1kwREdNRUEwYnRjUlFjRXZHMTlGeGJya0pDRjl6QXdVQWhZQ0Z3TUZoVUJMWHBDQ0VUTVRBUUNDbFFRR2d4OUc2c0hXZ2g0QmdSS3h4R3NOT1hRV1lUQVZPMHBXQms2dUlmV21NQWlQZ1lEd05MVVRIMEFBTXFHQUVKYUV3SUJHZWlJS0FRZ3Z5QjBNREFnSk9LWHRBUjdYTTJhTDNHOGZHNUF6aHJFYVhMbDN5dHlINWZ0U3RBZXdQVHZ2ZXhwUUZXSi9XVnJyaCtPU1I3MXB2T3o5VWJ1TEJybkxQcWF5eHVhZGJJRXQwUjVOWlo2N1Rwdk9qNUFEZW9wclRBd0Ezak9IallROHRBKzZQRDFNNGZpZlpDeVoyNVpGMzNhK29vbFpTMUdFTDhkaVlodHJsK0cyVHc1RHF1K09CREx2TWthdzF4Z0R1dms2N3Rzb2pNVGNOczdzTVRmNTNaZFF6N1g2ZUg2ZGRVQUFBQUFDb1FCZ1VCZ0lDQVFBUUFnUUZZd21kelpwL01VQTgzOWhFSnhod0JDd3JCUWJQQXhWVlVvRUJkcEFhQWdnWlVLUm1OUGhnT1pLWURDNWhrRW1vQmVhREV3a0N3TUxGdWwvRU5VRDNFTU1CY0toeG5GTy84d1ljQUFYQkpnMHBtQVN5WWxGYTczNGpkT24ySEE4d2dORE5pa05RRkF4K1JRTkR6SUFJTlpwWTBCTnhhTXNZV1pMV1JzcmZReWVTekc0VENnTk1SaE5WNWhjTUdEUVlZSkFCaHczR0l3Q2UxUVo1OHNjdnYzanVYNW1XallaV0Roak1Db0pJU1lSQUlKQW9HTkprTlFtWmxVWUxRWUJCaGo4RkR3R2pjdm1INGc2SjUyMEx4UU9tVXpLWmRGSm80eEdVaW9aS0RSaU1HbWdta2EwZVp5dzNHd2tpWVdSaHBkY0E0cUFvYVdOLy83NUdTRkFBNTZpTXh1YzRBQUFBQU5JTUFBQURheDZ5eTl6WUFRQUFBMGc0QUFCRWRGYitrM1lpQmFPRkdCd09ZTkJva0J5NUNLRUlMUG1Bd1NaR0RCakVHQ0FQbUdBS1pGQVFzQnpMZ2pNQ2tjeGFNQVFKSlJLTGwrdEhzTTdOYXBackE0Sm1LQXNIQVNIQWNBM25zT0d1K0ZtQndDbUcwOHdrSmpKd3RNREI4UkFnSENjdThyQzhnNEFBdUVreWtpbVNmLzkvLy8vMS8vK3YvLy8vLy8vLy8vOWhpWWpCSW9qZWttWVFBak5ZSE1CZ2t3YUN3NERnNEFOTXZZeSsvLy8vLy8vLy8vK1ZRZ3FhR2dBRFFNSFFZRERGUWxNUUNNUkFJQUFsQUVXeVI1V2k2c1pvRTZ3SUFDVkJxWWtrUlVTZ25ZelZUWk40Uzg2Y2REV2dsT1ZtYzBvd1Rrd3ZOQ3owME5XRFBEdUNoNE1NRmt5ZVZ4S0FtYUVKcW5zZktIR1pGUm41QUhBNWt4S1pNQW1MRUpJTW1mTXBzUUVDUjBVR3pEak1XWEJVRUZCWXhvcU5mUENxV21MRm9CSmpPVVlvWmtkazZsS1RHaEV4QVJNSUZHeG1EaVlRZW1IbGhqSkFZd0tnUUpWQys0S0RqRFFZQWhBWUZtRENvOFJHRWlqakdEZ0JpQUtZd2VtZEc1a3crQ0M0eXBOTlFTd2NraGN4TWNFek9qTUtBd1lPbVVEWmhRdVlzQmpJTVpDSkFnYk1JRndJSW1VQ3BnUkdMRHpOUzlKZ3d5WXdIbVVISmxoT1prVG1VQlpjQXg4ME1ORUFTUEdicEJvWUlvOFlLRkRJV0NCVUhLcGlZQ0FSZ0xoWTRDbUVBUmlZa1l5QUdEQWNPaklJWVNLQkE4S0FTUHl3VVBQN1NQTXFrczZpVU5XRlppcHMxNVJ0VkZRUnNRWENBRVBHQmdUTFM3TUNwN0dBZ0NEd0ZDQWNMUE15VkZ4SElzc3RhWmxDNWtUbXVvOG1DQW9RR2hZQldhNVNwbHJNNVZoYWMzRmZxdlc0b2lzcWhoKzQ3RFVCUVd2MWhEbk1xWk5kZ0orbkdwNjc2dTljdFA4MXFUd2EvaVlUU29VOHl4b1BqdGFWT05SV3I5YmIrd3kvczdPNnRaODcrT1crOS9IZFdVMHRySk1XRERNY3NkT01vUk1JbUZPV241TnVrQ1BQOHVNTG9ZTjJhY084eGVNWmxvTmgxbE5OT1hPL2xIQ3FxalJybVJwRm1kSXVHTFQ2RzNaZkdXSmVIY0tKd1VXZmFCbUQ1aGpwcVk2c0hvbVlBZ1JMZUNqMFlZV0cyVkptSVlCazA5Z3dNS2J6TUJReWdPQlZXUHNwcTVjWk9IbWFMWVJYbXNHUm5RNE1tUnBBdVorSUdXRkJ0eitaME9taEJwaVNDWmtJbVZHUmxaMERCSXhKdEVtNEVxQnJ3bVpvVUFZa09iQURVZ2t3azBOZlJEUUMwNjFST0lCVEhEQXk0eE1xQkRPaEV5QVdNNFlqVDJVNXdCQUoySFZZUU9tYkVabGhLWW1nR0lueEVGR2FGQVlKa2lNWk9PZ29UTWNTaklCY3doYzV4Z3hJczM1d3hsNG03R0lOR1dwbVRwQ0VDQlJKbFFwZ0JvQWhCQzgwZ1lLRHg1c2FscUxoVkQwMWpEbVJDVU1mLzc1R1NRaHY2SWVzV0R1OVJ3QUFBTklBQUFBVFhaNHlUTzd6R0lBQUEwZ0FBQUJJdkhsWnNEcEVuQ3FWZklXQlN3dCtZTU94bGlZaEVpb1lNQktacDlpSWd6OHo2QXdRMUVnem8waVlrU3hXVU9FTHZLd3cwUkNIVWhNWUNEbkZHWUFNeEJuaTAxc05jQUtVd0lOc0NxaGJ4TjlPcVZLamp6TFh5YjlnRXJYWlNyQklzdWsxK1VVN0tvbzlyc0lCMFkwcjNiVUZocUhIUVQ3YTgwaGNqdHVCR0dadUcyQmpxdzdscWFxeVMxU3hHcG5UUlpMSzI5Y1Z4b1paRkU0SGhpWTdFSzBaZENBY01JbFlwOTJNZFY1ZFM5UUE0TGlPWnd0eVplcnVhUklZYnJPS0R0ZE4xVktNeG1UTXR5b0lRMk1VaTJOeEh4T3BTWU1MQTRNYkVQTWxUOE1kaWdNVEF6TVBRME5DaEFCd0huTnRZQUdBTVVHT0ZSanlHQWk0MEtDTXVnREtRQXk4UU1ERERNVHN6SlVNSURUTVVNRkhvOFBHdExSa3hBWTJmbWFocG5adVpNVUdRaFlrVm1FQjRCS0RBelV4QUdNeE5oS3RNUVNrblhlTWRKU1FVTTZVaFFJTVlTek15UVFBZ0JVUUtkbUVDSmxoMGErRW5mRHg4TWlDWmN5bUVNTUREVnlnMkpKQlZVYXNkbVl3aEN1Z1ZSbWhoWEdnb2NLNWhCcUtDTk5BY0RRVVIxdUV5UUxOQ3B3QlpNZEVRaklDa2RoVWNPVkFYeUhoS0FSQmw4MEJZVk1ETkYrb0FFSnBnbEVLTWNXa1c5QkpTbVFOQ05nTlJ3bUdIaUpLTkJ2b21HMmt1YTg1NkFCV3RRRndtbW9YUkF4R2xKR2hHQ1FIb01JY0RJb2hBQThnT01Va0ZPRjdpYWN4bFRLVmI0MHhqRUZMbUd5QVp5S0JoZ2lCUUlVTlYzRHpQbEdGaU1lZmR4bVNzdWNDQjJzdFJZV3dadkVpMWVMMGFHaGdJUlFvQXhkTzUvV294NlZ1TzJacHk4WUJqRXVzeEtVeHFpbDBzbGNtbUpmdWI3SG9DZitXVjZTbnVWNXpkaTNPMXJkZWFwNmFacExWTGZ3REVBQUhNQ2NaMHdpQ3h6RlpJdk0xSkdJeXRqQWpPM0xLTkJjUzh4SlFjVEg0RCtNcE1lSXlEUXVERnFQdE1EVVJBd0NDa1RJSEdPTWljTjR3VGdQVEJ4Q21NVElTa3dOQnV6QnlCTU1HVURrd1hRTFRBbEJzTUpnVDB4RkFBVlVhQzFtWElacG9lWjRIbWxRNXREMmJVTUdVUnBoNE9aR1RIYnhobHFzWm1yanB3Ym1JaHd5Wk9QbWdEcG1vRUtBWXdOSExzUnBvNmJGRW1oQUprcWdkU2JHV21CbW91TkhnaUlCcUxNWUt6T0NFZUZoUVFNbUJ6SGtjejQ1QzVVWWU1SDN2aGlCQ2NZQUdRQ1JqZ0tBaTRzSFljOEFFMk5CUmtDakVqRlZTK2hpaUN6aGlpQWtCa3hnbUdRV2JSeW1qaW1DRVd4TWl0Qnd6QWpaZ0N5Wm5Ea1JJVWFNVUF3WHl5WnZPbkVHWFlCcWdMK0JSUmJGa0FOaE9JZ0xKb09pdzZDVWNGSkJ4TVVLanBESmZvVWpBNENSZWRqclcwdjJWTGVDb1FnRmYvNzVHU2VqLzRmZWNZVDI4elNBQUFOSUFBQUFUeXA2d3dQYjFVQUFBQTBnQUFBQkQ0U3ljcDRrRmtWUTQxQWVCQ1VIbllMdkp5TCtXbU5BbU0yS2tJbHhkNDFiUzdxREM3R0pyTWZvdXN5dTRYbERERVcxSzNsRVlEeHI4UitXdWhnNUtlNWQ1bExBVlYyMkhSVzZoZ0FWQVhhcGt6YUdwRjJjdFJ5M0U0eE53STN6OHloM24rbHNwaUVyclMyR1lkc1FIZHVYSkZUU3pVVHNXS1dmcVY3TTFXcVlkM0hleStzRG1ERU9lYmlVdkJvVWgxRzgzNENaRXJUWnBiSHdtTE1JOFpRNmFSblBDZ0dyc2lPYURBRXhtcWhybVFDSlVhRXBFeGxERThtTGtHV1lJd0h3a0tTWVE0RHBneGpBbUN3SGFZaXdoSmdWQnBtRkVGZVlKWVNCaFFpTG1DNEJrWUZnY2hocGgzZ0FBMDNaSE94MmpPaWcxSk9OTGpqMm5Fenc1TldKQ0lqTkVYVEtqRXlOVE1oWGpaSEF4RXpFc2tIUjVwdDBZdUFtRnNCazR3TlNBZ01nZ1dGbndPa20wQUpJT25KbXd1U0ZoaHdLQ0UwQ0JBVUhESFVreTRLTVJUaWFhQmhnWW1GR1lseG9ib2FPQUNTVVprYWhRVE5Nb1RXUGpPampVS0FzakZDWVdtRy9Ja2dnMWFBb3dBQTZFSVZiZ3FPRVFrZFFHQ1ltNFVGeVRhdHpHNGxoalJnalVsVE5naGlrWkVVWk15WWNtUUZqVlZ5d0FDNUUxQVV5cGt4SXN4WlZkUVFoVFVNaVVLaFF6aEVMRXlBQ2cvQTZLcW13SkZ3d0VGbUdyTU1lT0dtVE8wdmlnRXRrQklUTGdXRUExNGFVODdZUVRMN0ptaUlHUUVDVUtGQUFCQkRnbFFVQkVoZ0MvaGRCYXpkbDFBMFVsYzE5eWhxNnF3SVNtS0VBMG1yY3JNSENoUVlEQWhteWhaRUJDUXdPb3VnVTBjekFFQkFSQUlRdlpHWGdCSUJXUXdRZE9wYThHUmVLd2lxdWgrWFh2TXBoY3lnamRSc0VHdFhhK3NScjhBTi9Mb0d1MEQ1cm05ZzgxRDBaaE1uNDBGclVEMnNYNmpVQk4xZExLTXZ6ZHY1S2pDT0VtTk9NeGt4MGtRVE1vT0NPWkJRSXlhQkh6UTNNSE05NHFFdytUUkRJQ1FBQkJKSmxZRWJtZG1BcVlqSVhoajZpNG1JZU0rWWU0Z3BoNUFjbjBUMFlwb1J3UXRBaDJHTEhvWWxieHhBaG11RklaTGV4cTFGbXRBRUF1VVlvQnBndEZtN1NXWmJSNW9kWHJXRWxTWkdNaGpRWW1LeVFaWUhoazRUbUlFOGFYYnByZ1pHUmh1WkZQaGlSSG1XUTBZTFM1bmM3bWt6NmFKSXBoZ2VPUVpkU0lxVEJrV0dKd2NZb0haa01IalJGQVNITWRCQXdtUmpNeG9DRGFaekRSandaRXgrTTJBMHg2SERGaEVBSVBORkRreGdLakRnc01LbHd4NFJ6RXhDTktDMHdBQ2pBb21Bd2lNRWlNd21FQllsT3NZcElaaDhNZ29rbUNCa1lDQ3hpWVFtR2hjTkY0d3NMVE1ncFJsTVpqVXcyRlFjTnpFWWdFWXFNTWdKSWdpS2dNRFFRQVRCQW9NWGdvS2h3Ly83NUdTWGdBOCtlME1GZTRBQUFBQU5JS0FBQVRrQ0l4eFo3WUFBQUFBMGd3QUFBQVNFUlFabUV3RU5DWUFnOExBRkJBRndDcmVZQUFwZjFUSkcxSVl3S0FVQkNrd3dGQUVBb3dxM0xnbWxWeS9UZGlZTnM1YlI5azRVQndxQm1hSXdLUElPRGdOUnhUR1E1b0oxZXJEdEtpN2QzelRxeFhNOWJvekNjaitxVnRsZU9IbjZxd2FuQkZucVZZMGRoTC90Y2dLajUxV3hnaXJWcnNxVit4ZGxycVN1TlBIRUZ6c0toaDhtTnJWZjFsU3lIOFoyOWsybk5YaXMyK3IvUHEwYVJVc1NkbGVick01bEdHZGw5WlJMNk9uaTBya3I0dEVwYlZGMEFBQUNzSXhMenNUYVdhK01ZZ1hvMVJTMkRDZ0pITkFvRTh6RVFQVEQ1REZNbndlQXc5aDJqSzhBK01QUVFndy93ZERDckhLTUo4RzB3NUJHakJCQVhNQkVUazdWcE1DRUQyR0k1cnlQb2VENURNNkpOQlI2WjhMR1cwNXZCK2VyekNTRWFBWGdsVktYSXg4S1BFSUNQMk5ORVRVVkl4WktNdFd6WlEweTRpQVRLWlVBbVVNUm40MFlDSm14QUpueEFaNmNpRVNGV1kxa3BBQllQYW9zekZSRk5zU3gxRU5ZczJ2R1dzQUJDeHdJRmhzRUFoaG9ZWUlGbWVGaHVnSWJtbXErTUVHRFVUY1NDdzRJTGJzRkJBK0RBWXhnTE1oRG1KbUVnUUtDd2dDUUZPV2FHVW1WaTVqbythT3Jta2o0c01HUGk0Y0poQThWQTlENVVoZFl3c0FMZ0paaUFNQklJbjB4b0VpRFozT0loNEdBakVsQXpJQVFPQkY3cndBQUdKQ2FaeVNTNkdXa0FLbUpCTXBUNkRBb0tncFFLcVZnMERibXRaMzFIUWNHancwL2FBdFM1WndOQWhDSEdJZ3BFSk84NnI4U0NjaE1LZHVSeHlIcFZTeEtVNTA3ODNvYmh1bGwyNHEvckdscmhZQ1FVaHBCQTRqbnFCdDFUbkFJSzdjUHdZL2s1UVUxQjNLWFN1S1F4eTV5UjFQLy8vLy8vLy8vMy9wTHVkL2xEYnNjaThPeVNOWDUreE8vLy8vLy8vLy8vdTNGNUpJNFhQUUpQeE9hanorU0tYU1dWV0thQUFHakJ3R2poY3dUcE1zVGZjN2oraTVEZTVTelV4RkRHcE96SlpnRGMxWlROZzhqTmdWREdZMURTcHBER0VLREpJRnpDVUdURWNuemRnVE5abk0xY1FUSWlyTUJwRXdXTFREQURNUG9NSEFrMENjakN4b0JJN005a2t4Q1l6U1l0TXJuQWxTUnJ4VUdjUkVZU0Y1a0VwbWhWbUdaNHh4SmpLQTNPQm1NdzZMRFdqRU15bDgwZkdEVmhRTmtqWTBFWkRVOGROQk5vMVl1enZCb09peDg0eXNEQWgyTXRyUTBRdkRDNDNNQmxZR0JVeTJTRFdKZ0FxMk1kc1UxaVN6TlNlTUtDMDBpTmpEQkNNSURnd1NGVEJKUUtGaVpGSzRCRnhna1JtWVFRSUVrWkNMcHBJNW1GaUNVQXd4cUl6R1pITmlBd3lzRURTNVFNb0hzeU1IVEd4Qk1GbDFNQXdVTkREQUxNSWkweHVKakNveFJlTGRBb09EZ1BQLzc1R1NOanY3VGVVYVhkNEFBQUFBTklPQUFBVGhSNXhZdmIxRklBQUEwZ0FBQUJBd2NNbkJJd3NEeStiQ3pCd1VKaENzbE9CdTVmOERDUklCSzBXQllGQ1pna1VrUWVEQTRBaEtZSkFJT0Z3SUI1VUFKWmN2R0Z3T1lCQXBkc0ZCdEdwUk5samZnSVRBMEpMQkkvSzRZRW9naHhsanVNR1VPTC9LSE5HTDVKUEljbmxWTUZRVXZ5UVNNRWdCVll0OGtVa3N0WjBvSVNuUnVhMGo5U3dZc01zTXdKRWI0MDNGTzE3SFFST2JPM3l0cmF4eWRmV0RwK0Z6TU52dks0anVuM2xLSXpTMklUSmFhVVJmdEpOMG43cEp5R3BSMmV0M2FzMzM5ZHlzNFoyTDJBU2dCUXdoUm5UUGtCck5LZDdBMDdSQURuNGNmTmxNWDAwVGgwakZQRjBNTW9oNHhWUUV6SE5CbE1ZNGhZeDBncXpMTkNhQXhYcGg4Q01HQTBGZVllNFBoaWZCbW1KOEFHYzVUR293UVBHd2o2RUJrYi9zR3JKSmlBR0FCTUdyeHQ0Y2JjUG1kZXBnR3FQbjRTbEhPc0J2c2tlTERIcG1CbU1BQmNvekZsTjlFRE9qYzNsVE1DZXplM3d6U1VONVFqS2prMzVUT1BSamIvWTl0ak4yelR6QTAwd2tORUV3aUNNYk16bG1zNGVBQ3FRejlBSGh6MmN6cUJUTnhBR1JQRWlOakVNWmdQUTJRZ08zcE5TdEdFaWdobEZaa29nc2ZCcGN3SzR3Z2M3RThqQ21wZkNFZ1lZR2JSQ0JpcG5ISnJKSmdBcGpaUVZDR09MdFdNc01CZ0JLc3dSMHhDczBDMDN6VTNVODE4Z3lvSU9oQ3lJeVlSSDRzc1o4Y1lNNFlvbVlZT0ZBWUFMZ0k0WlFnTUJrVndnVVlvYVl3aUVGQWNFVlJRemJjb0NDSU1ORVM1b2NUWWNNQUFJQ2Y1T0p6M2lUWGFrN3pLSG9zMkhNYUlyQkFURUdjUU00VGxybm9LNnAxSzJVTG9abzNXUXMwZmgwbzdxa1pnL2pFWFdwM0xicStyM3k1bkQrVXMwOWJzd0JDYmNLdk52STM0bGtQUE0rRGlReGZoVW9lMlZ1UFRzNGxMU0lwSzUrZ2tIYWVYenNBUnEzU1c1NjFLWi9PL1VsbHZWTFdGNEFBQUF4Z1BCRUdOZ05XWkxCdUJxZUsvbUcyL3VhdFNtUnF3b0pHcm1DdVlSUUxCbGVFOEdWR1ZVQkNOVEtZRGVNUzhZRXdxeEVqcnBETkNEUXo0WERmU3JNWmdNMzlQamJTZ0pCNEZ5NFpDTmhuWU5od01NRkpveitIVEt4SU02QkV6QWR4SUJHVmhLWk9WcG5hSG1XUzJIR1V3aVhERDRnQmdBTVhnd3dPWHpDSnRNeEs4MENDakE1a2E0Wk9CUmhnQkdWUTZaWkhZWUhEV1RUckt6cmF6NFIwYlRMaEROemdQS01Zc0lJWnAweGdTWndGcHRGNHNrTnl3QnYwM3lNY1BpdE0wa1V3eW8zdXNlZ203YW00Q0hCNkhEUUdwR0F0RVlHYWNaS0NoeGtCNE5WRFdaRTB5Z0l5b01XYUdkUkFac1dzcEJZeWJsUU9GREFnRmhVSWtmd2NHTWdVTWdZTVFER1JJUXhVd1VlU0JDd0pnWVhDbVAvNzVHU05EdjVRZXNTejNOTmdBQUFOSUFBQUFUY0Y2Ulp1N3piQUFBQTBnQUFBQkFBbUlCZ1VrRkRZQUJzYVNWQndBd3BSeTJJcGlLalQxbHJBeStMSkpNdDlMbUttQUtpSUFIQTFNQklFMk1CQlMwcGZKVFllRWx1VmlBVUVZY0FQQlY2cnZWbUVBTkZRd29KbWNQSkNTK0QwZ2t5bW9MNFNnVXhXa2x5L2pXcFdqc2hPWkUxd0ZGbTJaNlh4aHhuVVlMNmw1WmgvVUpqRW5TWWt3MTBWMk9EVHV6MldPeWtpNnMxU083S0gyZjkzYVZ4cWVQd3UzQ1lCdTA4YXBZRm5IWGNTY3c0NmxQWHlyVFU1SHFPU1M2cmVBVWhnQ2pCak5OaHVKWWg3c2lKKytoSjRTcUo2RGRwejVUQnp5MFp0a09oazhqSnZxZnBnY0ZSeTRVaG5jY0JscVBwcGdZUm5FSEJsNlNoa1VkaHF5UXhvVU54bk1yNW9DVWhrS2s1bWdEaGhTSEpqbU9wZ3dDaGxDWlJvTUFwajhNNWhpU3hnU081ajBHQmc2VGhxU0FhU09tU2labkw2Yk1vR1NLWmdvOEhjUnQ2QWNpd0dhbW9jK0dMZ1JqaWlhb1NtbXlCbnFLWklmZ1ZCTWdHaTM2MlRFQUlMaDVtQWNZZVlKS2drWU1mSEFjZkZwVEx4RXk0VlRrSkFzd0lZTUtRd1VDcHpHS2hCa0FtWmlPSmhBV000d2pGUUJRUUFQTjFReVRRS01Xdkw4amd5cEdtUFNQSWdrWXRMRHFwVWRpQVlhUGFvd1VGS0hLOEhqTWxCMHFqUkVFdGxYenhyb0xxblk4SVNpb0dhQ0tqQ1loZkl3UkJBRW8rd3BIOWFTWmNVa0xPbW55U0pCWUpIcEdFcklVRUFJUnFEcWVGa3ppVERnQUtnSGxHRUNFR2xnMEVocEloVVFpUUx6RXpJTU1nUmNDRWxyTDlva21VS0VFQW81NlMyYWhKZlZtYktHdU1CZVZNSkJSbWtiVmhRQkxSUnRTZ0VJSmV0TlFjQ1NDTFZGOVlnMDZJWHB1TFNoKzVoLzRYTjBOcXpSeTJsZno3TXBqTVBRengrWlhoV2k5cU9TcWEvNDVPMDFOSWFIbHFmcTFLdVZKZ3FnQUFBQUhhWUFvVEJrY2xabWIyT2NhRjZCQmo5bCtHQXFJQWFEZ2g1aW9GeW0rUGthelNKelU3R3h5d2FPR0pqNUVpclVNekdBd0tpRERJcU1LSE15QVl6RTRVTU1ENHd5RkF4MUMyVU42L0hRaEl5TXdrSmdJQ01tdEprQ1FEd2tsalhxQUUzTjJkQ1JRMDBNeVZCaEF4aHNRdERHRHdNQVFlTkFjTkVDQmdNREFURFF6QWhUSzBSNE1aWTRZa2FPQ3dVcUJ5Y0VBR1RMelRvQnhrWktHUUhoaDRrT2pRSVlDbHRHSEdERnRmQlI5T1FrSmtoeE9WQU1TQUFnd2hMYU1DaEt1eXpRc09TRFExWlVUSVNnOFpBSURnYXFnTkFydFFDQUlHdzhJRGlnaHJwVkVKME5PcnIrSWlJTkVqQUlvQXQrUUNBWVNKQkJpVFpnU0FnUG1oS2lnRVFrRi9tRUhLV0tVc0ZIbXdVRkdkUmd4SUtEUkl1cFVYa01zUEJhNEZrRGdxVFJDRFVtUkFJUWttSkxISUlHLy83NUdTWmh2NUdlY2E3M05IU0FBQU5JQUFBQVQwMTZRb3ZjMDNBQUFBMGdBQUFCTE1teUxDcDFZY3d3SWFpaFllYzFXWjR3WmRXSVF3UUFGZ2hyNUlYV0dra0dhd203V0h3UUdsU2tRTUtQalVHdzdrY04yYkJVQ2dCbWh4amdSYnNjVUdBRGhETjYxNm1LQkRRd2hFbVBBR0FBR0hDQWFvWkFZRFNvRVZNc21uUVlJK3I5dlcvVUloYTZKbVZYNmVLdWU2ajEwY0VPQzZ5MUZCRTUyUk5OYjl4R2R0SWJDNnJqM2FTN2hkNjdGQlNXNlhkVENud2xDWUNvYlpua3ZublVFT1dibGhlWm1ZczZHbzBjT1o1YUxocjRzQUdoNmRXWTJhaTVqTURyR0d5VmtZS1lVaGh1a29tTUFHc2ZqWUp3TTVHbEllY21ReDVzMkdBSXFkMkxaNDBjQUJtbXRqR1piT1JuOHhtbWgwWndYSmkwem1hVklaYkh4c2xUR2EzR0VpdzBYZERWUnBOKzJBNWVNV2JHbG0rWUhIZ2lINWlNdEdIVU9hejBoeTg5bkJoSVlnSjRRVXpCaU5NakNjaEFwcGdObUlTY1lOUXByeGJtQXlnWjVHeGdFam1VQldZS0NwalFYbUhoU2VwR2FCeUFEUm15NWtGUmoycHpCaGpaUUZsandFNWdVeTVrYVdwZG1EUkFROEJFQml3NGhNQkVNY0hHVlJBWVlpWVpzZ1pSY2FvT1RMRVZodzhJQjVqaDZmWmp5aGxVaEtHQnlZeVl3MHBvMHFnS2l6S21BY1ZNRTNOTEdNMktHUkpyV3dHaEdGRkNCV1pZNnYwVlNBcThCQjhHQzBJWUZpaFVlZ0JZQ0dBSC9RZkJRUXc1QXlwb2tCcUNLdmpaWUNGdzByRkxGZG9NbGdERFJpQjRjQlJzVldsalNBb0hid0dnQ29NS0FTbUFXRmx2UllLWUVJSkppeXdOQkRvVXhpczJRMEFDekpGd3dpQ0FoZXB1YlJURkZ6UUZTN0NHU0I1Q0VnTkNVaFBhUWtHR0V5N3BmbVFCZ0JCRWhrWkVnb3lsYTN5TkNYNktxd0thcWVrRHJ4Y3A5bzAzYVdPMjJ6dnI4aDVlNlZyR0l5cGltS2tJMDJFdnJEY1BMMlR5Zi9yWW1zNVBMMkFZUFp2SEhNWnpUWlN1M1V3SUJielBNZjVOSGFBazBNMkhEUHBlOU5OUXR3eWhUUVRPRVBJTWRrSTR6WTBRUUlHVVlRUTJKamJtVkdMMkJjSXhNRE1EWU9Rb0E1QnZ6QnIzTmRISS82cWpDbm5NanlZMld4andySU0zVVlCS0F4RU96S29PTW5qUXdxSVRTNlROcG1JeThJekxnR01HaWN6bU5qS0JUTXZEVXcyaURHUmJOTUdzeVdXRE15Zk1VcVV5UWZqS1l1TTBsdzFraHlBcUdCQWVFUmcyYU9qUU9RTkpNNGFOcWRVdUh5QjdlWm9uNWpYaFltbXlQRzBKaTI4MGtvNlFvb1NDSWdDbkFRREhnSVEyTVhETldQTmlVTURITjJuTnFpSFM1dDJ5Y0JOY0EzNHpoRks0eHhNb2hHTFRnWmtaQXVkU01kOGlPTnpTQmdjQ0ZsNW1CNW9Gb2xhTUFUSVhSd1hZWThOeTZNSVhFZ2drTmM0VkFFQkF2Q0xDUXdxWXNJWVpmLzc1R1NPRHY3ZGUwSUQzTk5nQUFBTklBQUFBVGhsNXhBdTcxTFlBQUEwZ0FBQUJDdE5SUXlCVXlZUWRLdUtoQVk4Z1lZV1lVR1RTVEZnRUVabmdRR1BtWUNFUVlNQnBGTmVEQkRXbE8wKzNpWE9nbkpneUM2SGwxaXhBRU1FZkpEQVhHaXc4YUFyQ0pPb3lCaDRRQjBUZ1VmTFROR0JSa2hCSjlLYnY0TEJTM3paazMyUU56YXd0TlBaa0tFeEJFcmVzSEgxVkgranJWRmNzN1hoSGtFcUNScks2a0JLdkg4Ym1YUFpYbFlYYkJLZzZvSkZDVm16NzRSQlFkaFNnN3NvcE1WVzFRTmJjQkttN0o1VkRhMVhiVEh2UTgwOXcxTG54VkpJbkJkZHdZdFg2RUdpc2E5TG1hTXlxY1ZjRWJRa1ljeEhXZExuV1lIV3VQaHdZU0JXWTBnZ2Fpa1laTEpPWW9sTUFTaU1OampNU2gxQnBjR0JvU0dYWnFHTmFmbWZoUkdxNHlHSzRpbWFneW5NekJwY2FMZ3hzeTJaSVppSWZOVlJURXlBemt5R0NRMUFQT2pMU1FlTmNDRExUczJvQ05tS3pPelV5WVhNNEp3WWVuVGtvYUZqYUFhc0ltbWlJdHVHWUlSVmFtZ0JnQlNZVXdaVTJaWVNDVEp1VVJnQUpnNTRwRE00VEFvdzE3dzRFRUt3d0VlVEZGVEJtVWhzQ3htbUppR3dHbG1mbm15UEd4ZEdxR0Fsa1Nwd0NQTzVHTGNvem1MYm16SUFnQ2JRUWFzV2kwR2VDdG1ZZ0FaUWlYc0VSSWlWaWpRMWlJMU44eFlnemlneTdjUmdqRUVJY2hMNnM4THdCaFZFY0ZJeWdJWkVDdnh4Um9JN2F2QzNJWENMdUlDVFNWbUN3SlhNTkdKQWt3RXdJUmFpYVRWbE1aNTdDWUd5VUZBQm9LeVVIRzBlRnFtVklwS0NKUUJrSUdHSm1oZzl1aFpoTk9WSmlHREJzMGU1aUFrTGJWSHd1R3cxYXBnZ2lNRUJJRWpCbFVuZ3hJamtJUTRjQUhRcVA2djFYZ29ZWE1UbkRCWWtOcXRsZnVCYnNPU1NXc1VqVGh4S0RJWlFYV21Yc2FVbG82YjNONDF1ZWJxOVVLVHNSOWRhQm4vZFdCMStYMzVlYVV0WXhrOTNzdmljWWhISGhwSlpaQ0hBQUFBQUJzQ0R1R0gyVThZa1pmNWoxRHdHamtXUVpWeEFoblFHa0dSVWFrWlZ3cFJobmptbVN5UGFZaDRneGtwQWNHR2lDa1lhd0FwaFBneG1HU0JpWVk0ZlpoMUFubUZpSUtZQzRiNXF4VWMrbEFPTU5Vc0RhcTAyRTdQYXlqaEFjeDhMTXNFekxtY3lCc05ybXptNHN4bGJONXZUb1VrMk1OTUZEVFFBY3l4VU1vQVRCR0F6SkdBQm9ZNnZHVkxKdWNLYkNxSE5SaGdMeWNlUG1XWFFhSm03VlJoQ2lhaU5HbkJoa0tlTkJBZ0dBTU5tZkJJS1RuU29HajRuWEJMd09jWU9HOU1SNk1xUU00aUpsU0E4S3JqTkN6R3VUenh6SFFqQktqS2FDSnlaOGFUT2pCQmpEcHpMa0NZaVp5Z1ZESVJmTU1lRGhCbzRZUWFMT2pRSXhJRU9DRWpvT1ZpUmhKcERJaEFwNWhZT2pta2NvcVBJdy8vNzVHU01odjdTZWNUTDI5UlFBQUFOSUFBQUFUV3Q1Um92YjFFWUFBQTBnQUFBQkJpWlV1RmtSZzBKSzNNVEFORVBFblFBQm1DQ0dGSm1SVEdPQUJ4UmU0a0xBU0F4cE5TOE1HTHRhYzFKQVdnc29lcDVXNG9HQ01xd2d3QTVKTWhCcUNEeDRpR0dFR2cwWUl3aG1oWmhSd3FGUzBDZ05wSUFDcTdYcVZRUXdMZmwwQVFCTUNDTFNGb1dRV0VoMTFvUFVRQUJ1aU1pRzBBZ1FEQ2xuSnUyUW9PQzRlVXJVTDBEZ01RaUg0YmpjZjVkVU56Rm1LMGoxTmFwR3V1cTAxK1o2bnBIWHVaWlNxM05Ua0V2RkNLMGdvcGlqaTd0UUxlZ2FXdkcvODdIcHl2WHA5cEdZQjRJNWl5bUxtS2NWd2FJb1BCaXZEU21SOGRNWm54SXhqS0RZR0RRRUdaZFFycGdhZ21HQTJIOFlJZ1daamZpV0dKNkIwWXlnNjVqWGdIR0pzRVdZWlFuSmhSaDdtR3lFbWRLdEdhQVJvREVLSzV5SThaeGFHeEFaQSttanZoczQ4Y0VwSE9tNTloVWJYbm1nbXh6ZW1iVGtHbG5ZdEpHbnVaayttWmtrbWFFcHVaSWFDRUFjbkNJOHpadE1KV0RPRWcwc29NUVh4TWlGcW9SbE1HT0R1YTBoR09EZ3F1QU16TkdDTk1EQlVJeVNZaE9CUkhIaHBBb1VGQVlBQ0NoWXlLc3hhb0VOeEVnTU1jTWlRTmhIRFJZVlNHYllBd0FFRFRCaFNiNFljWUl3b1lxTUtJUnRUdlVOWHlJUmhpQ0JoQlJnUWhoQVJLQlZGSUdVRmxRVXJEQXF5MWVxVk5xaGVuMld6TUFHUnlNUVlBUVZQUlJVdFF5TlI5VnkrSDdhczBObWI3THpiczQ3Z0xnanFFc1lDSTZFSkZIaERGVk9HUWdBRlJhalNsNm1GOWliWlVPaWQ3dElSd2FtQTFHQldyUU95bGxqUTM0WTBwaXVwbFVZWjAvVFpsQTNKWEhBMFZqamF3NC9iNjBqT29JVTNkNWhrNU55OTRIZ3hjaU12L0hsMlMxOTNIbXA2aHZ1M1FTeTVHWDdvWlpiclZhTzNOV0ljcDdGdkNwRDg5TzA5bXhiajkrWXNoNkFBQmpBWkVETVNROW96dFVMREt6SDZOZUlLOHlKaThUR3JNQk1WQVY4elNCeERNb0JiTVBFU0l4TUFEekJKR05ORFlSRXdZQ1FqRGdGck1LSU9FdzB3a3pHREFtTUMwb0l3OUFYelRaak4xbDgyVWtUVjVOTllyNDM2SURZN2NNNWpJRVRVd3FOeVppbUF5d1lQV0IxUWJuVGxxWVNZNW5CMEduUmVaVE9nWEFSa2RoZ3FXR2d5bVp4VTVsUWRtQnlPWklMb3FHekVRM0lpeVl3RXBnOERtUmhrWUtJQmg0SEFZRmxnUW1Ed0dZTUdxc0kwUHhFUVRPZ0dOeW9ITUFUc3RTRFBGY1AwWXRSaGFEaEJWTU5oMHlYZ2U4Q21qWE9vekJsTml0Rll0V2RnREJRU2VDZ3pCakE1WXRHSFVHT01hWUJNMGtPTE9GMWtjVUdod3FNcGdOTEhubC9GeTEwRjBJUVFDTERwNW1FQ01pQXdVT05JcmkzU0hZT2ZSZVprRGhrTG12VEVRVDNRR0k1UC83NUdTV2p2MnNla1dUM014U0FBQU5JQUFBQVRvTjZSZ1BjMU1BQUFBMGdBQUFCSUNtNXA5T3M2MERJWncwSXdueWE4N3lBbFpBaU5Ma1BLclhIM3NkcDJHblVxNFdlTm1kTjdtdXBsUUV6dHdHQXN1Uk1pQ0hWdnJTNlgxYm04RHl0MlMyVERVMVV5cEduU3FIcWFLdElVRlVnMTZtYjJESmE2RFNHd1N4c3VNZmw4eFAxWnFGUmFRVTl5aGZtcEdJZHpqMFhpdkllbUorVmNrYnZUR1VtcDRqR1pSWGljZXQyZERqQWFCRk1PNUNveXJSQXpKNEVUTWZNeXN3ZEJ1QndWa3hBd1N6Qm5FSU1kWVo0d2J5VXpFakIzTURVR0V4VEJJRElFQ3lNSXdVTXhMUU96QTJBL01KY0EweEF3bERGcEJqTU5raHdZQkxNRW9Lc3dWd1hUTElMTmpGRTJlYXpIQUtOVEJNd1dJelFBVkM0aE1meVl4Kzh6VlpvTVdpTXhxdkREb0pNTkFvd0lGREVnWk1tREUzOEt6WFIvTmZKQTAwR1RFSjFNRWdzeEFTQ0lBbWpBV1l6Q1ppOEpqUXlOQ0FzdzZBekhJbkVZSUZnR0FBS2lLQ2x1QWo2Y0JJTE9UTnZRRmJET3hFcE1TQ055SkFCdzFSb0lZRitqZFdEdE1qSEt6RnBqbllCQUxOVWdPUitQY0NPWGJPNmRLTVJoRnl4aGc4WkFRWU5XQlFaaHdnMERidUFDcG1USnBoaXlRYUpXQ0NGQmpFUWNnVUhNWVNNZUdLb3NhTkEwQ0NpUTA4Vk1hd29ZRWFZWUNMRmhZUVlVS1k4S0dKd0lFTU1DWXFZNGM1SmhVcHZTNWpEUVlRRGlKcFdJa1daT25Pbm03cnhyQ3FIR01JQUl3ejk0eTFnRUZGc0M1RExGZ0hKaWpQbE9HWmw4MzRmeEZScHJpSThKdXREZ2xyOElkVmxaZ2dTa1dGTHBMbHh1YWJOSVl5NWpkWC9jUnhHZnRiZGZUbnRiVjIwdFJOT3Vta09vSGo4dWxNUFFUVW5uWmwxUjNJRWcyRlJldEU3K0V6UFZhbTVlNUV4RlpaUllUZEhucWxnTjM0dGhUWlZMR0FBQUFBQUNZOEdCbVUvR1BCNEVxUXpNTGhJZWkxNE5qTW95QVJEUmlXTXVOTVAzeHJTaUdtR0ViWnQ1djhxbVVqMGFRSEJyQTJHUlZpY3JNWUM5VG9HczFHYk1aZ0FHNm1uMVpwaGFhS2ltYXBnTkJRaFRNR1ZqSWowMDlOTnVGamJRUVduREVoOHpNNUtwRWFzUkdKS0ozOUNFUjUyNjZaeWhHSks1djZtWlE1Q3lhWitWanhXT0h6SEREZTJ6Y2pEblJqQ1BUeHN3STJOSVJQZS9CekVCZXlzd1lPQ2ZNK1lPMGM1b09pU29hRHF4dm54aENKclRvcUlOQ3ZNNk9BQW9CR0FReE5XRk1VeU5JRk5pTklXaG5oaHBYWm15NUVQUXFCUXhISk9kSE4xRVFTVU9CQXBnU2JRaEFFRWdCYWRHcHBEeHJiV3VYOEwyZ2tHTWdob0FCajZlSXNMUmVXV2duU0VTSlZuY1FGQUZLaElBOEpiTlJSbWdCR0JCWjA0R3AxSEtGeDQwN2tIdkE0MlRqUWlKdjNLcUtMeG1YejJseUxSVVZzTElqOWlmLzc1R1NoaHZ4VGVjbmJtOVJBQUFBTklBQUFBUzk1NXlBT2FadElBQUEwZ0FBQUJHdFFkbCszcWoyNHZBRUFyRnhqR25mY0dDcEhEVEVuK2ZaOW9pNE0xVnIzZHpzR1JyVjZscGIwN0RObm0rNVhmejFaeHNjN1p5N1czbG5sbFRkNVp2ZjM5ZnJWekt0MUJnc01HbUhpWmx2QjE4em1SUjJiN0ZoMklXbUZUYWNOWXhqZzJtOFhBWWVmcDJKNm1Yd3dIaU14VThUYXh2SEE2QVM0YWxSQmdRbm1EQWVSSUlFS2sySmZCQ21qYWEyTUdBZ3dpQnhaK2dBaENBYW1JQnNZL0d4b01CR0V4VVpJR0lCR1JpMFBBSXhrUUZBUUtNS2o0dzJnekdqek5paEF6Y0pURG9DTTNGTXl5RVRUYW1NdGlFc0FVNXlNMWhBRkx6akN4SEFPbkdJVllPbW1FUG5XbW5UZ0d0SEdkbUc5TUF5bWRKdVpjRUZuUUlJR3FlbUlkR2pYR05FQnpNZEdHTFVsRGtGTmlBR1lBR2syWTBRamVFTVRKcGhwTURBNkFNZUNwZkdISUlMSVZPR09CQW9KVm1Makx4WkVnc1BDekFCMEJyb0tXTE9WQTR5eTBnRWVBZ0doSkx6TXBZY3BpbkEweGhyT0MvaWdyZ002YUF5ZDBvRXR6VnV2UzBqYzNGZXFIb09hYkpvakVtZFIyRHFXR213VFVabllDWGRGMWJYdHBYWm5CMkpJTlVxR2ZHelo4dlBTOFVpKzRkV1NuUTZCMlFtanRPVFR4bzFjUnVhcU04V3dKNjgrekt6M2MzYjNXMHRXdmJpU3VXaVlwTWZNVXJtMWd0TXFDQUFBQkdHU3FiZnRScXoxR2d0b1ovTmh6ZEZBZ3VtOG5nWVpGWmxVMEJ6ME9GbkUxUXh6QXJ4TkJKUTNhRGpHeERNTmhvem9zRFFSY01haVF3c09nWUtqSmd0Tms4OHowVnpHWkhNSEY0dzhQREJoRUxPbU15R1kvRXBoVWxpb2FNWkZzMUFVakJRSEJoT01kSFkxZ2lqVUJNTTdGNHhnQWhwVW1hU1dZaUNJMFBUSDV3T3Jpd3cyUXhDQnd1bXpSb2pNa0Fnem9OakNRaU1SaU1IRFl4U0xRY0ZUQndrQ3cyTWlqME1kQ3dnVkprejgwMlE0Z1F5cWcxUlExNGtVbUFMWWRLUVp3bUZrNENIaEZGZEFEQUdFVUhDQ0ZZMHlna2VsbUhRa1RJRExERWdYMkdrQ3VUQUNnY2dTZk1DWURIQVkwWkdBQWdPQUZ5ekFpM1ZnUXQ0c2N5SU11R2lrdWtPRkFZd3JBdEFMRUVSU3FIQUFNd3lnQ0ZFQUR5SjNLT3FEdU9qd25LbXV5cGZha250amJ5eWwwNDJ4TXRHR0EyUkpnQmdndlFtdXJpV0xsNHVpS1JpY1pRMkdUTklvYWo4TU1WcFdtNHlmRFdDOGltNnN6b3UrbFhKR2RLQVIxZm5GR1ZoV1ZQNjZEdVdYd2h0ckFBQ0ZBWk1BQnlaS3dvbW1nRXBremh3QkdCN1BrQW9ONUZpNzNxZ3A4cDFqdTIrRTc0QUdBY0d5WXV3VFpoTUZGbWlHUTJaTTQwaGtZaEdHQ01aNFlIWUo1aWhBcm1GQ0NXWWxRblpoNmlNbUE0RVdZM0FqaGdRQ1dtVElMR0Q0WXYvNzVHVHNCdnpnZVVjem1qZFFBQUFOSUFBQUFUd2w0eGl2ZDIzSUFBQTBnQUFBQkdMNGlpRWZqQ0p6ekJ3NHpFY0dUWlpQVEdZRURCNVVUTVFxVGJGS3pEVVJqQVFYREFBQllLSlNNTUJCdEJTT0dESXBtdFJ4bWVCQW1IQWRtQXc2QTVvakl3SlFFQVppOENCanFJSmo0R2hoUVJKaE1NQVVCd3hTRnN4REtNcU5NWnFnV2NaU1FiZEJXWlhHRVpPSU9QRElNRVNZY0F3WUloR1lHQk9MQ1NJZ2xNaXlFTlhIVEJqODFacE9JNFQ2RXN3UU9ORE1DSTNOR1hUTGk4eGQrT1RFVGppc3d3Z1BMc1Jxbk1tZlRGeTA3VmVNdGFocExNMERoa0pNcU96SkFRVUFURVE0S0NnQ1BRNEdUQ0dCTUhISmpvOGsyWTZGQ01PSlFkVFV4d1BFUk9hbUFtRWl4aUk2WThEbUxFWVllb0FUQ0JOQktPQ29rU2tvV0JoSUNEUkVSbU9Bb01EaTI2TnBlRXdBTk1SQXd3cEVnWmxpZ0srUXFKQ3d5R0Y0akFUQndNdnF5MUlGS0ZLSmlLZUxqb1lyVUpRT0lMcGRwMVFZQUNRQ3RCTlZ2ekh4RXhFVEVRd1lJRWc0Zkx2c3JVV2FETHk1TUxhekpJUkJELzEyZjUwVHd3SkJhWmFXb1FGbHExcklidHZGSzdxUngwNHJFNEFtcEpMSDlyVHJpL1B6c1VqSDBiNlZhMU5XZ0tXelZtZW9JakVwZFl5cmNtc2JtUExGaXpYcDZTekNna1pWVEVGTlJUTXVPVGt1TlZWVlZWVlZWVlZWVlZVUkFBbUNRV0dncmpBMU9qVTZ5emVSdWhvYURYbG1BTmhKb0FYUmhrdGhrNE94aThjeGpxSUJpaVdSallMSVFGZ09ONHhkQjh5QUJneEtIc3ltQ1V5T0JreCtBOHdKQk13WkRzeEVGVTRNS2d5S0FFTUFjSVRjd1lJNE9Kc3dRSDBDQndZV2lJRUV1c0FuaVVBNjM2bnpDVUFRTU5SZzJGSmlxSVJnR0F4SUVnWEVNSUhjeE1DY3g2Q1l5SUc0eVZmbzZtRzR3RExBeE1QQU9BUXdnQXdEQktoSU1DZ25NRVFLV1lZcWdNTUJJaUkwOVREQ013QU5ZSU5BSmxJVU5BQWNQQkRNWWFCR0FIUnZBNFlwbG4wSEpab3lWNU5sTVRHam95QUZNQkhRRTNHRGc0Y0RNV0xibDFSSXRIZzJKc0NVUUJnNHU2WVVJWTBVSkJFNURER1RhelRMTVE5MlBIalNnVEZIZ1VwTVdETHpGMGtkRWNJYmhCaWdvT0V2UXFDSlB5ekdwQUFWUm1QRW8wbWRHaVF3Q0JBY2JFQThHQVFDWllNV1FFQVVRaDB2RmVRUE1yVmY1WWFUd1NuTFROT1NVYnRLeS9waDBaeFpTMERXSGhvTUVFMmJUTDl2ZkVreUZTTmxUU1VCcTB6ZVE2NURDV2REaWd5UndHRnc0SUVOUjBBbGVORFlMZ1dDWWJidFptNDNNUG01TS9LS1dsd2dkeTVZNG1FcWdEVWNqa3psZGw5RlRYYWs5WDV1L1dsR05KVmtsNnBHKzhrZkl0dTNtQ0FBakR3bWpZOU16UDBKRE5Sa1RjSTR4c0ZqTkFnekdkQWpUWktUQ2dGQlF1akFZUC83NUdUeEF2M3Rla1lydTljUUFBQU5JQUFBQVRncDV4ck83MVVJQUFBMGdBQUFCUHpYQURqS0l1UUV3aGxtV1FqR0l4MEhJd0JMOHdKQkl6cEgweE9ONHhmRllJSWt4TURvQWpHYmdnaVo2RVVZOGhLWmlndWFZOEJ4NGJpTkhZUEJrWjJZQVVHVUVCb3F1WUlHSndtQ0NKaFErSVdZMFkzTVVoREtxQVlWVEFFOEN2aGo5R2FvK0gwODV1UEFjUC9uSnZCZ3FpWmJSSFJtSVpnR090aGhpV0NDSXg4aE1kSWpBMU14eFFNbFB3VTJCeStZSU5HUEQ0Q2JqSFI0Qk1KbklxYmdIR2VrSUE3ak5iRDgyRGxoQWFtTTlUTzFSTWU4RE40aFBBazJCRFprd2hteGhrZ3BnMlFveE1LY0JSVXR1TEl4SXdBaEphWVpFaFowWkdlUUVqb0JRYWVNbTJHUWdrRE1FSFV3VFRBeTFJSWtIbFFvS2hBYUpMTUtwcjVSRlhjbHJFR2NKbm1SSG1GU0E0eXNzTURtc0tsb2dhQU5DQ0dBTEpGMnhnZEVwc05EWFUrc0xlcUtOSVhXMDFUZFFaSXRKSlMwdGtDRXhGV01rYlhTcENSb1hXbktUZExPdE9jNUROVWpYNTFlQ2lxZ2llYTBqSnN4VU1IWFNLa3BxWExCQnNpQVBpd05wa3ZxVTlQREVYa3NwbDhNU3ZVZWh5U05qY21ubDBUaTdzeGk3VFN5ZWptVlBuS2ZqVnUvaGNwcUM3R0tUa2cxTEx0YTNWMHFURUZOUlRNdU9Ua3VOYXFxcXFxcXFxcXFxcXFxcWhIQUFBQUdnQ2VSbTVONWdnU2h3Q3N4c2MwcG1rZ2hzK254aSt5SmlZdXBnYXF3NmdwbHFISm9rTWhwS0VSa0laSmxlQ1lOTU14Y1BNS2JSaTZ5YjZKbWRXNFZOaWhwTVBSREtYb3dqMU1iVFRJRVVCVnhsZ3daU0hCUWVMQkNZUU1HSWdnR1JqQjFBelUxTXBXVEZ3c2Vmek1vSTFRcU1ybXpDeFF6WXJSeU0vVnpDQTR3TUtFQ3ljbGNteEh3NklGbURSUnd4TXpTUktLUXdRdU13TmpSakE5ZHJBcENZOEJHREdCYVF4b0FNTEx3Y1FtQWhTSVJxd1dQUWFheGc2S1lYRUg5U0dDZ0dLU0U4NDlva3g5azhJME9iR01ZQUt3MWxKNElJa0FKVHhlb2VEcVltSERHSUpEaE1MQVRBQWtBQ3F4bWpKcHFKckRvY0FNQVVRNHE4YlZrUmlBWm1SQ2dvRUJtRkN0Z1NORlFpQ05NQXdZa21ETWhBQVJUSU1VQVptc01aMFlYekZoNWpnWlpRdHNEQjRKQ0RJdFN3R2dRTVhSclYydm9FQXk3U2V0SzFobkNjN3FLVVBrSkRpb2dOaUFNZVFFbVlqTkdERjFSWVFMQUZLR3V2cytiT1dGbUVGYmR5SnhRckRNcVF4QUFnd1JWQUlhMHdEbnhNdlhPc09paXpoeTVCQk1RbHRTUFNpdmpUMVpSRmJsTGhBVXBxU1NYVGN6TGFTWnRiM083cE12dDRkcDRkeXcxWHgrek8ydVZidHFqdW9CTU16YU5FV2NNa2xuTVUxQ01DVmFNNlVRRUFpbkF4V0dJeGxtWHAxR3JpTEdDQTRnZ1l6UVExVEpNdlRQZ0lQLzc1R1QwaHYzSGVrYkx1OVB3QUFBTklBQUFBVG1oNXhhdTd6a1lBQUEwZ0FBQUJER0E3alRBM2pUeUxEYXN4elNvWFRGQWZ6SWdtZ1lOQmc2U0pqNkN4c2VtaGkwUHhpZ0V3R1BnY0RVeEJFMHk3R0V4WkYwb0hzd1FFQXllUnd4OVIwd21Lc3djSGd4NUNRd2tCc3lhRmNJSVV4ME5OT2FoNThNVEFETEEwekJzQW9VWVlYQTJ0TUxNalRwQTFXOU02WERCRWN5bEVOUkZqSVVNMENkT0VwemsyUTFWak5MYlJ3ekhoRUlDeklCNFpGUWNGbUxFWnc0NEFuVVVGUlVqTXBXQmtpUVBUME0zV0RiOEkwMW1Nak1DZ3NNT0lpWkFDRXNDaUppQnlBVVl6NERNVERFUHl5QThGbVlpQXNIbUxEZ2tDZ2dBWFVaQ0dBSmJNbkFnRUVnb1hXTUJTVXhwRUF3eVpFSGdWV0lTa0NNZ0lCSWRnQ2xDekdLR01xd1pPVkFZUkRBazVOUTJVQzdocUZpSWdIaER4UmRZYWlDRXlncUtVb1VCVWdCaVUvRE5NTU0xRlpjcm9wVElMdGRibkQ3dFNnVU9BQmdoR1R3Sm5rcjBpR2lNaGFncFdpSVZ0amlZWEFRc1VNV2lrZWdZaXNrNlppQnBwQTRBR0JGOFNBUjlVbFN5eVk3WVlGZDF2YTBqbWFsbCs1aVd3Vks4SjZBWWhkdVhyMEJXcEhJSy9JaFNTQzNKYWU3THBUT1JLbWcxMXNiVTFXczg1Sk82bTZZWE1Bd3VOQ0Z0TmxZSE5RMHRNL1dlTWRrTk1uWGFOMGtlTkVrUE5ZbXNHREVPTGdDTUxVbk03Q1dNbUZ4TytDRk12aXlNUzhZTlhFbE1zQVdCd1Ntd0lRWnFId0VJeHBKU210UXdlMFBCeGtsR05pV1kzSkJsOUloZ25OWDE4MndYQUJERFI2SU14T28yQmtEQkJETWhCc3ltWmpSNUNCUTVOUXJveUVKalVwSU5JQ014S0V6SUllTWdFQVdWaGtnTm1WUUNZblNCa0FBZ2swR2ZCNkZocVpZQVJpQWxHWXdxVE5ReDJ3ekNFRE10cjAxdVhqQ0IvQ3hzTVpDTXo4Y0RENGZCSU5NVWxRTGpjQWdzR2xwbWhsRVdtYmtjYVJHUmg0bGdCL0d4UklZYkU0R0F4bFFjRmdyR1d4b1k1RmhuWVBtTkFlWW1DUmhrSkp2SmZDTWtNb3lTQ0hqVG5aeUFxWllJckdZa2FjeFNaeEtaRTRaY3VaSXlBQ3dHWEdDRUNJRVRFRFBFU0prb1lBblNZd1FGYTBCbjRSZ0RuSGlwVmF4VVBCY3dGQUtDTXZxRkNodHlnZUhUM1NJWXNYOFVQSWlZWEFKcXVJdWd4QXQwUzdLN1l2QVN6NlJzQ0Jya044L2JzR01BbUxMZ1lpaWkwSE9BRlUxSlJSbkJmNUFlelZhamx0bVNBY011VVFnZ2NBRUp3aEhDTWMrOEZNWWFhekIrSWd4TnhxN1ZuajVRd0JIWERsTHN3bDVwWEdJek50N0EwYXVXMkFPODdsTFdsc2FuSW02Ny94Q05QVEdIOWlOK3JDN2MzQlhLYS9HNHhIYVBBUW9FMlpWS2daaXFEbG1jdVErWm1RODVoZUR5bUVxTjJZdVFNaGlvQW5HRjJGZ1pOWVlSaGYvNzVHVC9qdjY4ZXNRRHZOUndBQUFOSUFBQUFUaXA3UTR2YzAzQUFBQTBnQUFBQkJoN21NQ0lnWWZnTWhoSUNlbTREZWJZYUJtVmpHUVhTYS9KUmtxREdjd0VidEF4Z1lNR1pSbWNLTTQwSlRKb3lNQ213QW5VZ0JoalF2R2EwNmFvTXBuVmFHT1NZWkxEcGdJcXEzR0hTRUxJTXhjYlFJUmdRWVRTZzFLeitIRkl3NlV6Qnd2TURJWU1CNWpFR0dBMFFhVEdwWUVKbTBkbUpSZ1laR2djSFVOQklXQ3d6TWxJRTB1dGovdURqd2dnK1pBU1o0SWN0Y1prNm1pWndLWXRlS294VXFZQUtZUUdjSWdMSmhNT1pncURyWmhISndGb2RJVG1CdzRNRUc5Z0hJZ21HWGhZcVgvTU1NZHdHalRhQlMrcFZDbUdQbHZBU0pDQWlsU2VSa1FnWVNCb0NMb1R3S1NBeG94b29Jak4zQVUxQk1zT1hMUW9NTUxVeGZjV0RGUUJIRWVqQWlCR0FIZ3lMd0pEQ294SU9LUnVDV2RpZ1VpTXBpb2xwbFJzZUhwdHdDOFVaUnREQmJBb3dud3c1WUFJQW9yR0ZFSVNuT2NpSW9UblFZbTB0LzRQZ1J0RXNGWVVUV0d2elBRTSswRnZ3eTJRdTI0enNVRXVobHczSmF3MzBhaU1kZk41SFFmK0FYaWZXTXFtZDVwOE12QkRUeXhsN3AyWHg2R0lwTlNONTJxeVNVUXAxb3pLNVhOejBDd1pXYVZEOFlsMHFmWi9JbmJzY1FETUxJSkkxR2hSekRtUXpNWFJLazJQVzF6VUZMRU1jd2pjdzN6dVRESUN1TXNFLzh5aHdEakpKS0xNWU1wRXdyd2JERGpDRE41RFFCWVkxaEdET0psTnlTa3h1VXpoTkpPd3k0QlBnNWJZVE1GT05TUWc0c29qZ1FrT0NtOHlhWVRUNE9OYm5nQ084MGF6VEdnSU1la2N5SVlRRWR3RkpUTklPTktHa3lJREFvK1RCaXlNNG5Zd0MwelF4SUM0ek9QRUkwK1dqUFFYTml3NDFBWFRIWjVCVG9DZzdNREN3d3lWek5SV01MclV6K01EV1FvRmlvQXhaOGh4d3pwcG5nSWdHNEFnc0FZd21hS2tZTlVhOGlicm1ZeVliOUNDQ3dQUGhGWXdnd3pMMHc0TWVPaHhZRXRRNUNMQkFjWk5XTktGWmlTSVlaQnlBU0pDZ2g4VFZBRTBEQUVneGN1c1FsU29HTTRvU0hnWW1NbUJCd3lCaVpnaUlPemlnRVpGZ2F3WGVLeWJPREJERENBQW9PVDBMQk14NE1SQ0FnWWw2cWlyWUJtenBEeFJxWUdSbG5DUUdNQ2lnNGdvUUZCWVNNaVRBZ1FDRUxnR0hBTUtTa0N3cE1WSHhBMUpza0NCd0V0OE1qRnRKSGxwMGp5OGhnalQxQVFhc09ucWtNa0FIQlJvcXNSZDZxOU1LbFMwYTFVNlZjcTZMaGlnbGlUaHB5a1FBRkN3d21uS1dmU0VWRXdDQUVka1IwSTFmdGNUb2JzekthYTR4cFU3c3gyS09TeTFPbDQzb1pTeUpHWlJKTldNTFdhQzR6aXdJMG5iVm4wVUFhckRManNidHhaK0lEaGw2WkZhNlV3cFNNRENOSVVOc05qMHdwNDl6clpUV01TTWhjeEUzUC83NUdUL0R2OHRlMEdMM05Od0FBQU5JQUFBQVRsdDZ3Z3ZieE9BQUFBMGdBQUFCSFRjSEVkTnk4emMwckNMREVmS2tNR3NjVXhzUmNURStEUkVJSTVnS2lUbUhXUDRQR1NHQ3lKV1lLSWhwZ3ZBTm1Fd0k4WW9nTEJobEE2bUJPR2tNRlFQb1JNOE1CTlRabTRESWhwd1NFVDV3OWdZYUxtVUxKaW93YndBR05qUm9KbWNLRUdMRnBvN21aSWRteUdwWU96UzIwOGNCTWRHaktuUTM4YU1aWGpEeTgzY2ZGUk14VVVBeHFKRnhtQUNadUdrQkVEV0VLR2dGTUFDUm1oZ2hqS2dheVZKMm1ISllRMm1JQjRCSEIwZUJ3UUpEUU9XU1pETWFEd3hSQndxWjhFaGg2TER3T0dpd0ZBb0hFQVdQSUlRRUdKRE1JTFBvYzBQVUFOQWplRUFIdXM4TUR4QUFHa01vZ01nR1dUUFRuZEV4RmJNcndHVEVNQmRZeVlDR083aEVKWDZOS0tvRXlhcm1KQVV1TWpVdkVRd09SVEZGSktnRGVFcWwybUpLQU5aRkNLYU1DYWE3SU1Pc0VvY3NaUUJJNGlVS0RCeGtmbjZMTFNoRkZOVUxIVDBMcXNsYzlQK0FsRFVERmJXSGloUVlORWtDbVVCRUFWVTFiRWtrYUZRbHFTL0U4QWhEaEUwbHJQRTE1T2VDVk1IQVN1YU1vWFlkU0RHWEk1TVJkUXJKTVJXRlV6c3NDV0Rhd2tyRExGR2NST1BLcXBtd0k5cldsTW5GbGtjVmhXeFRRWEluZ2E4NkxYTnNkZ1dXdlpITWdBVll4aFJ5VFpUSlNOaVF1TTViZzdqMURrSU1XTkFNeWV5UURQWU05TVNvT0F5b0FPekx5SHlOQVlBa3dXQXl6RmxFRUJndWhpZEdCR0xhRTZZZVlqeGhNUVAyeGw4cVphU2dYek9wZmpCdkF5d2VOWlN6S1NjNEJZTWFEREZERW9ieGFKTUdNUUFKR2VoaHFSbVgvTThDUlVpQUk4SktwcDQ0WWNBbWltQmo3RUJDVXg4RkM2d1p1Z21rQUJsWW9CdDR6TTZNT1JqQUJzZUJ4cDlNS0d3QUxqSWltT0toNEtPREFCTXdVT05ZRmpLQVlHaVJoWStJZ2tFbVpreGlZZ0FHb2d4a0k2YXNVZ0ZETTZDekx5OERWUUFLVEJ3Y0FDQ0NFc0VSQU1BSUdSTE1OSEFnbkx3bUpqaGpZbVhoRWdNaUJWSHFZeDhOUjZDQ2lHRTZDN0tGUWhCVEhBVUJCYXNvd0VtRURpRVlXRlVMR2FFUWdtZzk1RUFBVUNNQkJRQUxrUWFwNGVGeG9yWjZ1OXlpM0lPQkg3aml1VUFzMlRBQU9HV1ZCZ09YOGRGVlJMaEJ3djJqdTRMRnZCb09VQnFjSXNGRHdHL2EyUXdBUmZYMEl4VjJXeEowc3hSWEx3ckFGWUFUQkx1a3dVaGFJQXd0c3VJV0tob0hIaTFNRXNDeGh3UVgxWmRRcGxvRFM2d1lFZ3dCWmV0Tjcwdm9NV0JTQWJpemxmRkdqOUZyQzFINVVKWk1ubEZWM3NLUi9iVllkMTNDWDJ2OVg3RmxVRklyQnc2czkyM0FaWTMwU2c1V3BZWnVLMzF0TmpuR3RQKzNPQjdmQUFRQUFBTUFRQ0FnRUJDSkFrREJQLzc1R1QwZ0E3UWUwR1ZlMkFBQUFBTklLQUFBVDgrSXlPNTdvQUFBQUEwZ3dBQUFMTFpJaEtEQ0dGSE1VZ0kwekszcHp1RDFaTVFZT2N3ZEFDVEZlRGtNSmdVbzd3VzF6YjJMc0J3V0JnckFGbUZ3QU1ZSEFISmh3RXVHRVlEd1lPQnFZQ2dpWXhpS1lCQVFjVVRjY2xQa0NpaU1seFZNQ2dDTU1RME1GUklCUU1tc3dUQVplVEtNYzFwdE1CUUhvY2lJUGpCTUN6Q0lKakdZNERPZ1ZEQndDQ0FBVmNrZ0ZwM0JnZEZuakFzSVRBd0tEQTRFREo4VlRoNWdqRlpHVFgwOHpLSVJreG91RlFBU3RMWW1CZ0RCVUFVZkJrQkdsbURJS29Cek1KZmpYSWtqOEtTREVBeHpLRUpURVl0UXFBSmdHQTZXNnF6S1ZjT2VDZ29JZ1BuUytpZkRUVkJ6UXMwVEhFRFRNb0ZETXRTelhzMVRrNWxqTklJRndTdEFJazR4bGNLVEczREZnUWV4TUJFZG9ieTFERE1IUmdOQm9tREVFRnpIOEFRQ081bHFMSm9TT3JpdStyMWhqZDR1ekNTdHdhaTBoUkdVbC8xS0dsS2pkbDdZY01ZRENNdWhVTStDK01XZ01Mc0JRQVREVU93VUg0RkRveGNCWnRub3lobU15dXhEbUxzVFVRa1N1SkE5TCtRNVdmMXRZL0Q3bDB0MHc3RE15Q0JJeEhHOHhWQmt3bUI0d29EQUhCb1lrQVVZQ2dPOVJoWUdCaUFKeGljRDA1WHdzWDdtT3JrOXl2T1NtOXV0di8vLy8vLy8vLyt2VnJ5L0twbmhXcHRYck16clZYWC8vLy8vLy8vLzVnQ0JwaE9FNGtDNENEOWxqWHpCRUFYbmZzdWdLZ0dFQWVZT2dDWGtRb1lnK2s2QUFRZ1FnQUFFTWNIbE1qTUNNWjBIUGNMZk1qaS9Oa1VNTW5tWU1ha2VNc0RxTmcwRkIwUUdQUlRtUkJ2bU9BdUdBeW1HUTREbUJRc21LSktHQUNPYURMWXNmakhSNU1CRmt3eVZEWE1iTjlsc3dnS2dVR2dNQXpBbzlNRWpreFNHRVJ6TGdTTWFrRXdaSFRKQW9NR2g4Q0FZeEVHeEVGakk0VUJ3YUZRMGFNRUppc1BoVXZDZytNT0VJeUNVakJZYkJJR01GQTVxd0dCUTBYUXdpQlFwR0RIcVlKallOSkFCRDVnRXRtSVJzWkRWekZnSUt6QWhQTURuUUREVjVzUmtBZ29LZzBNR0Z5WWw2Wm5IcGxZYUdTeEdaSUNoaXdCR0pTU1ZRQ0xDSUNsd3hpRndVRGg0VEN3YUZBbU5BTUxCTXcyR3c0SkY4QUVBREFZbUdDK1lJSWhoVUhtVFdTYVpFQnBrQkJZTXFEbzRpZ1ZFUUFVRE1HRU15Y0pVaUdpc3FBSUVYMFlKRUJnVUd3K1lLSGhnTVhtTGgrRFFpRGgrWlREcGlnS0dHd0NJQmdZQURvMEJUQUFaSUFpWUVBeXRoaXdWcXNSWUF3V0RnV2dLbkhIWE9BUVl0TnVDbUxFbWFsNWpCZ3JLQXVZT0JBVUNCZzREbUN4Q0ZnaWgwUjVSaFlPV0FDaXFwazZxMTJuUVFwc2lhenBPYUhvNm5iUU14ZVZ4NXVPUHMvTC95TEdZMENnYXl4aHhlWlZyV0hDa3YvNzVHVFlnQTlxaHMvR2Q0QUNBQUFOSU1BQUFENjk1eWc5N2dBQUFBQTBnNEFBQk5tSFlMV1FuRStibVFkYnovLy8vLy8vLy8vYTg1akFtY3hmT0taVTAyK3N5ekdLeldlUC8vLy8vLy8vLy94bWQ1S3V6dHFyTGJ0bU0zTFl0a0FUQXJETU1EMFowdzd3bERPN1UzT1ZBa1V3dXh1ek5tREJNRG9sZ3c1aEd6RXBFaU1wMGlneFhnZ1RHSkNITXdrRU1RQTBHRFlJZ1lFWUJSZzRDOUdNb3dhYm41bllrbVdtZ2JRVmhoQWlnV1puTHJHY1FWcGpsV0dDQythbkdwbms1aWcyTW9tSXhFVERDQUNNWUlreHlMakVnek1oQkVDQmN3cVF6RHhPTTFFMHljY0ROaXFNU20weTZFd3dRR1drd2NVYUJrUlNHNUlNZEloQjM1SUdpU3FGbEFiNENScVl1R2lob0FFS2FZTnBsUWltRmhRYXZKUm1nUW1XQTZZcVBKZ1V6bUJTR1pmSVprVVpHUjBtWm9BUXdvVEI1TU1nRXRPWXgyVERRWUpNeW5jd0VRelVBM003QW95Y0NCQWNqRFl0TURnTXpDRnpCaGRNUEZzeE1VRERnT0VRSVFDR1FSQVk3QnBpc0dnNFZEb2hTQ0M0QU1DZ0V3T0J6RGd0SmlzUkNzTUs0V0JRQkNCaGNLR01ndVh3THpnNG5tSlFxU2tFV1RwaVFPR1F3cVl3RGhDTWhJMmxVVUZyUWFLREU0U0F3SUtvSUpBYUZnZUVDRXMrS2dvdm1DQWVYS0VnRU5BWXNBTXdHQlVaZ2NCMGRXQkdCd2lYREFnTUJ3UkVJRkFBRVJGUUl3MUUwVUdhck5YaVlEQkVrWlkxaUIyR1VvNEFWOHIzcU5JWjhwU25aS05yVVp5LzBPc1JhMndOTUptMkR2UHBRTzI0am1NcWQ1bmI5dFRadEJET0pOS3FDTXhkbmJXMXpvYU1RaHluZ09oaCtKd05VajAvQ1pCTGJ6MXRpaXNBeW1YeGkzRStTdTloWTVTODNiM1ZNQlVJMHkveWZUT09MTE0vNFZFMDZDQmpMRURmTWFBc3N4Znc1REM3Q1NNTllKWXdEQkJUR1lDK01KVUNNd3RnTURCaUExTU9NR293TEFTVEFMQ01OMWU4dzBQeldZWE1qR1F6QU1qSlF1TXJRczMyU0RIRDdNaks4RkhnejZDQUVlREFpa00rZ0lFQTB6TUZqSDROQlIrTXZrTXdjQ2djRWpIQWlNakNFd2FOVEF3OE02bWd6NkRUaXlITS9MMHpCQlRmMXZQR1JFeDhvamQ0U00rT000akZEVllDTkNDVTFsSVRaUjNNK3NRM0szalM2UU1NbE13cWpqZTZDTVpwd3k2UWpSNU9NMWtveE9MRENZUkFDY01pQU1HaW95eWdqQUk2TTBtNHlpVERXdWdnK0REUmgyUnFXaDgzdzBETld1TndrT3lDTkNNTWNuTXFpTW1zTldETWFxRmxSallSbVN4cmtBQ0ptZFhBS01GU1J0MkJhcERJejQ0ellNY0FpTTRCUmlYQmkxcHNINUFLQXJJdzZVeWhNUk1qbXJBY09BV3hpeG1UQm1sSUFBQnhrZUNvRVJFWlN0UThaQVl4QVpNaUxGVk96Q2lqQmkzTFFBUnNBZ3h3QVpVY3ZneUpCUC83NUdTMGh2N25la29EM05Qd0FBQU5JQUFBQVRxOTV5THZiMUZBQUFBMGdBQUFCQmdJQkdGQlZod2F4R0J5NFNYNnRxRW1MdTZsSXlKZjVicG9hd3JrcW9OL0hrVm1oTFdjVjBtTFJsb3o4djhqMG1LeFJ2czQxQUVabGJzenoweHFXM1lDWUV5NmxoaUJxajNOYWNxZ2w2MFd2VmFqdExxYTFDcVp5b3JxdEVvMWRsRkplem1JMUg2c1pqTjk5WjZ0S3EzZTkremxHQUZqQnNIek1WWStjeFRSRGpBbVlxTUdkR1V6U3dHekhwTmVNYmdwc3cxaDBqR01OUk1IUW9vd1FBM1RGNUV5TUFFQXd3Y2czVEcwRUhNTHdKRXdaQW96QkVBck1Sc0dFd1BRNFQxVFk3R2NFYStjRXhtTVlCejhTYU9vSE9xaHZzSVlZbW1lajVpN2Nac1VHT25odnkyTklCcklRRFM0aWpET3hFMG9HRWw4SEladEJtYnl3RzVzeDFvb2FBZ0hXangxeUFjcVlHaTNKb1NvWnNubWZwQnFxZUlBUXo5bU1DSzRpZEN6R3lDSmlycWJCR2NzUUttQmRvWTBNTHJqRXBEbkN6UUpURkRUS2NESnB6S2p6SHVqZEdVQm9DVkFoWWJzU1ljK1krS2E1UWExNC9aVkVsR2tJcERBRUlWR1VIZ2tDQ1FBeVpFQndyVGdFSWh6UWtnaE1CcndLQ2x1bkFtV2RtV0NtUlVEUUlXSEdvSGpDc1NxcXlqZ1FXWGpRc0ZCakRpZ01DTVlMTVNLRlF5SUJNcFJ2VWdWUUNxb1lKQWc2UkwxVC9DRkpWTWdFY1ljc1kxUWFPSUxMemJwREFnZ1NNZzRDaWhBSlFrR0ZJSkpESm9CR2swRlNBWXNKQTRtbHNEaDZtUXlCWW1QRkRDTUMxU0d3eUpkdHlnY29DSlJNWUF3SWtDQ0lNWWNnWk5FWUFTUkFUQWhWbG1ERkRxRXVHWHdDQ0lHWkY4UkVQZlYwcUdZbGthbW9mbE1JZjZueGcrL1N3QkU4TlhzNjJVdXBKTE9YTHMvYmpNdHhwSlgzNW1VWTg3ZnovTGxicUVBQUhNRGdBd3lYQmNUQmZOT05qdHFRNEJUNGpMVkJqTUI4TW94NnhSakV0QzZNZ1lnc3c4UjVqRGJFNE1nMEswd0RBSURES0JJTUk0R1VlSXFNQU1STUdzeHdyWUpkcGttR2VnZEhmbFpweFFaK2pnd2hNSXlqZndZNDNVTnpOVEJRazEvTE5DQkRGMHdiQkRGekF4c0dNWVFEU0VzeDlFTW9RemFCTVlOd3F1SERQWnZoVVlPcG1xRFp5L0VZdWhuSVBaa2JFYm5GR0tNd2xKQkNrTkh4alJ1WVlsbVhDQmt3TVo0UUdyU3BxWXNWVGdYSXdVUUl0R0ltSmxTT1pvT21Hd0o0dzRmWFZuaEFodXI0WWd3a1M0YkdaamhvaEdvQ2U1SjFYZ2xNN055K3BwZUdQYWZ2UlpKRGdJU2toV1dHMklYdUFTaENiQTV0cUZ1UjJZU2tKb2g1SXpxMG1DVmd6UWpUZUt0QjlnSHlLYW5Cd2dBMVE0Mnc0VlZZRW9xUUpBd2NBQ2lpK0Jza0lwaVhSWUNFQUJtQ2lJRklCaWNIcWJFMWlFbFRBdFduS0dRQ0t3ZU1NTUpBYUZ3Rk0xVEYvLzc1R1NwRHY0VmVrY1QyOHZ3QUFBTklBQUFBVHh0NVJBUGQyWElBQUEwZ0FBQUJMMkdnMEV2U2tPNnFBMjY1YVk2Z0V0WmUrd1pjMHFVRlFacEJJeVo0eWFLQ3FaeTNWWE5GTHRySFF0TWxDQkcyWkVHQkxDb0RFM0VFZ0tEbDhJZzZYUnQrNHE3RTY3VHRQL2pXaXVWeTlTUHREc001OXZ4bVAwVDlSL0I0cGJERnVTeCtZbzVaVXUxWkJQWjNiMXp2YStaZzJsREdMZStVYlpMNGhuWjB6bXZlUjBhZHpzSnZZUFp0TmhweGl4Um43SXB1RUl4ajJsQmdYS2hpMGhwa3FnWm4wOVpwdVVKaCswQVZBb3h4SXN5aVBjeW9HSXlTTkV6TFhveU1MMDEzS1F3dVdnemdHNHh5RWN5RVFNOWlGTk1RVDg2SXg4ZkJyNGJnOW5Qa1JzaTJiWWttS2pCbHJ1QmpVTGtadGk2SVJFeFVrQmtPWlNsR1oyNXpCa2VIV0hCSFpqUWNiZ2duSEx3SUR6Vkc4ME5vYXlaVTJtTWl4MWRZYnU3R2JIWndBSWFtcG1RQjRLWlF3eU5SR0JVV05qc3pVYzR3Mk1ORkxEQWhNMXVkTm9CVG1WSTF3TU1uTERha2N3d3RIVHN4NFBEaEV5ZFFNSUd6TGdjaVFERkMwMWh6TWVEek9Rd09GekNRaFh6T1RDd1l3QWRJaG95c3ZCemFBU0VLQkJpNCtOUEFFSVRIeVNoQVVtWStWbTZHNWtCRVk2Wm1YZzVxNElaTU5HbGxacWdNSFN4alFDU2o1bWdpWllLcm1NbExER3hJU0F3c0xqeGdQRFJpWUEwNGVBU3FCbUFCSkFCbUZEcUx3aUd6TUNFV0RDSXhNQUhRY0tHR2dwV0VoQWtwUWhzeGhVSUtLZUo4cnZUQkwyQkFlWDlnbE1XZFdhQWhFdXd3MXhXV3UvRGFUeVZ6UW5IWCs1RGZUN3hTbFFtYXBYUVhGbkpleHVGTEJ1b21VUEFiOHNCYlVVQWF5Y3I2UzE0WGtmQm5NUmtEZU5lYmU0em1UUmw5SXE3Y2dpcWx0ZG5LWDFlS1htc3hua0ozV2xVcHVSbWR1YW5BQUJqQWhGS05GODVZeU1Uc3pMV2R3UEdBNUF6TWd2RGEvSWhNcEJYd3huaEpERTdNeU9vWFExak96ZjljUEUrNHphdlQwODFNYjBZeVlJaktRZEM3WU9sazAyT2FqYkNYUGtIMHdsWnhoZ0dDbE9aZ0Rwb0pjbUMxaVo0UHh0YUJteGhBWlpieGpFdm1RVllaYW5HdHl4dkxlQ3lreUlkTVBSVGVZSUlEREhnVTArZEJVNGEyeXV1Q25BNFVWQmg4Ym9VbVhteGtRZ1lxdEJjV01hSmpEVUkyTXVNVUpEV1dBd1NSTWJKRGhJazI1WU10UFRpaHc2TlVNWEp6QlJneEFWTUNqRFVDOHowT01vVVRMZ2NPUFFNc21jcVJWS0J3d002RHpQaDR6bzBOaEZUZUNNRE41bWhrWm1hRHhlQ0FZQklaaHcwVUpWUUhEWWtZcm1Vb0FJR09BaGdJQWlTbmlNa2FhaE1PQ01BRUlPWk1Dc1FLek15a0FEaDBLRElrTWxnK0M1aURpVWVXZ0VER0FDSVFLaFlETUZKRERBb0xqUmI4QUFyZEVJMXVHTGdBa0FEUVAvNzVHU2tEdjdhZXNPVDNOcGdBQUFOSUFBQUFUaTE2UXh2YnkvSUFBQTBnQUFBQkdJQlFzQzRjSWhZcEFBb1lXSUJRZ00zQ0F1Tk1ETURFRWUxZEVvYmlneUJoUkF6QXFnS01wZmhOSjBFQWpFQVVBTHpIZ1YrM1hGZ3NPQlYvSzJ3K1hFYjVMaEI1cjYrVlpsWG9hTkZ2aU1DbUZ6RnZtQXRtQm9GSG52YUU2Rkh5a1hNd2RyRGgyV2x4QzdoUHRkcXhDbnBvRWlzU2xVbWhtY2lrb202MHBXTE5PdEY2V1lkcWtzWXl5ellpOUZNWldKdTNvQU9BSUtneWpFTFRLOU5jTXZSb2d5NmxVekRXS3dNSzhNQXpiRVlUSURGY01sb1Jjd0NpSnpDc0o1TUNzVVlLQTBtSG1COFlUNE9aaFdoU0Rnb3gxR3lEZHNROGh2T1diTmltN2VwN0xnZTl0bTV4WnNYcWVZbG1NcFJpcG9jRE1uR05wc0VTYWdHR0tJaEtFZ0t2TUlLekZBVTIxTU5MUEFDSW1KQWhuSk9aWWxtZm41a0VFWitNaFViT29RVEF3b0ZRcGlDZVphQkJBT0hOb2hXRE1Rd01FRENGWUJHUmxwcVlFRUd6bkJpWWthdUNBeFZOQ1d6T2hNUmxCVmREUGlFeDgxTkNOVFJqVURIQmtaazhvTXZNN1l5dlRUTFlDY1RCb3hncjFNZEQ4UHJESEJjMUJDQlEwNFMzZ01URXJGQVRKTklSQ0ExSDhLbUVBeWQ1V0VseUJqQW9xWUlZNE1BZ0J3a0FGZ3BJUEZVeVFZRWdBNkJJZFFRS01HbU1GU0JrcEZJWk1WUURBUzBMdEdPSUZ3Q1ppZFZNWnI1cGtHUzhiM1pneUFJZ3oweklSWnlWUzBYQWM2WGdFQXBpR2tKUUdOS3FRa2s0NGRDaCtyQU9DTVRWd3BhdXhNZURrdmdzU0tGbzlLK2dwTDhJTVRwY29vQVpPUkhJRVFhV0NTRFBCWHdwSk1VckNSVmR3TGlWNXA5V3dWS0RjRXhkeXBIYnVQYkVuZHBJaldoK1RTaU5UMHJsa0M2cElObE5lRzRZaDJRMDhYbjZrL3ZDaHBvbFlpOEFWNGZsYXlBQUFBV1lSb1hSa3hGVm1nUWVxYktZWFp3N245R0RXS21Zd1lXcGdKbDZHSzhHU1lYZ014aW1FSW1McUtLWU9RaHhoSEMyR0R5QndkT1Rud2toakRtZEZobWFJUkV3bjRISmcwQU9OUUpGekhXa3dlek1YRGpERGdFdVFYTnpJRHcxZElNcEZES0E0d2RNRVp1YUExbXppaGtDNERTMEZFeG00WVl1QUZ4VEF5QXdvdEZ3Z0tBWkdHR1NNUmt3R0FvVUVOZ0NPelBWRXlGWE03RHlBTUJCYUJBY21IeFVTRVpzVDBIOWtyT2hpYndSNUtHWWdWY2phUEdxREtOVmpGcHl3T2RBaHRLQnBBZ0tBUWcvSVVJSExXWjdvV0hBd2hnTkRwQmdUR0ZJYlZCeEFCbm9BVE4wc3hUVXlCQ0lzUlFFcUZtR2dXblRNQTFSQ095Z2FJUUJDSTRxckdTVUhEQmNBejF5NWFhMGZCeHBBYUVMbDBsV1FJak9zVmRSZUJZZ1hNb1ZFR2xPc2o2QUMzSUNCZ01zQnBWQlFZU0xGRTM1UUNQU0pXQnlBQlNlZi83NUdTaGh2MjBlc0t6Mjh0d0FBQU5JQUFBQVRnWjZRZ3ZiMU1BQUFBMGdBQUFCTlZpdGpDMnJKeUZ1SGxSOFlraEtVRWx6OE1wc0tYbHoyNHVXSWlpeUNpcGRoSlFLQUZ6RXhFNDBCQ1lSSUFrTW9RZ2FwQXZZbk93OHd6Vkw0QnZQazRFc3ZPVys4SmIrbGd1Ym1aNkRyalpuNGpEOHpOSS9VcWoyNlNPU1dsdXdMQUVDUTlha0VxZ0NQWDdVTTNxWE8zUFhiK3dtQlNKT1lYQ2d4cDB1WUdIaVltYW81QllLSVpNU0FRY3hPZ2N6Ri9NTE1la0ZZSENDbUhLWVlZWDRtaGg2QjhHQkVKb0NCaFRFVEFHQm9YUmcrZ1FHRU1IUUNRVkRFMkJBQ3dPSmdoaElsQUpadHdTY2NjbTRGcGpTMlZXVURFb0phamlsRXdOWU1kQlhTR0Rjd01pTUpEVFFtOHc0V003UHpHMGhOd3laZE00TEQ2WHcxYytNTmJERzBvMnNQQVNLWWlZR0pHaHYwQ2FZNG1xbVJqQmdLRVJoQk1ZeWloamtaa0VpRkNOc05QZWhOWGVNRTBNZXBUNkFDY3pEa1RSR0IzRjBUTWpUSHpBWWFOZVNCQTB4RFVZY0FvOE9relpaemhGU0pVWXdHWUVDRUtEQ2xET2tBVWFGaDRHS21zWW1XS2dwQWJGQUVKUzNwaEU1b0RhWG9BQ2l3eG5hUndFREtLQTBNQVJjSVhTTk1FWWswQUtTQlJNT2NnSUVKSFh5UVJJcE1XVlhVdUJKQUdrQU1LUUZpZ2RRVkNoNUdUdTBOQ2szaXpRQ0pCZ0pDcDNuZlhNbnVySXpZdHFocVd0WWk4eTdtYk84clV4bGZqc3MyYXE0cTBTK0pmRmFMQkdoUWVJUUNHNi9VejJOTVRlQmtLQVlzMDhUWG5kZVZ2MTRLN1owcHVrU09nRVZtRFFPMUtPejhMZkp2b2xKNU8zQ2xmaUhZY25jNEJxeVd2WGhjU2pseW5kMmJyWlZwVE5VOE4zNVRGWWN3Z0NMUXpxR2NwcThtcE1RVTFGTXk0NU9TNDFxcXFxTUMxZE84blRPcUhDTng1N1BHN0NNSXFSTkdGQU1XWGVOZDZ1TXFDMk1wZ2VNNjU0TXdXUk1WQlJOa0ZYTUFEb01EQU5NVnc1TWlnSk0rUThKamtBb3hoWWFqRlVnakVrU1RpWGpaK2hnY0hFVGhoemRSeldYUlFZWVpXWmdXV1pSeUVscGhBZ3luU0hNbS9IcElPQkFZNlljd1djRlZhVmh2NWpBZ1lYTVVFTUtFVldNS01NWTVNa1RDaDQzcG96WjAzVjAyRHNVQUdLVkZxekVJVjJnd2lhSmVHRFF1VkhTSmxoSm0yd0NWck5HalFYS2c0WmRBQWNER2krS0hwQ09YS0dBRjlpeVZEcGRjc0dBbEhCNERkV0JXY1doYzR1aXZaaFVkUTVJU0MzS2tBY0NTYWQ1SENCQTRrQTVnZkJjUUNFSWEyZ01JQnZCSldSSTlKbGlGSDJTWlhnelZVK0ZrT3BnTVlURVpZNlFoNE5FU2NzQll6ckpTcG1SaUowK1Y3bXB5NW80dVNFTVNhakowaEovSmxpWkZPYjlsTXJxS0hTNlVNTS8wZWJ5b3BPMnM3SXNwTFN2V2xBK1BnNmtOT2hXd0R5Y1U4M00vLzc1R1N0RHZ2a2VjR0R1bnp5QUFBTklBQUFBUzgxNndKTzd5ekFBQUEwZ0FBQUJLRVlPTlFPU3RwZUNyVXkycUI4b1RsV0VxMEtKemYyZ1JLeHRLMk1vWUt1WUxqaElBakpuTWFFbXBpbm5XTE9IeDJER2FVRW15eVFHd0tiR053NkcveWpHV3FNR0VTU21lQWRtQXJNbWF3Ym5HcEpvcDRZeVVHWko1ejZnYUhMblBwQnBJQ2I2QUdBTTRFSUFzK21ocGhpb2dGMmxBQ01wbTZlYm93dG9GQVRJb05zazhkemJKT2M1YTVrMXR4QUlBa1NlQUJrRmtUQXNpWjRod0RtK0tORWlCaG1wRk9ac2dpQkw0cDhsbGdVcWlNQmhUZ0hWVkVsQzB4aXNDellJRENvYUtLd1NZeGY1SVIzVUVRSkdCUVJNMGluQUtJZ2tZNENHUWhEVlRMQUFWRFNCZ05RTndnS0lXaVpTbEF5OWVpQ2RkSmNjTEhxMnBjQmNWZktjeWc2U0lrVWlJWDJXWWlBd1pBaVhxVlRmbDVIOVUrdEtPUWN3VmlDclhSVXEwNGsrdjRJRmRWdWoxZ1lsVVZPVzZrNVpwamFNRU1QekNuU1hVMTVpejN0ZFVDaFNVeWI4TlBsR0xzOUc0ZHVTS3hEdDZpaTlKS1pUVHk3ZExMb3BqTjBMK2EyM0xPU1J5bWt6N3ZyRDBSbDB6SUlnNkxYTnpMN1JxVU9sYW01dW1kbU9WSkZEVU52OURVSFM2Unp0UzlHSWphbU1KWlQwMFpsOVBsVlRFRk5SVE11T1RrdU5WVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZBWXd5Q3JUS1FjdE5XVlM4eDNRdkRWYUNlTWxNYll4SngvRENKQXJNTzBIQXhValVETExIb00wa0NReG5DT3pCcEM0TVFVRFF3ZXd3ekNXQ0hNZnNHODc3ak9RV1JkZE9ZT1RWTVp1SnJCNlpyZG14VEpycTJabWJHVEc1dFFRS21SdDR1WlFLbWdHWmlpZVlndG1hb1FoVGd5R01TQ1RHREl4UXdNblFEUXhBZWh6RndjSEJwandnRkRBT0s0TlQ4RjFrSGd2V1lOQjNoQTJrNFRBK0VScm4yc0RBanRKRUlSc05nc3NhNkM2WnptQkNCdXhDeHdoMUkwazVob0Fzc0ZXQ1lrT2NNTVNBUzVobUNrUklxUVlKUXFJcnBsWUNvUjdJakJrSW9tVW9CSVNsUlJFcmdTQVRDSlNReGREbUhDZ3FKbVpVR2JNcmVJeW4yQzRZcVdoSkVoa2JCckJaWVptQmhGbUdBdXpRUUh0T1VHWk9QQmhRTmxBc2FvMkJTRlVHbEZ2RkZZS0NFQzZ5ZXdJRlJNZTFoeVhDcXFEc0NOYmdlc3o5dTYwUndORlRHU3BkMkVGbUpzK2ErclF0bUNWbFExRDFKRGtHdzhxNWZiV2tRbjlqYlRYdmxMTzNHakNtcmNIK2RKdVN3VHBUKzVTdjU1bDB5MlR0Y1FTSjdUa09zZ21IMGNONFdJU2lad2VxQVhqbEs3OFpYQmI0eCt5NkxxTWVmaGlNUWxiZVJhSlJXTDA0d3d5d1BEUHdXU05wRUpZRGFVbXd5eFFZRTVPUm95bE1HS2NqSVpaSTJoaUpEQUcrcUJIQnNabVdwWm1mV05HWVIwbXZxa0cvRGYvNzVHVHdqdjFVZWo0TDI4dlNBQUFOSUFBQUFUcGg3TzRQZDBuQUFBQTBnQUFBQlBIWVRsbVRRVUdQcTBuSVEwR09LakdTeFRHUGd2Q1I5R3doaEdCUTlCaThHS1JObVJBZkdISUZHYW9uandNR1F3L21ReEJzRE5LeGVNVkNpTWF5eUFSQlJRd0xCVXdtRG94bEJJaWNraFF5amN4MUU5aUE3RTBkcm5Ib21GbEdqY0hSTkdKZEdkWkNPUUJXUjc1UUJYZ2VrWitDWVZHWTBrYUMwWjBFYjRXQm55Z0FXZm1ZZkd2YkQwdzE0NDN6MHV5YndVVFkxa21kU21RTUFJOFpzc0JRZ1VCbWJUR1hUaGNXTWdCWk1EaFptUUFqQkYzVFhIQWFIQnlBSVNBVVFYMUJ3dGJZaURoZ1d1TUJERkVXUWxVQ1hmYm9pSXF3R0J3NXNVSFMxQ2V4a0ZZczE0MDlYQW9KQm9nbEhzS0doeUw4WUdpcWdoYTVZRkFTNEk4SFlrUEMzUkx5bDJHaUlpR0hDSVpPOFhmYXdwV1hmUUxRWVV0VDhnSldXNG1FMGdIQWhZa21vZ3NsaEQ4SGxnQ29lM0pOdGs2NTArMm9OMFlBZ2dWblRIUWhUS2NKM2hvR1lvYTBKdTVkcGhwYkZlYUFjZUNLbFhHaFNsc3JhWDJWKzNGZVlGQUlMTmlZcWdpYzlZcXlVaVdHa3dKdVRaMHFZb3BTRUZrZ1VKU3RLcFV0Q0lPajBrYTdoYXFISFVYVW1qQnl5eStqSjRaZGw4WTFTMGZWVEVGTlJUTXVPVGt1TlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVEJGQy9NUVZ2NHpiQ1RUWXBYK000TURzeVV3SGpGeUZITVBna3N5RVJTaktNQjlQWlhFNmhORHV6L0xCQk9UT3N6VnFEWkxtUE9xczRzRkRPeEZNYmdVeDBrREdJZU1RR2thVEJnUUVnaGxtQkJRWkZOWmhFRG1WUlVJVENBUllZWkJRaklZOEZEQndTTU5nY0lGQUdGWUVMaGpNQ0R3eUNBNER5alZjRVA1bldnTUUxUmk4Z1lhV0V6UUVGRkVKNGdiRzFIRE1VdzJ4aHdjUkVsZkFjNmdCZE5PWWlwR0NpOVpteUF4UnJSc1BBS1pwRGNSb2d5aFFLT1hjY0ZDWWFxaWJMQ0RBR0NId1VTSTFCSjUxeTd5Q3hRT1haU2JSeUJRYkQwaFNBUldvYXFWQUxDdHhXczJ5RG8wRXRSS2tSQ0lJV1RPa1dvZXRTb3ZzcWRCZ3FDc1FhcXlsbDZjcVhiUTNjYW00YlRtOVVOZGFIR0V0VWxLVU1DTEN3NjN5dVgwVjB3Q2FsY0liTzk2MVkxZVNwY2VHb2VhVzNZR0J2U3dCUUZ6bU5QQks1OVViclVUdk5uZ1ZRQ0E1aDNFaWxZbW5vRUhaZFpsRG12Skk0Q1dJOGtQcjBsNjdXdU4wWitzSXc5cDhGUDNEcmNKY3hhUnNTZHo1cGlVV2NGVzJDWDRmNkczdGpqY1cwUnNoaDBaSmRqTU53Y3paN0hBbjY4NE9CaDBFUG1hT1pTWVR4WnBrTWhxbVRBR0NZV3E1Qm1GckFtUTJYK1lTdi83NUdUY2pQelBlcnlEM01wd0FBQU5JQUFBQVRkdDZ1b3ZjMDZBQUFBMGdBQUFCSURSaDlqSW1pT1dpWVVwUXhrd2xjbUdPUFdaeUlVNGhBTU1oc1ZRdzdBYlRjVHhPYW9Nemt0Z2JFRGFndk1jTWszS1FqTXllTjFnbzBpVnpEQitNSURzUFltVWdtWk1tQ25Hb2ZCZGNaaHFDSVFHUGdNYU1BVEp0UVdkQ3ZJNktJMEJzejVReEtjS2pEVWl6UFV6RER6VWhEWEN4QWZBTUkwcDB3amNhS0cyRmxDTXk5WXdwb2FiQkxBMDV0VzAxQjh3UUVHTmpZc21DaU5JYTRBSXpBSzdCaDhXc2l5a0ROUUNGVHVCcDRJbmhaTW5TWnRpQ3pJQ1dBNGVtU0l4eGpSeWtnUVhiNWJDZlppd3dPTkxQS29BR0FVS0ZZd01SS2dGWElOQnc0ellMRFdPTk1lQWFCaUFHRlJLQVlXRXd6RGpjV1VOcXJoN1FxRVZjRUVHMlZhNURIMnV3ZXpvdVczaklrbzFzRFFKc0NscURyRG4wVG5ZOFhvQmdOamlRWlpwUUtGekE4RFVjWXhJWTIyQk5GbzhBdXlneEJ3VkFPVTBGTVV2MG5WRTNRU0hlcW5mQkdsTjE4bEJWVG8xTWhXaTJnUUNUMmJqZmhwTHRLQXZPeGxFNTAya3NuVlRkdDJGRlMwc1ZhVTNxMkZubzlRTkRqTG1jUWhoaGR4WDhBdTRseXBOb0NsUmJKZUtpczhoZW1rcWZqd3NXVldpamlzZ2dTbVZURUZOUlRNdU9Ua3VOVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZVRWdBR280MFNEQWdxelFkc3pYc1FqWmN4REc1QkRiSmhEbHN5ekxFZHpHSXhqYVJvVGNRR3pSUUtEVmhRREVBaFRhY0JCb1hUUk14REkwaWdnbUNVQ1RLNE5TMHBsRUJwbTVyQ1lIYUdtb0FZWWhMYVFDVFFvck93ZE5IalNRQkl4eWdnQ1RJelhqVWhBTVRiMGtPSFRDR0FiR1pOcWhCeGd1Z0FxUU5XR2hBbUNFRktnRFViSWpIalFVSW5USEVVTll3QkV6UGRHQmszV3ZHYW1aaXdSdWRDWnY4bTAySFJpaEtCbzQ2WUlvVVBCSkFxTTRJakJIVlMyNFdCQklLWmdRSTRxQ0ZKSmtJOEt0aGpTR0tuYko0by9VUVVpTEFJZkZBMEpkOTlsL01yWEtzdDkxZHVIQ1ZoSkl6T0t2YTJyV3JrVGdtQlhQZ1NIbTU3ZmxnYi82WVMrOXZ0bW5wWlU2YlM0M0ZZdzk3c1A3WW5wVkpJMDdjR3VoSmwzUkd0SWJNUHh5VVg1OTdhU1VQdklXOWtVbnZ6bWJZNFozTlJHTzJPVTA3REVXenBaMm51UFJjZ2VLUXFXUEZxVlFNOHVMcFNpWHY1allvcHlteGZtVlV2STNLNkxVcnBjS2JyRG9rK01QY3UyNTBnTUJnTk15ZGxWelJwU1lNNXN0b3l6eHpERVRLNU1wa2tNeER5dnpRY0xxTVBzUjB4MFVQLzc1R1RMaFB1QWViM1R1c3hDQUFBTklBQUFBVGg5N09RdmIxQ0FBQUEwZ0FBQUJBREdXSWlNdmt6RXlGanZ6SGpJVk1ZUWc4eXR6b2pGcktjTUxJRE14YmhHekNUQzFFSm9iMm1uN21KczVjWm1NbXZKWnhJOEZuY3lkY05kV1RBbXNLVTVvSm1aa0hrQ29jVHdaOHNZb21jWmFZSnlZK2VjeVdPaXpTbkRqQ3pLRlRMTGdJbVlNTFlEVmtUS0FqYXhnTXRHRFplc3p3WUtCaldFZ1FPQVZBSFd3NytZRXNiczZEREN4WVlPUUhOZEJGU1pueUJlQUFIakZrZzZrWXNNTkdqS0ZUSENBTWlHQ2hLR1VBTGxDd1pCa0RCVEZKMGx6QURCcVVRaFMzNDBPSUJvTUJKN21KS0N3b01Qc0VXQlRXRUE1b3JXRERBeTJxaDZaWmdoYWdReURLd1pNbEppcXFqT1MycGl4U215WHpXWFNVQ1pZWFNCQUZDMXV5QlpFTVpnT2dBU0NYaTlFd3lSZ1FRRkt3ODhDUXdRS0lCTFVFcm54Wlk1eUFwaXJMV1VBNEFPZ2tNMENSRVJodEg1VXF5VWtId1IrTGRxUlZTZHl3SkJrdTEycDNLbVV5bDdZWEtWcFJHbGtnU3FqNDBCQ2dHSFdacWNwRE1pWGtpdEtCSUZRUVpCRGQxVlc1bDBXb3ZFc2xyUUNCT0xKWUtaSzlEaExzVXljbCswRm1Sb0Rsc1FpQmxLbFFXMXJNZWRxVU13ZlZERlNTaHI3dHdpOWVjNlRFRk5SVE11T1RrdU5hcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxQzRiaGxIaWVEdzdwcHFrZUdnSUtZWWxZYjVqNGowbVJDRTJaY2c1aGdFaytHRElHYVp2SU1SamlpUUdGK0grWWdvR0poZWlJR0dhUWlZdXdBNWlTZ3RHQzZDeVlVWU9Sa1ZvWjB0bm9Sb0RLaldpRTBRQ01EaFRKRkkxVlVOYlVqTzNNQlNBaUd4Z2ZIa2wxVEx3RXdNUkxlRndpWWFRQ29VRVJtSUFRV0FnRUdDTW5VcExldVdDaElMMk1PQ3pCZlVlZW5JWERCSUFhQUZJRmVRK0NSRlFKR0JRVW1rSkRGUWdGNklKRUo4MVNPeElBUVFCQ0xxY2ErcDJocEd3b05JVTNnVEZJQUszeE9YZ1lKUkZLcHJqUHJBUUY0VWYyUXhXZFlRM3ExR2xKanN0S2lWdlErcDlLeFc5L29LWFJ5S3ErZlJUQjZtL2pFTXk5MUpPMGh1akFGYW9mWjR4QndKRy95NllEaGgvMjROVGRPTlBxMWlDMzdtb3NpNHk5UmhVc0prRmwvVThWMFE1UHNTazc0dXJCRFBXSXBxcTFNSld2TlFwZHNvZFZzY3FhYXkrUVByWFlFdXBmN0VrYlhqWG16R0E0TmJuQjZHTEFXQ09HWGdVaEQ2MFZpdE10dDZzTXlobmtMZlZrTHMxbzJ1dURXaHlKMloySk55aGwrSDF4WmFwM014eHJyL1huR095RUdMY2JITU1sR3lYaG5PaWlIS0E3bmVWam5Mc2pueGNWbmYvNzVHVFVEZnhjZXJtRDI4UkFBQUFOSUFBQUFUY1Y2dHd1NnhjQUFBQTBnQUFBQkdKYW1peTRudnF0bkdiRUdkeThtM3BsSGlqbm13OFlHa29sR0RjL21tUWhHNHBpbWtpZm1xWmRtWklZR280bUdCeDFtSFF0R0dKbm1TcG1BSU5UQVVLREJzQXpKb1NUSEFFVEhBWHlZVUQ3V3p1QWdPM0hnUnhFNWhTaEhFRUZFaEZvZ0FBbUFkQnFYQnlGSmhzQWtEQzBFeFFvNWg4QWx5Sm1VQnpObVRMQmpIbmtPeGh6UnA2Q0VvRW9pNUlPS0diSEdYUEJjSVlzQ1dCWVFETXVHRUJnSE9SRUtBUkJMVVlEQ3BBRFRnRWJpZ0NMR1pERUFzeFJjUWhod0lFQ3dxQ1FBbUlFaFpJRkVBeEUzUkVGUHN0Q1hHUWhCQUFzaEdaWXh1S1JGYTRnWXpJQmlSZlhrQ1hpQUJuQ2FobUpMd0pYS3ZYZTNkMGtzMUNJY2dFbkN5aHU3QzFHeXpqL01KU3RZZ2lHMlNEV2NpVVZKS29vQWxoWUdMcUN3NWxDUW5XSVVzSG1sOE1mZWFaZjRNTXRhQWsybGVMNWRhTnIyUWt0ZmF5WFZHQXFBaVNDSVRuRi9IM2ZWOTByQlVySkdCcVRjSXRNa0VFSUhRSkJOeFRyV0VLZ1RBWkFFdWFZWlFqOG9Jbys1U0dpVzRXYTJSOW02eHhPeFNVTFhlbTZxdXdXRzIzV3lndzZ5cUtlejBNU1FmWGltSThMSklGYWpha1UvWDNWVEVGTlJUTXVPVGt1TlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZRQUVDeEdNWWlXWVRZMDVnMWpwZzRuMHhVQ0N6SHRNVU0xTXVJd1d4d0RJQUtMTkFjTHN5RlI2ekFaSGhNMklyRXhhUmhqQ0pKT0FWODY1RXpiZUdNd3JJMEdNalJCZU9MR3czRXFESzRtTWluTTE4cXpVbzJDb3FaTWVnV2JsOEIvb01CbUNISFd2R2VFbXdMQldXWUk0YmtrWTlzQlM0VmdHakZEVDF0VEtHUnBvaG9JQVFrUERnNGpFRG80MjVZc0hSb2FEVTV4QzR3R0N3VW1zbVNFZ2tRaldZNGlXcElBVFhuNlcwWVlNakdJQUNkSklDTkdTQndveHhCUVZUQkhzV0ltYU5tSVNxQURKSkowS0dsNUFvOFhNV2tZc0UrQUtGREE4T0dOM0tvRllOcXloNlBxNm1OSUNzR3ZONm5xeU5ZaFdBVEhMQWFTc1JYQ2hkWGpiTEZOVmJYOGUxZjByV3E0am5KN3JDdkxLVlVtZXNDWFdtZ3d0NVZCbUpwN0JnSXRhczVmclhXdUlLeHRBQ1hkUnNUNlljbG82TEFiYnNObVZ5cWRhQ2N4ZUYzRnVPbXdTSVJXTXVzcXBDa1ozMmI5L21tTzJzaEVGbUR0b01VeXR6L04xVUJmdE9oVGhxYStrZVdRdVRPNHlsT0ovVzROZFpDLzdaWFVaUy9UVW45cEVqbWh2OHV0Wk4xdFlTMzZsS2dMNnAwemNvWDNNcnBscllXMm03ZFhxd0dDcVUwWmVTNnBuQkhuR0tJZlNZaEE0aGl4RjNHdi83NUdUZERmMFhlemNMM05Nd0FBQU5JQUFBQVRacDZ0UlBiekVBQUFBMGdBQUFCR3lHY1pNNFZobnJBMG1VQ1hBWWhaamhnU21zR01lT2tZQ1JWNWhpa3FHRkdReVl1SXhKaHlBem1IT0pHWTNBeUpoakJ4bTJueGdNS2RZbUhxZ3BqdzBJRWc2Um5NRlVEWUI4Um5obVNRY01qREJ5ZE5qZ1lzTTllU0l1TkZGakJ4SXpVQU0yWERJQ1l2TVlNWGdKZE1DWEFFZ0JhSk1ZUHpTd2swME1NNEpqbE1FaXpHUE9iMVljQ1NDeTRPeEJnNWMwNHdnVVVPek1uTFptWVMwRXR1WWlKbGtEQUJ1REdnZ1lyaG5vbW9xYmk1ZjRLeENGa2VSSUh4cUltelVyWDhGQkVTd2dVQWxJQWlFOXhCb0tKeFprWVJFbkdGQVVCd1ZPVnRiRXZOb3lVNDBJb09YSFQ2VGxCd1NGSWhHVmtWalUyUkVXV2syMXRBWUlobXpyalI3ZnhOOUFDcWt3SlJ3WkRiS2lvWklDN25iYThuV2hld3RCdHJqYXFMTkZaQkxVZWMxTW1UTXdWaGFXMEZXVll5UDdSSGlmWmEwVmtUQUd1TWNoNXlZQ1NTVG5mbHhpcVFYUGJCQ0hkaWhNZkJEV204WFZEYXdvaEFVNkxmRnlvZWRWVEpycTkrT3c0cmNsVlc2TTlaREE3eXNtcGxWWWNwVktWSnI4ZGVEMEpNWlpWQmF0enNJU20vY05qQzgyN0ttWDB5T1VzT1o3RnA2R3BiaXFURUZOUlRNdU9Ua3VOYXFxcXFxcXFxcXFxcXFxQUVTQUttRWlZWVkrNExwakVscW1PUVZZWkI0RkJndWtMR044blNZN3dueG9NZzZHUmFFK1laNVlwbHpFdEdqYW9zWVVRRll5RFNCa2lmdURacWVJbVd6T1k2WVpnODJIRHBDWklJeHA1ckhNRHlZZEV4QVFEVFFOTTJLa3dNUkRBWWxHUWFac1A1cUpCbFVWdjZabUh4cWNnaEFNSlFFWXhNUWtKREFRaE1raXd3NlRERlljTUxEY0FCSXhJRHpFWU1EaDhEaTZZaER3TkRLZ3dGRlIrRmlqTGFMOWc1eGg1bEdsblNDRTBUQ1pNU0FRMk1VMHd4QzJCdkVnQmNtbEM2TFBVckZLMDNWN2xabHcxVHloME9YR2tFdFVxbE5tdEozczZBeUk4RTZpeWxxbHJacG14YUF4QmNGSm9laEFxRlJkQlROVHlrckNnU1lwZDRJTFFORWlnZ3AzMExFQXdXRFowT0VvaGw1a1ZTOTY2RzRMMlFIcmVMcEtNdXN2ZHVDK2w1UlZWSlBFUkJKaHVlNDdDbFZXSU1FU29XVXlhbldxMzdkbENWOEt6RG9pRXRMbGs2dDRPQ1VxVjR6Q0drSnpjbWFLQXFYcmtUUEJ3ejNvQmdVTTJyT1ZMbDVGMVI0dDFnUUhCVFRGQTRXanpTTWhjQ0htUnJWUWJVMGRkdm1LTEdkcEl0dkhGakMzMWx1aTA5Y2k3WCtacXRGNkd4ckhZc3o5ZnpjWTBzR3Fxb0sydEpEVURQdGs4RHhSYWxvdUdJS2JFWU1aM2hzWnN1bUVRWWtZVm84NWtJRVJtajBveVlVWUdSZ0pvdG1FY3lTYU9JZkJrWUZOR1k2aUFZbXhveGlQaitHZkgvLzc1R1QxQ1AyWmV6UXozTXRnQUFBTklBQUFBVHBwN01JUGN5M0FBQUEwZ0FBQUJDYVUzNTZrUm51MUtjMkl4M200SFk4VURSR1lRbHh2VStHa2hpYVNPUnJ3RkdmUlVaWkY1bEpUbklHS2F0UWhtOWVDU0dNQW0wekdsREdoTUJSeUZqa0RTVVpQSHhoMFRHT3cyWXRPUmg0QkdEdzZIQXN4YVZqRWdsSmd1WUJBWmh3ZWhDWk1Oakl3aU9UR1FzTUtoQXdtVkFvT3pCWTBCd0dMK2hVZ2lCRXdVaFo0R2ptU0FIeEpkSEFtYlNCQ3FBUjAzQzVKaVVoYUVLQW1NZWFZaGU4d25RTXkwRTNoRUFacEttRGFXU2ZZY0FFdGlGNXRBQ0t5UVZVUmRCQ1lxbVJnZ1owSVdTY0x4Z0Y1SE1PWkxLcHdHRVEyQXN1ckU3cXVETUpTcGJzaXNQSElUZ1VrV1NTRUZTcEdKSHBJZ0pGQm93emdvRzU2MDF2bzRLK1FRcHFBME1XUldDU0ZMb0ZrbTdKS3FZaGhidnNWVTNXa2p5RGdXSklJV1lTUldFeTBCQ05hUUFtSUdvQ1lBNWxBam9zYldSQkJkeHYwbEdxSWpwTXVESUZuSkdJckYyaTVxQ3BXRXFxb3VISEpNQUlxRGtBeXR5WTQ4SW5vTUppcVFFSGFnWXFDS1NNZ2pFUVhMU3BwbDk5cURrSW9zbk5zQlJPVHpZdXhkbFRKMHJsNUs5UWpBU0tORUVvSm5mYzlsOUF5SllxV3BhVk9oTVJuRVl0VlRFRk5SVE11T1RrdU5WVlZWVlZWVlZWVlZWVUJ6Q25GSU0xUTh3MTYxNURJdkxXTThvdDh3MHhBekZQQzNOUDBXSXovRGlUQXFTZ01iYytFd3ZsZERHdUx4TUpvTmd3aHhOekFGQWlNWG9Ib3hqZzhUSUxEOE1BUU1NdzZRNkQyYk0xNDdOa09qU1J3NWh6Tlp6QTdnTXdHVEVDZzZBMU5aU2pENlFBZjRaUW1mSHB3RXljNUFnUmNNVEZBRkFtb3BBQU9RY0ZHVGtKaElndDhCRXBraGFGMHd4MEtTNk1hT3dhVVpnUk1VTEZnTDQ1bGpuT0hZem1kQ3hRRUVNT3dxd2pSUVlXT0JtOCtMQWdVdFp4RU9mUklZRVlob0JTTC9ITUNSYWkwNGtRSlJDQjFIRUZBbUNZcmNYakxLcEtMQkloaXhnNkFYZkNqYWh3aElNTlF3Z3lCWUlUQmdLS0pnQWppWnBnTEFrSVNQb1lBdjRaQllBQ2xZb0ZnMHJWakljZ2NDWUpEbGpDeHVGckpIZ0ZmQUJkU0kwU0RRRERNS29BZU1STXNBTlVRQWhMV1MyVFBMY3JDaEN4b2hxWk1TUStHVndRSUJYQUNpQ0JVQUtUTFd5OUNBcEJaUUFGRGtTTGlJeWlGSXlWRXhGVVdHSmtGc2t1NTU4R2twSHA0cm1TOFpHTVBnVklWSU5FbFhTWndOQUJKQ0N5WTBsRWcweGgwR0dVRmtWa3RrWFdaTGlaMCsxTXJsdjBoQjROVFplQmFwL21CaU1GVGd4ZzZKRzUzRkhtUnB1c0RqTFlXR3BpdTR0NXJEdVFQRVZiV3ZNRldpemxjeVF6TFpiMFpndWc1bWVpMWthSUpYeGhIQXRtTndScVoyZzhKajFqYkdFb1IwWmhoN2YvNzVHVDFqdjVZZXk4TDI4eEFBQUFOSUFBQUFUZWg2TEF2YXhPSUFBQTBnQUFBQkpveWd6R2hrWU1aN0l5UmlTajBHWkNFT1k1NGpSaWtDT21CTU9tWWdCUXBpdGh0R0JBQ0dZVHdJdzRIMEZRZ3pCU0F4TUlVRGszQ28vSE0xSjQ2QWt5eEFiMUcrUW1kWWcvZ1pzeVloM0pFRVpwVzV5bTZOZzFUQXpFMXBvemowUmp5MVFNQmd4ZVpnK2FzeVdnTnVzTTZkUjJNQ1FEbkJraUtRQjBheG0wNXRoNW5sckdTRThaTWNhY0dBa29vYVZVTU1DSFJBRUFEUUlRbWpJZ0FVYU1FTE5rMUduQWpCckNHT1RpQW81NlhJNkFadldFZzVBR0FoRU1VbDhEQ0IwRW9LeUdCTDZCY0FoQXVwVFlHRUpJSHRRTkVndUlSbDVsWWxWa1BVQkEwY3lOSVhESndjbG5wQVVPcVdtWmN3R0NDNElLS29tdmsxTEZvS0RJUUpLTldhc0lBR053WW9yQUN6SUFqTzVqcXpsaHdTdGZMZDJHa2dSMDBvV3NaekoxSlVoQ0JBY3R5blEzQ2NGbWw5aVU0UVZPMUJaZkJ1R29vVmpUa1p3aUVURExncXRUa2FFbWNYaEpnbTJRTFU2QTBKMlZGbDNxV1VpK1M4UEhsWm16ZG5nOFpGdHpvV1hCTGtvck9zcHl5ZDROb1RpenlzVXlqeW9Demw1bWJJOVVLZXFNN1FZMERCb3FwM29Rc29kZGkya2VSSU1GUFMzdE84RWdhTVlKRGsxMEJmRFlYYUFORTBmSXdZRFJ6S3VBN01vNHhNeTloMmpIRkZmTUlRbkV5UWlpRFN0S3dNQlVVY3haaU1UTDRKMU5qUUE5dkdETlhuT21xZ3lTZFRiVWJPaFFVMVllekFCY01ibFV6VVl6UkxZTnFJc3l3UFREUkFCUW5Dd2RBQXFNem5ZejJ0RFBZRU5jR04ybk9oNVBSQkdHWmtsNW9wWjNwSUlLQ2J3MXlzS0JSQVFDNXc0R3M1bDBTSWdkeWE1dVk1Q2F4dVlCY1BGekVKUzZKcUk0TVdBb01ueVkwd1prZ0RvUnNxWTFaSUhKdGl4Z2FSblJ3WVpCem9IR1RXSVR3U3prSVJDa0FVb0RVaXRBMDRpakY0akFCRE1LekNLWEdCeW9oU2p6aHNRRkZoaVUxaHMxQ1V4eFkwcFJJSVVQaDJVVkRHT0VxTEdGUW1mQUNNU2hOQXhFaUl0RklnZ3FFU3NOTVBGam9KRXdsQ2VaQUM5NmpqdnpTZGdOTWdZQ3NFRGlhSklzZVFGQVo2OG9zRFF4SGhxbXBmcFFkUVFRQ1FjTVY4Q2c2Sm9VQmx4Qm9VWUl1UERoWUNpSEVDRUNNaGk3WUNCSnBJQ1VhU0VRWU1BSEVoWVNKR2pDRFJwQ09pZ2hFZ05KQUFLRklxQTBBNWhaZEFNVmdVTVdTeG93UUV0SWh6QVVseVV5QXFHRWg2QVF2a1lVQUlpNU1KWUVEQkplWWtEcENLRUlkM1pFZ1pnUWlrZ01aQ3d0UGdpREkrQlVJRUMwRFZrTCtFSUJUTXdnMGlJb0pnTVNmbGRzSVdJTkRnSUJVdFpFTUJWUkE0SzBmaldrUnBZaXN4UjZJZEJSV2pSeXROWDZBOHZERFhKd005V0U5Vlp6ZGc5TmYwLy83NUdUL2pQODJlcWVEM05OQUFBQU5JQUFBQVRlZDZwQk9hekhBQUFBMGdBQUFCQTVLcUNZK0dzM1laUFZad0J1bW5qZVlzQ1Jqa0tHQkJpWlVQNWwwZ0RvM01uRFVHRWpVc2pmeWprckJHZE5vOU5DS01NeE5nUkM0NHlKSXk1SkVzaElHeFhCUUVFQXhJSWFOMGJsTUhIaTVvZ0NHOWtHS0ZHeFRCQXNJRW1EV0hKbEVWY3pBRTBjNDB3VUtDektDeThobTBnR1pTVUtGVFhOeG9zN0RuckZZMFlFWVpNWW1zQVN4a2laTUZUcUN3VVdBcHBBWVVERkp4b1lCTm5FaGgwa3dJQWNIbWlUaHlrdkVEQ29HSk9HV2RMNkdYSkRLSnhOZ0lBM1hod28weEdwQllNQkd1SURSQUVrd3R5d1FDWXhZUVRTTkpVRkxBQnJ0RjFEUENIQ3plbk9aODBqVE9UTTRreEJRS0VacVFRc3dveDBETkVDQWxEVXhRS1VQRkF3VXpnUlV3MjBrV3k2cURocFRuRVNnMG10UGhZYzBGVFFQTTR0TVl3MGpYUU5GSXp3QzZ3UUZESUZZTkpNMENSUUF6eWl5UmlqSTlnbzFQWm5qVTRURTFOVmxHQ1lhNmhFRzN5dHFLckpXbElTbHZJU1NVSXNpWUFMTldBdHEzVUVBbUlLQWhWMVc0S1ZNbDhBUWtLbVlseVhiY3dHaEJBVHBscVVhUXVFWW9UQlhTYTg3VURPRElIK2dHSG8xRFR2TjFaYkRyZGtobGl5eDRYbGNKeW42bUVCUzFlSk1RVTFGTXk0NU9TNDFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXF2Lzc1R1FBRC9BWUFJQURvQUFJQUFBTklBQUFBUUFBQWFRQUFBQWdBQUEwZ0FBQUJEcEM4MHhCVFVVekxqazVMaldxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcVRFRk5SVE11T1RrdU5hcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcWc9PVwiIiwiaW1wb3J0IHsgQXBwLCBFZGl0b3IsIE1hcmtkb3duVmlldywgTW9kYWwsIE5vdGljZSwgUGx1Z2luLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBXb3Jrc3BhY2VMZWFmIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgeyBTb3VuZFNldHRpbmdUYWIgfSBmcm9tICdzZXR0aW5ncyc7XHJcbmltcG9ydCB7IEhvd2wgfSBmcm9tICdob3dsZXInXHJcbmltcG9ydCBhdWRpb01wMyBmcm9tICcuL3NvdW5kIGZpbGVzL2F1ZGlvLm1wMydcclxuaW1wb3J0IGRvb3JNcDMgZnJvbSAnLi9zb3VuZCBmaWxlcy9kb29yLm1wMydcclxuXHJcbmludGVyZmFjZSBTb3VuZFNldHRpbmdzIHtcclxuXHRteVNldHRpbmc6IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogU291bmRTZXR0aW5ncyA9IHtcclxuXHRteVNldHRpbmc6ICcnXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNvdW5kUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcclxuXHRzZXR0aW5nczogU291bmRTZXR0aW5ncztcclxuXHRhdWRpbzogSG93bDtcclxuXHJcblx0YXN5bmMgb25sb2FkKCkge1xyXG5cdFx0YXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcclxuXHJcblx0XHQvLyBTdGF0dXMgYmFyIGl0ZW0uIERvZXMgbm90IHdvcmsgb24gbW9iaWxlIGFwcHMuXHJcblx0XHRjb25zdCBzdGF0dXNCYXJJdGVtRWwgPSB0aGlzLmFkZFN0YXR1c0Jhckl0ZW0oKTtcclxuXHRcdHN0YXR1c0Jhckl0ZW1FbC5zZXRUZXh0KCfwn5SKJyk7XHJcblx0XHRcclxuXHRcdC8vIEFkZHMgc2V0dGluZ3MgdGFiLlxyXG5cdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTb3VuZFNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcclxuXHJcblx0XHQvLyBBZGQgYSBjb21tYW5kIHRvIHBsYXkgbWUgYXVkaW9cclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcblx0XHRcdGlkOiAncGxheS1tZS1hdWRpbycsXHJcblx0XHRcdG5hbWU6ICdQbGF5IG1lIGF1ZGlvJyxcclxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcclxuXHRcdFx0XHRsZXQgc291bmQgPSBuZXcgSG93bCh7XHJcblx0XHRcdFx0XHRzcmM6W2F1ZGlvTXAzXSxcclxuXHRcdFx0XHRcdGh0bWw1OiB0cnVlIFxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0c291bmQucGxheSgpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQvLyBBZGQgYSBjb21tYW5kIHRvIHBsYXkgZG9vciBhdWRpb1xyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6ICdwbGF5LWRvb3ItYXVkaW8nLFxyXG5cdFx0XHRuYW1lOiAnUGxheSBkb29yIGF1ZGlvJyxcclxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcclxuXHRcdFx0XHRsZXQgc291bmQgPSBuZXcgSG93bCh7XHJcblx0XHRcdFx0XHRzcmM6W2Rvb3JNcDNdLFxyXG5cdFx0XHRcdFx0aHRtbDU6IHRydWUgXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRzb3VuZC5wbGF5KClcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFxyXG5cclxuXHRcdC8vIExpc3RlbnMgZm9yIGZpbGUgY3JlYXRpb24uXHJcblx0XHR0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oJ2NyZWF0ZScsICgpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ2EgbmV3IGZpbGUgd2FzIG1hZGUnKVxyXG5cdFx0fSkpO1xyXG5cclxuXHRcdC8vIExpc3RlbnMgZm9yIGZpbGUgZGVsdGlvbi5cclxuXHRcdHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC52YXVsdC5vbignZGVsZXRlJywgKCkgPT4ge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnYSBuZXcgZmlsZSB3YXMgZGVsZXRlZCcpXHJcblx0XHR9KSk7XHJcblxyXG5cdFx0Ly8gTm90IHdvcmtpbmcgZm9yIHNvbWUgcmVhc29uLlxyXG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbignY2xpY2snLCgpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ2EgZmlsZSB3YXMgY2xpY2snKVxyXG5cdFx0fSkpO1xyXG5cclxuXHRcdC8vIExpc3RlbnMgZm9yIGZpbGUgb3Blbi5cclxuXHRcdHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC53b3Jrc3BhY2Uub24oJ2ZpbGUtb3BlbicsKCkgPT4ge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnYSBmaWxlIHdhcyBvcGVuZWQnKVxyXG5cdFx0fSkpO1xyXG5cclxuXHRcdC8vIExpc3RlbnMgZm9yIGZpbGUgbWVudSBvcGVuLlxyXG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbignZmlsZS1tZW51JywoKSA9PiB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdhIGZpbGUgbWVudSB3YXMgc2hvd24nKVxyXG5cdFx0fSkpO1xyXG5cclxuXHRcdC8vIExpc3RlbnMgZm9yIHBhc3RpbmcgaW4gZmlsZXMuXHJcblx0XHR0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKCdlZGl0b3ItcGFzdGUnLCgpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ3NvbWV0aGluZyB3YXMgcGFzdGVkJylcclxuXHRcdH0pKTtcclxuXHRcdFxyXG5cdFx0Ly8gTGlzdGVucyBmb3IgYSBuZXcgd2luZG93LlxyXG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLndvcmtzcGFjZS5vbignd2luZG93LW9wZW4nLCgpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ29wZW5lZCB3aW5kb3cnKVxyXG5cdFx0fSkpO1xyXG5cclxuXHRcdC8vIExpc3RlbnMgZm9yIGNsb3NpbmcgYSB3aW5kb3cuXHJcblx0XHR0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAud29ya3NwYWNlLm9uKCd3aW5kb3ctY2xvc2UnLCgpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ2Nsb3NlZCB3aW5kb3cnKVxyXG5cdFx0fSkpO1xyXG5cdH1cclxuXHJcblx0b251bmxvYWQoKSB7XHJcblxyXG5cdH1cclxuXHJcblx0Ly8gTG9hZCB0aGUgc2V0dGluZ3MuIFxyXG5cdGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcclxuXHRcdHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xyXG5cdH1cclxuXHQvLyBTYXZlIHRoZSBzZXR0aW5ncy5cclxuXHRhc3luYyBzYXZlU2V0dGluZ3MoKSB7XHJcblx0XHRhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xyXG5cdH1cclxufVxyXG5cclxuXHJcblxyXG5cclxuIl0sIm5hbWVzIjpbIlBsdWdpblNldHRpbmdUYWIiLCJTZXR0aW5nIiwiZ2xvYmFsIiwiUGx1Z2luIiwiSG93bCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF1REE7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUks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QUFDO0FBQzNCLE9BQU0sSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDdkIsT0FBTSxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztBQUM3QjtBQUNBO0FBQ0EsT0FBTSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDbkQsT0FBTSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEQsT0FBTSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEQsT0FBTSxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDckUsT0FBTSxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDckUsT0FBTSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDekQsT0FBTSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEQsT0FBTSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEQsT0FBTSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEQsT0FBTSxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDNUQsT0FBTSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEQsT0FBTSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEQsT0FBTSxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDNUQsT0FBTSxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUMxQjtBQUNBO0FBQ0EsT0FBTSxJQUFJLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzVEO0FBQ0E7QUFDQSxPQUFNLElBQUksT0FBTyxNQUFNLENBQUMsR0FBRyxLQUFLLFdBQVcsSUFBSSxNQUFNLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUU7QUFDaEYsU0FBUSxNQUFNLENBQUMsWUFBWSxFQUFFLENB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RUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQztBQUN0RyxPQUFNLElBQUksT0FBTyxHQUFHLENBQUMsUUFBUSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5RCxPQUFNLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO09BQzNDLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztBQUM1RSxPQUFNLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBQzdCO0FBQ0E7QUFDQTtBQUNBLE9BQU0sS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDM0I7QUFDQTtPQUNNLElBQUksU0FBUyxHQUFHLFdBQVc7QUFDakMsU0FBUSxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUM5QixTQUFRLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFNBQVEsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDN0IsU0FBUSxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztTQUNuQixLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRSxRQUFPLENBQUM7QUFDUjtBQUNBO0FBQ0EsT0FB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LElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNsRCxLQUFJLEdBQUcsR0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ2xELEtBQUksR0FBRyxHQUFHLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDbEQ7QUFDQSxLQUFJLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxFQUFFO0FBQy9CLE9BQU0sSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDbkQ7T0FDTSxJQUFJLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLFdBQVcsRUFBRTtTQUNyRCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUMzRSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUMzRSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUMzRSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN4RSxJQUFJLENBQUMsR0FBRyxDQUFD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
