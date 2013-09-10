'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
   controller('MyCtrl1', ['googleapikey', function(googleapikey) {
   // 174,-41,175,-42
   var clong = 174.5,
     clat  = -41.5;
    /*
     * I want to just be given two lat/long coordinates and then get the data.
     * That way I'll know the bounds.
     * */
   // TODO get the data async from geonet
   var data = [
       {id:"2013p546751", date: "2013-07-22T07:09:17.365", longitude: 174.4098, latitude: -41.5155, depth: 14.9609, magnitude: 2.547},
       {id:"2013p546749", date: "2013-07-22T07:08:06.2", longitude: 174.3279, latidute:-41.6007, depth: 5.1172, magnitude:2.0551}
   ];

   /* Note we can easily add markers on the static map too... */
   var tile_url = 'http://maps.googleapis.com/maps/api/staticmap?center='+ clat +"," + clong +'&zoom=10&size=640x640&maptype=terrain' +
                   '&sensor=false&visual_refresh=true&format=png32';

   var z = d3.scale.linear().domain([-180, 180]).range([-250, 250]);
   var x = d3.scale.linear().domain([-90, 90]).range([-250, 250]);
   var y = d3.scale.linear().domain([0, 30]).range([250, -250]);


    var camera, scene, renderer;
    var geometry, material, mesh;

    var spheres = [], group;

    var targetRotationY = - 2*Math.PI/3;
   // var targetRotationX = - 2*Math.PI/3;
    var targetRotationOnMouseDown = 0;

    var mouseX = 0, mouseY = 0;
    var mouseXOnMouseDown = 0, mouseYOnMouseDown;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    init();
    animate();

    function init() {
        // http://threejs.org/docs/#Reference/Cameras/PerspectiveCamera
        // field of view, aspectRatio, near, far
        camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 10000 );

        // the camera starts at 0,0,0
        // so pull it back
        camera.position.z = 800;

        scene = new THREE.Scene();
        group = new THREE.Object3D();

        // create a set of coordinate axes to help orient user
        //    specify length in pixels in each direction
        //var axes = new THREE.AxisHelper(100);
        //group.add( axes );


        // Add a plane every 10km
        // eventually the bottom one could be lava... http://threejs.org/examples/#webgl_shader_lava
        var plane;
        var geometry = new THREE.PlaneGeometry( 500, 500 );
        // Without this rotation the plane is up and down
        geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
        var material = new THREE.MeshBasicMaterial( { color: 0xff3333,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6 });

        for(var i = 1; i <= 3; i++){
            plane = new THREE.Mesh( geometry, material );
            plane.position.y = y(10 * i);
            group.add( plane );
        }


        // add a transparent cube with the map on the top
        var backgroundColor = 0x802A2A;

        var invisibleMaterial = new THREE.MeshBasicMaterial( {
                color: backgroundColor,
                transparent: true,side: THREE.DoubleSide, wireframe: true,
                opacity: 0.1
            });
        var materials = [
            invisibleMaterial,
            invisibleMaterial,

            new THREE.MeshBasicMaterial( {
                map: THREE.ImageUtils.loadTexture( tile_url ),
                side: THREE.DoubleSide,
                overdraw: 0.5
            }),
            invisibleMaterial,
            invisibleMaterial,
            invisibleMaterial,
            invisibleMaterial,
        ];



        mesh = new THREE.Mesh( new THREE.CubeGeometry( 500, 500, 500),
                               new THREE.MeshFaceMaterial(materials) );

        // sets the center...
        mesh.position.set(0, 0, 0);
        //mesh.matrixAutoUpdate = false;
        //mesh.updateMatrix();
        group.add( mesh );
        // set up the shared sphere vars
        var radius = 10,
            segments = 16,
            rings = 16;

        // create the sphere's material
        var sphereMaterial =
          new THREE.MeshLambertMaterial({ color: 0xeeeeee });

        for (var i = 0; i < data.length; i++) {
            var quake = data[i];
            //console.log("Quake: " + quake);
            // create a new mesh with
            // sphere geometry
            var sphere = new THREE.Mesh(
              new THREE.SphereGeometry(radius, segments, rings),
              sphereMaterial);

            sphere.position.x = x(quake.latitude);
            sphere.position.y = y(quake.depth);
            sphere.position.z = z(quake.longitude);

            sphere.matrixAutoUpdate = false;
            sphere.updateMatrix();

            // add the sphere to the scene
            spheres.push(sphere);
            group.add(sphere);
        }

        scene.add( group );

        // create a point light
        var pointLight =
          new THREE.PointLight(0xFFFFFF);

        // set its position
        pointLight.position.x = 10;
        pointLight.position.y = 50;
        pointLight.position.z = 130;

        // add to the scene
        scene.add(pointLight);


        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.getElementById("mycanvas").appendChild( renderer.domElement );
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    }

   function onDocumentMouseDown( event ) {
       event.preventDefault();

       document.addEventListener( 'mousemove', onDocumentMouseMove, false );
       document.addEventListener( 'mouseup', onDocumentMouseUp, false );
       document.addEventListener( 'mouseout', onDocumentMouseUp, false );

       mouseXOnMouseDown = event.clientX - windowHalfX;
       targetRotationOnMouseDown = targetRotationY;
    }

    function onDocumentMouseMove( event ) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
        targetRotationY = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
    }

    function onDocumentMouseUp( event ) {
        document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
        document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
        document.removeEventListener( 'mouseout', onDocumentMouseUp, false );
    }


    function animate() {
        // This will run at approximately 60fps

        // note: three.js includes requestAnimationFrame shim
        requestAnimationFrame( animate );

        //mesh.rotation.x += 0.005;
        group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;

        renderer.render( scene, camera );
    }

  }])
  .controller('MyCtrl2', [function() {

  }]);