'use strict';

Physijs.scripts.worker = 'js/physijs_worker.js';

var renderer, scene, camera, am_light, dir_light, loader, ground,
    barrelV, barrelH, cannon, box, target, gui;
var realisticFactor = 10;
var GAME_RUNNING = true;
var keyboard = new KeyboardState();
var controls, orbCam;
var objectives = [
"Ready to learn some Physics?\nIn addition to using the arrow keys to orient the cannon, you can input specific values in the control bar in the top-right corner of your screen. This will be useful for completing some of the objectives.",
"1. The target is located 60ft east of the cannon, and 80ft north.\nSet the altitude angle of the cannon to (45 degrees) in order to shoot that distance.\nYour task is to figure out the azimuth angle required to hit the target.<br>Instructions: <br>- Set the cannon's altitude to (45 degrees)<br>- Calculate the azimuth angle needed for the projectile to hit the target<br>- Orient the cannon with the controls and shoot to the target",
"2. Think of the map as a grid, the cannon is at the position (30,50) and the target is at position (100, 70).<br>Set the altitude of the cannon to (30 degrees) to shoot the correct distance. <br>Figure out the azimuth angle needed to hit the target.",
//"3. Adjusting the altitude angle of the cannon to (60 degrees) will send the projectile flying <br>for (6 seconds) when the cannon launches the projectile at a velocity of (30 ft/s). <br>Set the Azimuth to (0 degrees).<br>At what distance should the target be set so that the projectile will hit it?<br>- Set the azimuth of the cannon to (0 degrees), to aim at the target<br>- Calculate the position distance of the target <br>- Input the distance and shoot",
"3. Think of the map as a grid, the cannon is at the position (100,12) and the target is at position (250,70).<br>Set the altitude of the cannon to (60 degrees) to shoot the correct distance. <br>Figure out the azimuth angle needed to hit the target, and calculate the launch velocity.",
"4. The target is located 92 meters from the cannon in a direction of 47 degrees (Azimuth). Adjust the altitude angle of the cannon<br> in order to shoot the projectile onto the target. (The cannon launches the projectile at a velocity of 40 m/s and it is in the air for 7.8 seconds)<br><br>Instructions:<br>- Set the azimuth of the cannon to 47 degrees, to aim at the target<br>- Calculate the altitude angle needed for the projectile to hit the target.",
"5. The target is located 92 ft horizontally from the cannon in a direction of 47 degrees(Azimuth), at a height of (20 meters). Adjust the altitude angle of the cannon in order to shoot the projectile onto the target. (The cannon launches the projectile at a velocity of 40 m/s and it is in the air for 7.16seconds)<br><br>Instructions:<br>- Set the azimuth of the cannon to 47 degrees, to aim at the target<br>- Calculate the altitude angle needed for the projectile to hit the target"
];

var instructions = [
"Press Enter to see your first objective.",
"Azimuth = The angle describing the direction of the cannon like north, south, or somewhere in between <br>Altitude = The angle describing how high the cannon is aiming, between vertical and horizontal <br><br>Math: <br> theta = atan(y/x) <br> y = north/south distance to the target <br> x = west/east distance to the target <br><br>*theta is the azimuth angle<br><br><br><br>Press Enter to show or hide this text",
"Instructions:<br>- Set the cannon's altitude to (45 degrees)<br>- Calculate the azimuth angle needed for the projectile to hit the target<br><br> y = (y-target - y-cannon) <br> *y = north/south distance to the target<br> *y-target = y coordinate of the target ( __, 70 )<br> *y-cannon = y coordinate of the cannon ( __, 50 )<br><br> x = (x-target - x-cannon)<br> *x = west/east distance to the target<br> *x-target = x coordinate of the target ( 100, __ )<br> *x-cannon = x coordinate of the cannon ( 30, __ )<br><br> theta = atan(y/x)<br>*theta = azimuth angle",
//"Physics<br><br>v(x) = v * cos(theta)<br> *v(x) = horizontal component of the velocity of the projectile<br> *v = velocity of the projectile when launched<br> *theta = altitude angle of the cannon<br><br>d = v(x) * t<br> *d = distance from the cannon to the target<br> *v(x) = horizontal velocity of the projectile when launched<br> *t = time that passes from launch until collision",
"Instructions:<br>- Calculate the azimuth angle needed for the projectile to hit the target<br><br> theta = atan(y/x)<br>*theta = azimuth angle<br><br> to find the launch velocity use the following equation: <br> V = sqrt(d*g/2*cos(altitude)*sin(altitude)) <br> where d is the distance from the cannon to the target.",
"Physics <br><br>Solve for t (theta will still be unknown)<br><br> d = v * cos(theta) * t<br> *v = velocity of the projectile when launched<br> *theta = altitude angle of the cannon<br> *d = horizontal distance from the cannon to the target <br> *t = time that passes from launch until collision.",
"Physics <br> Substitute t in this equation <br><br> (g/2) * t^2 + v * sin(theta) * t = h <br> t is the time the projectile is in the air.<br> h is the height of the target from the ground <br> v is the launch velocity <br> *g = -9.8 the acceleration due to gravity (m/s^2)"
];

var level = 0;

function initScene() {
    showMessage(objectives[level] + '<br><br><br>' +  instructions[level]);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0xefd1b5); // reddish sky
    //renderer.setClearColor(0x9999ff); // blue
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('viewport').appendChild(renderer.domElement);

    scene = new Physijs.Scene({ reportsize: 10, fixedTimeStep: 1/60 });
    scene.setGravity(new THREE.Vector3(0, -9.8 * realisticFactor, 0));
    scene.fog = new THREE.FogExp2(0xefd1b5, 0.0025); // reddish sky
    //scene.fog = new THREE.FogExp2(0x9999ff, 0.001); // blue

    camera = new THREE.PerspectiveCamera(
        35, window.innerWidth / window.innerHeight, 1, 1000);
    // note: camera position is updated every frame
    camera.position.set(80, 60, 90);
    scene.add(camera);

    // for allowing camera rotation via mouse
    orbCam = new THREE.PerspectiveCamera(
        35, window.innerWidth / window.innerHeight, 1, 1000);
    orbCam.position.set(-80, 60, -90);
    controls = new THREE.OrbitControls(orbCam, renderer.domElement);

    // ambient light
    am_light = new THREE.AmbientLight(0x444444); // gray
    scene.add(am_light);

    // directional light
    dir_light = new THREE.DirectionalLight(0xFFFFFF);
    dir_light.position.set(200, 300, -50);
    dir_light.target.position.copy(scene.position);
    dir_light.castShadow = true;
    dir_light.shadowCameraLeft = -500;
    dir_light.shadowCameraTop = -500;
    dir_light.shadowCameraRight = 500;
    dir_light.shadowCameraBottom = 500;
    dir_light.shadowCameraNear = 80;
    dir_light.shadowCameraFar = 2000;
    dir_light.shadowBias = -.001;
    dir_light.shadowMapWidth = dir_light.shadowMapHeight = 2048;
    dir_light.shadowDarkness = .85;
    scene.add(dir_light);

    // Misc
    loader = new THREE.TextureLoader();
    renderer.shadowMap.enabled = true;

    // Ground
    var g_image = loader.load('images/' + (1 ? 'grass.png' : 'comeau.jpg'));
    var g_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: g_image }),
        .9, // high friction
        .2 // low restitution
    );
    g_material.map.wrapS = g_material.map.wrapT = THREE.RepeatWrapping;
    g_material.map.repeat.set(600, 600);

    ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(20000, 4, 20000),
        g_material,
        0, // mass
        { restitution: .2, friction: .9 }
    );
    ground.position.y = -2; // top surface is at an altitude of zero
    ground.receiveShadow = true;
    scene.add(ground);

    // Call helpers
    makeCannon();
    makeProjectile();
    makeTarget();
    makeGUI();
    makeFloorCompass();
    setDefaults();
    requestAnimationFrame(render);
}

function makeProjectile() {
    var image = loader.load('images/' + (1 ? 'crate.jpg' : 'canada.jpg'));
    box = new Physijs.BoxMesh(
        new THREE.CubeGeometry(4, 4, 4),
        new THREE.MeshLambertMaterial({ map: image }),
        //new THREE.MeshLambertMaterial({ color: 0x888888 }),
        55, // mass
        { restitution: .9, friction: .9 }
    );
    box.position.y = 2; // prop it on top of the ground
    box.receiveShadow = true;
    box.castShadow = true;
    box.the_projectile = true;
    box.size = box.geometry.parameters.height;
    box.launchVelocity = 0;
    scene.add(box);
    dir_light.target = box; // allows us to always render shadows around box
}

function makeTarget() {
    var image = loader.load('images/target.jpeg');
    target = new Physijs.BoxMesh(
        new THREE.BoxGeometry(45, .1, 45),
        new THREE.MeshLambertMaterial({ map: image }),
        0,
        { restitution: 0, friction: 1 }
    );
    target.position.x = 80; // North
    target.position.z = 60; // East
    target.receiveShadow = true;
    target.castShadow = true;
    scene.add(target);

    target.addEventListener(
        'collision',
        function(other_obj, rel_vel, rel_rot, contact_normal) {
            if (other_obj.the_projectile) {
                other_obj.position.set(0, 8, 0);
                cameraChase(camera, other_obj);
                level++;

                box.__dirtyPosition = true;
                box.position.set(0, 8, 0);

                target.__dirtyPosition = true;
                if (level == 2) {
                    target.position.x = 20;
                    target.position.z = 70;
                    target.position.y = 0;
                }
                else if (level == 3) {
                    target.position.x = 58;
                    target.position.z = 150;
                    target.position.y = 0;
                }
                else if (level == 4) {
                    target.position.x = 67.28;
                    target.position.z = 62.74;
                    target.position.y = 0;
                }
                else if (level == 5) {
                    target.position.x = 67.28;
                    target.position.z = 62.74;
                    target.position.y = 20;
                }
                else {
                    showMessage('congratulations, you won!');
                    target.position.x = 80; //North
                    target.position.z = 60; //East
                    target.position.y = 0;
                    GAME_RUNNING = false;
                    level = 0;
                    return;
                }

                showMessage(
                        objectives[level]+'<br><br><br>'+instructions[level]);
                GAME_RUNNING = false;
            }
        }
    );
}

function makeFloorCompass() {
    if (1) { // the cool pirate compass
        var image = loader.load('images/grassArrow.png');
        var geometry = new THREE.BoxGeometry(30, .1, 30);
        var rotation = -Math.PI/2;
    } else { // the normal boring compass
        var image = loader.load('images/basicCompass.jpg');
        var geometry = new THREE.BoxGeometry(30, .1, 35.8565);
        var rotation = 0;
    }

    var material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: image }),
        0.5,
        0.5
    );
    var compass = new Physijs.BoxMesh(
        geometry,
        material,
        0,
        { restitution: 0, friction: 1 }
    );
    compass.position.x = -30;
    compass.position.z = -30;
    compass.rotation.y = rotation;
    compass.receiveShadow = true;
    scene.add(compass);
}

function makeCannon() {
    var track = new THREE.Mesh(
        new THREE.CylinderGeometry(10.1, 10.1, 8.2, 32),
        new THREE.MeshLambertMaterial({ color: 0x764F13 })
    );
    track.receiveShadow = true;
    track.castShadow = true;
    track.rotation.z = Math.PI/2;
    track.position.y = 4.1;

    var dome = new THREE.Mesh(
        new THREE.SphereGeometry(10, 32, 16),
        new THREE.MeshLambertMaterial({ color: 0x966F33 })
    );
    dome.position.y = 4;
    dome.receiveShadow = true;
    dome.castShadow = true;

    // barrel
    var smallCylinderGeom = new THREE.CylinderGeometry(3, 3, 15, 32, 4);
    var largeCylinderGeom = new THREE.CylinderGeometry(4, 4, 15, 32, 4);
    var smallCylinderBSP = new ThreeBSP(smallCylinderGeom);
    var largeCylinderBSP = new ThreeBSP(largeCylinderGeom);
    var intersectionBSP = largeCylinderBSP.subtract(smallCylinderBSP);
    var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var hollowCylinder = intersectionBSP.toMesh(barrelMaterial);
    hollowCylinder.position.z = 15;
    hollowCylinder.rotateX(Math.PI/2);
    hollowCylinder.receiveShadow = true;
    hollowCylinder.castShadow = true;
    barrelV = new THREE.Object3D();
    barrelV.add(hollowCylinder);
    barrelV.position.y = -4; // keep rotation radius, but move to right place
    var tmp = new THREE.Object3D();
    tmp.add(barrelV);
    tmp.rotateZ(Math.PI);
    barrelH = new THREE.Object3D();
    barrelH.add(track);
    barrelH.add(tmp);

    // make base and then add the other things in too
    cannon = new THREE.Mesh(
        new THREE.CylinderGeometry(10, 10, 8, 32),
        new THREE.MeshLambertMaterial({ color: 0x966F33 })
    );
    cannon.position.y = 4;
    cannon.receiveShadow = true;
    cannon.castShadow = true;
    cannon.azimuth = 0;
    cannon.altitude = 0;

    cannon.add(barrelH);
    cannon.add(dome);
    scene.add(cannon);
}

function rand(min, max, interval) {
    if (typeof(interval) === 'undefined') interval = 1;
    var r = Math.floor(Math.random() * (max - min + interval) / interval);
    return r * interval + min;
}

function cameraChase(cam, mesh) {
    var cameraOffset = orbCam.position.clone().add(mesh.position);
    cam.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z);
    cam.lookAt(mesh.position);
}

function tossBox() {
    box.setAngularVelocity(
            new THREE.Vector3(rand(-7, 7), rand(-7, 7), rand(-7, 7)));
    box.setLinearVelocity(
            new THREE.Vector3(rand(-66, 66), rand(32, 123), rand(-66, 66)));
}

function shootBox() {
    GAME_RUNNING = true;
    box.position.set(0, 8, 0);
    box.setAngularVelocity(
            new THREE.Vector3(rand(-7, 7), rand(-7, 7), rand(-7, 7)));
    var speed = box.launchVelocity * realisticFactor;
    var phi = Math.PI/2 - barrelV.rotation.x;
    var theta = barrelH.rotation.y;
    var z = speed * Math.sin(phi) * Math.cos(theta); // math x | graphics z
    var x = speed * Math.sin(phi) * Math.sin(theta); // math y | graphics x
    var y = speed * Math.cos(phi); // math z | graphics y
    box.setLinearVelocity(new THREE.Vector3(x, y, z));
}

function updateShadows(light, mesh) {
    var relativeOffset = new THREE.Vector3(200, 300, -50);
    var newPos = relativeOffset.add(mesh.position);
    light.position.set(newPos.x, newPos.y, newPos.z);
}

function updateHUD() {
    var str = 'Use the arrow keys to position cannon and spacebar to ' +
        'shoot.<br>Press enter to show or hide the menu.';
    changeHTML('info', str);
    str = 'Longitude: ' + pad('    ',
            Math.round(box.position.x) / realisticFactor) + 'm';
    changeHTML('longitude', str);
    str = '  Latitude: ' + pad('    ',
            Math.round(box.position.z) / realisticFactor) + 'm';
    changeHTML('latitude', str);
    str = '  Altitude: ' + pad('    ',
            Math.round(box.position.y - box.size/2) / realisticFactor) + 'm';
    changeHTML('altitude', str);
}

function changeHTML(id, str) {
    document.getElementById(id).innerHTML = str.replace(/ /g, '&nbsp;');
}

function handleUserInput() {
    keyboard.update();

    if (keyboard.pressed('up')) {
        addAltitude(-1);
    }
    if (keyboard.pressed('down')) {
        addAltitude(1);
    }
    if (keyboard.pressed('left')) {
        addAzimuth(1.5);
    }
    if (keyboard.pressed('right')) {
        addAzimuth(-1.5);
    }

    if (keyboard.pressed('space')) {
        shootBox();
    }

    if (keyboard.pressed('pagedown')) {
        addLaunchVelocity(-0.3);
    }
    if (keyboard.pressed('pageup')) {
        addLaunchVelocity(0.3);
    }

    if (keyboard.down('esc') || keyboard.down('M')) {
        if (level == 0) {
            level = 1;
            showMessage(objectives[level]+'<br><br><br>'+instructions[level]);
        } else {
            toggleMessage();
        }
    }
}

function showMessage(str) {
    changeHTML('popupP', str);
    document.getElementById('popup').style.display = 'block';
    document.getElementById('popupP').style.display = 'block';
}

function toggleMessage() {
    if (document.getElementById('popup').style.display == 'none') {
        document.getElementById('popup').style.display = 'block';
        document.getElementById('popupP').style.display = 'block';
    } else {
        document.getElementById('popup').style.display = 'none';
        document.getElementById('popupP').style.display = 'none';
    }
}

function makeGUI() {
    // for initializing GUI controls properly - defaults must be set afterward
    box.launchVelocity = 0.1;
    cannon.azimuth = 0.1;
    cannon.altitude = 0.1;

    gui = new dat.GUI();
    gui.add(box, 'launchVelocity', 0.0, 33.0)
        .name("Launch Velocity").onChange(setLaunchVelocity);
    gui.add(cannon, 'azimuth', 0.0, 360.0)
        .name("Azimuth Angle").onChange(setAzimuth);
    gui.add(cannon, 'altitude', 0.0, 90.0)
        .name("Altitude Angle").onChange(setAltitude);
    gui.add({ toggle: toggleMessage }, 'toggle').name("Show/Hide Message");
    gui.add({ fire: shootBox }, 'fire').name("FIRE!");

    gui.width = 500;
    gui.open();
}

function refreshGUI() {
    for (var i in gui.__controllers) {
        gui.__controllers[i].updateDisplay();
    }
}

function setDefaults() {
    box.launchVelocity = 9.89;
    setAzimuth(53.13);
    setAltitude(45);
}

function setLaunchVelocity(value) {
    box.launchVelocity = Math.min(Math.max(value, 0), 33);
    refreshGUI();
}

function addLaunchVelocity(delta) {
    setLaunchVelocity(box.launchVelocity + delta);
}

function setAzimuth(value) {
    value = value < 0 ? 360 + value % 360 : value > 360 ? value % 360 : value;
    barrelH.rotation.y = value * Math.PI/180;
    barrelH.__dirtyRotation = true;
    cannon.azimuth = value;
    refreshGUI();
}

function addAzimuth(delta) {
    setAzimuth(cannon.azimuth + delta);
}

function setAltitude(value) {
    value = value < 0 || value > 90 ? Math.min(Math.max(value, 0), 90) : value;
    barrelV.rotation.x = value * Math.PI/180;
    barrelV.__dirtyRotation = true;
    cannon.altitude = value;
    refreshGUI();
}

function addAltitude(delta) {
    setAltitude(cannon.altitude + delta);
}

function render() {
    handleUserInput();
    if (GAME_RUNNING) {
        box.__dirtyRotation = true;
        box.__dirtyPosition = true;
        scene.simulate(undefined, 2); // try to be fast and accurate
        cameraChase(camera, box);
        updateShadows(dir_light, box);
        updateHUD();
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function pad(pad, str, padRight) {
    if (typeof str === 'undefined') return pad;
    var length = Math.max(pad.length, str.length);
    if (padRight) {
        return (str + pad).substring(0, length);
    } else {
        return (pad + str).slice(-length);
    }
}

window.onload = initScene;
