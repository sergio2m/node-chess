var Board = require('../lib/game/board');
var MoveGenerator = require('../lib/game/movegenerator');

var b = new Board;
var b2 = new Board;
var b3 = new Board;

b2.move(0,1,0,3); // a2-a4
b2.move(0,6,0,4); // b7-b5

b3.move(0,1,0,3);
b3.move(1,6,1,4);

module.exports = {
    'initial-pawn-moves-white': function (assert) {
        assert.equal(MoveGenerator(null,b.at(0,1)).length, 2);
        assert.equal(MoveGenerator(null,b.at(1,1)).length, 2);
        assert.equal(MoveGenerator(null,b.at(2,1)).length, 2);
        assert.equal(MoveGenerator(null,b.at(3,1)).length, 2);
        assert.equal(MoveGenerator(null,b.at(4,1)).length, 2);
        assert.equal(MoveGenerator(null,b.at(5,1)).length, 2);
        assert.equal(MoveGenerator(null,b.at(6,1)).length, 2);
        assert.equal(MoveGenerator(null,b.at(7,1)).length, 2);
    },
    'initial-pawn-moves-black': function (assert) {
        assert.equal(MoveGenerator(null,b.at(0,6)).length, 2);
        assert.equal(MoveGenerator(null,b.at(1,6)).length, 2);
        assert.equal(MoveGenerator(null,b.at(2,6)).length, 2);
        assert.equal(MoveGenerator(null,b.at(3,6)).length, 2);
        assert.equal(MoveGenerator(null,b.at(4,6)).length, 2);
        assert.equal(MoveGenerator(null,b.at(5,6)).length, 2);
        assert.equal(MoveGenerator(null,b.at(6,6)).length, 2);
        assert.equal(MoveGenerator(null,b.at(7,6)).length, 2);
    },
    'single-initial-black-move' : function (assert) {
        moves = MoveGenerator(null, b.at(0,6));
        var ok = 0;
        for (var i = 0; i < moves.length; i++) {
            var move = moves[i];
            if (move.x == 0 && move.y == 5) ok++;
            if (move.x == 0 && move.y == 4) ok++;
        }
        assert.equal(ok,2);
    },
    'single-initial-white-move' : function (assert) {
        moves = MoveGenerator(null, b.at(0,1));
        var ok = 0;
        for (var i = 0; i < moves.length; i++) {
            var move = moves[i];
            if (move.x == 0 && move.y == 2) ok++;
            if (move.x == 0 && move.y == 3) ok++;
        }
        assert.equal(ok,2);
    },
    'cant-move' : function (assert) {
        assert.equal(MoveGenerator(null,b2.at(0,3)).length, 0);
        assert.equal(MoveGenerator(null,b2.at(0,4)).length, 0);
    },
    'capture-or-move' : function (assert) {
        var moves = MoveGenerator(null,b3.at(0,3));
        assert.equal(moves.length,2);

        var ok = 0;
        for (var i = 0; i < moves.length; i++) {
            var move = moves[i];
            if (move.x == 0 && move.y == 4) ok++;
            if (move.x == 1 && move.y == 4) ok++;
        }
        assert.equal(ok,2);
    },
};
