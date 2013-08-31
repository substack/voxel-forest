module.exports = function (game, opts) {
    if (!opts) opts = {};
    if (opts.bark === undefined) opts.bark = 1;
    if (opts.leaves === undefined) opts.leaves = 2;
    if (!opts.height) opts.height = Math.random() * 16 + 4;
    if (opts.base === undefined) opts.base = opts.height / 3;
    
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
    
    var pos_ = { x: opts.position.x, y: opts.position.y, z: opts.position.z };
    function position () {
        return { x: pos_.x, y: pos_.y, z: pos_.z };
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
            pos.x += x; pos.z += z;
            set(pos, opts.leaves);
            pos.x -= x; pos.z -= z;
        });
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
    }, { x: {}, y: {}, z: {} });
}
