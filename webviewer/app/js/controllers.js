/* Controllers */

angular.module('myApp.controllers', []).
  controller('MyCtrl1', ['$scope', 'googleapikey', function ($scope, googleapikey) {
      $scope.dataSources = [
          {
              name: "Wellington",
              file: "weli.csv",
              long: 174.5,
              lat: -41.5,
              year: 2013,
              month: 7
          },
          {
              name: "Christchurch",
              file: "chch.csv",
              long: 172.62,
              lat: -43.53,
              year: 2011,
              month: 2

          }
      ];
      $scope.dataSource = $scope.dataSources[1];

      var width = window.innerWidth,
          height = window.innerHeight;
      var windowHalfX = width / 2;
      var windowHalfY = height / 2;
      var data = [];
      var spheres = [], group;
      var camera, scene, renderer;
      var geometry, material, mesh;

      var targetRotationY = -2 * Math.PI / 3;
      // var targetRotationX = - 2*Math.PI/3;
      var targetRotationOnMouseDown = 0;

      var mouseX = 0, mouseY = 0;
      var mouseXOnMouseDown = 0, mouseYOnMouseDown;

      $scope.go = function(){

          init();
          animate();

      };


      function init() {

         var year = $scope.dataSource.year,
            month = $scope.dataSource.month;
         var clong = $scope.dataSource.long,
            clat = $scope.dataSource.lat;
         var zoom = 10;
         var tile_url = 'http://maps.googleapis.com/maps/api/staticmap?center=' + clat + "," + clong + '&zoom=' + zoom + '&size=640x640&maptype=terrain' +
                          '&sensor=false&visual_refresh=true&format=png32';

          // z = longitude (east/west)
          // x = latitude (north/south)
          // Now Google maps maths...
          var eath_circumference_at_equator = 40075017; // m
          var pixels_at_circumference_at_zoom_24 = Math.pow(2, 32);
          var meters_per_pixel_at_equator_at_zoom_24 = eath_circumference_at_equator / pixels_at_circumference_at_zoom_24;

          var meters_per_pixel_at_equator_at_correct_zoom = Math.pow(2, 24 - zoom) * meters_per_pixel_at_equator_at_zoom_24;

          var unit_at_latitude = Math.cos(clat * Math.PI / 180) * meters_per_pixel_at_equator_at_correct_zoom;
          console.log("Unit at lat: " + unit_at_latitude + " meters per pixel");

          //var radius_of_earth_equator = 6378137; // m
          //var flatening_of_earth = 1/298.257223563;

          //var radius_at_pole = radius_of_earth_equator * (1 - flatening_of_earth);
          //var eccentricity_of_earth = Math.sqrt(Math.pow(radius_of_earth_equator, 2) - Math.pow(radius_at_pole, 2))/radius_of_earth_equator;

          //var circumference_of_earth_around_poles = 2 * Math.PI * radius_at_pole;
          //console.log(circumference_of_earth_around_poles);

          // Uses magic number of 111 km / degree in latitude
          var offset = 640 * unit_at_latitude / 111000 / 2;
          console.log("Degrees: " + offset);
          var z = d3.scale.linear().domain([clong - offset, clong + offset]).range([-250, 250]);
          var x = d3.scale.linear().domain([clat - offset, clat + offset]).range([-250, 250]);
          var y = d3.scale.linear().domain([0, 50]).range([250, -250]);
          var r = d3.scale.linear().domain([0, 10]).range([1 , 25]);



          // THREE.js stuff---->

          // http://threejs.org/docs/#Reference/Cameras/PerspectiveCamera
          // field of view, aspectRatio, near, far
          camera = new THREE.PerspectiveCamera(80, width / height, 1, 1000);

          // the camera starts at 0,0,0
          // so pull it back
          camera.position.z = 550;
          camera.position.y = 120;

          scene = new THREE.Scene();
          group = new THREE.Object3D();

          // create a set of coordinate axes to help orient user
          //    specify length in pixels in each direction
          //var axes = new THREE.AxisHelper(100);
          //group.add( axes );


          // Add a plane every 10km
          // eventually the bottom one could be lava... http://threejs.org/examples/#webgl_shader_lava
          var plane;
          var geometry = new THREE.PlaneGeometry(500, 500);
          // Without this rotation the plane is up and down
          geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

          var material = new THREE.MeshBasicMaterial({
                  map:      THREE.ImageUtils.loadTexture(tile_url),
                  side:     THREE.DoubleSide,
                  transparent: true,
                  opacity: 0.5
              });
          // add the map "surface"
          for (var i = 0; i <= 4; i++) {
              plane = new THREE.Mesh(geometry, material);
              plane.position.y = y(10 * i);
              group.add(plane);
          }


          // set up the shared sphere vars
          var segments = 18,
            rings = 18;

          // create the sphere's material
          var sphereMaterial = new THREE.MeshLambertMaterial({
              color:       0,
//              transparent: true,
//              opacity: 0.8
          });


         // stupid cross origin thing...
          var dataURL = "http://wfs-beta.geonet.org.nz/geoserver/geonet/ows?service=WFS&version=1.0.0&request=GetFeature" +
            "&typeName=geonet:quake&outputFormat=csv&cql_filter=BBOX%28origin_geom," + (clong - offset).toFixed(2) +
            "," + (clat - offset).toFixed(2) + "," + (clong + offset).toFixed(2) + "," + (clat + offset).toFixed(2) + "%29+AND+" +
            "origintime%3E=%27" + year + "-" + month + "-1" +"%27" +
            "+AND+magnitude%3E3";



          d3.csv($scope.dataSource.file, function(csvdata){
              // Only show the biggest N -  because christchurch has lots...
            csvdata = csvdata.sort(function(a,b){return b.magnitude - a.magnitude;});
            for (var i = 0; i < Math.min(400, csvdata.length); i++) {
              var quake = csvdata[i];

              // create a new mesh with
              // sphere geometry
              var sphere = new THREE.Mesh(
                new THREE.SphereGeometry(r(quake.magnitude), segments, rings),
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
          });

          scene.add(group);

          renderer = new THREE.WebGLRenderer();
          renderer.setSize(window.innerWidth, window.innerHeight);

          document.getElementById("mycanvas").appendChild(renderer.domElement);
          document.addEventListener('mousedown', onDocumentMouseDown, false);
      }

      function onDocumentMouseDown(event) {
          event.preventDefault();

          document.addEventListener('mousemove', onDocumentMouseMove, false);
          document.addEventListener('mouseup', onDocumentMouseUp, false);
          document.addEventListener('mouseout', onDocumentMouseUp, false);

          mouseXOnMouseDown = event.clientX - windowHalfX;
          targetRotationOnMouseDown = targetRotationY;
      }

      function onDocumentMouseMove(event) {
          mouseX = event.clientX - windowHalfX;
          mouseY = event.clientY - windowHalfY;
          targetRotationY = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
      }

      function onDocumentMouseUp(event) {
          document.removeEventListener('mousemove', onDocumentMouseMove, false);
          document.removeEventListener('mouseup', onDocumentMouseUp, false);
          document.removeEventListener('mouseout', onDocumentMouseUp, false);
      }


      function animate() {
          // This will run at approximately 60fps

          // note: three.js includes requestAnimationFrame shim
          requestAnimationFrame(animate);

          //mesh.rotation.x += 0.005;
          group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;

          renderer.render(scene, camera);
      }

  }
  ])
  .controller('MyCtrl2', [function () {

  }]);