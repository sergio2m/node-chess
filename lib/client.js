function notify(msg) {
    $('#errorbar').show();
    $('#notify').empty().text(msg);
    
    setTimeout( function() {
        $('#errorbar').fadeOut(400, function () { $('#errorbar').hide() });
    }, 4000);
}

function Watch  (game, board, color) {
    var self = this;
    self.id = game.id;
    
    var mode = 'rect';
    var topside = color === 'black' ? 'white' : 'black';

    //initialize buttons    
    $('#toggle-mode').append($("<img>").attr("src", "/images/"+(mode === 'rect' ? 'skew' : 'rect' )+".svg"));
    $('#toggle-topside').append($("<img>").attr("src", "/images/"+(topside === 'black' ? 'topwhite' : 'topblack')+".svg"));
    
    var viewer = new Viewer(board, topside, game, mode);
    
    self.moved = function (sx, sy, dx, dy, choice) {
        board.move(sx, sy, dx, dy, choice);
    };
    
    self.joined = function (player) { viewer.joined(player) };
    self.parted = function (player) { viewer.parted(player) };
    self.renamed = function (o, n) { viewer.renamed(o, n) };
    
    $(window).resize(function () {
        var v = new Viewer(board, topside, game, mode);
        $('#boards div:visible').remove();
        $('#boards').append(v.element);
    });

    //change buttons    
    $('#toggle-mode').click(function() {
        if (mode === 'trap') {
            mode = 'rect';
        } else {
            mode = 'trap';
        }
        $('#toggle-mode img').remove();
    $('#toggle-mode').append($("<img>").attr("src", "/images/"+(mode === 'rect' ? 'skew' : 'rect' )+".svg"));
        var v = new Viewer(board, topside, game, mode);
        $('#boards div:visible').remove();
        $('#boards').append(v.element);
    });
    
    $('#toggle-topside').click(function() {
        if (topside === 'black') {
            topside = 'white';
        } else {
            topside = 'black';
        }
        $('#toggle-topside img').remove();
        $('#toggle-topside').append($("<img>").attr("src", "/images/"+(topside === 'black' ? 'topwhite' : 'topblack')+".svg"));
        var v = new Viewer(board, topside, game, mode);
        $('#boards div:visible').remove();
        $('#boards').append(v.element);
    });
    
    $('#games').fadeOut(500);
    $('#boards').fadeIn(500).append(viewer.element);
}

DNode().connect(function (server) {
    var watching = null;
    
    function registerGame (game) {
        var board = new Board(game.pieces);
        var thumb = new Thumbnail(board);
        if (game.players.white) thumb.addPlayer(game.players.white);
        if (game.players.black) thumb.addPlayer(game.players.black);
        
        thumb.on('watch', function () {
            watching = new Watch(game, board, 'white');
        });
        thumb.on('join', function () {
            var color = thumb.available();
            if (!color) {
                notify("No spots available to join");
                return;
            }
            
            server.joinGame(game.id, color, function (err, moveMakerF) {
                if (err) {
                    notify(err);
                    return;
                }
                game.moveMakerF = moveMakerF;
                game.players[color] = {
                    name : $('input#name').val(),
                    color: color
                };
                watching = new Watch(game, board, color);
            });
        });
        
        $('#games').append(thumb.element);
        return thumb;
    }

    var thumbs = {
        dummy : new Thumbnail(new Board)
    };
    
    $('#games').append(thumbs.dummy.element);
    thumbs.dummy.on('create', function () {
        server.createGame('white', function (err, game, moveMakerF) {
            if (err) {
                console.log(err);
                return;
            }
            var board = new Board(game.pieces);
            game.moveMakerF = moveMakerF;
            watching = new Watch(game, board);
        });
    });
    
    server.subscribe(function (em) {
        em.on('deleted', function (gid) {
            if (gid in thumbs) {
                thumbs[gid].element.remove();
                delete thumbs[gid];
            }
        });
        
        em.on('created', function (game) {
            if (!(game.id in thumbs)) {
                thumbs[game.id] = registerGame(game);
            }
        });
        
        em.on('joined', function (gid, player) {
            if (thumbs[gid]) {
                thumbs[gid].addPlayer(player);
            }
            if (watching && watching.id == gid) {
                watching.joined(player);
            }
        });
        
        em.on('parted', function (gid, player) {
            if (thumbs[gid]) {
                thumbs[gid].removePlayer(player);
            }
            if (watching && watching.id == gid) {
                watching.parted(player);
            }
        });
        
        em.on('rename', function (oldname, newname) {
            Hash(thumbs).forEach(function (thumb, gid) {
                if (watching && watching.id == gid) {
                    watching.renamed(oldname, newname);
                }
                if (thumb.players.white.name == oldname) {
                    var player = thumb.players.white;
                    thumb.removePlayer(player);
                    player.name = newname;
                    thumb.addPlayer(player);
                }
                if (thumb.players.black.name == oldname) {
                    var player = thumb.players.black;
                    thumb.removePlayer(player);
                    player.name = newname;
                    thumb.addPlayer(player);
                }
            });
        });
        
        em.on('moved', function (gid, sx, sy, dx, dy, choice) {
            if (thumbs[gid]) {
                thumbs[gid].move(sx, sy, dx, dy, choice);
            }
            if (watching && watching.id == gid) {
                watching.moved(sx, sy, dx, dy, choice);
            }
        });
    });
    
    function rename (name) {
        server.name(name, function (err) {
            if (err) {
                $('input#name').addClass('angry');
                setTimeout(function () {
                    $('input#name').removeClass('angry');
                }, 2000);
                notify(err);
                return;
            }
        });
    }
    
    $(document).ready(function () {
        var elem = $('<div>');
        var im = Raphael(elem[0], 600, 40);
        im.rect(0, 0, 600, 40, 20).attr({
            fill : 'rgb(150,50,50)',
            stroke : 'none',
            opacity : 0.75
        });
        
        $('#errorbar').append(
            elem,
            $('<div>').attr('id', 'notify')
        );
        
        $('input#name').val('player' + Math.floor(Math.random() * 10000));
        rename($('input#name').val());
    });
    
    $('input#name').change(function (ev) {
        ev.preventDefault();
        rename($('input#name').val());
    });
    
    $('form#nameform').submit(function (ev) {
        ev.preventDefault();
        $('input#name').blur();
    });
    
    server.games(function (games) {
        games.forEach(function (game) {
            thumbs[game.id] = registerGame(game);
        });
    });
});
