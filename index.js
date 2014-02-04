module.exports = function (game, opts) {
    if (!opts) opts = {};
    if (opts.bark === undefined) opts.bark = 1;
    if (opts.leaves === undefined) opts.leaves = 2;
    if (!opts.height) opts.height = Math.random() * 16 + 4;
    if (opts.base === undefined) opts.base = opts.height / 3;
    if (opts.radius === undefined) opts.radius = opts.base;
    if (opts.treetype === undefined) opts.treetype = 1;

    var voxels = game.voxels;
    var bounds = boundingChunks(voxels.chunks);
    var step = voxels.chunkSize * voxels.cubeSize;
    if (!opts.position) {
        var chunk = voxels.chunks[randomChunk(bounds)];
        opts.position = {
            x: (chunk.position[0] + Math.random()) * step,
            y: (chunk.position[1] + Math.random()) * step,
            z: (chunk.position[2] + Math.random()) * step
        };
    }
    
    var pos_ = {
        x: opts.position.x, 
        y: opts.position.y, 
        z: opts.position.z
    };
    function position () {
        return {
            x: pos_.x, 
            y: pos_.y, 
            z: pos_.z
        };
    }
    
    var ymax = bounds.y.max * step;
    var ymin = bounds.y.min * step;
    if (occupied(pos_.y)) {
        for (var y = pos_.y; occupied(y); y += voxels.cubeSize);
        if (y >= ymax) return false;
        pos_.y = y;
    }
    else {
        for (var y = pos_.y; !occupied(y); y -= voxels.cubeSize);
        if (y <= ymin) return false;
        pos_.y = y + voxels.cubeSize;
    }
    function occupied (y) {
        var pos = position();
        pos.y = y;
        return y <= ymax && y >= ymin && voxels.voxelAtPosition([pos.x,pos.y,pos.z]);
    }
    
    var updated = {};
    
    function subspacetree() {
        var around = [
        [ 0, 1 ], [ 0, -1 ],
        [ 1, 1 ], [ 1, 0 ], [ 1, -1 ],
        [ -1, 1 ], [ -1, 0 ], [ -1, -1 ]
        ];
        for (var y = 0; y < opts.height - 1; y++) {
            var pos = position();
            pos.y += y * voxels.cubeSize;
            if (set(pos, opts.bark)) break;
            if (y < opts.base) continue;
            around.forEach(function (offset) {
                if (Math.random() > 0.5) return;
                var x = offset[0] * voxels.cubeSize;
                var z = offset[1] * voxels.cubeSize;
                pos.x += x;
                pos.z += z;
                set(pos, opts.leaves);
                pos.x -= x;
                pos.z -= z;
            });
        }
    }

    function guybrushtree() {
        var sphere = function(x,y,z, r) {
            return x*x + y*y + z*z <= r*r;
        }
        for (var y = 0; y < opts.height - 1; y++) {
            var pos = position();
            pos.y += y * voxels.cubeSize;
            if (set(pos, opts.bark)) break;
        }
        var radius = opts.radius;
        for (var xstep = -radius; xstep <= radius; xstep++) {
            for (var ystep = -radius; ystep <= radius; ystep++) {
                for (var zstep = -radius; zstep <= radius; zstep++) {
                    if (sphere(xstep,ystep,zstep, radius)) {
                        var leafpos = {
                            x: pos.x + (xstep * voxels.cubeSize), 
                            y: pos.y + (ystep * voxels.cubeSize), 
                            z: pos.z + (zstep * voxels.cubeSize)
                        }
                        set(leafpos, opts.leaves);
                    }
                }
            }
        }
    }
    
    function drawAxiom(axiom, angle, unitsize, units) {
        var posstack = [];
        
        var penangle = 0;
        var pos = position();
        pos.y += unitsize * 30;
        function moveForward() {
            var ryaw = penangle * Math.PI/180;
            for (var i = 0; i < units; i++) {
                pos.y += unitsize * Math.cos(ryaw);
                pos.z += unitsize * Math.sin(ryaw);
                set(pos,opts.leaves);
            }
        }

        function setPoint() {
            set(pos, opts.bark);
        }
        function setMaterial(value) {
            mindex = value;
        }
        function yaw(angle) {
            penangle += angle;
        }
        function pitch(angle) {
            //turtle.pitch += angle;
        }
        function roll(angle) {
            //turtle.roll += angle;
        }
        function PushState() {
            //penstack.push(turtle);
            posstack.push(pos);
        }
        function PopState() {
          //  turtle = penstack.pop();
            pos = posstack.pop();
        }
        
        //F  - move forward one unit with the pen down
        //G  - move forward one unit with the pen up
        //#  - Changes draw medium.

        // +  - yaw the turtle right by angle parameter
        // -  - yaw the turtle left by angle parameter
        // &  - pitch the turtle down by angle parameter
        // ^  - pitch the turtle up by angle parameter
        // /  - roll the turtle to the right by angle parameter
        // *  - roll the turtle to the left by angle parameter
        // [  - save in stack current state info
        // ]  - recover from stack state info
        for (var i = 0; i < axiom.length; i++) {
            var c = axiom.charAt(i);
            switch(c) {
                case 'F':
                    moveForward();
                    setPoint();
                    break;
                case '+':
                    yaw(+angle);
                    break;
                case '-':
                    yaw(-angle);
                    break;
                case '&':
                    pitch(+angle);
                    break;
                case '^':
                    pitch(-angle);
                    break;
                case '/':
                    roll(+angle);
                    break;
                case '*':
                    roll(-angle);
                    break;
                case 'G':
                    moveForward();
                    break;
                case '[':
                    PushState();
                    break;
                case ']':
                    PopState();
                    break;
                case '0':
                    setMaterial(0);
                    break;
                case '1':
                    setMaterial(1);
                    break;
                case '2':
                    setMaterial(2);
                    break;
                case '3':
                    setMaterial(3);
                    break;

            }
        }
            
    }

    function fractaltree() {
        var axiom = "FX";
        var rules = [ ["X", "X+YF+"], ["Y", "-FX-Y"]];
        axiom = applyRules(axiom,rules);
        axiom = applyRules(axiom,rules);
        axiom = applyRules(axiom,rules);
        axiom = applyRules(axiom,rules);
        axiom = applyRules(axiom,rules);
        axiom = applyRules(axiom,rules);
        drawAxiom(axiom, 90, voxels.cubeSize,5);
    }
    
    switch (opts.treetype) {
        case 1:
            subspacetree();
            break;
        case 2:
            guybrushtree();
            break;
        case 3:
            fractaltree();
            break;
        default:
            subspacetree();
    }
    
    
    var pos = position();
    pos.y += y * voxels.cubeSize;
    set(pos, opts.leaves);
    
    Object.keys(updated).forEach(function (key) {
        game.showChunk(updated[key]);
    });
    
    function set (pos, value) {
        var ex = voxels.voxelAtPosition([pos.x,pos.y,pos.z]);
        if (ex) true;
        voxels.voxelAtPosition([pos.x,pos.y,pos.z], value);
        var c = voxels.chunkAtPosition([pos.x,pos.y,pos.z]);
        var key = c.join('|');
        if (!updated[key] && voxels.chunks[key]) {
            updated[key] = voxels.chunks[key];
        }
    }
};

function regexRules(rules) {
        var regexrule = '';
        rules.forEach(function (rule) {
            if (regexrule != '') {
                regexrule = regexrule+ '|' ;
            }
            regexrule = regexrule+rule[0];
        });
        return new RegExp(regexrule, "g");
    }

function applyRules(axiom, rules) {
        function matchRule(match)
        {
            for (var i=0;i<rules.length;i++)
            { 
                if (rules[i][0] == match) return rules[i][1];
            }
            return '';
        }
        return axiom.replace(regexRules(rules), matchRule);
    }
        
function randomChunk (bounds) {
    var x = Math.random() * (bounds.x.max - bounds.x.min) + bounds.x.min;
    var y = Math.random() * (bounds.y.max - bounds.y.min) + bounds.y.min;
    var z = Math.random() * (bounds.z.max - bounds.z.min) + bounds.z.min;
    return [ x, y, z ].map(Math.floor).join('|');
}

function boundingChunks (chunks) {
    return Object.keys(chunks).reduce(function (acc, key) {
        var s = key.split('|');
        if (acc.x.min === undefined) acc.x.min = s[0]
        if (acc.x.max === undefined) acc.x.max = s[0]
        if (acc.y.min === undefined) acc.y.min = s[1]
        if (acc.y.max === undefined) acc.y.max = s[1]
        if (acc.z.min === undefined) acc.z.min = s[2]
        if (acc.z.max === undefined) acc.z.max = s[2]
        
        acc.x.min = Math.min(acc.x.min, s[0]);
        acc.x.max = Math.max(acc.x.max, s[0]);
        acc.y.min = Math.min(acc.y.min, s[1]);
        acc.y.max = Math.max(acc.y.max, s[1]);
        acc.z.min = Math.min(acc.z.min, s[2]);
        acc.z.max = Math.max(acc.z.max, s[2]);
        
        return acc;
    }, {
        x: {}, 
        y: {}, 
        z: {}
    });
}
