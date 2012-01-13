/**
 * Created by PyCharm.
 * User: laszlojuracz
 * Date: 1/9/12
 * Time: 1:34 PM
 * To change this template use File | Settings | File Templates.
 */

DEBUG = true;

$(document).ready(function() {
    trace('Lovo initializing...');

    if (DEBUG) {
        var monitor = new lovo.Monitor();
    }

    REFRESH_RATE = 25;

    var plotter = new lovo.Plotter({
        width: 120,
        height: 40,
        blankChar: ' ',
        monitor: monitor
    })

    var ship = new lovo.Sprite({
        bitmap: [
            '   | ',
            '  / \\ ',
            ' | o |',
            '/ | | \\'
        ],
        z: 1,
        color: '#ffffff'
    })

    ship.y = plotter.height - ship.bitmap.length;


    plotter.addSprite(ship);
    plotter.activate();

    var invader = new lovo.Sprite({
        bitmap: [
            '\\|||||/',
            ' |O O|',
            '  |||'
        ],
        x: 0,
        y: 0,
        color: '#3333ff',
        refreshRate: 50,
        animation: function() {
            this.dir = this.dir || 'RIGHT';

            if (this.dir == 'RIGHT' && this.x<plotter.width-this.width) {
                this.x++;
                if (this.x==plotter.width-this.width) this.dir = 'LEFT'
            } else {
                if (this.x>0) this.x--;
                else this.dir = 'RIGHT';
            }

            var fire = Math.random();

            if (fire>.9) {
                var bomb = new lovo.Sprite({
                    bitmap: [
                        '***',
                        ' * '
                    ],
                    color: '#ff5555',
                    x: Math.floor(invader.x+invader.width/2),
                    y: invader.height +1,
                    animation:function() {
                        if (this.y<plotter.height) {
                            this.y++;
                        } else {
                            this.remove();
                        }

                    }

                })

                plotter.addSprite(bomb);

                var collision = new lovo.Collision({
                    partA: bomb,
                    partB: ship
                })

            }

        }
    })

    plotter.addSprite(invader);

    $(window).keydown(function(e) {
        //trace(e.keyCode);
        switch(e.keyCode) {
            case 39:
                if (ship.x<plotter.width-ship.width) ship.x++;
                break;

            case 37:
                if (ship.x>0) ship.x--;
                break;

            case 32:

                var bullet = new lovo.Sprite({
                    bitmap: ['|'],
                    color: '#44ff44',
                    x: Math.floor(ship.x+ship.width/2),
                    y: plotter.height - ship.height-1,
                    animation:function() {
                        if (this.y>0) {
                            this.y--;
                        } else {
                            this.remove();
                        }
                    }

                });

                var collision = new lovo.Collision({
                    partA: bullet,
                    partB: invader
                })

                plotter.addSprite(bullet);

        }
    })
    /*
     var gameIntervalId = setInterval(function() {

     }, refreshRate)
     */
})

lovo = {};

lovo.Plotter = function(config) {
    $.extend(this,config);
    if (!config.refreshRate && REFRESH_RATE) this.refreshRate = REFRESH_RATE;
    this.init();
}

lovo.Plotter.prototype = {
    appearance: {
        'font-family': 'Courier New',
        'font-size': '11px',
        'line-height': '11px',
        'background-color': '#000',
        'color': '#aaa',
        'border-color': '#fff'
    },

    _actualRefreshRate: 0,
    _previousRefreshTime: 0,
    _busy: false,
    monitor: null,

    plotterE: null,

    sprites: null,
    intervalId: null,

    canvas: null,

    refreshRate: 50,

    init: function() {

        var plotterE = this.plotterE = $('<div/>', {

        });

        $('body').append(plotterE);

        $.each(this.appearance, function(k,v){
            plotterE.css(k,v);
        })

        plotterE.css('display', 'inline-block');
        plotterE.css('white-space', 'pre');
        plotterE.css('padding', '5px');

        var fs = plotterE.css('font-size');
        var lh = plotterE.css('line-height');
        //plotterE.width(this.width*fs.substr(0,fs.length-2));
        plotterE.height(this.height*lh.substr(0,lh.length-2));

        this.blankLine = [];
        for (var i=0; i<this.width; i++) {
            this.blankLine.push(this.blankChar);
        }

        this.noColorLine = [];
        for (var i=0; i<this.width; i++) {
            this.noColorLine.push('');
        }

        this.plotterE.html(this.blankLine.join(''));

        var w = this.plotterE.width();

        this.plotterE.empty();
        this.plotterE.width(w);

    },

    addSprite: function(sprite) {
        var sprites = this.sprites = this.sprites || [];

        if (sprites.indexOf(sprite) == -1) {
            sprites.push(sprite);
            sprite.plotter = this;

            sprites.sort(function (a, b) {
                return a.z > b.z;
            });

        }
    },

    removeSprite: function(sprite) {
        var index = this.sprites.indexOf(sprite);
        if (index != -1) {
            this.sprites.splice(index,1);
            sprite.plotter = null;
        }
    },

    drawStuff: function() {
        if (this.busy) return;

        this.busy = true;
        //trace('drawing stuff');

        var that = this;

        var pixels = {};
        this.canvas = {};


/*        for (var i=0; i<this.height; i++) {
            this.pixels[i] = this.blankLine;
        }*/

        if (this.sprites) {
            $.each(this.sprites, function(i, sprite){
                if ($.isArray(sprite.bitmap)) {
                    var sY = sprite.y;
                    $.each(sprite.bitmap, function(j, sLine) {
                        var sLineArray = sLine.split('');

                        if (sLineArray.length) {
                            pixels[sY] = pixels[sY] || [].concat(that.blankLine);

                            var colorLine = null;

                            if (sprite.colorMap && sprite.colorMap[j]) {
                                if (sprite.colorMap) {
                                    colorLine = sprite.colorMap[j];
                                } 
                            }

                            for (var offset = 0; offset < sLineArray.length; offset++) {
                                var char = sLineArray[offset];
                                if (char != ' ') {
                                    var absoluteX = Math.round(sprite.x)+offset;

                                    var color = '';

                                    if (colorLine && colorLine[offset]) {
                                        color = colorLine[offset];
                                    } else {
                                        if (sprite.color) {
                                            color = sprite.color;
                                        }
                                    }

                                    pixels[sY][absoluteX] = [char, color];
                                }
                            }


                            sY++;
                        }
                    })

                }
            })
        }

        var htmlContent = '';
        for (var i=0; i<this.height; i++) {

            var line = '';
            if (pixels[i]) {
                $.each(pixels[i], function(x, pixel) {
                    if (pixel != this.blankChar) {
                        if (pixel[1] && pixel[1] != '') {
                            line+='<span style="color: '+pixel[1]+'">'+pixel[0]+'</span>';
                        } else {
                            line+=pixel[0];
                        }
                    } else {
                        line+=pixel;
                    }
                });

            }

            htmlContent += line+'<br/>';
        }

        this.plotterE.html(htmlContent);

        var t = new Date();

        if (this._previousRefreshTime) {
            this._actualRefreshRate = t - this._previousRefreshTime;

        }

        this._previousRefreshTime = t;

        if (this.monitor) this.monitor.update(Math.round(100000/this._actualRefreshRate)/100+' fps')

        this.busy = false
    },

    activate: function() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        var that = this;

        this.intervalId = setInterval(function() {
            that.drawStuff.call(that);
        }, this.refreshRate, this);
    }

}

lovo.Sprite = function(config) {
    $.extend(this, config);
    if (!config.refreshRate && REFRESH_RATE) this.refreshRate = REFRESH_RATE;
    if (this.bitmap) {
        this.height = this.bitmap.length;
        var that = this;
        $.each(this.bitmap, function(i,line) {
            if (that.width<line.length) that.width = line.length;
        })
        if (this.animation) this.animate(true);
    }
}

lovo.Sprite.prototype = {
    bitmap: null,
    colorMap: null,
    x: 0,
    y: 0,
    z: 0,
    width: 0,
    height: 0,
    animation: 0,
    animationIntervalId: null,
    refreshRate: 50,
    plotter: null,

    collisions: null,

    on_collision: null,

    color: null,
    
    animate: function(isOn) {
        if (isOn && !this.animationIntervalId && $.isFunction(this.animation)) {
            var that = this;
            this.animationIntervalId = setInterval(function() {
                that.animation.call(that);
                if (that.collisions) {
                    $.each(that.collisions, function(i, c) {
                        c.check();
                    })
                }
            }, this.refreshRate)
        }

        if (!isOn && this.animationIntervalId) clearInterval(this.animationIntervalId);
    },

    remove: function() {
        this.animate(false);
        if (this.plotter) {
            this.plotter.removeSprite(this);
        }
    },

    addCollision: function(collision) {
        this.collisions = this.collisions || [];
        if (this.collisions.indexOf(collision) == -1) {
            this.collisions.push(collision);
        }

    }
}

lovo.Collision = function(config) {
    $.extend(this, config);
    if (this.partA && this.partB) {
        this.attach(this.partA, this.partB);
    }
}

lovo.Collision.prototype = {
    partA: null,
    partB: null,

    attach: function(partA, partB) {

        partA.addCollision(this);
        partB.addCollision(this);

        this.partA = partA;
        this.partB = partB;
    },
    
    check: function() {
        if (this.partA && this.partB && this.partA.on_collision && this.partB.on_collision) {
//            trace('checking collision');

            this.partA.on_collision(this, this.partB);
            this.partA.on_collision(this, this.partA);
        }
    }
}


lovo.Monitor = function() {
    this.displayE = $('<div/>', {
    })

    $('body').prepend(this.displayE)

    this.displayE.css('position', 'absolute');
    this.displayE.css('top', '0px');
    this.displayE.css('right', '0px');
    this.displayE.css('color', 'white');
    this.displayE.css('background-color', 'green');
    this.displayE.css('min-width', '100px')
    this.displayE.css('min-height', '20px')
}

lovo.Monitor.prototype = {
    displayE: null,
    update: function(s) {
        this.displayE.text(s);
    }
}
