	var scene, renderer, camera;    
    var crate, crateTexture, crateNormalMap, crateBumpMap;
	var wand, wandTexture, wandNormalMap, wandBumpMap;
    var floorTexture, floorNormalMap, floorBumpMap;
    var container, stats, counter;
    var RESOURCES_LOADED = false;
	var controls;

	var objects = [];
	var boxes = [];
	var spheres = [];
	var objectPosition = [];
	var randNum = Math.floor(Math.random() * 65 - 30) * 5;

    var blocker = document.getElementById('blocker');
    var instructions = document.getElementById('instructions');
    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if (havePointerLock) {
        var element = document.body;

        var pointerlockchange = function (event) {
            if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
                controlsEnabled = true;
                controls.enabled = true;
                blocker.style.display = 'none';
            } else {
                controls.enabled = false;
                blocker.style.display = '-webkit-box';
                blocker.style.display = '-moz-box';
                blocker.style.display = 'box';
                instructions.style.display = '';
            }
        };
        var pointerlockerror = function (event) {
            instructions.style.display = '';
        };
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

		instructions.addEventListener('click', function(event) {
			instructions.style.display = 'none';

			element.requestPointerLick = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			element.requestPointerLock();
		}, false );

    } else {
		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
	}

    // Detect WebGL support
    if (!Detector.webgl) Detector.addGetWebGLMessage();

    var loadingScreen = {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 9000),
        box: new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x0cd788 })
        )
    };
    var loadingManager;
    var RESOURCES_LOADED = false;

    // Model
    // Fox: https://clara.io/view/1a03ac6b-d6b5-4c2d-9f1a-c80068311396#
    // Tree: http://kenney.nl/assets/nature-pack-extended
    // Wand: https://www.turbosquid.com/FullPreview/Index.cfm/ID/810456

    init();
    animate();

	var controlsEnabled = false;

	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var canJump = false;

	var prevTime = performance.now();
	var velocity = new THREE.Vector3();


    function init() {

	    container = document.getElementById('container');
		counter = document.getElementById('counter');
		eventHandlers();
	    // Set the scene...
	    scene = new THREE.Scene();

		// Camera
		//camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 9000 );
		camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.1, 9000 );
		controls = new THREE.PointerLockControls( camera, 0, 1.5, true, objects );
		//camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
		scene.add( controls.getPlayer() );
		

		var onKeyDown = function(event) {
			switch ( event.keyCode ) {

						case 38: // up
						case 87: // w
							moveForward = true;
							break;

						case 37: // left
						case 65: // a
							moveLeft = true; break;

						case 40: // down
						case 83: // s
							moveBackward = true;
							break;

						case 39: // right
						case 68: // d
							moveRight = true;
							break;

						case 32: // space
							if ( canJump === true ) velocity.y += 350;
							canJump = false;
							break;

					}
		};

		var onKeyUp = function ( event ) {

					switch( event.keyCode ) {

						case 38: // up
						case 87: // w
							moveForward = false;
							break;

						case 37: // left
						case 65: // a
							moveLeft = false;
							break;

						case 40: // down
						case 83: // s
							moveBackward = false;
							break;

						case 39: // right
						case 68: // d
							moveRight = false;
							break;

					}

				};

		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );

		raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

		scene.fog = new THREE.Fog( 0xcccccc, camera.position.z, 350 );

	    // LOADING SCREEN
	    loadingScreen.box.position.set(0,0,5);
	    loadingScreen.camera.lookAt(loadingScreen.box.position);
	    loadingScreen.scene.add(loadingScreen.box);

	    loadingManager = new THREE.LoadingManager();

	    loadingManager.onProgress = function(item, loaded, total){
		    console.log(item, loaded, total);
	    };
			
	    loadingManager.onLoad = function(){
		    console.log("loaded all resources");
		    RESOURCES_LOADED = true;
	    };

	    // Responsive to viewport
	    window.addEventListener( 'resize', onWindowResize, false );
			
	    // Lighting
	    var ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.3);
	    scene.add(ambientLight);

	    var pointLight = new THREE.PointLight( 0xFFFFFF, 0.5, 18 );
	    pointLight.position.set( 2, 6, -3);
	    pointLight.castShadow = true;
	    pointLight.shadow.camera.near = 0.1;
	    pointLight.shadow.camera.far = 25;
	    //scene.add(pointLight);

	    // Skybox
	    var skyCube = new THREE.CubeTextureLoader( loadingManager )
		    .setPath( "./img/skybox/" )
		    .load( [ 'sky1.png', 'sky2.png', 'sky3.png', 'sky4.png', 'sky5.png', 'sky6.png' ] );
	    scene.background = skyCube;

	    // TEXTURE LOADER
	    var textureLoader = new THREE.TextureLoader( loadingManager );

	    // Floor
		floorTexture = textureLoader.load("img/grass/grass.jpg");
	    floorNormalMap = textureLoader.load("img/grass/grass_n.jpg");
	    floorBumpMap = textureLoader.load("img/grass/grass_h.jpg");

		floorTile = 512;

		floorTexture.wrapS = THREE.RepeatWrapping;
		floorTexture.wrapT = THREE.RepeatWrapping;
		floorTexture.repeat.set( floorTile, floorTile );

		floorNormalMap.wrapS = THREE.RepeatWrapping;
		floorNormalMap.wrapT = THREE.RepeatWrapping;
		floorNormalMap.repeat.set( floorTile, floorTile );

		floorBumpMap.wrapS = THREE.RepeatWrapping;
		floorBumpMap.wrapT = THREE.RepeatWrapping;
		floorBumpMap.repeat.set( floorTile, floorTile );

		var floorHeight = 1000;
		//floorGeometry = new THREE.SphereGeometry(floorHeight, 10, 6, 0, (Math.PI * 2), 0, 0.2);
		//floorGeometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -floorHeight, 0) );
		floorGeometry = new THREE.PlaneGeometry(floorHeight, floorHeight, 10, 6,);

		var floorMaterial = new THREE.MeshPhongMaterial( 
			    { 
				    //color: 0x1f7e4e,
				    map: floorTexture,
				    bumpMap: floorBumpMap,
				    normalMap: floorNormalMap
			    } 
		    )

		floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
		floorMesh.rotation.x -= Math.PI / 2;
		objects.push( floorMesh );
		scene.add( floorMesh  );
		

	    var particles = new THREE.Geometry();
	    var pMaterial = new THREE.PointsMaterial({
		    color: 0xffffff,
		    size: .2,
		    transparent:true,
		    opacity:.25,
		    // map : particle_texture
	    });

	    for( var i=0; i<750; i++ ){
		    var x = (Math.random() - 0.5 ) * Math.sin(i)*200;
		    var y = (Math.random() - 0.5 ) * Math.cos(i)*200;
		    var z = (Math.random() - 0.5 ) * Math.sin(i)*200;

		    particles.vertices.push(new THREE.Vector3(x,y,z));
	    }
	    var particleSystem_1 = new THREE.Points(particles,pMaterial);
	    scene.add(particleSystem_1);
			

	    // Crate object
	    // Resource: https://opengameart.org/content/3-crate-textures-w-bump-normal
	    crateTexture = textureLoader.load("./img/crate_diffuse.png");
	    crateNormalMap = textureLoader.load("./img/crate_normal.png");
	    crateBumpMap = textureLoader.load("./img/crate_bump.png");
			

	    crate = new THREE.Mesh(
		    new THREE.BoxGeometry( 1.5, 1.5, 1.5),
		    new THREE.MeshPhongMaterial( 
			    { 
				    color: 0xFFFFFF,
				    map: crateTexture,
				    bumpMap: crateBumpMap,
				    normalMap: crateNormalMap
			    } )
	    );
	    crate.receiveShadow = true;
	    crate.castShadow = true;
	    crate.position.set(20,1,0);
		//objects.push( crate );
	    //scene.add(crate);
		
		
		// Boxes
		var boxGeometry = new THREE.BoxGeometry( 20, 20, 20 );
		var boxTexture1 = new THREE.ImageUtils.loadTexture("./img/crate_diffuse.png");
		var boxMaterial = new THREE.MeshBasicMaterial( {map: boxTexture1, reflectivity: 0.8} );
		var boxZ;
		for ( var i = 0; i < 850; i ++ ) {

			var boxmesh = new THREE.Mesh( boxGeometry, boxMaterial);

			boxZ = 50;
			boxmesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
			boxmesh.position.y = Math.floor( Math.random() * 20 ) * boxZ + 10;
			boxmesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

			boxes.push( boxmesh );
			objects.push( boxmesh );
			scene.add( boxmesh );
		}
		

	    // MTL Model
	    // Resource: https://www.turbosquid.com/FullPreview/Index.cfm/ID/1008420
	    var mtlLoader = new THREE.MTLLoader(loadingManager);
	    var objLoader = new THREE.OBJLoader(loadingManager);

		// Boxes
		var boxGeometry = new THREE.CylinderGeometry( 1.5, 1.5, 15, 20 );
		var boxMaterial = new THREE.MeshPhongMaterial( {color: 0xfffff} );
		var boxZ;
		
		for( var i=0; i<200; i++ ){
		
			var randNumX = 0;
			var randNumX = Math.floor(Math.random() * 65 - 30) * 5;

			var randNumZ = 0;
			var randNumZ = Math.floor(Math.random() * 65 - 30) * 5;

			var boxmesh = new THREE.Mesh( boxGeometry, boxMaterial );
			
			boxZ = 10;
			boxmesh.position.x = randNumX;
			boxmesh.position.y = 0.5;
			boxmesh.position.z = randNumZ;

			//boxes.push( boxmesh );
			objects.push( boxmesh );
			scene.add( boxmesh );
		
		}

		    mtlLoader.load("models/tree.mtl", function(materials){
			    materials.preload();
			    objLoader.setMaterials(materials);

				for( var i=0; i<200; i++ ){
				
			    objLoader.load("models/tree.obj", function(mesh){
					
						
					    mesh.traverse(function(node){
					    if( node instanceof THREE.Mesh ){
						    node.castShadow = true;
						    node.receiveShadow = true;
					    }
				    });

					var randNumX = 0;
					var randNumX = Math.floor(Math.random() * 65 - 30) * 5;

					var randNumZ = 0;
					var randNumZ = Math.floor(Math.random() * 65 - 30) * 5;

					var boxmesh = new THREE.Mesh( boxGeometry, boxMaterial );

					boxZ = 10;
					boxmesh.position.x = randNumX;
					boxmesh.position.y = 0.5;
					boxmesh.position.z = randNumZ;

					//boxes.push( boxmesh );
					//objects.push( boxmesh );
					//scene.add( boxmesh );

                    mesh.position.x =  randNumX;
                    mesh.position.y = 0.5;
                    mesh.position.z = randNumZ;

                    mesh.scale.x = Math.random() + 0.5;
                    mesh.scale.y = Math.random() + 0.5;
                    mesh.scale.z = Math.random() + 1.5;

                    mesh.rotation.y = Math.random() + 0.5;

					//boxes.push( mesh );
					//scene.add( mesh );

					});
				
			    }

		    });

	    // ORBS
	    for( var i=0; i<15; i++ )
	    {
			var sphereColors = [0xff4a6b, 0x3b2f93, 0x39f0de, 0xf9d400];
			var randColor =  sphereColors[Math.floor(Math.random() * sphereColors.length)];

			var sphereGeometry = new THREE.SphereGeometry( 2, 16, 8 );
	    	var sphereMaterial = new THREE.MeshBasicMaterial( { color: randColor } );
	    	var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
			var randNumX = 0;
			var randNumX = Math.floor(Math.random() * 55 - 30) * 5;

			var randNumZ = 0;
			var randNumZ = Math.floor(Math.random() * 55 - 30) * 5;

			sphere.position.set(randNumX, 1.5, randNumZ);

			
			light = new THREE.PointLight( randColor, 2, 50 );
			light.add( new THREE.Mesh( sphereGeometry, sphereMaterial));

			var time = Date.now() * 0.0005;
			light.position.x = randNumX;
			light.position.y = 1.5;
			light.position.z = randNumZ;
			
			spheres.push(sphere);
			objects.push(sphere);
			scene.add(sphere);
			scene.add(light);
			
	    }

	    // Renderer
	    renderer = new THREE.WebGLRenderer();
	    renderer.setPixelRatio( window.devicePixelRatio );
	    renderer.setSize( window.innerWidth, window.innerHeight );
	    renderer.shadowMap.enabled = true;
	    renderer.shadowMap.type = THREE.BasicShadowMap;
	    document.body.appendChild( renderer.domElement );

	    // STATS
	    stats = new Stats();
	    container.appendChild( stats.dom );

		// COUNTER
		counterVal = 0;
		counter.append(counterVal);

		addWand()

    }; // end of init()

	function addWand() {
		// Wand
		// Resource: https://www.arroway-textures.ch/en/textures/wood-105
		var wLoader = new THREE.ObjectLoader(loadingManager);
		wMaterial = new THREE.MeshPhongMaterial();

		var textureLoader = new THREE.TextureLoader(loadingManager);

		wandTexture = textureLoader.load("./img/wood-texture.jpg");
	    wandNormalMap = textureLoader.load("./img/wood-texture-normal.jpg");
	    wandBumpMap = textureLoader.load("./img/wood-texture-bump.jpg");

		wand = wLoader.load
        (
            'cherry-wand.json',
            function( wand )
            {
				wand.traverse(function(child) {
					if(child instanceof THREE.Mesh) {
						child.material = wMaterial;
					}
				})

                wand.position.set( 0, 1, 2);
				wand.scale.set( .2, .2, .2 );

                scene.add( wand );

            }
        );
	}

	function onWindowResize() {
		var width = window.innerWidth;
		var height = window.innerHeight;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
	}

    function animate() {

        if (RESOURCES_LOADED == false) {
            requestAnimationFrame(animate);

            loadingScreen.box.position.x -= 0.05;
            if (loadingScreen.box.position.x < -10) loadingScreen.box.position.x = 10;
            loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x);

            renderer.render(loadingScreen.scene, loadingScreen.camera);
            return;
        }

		requestAnimationFrame( animate );

			if ( controlsEnabled ) {
				controls.updateControls();
			}

        update();
        renderer.render(scene, camera);
    }

	function eventHandlers() {

		var onKeyDown = function ( event ) { event.preventDefault(); event.stopPropagation(); handleKeyInteraction(event.keyCode, true); };
		var onKeyUp = function ( event ) { event.preventDefault(); event.stopPropagation(); handleKeyInteraction(event.keyCode, false); };
		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );

		window.addEventListener( 'resize', onWindowResize, false );
	}

	// HANDLE KEY INTERACTION
	function handleKeyInteraction(keyCode, boolean) {
		var isKeyDown = boolean;

		switch(keyCode) {
			case 38: // up
			case 87: // w
				controls.movements.forward = boolean;
				break;

			case 40: // down
			case 83: // s
				controls.movements.backward = boolean;
				break;

			case 37: // left
			case 65: // a
				controls.movements.left = boolean;
				break;

			case 39: // right
			case 68: // d
				controls.movements.right = boolean;
				break;

			case 32: // space
				if (!isKeyDown) {
					controls.jump();
				}
				break;

            case 16: // shift
                controls.walk(boolean);
                break;

            case 67: // crouch (CTRL + W etc destroys tab in Chrome!)
                controls.crouch(boolean);

		}
	}

    function update() {
	    /*var time = Date.now() * 0.0005;
	    light1.position.x = Math.sin( time * 0.7 ) * 30;
	    light1.position.y = Math.cos( time * 0.5 ) * 40;
	    light1.position.z = Math.cos( time * 0.3 ) * 30;

	    light2.position.x = Math.cos( time * 0.3 ) * 30;
	    light2.position.y = Math.sin( time * 0.5 ) * 40;
	    light2.position.z = Math.sin( time * 0.7 ) * 30;

	    light3.position.x = Math.sin( time * 0.7 ) * 30;
	    light3.position.y = Math.cos( time * 0.3 ) * 40;
	    light3.position.z = Math.sin( time * 0.5 ) * 30;
		

		wand.position.set(
                	camera.position.x - Math.sin(camera.rotation.y),
                	camera.position.y - 0.5 + Math.sin(time*4 + camera.position.x + camera.position.z) * 0.01,
                	camera.position.z + Math.cos(camera.rotation.y)
				);

				wand.rotation.set(
					camera.rotation.x,
					camera.rotation.y - Math.PI/2.1,
					camera.rotation.z
				);
*/

	    stats.update();

    };
