/**
*  VimeoPlayer widget implements connector for a ucengine events
*  depends :
*  * froogaloop VIMEO API
*  * ucewidget.js
*  * jqueryUI
*
*  Copyright (C) 2011 CommOnEcoute,
*  maintained by Elias Showk <elias.showk@gmail.com>
*  source code at https://github.com/CommOnEcoute/ucengine-widgets
*   
*   VimeoPlayer widget is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   VimeoPlayer is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with source code.  If not, see <http://www.gnu.org/licenses/>.
*/

(function($) {

var vimeoPlayerState = {
    seconds: null,
    percent: null,
    duration: null,
    callbacks: {
        onPlay: [],
        onPause: []
    }
};

if (typeof $.uce === 'undefined') { $.uce = {}; }

$.uce.VimeoPlayer = function(){};
$.uce.VimeoPlayer.prototype = {
    // Default options
    options: {
        ucemeeting: null,
        uceclient: null,
        id: null,
        player: {
            stop: function(){},
            play: function(){},
            pause: function(){},
            seek: function(val){}
        },
        /* seconds */
        defaultTime: 0,
        defaultDuration: 7200,
        /* number */
        defaultPercent: 0,
        isLive: null,
        /* milliseconds */
        startLive: null,
        /* milliseconds */
        endLive: null,
        /* seconds */
        startPlay: null
    },
    /*
     * UCEngine events listening
     */
    meetingsEvents: {
        "livemanager.live.open"     : "_updateOpen",
        "livemanager.live.close"    : "_updateClose"
    },
    /*
     * Sets playback variables to :
     * 1- defaults
     * 2- if player already "ready", to api returned values
     * 2- else binds to the "onready" event
     */
    _create: function() {
        vimeoPlayerState.seconds = this.options.defaultTime;
        vimeoPlayerState.duration = this.options.defaultDuration;
        vimeoPlayerState.percent = this.options.defaultPercent;
        vimeoPlayerState.startPlay = this.options.startPlay;
        this.ready(this.options.id);
        $f(this.options.id).addEvent('ready', this.ready);
        $(window).trigger('resize');
    },

    ready: function(player_id) {
	$f(player_id).api("getDuration", function(data){
            vimeoPlayerState.duration = parseInt( data, 10 );
        });
        $f(player_id).addEvent('playProgress', function(data) {
            vimeoPlayerState.duration = parseInt( data.duration, 10);
            vimeoPlayerState.seconds = parseInt( data.seconds, 10);
            vimeoPlayerState.percent = parseInt( data.percent, 10);
        });
        if( typeof vimeoPlayerState.startPlay === "number" ) {
            $f(player_id).api("seekTo", vimeoPlayerState.startPlay);
            if($f(id).api("paused")) {
                $f(id).api("play");
            }
        }
        $f(player_id).addEvent('finish', function(data) {
            if(vimeoPlayerState.seekTo !== null ) {
                vimeoPlayerState.seekTo = null;
                $f(player_id).removeEvent("loadProgress");
            }
            $f(player_id).api("play");
        });
        $f(player_id).addEvent('play', function(id) {
            for(var i=0; i<vimeoPlayerState.callbacks.onPlay.length; i++) {
                vimeoPlayerState.callbacks.onPlay[i](id);
            }
        });
        $f(player_id).addEvent('pause', function(id) {
            for(var i=0; i<vimeoPlayerState.callbacks.onPause.length; i++) {
                vimeoPlayerState.callbacks.onPause[i](id);
            }
        });
    },

    _updateOpen: function(event) {
        if(event.metadata.unixtime) {    
            this.options.startLive = event.metadata.unixtime;
        }
        this.options.endLive = null;
    },
    
    _updateClose: function(event) {
        if(event.metadata.unixtime) {    
            this.options.endLive = event.metadata.unixtime;
        }
    },

    /* 
     * VimeoPlayer playback control
     */ 
    pause : function() {
        $f(this.options.id).addEvent('ready', function(id) {
            $f(id).api("pause");
        });
    }, 
    play : function() {
        $f(this.options.id).addEvent('ready', function(id) {
            if($f(id).api("paused")) {
                $f(id).api("play");
            }
        });
    },
    /*
     * seek time in seconds
     * handles buffer loading progressions
     */
    seek : function(val) {
        if(typeof val !== "number") {
            val = parseInt(val, 10);
        }
        vimeoPlayerState.seekTo = val;
        vimeoPlayerState.callback = this._seekTo;
        $f(this.options.id).addEvent('ready', function(id) {
            if($f(id).api("paused")) {
                $f(id).api("play");
            }
            $f(id).addEvent("loadProgress", function(data, id) {
                if(vimeoPlayerState.seekTo === null ) {
                    $f(id).removeEvent("loadProgress");
                    return;
                }
                vimeoPlayerState.callback(id);
            });
        });
    },
    /*
     * _seekTo callback
     * froogaloop seek event is used to monitor the seek api call
     */
    _seekTo: function(id) {
        $f(id).addEvent("seek", function(data) {
            if(Math.abs(Math.round(parseInt(data.seconds, 10)) - vimeoPlayerState.seekTo) < 2) {
                // FIXME not reached when seek > duration
                //console.log("seek point reached");
                vimeoPlayerState.seekTo = null;
                $f(id).removeEvent("seek");
            }
        });
        $f(id).api("seekTo", vimeoPlayerState.seekTo); 
    },

    /*
     * Returns seconds elapsed since the beginning of the video
     */
    getCurrentTime: function() {
        if (this.options.isLive === false) {
            return vimeoPlayerState.seconds;
        } else if (typeof this.options.startLive === "number") {
            if(typeof this.options.endLive === "number") {
                if(this.options.liveclock.getLiveClock() - this.options.endLive > 0) {
                    return 0;
                }
            }
            var relativeTime = (this.options.liveclock.getLiveClock() - this.options.startLive)/1000;
            if(relativeTime >= 0) {
                return Math.round(relativeTime);
            }
        }
        return this.options.defaultTime;
    },

    /*
     * Returns total duration in seconds
     */
    getDuration: function() {
        if (this.options.isLive === false) {
            return vimeoPlayerState.duration;
        }
        return this.options.defaultDuration;
    },

    /*
     * VimeoPlayer event listener : play
     */
    onPlay: function(callback) {
        vimeoPlayerState.callbacks.onPlay.push(callback);
    },
    /*
     * VimeoPlayer event listener : seek
     */
    onSeek: function(callback) {
        vimeoPlayerState.callbacks.onSeek.push(callback);
    },
    /*
     * VimeoPlayer event listener : pause
     */
    onPause: function(callback) {
        vimeoPlayerState.callbacks.onPause.push(callback);
    },

    /*
     * Where the player is
     */
    getDOMid: function() {
        return this.options.id;
    },

    destroy: function() {
        this.element.find('*').remove();
        $.Widget.prototype.destroy.apply(this, arguments); // default destroy
    },
    setSize: function(h,w) {
        $("#"+this.options.id).height(h);
        $("#"+this.options.id).width(w);
    }
};

if($.uce.widget!==undefined) {
    $.uce.widget("uceplayer", new $.uce.VimeoPlayer());
}

})($);
