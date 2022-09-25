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
            this.audio = new howler.Howl({ src: [audioMp3] });
            this.addCommand({
                id: 'play-file',
                name: 'Play file',
                callback: () => {
                    let sound = new howler.Howl({
                        src: [audioMp3],
                        html5: true
                    });
                    sound.play();
                }
            });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNldHRpbmdzLnRzIiwibm9kZV9tb2R1bGVzL2hvd2xlci9kaXN0L2hvd2xlci5qcyIsImF1ZGlvLm1wMyIsIm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlICovXHJcblxyXG52YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uKGQsIGIpIHtcclxuICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcclxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XHJcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBpZiAodHlwZW9mIGIgIT09IFwiZnVuY3Rpb25cIiAmJiBiICE9PSBudWxsKVxyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDbGFzcyBleHRlbmRzIHZhbHVlIFwiICsgU3RyaW5nKGIpICsgXCIgaXMgbm90IGEgY29uc3RydWN0b3Igb3IgbnVsbFwiKTtcclxuICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2Fzc2lnbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIF9fYXNzaWduKHQpIHtcclxuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKSB0W3BdID0gc1twXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVzdChzLCBlKSB7XHJcbiAgICB2YXIgdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXHJcbiAgICAgICAgdFtwXSA9IHNbcF07XHJcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMCAmJiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwocywgcFtpXSkpXHJcbiAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobSwgayk7XHJcbiAgICBpZiAoIWRlc2MgfHwgKFwiZ2V0XCIgaW4gZGVzYyA/ICFtLl9fZXNNb2R1bGUgOiBkZXNjLndyaXRhYmxlIHx8IGRlc2MuY29uZmlndXJhYmxlKSkge1xyXG4gICAgICAgIGRlc2MgPSB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH07XHJcbiAgICB9XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIGRlc2MpO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSwgcGFjaykge1xyXG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XHJcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XHJcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaWYgKGdbbl0pIGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHJlc3VtZShuLCB2KSB7IHRyeSB7IHN0ZXAoZ1tuXSh2KSk7IH0gY2F0Y2ggKGUpIHsgc2V0dGxlKHFbMF1bM10sIGUpOyB9IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAocikgeyByLnZhbHVlIGluc3RhbmNlb2YgX19hd2FpdCA/IFByb21pc2UucmVzb2x2ZShyLnZhbHVlLnYpLnRoZW4oZnVsZmlsbCwgcmVqZWN0KSA6IHNldHRsZShxWzBdWzJdLCByKTsgfVxyXG4gICAgZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkgeyByZXN1bWUoXCJuZXh0XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gcmVqZWN0KHZhbHVlKSB7IHJlc3VtZShcInRocm93XCIsIHZhbHVlKTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKGYsIHYpIHsgaWYgKGYodiksIHEuc2hpZnQoKSwgcS5sZW5ndGgpIHJlc3VtZShxWzBdWzBdLCBxWzBdWzFdKTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hc3luY0RlbGVnYXRvcihvKSB7XHJcbiAgICB2YXIgaSwgcDtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiwgZnVuY3Rpb24gKGUpIHsgdGhyb3cgZTsgfSksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4sIGYpIHsgaVtuXSA9IG9bbl0gPyBmdW5jdGlvbiAodikgeyByZXR1cm4gKHAgPSAhcCkgPyB7IHZhbHVlOiBfX2F3YWl0KG9bbl0odikpLCBkb25lOiBuID09PSBcInJldHVyblwiIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgdikge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIFwiZGVmYXVsdFwiLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2IH0pO1xyXG59KSA6IGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIG9bXCJkZWZhdWx0XCJdID0gdjtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydFN0YXIobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKGsgIT09IFwiZGVmYXVsdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSBfX2NyZWF0ZUJpbmRpbmcocmVzdWx0LCBtb2QsIGspO1xyXG4gICAgX19zZXRNb2R1bGVEZWZhdWx0KHJlc3VsdCwgbW9kKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydERlZmF1bHQobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IGRlZmF1bHQ6IG1vZCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZEdldChyZWNlaXZlciwgc3RhdGUsIGtpbmQsIGYpIHtcclxuICAgIGlmIChraW5kID09PSBcImFcIiAmJiAhZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgYWNjZXNzb3Igd2FzIGRlZmluZWQgd2l0aG91dCBhIGdldHRlclwiKTtcclxuICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyICE9PSBzdGF0ZSB8fCAhZiA6ICFzdGF0ZS5oYXMocmVjZWl2ZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHJlYWQgcHJpdmF0ZSBtZW1iZXIgZnJvbSBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIGtpbmQgPT09IFwibVwiID8gZiA6IGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyKSA6IGYgPyBmLnZhbHVlIDogc3RhdGUuZ2V0KHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRTZXQocmVjZWl2ZXIsIHN0YXRlLCB2YWx1ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwibVwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBtZXRob2QgaXMgbm90IHdyaXRhYmxlXCIpO1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgc2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3Qgd3JpdGUgcHJpdmF0ZSBtZW1iZXIgdG8gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcclxuICAgIHJldHVybiAoa2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIsIHZhbHVlKSA6IGYgPyBmLnZhbHVlID0gdmFsdWUgOiBzdGF0ZS5zZXQocmVjZWl2ZXIsIHZhbHVlKSksIHZhbHVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZEluKHN0YXRlLCByZWNlaXZlcikge1xyXG4gICAgaWYgKHJlY2VpdmVyID09PSBudWxsIHx8ICh0eXBlb2YgcmVjZWl2ZXIgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHJlY2VpdmVyICE9PSBcImZ1bmN0aW9uXCIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHVzZSAnaW4nIG9wZXJhdG9yIG9uIG5vbi1vYmplY3RcIik7XHJcbiAgICByZXR1cm4gdHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciA9PT0gc3RhdGUgOiBzdGF0ZS5oYXMocmVjZWl2ZXIpO1xyXG59XHJcbiIsImltcG9ydCBTb3VuZFBsdWdpbiBmcm9tIFwibWFpblwiO1xyXG5pbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTb3VuZFNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcclxuXHRwbHVnaW46IFNvdW5kUGx1Z2luO1xyXG5cdC8vID8/XHJcblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogU291bmRQbHVnaW4pIHtcclxuXHRcdHN1cGVyKGFwcCwgcGx1Z2luKTtcclxuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xyXG5cdH1cclxuICAgIGRpc3BsYXkoKTogdm9pZCB7XHJcblx0XHRjb25zdCB7Y29udGFpbmVyRWx9ID0gdGhpcztcclxuXHRcdC8vIFByZXZlbnRzIGFkZGVkIGNvbnRhaW5lcnMgb24gb3Blbi5cclxuXHRcdGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblx0XHQvLyBBZGRzIGluZm9ybWF0aW9uLlxyXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywge3RleHQ6ICdIZWFkaW5nIDInfSk7XHJcblxyXG5cdFx0Ly8gQWRkcyBsaW5lLiBUaGVuIGluZm9ybWF0aW9uLlx0XHJcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuXHRcdFx0Ly8gQWRkcyBuYW1lIGFuZCBkZXNjcmlwdGlvbi5cclxuXHRcdFx0LnNldE5hbWUoJ1NldHRpbmcgTmFtZScpXHJcblx0XHRcdC5zZXREZXNjKCdBIGRlc2NyaXB0aW9uJylcclxuXHRcdFx0Ly8gQWRkcyBpbnB1dCBib3guXHJcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxyXG5cdFx0XHRcdC8vIENyZWF0ZXMgYSB2YWx1ZSB0byBzYXZlIGluZm9ybWF0aW9uLlxyXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5teVNldHRpbmcpXHJcblx0XHRcdFx0Ly8gUGxhY2Vob2xkZXIgdGV4dC5cclxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJ1BsYWNlaG9sZGVyIHRleHQnKVxyXG5cdFx0XHRcdC8vIFdoZW4gdGV4dCBpcyBjaGFuZ2VkIHRyaWdnZXIuXHJcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xyXG5cdFx0XHRcdFx0Ly8gQ2hhbmdlIHRoZSBteVNldHRpbmcgdmFsdWUuXHJcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5teVNldHRpbmcgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdC8vID8/XHJcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuXHRcdFx0XHR9KSlcclxuXHR9XHJcbn0iLCIvKiFcbiAqICBob3dsZXIuanMgdjIuMi4zXG4gKiAgaG93bGVyanMuY29tXG4gKlxuICogIChjKSAyMDEzLTIwMjAsIEphbWVzIFNpbXBzb24gb2YgR29sZEZpcmUgU3R1ZGlvc1xuICogIGdvbGRmaXJlc3R1ZGlvcy5jb21cbiAqXG4gKiAgTUlUIExpY2Vuc2VcbiAqL1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKiBHbG9iYWwgTWV0aG9kcyAqKi9cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQ3JlYXRlIHRoZSBnbG9iYWwgY29udHJvbGxlci4gQWxsIGNvbnRhaW5lZCBtZXRob2RzIGFuZCBwcm9wZXJ0aWVzIGFwcGx5XG4gICAqIHRvIGFsbCBzb3VuZHMgdGhhdCBhcmUgY3VycmVudGx5IHBsYXlpbmcgb3Igd2lsbCBiZSBpbiB0aGUgZnV0dXJlLlxuICAgKi9cbiAgdmFyIEhvd2xlckdsb2JhbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW5pdCgpO1xuICB9O1xuICBIb3dsZXJHbG9iYWwucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgdGhlIGdsb2JhbCBIb3dsZXIgb2JqZWN0LlxuICAgICAqIEByZXR1cm4ge0hvd2xlcn1cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIC8vIENyZWF0ZSBhIGdsb2JhbCBJRCBjb3VudGVyLlxuICAgICAgc2VsZi5fY291bnRlciA9IDEwMDA7XG5cbiAgICAgIC8vIFBvb2wgb2YgdW5sb2NrZWQgSFRNTDUgQXVkaW8gb2JqZWN0cy5cbiAgICAgIHNlbGYuX2h0bWw1QXVkaW9Qb29sID0gW107XG4gICAgICBzZWxmLmh0bWw1UG9vbFNpemUgPSAxMDtcblxuICAgICAgLy8gSW50ZXJuYWwgcHJvcGVydGllcy5cbiAgICAgIHNlbGYuX2NvZGVjcyA9IHt9O1xuICAgICAgc2VsZi5faG93bHMgPSBbXTtcbiAgICAgIHNlbGYuX211dGVkID0gZmFsc2U7XG4gICAgICBzZWxmLl92b2x1bWUgPSAxO1xuICAgICAgc2VsZi5fY2FuUGxheUV2ZW50ID0gJ2NhbnBsYXl0aHJvdWdoJztcbiAgICAgIHNlbGYuX25hdmlnYXRvciA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cubmF2aWdhdG9yKSA/IHdpbmRvdy5uYXZpZ2F0b3IgOiBudWxsO1xuXG4gICAgICAvLyBQdWJsaWMgcHJvcGVydGllcy5cbiAgICAgIHNlbGYubWFzdGVyR2FpbiA9IG51bGw7XG4gICAgICBzZWxmLm5vQXVkaW8gPSBmYWxzZTtcbiAgICAgIHNlbGYudXNpbmdXZWJBdWRpbyA9IHRydWU7XG4gICAgICBzZWxmLmF1dG9TdXNwZW5kID0gdHJ1ZTtcbiAgICAgIHNlbGYuY3R4ID0gbnVsbDtcblxuICAgICAgLy8gU2V0IHRvIGZhbHNlIHRvIGRpc2FibGUgdGhlIGF1dG8gYXVkaW8gdW5sb2NrZXIuXG4gICAgICBzZWxmLmF1dG9VbmxvY2sgPSB0cnVlO1xuXG4gICAgICAvLyBTZXR1cCB0aGUgdmFyaW91cyBzdGF0ZSB2YWx1ZXMgZm9yIGdsb2JhbCB0cmFja2luZy5cbiAgICAgIHNlbGYuX3NldHVwKCk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQvc2V0IHRoZSBnbG9iYWwgdm9sdW1lIGZvciBhbGwgc291bmRzLlxuICAgICAqIEBwYXJhbSAge0Zsb2F0fSB2b2wgVm9sdW1lIGZyb20gMC4wIHRvIDEuMC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXIvRmxvYXR9ICAgICBSZXR1cm5zIHNlbGYgb3IgY3VycmVudCB2b2x1bWUuXG4gICAgICovXG4gICAgdm9sdW1lOiBmdW5jdGlvbih2b2wpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG4gICAgICB2b2wgPSBwYXJzZUZsb2F0KHZvbCk7XG5cbiAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gQXVkaW9Db250ZXh0IGNyZWF0ZWQgeWV0LCBydW4gdGhlIHNldHVwLlxuICAgICAgaWYgKCFzZWxmLmN0eCkge1xuICAgICAgICBzZXR1cEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHZvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgdm9sID49IDAgJiYgdm9sIDw9IDEpIHtcbiAgICAgICAgc2VsZi5fdm9sdW1lID0gdm9sO1xuXG4gICAgICAgIC8vIERvbid0IHVwZGF0ZSBhbnkgb2YgdGhlIG5vZGVzIGlmIHdlIGFyZSBtdXRlZC5cbiAgICAgICAgaWYgKHNlbGYuX211dGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXaGVuIHVzaW5nIFdlYiBBdWRpbywgd2UganVzdCBuZWVkIHRvIGFkanVzdCB0aGUgbWFzdGVyIGdhaW4uXG4gICAgICAgIGlmIChzZWxmLnVzaW5nV2ViQXVkaW8pIHtcbiAgICAgICAgICBzZWxmLm1hc3RlckdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZSh2b2wsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9vcCB0aHJvdWdoIGFuZCBjaGFuZ2Ugdm9sdW1lIGZvciBhbGwgSFRNTDUgYXVkaW8gbm9kZXMuXG4gICAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICghc2VsZi5faG93bHNbaV0uX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgICAvLyBHZXQgYWxsIG9mIHRoZSBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgICAgICAgICAgdmFyIGlkcyA9IHNlbGYuX2hvd2xzW2ldLl9nZXRTb3VuZElkcygpO1xuXG4gICAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHNvdW5kcyBhbmQgY2hhbmdlIHRoZSB2b2x1bWVzLlxuICAgICAgICAgICAgZm9yICh2YXIgaj0wOyBqPGlkcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9ob3dsc1tpXS5fc291bmRCeUlkKGlkc1tqXSk7XG5cbiAgICAgICAgICAgICAgaWYgKHNvdW5kICYmIHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICAgICAgc291bmQuX25vZGUudm9sdW1lID0gc291bmQuX3ZvbHVtZSAqIHZvbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZi5fdm9sdW1lO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgbXV0aW5nIGFuZCB1bm11dGluZyBnbG9iYWxseS5cbiAgICAgKiBAcGFyYW0gIHtCb29sZWFufSBtdXRlZCBJcyBtdXRlZCBvciBub3QuXG4gICAgICovXG4gICAgbXV0ZTogZnVuY3Rpb24obXV0ZWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYW4gQXVkaW9Db250ZXh0IGNyZWF0ZWQgeWV0LCBydW4gdGhlIHNldHVwLlxuICAgICAgaWYgKCFzZWxmLmN0eCkge1xuICAgICAgICBzZXR1cEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLl9tdXRlZCA9IG11dGVkO1xuXG4gICAgICAvLyBXaXRoIFdlYiBBdWRpbywgd2UganVzdCBuZWVkIHRvIG11dGUgdGhlIG1hc3RlciBnYWluLlxuICAgICAgaWYgKHNlbGYudXNpbmdXZWJBdWRpbykge1xuICAgICAgICBzZWxmLm1hc3RlckdhaW4uZ2Fpbi5zZXRWYWx1ZUF0VGltZShtdXRlZCA/IDAgOiBzZWxmLl92b2x1bWUsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgfVxuXG4gICAgICAvLyBMb29wIHRocm91Z2ggYW5kIG11dGUgYWxsIEhUTUw1IEF1ZGlvIG5vZGVzLlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX2hvd2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghc2VsZi5faG93bHNbaV0uX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgLy8gR2V0IGFsbCBvZiB0aGUgc291bmRzIGluIHRoaXMgSG93bCBncm91cC5cbiAgICAgICAgICB2YXIgaWRzID0gc2VsZi5faG93bHNbaV0uX2dldFNvdW5kSWRzKCk7XG5cbiAgICAgICAgICAvLyBMb29wIHRocm91Z2ggYWxsIHNvdW5kcyBhbmQgbWFyayB0aGUgYXVkaW8gbm9kZSBhcyBtdXRlZC5cbiAgICAgICAgICBmb3IgKHZhciBqPTA7IGo8aWRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9ob3dsc1tpXS5fc291bmRCeUlkKGlkc1tqXSk7XG5cbiAgICAgICAgICAgIGlmIChzb3VuZCAmJiBzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5tdXRlZCA9IChtdXRlZCkgPyB0cnVlIDogc291bmQuX211dGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlIHN0b3BwaW5nIGFsbCBzb3VuZHMgZ2xvYmFsbHkuXG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMgfHwgSG93bGVyO1xuXG4gICAgICAvLyBMb29wIHRocm91Z2ggYWxsIEhvd2xzIGFuZCBzdG9wIHRoZW0uXG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5faG93bHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2VsZi5faG93bHNbaV0uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVW5sb2FkIGFuZCBkZXN0cm95IGFsbCBjdXJyZW50bHkgbG9hZGVkIEhvd2wgb2JqZWN0cy5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgdW5sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIGZvciAodmFyIGk9c2VsZi5faG93bHMubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xuICAgICAgICBzZWxmLl9ob3dsc1tpXS51bmxvYWQoKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGEgbmV3IEF1ZGlvQ29udGV4dCB0byBtYWtlIHN1cmUgaXQgaXMgZnVsbHkgcmVzZXQuXG4gICAgICBpZiAoc2VsZi51c2luZ1dlYkF1ZGlvICYmIHNlbGYuY3R4ICYmIHR5cGVvZiBzZWxmLmN0eC5jbG9zZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2VsZi5jdHguY2xvc2UoKTtcbiAgICAgICAgc2VsZi5jdHggPSBudWxsO1xuICAgICAgICBzZXR1cEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgZm9yIGNvZGVjIHN1cHBvcnQgb2Ygc3BlY2lmaWMgZXh0ZW5zaW9uLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZXh0IEF1ZGlvIGZpbGUgZXh0ZW50aW9uLlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgY29kZWNzOiBmdW5jdGlvbihleHQpIHtcbiAgICAgIHJldHVybiAodGhpcyB8fCBIb3dsZXIpLl9jb2RlY3NbZXh0LnJlcGxhY2UoL154LS8sICcnKV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldHVwIHZhcmlvdXMgc3RhdGUgdmFsdWVzIGZvciBnbG9iYWwgdHJhY2tpbmcuXG4gICAgICogQHJldHVybiB7SG93bGVyfVxuICAgICAqL1xuICAgIF9zZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMgfHwgSG93bGVyO1xuXG4gICAgICAvLyBLZWVwcyB0cmFjayBvZiB0aGUgc3VzcGVuZC9yZXN1bWUgc3RhdGUgb2YgdGhlIEF1ZGlvQ29udGV4dC5cbiAgICAgIHNlbGYuc3RhdGUgPSBzZWxmLmN0eCA/IHNlbGYuY3R4LnN0YXRlIHx8ICdzdXNwZW5kZWQnIDogJ3N1c3BlbmRlZCc7XG5cbiAgICAgIC8vIEF1dG9tYXRpY2FsbHkgYmVnaW4gdGhlIDMwLXNlY29uZCBzdXNwZW5kIHByb2Nlc3NcbiAgICAgIHNlbGYuX2F1dG9TdXNwZW5kKCk7XG5cbiAgICAgIC8vIENoZWNrIGlmIGF1ZGlvIGlzIGF2YWlsYWJsZS5cbiAgICAgIGlmICghc2VsZi51c2luZ1dlYkF1ZGlvKSB7XG4gICAgICAgIC8vIE5vIGF1ZGlvIGlzIGF2YWlsYWJsZSBvbiB0aGlzIHN5c3RlbSBpZiBub0F1ZGlvIGlzIHNldCB0byB0cnVlLlxuICAgICAgICBpZiAodHlwZW9mIEF1ZGlvICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdGVzdCA9IG5ldyBBdWRpbygpO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgY2FucGxheXRocm91Z2ggZXZlbnQgaXMgYXZhaWxhYmxlLlxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZXN0Lm9uY2FucGxheXRocm91Z2ggPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2NhblBsYXlFdmVudCA9ICdjYW5wbGF5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIHNlbGYubm9BdWRpbyA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYubm9BdWRpbyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVGVzdCB0byBtYWtlIHN1cmUgYXVkaW8gaXNuJ3QgZGlzYWJsZWQgaW4gSW50ZXJuZXQgRXhwbG9yZXIuXG4gICAgICB0cnkge1xuICAgICAgICB2YXIgdGVzdCA9IG5ldyBBdWRpbygpO1xuICAgICAgICBpZiAodGVzdC5tdXRlZCkge1xuICAgICAgICAgIHNlbGYubm9BdWRpbyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgIC8vIENoZWNrIGZvciBzdXBwb3J0ZWQgY29kZWNzLlxuICAgICAgaWYgKCFzZWxmLm5vQXVkaW8pIHtcbiAgICAgICAgc2VsZi5fc2V0dXBDb2RlY3MoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGZvciBicm93c2VyIHN1cHBvcnQgZm9yIHZhcmlvdXMgY29kZWNzIGFuZCBjYWNoZSB0aGUgcmVzdWx0cy5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgX3NldHVwQ29kZWNzOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG4gICAgICB2YXIgYXVkaW9UZXN0ID0gbnVsbDtcblxuICAgICAgLy8gTXVzdCB3cmFwIGluIGEgdHJ5L2NhdGNoIGJlY2F1c2UgSUUxMSBpbiBzZXJ2ZXIgbW9kZSB0aHJvd3MgYW4gZXJyb3IuXG4gICAgICB0cnkge1xuICAgICAgICBhdWRpb1Rlc3QgPSAodHlwZW9mIEF1ZGlvICE9PSAndW5kZWZpbmVkJykgPyBuZXcgQXVkaW8oKSA6IG51bGw7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIGlmICghYXVkaW9UZXN0IHx8IHR5cGVvZiBhdWRpb1Rlc3QuY2FuUGxheVR5cGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIHZhciBtcGVnVGVzdCA9IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vbXBlZzsnKS5yZXBsYWNlKC9ebm8kLywgJycpO1xuXG4gICAgICAvLyBPcGVyYSB2ZXJzaW9uIDwzMyBoYXMgbWl4ZWQgTVAzIHN1cHBvcnQsIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yIGFuZCBibG9jayBpdC5cbiAgICAgIHZhciB1YSA9IHNlbGYuX25hdmlnYXRvciA/IHNlbGYuX25hdmlnYXRvci51c2VyQWdlbnQgOiAnJztcbiAgICAgIHZhciBjaGVja09wZXJhID0gdWEubWF0Y2goL09QUlxcLyhbMC02XS4pL2cpO1xuICAgICAgdmFyIGlzT2xkT3BlcmEgPSAoY2hlY2tPcGVyYSAmJiBwYXJzZUludChjaGVja09wZXJhWzBdLnNwbGl0KCcvJylbMV0sIDEwKSA8IDMzKTtcbiAgICAgIHZhciBjaGVja1NhZmFyaSA9IHVhLmluZGV4T2YoJ1NhZmFyaScpICE9PSAtMSAmJiB1YS5pbmRleE9mKCdDaHJvbWUnKSA9PT0gLTE7XG4gICAgICB2YXIgc2FmYXJpVmVyc2lvbiA9IHVhLm1hdGNoKC9WZXJzaW9uXFwvKC4qPykgLyk7XG4gICAgICB2YXIgaXNPbGRTYWZhcmkgPSAoY2hlY2tTYWZhcmkgJiYgc2FmYXJpVmVyc2lvbiAmJiBwYXJzZUludChzYWZhcmlWZXJzaW9uWzFdLCAxMCkgPCAxNSk7XG5cbiAgICAgIHNlbGYuX2NvZGVjcyA9IHtcbiAgICAgICAgbXAzOiAhISghaXNPbGRPcGVyYSAmJiAobXBlZ1Rlc3QgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9tcDM7JykucmVwbGFjZSgvXm5vJC8sICcnKSkpLFxuICAgICAgICBtcGVnOiAhIW1wZWdUZXN0LFxuICAgICAgICBvcHVzOiAhIWF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vb2dnOyBjb2RlY3M9XCJvcHVzXCInKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBvZ2c6ICEhYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9vZ2c7IGNvZGVjcz1cInZvcmJpc1wiJykucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgb2dhOiAhIWF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vb2dnOyBjb2RlY3M9XCJ2b3JiaXNcIicpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIHdhdjogISEoYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby93YXY7IGNvZGVjcz1cIjFcIicpIHx8IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vd2F2JykpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIGFhYzogISFhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL2FhYzsnKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBjYWY6ICEhYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby94LWNhZjsnKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICBtNGE6ICEhKGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8veC1tNGE7JykgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9tNGE7JykgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9hYWM7JykpLnJlcGxhY2UoL15ubyQvLCAnJyksXG4gICAgICAgIG00YjogISEoYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby94LW00YjsnKSB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL200YjsnKSB8fCBhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL2FhYzsnKSkucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgbXA0OiAhIShhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL3gtbXA0OycpIHx8IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vbXA0OycpIHx8IGF1ZGlvVGVzdC5jYW5QbGF5VHlwZSgnYXVkaW8vYWFjOycpKS5yZXBsYWNlKC9ebm8kLywgJycpLFxuICAgICAgICB3ZWJhOiAhISghaXNPbGRTYWZhcmkgJiYgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby93ZWJtOyBjb2RlY3M9XCJ2b3JiaXNcIicpLnJlcGxhY2UoL15ubyQvLCAnJykpLFxuICAgICAgICB3ZWJtOiAhISghaXNPbGRTYWZhcmkgJiYgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby93ZWJtOyBjb2RlY3M9XCJ2b3JiaXNcIicpLnJlcGxhY2UoL15ubyQvLCAnJykpLFxuICAgICAgICBkb2xieTogISFhdWRpb1Rlc3QuY2FuUGxheVR5cGUoJ2F1ZGlvL21wNDsgY29kZWNzPVwiZWMtM1wiJykucmVwbGFjZSgvXm5vJC8sICcnKSxcbiAgICAgICAgZmxhYzogISEoYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby94LWZsYWM7JykgfHwgYXVkaW9UZXN0LmNhblBsYXlUeXBlKCdhdWRpby9mbGFjOycpKS5yZXBsYWNlKC9ebm8kLywgJycpXG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU29tZSBicm93c2Vycy9kZXZpY2VzIHdpbGwgb25seSBhbGxvdyBhdWRpbyB0byBiZSBwbGF5ZWQgYWZ0ZXIgYSB1c2VyIGludGVyYWN0aW9uLlxuICAgICAqIEF0dGVtcHQgdG8gYXV0b21hdGljYWxseSB1bmxvY2sgYXVkaW8gb24gdGhlIGZpcnN0IHVzZXIgaW50ZXJhY3Rpb24uXG4gICAgICogQ29uY2VwdCBmcm9tOiBodHRwOi8vcGF1bGJha2F1cy5jb20vdHV0b3JpYWxzL2h0bWw1L3dlYi1hdWRpby1vbi1pb3MvXG4gICAgICogQHJldHVybiB7SG93bGVyfVxuICAgICAqL1xuICAgIF91bmxvY2tBdWRpbzogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXMgfHwgSG93bGVyO1xuXG4gICAgICAvLyBPbmx5IHJ1biB0aGlzIGlmIFdlYiBBdWRpbyBpcyBzdXBwb3J0ZWQgYW5kIGl0IGhhc24ndCBhbHJlYWR5IGJlZW4gdW5sb2NrZWQuXG4gICAgICBpZiAoc2VsZi5fYXVkaW9VbmxvY2tlZCB8fCAhc2VsZi5jdHgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxmLl9hdWRpb1VubG9ja2VkID0gZmFsc2U7XG4gICAgICBzZWxmLmF1dG9VbmxvY2sgPSBmYWxzZTtcblxuICAgICAgLy8gU29tZSBtb2JpbGUgZGV2aWNlcy9wbGF0Zm9ybXMgaGF2ZSBkaXN0b3J0aW9uIGlzc3VlcyB3aGVuIG9wZW5pbmcvY2xvc2luZyB0YWJzIGFuZC9vciB3ZWIgdmlld3MuXG4gICAgICAvLyBCdWdzIGluIHRoZSBicm93c2VyIChlc3BlY2lhbGx5IE1vYmlsZSBTYWZhcmkpIGNhbiBjYXVzZSB0aGUgc2FtcGxlUmF0ZSB0byBjaGFuZ2UgZnJvbSA0NDEwMCB0byA0ODAwMC5cbiAgICAgIC8vIEJ5IGNhbGxpbmcgSG93bGVyLnVubG9hZCgpLCB3ZSBjcmVhdGUgYSBuZXcgQXVkaW9Db250ZXh0IHdpdGggdGhlIGNvcnJlY3Qgc2FtcGxlUmF0ZS5cbiAgICAgIGlmICghc2VsZi5fbW9iaWxlVW5sb2FkZWQgJiYgc2VsZi5jdHguc2FtcGxlUmF0ZSAhPT0gNDQxMDApIHtcbiAgICAgICAgc2VsZi5fbW9iaWxlVW5sb2FkZWQgPSB0cnVlO1xuICAgICAgICBzZWxmLnVubG9hZCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTY3JhdGNoIGJ1ZmZlciBmb3IgZW5hYmxpbmcgaU9TIHRvIGRpc3Bvc2Ugb2Ygd2ViIGF1ZGlvIGJ1ZmZlcnMgY29ycmVjdGx5LCBhcyBwZXI6XG4gICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI0MTE5Njg0XG4gICAgICBzZWxmLl9zY3JhdGNoQnVmZmVyID0gc2VsZi5jdHguY3JlYXRlQnVmZmVyKDEsIDEsIDIyMDUwKTtcblxuICAgICAgLy8gQ2FsbCB0aGlzIG1ldGhvZCBvbiB0b3VjaCBzdGFydCB0byBjcmVhdGUgYW5kIHBsYXkgYSBidWZmZXIsXG4gICAgICAvLyB0aGVuIGNoZWNrIGlmIHRoZSBhdWRpbyBhY3R1YWxseSBwbGF5ZWQgdG8gZGV0ZXJtaW5lIGlmXG4gICAgICAvLyBhdWRpbyBoYXMgbm93IGJlZW4gdW5sb2NrZWQgb24gaU9TLCBBbmRyb2lkLCBldGMuXG4gICAgICB2YXIgdW5sb2NrID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyBDcmVhdGUgYSBwb29sIG9mIHVubG9ja2VkIEhUTUw1IEF1ZGlvIG9iamVjdHMgdGhhdCBjYW5cbiAgICAgICAgLy8gYmUgdXNlZCBmb3IgcGxheWluZyBzb3VuZHMgd2l0aG91dCB1c2VyIGludGVyYWN0aW9uLiBIVE1MNVxuICAgICAgICAvLyBBdWRpbyBvYmplY3RzIG11c3QgYmUgaW5kaXZpZHVhbGx5IHVubG9ja2VkLCBhcyBvcHBvc2VkXG4gICAgICAgIC8vIHRvIHRoZSBXZWJBdWRpbyBBUEkgd2hpY2ggb25seSBuZWVkcyBhIHNpbmdsZSBhY3RpdmF0aW9uLlxuICAgICAgICAvLyBUaGlzIG11c3Qgb2NjdXIgYmVmb3JlIFdlYkF1ZGlvIHNldHVwIG9yIHRoZSBzb3VyY2Uub25lbmRlZFxuICAgICAgICAvLyBldmVudCB3aWxsIG5vdCBmaXJlLlxuICAgICAgICB3aGlsZSAoc2VsZi5faHRtbDVBdWRpb1Bvb2wubGVuZ3RoIDwgc2VsZi5odG1sNVBvb2xTaXplKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBhdWRpb05vZGUgPSBuZXcgQXVkaW8oKTtcblxuICAgICAgICAgICAgLy8gTWFyayB0aGlzIEF1ZGlvIG9iamVjdCBhcyB1bmxvY2tlZCB0byBlbnN1cmUgaXQgY2FuIGdldCByZXR1cm5lZFxuICAgICAgICAgICAgLy8gdG8gdGhlIHVubG9ja2VkIHBvb2wgd2hlbiByZWxlYXNlZC5cbiAgICAgICAgICAgIGF1ZGlvTm9kZS5fdW5sb2NrZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyBBZGQgdGhlIGF1ZGlvIG5vZGUgdG8gdGhlIHBvb2wuXG4gICAgICAgICAgICBzZWxmLl9yZWxlYXNlSHRtbDVBdWRpbyhhdWRpb05vZGUpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHNlbGYubm9BdWRpbyA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMb29wIHRocm91Z2ggYW55IGFzc2lnbmVkIGF1ZGlvIG5vZGVzIGFuZCB1bmxvY2sgdGhlbS5cbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX2hvd2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKCFzZWxmLl9ob3dsc1tpXS5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAgIC8vIEdldCBhbGwgb2YgdGhlIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAgICAgICAgICB2YXIgaWRzID0gc2VsZi5faG93bHNbaV0uX2dldFNvdW5kSWRzKCk7XG5cbiAgICAgICAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgc291bmRzIGFuZCB1bmxvY2sgdGhlIGF1ZGlvIG5vZGVzLlxuICAgICAgICAgICAgZm9yICh2YXIgaj0wOyBqPGlkcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9ob3dsc1tpXS5fc291bmRCeUlkKGlkc1tqXSk7XG5cbiAgICAgICAgICAgICAgaWYgKHNvdW5kICYmIHNvdW5kLl9ub2RlICYmICFzb3VuZC5fbm9kZS5fdW5sb2NrZWQpIHtcbiAgICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5fdW5sb2NrZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmxvYWQoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpeCBBbmRyb2lkIGNhbiBub3QgcGxheSBpbiBzdXNwZW5kIHN0YXRlLlxuICAgICAgICBzZWxmLl9hdXRvUmVzdW1lKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGFuIGVtcHR5IGJ1ZmZlci5cbiAgICAgICAgdmFyIHNvdXJjZSA9IHNlbGYuY3R4LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgICBzb3VyY2UuYnVmZmVyID0gc2VsZi5fc2NyYXRjaEJ1ZmZlcjtcbiAgICAgICAgc291cmNlLmNvbm5lY3Qoc2VsZi5jdHguZGVzdGluYXRpb24pO1xuXG4gICAgICAgIC8vIFBsYXkgdGhlIGVtcHR5IGJ1ZmZlci5cbiAgICAgICAgaWYgKHR5cGVvZiBzb3VyY2Uuc3RhcnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgc291cmNlLm5vdGVPbigwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzb3VyY2Uuc3RhcnQoMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYWxsaW5nIHJlc3VtZSgpIG9uIGEgc3RhY2sgaW5pdGlhdGVkIGJ5IHVzZXIgZ2VzdHVyZSBpcyB3aGF0IGFjdHVhbGx5IHVubG9ja3MgdGhlIGF1ZGlvIG9uIEFuZHJvaWQgQ2hyb21lID49IDU1LlxuICAgICAgICBpZiAodHlwZW9mIHNlbGYuY3R4LnJlc3VtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHNlbGYuY3R4LnJlc3VtZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0dXAgYSB0aW1lb3V0IHRvIGNoZWNrIHRoYXQgd2UgYXJlIHVubG9ja2VkIG9uIHRoZSBuZXh0IGV2ZW50IGxvb3AuXG4gICAgICAgIHNvdXJjZS5vbmVuZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc291cmNlLmRpc2Nvbm5lY3QoMCk7XG5cbiAgICAgICAgICAvLyBVcGRhdGUgdGhlIHVubG9ja2VkIHN0YXRlIGFuZCBwcmV2ZW50IHRoaXMgY2hlY2sgZnJvbSBoYXBwZW5pbmcgYWdhaW4uXG4gICAgICAgICAgc2VsZi5fYXVkaW9VbmxvY2tlZCA9IHRydWU7XG5cbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHRvdWNoIHN0YXJ0IGxpc3RlbmVyLlxuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB1bmxvY2ssIHRydWUpO1xuICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdW5sb2NrLCB0cnVlKTtcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHVubG9jaywgdHJ1ZSk7XG4gICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHVubG9jaywgdHJ1ZSk7XG5cbiAgICAgICAgICAvLyBMZXQgYWxsIHNvdW5kcyBrbm93IHRoYXQgYXVkaW8gaGFzIGJlZW4gdW5sb2NrZWQuXG4gICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX2hvd2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzZWxmLl9ob3dsc1tpXS5fZW1pdCgndW5sb2NrJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfTtcblxuICAgICAgLy8gU2V0dXAgYSB0b3VjaCBzdGFydCBsaXN0ZW5lciB0byBhdHRlbXB0IGFuIHVubG9jayBpbi5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB1bmxvY2ssIHRydWUpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB1bmxvY2ssIHRydWUpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1bmxvY2ssIHRydWUpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHVubG9jaywgdHJ1ZSk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW4gdW5sb2NrZWQgSFRNTDUgQXVkaW8gb2JqZWN0IGZyb20gdGhlIHBvb2wuIElmIG5vbmUgYXJlIGxlZnQsXG4gICAgICogcmV0dXJuIGEgbmV3IEF1ZGlvIG9iamVjdCBhbmQgdGhyb3cgYSB3YXJuaW5nLlxuICAgICAqIEByZXR1cm4ge0F1ZGlvfSBIVE1MNSBBdWRpbyBvYmplY3QuXG4gICAgICovXG4gICAgX29idGFpbkh0bWw1QXVkaW86IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzIHx8IEhvd2xlcjtcblxuICAgICAgLy8gUmV0dXJuIHRoZSBuZXh0IG9iamVjdCBmcm9tIHRoZSBwb29sIGlmIG9uZSBleGlzdHMuXG4gICAgICBpZiAoc2VsZi5faHRtbDVBdWRpb1Bvb2wubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBzZWxmLl9odG1sNUF1ZGlvUG9vbC5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgLy8uQ2hlY2sgaWYgdGhlIGF1ZGlvIGlzIGxvY2tlZCBhbmQgdGhyb3cgYSB3YXJuaW5nLlxuICAgICAgdmFyIHRlc3RQbGF5ID0gbmV3IEF1ZGlvKCkucGxheSgpO1xuICAgICAgaWYgKHRlc3RQbGF5ICYmIHR5cGVvZiBQcm9taXNlICE9PSAndW5kZWZpbmVkJyAmJiAodGVzdFBsYXkgaW5zdGFuY2VvZiBQcm9taXNlIHx8IHR5cGVvZiB0ZXN0UGxheS50aGVuID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICB0ZXN0UGxheS5jYXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ0hUTUw1IEF1ZGlvIHBvb2wgZXhoYXVzdGVkLCByZXR1cm5pbmcgcG90ZW50aWFsbHkgbG9ja2VkIGF1ZGlvIG9iamVjdC4nKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgQXVkaW8oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGFuIGFjdGl2YXRlZCBIVE1MNSBBdWRpbyBvYmplY3QgdG8gdGhlIHBvb2wuXG4gICAgICogQHJldHVybiB7SG93bGVyfVxuICAgICAqL1xuICAgIF9yZWxlYXNlSHRtbDVBdWRpbzogZnVuY3Rpb24oYXVkaW8pIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcyB8fCBIb3dsZXI7XG5cbiAgICAgIC8vIERvbid0IGFkZCBhdWRpbyB0byB0aGUgcG9vbCBpZiB3ZSBkb24ndCBrbm93IGlmIGl0IGhhcyBiZWVuIHVubG9ja2VkLlxuICAgICAgaWYgKGF1ZGlvLl91bmxvY2tlZCkge1xuICAgICAgICBzZWxmLl9odG1sNUF1ZGlvUG9vbC5wdXNoKGF1ZGlvKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF1dG9tYXRpY2FsbHkgc3VzcGVuZCB0aGUgV2ViIEF1ZGlvIEF1ZGlvQ29udGV4dCBhZnRlciBubyBzb3VuZCBoYXMgcGxheWVkIGZvciAzMCBzZWNvbmRzLlxuICAgICAqIFRoaXMgc2F2ZXMgcHJvY2Vzc2luZy9lbmVyZ3kgYW5kIGZpeGVzIHZhcmlvdXMgYnJvd3Nlci1zcGVjaWZpYyBidWdzIHdpdGggYXVkaW8gZ2V0dGluZyBzdHVjay5cbiAgICAgKiBAcmV0dXJuIHtIb3dsZXJ9XG4gICAgICovXG4gICAgX2F1dG9TdXNwZW5kOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgaWYgKCFzZWxmLmF1dG9TdXNwZW5kIHx8ICFzZWxmLmN0eCB8fCB0eXBlb2Ygc2VsZi5jdHguc3VzcGVuZCA9PT0gJ3VuZGVmaW5lZCcgfHwgIUhvd2xlci51c2luZ1dlYkF1ZGlvKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgYW55IHNvdW5kcyBhcmUgcGxheWluZy5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9ob3dscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc2VsZi5faG93bHNbaV0uX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgZm9yICh2YXIgaj0wOyBqPHNlbGYuX2hvd2xzW2ldLl9zb3VuZHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmICghc2VsZi5faG93bHNbaV0uX3NvdW5kc1tqXS5fcGF1c2VkKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZi5fc3VzcGVuZFRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChzZWxmLl9zdXNwZW5kVGltZXIpO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBzb3VuZCBoYXMgcGxheWVkIGFmdGVyIDMwIHNlY29uZHMsIHN1c3BlbmQgdGhlIGNvbnRleHQuXG4gICAgICBzZWxmLl9zdXNwZW5kVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXNlbGYuYXV0b1N1c3BlbmQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLl9zdXNwZW5kVGltZXIgPSBudWxsO1xuICAgICAgICBzZWxmLnN0YXRlID0gJ3N1c3BlbmRpbmcnO1xuXG4gICAgICAgIC8vIEhhbmRsZSB1cGRhdGluZyB0aGUgc3RhdGUgb2YgdGhlIGF1ZGlvIGNvbnRleHQgYWZ0ZXIgc3VzcGVuZGluZy5cbiAgICAgICAgdmFyIGhhbmRsZVN1c3BlbnNpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZWxmLnN0YXRlID0gJ3N1c3BlbmRlZCc7XG5cbiAgICAgICAgICBpZiAoc2VsZi5fcmVzdW1lQWZ0ZXJTdXNwZW5kKSB7XG4gICAgICAgICAgICBkZWxldGUgc2VsZi5fcmVzdW1lQWZ0ZXJTdXNwZW5kO1xuICAgICAgICAgICAgc2VsZi5fYXV0b1Jlc3VtZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBFaXRoZXIgdGhlIHN0YXRlIGdldHMgc3VzcGVuZGVkIG9yIGl0IGlzIGludGVycnVwdGVkLlxuICAgICAgICAvLyBFaXRoZXIgd2F5LCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgc3RhdGUgdG8gc3VzcGVuZGVkLlxuICAgICAgICBzZWxmLmN0eC5zdXNwZW5kKCkudGhlbihoYW5kbGVTdXNwZW5zaW9uLCBoYW5kbGVTdXNwZW5zaW9uKTtcbiAgICAgIH0sIDMwMDAwKTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEF1dG9tYXRpY2FsbHkgcmVzdW1lIHRoZSBXZWIgQXVkaW8gQXVkaW9Db250ZXh0IHdoZW4gYSBuZXcgc291bmQgaXMgcGxheWVkLlxuICAgICAqIEByZXR1cm4ge0hvd2xlcn1cbiAgICAgKi9cbiAgICBfYXV0b1Jlc3VtZTogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGlmICghc2VsZi5jdHggfHwgdHlwZW9mIHNlbGYuY3R4LnJlc3VtZSA9PT0gJ3VuZGVmaW5lZCcgfHwgIUhvd2xlci51c2luZ1dlYkF1ZGlvKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGYuc3RhdGUgPT09ICdydW5uaW5nJyAmJiBzZWxmLmN0eC5zdGF0ZSAhPT0gJ2ludGVycnVwdGVkJyAmJiBzZWxmLl9zdXNwZW5kVGltZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGYuX3N1c3BlbmRUaW1lcik7XG4gICAgICAgIHNlbGYuX3N1c3BlbmRUaW1lciA9IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKHNlbGYuc3RhdGUgPT09ICdzdXNwZW5kZWQnIHx8IHNlbGYuc3RhdGUgPT09ICdydW5uaW5nJyAmJiBzZWxmLmN0eC5zdGF0ZSA9PT0gJ2ludGVycnVwdGVkJykge1xuICAgICAgICBzZWxmLmN0eC5yZXN1bWUoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlbGYuc3RhdGUgPSAncnVubmluZyc7XG5cbiAgICAgICAgICAvLyBFbWl0IHRvIGFsbCBIb3dscyB0aGF0IHRoZSBhdWRpbyBoYXMgcmVzdW1lZC5cbiAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5faG93bHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNlbGYuX2hvd2xzW2ldLl9lbWl0KCdyZXN1bWUnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChzZWxmLl9zdXNwZW5kVGltZXIpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoc2VsZi5fc3VzcGVuZFRpbWVyKTtcbiAgICAgICAgICBzZWxmLl9zdXNwZW5kVGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHNlbGYuc3RhdGUgPT09ICdzdXNwZW5kaW5nJykge1xuICAgICAgICBzZWxmLl9yZXN1bWVBZnRlclN1c3BlbmQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG4gIH07XG5cbiAgLy8gU2V0dXAgdGhlIGdsb2JhbCBhdWRpbyBjb250cm9sbGVyLlxuICB2YXIgSG93bGVyID0gbmV3IEhvd2xlckdsb2JhbCgpO1xuXG4gIC8qKiBHcm91cCBNZXRob2RzICoqL1xuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gYXVkaW8gZ3JvdXAgY29udHJvbGxlci5cbiAgICogQHBhcmFtIHtPYmplY3R9IG8gUGFzc2VkIGluIHByb3BlcnRpZXMgZm9yIHRoaXMgZ3JvdXAuXG4gICAqL1xuICB2YXIgSG93bCA9IGZ1bmN0aW9uKG8pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBUaHJvdyBhbiBlcnJvciBpZiBubyBzb3VyY2UgaXMgcHJvdmlkZWQuXG4gICAgaWYgKCFvLnNyYyB8fCBvLnNyYy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0FuIGFycmF5IG9mIHNvdXJjZSBmaWxlcyBtdXN0IGJlIHBhc3NlZCB3aXRoIGFueSBuZXcgSG93bC4nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLmluaXQobyk7XG4gIH07XG4gIEhvd2wucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYSBuZXcgSG93bCBncm91cCBvYmplY3QuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvIFBhc3NlZCBpbiBwcm9wZXJ0aWVzIGZvciB0aGlzIGdyb3VwLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24obykge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGFuIEF1ZGlvQ29udGV4dCBjcmVhdGVkIHlldCwgcnVuIHRoZSBzZXR1cC5cbiAgICAgIGlmICghSG93bGVyLmN0eCkge1xuICAgICAgICBzZXR1cEF1ZGlvQ29udGV4dCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXR1cCB1c2VyLWRlZmluZWQgZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICAgICAgc2VsZi5fYXV0b3BsYXkgPSBvLmF1dG9wbGF5IHx8IGZhbHNlO1xuICAgICAgc2VsZi5fZm9ybWF0ID0gKHR5cGVvZiBvLmZvcm1hdCAhPT0gJ3N0cmluZycpID8gby5mb3JtYXQgOiBbby5mb3JtYXRdO1xuICAgICAgc2VsZi5faHRtbDUgPSBvLmh0bWw1IHx8IGZhbHNlO1xuICAgICAgc2VsZi5fbXV0ZWQgPSBvLm11dGUgfHwgZmFsc2U7XG4gICAgICBzZWxmLl9sb29wID0gby5sb29wIHx8IGZhbHNlO1xuICAgICAgc2VsZi5fcG9vbCA9IG8ucG9vbCB8fCA1O1xuICAgICAgc2VsZi5fcHJlbG9hZCA9ICh0eXBlb2Ygby5wcmVsb2FkID09PSAnYm9vbGVhbicgfHwgby5wcmVsb2FkID09PSAnbWV0YWRhdGEnKSA/IG8ucHJlbG9hZCA6IHRydWU7XG4gICAgICBzZWxmLl9yYXRlID0gby5yYXRlIHx8IDE7XG4gICAgICBzZWxmLl9zcHJpdGUgPSBvLnNwcml0ZSB8fCB7fTtcbiAgICAgIHNlbGYuX3NyYyA9ICh0eXBlb2Ygby5zcmMgIT09ICdzdHJpbmcnKSA/IG8uc3JjIDogW28uc3JjXTtcbiAgICAgIHNlbGYuX3ZvbHVtZSA9IG8udm9sdW1lICE9PSB1bmRlZmluZWQgPyBvLnZvbHVtZSA6IDE7XG4gICAgICBzZWxmLl94aHIgPSB7XG4gICAgICAgIG1ldGhvZDogby54aHIgJiYgby54aHIubWV0aG9kID8gby54aHIubWV0aG9kIDogJ0dFVCcsXG4gICAgICAgIGhlYWRlcnM6IG8ueGhyICYmIG8ueGhyLmhlYWRlcnMgPyBvLnhoci5oZWFkZXJzIDogbnVsbCxcbiAgICAgICAgd2l0aENyZWRlbnRpYWxzOiBvLnhociAmJiBvLnhoci53aXRoQ3JlZGVudGlhbHMgPyBvLnhoci53aXRoQ3JlZGVudGlhbHMgOiBmYWxzZSxcbiAgICAgIH07XG5cbiAgICAgIC8vIFNldHVwIGFsbCBvdGhlciBkZWZhdWx0IHByb3BlcnRpZXMuXG4gICAgICBzZWxmLl9kdXJhdGlvbiA9IDA7XG4gICAgICBzZWxmLl9zdGF0ZSA9ICd1bmxvYWRlZCc7XG4gICAgICBzZWxmLl9zb3VuZHMgPSBbXTtcbiAgICAgIHNlbGYuX2VuZFRpbWVycyA9IHt9O1xuICAgICAgc2VsZi5fcXVldWUgPSBbXTtcbiAgICAgIHNlbGYuX3BsYXlMb2NrID0gZmFsc2U7XG5cbiAgICAgIC8vIFNldHVwIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgIHNlbGYuX29uZW5kID0gby5vbmVuZCA/IFt7Zm46IG8ub25lbmR9XSA6IFtdO1xuICAgICAgc2VsZi5fb25mYWRlID0gby5vbmZhZGUgPyBbe2ZuOiBvLm9uZmFkZX1dIDogW107XG4gICAgICBzZWxmLl9vbmxvYWQgPSBvLm9ubG9hZCA/IFt7Zm46IG8ub25sb2FkfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ubG9hZGVycm9yID0gby5vbmxvYWRlcnJvciA/IFt7Zm46IG8ub25sb2FkZXJyb3J9XSA6IFtdO1xuICAgICAgc2VsZi5fb25wbGF5ZXJyb3IgPSBvLm9ucGxheWVycm9yID8gW3tmbjogby5vbnBsYXllcnJvcn1dIDogW107XG4gICAgICBzZWxmLl9vbnBhdXNlID0gby5vbnBhdXNlID8gW3tmbjogby5vbnBhdXNlfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ucGxheSA9IG8ub25wbGF5ID8gW3tmbjogby5vbnBsYXl9XSA6IFtdO1xuICAgICAgc2VsZi5fb25zdG9wID0gby5vbnN0b3AgPyBbe2ZuOiBvLm9uc3RvcH1dIDogW107XG4gICAgICBzZWxmLl9vbm11dGUgPSBvLm9ubXV0ZSA/IFt7Zm46IG8ub25tdXRlfV0gOiBbXTtcbiAgICAgIHNlbGYuX29udm9sdW1lID0gby5vbnZvbHVtZSA/IFt7Zm46IG8ub252b2x1bWV9XSA6IFtdO1xuICAgICAgc2VsZi5fb25yYXRlID0gby5vbnJhdGUgPyBbe2ZuOiBvLm9ucmF0ZX1dIDogW107XG4gICAgICBzZWxmLl9vbnNlZWsgPSBvLm9uc2VlayA/IFt7Zm46IG8ub25zZWVrfV0gOiBbXTtcbiAgICAgIHNlbGYuX29udW5sb2NrID0gby5vbnVubG9jayA/IFt7Zm46IG8ub251bmxvY2t9XSA6IFtdO1xuICAgICAgc2VsZi5fb25yZXN1bWUgPSBbXTtcblxuICAgICAgLy8gV2ViIEF1ZGlvIG9yIEhUTUw1IEF1ZGlvP1xuICAgICAgc2VsZi5fd2ViQXVkaW8gPSBIb3dsZXIudXNpbmdXZWJBdWRpbyAmJiAhc2VsZi5faHRtbDU7XG5cbiAgICAgIC8vIEF1dG9tYXRpY2FsbHkgdHJ5IHRvIGVuYWJsZSBhdWRpby5cbiAgICAgIGlmICh0eXBlb2YgSG93bGVyLmN0eCAhPT0gJ3VuZGVmaW5lZCcgJiYgSG93bGVyLmN0eCAmJiBIb3dsZXIuYXV0b1VubG9jaykge1xuICAgICAgICBIb3dsZXIuX3VubG9ja0F1ZGlvKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhpcyBIb3dsIGdyb3VwIGluIHRoZSBnbG9iYWwgY29udHJvbGxlci5cbiAgICAgIEhvd2xlci5faG93bHMucHVzaChzZWxmKTtcblxuICAgICAgLy8gSWYgdGhleSBzZWxlY3RlZCBhdXRvcGxheSwgYWRkIGEgcGxheSBldmVudCB0byB0aGUgbG9hZCBxdWV1ZS5cbiAgICAgIGlmIChzZWxmLl9hdXRvcGxheSkge1xuICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICBldmVudDogJ3BsYXknLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnBsYXkoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBMb2FkIHRoZSBzb3VyY2UgZmlsZSB1bmxlc3Mgb3RoZXJ3aXNlIHNwZWNpZmllZC5cbiAgICAgIGlmIChzZWxmLl9wcmVsb2FkICYmIHNlbGYuX3ByZWxvYWQgIT09ICdub25lJykge1xuICAgICAgICBzZWxmLmxvYWQoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExvYWQgdGhlIGF1ZGlvIGZpbGUuXG4gICAgICogQHJldHVybiB7SG93bGVyfVxuICAgICAqL1xuICAgIGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHVybCA9IG51bGw7XG5cbiAgICAgIC8vIElmIG5vIGF1ZGlvIGlzIGF2YWlsYWJsZSwgcXVpdCBpbW1lZGlhdGVseS5cbiAgICAgIGlmIChIb3dsZXIubm9BdWRpbykge1xuICAgICAgICBzZWxmLl9lbWl0KCdsb2FkZXJyb3InLCBudWxsLCAnTm8gYXVkaW8gc3VwcG9ydC4nKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBNYWtlIHN1cmUgb3VyIHNvdXJjZSBpcyBpbiBhbiBhcnJheS5cbiAgICAgIGlmICh0eXBlb2Ygc2VsZi5fc3JjID09PSAnc3RyaW5nJykge1xuICAgICAgICBzZWxmLl9zcmMgPSBbc2VsZi5fc3JjXTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIHRoZSBzb3VyY2VzIGFuZCBwaWNrIHRoZSBmaXJzdCBvbmUgdGhhdCBpcyBjb21wYXRpYmxlLlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX3NyYy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZXh0LCBzdHI7XG5cbiAgICAgICAgaWYgKHNlbGYuX2Zvcm1hdCAmJiBzZWxmLl9mb3JtYXRbaV0pIHtcbiAgICAgICAgICAvLyBJZiBhbiBleHRlbnNpb24gd2FzIHNwZWNpZmllZCwgdXNlIHRoYXQgaW5zdGVhZC5cbiAgICAgICAgICBleHQgPSBzZWxmLl9mb3JtYXRbaV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBzb3VyY2UgaXMgYSBzdHJpbmcuXG4gICAgICAgICAgc3RyID0gc2VsZi5fc3JjW2ldO1xuICAgICAgICAgIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgc2VsZi5fZW1pdCgnbG9hZGVycm9yJywgbnVsbCwgJ05vbi1zdHJpbmcgZm91bmQgaW4gc2VsZWN0ZWQgYXVkaW8gc291cmNlcyAtIGlnbm9yaW5nLicpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRXh0cmFjdCB0aGUgZmlsZSBleHRlbnNpb24gZnJvbSB0aGUgVVJMIG9yIGJhc2U2NCBkYXRhIFVSSS5cbiAgICAgICAgICBleHQgPSAvXmRhdGE6YXVkaW9cXC8oW147LF0rKTsvaS5leGVjKHN0cik7XG4gICAgICAgICAgaWYgKCFleHQpIHtcbiAgICAgICAgICAgIGV4dCA9IC9cXC4oW14uXSspJC8uZXhlYyhzdHIuc3BsaXQoJz8nLCAxKVswXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGV4dCkge1xuICAgICAgICAgICAgZXh0ID0gZXh0WzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTG9nIGEgd2FybmluZyBpZiBubyBleHRlbnNpb24gd2FzIGZvdW5kLlxuICAgICAgICBpZiAoIWV4dCkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignTm8gZmlsZSBleHRlbnNpb24gd2FzIGZvdW5kLiBDb25zaWRlciB1c2luZyB0aGUgXCJmb3JtYXRcIiBwcm9wZXJ0eSBvciBzcGVjaWZ5IGFuIGV4dGVuc2lvbi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoaXMgZXh0ZW5zaW9uIGlzIGF2YWlsYWJsZS5cbiAgICAgICAgaWYgKGV4dCAmJiBIb3dsZXIuY29kZWNzKGV4dCkpIHtcbiAgICAgICAgICB1cmwgPSBzZWxmLl9zcmNbaV07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgc2VsZi5fZW1pdCgnbG9hZGVycm9yJywgbnVsbCwgJ05vIGNvZGVjIHN1cHBvcnQgZm9yIHNlbGVjdGVkIGF1ZGlvIHNvdXJjZXMuJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZi5fc3JjID0gdXJsO1xuICAgICAgc2VsZi5fc3RhdGUgPSAnbG9hZGluZyc7XG5cbiAgICAgIC8vIElmIHRoZSBob3N0aW5nIHBhZ2UgaXMgSFRUUFMgYW5kIHRoZSBzb3VyY2UgaXNuJ3QsXG4gICAgICAvLyBkcm9wIGRvd24gdG8gSFRNTDUgQXVkaW8gdG8gYXZvaWQgTWl4ZWQgQ29udGVudCBlcnJvcnMuXG4gICAgICBpZiAod2luZG93LmxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyAmJiB1cmwuc2xpY2UoMCwgNSkgPT09ICdodHRwOicpIHtcbiAgICAgICAgc2VsZi5faHRtbDUgPSB0cnVlO1xuICAgICAgICBzZWxmLl93ZWJBdWRpbyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgc291bmQgb2JqZWN0IGFuZCBhZGQgaXQgdG8gdGhlIHBvb2wuXG4gICAgICBuZXcgU291bmQoc2VsZik7XG5cbiAgICAgIC8vIExvYWQgYW5kIGRlY29kZSB0aGUgYXVkaW8gZGF0YSBmb3IgcGxheWJhY2suXG4gICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgbG9hZEJ1ZmZlcihzZWxmKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBsYXkgYSBzb3VuZCBvciByZXN1bWUgcHJldmlvdXMgcGxheWJhY2suXG4gICAgICogQHBhcmFtICB7U3RyaW5nL051bWJlcn0gc3ByaXRlICAgU3ByaXRlIG5hbWUgZm9yIHNwcml0ZSBwbGF5YmFjayBvciBzb3VuZCBpZCB0byBjb250aW51ZSBwcmV2aW91cy5cbiAgICAgKiBAcGFyYW0gIHtCb29sZWFufSBpbnRlcm5hbCBJbnRlcm5hbCBVc2U6IHRydWUgcHJldmVudHMgZXZlbnQgZmlyaW5nLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gICAgICAgICAgU291bmQgSUQuXG4gICAgICovXG4gICAgcGxheTogZnVuY3Rpb24oc3ByaXRlLCBpbnRlcm5hbCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGlkID0gbnVsbDtcblxuICAgICAgLy8gRGV0ZXJtaW5lIGlmIGEgc3ByaXRlLCBzb3VuZCBpZCBvciBub3RoaW5nIHdhcyBwYXNzZWRcbiAgICAgIGlmICh0eXBlb2Ygc3ByaXRlID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZCA9IHNwcml0ZTtcbiAgICAgICAgc3ByaXRlID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNwcml0ZSA9PT0gJ3N0cmluZycgJiYgc2VsZi5fc3RhdGUgPT09ICdsb2FkZWQnICYmICFzZWxmLl9zcHJpdGVbc3ByaXRlXSkge1xuICAgICAgICAvLyBJZiB0aGUgcGFzc2VkIHNwcml0ZSBkb2Vzbid0IGV4aXN0LCBkbyBub3RoaW5nLlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNwcml0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gVXNlIHRoZSBkZWZhdWx0IHNvdW5kIHNwcml0ZSAocGxheXMgdGhlIGZ1bGwgYXVkaW8gbGVuZ3RoKS5cbiAgICAgICAgc3ByaXRlID0gJ19fZGVmYXVsdCc7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYSBzaW5nbGUgcGF1c2VkIHNvdW5kIHRoYXQgaXNuJ3QgZW5kZWQuXG4gICAgICAgIC8vIElmIHRoZXJlIGlzLCBwbGF5IHRoYXQgc291bmQuIElmIG5vdCwgY29udGludWUgYXMgdXN1YWwuXG4gICAgICAgIGlmICghc2VsZi5fcGxheUxvY2spIHtcbiAgICAgICAgICB2YXIgbnVtID0gMDtcbiAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5fc291bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5fc291bmRzW2ldLl9wYXVzZWQgJiYgIXNlbGYuX3NvdW5kc1tpXS5fZW5kZWQpIHtcbiAgICAgICAgICAgICAgbnVtKys7XG4gICAgICAgICAgICAgIGlkID0gc2VsZi5fc291bmRzW2ldLl9pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAobnVtID09PSAxKSB7XG4gICAgICAgICAgICBzcHJpdGUgPSBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgc2VsZWN0ZWQgbm9kZSwgb3IgZ2V0IG9uZSBmcm9tIHRoZSBwb29sLlxuICAgICAgdmFyIHNvdW5kID0gaWQgPyBzZWxmLl9zb3VuZEJ5SWQoaWQpIDogc2VsZi5faW5hY3RpdmVTb3VuZCgpO1xuXG4gICAgICAvLyBJZiB0aGUgc291bmQgZG9lc24ndCBleGlzdCwgZG8gbm90aGluZy5cbiAgICAgIGlmICghc291bmQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbGVjdCB0aGUgc3ByaXRlIGRlZmluaXRpb24uXG4gICAgICBpZiAoaWQgJiYgIXNwcml0ZSkge1xuICAgICAgICBzcHJpdGUgPSBzb3VuZC5fc3ByaXRlIHx8ICdfX2RlZmF1bHQnO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCwgd2UgbXVzdCB3YWl0IHRvIGdldCB0aGUgYXVkaW8ncyBkdXJhdGlvbi5cbiAgICAgIC8vIFdlIGFsc28gbmVlZCB0byB3YWl0IHRvIG1ha2Ugc3VyZSB3ZSBkb24ndCBydW4gaW50byByYWNlIGNvbmRpdGlvbnMgd2l0aFxuICAgICAgLy8gdGhlIG9yZGVyIG9mIGZ1bmN0aW9uIGNhbGxzLlxuICAgICAgaWYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJykge1xuICAgICAgICAvLyBTZXQgdGhlIHNwcml0ZSB2YWx1ZSBvbiB0aGlzIHNvdW5kLlxuICAgICAgICBzb3VuZC5fc3ByaXRlID0gc3ByaXRlO1xuXG4gICAgICAgIC8vIE1hcmsgdGhpcyBzb3VuZCBhcyBub3QgZW5kZWQgaW4gY2FzZSBhbm90aGVyIHNvdW5kIGlzIHBsYXllZCBiZWZvcmUgdGhpcyBvbmUgbG9hZHMuXG4gICAgICAgIHNvdW5kLl9lbmRlZCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgc291bmQgdG8gdGhlIHF1ZXVlIHRvIGJlIHBsYXllZCBvbiBsb2FkLlxuICAgICAgICB2YXIgc291bmRJZCA9IHNvdW5kLl9pZDtcbiAgICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgICAgZXZlbnQ6ICdwbGF5JyxcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5wbGF5KHNvdW5kSWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNvdW5kSWQ7XG4gICAgICB9XG5cbiAgICAgIC8vIERvbid0IHBsYXkgdGhlIHNvdW5kIGlmIGFuIGlkIHdhcyBwYXNzZWQgYW5kIGl0IGlzIGFscmVhZHkgcGxheWluZy5cbiAgICAgIGlmIChpZCAmJiAhc291bmQuX3BhdXNlZCkge1xuICAgICAgICAvLyBUcmlnZ2VyIHRoZSBwbGF5IGV2ZW50LCBpbiBvcmRlciB0byBrZWVwIGl0ZXJhdGluZyB0aHJvdWdoIHF1ZXVlLlxuICAgICAgICBpZiAoIWludGVybmFsKSB7XG4gICAgICAgICAgc2VsZi5fbG9hZFF1ZXVlKCdwbGF5Jyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291bmQuX2lkO1xuICAgICAgfVxuXG4gICAgICAvLyBNYWtlIHN1cmUgdGhlIEF1ZGlvQ29udGV4dCBpc24ndCBzdXNwZW5kZWQsIGFuZCByZXN1bWUgaXQgaWYgaXQgaXMuXG4gICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgSG93bGVyLl9hdXRvUmVzdW1lKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERldGVybWluZSBob3cgbG9uZyB0byBwbGF5IGZvciBhbmQgd2hlcmUgdG8gc3RhcnQgcGxheWluZy5cbiAgICAgIHZhciBzZWVrID0gTWF0aC5tYXgoMCwgc291bmQuX3NlZWsgPiAwID8gc291bmQuX3NlZWsgOiBzZWxmLl9zcHJpdGVbc3ByaXRlXVswXSAvIDEwMDApO1xuICAgICAgdmFyIGR1cmF0aW9uID0gTWF0aC5tYXgoMCwgKChzZWxmLl9zcHJpdGVbc3ByaXRlXVswXSArIHNlbGYuX3Nwcml0ZVtzcHJpdGVdWzFdKSAvIDEwMDApIC0gc2Vlayk7XG4gICAgICB2YXIgdGltZW91dCA9IChkdXJhdGlvbiAqIDEwMDApIC8gTWF0aC5hYnMoc291bmQuX3JhdGUpO1xuICAgICAgdmFyIHN0YXJ0ID0gc2VsZi5fc3ByaXRlW3Nwcml0ZV1bMF0gLyAxMDAwO1xuICAgICAgdmFyIHN0b3AgPSAoc2VsZi5fc3ByaXRlW3Nwcml0ZV1bMF0gKyBzZWxmLl9zcHJpdGVbc3ByaXRlXVsxXSkgLyAxMDAwO1xuICAgICAgc291bmQuX3Nwcml0ZSA9IHNwcml0ZTtcblxuICAgICAgLy8gTWFyayB0aGUgc291bmQgYXMgZW5kZWQgaW5zdGFudGx5IHNvIHRoYXQgdGhpcyBhc3luYyBwbGF5YmFja1xuICAgICAgLy8gZG9lc24ndCBnZXQgZ3JhYmJlZCBieSBhbm90aGVyIGNhbGwgdG8gcGxheSB3aGlsZSB0aGlzIG9uZSB3YWl0cyB0byBzdGFydC5cbiAgICAgIHNvdW5kLl9lbmRlZCA9IGZhbHNlO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIHNvdW5kLlxuICAgICAgdmFyIHNldFBhcmFtcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzb3VuZC5fcGF1c2VkID0gZmFsc2U7XG4gICAgICAgIHNvdW5kLl9zZWVrID0gc2VlaztcbiAgICAgICAgc291bmQuX3N0YXJ0ID0gc3RhcnQ7XG4gICAgICAgIHNvdW5kLl9zdG9wID0gc3RvcDtcbiAgICAgICAgc291bmQuX2xvb3AgPSAhIShzb3VuZC5fbG9vcCB8fCBzZWxmLl9zcHJpdGVbc3ByaXRlXVsyXSk7XG4gICAgICB9O1xuXG4gICAgICAvLyBFbmQgdGhlIHNvdW5kIGluc3RhbnRseSBpZiBzZWVrIGlzIGF0IHRoZSBlbmQuXG4gICAgICBpZiAoc2VlayA+PSBzdG9wKSB7XG4gICAgICAgIHNlbGYuX2VuZGVkKHNvdW5kKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBCZWdpbiB0aGUgYWN0dWFsIHBsYXliYWNrLlxuICAgICAgdmFyIG5vZGUgPSBzb3VuZC5fbm9kZTtcbiAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICAvLyBGaXJlIHRoaXMgd2hlbiB0aGUgc291bmQgaXMgcmVhZHkgdG8gcGxheSB0byBiZWdpbiBXZWIgQXVkaW8gcGxheWJhY2suXG4gICAgICAgIHZhciBwbGF5V2ViQXVkaW8gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZWxmLl9wbGF5TG9jayA9IGZhbHNlO1xuICAgICAgICAgIHNldFBhcmFtcygpO1xuICAgICAgICAgIHNlbGYuX3JlZnJlc2hCdWZmZXIoc291bmQpO1xuXG4gICAgICAgICAgLy8gU2V0dXAgdGhlIHBsYXliYWNrIHBhcmFtcy5cbiAgICAgICAgICB2YXIgdm9sID0gKHNvdW5kLl9tdXRlZCB8fCBzZWxmLl9tdXRlZCkgPyAwIDogc291bmQuX3ZvbHVtZTtcbiAgICAgICAgICBub2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUodm9sLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICBzb3VuZC5fcGxheVN0YXJ0ID0gSG93bGVyLmN0eC5jdXJyZW50VGltZTtcblxuICAgICAgICAgIC8vIFBsYXkgdGhlIHNvdW5kIHVzaW5nIHRoZSBzdXBwb3J0ZWQgbWV0aG9kLlxuICAgICAgICAgIGlmICh0eXBlb2Ygbm9kZS5idWZmZXJTb3VyY2Uuc3RhcnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBzb3VuZC5fbG9vcCA/IG5vZGUuYnVmZmVyU291cmNlLm5vdGVHcmFpbk9uKDAsIHNlZWssIDg2NDAwKSA6IG5vZGUuYnVmZmVyU291cmNlLm5vdGVHcmFpbk9uKDAsIHNlZWssIGR1cmF0aW9uKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc291bmQuX2xvb3AgPyBub2RlLmJ1ZmZlclNvdXJjZS5zdGFydCgwLCBzZWVrLCA4NjQwMCkgOiBub2RlLmJ1ZmZlclNvdXJjZS5zdGFydCgwLCBzZWVrLCBkdXJhdGlvbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU3RhcnQgYSBuZXcgdGltZXIgaWYgbm9uZSBpcyBwcmVzZW50LlxuICAgICAgICAgIGlmICh0aW1lb3V0ICE9PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgc2VsZi5fZW5kVGltZXJzW3NvdW5kLl9pZF0gPSBzZXRUaW1lb3V0KHNlbGYuX2VuZGVkLmJpbmQoc2VsZiwgc291bmQpLCB0aW1lb3V0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWludGVybmFsKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLl9lbWl0KCdwbGF5Jywgc291bmQuX2lkKTtcbiAgICAgICAgICAgICAgc2VsZi5fbG9hZFF1ZXVlKCk7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKEhvd2xlci5zdGF0ZSA9PT0gJ3J1bm5pbmcnICYmIEhvd2xlci5jdHguc3RhdGUgIT09ICdpbnRlcnJ1cHRlZCcpIHtcbiAgICAgICAgICBwbGF5V2ViQXVkaW8oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLl9wbGF5TG9jayA9IHRydWU7XG5cbiAgICAgICAgICAvLyBXYWl0IGZvciB0aGUgYXVkaW8gY29udGV4dCB0byByZXN1bWUgYmVmb3JlIHBsYXlpbmcuXG4gICAgICAgICAgc2VsZi5vbmNlKCdyZXN1bWUnLCBwbGF5V2ViQXVkaW8pO1xuXG4gICAgICAgICAgLy8gQ2FuY2VsIHRoZSBlbmQgdGltZXIuXG4gICAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihzb3VuZC5faWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGaXJlIHRoaXMgd2hlbiB0aGUgc291bmQgaXMgcmVhZHkgdG8gcGxheSB0byBiZWdpbiBIVE1MNSBBdWRpbyBwbGF5YmFjay5cbiAgICAgICAgdmFyIHBsYXlIdG1sNSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG5vZGUuY3VycmVudFRpbWUgPSBzZWVrO1xuICAgICAgICAgIG5vZGUubXV0ZWQgPSBzb3VuZC5fbXV0ZWQgfHwgc2VsZi5fbXV0ZWQgfHwgSG93bGVyLl9tdXRlZCB8fCBub2RlLm11dGVkO1xuICAgICAgICAgIG5vZGUudm9sdW1lID0gc291bmQuX3ZvbHVtZSAqIEhvd2xlci52b2x1bWUoKTtcbiAgICAgICAgICBub2RlLnBsYXliYWNrUmF0ZSA9IHNvdW5kLl9yYXRlO1xuXG4gICAgICAgICAgLy8gU29tZSBicm93c2VycyB3aWxsIHRocm93IGFuIGVycm9yIGlmIHRoaXMgaXMgY2FsbGVkIHdpdGhvdXQgdXNlciBpbnRlcmFjdGlvbi5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHBsYXkgPSBub2RlLnBsYXkoKTtcblxuICAgICAgICAgICAgLy8gU3VwcG9ydCBvbGRlciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJvbWlzZXMsIGFuZCB0aHVzIGRvbid0IGhhdmUgdGhpcyBpc3N1ZS5cbiAgICAgICAgICAgIGlmIChwbGF5ICYmIHR5cGVvZiBQcm9taXNlICE9PSAndW5kZWZpbmVkJyAmJiAocGxheSBpbnN0YW5jZW9mIFByb21pc2UgfHwgdHlwZW9mIHBsYXkudGhlbiA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgLy8gSW1wbGVtZW50cyBhIGxvY2sgdG8gcHJldmVudCBET01FeGNlcHRpb246IFRoZSBwbGF5KCkgcmVxdWVzdCB3YXMgaW50ZXJydXB0ZWQgYnkgYSBjYWxsIHRvIHBhdXNlKCkuXG4gICAgICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAvLyBTZXQgcGFyYW0gdmFsdWVzIGltbWVkaWF0ZWx5LlxuICAgICAgICAgICAgICBzZXRQYXJhbXMoKTtcblxuICAgICAgICAgICAgICAvLyBSZWxlYXNlcyB0aGUgbG9jayBhbmQgZXhlY3V0ZXMgcXVldWVkIGFjdGlvbnMuXG4gICAgICAgICAgICAgIHBsYXlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICBub2RlLl91bmxvY2tlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICBpZiAoIWludGVybmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3BsYXknLCBzb3VuZC5faWQpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9hZFF1ZXVlKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICBzZWxmLl9wbGF5TG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgc2VsZi5fZW1pdCgncGxheWVycm9yJywgc291bmQuX2lkLCAnUGxheWJhY2sgd2FzIHVuYWJsZSB0byBzdGFydC4gVGhpcyBpcyBtb3N0IGNvbW1vbmx5IGFuIGlzc3VlICcgK1xuICAgICAgICAgICAgICAgICAgICAnb24gbW9iaWxlIGRldmljZXMgYW5kIENocm9tZSB3aGVyZSBwbGF5YmFjayB3YXMgbm90IHdpdGhpbiBhIHVzZXIgaW50ZXJhY3Rpb24uJyk7XG5cbiAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBlbmRlZCBhbmQgcGF1c2VkIHZhbHVlcy5cbiAgICAgICAgICAgICAgICAgIHNvdW5kLl9lbmRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICBzb3VuZC5fcGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWludGVybmFsKSB7XG4gICAgICAgICAgICAgIHNlbGYuX3BsYXlMb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgIHNldFBhcmFtcygpO1xuICAgICAgICAgICAgICBzZWxmLl9lbWl0KCdwbGF5Jywgc291bmQuX2lkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2V0dGluZyByYXRlIGJlZm9yZSBwbGF5aW5nIHdvbid0IHdvcmsgaW4gSUUsIHNvIHdlIHNldCBpdCBhZ2FpbiBoZXJlLlxuICAgICAgICAgICAgbm9kZS5wbGF5YmFja1JhdGUgPSBzb3VuZC5fcmF0ZTtcblxuICAgICAgICAgICAgLy8gSWYgdGhlIG5vZGUgaXMgc3RpbGwgcGF1c2VkLCB0aGVuIHdlIGNhbiBhc3N1bWUgdGhlcmUgd2FzIGEgcGxheWJhY2sgaXNzdWUuXG4gICAgICAgICAgICBpZiAobm9kZS5wYXVzZWQpIHtcbiAgICAgICAgICAgICAgc2VsZi5fZW1pdCgncGxheWVycm9yJywgc291bmQuX2lkLCAnUGxheWJhY2sgd2FzIHVuYWJsZSB0byBzdGFydC4gVGhpcyBpcyBtb3N0IGNvbW1vbmx5IGFuIGlzc3VlICcgK1xuICAgICAgICAgICAgICAgICdvbiBtb2JpbGUgZGV2aWNlcyBhbmQgQ2hyb21lIHdoZXJlIHBsYXliYWNrIHdhcyBub3Qgd2l0aGluIGEgdXNlciBpbnRlcmFjdGlvbi4nKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTZXR1cCB0aGUgZW5kIHRpbWVyIG9uIHNwcml0ZXMgb3IgbGlzdGVuIGZvciB0aGUgZW5kZWQgZXZlbnQuXG4gICAgICAgICAgICBpZiAoc3ByaXRlICE9PSAnX19kZWZhdWx0JyB8fCBzb3VuZC5fbG9vcCkge1xuICAgICAgICAgICAgICBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSA9IHNldFRpbWVvdXQoc2VsZi5fZW5kZWQuYmluZChzZWxmLCBzb3VuZCksIHRpbWVvdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2VsZi5fZW5kVGltZXJzW3NvdW5kLl9pZF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBGaXJlIGVuZGVkIG9uIHRoaXMgYXVkaW8gbm9kZS5cbiAgICAgICAgICAgICAgICBzZWxmLl9lbmRlZChzb3VuZCk7XG5cbiAgICAgICAgICAgICAgICAvLyBDbGVhciB0aGlzIGxpc3RlbmVyLlxuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBzZWxmLl9lbmRUaW1lcnNbc291bmQuX2lkXSwgZmFsc2UpO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgc2VsZi5fZW5kVGltZXJzW3NvdW5kLl9pZF0sIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3BsYXllcnJvcicsIHNvdW5kLl9pZCwgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyBzdHJlYW1pbmcgYXVkaW8sIG1ha2Ugc3VyZSB0aGUgc3JjIGlzIHNldCBhbmQgbG9hZCBhZ2Fpbi5cbiAgICAgICAgaWYgKG5vZGUuc3JjID09PSAnZGF0YTphdWRpby93YXY7YmFzZTY0LFVrbEdSaWdBQUFCWFFWWkZabTEwSUJJQUFBQUJBQUVBUkt3QUFJaFlBUUFDQUJBQUFBQmtZWFJoQWdBQUFBRUEnKSB7XG4gICAgICAgICAgbm9kZS5zcmMgPSBzZWxmLl9zcmM7XG4gICAgICAgICAgbm9kZS5sb2FkKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQbGF5IGltbWVkaWF0ZWx5IGlmIHJlYWR5LCBvciB3YWl0IGZvciB0aGUgJ2NhbnBsYXl0aHJvdWdoJ2UgdmVudC5cbiAgICAgICAgdmFyIGxvYWRlZE5vUmVhZHlTdGF0ZSA9ICh3aW5kb3cgJiYgd2luZG93LmVqZWN0YSkgfHwgKCFub2RlLnJlYWR5U3RhdGUgJiYgSG93bGVyLl9uYXZpZ2F0b3IuaXNDb2Nvb25KUyk7XG4gICAgICAgIGlmIChub2RlLnJlYWR5U3RhdGUgPj0gMyB8fCBsb2FkZWROb1JlYWR5U3RhdGUpIHtcbiAgICAgICAgICBwbGF5SHRtbDUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLl9wbGF5TG9jayA9IHRydWU7XG4gICAgICAgICAgc2VsZi5fc3RhdGUgPSAnbG9hZGluZyc7XG5cbiAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX3N0YXRlID0gJ2xvYWRlZCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEJlZ2luIHBsYXliYWNrLlxuICAgICAgICAgICAgcGxheUh0bWw1KCk7XG5cbiAgICAgICAgICAgIC8vIENsZWFyIHRoaXMgbGlzdGVuZXIuXG4gICAgICAgICAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoSG93bGVyLl9jYW5QbGF5RXZlbnQsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoSG93bGVyLl9jYW5QbGF5RXZlbnQsIGxpc3RlbmVyLCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBDYW5jZWwgdGhlIGVuZCB0aW1lci5cbiAgICAgICAgICBzZWxmLl9jbGVhclRpbWVyKHNvdW5kLl9pZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNvdW5kLl9pZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGF1c2UgcGxheWJhY2sgYW5kIHNhdmUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIFRoZSBzb3VuZCBJRCAoZW1wdHkgdG8gcGF1c2UgYWxsIGluIGdyb3VwKS5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIHBhdXNlOiBmdW5jdGlvbihpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCBvciBhIHBsYXkoKSBwcm9taXNlIGlzIHBlbmRpbmcsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBwYXVzZSB3aGVuIGNhcGFibGUuXG4gICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnIHx8IHNlbGYuX3BsYXlMb2NrKSB7XG4gICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGV2ZW50OiAncGF1c2UnLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnBhdXNlKGlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBpZCBpcyBwYXNzZWQsIGdldCBhbGwgSUQncyB0byBiZSBwYXVzZWQuXG4gICAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuXG4gICAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIENsZWFyIHRoZSBlbmQgdGltZXIuXG4gICAgICAgIHNlbGYuX2NsZWFyVGltZXIoaWRzW2ldKTtcblxuICAgICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgICBpZiAoc291bmQgJiYgIXNvdW5kLl9wYXVzZWQpIHtcbiAgICAgICAgICAvLyBSZXNldCB0aGUgc2VlayBwb3NpdGlvbi5cbiAgICAgICAgICBzb3VuZC5fc2VlayA9IHNlbGYuc2VlayhpZHNbaV0pO1xuICAgICAgICAgIHNvdW5kLl9yYXRlU2VlayA9IDA7XG4gICAgICAgICAgc291bmQuX3BhdXNlZCA9IHRydWU7XG5cbiAgICAgICAgICAvLyBTdG9wIGN1cnJlbnRseSBydW5uaW5nIGZhZGVzLlxuICAgICAgICAgIHNlbGYuX3N0b3BGYWRlKGlkc1tpXSk7XG5cbiAgICAgICAgICBpZiAoc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIHNvdW5kIGhhcyBiZWVuIGNyZWF0ZWQuXG4gICAgICAgICAgICAgIGlmICghc291bmQuX25vZGUuYnVmZmVyU291cmNlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5zdG9wID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5ub3RlT2ZmKDApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5zdG9wKDApO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gQ2xlYW4gdXAgdGhlIGJ1ZmZlciBzb3VyY2UuXG4gICAgICAgICAgICAgIHNlbGYuX2NsZWFuQnVmZmVyKHNvdW5kLl9ub2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWlzTmFOKHNvdW5kLl9ub2RlLmR1cmF0aW9uKSB8fCBzb3VuZC5fbm9kZS5kdXJhdGlvbiA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUucGF1c2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaXJlIHRoZSBwYXVzZSBldmVudCwgdW5sZXNzIGB0cnVlYCBpcyBwYXNzZWQgYXMgdGhlIDJuZCBhcmd1bWVudC5cbiAgICAgICAgaWYgKCFhcmd1bWVudHNbMV0pIHtcbiAgICAgICAgICBzZWxmLl9lbWl0KCdwYXVzZScsIHNvdW5kID8gc291bmQuX2lkIDogbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0b3AgcGxheWJhY2sgYW5kIHJlc2V0IHRvIHN0YXJ0LlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgVGhlIHNvdW5kIElEIChlbXB0eSB0byBzdG9wIGFsbCBpbiBncm91cCkuXG4gICAgICogQHBhcmFtICB7Qm9vbGVhbn0gaW50ZXJuYWwgSW50ZXJuYWwgVXNlOiB0cnVlIHByZXZlbnRzIGV2ZW50IGZpcmluZy5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uKGlkLCBpbnRlcm5hbCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCwgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIHN0b3Agd2hlbiBjYXBhYmxlLlxuICAgICAgaWYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJyB8fCBzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICBldmVudDogJ3N0b3AnLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnN0b3AoaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIGlkIGlzIHBhc3NlZCwgZ2V0IGFsbCBJRCdzIHRvIGJlIHN0b3BwZWQuXG4gICAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuXG4gICAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIENsZWFyIHRoZSBlbmQgdGltZXIuXG4gICAgICAgIHNlbGYuX2NsZWFyVGltZXIoaWRzW2ldKTtcblxuICAgICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgICAvLyBSZXNldCB0aGUgc2VlayBwb3NpdGlvbi5cbiAgICAgICAgICBzb3VuZC5fc2VlayA9IHNvdW5kLl9zdGFydCB8fCAwO1xuICAgICAgICAgIHNvdW5kLl9yYXRlU2VlayA9IDA7XG4gICAgICAgICAgc291bmQuX3BhdXNlZCA9IHRydWU7XG4gICAgICAgICAgc291bmQuX2VuZGVkID0gdHJ1ZTtcblxuICAgICAgICAgIC8vIFN0b3AgY3VycmVudGx5IHJ1bm5pbmcgZmFkZXMuXG4gICAgICAgICAgc2VsZi5fc3RvcEZhZGUoaWRzW2ldKTtcblxuICAgICAgICAgIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgc291bmQncyBBdWRpb0J1ZmZlclNvdXJjZU5vZGUgaGFzIGJlZW4gY3JlYXRlZC5cbiAgICAgICAgICAgICAgaWYgKHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc291bmQuX25vZGUuYnVmZmVyU291cmNlLnN0b3AgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2Uubm90ZU9mZigwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLnN0b3AoMCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXAgdGhlIGJ1ZmZlciBzb3VyY2UuXG4gICAgICAgICAgICAgICAgc2VsZi5fY2xlYW5CdWZmZXIoc291bmQuX25vZGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFpc05hTihzb3VuZC5fbm9kZS5kdXJhdGlvbikgfHwgc291bmQuX25vZGUuZHVyYXRpb24gPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmN1cnJlbnRUaW1lID0gc291bmQuX3N0YXJ0IHx8IDA7XG4gICAgICAgICAgICAgIHNvdW5kLl9ub2RlLnBhdXNlKCk7XG5cbiAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGxpdmUgc3RyZWFtLCBzdG9wIGRvd25sb2FkIG9uY2UgdGhlIGF1ZGlvIGlzIHN0b3BwZWQuXG4gICAgICAgICAgICAgIGlmIChzb3VuZC5fbm9kZS5kdXJhdGlvbiA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9jbGVhclNvdW5kKHNvdW5kLl9ub2RlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaW50ZXJuYWwpIHtcbiAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3N0b3AnLCBzb3VuZC5faWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogTXV0ZS91bm11dGUgYSBzaW5nbGUgc291bmQgb3IgYWxsIHNvdW5kcyBpbiB0aGlzIEhvd2wgZ3JvdXAuXG4gICAgICogQHBhcmFtICB7Qm9vbGVhbn0gbXV0ZWQgU2V0IHRvIHRydWUgdG8gbXV0ZSBhbmQgZmFsc2UgdG8gdW5tdXRlLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgICAgVGhlIHNvdW5kIElEIHRvIHVwZGF0ZSAob21pdCB0byBtdXRlL3VubXV0ZSBhbGwpLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgbXV0ZTogZnVuY3Rpb24obXV0ZWQsIGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gbXV0ZSB3aGVuIGNhcGFibGUuXG4gICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnfHwgc2VsZi5fcGxheUxvY2spIHtcbiAgICAgICAgc2VsZi5fcXVldWUucHVzaCh7XG4gICAgICAgICAgZXZlbnQ6ICdtdXRlJyxcbiAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5tdXRlKG11dGVkLCBpZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgYXBwbHlpbmcgbXV0ZS91bm11dGUgdG8gYWxsIHNvdW5kcywgdXBkYXRlIHRoZSBncm91cCdzIHZhbHVlLlxuICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtdXRlZCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgc2VsZi5fbXV0ZWQgPSBtdXRlZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi5fbXV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gaWQgaXMgcGFzc2VkLCBnZXQgYWxsIElEJ3MgdG8gYmUgbXV0ZWQuXG4gICAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuXG4gICAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIEdldCB0aGUgc291bmQuXG4gICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICAgIHNvdW5kLl9tdXRlZCA9IG11dGVkO1xuXG4gICAgICAgICAgLy8gQ2FuY2VsIGFjdGl2ZSBmYWRlIGFuZCBzZXQgdGhlIHZvbHVtZSB0byB0aGUgZW5kIHZhbHVlLlxuICAgICAgICAgIGlmIChzb3VuZC5faW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIHNlbGYuX3N0b3BGYWRlKHNvdW5kLl9pZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmIHNvdW5kLl9ub2RlKSB7XG4gICAgICAgICAgICBzb3VuZC5fbm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKG11dGVkID8gMCA6IHNvdW5kLl92b2x1bWUsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgIHNvdW5kLl9ub2RlLm11dGVkID0gSG93bGVyLl9tdXRlZCA/IHRydWUgOiBtdXRlZDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLl9lbWl0KCdtdXRlJywgc291bmQuX2lkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0L3NldCB0aGUgdm9sdW1lIG9mIHRoaXMgc291bmQgb3Igb2YgdGhlIEhvd2wgZ3JvdXAuIFRoaXMgbWV0aG9kIGNhbiBvcHRpb25hbGx5IHRha2UgMCwgMSBvciAyIGFyZ3VtZW50cy5cbiAgICAgKiAgIHZvbHVtZSgpIC0+IFJldHVybnMgdGhlIGdyb3VwJ3Mgdm9sdW1lIHZhbHVlLlxuICAgICAqICAgdm9sdW1lKGlkKSAtPiBSZXR1cm5zIHRoZSBzb3VuZCBpZCdzIGN1cnJlbnQgdm9sdW1lLlxuICAgICAqICAgdm9sdW1lKHZvbCkgLT4gU2V0cyB0aGUgdm9sdW1lIG9mIGFsbCBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgICAqICAgdm9sdW1lKHZvbCwgaWQpIC0+IFNldHMgdGhlIHZvbHVtZSBvZiBwYXNzZWQgc291bmQgaWQuXG4gICAgICogQHJldHVybiB7SG93bC9OdW1iZXJ9IFJldHVybnMgc2VsZiBvciBjdXJyZW50IHZvbHVtZS5cbiAgICAgKi9cbiAgICB2b2x1bWU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB2YXIgdm9sLCBpZDtcblxuICAgICAgLy8gRGV0ZXJtaW5lIHRoZSB2YWx1ZXMgYmFzZWQgb24gYXJndW1lbnRzLlxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIFJldHVybiB0aGUgdmFsdWUgb2YgdGhlIGdyb3Vwcycgdm9sdW1lLlxuICAgICAgICByZXR1cm4gc2VsZi5fdm9sdW1lO1xuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMSB8fCBhcmdzLmxlbmd0aCA9PT0gMiAmJiB0eXBlb2YgYXJnc1sxXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhpcyBpcyBhbiBJRCwgYW5kIGlmIG5vdCwgYXNzdW1lIGl0IGlzIGEgbmV3IHZvbHVtZS5cbiAgICAgICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKCk7XG4gICAgICAgIHZhciBpbmRleCA9IGlkcy5pbmRleE9mKGFyZ3NbMF0pO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1swXSwgMTApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZvbCA9IHBhcnNlRmxvYXQoYXJnc1swXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPj0gMikge1xuICAgICAgICB2b2wgPSBwYXJzZUZsb2F0KGFyZ3NbMF0pO1xuICAgICAgICBpZCA9IHBhcnNlSW50KGFyZ3NbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHRoZSB2b2x1bWUgb3IgcmV0dXJuIHRoZSBjdXJyZW50IHZvbHVtZS5cbiAgICAgIHZhciBzb3VuZDtcbiAgICAgIGlmICh0eXBlb2Ygdm9sICE9PSAndW5kZWZpbmVkJyAmJiB2b2wgPj0gMCAmJiB2b2wgPD0gMSkge1xuICAgICAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCwgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIGNoYW5nZSB2b2x1bWUgd2hlbiBjYXBhYmxlLlxuICAgICAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnfHwgc2VsZi5fcGxheUxvY2spIHtcbiAgICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgIGV2ZW50OiAndm9sdW1lJyxcbiAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYudm9sdW1lLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgdGhlIGdyb3VwIHZvbHVtZS5cbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBzZWxmLl92b2x1bWUgPSB2b2w7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgb25lIG9yIGFsbCB2b2x1bWVzLlxuICAgICAgICBpZCA9IHNlbGYuX2dldFNvdW5kSWRzKGlkKTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPGlkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBzb3VuZC5cbiAgICAgICAgICBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZFtpXSk7XG5cbiAgICAgICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgICAgIHNvdW5kLl92b2x1bWUgPSB2b2w7XG5cbiAgICAgICAgICAgIC8vIFN0b3AgY3VycmVudGx5IHJ1bm5pbmcgZmFkZXMuXG4gICAgICAgICAgICBpZiAoIWFyZ3NbMl0pIHtcbiAgICAgICAgICAgICAgc2VsZi5fc3RvcEZhZGUoaWRbaV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8gJiYgc291bmQuX25vZGUgJiYgIXNvdW5kLl9tdXRlZCkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKHZvbCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNvdW5kLl9ub2RlICYmICFzb3VuZC5fbXV0ZWQpIHtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUudm9sdW1lID0gdm9sICogSG93bGVyLnZvbHVtZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLl9lbWl0KCd2b2x1bWUnLCBzb3VuZC5faWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc291bmQgPSBpZCA/IHNlbGYuX3NvdW5kQnlJZChpZCkgOiBzZWxmLl9zb3VuZHNbMF07XG4gICAgICAgIHJldHVybiBzb3VuZCA/IHNvdW5kLl92b2x1bWUgOiAwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmFkZSBhIGN1cnJlbnRseSBwbGF5aW5nIHNvdW5kIGJldHdlZW4gdHdvIHZvbHVtZXMgKGlmIG5vIGlkIGlzIHBhc3NlZCwgYWxsIHNvdW5kcyB3aWxsIGZhZGUpLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gZnJvbSBUaGUgdmFsdWUgdG8gZmFkZSBmcm9tICgwLjAgdG8gMS4wKS5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHRvICAgVGhlIHZvbHVtZSB0byBmYWRlIHRvICgwLjAgdG8gMS4wKS5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGxlbiAgVGltZSBpbiBtaWxsaXNlY29uZHMgdG8gZmFkZS5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkICAgVGhlIHNvdW5kIGlkIChvbWl0IHRvIGZhZGUgYWxsIHNvdW5kcykuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBmYWRlOiBmdW5jdGlvbihmcm9tLCB0bywgbGVuLCBpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCwgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIGZhZGUgd2hlbiBjYXBhYmxlLlxuICAgICAgaWYgKHNlbGYuX3N0YXRlICE9PSAnbG9hZGVkJyB8fCBzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICBldmVudDogJ2ZhZGUnLFxuICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLmZhZGUoZnJvbSwgdG8sIGxlbiwgaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9XG5cbiAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgdG8vZnJvbS9sZW4gdmFsdWVzIGFyZSBudW1iZXJzLlxuICAgICAgZnJvbSA9IE1hdGgubWluKE1hdGgubWF4KDAsIHBhcnNlRmxvYXQoZnJvbSkpLCAxKTtcbiAgICAgIHRvID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgcGFyc2VGbG9hdCh0bykpLCAxKTtcbiAgICAgIGxlbiA9IHBhcnNlRmxvYXQobGVuKTtcblxuICAgICAgLy8gU2V0IHRoZSB2b2x1bWUgdG8gdGhlIHN0YXJ0IHBvc2l0aW9uLlxuICAgICAgc2VsZi52b2x1bWUoZnJvbSwgaWQpO1xuXG4gICAgICAvLyBGYWRlIHRoZSB2b2x1bWUgb2Ygb25lIG9yIGFsbCBzb3VuZHMuXG4gICAgICB2YXIgaWRzID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgICAgZm9yICh2YXIgaT0wOyBpPGlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgICB2YXIgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgICAvLyBDcmVhdGUgYSBsaW5lYXIgZmFkZSBvciBmYWxsIGJhY2sgdG8gdGltZW91dHMgd2l0aCBIVE1MNSBBdWRpby5cbiAgICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgICAgLy8gU3RvcCB0aGUgcHJldmlvdXMgZmFkZSBpZiBubyBzcHJpdGUgaXMgYmVpbmcgdXNlZCAob3RoZXJ3aXNlLCB2b2x1bWUgaGFuZGxlcyB0aGlzKS5cbiAgICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICBzZWxmLl9zdG9wRmFkZShpZHNbaV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIElmIHdlIGFyZSB1c2luZyBXZWIgQXVkaW8sIGxldCB0aGUgbmF0aXZlIG1ldGhvZHMgZG8gdGhlIGFjdHVhbCBmYWRlLlxuICAgICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbyAmJiAhc291bmQuX211dGVkKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudFRpbWUgPSBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lO1xuICAgICAgICAgICAgdmFyIGVuZCA9IGN1cnJlbnRUaW1lICsgKGxlbiAvIDEwMDApO1xuICAgICAgICAgICAgc291bmQuX3ZvbHVtZSA9IGZyb207XG4gICAgICAgICAgICBzb3VuZC5fbm9kZS5nYWluLnNldFZhbHVlQXRUaW1lKGZyb20sIGN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgIHNvdW5kLl9ub2RlLmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUodG8sIGVuZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5fc3RhcnRGYWRlSW50ZXJ2YWwoc291bmQsIGZyb20sIHRvLCBsZW4sIGlkc1tpXSwgdHlwZW9mIGlkID09PSAndW5kZWZpbmVkJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyB0aGUgaW50ZXJuYWwgaW50ZXJ2YWwgdG8gZmFkZSBhIHNvdW5kLlxuICAgICAqIEBwYXJhbSAge09iamVjdH0gc291bmQgUmVmZXJlbmNlIHRvIHNvdW5kIHRvIGZhZGUuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSBmcm9tIFRoZSB2YWx1ZSB0byBmYWRlIGZyb20gKDAuMCB0byAxLjApLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gdG8gICBUaGUgdm9sdW1lIHRvIGZhZGUgdG8gKDAuMCB0byAxLjApLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gbGVuICBUaW1lIGluIG1pbGxpc2Vjb25kcyB0byBmYWRlLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgICBUaGUgc291bmQgaWQgdG8gZmFkZS5cbiAgICAgKiBAcGFyYW0gIHtCb29sZWFufSBpc0dyb3VwICAgSWYgdHJ1ZSwgc2V0IHRoZSB2b2x1bWUgb24gdGhlIGdyb3VwLlxuICAgICAqL1xuICAgIF9zdGFydEZhZGVJbnRlcnZhbDogZnVuY3Rpb24oc291bmQsIGZyb20sIHRvLCBsZW4sIGlkLCBpc0dyb3VwKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgdm9sID0gZnJvbTtcbiAgICAgIHZhciBkaWZmID0gdG8gLSBmcm9tO1xuICAgICAgdmFyIHN0ZXBzID0gTWF0aC5hYnMoZGlmZiAvIDAuMDEpO1xuICAgICAgdmFyIHN0ZXBMZW4gPSBNYXRoLm1heCg0LCAoc3RlcHMgPiAwKSA/IGxlbiAvIHN0ZXBzIDogbGVuKTtcbiAgICAgIHZhciBsYXN0VGljayA9IERhdGUubm93KCk7XG5cbiAgICAgIC8vIFN0b3JlIHRoZSB2YWx1ZSBiZWluZyBmYWRlZCB0by5cbiAgICAgIHNvdW5kLl9mYWRlVG8gPSB0bztcblxuICAgICAgLy8gVXBkYXRlIHRoZSB2b2x1bWUgdmFsdWUgb24gZWFjaCBpbnRlcnZhbCB0aWNrLlxuICAgICAgc291bmQuX2ludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgdm9sdW1lIGJhc2VkIG9uIHRoZSB0aW1lIHNpbmNlIHRoZSBsYXN0IHRpY2suXG4gICAgICAgIHZhciB0aWNrID0gKERhdGUubm93KCkgLSBsYXN0VGljaykgLyBsZW47XG4gICAgICAgIGxhc3RUaWNrID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdm9sICs9IGRpZmYgKiB0aWNrO1xuXG4gICAgICAgIC8vIFJvdW5kIHRvIHdpdGhpbiAyIGRlY2ltYWwgcG9pbnRzLlxuICAgICAgICB2b2wgPSBNYXRoLnJvdW5kKHZvbCAqIDEwMCkgLyAxMDA7XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSB2b2x1bWUgaXMgaW4gdGhlIHJpZ2h0IGJvdW5kcy5cbiAgICAgICAgaWYgKGRpZmYgPCAwKSB7XG4gICAgICAgICAgdm9sID0gTWF0aC5tYXgodG8sIHZvbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdm9sID0gTWF0aC5taW4odG8sIHZvbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGFuZ2UgdGhlIHZvbHVtZS5cbiAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgc291bmQuX3ZvbHVtZSA9IHZvbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLnZvbHVtZSh2b2wsIHNvdW5kLl9pZCwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXQgdGhlIGdyb3VwJ3Mgdm9sdW1lLlxuICAgICAgICBpZiAoaXNHcm91cCkge1xuICAgICAgICAgIHNlbGYuX3ZvbHVtZSA9IHZvbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdoZW4gdGhlIGZhZGUgaXMgY29tcGxldGUsIHN0b3AgaXQgYW5kIGZpcmUgZXZlbnQuXG4gICAgICAgIGlmICgodG8gPCBmcm9tICYmIHZvbCA8PSB0bykgfHwgKHRvID4gZnJvbSAmJiB2b2wgPj0gdG8pKSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChzb3VuZC5faW50ZXJ2YWwpO1xuICAgICAgICAgIHNvdW5kLl9pbnRlcnZhbCA9IG51bGw7XG4gICAgICAgICAgc291bmQuX2ZhZGVUbyA9IG51bGw7XG4gICAgICAgICAgc2VsZi52b2x1bWUodG8sIHNvdW5kLl9pZCk7XG4gICAgICAgICAgc2VsZi5fZW1pdCgnZmFkZScsIHNvdW5kLl9pZCk7XG4gICAgICAgIH1cbiAgICAgIH0sIHN0ZXBMZW4pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBtZXRob2QgdGhhdCBzdG9wcyB0aGUgY3VycmVudGx5IHBsYXlpbmcgZmFkZSB3aGVuXG4gICAgICogYSBuZXcgZmFkZSBzdGFydHMsIHZvbHVtZSBpcyBjaGFuZ2VkIG9yIHRoZSBzb3VuZCBpcyBzdG9wcGVkLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgVGhlIHNvdW5kIGlkLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgX3N0b3BGYWRlOiBmdW5jdGlvbihpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkKTtcblxuICAgICAgaWYgKHNvdW5kICYmIHNvdW5kLl9pbnRlcnZhbCkge1xuICAgICAgICBpZiAoc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICBzb3VuZC5fbm9kZS5nYWluLmNhbmNlbFNjaGVkdWxlZFZhbHVlcyhIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNsZWFySW50ZXJ2YWwoc291bmQuX2ludGVydmFsKTtcbiAgICAgICAgc291bmQuX2ludGVydmFsID0gbnVsbDtcbiAgICAgICAgc2VsZi52b2x1bWUoc291bmQuX2ZhZGVUbywgaWQpO1xuICAgICAgICBzb3VuZC5fZmFkZVRvID0gbnVsbDtcbiAgICAgICAgc2VsZi5fZW1pdCgnZmFkZScsIGlkKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldC9zZXQgdGhlIGxvb3AgcGFyYW1ldGVyIG9uIGEgc291bmQuIFRoaXMgbWV0aG9kIGNhbiBvcHRpb25hbGx5IHRha2UgMCwgMSBvciAyIGFyZ3VtZW50cy5cbiAgICAgKiAgIGxvb3AoKSAtPiBSZXR1cm5zIHRoZSBncm91cCdzIGxvb3AgdmFsdWUuXG4gICAgICogICBsb29wKGlkKSAtPiBSZXR1cm5zIHRoZSBzb3VuZCBpZCdzIGxvb3AgdmFsdWUuXG4gICAgICogICBsb29wKGxvb3ApIC0+IFNldHMgdGhlIGxvb3AgdmFsdWUgZm9yIGFsbCBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgICAqICAgbG9vcChsb29wLCBpZCkgLT4gU2V0cyB0aGUgbG9vcCB2YWx1ZSBvZiBwYXNzZWQgc291bmQgaWQuXG4gICAgICogQHJldHVybiB7SG93bC9Cb29sZWFufSBSZXR1cm5zIHNlbGYgb3IgY3VycmVudCBsb29wIHZhbHVlLlxuICAgICAqL1xuICAgIGxvb3A6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB2YXIgbG9vcCwgaWQsIHNvdW5kO1xuXG4gICAgICAvLyBEZXRlcm1pbmUgdGhlIHZhbHVlcyBmb3IgbG9vcCBhbmQgaWQuXG4gICAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSBncm91J3MgbG9vcCB2YWx1ZS5cbiAgICAgICAgcmV0dXJuIHNlbGYuX2xvb3A7XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgbG9vcCA9IGFyZ3NbMF07XG4gICAgICAgICAgc2VsZi5fbG9vcCA9IGxvb3A7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gUmV0dXJuIHRoaXMgc291bmQncyBsb29wIHZhbHVlLlxuICAgICAgICAgIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKHBhcnNlSW50KGFyZ3NbMF0sIDEwKSk7XG4gICAgICAgICAgcmV0dXJuIHNvdW5kID8gc291bmQuX2xvb3AgOiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICBsb29wID0gYXJnc1swXTtcbiAgICAgICAgaWQgPSBwYXJzZUludChhcmdzWzFdLCAxMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIGlkIGlzIHBhc3NlZCwgZ2V0IGFsbCBJRCdzIHRvIGJlIGxvb3BlZC5cbiAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG4gICAgICBmb3IgKHZhciBpPTA7IGk8aWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkc1tpXSk7XG5cbiAgICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgICAgc291bmQuX2xvb3AgPSBsb29wO1xuICAgICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbyAmJiBzb3VuZC5fbm9kZSAmJiBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UpIHtcbiAgICAgICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5sb29wID0gbG9vcDtcbiAgICAgICAgICAgIGlmIChsb29wKSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5sb29wU3RhcnQgPSBzb3VuZC5fc3RhcnQgfHwgMDtcbiAgICAgICAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmxvb3BFbmQgPSBzb3VuZC5fc3RvcDtcblxuICAgICAgICAgICAgICAvLyBJZiBwbGF5aW5nLCByZXN0YXJ0IHBsYXliYWNrIHRvIGVuc3VyZSBsb29waW5nIHVwZGF0ZXMuXG4gICAgICAgICAgICAgIGlmIChzZWxmLnBsYXlpbmcoaWRzW2ldKSkge1xuICAgICAgICAgICAgICAgIHNlbGYucGF1c2UoaWRzW2ldLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBzZWxmLnBsYXkoaWRzW2ldLCB0cnVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0L3NldCB0aGUgcGxheWJhY2sgcmF0ZSBvZiBhIHNvdW5kLiBUaGlzIG1ldGhvZCBjYW4gb3B0aW9uYWxseSB0YWtlIDAsIDEgb3IgMiBhcmd1bWVudHMuXG4gICAgICogICByYXRlKCkgLT4gUmV0dXJucyB0aGUgZmlyc3Qgc291bmQgbm9kZSdzIGN1cnJlbnQgcGxheWJhY2sgcmF0ZS5cbiAgICAgKiAgIHJhdGUoaWQpIC0+IFJldHVybnMgdGhlIHNvdW5kIGlkJ3MgY3VycmVudCBwbGF5YmFjayByYXRlLlxuICAgICAqICAgcmF0ZShyYXRlKSAtPiBTZXRzIHRoZSBwbGF5YmFjayByYXRlIG9mIGFsbCBzb3VuZHMgaW4gdGhpcyBIb3dsIGdyb3VwLlxuICAgICAqICAgcmF0ZShyYXRlLCBpZCkgLT4gU2V0cyB0aGUgcGxheWJhY2sgcmF0ZSBvZiBwYXNzZWQgc291bmQgaWQuXG4gICAgICogQHJldHVybiB7SG93bC9OdW1iZXJ9IFJldHVybnMgc2VsZiBvciB0aGUgY3VycmVudCBwbGF5YmFjayByYXRlLlxuICAgICAqL1xuICAgIHJhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB2YXIgcmF0ZSwgaWQ7XG5cbiAgICAgIC8vIERldGVybWluZSB0aGUgdmFsdWVzIGJhc2VkIG9uIGFyZ3VtZW50cy5cbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBXZSB3aWxsIHNpbXBseSByZXR1cm4gdGhlIGN1cnJlbnQgcmF0ZSBvZiB0aGUgZmlyc3Qgbm9kZS5cbiAgICAgICAgaWQgPSBzZWxmLl9zb3VuZHNbMF0uX2lkO1xuICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAvLyBGaXJzdCBjaGVjayBpZiB0aGlzIGlzIGFuIElELCBhbmQgaWYgbm90LCBhc3N1bWUgaXQgaXMgYSBuZXcgcmF0ZSB2YWx1ZS5cbiAgICAgICAgdmFyIGlkcyA9IHNlbGYuX2dldFNvdW5kSWRzKCk7XG4gICAgICAgIHZhciBpbmRleCA9IGlkcy5pbmRleE9mKGFyZ3NbMF0pO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1swXSwgMTApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJhdGUgPSBwYXJzZUZsb2F0KGFyZ3NbMF0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHJhdGUgPSBwYXJzZUZsb2F0KGFyZ3NbMF0pO1xuICAgICAgICBpZCA9IHBhcnNlSW50KGFyZ3NbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHRoZSBwbGF5YmFjayByYXRlIG9yIHJldHVybiB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICAgIHZhciBzb3VuZDtcbiAgICAgIGlmICh0eXBlb2YgcmF0ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBjaGFuZ2UgcGxheWJhY2sgcmF0ZSB3aGVuIGNhcGFibGUuXG4gICAgICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcgfHwgc2VsZi5fcGxheUxvY2spIHtcbiAgICAgICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgICAgIGV2ZW50OiAncmF0ZScsXG4gICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnJhdGUuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgZ3JvdXAgcmF0ZS5cbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBzZWxmLl9yYXRlID0gcmF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSBvbmUgb3IgYWxsIHZvbHVtZXMuXG4gICAgICAgIGlkID0gc2VsZi5fZ2V0U291bmRJZHMoaWQpO1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8aWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgICAgIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkW2ldKTtcblxuICAgICAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBvdXIgcG9zaXRpb24gd2hlbiB0aGUgcmF0ZSBjaGFuZ2VkIGFuZCB1cGRhdGUgdGhlIHBsYXliYWNrXG4gICAgICAgICAgICAvLyBzdGFydCBwb3NpdGlvbiBzbyB3ZSBjYW4gcHJvcGVybHkgYWRqdXN0IHRoZSBzZWVrIHBvc2l0aW9uIGZvciB0aW1lIGVsYXBzZWQuXG4gICAgICAgICAgICBpZiAoc2VsZi5wbGF5aW5nKGlkW2ldKSkge1xuICAgICAgICAgICAgICBzb3VuZC5fcmF0ZVNlZWsgPSBzZWxmLnNlZWsoaWRbaV0pO1xuICAgICAgICAgICAgICBzb3VuZC5fcGxheVN0YXJ0ID0gc2VsZi5fd2ViQXVkaW8gPyBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lIDogc291bmQuX3BsYXlTdGFydDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvdW5kLl9yYXRlID0gcmF0ZTtcblxuICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSBwbGF5YmFjayByYXRlLlxuICAgICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmIHNvdW5kLl9ub2RlICYmIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZSkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UucGxheWJhY2tSYXRlLnNldFZhbHVlQXRUaW1lKHJhdGUsIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgICBzb3VuZC5fbm9kZS5wbGF5YmFja1JhdGUgPSByYXRlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgdGltZXJzLlxuICAgICAgICAgICAgdmFyIHNlZWsgPSBzZWxmLnNlZWsoaWRbaV0pO1xuICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gKChzZWxmLl9zcHJpdGVbc291bmQuX3Nwcml0ZV1bMF0gKyBzZWxmLl9zcHJpdGVbc291bmQuX3Nwcml0ZV1bMV0pIC8gMTAwMCkgLSBzZWVrO1xuICAgICAgICAgICAgdmFyIHRpbWVvdXQgPSAoZHVyYXRpb24gKiAxMDAwKSAvIE1hdGguYWJzKHNvdW5kLl9yYXRlKTtcblxuICAgICAgICAgICAgLy8gU3RhcnQgYSBuZXcgZW5kIHRpbWVyIGlmIHNvdW5kIGlzIGFscmVhZHkgcGxheWluZy5cbiAgICAgICAgICAgIGlmIChzZWxmLl9lbmRUaW1lcnNbaWRbaV1dIHx8ICFzb3VuZC5fcGF1c2VkKSB7XG4gICAgICAgICAgICAgIHNlbGYuX2NsZWFyVGltZXIoaWRbaV0pO1xuICAgICAgICAgICAgICBzZWxmLl9lbmRUaW1lcnNbaWRbaV1dID0gc2V0VGltZW91dChzZWxmLl9lbmRlZC5iaW5kKHNlbGYsIHNvdW5kKSwgdGltZW91dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3JhdGUnLCBzb3VuZC5faWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWQpO1xuICAgICAgICByZXR1cm4gc291bmQgPyBzb3VuZC5fcmF0ZSA6IHNlbGYuX3JhdGU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQvc2V0IHRoZSBzZWVrIHBvc2l0aW9uIG9mIGEgc291bmQuIFRoaXMgbWV0aG9kIGNhbiBvcHRpb25hbGx5IHRha2UgMCwgMSBvciAyIGFyZ3VtZW50cy5cbiAgICAgKiAgIHNlZWsoKSAtPiBSZXR1cm5zIHRoZSBmaXJzdCBzb3VuZCBub2RlJ3MgY3VycmVudCBzZWVrIHBvc2l0aW9uLlxuICAgICAqICAgc2VlayhpZCkgLT4gUmV0dXJucyB0aGUgc291bmQgaWQncyBjdXJyZW50IHNlZWsgcG9zaXRpb24uXG4gICAgICogICBzZWVrKHNlZWspIC0+IFNldHMgdGhlIHNlZWsgcG9zaXRpb24gb2YgdGhlIGZpcnN0IHNvdW5kIG5vZGUuXG4gICAgICogICBzZWVrKHNlZWssIGlkKSAtPiBTZXRzIHRoZSBzZWVrIHBvc2l0aW9uIG9mIHBhc3NlZCBzb3VuZCBpZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsL051bWJlcn0gUmV0dXJucyBzZWxmIG9yIHRoZSBjdXJyZW50IHNlZWsgcG9zaXRpb24uXG4gICAgICovXG4gICAgc2VlazogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHZhciBzZWVrLCBpZDtcblxuICAgICAgLy8gRGV0ZXJtaW5lIHRoZSB2YWx1ZXMgYmFzZWQgb24gYXJndW1lbnRzLlxuICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIFdlIHdpbGwgc2ltcGx5IHJldHVybiB0aGUgY3VycmVudCBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgbm9kZS5cbiAgICAgICAgaWYgKHNlbGYuX3NvdW5kcy5sZW5ndGgpIHtcbiAgICAgICAgICBpZCA9IHNlbGYuX3NvdW5kc1swXS5faWQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgLy8gRmlyc3QgY2hlY2sgaWYgdGhpcyBpcyBhbiBJRCwgYW5kIGlmIG5vdCwgYXNzdW1lIGl0IGlzIGEgbmV3IHNlZWsgcG9zaXRpb24uXG4gICAgICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcygpO1xuICAgICAgICB2YXIgaW5kZXggPSBpZHMuaW5kZXhPZihhcmdzWzBdKTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICBpZCA9IHBhcnNlSW50KGFyZ3NbMF0sIDEwKTtcbiAgICAgICAgfSBlbHNlIGlmIChzZWxmLl9zb3VuZHMubGVuZ3RoKSB7XG4gICAgICAgICAgaWQgPSBzZWxmLl9zb3VuZHNbMF0uX2lkO1xuICAgICAgICAgIHNlZWsgPSBwYXJzZUZsb2F0KGFyZ3NbMF0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICAgIHNlZWsgPSBwYXJzZUZsb2F0KGFyZ3NbMF0pO1xuICAgICAgICBpZCA9IHBhcnNlSW50KGFyZ3NbMV0sIDEwKTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gSUQsIGJhaWwgb3V0LlxuICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gc2VlayB3aGVuIGNhcGFibGUuXG4gICAgICBpZiAodHlwZW9mIHNlZWsgPT09ICdudW1iZXInICYmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcgfHwgc2VsZi5fcGxheUxvY2spKSB7XG4gICAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICAgIGV2ZW50OiAnc2VlaycsXG4gICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuc2Vlay5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICAvLyBHZXQgdGhlIHNvdW5kLlxuICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkKTtcblxuICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2VlayA9PT0gJ251bWJlcicgJiYgc2VlayA+PSAwKSB7XG4gICAgICAgICAgLy8gUGF1c2UgdGhlIHNvdW5kIGFuZCB1cGRhdGUgcG9zaXRpb24gZm9yIHJlc3RhcnRpbmcgcGxheWJhY2suXG4gICAgICAgICAgdmFyIHBsYXlpbmcgPSBzZWxmLnBsYXlpbmcoaWQpO1xuICAgICAgICAgIGlmIChwbGF5aW5nKSB7XG4gICAgICAgICAgICBzZWxmLnBhdXNlKGlkLCB0cnVlKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBNb3ZlIHRoZSBwb3NpdGlvbiBvZiB0aGUgdHJhY2sgYW5kIGNhbmNlbCB0aW1lci5cbiAgICAgICAgICBzb3VuZC5fc2VlayA9IHNlZWs7XG4gICAgICAgICAgc291bmQuX2VuZGVkID0gZmFsc2U7XG4gICAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihpZCk7XG5cbiAgICAgICAgICAvLyBVcGRhdGUgdGhlIHNlZWsgcG9zaXRpb24gZm9yIEhUTUw1IEF1ZGlvLlxuICAgICAgICAgIGlmICghc2VsZi5fd2ViQXVkaW8gJiYgc291bmQuX25vZGUgJiYgIWlzTmFOKHNvdW5kLl9ub2RlLmR1cmF0aW9uKSkge1xuICAgICAgICAgICAgc291bmQuX25vZGUuY3VycmVudFRpbWUgPSBzZWVrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFNlZWsgYW5kIGVtaXQgd2hlbiByZWFkeS5cbiAgICAgICAgICB2YXIgc2Vla0FuZEVtaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIFJlc3RhcnQgdGhlIHBsYXliYWNrIGlmIHRoZSBzb3VuZCB3YXMgcGxheWluZy5cbiAgICAgICAgICAgIGlmIChwbGF5aW5nKSB7XG4gICAgICAgICAgICAgIHNlbGYucGxheShpZCwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuX2VtaXQoJ3NlZWsnLCBpZCk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIFdhaXQgZm9yIHRoZSBwbGF5IGxvY2sgdG8gYmUgdW5zZXQgYmVmb3JlIGVtaXR0aW5nIChIVE1MNSBBdWRpbykuXG4gICAgICAgICAgaWYgKHBsYXlpbmcgJiYgIXNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgICB2YXIgZW1pdFNlZWsgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgaWYgKCFzZWxmLl9wbGF5TG9jaykge1xuICAgICAgICAgICAgICAgIHNlZWtBbmRFbWl0KCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChlbWl0U2VlaywgMCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGVtaXRTZWVrLCAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Vla0FuZEVtaXQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICAgICAgICB2YXIgcmVhbFRpbWUgPSBzZWxmLnBsYXlpbmcoaWQpID8gSG93bGVyLmN0eC5jdXJyZW50VGltZSAtIHNvdW5kLl9wbGF5U3RhcnQgOiAwO1xuICAgICAgICAgICAgdmFyIHJhdGVTZWVrID0gc291bmQuX3JhdGVTZWVrID8gc291bmQuX3JhdGVTZWVrIC0gc291bmQuX3NlZWsgOiAwO1xuICAgICAgICAgICAgcmV0dXJuIHNvdW5kLl9zZWVrICsgKHJhdGVTZWVrICsgcmVhbFRpbWUgKiBNYXRoLmFicyhzb3VuZC5fcmF0ZSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc291bmQuX25vZGUuY3VycmVudFRpbWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBhIHNwZWNpZmljIHNvdW5kIGlzIGN1cnJlbnRseSBwbGF5aW5nIG9yIG5vdCAoaWYgaWQgaXMgcHJvdmlkZWQpLCBvciBjaGVjayBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIHNvdW5kcyBpbiB0aGUgZ3JvdXAgaXMgcGxheWluZyBvciBub3QuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSAgaWQgVGhlIHNvdW5kIGlkIHRvIGNoZWNrLiBJZiBub25lIGlzIHBhc3NlZCwgdGhlIHdob2xlIHNvdW5kIGdyb3VwIGlzIGNoZWNrZWQuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSBpZiBwbGF5aW5nIGFuZCBmYWxzZSBpZiBub3QuXG4gICAgICovXG4gICAgcGxheWluZzogZnVuY3Rpb24oaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgLy8gQ2hlY2sgdGhlIHBhc3NlZCBzb3VuZCBJRCAoaWYgYW55KS5cbiAgICAgIGlmICh0eXBlb2YgaWQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZCk7XG4gICAgICAgIHJldHVybiBzb3VuZCA/ICFzb3VuZC5fcGF1c2VkIDogZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIE90aGVyd2lzZSwgbG9vcCB0aHJvdWdoIGFsbCBzb3VuZHMgYW5kIGNoZWNrIGlmIGFueSBhcmUgcGxheWluZy5cbiAgICAgIGZvciAodmFyIGk9MDsgaTxzZWxmLl9zb3VuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFzZWxmLl9zb3VuZHNbaV0uX3BhdXNlZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBkdXJhdGlvbiBvZiB0aGlzIHNvdW5kLiBQYXNzaW5nIGEgc291bmQgaWQgd2lsbCByZXR1cm4gdGhlIHNwcml0ZSBkdXJhdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIFRoZSBzb3VuZCBpZCB0byBjaGVjay4gSWYgbm9uZSBpcyBwYXNzZWQsIHJldHVybiBmdWxsIHNvdXJjZSBkdXJhdGlvbi5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IEF1ZGlvIGR1cmF0aW9uIGluIHNlY29uZHMuXG4gICAgICovXG4gICAgZHVyYXRpb246IGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgZHVyYXRpb24gPSBzZWxmLl9kdXJhdGlvbjtcblxuICAgICAgLy8gSWYgd2UgcGFzcyBhbiBJRCwgZ2V0IHRoZSBzb3VuZCBhbmQgcmV0dXJuIHRoZSBzcHJpdGUgbGVuZ3RoLlxuICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkKTtcbiAgICAgIGlmIChzb3VuZCkge1xuICAgICAgICBkdXJhdGlvbiA9IHNlbGYuX3Nwcml0ZVtzb3VuZC5fc3ByaXRlXVsxXSAvIDEwMDA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkdXJhdGlvbjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCBsb2FkZWQgc3RhdGUgb2YgdGhpcyBIb3dsLlxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gJ3VubG9hZGVkJywgJ2xvYWRpbmcnLCAnbG9hZGVkJ1xuICAgICAqL1xuICAgIHN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVW5sb2FkIGFuZCBkZXN0cm95IHRoZSBjdXJyZW50IEhvd2wgb2JqZWN0LlxuICAgICAqIFRoaXMgd2lsbCBpbW1lZGlhdGVseSBzdG9wIGFsbCBzb3VuZCBpbnN0YW5jZXMgYXR0YWNoZWQgdG8gdGhpcyBncm91cC5cbiAgICAgKi9cbiAgICB1bmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBTdG9wIHBsYXlpbmcgYW55IGFjdGl2ZSBzb3VuZHMuXG4gICAgICB2YXIgc291bmRzID0gc2VsZi5fc291bmRzO1xuICAgICAgZm9yICh2YXIgaT0wOyBpPHNvdW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBTdG9wIHRoZSBzb3VuZCBpZiBpdCBpcyBjdXJyZW50bHkgcGxheWluZy5cbiAgICAgICAgaWYgKCFzb3VuZHNbaV0uX3BhdXNlZCkge1xuICAgICAgICAgIHNlbGYuc3RvcChzb3VuZHNbaV0uX2lkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgc291cmNlIG9yIGRpc2Nvbm5lY3QuXG4gICAgICAgIGlmICghc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgICAgICAvLyBTZXQgdGhlIHNvdXJjZSB0byAwLXNlY29uZCBzaWxlbmNlIHRvIHN0b3AgYW55IGRvd25sb2FkaW5nIChleGNlcHQgaW4gSUUpLlxuICAgICAgICAgIHNlbGYuX2NsZWFyU291bmQoc291bmRzW2ldLl9ub2RlKTtcblxuICAgICAgICAgIC8vIFJlbW92ZSBhbnkgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgICAgIHNvdW5kc1tpXS5fbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIHNvdW5kc1tpXS5fZXJyb3JGbiwgZmFsc2UpO1xuICAgICAgICAgIHNvdW5kc1tpXS5fbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKEhvd2xlci5fY2FuUGxheUV2ZW50LCBzb3VuZHNbaV0uX2xvYWRGbiwgZmFsc2UpO1xuICAgICAgICAgIHNvdW5kc1tpXS5fbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlbmRlZCcsIHNvdW5kc1tpXS5fZW5kRm4sIGZhbHNlKTtcblxuICAgICAgICAgIC8vIFJlbGVhc2UgdGhlIEF1ZGlvIG9iamVjdCBiYWNrIHRvIHRoZSBwb29sLlxuICAgICAgICAgIEhvd2xlci5fcmVsZWFzZUh0bWw1QXVkaW8oc291bmRzW2ldLl9ub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVtcHR5IG91dCBhbGwgb2YgdGhlIG5vZGVzLlxuICAgICAgICBkZWxldGUgc291bmRzW2ldLl9ub2RlO1xuXG4gICAgICAgIC8vIE1ha2Ugc3VyZSBhbGwgdGltZXJzIGFyZSBjbGVhcmVkIG91dC5cbiAgICAgICAgc2VsZi5fY2xlYXJUaW1lcihzb3VuZHNbaV0uX2lkKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIHRoZSByZWZlcmVuY2VzIGluIHRoZSBnbG9iYWwgSG93bGVyIG9iamVjdC5cbiAgICAgIHZhciBpbmRleCA9IEhvd2xlci5faG93bHMuaW5kZXhPZihzZWxmKTtcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgIEhvd2xlci5faG93bHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH1cblxuICAgICAgLy8gRGVsZXRlIHRoaXMgc291bmQgZnJvbSB0aGUgY2FjaGUgKGlmIG5vIG90aGVyIEhvd2wgaXMgdXNpbmcgaXQpLlxuICAgICAgdmFyIHJlbUNhY2hlID0gdHJ1ZTtcbiAgICAgIGZvciAoaT0wOyBpPEhvd2xlci5faG93bHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKEhvd2xlci5faG93bHNbaV0uX3NyYyA9PT0gc2VsZi5fc3JjIHx8IHNlbGYuX3NyYy5pbmRleE9mKEhvd2xlci5faG93bHNbaV0uX3NyYykgPj0gMCkge1xuICAgICAgICAgIHJlbUNhY2hlID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNhY2hlICYmIHJlbUNhY2hlKSB7XG4gICAgICAgIGRlbGV0ZSBjYWNoZVtzZWxmLl9zcmNdO1xuICAgICAgfVxuXG4gICAgICAvLyBDbGVhciBnbG9iYWwgZXJyb3JzLlxuICAgICAgSG93bGVyLm5vQXVkaW8gPSBmYWxzZTtcblxuICAgICAgLy8gQ2xlYXIgb3V0IGBzZWxmYC5cbiAgICAgIHNlbGYuX3N0YXRlID0gJ3VubG9hZGVkJztcbiAgICAgIHNlbGYuX3NvdW5kcyA9IFtdO1xuICAgICAgc2VsZiA9IG51bGw7XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBMaXN0ZW4gdG8gYSBjdXN0b20gZXZlbnQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSAgIGV2ZW50IEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuICAgIExpc3RlbmVyIHRvIGNhbGwuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSAgIGlkICAgIChvcHRpb25hbCkgT25seSBsaXN0ZW4gdG8gZXZlbnRzIGZvciB0aGlzIHNvdW5kLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICBvbmNlICAoSU5URVJOQUwpIE1hcmtzIGV2ZW50IHRvIGZpcmUgb25seSBvbmNlLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uKGV2ZW50LCBmbiwgaWQsIG9uY2UpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSBzZWxmWydfb24nICsgZXZlbnRdO1xuXG4gICAgICBpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKG9uY2UgPyB7aWQ6IGlkLCBmbjogZm4sIG9uY2U6IG9uY2V9IDoge2lkOiBpZCwgZm46IGZufSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBjdXN0b20gZXZlbnQuIENhbGwgd2l0aG91dCBwYXJhbWV0ZXJzIHRvIHJlbW92ZSBhbGwgZXZlbnRzLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBldmVudCBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgICBMaXN0ZW5lciB0byByZW1vdmUuIExlYXZlIGVtcHR5IHRvIHJlbW92ZSBhbGwuXG4gICAgICogQHBhcmFtICB7TnVtYmVyfSAgIGlkICAgIChvcHRpb25hbCkgT25seSByZW1vdmUgZXZlbnRzIGZvciB0aGlzIHNvdW5kLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbihldmVudCwgZm4sIGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgZXZlbnRzID0gc2VsZlsnX29uJyArIGV2ZW50XTtcbiAgICAgIHZhciBpID0gMDtcblxuICAgICAgLy8gQWxsb3cgcGFzc2luZyBqdXN0IGFuIGV2ZW50IGFuZCBJRC5cbiAgICAgIGlmICh0eXBlb2YgZm4gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlkID0gZm47XG4gICAgICAgIGZuID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKGZuIHx8IGlkKSB7XG4gICAgICAgIC8vIExvb3AgdGhyb3VnaCBldmVudCBzdG9yZSBhbmQgcmVtb3ZlIHRoZSBwYXNzZWQgZnVuY3Rpb24uXG4gICAgICAgIGZvciAoaT0wOyBpPGV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBpc0lkID0gKGlkID09PSBldmVudHNbaV0uaWQpO1xuICAgICAgICAgIGlmIChmbiA9PT0gZXZlbnRzW2ldLmZuICYmIGlzSWQgfHwgIWZuICYmIGlzSWQpIHtcbiAgICAgICAgICAgIGV2ZW50cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQpIHtcbiAgICAgICAgLy8gQ2xlYXIgb3V0IGFsbCBldmVudHMgb2YgdGhpcyB0eXBlLlxuICAgICAgICBzZWxmWydfb24nICsgZXZlbnRdID0gW107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDbGVhciBvdXQgYWxsIGV2ZW50cyBvZiBldmVyeSB0eXBlLlxuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNlbGYpO1xuICAgICAgICBmb3IgKGk9MDsgaTxrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKChrZXlzW2ldLmluZGV4T2YoJ19vbicpID09PSAwKSAmJiBBcnJheS5pc0FycmF5KHNlbGZba2V5c1tpXV0pKSB7XG4gICAgICAgICAgICBzZWxmW2tleXNbaV1dID0gW107XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBMaXN0ZW4gdG8gYSBjdXN0b20gZXZlbnQgYW5kIHJlbW92ZSBpdCBvbmNlIGZpcmVkLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gICBldmVudCBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgICBMaXN0ZW5lciB0byBjYWxsLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gICBpZCAgICAob3B0aW9uYWwpIE9ubHkgbGlzdGVuIHRvIGV2ZW50cyBmb3IgdGhpcyBzb3VuZC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIG9uY2U6IGZ1bmN0aW9uKGV2ZW50LCBmbiwgaWQpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgLy8gU2V0dXAgdGhlIGV2ZW50IGxpc3RlbmVyLlxuICAgICAgc2VsZi5vbihldmVudCwgZm4sIGlkLCAxKTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEVtaXQgYWxsIGV2ZW50cyBvZiBhIHNwZWNpZmljIHR5cGUgYW5kIHBhc3MgdGhlIHNvdW5kIGlkLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnQgRXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkICAgIFNvdW5kIElELlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gbXNnICAgTWVzc2FnZSB0byBnbyB3aXRoIGV2ZW50LlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgX2VtaXQ6IGZ1bmN0aW9uKGV2ZW50LCBpZCwgbXNnKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgZXZlbnRzID0gc2VsZlsnX29uJyArIGV2ZW50XTtcblxuICAgICAgLy8gTG9vcCB0aHJvdWdoIGV2ZW50IHN0b3JlIGFuZCBmaXJlIGFsbCBmdW5jdGlvbnMuXG4gICAgICBmb3IgKHZhciBpPWV2ZW50cy5sZW5ndGgtMTsgaT49MDsgaS0tKSB7XG4gICAgICAgIC8vIE9ubHkgZmlyZSB0aGUgbGlzdGVuZXIgaWYgdGhlIGNvcnJlY3QgSUQgaXMgdXNlZC5cbiAgICAgICAgaWYgKCFldmVudHNbaV0uaWQgfHwgZXZlbnRzW2ldLmlkID09PSBpZCB8fCBldmVudCA9PT0gJ2xvYWQnKSB7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbihmbikge1xuICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBpZCwgbXNnKTtcbiAgICAgICAgICB9LmJpbmQoc2VsZiwgZXZlbnRzW2ldLmZuKSwgMCk7XG5cbiAgICAgICAgICAvLyBJZiB0aGlzIGV2ZW50IHdhcyBzZXR1cCB3aXRoIGBvbmNlYCwgcmVtb3ZlIGl0LlxuICAgICAgICAgIGlmIChldmVudHNbaV0ub25jZSkge1xuICAgICAgICAgICAgc2VsZi5vZmYoZXZlbnQsIGV2ZW50c1tpXS5mbiwgZXZlbnRzW2ldLmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUGFzcyB0aGUgZXZlbnQgdHlwZSBpbnRvIGxvYWQgcXVldWUgc28gdGhhdCBpdCBjYW4gY29udGludWUgc3RlcHBpbmcuXG4gICAgICBzZWxmLl9sb2FkUXVldWUoZXZlbnQpO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUXVldWUgb2YgYWN0aW9ucyBpbml0aWF0ZWQgYmVmb3JlIHRoZSBzb3VuZCBoYXMgbG9hZGVkLlxuICAgICAqIFRoZXNlIHdpbGwgYmUgY2FsbGVkIGluIHNlcXVlbmNlLCB3aXRoIHRoZSBuZXh0IG9ubHkgZmlyaW5nXG4gICAgICogYWZ0ZXIgdGhlIHByZXZpb3VzIGhhcyBmaW5pc2hlZCBleGVjdXRpbmcgKGV2ZW4gaWYgYXN5bmMgbGlrZSBwbGF5KS5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIF9sb2FkUXVldWU6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGlmIChzZWxmLl9xdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciB0YXNrID0gc2VsZi5fcXVldWVbMF07XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoaXMgdGFzayBpZiBhIG1hdGNoaW5nIGV2ZW50IHdhcyBwYXNzZWQuXG4gICAgICAgIGlmICh0YXNrLmV2ZW50ID09PSBldmVudCkge1xuICAgICAgICAgIHNlbGYuX3F1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgc2VsZi5fbG9hZFF1ZXVlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSdW4gdGhlIHRhc2sgaWYgbm8gZXZlbnQgdHlwZSBpcyBwYXNzZWQuXG4gICAgICAgIGlmICghZXZlbnQpIHtcbiAgICAgICAgICB0YXNrLmFjdGlvbigpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaXJlZCB3aGVuIHBsYXliYWNrIGVuZHMgYXQgdGhlIGVuZCBvZiB0aGUgZHVyYXRpb24uXG4gICAgICogQHBhcmFtICB7U291bmR9IHNvdW5kIFRoZSBzb3VuZCBvYmplY3QgdG8gd29yayB3aXRoLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgX2VuZGVkOiBmdW5jdGlvbihzb3VuZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHNwcml0ZSA9IHNvdW5kLl9zcHJpdGU7XG5cbiAgICAgIC8vIElmIHdlIGFyZSB1c2luZyBJRSBhbmQgdGhlcmUgd2FzIG5ldHdvcmsgbGF0ZW5jeSB3ZSBtYXkgYmUgY2xpcHBpbmdcbiAgICAgIC8vIGF1ZGlvIGJlZm9yZSBpdCBjb21wbGV0ZXMgcGxheWluZy4gTGV0cyBjaGVjayB0aGUgbm9kZSB0byBtYWtlIHN1cmUgaXRcbiAgICAgIC8vIGJlbGlldmVzIGl0IGhhcyBjb21wbGV0ZWQsIGJlZm9yZSBlbmRpbmcgdGhlIHBsYXliYWNrLlxuICAgICAgaWYgKCFzZWxmLl93ZWJBdWRpbyAmJiBzb3VuZC5fbm9kZSAmJiAhc291bmQuX25vZGUucGF1c2VkICYmICFzb3VuZC5fbm9kZS5lbmRlZCAmJiBzb3VuZC5fbm9kZS5jdXJyZW50VGltZSA8IHNvdW5kLl9zdG9wKSB7XG4gICAgICAgIHNldFRpbWVvdXQoc2VsZi5fZW5kZWQuYmluZChzZWxmLCBzb3VuZCksIDEwMCk7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfVxuXG4gICAgICAvLyBTaG91bGQgdGhpcyBzb3VuZCBsb29wP1xuICAgICAgdmFyIGxvb3AgPSAhIShzb3VuZC5fbG9vcCB8fCBzZWxmLl9zcHJpdGVbc3ByaXRlXVsyXSk7XG5cbiAgICAgIC8vIEZpcmUgdGhlIGVuZGVkIGV2ZW50LlxuICAgICAgc2VsZi5fZW1pdCgnZW5kJywgc291bmQuX2lkKTtcblxuICAgICAgLy8gUmVzdGFydCB0aGUgcGxheWJhY2sgZm9yIEhUTUw1IEF1ZGlvIGxvb3AuXG4gICAgICBpZiAoIXNlbGYuX3dlYkF1ZGlvICYmIGxvb3ApIHtcbiAgICAgICAgc2VsZi5zdG9wKHNvdW5kLl9pZCwgdHJ1ZSkucGxheShzb3VuZC5faWQpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXN0YXJ0IHRoaXMgdGltZXIgaWYgb24gYSBXZWIgQXVkaW8gbG9vcC5cbiAgICAgIGlmIChzZWxmLl93ZWJBdWRpbyAmJiBsb29wKSB7XG4gICAgICAgIHNlbGYuX2VtaXQoJ3BsYXknLCBzb3VuZC5faWQpO1xuICAgICAgICBzb3VuZC5fc2VlayA9IHNvdW5kLl9zdGFydCB8fCAwO1xuICAgICAgICBzb3VuZC5fcmF0ZVNlZWsgPSAwO1xuICAgICAgICBzb3VuZC5fcGxheVN0YXJ0ID0gSG93bGVyLmN0eC5jdXJyZW50VGltZTtcblxuICAgICAgICB2YXIgdGltZW91dCA9ICgoc291bmQuX3N0b3AgLSBzb3VuZC5fc3RhcnQpICogMTAwMCkgLyBNYXRoLmFicyhzb3VuZC5fcmF0ZSk7XG4gICAgICAgIHNlbGYuX2VuZFRpbWVyc1tzb3VuZC5faWRdID0gc2V0VGltZW91dChzZWxmLl9lbmRlZC5iaW5kKHNlbGYsIHNvdW5kKSwgdGltZW91dCk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1hcmsgdGhlIG5vZGUgYXMgcGF1c2VkLlxuICAgICAgaWYgKHNlbGYuX3dlYkF1ZGlvICYmICFsb29wKSB7XG4gICAgICAgIHNvdW5kLl9wYXVzZWQgPSB0cnVlO1xuICAgICAgICBzb3VuZC5fZW5kZWQgPSB0cnVlO1xuICAgICAgICBzb3VuZC5fc2VlayA9IHNvdW5kLl9zdGFydCB8fCAwO1xuICAgICAgICBzb3VuZC5fcmF0ZVNlZWsgPSAwO1xuICAgICAgICBzZWxmLl9jbGVhclRpbWVyKHNvdW5kLl9pZCk7XG5cbiAgICAgICAgLy8gQ2xlYW4gdXAgdGhlIGJ1ZmZlciBzb3VyY2UuXG4gICAgICAgIHNlbGYuX2NsZWFuQnVmZmVyKHNvdW5kLl9ub2RlKTtcblxuICAgICAgICAvLyBBdHRlbXB0IHRvIGF1dG8tc3VzcGVuZCBBdWRpb0NvbnRleHQgaWYgbm8gc291bmRzIGFyZSBzdGlsbCBwbGF5aW5nLlxuICAgICAgICBIb3dsZXIuX2F1dG9TdXNwZW5kKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdoZW4gdXNpbmcgYSBzcHJpdGUsIGVuZCB0aGUgdHJhY2suXG4gICAgICBpZiAoIXNlbGYuX3dlYkF1ZGlvICYmICFsb29wKSB7XG4gICAgICAgIHNlbGYuc3RvcChzb3VuZC5faWQsIHRydWUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgdGhlIGVuZCB0aW1lciBmb3IgYSBzb3VuZCBwbGF5YmFjay5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIFRoZSBzb3VuZCBJRC5cbiAgICAgKiBAcmV0dXJuIHtIb3dsfVxuICAgICAqL1xuICAgIF9jbGVhclRpbWVyOiBmdW5jdGlvbihpZCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBpZiAoc2VsZi5fZW5kVGltZXJzW2lkXSkge1xuICAgICAgICAvLyBDbGVhciB0aGUgdGltZW91dCBvciByZW1vdmUgdGhlIGVuZGVkIGxpc3RlbmVyLlxuICAgICAgICBpZiAodHlwZW9mIHNlbGYuX2VuZFRpbWVyc1tpZF0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoc2VsZi5fZW5kVGltZXJzW2lkXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKGlkKTtcbiAgICAgICAgICBpZiAoc291bmQgJiYgc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgIHNvdW5kLl9ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgc2VsZi5fZW5kVGltZXJzW2lkXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGRlbGV0ZSBzZWxmLl9lbmRUaW1lcnNbaWRdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBzb3VuZCBpZGVudGlmaWVkIGJ5IHRoaXMgSUQsIG9yIHJldHVybiBudWxsLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgU291bmQgSURcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9ICAgIFNvdW5kIG9iamVjdCBvciBudWxsLlxuICAgICAqL1xuICAgIF9zb3VuZEJ5SWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgc291bmRzIGFuZCBmaW5kIHRoZSBvbmUgd2l0aCB0aGlzIElELlxuICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX3NvdW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaWQgPT09IHNlbGYuX3NvdW5kc1tpXS5faWQpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi5fc291bmRzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYW4gaW5hY3RpdmUgc291bmQgZnJvbSB0aGUgcG9vbCBvciBjcmVhdGUgYSBuZXcgb25lLlxuICAgICAqIEByZXR1cm4ge1NvdW5kfSBTb3VuZCBwbGF5YmFjayBvYmplY3QuXG4gICAgICovXG4gICAgX2luYWN0aXZlU291bmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBzZWxmLl9kcmFpbigpO1xuXG4gICAgICAvLyBGaW5kIHRoZSBmaXJzdCBpbmFjdGl2ZSBub2RlIHRvIHJlY3ljbGUuXG4gICAgICBmb3IgKHZhciBpPTA7IGk8c2VsZi5fc291bmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzZWxmLl9zb3VuZHNbaV0uX2VuZGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYuX3NvdW5kc1tpXS5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIGluYWN0aXZlIG5vZGUgd2FzIGZvdW5kLCBjcmVhdGUgYSBuZXcgb25lLlxuICAgICAgcmV0dXJuIG5ldyBTb3VuZChzZWxmKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRHJhaW4gZXhjZXNzIGluYWN0aXZlIHNvdW5kcyBmcm9tIHRoZSBwb29sLlxuICAgICAqL1xuICAgIF9kcmFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgbGltaXQgPSBzZWxmLl9wb29sO1xuICAgICAgdmFyIGNudCA9IDA7XG4gICAgICB2YXIgaSA9IDA7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBsZXNzIHNvdW5kcyB0aGFuIHRoZSBtYXggcG9vbCBzaXplLCB3ZSBhcmUgZG9uZS5cbiAgICAgIGlmIChzZWxmLl9zb3VuZHMubGVuZ3RoIDwgbGltaXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBDb3VudCB0aGUgbnVtYmVyIG9mIGluYWN0aXZlIHNvdW5kcy5cbiAgICAgIGZvciAoaT0wOyBpPHNlbGYuX3NvdW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc2VsZi5fc291bmRzW2ldLl9lbmRlZCkge1xuICAgICAgICAgIGNudCsrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSBleGNlc3MgaW5hY3RpdmUgc291bmRzLCBnb2luZyBpbiByZXZlcnNlIG9yZGVyLlxuICAgICAgZm9yIChpPXNlbGYuX3NvdW5kcy5sZW5ndGggLSAxOyBpPj0wOyBpLS0pIHtcbiAgICAgICAgaWYgKGNudCA8PSBsaW1pdCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxmLl9zb3VuZHNbaV0uX2VuZGVkKSB7XG4gICAgICAgICAgLy8gRGlzY29ubmVjdCB0aGUgYXVkaW8gc291cmNlIHdoZW4gdXNpbmcgV2ViIEF1ZGlvLlxuICAgICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbyAmJiBzZWxmLl9zb3VuZHNbaV0uX25vZGUpIHtcbiAgICAgICAgICAgIHNlbGYuX3NvdW5kc1tpXS5fbm9kZS5kaXNjb25uZWN0KDApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlbW92ZSBzb3VuZHMgdW50aWwgd2UgaGF2ZSB0aGUgcG9vbCBzaXplLlxuICAgICAgICAgIHNlbGYuX3NvdW5kcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgY250LS07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBJRCdzIGZyb20gdGhlIHNvdW5kcyBwb29sLlxuICAgICAqIEBwYXJhbSAge051bWJlcn0gaWQgT25seSByZXR1cm4gb25lIElEIGlmIG9uZSBpcyBwYXNzZWQuXG4gICAgICogQHJldHVybiB7QXJyYXl9ICAgIEFycmF5IG9mIElEcy5cbiAgICAgKi9cbiAgICBfZ2V0U291bmRJZHM6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIGlmICh0eXBlb2YgaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBpZHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHNlbGYuX3NvdW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlkcy5wdXNoKHNlbGYuX3NvdW5kc1tpXS5faWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlkcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbaWRdO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHRoZSBzb3VuZCBiYWNrIGludG8gdGhlIGJ1ZmZlciBzb3VyY2UuXG4gICAgICogQHBhcmFtICB7U291bmR9IHNvdW5kIFRoZSBzb3VuZCBvYmplY3QgdG8gd29yayB3aXRoLlxuICAgICAqIEByZXR1cm4ge0hvd2x9XG4gICAgICovXG4gICAgX3JlZnJlc2hCdWZmZXI6IGZ1bmN0aW9uKHNvdW5kKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIFNldHVwIHRoZSBidWZmZXIgc291cmNlIGZvciBwbGF5YmFjay5cbiAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZSA9IEhvd2xlci5jdHguY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UuYnVmZmVyID0gY2FjaGVbc2VsZi5fc3JjXTtcblxuICAgICAgLy8gQ29ubmVjdCB0byB0aGUgY29ycmVjdCBub2RlLlxuICAgICAgaWYgKHNvdW5kLl9wYW5uZXIpIHtcbiAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmNvbm5lY3Qoc291bmQuX3Bhbm5lcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UuY29ubmVjdChzb3VuZC5fbm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHVwIGxvb3BpbmcgYW5kIHBsYXliYWNrIHJhdGUuXG4gICAgICBzb3VuZC5fbm9kZS5idWZmZXJTb3VyY2UubG9vcCA9IHNvdW5kLl9sb29wO1xuICAgICAgaWYgKHNvdW5kLl9sb29wKSB7XG4gICAgICAgIHNvdW5kLl9ub2RlLmJ1ZmZlclNvdXJjZS5sb29wU3RhcnQgPSBzb3VuZC5fc3RhcnQgfHwgMDtcbiAgICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLmxvb3BFbmQgPSBzb3VuZC5fc3RvcCB8fCAwO1xuICAgICAgfVxuICAgICAgc291bmQuX25vZGUuYnVmZmVyU291cmNlLnBsYXliYWNrUmF0ZS5zZXRWYWx1ZUF0VGltZShzb3VuZC5fcmF0ZSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IG1lbW9yeSBsZWFrcyBieSBjbGVhbmluZyB1cCB0aGUgYnVmZmVyIHNvdXJjZSBhZnRlciBwbGF5YmFjay5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG5vZGUgU291bmQncyBhdWRpbyBub2RlIGNvbnRhaW5pbmcgdGhlIGJ1ZmZlciBzb3VyY2UuXG4gICAgICogQHJldHVybiB7SG93bH1cbiAgICAgKi9cbiAgICBfY2xlYW5CdWZmZXI6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBpc0lPUyA9IEhvd2xlci5fbmF2aWdhdG9yICYmIEhvd2xlci5fbmF2aWdhdG9yLnZlbmRvci5pbmRleE9mKCdBcHBsZScpID49IDA7XG5cbiAgICAgIGlmIChIb3dsZXIuX3NjcmF0Y2hCdWZmZXIgJiYgbm9kZS5idWZmZXJTb3VyY2UpIHtcbiAgICAgICAgbm9kZS5idWZmZXJTb3VyY2Uub25lbmRlZCA9IG51bGw7XG4gICAgICAgIG5vZGUuYnVmZmVyU291cmNlLmRpc2Nvbm5lY3QoMCk7XG4gICAgICAgIGlmIChpc0lPUykge1xuICAgICAgICAgIHRyeSB7IG5vZGUuYnVmZmVyU291cmNlLmJ1ZmZlciA9IEhvd2xlci5fc2NyYXRjaEJ1ZmZlcjsgfSBjYXRjaChlKSB7fVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBub2RlLmJ1ZmZlclNvdXJjZSA9IG51bGw7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNvdXJjZSB0byBhIDAtc2Vjb25kIHNpbGVuY2UgdG8gc3RvcCBhbnkgZG93bmxvYWRpbmcgKGV4Y2VwdCBpbiBJRSkuXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBub2RlIEF1ZGlvIG5vZGUgdG8gY2xlYXIuXG4gICAgICovXG4gICAgX2NsZWFyU291bmQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHZhciBjaGVja0lFID0gL01TSUUgfFRyaWRlbnRcXC8vLnRlc3QoSG93bGVyLl9uYXZpZ2F0b3IgJiYgSG93bGVyLl9uYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgICAgIGlmICghY2hlY2tJRSkge1xuICAgICAgICBub2RlLnNyYyA9ICdkYXRhOmF1ZGlvL3dhdjtiYXNlNjQsVWtsR1JpZ0FBQUJYUVZaRlptMTBJQklBQUFBQkFBRUFSS3dBQUloWUFRQUNBQkFBQUFCa1lYUmhBZ0FBQUFFQSc7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKiBTaW5nbGUgU291bmQgTWV0aG9kcyAqKi9cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogU2V0dXAgdGhlIHNvdW5kIG9iamVjdCwgd2hpY2ggZWFjaCBub2RlIGF0dGFjaGVkIHRvIGEgSG93bCBncm91cCBpcyBjb250YWluZWQgaW4uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBob3dsIFRoZSBIb3dsIHBhcmVudCBncm91cC5cbiAgICovXG4gIHZhciBTb3VuZCA9IGZ1bmN0aW9uKGhvd2wpIHtcbiAgICB0aGlzLl9wYXJlbnQgPSBob3dsO1xuICAgIHRoaXMuaW5pdCgpO1xuICB9O1xuICBTb3VuZC5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhIG5ldyBTb3VuZCBvYmplY3QuXG4gICAgICogQHJldHVybiB7U291bmR9XG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGFyZW50ID0gc2VsZi5fcGFyZW50O1xuXG4gICAgICAvLyBTZXR1cCB0aGUgZGVmYXVsdCBwYXJhbWV0ZXJzLlxuICAgICAgc2VsZi5fbXV0ZWQgPSBwYXJlbnQuX211dGVkO1xuICAgICAgc2VsZi5fbG9vcCA9IHBhcmVudC5fbG9vcDtcbiAgICAgIHNlbGYuX3ZvbHVtZSA9IHBhcmVudC5fdm9sdW1lO1xuICAgICAgc2VsZi5fcmF0ZSA9IHBhcmVudC5fcmF0ZTtcbiAgICAgIHNlbGYuX3NlZWsgPSAwO1xuICAgICAgc2VsZi5fcGF1c2VkID0gdHJ1ZTtcbiAgICAgIHNlbGYuX2VuZGVkID0gdHJ1ZTtcbiAgICAgIHNlbGYuX3Nwcml0ZSA9ICdfX2RlZmF1bHQnO1xuXG4gICAgICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBJRCBmb3IgdGhpcyBzb3VuZC5cbiAgICAgIHNlbGYuX2lkID0gKytIb3dsZXIuX2NvdW50ZXI7XG5cbiAgICAgIC8vIEFkZCBpdHNlbGYgdG8gdGhlIHBhcmVudCdzIHBvb2wuXG4gICAgICBwYXJlbnQuX3NvdW5kcy5wdXNoKHNlbGYpO1xuXG4gICAgICAvLyBDcmVhdGUgdGhlIG5ldyBub2RlLlxuICAgICAgc2VsZi5jcmVhdGUoKTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbmQgc2V0dXAgYSBuZXcgc291bmQgb2JqZWN0LCB3aGV0aGVyIEhUTUw1IEF1ZGlvIG9yIFdlYiBBdWRpby5cbiAgICAgKiBAcmV0dXJuIHtTb3VuZH1cbiAgICAgKi9cbiAgICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBhcmVudCA9IHNlbGYuX3BhcmVudDtcbiAgICAgIHZhciB2b2x1bWUgPSAoSG93bGVyLl9tdXRlZCB8fCBzZWxmLl9tdXRlZCB8fCBzZWxmLl9wYXJlbnQuX211dGVkKSA/IDAgOiBzZWxmLl92b2x1bWU7XG5cbiAgICAgIGlmIChwYXJlbnQuX3dlYkF1ZGlvKSB7XG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZ2FpbiBub2RlIGZvciBjb250cm9sbGluZyB2b2x1bWUgKHRoZSBzb3VyY2Ugd2lsbCBjb25uZWN0IHRvIHRoaXMpLlxuICAgICAgICBzZWxmLl9ub2RlID0gKHR5cGVvZiBIb3dsZXIuY3R4LmNyZWF0ZUdhaW4gPT09ICd1bmRlZmluZWQnKSA/IEhvd2xlci5jdHguY3JlYXRlR2Fpbk5vZGUoKSA6IEhvd2xlci5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICBzZWxmLl9ub2RlLmdhaW4uc2V0VmFsdWVBdFRpbWUodm9sdW1lLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgc2VsZi5fbm9kZS5wYXVzZWQgPSB0cnVlO1xuICAgICAgICBzZWxmLl9ub2RlLmNvbm5lY3QoSG93bGVyLm1hc3RlckdhaW4pO1xuICAgICAgfSBlbHNlIGlmICghSG93bGVyLm5vQXVkaW8pIHtcbiAgICAgICAgLy8gR2V0IGFuIHVubG9ja2VkIEF1ZGlvIG9iamVjdCBmcm9tIHRoZSBwb29sLlxuICAgICAgICBzZWxmLl9ub2RlID0gSG93bGVyLl9vYnRhaW5IdG1sNUF1ZGlvKCk7XG5cbiAgICAgICAgLy8gTGlzdGVuIGZvciBlcnJvcnMgKGh0dHA6Ly9kZXYudzMub3JnL2h0bWw1L3NwZWMtYXV0aG9yLXZpZXcvc3BlYy5odG1sI21lZGlhZXJyb3IpLlxuICAgICAgICBzZWxmLl9lcnJvckZuID0gc2VsZi5fZXJyb3JMaXN0ZW5lci5iaW5kKHNlbGYpO1xuICAgICAgICBzZWxmLl9ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgc2VsZi5fZXJyb3JGbiwgZmFsc2UpO1xuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgJ2NhbnBsYXl0aHJvdWdoJyBldmVudCB0byBsZXQgdXMga25vdyB0aGUgc291bmQgaXMgcmVhZHkuXG4gICAgICAgIHNlbGYuX2xvYWRGbiA9IHNlbGYuX2xvYWRMaXN0ZW5lci5iaW5kKHNlbGYpO1xuICAgICAgICBzZWxmLl9ub2RlLmFkZEV2ZW50TGlzdGVuZXIoSG93bGVyLl9jYW5QbGF5RXZlbnQsIHNlbGYuX2xvYWRGbiwgZmFsc2UpO1xuXG4gICAgICAgIC8vIExpc3RlbiBmb3IgdGhlICdlbmRlZCcgZXZlbnQgb24gdGhlIHNvdW5kIHRvIGFjY291bnQgZm9yIGVkZ2UtY2FzZSB3aGVyZVxuICAgICAgICAvLyBhIGZpbml0ZSBzb3VuZCBoYXMgYSBkdXJhdGlvbiBvZiBJbmZpbml0eS5cbiAgICAgICAgc2VsZi5fZW5kRm4gPSBzZWxmLl9lbmRMaXN0ZW5lci5iaW5kKHNlbGYpO1xuICAgICAgICBzZWxmLl9ub2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgc2VsZi5fZW5kRm4sIGZhbHNlKTtcblxuICAgICAgICAvLyBTZXR1cCB0aGUgbmV3IGF1ZGlvIG5vZGUuXG4gICAgICAgIHNlbGYuX25vZGUuc3JjID0gcGFyZW50Ll9zcmM7XG4gICAgICAgIHNlbGYuX25vZGUucHJlbG9hZCA9IHBhcmVudC5fcHJlbG9hZCA9PT0gdHJ1ZSA/ICdhdXRvJyA6IHBhcmVudC5fcHJlbG9hZDtcbiAgICAgICAgc2VsZi5fbm9kZS52b2x1bWUgPSB2b2x1bWUgKiBIb3dsZXIudm9sdW1lKCk7XG5cbiAgICAgICAgLy8gQmVnaW4gbG9hZGluZyB0aGUgc291cmNlLlxuICAgICAgICBzZWxmLl9ub2RlLmxvYWQoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0IHRoZSBwYXJhbWV0ZXJzIG9mIHRoaXMgc291bmQgdG8gdGhlIG9yaWdpbmFsIHN0YXRlIChmb3IgcmVjeWNsZSkuXG4gICAgICogQHJldHVybiB7U291bmR9XG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBhcmVudCA9IHNlbGYuX3BhcmVudDtcblxuICAgICAgLy8gUmVzZXQgYWxsIG9mIHRoZSBwYXJhbWV0ZXJzIG9mIHRoaXMgc291bmQuXG4gICAgICBzZWxmLl9tdXRlZCA9IHBhcmVudC5fbXV0ZWQ7XG4gICAgICBzZWxmLl9sb29wID0gcGFyZW50Ll9sb29wO1xuICAgICAgc2VsZi5fdm9sdW1lID0gcGFyZW50Ll92b2x1bWU7XG4gICAgICBzZWxmLl9yYXRlID0gcGFyZW50Ll9yYXRlO1xuICAgICAgc2VsZi5fc2VlayA9IDA7XG4gICAgICBzZWxmLl9yYXRlU2VlayA9IDA7XG4gICAgICBzZWxmLl9wYXVzZWQgPSB0cnVlO1xuICAgICAgc2VsZi5fZW5kZWQgPSB0cnVlO1xuICAgICAgc2VsZi5fc3ByaXRlID0gJ19fZGVmYXVsdCc7XG5cbiAgICAgIC8vIEdlbmVyYXRlIGEgbmV3IElEIHNvIHRoYXQgaXQgaXNuJ3QgY29uZnVzZWQgd2l0aCB0aGUgcHJldmlvdXMgc291bmQuXG4gICAgICBzZWxmLl9pZCA9ICsrSG93bGVyLl9jb3VudGVyO1xuXG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSFRNTDUgQXVkaW8gZXJyb3IgbGlzdGVuZXIgY2FsbGJhY2suXG4gICAgICovXG4gICAgX2Vycm9yTGlzdGVuZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyBGaXJlIGFuIGVycm9yIGV2ZW50IGFuZCBwYXNzIGJhY2sgdGhlIGNvZGUuXG4gICAgICBzZWxmLl9wYXJlbnQuX2VtaXQoJ2xvYWRlcnJvcicsIHNlbGYuX2lkLCBzZWxmLl9ub2RlLmVycm9yID8gc2VsZi5fbm9kZS5lcnJvci5jb2RlIDogMCk7XG5cbiAgICAgIC8vIENsZWFyIHRoZSBldmVudCBsaXN0ZW5lci5cbiAgICAgIHNlbGYuX25vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBzZWxmLl9lcnJvckZuLCBmYWxzZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhUTUw1IEF1ZGlvIGNhbnBsYXl0aHJvdWdoIGxpc3RlbmVyIGNhbGxiYWNrLlxuICAgICAqL1xuICAgIF9sb2FkTGlzdGVuZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBhcmVudCA9IHNlbGYuX3BhcmVudDtcblxuICAgICAgLy8gUm91bmQgdXAgdGhlIGR1cmF0aW9uIHRvIGFjY291bnQgZm9yIHRoZSBsb3dlciBwcmVjaXNpb24gaW4gSFRNTDUgQXVkaW8uXG4gICAgICBwYXJlbnQuX2R1cmF0aW9uID0gTWF0aC5jZWlsKHNlbGYuX25vZGUuZHVyYXRpb24gKiAxMCkgLyAxMDtcblxuICAgICAgLy8gU2V0dXAgYSBzcHJpdGUgaWYgbm9uZSBpcyBkZWZpbmVkLlxuICAgICAgaWYgKE9iamVjdC5rZXlzKHBhcmVudC5fc3ByaXRlKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcGFyZW50Ll9zcHJpdGUgPSB7X19kZWZhdWx0OiBbMCwgcGFyZW50Ll9kdXJhdGlvbiAqIDEwMDBdfTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBhcmVudC5fc3RhdGUgIT09ICdsb2FkZWQnKSB7XG4gICAgICAgIHBhcmVudC5fc3RhdGUgPSAnbG9hZGVkJztcbiAgICAgICAgcGFyZW50Ll9lbWl0KCdsb2FkJyk7XG4gICAgICAgIHBhcmVudC5fbG9hZFF1ZXVlKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENsZWFyIHRoZSBldmVudCBsaXN0ZW5lci5cbiAgICAgIHNlbGYuX25vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihIb3dsZXIuX2NhblBsYXlFdmVudCwgc2VsZi5fbG9hZEZuLCBmYWxzZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhUTUw1IEF1ZGlvIGVuZGVkIGxpc3RlbmVyIGNhbGxiYWNrLlxuICAgICAqL1xuICAgIF9lbmRMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgcGFyZW50ID0gc2VsZi5fcGFyZW50O1xuXG4gICAgICAvLyBPbmx5IGhhbmRsZSB0aGUgYGVuZGVkYGAgZXZlbnQgaWYgdGhlIGR1cmF0aW9uIGlzIEluZmluaXR5LlxuICAgICAgaWYgKHBhcmVudC5fZHVyYXRpb24gPT09IEluZmluaXR5KSB7XG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgcGFyZW50IGR1cmF0aW9uIHRvIG1hdGNoIHRoZSByZWFsIGF1ZGlvIGR1cmF0aW9uLlxuICAgICAgICAvLyBSb3VuZCB1cCB0aGUgZHVyYXRpb24gdG8gYWNjb3VudCBmb3IgdGhlIGxvd2VyIHByZWNpc2lvbiBpbiBIVE1MNSBBdWRpby5cbiAgICAgICAgcGFyZW50Ll9kdXJhdGlvbiA9IE1hdGguY2VpbChzZWxmLl9ub2RlLmR1cmF0aW9uICogMTApIC8gMTA7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBzcHJpdGUgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgcmVhbCBkdXJhdGlvbi5cbiAgICAgICAgaWYgKHBhcmVudC5fc3ByaXRlLl9fZGVmYXVsdFsxXSA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICBwYXJlbnQuX3Nwcml0ZS5fX2RlZmF1bHRbMV0gPSBwYXJlbnQuX2R1cmF0aW9uICogMTAwMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJ1biB0aGUgcmVndWxhciBlbmRlZCBtZXRob2QuXG4gICAgICAgIHBhcmVudC5fZW5kZWQoc2VsZik7XG4gICAgICB9XG5cbiAgICAgIC8vIENsZWFyIHRoZSBldmVudCBsaXN0ZW5lciBzaW5jZSB0aGUgZHVyYXRpb24gaXMgbm93IGNvcnJlY3QuXG4gICAgICBzZWxmLl9ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgc2VsZi5fZW5kRm4sIGZhbHNlKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqIEhlbHBlciBNZXRob2RzICoqL1xuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIHZhciBjYWNoZSA9IHt9O1xuXG4gIC8qKlxuICAgKiBCdWZmZXIgYSBzb3VuZCBmcm9tIFVSTCwgRGF0YSBVUkkgb3IgY2FjaGUgYW5kIGRlY29kZSB0byBhdWRpbyBzb3VyY2UgKFdlYiBBdWRpbyBBUEkpLlxuICAgKiBAcGFyYW0gIHtIb3dsfSBzZWxmXG4gICAqL1xuICB2YXIgbG9hZEJ1ZmZlciA9IGZ1bmN0aW9uKHNlbGYpIHtcbiAgICB2YXIgdXJsID0gc2VsZi5fc3JjO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGJ1ZmZlciBoYXMgYWxyZWFkeSBiZWVuIGNhY2hlZCBhbmQgdXNlIGl0IGluc3RlYWQuXG4gICAgaWYgKGNhY2hlW3VybF0pIHtcbiAgICAgIC8vIFNldCB0aGUgZHVyYXRpb24gZnJvbSB0aGUgY2FjaGUuXG4gICAgICBzZWxmLl9kdXJhdGlvbiA9IGNhY2hlW3VybF0uZHVyYXRpb247XG5cbiAgICAgIC8vIExvYWQgdGhlIHNvdW5kIGludG8gdGhpcyBIb3dsLlxuICAgICAgbG9hZFNvdW5kKHNlbGYpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKC9eZGF0YTpbXjtdKztiYXNlNjQsLy50ZXN0KHVybCkpIHtcbiAgICAgIC8vIERlY29kZSB0aGUgYmFzZTY0IGRhdGEgVVJJIHdpdGhvdXQgWEhSLCBzaW5jZSBzb21lIGJyb3dzZXJzIGRvbid0IHN1cHBvcnQgaXQuXG4gICAgICB2YXIgZGF0YSA9IGF0b2IodXJsLnNwbGl0KCcsJylbMV0pO1xuICAgICAgdmFyIGRhdGFWaWV3ID0gbmV3IFVpbnQ4QXJyYXkoZGF0YS5sZW5ndGgpO1xuICAgICAgZm9yICh2YXIgaT0wOyBpPGRhdGEubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgZGF0YVZpZXdbaV0gPSBkYXRhLmNoYXJDb2RlQXQoaSk7XG4gICAgICB9XG5cbiAgICAgIGRlY29kZUF1ZGlvRGF0YShkYXRhVmlldy5idWZmZXIsIHNlbGYpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBMb2FkIHRoZSBidWZmZXIgZnJvbSB0aGUgVVJMLlxuICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgeGhyLm9wZW4oc2VsZi5feGhyLm1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSBzZWxmLl94aHIud2l0aENyZWRlbnRpYWxzO1xuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG5cbiAgICAgIC8vIEFwcGx5IGFueSBjdXN0b20gaGVhZGVycyB0byB0aGUgcmVxdWVzdC5cbiAgICAgIGlmIChzZWxmLl94aHIuaGVhZGVycykge1xuICAgICAgICBPYmplY3Qua2V5cyhzZWxmLl94aHIuaGVhZGVycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihrZXksIHNlbGYuX3hoci5oZWFkZXJzW2tleV0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBNYWtlIHN1cmUgd2UgZ2V0IGEgc3VjY2Vzc2Z1bCByZXNwb25zZSBiYWNrLlxuICAgICAgICB2YXIgY29kZSA9ICh4aHIuc3RhdHVzICsgJycpWzBdO1xuICAgICAgICBpZiAoY29kZSAhPT0gJzAnICYmIGNvZGUgIT09ICcyJyAmJiBjb2RlICE9PSAnMycpIHtcbiAgICAgICAgICBzZWxmLl9lbWl0KCdsb2FkZXJyb3InLCBudWxsLCAnRmFpbGVkIGxvYWRpbmcgYXVkaW8gZmlsZSB3aXRoIHN0YXR1czogJyArIHhoci5zdGF0dXMgKyAnLicpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRlY29kZUF1ZGlvRGF0YSh4aHIucmVzcG9uc2UsIHNlbGYpO1xuICAgICAgfTtcbiAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGlzIGFuIGVycm9yLCBzd2l0Y2ggdG8gSFRNTDUgQXVkaW8uXG4gICAgICAgIGlmIChzZWxmLl93ZWJBdWRpbykge1xuICAgICAgICAgIHNlbGYuX2h0bWw1ID0gdHJ1ZTtcbiAgICAgICAgICBzZWxmLl93ZWJBdWRpbyA9IGZhbHNlO1xuICAgICAgICAgIHNlbGYuX3NvdW5kcyA9IFtdO1xuICAgICAgICAgIGRlbGV0ZSBjYWNoZVt1cmxdO1xuICAgICAgICAgIHNlbGYubG9hZCgpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgc2FmZVhoclNlbmQoeGhyKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFNlbmQgdGhlIFhIUiByZXF1ZXN0IHdyYXBwZWQgaW4gYSB0cnkvY2F0Y2guXG4gICAqIEBwYXJhbSAge09iamVjdH0geGhyIFhIUiB0byBzZW5kLlxuICAgKi9cbiAgdmFyIHNhZmVYaHJTZW5kID0gZnVuY3Rpb24oeGhyKSB7XG4gICAgdHJ5IHtcbiAgICAgIHhoci5zZW5kKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgeGhyLm9uZXJyb3IoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIERlY29kZSBhdWRpbyBkYXRhIGZyb20gYW4gYXJyYXkgYnVmZmVyLlxuICAgKiBAcGFyYW0gIHtBcnJheUJ1ZmZlcn0gYXJyYXlidWZmZXIgVGhlIGF1ZGlvIGRhdGEuXG4gICAqIEBwYXJhbSAge0hvd2x9ICAgICAgICBzZWxmXG4gICAqL1xuICB2YXIgZGVjb2RlQXVkaW9EYXRhID0gZnVuY3Rpb24oYXJyYXlidWZmZXIsIHNlbGYpIHtcbiAgICAvLyBGaXJlIGEgbG9hZCBlcnJvciBpZiBzb21ldGhpbmcgYnJva2UuXG4gICAgdmFyIGVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLl9lbWl0KCdsb2FkZXJyb3InLCBudWxsLCAnRGVjb2RpbmcgYXVkaW8gZGF0YSBmYWlsZWQuJyk7XG4gICAgfTtcblxuICAgIC8vIExvYWQgdGhlIHNvdW5kIG9uIHN1Y2Nlc3MuXG4gICAgdmFyIHN1Y2Nlc3MgPSBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgIGlmIChidWZmZXIgJiYgc2VsZi5fc291bmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY2FjaGVbc2VsZi5fc3JjXSA9IGJ1ZmZlcjtcbiAgICAgICAgbG9hZFNvdW5kKHNlbGYsIGJ1ZmZlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvcigpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBEZWNvZGUgdGhlIGJ1ZmZlciBpbnRvIGFuIGF1ZGlvIHNvdXJjZS5cbiAgICBpZiAodHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnICYmIEhvd2xlci5jdHguZGVjb2RlQXVkaW9EYXRhLmxlbmd0aCA9PT0gMSkge1xuICAgICAgSG93bGVyLmN0eC5kZWNvZGVBdWRpb0RhdGEoYXJyYXlidWZmZXIpLnRoZW4oc3VjY2VzcykuY2F0Y2goZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBIb3dsZXIuY3R4LmRlY29kZUF1ZGlvRGF0YShhcnJheWJ1ZmZlciwgc3VjY2VzcywgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTb3VuZCBpcyBub3cgbG9hZGVkLCBzbyBmaW5pc2ggc2V0dGluZyBldmVyeXRoaW5nIHVwIGFuZCBmaXJlIHRoZSBsb2FkZWQgZXZlbnQuXG4gICAqIEBwYXJhbSAge0hvd2x9IHNlbGZcbiAgICogQHBhcmFtICB7T2JqZWN0fSBidWZmZXIgVGhlIGRlY29kZWQgYnVmZmVyIHNvdW5kIHNvdXJjZS5cbiAgICovXG4gIHZhciBsb2FkU291bmQgPSBmdW5jdGlvbihzZWxmLCBidWZmZXIpIHtcbiAgICAvLyBTZXQgdGhlIGR1cmF0aW9uLlxuICAgIGlmIChidWZmZXIgJiYgIXNlbGYuX2R1cmF0aW9uKSB7XG4gICAgICBzZWxmLl9kdXJhdGlvbiA9IGJ1ZmZlci5kdXJhdGlvbjtcbiAgICB9XG5cbiAgICAvLyBTZXR1cCBhIHNwcml0ZSBpZiBub25lIGlzIGRlZmluZWQuXG4gICAgaWYgKE9iamVjdC5rZXlzKHNlbGYuX3Nwcml0ZSkubGVuZ3RoID09PSAwKSB7XG4gICAgICBzZWxmLl9zcHJpdGUgPSB7X19kZWZhdWx0OiBbMCwgc2VsZi5fZHVyYXRpb24gKiAxMDAwXX07XG4gICAgfVxuXG4gICAgLy8gRmlyZSB0aGUgbG9hZGVkIGV2ZW50LlxuICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcpIHtcbiAgICAgIHNlbGYuX3N0YXRlID0gJ2xvYWRlZCc7XG4gICAgICBzZWxmLl9lbWl0KCdsb2FkJyk7XG4gICAgICBzZWxmLl9sb2FkUXVldWUoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFNldHVwIHRoZSBhdWRpbyBjb250ZXh0IHdoZW4gYXZhaWxhYmxlLCBvciBzd2l0Y2ggdG8gSFRNTDUgQXVkaW8gbW9kZS5cbiAgICovXG4gIHZhciBzZXR1cEF1ZGlvQ29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIElmIHdlIGhhdmUgYWxyZWFkeSBkZXRlY3RlZCB0aGF0IFdlYiBBdWRpbyBpc24ndCBzdXBwb3J0ZWQsIGRvbid0IHJ1biB0aGlzIHN0ZXAgYWdhaW4uXG4gICAgaWYgKCFIb3dsZXIudXNpbmdXZWJBdWRpbykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHdlIGFyZSB1c2luZyBXZWIgQXVkaW8gYW5kIHNldHVwIHRoZSBBdWRpb0NvbnRleHQgaWYgd2UgYXJlLlxuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIEF1ZGlvQ29udGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgSG93bGVyLmN0eCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHdlYmtpdEF1ZGlvQ29udGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgSG93bGVyLmN0eCA9IG5ldyB3ZWJraXRBdWRpb0NvbnRleHQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEhvd2xlci51c2luZ1dlYkF1ZGlvID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBIb3dsZXIudXNpbmdXZWJBdWRpbyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBhdWRpbyBjb250ZXh0IGNyZWF0aW9uIHN0aWxsIGZhaWxlZCwgc2V0IHVzaW5nIHdlYiBhdWRpbyB0byBmYWxzZS5cbiAgICBpZiAoIUhvd2xlci5jdHgpIHtcbiAgICAgIEhvd2xlci51c2luZ1dlYkF1ZGlvID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgYSB3ZWJ2aWV3IGlzIGJlaW5nIHVzZWQgb24gaU9TOCBvciBlYXJsaWVyIChyYXRoZXIgdGhhbiB0aGUgYnJvd3NlcikuXG4gICAgLy8gSWYgaXQgaXMsIGRpc2FibGUgV2ViIEF1ZGlvIGFzIGl0IGNhdXNlcyBjcmFzaGluZy5cbiAgICB2YXIgaU9TID0gKC9pUChob25lfG9kfGFkKS8udGVzdChIb3dsZXIuX25hdmlnYXRvciAmJiBIb3dsZXIuX25hdmlnYXRvci5wbGF0Zm9ybSkpO1xuICAgIHZhciBhcHBWZXJzaW9uID0gSG93bGVyLl9uYXZpZ2F0b3IgJiYgSG93bGVyLl9uYXZpZ2F0b3IuYXBwVmVyc2lvbi5tYXRjaCgvT1MgKFxcZCspXyhcXGQrKV8/KFxcZCspPy8pO1xuICAgIHZhciB2ZXJzaW9uID0gYXBwVmVyc2lvbiA/IHBhcnNlSW50KGFwcFZlcnNpb25bMV0sIDEwKSA6IG51bGw7XG4gICAgaWYgKGlPUyAmJiB2ZXJzaW9uICYmIHZlcnNpb24gPCA5KSB7XG4gICAgICB2YXIgc2FmYXJpID0gL3NhZmFyaS8udGVzdChIb3dsZXIuX25hdmlnYXRvciAmJiBIb3dsZXIuX25hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKSk7XG4gICAgICBpZiAoSG93bGVyLl9uYXZpZ2F0b3IgJiYgIXNhZmFyaSkge1xuICAgICAgICBIb3dsZXIudXNpbmdXZWJBdWRpbyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBhbmQgZXhwb3NlIHRoZSBtYXN0ZXIgR2Fpbk5vZGUgd2hlbiB1c2luZyBXZWIgQXVkaW8gKHVzZWZ1bCBmb3IgcGx1Z2lucyBvciBhZHZhbmNlZCB1c2FnZSkuXG4gICAgaWYgKEhvd2xlci51c2luZ1dlYkF1ZGlvKSB7XG4gICAgICBIb3dsZXIubWFzdGVyR2FpbiA9ICh0eXBlb2YgSG93bGVyLmN0eC5jcmVhdGVHYWluID09PSAndW5kZWZpbmVkJykgPyBIb3dsZXIuY3R4LmNyZWF0ZUdhaW5Ob2RlKCkgOiBIb3dsZXIuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgIEhvd2xlci5tYXN0ZXJHYWluLmdhaW4uc2V0VmFsdWVBdFRpbWUoSG93bGVyLl9tdXRlZCA/IDAgOiBIb3dsZXIuX3ZvbHVtZSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICBIb3dsZXIubWFzdGVyR2Fpbi5jb25uZWN0KEhvd2xlci5jdHguZGVzdGluYXRpb24pO1xuICAgIH1cblxuICAgIC8vIFJlLXJ1biB0aGUgc2V0dXAgb24gSG93bGVyLlxuICAgIEhvd2xlci5fc2V0dXAoKTtcbiAgfTtcblxuICAvLyBBZGQgc3VwcG9ydCBmb3IgQU1EIChBc3luY2hyb25vdXMgTW9kdWxlIERlZmluaXRpb24pIGxpYnJhcmllcyBzdWNoIGFzIHJlcXVpcmUuanMuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgSG93bGVyOiBIb3dsZXIsXG4gICAgICAgIEhvd2w6IEhvd2xcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvLyBBZGQgc3VwcG9ydCBmb3IgQ29tbW9uSlMgbGlicmFyaWVzIHN1Y2ggYXMgYnJvd3NlcmlmeS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGV4cG9ydHMuSG93bGVyID0gSG93bGVyO1xuICAgIGV4cG9ydHMuSG93bCA9IEhvd2w7XG4gIH1cblxuICAvLyBBZGQgdG8gZ2xvYmFsIGluIE5vZGUuanMgKGZvciB0ZXN0aW5nLCBldGMpLlxuICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBnbG9iYWwuSG93bGVyR2xvYmFsID0gSG93bGVyR2xvYmFsO1xuICAgIGdsb2JhbC5Ib3dsZXIgPSBIb3dsZXI7XG4gICAgZ2xvYmFsLkhvd2wgPSBIb3dsO1xuICAgIGdsb2JhbC5Tb3VuZCA9IFNvdW5kO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7ICAvLyBEZWZpbmUgZ2xvYmFsbHkgaW4gY2FzZSBBTUQgaXMgbm90IGF2YWlsYWJsZSBvciB1bnVzZWQuXG4gICAgd2luZG93Lkhvd2xlckdsb2JhbCA9IEhvd2xlckdsb2JhbDtcbiAgICB3aW5kb3cuSG93bGVyID0gSG93bGVyO1xuICAgIHdpbmRvdy5Ib3dsID0gSG93bDtcbiAgICB3aW5kb3cuU291bmQgPSBTb3VuZDtcbiAgfVxufSkoKTtcblxuXG4vKiFcbiAqICBTcGF0aWFsIFBsdWdpbiAtIEFkZHMgc3VwcG9ydCBmb3Igc3RlcmVvIGFuZCAzRCBhdWRpbyB3aGVyZSBXZWIgQXVkaW8gaXMgc3VwcG9ydGVkLlxuICogIFxuICogIGhvd2xlci5qcyB2Mi4yLjNcbiAqICBob3dsZXJqcy5jb21cbiAqXG4gKiAgKGMpIDIwMTMtMjAyMCwgSmFtZXMgU2ltcHNvbiBvZiBHb2xkRmlyZSBTdHVkaW9zXG4gKiAgZ29sZGZpcmVzdHVkaW9zLmNvbVxuICpcbiAqICBNSVQgTGljZW5zZVxuICovXG5cbihmdW5jdGlvbigpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gU2V0dXAgZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBIb3dsZXJHbG9iYWwucHJvdG90eXBlLl9wb3MgPSBbMCwgMCwgMF07XG4gIEhvd2xlckdsb2JhbC5wcm90b3R5cGUuX29yaWVudGF0aW9uID0gWzAsIDAsIC0xLCAwLCAxLCAwXTtcblxuICAvKiogR2xvYmFsIE1ldGhvZHMgKiovXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgdG8gdXBkYXRlIHRoZSBzdGVyZW8gcGFubmluZyBwb3NpdGlvbiBvZiBhbGwgY3VycmVudCBIb3dscy5cbiAgICogRnV0dXJlIEhvd2xzIHdpbGwgbm90IHVzZSB0aGlzIHZhbHVlIHVubGVzcyBleHBsaWNpdGx5IHNldC5cbiAgICogQHBhcmFtICB7TnVtYmVyfSBwYW4gQSB2YWx1ZSBvZiAtMS4wIGlzIGFsbCB0aGUgd2F5IGxlZnQgYW5kIDEuMCBpcyBhbGwgdGhlIHdheSByaWdodC5cbiAgICogQHJldHVybiB7SG93bGVyL051bWJlcn0gICAgIFNlbGYgb3IgY3VycmVudCBzdGVyZW8gcGFubmluZyB2YWx1ZS5cbiAgICovXG4gIEhvd2xlckdsb2JhbC5wcm90b3R5cGUuc3RlcmVvID0gZnVuY3Rpb24ocGFuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gU3RvcCByaWdodCBoZXJlIGlmIG5vdCB1c2luZyBXZWIgQXVkaW8uXG4gICAgaWYgKCFzZWxmLmN0eCB8fCAhc2VsZi5jdHgubGlzdGVuZXIpIHtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIExvb3AgdGhyb3VnaCBhbGwgSG93bHMgYW5kIHVwZGF0ZSB0aGVpciBzdGVyZW8gcGFubmluZy5cbiAgICBmb3IgKHZhciBpPXNlbGYuX2hvd2xzLmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcbiAgICAgIHNlbGYuX2hvd2xzW2ldLnN0ZXJlbyhwYW4pO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQvc2V0IHRoZSBwb3NpdGlvbiBvZiB0aGUgbGlzdGVuZXIgaW4gM0QgY2FydGVzaWFuIHNwYWNlLiBTb3VuZHMgdXNpbmdcbiAgICogM0QgcG9zaXRpb24gd2lsbCBiZSByZWxhdGl2ZSB0byB0aGUgbGlzdGVuZXIncyBwb3NpdGlvbi5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB4IFRoZSB4LXBvc2l0aW9uIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB5IFRoZSB5LXBvc2l0aW9uIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB6IFRoZSB6LXBvc2l0aW9uIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHJldHVybiB7SG93bGVyL0FycmF5fSAgIFNlbGYgb3IgY3VycmVudCBsaXN0ZW5lciBwb3NpdGlvbi5cbiAgICovXG4gIEhvd2xlckdsb2JhbC5wcm90b3R5cGUucG9zID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFN0b3AgcmlnaHQgaGVyZSBpZiBub3QgdXNpbmcgV2ViIEF1ZGlvLlxuICAgIGlmICghc2VsZi5jdHggfHwgIXNlbGYuY3R4Lmxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGRlZmF1bHRzIGZvciBvcHRpb25hbCAneScgJiAneicuXG4gICAgeSA9ICh0eXBlb2YgeSAhPT0gJ251bWJlcicpID8gc2VsZi5fcG9zWzFdIDogeTtcbiAgICB6ID0gKHR5cGVvZiB6ICE9PSAnbnVtYmVyJykgPyBzZWxmLl9wb3NbMl0gOiB6O1xuXG4gICAgaWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykge1xuICAgICAgc2VsZi5fcG9zID0gW3gsIHksIHpdO1xuXG4gICAgICBpZiAodHlwZW9mIHNlbGYuY3R4Lmxpc3RlbmVyLnBvc2l0aW9uWCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIucG9zaXRpb25YLnNldFRhcmdldEF0VGltZShzZWxmLl9wb3NbMF0sIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLnBvc2l0aW9uWS5zZXRUYXJnZXRBdFRpbWUoc2VsZi5fcG9zWzFdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci5wb3NpdGlvblouc2V0VGFyZ2V0QXRUaW1lKHNlbGYuX3Bvc1syXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLnNldFBvc2l0aW9uKHNlbGYuX3Bvc1swXSwgc2VsZi5fcG9zWzFdLCBzZWxmLl9wb3NbMl0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2VsZi5fcG9zO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQvc2V0IHRoZSBkaXJlY3Rpb24gdGhlIGxpc3RlbmVyIGlzIHBvaW50aW5nIGluIHRoZSAzRCBjYXJ0ZXNpYW4gc3BhY2UuXG4gICAqIEEgZnJvbnQgYW5kIHVwIHZlY3RvciBtdXN0IGJlIHByb3ZpZGVkLiBUaGUgZnJvbnQgaXMgdGhlIGRpcmVjdGlvbiB0aGVcbiAgICogZmFjZSBvZiB0aGUgbGlzdGVuZXIgaXMgcG9pbnRpbmcsIGFuZCB1cCBpcyB0aGUgZGlyZWN0aW9uIHRoZSB0b3Agb2YgdGhlXG4gICAqIGxpc3RlbmVyIGlzIHBvaW50aW5nLiBUaHVzLCB0aGVzZSB2YWx1ZXMgYXJlIGV4cGVjdGVkIHRvIGJlIGF0IHJpZ2h0IGFuZ2xlc1xuICAgKiBmcm9tIGVhY2ggb3RoZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0geCAgIFRoZSB4LW9yaWVudGF0aW9uIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB5ICAgVGhlIHktb3JpZW50YXRpb24gb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHogICBUaGUgei1vcmllbnRhdGlvbiBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEBwYXJhbSAge051bWJlcn0geFVwIFRoZSB4LW9yaWVudGF0aW9uIG9mIHRoZSB0b3Agb2YgdGhlIGxpc3RlbmVyLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHlVcCBUaGUgeS1vcmllbnRhdGlvbiBvZiB0aGUgdG9wIG9mIHRoZSBsaXN0ZW5lci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB6VXAgVGhlIHotb3JpZW50YXRpb24gb2YgdGhlIHRvcCBvZiB0aGUgbGlzdGVuZXIuXG4gICAqIEByZXR1cm4ge0hvd2xlci9BcnJheX0gICAgIFJldHVybnMgc2VsZiBvciB0aGUgY3VycmVudCBvcmllbnRhdGlvbiB2ZWN0b3JzLlxuICAgKi9cbiAgSG93bGVyR2xvYmFsLnByb3RvdHlwZS5vcmllbnRhdGlvbiA9IGZ1bmN0aW9uKHgsIHksIHosIHhVcCwgeVVwLCB6VXApIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBTdG9wIHJpZ2h0IGhlcmUgaWYgbm90IHVzaW5nIFdlYiBBdWRpby5cbiAgICBpZiAoIXNlbGYuY3R4IHx8ICFzZWxmLmN0eC5saXN0ZW5lcikge1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBkZWZhdWx0cyBmb3Igb3B0aW9uYWwgJ3knICYgJ3onLlxuICAgIHZhciBvciA9IHNlbGYuX29yaWVudGF0aW9uO1xuICAgIHkgPSAodHlwZW9mIHkgIT09ICdudW1iZXInKSA/IG9yWzFdIDogeTtcbiAgICB6ID0gKHR5cGVvZiB6ICE9PSAnbnVtYmVyJykgPyBvclsyXSA6IHo7XG4gICAgeFVwID0gKHR5cGVvZiB4VXAgIT09ICdudW1iZXInKSA/IG9yWzNdIDogeFVwO1xuICAgIHlVcCA9ICh0eXBlb2YgeVVwICE9PSAnbnVtYmVyJykgPyBvcls0XSA6IHlVcDtcbiAgICB6VXAgPSAodHlwZW9mIHpVcCAhPT0gJ251bWJlcicpID8gb3JbNV0gOiB6VXA7XG5cbiAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSB7XG4gICAgICBzZWxmLl9vcmllbnRhdGlvbiA9IFt4LCB5LCB6LCB4VXAsIHlVcCwgelVwXTtcblxuICAgICAgaWYgKHR5cGVvZiBzZWxmLmN0eC5saXN0ZW5lci5mb3J3YXJkWCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIuZm9yd2FyZFguc2V0VGFyZ2V0QXRUaW1lKHgsIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLmZvcndhcmRZLnNldFRhcmdldEF0VGltZSh5LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci5mb3J3YXJkWi5zZXRUYXJnZXRBdFRpbWUoeiwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgICAgc2VsZi5jdHgubGlzdGVuZXIudXBYLnNldFRhcmdldEF0VGltZSh4VXAsIEhvd2xlci5jdHguY3VycmVudFRpbWUsIDAuMSk7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLnVwWS5zZXRUYXJnZXRBdFRpbWUoeVVwLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lLCAwLjEpO1xuICAgICAgICBzZWxmLmN0eC5saXN0ZW5lci51cFouc2V0VGFyZ2V0QXRUaW1lKHpVcCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSwgMC4xKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYuY3R4Lmxpc3RlbmVyLnNldE9yaWVudGF0aW9uKHgsIHksIHosIHhVcCwgeVVwLCB6VXApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gb3I7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLyoqIEdyb3VwIE1ldGhvZHMgKiovXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIEFkZCBuZXcgcHJvcGVydGllcyB0byB0aGUgY29yZSBpbml0LlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gX3N1cGVyIENvcmUgaW5pdCBtZXRob2QuXG4gICAqIEByZXR1cm4ge0hvd2x9XG4gICAqL1xuICBIb3dsLnByb3RvdHlwZS5pbml0ID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIHJldHVybiBmdW5jdGlvbihvKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIC8vIFNldHVwIHVzZXItZGVmaW5lZCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gICAgICBzZWxmLl9vcmllbnRhdGlvbiA9IG8ub3JpZW50YXRpb24gfHwgWzEsIDAsIDBdO1xuICAgICAgc2VsZi5fc3RlcmVvID0gby5zdGVyZW8gfHwgbnVsbDtcbiAgICAgIHNlbGYuX3BvcyA9IG8ucG9zIHx8IG51bGw7XG4gICAgICBzZWxmLl9wYW5uZXJBdHRyID0ge1xuICAgICAgICBjb25lSW5uZXJBbmdsZTogdHlwZW9mIG8uY29uZUlubmVyQW5nbGUgIT09ICd1bmRlZmluZWQnID8gby5jb25lSW5uZXJBbmdsZSA6IDM2MCxcbiAgICAgICAgY29uZU91dGVyQW5nbGU6IHR5cGVvZiBvLmNvbmVPdXRlckFuZ2xlICE9PSAndW5kZWZpbmVkJyA/IG8uY29uZU91dGVyQW5nbGUgOiAzNjAsXG4gICAgICAgIGNvbmVPdXRlckdhaW46IHR5cGVvZiBvLmNvbmVPdXRlckdhaW4gIT09ICd1bmRlZmluZWQnID8gby5jb25lT3V0ZXJHYWluIDogMCxcbiAgICAgICAgZGlzdGFuY2VNb2RlbDogdHlwZW9mIG8uZGlzdGFuY2VNb2RlbCAhPT0gJ3VuZGVmaW5lZCcgPyBvLmRpc3RhbmNlTW9kZWwgOiAnaW52ZXJzZScsXG4gICAgICAgIG1heERpc3RhbmNlOiB0eXBlb2Ygby5tYXhEaXN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLm1heERpc3RhbmNlIDogMTAwMDAsXG4gICAgICAgIHBhbm5pbmdNb2RlbDogdHlwZW9mIG8ucGFubmluZ01vZGVsICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmluZ01vZGVsIDogJ0hSVEYnLFxuICAgICAgICByZWZEaXN0YW5jZTogdHlwZW9mIG8ucmVmRGlzdGFuY2UgIT09ICd1bmRlZmluZWQnID8gby5yZWZEaXN0YW5jZSA6IDEsXG4gICAgICAgIHJvbGxvZmZGYWN0b3I6IHR5cGVvZiBvLnJvbGxvZmZGYWN0b3IgIT09ICd1bmRlZmluZWQnID8gby5yb2xsb2ZmRmFjdG9yIDogMVxuICAgICAgfTtcblxuICAgICAgLy8gU2V0dXAgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgc2VsZi5fb25zdGVyZW8gPSBvLm9uc3RlcmVvID8gW3tmbjogby5vbnN0ZXJlb31dIDogW107XG4gICAgICBzZWxmLl9vbnBvcyA9IG8ub25wb3MgPyBbe2ZuOiBvLm9ucG9zfV0gOiBbXTtcbiAgICAgIHNlbGYuX29ub3JpZW50YXRpb24gPSBvLm9ub3JpZW50YXRpb24gPyBbe2ZuOiBvLm9ub3JpZW50YXRpb259XSA6IFtdO1xuXG4gICAgICAvLyBDb21wbGV0ZSBpbml0aWxpemF0aW9uIHdpdGggaG93bGVyLmpzIGNvcmUncyBpbml0IGZ1bmN0aW9uLlxuICAgICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIG8pO1xuICAgIH07XG4gIH0pKEhvd2wucHJvdG90eXBlLmluaXQpO1xuXG4gIC8qKlxuICAgKiBHZXQvc2V0IHRoZSBzdGVyZW8gcGFubmluZyBvZiB0aGUgYXVkaW8gc291cmNlIGZvciB0aGlzIHNvdW5kIG9yIGFsbCBpbiB0aGUgZ3JvdXAuXG4gICAqIEBwYXJhbSAge051bWJlcn0gcGFuICBBIHZhbHVlIG9mIC0xLjAgaXMgYWxsIHRoZSB3YXkgbGVmdCBhbmQgMS4wIGlzIGFsbCB0aGUgd2F5IHJpZ2h0LlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkIChvcHRpb25hbCkgVGhlIHNvdW5kIElELiBJZiBub25lIGlzIHBhc3NlZCwgYWxsIGluIGdyb3VwIHdpbGwgYmUgdXBkYXRlZC5cbiAgICogQHJldHVybiB7SG93bC9OdW1iZXJ9ICAgIFJldHVybnMgc2VsZiBvciB0aGUgY3VycmVudCBzdGVyZW8gcGFubmluZyB2YWx1ZS5cbiAgICovXG4gIEhvd2wucHJvdG90eXBlLnN0ZXJlbyA9IGZ1bmN0aW9uKHBhbiwgaWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBTdG9wIHJpZ2h0IGhlcmUgaWYgbm90IHVzaW5nIFdlYiBBdWRpby5cbiAgICBpZiAoIXNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgc291bmQgaGFzbid0IGxvYWRlZCwgYWRkIGl0IHRvIHRoZSBsb2FkIHF1ZXVlIHRvIGNoYW5nZSBzdGVyZW8gcGFuIHdoZW4gY2FwYWJsZS5cbiAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnKSB7XG4gICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgZXZlbnQ6ICdzdGVyZW8nLFxuICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlbGYuc3RlcmVvKHBhbiwgaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIFBhbm5lclN0ZXJlb05vZGUgc3VwcG9ydCBhbmQgZmFsbGJhY2sgdG8gUGFubmVyTm9kZSBpZiBpdCBkb2Vzbid0IGV4aXN0LlxuICAgIHZhciBwYW5uZXJUeXBlID0gKHR5cGVvZiBIb3dsZXIuY3R4LmNyZWF0ZVN0ZXJlb1Bhbm5lciA9PT0gJ3VuZGVmaW5lZCcpID8gJ3NwYXRpYWwnIDogJ3N0ZXJlbyc7XG5cbiAgICAvLyBTZXR1cCB0aGUgZ3JvdXAncyBzdGVyZW8gcGFubmluZyBpZiBubyBJRCBpcyBwYXNzZWQuXG4gICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIFJldHVybiB0aGUgZ3JvdXAncyBzdGVyZW8gcGFubmluZyBpZiBubyBwYXJhbWV0ZXJzIGFyZSBwYXNzZWQuXG4gICAgICBpZiAodHlwZW9mIHBhbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc2VsZi5fc3RlcmVvID0gcGFuO1xuICAgICAgICBzZWxmLl9wb3MgPSBbcGFuLCAwLCAwXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzZWxmLl9zdGVyZW87XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hhbmdlIHRoZSBzdHJlbyBwYW5uaW5nIG9mIG9uZSBvciBhbGwgc291bmRzIGluIGdyb3VwLlxuICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG4gICAgZm9yICh2YXIgaT0wOyBpPGlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gR2V0IHRoZSBzb3VuZC5cbiAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwYW4gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgc291bmQuX3N0ZXJlbyA9IHBhbjtcbiAgICAgICAgICBzb3VuZC5fcG9zID0gW3BhbiwgMCwgMF07XG5cbiAgICAgICAgICBpZiAoc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgIC8vIElmIHdlIGFyZSBmYWxsaW5nIGJhY2ssIG1ha2Ugc3VyZSB0aGUgcGFubmluZ01vZGVsIGlzIGVxdWFscG93ZXIuXG4gICAgICAgICAgICBzb3VuZC5fcGFubmVyQXR0ci5wYW5uaW5nTW9kZWwgPSAnZXF1YWxwb3dlcic7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGEgcGFubmVyIHNldHVwIGFuZCBjcmVhdGUgYSBuZXcgb25lIGlmIG5vdC5cbiAgICAgICAgICAgIGlmICghc291bmQuX3Bhbm5lciB8fCAhc291bmQuX3Bhbm5lci5wYW4pIHtcbiAgICAgICAgICAgICAgc2V0dXBQYW5uZXIoc291bmQsIHBhbm5lclR5cGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocGFubmVyVHlwZSA9PT0gJ3NwYXRpYWwnKSB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2Ygc291bmQuX3Bhbm5lci5wb3NpdGlvblggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblguc2V0VmFsdWVBdFRpbWUocGFuLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWS5zZXRWYWx1ZUF0VGltZSgwLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWi5zZXRWYWx1ZUF0VGltZSgwLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnNldFBvc2l0aW9uKHBhbiwgMCwgMCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIucGFuLnNldFZhbHVlQXRUaW1lKHBhbiwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5fZW1pdCgnc3RlcmVvJywgc291bmQuX2lkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc291bmQuX3N0ZXJlbztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQvc2V0IHRoZSAzRCBzcGF0aWFsIHBvc2l0aW9uIG9mIHRoZSBhdWRpbyBzb3VyY2UgZm9yIHRoaXMgc291bmQgb3IgZ3JvdXAgcmVsYXRpdmUgdG8gdGhlIGdsb2JhbCBsaXN0ZW5lci5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB4ICBUaGUgeC1wb3NpdGlvbiBvZiB0aGUgYXVkaW8gc291cmNlLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHkgIFRoZSB5LXBvc2l0aW9uIG9mIHRoZSBhdWRpbyBzb3VyY2UuXG4gICAqIEBwYXJhbSAge051bWJlcn0geiAgVGhlIHotcG9zaXRpb24gb2YgdGhlIGF1ZGlvIHNvdXJjZS5cbiAgICogQHBhcmFtICB7TnVtYmVyfSBpZCAob3B0aW9uYWwpIFRoZSBzb3VuZCBJRC4gSWYgbm9uZSBpcyBwYXNzZWQsIGFsbCBpbiBncm91cCB3aWxsIGJlIHVwZGF0ZWQuXG4gICAqIEByZXR1cm4ge0hvd2wvQXJyYXl9ICAgIFJldHVybnMgc2VsZiBvciB0aGUgY3VycmVudCAzRCBzcGF0aWFsIHBvc2l0aW9uOiBbeCwgeSwgel0uXG4gICAqL1xuICBIb3dsLnByb3RvdHlwZS5wb3MgPSBmdW5jdGlvbih4LCB5LCB6LCBpZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIFN0b3AgcmlnaHQgaGVyZSBpZiBub3QgdXNpbmcgV2ViIEF1ZGlvLlxuICAgIGlmICghc2VsZi5fd2ViQXVkaW8pIHtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBzb3VuZCBoYXNuJ3QgbG9hZGVkLCBhZGQgaXQgdG8gdGhlIGxvYWQgcXVldWUgdG8gY2hhbmdlIHBvc2l0aW9uIHdoZW4gY2FwYWJsZS5cbiAgICBpZiAoc2VsZi5fc3RhdGUgIT09ICdsb2FkZWQnKSB7XG4gICAgICBzZWxmLl9xdWV1ZS5wdXNoKHtcbiAgICAgICAgZXZlbnQ6ICdwb3MnLFxuICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlbGYucG9zKHgsIHksIHosIGlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgZGVmYXVsdHMgZm9yIG9wdGlvbmFsICd5JyAmICd6Jy5cbiAgICB5ID0gKHR5cGVvZiB5ICE9PSAnbnVtYmVyJykgPyAwIDogeTtcbiAgICB6ID0gKHR5cGVvZiB6ICE9PSAnbnVtYmVyJykgPyAtMC41IDogejtcblxuICAgIC8vIFNldHVwIHRoZSBncm91cCdzIHNwYXRpYWwgcG9zaXRpb24gaWYgbm8gSUQgaXMgcGFzc2VkLlxuICAgIGlmICh0eXBlb2YgaWQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBSZXR1cm4gdGhlIGdyb3VwJ3Mgc3BhdGlhbCBwb3NpdGlvbiBpZiBubyBwYXJhbWV0ZXJzIGFyZSBwYXNzZWQuXG4gICAgICBpZiAodHlwZW9mIHggPT09ICdudW1iZXInKSB7XG4gICAgICAgIHNlbGYuX3BvcyA9IFt4LCB5LCB6XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzZWxmLl9wb3M7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hhbmdlIHRoZSBzcGF0aWFsIHBvc2l0aW9uIG9mIG9uZSBvciBhbGwgc291bmRzIGluIGdyb3VwLlxuICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG4gICAgZm9yICh2YXIgaT0wOyBpPGlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gR2V0IHRoZSBzb3VuZC5cbiAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHNvdW5kLl9wb3MgPSBbeCwgeSwgel07XG5cbiAgICAgICAgICBpZiAoc291bmQuX25vZGUpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGEgcGFubmVyIHNldHVwIGFuZCBjcmVhdGUgYSBuZXcgb25lIGlmIG5vdC5cbiAgICAgICAgICAgIGlmICghc291bmQuX3Bhbm5lciB8fCBzb3VuZC5fcGFubmVyLnBhbikge1xuICAgICAgICAgICAgICBzZXR1cFBhbm5lcihzb3VuZCwgJ3NwYXRpYWwnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblguc2V0VmFsdWVBdFRpbWUoeCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25ZLnNldFZhbHVlQXRUaW1lKHksIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWi5zZXRWYWx1ZUF0VGltZSh6LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIuc2V0UG9zaXRpb24oeCwgeSwgeik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5fZW1pdCgncG9zJywgc291bmQuX2lkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gc291bmQuX3BvcztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzZWxmO1xuICB9O1xuXG4gIC8qKlxuICAgKiBHZXQvc2V0IHRoZSBkaXJlY3Rpb24gdGhlIGF1ZGlvIHNvdXJjZSBpcyBwb2ludGluZyBpbiB0aGUgM0QgY2FydGVzaWFuIGNvb3JkaW5hdGVcbiAgICogc3BhY2UuIERlcGVuZGluZyBvbiBob3cgZGlyZWN0aW9uIHRoZSBzb3VuZCBpcywgYmFzZWQgb24gdGhlIGBjb25lYCBhdHRyaWJ1dGVzLFxuICAgKiBhIHNvdW5kIHBvaW50aW5nIGF3YXkgZnJvbSB0aGUgbGlzdGVuZXIgY2FuIGJlIHF1aWV0IG9yIHNpbGVudC5cbiAgICogQHBhcmFtICB7TnVtYmVyfSB4ICBUaGUgeC1vcmllbnRhdGlvbiBvZiB0aGUgc291cmNlLlxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHkgIFRoZSB5LW9yaWVudGF0aW9uIG9mIHRoZSBzb3VyY2UuXG4gICAqIEBwYXJhbSAge051bWJlcn0geiAgVGhlIHotb3JpZW50YXRpb24gb2YgdGhlIHNvdXJjZS5cbiAgICogQHBhcmFtICB7TnVtYmVyfSBpZCAob3B0aW9uYWwpIFRoZSBzb3VuZCBJRC4gSWYgbm9uZSBpcyBwYXNzZWQsIGFsbCBpbiBncm91cCB3aWxsIGJlIHVwZGF0ZWQuXG4gICAqIEByZXR1cm4ge0hvd2wvQXJyYXl9ICAgIFJldHVybnMgc2VsZiBvciB0aGUgY3VycmVudCAzRCBzcGF0aWFsIG9yaWVudGF0aW9uOiBbeCwgeSwgel0uXG4gICAqL1xuICBIb3dsLnByb3RvdHlwZS5vcmllbnRhdGlvbiA9IGZ1bmN0aW9uKHgsIHksIHosIGlkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gU3RvcCByaWdodCBoZXJlIGlmIG5vdCB1c2luZyBXZWIgQXVkaW8uXG4gICAgaWYgKCFzZWxmLl93ZWJBdWRpbykge1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHNvdW5kIGhhc24ndCBsb2FkZWQsIGFkZCBpdCB0byB0aGUgbG9hZCBxdWV1ZSB0byBjaGFuZ2Ugb3JpZW50YXRpb24gd2hlbiBjYXBhYmxlLlxuICAgIGlmIChzZWxmLl9zdGF0ZSAhPT0gJ2xvYWRlZCcpIHtcbiAgICAgIHNlbGYuX3F1ZXVlLnB1c2goe1xuICAgICAgICBldmVudDogJ29yaWVudGF0aW9uJyxcbiAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZWxmLm9yaWVudGF0aW9uKHgsIHksIHosIGlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgZGVmYXVsdHMgZm9yIG9wdGlvbmFsICd5JyAmICd6Jy5cbiAgICB5ID0gKHR5cGVvZiB5ICE9PSAnbnVtYmVyJykgPyBzZWxmLl9vcmllbnRhdGlvblsxXSA6IHk7XG4gICAgeiA9ICh0eXBlb2YgeiAhPT0gJ251bWJlcicpID8gc2VsZi5fb3JpZW50YXRpb25bMl0gOiB6O1xuXG4gICAgLy8gU2V0dXAgdGhlIGdyb3VwJ3Mgc3BhdGlhbCBvcmllbnRhdGlvbiBpZiBubyBJRCBpcyBwYXNzZWQuXG4gICAgaWYgKHR5cGVvZiBpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIFJldHVybiB0aGUgZ3JvdXAncyBzcGF0aWFsIG9yaWVudGF0aW9uIGlmIG5vIHBhcmFtZXRlcnMgYXJlIHBhc3NlZC5cbiAgICAgIGlmICh0eXBlb2YgeCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgc2VsZi5fb3JpZW50YXRpb24gPSBbeCwgeSwgel07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2VsZi5fb3JpZW50YXRpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hhbmdlIHRoZSBzcGF0aWFsIG9yaWVudGF0aW9uIG9mIG9uZSBvciBhbGwgc291bmRzIGluIGdyb3VwLlxuICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG4gICAgZm9yICh2YXIgaT0wOyBpPGlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gR2V0IHRoZSBzb3VuZC5cbiAgICAgIHZhciBzb3VuZCA9IHNlbGYuX3NvdW5kQnlJZChpZHNbaV0pO1xuXG4gICAgICBpZiAoc291bmQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB4ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIHNvdW5kLl9vcmllbnRhdGlvbiA9IFt4LCB5LCB6XTtcblxuICAgICAgICAgIGlmIChzb3VuZC5fbm9kZSkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYSBwYW5uZXIgc2V0dXAgYW5kIGNyZWF0ZSBhIG5ldyBvbmUgaWYgbm90LlxuICAgICAgICAgICAgaWYgKCFzb3VuZC5fcGFubmVyKSB7XG4gICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIGEgcG9zaXRpb24gdG8gc2V0dXAgdGhlIG5vZGUgd2l0aC5cbiAgICAgICAgICAgICAgaWYgKCFzb3VuZC5fcG9zKSB7XG4gICAgICAgICAgICAgICAgc291bmQuX3BvcyA9IHNlbGYuX3BvcyB8fCBbMCwgMCwgLTAuNV07XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBzZXR1cFBhbm5lcihzb3VuZCwgJ3NwYXRpYWwnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzb3VuZC5fcGFubmVyLm9yaWVudGF0aW9uWCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgc291bmQuX3Bhbm5lci5vcmllbnRhdGlvblguc2V0VmFsdWVBdFRpbWUoeCwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIub3JpZW50YXRpb25ZLnNldFZhbHVlQXRUaW1lKHksIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICAgICAgICBzb3VuZC5fcGFubmVyLm9yaWVudGF0aW9uWi5zZXRWYWx1ZUF0VGltZSh6LCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNvdW5kLl9wYW5uZXIuc2V0T3JpZW50YXRpb24oeCwgeSwgeik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5fZW1pdCgnb3JpZW50YXRpb24nLCBzb3VuZC5faWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBzb3VuZC5fb3JpZW50YXRpb247XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvKipcbiAgICogR2V0L3NldCB0aGUgcGFubmVyIG5vZGUncyBhdHRyaWJ1dGVzIGZvciBhIHNvdW5kIG9yIGdyb3VwIG9mIHNvdW5kcy5cbiAgICogVGhpcyBtZXRob2QgY2FuIG9wdGlvbmFsbCB0YWtlIDAsIDEgb3IgMiBhcmd1bWVudHMuXG4gICAqICAgcGFubmVyQXR0cigpIC0+IFJldHVybnMgdGhlIGdyb3VwJ3MgdmFsdWVzLlxuICAgKiAgIHBhbm5lckF0dHIoaWQpIC0+IFJldHVybnMgdGhlIHNvdW5kIGlkJ3MgdmFsdWVzLlxuICAgKiAgIHBhbm5lckF0dHIobykgLT4gU2V0J3MgdGhlIHZhbHVlcyBvZiBhbGwgc291bmRzIGluIHRoaXMgSG93bCBncm91cC5cbiAgICogICBwYW5uZXJBdHRyKG8sIGlkKSAtPiBTZXQncyB0aGUgdmFsdWVzIG9mIHBhc3NlZCBzb3VuZCBpZC5cbiAgICpcbiAgICogICBBdHRyaWJ1dGVzOlxuICAgKiAgICAgY29uZUlubmVyQW5nbGUgLSAoMzYwIGJ5IGRlZmF1bHQpIEEgcGFyYW1ldGVyIGZvciBkaXJlY3Rpb25hbCBhdWRpbyBzb3VyY2VzLCB0aGlzIGlzIGFuIGFuZ2xlLCBpbiBkZWdyZWVzLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICBpbnNpZGUgb2Ygd2hpY2ggdGhlcmUgd2lsbCBiZSBubyB2b2x1bWUgcmVkdWN0aW9uLlxuICAgKiAgICAgY29uZU91dGVyQW5nbGUgLSAoMzYwIGJ5IGRlZmF1bHQpIEEgcGFyYW1ldGVyIGZvciBkaXJlY3Rpb25hbCBhdWRpbyBzb3VyY2VzLCB0aGlzIGlzIGFuIGFuZ2xlLCBpbiBkZWdyZWVzLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICBvdXRzaWRlIG9mIHdoaWNoIHRoZSB2b2x1bWUgd2lsbCBiZSByZWR1Y2VkIHRvIGEgY29uc3RhbnQgdmFsdWUgb2YgYGNvbmVPdXRlckdhaW5gLlxuICAgKiAgICAgY29uZU91dGVyR2FpbiAtICgwIGJ5IGRlZmF1bHQpIEEgcGFyYW1ldGVyIGZvciBkaXJlY3Rpb25hbCBhdWRpbyBzb3VyY2VzLCB0aGlzIGlzIHRoZSBnYWluIG91dHNpZGUgb2YgdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgYGNvbmVPdXRlckFuZ2xlYC4gSXQgaXMgYSBsaW5lYXIgdmFsdWUgaW4gdGhlIHJhbmdlIGBbMCwgMV1gLlxuICAgKiAgICAgZGlzdGFuY2VNb2RlbCAtICgnaW52ZXJzZScgYnkgZGVmYXVsdCkgRGV0ZXJtaW5lcyBhbGdvcml0aG0gdXNlZCB0byByZWR1Y2Ugdm9sdW1lIGFzIGF1ZGlvIG1vdmVzIGF3YXkgZnJvbVxuICAgKiAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLiBDYW4gYmUgYGxpbmVhcmAsIGBpbnZlcnNlYCBvciBgZXhwb25lbnRpYWwuXG4gICAqICAgICBtYXhEaXN0YW5jZSAtICgxMDAwMCBieSBkZWZhdWx0KSBUaGUgbWF4aW11bSBkaXN0YW5jZSBiZXR3ZWVuIHNvdXJjZSBhbmQgbGlzdGVuZXIsIGFmdGVyIHdoaWNoIHRoZSB2b2x1bWVcbiAgICogICAgICAgICAgICAgICAgICAgd2lsbCBub3QgYmUgcmVkdWNlZCBhbnkgZnVydGhlci5cbiAgICogICAgIHJlZkRpc3RhbmNlIC0gKDEgYnkgZGVmYXVsdCkgQSByZWZlcmVuY2UgZGlzdGFuY2UgZm9yIHJlZHVjaW5nIHZvbHVtZSBhcyBzb3VyY2UgbW92ZXMgZnVydGhlciBmcm9tIHRoZSBsaXN0ZW5lci5cbiAgICogICAgICAgICAgICAgICAgICAgVGhpcyBpcyBzaW1wbHkgYSB2YXJpYWJsZSBvZiB0aGUgZGlzdGFuY2UgbW9kZWwgYW5kIGhhcyBhIGRpZmZlcmVudCBlZmZlY3QgZGVwZW5kaW5nIG9uIHdoaWNoIG1vZGVsXG4gICAqICAgICAgICAgICAgICAgICAgIGlzIHVzZWQgYW5kIHRoZSBzY2FsZSBvZiB5b3VyIGNvb3JkaW5hdGVzLiBHZW5lcmFsbHksIHZvbHVtZSB3aWxsIGJlIGVxdWFsIHRvIDEgYXQgdGhpcyBkaXN0YW5jZS5cbiAgICogICAgIHJvbGxvZmZGYWN0b3IgLSAoMSBieSBkZWZhdWx0KSBIb3cgcXVpY2tseSB0aGUgdm9sdW1lIHJlZHVjZXMgYXMgc291cmNlIG1vdmVzIGZyb20gbGlzdGVuZXIuIFRoaXMgaXMgc2ltcGx5IGFcbiAgICogICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZSBvZiB0aGUgZGlzdGFuY2UgbW9kZWwgYW5kIGNhbiBiZSBpbiB0aGUgcmFuZ2Ugb2YgYFswLCAxXWAgd2l0aCBgbGluZWFyYCBhbmQgYFswLCDiiJ5dYFxuICAgKiAgICAgICAgICAgICAgICAgICAgIHdpdGggYGludmVyc2VgIGFuZCBgZXhwb25lbnRpYWxgLlxuICAgKiAgICAgcGFubmluZ01vZGVsIC0gKCdIUlRGJyBieSBkZWZhdWx0KSBEZXRlcm1pbmVzIHdoaWNoIHNwYXRpYWxpemF0aW9uIGFsZ29yaXRobSBpcyB1c2VkIHRvIHBvc2l0aW9uIGF1ZGlvLlxuICAgKiAgICAgICAgICAgICAgICAgICAgIENhbiBiZSBgSFJURmAgb3IgYGVxdWFscG93ZXJgLlxuICAgKlxuICAgKiBAcmV0dXJuIHtIb3dsL09iamVjdH0gUmV0dXJucyBzZWxmIG9yIGN1cnJlbnQgcGFubmVyIGF0dHJpYnV0ZXMuXG4gICAqL1xuICBIb3dsLnByb3RvdHlwZS5wYW5uZXJBdHRyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgIHZhciBvLCBpZCwgc291bmQ7XG5cbiAgICAvLyBTdG9wIHJpZ2h0IGhlcmUgaWYgbm90IHVzaW5nIFdlYiBBdWRpby5cbiAgICBpZiAoIXNlbGYuX3dlYkF1ZGlvKSB7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmUgdGhlIHZhbHVlcyBiYXNlZCBvbiBhcmd1bWVudHMuXG4gICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBSZXR1cm4gdGhlIGdyb3VwJ3MgcGFubmVyIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICByZXR1cm4gc2VsZi5fcGFubmVyQXR0cjtcbiAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgIG8gPSBhcmdzWzBdO1xuXG4gICAgICAgIC8vIFNldCB0aGUgZ3JvdSdzIHBhbm5lciBhdHRyaWJ1dGUgdmFsdWVzLlxuICAgICAgICBpZiAodHlwZW9mIGlkID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGlmICghby5wYW5uZXJBdHRyKSB7XG4gICAgICAgICAgICBvLnBhbm5lckF0dHIgPSB7XG4gICAgICAgICAgICAgIGNvbmVJbm5lckFuZ2xlOiBvLmNvbmVJbm5lckFuZ2xlLFxuICAgICAgICAgICAgICBjb25lT3V0ZXJBbmdsZTogby5jb25lT3V0ZXJBbmdsZSxcbiAgICAgICAgICAgICAgY29uZU91dGVyR2Fpbjogby5jb25lT3V0ZXJHYWluLFxuICAgICAgICAgICAgICBkaXN0YW5jZU1vZGVsOiBvLmRpc3RhbmNlTW9kZWwsXG4gICAgICAgICAgICAgIG1heERpc3RhbmNlOiBvLm1heERpc3RhbmNlLFxuICAgICAgICAgICAgICByZWZEaXN0YW5jZTogby5yZWZEaXN0YW5jZSxcbiAgICAgICAgICAgICAgcm9sbG9mZkZhY3Rvcjogby5yb2xsb2ZmRmFjdG9yLFxuICAgICAgICAgICAgICBwYW5uaW5nTW9kZWw6IG8ucGFubmluZ01vZGVsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlbGYuX3Bhbm5lckF0dHIgPSB7XG4gICAgICAgICAgICBjb25lSW5uZXJBbmdsZTogdHlwZW9mIG8ucGFubmVyQXR0ci5jb25lSW5uZXJBbmdsZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5lckF0dHIuY29uZUlubmVyQW5nbGUgOiBzZWxmLl9jb25lSW5uZXJBbmdsZSxcbiAgICAgICAgICAgIGNvbmVPdXRlckFuZ2xlOiB0eXBlb2Ygby5wYW5uZXJBdHRyLmNvbmVPdXRlckFuZ2xlICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmVyQXR0ci5jb25lT3V0ZXJBbmdsZSA6IHNlbGYuX2NvbmVPdXRlckFuZ2xlLFxuICAgICAgICAgICAgY29uZU91dGVyR2FpbjogdHlwZW9mIG8ucGFubmVyQXR0ci5jb25lT3V0ZXJHYWluICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmVyQXR0ci5jb25lT3V0ZXJHYWluIDogc2VsZi5fY29uZU91dGVyR2FpbixcbiAgICAgICAgICAgIGRpc3RhbmNlTW9kZWw6IHR5cGVvZiBvLnBhbm5lckF0dHIuZGlzdGFuY2VNb2RlbCAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5lckF0dHIuZGlzdGFuY2VNb2RlbCA6IHNlbGYuX2Rpc3RhbmNlTW9kZWwsXG4gICAgICAgICAgICBtYXhEaXN0YW5jZTogdHlwZW9mIG8ucGFubmVyQXR0ci5tYXhEaXN0YW5jZSAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5lckF0dHIubWF4RGlzdGFuY2UgOiBzZWxmLl9tYXhEaXN0YW5jZSxcbiAgICAgICAgICAgIHJlZkRpc3RhbmNlOiB0eXBlb2Ygby5wYW5uZXJBdHRyLnJlZkRpc3RhbmNlICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmVyQXR0ci5yZWZEaXN0YW5jZSA6IHNlbGYuX3JlZkRpc3RhbmNlLFxuICAgICAgICAgICAgcm9sbG9mZkZhY3RvcjogdHlwZW9mIG8ucGFubmVyQXR0ci5yb2xsb2ZmRmFjdG9yICE9PSAndW5kZWZpbmVkJyA/IG8ucGFubmVyQXR0ci5yb2xsb2ZmRmFjdG9yIDogc2VsZi5fcm9sbG9mZkZhY3RvcixcbiAgICAgICAgICAgIHBhbm5pbmdNb2RlbDogdHlwZW9mIG8ucGFubmVyQXR0ci5wYW5uaW5nTW9kZWwgIT09ICd1bmRlZmluZWQnID8gby5wYW5uZXJBdHRyLnBhbm5pbmdNb2RlbCA6IHNlbGYuX3Bhbm5pbmdNb2RlbFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJldHVybiB0aGlzIHNvdW5kJ3MgcGFubmVyIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gICAgICAgIHNvdW5kID0gc2VsZi5fc291bmRCeUlkKHBhcnNlSW50KGFyZ3NbMF0sIDEwKSk7XG4gICAgICAgIHJldHVybiBzb3VuZCA/IHNvdW5kLl9wYW5uZXJBdHRyIDogc2VsZi5fcGFubmVyQXR0cjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAyKSB7XG4gICAgICBvID0gYXJnc1swXTtcbiAgICAgIGlkID0gcGFyc2VJbnQoYXJnc1sxXSwgMTApO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSB0aGUgdmFsdWVzIG9mIHRoZSBzcGVjaWZpZWQgc291bmRzLlxuICAgIHZhciBpZHMgPSBzZWxmLl9nZXRTb3VuZElkcyhpZCk7XG4gICAgZm9yICh2YXIgaT0wOyBpPGlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgc291bmQgPSBzZWxmLl9zb3VuZEJ5SWQoaWRzW2ldKTtcblxuICAgICAgaWYgKHNvdW5kKSB7XG4gICAgICAgIC8vIE1lcmdlIHRoZSBuZXcgdmFsdWVzIGludG8gdGhlIHNvdW5kLlxuICAgICAgICB2YXIgcGEgPSBzb3VuZC5fcGFubmVyQXR0cjtcbiAgICAgICAgcGEgPSB7XG4gICAgICAgICAgY29uZUlubmVyQW5nbGU6IHR5cGVvZiBvLmNvbmVJbm5lckFuZ2xlICE9PSAndW5kZWZpbmVkJyA/IG8uY29uZUlubmVyQW5nbGUgOiBwYS5jb25lSW5uZXJBbmdsZSxcbiAgICAgICAgICBjb25lT3V0ZXJBbmdsZTogdHlwZW9mIG8uY29uZU91dGVyQW5nbGUgIT09ICd1bmRlZmluZWQnID8gby5jb25lT3V0ZXJBbmdsZSA6IHBhLmNvbmVPdXRlckFuZ2xlLFxuICAgICAgICAgIGNvbmVPdXRlckdhaW46IHR5cGVvZiBvLmNvbmVPdXRlckdhaW4gIT09ICd1bmRlZmluZWQnID8gby5jb25lT3V0ZXJHYWluIDogcGEuY29uZU91dGVyR2FpbixcbiAgICAgICAgICBkaXN0YW5jZU1vZGVsOiB0eXBlb2Ygby5kaXN0YW5jZU1vZGVsICE9PSAndW5kZWZpbmVkJyA/IG8uZGlzdGFuY2VNb2RlbCA6IHBhLmRpc3RhbmNlTW9kZWwsXG4gICAgICAgICAgbWF4RGlzdGFuY2U6IHR5cGVvZiBvLm1heERpc3RhbmNlICE9PSAndW5kZWZpbmVkJyA/IG8ubWF4RGlzdGFuY2UgOiBwYS5tYXhEaXN0YW5jZSxcbiAgICAgICAgICByZWZEaXN0YW5jZTogdHlwZW9mIG8ucmVmRGlzdGFuY2UgIT09ICd1bmRlZmluZWQnID8gby5yZWZEaXN0YW5jZSA6IHBhLnJlZkRpc3RhbmNlLFxuICAgICAgICAgIHJvbGxvZmZGYWN0b3I6IHR5cGVvZiBvLnJvbGxvZmZGYWN0b3IgIT09ICd1bmRlZmluZWQnID8gby5yb2xsb2ZmRmFjdG9yIDogcGEucm9sbG9mZkZhY3RvcixcbiAgICAgICAgICBwYW5uaW5nTW9kZWw6IHR5cGVvZiBvLnBhbm5pbmdNb2RlbCAhPT0gJ3VuZGVmaW5lZCcgPyBvLnBhbm5pbmdNb2RlbCA6IHBhLnBhbm5pbmdNb2RlbFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgcGFubmVyIHZhbHVlcyBvciBjcmVhdGUgYSBuZXcgcGFubmVyIGlmIG5vbmUgZXhpc3RzLlxuICAgICAgICB2YXIgcGFubmVyID0gc291bmQuX3Bhbm5lcjtcbiAgICAgICAgaWYgKHBhbm5lcikge1xuICAgICAgICAgIHBhbm5lci5jb25lSW5uZXJBbmdsZSA9IHBhLmNvbmVJbm5lckFuZ2xlO1xuICAgICAgICAgIHBhbm5lci5jb25lT3V0ZXJBbmdsZSA9IHBhLmNvbmVPdXRlckFuZ2xlO1xuICAgICAgICAgIHBhbm5lci5jb25lT3V0ZXJHYWluID0gcGEuY29uZU91dGVyR2FpbjtcbiAgICAgICAgICBwYW5uZXIuZGlzdGFuY2VNb2RlbCA9IHBhLmRpc3RhbmNlTW9kZWw7XG4gICAgICAgICAgcGFubmVyLm1heERpc3RhbmNlID0gcGEubWF4RGlzdGFuY2U7XG4gICAgICAgICAgcGFubmVyLnJlZkRpc3RhbmNlID0gcGEucmVmRGlzdGFuY2U7XG4gICAgICAgICAgcGFubmVyLnJvbGxvZmZGYWN0b3IgPSBwYS5yb2xsb2ZmRmFjdG9yO1xuICAgICAgICAgIHBhbm5lci5wYW5uaW5nTW9kZWwgPSBwYS5wYW5uaW5nTW9kZWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgYSBwb3NpdGlvbiB0byBzZXR1cCB0aGUgbm9kZSB3aXRoLlxuICAgICAgICAgIGlmICghc291bmQuX3Bvcykge1xuICAgICAgICAgICAgc291bmQuX3BvcyA9IHNlbGYuX3BvcyB8fCBbMCwgMCwgLTAuNV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IHBhbm5lciBub2RlLlxuICAgICAgICAgIHNldHVwUGFubmVyKHNvdW5kLCAnc3BhdGlhbCcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGY7XG4gIH07XG5cbiAgLyoqIFNpbmdsZSBTb3VuZCBNZXRob2RzICoqL1xuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBBZGQgbmV3IHByb3BlcnRpZXMgdG8gdGhlIGNvcmUgU291bmQgaW5pdC5cbiAgICogQHBhcmFtICB7RnVuY3Rpb259IF9zdXBlciBDb3JlIFNvdW5kIGluaXQgbWV0aG9kLlxuICAgKiBAcmV0dXJuIHtTb3VuZH1cbiAgICovXG4gIFNvdW5kLnByb3RvdHlwZS5pbml0ID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBwYXJlbnQgPSBzZWxmLl9wYXJlbnQ7XG5cbiAgICAgIC8vIFNldHVwIHVzZXItZGVmaW5lZCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gICAgICBzZWxmLl9vcmllbnRhdGlvbiA9IHBhcmVudC5fb3JpZW50YXRpb247XG4gICAgICBzZWxmLl9zdGVyZW8gPSBwYXJlbnQuX3N0ZXJlbztcbiAgICAgIHNlbGYuX3BvcyA9IHBhcmVudC5fcG9zO1xuICAgICAgc2VsZi5fcGFubmVyQXR0ciA9IHBhcmVudC5fcGFubmVyQXR0cjtcblxuICAgICAgLy8gQ29tcGxldGUgaW5pdGlsaXphdGlvbiB3aXRoIGhvd2xlci5qcyBjb3JlIFNvdW5kJ3MgaW5pdCBmdW5jdGlvbi5cbiAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuXG4gICAgICAvLyBJZiBhIHN0ZXJlbyBvciBwb3NpdGlvbiB3YXMgc3BlY2lmaWVkLCBzZXQgaXQgdXAuXG4gICAgICBpZiAoc2VsZi5fc3RlcmVvKSB7XG4gICAgICAgIHBhcmVudC5zdGVyZW8oc2VsZi5fc3RlcmVvKTtcbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5fcG9zKSB7XG4gICAgICAgIHBhcmVudC5wb3Moc2VsZi5fcG9zWzBdLCBzZWxmLl9wb3NbMV0sIHNlbGYuX3Bvc1syXSwgc2VsZi5faWQpO1xuICAgICAgfVxuICAgIH07XG4gIH0pKFNvdW5kLnByb3RvdHlwZS5pbml0KTtcblxuICAvKipcbiAgICogT3ZlcnJpZGUgdGhlIFNvdW5kLnJlc2V0IG1ldGhvZCB0byBjbGVhbiB1cCBwcm9wZXJ0aWVzIGZyb20gdGhlIHNwYXRpYWwgcGx1Z2luLlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gX3N1cGVyIFNvdW5kIHJlc2V0IG1ldGhvZC5cbiAgICogQHJldHVybiB7U291bmR9XG4gICAqL1xuICBTb3VuZC5wcm90b3R5cGUucmVzZXQgPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIHBhcmVudCA9IHNlbGYuX3BhcmVudDtcblxuICAgICAgLy8gUmVzZXQgYWxsIHNwYXRpYWwgcGx1Z2luIHByb3BlcnRpZXMgb24gdGhpcyBzb3VuZC5cbiAgICAgIHNlbGYuX29yaWVudGF0aW9uID0gcGFyZW50Ll9vcmllbnRhdGlvbjtcbiAgICAgIHNlbGYuX3N0ZXJlbyA9IHBhcmVudC5fc3RlcmVvO1xuICAgICAgc2VsZi5fcG9zID0gcGFyZW50Ll9wb3M7XG4gICAgICBzZWxmLl9wYW5uZXJBdHRyID0gcGFyZW50Ll9wYW5uZXJBdHRyO1xuXG4gICAgICAvLyBJZiBhIHN0ZXJlbyBvciBwb3NpdGlvbiB3YXMgc3BlY2lmaWVkLCBzZXQgaXQgdXAuXG4gICAgICBpZiAoc2VsZi5fc3RlcmVvKSB7XG4gICAgICAgIHBhcmVudC5zdGVyZW8oc2VsZi5fc3RlcmVvKTtcbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5fcG9zKSB7XG4gICAgICAgIHBhcmVudC5wb3Moc2VsZi5fcG9zWzBdLCBzZWxmLl9wb3NbMV0sIHNlbGYuX3Bvc1syXSwgc2VsZi5faWQpO1xuICAgICAgfSBlbHNlIGlmIChzZWxmLl9wYW5uZXIpIHtcbiAgICAgICAgLy8gRGlzY29ubmVjdCB0aGUgcGFubmVyLlxuICAgICAgICBzZWxmLl9wYW5uZXIuZGlzY29ubmVjdCgwKTtcbiAgICAgICAgc2VsZi5fcGFubmVyID0gdW5kZWZpbmVkO1xuICAgICAgICBwYXJlbnQuX3JlZnJlc2hCdWZmZXIoc2VsZik7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbXBsZXRlIHJlc2V0dGluZyBvZiB0aGUgc291bmQuXG4gICAgICByZXR1cm4gX3N1cGVyLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgfSkoU291bmQucHJvdG90eXBlLnJlc2V0KTtcblxuICAvKiogSGVscGVyIE1ldGhvZHMgKiovXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBwYW5uZXIgbm9kZSBhbmQgc2F2ZSBpdCBvbiB0aGUgc291bmQuXG4gICAqIEBwYXJhbSAge1NvdW5kfSBzb3VuZCBTcGVjaWZpYyBzb3VuZCB0byBzZXR1cCBwYW5uaW5nIG9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUeXBlIG9mIHBhbm5lciB0byBjcmVhdGU6ICdzdGVyZW8nIG9yICdzcGF0aWFsJy5cbiAgICovXG4gIHZhciBzZXR1cFBhbm5lciA9IGZ1bmN0aW9uKHNvdW5kLCB0eXBlKSB7XG4gICAgdHlwZSA9IHR5cGUgfHwgJ3NwYXRpYWwnO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBuZXcgcGFubmVyIG5vZGUuXG4gICAgaWYgKHR5cGUgPT09ICdzcGF0aWFsJykge1xuICAgICAgc291bmQuX3Bhbm5lciA9IEhvd2xlci5jdHguY3JlYXRlUGFubmVyKCk7XG4gICAgICBzb3VuZC5fcGFubmVyLmNvbmVJbm5lckFuZ2xlID0gc291bmQuX3Bhbm5lckF0dHIuY29uZUlubmVyQW5nbGU7XG4gICAgICBzb3VuZC5fcGFubmVyLmNvbmVPdXRlckFuZ2xlID0gc291bmQuX3Bhbm5lckF0dHIuY29uZU91dGVyQW5nbGU7XG4gICAgICBzb3VuZC5fcGFubmVyLmNvbmVPdXRlckdhaW4gPSBzb3VuZC5fcGFubmVyQXR0ci5jb25lT3V0ZXJHYWluO1xuICAgICAgc291bmQuX3Bhbm5lci5kaXN0YW5jZU1vZGVsID0gc291bmQuX3Bhbm5lckF0dHIuZGlzdGFuY2VNb2RlbDtcbiAgICAgIHNvdW5kLl9wYW5uZXIubWF4RGlzdGFuY2UgPSBzb3VuZC5fcGFubmVyQXR0ci5tYXhEaXN0YW5jZTtcbiAgICAgIHNvdW5kLl9wYW5uZXIucmVmRGlzdGFuY2UgPSBzb3VuZC5fcGFubmVyQXR0ci5yZWZEaXN0YW5jZTtcbiAgICAgIHNvdW5kLl9wYW5uZXIucm9sbG9mZkZhY3RvciA9IHNvdW5kLl9wYW5uZXJBdHRyLnJvbGxvZmZGYWN0b3I7XG4gICAgICBzb3VuZC5fcGFubmVyLnBhbm5pbmdNb2RlbCA9IHNvdW5kLl9wYW5uZXJBdHRyLnBhbm5pbmdNb2RlbDtcblxuICAgICAgaWYgKHR5cGVvZiBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc291bmQuX3Bhbm5lci5wb3NpdGlvblguc2V0VmFsdWVBdFRpbWUoc291bmQuX3Bvc1swXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgIHNvdW5kLl9wYW5uZXIucG9zaXRpb25ZLnNldFZhbHVlQXRUaW1lKHNvdW5kLl9wb3NbMV0sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgICAgICBzb3VuZC5fcGFubmVyLnBvc2l0aW9uWi5zZXRWYWx1ZUF0VGltZShzb3VuZC5fcG9zWzJdLCBIb3dsZXIuY3R4LmN1cnJlbnRUaW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNvdW5kLl9wYW5uZXIuc2V0UG9zaXRpb24oc291bmQuX3Bvc1swXSwgc291bmQuX3Bvc1sxXSwgc291bmQuX3Bvc1syXSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2Ygc291bmQuX3Bhbm5lci5vcmllbnRhdGlvblggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNvdW5kLl9wYW5uZXIub3JpZW50YXRpb25YLnNldFZhbHVlQXRUaW1lKHNvdW5kLl9vcmllbnRhdGlvblswXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgIHNvdW5kLl9wYW5uZXIub3JpZW50YXRpb25ZLnNldFZhbHVlQXRUaW1lKHNvdW5kLl9vcmllbnRhdGlvblsxXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICAgIHNvdW5kLl9wYW5uZXIub3JpZW50YXRpb25aLnNldFZhbHVlQXRUaW1lKHNvdW5kLl9vcmllbnRhdGlvblsyXSwgSG93bGVyLmN0eC5jdXJyZW50VGltZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzb3VuZC5fcGFubmVyLnNldE9yaWVudGF0aW9uKHNvdW5kLl9vcmllbnRhdGlvblswXSwgc291bmQuX29yaWVudGF0aW9uWzFdLCBzb3VuZC5fb3JpZW50YXRpb25bMl0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzb3VuZC5fcGFubmVyID0gSG93bGVyLmN0eC5jcmVhdGVTdGVyZW9QYW5uZXIoKTtcbiAgICAgIHNvdW5kLl9wYW5uZXIucGFuLnNldFZhbHVlQXRUaW1lKHNvdW5kLl9zdGVyZW8sIEhvd2xlci5jdHguY3VycmVudFRpbWUpO1xuICAgIH1cblxuICAgIHNvdW5kLl9wYW5uZXIuY29ubmVjdChzb3VuZC5fbm9kZSk7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGNvbm5lY3Rpb25zLlxuICAgIGlmICghc291bmQuX3BhdXNlZCkge1xuICAgICAgc291bmQuX3BhcmVudC5wYXVzZShzb3VuZC5faWQsIHRydWUpLnBsYXkoc291bmQuX2lkLCB0cnVlKTtcbiAgICB9XG4gIH07XG59KSgpO1xuIiwiZXhwb3J0IGRlZmF1bHQgXCJkYXRhOmF1ZGlvL21wZWc7YmFzZTY0LC8vdVFaQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVdHbHVad0FBQUE4QUFBQmpBQUMwNXdBRUJnc05EeElVRnhrYkhpRWpKU2dyTFM4eU5EazlRRUpFUjBsTVQxSldXVnRkWUdKbGFHdHRjSEoxZDNsOGY0T0ZoNHFOajVHVWxwcWNuNktrcDZtcnJyQ3l0YmU2dkw3Qnc4WEh5c3pPMGRQVzJkdmQ0T0xrNXVucjd2RHo5dm43L3Y4QUFBQlFURUZOUlRNdU1UQXdCTGtBQUFBQUFBQUFBRFVnSkFNbFRRQUI0QUFBdE9kVi80ZHNBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUEvL3ZBWkFBQUFiY0EwSGdnQUFnQUFBL3dBQUFCRUMwdkpZd2tiWUM3Z0dOZ0VBQUFFQ2lXUlhkdHQ5dGR4Z1FNRkF3b0lIQ2hrUUprNVFFSEppZC9PS3hQSVlnR08vQkIzRTd5N3dRcFcvLzd1VTg1K1hTQ0R2d3hJRVBXTkpwVlpWUitCQ2hJN1pnc0ZrSWhHaFlqYWh1aFZBNmkxbC9CQXNINER4a2xKR0RKQ0NFcGxuK0hoQkplMlp5UjB2WkJiVTJMMWVaV0llR0I1eVEwQU5pRExDQktOaEhZekt1YkxsY1VFcFFGOTBocTNDL3B6WE4zdm1pRjFTcjhwWHM4U1VOTVc4TTUwbWh0b1NnQURMSE1NajJNWXJLMTJOU0tOdDdtQjlwRFh2b1REZ1dicGVsaUJBSHluZlVoNHg5YjE1bnVDYldMK3pYcWUyM2QrK3YvVlkzY3YvK3EzNkg3LzFYMUtpSDQzV2tNeXF1b0lSb1J1bUlDTTlmWkZSNGttbmJVWFQyYS9OdFNkNlJLVnFBWUZxT0xCanJjQzk3Rzd6R1UrL3IzZGhmb3Y2NnFOeHFLYjN0bXdheFBVcit1NVpja1dQYzNiVE43bURiWlQ1V2lqNWJyeWFTM2FMY2k3Ri9NY2dHeUxaVUlKRVpoUlV5b2VwWW1oYUdDWmhBUUZHcEZ6RnFuRldta01zdVhSWGRicFJzcHhaWlJDSWtScDlBZ00ybHhJZXBlL01MTWhjbEV5Zm9NcCsyU01KU1FGdVFsME1YakZoQ3o3YjlOMUhyeDMwMDFKKzMvOVNCOXFrUlJtVVJjRTBwekNKSGd4RVNwZ25pY294cEJCZ0JlTkhOSjVvY01xSFJLWGhvQUNTVXBOemNjTEhDY1ptN2tTREpUMENwaGVjUE9MMmxaTVZZU1RRZWljbXFTeDUwRWpYTlRFcVJ0cno4V2NTUWppOXFDcVpvclVPYzg0ZWxhSHFIKzJuV09XdjJXdmIrYXBzN05ycG5ZeTc0ZEQ3ajRYK1gzTEoyVlg4WFBVdTZ0alBzL1J3N1JBRDMyWVUxbFlrZllQQUxPNW55WDkwUkRINnIzK0EzWFpMRXFnaUFhS0pZYUxuQkwxRUMyOElPeE1MbFVQZXZ1a3IybEdVYTlhMTFVazIxdDl6TitHdlJ2N2YvLzZQN2U2bW95R0hoSGRtTjFoMmJ6U1p5TnROQkUzakFCQURBY0FzTk02RkNDQUpZQnpBVzZrYnN6UWcxU294b1lHZ1I2b1BKd2NqTW1KQndheDBEM3RUZ1ppdGYvKzVCazU0QUVIa0ZKWXd3YjhEWmdHTmtFQUFBVVFXTWhsWldBQ015QVkyYUNBQUFBckJkQUVBc3RZS1p4U1BUSndvSERUd284ckdRNU5MVHRhY0FRVVAyVEFJQW1JQlo2VlNkNzlPZTNaODRVbWtxQ1RvYXROWVZBamx3RTFGazcrdTVjaUVDTkVZREYyVXNpYjFtY3NwN0VwMUc2Ui9KZFN2NXFVUmx3Mi9iK2tibE53TmIzSzc5bWNqYzdhbGtwdXcvSTZDWHkzTGxIUXhtQ2EyTm1rbEZTVldKWlMxcWZQTGtVMWxZaWxQZHEwMElyMTVUY2w5VzVhcGFURDhzdnl5dzUvLzN1ditONVc3R0ZKMjFoVnE0WEswbXIzYzVaWnM2K3R6L3UydDd0Ny9QZVA1OS85Zi8vLy8vLy8vLzJkLzM4ZjErV3YvLy8vLy8vLy8vLzkvVjQyUlhpRk5Mc2Rsa2RraWtRYUFRQUFURVZlTHdLZGFEb2pJaVJJQ09BVTY5NUZvRUZrQ1VIUWdMMXZiVUlRNExCVVBCZXY0b1FpOTkvK3R4eU4vL3BwMm00Wm1SbVpITTFnakxTalZhamROdFdURUYwMGVmQ0lVdzhkVUtOQ0JRWVJCbXlhb01vc0RBdVlRWUdNQkJFbG1aQ3JKQkdGR01ZWlF4eHRHc1NMQUtCR0FBWGlNSWFQdk9XQUYrZ2dFd2xWTkFBRVl3VUN0dXVNQWlRMk12Lys5QmszZ0FKQW9USS9tc2dBanpBdVMzQmdBQW54ZFV2K2J5QUFRZ0FKSGNBQUFBdnJHVkZsRUFLV0NveThwbnFwSEtaTjlEWmUyQVZCb2JYMnlVSVBVWWl6TEZKQUFvaUJaNG5VdlppUVVCaG1VWGx5dzA2SU9JQlQ4aStabzJ1SWRtTnRCcXkyTW84b2RaMTc3TVFqVURtU0d2ZU1WNERnY3VJaWhCendPekZHdXZ5LzhvaTdPWFNiazdXN2xEV2ZqRmdqaHVQZHQ1SmdQNndkTGN1TzIyRU1PaTFscnNhZmFNTWFqMTZLM1pIYWwvS0tTU045b1hQUDVTbDRGcWNVRFYzZnRPQTRrSHc0cE9CRlB2UkZHYk1PWWJZZEdua01CUkc1RnFiY1V1NDFZVm0rc3ZuS1YrNlhtR0g1OTF2WFAvbi8vLy8vLy8vLzgxVkJVWFc1UCtMa2lJcHRLT1JOcHhrb2tJQUFBQVljOGl0enhRTXVQR0ZoTUpBcUVqaGNIekVYcEVVcU5Eb3VTUERIbFJha0lqVW91ZHFaNmlnZGNlLy8vLy8vLy8vLy8vMFZYUkhlSlZHTXFhclFQQXRLN0JKOGFFYXlFWE14VDRMb29DRjdDUmJMWmo0WmIwcER3SXgybEF3cVdxajFGNjJ2SGNDRk1hMHJFdHBhMHRxdkxLZzlQcnJmMTZxZHBURjNhelN1N1ozYk1RcFVqbEhXR2F1bDZ5OXBsbTZubHJVVmIzcHJqclp6OEY2cmMyRE8rYjVIYmJZelgvM09wMXYzYTlsc3JOTnRXMzc3UFhvdVZNUzFXMzJwdjlCRzlPZlhOWi9PZGQzTFMxZTdGNW1jZWxJVjBQbTlYaFNEU1pNbFdXUjRaVXdKcVcwVnNjNmVlSFhuNTllaEJUcXU5bnM5QXViOVA4VTE1WHU2dFRMOTM5WGx0cTBmU2t5VnBaa1F5UkZwak1FWTBQV1FIaGhrTkE1QTRZSWV4WkdWTVJQK1ZTeHoydU42eU9HNUhNQXFWa2pON1RST3hTeFFuZHdvNUUxczFyUWhJb2FJalVVRGV2MUI5WGw1T1NrM1czaU5RY0p0VUlpQWtPS1RhM2R4ZWJiRTlnOGdna1dFY0k1T081SUhDQzA3bHdPcW9EQmlJaW1qbEdobWhYMDlKNnFsQ2svU1Vvcnl3RWtEMm1qZ2hUbVlZMk15SWlLY3A5dUNsS0wvWTc3MGt0c2xON1hrVXFKcFZrWGxmZGpnQU1RQ1lvNjErT3I4aXg2dHJLN3QzK3ovLzluNmFHRy85NnR5bzB3TGlDVkFzWmFBem9WVkVVa2VDQmlKcVVoZGxGMTduY1dlaW8yU0lzMFpyY2FXeXlReGZDRDRJaHVWMThsT29sR3NrbENWZ29qbmJqVWpZcGhLbk1GNUc0eU5OT2RhR1RuYnVkYjQybVhUcG1kMXVWZW9yNktkT3lTaUVRUVduc0pzS1J5Ly91UVpQNkFCUmRqeS9kbGdBSXdJQ2pzNFFBQUUxMmRLY3drY2NDVGgrUHdFSWg0TysvSjhGV0FpVkJ5VTZoMVhVM0xVaXplbkRseU4wa1ZreTNzcjBnenY5d1pMaXpYZDlmaFFkb2NFbHgvU0s3dnZvRWFocmxwVmFpNTU0bTU5elVXTHZ2M1dwVmpkYXpEVzRzZkpWN3lqbkkrelE0NXltcDVKaW42L3YrMzNwUjdlY1FpN28waVdGYVVyaTJGQk9heW9MbDVnc2NveU9IRnBMb1FvU05mMXhXYnM1YVhLWHFlRjJwTEpMMllFSUVaQVpDckloQ3FBV0VkcklVWjFtZUltZHBsejVrTDNxSFdSOGhNeFZuTkEwNUFpSkNaYzFzanBkbzFQeW5Tbll3L21RN0M3VFNNK3d3cm5TUTdhL2xUMDc4b1FVRGNZd1F2MWc2TmVsc2RzN3FwVzc2M09wUzdUTStGWHcxd2VTZW1obUptLzJyajhiZnYzSDUydGZ2UDFrL1FWZ3NrbWtrU0JCVWRPRm5uN2d3ZVdTRVNISzBuNWtEYWxyS3lRWHUzSm9YMzd2OWRlS2YvKzNULzJmK3RLZjFWckxTTktCaEZtZ3Zad0RXNUE4SElBS0RNWkFHaHpTOVR0WTVZb201cmdFSXlESWpya3lSMUFqYXRXSjVNNjBUYkxuL1dQT1ZUa0JsZTYyNHc0cnRpQU1ZVWFoYzN2TVd6YmlFRy8vdVFaUE9BQk54anllTUpIZEF3b0FqcEFBQUFFL0ZySTR3a2M4aTBnR1QwRUFBRXVrUlJyRmZFWW1vbzQrSmh2M1JVa3BDbmhsbmxuTnFsYS9UYUpvMWpOYllYbjZGUHJVcDI4K2Y3OHY5bVp3NmNhMWRDWlJpS1J0STcwL2RremU4anJXaksyZS8zalAvWW8zWHpMbGZmN3FzcXBRTkZUUmhhbkZwVytnUGxmVjBYZjF2dGE3OWp2OTBuMEMybjd1WkdwNjYrN3Z2OTMvMG9EUE1vekdUM2ZVU2dneVVTQkVrVEVlTDJwYWpxWkVnRkR5MW9rdWcyTktOUFF0bGFiRnVVUUV1eVJUcjB2OE94aVVIbUZDQlV5OFRBKzZFQlNoSlM2emtRaXFrRFNSeHFNaVJSR2hYVGpLOFZSeGptcFdhMW5MVVFuSTc1SXB5aVR5U00wdFBjNUN0NHE2MVN1dXFXeGpzakZKU3BPZmFERXBJNGVaOFZrcElXdDZqVUZHS05zcDJFcUVVSzZNZnlrZjN1UUpZeFREMWxTSXhaMndPbUZYd0ZNcEltbFZFQmc3Y0ltQjhtS0RpQ3lTOTZCU2NLMXFTQUg0Nkw2RUZOYk41MWk3RTY2Zit6L3FjaDFKcnIxZXpxdSs3N2EwQW9oMWRqSzZ2Nk9KMGJHQ0VZaURsNlJEa2sydFVOaEloU0lKb28wTEtrK203dzhMeStWU094SWhzYTh2V3UvL3VRWk9XQUJNOVV5T01NTTlJcmdCanBCQUFBRkNtUkpjeWtjOERWZ0dOd2tBQUFaZXlCaHliZXVxcWlZNitucW05WUsrNkZNU0ROSmJhNVJqeDZQRkNBbUNPTGd1Q1ZENmhpY2RYUkMyQWFwYUdGWjRUaDNWMFJ6REJRcEw3TWxwbzBoRWR6WGo0WXIvRUo5anB3MEdva054b0hEZ0p5WkZnQmNNS2tRZlVJZGxPcnRGazZVUWtTb1NzcWdHRk4vays5ZVFPRVVUTzIxeFJOeVJpYVd2RiszMTFWSzhrcG5VMXRYLzZ0MTFIKzc3R0o3SnF6L2RDOXE5Q1pGVkFsaUltZzRCTXdVSWhHa3NBUUZ4V3dFd29zdzFKRmpESW0wVUlhUXJ5MjFtU1R0cW1pME5TeTVZSEEwQlNBQUJoamtKTUJTTG1zd291QjVOMDVKajA0TmxLcm1ZWHUrYTNZU2xTODlndU50ZkdtakZlc2ZxZkYxdDJuaHpkOWpUaHpKNGMxMElWcDJiZDU1MjZXWUhNdS80U2w2Mk1GR1R5ZTdmcjJMcjd2QzdWL3pQZlRqNE5IczN2MWdWQUcybWsyWTBrbWl3cWVyTW1EcGwwZzRQWE50T3VZdlZEYmh0emJIMXlCdFpFYUl3d2xyWFZqRXBXVW8wYkM5Tkh0dVExN1VUVmlJMW1JdG42MVIxMVVnVTFWVVpSa01URE12eUxWQlNpQTQxQXdvVURBLy91Z1pOWUFCSkpWeWZNc0c5QXhJVWpjQkFNUUVqMDdJWXdZVllqNUFHUDBFQUFBNUMrRkFsRFNzQVV5ZHRya0JPUy9sQi8yR2gzOGRVa2wxeVlpdHVMUzBZbW9paDR6QnZ6akZBcXhrWk9NeWc1dVRqQlR4VTJDSXFPY0ZLOURKamg2TlFacTRoamRRaXRpY1hUWVVoaG1lZGNtVG9sV0tZTWpjZFNqcmM1dzR4c2JsVEZMYlNsakpLeWRiY0psczNLS3pSeHhTRU9RblZrZit2Z3JzU0dkOS8rZitoT2lTTjFPTnB0bEYyalhvdFc5MXBHZnJXamF0akdsdE0xb1MycG1yN2RTTG5jWDAxc2NxNUdpZnBPNXhQLy9vUWMxZFVOYzJ5SEdBandLUmFnK1VISUNRTWNNUUZBUWhTTkRSRXFXWHNNWE91Wmw4UWxzVUNnUUR3akhtN1pPSUFUSnpnY05ZVGp5ejA0d1FJQklJVWgzVUlWYnkxOFlRejFyMGxobWtNWGUwZFVxQm1DaUFneFlnSUxCaDBZUXlTVHlBM2RCbEhsR0Q3Sjd6aGFJN08wKzU5akp1d05TQm0yREVwWXhxUUw5R2RSeGMwcHlMdnhwbWFvT3Q4dFAvYThKL2dIL3grT3ZYNkVrNFNYS3Fwa2hIR0Z6NXhxOTd6Z0dFTWpaSEc5Q25qdEI4WmZhZHUvaTZyNzdTK20xbi9MTlJzb0VUa0pRdjdmL1ovclZpZnZUWlNzeW9SamtxSWhIQjNKakRLQkNYYTgwbFVYQ3lRa1dJeEpmSmJxenJEeHVyRHRSY1JKaUZjSUtoOXg2WTJLNm1oSEk1YnFSNFZiV1FObXo2U1RPcHBuWWM2eEJucWU3WWdlc3JhZjFWTlB6YXlIdXZMVFU4aTZQWmhJTzdFa2lHeGNtLy91UVpQOEFCTTlpeU9NSkhUSXY0QmtkQkFBQUV6VlBJNHdrY1VqUGdHUHdFQUFBWllPc0dGZVYzQkZUek9ud21XanJVSWxORHRaU3VMM1VJMEtwS081cUZlMHJYMnRzdnZoMXM3Wi8rMitUN2Yrb2dtazVFcXRNQnpXcVdsQ1dPQmtCckRMV1QzWjZuS28vbWxLTnNTZ0RLV0xPeFVZNHdpekZmeG5TWTF6RmdBZktmcGhsdFVxVXMwaWdrTXhTSXJvUUJBb2t3d01ZRmxVVVlnQmJEaHFsNkJVUHVlcWFSVWdqQU1yYjJBeklrUmdLSlFSUUljYkZlbWlWQTZEcG8wTGFxTzRMTnlUUlBEOFhuSXBJU21YQnBLRVFrbUpGc280SUtNT0JEMERhZ3lRU0kwNDR4RG4wVm9MRElJRXZYOUNLNnBDcTJ3VGlUSnNxc1dNVTh5SXEza3YyOTNwVnlXZEswdEkwYytpT1hzQU1rSXNvMi9XdTNhOTY3My83ZnpJV090VEtyRHNlTVlrQkZhRGpTYko0OWVQTHNibC9zWitlL01GMC91ZTcvUjlTSTVkWDlOcDBTQlV3a2RJWTY5S0I2MjJ4T0tOdEpCckFoZ01RblNWUk01U3RHdUlGa0kwNkVKSXFwbDd4cjNjSm5CNFJUZ2JHSnlQUW5oU3FiaTZCa3ZNUUlVc2xscVQ1RFdwY29jdXpDYUlub3FQTzJNanhQSFUxM0szci8vdVFaUEdBQkt4VVNHTXBISEl5QURqc0dBQUFFNFdCSVkwa2NVakJBQ09rQUFBQURSZG5SWW5hUXBHS0JnSjNXdTF4VTRWdkF3RVNNS293eUE1SzhGK2RMckJ2emtrTlRTSGtWZzBOc3lLRStVSlNWc3loU2g4dGxiNUxlS1RHVGpOWXdBTFlxbiswSE9NSWNKU3JXVTdLQTI2Q0E5R3JOamdGREhGYUI2OTlDRmhDcU0vMktUTW5RSU9TV1pMMGUvSStOTVdiWi8wVTkrem85Vm0rLzdHQkhseVp5T1ZvQkV4RG9MRUlaTUNoMUJoQVJJb0lHRUFRUnZ5cUkySnFkeGViOFB5NURMMnp3cWI1WGZ5RHJsTE5TaWsrNVo3SUVuU2NUUmliTFB6WG9Ja1V0Yms2eEQwZmJHQTRYUzBlalNuUGlEVGVsdXNqVjBza2E1SkpkbmxiSnBXSTk5SnZsbnUrRW5RU2ptSFFJRk9SME04R1VYdFcwazhqVndwT2RYUHl3WWZQSk1hRkNab00xZDlEVzNyYUVqRzNCa2tPM01keUNjamthbHFhaHE0dVhEemdHd1dEQVZJMDFhL3RKV0pIa1Q3a1ptTFdhRUphdiszUlQxSlNiejIxbHNWdFpRM005dlhxUlNKZFhNWVdsSWttRkVtS1lTU1JwV0RTakFGVGNGSVppZ3NzZHBTazRSSTI4WjB2V21rVDgzYjkySlBETEgwdFhqKzAvL3VRWk9ZQUJMSmpTV3NNRy9BMWdUanNCQ0lNRXoyako4eVlkMkRRQUdQd1lBQUFya1NMQ2l3bE0wNFZSaHVDR1BvemhXbVpKcVpLeWFTQ0taS1NRTGVBdDNCQk01NEdySkRLQzhDU1NJMTh5NzdFY3dwRVVNR1NLTXBIc2U2MGlXUFRuaHFZNTBobGROdk94WTIwcW5UMHVZWSttTVJNM3RtZFhGbnp3SGVQbWZYK3NWM3NCYmpsMGY5WGU1d2ZTV0N3RmtnNkNMUzZ0QTlLbWtIM3dnLzc2MTZQN0ttMTlIWi8rcCs5R3Q5djN2ZSttKy9WRDlVcTBvdDZVVERqQTRHcUVJVmpnQUhBcklRc0ZUcVVRWFN5NUtOMzYwWVhJak4xQVpFZzVTaW8zWG5WaWVVckYwMk95dGJYcXZuckc2dVEvV3YzMCt1VWtwMUV4RTVpcTlUaUtaaThLTGVITGs1SWl5azFySmJwQSs3VGd6NzB3MlJ1azdsbjU3cVplbFFkY1UyUGJ1elh5N2JsVmF0ZmJndC9zMGl4ejFkMjE1RXZ2OVptTVZ2REt3L25rUzdVS2dnT1J0ZjM3UC9YRGR5L3BEaUdOSm1CcG0yVzVCa05PSnVGM0plYk9MSGI3R0VCR1BvNnJXZjkrbnA5S0hIMGhha1dKNWhMd0NMSVFLcmZkSXZYRWliL3I1eDk5dkZQMW1Mdmxxa1lvMnlrWmZDMnlWYS9HNkhVLy91Z1pOZUFCS2hoU1dzR0hWQXY0QWtjQUFBQUUrbGpJWTB3ejRqbkFDT3dBQUFBUWpxcFdISVpza0lWaWxhVGNiWkczUitIbmNtSEk0aEZibGdrZ21mWmJrdDRRYUVRaEpUWkFYVHVhdGE2eFppV25VWmVSSkZNRUZHMG9UaEptTVVDa2tUTE1yTVJoQkN4bjNVNm5MVW9KYWtNS1ZWWVlKQ0puNDJaL2I1L011ZnNXYlE0dVNtSFVselBJOHdaSGJ0MU1OckNJMktUR0dpcEhOeHNmTUNqV3EzcSt0dElRZFYwMGFjUkpKWXVLcVdYRXhKcmxzUTduZGcvaWhhWXE3SzQvWDk3cnRId0I5U3BFMzZKdE9VVC8vMTBNTCtUV05SdHBKSVlHSW9oRUpjRndQWURYb3hDRlMzRzRMRHZPbGszS1BNeVlZT2dvQUZVQkVDSkdDU0VTbHhDb1lpdWdWWkZRUndoMExMV1FVZ1hCaEFvZ2o5UUxzeXJ0SU93MThXZk5IRm5FNXRHby9rMHZjUTVlUzA3ZjNsM1pqTWhtdjY3UkQxdWE3MFpobFo4djd0VDV6L1hMS0NZUHJBNVJTeHBJU0NFQmpJNUNENkFnSWhBQmhPbFlYbFJCODJqUjdpVW9sRWxkcXlCbTd0SmJGR1BHSG5VYWNtS1pRV1Rqd1NMU1lqOUt2Y3pWWCtoM2FkdUpaMFovK3E3LzJmLys2cEFaMVpFZ3pUa2FhU0xMbXpBK0pNNEdERVNBTUlHTEtBTTZIU3MrU1hYKzJGUHVYUUhOVWswMmdTWlBBT0N3Q2t4QXlpdEd4TmRkQXlzV2k0eXNkYVFuUlVzTm5CMW9ZWUpZVDhFSkNpWlZoQXMxZzBjM2pxOWdNb0dOaXNTZERDV2djNDBvdFhHcllKemgvdkNDNmFsLy91UVpQdUFCS1ZqU1dzSkhIQXRnQWs5QUFBQkVwVXJKYXdrendDK0JHT3dFSWdvSkYwaEZoTGFLUXdZTGUxb3lrb1JUODVDTXBYdmUwcThOWFV2clF6N2FldmpuVTJ5TzJVMlRJU2JDY1RyNXFVV0NxQW05ZDdncWNYbGdmY091N3Q5cG1oVWRzbmFFZjlkYUZVVldYb3JtTkMxZWlpTS8yZjk2OUFMdWo4U0xSa1NTZms1U05hRUxSYWpEMUJES05jSUpXWGZ6U25ZTy9qOXFPV0hLemo3aWljN3lNSU1LNUE1Snk1S0tGZExtRlpXVHNJa1NjVWswVUw3cnV0NmZZallhTmswRFNOQldPVk9sMVhSVVNZUG1rdkZ6S1NKSGM5U0ZRQWpqckcxSTZtb1dNUlNsOE1raHhNSjJvUS9DZ01qeE1iUVFsTzhzdG1iMkVNSmtLbVpWbXpKeVc1RktabDA4RUwrZnJtSkhvVVlrMndXL3NsWVNna2xRalBKM0lhRldCMVo4YVVmUE9zT3JqWVpBSW5xMDZYNW9mdS91cTdOdk50OWxXMzVKVFdteXhHVHBvbm4wU0pxM0dTdlRLZzdZNklGaEM0VExnczhpYWd1aU9sWWc0eXRETk9CMW5iVDdaOHJFa1J5OGhGaENRd01ISzFVeWNKWVZLUmhtaDg4ZVMrdmNXc24vdW9aVVdYNTRFY1FoU05XYzV6RVRqVURLSW5GcDVxNy8vdVFaUGFBQk1GbnlYc0pIRkF3d0JqOEJBQUFFc21qSTZ3a2NjRGZBR093SUFBQVF5a3BPcWJzdjVqUW1UTlg4bHprM2JURlB5a3Q5MW1idVVka3kzM1g2c2F2dXVxcXg0amJ2Y1g5YnZYNTl4OE14NXVhcitMMm9yTGFNUXNXNW9sOGRicDd5bjkvd3Fpem1QNVJvTzIyVyt5V05nQkFxcEVKUlBSNk1wR05rY3FlZW1wV092SEZnMmhFT0Q0cW1iazJzVVR0YUtpWUdQdS9xLy84V3AvdS8yNjZGQ0plRlZtRzdZQlpFSXRCWVM3amE4RkNHbW5FeWtDMVNlNm1ZNFZMR1JTeHVVRlNOc2xlYndEQnlZekNuUUJ6ZjBxQ1VqaVNTWkZaUFBOaHowRURtRkdMbHpFaTV6WWhIVTdkb1d1Wnh6aTVPVWRhcHpKUXZaU01zb0pzcW5tN1BOV3ZUcEZUS2Q2bEhMb05QS3Fwb1NsbFNjNFRWTGtxbldJb2FrZWhzUWJCenNUS0VIbEw1TWRnY2NjYm4vZjJOaHpFTkxpN3hScUwyYzhJcG9uU0FKSHM2UHNzcHhTdng1bmM1OUdUcW8vOVhvc3NaM3BFaVhsVkJVbGNxZHJUS3JZUkhOUTByalVSUThNRXdxQ0FxUUtpU2thT1JCVGtmOWVEb3ZER29VMmhOSWtBUU0wVGtKd2hSSWcwUWpqUjVXUlJRbERzbTlpcU1NTTYvL3VRWk9tQUJReGh4K01NTTlJMXcwbE5CQ05QRVNGN0tjd1ljZWpCQUtSd1lBQUFwMDJGNHdidU9HSHdZSzdTOVFRNUZOT2FUQ0IreW5qdnM1UFVZU1J1ckdKa0ZYdFNNV081QnpTaUlyV01lUkpPaTNCbzJVNUhEbmo2MTNtWm4vVkdwOGFteXV2aUE3ZkVIRTRMcTJlYUUrNy81bC85WmQ3YlJTalRkcDlKUmxJU01RSUhTWWxMTUE0YkM4cW14ajlYUThKa1VsaktNSUtvL2Q5Yi9WMFIxSDdmN3RILy9xSWUvdWpTYWtTYVMvUWFNTVpTbFVJV0FOVVU3R3FKTkdnb2lDT0ZHbVI5TCt3K2ozeUoxM2ZFNGlPRVFxckhJaFVRSFVNR2lCRXhBblFSbVFNbDlreTJpb3FKK1dIVDdjb1Q2RlZ1MEQwVHJrZGt1aUx5a1dycVUzcnE1RWJRRzZtY2J1YTFTUGpoUktvY09VV2puZFhqV3gyVmZNeVF3WGR3V2hGSGYzZ013cW5uT0t4QzB1T0ZKaEFVQklpOTI5cEs0Zzdxb0ZkdWx0Y2JUa1RRNHlrV0doMEpLT0JseEZWRHhmMHhyMFZwLzBKMHNRdGxEOURBa3hUVkF0Lzl2UloyLzFKRmZOUnBFblNwa01PV0FqalNNNmhMUGlHU0NReWpNYWlZUzczWUhrUWlsZU5meTlhV09SS2pmdDlZWVl2R3FXZXIwald0Ly91UVpOK0FCTVZOU0dNSkhISXU0Qmo4Q0FBQUVxbGRKYXdrY1lDM2dHUzBBQUFBS1FnQlVSUGtzS3k3akp5MHFYT0twc2x0WGppMG9heXlvM2hNWWFJSE5tc1pENFdUYml5cXlvMUdwa1cwbkljaEJJY2dHSmxOeVVRa0dIYjkyWU9lWTVZT0tMSTNFcEMzSFIycGt6UExUV0E2aXluckZJN0xubWVZOUhUWElzSHdjMU12Mlppek9rQzIzQno1clhDUzk3RHRMVk5QTnRDbVNMaXhKNm9uZFBxV0VkUi9ZOWlvRU9iVm9PWCs1ZEJ4emFoTWlyWWt1anE2UC9WYnVVWkgvLzM5My9VSGJxNUNkdnVVRlZDNGpwMEZDT01nQWtEY0xoQTVTN3dGbGFMckVRSllvTTJOYURyUU5HSFYxbkpwb09ubVdHRUEyRmhJVUczU1hwOVdhaXFkSmprdFFMNFR0QkhJTHJxOU5ub2pLR0s2bUx3cHV5RlhkdXU5QXFadk9vaHUzS1RqYUdvc005OHV4cEVxWWxGSXpvR0YxUWxHaVVwSmVtRWNVTzFQS0tYbWlGeGdZRXV1emt5Zy8wRXRUUXBEN0dsNnV1THlNVkNvcXFWekpFS3FKVXpBQlNKTkxMclpFNHlBWElRZlFLQzcwaU1hZkdMZlNsRnZrcFZTRVpVZTVnc3N5R0E0aGlCVkJKemxKMmFMdjI5ZXJhL3E5UDFWUUdhRy8vdWdaTmlBQlRGcngrTUpIVkl5QUFqcEFBQUFGQ21USVl3a2M4RFFBQ1QwQUFBRVJHSkhJM0dtZ3RFTGdFenNYTFhqVnhsYXhIY05TVnBrUjFaRndTOWdqMlFCQkN4M25uc3E4dGpyalR0TEg5WVZaMmVsc3U2KzhOUytKVkp5dWNGSEVySXRwNjREUWdxT2tQWEpicnczTGVIZytHaURnYmZvNzYzUUtVak1abWZDS2pQU29qVGRpOFV4cHc5b2VUMXVmVU5LY3JOdUNKL2tDSE84b01HRmg0SkIwQW1CWVdLdktERDVDVEM0d0swOUZmMTZRMm9wSExISklXaW9FV3BwQmJ4eFZCRUV3SUxtVGlxQ0JrOUpqU0lzaHh0S2dFMWlWQlFDSGdMd1VhaC9yL3BwbExrUDdLUHNlejdmMVZHVE5OeFdwUk9RaktvcEtUWEdNUGFhb0lTd2h5Q0pEb25pa3N0dE9sNm82MG1VdlpEVVB2OUlJSmNOckVOMTMraHQ3UktZMG5saElWb3cyVExhNWJVK2F4cVp4R3k4bFJLbmJrb05kZllhOWlGMmhXeGF6eVhSTXNSSzZwQWpUY2NsU1V5TER5TzhRcWJ4anFiQ3dRUGFRcklaaVRZNXlxMzdtYm5JaS8zeWM0Zk9zTHNLSTFNOVVVVUNwWXBlL2lDcWZjdnZzLys3WmxKdWkydjFwOHJtU3BFK2hTV0NsU1k1NzJNajV4cGo2WGUyTW1xaFpvd3R2dVFFOG90U051Z1hiazNNWDFmLzBzNyt0SFVxWWQra2FXMTBzYmxBUXhuT1JMT2cyc0diS3NoZjhDR2JnMWdjRTNXVUp5UU81N3pRRStrcUFaZFVaRWg0V2lLMndDaUFGUktqVWl5bTlVMGtTRUtGRzJnSlcxSTR4RkRLc3FDZi8vdVFaUFNBQkxKU3lmc0dIa0E1b0JrTkJBQUFFNzEvSDR3a2RVaTlnQ09rQUFBQTBrTkRLVEt2VjFDcmFsaUNkUUs1SmxlR0w5ZEwwMVZFbFFCQjJVYkJLaElJU2M1dWVnNFBFbVp2bDZrbHlOcWk1NjNxQXN5YW1sS09UdWcyUnRVWTljelNadFQ3ZWVIQ3kydDdTbTc1ZGw5alA4VUk1WXBZMllRQW81d29UYzFwVUdENWtTaXByYzU2eC92YXhUdXQ5dW5vQ3V2WnVWOGN4T3B5RUllblJsTE9iclIyLytrRFhSVm9WSFNySHkraFRWM3c1aDhVR0RFQlJZWlFJdFZGV2ZObmJpNFNYVXFaUTgwTlFXSWdSTm1CU2dRYVVFSk9TV3dxY1dvbkp5SXh0dWtXYVJFeG1LVU1yYnVlc2U5NVdiUXlSb29JMzBVWGJWOGswNjNwS3B6N1d0OW9Ib2lEV0JLbFExVk5jdUxWSTdyUnNqVExIc3B1WFlkK1Blc1pOZHpPbGcwK1VjVWk1QlU4V1pxMHFXQzVuZzMzNzd2OTRmdmY4a3o0aXRFOHBLaUlRaE5vZFZwUExDTEZtVXZ1VWkvZHQ5bHdUY21oNmUzcnhQK0FIMGFhL3U5dnIydmw2THQ3R2YvN2RBMEphVkpvcTZxckJneVIzT1JnRVFHRnB4Q1ZXVkRxZzVvT0tzTWsyL0xzdzh6dC9acGtrSklrQWdEUWtGQ2gvL3VRWk9RQUJQRm9TR01KSEhJeTRCa2NCQUFCRXQxWklZd2tjY2pJZ0dOa0lBQUFvNnlSbXoydEtreDgyaGJNclVnZ3lsNndwaUNMbzJRazJsN1J1cGhUSnFxRWR1eUlTeUtrcFFOZEs2bEtRS0xpRUt3NHk2Q3diT1I1N3B0QTFReU10TTVkcTJoMEdDQ050RXYvZWhyVnJONHNpRytIWlJXR0h1djFUK1BnZWt2VGE5UTN2V0dRRkVpMUVqR2lGMHMvdGdVNVMrZXp6Zk5WUXhVQmhJRmhpVHRHUWRDK3plNVRiV2g4dU1Na0RwWXlKVm5DcGRsSkVKTXB2ZFNuclNiM09icmdrdk1hSzMxcThJbklvWXU4UzRJUWdGYk9oN0wxZ0ppc2N1V2ZZZGl5M1psVWhnU042UWtoTWROa296R2M1TUZqK285UjFUS1l5alVJM2VCcXZKRmNKSFJBeUowMjA2MHFhekNrMk9oZlRHTEpCcVluWVRVZlNHTHJCZTNaaHV5c2FMSENCVUNDRGRhNHMyV3dFTkFnSWhJQ2dxdWJaOEk3LzdKSVFSUHJMbm5JNHNQSmxoeGlDUmdmV1hoaXVlWHJvQUw4NzNtdk4rdFhPaHlTb2lTWEhSZ2ZpN3pacXVzbWJlalR4bk1Yc2FpTENnR0hIZ2RkN0paWDlHdi9wRlVMWCtsSFUrLzk2cmFsSWtKSGgwWlVSeU95TklBQ0hib3pqNGhaLy91Z1pOV0FCSkJPU0dNSkhGSTlReWo5QkNOT0V4bHRJNHdrY1lqSEFDT29BQUFBcVZZWW9MS1I0akZBVEJoQlFiMnF0YmF3RlNJbUFJczhDV1JPVG5ZRVJBbXFrVVNpaFhFTHo2NXhBc3hPYUdLS0tPVUt4T2RKd214YzRFY0cyTVpTdS9FMm9nZDdEU0VxdUdGYUFEdXlLaElKV2pMWHVLUWlTc2JSRnVXWmJxMGhLalptYnB4czF5Syt6R1JkWGtQTTltVTlRWVcrUnZEcFVSQ2dYY0N2K25ickdMdGRzR1FEb0hLMWdkZzlWNklXT09EdEFvTG1KRVFBbWg3LzRwVlNyRmFkNVl3STFVUE1JOTFGcU5uL1RyclJaL1ovK21LeTQya3RVcUo4QWJ6Z0Z4cWtRcUxqRHlVV0M1YlhVY2tlb1BVbEtYVlY0dzBTVVhGa1RrSnhhVThvbWlDcDFkdG03RTR1Mm5DeXlRY3hkVDFwaWFhZVpqcTkxRGc3M2ovTUdGRG1seGUrb2NiMTFkNzhYdHVOcjNyU1cySUNzcGlJOHBlVi9pTGlrV0ZwL3Y0eGZHdnVIOFBOK2FudjZhKzZWMWZPcmZIK2JVL3BTbis4ZWIrMzk3Njk3VXBuT2RYbnV0RFdPZ1RuZUFwNkxHSHBvRnJ2OWErbytwN1YrdVE1SlJKSzIybVVpWWpIT0FVZndvWFV0TGdjR0x0azZkb3F4dVlRei91c3BVMDB4Vlg0cDlINmZYc2JhK3pmOXE0SnBaazVkSWc0azVhL1A0YkQxU0dJUkRhd0I1VitiSWZoa2FadERGUVZNa0FES3dNd29oTUxDZ01TQWdHRENVeVFIWEFaV0hxQ3AyQ2pFZ1I0SU5HbjRwWUtBVmdIbmhGUkFFd0VRcFV5Vjh4MUh4ZGc5UitCLy91UVpQdUFCSkJkU25zSkcvQTBRQWpaQUFBQUZRVnRJWldIZ0FqQmdHUTJnQUFBTG9ZTmFyaXIyVUNMeGw0d29SZXlOSmtBTEFIaU8vSlgxanJjcVpUVllyc3lacHJ2UytrZFYvbUtOTWw3T0kxWFljL01SaHFmb3JyaWFaMHdCTG9JU3ROYkx1QVp6dnUrdXhqbHB5NEZYWXFSbG1WNlYwbFBiaGtPazBGN0Z5TzJwUmNmdHVkcU5PcytjTHRUMmNFUzk3NjlLL3NheTdXcVJpV1o1Vk1hR21wMjVxbjNMdXY3MlluTDJVTVNlcFh2UitmbHQyeldwNmJ0eTdOdFBMV0lPS1dNWGVCMUczeG5JbG4yTHdYSHFrMDVVM0FzWmwwcHBhYlZEVjVNNTJLdEpMcW0rYTdqbi8vLy8vLy8vLy9iNy9md3p4eTV2UFgvLy8vLy8vLy8vM05vdzJoSW5VMm81WEhaSFczRzBraWdDay9UOUFEckpYRzYyR1N2MW9lMzJHTjdQQmhHTDNkNzFlMnhaQjBUYyt2RVB0SktFeFlTaFFBQTBFaG9SS0REajFBbkZpMXppWVpYdk9zM3VsR0NuL2YxTlhmV21LcmtBKzhVVTFzVy8vLy8vUStsRlI0WjFaVmhrQlNDVmFPMDJ4eHRzd0M4V2xuNENuU2JCU1FZUW1acytaQW9aZHNaNHlIZmpQQlFLc0ZqSmpBSmR3MXFNQ2oxTkM2ZC8vdlFaT3FBQ2QrRFNuNXZCQUpmNDhrTnhKZ0FKeVlqSS9tc2dBRnlqYU96Q2pBQWtTTEgwVDFYZEpyOEJvSkdVS1BzUE51czU4MUgwaUZxdVlyR21xbjAvb0cvTllaVEJLNWZrU2ZwakVtRlRVRGwzeE9IQ0VZU0ViT3h4MjRNWmxJMStUTlBEanlYTGp5Uk9mZ1ZCR3VORk5ZS0djM0xrYldKNmxnRnBjT1N0OTRoRDYxQzJhS2J6M3ExSkJqdXZmS2JNbmUrSXpjVWd2Q2ptSWhFNTJmYVdzTnBUZDYzSFp1N2NHeHF4Y3hwTzR4L0dVUS9qTEptVVY2dGlWeDEzN2NsZDl4NEVmZTNTeHV1eVNTeTJBcFRVclRGeCtvZXNUL1o3NWl2cUQvcjZucGJ5bHFWYzZPd3p0cXpTMnp2eGRoYk5MZHFrazJXVVA1ZnJYTzZ3L0d4ei8vLy8vLy8vLy85NWYvNVphNWh2Ly8vLy8vLy8vLy90eWlrdmRxZDUzZmZ2RUtNdG9zdGhFMHpTa3FDQTBXaXprT2xGa05SN3c3UXZjbnAwN2VGN0ZEM1hKRHhVaXdHYmhRbktUeGN1TklyUVZWUTUzQVJBZ3dJam1ueUxXSGl4SXpPc1l0SXN1bnJHbGt0UURJSGVnVzNWckxQN0VYZjdhLy80NUErNm9GcFdXQmlBd0FDQUpNZ1dIQW9DeERBQVFiYUcwZ3NyTlFpTTAwQ05ZSkdnS21ESElOQWlnUXlSTXhxTUFLekJDeEp1SkZRSUVBaFUxSkFjQUFJTVdxSEJKYTg0SndCRVJZRWM0N0loMEs1d0pJQTRRS2pBVWlNbFFUR1A0WklCcUNOU3hWQnE2SXlTVG53RW8wSkRSa1NDbHNTSWl5RXgzbVZyeFZ6UlNWMWxZa1JCd0k1Nmk2Q2dCQ2p3SUVCSjZOTyt1eG1Eem1NTndPZ1RYeXRCdWJCU1lVMFp0blVkVlBSeWxCSWRaelBUTVFsMGlhM0RqUEoxcHF2MjZ3VEZlSThvMUxHZEtta3pnOHZ4cVd0YmdpdmNzdXEzSnU4YXBLV3BTeVYzcGZIRzdTNTNYSm1ZOVNOVWNSZU9NOWpTMlpmQTBKbFR2U21MMDFXSnRpbGtxaU1qdTNyRzU2dW8wMmk4MmdRdy9rdnJOTmZDVVVsdjVURHp3eXlCYnNyMU42MUY4NUhsYjdoWnczamMxelA4TmYvLy8vLy8vLy92UzJlTzJhWFQveStWYnA2WjM4V0RieGN1SmNWWkNtbXcyMDNDb21rMG1pVVJlc3liNm54L0FkSXRKT0dubzhLR1J6bFBhd2NvNlJTK2dWTmk1MVN0NHFIdzlZb1VNRllOSHljSjB3VmFIVW9hVkNnb0ZFQlMwbFBPclo4YXVoUEZWQmcwbE81My8vU2hzMHVoaVlCQjFSZW9zU09mUXNVUVRIc3BBam9ndXBLc01Fb2VxbTZqN3Q5SS8vN3NHVGhBQXBXZWtuK2EwQ0FWU0NwSGNZQUFCUjVmeW5kaGdBQXFvQWpwNEFBQUh2RTFTVEdSSUJGa3dxaERXSUpObmthMnhpb1dweXFjcGRZUFJKSm9rMWZyNzErN2ExcnRacnRaNlV4a3RQYUgzeFI5QmVBNXptTmZpZmQ2N2xsM3N4MjNQLzNXWURxTkQ3cTE3OHhkYTJkMGY3ZnFYcjFQeTJUUFY1bWxvZWl5MDg3MC9lYTUxcVUzcTNwbGI1T2QxUDZqbWI5cGdIQnNncFFQRksrdElvcjZWRmRQRlRVcXZla0dSSVFiU1JJcnVXNGZVNUR4dDdNaDk5TjhjaTVSOWRhVTZ2dDViL1VqLy8rMzFwcWJtMnNLQVNaYmNZUFdaM2w3eVdSQ05pQU9JQlJJQVN5Q2RBek5uakNWYUVzaUtoTUlDNnJUMWVYanBjaUdncms1TU9pdFNTMTFpVTZXQjFaTW5ySmVxdXBCZFE4ODAycE54Rkp4RmpieFpOWCs1cUNQSC9hc3ViTUQxaFM1LzFYTHFzVm9jMHUxL2JUZTNLN3JjMnhqYVcvbWltalVlWUhEOVYzV2Mrc3pmWnk5WThycmtkV29YVDVkQ1l0dVZZZlpoaytLc3VyU3ljajBQTUVacVR6QWVSSkxVU0VRVnd0TFR1YkZIemo4VzVIV1hnMktBK3M5OFBHUkduYm8xVzFFMGs4K0xFR3JKaTRMbkt5REt6eHRESEx4VmhYWDZhaWpiUGQ5VmZzLy9kdHQxOVg2ek1sZUNVMEFmdnFqeFYrRlJEc0IwREZRY0JaeGdnRGxnMmF1SHhUTmpNS1dCVnZkNWZFVWhBL2d3SUFLVlEyd084QmtzSVRkZnd0Q1RUK1h3bDA3V3ZLVGw3dXNwb3hLWWdweUNPM0tPTmdYZ01yaSt3T3NndDIwQ01kSTZwSzFySFBTRG9KUmxrYWhyWHBzMEVrMWMzektTdHBkVnRNVEx5eEM2bHE2azBCOEtucElhTG1hQlRpU1NIMEdTc04vblpwL3M4Ky8vLy8vLzh1UVlzamxiNy9xaE5MaXhoaGRMZ2t5TVhDMUtiTkg3MEw4YlJRdWhYMGYyUC8vL3VnWk5DQUJkSmx5bXNZWUdBcXdBa2RBQUFBRTIwcko4d3hFUWlkZ0dSd0FBQUEvOTM5K2kzWnJqTm5hWFZFQWhSSUVvU1NCWm5BcUFjNEJRaE5Fd0N4M1FZbFVqaHdRalFrUXhaYXF4bERtc3J1U2RML0lXU09PaUpGYkpHS0Z6RFFrTVV5VE9heGExMEZadHdYMUpDSW1hSjBOeHhhbDdZVjZpeWpXd1h5RkRLTVlKcXl4bHFrTDhqc3FlUmZxN1B1eXROV2d1WlhxdUZ4ZGNuSjNVak1vaGFYcEhTNkRWZUhNajdUV3NSQjVCd1VUWHQyQ09STkNmL2dVcnRqY2RqVVRTY0xKQ3dISXNPSFRFT1V1WG9SZWZXWkxHVFkyb2FNNnZMaWdMTGJGUUI3Mi8vekttTTdOVmRmSW8rMTZHcHYza1VHNDQyMmdsRWdxSUJBZ2RRSFFhTUtoQlZnSUloVW1MR2tZSXhJSkMwMklZTzVBS3dNSnIzdzA5bEFQcHVUbTI2SWxtUFlKOVVOaUNDQVVrVm9WZmFyNXhqMWFta2t3dzFDa0NyTitFNEhab0tLVFlXeEtTcDNNS2VEUkREbU5sbm1iQk1sZWtUa0p4anhKbUNwMndoMEtwUzRha2JRMUlXUnpSWVk2bkEzSlFhNmxnbVRDcHNlZzZuZCtKY1l3U0w5Mm4vbnd6REdESHZ2Tk5Ib0dLZVNPYklzeHRZUjY3aWFhbXlLeG42S0YzSEs5WDd5UFYvN1YwbCtwdi9SLzFVaVJYaEdVeVdXQVdzRE16VTBaT0pLZnN2U0Rsb2RoQkpaWUpFajBtck5PbW1ZNEFEd1FXQnlFd2xFOG5uemlHdzBpYzBxdmxheGRWSGRzVzd3TytIQ3k4OWJlNi9lZHN0eVNwWU1kMmpaV2RhUVlLTm0vL3VRWk8rQUJJMWN5M3NKSE5vMFlBa2RBQUFBRXdtWEo2d2tjNEN0Z0NRd0FBQUFrTHN0Y0kwbkthZitKSFh6TG51Y2g5VnVQL3BzSTY5TjVuS2Q0NzU0azB4L05hWTBZYjQzZTFaRlB5M3FkdjY4Uk5uN0VJZU9IeEtOTkZ4d0RMazlnMVZDZTdXRUUwVkNtakVra2dDNHhLUW1yRU1uYzRWZlFXT2V0Y3lseDhKbHQrclpmVW8zbWUzVkpCWkZEQWJRNzdhTi8yZjF1WjJwSmh6N09SRU9KdEpKTTRMMUFyaTFRbTBZQ0U3RWpnYTZvQUxCQzVTcFdoZUVUWTQ1elpXK3BYMWl0Vy9NMDJFWnJ5SEthczlsazFCYjl1cEI3NlIrSHBaYWlFZmpUN3RPZmhkYTdJYXg3SHFMQ0NTcmNUUmxHSkNOenp1eWtwMVVYMm1YcUxzUU1haGxjTHJHdHhOTnJVb2dsY0dSdXNPSzlVMWdreWxJdUNDTmJUaTJNdldseXRsdWZrS3hZbko3OGtxakVqUUtHMXdjUW9VTWthbXJKYVgvUVFJbW1VcXFWV1oxY1FzUUVqSzRsaDlFRzV0U291THlub2FlTTBhdnIrMm1qUlg3T3BMS09XeWpKYjFiWHArcjdmOVNSMTlrampTamFhWVpRUXhBNGhFTTNCR0hHSVRWeEo2UWdNUW1rbE15eFd4b0RlUUlDQU5BT0VCTWRKQUhBa0lMLy91UVpPa0FCTWxiU2ZNTU04ZzB3Qmo5QkFBQUZEbDFKYXdrZW9ESUFpT3dFSXdJaDhCRWE2c3djU2F3bEhYRnB6aEcxMVlKTk1XOVpHSkJ3bEhUNHJGak1kNVdtNlJ3YWJrUkxTQVJJY1hRcGRSaE51S3FiNm1leEdjWDgwSVdEZFJSVU9xVUtKTXlFR1lVUUM4Rm1SLzVHRnF1UnlNUnJUVTVURXNjWU1oakVINngweHFuU1U3QkxETWNDeFRvRjdOaTdURURpQzJiYTJKSm9rcHpJc1hLaUdQZWVpaGc3VWxsZjE2T20yenFzL1NKZjlOamRHMitqMGF2OVh5dXpwajIrY2pGVitzRjBoQmlidG9GVENMaEFpZ29SQmdJd0V1QXBSQU1qMVR3dFJSbkRldFVsczdFWGtqVkpBaDdYMFpOeEE0dm1KejV3Y1ZxZGtwYXUxaytXTzJZcWxjVnJUaGU0MVdDR2tzd1JRdjA5WXZPR2l1WEY4R3FQWldwRmFBcEpSb0U0Y0IyUGhhTlRtQkNickJWcmswZGJPeFR0ZmlZeXRoMURkdlhQL1ZESWt5V2tWSmxqcTJna01hVDMrSzBNWFBPVVJHbHl3ZnBuUkJFSkFFRm42V1A2azExVXRxSU50elRaVkdyQXpRcStUUE91ZExvWVI2L29JQ3hvMUFTUDVOZXVwWC9aUnVkL1IrdisvN0xlL1RWUTJlSVJFVUcyM0VrdzRJQS8vdWdaTmFBQlJGbHlXc0pHL0FyWUFsTkFBQUJGTzJSSTR5d2M4Q3RBR1B3WUFBQTBHd01KYkdRU0FuUUlFSE9scXpERUhpaXlqU2t3M21sREZJZy84ZWdkNWx4Z05BSVpZN3lxRSswb2dXTkQ1S2pDejJFY2oySStaUXJRd2hEYjJSekhFcXJuN0JpYkNOdkNTY3cvbjFWblRaS3hCRktXSUNYVVNHYm1jaEFueG1ua0RjM0lXRHRJWnZ4bmg5N3lrNU1EelRhRnpJbjJrSXl5bG55MDFiNVVkWll4TUpkS0FSa05vanlJNG8wMjM2L2taWHRhWVZtUTRMSVdCVklBS3FWdWNIQ3p1ZGdXdnBzUkpOLzYwbE5NZkRPdEtrOHBlaGYxVHIxZERuZFNQNTNZelNKS2tPaW9CZC8xU2toaElmR0xRQXJnaUFDd2FRQXdXV2hBVFFWQWdZU0tVRWlERDZWL29tOURXRVhQb2cvWTJURUoxQUNTaDRrSHBrNHZKS0NRZ0hTaGd5aURVQ00vU1VZcURPNGlaSm9LcVJUSW1GY2pGdHVISzFOekNpMXg5eVJLVFc2bXVrQ3A0a1FlUFhWRk1IZ25CZVczRld1VDZFUWVUenpod2M1TGRXVGJyZkY4bnBMdXdrYkJkTXBPY2tuRjdTVU90NWxQL3E3djMvNm5WcFlpNW1VRWhrWFNJem85eGwxcmtXWHVZdGlCeTdwbXdDSzFXaE0rK2Y5S0NwUStodFFiaHRlbllQdFRLTzZZL1FPRjA3Ly8vL3Q2RmZyblluZmYxT2NZZlVZQm1TQ0FSUkZkVEZMTkF4cFphQnJ4UXR0MkNyQ3YrakU0c0RpbWZZRUFJMGhLT1VKbytMNXdYVXFVZVdpazI4VXo4S0JIT0dsZlJMRmtrN1VmVmtxUndzOS8vdVFaUGtBQk9ob3lYc3BISEF4SUJqcENBQUFFN1Z0STh5a2NjamxBR05rSUFBQUFpeFowSExtaUJ2U0pjcm9udzA4NXpaVGk4bFRuM2FjT3Iycy9JcWQ1MmVmMitmdDluSHpiOFh0UDQzZHk5NWx2OWk2clBpS25rM2dkQUtEaHhVYVlJQ0kyZytSZVRZWmVtOVc3dnBhYmFDWW4zVlNBTXNVYXQ3TERKT3BDQXdQWGFzYXd2N2lpYlhWWmQ3K25WUkRTZjdDa3lMbjZUVjkxbFZmcjBmKzR0NzliTHQ5clpwdXFnTUFjc0JGQkNqRzluQ1lBY3BZWXFqUnBGUmlJSld1V1Fwem82MlIySVJFcEE2dWhCczgyV0p6d2tQR3hFMmJHUVllaUpsUGRKZU0xWFk1Y1dNd1puM2RkbFFmQ0FKbWtYTUZNQ1dwem0yODArQ3NPMkRrcmZjMUhNeU1jMU90TDN4ZDh4OGRzaWNZRFhiWHJUbjNYUUt3NHpTRGxRZ2Zkc1ozdTlLeHN6dHJXL3U1YW4zS3RybDc5Njg2bjQvdDNKUlgwbTdEZm0xMyszdjRydGphejJxVVVRSW9zUGxqcWdVQXBhYkYzSkd0YmtrblJicGl1aityTnpHcjNNdXBlMy9LYTZ1cEZqbENsU2YvZFZ0cStucHFNVmhtVldRMDBrNGtoc2d4MHdDSmNNaEpBYUNvUXdFSUpUYVVISFJFbFJKNllWKzgvL3VRWk9VQUJOSlZTV01NTThBMElDajhEQUFBRkhXZkk0d2swVWpRQUdOa0VBQUF0TzFTVlY1WlhpY1ZtUTBMS0xFcFJFSjJrWkF5VUpBY3BvanBFaU92YVl0MG1WeWxwUVJkQ25TckUwbTFXbzdzMThsVDBzdUw1TlNlcDNia2RidGN4S2VLc1JJZlh1TFRZaVVJblZvcWFXd3hUSEk0cTBJaGhvRlZtd20wTlZxVndhS0NmQzErNll3U0twSEgzSlVlQWpTaDhXQ0lzcVgvZHR1UXhqUE5iU0F6SU9KWFJKTTRhZEhMRnk0MVpoNGFDd1hZc290Szc3NzBHem85cjdST29ibDljVnFwSGYrdmZvOUhUL3NlZCsxRGIyV05xTnRwSkZHeENFWnEvQTVldVpTbytoRVZKaFVqZ0p2cDFRRXZGb1Q5Ung0N0VzTlNLQWlURFFVT1ZNUkVYd25HeXhQRVFFeUJWSVEzakpESWpQRjExOG5tb25UWk5QUWxVakVZc29UeXMvVFMwNW92Sm82VTJQdG5rVURoc084cTVxTUREb2w0TXNNTUNUaWJpMzVZeTVPc09Kem8rVzFCUFJNWlFSVUlhbTNrRFEzMGM1VEhmVWRpbEtsT1J3UkVNR0VibHZRRzJvRzVrWEJVSUlPU1JOTGJJZlJkSURFRWdGSWFhdWNwYTJZdC9wNm50cGZTVUZDYlFNMldJRFVuZi9yZDhybDAwYTlILy91Z1pOQ0FCUGRYeVhzcEhQQTFJVWpaQkFJd0UvbVhKYXdrY2NDNGdDUHdBQUFBMHV0N1hwRTQ0MjBtZVlBWEFIWWxwbW9DNlJvSUxCQ0FkNXkrS2dhVXJjbzBvSTR6YUR5T3dWSmlPWWdnZ2xqb0xaVlhJUjVxZWViSktqMGFoN1JKcUt5alZOVXlKNVdTYUpiMFU0SnhQTmxrRXBvN0REYzRldTRaSjdwaTdMUVdQdmc4OXo1dFpNOTI2NXVHVXY3MzFiVzE4VTlsVTlmbDNVMU4zdzc1dWJheTkweHVwdHNQWFIvZnV2VXBpaURrWjJ2ZlZSTVBtM1AzVHUzekdtNWFqa1hsVzJvUlJDU0VNRk1FTlJucVpESzBKTVU0bW9rSE1wVmVQT3NwcHVZY2FmbVc1TlExcTFwdTZ1bWNWcy8wNlgwMDBydnMrejl4VVFDYnBDQW9IcjNsdGtra2tZQUFpb0dpTXFNd0h6R0FZSVVCb2ZEajh4ZzRONVBnU2ZFb1lIRElRVG5nUUp2NkFFSDRoRkJKU1FtblduUUhEREVFc1dGUVVCdm03NDBqbVpsaHJRWkMyS21OQTZWN01jMU96SHdNa0lqT0FBeEVEVGtWdEtvTUxBOElaMG1lejVSNDBNN0NnQS9CVkRBNHNNQkFJeTZVUExnWU5ZZmhzVC93K2traDh4TXVnb3MweHhsZzNPaXp0VU11ZlI1WDJpOHRlcDVZNVRScGxqZ3Y5UVFOQmNQdE9zdTFWY2VtZnlpazBpZmVralR1U2VHNWRmak1yZldVMTY4UmVLT3h1Y2h5SDY4Y2hpVzBVZGNpT1FKR1lxKzByZmlta2NZdFMrUlNkeEpWUFhwM0IwOTh0Ukttc1RjUmxVcmtNWWhGbXZSV0xjTzAxYVh1L0k3Y04wOVNibHRuLy91d1pQS0FCVGxvU2UxbFlBQXZnQWo4b0lBQUovSG5JN205Z0FGaURPUzNCbUFBR2p1U0dtbTV1dlN3N3VtbkoyWnFWNXVwdjhQL1dINGZaNS8vLy8vLy8vLy9ZN2QvdXN0L3V3citVTm1CS0VnZERpZFFkTG91UXNXY2tVamtUalRjYzNGUFBPUkdVOWlpOWgzc3R0cVA4MW1kMmgrN2Fta1lQQnV0QkdKSG9DVUozdldRTVRnSUFGZ3N5TEdnSXg0VUhFTm1wcVJDQWtFVkRqWW9QTjNoNVYzcUtGcDE3ZUZWUzdoMU1FWWdCTWhVOGV5OU93bE1WRmpJQmMwaVlOZUVRYUFtckZnT2RqTlI4NHlzUFhoakcyQTFZVkFSSVpTTW4xRkJpb1lNSjVoZ0lUSUFRSFBHSkJnMEd3VEJHaG9tcGdzSUVGalB1RDRQakdtQUVOTmduUlhGZ0RXSWFNcTVFSTl1SVFERkF5UWhqelNSeFdRWU84aVhqNkdmR3RDbDhxY1F0NUFsaFZKUXFGUDY1TjZtakt2RWVua2pVQ08rdXhwTHV3RFNXOE01Nml0d05CMkUxSzZaMEZ5V05SK1dTUm4xRzJ0UElwVlAyN0dkV0gzN2R1ekFsaXgxcmtUclBCRW9GaDJVNVUxek85ZnM0V0xOclhOTWtuSW05bW8vblBSK0dHY1JWN0ZCb2pFNVhSVnFrbmY2bDUzZXNjK1o4eHU3d3dqZG5QT2txNnd4N3Y3bmNJVy9VRDFwWHUzelB0WGU1VFNXZGNyU0pNY2YvMGYvOG9WVUFVQWdBY0FjQWRBNm5rQ0FBQUFBM3RtNXVrQW82ZmF1K0V3dTJHZnNBUTJjQTdaWXFoelRhaFVqQVR3T09DcXlKN3AyQUF4T1RMc0VSSTlSc3hDbzJBRWlJa29FeWd3RXN3dm5NVWhHRklZdk1PNUxyR2hGbVBMbXRobTJMbWdxR21MR0dkSEtTRGhZd2hFZVJnb1lPQnpCa2pOREJBS053NFFCR3VYQUpZOEQxZzRIRVRHbVRDZ0FDSkZBU2xvUVNBUm9DR1RGZ1JZbTBWVENmdTUwejhzd3JLUHRzLytkMmNkeVJTSC8rN0JrNGdBSXNtaE1WbTlFQURQaDZhL0REQklmRFo4MGZhMEFBSzhBWnplQUFBU2taNDhzaGtmMCs4Yyt5dTUrOS8vUC9uL2g5UEw1Zm51dkdMR0Y5Mkg0akV0bzZsUzcyN0s3ZEpNTmZ0Mzg0aE9VbWR2NkhmY09ZT0JCYTc0eERGZVF5ZnVQL2hGN0Z5NWR3N2F2NytMeHZiejFaWlJReFhsbHVZbG1WU3orV1dOemVlUDc3ZjFZdDg3bHpQZjZwYzZTR04ySTNGNlMzWkJQV3J5NGhXQktIQzJpb1hOZmRnUVJjTGsyejdFYWdnYzdjZS8xL3hYNmE5UGNsVmxnOU8zZUtvckppd0ZjK0h2UmNsV0JBa0FBQUJYSlR0dUt1RndJZkRXQ1VVcUhJTW9NVFZneTlLN3k1cmpQd3lGRmxLaFY2RTBFTGlTSFYxVmJWeWw5bmlGUUEwQ0d6VmtaelVkVEd1MWhsME5VaENLWFduNmFTa0ZjclFCSUxuZitabVIxVWVrNmpoeFV1dlRxTEpYNWVxMmNOOHQveWV6TzBIMHBWWG4wME4yTnRJdFQ5YkpJaGJxN3JQZmhmOURhUkJSZEo5Zi85b3pzZDJjdXdQWFFFYzJUZk1objgvR3hvblhiUGV0clBHZkhqWXV0R1VxMVhnaW0wVWlsOThBQ0NMRHJtM1d0c0VVUzlsUDdhbVcxK2hVYlYyTFlUQ2tFUUNBQU5yTTR1VVRQa2NDWlJOZ29kQWc2VU5DTTlRdlJtWS94UHRSNXZoMHBXOUY5cjZxS2FhN1VBYlNvc3BuT1NLQ0JVMExpZzBWbDYwcTYybndicktXSHlXUzFpb00zend6VUIyYlZ2SGRHRkM0TmhQb3FKMkg0aWtETFdKZG9idHJpanlYeVJZSkJacGFkdk9vMURZazJobTdUaEVoVjVFZi8vL2V6c0xFR1ZuLy84VjJPeG9MMlUyRmhSREJaVzA1MC94ZmllNmFHL3U5R0xiWWNxNjVVMDFyQWEwd1NZYkRIdEFBUWlRU1JUWTBYTDJ4ZHRqVDluaTJoZ3BxNmpQcVZnS2dZQUFBZnllclVCMVpGbWFLRU5FZXdkTUQ0dHYvN29HVFJoQVZOWmRKckNUYktIMEFaM1FBQUFSVDltMG5zb05xZ2JnQm02QUFBQkdSYVVXU3VSNEF3bWZPT1dDT29PamEycGlaeERCRXZtd1VhZjY2VTdiYWQvR21NMmpMdnZxMDE0WXl4dTVibFVqU3h2VGxXUlUrZjVwUXBPejhxYmJ4SVNqaFUyT010VnJtMDUxdDVTOWJESmhnVitCTzdmLy83cTdsQmYwbHRhdzA0anV0L1g4ZmVDbE15TWd3Zk03NDFlU2JyZCtOVXlnTEdoZ2RPb0RMNU1TOG40cmRxUDNzUDVwRzNkWWRwcUF0bWtoS0wzMEFMYzVUbmpqeWx3cFd0ZXNhdmQwSlJ2L2NyejRyWDBWekVLd1NJQUFFMWR2akpVaVVnNlVZVTZKcUVKaXNDdHcxOTlub3V3clNaSnRTaTFEVEl2Wkt4SGtOTzQxbGFseWpXbk12d0hZSlh0eXJGVTZHR2pKQmRuYUlpcGRhWnB2dkdvd1JuREVDR3BKd2xCY0l4eGg0dFh0VVIxSDNkenFZSVF4b1p1ZmlrOHdsN1pSZVhNRDRRUWpDbjFva0RFR0lFUWNPVUlRZktLRVRQVjMvZm9wRndENGhsc01MYTc5MVNyOVkzWHJWWmk0dnM2dFJlNkZRNEhIUVBZTkJrU1lwK0pJUWhNaXhKT3hOdG1vN1IvbzcvZFloRDZYMVpXaFdsUWdnQUFDenVYdDFIUGxKSFFKeXArS1lqQ2lnRjhtbmJhbkdsWTVsS0s4MnF3SzJIeFpBdStKMEM0cFZTUkdFU1ZNQmVRakZsQTB1YkRQeW1oWkpUTlZhTkJyZk5odTc1U1phUU1OckhCVVpXSEVCSEkzbEtkZis3L3l0VFdTWTYvZXQwUUlLRURkZGZicTVYN3AvNjJxTnJ3SkUxRmYvN2tHVCtBQlVzWlZMckNSYmFJQ0FKelFBQUFSUk5uVTJzUFF2Z2NRQm5OQUFBQk4vcVNmeFJVeVhrUmhrN0ZldkNOVE5kODJvcUswSHBvVUx0RGJWLzZQU0Y1eGpUekdhd3BQMzJSY2FXRGNhU3BJZXdZaEUyeTU5d0FDU0pCS1VwUUxLcDZ1aGJGL3RXcWxpN3A3dEpyb2tNeE1nQUFCTm05MmRtRWhrUzFPd2VpcExCd01rRUZweVFPSEFucFVxWTJvTXZrUUFvZ2I2b0I3YUNPbzlPdFNJYmtPWmQ1UXNnZ005R3RtakNubWFWTm8rRTRqMGN4TGRiMnhYRm9ObU5jdldKTVVVbVFqTEQ0d1NPa1R6amx2L2VUclZnUVV5Mml2cnE1MHFqTzdxQk1JQjVRaWk5VFBMemMyV0hZUGtnS0NPN3ZmNzNmelE1Um82UW9IWVVjb1hCV0x2TGs1YWpGYlBpcTcxZ1llLzNSYUNLN01lNFNDQ2NvNWFndEtJSzJnQnpuRGx2VzlseDJ3MXRzMkcwLzBhcmZkK3F4Y3U5ajBLRWd3QVJBQUFFL2J2SGlncGdQMGtpaDZFaUZNaWlTckptNEJFa0tSV2lXcnRyRi9WaEd5UHNtbEdDNjBpaHFHSTVMbnBsTWJybGdOZWlqc0tsME16anpxZmNmYkVJQ2ZhZ2l0MlluMTVxR3BhT0NVT2VoS2VJWWVxZXlyeTBqN3BrdUxpeUlQLzdrR1Q2QUNWQlp0THJDVWJLSEtBWnpRQUFBUldKbVUzdFBRK29kb0FtOUFBQUJFWVZEYnZ0RXo4emZ1UXI4SEhCQ09nNFJuLzRhTlRoQVBMRWxEMXVmM1R2OWJ1YnNXQmVlNE5JRnBJWXJXSGFHZTV2V2s3SFQzendQdWFaUTlzdytGalVBMmpBMXQ0QUJqblBlNTA3WXpiYnNUUitqdFU2aVBxZS9aL3Jpa1NRQUFBdTdXNnZCalJGRlB3SldWU2xRUXpFTEtXQ0MwWFlMOXp5NW5FR2N6Zyt6dERYa0ZmSzFYcW1BZVp1d0UralJIUU1odXBoWHR5ZU1wNlBpZGdheHZxZy8zRnZnWGk0NzdHb0xVOWZlYUErY1NIR2tualBjbHBwWnRZK1RxaGJCb3dldGZEOXE4MlRaRTlLTXc0c1FjdXZuNCtNWWdoRmh5UG52K3kvOUpxQkhQdWFFUUZVQ2NPQlJCa083Mlc0dmFHSW1ZaGszTHpkM1FwMnMxUThVSkl1VkZJaGtxRnJhZ0FLYzliR3ZZeHJROVMxb2swcXIreTdvOVhkYXFweGtrZ0FBR2J1WHRCRk1GUTZmWW5LS0ZDRmhEY1hnakpEQzZJdWgvSDJWdXFsUmF3TzZ1WlNrWlRFVmljZ3BxNUtZUVd1aHZ0WjZ5eXJDNFBCSVdJeUxBb0ZSUmwxZkgzYWpCQ2ZaZ3haSStXbTc3THpXOGYxekxuZGFaeG5FLy83a0dUeEFBVWpabE43TDBXYUhLQUp6UUFBQVJTeG0wMnNQUTNvYndBbTlBQUFCUHhseWRQcVFxNTFqZm56L05tTnYrdFg3T3dhZVV0djd6VGRkNXBQTmVNMVB0NDM4L0Z0WHpqeE1XM0E4MmI3alJKc1dudHZHWjh3ZHZZdjFhdmh5UTl3SmRZcFNQRGxiOFl6ZXRuUWplMVNRVXk2by90Z0FLcFFoVmEzTHVBREhXMm9SRW5qTC9zL045dFpBYXk3Tkd3QWxaT3pTSUFUSnJNTk9PZ3pTNFJJbW1FQWFZdEVCaW1IR3ZWNlozQkp1R0FHVHkyWWdINWs4dG1KMHlaZkxSbTl0QXdZR0l3bWNIZm1odXBzR3FZd2VtR0haalpRWW1BR3BJeEFGR0lsQmlnNk1uYU5vV0FTQVVOTklCNXBNZU9ESEU0NEJFTVhNRENTb3g0WEpnUVpBUmdHWDZaQWVvc09CWFlFYmFhRXdISExEc2pTQXRlV1kxRVRTb0FReE9YWld4SzJ1bUdhMTVycWlzY2lNVjVOUS9Fb2t0bGRNdzE2VlQwdlppK3ovTzNZbThJZy8rRnFrbHpQWklyZTFkUHFNOHZVc2o1RVZob1hYdlc0Z3lpZllaQW5jcURjRXZ0U2ZYcDdjc3d1MWFDZnoxalpyWTQzcWZjeHJlNVJkM2NwcW1OV2s3cmZPNTBtVjJxL01mbE5KZHk3dkRuNWN6eTMrWFAvLy8vN29HVHVBQVZ1WmROdFllQUtJUUFaemFBQUFTWHQ1eng1elpJQWh3QW5Od0FBQWYvLytmcldQTEZQM0RQbC9ILy8vLy8vLy8vLzhzTHRKRWF0YmRMTHBVSHYralFTaVFpa1M5SzVXZ0FBQUFBQUJBdURROGkvZVF5OTQyc21hNFRBajlWWS83LzFoQkFBQUFBZHpqN2pDTWdXLzBQR0tLaGlURUE5UmFKS2hVVGZmNHVjdWxRVlM0WXdSK0NERGZnNmdZeElxTklvQ3BGd1dBZ3dlbVdnYnBDNFJhaW1QNDRqNDhDOEo4YnBLRDZEYnlSSUVaTGZwbWFpTU5UUTBRTGFKa2tTSnVtek1jVm9KclNVbmV5U2JFY3NaeEluSE0xclpCYTFJVE15VzlTa0orWm5qWlJlWlNKMWFpZU1TOFpFVVBrNm82cEZtMnNoVFNkck9uVTZLUzB6TkpBOG5RUU1ESXVJb3FwZHpWRlMwSFVraWFKSTJNVURVNGtpdDlNemdKQVRUaXIrMEFDbnVlNWpTQm1USVVvcXJIakYzKzFnNU9aVHBkNjA2RnM3K0NRQUEvblp5aFlvMGlzMFFPQ3RzTllJQ0hVS0NReUxjTk42VUl5eGxEbGFDVUlZTENLbUhSRUlNZW9qaWNHY0lLT1dPNHFoWXFhRFRUSXdtaUtsMFJrUllaMGdJb1VON0Z6a1JKaDM1MHlKZ3pMNXVnWW14ZFJvbXFCUVkyUlJtQnhFd1VsUVNYTUVDNHNueWlUUk9FNDYweTRnektXdGJtQ2tVWFNSUEtRTFUzTXl3a1luU3libGN1azQ1VkxiclJUVFRkT2d0SkpuVVl0YlZXbXRkZHp5azBWSGk4b3hXNjZrcG1tYi9NWlVKMGdyeENvekdFRnBUS1A4ZThhNTUxaldNc2F3Zy8vN29HVFJCQlhRYU5IdlpnQUlJVUFKdmVBQUFSYlJmMG0xaUlBb2FJQW5kb0FBQkZIVnY4cmU3ZWtuYnk0QUFBQUNBa2ZaMlZ2RXNBd1VGaFlqR1N6a1l3YVJnVlltakJVWkNHUUdSUmdaV0dXakFZVW9KZ1lZQkF3QUlaTXVCNUJFTEEwdzRuUko0WVVHYnNJWlZZZnRNWWNpcmhKSXlBWWFlREpkK3pNQ1FLMk9hWVNvZ1VzdXlFZElHUkJBRU9SREFNSlFNTVNJTUdPSWk2WjlqR0d6TGdFcW1nTDNac2FWY3FXRVA0WWtZaWsrekxuMWhxTkRVOVlWbmNIUiswUUExQ2xkTmVwS2VscXpEdHJDU21FWldvQlVkRUl0MUFzQnV3RGFhSzBoWjd1VGNFM29Ob2EwdHV4YW1wcStXRXBlaVJTN0Nsd2tFdnZPQzZNOWJwb3RjdVZMa3NyNFhlN3Y3MVFmZXY0WjB1UExOcTNFczZYR3I2RU1FUmxJSnJGb1hhMDVVeFlDd3ovLzlBcC8yMGdpZ0FRQWdBaGdxRkNKcGdBQUFBQUFBaHlVa09JRHlwZldtTSs1R1d4akl4Nk92TTcrL2dWNDBKQVNJQUFCMjF2TFVnQ2VHSmhDUUpoNDRXU05CaHN4WUJERk93dk1nUGlLNllCVmlUMkh3ZFRxVTdGVWhXRmExRnZRSkxGRVhOS21nb3J3RklsMXQ0UHhhRU9hVFRMQzBXdDczanFsZ1psTXkxbnhqNyt0Vy9wbnc4YXp1dE01L3JNNXc2SjF5Z3dNd1pIalpCMXJGcDd3ODd2bk40cjNkWUdvOHFOdGFrbU5WeFRXOVUvLzN2ZnJadVpjNHpiZGJiM1RWODB6L2JYKzczM21IYWtId3A2YTNuVlBuV042M3JFVDBFU21SSkJra3YvN29HVHVBQWdYVUZCV2MwQ1FKNE9LRDhHSUVsWEJqVWU5cDRBb2JnQW5ONEFBQk5zdjJBQVdPSExlS1BqbVdiVGhwM2NlSmVsbTdNYmtVU0ZGVWtDQWJycnZJU0JjU0xFRHdvWUNpd0NnV0pDWVIwUmcxUlphMVZ6STZ3UndnR2lFSTNvZWxPaXBBVHJqQ3JiUnNpUkd4akY1S1IraHhqNmNHVjY1OCtXV3pJaEZoZGJtanRZOFdSWnZ2ZUVwUVNMMmYrYkMyRFRGVloyaEo1RTVMUFdtNitBYkpBcWpoUitRU05SS1RKT2J1eTdKRk9iU1J1VXM1NFpMUHV0M0swMytjK1ZMTThkNjV1VThteG43aUVuNVFrcG1Ld0RidHUzMisrZ0FKaWc0Z3RLRUZhMXFjaWxCcnJJdGYwZStsNVp5bUVFb3JaOVBRbGdFT01JRU9mNjdQb2JPald6YUlvSzFWQWtRa0hpOU5DRkJYZGRKQ3FrVG1na2dHUkdpSGxZRnFBa3hhckhJbURVb0VGU2o3bHRmS2FrZ2tGSWJKRjgxcEIvSEpYYU5lbmQ3cDZtcVVwb3VQT3RKODhVZVRCeUlTTVZnNGtsZ3NldmY0dDRkR0xPVWFFdVNwNzliNytOZnk5Mks3eFY3NlpyUk1xTUNHYThmY0JnTXJyN2hkNHRiWC9TeDduK0l3WUtMMjN1dTBnQURKbXBCUzJLcFdWZFVvd25LclNLTjdsdVN6WHJzK1hVQnlMVnhFTGY3YXlJTFJDUlFFZkVuRU9BUVNJUkFjQ1NCRUlNbGFGQXFDR1paYXYxTGJGOVlkbVhraWt3a0praVpDbUQwNEU1NjZuYW9mT0V3SkNqSHRmZkxPV0ZSeEdkWFRjK05UeXZCYU1XVmRYU2JoZm5OV0I1dEdYUzJsMFRUbWYvN2tHVG5BQVRKVzFIckxEUHFKQ0FadlFBQUFSSHhMMEdzTU0rb2V3Qm1OQkFBQktrOHNVcXlJSTJjeWs2YWFSbGg3M1hJWWViSXJRZ1pKZWhRN2FIQWNXTUo2YWxsTHVqV0FHenJFUFU3ZldnQU1KTGlxaExGbG9BSmJlaEZhOHNsZktaRmYvMUEwZDJGQWliNjZJdXNBZEVvekFETXcwUUdGQWJLak9RQkxnSk9vQUVZeEJyTEwyUjVDdXhVTzBrVFZZblN1aEwwZGhYWmZwMjU5SGZTVHdkUmx0eVVDTFdGaHlmMHBpSkRVeUlTS0ZPVlpYYTRjNGNXSlNXcitzSmpwRGVQc3dMVXJWOWF0M2pKamNQRDJMdGwxNVAvbTI1Y1Q2alp2U0M4MDUzMVdTbnpQWE5IKzMyclVnN3RDQ2pBTWNoYUtMTXRCUVlLdTl2LzFBaXJEUTd3MjIxWWRJaWhhS2lRcmpSejE3MkxycmJINStpVUdxUTNYb1RVQUJjaFRNeVNnN2tsVFFBQUFBUHliTWNWQ21Nd2JrVjNBVmFhRWVXNURxaGlXeGlVZ0d3aVUwdEtqa1ZoUU1pR2hBMGpIUUNKU0FrcUR6R3BEa0V3QW1ha2dlVzVKQW9XQ0dZQUJRVzBSL282RkFBWVFEQUxjUmdNL1ljRGJwUERnTm95dlJnSEVDK2pUWlM5TUZKdnFCcS9ZZTd0TkhxdU9keVlsZEpMdDE0Rml2LzdnR1R2Z0JRL1R0QnJLUnpvSFlBWnJ3QUFBUkx4SFRtMWw0QWdnQUJtZm9BQUJGSGc0bGIrNi92MmIySDZrRlN4eitWUWF0ZVFVTENodUdxL25GdEt1eHA1MXpBWG1kSDVXNE4xQzN2cmFqL3VvYWovNm1BcU9VQWFkN2FDNEFBQUFBQUFPWnN4MUVqZjdwY29jVkdqUXpVTHArSGpCWThDcUN3U3dBTUFLQUVqdXZIbStYUk1iOHlaWWVIb0FDaUVJWW1XbWRPbUJDbWpEUUdaY21hb2VhU2tPalRMRHc0NlpjaXFZd1lLTk9YSHFML0o1cENoUW5OWVB4N21NREVFMFFVS3Ezc25VQ09LYkRCMWdET3Brb09Zc1Z2cUdCVFNYaWJDaG1odVVKQmo1YVRFWlFiaVFZajJKQWF1bXYzbXJxbFN2UUpJbm1UakpnNFNZUUxDRUZLRHhNaURZQnVPL0NKU3JXek5sS2pMZnEzT0lzQXF4T3QzUzNERkdEeXk3WHUwenFQZkRrRnYvRGIyMlpOZjFFNUZqSzZhVFc3OTU0YmJsdy9ZamJhejg3QmNNdzgvTUR4ZWMvRDYvYUJsRVV2UnV2aGR3dVNHMUQ4amljdjFYbW81U3YzVXVTeDY0SDd6Ly91d1pPV0FCYTB3U3U1clFBQWhnYmw5d0lnQUpUMnhUL210b2dDaEFDYS9BQUFCWE1iZXJsamY4ejNxSXVpMXVHMlMzSkkxN0RDMzl5L2VyckNSMXBjQ1lTT0pTbm02c3J6bjdGem55L1Y2azMzS3gvM2x5UU5vUkNSRVdHTlhFbEVDMTRvQUFBQUFBZXhJZTlhd29maENTNlRhcmdXeC8rckhucnQralYvLzd1cWN4Nm1ZaENRVjMyM0dxQXFDWUp4eGhocWdCTkwwSVZEQWJzcUxKTmh3TFdXaTJvSVljNkRRZjRUNDNwS2xoVWVtTDc1MFp1b1M3OU1Vb2RJNUpJbk9RSFJCSHgxQ3dlUU5QT3ZNd3BEMHNGYlJBRWRsa1NXaDdzMkdvNmxKa3dVeGZTcG8ranFjbng3Q21MenNWTnRBbFc1UmNjTVB3c2JGQ3RQVnoxbEVWS1h2U3oxTDF1enI3UzExaG1ENnR1MXFqZGFaM0Z6VDhyRzc2ZEgxNGxzVjRMV1FYU3RPOFhqM0UwRzFudnlzN0x0SnlzelhtWTRnb0ZSV1IxUm9aS0hMdUFBeElhSHpXOGFuU0FYaVBxaTFicWZpdHpWN3JkKzJ0ZTJtbWMzTW1ZZGtZVWtUZUZtbU5KYkV3UktvUkdzdCtGRmxZM3ZSOVdwZHAwSUlhWWEzTnZweXRXa3IwMGtiYVVpb1ZHbUtYYko2V2VVWElmZ0tCVkUwa1JCc2RRSUJDT1d0NTdHbFNHUXNKNHVxMkZxbTVDbXhEOE1kWkI4MFRBak1TcTFYM3FrTEZyeXNxVU5OMGhtQjVLa2xIelJoSy9HcTFNUmRVcUN5clNvN1VOeFowZ2ViQ3ZiaDROWVBTUkFqclZWcG9IMS9janI1aVNVT0pTTlJPTnZUc0FDN0REeDVocGhyMURWMjJHMjJIVkhmV2xWYUg1NzAySXFLcW9xV1kwWVViYmVFeGw1d2JBMUNMdGlNSmpBaHhBUVVZZ0FSellveTFqMXBxY05Ea01pYU8xWENCRTZTa3FaS09oOHFRblNsQXVNbW9TbnR4NFZ2S0xlejBTa1BnV21NRFpSVVQ1VER4Q0Y1aDVIcXNqRC8rNUJrOTRBRnpHYlYvMldBQWlNQUdaL2dnQUFUaloxVjdDVVRhSHFBSkxBQUFBRHJacFNHYjAydmwxZzY0cE9GdEI2SEpHMDNJdFkzR0gwdEtmWE5iUS8rdTNjYXo4ek5aWE5YcmJITTBvVEE5YVFPaFkybE5xZnVTaDFyaW0zODRtRWJTc2RkV3dBSW9OQlpDbFBjcGc5UkJsaXRXR1dYTHFaczdmZng5S0d0UTBNaUNBbzQyK1BQbU1NYk01TWNCQ2c1QVJsQ3E1TXVqNXhBY3FveEV1SEszOFo0NGJaM0tnYUpPeEJVNjNKUkpDT2xveWpIcE51SndSeFpoR2JjSXp5aUkraEhSV2lVcHM0SnFJMjloNFJ2bVhZdkZGVlMvMmFSNUpXT1c3blZOWDExTTdWU3pVQ0YzdTR5ekRSM0F5R0ppaDhTdSt5OERHR3JMYk0yanNSckIxLzFOU3E4TU9HS0NJZ2k0Z2xGamJQS2g2cHFhRHIxaUphRWtlRzVFQ0FydzdNOXUwakFBMVRrd0liSXNUY2dzb1o2RksybTlMR0o3dnExZnRhTFZVVVRObGh5TXhBTGRUbXBnQ0FJcUJuRUZSUVNQUWtza0NoNmdnSkJNRVE5V2c3VWRhZ21wTG9mY21BSTNIM0RpVVVnQ1N6QjlXQkVWR2wxQmNvaUpqOUI4Z3pVMmhkWGROZ0dRb0R2V3BhL1d3bEJ2MmV4VThoZ21Wak04eWovKzVCazZnQUVyRjlUZXd4RDJoMmdHVHdFQUFFVUladEY3S1VUNklvQVpqd0FBQVNRSUh6VHRUVmFhcGl2dWRWTTJjQjIyZjZtcTJ5Yk1pZyt4RGF1ZmptNTg4Y3E4K0VQZTZqSldHV0hJK0UyYTQ1dEI4SEE4N2lwc0dnMmlzVU1pQnozLy9TUkpkYlk0MjJBQUJqTFV0YkdHREk5aXdJTlRUU3djdlM3NjdmZGQxYVdRMVdHUkRBb3lWUFllTkFEUml1Sjdxa0FKeHNUaHhCa2pOWUZrbEJtZXAwcjRkNW1UTTN2Y0dXdzhKZ1ZNdVdjRmwzRXpTSTdEUmtEaDRWSW5ENzF0ZEhuUmd1eFpVU1ZOQTFzQzdtS2FsT3R0R2VWdEJKVXNaaEJadENVUGpyS0tjSnhqbFhmY1p0TmhNTHBlNU1qNmswVENyeXQ4WGpNNmt1YSs1cUhyYTVSakRqbVZYVllHUDNSVlVnK2ptYTF0THR1Ymg0dWJ1ZEt1T1JzNWhZa2hhdlJ5SnNrQUJDRlVscFJST1dPMVRkcGRsbll0VmtrWXNVRVhnOGEvM05lbnRUTHFsSlNXSVJTQWdOeE9NRDJPV0lHYkFvV2lFQ2luMlZYS0FUSEJaZWhHZ3ZBc013RTNKNjg0RGQwWTBORzVwSEhZRlJpSWdFN21ra1FPd0N4QlBWVktTUWxLaGlSUEJ4S3ZjT3BOVVZJazZkU1dXUnVZNGtVSVdMLys1Qms3UUFFOWxyUWV3bEZlaDdBQ1YwQUFBRVQwWjFCN0tVUjZKU0FaUFFBQUFUZkZwV09oOXRMZk8zM05vLzhXTEhKUG15UjJkajBDbExmb3l4WmNOczlzYkpjcWl0MjBHK2JoODZCZk5yNHhWWUpadkdXMy9wMVZucVh1NzlCeGlWcVJ1UUFjQ3BsOTZVRTcweEY0c3h6R09QQ3F2YXo2V0hQdHNNUzdxcXhFT2htdzd2dDZFdWdnRTZHVWh4Q0ZnSkZOc0dDQ0VvZENRVHNtUVRJU21TMW1nTnNIZ0EwbVNZc2lXc2JQeW9lbGducm5pcGVtbkxyQ210enB4UzBmTXpDdFBvTHhwTjM3UTJTcFk0YjEwcVhsQ2d6SWJMdGRuRnJMQ2lQMTJXZTYydTdMcnRmaXRDekZTMXU3dlRyY3JmWFpmbVdOOXVYcjlmWm5wK09aN1g3VjkzbTdQLzIvU3VlMkNFMG1XVHRyWGJGN1dxcVFBU09uaEdRWVdjTEZYV0xYcFBJT3Q3U1ZaR1FxN2ViTlBEODBodnUvL3B2M2ZSL3IveWRTSmMzeStXMFRrcmNBQUFBQUFNUWtkRXoyb0NGQUE0TmdtSXBpc1ozQnNvSzJDa1RJQ0RHQkFXRkpnQU9YbUlYck1hZ0NTSEdRT3NvRzlpeFM4aUQ0ZzBEeW9sRUdUTUl5QWZvTHJWQ2h4YVVnUWdOd0YzSUEwdkU5VlZoWVM4STJ1Ny8rNUJrNm9BRW8xTk4reWswZWg4QUNSd0FBQUVTbVZFMzlaWUFBS29BSTJhQUFBQkYxSE40MnhvUGhRYXdOQXFwU1REK3hsbERzVmJyb3V6U3c0NWM3TnR4ZlJnMVJ3SGNsaTdIY3VzcG9HZG9XbG5FcVZRVkthNnk1L25LZ1ozSlplbkpSeXZHT1B2U3R4a1dVRXZOS3FzOXk3ZHpzL1pzeS9MQ1g1Y3A4OTM4NmFWUmVHcHF0WGxWTmgzV3U0NzVWczQ3L3ZjODhMSDN1ZnIvLzVWTGJXZE5Wdlk0N3Y4M3p1SC8rdjcvNC9yUHVXSC96dmVjMy8vMy8vLy8vLy8vLy9XczcvOHhyNENFSS8wUEhuenJTUkIySFpmRGpBQUFBQUFBR01oRzZuczNvVXFQOTU2b3hXV1Q1bU5rVVFKSHFmLy85Tm4vLy9mL3BScnYrU1NYdCtGWXdvV0lUUjRRUm9nbFlXR1RWUzhSaGZvQkNxcnBmSklKdHdHN3dPSHhYUE5NVXFjOElwNlB5MkdpNDc3cU9GL1BWdTdHaG5FTFpjUHBQMHBQWFVWNHhOYjI2bGFQV210bS9QZHQxWnJhT3U1Vzh0VFQ3eFpkcS81TXoyWW9xOTMwMzQySGNZMSthL1A5R0xFRTF0Sk03WHlTdGxsSXlPQ3MvL2U2K1BNOVp3K2M0dExvU0c1UkpiZTVRQnAwYzB0SHpySE5PalYyWDJMdWlqMjlDKzMvKzZCazc0QUllWGpKYm1zQUFDbWpXUnJCQ0FBUm5Qc3RuWllBQ0crQUpMT0FBQVI2ZnBVeU1WZ2pNaGk5Ymppc2EwQUptUmFDb3k4V0pGeDR3a3B1VWVVVmJvM1NOc1JkS3dsRjlmVW1rbzlVT3hLMjRDeXZIQ0JhN1Y4VkU4eHZTQ09LcmpxVjVkSTVKZGJkb3gxZTJEWGZmNXJ1Z2ViZW82dGlaZDNyWGNyZWZ2RzlRKzdMYk01bjkxcVRPZjA5YTNOWHpPcE0ybk0yZW5iNy9VLzZXajIyVXorNy9yVEtYenIrOVp6dTdjOTFwVjlMVW5idG5makxJTFlpYTI2QUV0SU9Lc3FZWW9pdWZmUytYYWpsMk5vYzllaHpGdWR6Mys5bi8vLy8vOUtJelE4UkN3Nk02cXV1Y2hTQUFBQUJnTmlYUjY0eGlISUFDbXFlbTFJbXVJbmZFRytQR1hDR1FLbTRIbU1HbXhTbWlPQUFFQVJ6OEF3Z0phVnNBd0RvSm9LT2ptTDFMV1I1T2tEVlNCU3ZVdlFMUUFNMFRrWUdUSlVjYkdoS2NOdTZ4bDV0cStMZG1ZS25RR05KYmQ4azREeVFIU3lqT1VzM0UxZnZrbnVwK0hXdnV1N1QvTTlsOGd3K3JWb0xXR2NvZnVHM1pWdlV2aWxMT1gyZXJnMXY5YngzMytZZDVGL3c3aFV4NWN2ZDE5TktzdGZuanJlR1BlYXNlL2tzN1NWNmU5cjlTcWhqMU5oZjUvODEvZTk1LzY3ai9lV0o2R0lja2RTeFIvK2ZlZDV1ckRObTdaNXZtc2Z5djYvLzcvUDEvTVAvLy8vLy8vLy8vL1hPOXgzM0d2MEgvOGNGVml5V0xHM0c0bW0yaGdBQUFBTG5SVGFVdVhKVmZqaFZpNXFSUUtna1ZFNHNkNnYvKzZCazhZQUVuVlZLZFdHQUFpWkFDUHlnQUFBaEZlVW4rYXdBQUpPRnBITUdNQUFQLy8vOWFscG1sRWxEYzBkRWRKNHFBd0NBQUFEQXlSR0c2YW9lSnl3OEd0SkNaVURabWtabVlSS1ppRklVRGhFWUF3R0FZWWl3TUFvWkdBT3JJSEJFU0FVY0NEQjloeHdwZ0ZuZ1l3Z1hDSTlCdEFIREN3OEJnUURRUnBCZ2dPSUJ0OFI2T0lQbEMzZ0c4b0luaFlxQUFNQ0lRdm1JWURlRUxvRXdMS0ZiaW5qSmcyWkZhaHFvTXVGZ1c4ZHdrUThFUE5pQ0ZaM0hNSnRGRXlTUU55dWJrTUl1Y1FIR2tvampoOHpRVFBFNFRKY0hQTDZKVElzeDgxTTFHTlNra0VsVm1odVJZb3FNR1VtbWRZNlluRTBEcVIxMnU3NjZ6UkV5TmlxeHNacU1EcWo3c210QThpbVhLck15R3R2cVZkTlJ1dGtpeVlKclRUTjB6Tlo1ekF0b3FNV05UWkQvLzJWZjlmLy9vVEYwVE5Ga0hQbmlWV2xGVlNBQURnQU5kN25OamFHOUp5a2h4REo2ak5rYTVDUzczMHhRUUI4ay9Zc2ExVEFpcHM4ZFRXaXFMblQ1b0thNkVtQklLK3dJSnMyc0N0RHFCQy9XQlJhYk5qNjdab2doMVgvZC8vYVdSTUFJQUtBWU9DT0pJQUFBQUdHWThtVDRubUloZW1EMDZHQ1lQR0hyUEdEQVFHSVkybVVZbG1JVEptWW9FR1NDUW1MNHBoZ2ZtUHBNQ3dSZzV2UzhabUJDZUppaDVoQXBoeEt0YjNnSXVoTEJDbzFZNEhFVEZsZ1dkTVdWQVNkQW9JQ1NjcURpcVVMK3FZSTNtcElzc2hDSTdKNUVzU1hnd0FUQWw3aXBFdHovKzdCazhJQUlmSWhLL25Ka0VGTWlxTmpCakFBZXlXY25XZDBBQUpDQ3BmY0VBQUhRc0hwRlpreEh6cEg5bmNJckhKZFMwMXZBb0N3ZlVuTXFLL1lwYTFYR3ZxelRXK1NxcFNVZHU5TVhLMkhQei91V1BNZTl0YTcvY2U4cVlVbmVmaHJlZUhPYzV6LzUzSEducy96ZmNzTjZ0V09maHJYUC85Zi82L1Avdy8vNXpDb1hVSlhqWHFDaGhDYmpTbUR2K2tXVXNnS1AvbENDQ2RFQVlDUXN0enVkMUFBQUFBQUFBc1dVRkJUdURTbm5PY1RQM2hpdDdHbVRELzkwaHFjQUF0QUU5cmZXY2lFcTEwQXV5OFJ3REtWeGdRVVBDVWd1Nlk0T0NpbVMybWFMMmlSa0oxVkg3ZUxsT1BUTkx5ZWI0eDRUbENrVVpJVEtkN2ZhdmxpaEs1c2tteHI2UkNFb3MxWU9WdjYvK2IvRzVmSjdOMENUTXU4NHBBYkVUQmNuQzcvL1YvNzE4dEx1Y3VVNDJ5VWt6UzE2NHJqZXErLzFxbE5UVE1ibTlzcDZTMnZtRmlGamVhUzB4dU84aVc4RGRvbnJWbWVLOEZ3WWFpV2ZWNTV4WXVRRUFNQ0tIZDdQN2dBRnJLbGtGWEZYbkh4QUx1VHI5VmwxNHh4NTcrZU9RMnM4azRLSllBM3RaNnVza0t4SVRFaWdESHhsY29US2hpd1NoUEFvK0toZ0NoQXNBTXJrUzNIMTdBY3RkbW5sRWNpME5RL01NamZlTVkwaERvSktrZmhMT3VheWRYeFBsdzdWVnY1ZUJBQnJJeEs2bG1QSm1iczBrMlVIdUlHUlVIdTJRRDdxU0gvazN2Mzh2bExKckhoTU5PbzZ5bkhUOFI5TFVSTUhpQWhZc1d4SjhNSDhMSnU3amhaczRZZFpxRGh2amxLRnBGQlVzV1laSTJJbTAyOUNnUUFKTDc3OWF3Qk5wd3hoYURpTnFHS2JmRkcyMHNwQ2gzbkRWeDc5OFlKSXZxNktBQXJnRUwrejFUNDRQalIrSWw0YUF6SGFVSU9UQlNCTEVSa0Fxbzd2QnlnQ2hvS2o5cUtQRzV1NXF2LzdrR1RaQ0FVU1ZjL1hhZUFJSkNBSnIrQUFBUk9kWVQ5TnNSVGdqUUdtZEJDSUJOVDBMNWU3alJrTjVmR0tDWDV4U21YUzhEcnk2a29yZCtlc0VMZjljNG9Sb2dKQzVTdi8vVU5tMjYwZElqVEQwRC9yVEN4RlRhT1pVbFIrRlJuZmg5a2xJbENnUWJmS1M4bzUvVnh1VzE3M3lTZXUyeEJRMmdVUklwMUNFNm5zcDFrMm0vRy9rY1FqS0puRllwbXlMUmVZSU9xWWdqU0FBRE52TnZyUUFKdUNoTVlvUmcwdEJLM1NwTUNsMFN5REsrbGtqZDYrbVlYSElBRGdBenZic21vVkIwbVR5RlVTdk1NalNJN0dRQWFDUkFKUCtHQXdrRndBdDFqZEhNUDA5R2ZjTjI1cXF6NTVIR1hHMHNaTjdvd2JCUkdiWjArZC9Vd0xhNjJXWEpZbHh4ZEhXWm1abVp5ZXl0eThxV2MvZC8yV3dxK1hZUGRZeXYrLy9VcU5HbmgyR3pKYzR3d2RFR1dQR2g1TUpjVmNGS1k1VUhEaDQ0U2lzd3Z6eitzb3NKRlZCeFpsQkdNTEduUlh6UHQzZWNvVk9sSW5yaGNRQUJJbWVFKy8zb0FtNEtEZU1TOHU4ZFdwVWRQbG5YQ2xoZHhIczZZb3d1d2RHc21MVnZRZGszeWxRQUFFekFLVzB2emVpSTZEb3d4TU15SkpjWWRTVUFiVXNHRStDdi83a0dUVUFBVUpWMUJUZUVwNElnQnByUVJGQVJPOWYwTk5zUlZncW9HbS9CRUlCQklVRjNhYlZNdUpOSUpvaEJlMXR4cEdYVVpNTUVjaW5ON0szUGRzcEtUcmhNRXYrYXc0OXNiM3RXTkNOaHMxcHNiLy9wcTN2bVBidU85NnJUWHM2U2xZL3p2ZTdmMC8veG0zbnhhTXFkWStiVXpXMEI3QmQxMWpPYmIzcWtiRWFIVndjbys5Um4xTmYvR0xhaGJnd2RadldYTk0yM3VGVEY4NitONDM4NSt0WXhhRHVlTWE3Y3FBQUsvRisvMkFBNmNNRzlTSDFLK1BTRlVDZmk3ZU45amorbW12V0FBQUFVS1NTQUVCRW5McTVRVUFBQVp3WlIzL05tZHdZWlVPNWc1Mm5iTDZkakhwa1VEbTFUR1p2SVJ2Tm1HbmhVWnBEWUdDZ2lCQm1naW1WendaZkI0Y09SOE1XQlJyTkg4TnZhVk92TVdac0pMMWpSSVFFQjR3VGEyVW1QS055cEhkQ2pHS3pZVURqalNDMzVjaUtPMmdUZjlwVW1naEpCakxFM3Rua3EwZUVjNHBiMXAwRUZwSEw1VmFzaHdPVVdzNVpHN0ZTdGUxcjVWSWFTelhzMzRkaUtYdEJsSWJQLytzZi9uLy85ejNsbDNmTUtXMW4zREw5YTFscnYvLy8vNGJ4eS8vLy81blZzTzM5UDZ2ZFVuLy8rZ0VBQisvVi8vN29HVE1nQVVmWUZEdGFlQUtITUJwdmFHQUFScHROVEg1elFBQWl3SW1kd1lBQWFXM2JBQUFBQUFBQkFNMW9DUGp4ajB0aS9IK3VQOXRmNnJIZjFyZjhRQUFKTkFUSHZ0OHpFUkFUWmdBcmVNWURNTlJBNm93WUF2U0Z3UWM1V2crZ1ZBcXd2YXM2alFTZlEwemV1cEhjR2RRbklvcFl5UXNrZEJubkRUVmZ2YmcySm04Q2w2MXdoQ212SGNvMFRHdi82L2VjYWxkMnBxUFpqaHB4Vkk1M1BDemlMak9xWnhtMytJRi9NOWVaald4djR1MVFkM3k4eEgzOWZWTlZ6aXNDTkZldm4wU3U1dmpPZFh4VE41L0J1KzFTQldaL0UzcWY1L3o4WTFyLyt1NjIvM2lIaUc1N29tTUFBeGQ0aHZmL2dBQ2JDYUNFKzYxTEd5TmptKzFmOVYrNFNPNktJQUNFN2drNS9yOFBGeEVUSXJ4RGNESGhnQjQzTGFPUkNRU0xHa3E4a0xDRUhLMVpJZWcyY2FMdkh4NWxMMTk2NVRsQnpyWEtJZUJXUkd2TnJWN3ZLT3ZGMWEvYkZLclVmT2ZUcHgvKy9mT29Wb0ZXMXp1NnRHemQreXpXWVZHK2VQOVR5MGlWMUVzK3h1ekpKVTdyNHhZZEFyTTFPSWFkYWV6U1VFeFJhSldGSUpCbExlZnNlVGFLbHZlcDZrQkF5VElyWjNsM1RJSklZaUFBRXdBQkFqekVlNzNVQUhUQktPZ2xheTF6bXRZdyt3NTNzZHhkR2xIL1ZHZEtkeUI2dUFBVlBrWEovdCtsVUhDQ0o4UXNDS1FGakJHR0lSYjJpcGtlT3V3VmhucGVZa1RpNlZwNHJUZFpFN003dk5uTEtuNktpRW40WUZ0UXJWbkdzK0RROEhLZC8vN2tHVGtBQVZLWWxEdmFlQUlITUFaeitBQUFST05UME90UE5IZ2pBSG0vRENJUkYydUd4TG9rRDZ5di9tWWlDaXlXVHo3RGhlbWZZb2tQeE5KNGd6Vi9MYnI1bjZtbVZMRFNsK0dwcnNWYVp6U0UvelYydzR1U0V0UFdLRGlCWWtaVmUxa3VpcnZiRCsyeW1mbXI0bU83dWZadjN5bmJLdnM2ZkdkejFBQUFraVpqWC9hQUJwSUVXa2tYN2tDcXhyZC9qRTFhdDNwK3ZxL3JRQUFUdEFNZXZ1MVlLRkNLVUZ5Z3R3TUYwRHJ3aU1xRmpCOXl3dU5JamhWQVM5WmQ1eXZBMHVIeERLTFFrNjdjWGoyR1NGV0dORE5CN3N4Ty9tZzNJaUZzTzNrNEVnSWtCa1RCZi8vNjN6UXNENXBTQ2g2TmRBVUM0SUJoUFhVVHhyRU81eHhZbkJvQzhPeDVVT3hlTERLdTdHSmNWak4zWncrYWtXQmdnQ1d4RVJwVm5PeDNFdzB4SFVMY2ZQeHozTk5xeTNTUzFXaDdWOElBQUFKM2hicjVBQUdUSlFnZXRibDB2RkhvU1R4S2ZWVFFYcTMremQzV1ZrcUFBWUQwQlRsMS84TEVSd21SR0ZVa1VRRytpN0FFSkkvR01GT1dJQ1lZUk1LVFYrb0ZOSzB3R3gxa0UyNmRxYW9MTlIvSFNjeVJ4ZTlCRi9Hd3lTVVkwVitud1RHMlMwMGRmLzdrR1RmZ0FUZ1l0SHJUMXRZSGNBWnp3UUFBUk5SaTBXdE1ROW9oUUdtZkJDWUJGWFEvVU53OUlEb1dXLys0aUlTUVNOVVZ6KzArZVNCSUQyR2hzMXRmMS8zVlJUblBIVVpsOE11L25MalVuTEZ1Vm1oeDhxcktueW1vN2NHWm9BZU9BeUR1SlZJK3RCUE1hYnNwMldwVkJCQzJ5RjYwekJGYnJXOGt5VUI4RjJMVnlJQUFHQUxEcE52YXdCSmpZS1VVV0F5eUVhcWpQREZ1cHVaK01vSjJhbGYwSzk0QXdZQXVSMmJ0aUVFcG9ZSXVsenpid1JvaUNsN0N3WUpRSmxxZ0tKTVNlTXVYRGhhSzlLbjdUUS9CdHpVNUVMVUJQNnI1dFhBbDFtVVFMSG82cmh2R2tTU1RWcGx3MEdwcU5qeXRmdE1tdmsySDhrUGF6Lzd1VlR5SnNuSnUybzVKUWZ6eit2Lys3cVR6emRnOGtBR0JXT2c4ZG8rUzJrWTRBeUVTZUhUTWdyNDcxdFptQVlvV2NUSWhDVWZWRjZoOGRuOU03dUZrQXRFcFJvbzBRQmdoTUVXVG9sWHBqU09rQ3FTbnV5Q3IzOTJBQW9EczdQN3dBSUtEaHpLeHdtRDl1NmxYREhvN29QV2EzcDYyaXpCb1JNaEdnQlFJQVcxVS9id0wwQmpCb1ZLSW5nZ1hQVEdWVEdrcDRsQ1VOY0VVUFlZRGdJa3hhdlB4Ly83a0dUakFBVlBYMUhyUzI1WUljQnByd1FsQVJZcGowVk5MTmtvaG9HbXRDRUlCT3U3ZDE1NVd1MVN0cnJXeVNPNjlCVVVJUTFvekZNblZIWUNTMllvOHR1Yk43SGxLclZ2UUxyV3orMnJqMWpjNExiMExYZHVFVkJwbWh0L3I0L3QxdG1tWHZybUZjb1lDTWFrY3JITkxPcnVuMG1tYkxPSUVKQWtFY1BBR0FINWFiR3BLYWJIR3pWVk50ZXUxSXBNQnRIb2JTY1hENGJuSk9kY2RiZnVIck1jYkV6MVVnQUVSQUp3ZG0rOEFDZ0FVYWxWcm4xcEt0dmVwdXUzb1JUMnA2V204NDc2Z0M1U0NRRFA3SHUvcGhlWWdEQmtqd0VBaklMSlFwUUZKRGxyblNTK1o0b0VnOHhOblZORDJNSHpGYVZ4QmFLNVdjNHZ6S25hYTFMcnJsektGQ3BXZ0JNd25INy9iVThSdEpsTW41Ly8vMHZCVWRHUml5TEhsUkVhQXErWFlndGVibWZ0dnA0Yi9lN3lha0RDd2tqSVpaVTJyY2FhbWRqbHpWRlpUbElwSTNFZnV4dFN4MDY5c2U1WVBBR1VSU1JYT0xBVkFyV0JGblpxZ0JLK0s2WDc4SEJVTUlGWGhRc1dTbkJVNjRSTW9hWmQrbkxxbFUyT3NXcmphZ0VwU1lRVFBiSm91TTVQeHdRRnhtVVVJREFvVURRd3NJMWt3UWkrY1AvN2tHVFNBQlZYWDlKVExGMUlJR0FKendBQUFSTXBiVXVzSk5iZ2d3Qm5OQUFBQk5MNVE3TGVWdGg5SzJLc29od3pKaEtLeE5Rd0xtSnlQcGViL3pnK1BWTmtmckQwc0o4TnRkL3MxUStiREZhbVQ5YksvcXZWck5hNHdPaW1JRmdtQWtJeXN6aUR4bTNhV3gwV2hNSlZQeHNXN3BJOHdZUGNXbElldENySDdEYW9xd1hDNUtzNDZCa1FyUVZZNHMyWUh1VW9GUTFBVGUxZEFBaXU2dkVQOTl1QUFWU0VCVTRla1EyRzZEYmwyQ3Uvdlc1R3pwS3NOTkFTekFkS0JtSjNFd0JGRkdRMVA5cnFubUhWQXc0YmJYZUFWejZKTVVDeVhHU0lSWGJNeVpCQXpGQ1RFamxYTkNvYVg3QzJxOStvMWF3SE96THB0Ym9MbEJVVklzSnduT1M3N0wvV1B1c2F0ZldWbCtzNXBIZ1o5cS9GbjFuS2VQamVsVDBVcDRFMzNxRE5ySDF1dEhkOVN5eld0SnYyeGZVRmxzM1djNThLMkp2T29IM2VtLzh3YzQzRW1uMzhUUzQ5S1ZyUys5US9QZi9Hb3hCdGlGNHE5akRoRzB5MjRRQTFWWGlJOStsWUFTUldkTEpTS3RjcExTYkVpNG5kUXltaGhHMW5NTDZNckhWOWU5bGFhZ0FBeUFLQUFXTEExQVNBQUFBRGprU05DcWszL3pETlovLzdvR1ROZ0FTclZFL3JMRVJZSjZBSnJ3QUFBUlBSVlQrMWw0QWdtd0FtZm9BQUJCTTZUQXh5YWpHSVdNVUFRbVZSaWdBbVV5VWFTRlJpWWVHSGtJWVJEeGdZUW1Id09ZQUFCUmZUYkFLQXdRazE0a1FEakRDMThvWXBhakJ0R3hDZzNpQVlUdXl0SllqQkVWd0tOVnNVTk5lSE9xZEFoSVdDRVI0dDVBVFdKYU5BWHRrclpYU0JTUkROdjFyeENRL1ozWHFWYStmNFhVckZNR1NYWnhnZS8zenVPT09PVXR4djUyNUhISjJwWXUvclBEL3cxYzMvZDU0WjU0YjN2ZjhyNFlWT2E3aDN2TmIvLy9WL2YvanY4Tjl0MXhBQXcrMHFsQ3pBNUJGejAyeGdRR3JzTUJkckhDckUvMWEzM2Z5NzBNVVpBRENUcnJrTGhrZ0FBQUFBQUFBSEFuQlI3NUtLWHZ6ZVQrK3B2ekllLzR0RTJxSjhBUUVSRUVBZ0FDRW5JeTgxU0dER2FRUkV4Z1FnSWd3eFRlTkdVaktVc3pvL0dqSnNKbFpPWWdIQll3VURDNG1HQWhoZ29ZS0NyOUJ6YytJS0JEQWdRb0NERmhWR1F6NUxWbkdBTmZiT2pMQllBQVpuS1FZUEdBSkpDb3FDQ2RDY1lNTHBubUFnSVFQbUhnNWtJSUZqZExRZUR5N2pCZ0tES0N0OCt0b0tnWU5GQm9YZmhXSmtxS2pRR21Cd0kxeHZabG9yZFlIbGt1dUdCQUVxZGhhaGJCV3RaODNEZ2hBVzJhWTlzU243a0NyUFpWTzFyRXdyYzZMOXpjRHdXOTlQTHFXY1pzOXNlaEw3UzlkektiRDZ4Q0xRQThsTGZkK25wYnNxaGN1bThKVzVFZ2psK0hXa1F4VFB4WnpodXZhd3BmLzdzR1QvQUFkSVRNbnVjMEFBSkVCcFRjR0FBR1FGazBHNXZaQkFrQUFuUHdBQUFibUdwakd6eTNodXR2RERuNHkvUDkvemxqSEt4ZXh5cGVYK2Z6Ly90bk81K1g2KzdpV1RlTEpPLy8vL2VGUmxZbUNJcXhDTXhzZ2kybUFBQUFBQUFGcUxCcno3Qml1OExlYlhyN2Q3NGVWY2FkL1J0UUE5NmlBQUpFNWY1bm1wcVpmalVUb0pNRUFpS3BreUdGRFNJVFBOV3plMWR0MTlxaTYxNEZBV2x3ZTdzT3RiZHdPWW9QRUl3d2U0OFRodjB6VkVGdDA5SmREVC9ya25vVzdUODArZk4xTi92Zk9heTd6S1ZjeDdsS1p5MWpubFRXcm1PLzV2di8rdjVWeXZZeTk0cGZoK0hlNWI1aGpiL0R2YldyVmVCMyt3eXNYOTUyOE1lWGJlSC9yRGZQN2xoWXNieTUvNy8vMTM4OGNjY3JtTkRLN1ZtTjNLZWNyMCs5Ynl1WHVZZnJtK2EvVys0Y21zS3VIZjNuL04xTXhBVmVLZGlLeS8rZ0ErU01NSXVJSWF4N3RCOU9zZEtmRzE3SEwyWHVwM3IvNlFBQ2lETVFBQVNrT2VIaldETGhoOFFZV0hvbWVZbTRvZUZ4eEdVb1BEYm1xb1JCbGJNNUpBYjR4RVlBY1JBWXV4UmxZaUNKSkV5QVJwK09LSHRkWlErY0hKZ0xxUlBCQ1lkR2xHMWxMOHNCdzlHNFpUNHFYOE5JMnIxWHpmSHdQbFVvaWptRXoyRlU2TCsvL3A1UEVjUVlJNkYvVWY5dFE2bmliUUV2Q0xFSk5IVFVvUW4zOVB0MU82WmIydC92NFloVm5TUU9vVVJBQ01RYjJJRWM2Y1B2b2xFa3pjTzBvUzIyeGlrVlNKbWJ0NHVuM0Q5RUFBb2RuWVJBUHRBQVFrMGVIc0pSN0ZzMkJ2MXZ0OWJuOWZYOTNMcWdBTnRVQUFQa1kvQmhrcERKNmFRcnVtYVBPczhHaUc1cmpUREJ4TUZPNmdWR0YwUEIxektHUXFqY1ZGdG4wb0w5Wmhqd2pDWnl0eFc5OHJUR0pLeEpLc3hRRk5LQlhNLy91UVpQMEFCZTVvVWU5akFBZ2h3Qm5mNEFBQkZybWpSZXlaZW1CemdDYThBQUFFbVYwelIyMnV6OGVwY1BPZ2tSeFlFaVZHc25EeHVweXFGQTR6YitiNHJpVDVBRmc1VkdzZGhEdjVodi9TSjAxdjJ5MEVzQkFiU1FiandtY0hZYnd1MnFRZi9mUDg5ZFAvLzVqdVdaVXJEaDNMREFnRFV1bTJiZVRpTDFwcmlyaDJ3MU9VOElNOEFRRjRkNElVcC9RQUZOYTV5ekNzYlRqdkxacjlqRXQwMlJUNmdBRGEwVWdBQVhvdWQxQVJrUjNCNUFIUW9FRlRpVHdsalNBYU5PdFV6SW54Vk80alZoamg4RTJRWTBDMTBSVVE4V1VROGh3Q0dDTWdhcERKeVBCdkFPWVFnNVlzOE9NQnVZR0FBRHhoaWNYQ0RoQmZjWUF3UnpSeGtteDVJdUgzUVl3MnRsMUpJelJObU5WbVpHSERKbTFLZlNVeGVNQnNsUVpZUFhManFVazYvVXg1TlBva3lWeUpGd3VrcWJyVFBHbloxSytwVmxQV2loNkdmU1JQc3RFNU5pNldqRmlkWTJOblpidXRsMzg2cHFranhuYUhYZk1BQkd1Smd4SWY5Z0FXU2NUY2VDaXpBY0psVTFMKzlML1cwMTZPUy8xUCtLMEFBQUMzUVFNQUVBS2dmZU95UWxBQXdVOE10WGdKdm4vVG82b0dkVGhuSXFUQS8vdVFaT0lBQldoalVlc21YcG9iUUFuUEFBQUJGeG1QUi9XSmdDaUNnQ2MrZ0FBRXB0Sk12YzEwVEJ3WVljdW0rckJyUzJhSTVnSk1RNG1BSUNJYTJ3ak9tSERtRWhRUUZEd0R2bWNKR2l6bmtzR1JLRE1JN1VFTVZnWldaZElhTVFUYWgwT0ZkQmlaSUc4bUlkQ0tnWVFNZVlzY3dZSVFhcmVCcGNBQ1d0WjhNNEtKQnF6NUh0dDRPdndQRHJvdDFmR1MxYWJGc2pvUTFPempNNUJ5Z3NNclh5TURxOUpOVWJoRndDelVIeStPVXpTVzVzcllMRnM2MDFLYUY4bXhMV2wwcHlwWFZrRUxlNFdCdzNidTBialdJY2xNenYvL1B2NC8vMythL3R6ZlArdG1KR0FReXlaOUtWR2J1a2ovLy8vLytzQUlTTnFsSFlEUWpiUEFBQUFBQUFBaEdpSjNjNWhJS2ZlZWZVNHBtekh5bEpqRVZJNndCWi9FQUFMMnBmNHFtK28reUlyMEdRY1VhU0JmcFlVUUJpRUpNRkZkY2pVWGJ2RWtQeFdHbUxRSDdDVGhxOE9OREVRRlJCZTRCbFlOeGg3Z1hVaENVYlpnSWdSY043R2FEWUFMbERpeURoYitHb2lTakVIMlFZWnhTTEZOQkc2cUNhbVd6Sm9LcVphSk9qbUh5djlUSnBGKzVOa0lPQStTNG1SSmxaMTc5bVdtaVVUNVcwek0vL3VnWk0rQUI1SkxUWDV2UUFBbFF2bi93SXlBRm9selI3MlpnQ2gwZ0djL2dBQUU4WFJ5MGlJR1NCbWJ0c3VuMU85ekl5V2lwRTkxS2RiVDZDZEJUb0pPYXk4OXU2SzV4Yi9vb3loYzlkdVFBQlhoM1pBUVgyQUFhTmhrYXhUckpFL1NmWDBSZjYxZDFrdlIraFFBQ3VNZ0FCY2hXK0tLbjNJeG9FakNNaUpGeXNDU2dZZkw2SjJOOHZ4UlJxTFFHN1Q3OXdYVE91L0xLZ2hhSWdVQklBaUlRWjhrRHFLK28yQUFDUWE5MytYaUl3U0pwZ0ZpVWF6VTUwRVFLR3dSQzJlU05hTWpwOFRFdGZyWkMxelJDeG81ekhBQ3FEa0RMU1g3cnFLMFI0a3VRUjVEV0Z3RGxIWnhkUFRVdnNTWnFnZ3k2VnNybmxtcHpuL09iQ2wvZjVXNlJ1RjFWWkR4d3VPQ3RNMlJLdzNGcDAyUER3SUdIbURUL1VmM0pBQUdGZDJBQUZ2Z0FHRENhRkp1WXZkUzcyU0gvU05KRldVMytsYVFBTjgyQUFMMGJmZUlEMFB4c1FkakpTUnBkcGhZTGVnSVZGaDA1R0hsMTNBZVZyY01OdThGdHcwdW80dnBTMUZSWnc4Y0hWZ3BSSDFWVk8yS1M1dXpmcDlNWWYwaVJVVmpwTmc2MWc2V0Z2TnlFNVVUclA5ZkczdE41eG41a3pBL3hyUk1UalVYL3hNN2pVRmhLcUtINEFVMnlCei94VS9NQkRRNlJEMnVCU2JEMGNNYlZ3OEg4OFJDRmtTSDV4bEM5by96OGpJcWxlUDQ1MkdTWDM3Y1JWN3RadDFaNWZvQURiL3NFUDFvMG11RnFIanIyVGJsOUZQalAzL3ZKNzJMSUFkc1FBQW5iditncW9WbURxbWwvL3VnWk00QUZYNVYwR3ROVHJnY3dCbXZBQUFCRlBGalI2eTlHS2hrQUdiMEFBQUVneUVTMGhZQ0FQTTdRa0VCa1R4d21PWUxNWmpPV0V1UXBvNWdmcUJPc3VnNkRYSVFPVVFGWElhbzBFdXBqU0JtbHlSQnpFOU45ZVlYbW5ybEwrR2huL1cxZkQ3VU8vYVJZRlFoLy85ckxtQjJ4dGpSWU9qaXc3RUE4ZGNWMFo2QTJLTnM5Yk1vaUxJT011TnpGbDlHTVFPd1cyV2FOR0M2Ny94eVFMampwVWg2T29OR0ZyWTI2S1ZNam1NV1FCTi9VMnI5b0FGRWp6emlHSkZwa1dkTWpYZHRhL05hVmFLcVpGeVdDdTVUVklBT3NnQUFUTnZkdGoxVVFaVHZGMkZ5QXE0YUNDVjJ3dUJEOFMra29lSjIzMGNwUnI0cFFSODBJRFFaeGtFRkFIZ2h4ckZpVDZUZElnL2c2QUdreEJvTHNlczVySWx2ZXlNRWR6amgwYmU5RzFqcTNPby9mbnFaQWVDdnYvak8yTkZHUEdTYUlVa2lLZUQ0cjgyY0hqWGJOTU1STnlmYm9lTm03dlJiSC9CbzRGb3VrSDNkNDl1SzVxNWdqRHVFbStuY2E0d2dMeWovYWw5TjhuRWEra0FpalBDSWRmLzJBQVRRcGFrM1ZwUDVRT3Z6RzlwTmtWK3gyaFgzK05kYlRCbE5KSmtpSUFBWGptN1hoZHhnZ0pPR2tnVWd4aEMwMW1aYXFzTkdJZ1MxZ0Rxcyt3dE5UYzE0SDNjVjFuMDJ3dHVqRGxqaFVWK2ljUnBjOXg0MGxuaWg1cDBPejVhRXg2am11TG41RVVVVEhQOHg0TkJlZDdlSXFCWUhBL202NnZad2ZGQndvTHdOYWc5Y2RsT2JleEFsQjRVbEpUTk8vL3VRWlBxQUJOOVYwbXNQUXZnaUFBbTlBQUFCRStGbFI2dzlDK2lMQUdkOEFBQUVSaFBSNzI3WERiWHdMWS9obGdQalBwOVZjYzV4bi9YZGp1TGppcmxZNjRmL3VjYTU2QjhDSnNKUW0xdGhjK3dBQ1NJQ1llUzZ4S2tQV3dXNnV6N3EzM052UkZiS0cwcUFRY2hBQUJleWU4cENHQTNBT3VZVGdRYWFSbEt6Y2FPbG9oR2hmRkd3UEF1eHZMYW03M0xEUGNyeDBJdmNubDJCUWdRcE5SaUVJYWJLTUgwWmtqWWxvMUZTTVloMHRDU3VUVmlVclk4SG9tSHFIenUvbEorR2svdE9uZFRyMTBhaDNPMkZhaHNoeW9qVnN1MnREYnY1L2U5UWdNc3NPTCtmWXlPWFBLcDBLejc0SzNCTElFQ3dHa09vcy8yVlBjZ3E2L3p0N2w3Vlh0WGJsSHluczlXcno5SjNWV29RcVNGRUlyL3JGSC92QUFNV2RQbWpjbzU1NTJSTUk2Sjg4ejNLMStQM0xTaEM3YmY2bFNBRlVnUUFINjV1MGcxaEFKR0dyQkV4UmdvTXVpZ1hLSkN0TVhldUNDV3Fyd3RySlExWWpCVWRwS3NFVTBtaUx4SUlWSXQxWkZoRnBkRDBlYVZEYlY3RnVYRWxUdlp6V3FvQ3lRb2kxVjYvNWFuL05aNmNwUG9nZFBrZlFma3UwWk9SeU9JVzRwcjFST3RwLy91UVpQa0FCT3hnVWVzTVJnZ2V3QW05QUFBQkZRbUpSYXd4T09DSEFHYzBBQUFFVTJqc0F2QWltaVFnNmQ2bXptUXAzKzR1WmNWRDhpeElIUWdob1hwYitLV3FXWm1XeW11bnVibjU1aXJtUk1wazEraStzRVMwNFFSUW0xVlRuLzFBQVBYQ3dWVzRXVzdaVzVteDhrN2ZjMW5VR0VCSEg5YmtQdGRYazFNUW1SZ2dnUHlUOGFDZkFDSmhVWW02Y2hEQml5eFhSZDZjZ2dBd3BUT0pxZExhWi9UaXhJYWVkMjgzMGtVM01xUHVHZ25ZZytEeFZhYVd4R2dwMm1SeVp5bWlYZGpiYVo1U1FlSFFKUXp1SHFtY252dmErZXFBeVFKNUhOOTNZMlhIRnErYlZYZDU3K05NRnhrbUoxRDhXWFBsdnp2bU9vMUZBZGtmbUZPSHdOd0ZnakU1N2Q4VGt2SEtVWXpsa2lxUVVrZnArM2lRRndncXYzZC9CUTlvSTM5QktGUTI1eXMveGdVS0NKeWx4VkZwbkN5azdxM2dPRUdDRVlXcHZ0VHNwMFZDaWtVb0FBQzBhK2RreFRRQTBsdUJVZzVZZVhCeGdQSlV3Z0JHWjlFbW5LcDB4bXFSTVFCT1ZhaGIweHFHdXQzWUNsNmx3RUR0TVRHampkcXRNMEZEUmg2dDJWdU9KbldSb1d2bDhzUTJKbzhEbUpVMW1aby9uMDc4cjliVy8vdVFaUFFBRlJSalVlc01SamdrSUJtOUFBQUJGSG1QUjZ3bEdTaUVBQ2IwQUFBRVRnV1BIaGszNlJMQUJoQWRqYnJYNVF1RWNTTkJnTndGQ1J3U0N3aVhTK2x6NjdWSEpvODJpeENvV0VjRHdrNE1XekpXWE1MTE1SaFpCZ2xOSkZDNCtlcjVqUm9FbTB0eEhiWThaWTJZT2thUXhJd1pVT0ZiMjFnQUxzSW1uS1RDaXF4eXhLWjZOVWgzTTlUaThQZjc4NHZxQkhBQnJMOWFlQURGamhTRkFzd1JnQWlORmpncXNhaHhDQ1Nod0k5R0tpeStrS25VYnU4YitPMVROa3BaVmVMeENTSzBIbWFVNENucDJtVlFTc1hSQmtCUTVTU1hLR0k3U0FEQjVMc1FaWVBqMTRydTQxK3IvWjdKRDZ2TnM5bW1XaW5tOHhIRzNITSswaU9jSElVRGQ4MGpHZGpFK09QK0xjY0tDNGZraHdjRkFDQmRhUjBkMWNZT254UXBqUndoQ2hNTjExLy8rbzlHTUZRcldaR29NdlNQS083d0FBNDBWWEY2aU94bERDanJ1djFJNEhTTlFwemZSVVNEYVFBQUh0TjhYbU1aeWMxQ2EydFlYQ0E4bG4xbnRQQXBVVUFjbEltYmQxazByUnNoZllOcWRsRXVvRzFLaDFPRlF2cEJkdWNwc0ZZaUFDVGlVNFdFSmxWWTZvNG1xSzRNdEVFODJvcXUvL3VRWk95RUJXWmswRk1zUmlvaFFBbS9BQUFCRTgxMVFVeXRHT0J4QUdhMEFBQUU4STNrZlAvckZoTWJmbVoycEtzQTJra25IS3JjdnlwL3RXbTNjTk5JbnlWa1lSbW1QNWJQMVV0dERTUjhMSWtSS1RCWVBCT0d4Um9lTFJrbCs1aWxsYW9oemtOUldPdVcrYkRiMkN6bEpJVGJPbVg2MkFCN3o2QStsRGtxdDFvNzB1elVjcDMrMWlkbHEzelBkVjBrQUNFQUFBTDF2UnNBYVFQWWpzVVdSaUFWenNBNmljd3YyQW5KbFJoZU1aWHd0b0VNWFV1Vm4veXFoZytkYTAyQVhTZ0VpN2QyOFZaR3E4QXZVb3NoVERybnhmZ0JpRWMxRVFHR2FzNnMwdmUvLzN5aWpTN0Y1Q0wyenBnZTlWY2FnalZFSjZzbFc3bGY1TFlaM0lIajZOYm9pSHdVT2JGeHlVOGxkNy81MzlYTDBLcUFrTEdDb3NMcENEMzl5aTFXaVRaZkxCSkhaQm1yZVRaWFdRUUpJY0lwWXdBR1lUTXdvdFFwbm4zVEdhNFo4VnJ1dTNDMVNtU2pxUVFBdC9kKzdJR2txY1VjV1dRUWduZ01nVU82UEVDeGhFTkNBdlcvTHpNeFZ3SER1T2U4TXVwYUNKdTJ5QmxNUW44TlJpWFkxNWJNclFpODFYdlB3dmR5Slh5ZjFJNlRNeklOQTNJQkUwZTZpNlZ6Ly91UVpPYUFCUEZVME9zSlJlZ2dRQW10QUFBQkU2bFRQYXdsR1dCckFHWDBFQUFFbE92ZXlMdmVlUFAvaHl4aVlsN0s0NCsvV0wxblNZbmg1TkFEVnkwMEpKeDRSQUtGandsellTYitmbmFVRUZnOU9GZ2FpZnRIU2E0UmlIUXNJeFIwWWJhZS9VZnh2TTEzVnJLZHNNbGxva3FnUk8xTm5sdG9BRHhFTEVTaXdHbHIxNHNkTkZCOHBtV1dZL3FGdnZrRk5QeDlTQzBLQUFHL205Q2pRdDgyc0VVQkhrSVFIVUptcDRvUUs1S3dwc0lDVmpwd2dvK3g4RW5SYXVZRkcrYW1ZaEx3YTR4a09Sc2ZDVmpRMDJTSTRScXI3OXdmSVFqRmJMcHNVVXZGeUFrRGJGTmtuSkI0cTFrdXE4MjVrS0tTeHQ0c2dBd3VUMTNYODZIVXlZaVdXS3lITHdraG9Jd2xvT2tITE0zMnZkVmRzWUVNQ1BMVmJNUXRWY2phbk9jNVloRDNVdko5Wi9GMm42NllpSHBMWFZJMkFBUENqVERnMnVOSTdGcER0N0tOalpwT1dKdHpucS9yWUkyakJBQTM3bWpLakdZRFlab0RtQTRZd0VPSXZZWWF0SXhwU2JkdFN1T0xIZFFGa0lVWmJ1eUZ3V2RnTUlTSTcwMUVuZXNLdzNNYmFtaENUS2JJOGt5dGtZcGNSNUUzc1J4WmhNT2hDRnVzV0xrdC8vdVFaT21BQlRKaTBXc0xScmdoWUJtZEFBQUJFeDFYUWF3OURhQjZBQ1gwQUFBRXRuZDBNS1V1WlhLa1VCOFNpREtjUkRmQ2lQWGVoZ3drNFN5TUQxckRvdUxFVytxdmwrbzlYb3BtbWE2NmNoNWlGU29HVWwwUU5Hd0ZrWDdtcWx0RjY3MG1CRW9OS0trZGtZQUFjUUx1YkhoRUVtU1VVcVE2aDl6c21uMk52UXFoMnQ5VEFTa0lJQUgrbHRFSUFyOEttRG1GRXpGWXhsRXRoUWFsWTA0cWhUV1ptc0kwdFJwNUEyenNGUWd4U0ZIS3hJMEZJaEpEejFYRENya3BlTzNrb1JwTzJOMjhqdGJmRlJrc0NDM0t4NFpxbVVzYmM3SGpXNDE4WWlhekxXVzhmY1BMZFgxeFRXNENscEhqeVZ4Zi9XZTFZejhaOE9sNW51bU4zYUhoMDMydm5PYlc5NzI5OTd2YVRHL1crOWYyM3VuL3g4YnRyNjlvVDZFT1Mxelh1Y2xnMTF5YnJCZGtPM1YxeVcyQUFDcEFja1hlWE9FR3VkS1ZhMkgrNTJqUlNaZXVxS0Q4ZlFnQUNVQVJFRkFqZFhFa2dBQURLR1EwSnpNekNETjFZaER3RTBBdFNKQlk5c3lNRkNEVHhwU1lFR0FnR0ZSQXlzMExVRUNLWVlFWndJYzZha2ViMDRKSGpDQkRlb3ladUZ2UjJXeGhCWkNtTnNQVlJYNGovL3VRWk9pQUJLdFV6MnNQUTlnaFFCbC9BQUFCRkkxVFA3V0hnQ0IrZ0NZMmdBQUUrRVB3Y1hBQTB4REUzd1FJRGx3a0RURkZiNEtFS1lMaGQrK1lzd0hCaDQ4enF1d095bSs5dDZLU3U3VXNYb0JrbHQvZFZJMVNVbWVybjRhcllaWTErYWdDbS9IZWVPdTRmLy9OeHUzZDcrdWN4bHN6Wm83WDczcXhQYXFOcC82SDJiZGZWLysvLy8vLzFtekNCc3l1Ykt6TTBmZ0FBQUFBQUFFUW9NZTk5b1ZNQTErYTUydGJmTTJ6Z1ovcklZdEV3b2lEU20rLzRpQ0ZabFZoM09QR1I1QVRCZVpxU0xEUzVRYWQxYzQ2Qmxqa284YUYwZE5xSTI4VmtjL0VKY0hrWndrZnJMVkJYVEU0cXFWMWZNYUM0dnRQWFBNUlVhaHNiL2NTbDkveEtVcFN5Y1pOWGh2OStQZTkvdVI1QWNNYjNyLzd4ajB0ODU5Sk56Um1IRUZ0anYzeVhPaGs3OS9FeXozcDhVMUFoZVNCRW1ZMytaNDlOWGdWbW5wai81MzcvT0tWekQrZC9IeFhjOVpyV2VhM1JTUWdhckNrcWEyeUFBQ3dmUVBRd1pZek9DR0wzQzlLSlZEYTloT3JTVHR6YU5SQU9hTUFBQi91MnQwRGNoUUlKblJGUlFqT1hkS0tLeHBkbHFVeFlnemg5bVZOU29XVnVyQXNtMkpKLy91UVpPbUFCZjgreSs1dlFBQWpRQW5Qd0FBQVZHbHBSLzJIZ0NDR0FHWC9nQUFFUFg1TFVhNFJJRUMvMWpkME9YVzQzMW1GaVJzNmhtNkduU3JYU21PWnpyUjlHaE03TGlFZklMSU1JREtRMU9taXZGdVE1N0VoUHJLWTNrZUxqQldLNGJQdXU1TTcwOVBmZWtOYVdXVTZnZ0FXRU1tanlUUzhhQktYRDYveldzelpxQzVWTEpPTVhUNmt1bHI5YS9LN3VaOStnam5XZXN0bTA4d0Mwb1lVd2c2VmdVLzVXZWNJRG52M210a2JBQTFvcWdvMVF0SkRMQ3FDYmxNVWxwRmtyNzhwV2gxK24rUGJiZHFBUk9ITWdJR3B2cE5aTVl6R3VKY3NyS1FBRnh4VUVyV2NYQVE1UE1tTTFLVU5hVGxQVXpDSGx1R1dXQkhHaWhaYm5yMkcwSFZsTk1jYmFVSEVOdzZ5bDFLL1JUSDFFeVBVTml6dHkrOGZQZk5URzgxOFNKRllXNXBQV2QvMmFQSXFUTGFvRDBxUHBhZXRxZ1Zta3BSbzg4NFJCWVBCSUZSY1FFQUVCcDNEYlA5eEtOTWU5MVZxTEVqSk1ncDNpT2FvZkRYTHhDN1ZLbEdoSTJwYUZRb2hTOUJJaUFuL0k0NUxYRUFBcWtpdTg4MDZrVnBaZlRLYWhaZDdMMWMvNm10TVB6L1Jvb1VtQUJLSGR5RVU1LzNiWjhUaS8vdWdaTlFBQllwWXorc1BaSG9rQUJsOUFBQUJGRzFqUCt3OUQrQ01nR1cwQUFBRUFEalhscENGSU9vNklnZ0ZncHVvYUYxb3NtV3pSUU45NlZ1ajd2MkdERGl3UURZRXhzWGt6YmxGaFdHQldvcWlpcUh5Rkp0QkZPS0t3V2loSFlvblZFOU9UY1lySnpCcDFRa1VWZldPVVJUYldYVzNmNDM4OFB2djZwaFpKa2JoNlVYQktFNDBCNEpCdzdTME9pSmNlVWFnYXJ4Q010T0cvY3JVK2J2cUV1Sm4xVW5WcFBqSUpKRTU4bGZaSUdBRTBaNFozZTY1d0FCQ1ZuRUJwTGxLa3QxamN1Rzd2ZGlCLzA2c2FBS3MxRENZTlQ3dVdzbUE3aEM1RFlRdkF3VDRkcHBOZEpKS1V0eUFBdVZCRVUyekE2TmdnQ1ZBYWNFaElteFBTZFZlU2NxSWduV3FOOWs2SjRsVUV2VGk3RjA0d2JSNU45SytjNmdxOUEvTmF5enJGelNFa0ZJc2FiSXI1WDlhdEVwYUtWWWc2QjZiakhPQmlCM3ZEY1hmMUsyL2VVeWFUOWNWMk1aanFXaHkxU3hSdnd6RDR3LytUSFErZkpMK2JRQWl3ek1pTlpaS0FBT2dxQW5PV3VpOUF1MGZ6V2wrTnFxOENrdlM4a1FiVFFOR1dIUWtLMTc2MjE3d01VS1JiRWdhRlNFNFFVUk9RZU9aU2wyMmRBSUNYcmdtQi9vNWFPdFB6TmE0UXVNd3YybUljaXpEaEtwbWdLY2NSM0lobnJJMVNNRDFkdTM3ZnZPNnY0YmVxM0xPTVFyanphbEswYUF5eVdWRUoyRm4zV2t1VEpwYm1ucHZaNjM4NWg4M2FhS1ZEbU5vSkFKR0tTMnN6dEZkRCsvdVo3eisvN3d2ZGQyMy8vdUFaUGtBQk5aVHovc0pYSGdjNEFtZkFBQUJFaEZuUGV3bEQraUNBR1c4QUFBRTVsUzFVMkdNWnNHUkpwMUZuUzZISE93L2VZZWJtbHVzamJBQVE0QU9XOEFVbG1tckNKOEV4R3JLR21DdnM5V3JmakdxTTBKdVhXR0JreXlTUkJFRXVFUVJGRmxneW95aVVxTDlEQUVyek9BQmFWNlhWWUsyRnBPTG16N3BSV3JKMzRNREY2encrR2x4NE5sc2tFbXhYYSt2WFZqaWxaY2dhV2g2NmlvVjFxcGREcktVNWZwQlpqRDdtOXc2eTlWcnNaV1ZPeXk2c1lmYnU2UUQyS3lQT3J2MXJFNnhBLzdhdGtRSGFtZ1FtRjdrV0lnaE5ZNmlYTk9sWXoydjBNWVp0c21GRFRZOHlWRlA2Yk5zVW95cmNsVFhwQlVUY2pqamJhQUNWcUZGcEF0ekE2enRkUzMyMlhQZDMvcytqdCtsTGY5bUpCSmNkYllsQkMxaVFhU0d5eTRTRVdvcmhRQk5GTXhZRklDSDJSdERaZEFML3ZwQjg5S3JjY0NyUThqWkpaYlZ5VERySXNuUEU5bUlSWlpFaXRDaWFneU1vUU9KbytWWmROMHpLOHk2V3F0ZHYyVTczclAvKzVCazZRQUU0VlhQZXc4emVpR0FDVjBBQUFFVHhZVTNyREJ6NEhRQUpMUUFBQUJsVDB0V0d5YWJLU3BsZGhQR1ZXL0xrQnBhRWNLTVhENE9iVEJ1V3NacVNOYmZhYUh5dEhCSGdiYVJJc0pFMUljaDVzZm9zaFJZYmN0cmU3MUFIT0RoZHdxUldKNnBnc1RiN2ZhU2UyZEhLN3U2bG4yZmRvVkplRlZsSUNuSkdrVFlUSnlqbFJHekFzS0xlaENoY1V4eWtFUWtNenNtQkxXeUNKdHJBUU5TeUdvTEZXaWtrbEU4ZWpoZHV5NVYwdmd4VGxWWEN0ek5lb29UcnpwMmt6U3lJcDM2RC9jNTVteXJoa2ltM0VydEt6UGorc2creXFjVThiY1oyWm1KT2M2SzhRejAxYXlRdURzWU81WDB5b2VySk1pRnowSjIweUMvN3QrdWYvLy83NS8yMkUyM0ZXMzVVQmwxdklxc3RFSWMzS3A3VTBGelRLZHJHK3EzVjFMQWFuclA4eWh0M3l3SW91TnBKQWJ0cndVRE1vTlJjaElLVXdnQXU4SWdrNVYvcWlJaEljYWM1RHdDQm9ZTkxDTWhPQUljUGthRVVOUlVibzZoUUh0ajZWTUR5aElRSDBDejA1V1FqQ0UxRnJQaitsQmlkb2xZZE10MVFrQmlTRVFZZHFxaTdwVG9NNHBZZ2s2c0lVa1F6SXRDaU1jUGwzd1ZVUGFwMlNELys1Qms2d0FFZlZITmF3a2MrQi9nR1N3RUFBRVJoUDB4N0xEUHFJbUFaTEFRQUFUclhORDNiTU9JRDZ1c2QzY2hGN3RXKzJXc3Y2RzdISTIybTNFQUQ3VWhaTGtFczVGMEg2dEZ3dzRsaVIrdDdxNTI5eTkrRTd0cWRjSzFqb0FTVWpUUk9VczExd293c0FYdUlEQjBNWkFibVhHVWtoa1gyVUJkQmQ3MEpwaG9CakFWQ2JtQ1VMcXZnd0NsaWNhYlVDeUVlak5kTjhpSkVVRTBFQTVmU1BRRWcwa3JQSWtTNVNsVU9XVHc4OUxSTzN1b0tNbmJ4S0syekcxbTJNZUdiTW5zeVp0WEd1UHlKaG5jMzQwdE43R2VaWTVvK3Qva1RYZlcvT0R5elQxRnBoUmNVeUU0eEdvN1YxMnRyZlVhZjMvVjBBSURESldOY1dXUU91VGM2ZHNiNHZmdE9HVHMvWTh1amF0N2FrcmU1RmpsLy8vLy8vMUtCZDFqSVgzL3lHRkFsQ1VwcVdZRnR5TUpnZFFBa0JLbU90cWtvalF2aUVzMGNFZmdZdG5SMFlIU1VhRGlGa2dISm1tTE1xMjBJZUNjOHFqWGUxYWZkcWJWWDJMV0gzTGptbk5SdXFEMGdnbkZoVEl3Z3p0SEZDeFpuUkFEMm5UTWpVUUNOampnd1JxckRHNVFRSVdFMXpOR3V5dFJKME84Rm1qV0gyaHdHaExDQ3hPTE5Oci8rNEJrK29BRVkxYkw2eWtiNmlQQUNSMEFBQUFTZ1VrbHJLVFBRS2tBWStRUUFBQ3k0NUJsYWgzUE4rVTNLL1BpMlcrVzZPUnNnQnBJclNGR0JGY2lRSDBpTmRsS2FoY2F0ZEZzelRJTlRNMnZWdm1YOFlCTXp3ekVaSlJ0b0VEVUI0UnVVd3NSaFFuQUJyT2w3bUNDRnhqS01FWjJzVllWdVVhZ09ENktacEhHbFZjUGlNWkhFRFphaVpaQ3NLVUs3TXprQlN3UmthRWxJZHYrMUlVUGRFc3lnZ1dUcHBwMVQ5bWtlbzFFcCtaaU90eWxPRVlUeFdWSm9UVGE3bnJUWFgvdFNVK3F4TG1UMzlHbVpUWlZOVzZWcTlCSEk1WUpaVHJCQVlJTmJORWo0dklyVzRYWWRQTlgvL1hUaEZjSkFBVklraExrTHl3R0hUWjU2UTlhM2xLZnMydWNaSk1SLzE1ZDNaL1grM2U3ZC8vK24vdTExU0pQNjFERTNJMnljak00QlVpNEJaZ3dUQnltQ2xoUmJ3QkZSeVE2TFRmTTFCdzRJSnhFRmgrR1NnNFBWTHE1MFhGeUZSQWZMbzM0b0QxeDU5MnhoRnpkS3AxR1VhOGg3Rk9aSnBjcUVoU3NaVXNEVWYvN2tHVG5nQVNUU0VsakRCdmdKZ0FaVFFRQUFSTFpVeW5zSkhQZ3JBQWpaQUFBQUd0U1E2Sm9rWk5OV3duTXJsWEdaaEkxaHp4Q25jSElLUkt3eHk3RDNHVjh0bGN4Ri9TRkl5WFRsVlRVbTVnd0lxQVovMG5IRHhhdEJBVmZjUmZ4bDlJWTlsRmxrc0xRQWFaWUlnVW92T0RLbE9GZWxaRkRSNWhTenlXKzd4Z2prN1VraUFaU2h1cHhrcDZWdEV6VlVna29CNkJ1UWU4SW1CRWxEUWlnVkNvT0RwTW1VV1NiZk5hamNZTG5ZdmsrSTRtY2VIRmNVWEVvNHVjTklKaWMydStNYWJSbFNmdXhsek8wbzJmWDErcFdnR2RwZ1E2Q0JMalBXRUxMa0xTMnd3NUtCcVNIeE1xWmcySHFxanAwOHNXSlZFRDdqR3g0Z29XWmVMUU1jQ3Bsc0p0SE1UTFJSWSs1NUhPUnNqUlhTM0loWmlLWW1raWdrcklnRHVNUE1PbW1LMTNoNVJEWXBpMUxsbzF2THZ1cG5OOWY3bHliYStxdi9xMC83SHYyTy8vL3QvUXBEZXVXaGFhamJUUWs4RW9hNGFYaGhHL1p1TUZYV0lUZzB5ODRvVURjdGRqYUpkdDBwbkp4UXR3RVEyVGpjamtsNG4zcWlFVGdiUkRpcHRsdDVFNVdXazgyM3JrNkY2aWNuSXpWZHlERWwxS2RLYi9lcGF0aTAvLzdrR1RvZ0FTZlVrbHJERU5nS0tBWlRRUUFBUkdCRVNHTUpIRkF3UUNqY0NBQUFFMnFsQzdiVDBXRTJObGZHWmhMeU9QVEd2RnpZcEdIeW5XTXR5THV6NGtFRG0rRktwUVYxR3Fray9qdDVHeHV1enFxWFl2bDdWc3dTL2Q5T3plcHJ0VlRTQWFhOXlpOTZFTFV5MGFKdkQrODc4MnErNGphdUt1eVI4M2E5UWdWMi8vLy8vLy8vLzFkYUFqUTVJaUUveWdEVGdlSU9oUUVZNERjUUFNV1JCeVFWR1FHcHpXa3VyYkdKQzc3d1JSdThIaGJrS0FKUWt1czJoT3J2UkZ3MmZUY1hYb1B0c25waVNMWkFqV2JpbnJaRzJhV1F6VURqaElEUUdLQ1dDQUFJaVVMaG9kbGJQakVRM3paV2NFTGRWVWNwZHpaSS9XeWg5ZE9XRzliZmZSam5uTU9rekQ3bm5JUGt6eWp3RlFGMUtmTkVoUGIzMTJXYXhDaWswMDBvMGdBaXh4NXcycGhjNnVOWFBWVXNZTVhyNGpFaUNTM3lqNHJ0MjBudnJjeGFvTGZuSWpOVk1CaENiUVhjbzBLWlF5SEFsSlM5SUhLVUhocUpvMXdLRXdJRWdEcHNqSFZhWVhPMVRHUHFXN29NYjlUZlhMOGRXbnl3YzNoY1VVYXJOWVBUdnd0M3B0bk1iTTZhTk5TcnNLQ1NDNlpHanFwaEU1TUhNWEJDdi83a0dUcWdBU3BaOGxyQ1J4d0swQUk2UUFBQUJJVlVTZk1wSEZnbVlCa05CQUFBTllzYlpTUHlSNUd2YUs0aE5rNWdqTUkreUtwbzNLWU9MbUJuK1UxdmJ0LzNoT2ZFekdsckwvNC9ybFc0RnB1L2VoY1pNSGRoYnRXM0d5QUhuaWh0dDFhQXE0UHQxUFRiOVNRSXhrMDFMRS9aY01yaXZTaU5JYzFVanRYL3lNV0NqZ09GQk9vQ0hLTVFPVTVLUkRra3hIMFlxN3l0bDB1OXpXK2pFbjN0NFVncXI3UzlpeitoV0tzcWl4S3NheG90ckxHaVpzd1psS2JUcmVoOEVzVnVPUWt0cGViRTI1dWdDRTYrdVVncEVFeW15aVRjU1VaSmZkd3lOMFdKRkFnQkRmSUEzSXdSTVk4RW1XMFFCT2xVaVBTTzJIQ0hHS0RSQVJJS0lLZ0p1TEpGbUNTdXpxMFY0ck9vMVp0VlJHRnFzSDFGaTE5T0Fia0tvam0wVzBMc2hQaGdtR1REaENLZ0Y3dDJyLy8vMnMvOXE5Vk1CV0VSVlJlcitwWDR5OG5DNjRPVTN5OFI1dzFBTHBYYWtPbFdodlNxa2k3bnZ1eWFPUDFuRkoyRzVQRGpXNHRQb0dBbkNzYXRJRzF6YWMxRHRxSHlqUGFHWmNZM1U1S2pNd21UczJxVGN1YU10aUNNMkhOdE05RzB6VU1TVWFIVklXYkZmMU5VWVVjS3YvN2tHVHRBQlNEVVVoakRCdHlJMkFKVFFBQUFSSk5UeU9NSkhVQXBnQmpwQkFBQVAraFpaSjU4dmd5WE9EL1VCTVYrWElyRFBYdU1CMkVGRUtnZ0NDZ2JZQ2JGczIxc3RTbXRMVmJ5dEtrZ0FMNldVMEpEYy9YdXZQL0swamg0bTFMSjRPc0tEWmhZY3dqaEhkVXBCcXN4ai83ZmYvL1YyZjJhUHMvN2xLLy9TUTQwOHlhdjZSTXNRckhqMnlCVTRDbElub2NFRFVMNCtqT3FreU5kc0FLS1M5MG9wYTFzUEE2T2l6QmFFVFNJUk9FaEtRSktNa1dIU2RHc3ltK1JZMUZaODJpZFJBdm5Rc01NTUZRK3NJWXRVTVJ4SkowdW9hNENJa04zRE13K1M3THRIYyt6NVN1WDM0aGVob3Y3OFo4cnBWMk9rMTJMZW43K3J0UHZ0WlRmdFNkQXN2QVI3YzVYQ3YvOWZQWHU5emREWEphK2V4OUg3eTFLM1dpa1VZU2lJeVVBQkIyTG5LdFRhQWoxSWNNanhIZlMrUjFHWWVDRXdRWEZVR1JleSs5bjNaRWVkQ1lxbUxCeEg3UCtqdDlmLyt0ZitZL1FrQTJoMFJsS0tSdVJFNkVCVXNXQkhBaElXZVFFQTBGWU5LNFdJUS9McXRBZlZac0JSYlZkWWtRZ3lkWlJFUWc5RXFzR1FtTEI4Z1JTYmVLekxaM0JHT3JZcVpEOEZFajBmLzdrR1R6Z0FTSlcwbHpCaDFRTmtRSTJnd2pzaE9aU3grTUpOR0k2ZzFqZERDSStFQXd4STl0UkhBeXQvaWdiSUZMM2xadWVEdVZXN2ZWTXZCd1dqQi9md3UxdTJIbjkxR3BmQ2FSQ3RWaDBOWnMyVzg0eG16dVhudDMvL2Y1dnJhLzNTdmU5N1ZvWUtyMk9JTHNGRjNhTGJhbkxGa0YwbTBrVVpBRGpZY1hFQjh3bHMrT1dFMHpZK1NjSWxpV0U1enlrOFhCWnBaQ2tKbmhjSXQzOUNDZHlhYXIrcVQ0ODF4TmdhWUtJVlVMNlpybUtSalUxUUxsWHJGRnJ4MXdHU2dZRGh4WlFGd3dWbFY5UXNvbGdpc2JyQ0xkcG82MVkrMWVObWhUYU9tS1BaSEVXUDh2dHJLd2RXNnlGaWtvcTJ4OUJKNU9lcExhNGNiakd1S1VlR1ZRb2dUZXV0bEIwVXJ4VXFPNFIySm5QZ0tWSXhtU05YUnF3cEtUa0lpQ2xwK2hnVlRvVHZjaFg3eUdCLzMvLytqL2lYamFZMTJzUnpiV3l0MXB4aExCNE9rN1dBcVBZRzJIa0ZVM3FsUVdKQUo3cm5QeDdFOVJNV1hlbEYxbENTQTNhVVZUYXZzQU9aeEVrU3VoNllEckJtWklqQ0NoSW9rQ0FjaXlpeE1Ob3BrKzhRaDVwdEdkSkpBQUJncUV6QmFEWnNqUlUwY0RETU5pek5kQ3NqaXBKdi83a0dUaWdCVEdWVWw3S1RTd0ttQUpQUUFBQVJMMVZ5R01NRy9Jb1FBazlBQUFCRkZDV2wxNDZiVmtZY2dUbDR0SWFyVWFOYlVlTk9wUlB0bWtNSXN1UXBMRVp6d2JRRWZvb09tSWVXemFMdVVOTWxzZ081UlJKdVpHZFcxelF5UWlYbkJDMmdCNDViQTh3ZTFoSlFUTjFtajZrMmFld05TYVIyU3lKTkFIV3RMRHcwU2VaVWtoRXJWcFlMRUNvOGVxMUJnUS9xOS91MTVxbXQ4dXo2YTZLWUpyVkc1RzIwa2lCK2tHaHBSOHpITVpVVkJBRXNHSUF3b2RGZEtPcUVTeFZPR0hTbVdyMzRIa2xMR1lndUtCWVlnQ2xHc0REeGl1V1BuaE1VbzFtcHFxa3BIaXQ1K3ZZWXVtZmYzK3c0VjR1cnRXcnczcGVHVTlRemcyaHRwTVhjeTF3c1I2RklzY2xYT0k1TTZ3cFlDNUZrRFRkU0xzZEt6WVVUUEhBWXNJQU9jRndxc1VFTExtbjB4dFprUnowVXFoOVp5YnRWN1JKSlhISGR3QUVwb0FJSVlhV2hpSDJJMEp2QUNwSEZpcXlyWDZGV3AvWjdkMnFpRnJWSWpDc29BRUloaTFvSWdPd1ZZQXNBWVNWNFZiQVk0QmxCRUNDMEJUK3RHQ1E3SVpjSVVCaThMa0JZVnk3QVppQVhGVXRvU0ZkNWRWcFZHdVl0dGJlL1hiYXYvN2tHVGZnQVNzVlVuekNSeDRLb0FKSFFBQUFCTHhMeU9zc0hVQWlBQmtzQkFBQlByU2xKMmxldGw3MzZtdTNqbUZYenpOMnZ1OVdpdDl0akxYeWJkNzFiMnRCTTM3NWczdHQyN1dPQzk1NlpkNXNqamNjN0ZVWDczTHMreDl3ZWdjdCtDdS9IWXpWRXp3R3I2TzlrbU4vTEp3TlU3N1dEUTFhNVk1ZWlBTk5NR2dza0VDb2tXaThzcytNb3RhZ0ZCWnluczNqTjg1MXRkVGJTYlJpbkhDQnExTXpNeklxcXB5TkZnUUNnTUFHUXNheDR3eUNBQUkraDNOOGd4U0RmSkJVd3VPWVNaaUtpQXBpd1E0YWhnS0lNb1Y4Rm5FYndnaWdoZlJNUmR6bEo1TWVoSWtBTGpieUtLN1pKTUpjSUUwZldUdmlYYmVkdjR5d0dqczAwQ3lpQzR2Q0ppS0FZQ2RGbVUvcW1xZm5udlZ5QkM4WmJOWDZtN1gvL1BsN0RWZTV2RGQ3RjE2TndIa1IvWmZhNXp2LytlOHZ4M3Z1dGE3eC81SFppZHRyRExPYi85NjUvL1d3M2xsdmVQLzMvbGtZbGtQMytaMDlydUg3eTd2TDh1Zis5ZnY4TmZ2OE5aYi9uTFo0UDJBaFJFakE0QXhDRWozOEVvZUlDcDl2OUJ4aU55QU55UnhzNEFBQUFBZU1KSEVCb1pnVmdkTmlkUmxTRDdLZWJ1TnMvLzdvR1RoQUFUT1JFZmxZWUFDSjZBSkhLQUFBUnd0ZVRINW5CSUFtWUNrc3dZQUFQLy8vLy8vLy9WVmhsZTZlS2w1Um1Ja1VnamR0YmhSQU9tWWpFVWcwWlZCbytaUVdFUk9oeUdEZ3g0R01CSkZ2QVFOTm5MekpqczE4ZUJncVRjQmd3bUVyaVFJS0NEaWhRTk5kYlptR2c0bGdpUHBkWmo2WWNURUF4cENzYUdsMWhwWWlzcFN6WlJKS3lqRVFxZ1FDUldxMXRjZ09CY0NHR1pzc3VNaVlPMXhobExUb1pVc2hpTDlNcW5waG5VQnZkRERqeEdQTjhXK2EwMU9PTkthbXFtK3JKWnl0UjFXdHZNOGtpcExGQ1hWbGtNSnl2bzRhWXlPcTFkWDZ2Y3NLdmJzNVQ5dzNsYzNuRFQ5T0cwcHhwVS9zZ3JYSDYzdjhlYTUvNy9MZUhlL2ovL3pMVnV0VzNaTEN3VVhYWlhVeW4zQUVWY1NWbU9OYnJ0ZGR2YlFBQUFBQUFBd2h6c3Z0TTJUTldPRWRYRk5NSmlIWXBFYzRpMU44N084MVRPeUtnVkpiYUl3eC84cFVNVkFEUk5uQVVUdU1ITTBRZUpnaE1oSTF0SmliYWlUeEdHSlBQWTA0OW5SVGRXaVNsK01xcGFOU2tTeTh3MDFHZldlYjZ0V3I0dyt5bWFjMzNuMkRxOUVTV2pUR1dybkwrNnpLWmZ5ckdLN1MzNHRieUdPMk5VZGl2VnBmV2Fyc25Ld1Ixek1tWm1HdTJpeHVtdWZPVFAvMHpuenYyeU90SnlkeTFLMXl1VWErN0QyMFhUTmExdGY3VzZuZDhQZVRMeDJtRUpGR24wZ0FJMGJxRVlDY2VJcFdyY0o5ZHFSZ3NseWQzWi85cUpqZWhCNnRTTjVaMWhXTkFwTnVQLzdvR1R2QUFkdFUweCtieUFBSklBcGZjRUFBRlFsanpIOWxnQUloUUJrTTRJQUJNYkdjbWpTaTB5TmdNaUYwUTVLQVVFUkVCUlFzSmEwdVRrVXRhZXZOL0lOclFITG11dVVOSWFXZlpGZ01tU2N0RWtlVGhWQUhLb3RKUzNMVUpna0RCaTJsRlRuMHBFV3p3NktXTVk0b3Fzc1ZQM1ppOHVZejBWb0xVbWxlRzhscG5zWm9XZFkxbTVaUWljbmpCYWhSM3JMZUV3dkl3RWFlT3V3NVhmVTJzNEpmUUlHTitnRE1TWkNUTFNBZ2tRVWRCUStodWh6blcyUmkxYi9MQ21NYnJReHFLVGJibWYzSy8vLy8vKzMvNjBmOUprc3l5cWpJUVU1SklXQkVCVFVFdWVBR0o3RjZScUNGOEtRdVhtSUJDd2xyTG1kNlB5U0NzSWhacVM5OTIxd2owdG1yMHg5SmNuTjhsSlo2NHpkVENVRWphSWJoVnpLK29Dd3VaS1ZxQy9zeVlTU3lIcE9CcVo3UkxsT3BDQWk0U3hpT09sVW1FMGszb2swV2lVOVNMSXV1SnpjRUdJcldWVjdXUTJPTmRPeEJVVkRoWnJ5V24xUGdJcUVTd0pnWnY5WWJBdGREcWxRRHFCbUZDNDJYRzd1eDJ0K3RsVzJLYTFTem4vd0t5amRZU1ZLMjUxdEROZlJHRkRrYzZwcmlONHN3RkNSSUdrTVRNb1MxS3dDZWVxcmhOZ3Z1QzVOZ1ZFQWJMT3NqSG0rbXpQUlZMb2hJbVJrVTJUUmZwNGNFYTdMMVpTT2pzekxFbnRqR2M5aU5XbkRvRXF4NlVVeHJ4S1h4ei9ub1N0MjJ2dHhKais1ak5UdXM3RjZnL2wwM3pOdW5UNzB6czZveFJKUVRFb2pDQ1ZoeG9WWThmLzdnR1QzZ0FSeVVzcjdCaHppSytBWTdBUUFBQkl4aXl2c0dIVkFmNEFrc0FBQUJNMHdYSUZSaFVVQksyS0lobE9yOXNZd0VVTzFOZlFvQmhxbkxjTHVQTzNYcVdwSmg2VTFyMlRQOXFvc215OVNrU2R6UkhLREZ0UmMvVUtraVFnak5DSWFKVlgzRjVCVTRPTWduQ3dReVRyaW9XK2JxS3FRaVlFVEx2czJpc3NPeFNhRWtzRTlVZENPSmpEaXh5SFZTcEFiaGRvbFNtUjdoOVl1YVZpNFF0b01Pb2trbXFORUlaUTl5b1hsRU9pS29raGFQRjRJRjhTbk9OdHpyaTZzaklXOXlIYmlUbytmcmJyNzdxTzdZM20zV3U3YnFLWmJhVnM2ZVlOSWlNQ3BIRWxJSENRaVlQREJZNENySEZIV1UxUkVuMEQ5dnN6YkFBZTBpVFlHRUdIc0c3eWwyY3Q0dFdqZlVHM3VQaW8zcXZiUyt0M0d1OS9mL3FVRlM1NnA2dDFLd1k0azVKZFVPMFh0S3hwdWlTaTB3Y2hpOGRFck5VWHkrN0M0KzE1eGFDV1hLV1VLYndmQnMyMlFBcm1EeEVMckVzS0k3UWptS0VDT3JUOFdzYmFWUTAvTFc2MVExZEpFLy91UVpPWUFCSjVLeVdNSk5GQXJZQmtjQUFBQkV0RlRKY3d4RHdDYmdHT2tFQUFBaFNZWVFPakRUSmJKYkxhVGpKSlZsSmphNTBoNjRuNEtRRTFWalVrV1lyalZseCtWOUFHSmFHWXBLa2pvYWtqMVdIYUEzUkRJMk56TTlESTNIbDJGWW9vMVliL2ZmekR2TC90K05IMjdkVmtuYTFsUkFMZ0VqYzE0aVkyUEtJVzFOYjlFaSt3LzBXcVJyR3BQSXRxOW4wcCtxUll0WVUvLzlQOVgvMS9zNmhCWVp5UXlGcHR4SkZCWVFjRXhNOUVWbGpLYUU2UU5VdFFsKzRqTFNnenRRY28xQnN1bkc4bHBzUWloQURVMW00b3lGaEV5aHNaQW1TNm80b2RFRGtsU1NBRUlTUWtQSzlKaVRDMm0zcnJvSk5xMVNPYWMxM2hoQkF1cEpFdXptd1dxRUZVWVNSbG94b01RSkptM1lXY2JCbjAyUWJjem5oa0JmV0ZHalNEd2tiaGhZcUJ6SW9jRncwc3crRDZYcU55MndkMEMxNTRuc3BYaDdlKzA4Qk1XaWl5bmlwWlF2Vm1MSDJWNmwyLzlLVUpGdzJXUytTcFRWblJPMW4vK2o5UDdWUUo0YVVabE91UnNvbEdNd0NHcHVJQ2pqbDA1QUloQ3hOWXlCSHd0elZxZTFkVmFOMm1lUEpEYU1VaDRDMnpzb1JhRmFaSWtmU01COFZtQy8vdVFaT1lBQlBKZXlHTUpIVkl2d0FqWkFBQUFFMFU1SSt3a2NjQ2dnaU9rRUF4QUJZdTBxdE5JUzJLU0JRVFdubDVpM2R2QjRCNXg0WWJFMm8xOFcyT2hTMERER2RySVpxR1JEdDR3bHR2VG92NTkxN3BmU0xveTRTWnlMWkdhZnl3bzc3bDAzUjZiQ3FLWXdTdDdGdGZsKytsTFlVdW4yQ21vbVVtMUMwUUhPalpHd21XMEhLWDVTek1ncWNDdjgrWjFqQ0l5bGZiaGsyK0hTdTZodDJ0SDdkVEczODFraGNKQklORUVPSnFBdVl0T1FoWWFKZ0wxbVl5VFlOUWh4aDZZVkFzQkJ6eHdNeGFRR3hRME1nb0dSa3VqQnNrSFJnTnJXc0k2TWJEVDVLaE1yRXJOYWJleVRiQVpmcDJiRFh6VTZtY1czajNPZkxLaTMzMnlUVkZ5bk9ZMnhQbU5UMlkrd0ttV25DL3RwL0lhN3ViU1FsMnN4bjczYzI3VmhvallJQW80V0xqWFhNRWxCdUxDd0RRNW9TMElSL2QxaE1XMjJ5L2xBQWhMNXREME5oZHFiY2VwclZJZUVFU0RSV3VJMnRZcFpYOXo1TmpoKzU5WFMvZHJCdXNla0xVY1NMSXRFSFRJSnBMQldRa0lLb0wxSURWV0xFVUdRUXYvRW5DVzBqYzdyL1FRN2pvMUlsTEhCZFNwQnFTZE5JSkdpWTJYaVNDcENoN2QvL3VRWk53QUJIMUlTdnNKTkVvclE5ajlCQ0plRW9rL0o2d2swV0NuZ0dTd0VBQUVDZDNiUU1NdDNKR2QxdUtLYVIvVDBHeTAraElDZEpwUkREQTNkWFJvUzV4MEZFTFlaWjNSK0dXSnVSOHVjc3pXdzMydit3aDExSkNCRUZuRG5HRnVob09NY1BEVmsrNHBPTVlvVW9tVmZyQVRGT1d1b0ZOaVJ4b3hBQUFJb3BBcTFhbEJ2UUhkckY5Y0lpUTZsMXYzL2JmK2graWhOek5TSWRWS2crRU1XWE5TR01HbUNna0ZBd3dxRlFpcmdLSExwcENzQlc2L0N4bWt0RGRHSElrK3duczZRa2h0N2l3UDRTQ1l0SWhwQTBpSXdQa2ZBOVpHWDBjSkNSdWZicVNOUWx6TlgwaTZzcCtmMmVHRkdNV0x3UTdzYnVnT3VCSisrclVGb0YxQ0VBa1d6SHowRFdrRUcyenZiQnI4cjAzVWtOZDhuV2VtbFcvZUx0S2RuOWJNclBUTXRxbVQvL2YrYkgzdHZsbU1ablpnV3hHb25kZElBRHozbmtuMHNCVlFZdWp0Z3hSZHhwazlxRlNUNmx2WmVMZlU2Mlk5bHF2cVp4b2gyMXVOVC8wcHJYbEpvRURNVWN1S0YwRUtCVUVDaHdXZ0VhQXBXbHcwRmg3OXRicEl5NXVucmxjcHVIdFRJaDlWWkFLaWVSZDBWcDBvd09pNUl4UWdVZ2QxLy91UVpONEFCSnhWU09zSkhOQWdRQmtkQkFBQkUzblhINDBrY1lpbGdHUHdFQUFBRytjSUNGaUNxVUpRd3l1b3AwRU5kMzJ6YjBhRFY0Sm1KM3NJZWptZ3F4WWRITEhlUkVEd2swek14Z1JWM1owd004ZW5EUGplM1lmbVYyMm5QejFPTC9rWGxWYjVrZWNVV0hrcWg0YXNVTkpSdll1cXd1RWdtbzJGRTBrQURUZy9Fb2dqQWpLQ1FqUmpuQjhFbWdZUkpNTGpWZ29BbTZHTXVoa2c2U2ZNOVQ1WnBaNy8vN2ZzN2YvNmZUckF6ZUZSMU0wcTQya2pHVXVFSjdjb2ZPUkNjb28wREZrQkNVU3Q2N3haRDhQOGxTaDBhYXpKb01QaHRRUkE4UkM1TUY1K29vQy9Ja0JLcEdLK0NFUHhVREs0dVRJcXhTa1NEd1h6SFdDQzFJbk9Mc1had1hodEh4dXZWTnVucFBKVnRCMnpsWlhUZmFWNjk0OXV1aUlBT2dFR1JYQUFTQVJVcUlGbWhZVldkTUptV2hZRVIySTFIWUJhQVp3eWtHMWR0MlEwQk53SnR2dnJnTkVDSmMzVEVDeU0xTlZubkc2S1hIVXZZR2hBYWFyM04rY2NxaVlHdURDVW5IT2QxTm9STElvSDc1eVJPU3lKcEFkUUtvWVhJcE15Q1FrU21LdFpLcXdhUnA3cEVSV1kxMVAxd2NIRE5YbnI1V0k2eWpWYS8vdVFaT0FBQk1Oa3lHTXBIT0EyNEFqdEFBQUFFbnozSmV3azBRQzVnQ1B3QUFBQXRKejl2M2xBMXQ4V201YVF6ODdaYlpmYlFKWEZQVE5ld3VYNGY5MmdnZU1UNStMUTBxQ1pmSlNlM2hJMCt6aVJuek0xL0Q0emVueVloSE04UE9DWHhqR3l0T004MFZSdlVGRk5FQXVPekFhTHJuY3A0WnV0WG8zbW1xWTdpeVBsbi83LysvLy9QL25oNGJFY2tycXFRREJWcGNUaXlabEpjSXVBMjNhdFl4VDFYOU1QQnc0cCtqYXRieVFhSWl6RnVvQ0tqUU0wMG5RU2liYUJDemhsQStRVkdheXJzTXBCNjVhRmhvUXBSdFFJZUF1NUgrWWg5K2tPQzBYMVpJRTNoTldvYnZRRWlFek1zRXpBNzdhT0NGc2hhTzVnbEpiZzVEbEpJSnlNS04zQlVUc1J4REZ6OVNhU1VvVnJzNXNKRGN4MU1TSmRTT1Q0MC9wR292YU9xeG15alBubFRqa0ptRm1iZld0Myt6ZmtvVnliMzc5ak9QSGZ5N29RblE3ZXRTZnAvNGU5ZmwvY2h6SG1vcVdPUU9PU3RySERqK0czNXhyYjZGYy9FSkVTa2ZvMWgrVEN5Sjd1dE1PdXJ2U3plNy8vLy8vLy8rb0VSbmhtUkZjU0xJQkZvRVJqRGNFaENnUys1bUNCVUlYT2dob3FkQmhvQ0tsTXRKL3AvL3VRWk5XQUJMdEd5V3NNTStJcXdCa2NBQUFCRXN6L0lhd2swWWkyQUNPa0FBQUFjMkIxb0pnb0d3dVA2a1JBM2tCZ1ZzQ0pNakVEQU5xSWhkaXBvODFlSjY3cmFuRmpzMmh1VFdaS094WjlSanBwa1NrQkdTVXltd2lVaGxhOEVLSGp1bDlrcFRidnQzYU5ueWJNU0U5TmJBMlp0UVpOckZobGx6WGRyZU4yYVN2dVJRMUtrTFEwQnl2RFJWY0Vwdm8xYjZ4c0t2djcwRGkxRGRER0pTV1FmYzFKZGFTZEJnQmt6cWxOeUZ5RUtqMFZDeTB2SFBKWGJUQ0dBclU3OVZZYzl6alNxdXFRVkdIUjdwYnNIc0xKSE5BbVl6aEJRbG1FZ1JRalVYa1ovQXJQTEw5V25sZ1EwSXkvVDZGSEdqSXFGTG1oS1pVT0xpZld4OVJYU0dUbEU0Mm9naGI4WlgyaWRGZUkwYVNGakpJR0d5VUNVaERBb2ZoMUR2a3BZd1BFdVVzR2R4ZGhVMkMyVnRVUkN4RzZSVG1DeTNVSGtneGVabVJ6S2tKdENuL1QyeGJpQ294L0gxZzZSdzMrWmMvNVN1Y2x2M0x2MkQvdWxjcWdBZWNrcVVIbUhJT0xxcTBxUWhLL1d5djFUUTJoRGJsUDAxcFpldUwvLy8vLzBmLzlQcG9RU0ZWRVVqTGJqaVNBTUpsakN5aTRRVUlKSUVSQTBlNXFMZ3FELy91UVpORUFCSzVuU2ZzSkhIZ3RJQWo1QUFBQUV3VlZJWXdrY1lpcUFDT2tBQUFBVkVRRHl2UENYS1gyNjdPSWpUb3pxWktFRDVRbkZicFdqYWcyUkJnbE16MWxPWlJtU0d0bWZieVRlbnJjbEM4WlpwdUN4WHFzYmo1b0dJakJxRS95UUlhc0NCaXdnWmhiaTZETW9GUU16Q3I4VXpmTGVMVElIVkt1bVNlV3B0cm1TTTVGL1dtcGdqWkFjRGtsRWFpUTQyUlM0Y2tSb1pydU1TSzlWb0pRTUFTWFFVR0lWSVpNbUVsNkdtSXVZaUJsbHdaQW9DTE5lbDBYOW4vVEhUK1I5TmFIL3E0NmlvWGYvdDF6R3pyL3FDMy9lMFVVa2liWnpLQW1CNDA1U0hRSkVZU3pMUVo0SW1TRVE4YUhCaS9aYTJSOUlHaDlkejZ4U2hpTHlVMVBqd1FDeUpnVEdJc1c5TTV2STBLS05LdEVtdzF0aWQ0czJoZ0dWWnQzVUlHNUlmaVNzTWdsc090VVpYRTRwS3pDNTlTek1zeEpmNnRraE5LNVBUN1lUNXlxUmpwcGVhTkEzMFQyZEo2aFVtTFZtSGpua2hIWW80MHhBd0tzYWJMNzdmL3NFY3NjYmYwcUFTRURuSEhLU0k5RUN1UWxZWEpWNjdxMTBVaHlqNlVTdERLVGJuV0dxZ0o0ZURWVU9Yc0JZRUZvb2lsdlJ1UU9vK29YS0Roby8vdWdaTXlBQk1GV3lYc3BIR0F5b0JqY0JBQUFFa2wvSjZ3a2RVQ1JBR1J3RUFBRTVnMENhYllsN3dLOWJ0c0trT1RUNWNRRUlaRFFNbjNNRkZDRVRydlNYWWUyNlpDa3kxcnBTendaZ1JxdDBtamt2MGFST3ZVVWs1clZrRkk5eVNaZnBJYlF4Y1ROdlJTa2h6U252aGpmYnlCNHU2UlNQZHlEQzJmY0N1ZEtIVjh6QldJNVdraldhbGtqSXQzcitTMVZRRVlxc2d3a0V5UXhnTkJIZDZMRytnTjJNdHB4cXRSQUowaW9BY3ZKMml1M3kzcWNsTHgvNzJMVE94b0hGWjJmeHVUS0trVVJSaURnbVJDUzIrblNnSThPcklhWGFnSU1HRkl4UWx1Z1VDVU9LekZNU29Bb1k2d09MVzRQRnNEZlJZejVsSktnaTNuM1J5aFZuOVRjcnNJbFR0RGcvRzViZkV0eHFqTVByTjlIa0xESjJzbDdydXZ2TUZFT0NKYm9acUQ1bVFRRzR2YkpjbWtQT0VFR1JIcFVxYnVhd3dxenIxNmp3NlpPWnRGT091TUR2RHBGK1pWNTVuMHFXYjcwc3YzVFBoWnREVEhVRVVmL3UzdWxFM0VoY295RjMwZ1Frd3FsS0l2MXYreW4zYXF2VDk3OWk5K1craE5hcjlWMnYvLy9ULy80NmlCNVpVVjBPdm9CQVRDelpoZERCekNTZ05SM2NGaWpBRUNTaTd1cE5NNFhkSzJFejdFbzQyQWxLRDZRdVFwS1UwZUtxR1RhbWxMQ2lBa3loY1Rna3FJU01WSmJja1VZWW1mVmlraEhwNnhkczFOanMrMC9leEpGNVNTeU1kcFhCTlZtU25STmtKcVpybVRySVV6SWwzYm4ybHZPNThNMVpCYjhMaC9DVGhFLy8vdVFaUDZBQkxKZHlmTUpISGd1cENrTkRDTmVFZG1YSjh5d2I2Q2pnQ05nQUFBQWZYY1hrcHVsNlpTRGpVdEJWS3pqRjl5UTNHRzdKTVNBRnV5UUN5OUtIWVl3K2JVeEZHU0t2ZXY5dGdPc05HcmxxbWxIaFk2THFzMDZNZExFU1ZEV2xFSHBYWWl6OVVockJGQUhnRmtra0hZQncwRHloVUFGMkdDTXJIaFArOVM1YWRvamdWSGlKMElvSnhXWTY3S3o5TU1SRXlRc2dCZTBPcDFDMk5Mc1Jtc0tRcFBMYlRqVGE4VXBKTVJpc3pOTnFmUGRpTnloNDc1NU83bEZEbUNaVnlpTzdReVBJcm90Y281aVFRZkJKa0NPR2tXcjJRcEFXMkI1aG1vTnFidElaRlk5TzU1cWxzUlFSbW12R0htZ1luUW1GR0RrdHZOdGtGaUtYUnhxNVhNWUlBOENnUHh4NCsxYU4rMVRGYTdtZktvR3VRaHIyS1pRbGxhL3NWVkY5N09xSk9zY2FNWGMwZE1rcEFSMWdJbUpvSUtBS3NHRkRBZ2NrdmNsT3laeFZRUUkySjIwaS9KZWg3TXlTdFBxOGJaRlpFYjJhYUU0dlZldFNibVkvdU5DaVR3WmFTcWQrK2hRV0I3bkw2RTlwQ2d4b2tLRlhYOU90elBuQ3NlSkdoelQ5d2tveHdJME96M1Z0L0dyNnRmNDFlTjRPOFpwL1RkS1VwbmUvL3VRWlA2QUZJeGh5Zk1KSEhndWdWa01CQ01ORXpXRklZd2tjY0NnZ0NSd0FBQUU4L3pValovKzlWMy9tdHM3cldtYitCWFc5WDN1L3RiZnQ1dFozalYvbTJhUU4wODE3NnY2UXRLNWJWLytMWmQzVHFvMGoya0Z4Z3h0MHNvQXg0UEJJTFlEQ0NTQk5qbG9jM0F5ZTdvOVNDSmRDT2w5Vm54TXYvLy8rcjlQLyttVEVQdmVzbWlyc2tpVEpJQUFBQU1FR3pBUVU0R1VPSERqU2pkYkJoNTZJQ1F3OFhMOUtTTWRTQjRWR1JVTGtvWEhUR3hBT0JnRWdMcGptanRBYXdlNEhOREdwRFE4Z2RPU2dlb0hBRGxFOEdOaGpSbkF1WkZKQS9CaFlreE14TnhDaGtVTVFDTnk4UGdaY2JJZ2dRWWtReThTQkRSWWkyaWFGV2JtWnNYU01MNWFNUzZrVHBhTEE1WnVkTmo1c1pwS0p3MEs1ZmVkTjFybUI5MGFESTBVbElPWDFuS0RwRzgzT0xMWmttdTZtTHptekpyVVp6TlUyV2hXZ3U4elkreTBLSjJiSFUwMGtGVHk3MU15a2tWbzFwdWZaVXhObEpteUJqUVpTQ2JNNjFXVTZhMWYvODhmUVNkYWROYWJmLyttYjFMTkU3RTFRSXVxdnFlMVFBQUFBR0tORjRUTXpabDFTZFl6Z3J0TXZMZzJmbVpOT1RNNkVRY1l3cTlRLy91Z1pQd0FCWUJsU0dWaDRBSXJBQWpzb0FBQUhzb1hIN200Z0FqOUR5UG5BakFBY2NrVTd2OUNGTDNJWC82ZXZhbTd1MS82L2YvLzBmLytxa1U1aXFhYWFIV0dhTXU1WTdCR28wZ0tnQUFvU0JIQU1tUlBHQkNqVjA0UlkxREF3Z1kwd1F3Qk16UXNXQkI0SXZzWmNra3FCaXhBNEZRd3hBaVBMOHFjT3lJeFVaUUNNazJGRTFERjdGODBUVEJIUkhUc0hBQWNBQWlBc1kwOFFsaWhSdHVuR3VQRGhnNGdJWHlZUTRrTEJWUEFob0FvUzFkTkRVc1UzQ29JWUdLaGpRN2VTRWxCUk5NQkZPaXJoTEhCYTJyYUFoQklZdWd3OUdpa2tFc3BaYTRLbFRYbURUY1d1Y1pqRjJzb21ONUZEVE5TU0JRaUY4UXZSYU9PRXdGVXJEYTlTckZHS3Y1Rkgwak1idTJIYmN1THZ4dWtiZE5CQVkyZWM3eCtyVDB2cTNHQmJ0TmN2V3JzL1c3Mm1tczg4R0RzSVEwTDl6VVlqalhJbzErWHk5NUhiZjU5WTQxNTJYSnBZODE1Mm9GdDVXYzk2L3VmODNXN1dyZm5WN2FkaCtIUWNUai96KytaOS8vLy8vLy8vLy81VmdwaDAxTnk2TlpWZjV2Ly8vLy8vLy8vL0RkN0x0TmR4RXBOcFdSdHdwSmZsQUFBQUEwR0Zoa3dZQkZnR0FKUmhZbExoYTlScEJrMkVCcFJEZXNsT01nWC9wLy8vLy9wK2k3LzJOMHBTQ29tc0g5RVdUQ0RBQVZFdnMyUTQyR0dLSGh3NkxyN3JXaVRLRmNFakpld3VERy8yeEtpRzJ1YytJMENDMnl5Vmp1Y2Jja0d6OTgraEw3TkdmUWROZXF6NDF0OU8veEkzVVpuLy91d1pPYUFDbTJHVEg1cklBSXZvQWtjd0FBQUZubkZLNTJYZ0FDaUFHUTNnZ0FBajF3VnNqN3dyZlA5TjR2YUxxZWFzTFZ0M3UzWHp1dmgxclNkZ250VFY3YjM2MXpKSHZYMzFqL1AxaTIvL2Y3bXZpREdyYit2ejZYK00wMWJOcTFyYTljMXhuR1BqNjNUZEsyaTIxWDUxbi9QeGFrYmNtTWFpMzNxdW8ydDZ0anhXQlJxN2c2MjA0bW9pMmtBbEJvRlhtSG56eGFuTG10N1JLTVc2dEw3TmRqRUN1dUh6Q3VwWC9DUHdyNktSVlZvVXlVMUtTNHFqbktNTG1BQkFFZ0Fwc3N1Z0lCUUtzeVZBWXlseWxnOWo5dVVzWUNTRWJ3QkI4R2hzQ1JOUXBKSmNpRitEOUtEQlpoNlhMZzQ0VGVaZzB1QjhKZjZKeVVVd2JLU0xRQWdjZ1ZoV2ZFdFY4VDNYWm83a2VyRThhM2FNUE1ndEMvSHUvbmVQMmhISGlmcFRWbFdoWmh0QVEvTTNjazJtdzMzTEhURW05cnQ1ejlteU1acC9ISFBPUC9XdjgreDhKTmJiYm9nUS9jTWVpcU1DS2pUY1YxVFFJa01jTk9IM0M2ejBMc05uRnVMa0dyMmxha1ZWM2FVdU0vSi8wZEdaYjBvNDFlZ2ozb1NCSXp5aW1aeTBxd2NrRVVFTkYwQ3BJSUxYQUFyTlVmd2dRVWF6VkVsMVhqZDFOZDA4SWZtWWhFcHFBSWZvNVBMbmN1WElMcGNxQWF5SVNTTlhFRE1BSWtNVFN0a09DYWlhbzA1QTlBbHFBT1FFdzRyS1BYbTdyTSt1aWZtN2xiUjBWS3hlWGhkU3c2SlREVEZQVy9saE5NMTZkcWxjZXVNSmd3VTFTNVZPbWtKY3ZaVFlzS0RsTjAwSmdxbVlwdklqUE1rNnlMUytxRW9rOFppWkZXVWEvZjIzMUg2aTdVVXcwSndPSWJBTnhNWUxNbUwwT29WVHQwL3F1NkpEWHI2S2xZK3JINmYvK25mOW4vLy9vcEFaWWRYWXpiY2FUYkR4REVkQlI4VEM1QWNPc3RDQkVJSURTTVJaakpNNjViTGxjci8rNUJrNElBRkVHdktjeWt6b0N6Z0dQd0VBQUFVYmJzbHpCaDNTS2tBSTJBQUFBQVNaREVwaHI5Tjg5RUFhUU1XeW9HMGJTaTFOUW1YczNEbVYxV0ViUjlLUkNWSkJHeTZNOG05K3BQSjdhMjlhV25EVXIyRXR5bndRWGsvYjhSVG5sSXNsNUp4SzVyTmZmdVl4S3prekM2YUN0WmNVR0NJVGZ4NW5GUDUzelN0NTRWbkI4QnRXRUUzanFaSzJqbS9raFNDd1VmRzJ1cG9DU2NZa1RVUlRDQkFFQlJVWUhtNHFXTXF4UTJKS0lzMERDZ0lzczNkUDIzL0NMemJqeUpNY3IvK1hSL1ZXVExhcEVrZFVWRlFXME9KWUtBcjNBS1prQ0xBSVhoY0JjUU1EVlVWQkdtNnR6YUNDaTlCSVE2aVFtdVVYU21JVDNOUExVTDM1dHVPdk5YMUdvb21iUXJYaVdwTmNoUG1qRkt3clJoWVBVTU9ZS3FackVOSURnRUp5dkNXdUVvQjFzUU9nSVRCWXJoSERyNmQ5bmg1NWVmMlpIcXhhbWFHcnM3RGRvUnIwR3NvOTlnNkg2VU5tNjQzOUVrUG9Edm1OYUV2dit1OGxDamthaWxWSUFNQUNjb0JEUWR2TkljaHllWllPMjJvaE5OU3JqeHNTbEJnZnhvMk9rTTNMczIyV2ExUk5hZFZWdHZ0ckMwOWNGMUMxalpFU0FFREl3aXcwS0gvKzZCazBJQUUwR2RLZXlrYzhDMmdHUTBFQUFBU3hVa2hqTEJ2aUx5QVpEQVFBQVE2akFsZW8xbEZvREZmUkFNMkdTSmdtRnlnblJJSm84OTFtVWl2bHVuVjB5T0wwM25WRnpPTW5MaHlVbUZ6MEQ4VTdqVnpGZzZEbEtoWlhidFdLUEhGbU9EeDhrb05ONTJvYldWTVhCclpSM05MTlJMU3RRczA5VzNFSGRyVnNzdE1tMGNLNzBUVURTTE9GdWFKVkhyaTEvdGI5cDRzbDRzSlpZdFBDVWplcDZnYURxdWQ5WUtZU0FwYUpBRFNzVnJudWtFM041WWVab3NxSzBWVWhva0RUYkVPVzQ3Y1NQS0kvVVNRUlpXR2NZVUZCT3JpVkVvci82V21aKzBWYXRTd1RFU2xWU1pNUVUxRk15NHhNRENxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXIvKzFCay9RUDAwVjdJWXd4RDRDYWdHT3dFQUFFREpBOFFvWWhnS0FBQVA4QUFBQVNxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxXCIiLCJpbXBvcnQgeyBBcHAsIEVkaXRvciwgTWFya2Rvd25WaWV3LCBNb2RhbCwgTm90aWNlLCBQbHVnaW4sIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcsIFdvcmtzcGFjZUxlYWYgfSBmcm9tICdvYnNpZGlhbic7XHJcbmltcG9ydCB7IFNvdW5kU2V0dGluZ1RhYiB9IGZyb20gJ3NldHRpbmdzJztcclxuaW1wb3J0IHsgSG93bCB9IGZyb20gJ2hvd2xlcidcclxuaW1wb3J0IGF1ZGlvTXAzIGZyb20gJy4vYXVkaW8ubXAzJ1xyXG5cclxuaW50ZXJmYWNlIFNvdW5kU2V0dGluZ3Mge1xyXG5cdG15U2V0dGluZzogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTb3VuZFNldHRpbmdzID0ge1xyXG5cdG15U2V0dGluZzogJydcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU291bmRQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xyXG5cdHNldHRpbmdzOiBTb3VuZFNldHRpbmdzO1xyXG5cdGF1ZGlvOiBIb3dsO1xyXG5cclxuXHRhc3luYyBvbmxvYWQoKSB7XHJcblx0XHRhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xyXG5cclxuXHRcdC8vIFN0YXR1cyBiYXIgaXRlbS4gRG9lcyBub3Qgd29yayBvbiBtb2JpbGUgYXBwcy5cclxuXHRcdGNvbnN0IHN0YXR1c0Jhckl0ZW1FbCA9IHRoaXMuYWRkU3RhdHVzQmFySXRlbSgpO1xyXG5cdFx0c3RhdHVzQmFySXRlbUVsLnNldFRleHQoJ/CflIonKTtcclxuXHRcdFxyXG5cdFx0Ly8gQWRkcyBzZXR0aW5ncyB0YWIuXHJcblx0XHR0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNvdW5kU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xyXG5cclxuXHRcdHRoaXMuYXVkaW8gPSBuZXcgSG93bCh7c3JjOlthdWRpb01wM119KVxyXG5cdFx0XHJcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xyXG5cdFx0XHRpZDogJ3BsYXktZmlsZScsXHJcblx0XHRcdG5hbWU6ICdQbGF5IGZpbGUnLFxyXG5cdFx0XHRjYWxsYmFjazogKCkgPT4ge1xyXG5cdFx0XHRcdGxldCBzb3VuZCA9IG5ldyBIb3dsKHtcclxuXHRcdFx0XHRcdHNyYzpbYXVkaW9NcDNdLFxyXG5cdFx0XHRcdFx0aHRtbDU6IHRydWUgXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRzb3VuZC5wbGF5KClcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHRcclxuXHR9XHJcblxyXG5cdG9udW5sb2FkKCkge1xyXG5cclxuXHR9XHJcblxyXG5cdC8vIExvYWQgdGhlIHNldHRpbmdzLiBcclxuXHRhc3luYyBsb2FkU2V0dGluZ3MoKSB7XHJcblx0XHR0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcclxuXHR9XHJcblx0Ly8gU2F2ZSB0aGUgc2V0dGluZ3MuXHJcblx0YXN5bmMgc2F2ZVNldHRpbmdzKCkge1xyXG5cdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcclxuXHR9XHJcbn1cclxuXHJcblxyXG5cclxuXHJcbiJdLCJuYW1lcyI6WyJQbHVnaW5TZXR0aW5nVGFiIiwiU2V0dGluZyIsImdsb2JhbCIsIlBsdWdpbiIsIkhvd2wiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBdURBO0FBQ08sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0FBQzdELElBQUksU0FBUyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxLQUFLLFlBQVksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENB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QUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDN0I7QUFDQTtBQUNBLE9BQU0sSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ25ELE9BQU0sSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3RELE9BQU0sSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3RELE9BQU0sSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3JFLE9BQU0sSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3JFLE9BQU0sSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3pELE9BQU0sSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3RELE9BQU0sSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FB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QUFNLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztBQUN0QixPQUFNLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUU7QUFDaEksU0FBUSxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQy9DLE9BQU8sSUFBSSxDQUFDO1FBQ2I7QUFDUDtBQUNBO0FBQ0EsT0FBTSxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUQ7QUFDQTtPQUNNLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuQztBQUNBO0FBQ0EsT0FBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUU7QUFDbkMsU0FBUSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QztBQUNQO0FBQ0E7QUFDQSxPQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUU7U0FDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzlCLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxD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
