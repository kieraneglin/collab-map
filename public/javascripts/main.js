(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("./path");
var Canvas = /** @class */ (function () {
    function Canvas(client) {
        this.brushWidth = 2;
        this.brushScaleFactor = 2;
        this.minZoom = 1;
        this.maxZoom = 15;
        this.zoomInFactor = 1.1;
        this.zoomOutFactor = 0.9;
        this.client = client;
        this.fabric = new fabric.Canvas('map', this.canvasOptions);
        this.fabric.freeDrawingBrush.width = this.brushWidth;
        this.scaleFabricToWindow();
        this.setBackgroundImage();
        this.registerEventListeners();
        this.enablePanning();
    }
    Canvas.prototype.applyPath = function (data) {
        var _this = this;
        if (data.sender !== this.client.id) {
            var path = path_1.default.scaleIncoming(data, this.client.size);
            path.strokeWidth = this.scaledBrushSize;
            fabric.util.enlivenObjects([path], function (objects) {
                objects.forEach(function (object) {
                    object.senderId = data.sender; // Since `enlivenObjects` strips all non-standard props
                    _this.fabric.add(object);
                });
            });
        }
    };
    Canvas.prototype.applyClear = function (sender) {
        var _this = this;
        var objects = this.fabric.getObjects().filter(function (line) { return line.senderId === sender; });
        objects.forEach(function (object) {
            _this.fabric.remove(object);
        });
    };
    Canvas.prototype.resetZoom = function () {
        this.fabric.setZoom(1);
        this.fabric.zoomToPoint(0, 0);
        this.fabric.renderAll();
    };
    Canvas.prototype.scaleFabricToWindow = function () {
        this.fabric.setHeight(this.client.size);
        this.fabric.setWidth(this.client.size);
        document.querySelector('.pubg-map').style.width = this.client.size + "px"; // This is gross and there's probably a CSS way to do this, but I hate CSS so here we are
    };
    Canvas.prototype.setBackgroundImage = function () {
        var _this = this;
        var img = new Image();
        img.onload = function () {
            _this.fabric.setBackgroundImage(img.src, _this.fabric.renderAll.bind(_this.fabric), {
                width: _this.fabric.width,
                height: _this.fabric.height,
            });
        };
        img.src = "/images/map.jpg";
    };
    Canvas.prototype.registerEventListeners = function () {
        var _this = this;
        this.fabric.on('mouse:wheel', function (e) {
            if (e.e.deltaY <= 0 && _this.fabric.getZoom() <= _this.maxZoom) {
                _this.zoomIn(e);
            }
            else if (e.e.deltaY >= 0 && _this.fabric.getZoom() > _this.minZoom) {
                _this.zoomOut(e);
            }
            else {
                return;
            }
            _this.applyScaledBrush();
            _this.applyScaledBrushToCanvas();
        });
        this.fabric.on('path:created', function (e) {
            _this.client.broadcastPath(e);
        });
        document.body.onkeydown = function (e) {
            if (e.shiftKey) {
                _this.fabric.isDrawingMode = false;
            }
        };
        document.body.onkeyup = function (e) {
            _this.fabric.isDrawingMode = true;
        };
    };
    Canvas.prototype.enablePanning = function () {
        var _this = this;
        var panning = false;
        this.fabric.on('mouse:up', function (e) {
            panning = false;
        });
        this.fabric.on('mouse:out', function (e) {
            panning = false;
        });
        this.fabric.on('mouse:down', function (e) {
            panning = true;
        });
        this.fabric.on('mouse:move', function (e) {
            if (panning && e.e && e.e.shiftKey) {
                var delta = new fabric.Point(e.e.movementX, e.e.movementY);
                _this.fabric.relativePan(delta);
            }
        });
    };
    Canvas.prototype.zoomIn = function (e) {
        this.fabric.zoomToPoint({
            x: e.e.offsetX,
            y: e.e.offsetY
        }, this.fabric.getZoom() * this.zoomInFactor);
    };
    Canvas.prototype.zoomOut = function (e) {
        this.fabric.zoomToPoint({
            x: e.e.offsetX,
            y: e.e.offsetY
        }, this.fabric.getZoom() * this.zoomOutFactor);
    };
    Canvas.prototype.applyScaledBrush = function () {
        this.fabric.freeDrawingBrush.width = this.scaledBrushSize;
    };
    Canvas.prototype.applyScaledBrushToCanvas = function () {
        var _this = this;
        this.fabric.getObjects().map(function (path) {
            path.strokeWidth = _this.applyScaledBrush();
        });
    };
    Object.defineProperty(Canvas.prototype, "scaledBrushSize", {
        get: function () {
            return this.brushScaleFactor / this.fabric.getZoom();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Canvas.prototype, "canvasOptions", {
        get: function () {
            return {
                isDrawingMode: true,
                selection: false
            };
        },
        enumerable: true,
        configurable: true
    });
    return Canvas;
}());
exports.default = Canvas;

},{"./path":4}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Client = /** @class */ (function () {
    function Client(socket) {
        this.size = Math.min(window.innerWidth, window.innerHeight); // So canvas won't exceed the browser height
        this.room = window.location.href.split('/').pop();
        this.socket = socket;
    }
    Client.prototype.broadcastPath = function (e) {
        e.path.senderId = this.id; // So that we can identify what lines are our own, since `draw_line` events from self are ignored
        this.socket.emit('draw_path', {
            path: e.path.toJSON(),
            room: this.room,
            size: this.size,
            sender: this.id
        });
    };
    Client.prototype.broadcastClear = function () {
        this.socket.emit('clear', {
            client: this.id,
            room: this.room
        });
    };
    Client.prototype.assignColour = function (connectionNumber) {
        this.colour = this.colourChoices[connectionNumber % this.colourChoices.length];
        return this.colour;
    };
    Object.defineProperty(Client.prototype, "colourChoices", {
        get: function () {
            return ['#e74c3c', '#3498db', '#27ae60', '#f4d03f', '#bf26e9', '#0bf7e7', '#f08080'];
        },
        enumerable: true,
        configurable: true
    });
    return Client;
}());
exports.default = Client;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("./client");
var canvas_1 = require("./canvas");
var toolbar_1 = require("./toolbar");
var socket = io.connect();
var client = new client_1.default(socket);
var canvas = new canvas_1.default(client);
var toolbar = new toolbar_1.default(client, canvas);
var peers = [];
socket.on('connect', function () {
    socket.emit('room', client.room);
});
socket.on('identification', function (data) {
    canvas.fabric.freeDrawingBrush.color = client.assignColour(data.colour);
    client.id = data.id;
});
socket.on('user_connected', function (data) {
    // Doing it here for tonight because I want to play PUBG
    var clientList = document.querySelector('.clients');
    peers.push(data);
    socket.emit('sync_users', {
        id: client.id,
        room: client.room,
        name: client.name,
        colour: client.colour
    });
});
socket.on('leave', function (data) {
    var clients = document.querySelectorAll('.clients > li');
    var temp = [];
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].dataset.client == data) {
            clients[i].remove();
        }
    }
    peers.forEach(function (peer) {
        if (peer.id != data) {
            temp.push(peer);
        }
    });
    peers = temp;
    // console.log(peers);
});
socket.on('sync_users', function (data) {
    // Doing it here for tonight because I want to play PUBG
    var clientList = document.querySelector('.clients');
    clientList.innerHTML = '';
    var temp = [];
    // peers.forEach((peer) => {
    //   if(peer.id == data.id) {
    //     temp.push(data);
    //   } else {
    //     temp.push
    //   }
    // });
    var contains = peers.some(function (peer) {
        return peer.id == data.id;
    });
    if (!contains) {
        peers.push(data);
    }
    peers.forEach(function (peer) {
        clientList.insertAdjacentHTML('beforeend', "\n    <li data-client=\"" + peer.id + "\">\n      <span class=\"clients-name\">" + peer.name + "</span>\n      <span class=\"clients-colour\" style=\"background-color: " + peer.colour + "\"></span>\n    </li>");
    });
});
socket.on('draw_path', function (data) {
    canvas.applyPath(data);
});
socket.on('clear', function (data) {
    canvas.applyClear(data.client);
});
// Modal code
document.querySelector('.modal-submit').onclick = function (e) {
    e.preventDefault();
    //
    var nameInput = document.querySelector('.modal-name');
    // let name = 'kieran';
    var name = nameInput.value;
    //
    if (name.trim() === '') {
        nameInput.className += ' error';
        return;
    }
    client.name = name;
    document.querySelector('.modal').remove();
    var data = {
        id: client.id,
        room: client.room,
        name: name,
        colour: client.colour
    };
    socket.emit('user_connected', data);
};

},{"./canvas":1,"./client":2,"./toolbar":5}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Path = /** @class */ (function () {
    function Path() {
    }
    Path.scaleIncoming = function (data, canvasSize) {
        var scale = canvasSize / data.size;
        var path = data.path;
        path.left *= scale;
        path.top *= scale;
        path.scaleX *= scale;
        path.scaleY *= scale;
        return path;
    };
    return Path;
}());
exports.default = Path;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Toolbar = /** @class */ (function () {
    function Toolbar(client, canvas) {
        this.client = client;
        this.canvas = canvas;
        this.registerEventListeners();
    }
    Toolbar.prototype.registerEventListeners = function () {
        var _this = this;
        document.getElementById('clear').onclick = function () {
            _this.client.broadcastClear();
        };
        document.getElementById('reset-zoom').onclick = function () {
            _this.canvas.resetZoom();
        };
    };
    return Toolbar;
}());
exports.default = Toolbar;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvamF2YXNjcmlwdHMvY2FudmFzLnRzIiwic3JjL2phdmFzY3JpcHRzL2NsaWVudC50cyIsInNyYy9qYXZhc2NyaXB0cy9tYWluLnRzIiwic3JjL2phdmFzY3JpcHRzL3BhdGgudHMiLCJzcmMvamF2YXNjcmlwdHMvdG9vbGJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQ0EsK0JBQTBCO0FBSTFCO0lBV0UsZ0JBQVksTUFBTTtRQVJYLGVBQVUsR0FBVyxDQUFDLENBQUM7UUFFdEIscUJBQWdCLEdBQVcsQ0FBQyxDQUFDO1FBQzdCLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFDcEIsWUFBTyxHQUFXLEVBQUUsQ0FBQztRQUNyQixpQkFBWSxHQUFXLEdBQUcsQ0FBQztRQUMzQixrQkFBYSxHQUFXLEdBQUcsQ0FBQztRQUdsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUVyQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFFckQsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFTSwwQkFBUyxHQUFoQixVQUFpQixJQUFJO1FBQXJCLGlCQVlDO1FBWEMsRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxJQUFJLEdBQVEsY0FB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QTlCO1FBQUEsaUJBUUM7UUFQRSxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBaUIsQ0FBQyxPQUFPLEdBQUc7WUFDMUQsS0FBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMvQixDQUFDLENBQUM7UUFFRCxRQUFRLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBaUIsQ0FBQyxPQUFPLEdBQUc7WUFDL0QsS0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUMxQixDQUFDLENBQUM7SUFDSixDQUFDO0lBQ0gsY0FBQztBQUFELENBcEJBLEFBb0JDLElBQUE7QUFFRCxrQkFBZSxPQUFPLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IENsaWVudCBmcm9tICcuL2NsaWVudCc7XG5pbXBvcnQgUGF0aCBmcm9tICcuL3BhdGgnO1xuXG5kZWNsYXJlIGxldCBmYWJyaWM7XG5cbmNsYXNzIENhbnZhcyB7IC8vIFRPRE86IEdldHRpbmcgdG9vIGJlZWZ5IGFnYWluLiAgUmVmYWN0b3JcbiAgcHVibGljIGZhYnJpYzogYW55O1xuICBwdWJsaWMgY2xpZW50OiBDbGllbnQ7XG4gIHB1YmxpYyBicnVzaFdpZHRoOiBudW1iZXIgPSAyO1xuXG4gIHByaXZhdGUgYnJ1c2hTY2FsZUZhY3RvcjogbnVtYmVyID0gMjtcbiAgcHJpdmF0ZSBtaW5ab29tOiBudW1iZXIgPSAxO1xuICBwcml2YXRlIG1heFpvb206IG51bWJlciA9IDE1O1xuICBwcml2YXRlIHpvb21JbkZhY3RvcjogbnVtYmVyID0gMS4xO1xuICBwcml2YXRlIHpvb21PdXRGYWN0b3I6IG51bWJlciA9IDAuOTtcblxuICBjb25zdHJ1Y3RvcihjbGllbnQpIHtcbiAgICB0aGlzLmNsaWVudCA9IGNsaWVudDtcblxuICAgIHRoaXMuZmFicmljID0gbmV3IGZhYnJpYy5DYW52YXMoJ21hcCcsIHRoaXMuY2FudmFzT3B0aW9ucyk7XG4gICAgdGhpcy5mYWJyaWMuZnJlZURyYXdpbmdCcnVzaC53aWR0aCA9IHRoaXMuYnJ1c2hXaWR0aDtcblxuICAgIHRoaXMuc2NhbGVGYWJyaWNUb1dpbmRvdygpO1xuICAgIHRoaXMuc2V0QmFja2dyb3VuZEltYWdlKCk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50TGlzdGVuZXJzKCk7XG4gICAgdGhpcy5lbmFibGVQYW5uaW5nKCk7XG4gIH1cblxuICBwdWJsaWMgYXBwbHlQYXRoKGRhdGEpOiB2b2lkIHtcbiAgICBpZihkYXRhLnNlbmRlciAhPT0gdGhpcy5jbGllbnQuaWQpIHtcbiAgICAgIGxldCBwYXRoOiBhbnkgPSBQYXRoLnNjYWxlSW5jb21pbmcoZGF0YSwgdGhpcy5jbGllbnQuc2l6ZSk7XG4gICAgICBwYXRoLnN0cm9rZVdpZHRoID0gdGhpcy5zY2FsZWRCcnVzaFNpemU7XG5cbiAgICAgIGZhYnJpYy51dGlsLmVubGl2ZW5PYmplY3RzKFtwYXRoXSwgKG9iamVjdHMpID0+IHtcbiAgICAgICAgb2JqZWN0cy5mb3JFYWNoKChvYmplY3QpID0+IHtcbiAgICAgICAgICBvYmplY3Quc2VuZGVySWQgPSBkYXRhLnNlbmRlcjsgLy8gU2luY2UgYGVubGl2ZW5PYmplY3RzYCBzdHJpcHMgYWxsIG5vbi1zdGFuZGFyZCBwcm9wc1xuICAgICAgICAgIHRoaXMuZmFicmljLmFkZChvYmplY3QpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhcHBseUNsZWFyKHNlbmRlcjogc3RyaW5nKTogdm9pZCB7XG4gICAgbGV0IG9iamVjdHMgPSB0aGlzLmZhYnJpYy5nZXRPYmplY3RzKCkuZmlsdGVyKChsaW5lKSA9PiBsaW5lLnNlbmRlcklkID09PSBzZW5kZXIpO1xuXG4gICAgb2JqZWN0cy5mb3JFYWNoKChvYmplY3QpID0+IHtcbiAgICAgIHRoaXMuZmFicmljLnJlbW92ZShvYmplY3QpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHJlc2V0Wm9vbSgpIHtcbiAgICB0aGlzLmZhYnJpYy5zZXRab29tKDEpO1xuICAgIHRoaXMuZmFicmljLnpvb21Ub1BvaW50KDAsIDApO1xuICAgIHRoaXMuZmFicmljLnJlbmRlckFsbCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzY2FsZUZhYnJpY1RvV2luZG93KCk6IHZvaWQge1xuICAgIHRoaXMuZmFicmljLnNldEhlaWdodCh0aGlzLmNsaWVudC5zaXplKTtcbiAgICB0aGlzLmZhYnJpYy5zZXRXaWR0aCh0aGlzLmNsaWVudC5zaXplKTtcblxuICAgIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucHViZy1tYXAnKSBhcyBIVE1MRWxlbWVudCkuc3R5bGUud2lkdGggPSBgJHt0aGlzLmNsaWVudC5zaXplfXB4YDsgLy8gVGhpcyBpcyBncm9zcyBhbmQgdGhlcmUncyBwcm9iYWJseSBhIENTUyB3YXkgdG8gZG8gdGhpcywgYnV0IEkgaGF0ZSBDU1Mgc28gaGVyZSB3ZSBhcmVcbiAgfVxuXG4gIHByaXZhdGUgc2V0QmFja2dyb3VuZEltYWdlKCk6IHZvaWQge1xuICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICB0aGlzLmZhYnJpYy5zZXRCYWNrZ3JvdW5kSW1hZ2UoaW1nLnNyYywgdGhpcy5mYWJyaWMucmVuZGVyQWxsLmJpbmQodGhpcy5mYWJyaWMpLCB7XG4gICAgICAgIHdpZHRoOiB0aGlzLmZhYnJpYy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiB0aGlzLmZhYnJpYy5oZWlnaHQsXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgaW1nLnNyYyA9IFwiL2ltYWdlcy9tYXAuanBnXCI7XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnMoKTogdm9pZCB7XG4gICAgdGhpcy5mYWJyaWMub24oJ21vdXNlOndoZWVsJywgKGUpID0+IHtcbiAgICAgIGlmIChlLmUuZGVsdGFZIDw9IDAgJiYgdGhpcy5mYWJyaWMuZ2V0Wm9vbSgpIDw9IHRoaXMubWF4Wm9vbSkge1xuICAgICAgICB0aGlzLnpvb21JbihlKTtcbiAgICAgIH0gZWxzZSBpZihlLmUuZGVsdGFZID49IDAgJiYgdGhpcy5mYWJyaWMuZ2V0Wm9vbSgpID4gdGhpcy5taW5ab29tKSB7XG4gICAgICAgIHRoaXMuem9vbU91dChlKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIHRoaXMuYXBwbHlTY2FsZWRCcnVzaCgpO1xuICAgICAgdGhpcy5hcHBseVNjYWxlZEJydXNoVG9DYW52YXMoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuZmFicmljLm9uKCdwYXRoOmNyZWF0ZWQnLCAoZSkgPT4ge1xuICAgICAgdGhpcy5jbGllbnQuYnJvYWRjYXN0UGF0aChlKTtcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmJvZHkub25rZXlkb3duID0gKGUpID0+IHtcbiAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgIHRoaXMuZmFicmljLmlzRHJhd2luZ01vZGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZG9jdW1lbnQuYm9keS5vbmtleXVwID0gKGUpID0+IHtcbiAgICAgIHRoaXMuZmFicmljLmlzRHJhd2luZ01vZGUgPSB0cnVlO1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGVuYWJsZVBhbm5pbmcoKTogdm9pZCB7XG4gICAgbGV0IHBhbm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLmZhYnJpYy5vbignbW91c2U6dXAnLCAoZSkgPT4ge1xuICAgICAgcGFubmluZyA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHRoaXMuZmFicmljLm9uKCdtb3VzZTpvdXQnLCAoZSkgPT4ge1xuICAgICAgcGFubmluZyA9IGZhbHNlO1xuICAgIH0pO1xuICAgIHRoaXMuZmFicmljLm9uKCdtb3VzZTpkb3duJywgKGUpID0+IHtcbiAgICAgIHBhbm5pbmcgPSB0cnVlO1xuICAgIH0pO1xuICAgIHRoaXMuZmFicmljLm9uKCdtb3VzZTptb3ZlJywgKGUpID0+IHtcbiAgICAgIGlmIChwYW5uaW5nICYmIGUuZSAmJiBlLmUuc2hpZnRLZXkpIHtcbiAgICAgICAgbGV0IGRlbHRhID0gbmV3IGZhYnJpYy5Qb2ludChlLmUubW92ZW1lbnRYLCBlLmUubW92ZW1lbnRZKTtcbiAgICAgICAgdGhpcy5mYWJyaWMucmVsYXRpdmVQYW4oZGVsdGEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB6b29tSW4oZSk6IHZvaWQge1xuICAgIHRoaXMuZmFicmljLnpvb21Ub1BvaW50KHtcbiAgICAgIHg6IGUuZS5vZmZzZXRYLFxuICAgICAgeTogZS5lLm9mZnNldFlcbiAgICB9LCB0aGlzLmZhYnJpYy5nZXRab29tKCkgKiB0aGlzLnpvb21JbkZhY3Rvcik7XG4gIH1cblxuICBwcml2YXRlIHpvb21PdXQoZSk6IHZvaWQge1xuICAgIHRoaXMuZmFicmljLnpvb21Ub1BvaW50KHtcbiAgICAgIHg6IGUuZS5vZmZzZXRYLFxuICAgICAgeTogZS5lLm9mZnNldFlcbiAgICB9LCB0aGlzLmZhYnJpYy5nZXRab29tKCkgKiB0aGlzLnpvb21PdXRGYWN0b3IpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVNjYWxlZEJydXNoKCk6IHZvaWQgeyAvLyBTZXRzIHlvdXIgYnJ1c2ggc2l6ZVxuICAgIHRoaXMuZmFicmljLmZyZWVEcmF3aW5nQnJ1c2gud2lkdGggPSB0aGlzLnNjYWxlZEJydXNoU2l6ZTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlTY2FsZWRCcnVzaFRvQ2FudmFzKCk6IHZvaWQgeyAvLyBTZXRzIGJydXNoIHNpemUgb2YgZXhpc3RpbmcgcGF0aHNcbiAgICB0aGlzLmZhYnJpYy5nZXRPYmplY3RzKCkubWFwKChwYXRoKSA9PiB7XG4gICAgICBwYXRoLnN0cm9rZVdpZHRoID0gdGhpcy5hcHBseVNjYWxlZEJydXNoKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldCBzY2FsZWRCcnVzaFNpemUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5icnVzaFNjYWxlRmFjdG9yIC8gdGhpcy5mYWJyaWMuZ2V0Wm9vbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXQgY2FudmFzT3B0aW9ucygpOiBvYmplY3Qge1xuICAgIHJldHVybiB7XG4gICAgICBpc0RyYXdpbmdNb2RlOiB0cnVlLFxuICAgICAgc2VsZWN0aW9uOiBmYWxzZVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDYW52YXM7XG4iLCJkZWNsYXJlIGxldCBzb2NrZXQ7XG5cbmNsYXNzIENsaWVudCB7XG4gIHB1YmxpYyBzaXplOiBudW1iZXI7XG4gIHB1YmxpYyByb29tOiBzdHJpbmc7XG4gIHB1YmxpYyBuYW1lOiBzdHJpbmc7XG4gIHB1YmxpYyBpZDogc3RyaW5nO1xuICBwdWJsaWMgY29sb3VyOiBzdHJpbmc7XG4gIHB1YmxpYyBzb2NrZXQ6IGFueTsgLy8gU2luY2UgVFMgZG9lc24ndCBwbGF5IG5pY2Ugd2l0aCBub24tbm9kZSBsaWJzXG5cbiAgY29uc3RydWN0b3Ioc29ja2V0KSB7XG4gICAgdGhpcy5zaXplID0gTWF0aC5taW4od2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7IC8vIFNvIGNhbnZhcyB3b24ndCBleGNlZWQgdGhlIGJyb3dzZXIgaGVpZ2h0XG4gICAgdGhpcy5yb29tID0gd2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoJy8nKS5wb3AoKTtcbiAgICB0aGlzLnNvY2tldCA9IHNvY2tldDtcbiAgfVxuXG4gIHB1YmxpYyBicm9hZGNhc3RQYXRoKGUpOiB2b2lkIHtcbiAgICBlLnBhdGguc2VuZGVySWQgPSB0aGlzLmlkOyAvLyBTbyB0aGF0IHdlIGNhbiBpZGVudGlmeSB3aGF0IGxpbmVzIGFyZSBvdXIgb3duLCBzaW5jZSBgZHJhd19saW5lYCBldmVudHMgZnJvbSBzZWxmIGFyZSBpZ25vcmVkXG5cbiAgICB0aGlzLnNvY2tldC5lbWl0KCdkcmF3X3BhdGgnLCB7XG4gICAgICBwYXRoOiBlLnBhdGgudG9KU09OKCksXG4gICAgICByb29tOiB0aGlzLnJvb20sXG4gICAgICBzaXplOiB0aGlzLnNpemUsXG4gICAgICBzZW5kZXI6IHRoaXMuaWRcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBicm9hZGNhc3RDbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLnNvY2tldC5lbWl0KCdjbGVhcicsIHtcbiAgICAgIGNsaWVudDogdGhpcy5pZCxcbiAgICAgIHJvb206IHRoaXMucm9vbVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzc2lnbkNvbG91cihjb25uZWN0aW9uTnVtYmVyOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHRoaXMuY29sb3VyID0gdGhpcy5jb2xvdXJDaG9pY2VzW2Nvbm5lY3Rpb25OdW1iZXIgJSB0aGlzLmNvbG91ckNob2ljZXMubGVuZ3RoXTtcbiAgICByZXR1cm4gdGhpcy5jb2xvdXI7XG4gIH1cblxuICBwcml2YXRlIGdldCBjb2xvdXJDaG9pY2VzKCk6IEFycmF5PHN0cmluZz4ge1xuICAgIHJldHVybiBbJyNlNzRjM2MnLCAnIzM0OThkYicsICcjMjdhZTYwJywgJyNmNGQwM2YnLCAnI2JmMjZlOScsICcjMGJmN2U3JywgJyNmMDgwODAnXVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENsaWVudDtcbiIsImltcG9ydCBDbGllbnQgZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IENhbnZhcyBmcm9tICcuL2NhbnZhcyc7XG5pbXBvcnQgVG9vbGJhciBmcm9tICcuL3Rvb2xiYXInO1xuXG5kZWNsYXJlIGxldCBmYWJyaWM7IC8vIFNvIFRTIHdpbGwgcGxheSBuaWNlbHkgd2l0aCBub24tbm9kZSBKUyBmaWxlc1xuZGVjbGFyZSBsZXQgaW87XG5cbmNvbnN0IHNvY2tldCA9IGlvLmNvbm5lY3QoKTtcbmNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoc29ja2V0KTtcbmNvbnN0IGNhbnZhcyA9IG5ldyBDYW52YXMoY2xpZW50KTtcbmNvbnN0IHRvb2xiYXIgPSBuZXcgVG9vbGJhcihjbGllbnQsIGNhbnZhcyk7XG5sZXQgcGVlcnMgPSBbXTtcblxuc29ja2V0Lm9uKCdjb25uZWN0JywgKCk6IHZvaWQgPT4ge1xuICBzb2NrZXQuZW1pdCgncm9vbScsIGNsaWVudC5yb29tKTtcbn0pO1xuXG5zb2NrZXQub24oJ2lkZW50aWZpY2F0aW9uJywgKGRhdGEpOiB2b2lkID0+IHtcbiAgY2FudmFzLmZhYnJpYy5mcmVlRHJhd2luZ0JydXNoLmNvbG9yID0gY2xpZW50LmFzc2lnbkNvbG91cihkYXRhLmNvbG91cik7XG4gIGNsaWVudC5pZCA9IGRhdGEuaWQ7XG59KTtcblxuc29ja2V0Lm9uKCd1c2VyX2Nvbm5lY3RlZCcsIChkYXRhKTogdm9pZCA9PiB7XG4gIC8vIERvaW5nIGl0IGhlcmUgZm9yIHRvbmlnaHQgYmVjYXVzZSBJIHdhbnQgdG8gcGxheSBQVUJHXG4gIGxldCBjbGllbnRMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNsaWVudHMnKSBhcyBIVE1MRWxlbWVudDtcblxuICBwZWVycy5wdXNoKGRhdGEpO1xuXG4gIHNvY2tldC5lbWl0KCdzeW5jX3VzZXJzJywge1xuICAgIGlkOiBjbGllbnQuaWQsXG4gICAgcm9vbTogY2xpZW50LnJvb20sXG4gICAgbmFtZTogY2xpZW50Lm5hbWUsXG4gICAgY29sb3VyOiBjbGllbnQuY29sb3VyXG4gIH0pXG59KTtcblxuc29ja2V0Lm9uKCdsZWF2ZScsIChkYXRhKTogdm9pZCA9PiB7XG4gIGxldCBjbGllbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmNsaWVudHMgPiBsaScpO1xuICBsZXQgdGVtcCA9IFtdXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGllbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYoKGNsaWVudHNbaV0gYXMgSFRNTEVsZW1lbnQpLmRhdGFzZXQuY2xpZW50ID09IGRhdGEpIHtcbiAgICAgIGNsaWVudHNbaV0ucmVtb3ZlKCk7XG4gICAgfVxuICB9XG5cbiAgcGVlcnMuZm9yRWFjaCgocGVlcikgPT4ge1xuICAgIGlmKHBlZXIuaWQgIT0gZGF0YSkge1xuICAgICAgdGVtcC5wdXNoKHBlZXIpO1xuICAgIH1cbiAgfSk7XG5cbiAgcGVlcnMgPSB0ZW1wO1xuICAvLyBjb25zb2xlLmxvZyhwZWVycyk7XG59KTtcblxuc29ja2V0Lm9uKCdzeW5jX3VzZXJzJywgKGRhdGEpOiB2b2lkID0+IHtcbiAgLy8gRG9pbmcgaXQgaGVyZSBmb3IgdG9uaWdodCBiZWNhdXNlIEkgd2FudCB0byBwbGF5IFBVQkdcbiAgbGV0IGNsaWVudExpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY2xpZW50cycpIGFzIEhUTUxFbGVtZW50O1xuICBjbGllbnRMaXN0LmlubmVySFRNTCA9ICcnO1xuICBsZXQgdGVtcCA9IFtdXG5cbiAgLy8gcGVlcnMuZm9yRWFjaCgocGVlcikgPT4ge1xuICAvLyAgIGlmKHBlZXIuaWQgPT0gZGF0YS5pZCkge1xuICAvLyAgICAgdGVtcC5wdXNoKGRhdGEpO1xuICAvLyAgIH0gZWxzZSB7XG4gIC8vICAgICB0ZW1wLnB1c2hcbiAgLy8gICB9XG4gIC8vIH0pO1xuXG4gIGxldCBjb250YWlucyA9IHBlZXJzLnNvbWUoKHBlZXIpID0+IHtcbiAgICByZXR1cm4gcGVlci5pZCA9PSBkYXRhLmlkXG4gIH0pO1xuXG4gIGlmKCFjb250YWlucykge1xuICAgIHBlZXJzLnB1c2goZGF0YSlcbiAgfVxuXG4gIHBlZXJzLmZvckVhY2goKHBlZXIpID0+IHtcbiAgICBjbGllbnRMaXN0Lmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgYFxuICAgIDxsaSBkYXRhLWNsaWVudD1cIiR7cGVlci5pZH1cIj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY2xpZW50cy1uYW1lXCI+JHtwZWVyLm5hbWV9PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjbGllbnRzLWNvbG91clwiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogJHtwZWVyLmNvbG91cn1cIj48L3NwYW4+XG4gICAgPC9saT5gKVxuICB9KVxufSk7XG5cbnNvY2tldC5vbignZHJhd19wYXRoJywgKGRhdGEpOiB2b2lkID0+IHtcbiAgY2FudmFzLmFwcGx5UGF0aChkYXRhKTtcbn0pO1xuXG5zb2NrZXQub24oJ2NsZWFyJywgKGRhdGEpOiB2b2lkID0+IHtcbiAgY2FudmFzLmFwcGx5Q2xlYXIoZGF0YS5jbGllbnQpO1xufSk7XG5cbi8vIE1vZGFsIGNvZGVcblxuKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1zdWJtaXQnKSBhcyBIVE1MRWxlbWVudCkub25jbGljayA9IChlKTogdm9pZCA9PiB7XG4gIGUucHJldmVudERlZmF1bHQoKTtcbiAgLy9cbiAgbGV0IG5hbWVJbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1uYW1lJykgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgLy8gbGV0IG5hbWUgPSAna2llcmFuJztcbiAgbGV0IG5hbWUgPSBuYW1lSW5wdXQudmFsdWU7XG4gIC8vXG4gIGlmKG5hbWUudHJpbSgpID09PSAnJykge1xuICAgIG5hbWVJbnB1dC5jbGFzc05hbWUgKz0gJyBlcnJvcic7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY2xpZW50Lm5hbWUgPSBuYW1lO1xuICAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1vZGFsJykgYXMgSFRNTEVsZW1lbnQpLnJlbW92ZSgpO1xuXG4gIGxldCBkYXRhID0ge1xuICAgIGlkOiBjbGllbnQuaWQsXG4gICAgcm9vbTogY2xpZW50LnJvb20sXG4gICAgbmFtZTogbmFtZSxcbiAgICBjb2xvdXI6IGNsaWVudC5jb2xvdXJcbiAgfTtcblxuICBzb2NrZXQuZW1pdCgndXNlcl9jb25uZWN0ZWQnLCBkYXRhKTtcbn1cbiIsImNsYXNzIFBhdGgge1xuICBzdGF0aWMgc2NhbGVJbmNvbWluZyhkYXRhLCBjYW52YXNTaXplKTogb2JqZWN0IHtcbiAgICBsZXQgc2NhbGUgPSBjYW52YXNTaXplIC8gZGF0YS5zaXplO1xuICAgIGxldCBwYXRoID0gZGF0YS5wYXRoO1xuXG4gICAgcGF0aC5sZWZ0ICo9IHNjYWxlO1xuICAgIHBhdGgudG9wICo9IHNjYWxlO1xuICAgIHBhdGguc2NhbGVYICo9IHNjYWxlO1xuICAgIHBhdGguc2NhbGVZICo9IHNjYWxlO1xuXG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGF0aDtcbiIsImltcG9ydCBDbGllbnQgZnJvbSAnLi9jbGllbnQnO1xuaW1wb3J0IENhbnZhcyBmcm9tICcuL2NhbnZhcyc7XG5cbmNsYXNzIFRvb2xiYXIge1xuICBwdWJsaWMgY2xpZW50OiBDbGllbnQ7XG4gIHB1YmxpYyBjYW52YXM6IENhbnZhcztcblxuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNhbnZhcykge1xuICAgIHRoaXMuY2xpZW50ID0gY2xpZW50O1xuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50TGlzdGVuZXJzKCk7XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyRXZlbnRMaXN0ZW5lcnMoKTogdm9pZCB7XG4gICAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjbGVhcicpIGFzIEhUTUxFbGVtZW50KS5vbmNsaWNrID0gKCk6IHZvaWQgPT4ge1xuICAgICAgdGhpcy5jbGllbnQuYnJvYWRjYXN0Q2xlYXIoKTtcbiAgICB9O1xuXG4gICAgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXNldC16b29tJykgYXMgSFRNTEVsZW1lbnQpLm9uY2xpY2sgPSAoKTogdm9pZCA9PiB7XG4gICAgICB0aGlzLmNhbnZhcy5yZXNldFpvb20oKTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRvb2xiYXI7XG4iXX0=
