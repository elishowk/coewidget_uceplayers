/**
*  JWPlayer widget implements a connector for a ucengine events
*  depends :
*  * jwplayer.js embedder
*  * ucewidget.js
*  * jqueryUI
*
*  Copyright (C) 2011 CommOnEcoute,
*  maintained by Elias Showk <elias.showk@gmail.com>
*  source code at https://github.com/CommOnEcoute/ucengine-widgets
*   
*   JWPlayer widget is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   JWPlayer is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with source code.  If not, see <http://www.gnu.org/licenses/>.
*/
(function($) {

    if (typeof $.uce === 'undefined') { $.uce = {}; }
    $.uce.JWPlayer = function(){};
    $.uce.JWPlayer.prototype = {
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
            defaultTime: 0,
            defaultDuration: 72000,
            isLive: null,
            /* milliseconds */
            startLive: null,
            /* milliseconds */
            endLive: null,
            /* seconds */
            startPlay: null,
            liveclock: null
        },
        /*
        * UCEngine events listening
        */
        meetingsEvents: {
            "livemanager.live.open"     : "_updateOpen",
            "livemanager.live.close"    : "_updateClose"
        },
        _seekQueue: [],
            
        _create: function() {
            if(jwplayer(this.options.id)) {
                this.options.player = jwplayer(this.options.id);
                if( typeof this.options.startPlay === "number" ) {
                    this.seek(this.options.startPlay);
                }
                this.onReady(function(){
                    $(window).trigger('resize');
                });
            }
        },

        _updateOpen: function(event) {
            if(event.metadata.unixtime) {    
                this.options.startLive = event.metadata.unixtime;
            }
            this.options.endLive = null;
            //TODO replace volume jwplayer(this.options.id).getPlugin("controlbar").hide(); 
        },
        
        _updateClose: function(event) {
            if(event.metadata.unixtime) {    
                this.options.endLive = event.metadata.unixtime;
            }
        },
        /* 
        * I just want it to pause never stop
        */
        stop : function() {
            this.pause();
        },
        pause : function() {
            jwplayer(this.options.id).play(false);
        },
        
        play : function() {
            jwplayer(this.options.id).play(true);
        },
        
        /*
        * seek time in seconds now or after onMeta callback
        */
        seek: function(seekseconds) {
            if(typeof seekseconds === "string") {
                seekseconds = parseInt(seekseconds, 10);
            }
            if(typeof seekseconds === "object") {
                // it's an callback
                seekseconds = this._seekQueue.shift();
            }
            if(seekseconds<0 || seekseconds===undefined) {
                return;
            }
            var duration = this.getDuration();
            if(duration===undefined || duration<0){
                this._seekQueue.push(seekseconds);
                this.onPlay($.proxy(this.seek, this));
                jwplayer(this.options.id).play(true);
                return;
            }
            if(seekseconds <= duration) {
                jwplayer(this.options.id).seek(seekseconds);
            }
        },

        /*
        * Returns seconds elapsed since the beginning of the video
        * Replaces video time by server time for a live
        */
        getCurrentTime: function() {
            if (this.options.player){
                if (this.options.isLive === false) {
                    return Math.round( this.options.player.getPosition() );
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
            }
            return this.options.defaultTime;
        },

        /*
        * Returns total duration in seconds
        */
        getDuration: function() {
            if (this.options.player){
                if (this.options.isLive === false) {
                    return this.options.player.getDuration(); 
                }
            }
            // TODO return the scheduled end on live
            return this.options.defaultDuration;
        },

        /*
        * JWPlayer event listener : metadata received
        */
        onMeta: function(callback) {
            if(jwplayer(this.options.id)) {
                jwplayer(this.options.id).onMeta(function(event) {
                    callback(event);
                });
            }
        },
        /*
        * JWPlayer event listener : play
        */
        onPlay: function(callback) {
            if(jwplayer(this.options.id)) {
                jwplayer(this.options.id).onPlay( function(event) {
                    callback(event);
                });
            }
        },
        /*
        * JWPlayer event listener : seek
        */
        onSeek: function(callback) {
            if(jwplayer(this.options.id)) {
                jwplayer(this.options.id).onSeek( function(event) {
                    callback(event);
                });
            }
        },
        /*
        * JWPlayer event listener : pause
        */
        onPause: function(callback) {
            if(jwplayer(this.options.id)) {
                jwplayer(this.options.id).onPause( function(event) {
                    callback(event);
                });
            }
        },
        /*
        * JWPlayer event listener : time
        */
        onTime: function(callback) {
            if(jwplayer(this.options.id)) {
                jwplayer(this.options.id).onTime( function(event) {
                    callback(event);
                });
            }
        },
        /*
        * JWPlayer event listener : ready
        */
        onReady: function(callback) {
            if(jwplayer(this.options.id)) {
                jwplayer(this.options.id).onReady( function(event) {
                    callback(event);
                });
            }
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
            jwplayer(this.options.id).resize(w,h);
        }

    };
    
    if($.uce.widget!==undefined) {
        $.uce.widget("uceplayer", new $.uce.JWPlayer());
    }

})($);