const { createMachine, actions, interpret } = XState; // global variable: window.XState

let camera, scene, renderer, controls;
let dirLight, spotLight;
let shadowGroup, renderTarget, renderTargetBlur, shadowCamera, cameraHelper, depthMaterial, horizontalBlurMaterial, verticalBlurMaterial;

let highlightDivs = [];
let highlightObjs = [];
let meObj, carObj, robotObj;
let highlightMe, highLightCar, hightLightRobot;

let homePageObjs = {};
let autoPageObjs = [];
let robotPageObjs = [];
let aboutMePageObjs = [];
let pageObjectData = {};

let homePageMarkers = [];
let autoPageMarkers = [];
let robotPageMarkers = [];

const HOME_CAMERA_POS = {
  position: {
    x: -7,
    y: 8,
    z: 7
  },
  lookAt: {
    x: 0,
    y: 0,
    z: 0 
  }
}

const AUTO_CAMERA_POS = {
  position: {
    x: 15,
    y: 7,
    z: 0
  },
  lookAt: {
    x: 0,
    y: 2,
    z: 0 
  }
}

const ROBOT_CAMERA_POS = {
  position: {
    x: -0.31,
    y: 3.89,
    z: 4.80
  },
  lookAt: {
    x: -2.19,
    y: 0.39,
    z: 0.039
  }
}

const ME_CAMERA_POS = {
  position: {
    x: -2.6,
    y: 1.5,
    z: -0.9
  },
  lookAt: {
    x: -2.3,
    y: 1.5,
    z: 1.8 
  }
}

const THREEJS_CONTAINER = document.getElementById('threejs-container');
const OVERLAY_CONTAINER = document.getElementById('highlight-overlay');
const LOGO = document.getElementById('logo');
const AUTOMOTIVE_GRID = document.getElementById('automotive-grid');
const SELF_INTRODUCTION_CONTAINER = document.getElementById('selfintro-container');

/*************** set state machine *****************/
const promiseMachine = createMachine(
  {
    id: 'myWeb',
    initial: 'loading',
    context: 
    { 
      HOME_CAM_TRANSFORM: { position: HOME_CAMERA_POS.position, lookAt: HOME_CAMERA_POS.lookAt },
      AUTO_CAM_TRANSFORM: undefined, 
      AUTO_CAM_TRANSFORM: undefined 
    },
    states: {
      loading: {
        entry: [ 'initialize' ],
        on: {
          TO_HOME_PAGE: { target: 'homePage' }
        }
      },
      homePage: {
        entry: [ 'transCamHome', 'showGreeting' ],
        exit: [ 'hideGreeting' ],
        on: {
          TO_AUTO_PAGE: { target: 'autoPage' },
          TO_ROBOT_PAGE: { target: 'robotPage' },
          TO_ABOUT_ME_PAGE: { target: 'aboutMePage' }
        }
      },
      autoPage: {
        entry: [ 'transCamAuto', 'showAutoGrid' ],
        exit: [ 'hideAutoGrid' ],
        on: {
          TO_HOME_PAGE: { target: 'homePage' }
        }
      },
      robotPage: {
        entry: [ 'transCamRobot' ],

        on: {
          TO_HOME_PAGE: { target: 'homePage' }
        }
      },
      aboutMePage: {
        entry: [ 'transCamMe' ],
        // exit: [ ' ' ],
        on: {
          TO_HOME_PAGE: { target: 'homePage' }
        }
      }
    }
  },
  {
    actions:{
      initialize: () => {
        init();
        animate();
      },

      transCamHome: () => {
        // console.log('transCamHome');
        moveCamera( HOME_CAMERA_POS.position, HOME_CAMERA_POS.lookAt );
      },
      hideGreeting: () => {
        // console.log('hideGreeting');
        SELF_INTRODUCTION_CONTAINER.style.visibility = 'hidden';
        SELF_INTRODUCTION_CONTAINER.style.opacity = 0;
      },
      showGreeting: () => {
        // console.log('showGreeting');
        SELF_INTRODUCTION_CONTAINER.style.visibility = 'visible';
        SELF_INTRODUCTION_CONTAINER.style.opacity = 1;
      },

      transCamAuto: () => {
        // console.log('transCamAuto');
        moveCamera( AUTO_CAMERA_POS.position, AUTO_CAMERA_POS.lookAt );
      },
      hideAutoGrid: () => {
        // console.log('hideAutoGrid');
        AUTOMOTIVE_GRID.style.visibility = 'hidden';
        AUTOMOTIVE_GRID.style.opacity = 0;
      },
      showAutoGrid: () => {
        // console.log('showAutoGrid');
        AUTOMOTIVE_GRID.style.visibility = 'visible';
        AUTOMOTIVE_GRID.style.opacity = 1;
      },

      transCamRobot: () => {
        moveCamera( ROBOT_CAMERA_POS.position, ROBOT_CAMERA_POS.lookAt );
      },

      transCamMe: () => {
        moveCamera( ME_CAMERA_POS.position, ME_CAMERA_POS.lookAt );
      }


    }
  }
);

const promiseService = interpret(promiseMachine).onTransition((state) =>
  console.log(state.value)
);
promiseService.start();

function init() {
  initScene();
  window.addEventListener( 'resize', onWindowResize );
  LOGO.addEventListener( 'click', () => {
    promiseService.send({type: "TO_HOME_PAGE"});
  } );
  
  promiseService.send({type: "TO_HOME_PAGE"});
}

function initScene(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color( "rgb(255, 255, 255)" );
  // scene.fog = new THREE.Fog( "rgb(255, 255, 255)", 10, 50 );

  camera = new THREE.PerspectiveCamera( 25, THREEJS_CONTAINER.clientWidth / THREEJS_CONTAINER.clientHeight, 0.001, 1000 );
  // camera = new THREE.OrthographicCamera( THREEJS_CONTAINER.clientWidth / - 2, THREEJS_CONTAINER.clientWidth / 2, THREEJS_CONTAINER.clientHeight / 2, THREEJS_CONTAINER.clientHeight / - 2, 1, 1000 );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( THREEJS_CONTAINER.clientWidth, THREEJS_CONTAINER.clientHeight );
  
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

  THREEJS_CONTAINER.appendChild( renderer.domElement );
  
  /**
   * LIGHTS
  **/
  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.3 );
  hemiLight.color.setHSL( 0.6, 1, 0.6 );
  hemiLight.position.set( 300, 500, 200 );
  scene.add( hemiLight );

  // const hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
  // scene.add( hemiLightHelper );

  // const light = new THREE.AmbientLight( "rgb(255, 255, 255)", 0.1 ); // soft white light
  // scene.add( light );

  // direction light
  dirLight = new THREE.DirectionalLight( "rgb(255, 255, 255)", 0.8 );
  // dirLight.color.setHSL( 0.1, 1, 0.95 );
  dirLight.position.set( - 1, 1.75, 1 );
  dirLight.position.multiplyScalar( 10 );

  const d = 8;

  dirLight.shadow.camera.left = - d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = - d;

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;

  dirLight.shadow.camera.far = 45;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.fov = 45;

  dirLight.shadow.bias = - 0.0001;
  dirLight.castShadow = true;
  scene.add( dirLight );

  // const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 6 );
  // scene.add( dirLightHelper );
  
  const dirLight2 = new THREE.DirectionalLight( "rgb(255, 255, 255)", 0.6 );
  dirLight2.position.set( 1, 1.75, 0 );
  // dirLight2.position.multiplyScalar( 5 );
  dirLight2.castShadow = false;
  scene.add( dirLight2 );

  // model loader 
  const loader = new THREE.GLTFLoader();
  loader.load( './models/robot_car_me/robot_car_me.gltf', function ( gltf ) {
    const root = gltf.scene;
    root.castShadow = true;
    gltf.scene.receiveShadow = true;

    root.traverse( function( node ) {

      if ( node.name === "me_meta" ){
        let marker = makeMarker(node);
        homePageMarkers.push(marker);
      } else if ( node.name === "honda_e" ){
        let marker = makeMarker(node);
        homePageMarkers.push(marker);
      } else if ( node.name === "robot" ){
        let marker = makeMarker(node);
        homePageMarkers.push(marker);
      }
      
      if ( node.isMesh ) {
        if ( node.type === "SkinnedMesh" ) {
          node.frustumCulled = false;
        }
        node.receiveShadow = true;
        node.castShadow = true;
      }

    });
    scene.add( root );

    homePageMarkers.forEach( marker => {
      OVERLAY_CONTAINER.appendChild(marker);
    });
    
    setMarkersPositions(homePageMarkers);

    console.log(gltf);

  }, function(xhr){
    // console.log(xhr.loaded/xhr.total * 100) + "% loaded";
  }, function ( error ) {
    console.error( error );
  } );
  

  const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: "rgb(255, 240, 210)", depthWrite: false } ) );
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add( mesh );

  // Axes Helper
  // const axesHelper = new THREE.AxesHelper( 5 );
  // scene.add( axesHelper );
  
  // set camera positions
  camera.position.set( HOME_CAMERA_POS.position.x, HOME_CAMERA_POS.position.y, HOME_CAMERA_POS.position.z ); // Set position like this

  // orbit control
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render );
  // controls.minPolarAngle = Math.PI * 0.25;
  // controls.maxPolarAngle = Math.PI * 0.25;
  controls.target.set( HOME_CAMERA_POS.lookAt.x, HOME_CAMERA_POS.lookAt.y, HOME_CAMERA_POS.lookAt.z );
  controls.enableDamping = true;

}

function render() {
  renderer.render( scene, camera );
  setMarkersPositions(homePageMarkers);

  console.log("camera position", camera.position);
  console.log("camera target", controls.target);
}

function animate() {
  requestAnimationFrame( animate );
  controls.update(); // required if damping enabled
  renderer.render( scene, camera );

  TWEEN.update();

}

function onWindowResize() {
  camera.aspect = THREEJS_CONTAINER.clientWidth / THREEJS_CONTAINER.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( THREEJS_CONTAINER.clientWidth, THREEJS_CONTAINER.clientHeight );

  let pos = toScreenPosition(meObj, camera);
  setDivPosition(highlightMe, pos);

}

function toScreenPosition(obj, camera)
{
    var vector = new THREE.Vector3();

    var widthHalf = 0.5*renderer.getContext().canvas.width;
    var heightHalf = 0.5*renderer.getContext().canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return { 
        x: vector.x,
        y: vector.y
    };
};

function setDivPosition(div, pos){
  div.style.left = pos.x + 'px';
  div.style.top = pos.y + 'px';
}

function moveCamera(cameraTargetPosition, cameraTargetLookAt){

  TWEEN.removeAll();
  new TWEEN.Tween( camera.position )
						.to( cameraTargetPosition, 1000 )
						.easing( TWEEN.Easing.Exponential.InOut )
						.start();

  new TWEEN.Tween( controls.target )
						.to( cameraTargetLookAt, 1000 )
						.easing( TWEEN.Easing.Exponential.InOut )
						.start();

}

function onHightClicked(){
  promiseService.send({type: "TO_AUTO_PAGE"});
}

function makeMarker( node ) {
  let markerDiv = document.createElement('div');
  markerDiv.classList.add('highlight-rect');
  markerDiv.id = node.name;
  markerDiv.addEventListener( 'click', onMarkerClicked );

  return markerDiv;
}

function setMarkersPositions( markers ) {
  markers.forEach( marker => {
    let object = scene.getObjectByName( marker.id );
    let position = toScreenPosition( object, camera );
    marker.style.left = position.x + 'px';
    marker.style.top = position.y + 'px';
  });
}

function onMarkerClicked(){
  console.log("marker id: ", this.id);
  if (this.id === "honda_e") {
    promiseService.send({type: "TO_AUTO_PAGE"});
  }

  if (this.id === "me_meta") {
    promiseService.send({type: "TO_ABOUT_ME_PAGE"});
  }

  if (this.id === "robot") {
    promiseService.send({type: "TO_ROBOT_PAGE"});
  }
}