
var webgl, gui, audio, audioEl, stats, guiConfig, sphereMaterial;
var AudioW, Sphere, WebGl;

// Create audio object 
audioEl = new Audio();
audioEl.src = 'sonny.mp3';
audioEl.controls = false;
audioEl.crossOrigin = "anonymous";
audioEl.loop = true;
audioEl.autoplay = true;
document.getElementById('audiobox').appendChild(audioEl);

// ---- Audio Class ----
AudioW = (function() {
    // Define how much information your want to get from the original frequency data
    // Here 3 for TREBLE, MEDIUM and BASS
    var SEP_VALUE = 3;

    function AudioW() {

        var self = this;

        this.ctx = new AudioContext();
        this.audio = audioEl;
        this.audioSrc = this.ctx.createMediaElementSource(this.audio);
        this.analyser = this.ctx.createAnalyser();
        this.audioData = [];

        // Connect the MediaElementSource with the analyser
        this.audioSrc.connect(this.analyser);
        this.audioSrc.connect(this.ctx.destination);

        // FrequencyBinCount tells how many values are receive from the analyser
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

        this.audio.play();
    };


    AudioW.prototype.getFrequencyData = function() {
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    };

    AudioW.prototype.getAudioData = function() {
        this.analyser.getByteFrequencyData(this.frequencyData);

        // Split array into 3
        var frequencyArray = this.splitFrenquencyArray(this.frequencyData, SEP_VALUE);

        // Make average of frenquency array entries
        for (var i = 0; i < frequencyArray.length; i++) {
            var average = 0;

            for (var j = 0; j < frequencyArray[i].length; j++) {
                average += frequencyArray[i][j];
            }
            this.audioData[i] = average / frequencyArray[i].length;
        }
        return this.audioData;
    }

    AudioW.prototype.splitFrenquencyArray = function(arr, n) {
        var tab = Object.keys(arr).map(function(key) {
            return arr[key]
        });
        var len = tab.length,
            result = [],
            i = 0;

        while (i < len) {
            var size = Math.ceil((len - i) / n--);
            result.push(tab.slice(i, i + size));
            i += size;
        }

        return result;
    }

    return AudioW;
})();

// ---- Sphere class ----
Sphere = (function() {

    var ani = 0;

    function Sphere(type, material) {
        THREE.Object3D.call(this);
        
        var color = 0x3facc8;
        this.type = type;
        var sphereGeometry = new THREE.SphereGeometry(5, 32, 32);

        this.mesh = new THREE.Line(this.geo2line(sphereGeometry), sphereMaterial[this.type], THREE.LinePieces);
        this.add(this.mesh);
    }

    Sphere.prototype = new THREE.Object3D;
    Sphere.prototype.constructor = Sphere;
    console.log(Sphere);
    

    Sphere.prototype.update = function() {
        var audioDataFullTab = audio.getAudioData();
        var audioData, coef;

        switch (this.type) {
            case 'bass':
                audioData = audioDataFullTab[0];
                break;
            case 'medium':
                audioData = audioDataFullTab[1];
                break;
            case 'treble':
                audioData = audioDataFullTab[2];
                break;
        }

        var randomScaleValue = getRandomArbitrary(-0.1, 0.1);
        var randomPositionValue = getRandomArbitrary(-2, 2);
        this.mesh.rotation.x += 0.1;
        this.mesh.rotation.y += 0.1;
        this.mesh.rotation.z += 0.1;

        this.mesh.position.x += randomPositionValue;
        this.mesh.position.y += randomPositionValue;
        this.mesh.position.z += randomPositionValue;

        this.mesh.scale.x = audioData * guiConfig.sphereSize[this.type];
        this.mesh.scale.y = audioData * guiConfig.sphereSize[this.type];
        this.mesh.scale.z = audioData * guiConfig.sphereSize[this.type];

        if ((ani < 1) && (ani > 0)) {
            ani += .03;
            this.mesh.material.dashSize = ani;
        } else if (ani > 1) {
            ani *= -1;
            ani += .03;
            this.mesh.material.dashSize = ani * -1;
        } else {
            ani += .03;
            this.mesh.material.dashSize = ani * -1;
        }
    };

    Sphere.prototype.geo2line = function(geo) {

        var geometry = new THREE.Geometry();
        var vertices = geometry.vertices;

        for (i = 0; i < geo.faces.length; i++) {

            var face = geo.faces[i];

            if (face instanceof THREE.Face3) {

                vertices.push(geo.vertices[face.a].clone());
                vertices.push(geo.vertices[face.b].clone());
                vertices.push(geo.vertices[face.b].clone());
                vertices.push(geo.vertices[face.c].clone());
                vertices.push(geo.vertices[face.c].clone());
                vertices.push(geo.vertices[face.a].clone());

            } else if (face instanceof THREE.Face4) {

                vertices.push(geo.vertices[face.a].clone());
                vertices.push(geo.vertices[face.b].clone());
                vertices.push(geo.vertices[face.b].clone());
                vertices.push(geo.vertices[face.c].clone());
                vertices.push(geo.vertices[face.c].clone());
                vertices.push(geo.vertices[face.d].clone());
                vertices.push(geo.vertices[face.d].clone());
                vertices.push(geo.vertices[face.a].clone());

            }
        }

        geometry.computeLineDistances();

        return geometry;
    };

    return Sphere;
})();

// ---- WebGl class ----
Webgl = (function() {

    function Webgl(width, height) {

        var self = this;

        // Basic three.js setup
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 10000);
        this.camera.position.z = 800;

        this.camera.lookAt(this.scene.position);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x0);



        this.spheres = [];
        this.spheresNb = 0;
        this.spheresLimit = 60;

        var audioCategories = ['bass', 'medium', 'treble']

        this.interval = setInterval(function() {
            var randomType = audioCategories[Math.floor(Math.random() * audioCategories.length)];

            self.spheres[self.spheresNb] = new Sphere(randomType);
            self.spheres[self.spheresNb].position.set(
                getRandomArbitrary(-400, 400),
                getRandomArbitrary(-400, 400),
                getRandomArbitrary(-400, 400));

            self.scene.add(self.spheres[self.spheresNb]);

            self.spheresNb++;

            self.render();

            if (self.spheresNb >= self.spheresLimit) {
                clearInterval(self.interval);
            }
        }, 700);
    };


    Webgl.prototype.resize = function(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.camera.lookAt(this.scene.position);
    };

    Webgl.prototype.render = function() {
        this.renderer.render(this.scene, this.camera);

        for (var i = 0; i < this.spheres.length; i++) {
            this.spheres[i].update();
        };

        var timer = Date.now() * 0.0010;

        this.camera.position.x += Math.sin(timer) * 5;
        this.camera.position.y += Math.cos(timer) * 5;
        this.camera.position.z += Math.sin(timer) * 5;
        this.camera.lookAt(this.scene.position);


    };

    return Webgl;

})();

// Gui object containing config value
guiConfig = {
    sphereSize: {
        treble: 0.05,
        medium: 0.01,
        bass: 0.01
    },
    sphereColor: {
        treble: 0x3facc3,
        medium: 0xe67e22,
        bass: 0x2ecc71
    }
}

// Setting thre three different material for sphere meshes
sphereMaterial = {
    "treble": new THREE.LineDashedMaterial({
        color: guiConfig.sphereColor.treble,
        dashSize: 1,
        scale: 1,
        gapSize: 1.5,
        lineWidth: 10
    }),
    "medium": new THREE.LineDashedMaterial({
        color: guiConfig.sphereColor.medium,
        dashSize: 1,
        scale: 1,
        gapSize: 1.5,
        lineWidth: 10
    }),
    "bass": new THREE.LineDashedMaterial({
        color: guiConfig.sphereColor.bass,
        dashSize: 1,
        scale: 1,
        gapSize: 1.5,
        lineWidth: 10
    })
}


window.onload = function() {
    init();
};


// Launch on dom ready
function init() {
    webgl = new Webgl(window.innerWidth, window.innerHeight);
    audio = new AudioW();

    // DAT.GUI
    gui = new dat.GUI();

    var shpereSizeFolder = gui.addFolder('Spheres Sizes');
    var shpereColorFolder = gui.addFolder('Spheres Colors');

    shpereSizeFolder.add(guiConfig.sphereSize, "treble").min(0).max(1.2).step(0.01);
    shpereSizeFolder.add(guiConfig.sphereSize, "medium").min(0).max(1).step(0.01);
    shpereSizeFolder.add(guiConfig.sphereSize, "bass").min(0).max(1).step(0.01);
    shpereSizeFolder.open();

    shpereColorFolder.addColor(guiConfig.sphereColor, 'bass').onChange(function() {
        sphereMaterial.bass.color.setHex(dec2hex(guiConfig.sphereColor.bass));
    });
    shpereColorFolder.addColor(guiConfig.sphereColor, 'medium').onChange(function() {
        sphereMaterial.medium.color.setHex(dec2hex(guiConfig.sphereColor.medium));
    });
    shpereColorFolder.addColor(guiConfig.sphereColor, 'treble').onChange(function() {
        sphereMaterial.treble.color.setHex(dec2hex(guiConfig.sphereColor.treble));
    });
    shpereColorFolder.open();

    // Add stats
    stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms, 2: mb
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';


    // Append webgl and stats
    document.getElementById('webgl').appendChild(webgl.renderer.domElement);
    document.body.appendChild(stats.domElement);

    window.addEventListener('resize', resizeHandler, true);

    animate();
}

// On resize handler
function resizeHandler() {
    webgl.resize(window.innerWidth, window.innerHeight);
}


// Launch the animation
function animate() {
    stats.begin();
    requestAnimationFrame(animate);
    webgl.render();
    stats.end();
}

// Return random value between min and max arg
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
};


// Dec2Hex for setting colors
function dec2hex(i) {
    var result = "0x000000";
    if (i >= 0 && i <= 15) {
        result = "0x00000" + i.toString(16);
    } else if (i >= 16 && i <= 255) {
        result = "0x0000" + i.toString(16);
    } else if (i >= 256 && i <= 4095) {
        result = "0x000" + i.toString(16);
    } else if (i >= 4096 && i <= 65535) {
        result = "0x00" + i.toString(16);
    } else if (i >= 65535 && i <= 1048575) {
        result = "0x0" + i.toString(16);
    } else if (i >= 1048575) {
        result = '0x' + i.toString(16);
    }
    if (result.length == 8) {
        return result;
    }
}