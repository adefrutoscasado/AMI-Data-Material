(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _controls = require('../../src/controls/controls.trackball');

var _controls2 = _interopRequireDefault(_controls);

var _helpers = require('../../src/helpers/helpers.stack');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

//import LoadersVolume from '../../src/loaders/loaders.volume';
/* globals Stats, dat*/

var LoadersVolume = AMI.default.Loaders.Volume;

// standard global letiables
var controls = void 0,
    renderer = void 0,
    stats = void 0,
    scene = void 0,
    camera = void 0,
    stackHelper = void 0,
    threeD = void 0,
    ready = void 0;

var mesh = null;
//Load STL model
var loaderSTL = new THREE.STLLoader();
loaderSTL.load('WM.stl', function (geometry) {
  var material = new THREE.MeshPhongMaterial({ color: 0xF44336, specular: 0x111111, shininess: 200 });
  mesh = new THREE.Mesh(geometry, material);
  ready = true;
  // to LPS space
  var RASToLPS = new THREE.Matrix4();
  RASToLPS.set(-1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  mesh.applyMatrix(RASToLPS);
  scene.add(mesh);

  ready = true;
});

// instantiate the loader
// it loads and parses the dicom image
var loader = new LoadersVolume(threeD);
var t2 = ['brain_001', 'brain_002', 'brain_003', 'brain_004', 'brain_005', 'brain_006', 'brain_007', 'brain_008', 'brain_009', 'brain_010', 'brain_011', 'brain_012', 'brain_013', 'brain_014', 'brain_015', 'brain_016', 'brain_017', 'brain_018', 'brain_019', 'brain_020'];
var files = t2.map(function (v) {
  return 'DICOM/' + v + '.dcm';
});

function updateGeometries() {
  if (stackHelper) {
    // update data material
    if (ready) {
      mesh.material = stackHelper.slice.mesh.material;
    }
  }
}

function init() {
  // this function is executed on each animation frame
  function animate() {
    var timer = Date.now() * 0.00025;

    particleLight.position.x = 1.2 * Math.sin(timer * 7) * 100;
    particleLight.position.y = 1.2 * Math.cos(timer * 5) * 120;
    particleLight.position.z = 1.2 * Math.cos(timer * 3) * 140;

    updateGeometries();

    controls.update();
    renderer.render(scene, camera);
    stats.update();

    // request new frame
    requestAnimationFrame(function () {
      animate();
    });
  }

  // renderer
  threeD = document.getElementById('r3d');
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
  renderer.setClearColor(0x101010, 1); //(0x353535, 1);
  renderer.setPixelRatio(window.devicePixelRatio);
  threeD.appendChild(renderer.domElement);

  // stats
  stats = new Stats();
  threeD.appendChild(stats.domElement);

  // scene
  scene = new THREE.Scene();

  // camera
  camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 0.01, 1000);
  camera.position.x = 500; //150
  camera.position.y = 0; //150
  camera.position.z = 0; //100

  // controls
  controls = new _controls2.default(camera, threeD);
  controls.rotateSpeed = 1.4;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.dynamicDampingFactor = 0.3;

  // Setup lights
  var particleLight = new THREE.Mesh(new THREE.SphereBufferGeometry(4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  scene.add(particleLight);

  scene.add(new THREE.AmbientLight(0x222222));

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  var pointLight = new THREE.PointLight(0xffffff, 2, 800);
  particleLight.add(pointLight);

  animate();
}

window.onload = function () {
  // init threeJS...
  init();

  loader.load(files).then(function () {
    var series = loader.data[0].mergeSeries(loader.data)[0];
    var stack = series.stack[0];
    stackHelper = new _helpers2.default(stack);
    var centerLPS = stackHelper.stack.worldCenter();
    //scene.add(stackHelper);


    // update camrea's and control's target
    camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    camera.updateProjectionMatrix();
    controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

    // create GUI / configutarion display 
    var gui = new dat.GUI({
      autoPlace: false
    });

    var customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);
    customContainer = null;

    var positionFolder = gui.addFolder('Configuration');
    var worldBBox = stackHelper.stack.worldBoundingBox();
    var interpolation = positionFolder.add(stackHelper.slice, 'interpolation', 0, 1).step(1).listen();
    positionFolder.open();

    //frameIndexControllerOriginI.onChange(updateGeometries);
    //frameIndexControllerOriginJ.onChange(updateGeometries);
    //frameIndexControllerOriginK.onChange(updateGeometries);

    loader.free();
    loader = null;

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize, false);
  }).catch(function (error) {
    window.console.log('oops... something went wrong...');
    window.console.log(error);
  });
};

},{"../../src/controls/controls.trackball":2,"../../src/helpers/helpers.stack":11}],2:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * Original authors from THREEJS repo
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin  / http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga  / http://lantiga.github.io
 */

var Trackball = function (_THREE$EventDispatche) {
  _inherits(Trackball, _THREE$EventDispatche);

  function Trackball(object, domElement) {
    _classCallCheck(this, Trackball);

    var _this2 = _possibleConstructorReturn(this, (Trackball.__proto__ || Object.getPrototypeOf(Trackball)).call(this));

    var _this = _this2;
    var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM: 4, TOUCH_PAN: 5, CUSTOM: 99 };

    _this2.object = object;
    _this2.domElement = domElement !== undefined ? domElement : document;

    // API

    _this2.enabled = true;

    _this2.screen = { left: 0, top: 0, width: 0, height: 0 };

    _this2.rotateSpeed = 1.0;
    _this2.zoomSpeed = 1.2;
    _this2.panSpeed = 0.3;

    _this2.noRotate = false;
    _this2.noZoom = false;
    _this2.noPan = false;
    _this2.noCustom = false;

    _this2.forceState = -1;

    _this2.staticMoving = false;
    _this2.dynamicDampingFactor = 0.2;

    _this2.minDistance = 0;
    _this2.maxDistance = Infinity;

    _this2.keys = [65 /* A*/, 83 /* S*/, 68];

    // internals

    _this2.target = new THREE.Vector3();

    var EPS = 0.000001;

    var lastPosition = new THREE.Vector3();

    var _state = STATE.NONE,
        _prevState = STATE.NONE,
        _eye = new THREE.Vector3(),
        _movePrev = new THREE.Vector2(),
        _moveCurr = new THREE.Vector2(),
        _lastAxis = new THREE.Vector3(),
        _lastAngle = 0,
        _zoomStart = new THREE.Vector2(),
        _zoomEnd = new THREE.Vector2(),
        _touchZoomDistanceStart = 0,
        _touchZoomDistanceEnd = 0,
        _panStart = new THREE.Vector2(),
        _panEnd = new THREE.Vector2(),
        _customStart = new THREE.Vector2(),
        _customEnd = new THREE.Vector2();

    // for reset

    _this2.target0 = _this2.target.clone();
    _this2.position0 = _this2.object.position.clone();
    _this2.up0 = _this2.object.up.clone();

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start' };
    var endEvent = { type: 'end' };

    // methods

    _this2.handleResize = function () {
      if (this.domElement === document) {
        this.screen.left = 0;
        this.screen.top = 0;
        this.screen.width = window.innerWidth;
        this.screen.height = window.innerHeight;
      } else {
        var box = this.domElement.getBoundingClientRect();
        // adjustments come from similar code in the jquery offset() function
        var d = this.domElement.ownerDocument.documentElement;
        this.screen.left = box.left + window.pageXOffset - d.clientLeft;
        this.screen.top = box.top + window.pageYOffset - d.clientTop;
        this.screen.width = box.width;
        this.screen.height = box.height;
      }
    };

    _this2.handleEvent = function (event) {
      if (typeof this[event.type] == 'function') {
        this[event.type](event);
      }
    };

    var getMouseOnScreen = function () {
      var vector = new THREE.Vector2();

      return function (pageX, pageY) {
        vector.set((pageX - _this.screen.left) / _this.screen.width, (pageY - _this.screen.top) / _this.screen.height);

        return vector;
      };
    }();

    var getMouseOnCircle = function () {
      var vector = new THREE.Vector2();

      return function (pageX, pageY) {
        vector.set((pageX - _this.screen.width * 0.5 - _this.screen.left) / (_this.screen.width * 0.5), (_this.screen.height + 2 * (_this.screen.top - pageY)) / _this.screen.width);

        return vector;
      };
    }();

    _this2.rotateCamera = function () {
      var axis = new THREE.Vector3(),
          quaternion = new THREE.Quaternion(),
          eyeDirection = new THREE.Vector3(),
          objectUpDirection = new THREE.Vector3(),
          objectSidewaysDirection = new THREE.Vector3(),
          moveDirection = new THREE.Vector3(),
          angle = void 0;

      return function () {
        moveDirection.set(_moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0);
        angle = moveDirection.length();

        if (angle) {
          _eye.copy(_this.object.position).sub(_this.target);

          eyeDirection.copy(_eye).normalize();
          objectUpDirection.copy(_this.object.up).normalize();
          objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

          objectUpDirection.setLength(_moveCurr.y - _movePrev.y);
          objectSidewaysDirection.setLength(_moveCurr.x - _movePrev.x);

          moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

          axis.crossVectors(moveDirection, _eye).normalize();

          angle *= _this.rotateSpeed;
          quaternion.setFromAxisAngle(axis, angle);

          _eye.applyQuaternion(quaternion);
          _this.object.up.applyQuaternion(quaternion);

          _lastAxis.copy(axis);
          _lastAngle = angle;
        } else if (!_this.staticMoving && _lastAngle) {
          _lastAngle *= Math.sqrt(1.0 - _this.dynamicDampingFactor);
          _eye.copy(_this.object.position).sub(_this.target);
          quaternion.setFromAxisAngle(_lastAxis, _lastAngle);
          _eye.applyQuaternion(quaternion);
          _this.object.up.applyQuaternion(quaternion);
        }

        _movePrev.copy(_moveCurr);
      };
    }();

    _this2.zoomCamera = function () {
      var factor = void 0;

      if (_state === STATE.TOUCH_ZOOM) {
        factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
        _touchZoomDistanceStart = _touchZoomDistanceEnd;
        _eye.multiplyScalar(factor);
      } else {
        factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * _this.zoomSpeed;

        if (factor !== 1.0 && factor > 0.0) {
          _eye.multiplyScalar(factor);

          if (_this.staticMoving) {
            _zoomStart.copy(_zoomEnd);
          } else {
            _zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
          }
        }
      }
    };

    _this2.panCamera = function () {
      var mouseChange = new THREE.Vector2(),
          objectUp = new THREE.Vector3(),
          pan = new THREE.Vector3();

      return function () {
        mouseChange.copy(_panEnd).sub(_panStart);

        if (mouseChange.lengthSq()) {
          mouseChange.multiplyScalar(_eye.length() * _this.panSpeed);

          pan.copy(_eye).cross(_this.object.up).setLength(mouseChange.x);
          pan.add(objectUp.copy(_this.object.up).setLength(mouseChange.y));

          _this.object.position.add(pan);
          _this.target.add(pan);

          if (_this.staticMoving) {
            _panStart.copy(_panEnd);
          } else {
            _panStart.add(mouseChange.subVectors(_panEnd, _panStart).multiplyScalar(_this.dynamicDampingFactor));
          }
        }
      };
    }();

    _this2.checkDistances = function () {
      if (!_this.noZoom || !_this.noPan) {
        if (_eye.lengthSq() > _this.maxDistance * _this.maxDistance) {
          _this.object.position.addVectors(_this.target, _eye.setLength(_this.maxDistance));
        }

        if (_eye.lengthSq() < _this.minDistance * _this.minDistance) {
          _this.object.position.addVectors(_this.target, _eye.setLength(_this.minDistance));
        }
      }
    };

    _this2.update = function () {
      _eye.subVectors(_this.object.position, _this.target);

      if (!_this.noRotate) {
        _this.rotateCamera();
      }

      if (!_this.noZoom) {
        _this.zoomCamera();
      }

      if (!_this.noPan) {
        _this.panCamera();
      }

      if (!_this.noCustom) {
        _this.custom(_customStart, _customEnd);
      }

      _this.object.position.addVectors(_this.target, _eye);

      _this.checkDistances();

      _this.object.lookAt(_this.target);

      if (lastPosition.distanceToSquared(_this.object.position) > EPS) {
        _this.dispatchEvent(changeEvent);

        lastPosition.copy(_this.object.position);
      }
    };

    _this2.reset = function () {
      _state = STATE.NONE;
      _prevState = STATE.NONE;

      _this.target.copy(_this.target0);
      _this.object.position.copy(_this.position0);
      _this.object.up.copy(_this.up0);

      _eye.subVectors(_this.object.position, _this.target);

      _this.object.lookAt(_this.target);

      _this.dispatchEvent(changeEvent);

      lastPosition.copy(_this.object.position);
    };

    _this2.setState = function (targetState) {
      _this.forceState = targetState;
      _prevState = targetState;
      _state = targetState;
    };

    _this2.custom = function (customStart, customEnd) {};

    // listeners

    function keydown(event) {
      if (_this.enabled === false) return;

      window.removeEventListener('keydown', keydown);

      _prevState = _state;

      if (_state !== STATE.NONE) {
        return;
      } else if (event.keyCode === _this.keys[STATE.ROTATE] && !_this.noRotate) {
        _state = STATE.ROTATE;
      } else if (event.keyCode === _this.keys[STATE.ZOOM] && !_this.noZoom) {
        _state = STATE.ZOOM;
      } else if (event.keyCode === _this.keys[STATE.PAN] && !_this.noPan) {
        _state = STATE.PAN;
      }
    }

    function keyup(event) {
      if (_this.enabled === false) return;

      _state = _prevState;

      window.addEventListener('keydown', keydown, false);
    }

    function mousedown(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      if (_state === STATE.NONE) {
        _state = event.button;
      }

      if (_state === STATE.ROTATE && !_this.noRotate) {
        _moveCurr.copy(getMouseOnCircle(event.pageX, event.pageY));
        _movePrev.copy(_moveCurr);
      } else if (_state === STATE.ZOOM && !_this.noZoom) {
        _zoomStart.copy(getMouseOnScreen(event.pageX, event.pageY));
        _zoomEnd.copy(_zoomStart);
      } else if (_state === STATE.PAN && !_this.noPan) {
        _panStart.copy(getMouseOnScreen(event.pageX, event.pageY));
        _panEnd.copy(_panStart);
      } else if (_state === STATE.CUSTOM && !_this.noCustom) {
        _customStart.copy(getMouseOnScreen(event.pageX, event.pageY));
        _customEnd.copy(_panStart);
      }

      document.addEventListener('mousemove', mousemove, false);
      document.addEventListener('mouseup', mouseup, false);

      _this.dispatchEvent(startEvent);
    }

    function mousemove(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      if (_state === STATE.ROTATE && !_this.noRotate) {
        _movePrev.copy(_moveCurr);
        _moveCurr.copy(getMouseOnCircle(event.pageX, event.pageY));
      } else if (_state === STATE.ZOOM && !_this.noZoom) {
        _zoomEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
      } else if (_state === STATE.PAN && !_this.noPan) {
        _panEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
      } else if (_state === STATE.CUSTOM && !_this.noCustom) {
        _customEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
      }
    }

    function mouseup(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      if (_this.forceState === -1) {
        _state = STATE.NONE;
      }

      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
      _this.dispatchEvent(endEvent);
    }

    function mousewheel(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      var delta = 0;

      if (event.wheelDelta) {
        // WebKit / Opera / Explorer 9

        delta = event.wheelDelta / 40;
      } else if (event.detail) {
        // Firefox

        delta = -event.detail / 3;
      }

      if (_state !== STATE.CUSTOM) {
        _zoomStart.y += delta * 0.01;
      } else if (_state === STATE.CUSTOM) {
        _customStart.y += delta * 0.01;
      }

      _this.dispatchEvent(startEvent);
      _this.dispatchEvent(endEvent);
    }

    function touchstart(event) {
      if (_this.enabled === false) return;

      if (_this.forceState === -1) {
        switch (event.touches.length) {

          case 1:
            _state = STATE.TOUCH_ROTATE;
            _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
            _movePrev.copy(_moveCurr);
            break;

          case 2:
            _state = STATE.TOUCH_ZOOM;
            var dx = event.touches[0].pageX - event.touches[1].pageX;
            var dy = event.touches[0].pageY - event.touches[1].pageY;
            _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);

            var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            _panStart.copy(getMouseOnScreen(x, y));
            _panEnd.copy(_panStart);
            break;

          default:
            _state = STATE.NONE;

        }
      } else {
        // { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4, CUSTOM: 99 };
        switch (_state) {

          case 0:
            // 1 or 2 fingers, smae behavior
            _state = STATE.TOUCH_ROTATE;
            _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
            _movePrev.copy(_moveCurr);
            break;

          case 1:
          case 4:
            if (event.touches.length >= 2) {
              _state = STATE.TOUCH_ZOOM;
              var dx = event.touches[0].pageX - event.touches[1].pageX;
              var dy = event.touches[0].pageY - event.touches[1].pageY;
              _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
            } else {
              _state = STATE.ZOOM;
              _zoomStart.copy(getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY));
              _zoomEnd.copy(_zoomStart);
            }
            break;

          case 2:
          case 5:
            if (event.touches.length >= 2) {
              _state = STATE.TOUCH_PAN;
              var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
              var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
              _panStart.copy(getMouseOnScreen(x, y));
              _panEnd.copy(_panStart);
            } else {
              _state = STATE.PAN;
              _panStart.copy(getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY));
              _panEnd.copy(_panStart);
            }
            break;

          case 99:
            _state = STATE.CUSTOM;
            var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            _customStart.copy(getMouseOnScreen(x, y));
            _customEnd.copy(_customStart);
            break;

          default:
            _state = STATE.NONE;

        }
      }

      _this.dispatchEvent(startEvent);
    }

    function touchmove(event) {
      if (_this.enabled === false) return;

      event.preventDefault();
      event.stopPropagation();

      if (_this.forceState === -1) {
        switch (event.touches.length) {

          case 1:
            _movePrev.copy(_moveCurr);
            _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
            break;

          case 2:
            var dx = event.touches[0].pageX - event.touches[1].pageX;
            var dy = event.touches[0].pageY - event.touches[1].pageY;
            _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

            var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            _panEnd.copy(getMouseOnScreen(x, y));
            break;

          default:
            _state = STATE.NONE;
        }
      } else {
        // { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4, CUSTOM: 99 };
        switch (_state) {

          case 0:
            _movePrev.copy(_moveCurr);
            _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
            break;

          case 1:
            _zoomEnd.copy(getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY));
            break;

          case 2:
            _panEnd.copy(getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY));
            break;

          case 4:
            // 2 fingers!
            // TOUCH ZOOM
            var dx = event.touches[0].pageX - event.touches[1].pageX;
            var dy = event.touches[0].pageY - event.touches[1].pageY;
            _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
            break;

          case 5:
            // 2 fingers
            // TOUCH_PAN
            var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            _panEnd.copy(getMouseOnScreen(x, y));
            break;

          case 99:
            var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            _customEnd.copy(getMouseOnScreen(x, y));
            break;

          default:
            _state = STATE.NONE;

        }
      }
    }

    function touchend(event) {
      if (_this.enabled === false) return;

      if (_this.forceState === -1) {
        switch (event.touches.length) {

          case 1:
            _movePrev.copy(_moveCurr);
            _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
            break;

          case 2:
            _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

            var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            _panEnd.copy(getMouseOnScreen(x, y));
            _panStart.copy(_panEnd);
            break;

        }

        _state = STATE.NONE;
      } else {
        switch (_state) {

          case 0:
            _movePrev.copy(_moveCurr);
            _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
            break;

          case 1:
          case 2:
            break;

          case 4:
            // TOUCH ZOOM
            _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
            _state = STATE.ZOOM;
            break;

          case 5:
            // TOUCH ZOOM
            if (event.touches.length >= 2) {
              var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
              var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
              _panEnd.copy(getMouseOnScreen(x, y));
              _panStart.copy(_panEnd);
            }
            _state = STATE.PAN;
            break;

          case 99:
            var x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
            var y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
            _customEnd.copy(getMouseOnScreen(x, y));
            _customStart.copy(_customEnd);
            break;

          default:
            _state = STATE.NONE;

        }
      }

      _this.dispatchEvent(endEvent);
    }

    _this2.domElement.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    }, false);

    _this2.domElement.addEventListener('mousedown', mousedown, false);

    _this2.domElement.addEventListener('mousewheel', mousewheel, false);
    _this2.domElement.addEventListener('DOMMouseScroll', mousewheel, false); // firefox

    _this2.domElement.addEventListener('touchstart', touchstart, false);
    _this2.domElement.addEventListener('touchend', touchend, false);
    _this2.domElement.addEventListener('touchmove', touchmove, false);

    window.addEventListener('keydown', keydown, false);
    window.addEventListener('keyup', keyup, false);

    _this2.handleResize();

    // force an update at start
    _this2.update();
    return _this2;
  }

  return Trackball;
}(THREE.EventDispatcher);

exports.default = Trackball;

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _core = require('./core.utils');

var _core2 = _interopRequireDefault(_core);

var _core3 = require('./core.validators');

var _core4 = _interopRequireDefault(_core3);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * Compute/test intersection between different objects.
 *
 * @module core/intersections
 */

var Intersections = function () {
  function Intersections() {
    _classCallCheck(this, Intersections);
  }

  _createClass(Intersections, null, [{
    key: 'aabbPlane',

    /**
     * Compute intersection between oriented bounding box and a plane.
     *
     * Returns intersection in plane's space.
     *
     * Should return at least 3 intersections. If not, the plane and the box do not
     * intersect.
     *
     * @param {Object} aabb - Axe Aligned Bounding Box representation.
     * @param {THREE.Vector3} aabb.halfDimensions - Half dimensions of the box.
     * @param {THREE.Vector3} aabb.center - Center of the box.
     * @param {THREE.Matrix4} aabb.toAABB - Transform to go from plane space to box space.
     * @param {Object} plane - Plane representation
     * @param {THREE.Vector3} plane.position - position of normal which describes the plane.
     * @param {THREE.Vector3} plane.direction - Direction of normal which describes the plane.
     *
     * @returns {Array<THREE.Vector3>} List of all intersections in plane's space.
     * @returns {boolean} false is invalid input provided.
     *
     * @example
     * //Returns array with intersection N intersections
     * let aabb = {
     *   center: new THREE.Vector3(150, 150, 150),
     *   halfDimensions: new THREE.Vector3(50, 60, 70),
     *   toAABB: new THREE.Matrix4()
     * }
     * let plane = {
     *   position: new THREE.Vector3(110, 120, 130),
     *   direction: new THREE.Vector3(1, 0, 0)
     * }
     *
     * let intersections = CoreIntersections.aabbPlane(aabb, plane);
     * // intersections ==
     * //[ { x : 110, y : 90,  z : 80 },
     * //  { x : 110, y : 210, z : 220 },
     * //  { x : 110, y : 210, z : 80 },
     * //  { x : 110, y : 90,  z : 220 } ]
     *
     * //Returns empty array with 0 intersections
     * let aabb = {
     *
     * }
     * let plane = {
     *
     * }
     *
     * let intersections = VJS.Core.Validators.matrix4(new THREE.Vector3());
     *
     * //Returns false if invalid input?
     *
     */
    value: function aabbPlane(aabb, plane) {
      //
      // obb = { halfDimensions, orientation, center, toAABB }
      // plane = { position, direction }
      //
      //
      // LOGIC:
      //
      // Test intersection of each edge of the Oriented Bounding Box with the Plane
      //
      // ALL EDGES
      //
      //      .+-------+
      //    .' |     .'|
      //   +---+---+'  |
      //   |   |   |   |
      //   |  ,+---+---+
      //   |.'     | .'
      //   +-------+'
      //
      // SPACE ORIENTATION
      //
      //       +
      //     j |
      //       |
      //       |   i
      //   k  ,+-------+
      //    .'
      //   +
      //
      //
      // 1- Move Plane position and orientation in IJK space
      // 2- Test Edges/ IJK Plane intersections
      // 3- Return intersection Edge/ IJK Plane if it touches the Oriented BBox

      var intersections = [];

      if (!(this.validateAabb(aabb) && this.validatePlane(plane))) {
        window.console.log('Invalid aabb or plane provided.');
        return false;
      }

      // invert space matrix
      var fromAABB = new THREE.Matrix4();
      fromAABB.getInverse(aabb.toAABB);

      var t1 = plane.direction.clone().applyMatrix4(aabb.toAABB);
      var t0 = new THREE.Vector3(0, 0, 0).applyMatrix4(aabb.toAABB);

      var planeAABB = this.posdir(plane.position.clone().applyMatrix4(aabb.toAABB), new THREE.Vector3(t1.x - t0.x, t1.y - t0.y, t1.z - t0.z).normalize());

      var bbox = _core2.default.bbox(aabb.center, aabb.halfDimensions);

      var orientation = new THREE.Vector3(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));

      // 12 edges (i.e. ray)/plane intersection tests
      // RAYS STARTING FROM THE FIRST CORNER (0, 0, 0)
      //
      //       +
      //       |
      //       |
      //       |
      //      ,+---+---+
      //    .'
      //   +

      var ray = this.posdir(new THREE.Vector3(aabb.center.x - aabb.halfDimensions.x, aabb.center.y - aabb.halfDimensions.y, aabb.center.z - aabb.halfDimensions.z), orientation.x);
      this.rayPlaneInBBox(ray, planeAABB, bbox, intersections);

      ray.direction = orientation.y;
      this.rayPlaneInBBox(ray, planeAABB, bbox, intersections);

      ray.direction = orientation.z;
      this.rayPlaneInBBox(ray, planeAABB, bbox, intersections);

      // RAYS STARTING FROM THE LAST CORNER
      //
      //               +
      //             .'
      //   +-------+'
      //           |
      //           |
      //           |
      //           +
      //

      var ray2 = this.posdir(new THREE.Vector3(aabb.center.x + aabb.halfDimensions.x, aabb.center.y + aabb.halfDimensions.y, aabb.center.z + aabb.halfDimensions.z), orientation.x);
      this.rayPlaneInBBox(ray2, planeAABB, bbox, intersections);

      ray2.direction = orientation.y;
      this.rayPlaneInBBox(ray2, planeAABB, bbox, intersections);

      ray2.direction = orientation.z;
      this.rayPlaneInBBox(ray2, planeAABB, bbox, intersections);

      // RAYS STARTING FROM THE SECOND CORNER
      //
      //               +
      //               |
      //               |
      //               |
      //               +
      //             .'
      //           +'

      var ray3 = this.posdir(new THREE.Vector3(aabb.center.x + aabb.halfDimensions.x, aabb.center.y - aabb.halfDimensions.y, aabb.center.z - aabb.halfDimensions.z), orientation.y);
      this.rayPlaneInBBox(ray3, planeAABB, bbox, intersections);

      ray3.direction = orientation.z;
      this.rayPlaneInBBox(ray3, planeAABB, bbox, intersections);

      // RAYS STARTING FROM THE THIRD CORNER
      //
      //      .+-------+
      //    .'
      //   +
      //
      //
      //
      //

      var ray4 = this.posdir(new THREE.Vector3(aabb.center.x - aabb.halfDimensions.x, aabb.center.y + aabb.halfDimensions.y, aabb.center.z - aabb.halfDimensions.z), orientation.x);
      this.rayPlaneInBBox(ray4, planeAABB, bbox, intersections);

      ray4.direction = orientation.z;
      this.rayPlaneInBBox(ray4, planeAABB, bbox, intersections);

      // RAYS STARTING FROM THE FOURTH CORNER
      //
      //
      //
      //   +
      //   |
      //   |
      //   |
      //   +-------+

      var ray5 = this.posdir(new THREE.Vector3(aabb.center.x - aabb.halfDimensions.x, aabb.center.y - aabb.halfDimensions.y, aabb.center.z + aabb.halfDimensions.z), orientation.x);
      this.rayPlaneInBBox(ray5, planeAABB, bbox, intersections);

      ray5.direction = orientation.y;
      this.rayPlaneInBBox(ray5, planeAABB, bbox, intersections);

      // @todo make sure objects are unique...

      // back to original space
      intersections.map(function (element) {
        return element.applyMatrix4(fromAABB);
      });

      return intersections;
    }

    /**
     * Compute intersection between a ray and a plane.
     *
     * @memberOf this
     * @public
     *
     * @param {Object} ray - Ray representation.
     * @param {THREE.Vector3} ray.position - position of normal which describes the ray.
     * @param {THREE.Vector3} ray.direction - Direction of normal which describes the ray.
     * @param {Object} plane - Plane representation
     * @param {THREE.Vector3} plane.position - position of normal which describes the plane.
     * @param {THREE.Vector3} plane.direction - Direction of normal which describes the plane.
     *
     * @returns {THREE.Vector3|null} Intersection between ray and plane or null.
     */

  }, {
    key: 'rayPlane',
    value: function rayPlane(ray, plane) {
      // ray: {position, direction}
      // plane: {position, direction}

      if (ray.direction.dot(plane.direction) !== 0) {
        //
        // not parallel, move forward
        //
        // LOGIC:
        //
        // Ray equation: P = P0 + tV
        // P = <Px, Py, Pz>
        // P0 = <ray.position.x, ray.position.y, ray.position.z>
        // V = <ray.direction.x, ray.direction.y, ray.direction.z>
        //
        // Therefore:
        // Px = ray.position.x + t*ray.direction.x
        // Py = ray.position.y + t*ray.direction.y
        // Pz = ray.position.z + t*ray.direction.z
        //
        //
        //
        // Plane equation: ax + by + cz + d = 0
        // a = plane.direction.x
        // b = plane.direction.y
        // c = plane.direction.z
        // d = -( plane.direction.x*plane.position.x +
        //        plane.direction.y*plane.position.y +
        //        plane.direction.z*plane.position.z )
        //
        //
        // 1- in the plane equation, we replace x, y and z by Px, Py and Pz
        // 2- find t
        // 3- replace t in Px, Py and Pz to get the coordinate of the intersection
        //
        var t = (plane.direction.x * (plane.position.x - ray.position.x) + plane.direction.y * (plane.position.y - ray.position.y) + plane.direction.z * (plane.position.z - ray.position.z)) / (plane.direction.x * ray.direction.x + plane.direction.y * ray.direction.y + plane.direction.z * ray.direction.z);

        var intersection = new THREE.Vector3(ray.position.x + t * ray.direction.x, ray.position.y + t * ray.direction.y, ray.position.z + t * ray.direction.z);

        return intersection;
      }

      return null;
    }
  }, {
    key: 'rayBox',
    value: function rayBox(ray, box) {
      // should also do the space transforms here
      // ray: {position, direction}
      // box: {halfDimensions, center}

      var intersections = [];

      var bbox = _core2.default.bbox(box.center, box.halfDimensions);

      // window.console.log(bbox);

      // X min
      var plane = this.posdir(new THREE.Vector3(bbox.min.x, box.center.y, box.center.z), new THREE.Vector3(-1, 0, 0));
      this.rayPlaneInBBox(ray, plane, bbox, intersections);

      // X max
      plane = this.posdir(new THREE.Vector3(bbox.max.x, box.center.y, box.center.z), new THREE.Vector3(1, 0, 0));
      this.rayPlaneInBBox(ray, plane, bbox, intersections);

      // Y min
      plane = this.posdir(new THREE.Vector3(box.center.x, bbox.min.y, box.center.z), new THREE.Vector3(0, -1, 0));
      this.rayPlaneInBBox(ray, plane, bbox, intersections);

      // Y max
      plane = this.posdir(new THREE.Vector3(box.center.x, bbox.max.y, box.center.z), new THREE.Vector3(0, 1, 0));
      this.rayPlaneInBBox(ray, plane, bbox, intersections);

      // Z min
      plane = this.posdir(new THREE.Vector3(box.center.x, box.center.y, bbox.min.z), new THREE.Vector3(0, 0, -1));
      this.rayPlaneInBBox(ray, plane, bbox, intersections);

      // Z max
      plane = this.posdir(new THREE.Vector3(box.center.x, box.center.y, bbox.max.z), new THREE.Vector3(0, 0, 1));
      this.rayPlaneInBBox(ray, plane, bbox, intersections);

      return intersections;
    }
  }, {
    key: 'rayPlaneInBBox',
    value: function rayPlaneInBBox(ray, planeAABB, bbox, intersections) {
      var intersection = this.rayPlane(ray, planeAABB);
      // window.console.log(intersection);
      if (intersection && this.inBBox(intersection, bbox)) {
        if (!intersections.find(this.findIntersection(intersection))) {
          intersections.push(intersection);
        }
      }
    }
  }, {
    key: 'findIntersection',
    value: function findIntersection(myintersection) {
      return function found(element, index, array) {
        if (myintersection.x === element.x && myintersection.y === element.y && myintersection.z === element.z) {
          return true;
        }

        return false;
      };
    }
  }, {
    key: 'inBBox',
    value: function inBBox(point, bbox) {
      //
      var epsilon = 0.0001;
      if (point && point.x >= bbox.min.x - epsilon && point.y >= bbox.min.y - epsilon && point.z >= bbox.min.z - epsilon && point.x <= bbox.max.x + epsilon && point.y <= bbox.max.y + epsilon && point.z <= bbox.max.z + epsilon) {
        return true;
      }
      return false;
    }
  }, {
    key: 'posdir',
    value: function posdir(position, direction) {
      return { position: position, direction: direction };
    }
  }, {
    key: 'validatePlane',
    value: function validatePlane(plane) {
      //
      if (plane === null) {
        window.console.log('Invalid plane.');
        window.console.log(plane);

        return false;
      }

      if (!_core4.default.vector3(plane.position)) {
        window.console.log('Invalid plane.position.');
        window.console.log(plane.position);

        return false;
      }

      if (!_core4.default.vector3(plane.direction)) {
        window.console.log('Invalid plane.direction.');
        window.console.log(plane.direction);

        return false;
      }

      return true;
    }
  }, {
    key: 'validateAabb',
    value: function validateAabb(aabb) {
      //
      if (aabb === null) {
        window.console.log('Invalid aabb.');
        window.console.log(aabb);
        return false;
      }

      if (!_core4.default.matrix4(aabb.toAABB)) {
        window.console.log('Invalid aabb.toAABB: ');
        window.console.log(aabb.toAABB);

        return false;
      }

      if (!_core4.default.vector3(aabb.center)) {
        window.console.log('Invalid aabb.center.');
        window.console.log(aabb.center);

        return false;
      }

      if (!(_core4.default.vector3(aabb.halfDimensions) && aabb.halfDimensions.x >= 0 && aabb.halfDimensions.y >= 0 && aabb.halfDimensions.z >= 0)) {
        window.console.log('Invalid aabb.halfDimensions.');
        window.console.log(aabb.halfDimensions);

        return false;
      }

      return true;
    }
  }]);

  return Intersections;
}();

exports.default = Intersections;

},{"./core.utils":4,"./core.validators":5}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _core = require('./core.validators');

var _core2 = _interopRequireDefault(_core);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * General purpose functions.
 *
 * @module core/utils
 */

// Missing all good stuff
// critical for testing
// transform ( IJK <-> RAS)
// bounding box (IJK, RAS, Axed Aligned)
// minBound
// maxBound
// half dimensions, etc.
//

var Utils = function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: 'bbox',

    /**
     * Generate a bouding box object.
     * @param {THREE.Vector3} center - Center of the box.
     * @param {THREE.Vector3} halfDimensions - Half Dimensions of the box.
     * @return {Object} The bounding box object. {Object.min} is a {THREE.Vector3}
     * containing the min bounds. {Object.max} is a {THREE.Vector3} containing the
     * max bounds.
     * @return {boolean} False input NOT valid.
     * @example
     * // Returns
     * //{ min: { x : 0, y : 0,  z : 0 },
     * //  max: { x : 2, y : 4,  z : 6 }
     * //}
     * VJS.Core.Utils.bbox( new THREE.Vector3(1, 2, 3), new THREE.Vector3(1, 2, 3));
     *
     * //Returns false
     * VJS.Core.Utils.bbox(new THREE.Vector3(), new THREE.Matrix4());
     *
     */
    value: function bbox(center, halfDimensions) {
      // make sure we have valid inputs
      if (!(_core2.default.vector3(center) && _core2.default.vector3(halfDimensions))) {
        window.console.log('Invalid center or plane halfDimensions.');
        return false;
      }

      // make sure half dimensions are >= 0
      if (!(halfDimensions.x >= 0 && halfDimensions.y >= 0 && halfDimensions.z >= 0)) {
        window.console.log('halfDimensions must be >= 0.');
        window.console.log(halfDimensions);
        return false;
      }

      // min/max bound
      var min = center.clone().sub(halfDimensions);
      var max = center.clone().add(halfDimensions);

      return {
        min: min,
        max: max
      };
    }
  }, {
    key: 'minMaxPixelData',
    value: function minMaxPixelData() {
      var pixelData = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var minMax = [65535, -32768];
      var numPixels = pixelData.length;

      for (var index = 0; index < numPixels; index++) {
        var spv = pixelData[index];
        minMax[0] = Math.min(minMax[0], spv);
        minMax[1] = Math.max(minMax[1], spv);
      }

      return minMax;
    }
  }]);

  return Utils;
}();

exports.default = Utils;

},{"./core.validators":5}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * Validate basic structures.
 *
 * @example
 * //Returns true
 * VJS.Core.Validators.matrix4(new THREE.Matrix4());
 *
 * //Returns false
 * VJS.Core.Validators.matrix4(new THREE.Vector3());
 *
 * @module core/validators
 */

var Validators = function () {
  function Validators() {
    _classCallCheck(this, Validators);
  }

  _createClass(Validators, null, [{
    key: 'matrix4',

    /**
     * Validates a matrix as a THREEJS.Matrix4
     * link
     * @param {Object} objectToTest - The object to be tested.
     * @return {boolean} True if valid Matrix4, false if NOT.
     */
    value: function matrix4(objectToTest) {
      if (!(objectToTest !== null && typeof objectToTest !== 'undefined' && objectToTest.hasOwnProperty('elements') && objectToTest.elements.length === 16 && typeof objectToTest.identity === 'function' && typeof objectToTest.copy === 'function' && typeof objectToTest.determinant === 'function')) {
        return false;
      }

      return true;
    }

    /**
    * Validates a vector as a THREEJS.Vector3
    * @param {Object} objectToTest - The object to be tested.
    * @return {boolean} True if valid Vector3, false if NOT.
    */

  }, {
    key: 'vector3',
    value: function vector3(objectToTest) {
      if (!(objectToTest !== null && typeof objectToTest !== 'undefined' && objectToTest.hasOwnProperty('x') && objectToTest.hasOwnProperty('y') && objectToTest.hasOwnProperty('z') && !objectToTest.hasOwnProperty('w'))) {
        return false;
      }

      return true;
    }

    /**
     * Validates a box.
     *
     * @example
     * // a box is defined as
     * let box = {
     *   center: THREE.Vector3,
     *   halfDimensions: THREE.Vector3
     * }
     *
     * @param {Object} objectToTest - The object to be tested.
     * @return {boolean} True if valid box, false if NOT.
     */

  }, {
    key: 'box',
    value: function box(objectToTest) {
      if (!(objectToTest !== null && typeof objectToTest !== 'undefined' && objectToTest.hasOwnProperty('center') && this.vector3(objectToTest.center) && objectToTest.hasOwnProperty('halfDimensions') && this.vector3(objectToTest.halfDimensions) && objectToTest.halfDimensions.x >= 0 && objectToTest.halfDimensions.y >= 0 && objectToTest.halfDimensions.z >= 0)) {
        return false;
      }

      return true;
    }

    /**
     * Validates a ray.
     *
     * @example
     * // a ray is defined as
     * let ray = {
     *   postion: THREE.Vector3,
     *   direction: THREE.Vector3
     * }
     *
     * @param {Object} objectToTest - The object to be tested.
     * @return {boolean} True if valid ray, false if NOT.
     */

  }, {
    key: 'ray',
    value: function ray(objectToTest) {
      if (!(objectToTest !== null && typeof objectToTest !== 'undefined' && objectToTest.hasOwnProperty('position') && this.vector3(objectToTest.position) && objectToTest.hasOwnProperty('direction') && this.vector3(objectToTest.direction))) {
        return false;
      }

      return true;
    }
  }]);

  return Validators;
}();

exports.default = Validators;

},{}],6:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _core = require('../core/core.intersections');

var _core2 = _interopRequireDefault(_core);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
} /** * Imports ***/

/**
 *
 * It is typically used for creating an irregular 3D planar shape given a box and the cut-plane.
 *
 * Demo: {@link https://fnndsc.github.io/vjs#geometry_slice}
 *
 * @module geometries/slice
 *
 * @param {THREE.Vector3} halfDimensions - Half-dimensions of the box to be sliced.
 * @param {THREE.Vector3} center - Center of the box to be sliced.
 * @param {THREE.Vector3<THREE.Vector3>} orientation - Orientation of the box to be sliced. (might not be necessary..?)
 * @param {THREE.Vector3} position - Position of the cutting plane.
 * @param {THREE.Vector3} direction - Cross direction of the cutting plane.
 *
 * @example
 * // Define box to be sliced
 * let halfDimensions = new THREE.Vector(123, 45, 67);
 * let center = new THREE.Vector3(0, 0, 0);
 * let orientation = new THREE.Vector3(
 *   new THREE.Vector3(1, 0, 0),
 *   new THREE.Vector3(0, 1, 0),
 *   new THREE.Vector3(0, 0, 1)
 * );
 *
 * // Define slice plane
 * let position = center.clone();
 * let direction = new THREE.Vector3(-0.2, 0.5, 0.3);
 *
 * // Create the slice geometry & materials
 * let sliceGeometry = new VJS.geometries.slice(halfDimensions, center, orientation, position, direction);
 * let sliceMaterial = new THREE.MeshBasicMaterial({
 *   'side': THREE.DoubleSide,
 *   'color': 0xFF5722
 * });
 *
 *  // Create mesh and add it to the scene
 *  let slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
 *  scene.add(slice);
 */

var GeometriesSlice = function (_THREE$ShapeGeometry) {
  _inherits(GeometriesSlice, _THREE$ShapeGeometry);

  function GeometriesSlice(halfDimensions, center, position, direction) {
    var toAABB = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new THREE.Matrix4();

    _classCallCheck(this, GeometriesSlice);

    //
    // prepare data for the shape!
    //
    var aabb = {
      halfDimensions: halfDimensions,
      center: center,
      toAABB: toAABB
    };

    var plane = {
      position: position,
      direction: direction
    };

    // BOOM!
    var intersections = _core2.default.aabbPlane(aabb, plane);

    // can not exist before calling the constructor
    if (intersections.length < 3) {
      window.console.log('WARNING: Less than 3 intersections between AABB and Plane.');
      window.console.log('AABB');
      window.console.log(aabb);
      window.console.log('Plane');
      window.console.log(plane);
      window.console.log('exiting...');
      // or throw error?
      throw 'geometries.slice has less than 3 intersections, can not create a valid geometry.';
    }

    var orderedIntersections = GeometriesSlice.orderIntersections(intersections, direction);
    var sliceShape = GeometriesSlice.shape(orderedIntersections);

    //
    // Generate Geometry from shape
    // It does triangulation for us!
    //

    var _this = _possibleConstructorReturn(this, (GeometriesSlice.__proto__ || Object.getPrototypeOf(GeometriesSlice)).call(this, sliceShape));

    _this.type = 'SliceGeometry';

    // update real position of each vertex! (not in 2d)
    _this.vertices = orderedIntersections;
    _this.verticesNeedUpdate = true;
    return _this;
  }

  _createClass(GeometriesSlice, null, [{
    key: 'shape',
    value: function shape(points) {
      //
      // Create Shape
      //
      var shape = new THREE.Shape();
      // move to first point!
      shape.moveTo(points[0].xy.x, points[0].xy.y);

      // loop through all points!
      for (var l = 1; l < points.length; l++) {
        // project each on plane!
        shape.lineTo(points[l].xy.x, points[l].xy.y);
      }

      // close the shape!
      shape.lineTo(points[0].xy.x, points[0].xy.y);
      return shape;
    }

    /**
     *
     * Convenience function to extract center of mass from list of points.
     *
     * @private
     *
     * @param {Array<THREE.Vector3>} points - Set of points from which we want to extract the center of mass.
     *
     * @returns {THREE.Vector3} Center of mass from given points.
     */

  }, {
    key: 'centerOfMass',
    value: function centerOfMass(points) {
      var centerOfMass = new THREE.Vector3(0, 0, 0);
      for (var i = 0; i < points.length; i++) {
        centerOfMass.x += points[i].x;
        centerOfMass.y += points[i].y;
        centerOfMass.z += points[i].z;
      }
      centerOfMass.divideScalar(points.length);

      return centerOfMass;
    }

    /**
     *
     * Order 3D planar points around a refence point.
     *
     * @private
     *
     * @param {Array<THREE.Vector3>} points - Set of planar 3D points to be ordered.
     * @param {THREE.Vector3} direction - Direction of the plane in which points and reference are sitting.
     *
     * @returns {Array<Object>} Set of object representing the ordered points.
     */

  }, {
    key: 'orderIntersections',
    value: function orderIntersections(points, direction) {
      var reference = GeometriesSlice.centerOfMass(points);
      // direction from first point to reference
      var referenceDirection = new THREE.Vector3(points[0].x - reference.x, points[0].y - reference.y, points[0].z - reference.z).normalize();

      var base = new THREE.Vector3(0, 0, 0).crossVectors(referenceDirection, direction).normalize();

      var orderedpoints = [];

      // other lines // if inter, return location + angle
      for (var j = 0; j < points.length; j++) {
        var point = new THREE.Vector3(points[j].x, points[j].y, points[j].z);
        point.direction = new THREE.Vector3(points[j].x - reference.x, points[j].y - reference.y, points[j].z - reference.z).normalize();

        var x = referenceDirection.dot(point.direction);
        var y = base.dot(point.direction);
        point.xy = { x: x, y: y };

        var theta = Math.atan2(y, x) * (180 / Math.PI);
        point.angle = theta;

        orderedpoints.push(point);
      }

      orderedpoints.sort(function (a, b) {
        return a.angle - b.angle;
      });

      var noDups = [orderedpoints[0]];
      var epsilon = 0.0001;
      for (var i = 1; i < orderedpoints.length; i++) {
        if (Math.abs(orderedpoints[i - 1].angle - orderedpoints[i].angle) > epsilon) {
          noDups.push(orderedpoints[i]);
        }
      }

      return noDups;
    }
  }]);

  return GeometriesSlice;
}(THREE.ShapeGeometry);

exports.default = GeometriesSlice;

},{"../core/core.intersections":3}],7:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/** * Imports ***/

/**
 * @module helpers/border
 */
var HelpersBorder = function (_THREE$Object3D) {
  _inherits(HelpersBorder, _THREE$Object3D);

  function HelpersBorder(helpersSlice) {
    _classCallCheck(this, HelpersBorder);

    var _this = _possibleConstructorReturn(this, (HelpersBorder.__proto__ || Object.getPrototypeOf(HelpersBorder)).call(this));
    //


    _this._helpersSlice = helpersSlice;

    _this._visible = true;
    _this._color = 0xff0000;
    _this._material = null;
    _this._geometry = null;
    _this._mesh = null;

    _this._create();
    return _this;
  }

  _createClass(HelpersBorder, [{
    key: '_create',
    value: function _create() {
      if (!this._material) {
        this._material = new THREE.LineBasicMaterial({
          color: this._color,
          linewidth: 1
        });
      }

      //
      if (!this._helpersSlice.geometry.vertices) {
        return;
      }

      this._geometry = new THREE.Geometry();
      for (var i = 0; i < this._helpersSlice.geometry.vertices.length; i++) {
        this._geometry.vertices.push(this._helpersSlice.geometry.vertices[i]);
      }
      this._geometry.vertices.push(this._helpersSlice.geometry.vertices[0]);

      this._mesh = new THREE.Line(this._geometry, this._material);
      if (this._helpersSlice.aabbSpace === 'IJK') {
        this._mesh.applyMatrix(this._helpersSlice.stack.ijk2LPS);
      }
      this._mesh.visible = this._visible;

      // and add it!
      this.add(this._mesh);
    }
  }, {
    key: '_update',
    value: function _update() {
      // update slice
      if (this._mesh) {
        this.remove(this._mesh);
        this._mesh.geometry.dispose();
        this._mesh = null;
      }

      this._create();
    }
  }, {
    key: 'helpersSlice',
    set: function set(helpersSlice) {
      this._helpersSlice = helpersSlice;
      this._update();
    },
    get: function get() {
      return this._helpersSlice;
    }
  }, {
    key: 'visible',
    set: function set(visible) {
      this._visible = visible;
      if (this._mesh) {
        this._mesh.visible = this._visible;
      }
    },
    get: function get() {
      return this._visible;
    }
  }, {
    key: 'color',
    set: function set(color) {
      this._color = color;
      if (this._material) {
        this._material.color.set(this._color);
      }
    },
    get: function get() {
      return this._color;
    }
  }]);

  return HelpersBorder;
}(THREE.Object3D);

exports.default = HelpersBorder;

},{}],8:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * @module helpers/boundingbox
 */

var HelpersBoundingBox = function (_THREE$Object3D) {
  _inherits(HelpersBoundingBox, _THREE$Object3D);

  function HelpersBoundingBox(stack) {
    _classCallCheck(this, HelpersBoundingBox);

    // private vars
    var _this = _possibleConstructorReturn(this, (HelpersBoundingBox.__proto__ || Object.getPrototypeOf(HelpersBoundingBox)).call(this));
    //


    _this._stack = stack;
    _this._visible = true;
    _this._color = 0xFFFFFF;
    _this._material = null;
    _this._geometry = null;
    _this._mesh = null;

    // create object
    _this._create();
    return _this;
  }

  // getters/setters


  _createClass(HelpersBoundingBox, [{
    key: "_create",

    // private methods
    value: function _create() {
      // Convenience vars
      var dimensions = this._stack.dimensionsIJK;
      var halfDimensions = this._stack.halfDimensionsIJK;
      var offset = new THREE.Vector3(-0.5, -0.5, -0.5);

      // Geometry
      this._geometry = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
      // position bbox in image space
      this._geometry.applyMatrix(new THREE.Matrix4().makeTranslation(halfDimensions.x + offset.x, halfDimensions.y + offset.y, halfDimensions.z + offset.z));

      // Mesh
      var boxMesh = new THREE.Mesh(this._geometry, new THREE.MeshBasicMaterial(0xff0000));
      this._mesh = new THREE.BoxHelper(boxMesh, this._color);

      // Material
      this._material = this._mesh.material;

      // position bbox in world space
      this._mesh.applyMatrix(this._stack.ijk2LPS);
      this._mesh.visible = this._visible;

      // and add it!
      this.add(this._mesh);
    }
  }, {
    key: "_update",
    value: function _update() {
      // update slice
      if (this._mesh) {
        this.remove(this._mesh);
        this._mesh.geometry.dispose();
        this._mesh.geometry = null;
        this._mesh.material.dispose();
        this._mesh.material = null;
        this._mesh = null;
      }

      this._create();
    }
  }, {
    key: "visible",
    set: function set(visible) {
      this._visible = visible;
      if (this._mesh) {
        this._mesh.visible = this._visible;
      }
    },
    get: function get() {
      return this._visible;
    }
  }, {
    key: "color",
    set: function set(color) {
      this._color = color;
      if (this._material) {
        this._material.color.set(this._color);
      }
    },
    get: function get() {
      return this._color;
    }
  }]);

  return HelpersBoundingBox;
}(THREE.Object3D);

exports.default = HelpersBoundingBox;

},{}],9:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

/**
 * Helpers material mixin.
 *
 * @module helpers/material/mixin
 */

var HerlpersMaterialMixin = function HerlpersMaterialMixin(superclass) {
  return function (_superclass) {
    _inherits(_class, _superclass);

    function _class() {
      _classCallCheck(this, _class);

      return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).apply(this, arguments));
    }

    _createClass(_class, [{
      key: "_createMaterial",
      value: function _createMaterial(extraOptions) {
        // generate shaders on-demand!
        var fs = new this._shadersFragment(this._uniforms);
        var vs = new this._shadersVertex();

        // material
        var globalOptions = {
          uniforms: this._uniforms,
          vertexShader: vs.compute(),
          fragmentShader: fs.compute()
        };

        var options = Object.assign(extraOptions, globalOptions);
        this._material = new THREE.ShaderMaterial(options);
        this._material.needsUpdate = true;
      }
    }, {
      key: "_updateMaterial",
      value: function _updateMaterial() {
        // generate shaders on-demand!
        var fs = new this._shadersFragment(this._uniforms);
        var vs = new this._shadersVertex();

        this._material.vertexShader = vs.compute();
        this._material.fragmentShader = fs.compute();

        this._material.needsUpdate = true;
      }
    }, {
      key: "_prepareTexture",
      value: function _prepareTexture() {
        this._textures = [];
        for (var m = 0; m < this._stack._rawData.length; m++) {
          var tex = new THREE.DataTexture(this._stack.rawData[m], this._stack.textureSize, this._stack.textureSize, this._stack.textureType, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
          tex.needsUpdate = true;
          tex.flipY = true;
          this._textures.push(tex);
        }
      }
    }]);

    return _class;
  }(superclass);
};

exports.default = HerlpersMaterialMixin;

},{}],10:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _geometries = require('../geometries/geometries.slice');

var _geometries2 = _interopRequireDefault(_geometries);

var _shadersData = require('../shaders/shaders.data.uniform');

var _shadersData2 = _interopRequireDefault(_shadersData);

var _shadersData3 = require('../shaders/shaders.data.vertex');

var _shadersData4 = _interopRequireDefault(_shadersData3);

var _shadersData5 = require('../shaders/shaders.data.fragment');

var _shadersData6 = _interopRequireDefault(_shadersData5);

var _helpersMaterial = require('../helpers/helpers.material.mixin');

var _helpersMaterial2 = _interopRequireDefault(_helpersMaterial);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
} /** * Imports ***/

/**
 * @module helpers/slice
 */
//export default class LoadersVolumes extends LoadersBase {
var HelpersSlice = function (_HelpersMaterialMixin) {
  _inherits(HelpersSlice, _HelpersMaterialMixin);

  function HelpersSlice(stack) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new THREE.Vector3(0, 0, 0);
    var direction = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new THREE.Vector3(0, 0, 1);
    var aabbSpace = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 'IJK';

    _classCallCheck(this, HelpersSlice);

    // private vars
    var _this = _possibleConstructorReturn(this, (HelpersSlice.__proto__ || Object.getPrototypeOf(HelpersSlice)).call(this));
    //


    _this._stack = stack;

    // image settings
    // index only used to grab window/level and intercept/slope
    _this._invert = _this._stack.invert;

    _this._lut = 'none';
    _this._lutTexture = null;
    // if auto === true, get from index
    // else from stack which holds the default values
    _this._intensityAuto = true;
    _this._interpolation = 1; // default to trilinear interpolation
    // starts at 0
    _this._index = index;
    _this._windowWidth = null;
    _this._windowCenter = null;
    _this._rescaleSlope = null;
    _this._rescaleIntercept = null;

    _this._canvasWidth = 0;
    _this._canvasHeight = 0;
    _this._borderColor = null;

    // Object3D settings
    // shape
    _this._planePosition = position;
    _this._planeDirection = direction;
    // change aaBBSpace changes the box dimensions
    // also changes the transform
    // there is also a switch to move back mesh to LPS space automatically
    _this._aaBBspace = aabbSpace; // or LPS -> different transforms, esp for the geometry/mesh
    _this._material = null;
    _this._textures = [];
    _this._shadersFragment = _shadersData6.default;
    _this._shadersVertex = _shadersData4.default;
    _this._uniforms = _shadersData2.default.uniforms();
    _this._geometry = null;
    _this._mesh = null;
    _this._visible = true;

    // update dimensions, center, etc.
    // depending on aaBBSpace
    _this._init();

    // update object
    _this._create();
    return _this;
  }

  // getters/setters

  _createClass(HelpersSlice, [{
    key: '_init',
    value: function _init() {
      if (!this._stack || !this._stack._prepared || !this._stack._packed) {
        return;
      }

      if (this._aaBBspace === 'IJK') {
        this._halfDimensions = this._stack.halfDimensionsIJK;
        this._center = new THREE.Vector3(this._stack.halfDimensionsIJK.x - 0.5, this._stack.halfDimensionsIJK.y - 0.5, this._stack.halfDimensionsIJK.z - 0.5);
        this._toAABB = new THREE.Matrix4();
      } else {
        // LPS
        var aaBBox = this._stack.AABBox();
        this._halfDimensions = aaBBox.clone().multiplyScalar(0.5);
        this._center = this._stack.centerAABBox();
        this._toAABB = this._stack.lps2AABB;
      }
    }

    // private methods

  }, {
    key: '_create',
    value: function _create() {
      if (!this._stack || !this._stack.prepared || !this._stack.packed) {
        return;
      }

      // Convenience vars
      try {
        this._geometry = new _geometries2.default(this._halfDimensions, this._center, this._planePosition, this._planeDirection, this._toAABB);
      } catch (e) {
        window.console.log(e);
        window.console.log('invalid slice geometry - exiting...');
        return;
      }

      if (!this._geometry.vertices) {
        return;
      }

      if (!this._material) {
        //
        this._uniforms.uTextureSize.value = this._stack.textureSize;
        this._uniforms.uDataDimensions.value = [this._stack.dimensionsIJK.x, this._stack.dimensionsIJK.y, this._stack.dimensionsIJK.z];
        this._uniforms.uWorldToData.value = this._stack.lps2IJK;
        this._uniforms.uNumberOfChannels.value = this._stack.numberOfChannels;
        this._uniforms.uPixelType.value = this._stack.pixelType;
        this._uniforms.uBitsAllocated.value = this._stack.bitsAllocated;
        this._uniforms.uPackedPerPixel.value = this._stack.packedPerPixel;
        // compute texture if material exist
        this._prepareTexture();
        this._uniforms.uTextureContainer.value = this._textures;

        this._createMaterial({
          side: THREE.DoubleSide
        });
      }

      // update intensity related stuff
      this.updateIntensitySettings();
      this.updateIntensitySettingsUniforms();

      // create the mesh!
      this._mesh = new THREE.Mesh(this._geometry, this._material);
      if (this._aaBBspace === 'IJK') {
        this._mesh.applyMatrix(this._stack.ijk2LPS);
      }

      this._mesh.visible = this._visible;

      // and add it!
      this.add(this._mesh);
    }
  }, {
    key: 'updateIntensitySettings',
    value: function updateIntensitySettings() {
      // if auto, get from frame index
      if (this._intensityAuto) {
        this.updateIntensitySetting('windowCenter');
        this.updateIntensitySetting('windowWidth');
        this.updateIntensitySetting('rescaleSlope');
        this.updateIntensitySetting('rescaleIntercept');
      } else {
        if (this._windowCenter === null) {
          this._windowCenter = this._stack.windowCenter;
        }

        if (this.__windowWidth === null) {
          this._windowWidth = this._stack.windowWidth;
        }

        if (this._rescaleSlope === null) {
          this._rescaleSlope = this._stack.rescaleSlope;
        }

        if (this._rescaleIntercept === null) {
          this._rescaleIntercept = this._stack.rescaleIntercept;
        }
      }
    }
  }, {
    key: 'updateIntensitySettingsUniforms',
    value: function updateIntensitySettingsUniforms() {
      // compensate for the offset to only pass > 0 values to shaders
      // models > models.stack.js : _packTo8Bits
      var offset = 0;
      if (this._stack._minMax[0] < 0) {
        offset -= this._stack._minMax[0];
      }

      // set slice window center and width
      this._uniforms.uRescaleSlopeIntercept.value = [this._rescaleSlope, this._rescaleIntercept];
      this._uniforms.uWindowCenterWidth.value = [offset + this._windowCenter, this._windowWidth];

      // invert
      this._uniforms.uInvert.value = this._invert === true ? 1 : 0;

      // interpolation
      this._uniforms.uInterpolation.value = this._interpolation;

      // lut
      if (this._lut === 'none') {
        this._uniforms.uLut.value = 0;
      } else {
        this._uniforms.uLut.value = 1;
        this._uniforms.uTextureLUT.value = this._lutTexture;
      }
    }
  }, {
    key: 'updateIntensitySetting',
    value: function updateIntensitySetting(setting) {
      if (this._stack.frame[this._index] && this._stack.frame[this._index][setting]) {
        this['_' + setting] = this._stack.frame[this._index][setting];
      } else {
        this['_' + setting] = this._stack[setting];
      }
    }
  }, {
    key: '_update',
    value: function _update() {
      // update slice
      if (this._mesh) {
        this.remove(this._mesh);
        this._mesh.geometry.dispose();
        this._mesh.geometry = null;
        // we do not want to dispose the texture!
        // this._mesh.material.dispose();
        // this._mesh.material = null;
        this._mesh = null;
      }

      this._create();
    }
  }, {
    key: 'cartesianEquation',
    value: function cartesianEquation() {
      // Make sure we have a geometry
      if (!this._geometry || !this._geometry.vertices || this._geometry.vertices.length < 3) {
        return new THREE.Vector4();
      }

      var vertices = this._geometry.vertices;
      var dataToWorld = this._stack.ijk2LPS;
      var p1 = new THREE.Vector3(vertices[0].x, vertices[0].y, vertices[0].z).applyMatrix4(dataToWorld);
      var p2 = new THREE.Vector3(vertices[1].x, vertices[1].y, vertices[1].z).applyMatrix4(dataToWorld);
      var p3 = new THREE.Vector3(vertices[2].x, vertices[2].y, vertices[2].z).applyMatrix4(dataToWorld);
      var v1 = new THREE.Vector3();
      var v2 = new THREE.Vector3();
      var normal = v1.subVectors(p3, p2).cross(v2.subVectors(p1, p2)).normalize();

      return new THREE.Vector4(normal.x, normal.y, normal.z, -normal.dot(p1));
    }
  }, {
    key: 'stack',
    get: function get() {
      return this._stack;
    },
    set: function set(stack) {
      this._stack = stack;
    }
  }, {
    key: 'windowWidth',
    get: function get() {
      return this._windowWidth;
    },
    set: function set(windowWidth) {
      this._windowWidth = windowWidth;
      this.updateIntensitySettingsUniforms();
    }
  }, {
    key: 'windowCenter',
    get: function get() {
      return this._windowCenter;
    },
    set: function set(windowCenter) {
      this._windowCenter = windowCenter;
      this.updateIntensitySettingsUniforms();
    }
  }, {
    key: 'rescaleSlope',
    get: function get() {
      return this._rescaleSlope;
    },
    set: function set(rescaleSlope) {
      this._rescaleSlope = rescaleSlope;
      this.updateIntensitySettingsUniforms();
    }
  }, {
    key: 'rescaleIntercept',
    get: function get() {
      return this._rescaleIntercept;
    },
    set: function set(rescaleIntercept) {
      this._rescaleIntercept = rescaleIntercept;
      this.updateIntensitySettingsUniforms();
    }
  }, {
    key: 'invert',
    get: function get() {
      return this._invert;
    },
    set: function set(invert) {
      this._invert = invert;
      this.updateIntensitySettingsUniforms();
    }
  }, {
    key: 'lut',
    get: function get() {
      return this._lut;
    },
    set: function set(lut) {
      this._lut = lut;
    }
  }, {
    key: 'lutTexture',
    get: function get() {
      return this._lutTexture;
    },
    set: function set(lutTexture) {
      this._lutTexture = lutTexture;
      this.updateIntensitySettingsUniforms();
    }
  }, {
    key: 'intensityAuto',
    get: function get() {
      return this._intensityAuto;
    },
    set: function set(intensityAuto) {
      this._intensityAuto = intensityAuto;
      this.updateIntensitySettings();
      this.updateIntensitySettingsUniforms();
    }
  }, {
    key: 'interpolation',
    get: function get() {
      return this._interpolation;
    },
    set: function set(interpolation) {
      this._interpolation = interpolation;
      this.updateIntensitySettingsUniforms();
      this._updateMaterial();
    }
  }, {
    key: 'index',
    get: function get() {
      return this._index;
    },
    set: function set(index) {
      this._index = index;
      this._update();
    }
  }, {
    key: 'planePosition',
    set: function set(position) {
      this._planePosition = position;
      this._update();
    },
    get: function get() {
      return this._planePosition;
    }
  }, {
    key: 'planeDirection',
    set: function set(direction) {
      this._planeDirection = direction;
      this._update();
    },
    get: function get() {
      return this._planeDirection;
    }
  }, {
    key: 'halfDimensions',
    set: function set(halfDimensions) {
      this._halfDimensions = halfDimensions;
    },
    get: function get() {
      return this._halfDimensions;
    }
  }, {
    key: 'center',
    set: function set(center) {
      this._center = center;
    },
    get: function get() {
      return this._center;
    }
  }, {
    key: 'aabbSpace',
    set: function set(aabbSpace) {
      this._aaBBspace = aabbSpace;
      this._init();
    },
    get: function get() {
      return this._aaBBspace;
    }
  }, {
    key: 'mesh',
    set: function set(mesh) {
      this._mesh = mesh;
    },
    get: function get() {
      return this._mesh;
    }
  }, {
    key: 'geometry',
    set: function set(geometry) {
      this._geometry = geometry;
    },
    get: function get() {
      return this._geometry;
    }
  }, {
    key: 'canvasWidth',
    set: function set(canvasWidth) {
      this._canvasWidth = canvasWidth;
      this._uniforms.uCanvasWidth.value = this._canvasWidth;
    },
    get: function get() {
      return this._canvasWidth;
    }
  }, {
    key: 'canvasHeight',
    set: function set(canvasHeight) {
      this._canvasHeight = canvasHeight;
      this._uniforms.uCanvasHeight.value = this._canvasHeight;
    },
    get: function get() {
      return this._canvasHeight;
    }
  }, {
    key: 'borderColor',
    set: function set(borderColor) {
      this._borderColor = borderColor;
      this._uniforms.uBorderColor.value = new THREE.Color(borderColor);
    },
    get: function get() {
      return this._borderColor;
    }
  }]);

  return HelpersSlice;
}((0, _helpersMaterial2.default)(THREE.Object3D));

exports.default = HelpersSlice;

},{"../geometries/geometries.slice":6,"../helpers/helpers.material.mixin":9,"../shaders/shaders.data.fragment":18,"../shaders/shaders.data.uniform":19,"../shaders/shaders.data.vertex":20}],11:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _helpers = require('../helpers/helpers.border');

var _helpers2 = _interopRequireDefault(_helpers);

var _helpers3 = require('../helpers/helpers.boundingbox');

var _helpers4 = _interopRequireDefault(_helpers3);

var _helpers5 = require('../helpers/helpers.slice');

var _helpers6 = _interopRequireDefault(_helpers5);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
} /** * Imports ***/

/**
 * Helper to easily display and interact with a stack.<br>
 *<br>
 * Defaults:<br>
 *   - orientation: 0 (acquisition direction)<br>
 *   - index: middle slice in acquisition direction<br>
 *<br>
 * Features:<br>
 *   - slice from the stack (in any direction)<br>
 *   - slice border<br>
 *   - stack bounding box<br>
 *<br>
 * Live demo at: {@link http://jsfiddle.net/gh/get/library/pure/fnndsc/ami/tree/master/lessons/01#run|Lesson 01}
 *
 * @example
 * let stack = new VJS.Models.Stack();
 * ... // prepare the stack
 *
 * let stackHelper = new VJS.Helpers.Stack(stack);
 * stackHelper.bbox.color = 0xF9F9F9;
 * stackHelper.border.color = 0xF9F9F9;
 *
 * let scene = new THREE.Scene();
 * scene.add(stackHelper);
 *
 * @extends THREE.Object3D
 *
 * @see module:helpers/border
 * @see module:helpers/boundingbox
 * @see module:helpers/slice
 *
 * @module helpers/stack
 */
var HelpersStack = function (_THREE$Object3D) {
  _inherits(HelpersStack, _THREE$Object3D);

  function HelpersStack(stack) {
    _classCallCheck(this, HelpersStack);

    var _this = _possibleConstructorReturn(this, (HelpersStack.__proto__ || Object.getPrototypeOf(HelpersStack)).call(this));
    //


    _this._stack = stack;
    _this._bBox = null;
    _this._slice = null;
    _this._border = null;
    _this._dummy = null;

    _this._orientation = 0;
    _this._index = 0;

    _this._uniforms = null;
    _this._autoWindowLevel = false;
    _this._outOfBounds = false;
    _this._orientationMaxIndex = 0;

    _this._canvasWidth = 0;
    _this._canvasHeight = 0;
    _this._borderColor = null;

    // this._arrow = {
    //   visible: true,
    //   color: 0xFFF336,
    //   length: 20,
    //   material: null,
    //   geometry: null,
    //   mesh: null
    // };
    _this._create();
    return _this;
  }

  //
  // PUBLIC METHODS
  //

  //
  // SETTERS/GETTERS
  //

  /**
   * Get stack.
   *
   * @type {ModelsStack}
   */

  _createClass(HelpersStack, [{
    key: '_create',

    //
    // PRIVATE METHODS
    //

    /**
     * Initial setup, including stack prepare, bbox prepare, slice prepare and
     * border prepare.
     *
     * @private
     */
    value: function _create() {
      if (this._stack) {
        // prepare sthe stack internals
        this._prepareStack();

        // prepare visual objects
        this._prepareBBox();
        this._prepareSlice();
        this._prepareBorder();
        // todo: Arrow
      } else {
        window.console.log('no stack to be prepared...');
      }
    }
  }, {
    key: '_computeOrientationMaxIndex',
    value: function _computeOrientationMaxIndex() {
      var dimensionsIJK = this._stack.dimensionsIJK;
      this._orientationMaxIndex = 0;
      switch (this._orientation) {
        case 0:
          this._orientationMaxIndex = dimensionsIJK.z - 1;
          break;
        case 1:
          this._orientationMaxIndex = dimensionsIJK.x - 1;
          break;
        case 2:
          this._orientationMaxIndex = dimensionsIJK.y - 1;
          break;
        default:
          // do nothing!
          break;
      }
    }

    /**
     * Given orientation, check if index is in/out of bounds.
     *
     * @private
     */

  }, {
    key: '_isIndexOutOfBounds',
    value: function _isIndexOutOfBounds() {
      this._computeOrientationMaxIndex();
      if (this._index >= this._orientationMaxIndex || this._index < 0) {
        this._outOfBounds = true;
      } else {
        this._outOfBounds = false;
      }
    }

    /**
     * Prepare a stack for visualization. (image to world transform, frames order,
     * pack data into 8 bits textures, etc.)
     *
     * @private
     */

  }, {
    key: '_prepareStack',
    value: function _prepareStack() {
      // make sure there is something, if not throw an error
      // compute image to workd transform, order frames, etc.
      if (!this._stack.prepared) {
        this._stack.prepare();
      }
      // pack data into 8 bits rgba texture for the shader
      // this one can be slow...
      if (!this._stack.packed) {
        this._stack.pack();
      }
    }

    /**
     * Setup bounding box helper given prepared stack and add bounding box helper
     * to stack helper.
     *
     * @private
     */

  }, {
    key: '_prepareBBox',
    value: function _prepareBBox() {
      this._bBox = new _helpers4.default(this._stack);
      this.add(this._bBox);
    }

    /**
     * Setup border helper given slice helper and add border helper
     * to stack helper.
     *
     * @private
     */

  }, {
    key: '_prepareBorder',
    value: function _prepareBorder() {
      this._border = new _helpers2.default(this._slice);
      this.add(this._border);
    }

    /**
     * Setup slice helper given prepared stack helper and add slice helper
     * to stack helper.
     *
     * @private
     */

  }, {
    key: '_prepareSlice',
    value: function _prepareSlice() {
      var halfDimensionsIJK = this._stack.halfDimensionsIJK;
      // compute initial index given orientation
      this._index = this._prepareSliceIndex(halfDimensionsIJK);
      // compute initial position given orientation and index
      var position = this._prepareSlicePosition(halfDimensionsIJK, this._index);
      // compute initial direction orientation
      var direction = this._prepareDirection(this._orientation);

      this._slice = new _helpers6.default(this._stack, this._index, position, direction);
      this.add(this._slice);
    }

    /**
     * Compute slice index depending on orientation.
     *
     * @param {THREE.Vector3} indices - Indices in each direction.
     *
     * @returns {number} Slice index according to current orientation.
     *
     * @private
     */

  }, {
    key: '_prepareSliceIndex',
    value: function _prepareSliceIndex(indices) {
      var index = 0;
      switch (this._orientation) {
        case 0:
          index = Math.floor(indices.z);
          break;
        case 1:
          index = Math.floor(indices.x);
          break;
        case 2:
          index = Math.floor(indices.y);
          break;
        default:
          // do nothing!
          break;
      }
      return index;
    }

    /**
     * Compute slice position depending on orientation.
     * Sets index in proper location of reference position.
     *
     * @param {THREE.Vector3} rPosition - Reference position.
     * @param {number} index - Current index.
     *
     * @returns {number} Slice index according to current orientation.
     *
     * @private
     */

  }, {
    key: '_prepareSlicePosition',
    value: function _prepareSlicePosition(rPosition, index) {
      var position = new THREE.Vector3(0, 0, 0);
      switch (this._orientation) {
        case 0:
          position = new THREE.Vector3(Math.floor(rPosition.x), Math.floor(rPosition.y), index);
          break;
        case 1:
          position = new THREE.Vector3(index, Math.floor(rPosition.y), Math.floor(rPosition.z));
          break;
        case 2:
          position = new THREE.Vector3(Math.floor(rPosition.x), index, Math.floor(rPosition.z));
          break;
        default:
          // do nothing!
          break;
      }
      return position;
    }

    /**
     * Compute slice direction depending on orientation.
     *
     * @param {number} orientation - Slice orientation.
     *
     * @returns {THREE.Vector3} Slice direction
     *
     * @private
     */

  }, {
    key: '_prepareDirection',
    value: function _prepareDirection(orientation) {
      var direction = new THREE.Vector3(0, 0, 1);
      switch (orientation) {
        case 0:
          direction = new THREE.Vector3(0, 0, 1);
          break;
        case 1:
          direction = new THREE.Vector3(1, 0, 0);
          break;
        case 2:
          direction = new THREE.Vector3(0, 1, 0);
          break;
        default:
          // do nothing!
          break;
      }

      return direction;
    }
  }, {
    key: 'stack',
    get: function get() {
      return this._stack;
    }

    /**
     * Get bounding box helper.
     *
     * @type {HelpersBoundingBox}
     */

  }, {
    key: 'bbox',
    get: function get() {
      return this._bBox;
    }

    /**
     * Get slice helper.
     *
     * @type {HelpersSlice}
     */

  }, {
    key: 'slice',
    get: function get() {
      return this._slice;
    }

    /**
     * Get border helper.
     *
     * @type {HelpersSlice}
     */

  }, {
    key: 'border',
    get: function get() {
      return this._border;
    }

    /**
     * Set/get current slice index.<br>
     * Sets outOfBounds flag to know if target index is in/out stack bounding box.<br>
     * <br>
     * Internally updates the sliceHelper index and position. Also updates the
     * borderHelper with the updated sliceHelper.
     *
     * @type {number}
     */

  }, {
    key: 'index',
    get: function get() {
      return this._index;
    },
    set: function set(index) {
      this._index = index;

      // update the slice
      this._slice.index = index;
      var halfDimensions = this._stack.halfDimensionsIJK;
      this._slice.planePosition = this._prepareSlicePosition(halfDimensions, this._index);

      // also update the border
      this._border.helpersSlice = this._slice;

      // update ourOfBounds flag
      this._isIndexOutOfBounds();
    }

    /**
     * Set/get current slice orientation.<br>
     * Values: <br>
     *   - 0: acquisition direction (slice normal is z_cosine)<br>
     *   - 1: next direction (slice normal is x_cosine)<br>
     *   - 2: next direction (slice normal is y_cosine)<br>
     *   - n: set orientation to 0<br>
     * <br>
     * Internally updates the sliceHelper direction. Also updates the
     * borderHelper with the updated sliceHelper.
     *
     * @type {number}
     */

  }, {
    key: 'orientation',
    set: function set(orientation) {
      this._orientation = orientation;
      this._computeOrientationMaxIndex();

      this._slice.planeDirection = this._prepareDirection(this._orientation);

      // also update the border
      this._border.helpersSlice = this._slice;
    },
    get: function get() {
      return this._orientation;
    }

    /**
     * Set/get the outOfBound flag.
     *
     * @type {boolean}
     */

  }, {
    key: 'outOfBounds',
    set: function set(outOfBounds) {
      this._outOfBounds = outOfBounds;
    },
    get: function get() {
      return this._outOfBounds;
    }

    /**
     * Set/get the orientationMaxIndex flag.
     *
     * @type {boolean}
     */

  }, {
    key: 'orientationMaxIndex',
    set: function set(orientationMaxIndex) {
      this._orientationMaxIndex = orientationMaxIndex;
    },
    get: function get() {
      return this._orientationMaxIndex;
    }
  }, {
    key: 'canvasWidth',
    set: function set(canvasWidth) {
      this._canvasWidth = canvasWidth;
      this._slice.canvasWidth = this._canvasWidth;
    },
    get: function get() {
      return this._canvasWidth;
    }
  }, {
    key: 'canvasHeight',
    set: function set(canvasHeight) {
      this._canvasHeight = canvasHeight;
      this._slice.canvasHeight = this._canvasHeight;
    },
    get: function get() {
      return this._canvasHeight;
    }
  }, {
    key: 'borderColor',
    set: function set(borderColor) {
      this._borderColor = borderColor;
      this._border.color = borderColor;
      this._slice.borderColor = this._borderColor;
    },
    get: function get() {
      return this._borderColor;
    }
  }]);

  return HelpersStack;
}(THREE.Object3D);

exports.default = HelpersStack;

},{"../helpers/helpers.border":7,"../helpers/helpers.boundingbox":8,"../helpers/helpers.slice":10}],12:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _shaders = require('../shaders.base');

var _shaders2 = _interopRequireDefault(_shaders);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Texture3d = function (_ShadersBase) {
  _inherits(Texture3d, _ShadersBase);

  function Texture3d() {
    _classCallCheck(this, Texture3d);

    var _this = _possibleConstructorReturn(this, (Texture3d.__proto__ || Object.getPrototypeOf(Texture3d)).call(this));

    _this.name = 'texture3d';

    // default properties names
    _this._dataCoordinates = 'dataCoordinates';
    _this._dataValue = 'dataValue';
    _this._offset = 'offset';
    return _this;
  }

  _createClass(Texture3d, [{
    key: 'api',
    value: function api() {
      var baseFragment = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._base;
      var dataCoordinates = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._dataCoordinates;
      var dataValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._dataValue;
      var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this._offset;

      this._base = baseFragment;
      return this.compute(dataCoordinates, dataValue, offset);
    }
  }, {
    key: 'compute',
    value: function compute(dataCoordinates, dataValue, offset) {
      this.computeDefinition();
      this._base._functions[this._name] = this._definition;
      return this._name + '(' + dataCoordinates + ', ' + dataValue + ', ' + offset + ');';
    }
  }, {
    key: 'computeDefinition',
    value: function computeDefinition() {
      this._definition = '\nvoid ' + this._name + '(in ivec3 dataCoordinates, out vec4 dataValue, out int offset){\n    \n  int index = dataCoordinates.x\n            + dataCoordinates.y * uDataDimensions.x\n            + dataCoordinates.z * uDataDimensions.y * uDataDimensions.x;\n  int indexP = int(index/uPackedPerPixel);\n  offset = index - 2*indexP;\n\n  // Map data index to right sampler2D texture\n  int voxelsPerTexture = uTextureSize*uTextureSize;\n  int textureIndex = int(floor(float(indexP) / float(voxelsPerTexture)));\n  // modulo seems incorrect sometimes...\n  // int inTextureIndex = int(mod(float(index), float(textureSize*textureSize)));\n  int inTextureIndex = indexP - voxelsPerTexture*textureIndex;\n\n  // Get row and column in the texture\n  int colIndex = int(mod(float(inTextureIndex), float(uTextureSize)));\n  int rowIndex = int(floor(float(inTextureIndex)/float(uTextureSize)));\n\n  // Map row and column to uv\n  vec2 uv = vec2(0,0);\n  uv.x = (0.5 + float(colIndex)) / float(uTextureSize);\n  uv.y = 1. - (0.5 + float(rowIndex)) / float(uTextureSize);\n\n  //\n  if(textureIndex == 0){ dataValue = texture2D(uTextureContainer[0], uv); }\n  else if(textureIndex == 1){dataValue = texture2D(uTextureContainer[1], uv);}\n  else if(textureIndex == 2){ dataValue = texture2D(uTextureContainer[2], uv); }\n  else if(textureIndex == 3){ dataValue = texture2D(uTextureContainer[3], uv); }\n  else if(textureIndex == 4){ dataValue = texture2D(uTextureContainer[4], uv); }\n  else if(textureIndex == 5){ dataValue = texture2D(uTextureContainer[5], uv); }\n  else if(textureIndex == 6){ dataValue = texture2D(uTextureContainer[6], uv); }\n\n}\n    ';
    }
  }]);

  return Texture3d;
}(_shaders2.default);

exports.default = new Texture3d();

},{"../shaders.base":17}],13:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _shaders = require('../shaders.base');

var _shaders2 = _interopRequireDefault(_shaders);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Unpack = function (_ShadersBase) {
  _inherits(Unpack, _ShadersBase);

  function Unpack() {
    _classCallCheck(this, Unpack);

    var _this = _possibleConstructorReturn(this, (Unpack.__proto__ || Object.getPrototypeOf(Unpack)).call(this));

    _this.name = 'unpack';

    // default properties names
    _this._packedData = 'packedData';
    _this._offset = 'offset';
    _this._unpackedData = 'unpackedData';

    _this._base._uniforms = {
      uNumberOfChannels: {
        value: 1
      },
      uBitsAllocated: {
        value: 16
      },
      uPixelType: {
        value: 0
      }
    };
    return _this;
  }

  _createClass(Unpack, [{
    key: 'api',
    value: function api() {
      var baseFragment = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._base;
      var packedData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._packedData;
      var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._offset;
      var unpackedData = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this._unpackedData;

      this._base = baseFragment;
      return this.compute(packedData, offset, unpackedData);
    }
  }, {
    key: 'compute',
    value: function compute(packedData, offset, unpackedData) {
      this.computeDefinition();
      this._base._functions[this._name] = this._definition;
      return this._name + '(' + packedData + ', ' + offset + ', ' + unpackedData + ');';
    }
  }, {
    key: 'computeDefinition',
    value: function computeDefinition() {
      // fun stuff
      var content = '';
      if (this._base._uniforms.uNumberOfChannels.value === 1) {
        switch (this._base._uniforms.uBitsAllocated.value) {

          case 1:
          case 8:
            content = this.upack8();
            break;

          case 16:
            content = this.upack16();
            break;

          case 32:
            content = this.upack32();
            break;

          default:
            content = this.upackDefault();
            break;

        }
      } else {
        content = this.upackIdentity();
      }

      this._definition = '\nvoid ' + this._name + '(in vec4 packedData, in int offset, out vec4 unpackedData){\n\n' + content + '\n\n}  \n    ';
    }
  }, {
    key: 'upack8',
    value: function upack8() {
      this._base._functions['uInt8'] = this.uInt8();

      return '\nuInt8(\n  packedData.r,\n  unpackedData.x);\n    ';
    }
  }, {
    key: 'upack16',
    value: function upack16() {
      this._base._functions['uInt16'] = this.uInt16();

      return '\nuInt16(\n  packedData.r * float( 1 - offset) + packedData.b * float(offset),\n  packedData.g * float( 1 - offset) + packedData.a * float(offset),\n  unpackedData.x);\n    ';
    }
  }, {
    key: 'upack32',
    value: function upack32() {
      if (this._base._uniforms.uPixelType.value === 0) {
        this._base._functions['uInt32'] = this.uInt32();

        return '\nuInt32(\n  packedData.r,\n  packedData.g,\n  packedData.b,\n  packedData.a,\n  unpackedData.x);\n      ';
      } else {
        this._base._functions['uFloat32'] = this.uFloat32();

        return '\nuFloat32(\n  packedData.r,\n  packedData.g,\n  packedData.b,\n  packedData.a,\n  unpackedData.x);\n      ';
      }
    }
  }, {
    key: 'upackIdentity',
    value: function upackIdentity() {
      return '\n\nunpackedData = packedData;\n\n      ';
    }
  }, {
    key: 'uInt8',
    value: function uInt8() {
      return '\nvoid uInt8(in float r, out float value){\n  value = r * 256.;\n}\n    ';
    }
  }, {
    key: 'uInt16',
    value: function uInt16() {
      return '\nvoid uInt16(in float r, in float a, out float value){\n  value = r * 256. + a * 65536.;\n}\n    ';
    }
  }, {
    key: 'uInt32',
    value: function uInt32() {
      return '\nvoid uInt32(in float r, in float g, in float b, in float a, out float value){\n  value = r * 256. + g * 65536. + b * 16777216. + a * 4294967296.;\n}\n    ';
    }
  }, {
    key: 'uFloat32',
    value: function uFloat32() {
      return '\nvoid uFloat32(in float r, in float g, in float b, in float a, out float value){\n\n  // create arrays containing bits for rgba values\n  // value between 0 and 255\n  value = r * 255.;\n  int bytemeR[8];\n  bytemeR[0] = int(floor(value / 128.));\n  value -= float(bytemeR[0] * 128);\n  bytemeR[1] = int(floor(value / 64.));\n  value -= float(bytemeR[1] * 64);\n  bytemeR[2] = int(floor(value / 32.));\n  value -= float(bytemeR[2] * 32);\n  bytemeR[3] = int(floor(value / 16.));\n  value -= float(bytemeR[3] * 16);\n  bytemeR[4] = int(floor(value / 8.));\n  value -= float(bytemeR[4] * 8);\n  bytemeR[5] = int(floor(value / 4.));\n  value -= float(bytemeR[5] * 4);\n  bytemeR[6] = int(floor(value / 2.));\n  value -= float(bytemeR[6] * 2);\n  bytemeR[7] = int(floor(value));\n\n  value = g * 255.;\n  int bytemeG[8];\n  bytemeG[0] = int(floor(value / 128.));\n  value -= float(bytemeG[0] * 128);\n  bytemeG[1] = int(floor(value / 64.));\n  value -= float(bytemeG[1] * 64);\n  bytemeG[2] = int(floor(value / 32.));\n  value -= float(bytemeG[2] * 32);\n  bytemeG[3] = int(floor(value / 16.));\n  value -= float(bytemeG[3] * 16);\n  bytemeG[4] = int(floor(value / 8.));\n  value -= float(bytemeG[4] * 8);\n  bytemeG[5] = int(floor(value / 4.));\n  value -= float(bytemeG[5] * 4);\n  bytemeG[6] = int(floor(value / 2.));\n  value -= float(bytemeG[6] * 2);\n  bytemeG[7] = int(floor(value));\n\n  value = b * 255.;\n  int bytemeB[8];\n  bytemeB[0] = int(floor(value / 128.));\n  value -= float(bytemeB[0] * 128);\n  bytemeB[1] = int(floor(value / 64.));\n  value -= float(bytemeB[1] * 64);\n  bytemeB[2] = int(floor(value / 32.));\n  value -= float(bytemeB[2] * 32);\n  bytemeB[3] = int(floor(value / 16.));\n  value -= float(bytemeB[3] * 16);\n  bytemeB[4] = int(floor(value / 8.));\n  value -= float(bytemeB[4] * 8);\n  bytemeB[5] = int(floor(value / 4.));\n  value -= float(bytemeB[5] * 4);\n  bytemeB[6] = int(floor(value / 2.));\n  value -= float(bytemeB[6] * 2);\n  bytemeB[7] = int(floor(value));\n\n  value = a * 255.;\n  int bytemeA[8];\n  bytemeA[0] = int(floor(value / 128.));\n  value -= float(bytemeA[0] * 128);\n  bytemeA[1] = int(floor(value / 64.));\n  value -= float(bytemeA[1] * 64);\n  bytemeA[2] = int(floor(value / 32.));\n  value -= float(bytemeA[2] * 32);\n  bytemeA[3] = int(floor(value / 16.));\n  value -= float(bytemeA[3] * 16);\n  bytemeA[4] = int(floor(value / 8.));\n  value -= float(bytemeA[4] * 8);\n  bytemeA[5] = int(floor(value / 4.));\n  value -= float(bytemeA[5] * 4);\n  bytemeA[6] = int(floor(value / 2.));\n  value -= float(bytemeA[6] * 2);\n  bytemeA[7] = int(floor(value));\n\n  // compute float32 value from bit arrays\n\n  // sign\n  int issigned = 1 - 2 * bytemeR[0];\n  //   issigned = int(pow(-1., float(bytemeR[0])));\n\n  // exponent\n  int exponent = 0;\n\n  exponent += bytemeR[1] * int(pow(2., 7.));\n  exponent += bytemeR[2] * int(pow(2., 6.));\n  exponent += bytemeR[3] * int(pow(2., 5.));\n  exponent += bytemeR[4] * int(pow(2., 4.));\n  exponent += bytemeR[5] * int(pow(2., 3.));\n  exponent += bytemeR[6] * int(pow(2., 2.));\n  exponent += bytemeR[7] * int(pow(2., 1.));\n\n  exponent += bytemeG[0];\n\n\n  // fraction\n  float fraction = 0.;\n\n  fraction = float(bytemeG[1]) * pow(2., -1.);\n  fraction += float(bytemeG[2]) * pow(2., -2.);\n  fraction += float(bytemeG[3]) * pow(2., -3.);\n  fraction += float(bytemeG[4]) * pow(2., -4.);\n  fraction += float(bytemeG[5]) * pow(2., -5.);\n  fraction += float(bytemeG[6]) * pow(2., -6.);\n  fraction += float(bytemeG[7]) * pow(2., -7.);\n\n  fraction += float(bytemeB[0]) * pow(2., -8.);\n  fraction += float(bytemeB[1]) * pow(2., -9.);\n  fraction += float(bytemeB[2]) * pow(2., -10.);\n  fraction += float(bytemeB[3]) * pow(2., -11.);\n  fraction += float(bytemeB[4]) * pow(2., -12.);\n  fraction += float(bytemeB[5]) * pow(2., -13.);\n  fraction += float(bytemeB[6]) * pow(2., -14.);\n  fraction += float(bytemeB[7]) * pow(2., -15.);\n\n  fraction += float(bytemeA[0]) * pow(2., -16.);\n  fraction += float(bytemeA[1]) * pow(2., -17.);\n  fraction += float(bytemeA[2]) * pow(2., -18.);\n  fraction += float(bytemeA[3]) * pow(2., -19.);\n  fraction += float(bytemeA[4]) * pow(2., -20.);\n  fraction += float(bytemeA[5]) * pow(2., -21.);\n  fraction += float(bytemeA[6]) * pow(2., -22.);\n  fraction += float(bytemeA[7]) * pow(2., -23.);\n\n  value = float(issigned) * pow( 2., float(exponent - 127)) * (1. + fraction);\n}\n    ';
    }
  }]);

  return Unpack;
}(_shaders2.default);

exports.default = new Unpack();

},{"../shaders.base":17}],14:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _shaders = require('../shaders.base');

var _shaders2 = _interopRequireDefault(_shaders);

var _shadersHelpers = require('../helpers/shaders.helpers.unpack');

var _shadersHelpers2 = _interopRequireDefault(_shadersHelpers);

var _shadersHelpers3 = require('../helpers/shaders.helpers.texture3d');

var _shadersHelpers4 = _interopRequireDefault(_shadersHelpers3);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var InterpolationIdentity = function (_ShadersBase) {
  _inherits(InterpolationIdentity, _ShadersBase);

  function InterpolationIdentity() {
    _classCallCheck(this, InterpolationIdentity);

    var _this = _possibleConstructorReturn(this, (InterpolationIdentity.__proto__ || Object.getPrototypeOf(InterpolationIdentity)).call(this));

    _this.name = 'interpolationIdentity';

    // default properties names
    _this._currentVoxel = 'currentVoxel';
    _this._dataValue = 'dataValue';
    return _this;
  }

  _createClass(InterpolationIdentity, [{
    key: 'api',
    value: function api() {
      var baseFragment = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._base;
      var currentVoxel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._currentVoxel;
      var dataValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._dataValue;

      this._base = baseFragment;
      return this.compute(currentVoxel, dataValue);
    }
  }, {
    key: 'compute',
    value: function compute(currentVoxel, dataValue) {
      this.computeDefinition();
      this._base._functions[this._name] = this._definition;
      return this._name + '(' + currentVoxel + ', ' + dataValue + ');';
    }
  }, {
    key: 'computeDefinition',
    value: function computeDefinition() {
      this._definition = '\nvoid ' + this._name + '(in vec3 currentVoxel, out vec4 dataValue){\n  // lower bound\n  vec3 rcurrentVoxel = vec3(floor(currentVoxel.x + 0.5 ), floor(currentVoxel.y + 0.5 ), floor(currentVoxel.z + 0.5 ));\n  ivec3 voxel = ivec3(int(rcurrentVoxel.x), int(rcurrentVoxel.y), int(rcurrentVoxel.z));\n\n  vec4 tmp = vec4(0., 0., 0., 0.);\n  int offset = 0;\n\n  ' + _shadersHelpers4.default.api(this._base, 'voxel', 'tmp', 'offset') + '\n  ' + _shadersHelpers2.default.api(this._base, 'tmp', 'offset', 'dataValue') + '\n}\n    ';
    }
  }]);

  return InterpolationIdentity;
}(_shaders2.default);

exports.default = new InterpolationIdentity();

},{"../helpers/shaders.helpers.texture3d":12,"../helpers/shaders.helpers.unpack":13,"../shaders.base":17}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shadersInterpolation = require('./shaders.interpolation.identity');

var _shadersInterpolation2 = _interopRequireDefault(_shadersInterpolation);

var _shadersInterpolation3 = require('./shaders.interpolation.trilinear');

var _shadersInterpolation4 = _interopRequireDefault(_shadersInterpolation3);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function shadersInterpolation(baseFragment, currentVoxel, dataValue, gradient) {
  switch (baseFragment._uniforms.uInterpolation.value) {

    case 0:
      // no interpolation
      return _shadersInterpolation2.default.api(baseFragment, currentVoxel, dataValue);

    case 1:
      // trilinear interpolation
      return _shadersInterpolation4.default.api(baseFragment, currentVoxel, dataValue, gradient);

    default:
      return _shadersInterpolation2.default.api(baseFragment, currentVoxel, dataValue);

  }
}

exports.default = shadersInterpolation;

},{"./shaders.interpolation.identity":14,"./shaders.interpolation.trilinear":16}],16:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _shaders = require('../shaders.base');

var _shaders2 = _interopRequireDefault(_shaders);

var _shadersInterpolation = require('./shaders.interpolation.identity');

var _shadersInterpolation2 = _interopRequireDefault(_shadersInterpolation);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
  }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var InterpolationTrilinear = function (_ShadersBase) {
  _inherits(InterpolationTrilinear, _ShadersBase);

  function InterpolationTrilinear() {
    _classCallCheck(this, InterpolationTrilinear);

    var _this = _possibleConstructorReturn(this, (InterpolationTrilinear.__proto__ || Object.getPrototypeOf(InterpolationTrilinear)).call(this));

    _this.name = 'interpolationTrilinear';

    // default properties names
    _this._currentVoxel = 'currentVoxel';
    _this._dataValue = 'dataValue';
    _this._gradient = 'gradient';
    return _this;
  }

  _createClass(InterpolationTrilinear, [{
    key: 'api',
    value: function api() {
      var baseFragment = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._base;
      var currentVoxel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._currentVoxel;
      var dataValue = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._dataValue;
      var gradient = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this._gradient;

      this._base = baseFragment;
      return this.compute(currentVoxel, dataValue, gradient);
    }
  }, {
    key: 'compute',
    value: function compute(currentVoxel, dataValue, gradient) {
      this.computeDefinition();
      this._base._functions[this._name] = this._definition;
      return this._name + '(' + currentVoxel + ', ' + dataValue + ', ' + gradient + ');';
    }
  }, {
    key: 'computeDefinition',
    value: function computeDefinition() {
      this._definition = '\nvoid ' + this._name + '(in vec3 currentVoxel, out vec4 dataValue, out vec3 gradient){\n\n  // https://en.wikipedia.org/wiki/Trilinear_interpolation\n  vec3 lower_bound = vec3(floor(currentVoxel.x), floor(currentVoxel.y), floor(currentVoxel.z));\n  if(lower_bound.x < 0.){\n    lower_bound.x = 0.;\n  }\n  if(lower_bound.y < 0.){\n    lower_bound.y = 0.;\n  }\n  if(lower_bound.z < 0.){\n    lower_bound.z = 0.;\n  }\n  \n  vec3 higher_bound = lower_bound + vec3(1);\n\n  float xd = ( currentVoxel.x - lower_bound.x ) / ( higher_bound.x - lower_bound.x );\n  float yd = ( currentVoxel.y - lower_bound.y ) / ( higher_bound.y - lower_bound.y );\n  float zd = ( currentVoxel.z - lower_bound.z ) / ( higher_bound.z - lower_bound.z );\n\n  //\n  // c00\n  //\n\n  //\n\n  vec4 v000 = vec4(0.0, 0.0, 0.0, 0.0);\n  vec3 c000 = vec3(lower_bound.x, lower_bound.y, lower_bound.z);\n  ' + _shadersInterpolation2.default.api(this._base, 'c000', 'v000') + '\n  vec3 g000 = v000.r * vec3(-1., -1., -1.);\n\n  //\n\n  vec4 v100 = vec4(0.0, 0.0, 0.0, 0.0);\n  vec3 c100 = vec3(higher_bound.x, lower_bound.y, lower_bound.z);\n  ' + _shadersInterpolation2.default.api(this._base, 'c100', 'v100') + '\n  vec3 g100 = v100.r * vec3(1., -1., -1.);\n\n  vec4 c00 = v000 * ( 1.0 - xd ) + v100 * xd;\n\n  //\n  // c01\n  //\n  vec4 v001 = vec4(0.0, 0.0, 0.0, 0.0);\n  vec3 c001 = vec3(lower_bound.x, lower_bound.y, higher_bound.z);\n  ' + _shadersInterpolation2.default.api(this._base, 'c001', 'v001') + '\n  vec3 g001 = v001.r * vec3(-1., -1., 1.);\n\n  vec4 v101 = vec4(0.0, 0.0, 0.0, 0.0);\n  vec3 c101 = vec3(higher_bound.x, lower_bound.y, higher_bound.z);\n  ' + _shadersInterpolation2.default.api(this._base, 'c101', 'v101') + '\n  vec3 g101 = v101.r * vec3(1., -1., 1.);\n\n  vec4 c01 = v001 * ( 1.0 - xd ) + v101 * xd;\n\n  //\n  // c10\n  //\n  vec4 v010 = vec4(0.0, 0.0, 0.0, 0.0);\n  vec3 c010 = vec3(lower_bound.x, higher_bound.y, lower_bound.z);\n  ' + _shadersInterpolation2.default.api(this._base, 'c010', 'v010') + '\n  vec3 g010 = v010.r * vec3(-1., 1., -1.);\n\n  vec4 v110 = vec4(0.0, 0.0, 0.0, 0.0);\n  vec3 c110 = vec3(higher_bound.x, higher_bound.y, lower_bound.z);\n  ' + _shadersInterpolation2.default.api(this._base, 'c110', 'v110') + '\n  vec3 g110 = v110.r * vec3(1., 1., -1.);\n\n  vec4 c10 = v010 * ( 1.0 - xd ) + v110 * xd;\n\n  //\n  // c11\n  //\n  vec4 v011 = vec4(0.0, 0.0, 0.0, 0.0);\n  vec3 c011 = vec3(lower_bound.x, higher_bound.y, higher_bound.z);\n  ' + _shadersInterpolation2.default.api(this._base, 'c011', 'v011') + '\n  vec3 g011 = v011.r * vec3(-1., 1., 1.);\n\n  vec4 v111 = vec4(0.0, 0.0, 0.0, 0.0);\n  vec3 c111 = vec3(higher_bound.x, higher_bound.y, higher_bound.z);\n  ' + _shadersInterpolation2.default.api(this._base, 'c111', 'v111') + '\n  vec3 g111 = v111.r * vec3(1., 1., 1.);\n\n  vec4 c11 = v011 * ( 1.0 - xd ) + v111 * xd;\n\n  // c0 and c1\n  vec4 c0 = c00 * ( 1.0 - yd) + c10 * yd;\n  vec4 c1 = c01 * ( 1.0 - yd) + c11 * yd;\n\n  // c\n  vec4 c = c0 * ( 1.0 - zd) + c1 * zd;\n  dataValue = c;\n\n  // compute gradient\n  gradient = g000 + g100 + g010 + g110 + g011 + g111 + g110 + g011;\n  // gradientMagnitude = length(gradient);\n  // // https://en.wikipedia.org/wiki/Normal_(geometry)#Transforming_normals\n  // vec3 localNormal = (-1. / gradientMagnitude) * gradient;\n  // normal = normalize(normalPixelToPatient' + this.id + ' * localNormal);\n  //normal = gradient;\n\n}\n    ';
    }
  }]);

  return InterpolationTrilinear;
}(_shaders2.default);

exports.default = new InterpolationTrilinear();

},{"../shaders.base":17,"./shaders.interpolation.identity":14}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var ShadersBase = function () {
  function ShadersBase() {
    _classCallCheck(this, ShadersBase);

    this._name = 'shadersBase';
    this._base = {
      _functions: {},
      _uniforms: {}
    };
    this._definition = '';
  }

  _createClass(ShadersBase, [{
    key: 'name',
    get: function get() {
      return this._name;
    },
    set: function set(name) {
      this._name = name;
    }
  }]);

  return ShadersBase;
}();

exports.default = ShadersBase;

},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

var _shaders = require('./interpolation/shaders.interpolation');

var _shaders2 = _interopRequireDefault(_shaders);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var ShadersFragment = function () {

  // pass uniforms object
  function ShadersFragment(uniforms) {
    _classCallCheck(this, ShadersFragment);

    this._uniforms = uniforms;
    this._functions = {};
    this._main = '';
  }

  _createClass(ShadersFragment, [{
    key: 'functions',
    value: function functions() {
      if (this._main === '') {
        // if main is empty, functions can not have been computed
        this.main();
      }

      var content = '';
      for (var property in this._functions) {
        content += this._functions[property] + '\n';
      }

      return content;
    }
  }, {
    key: 'uniforms',
    value: function uniforms() {
      var content = '';
      for (var property in this._uniforms) {
        var uniform = this._uniforms[property];
        content += 'uniform ' + uniform.typeGLSL + ' ' + property;

        if (uniform && uniform.length) {
          content += '[' + uniform.length + ']';
        }

        content += ';\n';
      }

      return content;
    }
  }, {
    key: 'main',
    value: function main() {
      // need to pre-call main to fill up the functions list
      this._main = '\nvoid main(void) {\n\n  // draw border if slice is cropped\n  // float uBorderDashLength = 10.;\n\n  if( uCanvasWidth > 0. &&\n      ((gl_FragCoord.x > uBorderMargin && (gl_FragCoord.x - uBorderMargin) < uBorderWidth) ||\n       (gl_FragCoord.x < (uCanvasWidth - uBorderMargin) && (gl_FragCoord.x + uBorderMargin) > (uCanvasWidth - uBorderWidth) ))){\n    float valueY = mod(gl_FragCoord.y, 2. * uBorderDashLength);\n    if( valueY < uBorderDashLength && gl_FragCoord.y > uBorderMargin && gl_FragCoord.y < (uCanvasHeight - uBorderMargin) ){\n      gl_FragColor = vec4(uBorderColor, 1.);\n      return;\n    }\n  }\n\n  if( uCanvasHeight > 0. &&\n      ((gl_FragCoord.y > uBorderMargin && (gl_FragCoord.y - uBorderMargin) < uBorderWidth) ||\n       (gl_FragCoord.y < (uCanvasHeight - uBorderMargin) && (gl_FragCoord.y + uBorderMargin) > (uCanvasHeight - uBorderWidth) ))){\n    float valueX = mod(gl_FragCoord.x, 2. * uBorderDashLength);\n    if( valueX < uBorderDashLength && gl_FragCoord.x > uBorderMargin && gl_FragCoord.x < (uCanvasWidth - uBorderMargin) ){\n      gl_FragColor = vec4(uBorderColor, 1.);\n      return;\n    }\n  }\n\n  // get texture coordinates of current pixel\n  vec4 dataCoordinates = uWorldToData * vPos;\n  vec3 currentVoxel = vec3(dataCoordinates.x, dataCoordinates.y, dataCoordinates.z);\n  vec4 dataValue = vec4(0., 0., 0., 0.);\n  vec3 gradient = vec3(0., 0., 0.);\n  ' + (0, _shaders2.default)(this, 'currentVoxel', 'dataValue', 'gradient') + '\n\n  // how do we deal wil more than 1 channel?\n  if(uNumberOfChannels == 1){\n    float intensity = dataValue.r;\n\n    // rescale/slope\n    intensity = intensity*uRescaleSlopeIntercept[0] + uRescaleSlopeIntercept[1];\n\n    float windowMin = uWindowCenterWidth[0] - uWindowCenterWidth[1] * 0.5;\n    float windowMax = uWindowCenterWidth[0] + uWindowCenterWidth[1] * 0.5;\n    intensity = ( intensity - windowMin ) / uWindowCenterWidth[1];\n\n    dataValue.r = dataValue.g = dataValue.b = intensity;\n    dataValue.a = 1.0;\n  }\n\n  // Apply LUT table...\n  //\n  if(uLut == 1){\n    // should opacity be grabbed there?\n    dataValue = texture2D( uTextureLUT, vec2( dataValue.r , 1.0) );\n  }\n\n  if(uInvert == 1){\n    dataValue = vec4(1.) - dataValue;\n    // how do we deal with that and opacity?\n    dataValue.a = 1.;\n  }\n\n  gl_FragColor = dataValue;\n\n    // if on edge, draw line\n  // float xPos = gl_FragCoord.x/512.;\n  // float yPos = gl_FragCoord.y/512.;\n  // if( xPos < 0.05 || xPos > .95 || yPos < 0.05 || yPos > .95){\n  //   gl_FragColor = vec4(xPos, yPos, 0., 1.);//dataValue;\n  //   //return;\n  // }\n\n}\n   ';
    }
  }, {
    key: 'compute',
    value: function compute() {
      var shaderInterpolation = '';
      // shaderInterpolation.inline(args) //true/false
      // shaderInterpolation.functions(args)

      return '\n// uniforms\n' + this.uniforms() + '\n\n// varying (should fetch it from vertex directly)\nvarying vec4      vPos;\n\n// tailored functions\n' + this.functions() + '\n\n// main loop\n' + this._main + '\n      ';
    }
  }]);

  return ShadersFragment;
}();

exports.default = ShadersFragment;

},{"./interpolation/shaders.interpolation":15}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

/**
 * @module shaders/data
 */
var ShadersUniform = function () {
  function ShadersUniform() {
    _classCallCheck(this, ShadersUniform);
  }

  _createClass(ShadersUniform, null, [{
    key: 'uniforms',

    /**
     * Shaders data uniforms
     */
    value: function uniforms() {
      return {
        'uTextureSize': {
          type: 'i',
          value: 0,
          typeGLSL: 'int'
        },
        'uTextureContainer': {
          type: 'tv',
          value: [],
          typeGLSL: 'sampler2D',
          length: 7
        },
        'uDataDimensions': {
          type: 'iv',
          value: [0, 0, 0],
          typeGLSL: 'ivec3'
        },
        'uWorldToData': {
          type: 'm4',
          value: new THREE.Matrix4(),
          typeGLSL: 'mat4'
        },
        'uWindowCenterWidth': {
          type: 'fv1',
          value: [0.0, 0.0],
          typeGLSL: 'float',
          length: 2
        },
        'uRescaleSlopeIntercept': {
          type: 'fv1',
          value: [0.0, 0.0],
          typeGLSL: 'float',
          length: 2
        },
        'uNumberOfChannels': {
          type: 'i',
          value: 1,
          typeGLSL: 'int'
        },
        'uBitsAllocated': {
          type: 'i',
          value: 8,
          typeGLSL: 'int'
        },
        'uInvert': {
          type: 'i',
          value: 0,
          typeGLSL: 'int'
        },
        'uLut': {
          type: 'i',
          value: 0,
          typeGLSL: 'int'
        },
        'uTextureLUT': {
          type: 't',
          value: [],
          typeGLSL: 'sampler2D'
        },
        'uPixelType': {
          type: 'i',
          value: 0,
          typeGLSL: 'int'
        },
        'uPackedPerPixel': {
          type: 'i',
          value: 1,
          typeGLSL: 'int'
        },
        'uInterpolation': {
          type: 'i',
          value: 1,
          typeGLSL: 'int'
        },
        'uCanvasWidth': {
          type: 'f',
          value: 0.,
          typeGLSL: 'float'
        },
        'uCanvasHeight': {
          type: 'f',
          value: 0.,
          typeGLSL: 'float'
        },
        'uBorderColor': {
          type: 'v3',
          value: [1.0, 0.0, 0.5],
          typeGLSL: 'vec3'
        },
        'uBorderWidth': {
          type: 'f',
          value: 2.,
          typeGLSL: 'float'
        },
        'uBorderMargin': {
          type: 'f',
          value: 2.,
          typeGLSL: 'float'
        },
        'uBorderDashLength': {
          type: 'f',
          value: 10.,
          typeGLSL: 'float'
        }
      };
    }
  }]);

  return ShadersUniform;
}();

exports.default = ShadersUniform;

},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var ShadersVertex = function () {
    function ShadersVertex() {
        _classCallCheck(this, ShadersVertex);
    }

    _createClass(ShadersVertex, [{
        key: "compute",
        value: function compute() {
            return "\nvarying vec4 vPos;\n\n//\n// main\n//\nvoid main() {\n\n  vPos = modelMatrix * vec4(position, 1.0 );\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );\n\n}\n        ";
        }
    }]);

    return ShadersVertex;
}();

exports.default = ShadersVertex;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsZXNzb25zLzExL2RlbW8uanMiLCJzcmMvY29udHJvbHMvY29udHJvbHMudHJhY2tiYWxsLmpzIiwic3JjL2NvcmUvY29yZS5pbnRlcnNlY3Rpb25zLmpzIiwic3JjL2NvcmUvY29yZS51dGlscy5qcyIsInNyYy9jb3JlL2NvcmUudmFsaWRhdG9ycy5qcyIsInNyYy9nZW9tZXRyaWVzL2dlb21ldHJpZXMuc2xpY2UuanMiLCJzcmMvaGVscGVycy9oZWxwZXJzLmJvcmRlci5qcyIsInNyYy9oZWxwZXJzL2hlbHBlcnMuYm91bmRpbmdib3guanMiLCJzcmMvaGVscGVycy9oZWxwZXJzLm1hdGVyaWFsLm1peGluLmpzIiwic3JjL2hlbHBlcnMvaGVscGVycy5zbGljZS5qcyIsInNyYy9oZWxwZXJzL2hlbHBlcnMuc3RhY2suanMiLCJzcmMvc2hhZGVycy9oZWxwZXJzL3NoYWRlcnMuaGVscGVycy50ZXh0dXJlM2QuanMiLCJzcmMvc2hhZGVycy9oZWxwZXJzL3NoYWRlcnMuaGVscGVycy51bnBhY2suanMiLCJzcmMvc2hhZGVycy9pbnRlcnBvbGF0aW9uL3NoYWRlcnMuaW50ZXJwb2xhdGlvbi5pZGVudGl0eS5qcyIsInNyYy9zaGFkZXJzL2ludGVycG9sYXRpb24vc2hhZGVycy5pbnRlcnBvbGF0aW9uLmpzIiwic3JjL3NoYWRlcnMvaW50ZXJwb2xhdGlvbi9zaGFkZXJzLmludGVycG9sYXRpb24udHJpbGluZWFyLmpzIiwic3JjL3NoYWRlcnMvc2hhZGVycy5iYXNlLmpzIiwic3JjL3NoYWRlcnMvc2hhZGVycy5kYXRhLmZyYWdtZW50LmpzIiwic3JjL3NoYWRlcnMvc2hhZGVycy5kYXRhLnVuaWZvcm0uanMiLCJzcmMvc2hhZGVycy9zaGFkZXJzLmRhdGEudmVydGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQTs7OztBQUNBOzs7Ozs7OztBQUNBO0FBSkE7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NkJBQWM7OEJBRWI7Ozs7O2tDQUVTLEFBQ047bUJBYUg7Ozs7Ozs7a0IsQUFwQmdCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIGdsb2JhbHMgU3RhdHMsIGRhdCovXG5cbmltcG9ydCBDb250cm9sc1RyYWNrYmFsbCBmcm9tICcuLi8uLi9zcmMvY29udHJvbHMvY29udHJvbHMudHJhY2tiYWxsJztcbmltcG9ydCBIZWxwZXJzU3RhY2sgZnJvbSAnLi4vLi4vc3JjL2hlbHBlcnMvaGVscGVycy5zdGFjayc7XG4vL2ltcG9ydCBMb2FkZXJzVm9sdW1lIGZyb20gJy4uLy4uL3NyYy9sb2FkZXJzL2xvYWRlcnMudm9sdW1lJztcbnZhciBMb2FkZXJzVm9sdW1lID0gQU1JLmRlZmF1bHQuTG9hZGVycy5Wb2x1bWU7XG5cblxuLy8gc3RhbmRhcmQgZ2xvYmFsIGxldGlhYmxlc1xubGV0IGNvbnRyb2xzLCByZW5kZXJlciwgc3RhdHMsIHNjZW5lLCBjYW1lcmEsIHN0YWNrSGVscGVyLCB0aHJlZUQsIHJlYWR5O1xuXG52YXIgbWVzaCA9IG51bGw7XG4vL0xvYWQgU1RMIG1vZGVsXG52YXIgbG9hZGVyU1RMID0gbmV3IFRIUkVFLlNUTExvYWRlcigpO1xubG9hZGVyU1RMLmxvYWQoJ1dNLnN0bCcsXG4gIGZ1bmN0aW9uKGdlb21ldHJ5KSB7XG4gICAgdmFyIG1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKFxuICAgICAge2NvbG9yOiAweEY0NDMzNiwgc3BlY3VsYXI6IDB4MTExMTExLCBzaGluaW5lc3M6IDIwMH0pO1xuICAgIG1lc2ggPSBuZXcgVEhSRUUuTWVzaChnZW9tZXRyeSwgbWF0ZXJpYWwpO1xuICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICAvLyB0byBMUFMgc3BhY2VcbiAgICB2YXIgUkFTVG9MUFMgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuICAgIFJBU1RvTFBTLnNldCgtMSwgMCwgMCwgMCxcbiAgICAgICAgICAgICAgICAgIDAsIC0xLCAwLCAwLFxuICAgICAgICAgICAgICAgICAgMCwgMCwgMSwgMCxcbiAgICAgICAgICAgICAgICAgIDAsIDAsIDAsIDEpO1xuICAgIG1lc2guYXBwbHlNYXRyaXgoUkFTVG9MUFMpO1xuICAgIHNjZW5lLmFkZChtZXNoKTtcbiAgICAgIFxuICAgIHJlYWR5ID0gdHJ1ZTtcbn0pO1xuXG4gLy8gaW5zdGFudGlhdGUgdGhlIGxvYWRlclxuICAvLyBpdCBsb2FkcyBhbmQgcGFyc2VzIHRoZSBkaWNvbSBpbWFnZVxubGV0IGxvYWRlciA9IG5ldyBMb2FkZXJzVm9sdW1lKHRocmVlRCk7XG5sZXQgdDIgPSBbJ2JyYWluXzAwMScsICdicmFpbl8wMDInLCAnYnJhaW5fMDAzJywgJ2JyYWluXzAwNCcsICdicmFpbl8wMDUnLCAnYnJhaW5fMDA2JywgJ2JyYWluXzAwNycsICdicmFpbl8wMDgnLCAnYnJhaW5fMDA5JywgJ2JyYWluXzAxMCcsICdicmFpbl8wMTEnLCAnYnJhaW5fMDEyJywgJ2JyYWluXzAxMycsICdicmFpbl8wMTQnLCAnYnJhaW5fMDE1JywgJ2JyYWluXzAxNicsICdicmFpbl8wMTcnLCAnYnJhaW5fMDE4JywgJ2JyYWluXzAxOScsICdicmFpbl8wMjAnXTtcbmxldCBmaWxlcyA9IHQyLm1hcChmdW5jdGlvbih2KSB7XG4gIHJldHVybiAnRElDT00vJyArIHYgKyAnLmRjbSc7XG59KTtcblxuXG5mdW5jdGlvbiB1cGRhdGVHZW9tZXRyaWVzKCkge1xuICBpZiAoc3RhY2tIZWxwZXIpIHtcbiAgICAvLyB1cGRhdGUgZGF0YSBtYXRlcmlhbFxuICAgIGlmIChyZWFkeSl7XG4gICAgICBtZXNoLm1hdGVyaWFsID0gc3RhY2tIZWxwZXIuc2xpY2UubWVzaC5tYXRlcmlhbDt9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgLy8gdGhpcyBmdW5jdGlvbiBpcyBleGVjdXRlZCBvbiBlYWNoIGFuaW1hdGlvbiBmcmFtZVxuICBmdW5jdGlvbiBhbmltYXRlKCkge1xuICAgIHZhciB0aW1lciA9IERhdGUubm93KCkgKiAwLjAwMDI1O1xuICAgIFxuICAgIHBhcnRpY2xlTGlnaHQucG9zaXRpb24ueCA9IDEuMiAqIE1hdGguc2luKHRpbWVyICogNykgKiAxMDA7XG4gICAgcGFydGljbGVMaWdodC5wb3NpdGlvbi55ID0gMS4yICogTWF0aC5jb3ModGltZXIgKiA1KSAqIDEyMDtcbiAgICBwYXJ0aWNsZUxpZ2h0LnBvc2l0aW9uLnogPSAxLjIgKiBNYXRoLmNvcyh0aW1lciAqIDMpICogMTQwO1xuXHQgIFxuICAgIHVwZGF0ZUdlb21ldHJpZXMoKTtcblxuICAgIGNvbnRyb2xzLnVwZGF0ZSgpO1xuICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICBzdGF0cy51cGRhdGUoKTtcblxuICAgIC8vIHJlcXVlc3QgbmV3IGZyYW1lXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgICAgYW5pbWF0ZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gcmVuZGVyZXJcbiAgdGhyZWVEID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3IzZCcpO1xuICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHtcbiAgICBhbnRpYWxpYXM6IHRydWUsXG4gIH0pO1xuICByZW5kZXJlci5zZXRTaXplKHRocmVlRC5vZmZzZXRXaWR0aCwgdGhyZWVELm9mZnNldEhlaWdodCk7XG4gIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHgxMDEwMTAsIDEpOyAvLygweDM1MzUzNSwgMSk7XG4gIHJlbmRlcmVyLnNldFBpeGVsUmF0aW8od2luZG93LmRldmljZVBpeGVsUmF0aW8pO1xuICB0aHJlZUQuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgLy8gc3RhdHNcbiAgc3RhdHMgPSBuZXcgU3RhdHMoKTtcbiAgdGhyZWVELmFwcGVuZENoaWxkKHN0YXRzLmRvbUVsZW1lbnQpO1xuXG4gIC8vIHNjZW5lXG4gIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG5cbiAgLy8gY2FtZXJhXG4gIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg0NSwgdGhyZWVELm9mZnNldFdpZHRoIC8gdGhyZWVELm9mZnNldEhlaWdodCwgMC4wMSwgMTAwMCk7XG4gIGNhbWVyYS5wb3NpdGlvbi54ID0gNTAwOyAvLzE1MFxuICBjYW1lcmEucG9zaXRpb24ueSA9IDA7IC8vMTUwXG4gIGNhbWVyYS5wb3NpdGlvbi56ID0gMDsgLy8xMDBcblxuICAvLyBjb250cm9sc1xuICBjb250cm9scyA9IG5ldyBDb250cm9sc1RyYWNrYmFsbChjYW1lcmEsIHRocmVlRCk7XG4gIGNvbnRyb2xzLnJvdGF0ZVNwZWVkID0gMS40O1xuICBjb250cm9scy56b29tU3BlZWQgPSAxLjI7XG4gIGNvbnRyb2xzLnBhblNwZWVkID0gMC44O1xuICBjb250cm9scy5ub1pvb20gPSBmYWxzZTtcbiAgY29udHJvbHMubm9QYW4gPSBmYWxzZTtcbiAgY29udHJvbHMuZHluYW1pY0RhbXBpbmdGYWN0b3IgPSAwLjM7XG4gICAgXG4gIC8vIFNldHVwIGxpZ2h0c1xuICB2YXIgcGFydGljbGVMaWdodCA9IG5ldyBUSFJFRS5NZXNoKFxuICAgIG5ldyBUSFJFRS5TcGhlcmVCdWZmZXJHZW9tZXRyeSg0LCA4LCA4KSxcbiAgICBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe2NvbG9yOiAweGZmZmZmZn0pKTtcbiAgc2NlbmUuYWRkKHBhcnRpY2xlTGlnaHQpO1xuICBcbiAgc2NlbmUuYWRkKG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoMHgyMjIyMjIpKTtcbiAgXG4gIHZhciBkaXJlY3Rpb25hbExpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIDEpO1xuICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnNldCgxLCAxLCAxKS5ub3JtYWxpemUoKTtcbiAgc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQpO1xuICBcbiAgdmFyIHBvaW50TGlnaHQgPSBuZXcgVEhSRUUuUG9pbnRMaWdodCgweGZmZmZmZiwgMiwgODAwKTtcbiAgcGFydGljbGVMaWdodC5hZGQocG9pbnRMaWdodCk7XG4gIFxuICAgIGFuaW1hdGUoKTtcblxufVxuXG5cblxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAvLyBpbml0IHRocmVlSlMuLi5cbiAgaW5pdCgpO1xuXG4gXG5cbiAgXG4gIGxvYWRlci5sb2FkKGZpbGVzKVxuICAudGhlbihmdW5jdGlvbigpIHtcbiAgICBsZXQgc2VyaWVzID0gbG9hZGVyLmRhdGFbMF0ubWVyZ2VTZXJpZXMobG9hZGVyLmRhdGEpWzBdO1xuICAgIGxldCBzdGFjayA9IHNlcmllcy5zdGFja1swXTtcbiAgICBzdGFja0hlbHBlciA9IG5ldyBIZWxwZXJzU3RhY2soc3RhY2spO1xuICAgIGxldCBjZW50ZXJMUFMgPSBzdGFja0hlbHBlci5zdGFjay53b3JsZENlbnRlcigpO1xuICAgIC8vc2NlbmUuYWRkKHN0YWNrSGVscGVyKTtcblxuXG4gICAgLy8gdXBkYXRlIGNhbXJlYSdzIGFuZCBjb250cm9sJ3MgdGFyZ2V0XG4gICAgY2FtZXJhLmxvb2tBdChjZW50ZXJMUFMueCwgY2VudGVyTFBTLnksIGNlbnRlckxQUy56KTtcbiAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgIGNvbnRyb2xzLnRhcmdldC5zZXQoY2VudGVyTFBTLngsIGNlbnRlckxQUy55LCBjZW50ZXJMUFMueik7XG5cbiAgICAvLyBjcmVhdGUgR1VJIC8gY29uZmlndXRhcmlvbiBkaXNwbGF5IFxuICAgIGxldCBndWkgPSBuZXcgZGF0LkdVSSh7XG4gICAgICBhdXRvUGxhY2U6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgbGV0IGN1c3RvbUNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdteS1ndWktY29udGFpbmVyJyk7XG4gICAgY3VzdG9tQ29udGFpbmVyLmFwcGVuZENoaWxkKGd1aS5kb21FbGVtZW50KTtcbiAgICBjdXN0b21Db250YWluZXIgPSBudWxsO1xuXG4gICAgbGV0IHBvc2l0aW9uRm9sZGVyID0gZ3VpLmFkZEZvbGRlcignQ29uZmlndXJhdGlvbicpO1xuICAgIGxldCB3b3JsZEJCb3ggPSBzdGFja0hlbHBlci5zdGFjay53b3JsZEJvdW5kaW5nQm94KCk7XG4gICAgbGV0IGludGVycG9sYXRpb24gPSBwb3NpdGlvbkZvbGRlci5hZGQoc3RhY2tIZWxwZXIuc2xpY2UsICdpbnRlcnBvbGF0aW9uJyxcbiAgICAgIDAsIDEpLnN0ZXAoMSkubGlzdGVuKCk7XG4gICAgcG9zaXRpb25Gb2xkZXIub3BlbigpO1xuXG4gICAgLy9mcmFtZUluZGV4Q29udHJvbGxlck9yaWdpbkkub25DaGFuZ2UodXBkYXRlR2VvbWV0cmllcyk7XG4gICAgLy9mcmFtZUluZGV4Q29udHJvbGxlck9yaWdpbkoub25DaGFuZ2UodXBkYXRlR2VvbWV0cmllcyk7XG4gICAgLy9mcmFtZUluZGV4Q29udHJvbGxlck9yaWdpbksub25DaGFuZ2UodXBkYXRlR2VvbWV0cmllcyk7XG5cbiAgICBsb2FkZXIuZnJlZSgpO1xuICAgIGxvYWRlciA9IG51bGw7XG5cbiAgICBmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZSgpIHtcbiAgICAgIGNhbWVyYS5hc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG5cbiAgICAgIHJlbmRlcmVyLnNldFNpemUod2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodCk7XG4gICAgfVxuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSk7XG4gIH0pXG4gIC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xuICAgIHdpbmRvdy5jb25zb2xlLmxvZygnb29wcy4uLiBzb21ldGhpbmcgd2VudCB3cm9uZy4uLicpO1xuICAgIHdpbmRvdy5jb25zb2xlLmxvZyhlcnJvcik7XG4gIH0pO1xufTtcblxuXG4iLCIvKipcbiAqIE9yaWdpbmFsIGF1dGhvcnMgZnJvbSBUSFJFRUpTIHJlcG9cbiAqIEBhdXRob3IgRWJlcmhhcmQgR3JhZXRoZXIgLyBodHRwOi8vZWdyYWV0aGVyLmNvbS9cbiAqIEBhdXRob3IgTWFyayBMdW5kaW4gIC8gaHR0cDovL21hcmstbHVuZGluLmNvbVxuICogQGF1dGhvciBTaW1vbmUgTWFuaW5pIC8gaHR0cDovL2Rhcm9uMTMzNy5naXRodWIuaW9cbiAqIEBhdXRob3IgTHVjYSBBbnRpZ2EgIC8gaHR0cDovL2xhbnRpZ2EuZ2l0aHViLmlvXG4gKi9cblxuIGV4cG9ydCBkZWZhdWx0IGNsYXNzIFRyYWNrYmFsbCBleHRlbmRzIFRIUkVFLkV2ZW50RGlzcGF0Y2hlciB7XG4gIGNvbnN0cnVjdG9yKG9iamVjdCwgZG9tRWxlbWVudCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICBsZXQgX3RoaXMgPSB0aGlzO1xuICAgIGxldCBTVEFURSA9IHtOT05FOiAtMSwgUk9UQVRFOiAwLCBaT09NOiAxLCBQQU46IDIsIFRPVUNIX1JPVEFURTogMywgVE9VQ0hfWk9PTTogNCwgVE9VQ0hfUEFOOiA1LCBDVVNUT006IDk5fTtcblxuICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgIHRoaXMuZG9tRWxlbWVudCA9IChkb21FbGVtZW50ICE9PSB1bmRlZmluZWQpID8gZG9tRWxlbWVudCA6IGRvY3VtZW50O1xuXG4gICAgLy8gQVBJXG5cbiAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgdGhpcy5zY3JlZW4gPSB7bGVmdDogMCwgdG9wOiAwLCB3aWR0aDogMCwgaGVpZ2h0OiAwfTtcblxuICAgIHRoaXMucm90YXRlU3BlZWQgPSAxLjA7XG4gICAgdGhpcy56b29tU3BlZWQgPSAxLjI7XG4gICAgdGhpcy5wYW5TcGVlZCA9IDAuMztcblxuICAgIHRoaXMubm9Sb3RhdGUgPSBmYWxzZTtcbiAgICB0aGlzLm5vWm9vbSA9IGZhbHNlO1xuICAgIHRoaXMubm9QYW4gPSBmYWxzZTtcbiAgICB0aGlzLm5vQ3VzdG9tID0gZmFsc2U7XG5cbiAgICB0aGlzLmZvcmNlU3RhdGUgPSAtMTtcblxuICAgIHRoaXMuc3RhdGljTW92aW5nID0gZmFsc2U7XG4gICAgdGhpcy5keW5hbWljRGFtcGluZ0ZhY3RvciA9IDAuMjtcblxuICAgIHRoaXMubWluRGlzdGFuY2UgPSAwO1xuICAgIHRoaXMubWF4RGlzdGFuY2UgPSBJbmZpbml0eTtcblxuICAgIHRoaXMua2V5cyA9IFs2NSAvKiBBKi8sIDgzIC8qIFMqLywgNjhdO1xuXG4gICAgLy8gaW50ZXJuYWxzXG5cbiAgICB0aGlzLnRhcmdldCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICBsZXQgRVBTID0gMC4wMDAwMDE7XG5cbiAgICBsZXQgbGFzdFBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIGxldCBfc3RhdGUgPSBTVEFURS5OT05FLFxuICAgIF9wcmV2U3RhdGUgPSBTVEFURS5OT05FLFxuXG4gICAgX2V5ZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCksXG5cbiAgICBfbW92ZVByZXYgPSBuZXcgVEhSRUUuVmVjdG9yMigpLFxuICAgIF9tb3ZlQ3VyciA9IG5ldyBUSFJFRS5WZWN0b3IyKCksXG5cbiAgICBfbGFzdEF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMygpLFxuICAgIF9sYXN0QW5nbGUgPSAwLFxuXG4gICAgX3pvb21TdGFydCA9IG5ldyBUSFJFRS5WZWN0b3IyKCksXG4gICAgX3pvb21FbmQgPSBuZXcgVEhSRUUuVmVjdG9yMigpLFxuXG4gICAgX3RvdWNoWm9vbURpc3RhbmNlU3RhcnQgPSAwLFxuICAgIF90b3VjaFpvb21EaXN0YW5jZUVuZCA9IDAsXG5cbiAgICBfcGFuU3RhcnQgPSBuZXcgVEhSRUUuVmVjdG9yMigpLFxuICAgIF9wYW5FbmQgPSBuZXcgVEhSRUUuVmVjdG9yMigpLFxuXG4gICAgX2N1c3RvbVN0YXJ0ID0gbmV3IFRIUkVFLlZlY3RvcjIoKSxcbiAgICBfY3VzdG9tRW5kID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblxuICAgIC8vIGZvciByZXNldFxuXG4gICAgdGhpcy50YXJnZXQwID0gdGhpcy50YXJnZXQuY2xvbmUoKTtcbiAgICB0aGlzLnBvc2l0aW9uMCA9IHRoaXMub2JqZWN0LnBvc2l0aW9uLmNsb25lKCk7XG4gICAgdGhpcy51cDAgPSB0aGlzLm9iamVjdC51cC5jbG9uZSgpO1xuXG4gICAgLy8gZXZlbnRzXG5cbiAgICBsZXQgY2hhbmdlRXZlbnQgPSB7dHlwZTogJ2NoYW5nZSd9O1xuICAgIGxldCBzdGFydEV2ZW50ID0ge3R5cGU6ICdzdGFydCd9O1xuICAgIGxldCBlbmRFdmVudCA9IHt0eXBlOiAnZW5kJ307XG5cbiAgICAvLyBtZXRob2RzXG5cbiAgICB0aGlzLmhhbmRsZVJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuZG9tRWxlbWVudCA9PT0gZG9jdW1lbnQpIHtcbiAgICAgICAgdGhpcy5zY3JlZW4ubGVmdCA9IDA7XG4gICAgICAgIHRoaXMuc2NyZWVuLnRvcCA9IDA7XG4gICAgICAgIHRoaXMuc2NyZWVuLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMuc2NyZWVuLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBib3ggPSB0aGlzLmRvbUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIC8vIGFkanVzdG1lbnRzIGNvbWUgZnJvbSBzaW1pbGFyIGNvZGUgaW4gdGhlIGpxdWVyeSBvZmZzZXQoKSBmdW5jdGlvblxuICAgICAgICBsZXQgZCA9IHRoaXMuZG9tRWxlbWVudC5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgdGhpcy5zY3JlZW4ubGVmdCA9IGJveC5sZWZ0ICsgd2luZG93LnBhZ2VYT2Zmc2V0IC0gZC5jbGllbnRMZWZ0O1xuICAgICAgICB0aGlzLnNjcmVlbi50b3AgPSBib3gudG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0IC0gZC5jbGllbnRUb3A7XG4gICAgICAgIHRoaXMuc2NyZWVuLndpZHRoID0gYm94LndpZHRoO1xuICAgICAgICB0aGlzLnNjcmVlbi5oZWlnaHQgPSBib3guaGVpZ2h0O1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpc1tldmVudC50eXBlXSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXNbZXZlbnQudHlwZV0oZXZlbnQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgZ2V0TW91c2VPblNjcmVlbiA9IChmdW5jdGlvbigpIHtcbiAgICAgIGxldCB2ZWN0b3IgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24ocGFnZVgsIHBhZ2VZKSB7XG4gICAgICAgIHZlY3Rvci5zZXQoXG4gICAgICAgICAgICAocGFnZVggLSBfdGhpcy5zY3JlZW4ubGVmdCkgLyBfdGhpcy5zY3JlZW4ud2lkdGgsXG4gICAgICAgICAgICAocGFnZVkgLSBfdGhpcy5zY3JlZW4udG9wKSAvIF90aGlzLnNjcmVlbi5oZWlnaHRcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdmVjdG9yO1xuICAgICAgfTtcbiAgICB9KCkpO1xuXG4gICAgbGV0IGdldE1vdXNlT25DaXJjbGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBsZXQgdmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcblxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHBhZ2VYLCBwYWdlWSkge1xuICAgICAgICB2ZWN0b3Iuc2V0KFxuICAgICAgICAgICAgKChwYWdlWCAtIF90aGlzLnNjcmVlbi53aWR0aCAqIDAuNSAtIF90aGlzLnNjcmVlbi5sZWZ0KSAvIChfdGhpcy5zY3JlZW4ud2lkdGggKiAwLjUpKSxcbiAgICAgICAgICAgICgoX3RoaXMuc2NyZWVuLmhlaWdodCArIDIgKiAoX3RoaXMuc2NyZWVuLnRvcCAtIHBhZ2VZKSkgLyBfdGhpcy5zY3JlZW4ud2lkdGgpIC8vIHNjcmVlbi53aWR0aCBpbnRlbnRpb25hbFxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB2ZWN0b3I7XG4gICAgICB9O1xuICAgIH0oKSk7XG5cbiAgICB0aGlzLnJvdGF0ZUNhbWVyYSA9IChmdW5jdGlvbigpIHtcbiAgICAgIGxldCBheGlzID0gbmV3IFRIUkVFLlZlY3RvcjMoKSxcbiAgICAgICAgICBxdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKSxcbiAgICAgICAgICBleWVEaXJlY3Rpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpLFxuICAgICAgICAgIG9iamVjdFVwRGlyZWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoKSxcbiAgICAgICAgICBvYmplY3RTaWRld2F5c0RpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCksXG4gICAgICAgICAgbW92ZURpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCksXG4gICAgICAgICAgYW5nbGU7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbW92ZURpcmVjdGlvbi5zZXQoX21vdmVDdXJyLnggLSBfbW92ZVByZXYueCwgX21vdmVDdXJyLnkgLSBfbW92ZVByZXYueSwgMCk7XG4gICAgICAgIGFuZ2xlID0gbW92ZURpcmVjdGlvbi5sZW5ndGgoKTtcblxuICAgICAgICBpZiAoYW5nbGUpIHtcbiAgICAgICAgICBfZXllLmNvcHkoX3RoaXMub2JqZWN0LnBvc2l0aW9uKS5zdWIoX3RoaXMudGFyZ2V0KTtcblxuICAgICAgICAgIGV5ZURpcmVjdGlvbi5jb3B5KF9leWUpLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgIG9iamVjdFVwRGlyZWN0aW9uLmNvcHkoX3RoaXMub2JqZWN0LnVwKS5ub3JtYWxpemUoKTtcbiAgICAgICAgICBvYmplY3RTaWRld2F5c0RpcmVjdGlvbi5jcm9zc1ZlY3RvcnMob2JqZWN0VXBEaXJlY3Rpb24sIGV5ZURpcmVjdGlvbikubm9ybWFsaXplKCk7XG5cbiAgICAgICAgICBvYmplY3RVcERpcmVjdGlvbi5zZXRMZW5ndGgoX21vdmVDdXJyLnkgLSBfbW92ZVByZXYueSk7XG4gICAgICAgICAgb2JqZWN0U2lkZXdheXNEaXJlY3Rpb24uc2V0TGVuZ3RoKF9tb3ZlQ3Vyci54IC0gX21vdmVQcmV2LngpO1xuXG4gICAgICAgICAgbW92ZURpcmVjdGlvbi5jb3B5KG9iamVjdFVwRGlyZWN0aW9uLmFkZChvYmplY3RTaWRld2F5c0RpcmVjdGlvbikpO1xuXG4gICAgICAgICAgYXhpcy5jcm9zc1ZlY3RvcnMobW92ZURpcmVjdGlvbiwgX2V5ZSkubm9ybWFsaXplKCk7XG5cbiAgICAgICAgICBhbmdsZSAqPSBfdGhpcy5yb3RhdGVTcGVlZDtcbiAgICAgICAgICBxdWF0ZXJuaW9uLnNldEZyb21BeGlzQW5nbGUoYXhpcywgYW5nbGUpO1xuXG4gICAgICAgICAgX2V5ZS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgICAgICAgX3RoaXMub2JqZWN0LnVwLmFwcGx5UXVhdGVybmlvbihxdWF0ZXJuaW9uKTtcblxuICAgICAgICAgIF9sYXN0QXhpcy5jb3B5KGF4aXMpO1xuICAgICAgICAgIF9sYXN0QW5nbGUgPSBhbmdsZTtcbiAgICAgICAgfSBlbHNlIGlmICghX3RoaXMuc3RhdGljTW92aW5nICYmIF9sYXN0QW5nbGUpIHtcbiAgICAgICAgICBfbGFzdEFuZ2xlICo9IE1hdGguc3FydCgxLjAgLSBfdGhpcy5keW5hbWljRGFtcGluZ0ZhY3Rvcik7XG4gICAgICAgICAgX2V5ZS5jb3B5KF90aGlzLm9iamVjdC5wb3NpdGlvbikuc3ViKF90aGlzLnRhcmdldCk7XG4gICAgICAgICAgcXVhdGVybmlvbi5zZXRGcm9tQXhpc0FuZ2xlKF9sYXN0QXhpcywgX2xhc3RBbmdsZSk7XG4gICAgICAgICAgX2V5ZS5hcHBseVF1YXRlcm5pb24ocXVhdGVybmlvbik7XG4gICAgICAgICAgX3RoaXMub2JqZWN0LnVwLmFwcGx5UXVhdGVybmlvbihxdWF0ZXJuaW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9tb3ZlUHJldi5jb3B5KF9tb3ZlQ3Vycik7XG4gICAgICB9O1xuICAgIH0oKSk7XG5cbiAgICB0aGlzLnpvb21DYW1lcmEgPSBmdW5jdGlvbigpIHtcbiAgICAgIGxldCBmYWN0b3I7XG5cbiAgICAgIGlmIChfc3RhdGUgPT09IFNUQVRFLlRPVUNIX1pPT00pIHtcbiAgICAgICAgZmFjdG9yID0gX3RvdWNoWm9vbURpc3RhbmNlU3RhcnQgLyBfdG91Y2hab29tRGlzdGFuY2VFbmQ7XG4gICAgICAgIF90b3VjaFpvb21EaXN0YW5jZVN0YXJ0ID0gX3RvdWNoWm9vbURpc3RhbmNlRW5kO1xuICAgICAgICBfZXllLm11bHRpcGx5U2NhbGFyKGZhY3Rvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3IgPSAxLjAgKyAoX3pvb21FbmQueSAtIF96b29tU3RhcnQueSkgKiBfdGhpcy56b29tU3BlZWQ7XG5cbiAgICAgICAgaWYgKGZhY3RvciAhPT0gMS4wICYmIGZhY3RvciA+IDAuMCkge1xuICAgICAgICAgIF9leWUubXVsdGlwbHlTY2FsYXIoZmFjdG9yKTtcblxuICAgICAgICAgIGlmIChfdGhpcy5zdGF0aWNNb3ZpbmcpIHtcbiAgICAgICAgICAgIF96b29tU3RhcnQuY29weShfem9vbUVuZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIF96b29tU3RhcnQueSArPSAoX3pvb21FbmQueSAtIF96b29tU3RhcnQueSkgKiB0aGlzLmR5bmFtaWNEYW1waW5nRmFjdG9yO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnBhbkNhbWVyYSA9IChmdW5jdGlvbigpIHtcbiAgICAgIGxldCBtb3VzZUNoYW5nZSA9IG5ldyBUSFJFRS5WZWN0b3IyKCksXG4gICAgICAgICAgb2JqZWN0VXAgPSBuZXcgVEhSRUUuVmVjdG9yMygpLFxuICAgICAgICAgIHBhbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbW91c2VDaGFuZ2UuY29weShfcGFuRW5kKS5zdWIoX3BhblN0YXJ0KTtcblxuICAgICAgICBpZiAobW91c2VDaGFuZ2UubGVuZ3RoU3EoKSkge1xuICAgICAgICAgIG1vdXNlQ2hhbmdlLm11bHRpcGx5U2NhbGFyKF9leWUubGVuZ3RoKCkgKiBfdGhpcy5wYW5TcGVlZCk7XG5cbiAgICAgICAgICBwYW4uY29weShfZXllKS5jcm9zcyhfdGhpcy5vYmplY3QudXApLnNldExlbmd0aChtb3VzZUNoYW5nZS54KTtcbiAgICAgICAgICBwYW4uYWRkKG9iamVjdFVwLmNvcHkoX3RoaXMub2JqZWN0LnVwKS5zZXRMZW5ndGgobW91c2VDaGFuZ2UueSkpO1xuXG4gICAgICAgICAgX3RoaXMub2JqZWN0LnBvc2l0aW9uLmFkZChwYW4pO1xuICAgICAgICAgIF90aGlzLnRhcmdldC5hZGQocGFuKTtcblxuICAgICAgICAgIGlmIChfdGhpcy5zdGF0aWNNb3ZpbmcpIHtcbiAgICAgICAgICAgIF9wYW5TdGFydC5jb3B5KF9wYW5FbmQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfcGFuU3RhcnQuYWRkKG1vdXNlQ2hhbmdlLnN1YlZlY3RvcnMoX3BhbkVuZCwgX3BhblN0YXJ0KS5tdWx0aXBseVNjYWxhcihfdGhpcy5keW5hbWljRGFtcGluZ0ZhY3RvcikpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KCkpO1xuXG4gICAgdGhpcy5jaGVja0Rpc3RhbmNlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFfdGhpcy5ub1pvb20gfHwgIV90aGlzLm5vUGFuKSB7XG4gICAgICAgIGlmIChfZXllLmxlbmd0aFNxKCkgPiBfdGhpcy5tYXhEaXN0YW5jZSAqIF90aGlzLm1heERpc3RhbmNlKSB7XG4gICAgICAgICAgX3RoaXMub2JqZWN0LnBvc2l0aW9uLmFkZFZlY3RvcnMoX3RoaXMudGFyZ2V0LCBfZXllLnNldExlbmd0aChfdGhpcy5tYXhEaXN0YW5jZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF9leWUubGVuZ3RoU3EoKSA8IF90aGlzLm1pbkRpc3RhbmNlICogX3RoaXMubWluRGlzdGFuY2UpIHtcbiAgICAgICAgICBfdGhpcy5vYmplY3QucG9zaXRpb24uYWRkVmVjdG9ycyhfdGhpcy50YXJnZXQsIF9leWUuc2V0TGVuZ3RoKF90aGlzLm1pbkRpc3RhbmNlKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIF9leWUuc3ViVmVjdG9ycyhfdGhpcy5vYmplY3QucG9zaXRpb24sIF90aGlzLnRhcmdldCk7XG5cbiAgICAgIGlmICghX3RoaXMubm9Sb3RhdGUpIHtcbiAgICAgICAgX3RoaXMucm90YXRlQ2FtZXJhKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghX3RoaXMubm9ab29tKSB7XG4gICAgICAgIF90aGlzLnpvb21DYW1lcmEoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFfdGhpcy5ub1Bhbikge1xuICAgICAgICBfdGhpcy5wYW5DYW1lcmEoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFfdGhpcy5ub0N1c3RvbSkge1xuICAgICAgICBfdGhpcy5jdXN0b20oX2N1c3RvbVN0YXJ0LCBfY3VzdG9tRW5kKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMub2JqZWN0LnBvc2l0aW9uLmFkZFZlY3RvcnMoX3RoaXMudGFyZ2V0LCBfZXllKTtcblxuICAgICAgX3RoaXMuY2hlY2tEaXN0YW5jZXMoKTtcblxuICAgICAgX3RoaXMub2JqZWN0Lmxvb2tBdChfdGhpcy50YXJnZXQpO1xuXG4gICAgICBpZiAobGFzdFBvc2l0aW9uLmRpc3RhbmNlVG9TcXVhcmVkKF90aGlzLm9iamVjdC5wb3NpdGlvbikgPiBFUFMpIHtcbiAgICAgICAgX3RoaXMuZGlzcGF0Y2hFdmVudChjaGFuZ2VFdmVudCk7XG5cbiAgICAgICAgbGFzdFBvc2l0aW9uLmNvcHkoX3RoaXMub2JqZWN0LnBvc2l0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgX3N0YXRlID0gU1RBVEUuTk9ORTtcbiAgICAgIF9wcmV2U3RhdGUgPSBTVEFURS5OT05FO1xuXG4gICAgICBfdGhpcy50YXJnZXQuY29weShfdGhpcy50YXJnZXQwKTtcbiAgICAgIF90aGlzLm9iamVjdC5wb3NpdGlvbi5jb3B5KF90aGlzLnBvc2l0aW9uMCk7XG4gICAgICBfdGhpcy5vYmplY3QudXAuY29weShfdGhpcy51cDApO1xuXG4gICAgICBfZXllLnN1YlZlY3RvcnMoX3RoaXMub2JqZWN0LnBvc2l0aW9uLCBfdGhpcy50YXJnZXQpO1xuXG4gICAgICBfdGhpcy5vYmplY3QubG9va0F0KF90aGlzLnRhcmdldCk7XG5cbiAgICAgIF90aGlzLmRpc3BhdGNoRXZlbnQoY2hhbmdlRXZlbnQpO1xuXG4gICAgICBsYXN0UG9zaXRpb24uY29weShfdGhpcy5vYmplY3QucG9zaXRpb24pO1xuICAgIH07XG5cbiAgICB0aGlzLnNldFN0YXRlID0gZnVuY3Rpb24odGFyZ2V0U3RhdGUpIHtcbiAgICAgIF90aGlzLmZvcmNlU3RhdGUgPSB0YXJnZXRTdGF0ZTtcbiAgICAgIF9wcmV2U3RhdGUgPSB0YXJnZXRTdGF0ZTtcbiAgICAgIF9zdGF0ZSA9IHRhcmdldFN0YXRlO1xuICAgIH07XG5cbiAgICB0aGlzLmN1c3RvbSA9IGZ1bmN0aW9uKGN1c3RvbVN0YXJ0LCBjdXN0b21FbmQpIHtcblxuICAgIH07XG5cbiAgICAvLyBsaXN0ZW5lcnNcblxuICAgIGZ1bmN0aW9uIGtleWRvd24oZXZlbnQpIHtcbiAgICAgIGlmIChfdGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWRvd24pO1xuXG4gICAgICBfcHJldlN0YXRlID0gX3N0YXRlO1xuXG4gICAgICBpZiAoX3N0YXRlICE9PSBTVEFURS5OT05FKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gX3RoaXMua2V5c1tTVEFURS5ST1RBVEVdICYmICFfdGhpcy5ub1JvdGF0ZSkge1xuICAgICAgICBfc3RhdGUgPSBTVEFURS5ST1RBVEU7XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleUNvZGUgPT09IF90aGlzLmtleXNbU1RBVEUuWk9PTV0gJiYgIV90aGlzLm5vWm9vbSkge1xuICAgICAgICBfc3RhdGUgPSBTVEFURS5aT09NO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5rZXlDb2RlID09PSBfdGhpcy5rZXlzW1NUQVRFLlBBTl0gJiYgIV90aGlzLm5vUGFuKSB7XG4gICAgICAgIF9zdGF0ZSA9IFNUQVRFLlBBTjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBrZXl1cChldmVudCkge1xuICAgICAgaWYgKF90aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICAgIF9zdGF0ZSA9IF9wcmV2U3RhdGU7XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93biwgZmFsc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vdXNlZG93bihldmVudCkge1xuICAgICAgaWYgKF90aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgaWYgKF9zdGF0ZSA9PT0gU1RBVEUuTk9ORSkge1xuICAgICAgICBfc3RhdGUgPSBldmVudC5idXR0b247XG4gICAgICB9XG5cbiAgICAgIGlmIChfc3RhdGUgPT09IFNUQVRFLlJPVEFURSAmJiAhX3RoaXMubm9Sb3RhdGUpIHtcbiAgICAgICAgX21vdmVDdXJyLmNvcHkoZ2V0TW91c2VPbkNpcmNsZShldmVudC5wYWdlWCwgZXZlbnQucGFnZVkpKTtcbiAgICAgICAgX21vdmVQcmV2LmNvcHkoX21vdmVDdXJyKTtcbiAgICAgIH0gZWxzZSBpZiAoX3N0YXRlID09PSBTVEFURS5aT09NICYmICFfdGhpcy5ub1pvb20pIHtcbiAgICAgICAgX3pvb21TdGFydC5jb3B5KGdldE1vdXNlT25TY3JlZW4oZXZlbnQucGFnZVgsIGV2ZW50LnBhZ2VZKSk7XG4gICAgICAgIF96b29tRW5kLmNvcHkoX3pvb21TdGFydCk7XG4gICAgICB9IGVsc2UgaWYgKF9zdGF0ZSA9PT0gU1RBVEUuUEFOICYmICFfdGhpcy5ub1Bhbikge1xuICAgICAgICBfcGFuU3RhcnQuY29weShnZXRNb3VzZU9uU2NyZWVuKGV2ZW50LnBhZ2VYLCBldmVudC5wYWdlWSkpO1xuICAgICAgICBfcGFuRW5kLmNvcHkoX3BhblN0YXJ0KTtcbiAgICAgIH0gZWxzZSBpZiAoX3N0YXRlID09PSBTVEFURS5DVVNUT00gJiYgIV90aGlzLm5vQ3VzdG9tKSB7XG4gICAgICAgIF9jdXN0b21TdGFydC5jb3B5KGdldE1vdXNlT25TY3JlZW4oZXZlbnQucGFnZVgsIGV2ZW50LnBhZ2VZKSk7XG4gICAgICAgIF9jdXN0b21FbmQuY29weShfcGFuU3RhcnQpO1xuICAgICAgfVxuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZW1vdmUsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBtb3VzZXVwLCBmYWxzZSk7XG5cbiAgICAgIF90aGlzLmRpc3BhdGNoRXZlbnQoc3RhcnRFdmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW91c2Vtb3ZlKGV2ZW50KSB7XG4gICAgICBpZiAoX3RoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICBpZiAoX3N0YXRlID09PSBTVEFURS5ST1RBVEUgJiYgIV90aGlzLm5vUm90YXRlKSB7XG4gICAgICAgIF9tb3ZlUHJldi5jb3B5KF9tb3ZlQ3Vycik7XG4gICAgICAgIF9tb3ZlQ3Vyci5jb3B5KGdldE1vdXNlT25DaXJjbGUoZXZlbnQucGFnZVgsIGV2ZW50LnBhZ2VZKSk7XG4gICAgICB9IGVsc2UgaWYgKF9zdGF0ZSA9PT0gU1RBVEUuWk9PTSAmJiAhX3RoaXMubm9ab29tKSB7XG4gICAgICAgIF96b29tRW5kLmNvcHkoZ2V0TW91c2VPblNjcmVlbihldmVudC5wYWdlWCwgZXZlbnQucGFnZVkpKTtcbiAgICAgIH0gZWxzZSBpZiAoX3N0YXRlID09PSBTVEFURS5QQU4gJiYgIV90aGlzLm5vUGFuKSB7XG4gICAgICAgIF9wYW5FbmQuY29weShnZXRNb3VzZU9uU2NyZWVuKGV2ZW50LnBhZ2VYLCBldmVudC5wYWdlWSkpO1xuICAgICAgfSBlbHNlIGlmIChfc3RhdGUgPT09IFNUQVRFLkNVU1RPTSAmJiAhX3RoaXMubm9DdXN0b20pIHtcbiAgICAgICAgX2N1c3RvbUVuZC5jb3B5KGdldE1vdXNlT25TY3JlZW4oZXZlbnQucGFnZVgsIGV2ZW50LnBhZ2VZKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW91c2V1cChldmVudCkge1xuICAgICAgaWYgKF90aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgaWYgKF90aGlzLmZvcmNlU3RhdGUgPT09IC0xKSB7XG4gICAgICAgIF9zdGF0ZSA9IFNUQVRFLk5PTkU7XG4gICAgICB9XG5cbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdXNlbW92ZSk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgbW91c2V1cCk7XG4gICAgICBfdGhpcy5kaXNwYXRjaEV2ZW50KGVuZEV2ZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtb3VzZXdoZWVsKGV2ZW50KSB7XG4gICAgICBpZiAoX3RoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICBsZXQgZGVsdGEgPSAwO1xuXG4gICAgICBpZiAoZXZlbnQud2hlZWxEZWx0YSkge1xuIC8vIFdlYktpdCAvIE9wZXJhIC8gRXhwbG9yZXIgOVxuXG4gICAgICAgIGRlbHRhID0gZXZlbnQud2hlZWxEZWx0YSAvIDQwO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5kZXRhaWwpIHtcbiAvLyBGaXJlZm94XG5cbiAgICAgICAgZGVsdGEgPSAtZXZlbnQuZGV0YWlsIC8gMztcbiAgICAgIH1cblxuICAgICAgaWYgKF9zdGF0ZSAhPT0gU1RBVEUuQ1VTVE9NKSB7XG4gICAgICAgIF96b29tU3RhcnQueSArPSBkZWx0YSAqIDAuMDE7XG4gICAgICB9IGVsc2UgaWYgKF9zdGF0ZSA9PT0gU1RBVEUuQ1VTVE9NKSB7XG4gICAgICAgIF9jdXN0b21TdGFydC55ICs9IGRlbHRhICogMC4wMTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMuZGlzcGF0Y2hFdmVudChzdGFydEV2ZW50KTtcbiAgICAgIF90aGlzLmRpc3BhdGNoRXZlbnQoZW5kRXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvdWNoc3RhcnQoZXZlbnQpIHtcbiAgICAgIGlmIChfdGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgICBpZiAoX3RoaXMuZm9yY2VTdGF0ZSA9PT0gLTEpIHtcbiAgICAgICAgc3dpdGNoIChldmVudC50b3VjaGVzLmxlbmd0aCkge1xuXG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgX3N0YXRlID0gU1RBVEUuVE9VQ0hfUk9UQVRFO1xuICAgICAgICAgICAgX21vdmVDdXJyLmNvcHkoZ2V0TW91c2VPbkNpcmNsZShldmVudC50b3VjaGVzWzBdLnBhZ2VYLCBldmVudC50b3VjaGVzWzBdLnBhZ2VZKSk7XG4gICAgICAgICAgICBfbW92ZVByZXYuY29weShfbW92ZUN1cnIpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBfc3RhdGUgPSBTVEFURS5UT1VDSF9aT09NO1xuICAgICAgICAgICAgdmFyIGR4ID0gZXZlbnQudG91Y2hlc1swXS5wYWdlWCAtIGV2ZW50LnRvdWNoZXNbMV0ucGFnZVg7XG4gICAgICAgICAgICB2YXIgZHkgPSBldmVudC50b3VjaGVzWzBdLnBhZ2VZIC0gZXZlbnQudG91Y2hlc1sxXS5wYWdlWTtcbiAgICAgICAgICAgIF90b3VjaFpvb21EaXN0YW5jZUVuZCA9IF90b3VjaFpvb21EaXN0YW5jZVN0YXJ0ID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcblxuICAgICAgICAgICAgdmFyIHggPSAoZXZlbnQudG91Y2hlc1swXS5wYWdlWCArIGV2ZW50LnRvdWNoZXNbMV0ucGFnZVgpIC8gMjtcbiAgICAgICAgICAgIHZhciB5ID0gKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVkgKyBldmVudC50b3VjaGVzWzFdLnBhZ2VZKSAvIDI7XG4gICAgICAgICAgICBfcGFuU3RhcnQuY29weShnZXRNb3VzZU9uU2NyZWVuKHgsIHkpKTtcbiAgICAgICAgICAgIF9wYW5FbmQuY29weShfcGFuU3RhcnQpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgX3N0YXRlID0gU1RBVEUuTk9ORTtcblxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyB7IE5PTkU6IC0xLCBST1RBVEU6IDAsIFpPT006IDEsIFBBTjogMiwgVE9VQ0hfUk9UQVRFOiAzLCBUT1VDSF9aT09NX1BBTjogNCwgQ1VTVE9NOiA5OSB9O1xuICAgICAgICBzd2l0Y2ggKF9zdGF0ZSkge1xuXG4gICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgLy8gMSBvciAyIGZpbmdlcnMsIHNtYWUgYmVoYXZpb3JcbiAgICAgICAgICAgIF9zdGF0ZSA9IFNUQVRFLlRPVUNIX1JPVEFURTtcbiAgICAgICAgICAgIF9tb3ZlQ3Vyci5jb3B5KGdldE1vdXNlT25DaXJjbGUoZXZlbnQudG91Y2hlc1swXS5wYWdlWCwgZXZlbnQudG91Y2hlc1swXS5wYWdlWSkpO1xuICAgICAgICAgICAgX21vdmVQcmV2LmNvcHkoX21vdmVDdXJyKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIGlmIChldmVudC50b3VjaGVzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICAgIF9zdGF0ZSA9IFNUQVRFLlRPVUNIX1pPT007XG4gICAgICAgICAgICAgIHZhciBkeCA9IGV2ZW50LnRvdWNoZXNbMF0ucGFnZVggLSBldmVudC50b3VjaGVzWzFdLnBhZ2VYO1xuICAgICAgICAgICAgICB2YXIgZHkgPSBldmVudC50b3VjaGVzWzBdLnBhZ2VZIC0gZXZlbnQudG91Y2hlc1sxXS5wYWdlWTtcbiAgICAgICAgICAgICAgX3RvdWNoWm9vbURpc3RhbmNlRW5kID0gX3RvdWNoWm9vbURpc3RhbmNlU3RhcnQgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX3N0YXRlID0gU1RBVEUuWk9PTTtcbiAgICAgICAgICAgICAgX3pvb21TdGFydC5jb3B5KGdldE1vdXNlT25TY3JlZW4oZXZlbnQudG91Y2hlc1swXS5wYWdlWCwgZXZlbnQudG91Y2hlc1swXS5wYWdlWSkpO1xuICAgICAgICAgICAgICBfem9vbUVuZC5jb3B5KF96b29tU3RhcnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgaWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgICAgX3N0YXRlID0gU1RBVEUuVE9VQ0hfUEFOO1xuICAgICAgICAgICAgICB2YXIgeCA9IChldmVudC50b3VjaGVzWzBdLnBhZ2VYICsgZXZlbnQudG91Y2hlc1sxXS5wYWdlWCkgLyAyO1xuICAgICAgICAgICAgICB2YXIgeSA9IChldmVudC50b3VjaGVzWzBdLnBhZ2VZICsgZXZlbnQudG91Y2hlc1sxXS5wYWdlWSkgLyAyO1xuICAgICAgICAgICAgICBfcGFuU3RhcnQuY29weShnZXRNb3VzZU9uU2NyZWVuKHgsIHkpKTtcbiAgICAgICAgICAgICAgX3BhbkVuZC5jb3B5KF9wYW5TdGFydCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBfc3RhdGUgPSBTVEFURS5QQU47XG4gICAgICAgICAgICAgIF9wYW5TdGFydC5jb3B5KGdldE1vdXNlT25TY3JlZW4oZXZlbnQudG91Y2hlc1swXS5wYWdlWCwgZXZlbnQudG91Y2hlc1swXS5wYWdlWSkpO1xuICAgICAgICAgICAgICBfcGFuRW5kLmNvcHkoX3BhblN0YXJ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSA5OTpcbiAgICAgICAgICAgIF9zdGF0ZSA9IFNUQVRFLkNVU1RPTTtcbiAgICAgICAgICAgIHZhciB4ID0gKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVggKyBldmVudC50b3VjaGVzWzFdLnBhZ2VYKSAvIDI7XG4gICAgICAgICAgICB2YXIgeSA9IChldmVudC50b3VjaGVzWzBdLnBhZ2VZICsgZXZlbnQudG91Y2hlc1sxXS5wYWdlWSkgLyAyO1xuICAgICAgICAgICAgX2N1c3RvbVN0YXJ0LmNvcHkoZ2V0TW91c2VPblNjcmVlbih4LCB5KSk7XG4gICAgICAgICAgICBfY3VzdG9tRW5kLmNvcHkoX2N1c3RvbVN0YXJ0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIF9zdGF0ZSA9IFNUQVRFLk5PTkU7XG5cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBfdGhpcy5kaXNwYXRjaEV2ZW50KHN0YXJ0RXZlbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvdWNobW92ZShldmVudCkge1xuICAgICAgaWYgKF90aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgaWYgKF90aGlzLmZvcmNlU3RhdGUgPT09IC0xKSB7XG4gICAgICAgIHN3aXRjaCAoZXZlbnQudG91Y2hlcy5sZW5ndGgpIHtcblxuICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIF9tb3ZlUHJldi5jb3B5KF9tb3ZlQ3Vycik7XG4gICAgICAgICAgICBfbW92ZUN1cnIuY29weShnZXRNb3VzZU9uQ2lyY2xlKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbMF0ucGFnZVkpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgdmFyIGR4ID0gZXZlbnQudG91Y2hlc1swXS5wYWdlWCAtIGV2ZW50LnRvdWNoZXNbMV0ucGFnZVg7XG4gICAgICAgICAgICB2YXIgZHkgPSBldmVudC50b3VjaGVzWzBdLnBhZ2VZIC0gZXZlbnQudG91Y2hlc1sxXS5wYWdlWTtcbiAgICAgICAgICAgIF90b3VjaFpvb21EaXN0YW5jZUVuZCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG5cbiAgICAgICAgICAgIHZhciB4ID0gKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVggKyBldmVudC50b3VjaGVzWzFdLnBhZ2VYKSAvIDI7XG4gICAgICAgICAgICB2YXIgeSA9IChldmVudC50b3VjaGVzWzBdLnBhZ2VZICsgZXZlbnQudG91Y2hlc1sxXS5wYWdlWSkgLyAyO1xuICAgICAgICAgICAgX3BhbkVuZC5jb3B5KGdldE1vdXNlT25TY3JlZW4oeCwgeSkpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgX3N0YXRlID0gU1RBVEUuTk9ORTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8geyBOT05FOiAtMSwgUk9UQVRFOiAwLCBaT09NOiAxLCBQQU46IDIsIFRPVUNIX1JPVEFURTogMywgVE9VQ0hfWk9PTV9QQU46IDQsIENVU1RPTTogOTkgfTtcbiAgICAgICAgc3dpdGNoIChfc3RhdGUpIHtcblxuICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIF9tb3ZlUHJldi5jb3B5KF9tb3ZlQ3Vycik7XG4gICAgICAgICAgICBfbW92ZUN1cnIuY29weShnZXRNb3VzZU9uQ2lyY2xlKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbMF0ucGFnZVkpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgX3pvb21FbmQuY29weShnZXRNb3VzZU9uU2NyZWVuKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbMF0ucGFnZVkpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgX3BhbkVuZC5jb3B5KGdldE1vdXNlT25TY3JlZW4oZXZlbnQudG91Y2hlc1swXS5wYWdlWCwgZXZlbnQudG91Y2hlc1swXS5wYWdlWSkpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAvLyAyIGZpbmdlcnMhXG4gICAgICAgICAgICAvLyBUT1VDSCBaT09NXG4gICAgICAgICAgICB2YXIgZHggPSBldmVudC50b3VjaGVzWzBdLnBhZ2VYIC0gZXZlbnQudG91Y2hlc1sxXS5wYWdlWDtcbiAgICAgICAgICAgIHZhciBkeSA9IGV2ZW50LnRvdWNoZXNbMF0ucGFnZVkgLSBldmVudC50b3VjaGVzWzFdLnBhZ2VZO1xuICAgICAgICAgICAgX3RvdWNoWm9vbURpc3RhbmNlRW5kID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgLy8gMiBmaW5nZXJzXG4gICAgICAgICAgICAvLyBUT1VDSF9QQU5cbiAgICAgICAgICAgIHZhciB4ID0gKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVggKyBldmVudC50b3VjaGVzWzFdLnBhZ2VYKSAvIDI7XG4gICAgICAgICAgICB2YXIgeSA9IChldmVudC50b3VjaGVzWzBdLnBhZ2VZICsgZXZlbnQudG91Y2hlc1sxXS5wYWdlWSkgLyAyO1xuICAgICAgICAgICAgX3BhbkVuZC5jb3B5KGdldE1vdXNlT25TY3JlZW4oeCwgeSkpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIDk5OlxuICAgICAgICAgICAgdmFyIHggPSAoZXZlbnQudG91Y2hlc1swXS5wYWdlWCArIGV2ZW50LnRvdWNoZXNbMV0ucGFnZVgpIC8gMjtcbiAgICAgICAgICAgIHZhciB5ID0gKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVkgKyBldmVudC50b3VjaGVzWzFdLnBhZ2VZKSAvIDI7XG4gICAgICAgICAgICBfY3VzdG9tRW5kLmNvcHkoZ2V0TW91c2VPblNjcmVlbih4LCB5KSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBfc3RhdGUgPSBTVEFURS5OT05FO1xuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b3VjaGVuZChldmVudCkge1xuICAgICAgaWYgKF90aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICAgIGlmIChfdGhpcy5mb3JjZVN0YXRlID09PSAtMSkge1xuICAgICAgICBzd2l0Y2ggKGV2ZW50LnRvdWNoZXMubGVuZ3RoKSB7XG5cbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBfbW92ZVByZXYuY29weShfbW92ZUN1cnIpO1xuICAgICAgICAgICAgX21vdmVDdXJyLmNvcHkoZ2V0TW91c2VPbkNpcmNsZShldmVudC50b3VjaGVzWzBdLnBhZ2VYLCBldmVudC50b3VjaGVzWzBdLnBhZ2VZKSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIF90b3VjaFpvb21EaXN0YW5jZVN0YXJ0ID0gX3RvdWNoWm9vbURpc3RhbmNlRW5kID0gMDtcblxuICAgICAgICAgICAgdmFyIHggPSAoZXZlbnQudG91Y2hlc1swXS5wYWdlWCArIGV2ZW50LnRvdWNoZXNbMV0ucGFnZVgpIC8gMjtcbiAgICAgICAgICAgIHZhciB5ID0gKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVkgKyBldmVudC50b3VjaGVzWzFdLnBhZ2VZKSAvIDI7XG4gICAgICAgICAgICBfcGFuRW5kLmNvcHkoZ2V0TW91c2VPblNjcmVlbih4LCB5KSk7XG4gICAgICAgICAgICBfcGFuU3RhcnQuY29weShfcGFuRW5kKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIH1cblxuICAgICAgICBfc3RhdGUgPSBTVEFURS5OT05FO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChfc3RhdGUpIHtcblxuICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIF9tb3ZlUHJldi5jb3B5KF9tb3ZlQ3Vycik7XG4gICAgICAgICAgICBfbW92ZUN1cnIuY29weShnZXRNb3VzZU9uQ2lyY2xlKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVgsIGV2ZW50LnRvdWNoZXNbMF0ucGFnZVkpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgLy8gVE9VQ0ggWk9PTVxuICAgICAgICAgICAgX3RvdWNoWm9vbURpc3RhbmNlU3RhcnQgPSBfdG91Y2hab29tRGlzdGFuY2VFbmQgPSAwO1xuICAgICAgICAgICAgX3N0YXRlID0gU1RBVEUuWk9PTTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgLy8gVE9VQ0ggWk9PTVxuICAgICAgICAgICAgaWYgKGV2ZW50LnRvdWNoZXMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgICAgdmFyIHggPSAoZXZlbnQudG91Y2hlc1swXS5wYWdlWCArIGV2ZW50LnRvdWNoZXNbMV0ucGFnZVgpIC8gMjtcbiAgICAgICAgICAgICAgdmFyIHkgPSAoZXZlbnQudG91Y2hlc1swXS5wYWdlWSArIGV2ZW50LnRvdWNoZXNbMV0ucGFnZVkpIC8gMjtcbiAgICAgICAgICAgICAgX3BhbkVuZC5jb3B5KGdldE1vdXNlT25TY3JlZW4oeCwgeSkpO1xuICAgICAgICAgICAgICBfcGFuU3RhcnQuY29weShfcGFuRW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9zdGF0ZSA9IFNUQVRFLlBBTjtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSA5OTpcbiAgICAgICAgICAgIHZhciB4ID0gKGV2ZW50LnRvdWNoZXNbMF0ucGFnZVggKyBldmVudC50b3VjaGVzWzFdLnBhZ2VYKSAvIDI7XG4gICAgICAgICAgICB2YXIgeSA9IChldmVudC50b3VjaGVzWzBdLnBhZ2VZICsgZXZlbnQudG91Y2hlc1sxXS5wYWdlWSkgLyAyO1xuICAgICAgICAgICAgX2N1c3RvbUVuZC5jb3B5KGdldE1vdXNlT25TY3JlZW4oeCwgeSkpO1xuICAgICAgICAgICAgX2N1c3RvbVN0YXJ0LmNvcHkoX2N1c3RvbUVuZCk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBfc3RhdGUgPSBTVEFURS5OT05FO1xuXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgX3RoaXMuZGlzcGF0Y2hFdmVudChlbmRFdmVudCk7XG4gICAgfVxuXG4gICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24oZXZlbnQpIHtcbiBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xufSwgZmFsc2UpO1xuXG4gICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG1vdXNlZG93biwgZmFsc2UpO1xuXG4gICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBtb3VzZXdoZWVsLCBmYWxzZSk7XG4gICAgdGhpcy5kb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTU1vdXNlU2Nyb2xsJywgbW91c2V3aGVlbCwgZmFsc2UpOyAvLyBmaXJlZm94XG5cbiAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoc3RhcnQsIGZhbHNlKTtcbiAgICB0aGlzLmRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0b3VjaGVuZCwgZmFsc2UpO1xuICAgIHRoaXMuZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0b3VjaG1vdmUsIGZhbHNlKTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93biwgZmFsc2UpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGtleXVwLCBmYWxzZSk7XG5cbiAgICB0aGlzLmhhbmRsZVJlc2l6ZSgpO1xuXG4gICAgLy8gZm9yY2UgYW4gdXBkYXRlIGF0IHN0YXJ0XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxufVxuIiwiaW1wb3J0IFV0aWxzIGZyb20gJy4vY29yZS51dGlscyc7XG5pbXBvcnQgVmFsaWRhdG9ycyBmcm9tICcuL2NvcmUudmFsaWRhdG9ycyc7XG5cbi8qKlxuICogQ29tcHV0ZS90ZXN0IGludGVyc2VjdGlvbiBiZXR3ZWVuIGRpZmZlcmVudCBvYmplY3RzLlxuICpcbiAqIEBtb2R1bGUgY29yZS9pbnRlcnNlY3Rpb25zXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW50ZXJzZWN0aW9ucyB7XG5cbi8qKlxuICogQ29tcHV0ZSBpbnRlcnNlY3Rpb24gYmV0d2VlbiBvcmllbnRlZCBib3VuZGluZyBib3ggYW5kIGEgcGxhbmUuXG4gKlxuICogUmV0dXJucyBpbnRlcnNlY3Rpb24gaW4gcGxhbmUncyBzcGFjZS5cbiAqXG4gKiBTaG91bGQgcmV0dXJuIGF0IGxlYXN0IDMgaW50ZXJzZWN0aW9ucy4gSWYgbm90LCB0aGUgcGxhbmUgYW5kIHRoZSBib3ggZG8gbm90XG4gKiBpbnRlcnNlY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFhYmIgLSBBeGUgQWxpZ25lZCBCb3VuZGluZyBCb3ggcmVwcmVzZW50YXRpb24uXG4gKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjN9IGFhYmIuaGFsZkRpbWVuc2lvbnMgLSBIYWxmIGRpbWVuc2lvbnMgb2YgdGhlIGJveC5cbiAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yM30gYWFiYi5jZW50ZXIgLSBDZW50ZXIgb2YgdGhlIGJveC5cbiAqIEBwYXJhbSB7VEhSRUUuTWF0cml4NH0gYWFiYi50b0FBQkIgLSBUcmFuc2Zvcm0gdG8gZ28gZnJvbSBwbGFuZSBzcGFjZSB0byBib3ggc3BhY2UuXG4gKiBAcGFyYW0ge09iamVjdH0gcGxhbmUgLSBQbGFuZSByZXByZXNlbnRhdGlvblxuICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzfSBwbGFuZS5wb3NpdGlvbiAtIHBvc2l0aW9uIG9mIG5vcm1hbCB3aGljaCBkZXNjcmliZXMgdGhlIHBsYW5lLlxuICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzfSBwbGFuZS5kaXJlY3Rpb24gLSBEaXJlY3Rpb24gb2Ygbm9ybWFsIHdoaWNoIGRlc2NyaWJlcyB0aGUgcGxhbmUuXG4gKlxuICogQHJldHVybnMge0FycmF5PFRIUkVFLlZlY3RvcjM+fSBMaXN0IG9mIGFsbCBpbnRlcnNlY3Rpb25zIGluIHBsYW5lJ3Mgc3BhY2UuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gZmFsc2UgaXMgaW52YWxpZCBpbnB1dCBwcm92aWRlZC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy9SZXR1cm5zIGFycmF5IHdpdGggaW50ZXJzZWN0aW9uIE4gaW50ZXJzZWN0aW9uc1xuICogbGV0IGFhYmIgPSB7XG4gKiAgIGNlbnRlcjogbmV3IFRIUkVFLlZlY3RvcjMoMTUwLCAxNTAsIDE1MCksXG4gKiAgIGhhbGZEaW1lbnNpb25zOiBuZXcgVEhSRUUuVmVjdG9yMyg1MCwgNjAsIDcwKSxcbiAqICAgdG9BQUJCOiBuZXcgVEhSRUUuTWF0cml4NCgpXG4gKiB9XG4gKiBsZXQgcGxhbmUgPSB7XG4gKiAgIHBvc2l0aW9uOiBuZXcgVEhSRUUuVmVjdG9yMygxMTAsIDEyMCwgMTMwKSxcbiAqICAgZGlyZWN0aW9uOiBuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKVxuICogfVxuICpcbiAqIGxldCBpbnRlcnNlY3Rpb25zID0gQ29yZUludGVyc2VjdGlvbnMuYWFiYlBsYW5lKGFhYmIsIHBsYW5lKTtcbiAqIC8vIGludGVyc2VjdGlvbnMgPT1cbiAqIC8vWyB7IHggOiAxMTAsIHkgOiA5MCwgIHogOiA4MCB9LFxuICogLy8gIHsgeCA6IDExMCwgeSA6IDIxMCwgeiA6IDIyMCB9LFxuICogLy8gIHsgeCA6IDExMCwgeSA6IDIxMCwgeiA6IDgwIH0sXG4gKiAvLyAgeyB4IDogMTEwLCB5IDogOTAsICB6IDogMjIwIH0gXVxuICpcbiAqIC8vUmV0dXJucyBlbXB0eSBhcnJheSB3aXRoIDAgaW50ZXJzZWN0aW9uc1xuICogbGV0IGFhYmIgPSB7XG4gKlxuICogfVxuICogbGV0IHBsYW5lID0ge1xuICpcbiAqIH1cbiAqXG4gKiBsZXQgaW50ZXJzZWN0aW9ucyA9IFZKUy5Db3JlLlZhbGlkYXRvcnMubWF0cml4NChuZXcgVEhSRUUuVmVjdG9yMygpKTtcbiAqXG4gKiAvL1JldHVybnMgZmFsc2UgaWYgaW52YWxpZCBpbnB1dD9cbiAqXG4gKi9cbiAgc3RhdGljIGFhYmJQbGFuZShhYWJiLCBwbGFuZSkge1xuICAgIC8vXG4gICAgLy8gb2JiID0geyBoYWxmRGltZW5zaW9ucywgb3JpZW50YXRpb24sIGNlbnRlciwgdG9BQUJCIH1cbiAgICAvLyBwbGFuZSA9IHsgcG9zaXRpb24sIGRpcmVjdGlvbiB9XG4gICAgLy9cbiAgICAvL1xuICAgIC8vIExPR0lDOlxuICAgIC8vXG4gICAgLy8gVGVzdCBpbnRlcnNlY3Rpb24gb2YgZWFjaCBlZGdlIG9mIHRoZSBPcmllbnRlZCBCb3VuZGluZyBCb3ggd2l0aCB0aGUgUGxhbmVcbiAgICAvL1xuICAgIC8vIEFMTCBFREdFU1xuICAgIC8vXG4gICAgLy8gICAgICAuKy0tLS0tLS0rXG4gICAgLy8gICAgLicgfCAgICAgLid8XG4gICAgLy8gICArLS0tKy0tLSsnICB8XG4gICAgLy8gICB8ICAgfCAgIHwgICB8XG4gICAgLy8gICB8ICAsKy0tLSstLS0rXG4gICAgLy8gICB8LicgICAgIHwgLidcbiAgICAvLyAgICstLS0tLS0tKydcbiAgICAvL1xuICAgIC8vIFNQQUNFIE9SSUVOVEFUSU9OXG4gICAgLy9cbiAgICAvLyAgICAgICArXG4gICAgLy8gICAgIGogfFxuICAgIC8vICAgICAgIHxcbiAgICAvLyAgICAgICB8ICAgaVxuICAgIC8vICAgayAgLCstLS0tLS0tK1xuICAgIC8vICAgIC4nXG4gICAgLy8gICArXG4gICAgLy9cbiAgICAvL1xuICAgIC8vIDEtIE1vdmUgUGxhbmUgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uIGluIElKSyBzcGFjZVxuICAgIC8vIDItIFRlc3QgRWRnZXMvIElKSyBQbGFuZSBpbnRlcnNlY3Rpb25zXG4gICAgLy8gMy0gUmV0dXJuIGludGVyc2VjdGlvbiBFZGdlLyBJSksgUGxhbmUgaWYgaXQgdG91Y2hlcyB0aGUgT3JpZW50ZWQgQkJveFxuXG4gICAgbGV0IGludGVyc2VjdGlvbnMgPSBbXTtcblxuICAgIGlmKCEodGhpcy52YWxpZGF0ZUFhYmIoYWFiYikgJiZcbiAgICAgICB0aGlzLnZhbGlkYXRlUGxhbmUocGxhbmUpKSkge1xuICAgICAgd2luZG93LmNvbnNvbGUubG9nKCdJbnZhbGlkIGFhYmIgb3IgcGxhbmUgcHJvdmlkZWQuJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gaW52ZXJ0IHNwYWNlIG1hdHJpeFxuICAgIGxldCBmcm9tQUFCQiA9IG5ldyBUSFJFRS5NYXRyaXg0KCk7XG4gICAgZnJvbUFBQkIuZ2V0SW52ZXJzZShhYWJiLnRvQUFCQik7XG5cbiAgICBsZXQgdDEgPSBwbGFuZS5kaXJlY3Rpb24uY2xvbmUoKS5hcHBseU1hdHJpeDQoYWFiYi50b0FBQkIpO1xuICAgIGxldCB0MCA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLmFwcGx5TWF0cml4NChhYWJiLnRvQUFCQik7XG5cbiAgICBsZXQgcGxhbmVBQUJCID0gdGhpcy5wb3NkaXIoXG4gICAgICBwbGFuZS5wb3NpdGlvbi5jbG9uZSgpLmFwcGx5TWF0cml4NChhYWJiLnRvQUFCQiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMyh0MS54IC0gdDAueCwgdDEueSAtIHQwLnksIHQxLnogLSB0MC56KS5ub3JtYWxpemUoKVxuICAgICk7XG5cbiAgICBsZXQgYmJveCA9IFV0aWxzLmJib3goYWFiYi5jZW50ZXIsIGFhYmIuaGFsZkRpbWVuc2lvbnMpO1xuXG4gICAgbGV0IG9yaWVudGF0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKSxcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMSkpO1xuXG4gICAgLy8gMTIgZWRnZXMgKGkuZS4gcmF5KS9wbGFuZSBpbnRlcnNlY3Rpb24gdGVzdHNcbiAgICAvLyBSQVlTIFNUQVJUSU5HIEZST00gVEhFIEZJUlNUIENPUk5FUiAoMCwgMCwgMClcbiAgICAvL1xuICAgIC8vICAgICAgICtcbiAgICAvLyAgICAgICB8XG4gICAgLy8gICAgICAgfFxuICAgIC8vICAgICAgIHxcbiAgICAvLyAgICAgICwrLS0tKy0tLStcbiAgICAvLyAgICAuJ1xuICAgIC8vICAgK1xuXG4gICAgbGV0IHJheSA9IHRoaXMucG9zZGlyKFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoYWFiYi5jZW50ZXIueCAtIGFhYmIuaGFsZkRpbWVuc2lvbnMueCwgYWFiYi5jZW50ZXIueSAtIGFhYmIuaGFsZkRpbWVuc2lvbnMueSwgYWFiYi5jZW50ZXIueiAtIGFhYmIuaGFsZkRpbWVuc2lvbnMueiksXG4gICAgICBvcmllbnRhdGlvbi54XG4gICAgKTtcbiAgICB0aGlzLnJheVBsYW5lSW5CQm94KHJheSwgcGxhbmVBQUJCLCBiYm94LCBpbnRlcnNlY3Rpb25zKTtcblxuICAgIHJheS5kaXJlY3Rpb24gPSBvcmllbnRhdGlvbi55O1xuICAgIHRoaXMucmF5UGxhbmVJbkJCb3gocmF5LCBwbGFuZUFBQkIsIGJib3gsIGludGVyc2VjdGlvbnMpO1xuXG4gICAgcmF5LmRpcmVjdGlvbiA9IG9yaWVudGF0aW9uLno7XG4gICAgdGhpcy5yYXlQbGFuZUluQkJveChyYXksIHBsYW5lQUFCQiwgYmJveCwgaW50ZXJzZWN0aW9ucyk7XG5cbiAgICAvLyBSQVlTIFNUQVJUSU5HIEZST00gVEhFIExBU1QgQ09STkVSXG4gICAgLy9cbiAgICAvLyAgICAgICAgICAgICAgICtcbiAgICAvLyAgICAgICAgICAgICAuJ1xuICAgIC8vICAgKy0tLS0tLS0rJ1xuICAgIC8vICAgICAgICAgICB8XG4gICAgLy8gICAgICAgICAgIHxcbiAgICAvLyAgICAgICAgICAgfFxuICAgIC8vICAgICAgICAgICArXG4gICAgLy9cblxuICAgIGxldCByYXkyID0gdGhpcy5wb3NkaXIoXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMyhhYWJiLmNlbnRlci54ICsgYWFiYi5oYWxmRGltZW5zaW9ucy54LCBhYWJiLmNlbnRlci55ICsgYWFiYi5oYWxmRGltZW5zaW9ucy55LCBhYWJiLmNlbnRlci56ICsgYWFiYi5oYWxmRGltZW5zaW9ucy56KSxcbiAgICAgIG9yaWVudGF0aW9uLnhcbiAgICApO1xuICAgIHRoaXMucmF5UGxhbmVJbkJCb3gocmF5MiwgcGxhbmVBQUJCLCBiYm94LCBpbnRlcnNlY3Rpb25zKTtcblxuICAgIHJheTIuZGlyZWN0aW9uID0gb3JpZW50YXRpb24ueTtcbiAgICB0aGlzLnJheVBsYW5lSW5CQm94KHJheTIsIHBsYW5lQUFCQiwgYmJveCwgaW50ZXJzZWN0aW9ucyk7XG5cbiAgICByYXkyLmRpcmVjdGlvbiA9IG9yaWVudGF0aW9uLno7XG4gICAgdGhpcy5yYXlQbGFuZUluQkJveChyYXkyLCBwbGFuZUFBQkIsIGJib3gsIGludGVyc2VjdGlvbnMpO1xuXG4gICAgLy8gUkFZUyBTVEFSVElORyBGUk9NIFRIRSBTRUNPTkQgQ09STkVSXG4gICAgLy9cbiAgICAvLyAgICAgICAgICAgICAgICtcbiAgICAvLyAgICAgICAgICAgICAgIHxcbiAgICAvLyAgICAgICAgICAgICAgIHxcbiAgICAvLyAgICAgICAgICAgICAgIHxcbiAgICAvLyAgICAgICAgICAgICAgICtcbiAgICAvLyAgICAgICAgICAgICAuJ1xuICAgIC8vICAgICAgICAgICArJ1xuXG4gICAgbGV0IHJheTMgPSB0aGlzLnBvc2RpcihcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKGFhYmIuY2VudGVyLnggKyBhYWJiLmhhbGZEaW1lbnNpb25zLngsIGFhYmIuY2VudGVyLnkgLSBhYWJiLmhhbGZEaW1lbnNpb25zLnksIGFhYmIuY2VudGVyLnogLSBhYWJiLmhhbGZEaW1lbnNpb25zLnopLFxuICAgICAgb3JpZW50YXRpb24ueVxuICAgICk7XG4gICAgdGhpcy5yYXlQbGFuZUluQkJveChyYXkzLCBwbGFuZUFBQkIsIGJib3gsIGludGVyc2VjdGlvbnMpO1xuXG4gICAgcmF5My5kaXJlY3Rpb24gPSBvcmllbnRhdGlvbi56O1xuICAgIHRoaXMucmF5UGxhbmVJbkJCb3gocmF5MywgcGxhbmVBQUJCLCBiYm94LCBpbnRlcnNlY3Rpb25zKTtcblxuICAgIC8vIFJBWVMgU1RBUlRJTkcgRlJPTSBUSEUgVEhJUkQgQ09STkVSXG4gICAgLy9cbiAgICAvLyAgICAgIC4rLS0tLS0tLStcbiAgICAvLyAgICAuJ1xuICAgIC8vICAgK1xuICAgIC8vXG4gICAgLy9cbiAgICAvL1xuICAgIC8vXG5cbiAgICBsZXQgcmF5NCA9IHRoaXMucG9zZGlyKFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoYWFiYi5jZW50ZXIueCAtIGFhYmIuaGFsZkRpbWVuc2lvbnMueCwgYWFiYi5jZW50ZXIueSArIGFhYmIuaGFsZkRpbWVuc2lvbnMueSwgYWFiYi5jZW50ZXIueiAtIGFhYmIuaGFsZkRpbWVuc2lvbnMueiksXG4gICAgICBvcmllbnRhdGlvbi54XG4gICAgKTtcbiAgICB0aGlzLnJheVBsYW5lSW5CQm94KHJheTQsIHBsYW5lQUFCQiwgYmJveCwgaW50ZXJzZWN0aW9ucyk7XG5cbiAgICByYXk0LmRpcmVjdGlvbiA9IG9yaWVudGF0aW9uLno7XG4gICAgdGhpcy5yYXlQbGFuZUluQkJveChyYXk0LCBwbGFuZUFBQkIsIGJib3gsIGludGVyc2VjdGlvbnMpO1xuXG4gICAgLy8gUkFZUyBTVEFSVElORyBGUk9NIFRIRSBGT1VSVEggQ09STkVSXG4gICAgLy9cbiAgICAvL1xuICAgIC8vXG4gICAgLy8gICArXG4gICAgLy8gICB8XG4gICAgLy8gICB8XG4gICAgLy8gICB8XG4gICAgLy8gICArLS0tLS0tLStcblxuICAgIGxldCByYXk1ID0gdGhpcy5wb3NkaXIoXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMyhhYWJiLmNlbnRlci54IC0gYWFiYi5oYWxmRGltZW5zaW9ucy54LCBhYWJiLmNlbnRlci55IC0gYWFiYi5oYWxmRGltZW5zaW9ucy55LCBhYWJiLmNlbnRlci56ICsgYWFiYi5oYWxmRGltZW5zaW9ucy56KSxcbiAgICAgIG9yaWVudGF0aW9uLnhcbiAgICApO1xuICAgIHRoaXMucmF5UGxhbmVJbkJCb3gocmF5NSwgcGxhbmVBQUJCLCBiYm94LCBpbnRlcnNlY3Rpb25zKTtcblxuICAgIHJheTUuZGlyZWN0aW9uID0gb3JpZW50YXRpb24ueTtcbiAgICB0aGlzLnJheVBsYW5lSW5CQm94KHJheTUsIHBsYW5lQUFCQiwgYmJveCwgaW50ZXJzZWN0aW9ucyk7XG5cbiAgICAvLyBAdG9kbyBtYWtlIHN1cmUgb2JqZWN0cyBhcmUgdW5pcXVlLi4uXG5cbiAgICAvLyBiYWNrIHRvIG9yaWdpbmFsIHNwYWNlXG4gICAgaW50ZXJzZWN0aW9ucy5tYXAoXG4gICAgICBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBlbGVtZW50LmFwcGx5TWF0cml4NChmcm9tQUFCQik7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiBpbnRlcnNlY3Rpb25zO1xuICB9XG5cbi8qKlxuICogQ29tcHV0ZSBpbnRlcnNlY3Rpb24gYmV0d2VlbiBhIHJheSBhbmQgYSBwbGFuZS5cbiAqXG4gKiBAbWVtYmVyT2YgdGhpc1xuICogQHB1YmxpY1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByYXkgLSBSYXkgcmVwcmVzZW50YXRpb24uXG4gKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjN9IHJheS5wb3NpdGlvbiAtIHBvc2l0aW9uIG9mIG5vcm1hbCB3aGljaCBkZXNjcmliZXMgdGhlIHJheS5cbiAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yM30gcmF5LmRpcmVjdGlvbiAtIERpcmVjdGlvbiBvZiBub3JtYWwgd2hpY2ggZGVzY3JpYmVzIHRoZSByYXkuXG4gKiBAcGFyYW0ge09iamVjdH0gcGxhbmUgLSBQbGFuZSByZXByZXNlbnRhdGlvblxuICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzfSBwbGFuZS5wb3NpdGlvbiAtIHBvc2l0aW9uIG9mIG5vcm1hbCB3aGljaCBkZXNjcmliZXMgdGhlIHBsYW5lLlxuICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzfSBwbGFuZS5kaXJlY3Rpb24gLSBEaXJlY3Rpb24gb2Ygbm9ybWFsIHdoaWNoIGRlc2NyaWJlcyB0aGUgcGxhbmUuXG4gKlxuICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN8bnVsbH0gSW50ZXJzZWN0aW9uIGJldHdlZW4gcmF5IGFuZCBwbGFuZSBvciBudWxsLlxuICovXG4gIHN0YXRpYyByYXlQbGFuZShyYXksIHBsYW5lKSB7XG4gIC8vIHJheToge3Bvc2l0aW9uLCBkaXJlY3Rpb259XG4gIC8vIHBsYW5lOiB7cG9zaXRpb24sIGRpcmVjdGlvbn1cblxuICBpZiAocmF5LmRpcmVjdGlvbi5kb3QocGxhbmUuZGlyZWN0aW9uKSAhPT0gMCkge1xuICAgIC8vXG4gICAgLy8gbm90IHBhcmFsbGVsLCBtb3ZlIGZvcndhcmRcbiAgICAvL1xuICAgIC8vIExPR0lDOlxuICAgIC8vXG4gICAgLy8gUmF5IGVxdWF0aW9uOiBQID0gUDAgKyB0VlxuICAgIC8vIFAgPSA8UHgsIFB5LCBQej5cbiAgICAvLyBQMCA9IDxyYXkucG9zaXRpb24ueCwgcmF5LnBvc2l0aW9uLnksIHJheS5wb3NpdGlvbi56PlxuICAgIC8vIFYgPSA8cmF5LmRpcmVjdGlvbi54LCByYXkuZGlyZWN0aW9uLnksIHJheS5kaXJlY3Rpb24uej5cbiAgICAvL1xuICAgIC8vIFRoZXJlZm9yZTpcbiAgICAvLyBQeCA9IHJheS5wb3NpdGlvbi54ICsgdCpyYXkuZGlyZWN0aW9uLnhcbiAgICAvLyBQeSA9IHJheS5wb3NpdGlvbi55ICsgdCpyYXkuZGlyZWN0aW9uLnlcbiAgICAvLyBQeiA9IHJheS5wb3NpdGlvbi56ICsgdCpyYXkuZGlyZWN0aW9uLnpcbiAgICAvL1xuICAgIC8vXG4gICAgLy9cbiAgICAvLyBQbGFuZSBlcXVhdGlvbjogYXggKyBieSArIGN6ICsgZCA9IDBcbiAgICAvLyBhID0gcGxhbmUuZGlyZWN0aW9uLnhcbiAgICAvLyBiID0gcGxhbmUuZGlyZWN0aW9uLnlcbiAgICAvLyBjID0gcGxhbmUuZGlyZWN0aW9uLnpcbiAgICAvLyBkID0gLSggcGxhbmUuZGlyZWN0aW9uLngqcGxhbmUucG9zaXRpb24ueCArXG4gICAgLy8gICAgICAgIHBsYW5lLmRpcmVjdGlvbi55KnBsYW5lLnBvc2l0aW9uLnkgK1xuICAgIC8vICAgICAgICBwbGFuZS5kaXJlY3Rpb24ueipwbGFuZS5wb3NpdGlvbi56IClcbiAgICAvL1xuICAgIC8vXG4gICAgLy8gMS0gaW4gdGhlIHBsYW5lIGVxdWF0aW9uLCB3ZSByZXBsYWNlIHgsIHkgYW5kIHogYnkgUHgsIFB5IGFuZCBQelxuICAgIC8vIDItIGZpbmQgdFxuICAgIC8vIDMtIHJlcGxhY2UgdCBpbiBQeCwgUHkgYW5kIFB6IHRvIGdldCB0aGUgY29vcmRpbmF0ZSBvZiB0aGUgaW50ZXJzZWN0aW9uXG4gICAgLy9cbiAgICBsZXQgdCA9IChwbGFuZS5kaXJlY3Rpb24ueCAqIChwbGFuZS5wb3NpdGlvbi54IC0gcmF5LnBvc2l0aW9uLngpICsgcGxhbmUuZGlyZWN0aW9uLnkgKiAocGxhbmUucG9zaXRpb24ueSAtIHJheS5wb3NpdGlvbi55KSArIHBsYW5lLmRpcmVjdGlvbi56ICogKHBsYW5lLnBvc2l0aW9uLnogLSByYXkucG9zaXRpb24ueikpIC9cbiAgICAgICAgKHBsYW5lLmRpcmVjdGlvbi54ICogcmF5LmRpcmVjdGlvbi54ICsgcGxhbmUuZGlyZWN0aW9uLnkgKiByYXkuZGlyZWN0aW9uLnkgKyBwbGFuZS5kaXJlY3Rpb24ueiAqIHJheS5kaXJlY3Rpb24ueik7XG5cbiAgICBsZXQgaW50ZXJzZWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICAgIHJheS5wb3NpdGlvbi54ICsgdCAqIHJheS5kaXJlY3Rpb24ueCxcbiAgICAgICAgcmF5LnBvc2l0aW9uLnkgKyB0ICogcmF5LmRpcmVjdGlvbi55LFxuICAgICAgICByYXkucG9zaXRpb24ueiArIHQgKiByYXkuZGlyZWN0aW9uLnopO1xuXG4gICAgcmV0dXJuIGludGVyc2VjdGlvbjtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4gIHN0YXRpYyByYXlCb3gocmF5LCBib3gpIHtcbiAgICAvLyBzaG91bGQgYWxzbyBkbyB0aGUgc3BhY2UgdHJhbnNmb3JtcyBoZXJlXG4gICAgLy8gcmF5OiB7cG9zaXRpb24sIGRpcmVjdGlvbn1cbiAgICAvLyBib3g6IHtoYWxmRGltZW5zaW9ucywgY2VudGVyfVxuXG4gICAgbGV0IGludGVyc2VjdGlvbnMgPSBbXTtcblxuICAgIGxldCBiYm94ID0gVXRpbHMuYmJveChib3guY2VudGVyLCBib3guaGFsZkRpbWVuc2lvbnMpO1xuXG4gICAgLy8gd2luZG93LmNvbnNvbGUubG9nKGJib3gpO1xuXG4gICAgLy8gWCBtaW5cbiAgICBsZXQgcGxhbmUgPSB0aGlzLnBvc2RpcihcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICBiYm94Lm1pbi54LFxuICAgICAgICBib3guY2VudGVyLnksXG4gICAgICAgIGJveC5jZW50ZXIueiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMygtMSwgMCwgMClcbiAgICApO1xuICAgIHRoaXMucmF5UGxhbmVJbkJCb3gocmF5LCBwbGFuZSwgYmJveCwgaW50ZXJzZWN0aW9ucyk7XG5cbiAgICAvLyBYIG1heFxuICAgIHBsYW5lID0gdGhpcy5wb3NkaXIoXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgICAgYmJveC5tYXgueCxcbiAgICAgICAgYm94LmNlbnRlci55LFxuICAgICAgICBib3guY2VudGVyLnopLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMClcbiAgICApO1xuICAgIHRoaXMucmF5UGxhbmVJbkJCb3gocmF5LCBwbGFuZSwgYmJveCwgaW50ZXJzZWN0aW9ucyk7XG5cbiAgICAvLyBZIG1pblxuICAgIHBsYW5lID0gdGhpcy5wb3NkaXIoXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgICAgYm94LmNlbnRlci54LFxuICAgICAgICBiYm94Lm1pbi55LFxuICAgICAgICBib3guY2VudGVyLnopLFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoMCwgLTEsIDApXG4gICAgKTtcbiAgICB0aGlzLnJheVBsYW5lSW5CQm94KHJheSwgcGxhbmUsIGJib3gsIGludGVyc2VjdGlvbnMpO1xuXG4gICAgLy8gWSBtYXhcbiAgICBwbGFuZSA9IHRoaXMucG9zZGlyKFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICAgIGJveC5jZW50ZXIueCxcbiAgICAgICAgYmJveC5tYXgueSxcbiAgICAgICAgYm94LmNlbnRlci56KSxcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApXG4gICAgKTtcbiAgICB0aGlzLnJheVBsYW5lSW5CQm94KHJheSwgcGxhbmUsIGJib3gsIGludGVyc2VjdGlvbnMpO1xuXG4gICAgLy8gWiBtaW5cbiAgICBwbGFuZSA9IHRoaXMucG9zZGlyKFxuICAgICAgbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICAgIGJveC5jZW50ZXIueCxcbiAgICAgICAgYm94LmNlbnRlci55LFxuICAgICAgICBiYm94Lm1pbi56KSxcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIC0xKVxuICAgICk7XG4gICAgdGhpcy5yYXlQbGFuZUluQkJveChyYXksIHBsYW5lLCBiYm94LCBpbnRlcnNlY3Rpb25zKTtcblxuICAgIC8vIFogbWF4XG4gICAgcGxhbmUgPSB0aGlzLnBvc2RpcihcbiAgICAgIG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICBib3guY2VudGVyLngsXG4gICAgICAgIGJveC5jZW50ZXIueSxcbiAgICAgICAgYmJveC5tYXgueiksXG4gICAgICBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKVxuICAgICk7XG4gICAgdGhpcy5yYXlQbGFuZUluQkJveChyYXksIHBsYW5lLCBiYm94LCBpbnRlcnNlY3Rpb25zKTtcblxuICAgIHJldHVybiBpbnRlcnNlY3Rpb25zO1xuICB9XG5cblxuICBzdGF0aWMgcmF5UGxhbmVJbkJCb3gocmF5LCBwbGFuZUFBQkIsIGJib3gsIGludGVyc2VjdGlvbnMpIHtcbiAgICBsZXQgaW50ZXJzZWN0aW9uID0gdGhpcy5yYXlQbGFuZShyYXksIHBsYW5lQUFCQik7XG4gICAgLy8gd2luZG93LmNvbnNvbGUubG9nKGludGVyc2VjdGlvbik7XG4gICAgaWYgKGludGVyc2VjdGlvbiAmJiB0aGlzLmluQkJveChpbnRlcnNlY3Rpb24sIGJib3gpKSB7XG4gICAgICBpZighaW50ZXJzZWN0aW9ucy5maW5kKHRoaXMuZmluZEludGVyc2VjdGlvbihpbnRlcnNlY3Rpb24pKSkge1xuICAgICAgICBpbnRlcnNlY3Rpb25zLnB1c2goaW50ZXJzZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzdGF0aWMgZmluZEludGVyc2VjdGlvbihteWludGVyc2VjdGlvbikge1xuICAgIHJldHVybiBmdW5jdGlvbiBmb3VuZChlbGVtZW50LCBpbmRleCwgYXJyYXkpIHtcbiAgICAgIGlmKG15aW50ZXJzZWN0aW9uLnggPT09IGVsZW1lbnQueCAmJlxuICAgICAgICBteWludGVyc2VjdGlvbi55ID09PSBlbGVtZW50LnkgJiZcbiAgICAgICAgbXlpbnRlcnNlY3Rpb24ueiA9PT0gZWxlbWVudC56KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgfVxuXG4gIHN0YXRpYyBpbkJCb3gocG9pbnQsIGJib3gpIHtcbiAgICAvL1xuICAgIGxldCBlcHNpbG9uID0gMC4wMDAxO1xuICAgIGlmIChwb2ludCAmJlxuICAgICAgICBwb2ludC54ID49IGJib3gubWluLnggLSBlcHNpbG9uICYmIHBvaW50LnkgPj0gYmJveC5taW4ueSAtIGVwc2lsb24gJiYgcG9pbnQueiA+PSBiYm94Lm1pbi56IC0gZXBzaWxvbiAmJlxuICAgICAgICBwb2ludC54IDw9IGJib3gubWF4LnggKyBlcHNpbG9uICYmIHBvaW50LnkgPD0gYmJveC5tYXgueSArIGVwc2lsb24gJiYgcG9pbnQueiA8PSBiYm94Lm1heC56ICsgZXBzaWxvbikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0YXRpYyBwb3NkaXIocG9zaXRpb24sIGRpcmVjdGlvbikge1xuICAgIHJldHVybiB7cG9zaXRpb24sIGRpcmVjdGlvbn07XG4gIH1cblxuICBzdGF0aWMgdmFsaWRhdGVQbGFuZShwbGFuZSkge1xuICAgIC8vXG4gICAgaWYocGxhbmUgPT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5jb25zb2xlLmxvZygnSW52YWxpZCBwbGFuZS4nKTtcbiAgICAgIHdpbmRvdy5jb25zb2xlLmxvZyhwbGFuZSk7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZighVmFsaWRhdG9ycy52ZWN0b3IzKHBsYW5lLnBvc2l0aW9uKSkge1xuICAgICAgd2luZG93LmNvbnNvbGUubG9nKCdJbnZhbGlkIHBsYW5lLnBvc2l0aW9uLicpO1xuICAgICAgd2luZG93LmNvbnNvbGUubG9nKHBsYW5lLnBvc2l0aW9uKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmKCFWYWxpZGF0b3JzLnZlY3RvcjMocGxhbmUuZGlyZWN0aW9uKSkge1xuICAgICAgd2luZG93LmNvbnNvbGUubG9nKCdJbnZhbGlkIHBsYW5lLmRpcmVjdGlvbi4nKTtcbiAgICAgIHdpbmRvdy5jb25zb2xlLmxvZyhwbGFuZS5kaXJlY3Rpb24pO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBzdGF0aWMgdmFsaWRhdGVBYWJiKGFhYmIpIHtcbiAgICAvL1xuICAgIGlmKGFhYmIgPT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5jb25zb2xlLmxvZygnSW52YWxpZCBhYWJiLicpO1xuICAgICAgd2luZG93LmNvbnNvbGUubG9nKGFhYmIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmKCFWYWxpZGF0b3JzLm1hdHJpeDQoYWFiYi50b0FBQkIpKSB7XG4gICAgICB3aW5kb3cuY29uc29sZS5sb2coJ0ludmFsaWQgYWFiYi50b0FBQkI6ICcpO1xuICAgICAgd2luZG93LmNvbnNvbGUubG9nKGFhYmIudG9BQUJCKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmKCFWYWxpZGF0b3JzLnZlY3RvcjMoYWFiYi5jZW50ZXIpKSB7XG4gICAgICB3aW5kb3cuY29uc29sZS5sb2coJ0ludmFsaWQgYWFiYi5jZW50ZXIuJyk7XG4gICAgICB3aW5kb3cuY29uc29sZS5sb2coYWFiYi5jZW50ZXIpO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYoIShWYWxpZGF0b3JzLnZlY3RvcjMoYWFiYi5oYWxmRGltZW5zaW9ucykgJiZcbiAgICAgICBhYWJiLmhhbGZEaW1lbnNpb25zLnggPj0gMCAmJlxuICAgICAgIGFhYmIuaGFsZkRpbWVuc2lvbnMueSA+PSAwICYmXG4gICAgICAgYWFiYi5oYWxmRGltZW5zaW9ucy56ID49IDApKSB7XG4gICAgICB3aW5kb3cuY29uc29sZS5sb2coJ0ludmFsaWQgYWFiYi5oYWxmRGltZW5zaW9ucy4nKTtcbiAgICAgIHdpbmRvdy5jb25zb2xlLmxvZyhhYWJiLmhhbGZEaW1lbnNpb25zKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbn1cbiIsImltcG9ydCBWYWxpZGF0b3JzIGZyb20gJy4vY29yZS52YWxpZGF0b3JzJztcblxuLyoqXG4gKiBHZW5lcmFsIHB1cnBvc2UgZnVuY3Rpb25zLlxuICpcbiAqIEBtb2R1bGUgY29yZS91dGlsc1xuICovXG5cbi8vIE1pc3NpbmcgYWxsIGdvb2Qgc3R1ZmZcbi8vIGNyaXRpY2FsIGZvciB0ZXN0aW5nXG4vLyB0cmFuc2Zvcm0gKCBJSksgPC0+IFJBUylcbi8vIGJvdW5kaW5nIGJveCAoSUpLLCBSQVMsIEF4ZWQgQWxpZ25lZClcbi8vIG1pbkJvdW5kXG4vLyBtYXhCb3VuZFxuLy8gaGFsZiBkaW1lbnNpb25zLCBldGMuXG4vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBVdGlscyB7XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgYm91ZGluZyBib3ggb2JqZWN0LlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjN9IGNlbnRlciAtIENlbnRlciBvZiB0aGUgYm94LlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjN9IGhhbGZEaW1lbnNpb25zIC0gSGFsZiBEaW1lbnNpb25zIG9mIHRoZSBib3guXG4gICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGJvdW5kaW5nIGJveCBvYmplY3QuIHtPYmplY3QubWlufSBpcyBhIHtUSFJFRS5WZWN0b3IzfVxuICAgKiBjb250YWluaW5nIHRoZSBtaW4gYm91bmRzLiB7T2JqZWN0Lm1heH0gaXMgYSB7VEhSRUUuVmVjdG9yM30gY29udGFpbmluZyB0aGVcbiAgICogbWF4IGJvdW5kcy5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gRmFsc2UgaW5wdXQgTk9UIHZhbGlkLlxuICAgKiBAZXhhbXBsZVxuICAgKiAvLyBSZXR1cm5zXG4gICAqIC8veyBtaW46IHsgeCA6IDAsIHkgOiAwLCAgeiA6IDAgfSxcbiAgICogLy8gIG1heDogeyB4IDogMiwgeSA6IDQsICB6IDogNiB9XG4gICAqIC8vfVxuICAgKiBWSlMuQ29yZS5VdGlscy5iYm94KCBuZXcgVEhSRUUuVmVjdG9yMygxLCAyLCAzKSwgbmV3IFRIUkVFLlZlY3RvcjMoMSwgMiwgMykpO1xuICAgKlxuICAgKiAvL1JldHVybnMgZmFsc2VcbiAgICogVkpTLkNvcmUuVXRpbHMuYmJveChuZXcgVEhSRUUuVmVjdG9yMygpLCBuZXcgVEhSRUUuTWF0cml4NCgpKTtcbiAgICpcbiAgICovXG4gIHN0YXRpYyBiYm94KGNlbnRlciwgaGFsZkRpbWVuc2lvbnMpIHtcbiAgICAvLyBtYWtlIHN1cmUgd2UgaGF2ZSB2YWxpZCBpbnB1dHNcbiAgICBpZighKFZhbGlkYXRvcnMudmVjdG9yMyhjZW50ZXIpICYmXG4gICAgICBWYWxpZGF0b3JzLnZlY3RvcjMoaGFsZkRpbWVuc2lvbnMpKSkge1xuICAgICAgd2luZG93LmNvbnNvbGUubG9nKCdJbnZhbGlkIGNlbnRlciBvciBwbGFuZSBoYWxmRGltZW5zaW9ucy4nKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBtYWtlIHN1cmUgaGFsZiBkaW1lbnNpb25zIGFyZSA+PSAwXG4gICAgaWYoIShoYWxmRGltZW5zaW9ucy54ID49IDAgJiZcbiAgICAgIGhhbGZEaW1lbnNpb25zLnkgPj0gMCAmJlxuICAgICAgaGFsZkRpbWVuc2lvbnMueiA+PSAwKSkge1xuICAgICAgd2luZG93LmNvbnNvbGUubG9nKCdoYWxmRGltZW5zaW9ucyBtdXN0IGJlID49IDAuJyk7XG4gICAgICB3aW5kb3cuY29uc29sZS5sb2coaGFsZkRpbWVuc2lvbnMpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIG1pbi9tYXggYm91bmRcbiAgICBsZXQgbWluID0gY2VudGVyLmNsb25lKCkuc3ViKGhhbGZEaW1lbnNpb25zKTtcbiAgICBsZXQgbWF4ID0gY2VudGVyLmNsb25lKCkuYWRkKGhhbGZEaW1lbnNpb25zKTtcblxuICAgIHJldHVybiB7XG4gICAgICBtaW4sXG4gICAgICBtYXgsXG4gICAgfTtcbiAgfVxuXG4gIHN0YXRpYyBtaW5NYXhQaXhlbERhdGEocGl4ZWxEYXRhID0gW10pIHtcbiAgICBsZXQgbWluTWF4ID0gWzY1NTM1LCAtMzI3NjhdO1xuICAgIGxldCBudW1QaXhlbHMgPSBwaXhlbERhdGEubGVuZ3RoO1xuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IG51bVBpeGVsczsgaW5kZXgrKykge1xuICAgICAgbGV0IHNwdiA9IHBpeGVsRGF0YVtpbmRleF07XG4gICAgICBtaW5NYXhbMF0gPSBNYXRoLm1pbihtaW5NYXhbMF0sIHNwdik7XG4gICAgICBtaW5NYXhbMV0gPSBNYXRoLm1heChtaW5NYXhbMV0sIHNwdik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1pbk1heDtcbiAgfVxufVxuIiwiLyoqXG4gKiBWYWxpZGF0ZSBiYXNpYyBzdHJ1Y3R1cmVzLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvL1JldHVybnMgdHJ1ZVxuICogVkpTLkNvcmUuVmFsaWRhdG9ycy5tYXRyaXg0KG5ldyBUSFJFRS5NYXRyaXg0KCkpO1xuICpcbiAqIC8vUmV0dXJucyBmYWxzZVxuICogVkpTLkNvcmUuVmFsaWRhdG9ycy5tYXRyaXg0KG5ldyBUSFJFRS5WZWN0b3IzKCkpO1xuICpcbiAqIEBtb2R1bGUgY29yZS92YWxpZGF0b3JzXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmFsaWRhdG9ycyB7XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlcyBhIG1hdHJpeCBhcyBhIFRIUkVFSlMuTWF0cml4NFxuICAgKiBsaW5rXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RUb1Rlc3QgLSBUaGUgb2JqZWN0IHRvIGJlIHRlc3RlZC5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWxpZCBNYXRyaXg0LCBmYWxzZSBpZiBOT1QuXG4gICAqL1xuICBzdGF0aWMgbWF0cml4NChvYmplY3RUb1Rlc3QpIHtcbiAgICBpZighKG9iamVjdFRvVGVzdCAhPT0gbnVsbCAmJlxuICAgICAgIHR5cGVvZiBvYmplY3RUb1Rlc3QgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgb2JqZWN0VG9UZXN0Lmhhc093blByb3BlcnR5KCdlbGVtZW50cycpICYmXG4gICAgICAgb2JqZWN0VG9UZXN0LmVsZW1lbnRzLmxlbmd0aCA9PT0gMTYgJiZcbiAgICAgICB0eXBlb2Ygb2JqZWN0VG9UZXN0LmlkZW50aXR5ID09PSAnZnVuY3Rpb24nJiZcbiAgICAgICB0eXBlb2Ygb2JqZWN0VG9UZXN0LmNvcHkgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICB0eXBlb2Ygb2JqZWN0VG9UZXN0LmRldGVybWluYW50ID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICogVmFsaWRhdGVzIGEgdmVjdG9yIGFzIGEgVEhSRUVKUy5WZWN0b3IzXG4gICogQHBhcmFtIHtPYmplY3R9IG9iamVjdFRvVGVzdCAtIFRoZSBvYmplY3QgdG8gYmUgdGVzdGVkLlxuICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdmFsaWQgVmVjdG9yMywgZmFsc2UgaWYgTk9ULlxuICAqL1xuICBzdGF0aWMgdmVjdG9yMyhvYmplY3RUb1Rlc3QpIHtcbiAgICBpZighKG9iamVjdFRvVGVzdCAhPT0gbnVsbCAmJlxuICAgICAgIHR5cGVvZiBvYmplY3RUb1Rlc3QgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgb2JqZWN0VG9UZXN0Lmhhc093blByb3BlcnR5KCd4JykgJiZcbiAgICAgICBvYmplY3RUb1Rlc3QuaGFzT3duUHJvcGVydHkoJ3knKSAmJlxuICAgICAgIG9iamVjdFRvVGVzdC5oYXNPd25Qcm9wZXJ0eSgneicpICYmXG4gICAgICAgIW9iamVjdFRvVGVzdC5oYXNPd25Qcm9wZXJ0eSgndycpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAvKipcbiAgKiBWYWxpZGF0ZXMgYSBib3guXG4gICpcbiAgKiBAZXhhbXBsZVxuICAqIC8vIGEgYm94IGlzIGRlZmluZWQgYXNcbiAgKiBsZXQgYm94ID0ge1xuICAqICAgY2VudGVyOiBUSFJFRS5WZWN0b3IzLFxuICAqICAgaGFsZkRpbWVuc2lvbnM6IFRIUkVFLlZlY3RvcjNcbiAgKiB9XG4gICpcbiAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0VG9UZXN0IC0gVGhlIG9iamVjdCB0byBiZSB0ZXN0ZWQuXG4gICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWxpZCBib3gsIGZhbHNlIGlmIE5PVC5cbiAgKi9cbiAgc3RhdGljIGJveChvYmplY3RUb1Rlc3QpIHtcbiAgICBpZighKG9iamVjdFRvVGVzdCAhPT0gbnVsbCAmJlxuICAgICAgIHR5cGVvZiBvYmplY3RUb1Rlc3QgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgb2JqZWN0VG9UZXN0Lmhhc093blByb3BlcnR5KCdjZW50ZXInKSAmJlxuICAgICAgIHRoaXMudmVjdG9yMyhvYmplY3RUb1Rlc3QuY2VudGVyKSAmJlxuICAgICAgIG9iamVjdFRvVGVzdC5oYXNPd25Qcm9wZXJ0eSgnaGFsZkRpbWVuc2lvbnMnKSAmJlxuICAgICAgIHRoaXMudmVjdG9yMyhvYmplY3RUb1Rlc3QuaGFsZkRpbWVuc2lvbnMpICYmXG4gICAgICAgb2JqZWN0VG9UZXN0LmhhbGZEaW1lbnNpb25zLnggPj0gMCAmJlxuICAgICAgIG9iamVjdFRvVGVzdC5oYWxmRGltZW5zaW9ucy55ID49IDAgJiZcbiAgICAgICBvYmplY3RUb1Rlc3QuaGFsZkRpbWVuc2lvbnMueiA+PSAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAvKipcbiAgKiBWYWxpZGF0ZXMgYSByYXkuXG4gICpcbiAgKiBAZXhhbXBsZVxuICAqIC8vIGEgcmF5IGlzIGRlZmluZWQgYXNcbiAgKiBsZXQgcmF5ID0ge1xuICAqICAgcG9zdGlvbjogVEhSRUUuVmVjdG9yMyxcbiAgKiAgIGRpcmVjdGlvbjogVEhSRUUuVmVjdG9yM1xuICAqIH1cbiAgKlxuICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RUb1Rlc3QgLSBUaGUgb2JqZWN0IHRvIGJlIHRlc3RlZC5cbiAgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHZhbGlkIHJheSwgZmFsc2UgaWYgTk9ULlxuICAqL1xuICBzdGF0aWMgcmF5KG9iamVjdFRvVGVzdCkge1xuICAgIGlmKCEob2JqZWN0VG9UZXN0ICE9PSBudWxsICYmXG4gICAgICAgdHlwZW9mIG9iamVjdFRvVGVzdCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICBvYmplY3RUb1Rlc3QuaGFzT3duUHJvcGVydHkoJ3Bvc2l0aW9uJykgJiZcbiAgICAgICB0aGlzLnZlY3RvcjMob2JqZWN0VG9UZXN0LnBvc2l0aW9uKSAmJlxuICAgICAgIG9iamVjdFRvVGVzdC5oYXNPd25Qcm9wZXJ0eSgnZGlyZWN0aW9uJykgJiZcbiAgICAgICB0aGlzLnZlY3RvcjMob2JqZWN0VG9UZXN0LmRpcmVjdGlvbikpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cbiIsIi8qKiAqIEltcG9ydHMgKioqL1xuaW1wb3J0IGNvcmVJbnRlcnNlY3Rpb25zIGZyb20gJy4uL2NvcmUvY29yZS5pbnRlcnNlY3Rpb25zJztcblxuLyoqXG4gKlxuICogSXQgaXMgdHlwaWNhbGx5IHVzZWQgZm9yIGNyZWF0aW5nIGFuIGlycmVndWxhciAzRCBwbGFuYXIgc2hhcGUgZ2l2ZW4gYSBib3ggYW5kIHRoZSBjdXQtcGxhbmUuXG4gKlxuICogRGVtbzoge0BsaW5rIGh0dHBzOi8vZm5uZHNjLmdpdGh1Yi5pby92anMjZ2VvbWV0cnlfc2xpY2V9XG4gKlxuICogQG1vZHVsZSBnZW9tZXRyaWVzL3NsaWNlXG4gKlxuICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzfSBoYWxmRGltZW5zaW9ucyAtIEhhbGYtZGltZW5zaW9ucyBvZiB0aGUgYm94IHRvIGJlIHNsaWNlZC5cbiAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yM30gY2VudGVyIC0gQ2VudGVyIG9mIHRoZSBib3ggdG8gYmUgc2xpY2VkLlxuICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPFRIUkVFLlZlY3RvcjM+fSBvcmllbnRhdGlvbiAtIE9yaWVudGF0aW9uIG9mIHRoZSBib3ggdG8gYmUgc2xpY2VkLiAobWlnaHQgbm90IGJlIG5lY2Vzc2FyeS4uPylcbiAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yM30gcG9zaXRpb24gLSBQb3NpdGlvbiBvZiB0aGUgY3V0dGluZyBwbGFuZS5cbiAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yM30gZGlyZWN0aW9uIC0gQ3Jvc3MgZGlyZWN0aW9uIG9mIHRoZSBjdXR0aW5nIHBsYW5lLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBEZWZpbmUgYm94IHRvIGJlIHNsaWNlZFxuICogbGV0IGhhbGZEaW1lbnNpb25zID0gbmV3IFRIUkVFLlZlY3RvcigxMjMsIDQ1LCA2Nyk7XG4gKiBsZXQgY2VudGVyID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCk7XG4gKiBsZXQgb3JpZW50YXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAqICAgbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCksXG4gKiAgIG5ldyBUSFJFRS5WZWN0b3IzKDAsIDEsIDApLFxuICogICBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKVxuICogKTtcbiAqXG4gKiAvLyBEZWZpbmUgc2xpY2UgcGxhbmVcbiAqIGxldCBwb3NpdGlvbiA9IGNlbnRlci5jbG9uZSgpO1xuICogbGV0IGRpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKC0wLjIsIDAuNSwgMC4zKTtcbiAqXG4gKiAvLyBDcmVhdGUgdGhlIHNsaWNlIGdlb21ldHJ5ICYgbWF0ZXJpYWxzXG4gKiBsZXQgc2xpY2VHZW9tZXRyeSA9IG5ldyBWSlMuZ2VvbWV0cmllcy5zbGljZShoYWxmRGltZW5zaW9ucywgY2VudGVyLCBvcmllbnRhdGlvbiwgcG9zaXRpb24sIGRpcmVjdGlvbik7XG4gKiBsZXQgc2xpY2VNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gKiAgICdzaWRlJzogVEhSRUUuRG91YmxlU2lkZSxcbiAqICAgJ2NvbG9yJzogMHhGRjU3MjJcbiAqIH0pO1xuICpcbiAqICAvLyBDcmVhdGUgbWVzaCBhbmQgYWRkIGl0IHRvIHRoZSBzY2VuZVxuICogIGxldCBzbGljZSA9IG5ldyBUSFJFRS5NZXNoKHNsaWNlR2VvbWV0cnksIHNsaWNlTWF0ZXJpYWwpO1xuICogIHNjZW5lLmFkZChzbGljZSk7XG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VvbWV0cmllc1NsaWNlIGV4dGVuZHMgVEhSRUUuU2hhcGVHZW9tZXRyeSB7XG4gICAgY29uc3RydWN0b3IoaGFsZkRpbWVuc2lvbnMsIGNlbnRlciwgcG9zaXRpb24sIGRpcmVjdGlvbiwgdG9BQUJCID0gbmV3IFRIUkVFLk1hdHJpeDQoKSkge1xuICAgICAgLy9cbiAgICAgIC8vIHByZXBhcmUgZGF0YSBmb3IgdGhlIHNoYXBlIVxuICAgICAgLy9cbiAgICAgIGxldCBhYWJiID0ge1xuICAgICAgICBoYWxmRGltZW5zaW9ucyxcbiAgICAgICAgY2VudGVyLFxuICAgICAgICB0b0FBQkIsXG4gICAgICB9O1xuXG4gICAgICBsZXQgcGxhbmUgPSB7XG4gICAgICAgIHBvc2l0aW9uLFxuICAgICAgICBkaXJlY3Rpb24sXG4gICAgICB9O1xuXG4gICAgICAvLyBCT09NIVxuICAgICAgbGV0IGludGVyc2VjdGlvbnMgPSBjb3JlSW50ZXJzZWN0aW9ucy5hYWJiUGxhbmUoYWFiYiwgcGxhbmUpO1xuXG4gICAgICAvLyBjYW4gbm90IGV4aXN0IGJlZm9yZSBjYWxsaW5nIHRoZSBjb25zdHJ1Y3RvclxuICAgICAgaWYgKGludGVyc2VjdGlvbnMubGVuZ3RoIDwgMykge1xuICAgICAgICB3aW5kb3cuY29uc29sZS5sb2coJ1dBUk5JTkc6IExlc3MgdGhhbiAzIGludGVyc2VjdGlvbnMgYmV0d2VlbiBBQUJCIGFuZCBQbGFuZS4nKTtcbiAgICAgICAgd2luZG93LmNvbnNvbGUubG9nKCdBQUJCJyk7XG4gICAgICAgIHdpbmRvdy5jb25zb2xlLmxvZyhhYWJiKTtcbiAgICAgICAgd2luZG93LmNvbnNvbGUubG9nKCdQbGFuZScpO1xuICAgICAgICB3aW5kb3cuY29uc29sZS5sb2cocGxhbmUpO1xuICAgICAgICB3aW5kb3cuY29uc29sZS5sb2coJ2V4aXRpbmcuLi4nKTtcbiAgICAgICAgLy8gb3IgdGhyb3cgZXJyb3I/XG4gICAgICAgIHRocm93ICdnZW9tZXRyaWVzLnNsaWNlIGhhcyBsZXNzIHRoYW4gMyBpbnRlcnNlY3Rpb25zLCBjYW4gbm90IGNyZWF0ZSBhIHZhbGlkIGdlb21ldHJ5Lic7XG4gICAgICB9XG5cbiAgICAgIGxldCBvcmRlcmVkSW50ZXJzZWN0aW9ucyA9IEdlb21ldHJpZXNTbGljZS5vcmRlckludGVyc2VjdGlvbnMoaW50ZXJzZWN0aW9ucywgZGlyZWN0aW9uKTtcbiAgICAgIGxldCBzbGljZVNoYXBlID0gR2VvbWV0cmllc1NsaWNlLnNoYXBlKG9yZGVyZWRJbnRlcnNlY3Rpb25zKTtcblxuICAgICAgLy9cbiAgICAgIC8vIEdlbmVyYXRlIEdlb21ldHJ5IGZyb20gc2hhcGVcbiAgICAgIC8vIEl0IGRvZXMgdHJpYW5ndWxhdGlvbiBmb3IgdXMhXG4gICAgICAvL1xuICAgICAgc3VwZXIoc2xpY2VTaGFwZSk7XG4gICAgICB0aGlzLnR5cGUgPSAnU2xpY2VHZW9tZXRyeSc7XG5cbiAgICAgIC8vIHVwZGF0ZSByZWFsIHBvc2l0aW9uIG9mIGVhY2ggdmVydGV4ISAobm90IGluIDJkKVxuICAgICAgdGhpcy52ZXJ0aWNlcyA9IG9yZGVyZWRJbnRlcnNlY3Rpb25zO1xuICAgICAgdGhpcy52ZXJ0aWNlc05lZWRVcGRhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIHN0YXRpYyBzaGFwZShwb2ludHMpIHtcbiAgICAgIC8vXG4gICAgICAvLyBDcmVhdGUgU2hhcGVcbiAgICAgIC8vXG4gICAgICBsZXQgc2hhcGUgPSBuZXcgVEhSRUUuU2hhcGUoKTtcbiAgICAgIC8vIG1vdmUgdG8gZmlyc3QgcG9pbnQhXG4gICAgICBzaGFwZS5tb3ZlVG8ocG9pbnRzWzBdLnh5LngsIHBvaW50c1swXS54eS55KTtcblxuICAgICAgLy8gbG9vcCB0aHJvdWdoIGFsbCBwb2ludHMhXG4gICAgICBmb3IgKGxldCBsID0gMTsgbCA8IHBvaW50cy5sZW5ndGg7IGwrKykge1xuICAgICAgICAvLyBwcm9qZWN0IGVhY2ggb24gcGxhbmUhXG4gICAgICAgIHNoYXBlLmxpbmVUbyhwb2ludHNbbF0ueHkueCwgcG9pbnRzW2xdLnh5LnkpO1xuICAgICAgfVxuXG4gICAgICAvLyBjbG9zZSB0aGUgc2hhcGUhXG4gICAgICBzaGFwZS5saW5lVG8ocG9pbnRzWzBdLnh5LngsIHBvaW50c1swXS54eS55KTtcbiAgICAgIHJldHVybiBzaGFwZTtcbiAgICB9XG5cbiAvKipcbiAgKlxuICAqIENvbnZlbmllbmNlIGZ1bmN0aW9uIHRvIGV4dHJhY3QgY2VudGVyIG9mIG1hc3MgZnJvbSBsaXN0IG9mIHBvaW50cy5cbiAgKlxuICAqIEBwcml2YXRlXG4gICpcbiAgKiBAcGFyYW0ge0FycmF5PFRIUkVFLlZlY3RvcjM+fSBwb2ludHMgLSBTZXQgb2YgcG9pbnRzIGZyb20gd2hpY2ggd2Ugd2FudCB0byBleHRyYWN0IHRoZSBjZW50ZXIgb2YgbWFzcy5cbiAgKlxuICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfSBDZW50ZXIgb2YgbWFzcyBmcm9tIGdpdmVuIHBvaW50cy5cbiAgKi9cbiAgc3RhdGljIGNlbnRlck9mTWFzcyhwb2ludHMpIHtcbiAgICBsZXQgY2VudGVyT2ZNYXNzID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNlbnRlck9mTWFzcy54ICs9IHBvaW50c1tpXS54O1xuICAgICAgY2VudGVyT2ZNYXNzLnkgKz0gcG9pbnRzW2ldLnk7XG4gICAgICBjZW50ZXJPZk1hc3MueiArPSBwb2ludHNbaV0uejtcbiAgICB9XG4gICAgY2VudGVyT2ZNYXNzLmRpdmlkZVNjYWxhcihwb2ludHMubGVuZ3RoKTtcblxuICAgIHJldHVybiBjZW50ZXJPZk1hc3M7XG4gIH1cblxuIC8qKlxuICAqXG4gICogT3JkZXIgM0QgcGxhbmFyIHBvaW50cyBhcm91bmQgYSByZWZlbmNlIHBvaW50LlxuICAqXG4gICogQHByaXZhdGVcbiAgKlxuICAqIEBwYXJhbSB7QXJyYXk8VEhSRUUuVmVjdG9yMz59IHBvaW50cyAtIFNldCBvZiBwbGFuYXIgM0QgcG9pbnRzIHRvIGJlIG9yZGVyZWQuXG4gICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzfSBkaXJlY3Rpb24gLSBEaXJlY3Rpb24gb2YgdGhlIHBsYW5lIGluIHdoaWNoIHBvaW50cyBhbmQgcmVmZXJlbmNlIGFyZSBzaXR0aW5nLlxuICAqXG4gICogQHJldHVybnMge0FycmF5PE9iamVjdD59IFNldCBvZiBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBvcmRlcmVkIHBvaW50cy5cbiAgKi9cbiAgc3RhdGljIG9yZGVySW50ZXJzZWN0aW9ucyhwb2ludHMsIGRpcmVjdGlvbikge1xuICAgIGxldCByZWZlcmVuY2UgPSBHZW9tZXRyaWVzU2xpY2UuY2VudGVyT2ZNYXNzKHBvaW50cyk7XG4gICAgLy8gZGlyZWN0aW9uIGZyb20gZmlyc3QgcG9pbnQgdG8gcmVmZXJlbmNlXG4gICAgbGV0IHJlZmVyZW5jZURpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgcG9pbnRzWzBdLnggLSByZWZlcmVuY2UueCxcbiAgICAgIHBvaW50c1swXS55IC0gcmVmZXJlbmNlLnksXG4gICAgICBwb2ludHNbMF0ueiAtIHJlZmVyZW5jZS56XG4gICAgICApLm5vcm1hbGl6ZSgpO1xuXG4gICAgbGV0IGJhc2UgPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKVxuICAgICAgICAuY3Jvc3NWZWN0b3JzKHJlZmVyZW5jZURpcmVjdGlvbiwgZGlyZWN0aW9uKVxuICAgICAgICAubm9ybWFsaXplKCk7XG5cbiAgICBsZXQgb3JkZXJlZHBvaW50cyA9IFtdO1xuXG4gICAgLy8gb3RoZXIgbGluZXMgLy8gaWYgaW50ZXIsIHJldHVybiBsb2NhdGlvbiArIGFuZ2xlXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBwb2ludHMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGxldCBwb2ludCA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICBwb2ludHNbal0ueCxcbiAgICAgICAgcG9pbnRzW2pdLnksXG4gICAgICAgIHBvaW50c1tqXS56KTtcbiAgICAgIHBvaW50LmRpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICBwb2ludHNbal0ueCAtIHJlZmVyZW5jZS54LFxuICAgICAgICBwb2ludHNbal0ueSAtIHJlZmVyZW5jZS55LFxuICAgICAgICBwb2ludHNbal0ueiAtIHJlZmVyZW5jZS56KS5ub3JtYWxpemUoKTtcblxuICAgICAgbGV0IHggPSByZWZlcmVuY2VEaXJlY3Rpb24uZG90KHBvaW50LmRpcmVjdGlvbik7XG4gICAgICBsZXQgeSA9IGJhc2UuZG90KHBvaW50LmRpcmVjdGlvbik7XG4gICAgICBwb2ludC54eSA9IHt4LCB5fTtcblxuICAgICAgbGV0IHRoZXRhID0gTWF0aC5hdGFuMih5LCB4KSAqICgxODAgLyBNYXRoLlBJKTtcbiAgICAgIHBvaW50LmFuZ2xlID0gdGhldGE7XG5cbiAgICAgIG9yZGVyZWRwb2ludHMucHVzaChwb2ludCk7XG4gICAgfVxuXG4gICAgb3JkZXJlZHBvaW50cy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgIHJldHVybiBhLmFuZ2xlIC0gYi5hbmdsZTtcbiAgICB9KTtcblxuICAgIGxldCBub0R1cHMgPSBbb3JkZXJlZHBvaW50c1swXV07XG4gICAgbGV0IGVwc2lsb24gPSAwLjAwMDE7XG4gICAgZm9yKGxldCBpPTE7IGk8b3JkZXJlZHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoTWF0aC5hYnMob3JkZXJlZHBvaW50c1tpLTFdLmFuZ2xlIC0gb3JkZXJlZHBvaW50c1tpXS5hbmdsZSkgPiBlcHNpbG9uKSB7XG4gICAgICAgIG5vRHVwcy5wdXNoKG9yZGVyZWRwb2ludHNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBub0R1cHM7XG4gIH1cblxufVxuIiwiLyoqICogSW1wb3J0cyAqKiovXG5cbi8qKlxuICogQG1vZHVsZSBoZWxwZXJzL2JvcmRlclxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIZWxwZXJzQm9yZGVyIGV4dGVuZHMgVEhSRUUuT2JqZWN0M0Qge1xuICBjb25zdHJ1Y3RvcihoZWxwZXJzU2xpY2UpIHtcbiAgICAvL1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLl9oZWxwZXJzU2xpY2UgPSBoZWxwZXJzU2xpY2U7XG5cbiAgICB0aGlzLl92aXNpYmxlID0gdHJ1ZTtcbiAgICB0aGlzLl9jb2xvciA9IDB4ZmYwMDAwO1xuICAgIHRoaXMuX21hdGVyaWFsID0gbnVsbDtcbiAgICB0aGlzLl9nZW9tZXRyeSA9IG51bGw7XG4gICAgdGhpcy5fbWVzaCA9IG51bGw7XG5cbiAgICB0aGlzLl9jcmVhdGUoKTtcbiAgfVxuXG4gIHNldCBoZWxwZXJzU2xpY2UoaGVscGVyc1NsaWNlKSB7XG4gICAgdGhpcy5faGVscGVyc1NsaWNlID0gaGVscGVyc1NsaWNlO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgZ2V0IGhlbHBlcnNTbGljZSgpIHtcbiAgICByZXR1cm4gdGhpcy5faGVscGVyc1NsaWNlO1xuICB9XG5cbiAgc2V0IHZpc2libGUodmlzaWJsZSkge1xuICAgIHRoaXMuX3Zpc2libGUgPSB2aXNpYmxlO1xuICAgIGlmICh0aGlzLl9tZXNoKSB7XG4gICAgICB0aGlzLl9tZXNoLnZpc2libGUgPSB0aGlzLl92aXNpYmxlO1xuICAgIH1cbiAgfVxuXG4gIGdldCB2aXNpYmxlKCkge1xuICAgIHJldHVybiB0aGlzLl92aXNpYmxlO1xuICB9XG5cbiAgc2V0IGNvbG9yKGNvbG9yKSB7XG4gICAgdGhpcy5fY29sb3IgPSBjb2xvcjtcbiAgICBpZiAodGhpcy5fbWF0ZXJpYWwpIHtcbiAgICAgIHRoaXMuX21hdGVyaWFsLmNvbG9yLnNldCh0aGlzLl9jb2xvcik7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGNvbG9yKCkge1xuICAgIHJldHVybiB0aGlzLl9jb2xvcjtcbiAgfVxuXG4gIF9jcmVhdGUoKSB7XG4gICAgaWYgKCF0aGlzLl9tYXRlcmlhbCkge1xuICAgICAgdGhpcy5fbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICBjb2xvcjogdGhpcy5fY29sb3IsXG4gICAgICAgIGxpbmV3aWR0aDogMSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vXG4gICAgaWYgKCF0aGlzLl9oZWxwZXJzU2xpY2UuZ2VvbWV0cnkudmVydGljZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9nZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5faGVscGVyc1NsaWNlLmdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9nZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKHRoaXMuX2hlbHBlcnNTbGljZS5nZW9tZXRyeS52ZXJ0aWNlc1tpXSk7XG4gICAgfVxuICAgIHRoaXMuX2dlb21ldHJ5LnZlcnRpY2VzLnB1c2godGhpcy5faGVscGVyc1NsaWNlLmdlb21ldHJ5LnZlcnRpY2VzWzBdKTtcblxuICAgIHRoaXMuX21lc2ggPSBuZXcgVEhSRUUuTGluZSh0aGlzLl9nZW9tZXRyeSwgdGhpcy5fbWF0ZXJpYWwpO1xuICAgIGlmICh0aGlzLl9oZWxwZXJzU2xpY2UuYWFiYlNwYWNlID09PSAnSUpLJykge1xuICAgICAgdGhpcy5fbWVzaC5hcHBseU1hdHJpeCh0aGlzLl9oZWxwZXJzU2xpY2Uuc3RhY2suaWprMkxQUyk7XG4gICAgfVxuICAgIHRoaXMuX21lc2gudmlzaWJsZSA9IHRoaXMuX3Zpc2libGU7XG5cbiAgICAvLyBhbmQgYWRkIGl0IVxuICAgIHRoaXMuYWRkKHRoaXMuX21lc2gpO1xuICB9XG5cbiAgX3VwZGF0ZSgpIHtcbiAgICAvLyB1cGRhdGUgc2xpY2VcbiAgICBpZiAodGhpcy5fbWVzaCkge1xuICAgICAgdGhpcy5yZW1vdmUodGhpcy5fbWVzaCk7XG4gICAgICB0aGlzLl9tZXNoLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX21lc2ggPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX2NyZWF0ZSgpO1xuICB9XG59XG4iLCJcbi8qKlxuICogQG1vZHVsZSBoZWxwZXJzL2JvdW5kaW5nYm94XG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSGVscGVyc0JvdW5kaW5nQm94IGV4dGVuZHMgVEhSRUUuT2JqZWN0M0Qge1xuICBjb25zdHJ1Y3RvcihzdGFjaykge1xuICAgIC8vXG4gICAgc3VwZXIoKTtcblxuICAgIC8vIHByaXZhdGUgdmFyc1xuICAgIHRoaXMuX3N0YWNrID0gc3RhY2s7XG4gICAgdGhpcy5fdmlzaWJsZSA9IHRydWU7XG4gICAgdGhpcy5fY29sb3IgPSAweEZGRkZGRjtcbiAgICB0aGlzLl9tYXRlcmlhbCA9IG51bGw7XG4gICAgdGhpcy5fZ2VvbWV0cnkgPSBudWxsO1xuICAgIHRoaXMuX21lc2ggPSBudWxsO1xuXG4gICAgLy8gY3JlYXRlIG9iamVjdFxuICAgIHRoaXMuX2NyZWF0ZSgpO1xuICB9XG5cbiAgLy8gZ2V0dGVycy9zZXR0ZXJzXG4gIHNldCB2aXNpYmxlKHZpc2libGUpIHtcbiAgICB0aGlzLl92aXNpYmxlID0gdmlzaWJsZTtcbiAgICBpZiAodGhpcy5fbWVzaCkge1xuICAgICAgdGhpcy5fbWVzaC52aXNpYmxlID0gdGhpcy5fdmlzaWJsZTtcbiAgICB9XG4gIH1cblxuICBnZXQgdmlzaWJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlzaWJsZTtcbiAgfVxuXG4gIHNldCBjb2xvcihjb2xvcikge1xuICAgIHRoaXMuX2NvbG9yID0gY29sb3I7XG4gICAgaWYgKHRoaXMuX21hdGVyaWFsKSB7XG4gICAgICB0aGlzLl9tYXRlcmlhbC5jb2xvci5zZXQodGhpcy5fY29sb3IpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBjb2xvcigpIHtcbiAgICByZXR1cm4gdGhpcy5fY29sb3I7XG4gIH1cblxuICAvLyBwcml2YXRlIG1ldGhvZHNcbiAgX2NyZWF0ZSgpIHtcbiAgICAvLyBDb252ZW5pZW5jZSB2YXJzXG4gICAgbGV0IGRpbWVuc2lvbnMgPSB0aGlzLl9zdGFjay5kaW1lbnNpb25zSUpLO1xuICAgIGxldCBoYWxmRGltZW5zaW9ucyA9IHRoaXMuX3N0YWNrLmhhbGZEaW1lbnNpb25zSUpLO1xuICAgIGxldCBvZmZzZXQgPSBuZXcgVEhSRUUuVmVjdG9yMygtMC41LCAtMC41LCAtMC41KTtcblxuICAgIC8vIEdlb21ldHJ5XG4gICAgdGhpcy5fZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQm94R2VvbWV0cnkoXG4gICAgICBkaW1lbnNpb25zLngsIGRpbWVuc2lvbnMueSwgZGltZW5zaW9ucy56KTtcbiAgICAvLyBwb3NpdGlvbiBiYm94IGluIGltYWdlIHNwYWNlXG4gICAgdGhpcy5fZ2VvbWV0cnkgLmFwcGx5TWF0cml4KG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVRyYW5zbGF0aW9uKFxuICAgICAgaGFsZkRpbWVuc2lvbnMueCArIG9mZnNldC54LFxuICAgICAgaGFsZkRpbWVuc2lvbnMueSArIG9mZnNldC55LFxuICAgICAgaGFsZkRpbWVuc2lvbnMueiArIG9mZnNldC56KSk7XG5cblxuICAgIC8vIE1lc2hcbiAgICBsZXQgYm94TWVzaCA9XG4gICAgICBuZXcgVEhSRUUuTWVzaCh0aGlzLl9nZW9tZXRyeSwgbmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKDB4ZmYwMDAwKSk7XG4gICAgdGhpcy5fbWVzaCA9IG5ldyBUSFJFRS5Cb3hIZWxwZXIoYm94TWVzaCwgdGhpcy5fY29sb3IpO1xuXG4gICAgLy8gTWF0ZXJpYWxcbiAgICB0aGlzLl9tYXRlcmlhbCA9IHRoaXMuX21lc2gubWF0ZXJpYWw7XG5cbiAgICAvLyBwb3NpdGlvbiBiYm94IGluIHdvcmxkIHNwYWNlXG4gICAgdGhpcy5fbWVzaC5hcHBseU1hdHJpeCh0aGlzLl9zdGFjay5pamsyTFBTKTtcbiAgICB0aGlzLl9tZXNoLnZpc2libGUgPSB0aGlzLl92aXNpYmxlO1xuXG4gICAgLy8gYW5kIGFkZCBpdCFcbiAgICB0aGlzLmFkZCh0aGlzLl9tZXNoKTtcbiAgfVxuXG4gIF91cGRhdGUoKSB7XG4gICAgLy8gdXBkYXRlIHNsaWNlXG4gICAgaWYgKHRoaXMuX21lc2gpIHtcbiAgICAgIHRoaXMucmVtb3ZlKHRoaXMuX21lc2gpO1xuICAgICAgdGhpcy5fbWVzaC5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9tZXNoLmdlb21ldHJ5ID0gbnVsbDtcbiAgICAgIHRoaXMuX21lc2gubWF0ZXJpYWwuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fbWVzaC5tYXRlcmlhbCA9IG51bGw7XG4gICAgICB0aGlzLl9tZXNoID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9jcmVhdGUoKTtcbiAgfVxufVxuIiwiLyoqXG4gKiBIZWxwZXJzIG1hdGVyaWFsIG1peGluLlxuICpcbiAqIEBtb2R1bGUgaGVscGVycy9tYXRlcmlhbC9taXhpblxuICovXG5cbmxldCBIZXJscGVyc01hdGVyaWFsTWl4aW4gPSAoc3VwZXJjbGFzcykgPT4gY2xhc3MgZXh0ZW5kcyBzdXBlcmNsYXNzIHtcblxuICBfY3JlYXRlTWF0ZXJpYWwoZXh0cmFPcHRpb25zKSB7XG4gICAgLy8gZ2VuZXJhdGUgc2hhZGVycyBvbi1kZW1hbmQhXG4gICAgbGV0IGZzID0gbmV3IHRoaXMuX3NoYWRlcnNGcmFnbWVudCh0aGlzLl91bmlmb3Jtcyk7XG4gICAgbGV0IHZzID0gbmV3IHRoaXMuX3NoYWRlcnNWZXJ0ZXgoKTtcblxuICAgIC8vIG1hdGVyaWFsXG4gICAgbGV0IGdsb2JhbE9wdGlvbnMgPSB7XG4gICAgICB1bmlmb3JtczogdGhpcy5fdW5pZm9ybXMsXG4gICAgICB2ZXJ0ZXhTaGFkZXI6IHZzLmNvbXB1dGUoKSxcbiAgICAgIGZyYWdtZW50U2hhZGVyOiBmcy5jb21wdXRlKCksXG4gICAgfTtcblxuICAgIGxldCBvcHRpb25zID0gT2JqZWN0LmFzc2lnbihleHRyYU9wdGlvbnMsIGdsb2JhbE9wdGlvbnMpO1xuICAgIHRoaXMuX21hdGVyaWFsID0gbmV3IFRIUkVFLlNoYWRlck1hdGVyaWFsKG9wdGlvbnMpO1xuICAgIHRoaXMuX21hdGVyaWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIF91cGRhdGVNYXRlcmlhbCgpIHtcbiAgICAvLyBnZW5lcmF0ZSBzaGFkZXJzIG9uLWRlbWFuZCFcbiAgICBsZXQgZnMgPSBuZXcgdGhpcy5fc2hhZGVyc0ZyYWdtZW50KHRoaXMuX3VuaWZvcm1zKTtcbiAgICBsZXQgdnMgPSBuZXcgdGhpcy5fc2hhZGVyc1ZlcnRleCgpO1xuXG4gICAgdGhpcy5fbWF0ZXJpYWwudmVydGV4U2hhZGVyID0gdnMuY29tcHV0ZSgpO1xuICAgIHRoaXMuX21hdGVyaWFsLmZyYWdtZW50U2hhZGVyID0gZnMuY29tcHV0ZSgpO1xuXG4gICAgdGhpcy5fbWF0ZXJpYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgX3ByZXBhcmVUZXh0dXJlKCkge1xuICAgIHRoaXMuX3RleHR1cmVzID0gW107XG4gICAgZm9yIChsZXQgbSA9IDA7IG0gPCB0aGlzLl9zdGFjay5fcmF3RGF0YS5sZW5ndGg7IG0rKykge1xuICAgICAgbGV0IHRleCA9IG5ldyBUSFJFRS5EYXRhVGV4dHVyZShcbiAgICAgICAgdGhpcy5fc3RhY2sucmF3RGF0YVttXSxcbiAgICAgICAgdGhpcy5fc3RhY2sudGV4dHVyZVNpemUsXG4gICAgICAgIHRoaXMuX3N0YWNrLnRleHR1cmVTaXplLFxuICAgICAgICB0aGlzLl9zdGFjay50ZXh0dXJlVHlwZSxcbiAgICAgICAgVEhSRUUuVW5zaWduZWRCeXRlVHlwZSxcbiAgICAgICAgVEhSRUUuVVZNYXBwaW5nLFxuICAgICAgICBUSFJFRS5DbGFtcFRvRWRnZVdyYXBwaW5nLFxuICAgICAgICBUSFJFRS5DbGFtcFRvRWRnZVdyYXBwaW5nLFxuICAgICAgICBUSFJFRS5OZWFyZXN0RmlsdGVyLFxuICAgICAgICBUSFJFRS5OZWFyZXN0RmlsdGVyKTtcbiAgICAgIHRleC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICB0ZXguZmxpcFkgPSB0cnVlO1xuICAgICAgdGhpcy5fdGV4dHVyZXMucHVzaCh0ZXgpO1xuICAgIH1cbiAgfVxuXG59O1xuXG5leHBvcnQgZGVmYXVsdCBIZXJscGVyc01hdGVyaWFsTWl4aW47XG4iLCIvKiogKiBJbXBvcnRzICoqKi9cbmltcG9ydCBHZW9tZXRyaWVzU2xpY2UgZnJvbSAnLi4vZ2VvbWV0cmllcy9nZW9tZXRyaWVzLnNsaWNlJztcbmltcG9ydCBTaGFkZXJzVW5pZm9ybSBmcm9tICcuLi9zaGFkZXJzL3NoYWRlcnMuZGF0YS51bmlmb3JtJztcbmltcG9ydCBTaGFkZXJzVmVydGV4IGZyb20gJy4uL3NoYWRlcnMvc2hhZGVycy5kYXRhLnZlcnRleCc7XG5pbXBvcnQgU2hhZGVyc0ZyYWdtZW50IGZyb20gJy4uL3NoYWRlcnMvc2hhZGVycy5kYXRhLmZyYWdtZW50JztcblxuaW1wb3J0IEhlbHBlcnNNYXRlcmlhbE1peGluIGZyb20gJy4uL2hlbHBlcnMvaGVscGVycy5tYXRlcmlhbC5taXhpbic7XG5cbi8qKlxuICogQG1vZHVsZSBoZWxwZXJzL3NsaWNlXG4gKi9cbi8vZXhwb3J0IGRlZmF1bHQgY2xhc3MgTG9hZGVyc1ZvbHVtZXMgZXh0ZW5kcyBMb2FkZXJzQmFzZSB7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIZWxwZXJzU2xpY2UgZXh0ZW5kcyBIZWxwZXJzTWF0ZXJpYWxNaXhpbihUSFJFRS5PYmplY3QzRCkge1xuICBjb25zdHJ1Y3RvcihzdGFjayxcbiAgICAgICAgICAgICAgaW5kZXggPSAwLFxuICAgICAgICAgICAgICBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLFxuICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKSxcbiAgICAgICAgICAgICAgYWFiYlNwYWNlID0gJ0lKSycpIHtcbiAgICAvL1xuICAgIHN1cGVyKCk7XG5cbiAgICAvLyBwcml2YXRlIHZhcnNcbiAgICB0aGlzLl9zdGFjayA9IHN0YWNrO1xuXG4gICAgLy8gaW1hZ2Ugc2V0dGluZ3NcbiAgICAvLyBpbmRleCBvbmx5IHVzZWQgdG8gZ3JhYiB3aW5kb3cvbGV2ZWwgYW5kIGludGVyY2VwdC9zbG9wZVxuICAgIHRoaXMuX2ludmVydCA9IHRoaXMuX3N0YWNrLmludmVydDtcblxuICAgIHRoaXMuX2x1dCA9ICdub25lJztcbiAgICB0aGlzLl9sdXRUZXh0dXJlID0gbnVsbDtcbiAgICAvLyBpZiBhdXRvID09PSB0cnVlLCBnZXQgZnJvbSBpbmRleFxuICAgIC8vIGVsc2UgZnJvbSBzdGFjayB3aGljaCBob2xkcyB0aGUgZGVmYXVsdCB2YWx1ZXNcbiAgICB0aGlzLl9pbnRlbnNpdHlBdXRvID0gdHJ1ZTtcbiAgICB0aGlzLl9pbnRlcnBvbGF0aW9uID0gMTsgLy8gZGVmYXVsdCB0byB0cmlsaW5lYXIgaW50ZXJwb2xhdGlvblxuICAgIC8vIHN0YXJ0cyBhdCAwXG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcbiAgICB0aGlzLl93aW5kb3dXaWR0aCA9IG51bGw7XG4gICAgdGhpcy5fd2luZG93Q2VudGVyID0gbnVsbDtcbiAgICB0aGlzLl9yZXNjYWxlU2xvcGUgPSBudWxsO1xuICAgIHRoaXMuX3Jlc2NhbGVJbnRlcmNlcHQgPSBudWxsO1xuXG4gICAgdGhpcy5fY2FudmFzV2lkdGggPSAwO1xuICAgIHRoaXMuX2NhbnZhc0hlaWdodCA9IDA7XG4gICAgdGhpcy5fYm9yZGVyQ29sb3IgPSBudWxsO1xuXG4gICAgLy8gT2JqZWN0M0Qgc2V0dGluZ3NcbiAgICAvLyBzaGFwZVxuICAgIHRoaXMuX3BsYW5lUG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICB0aGlzLl9wbGFuZURpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAvLyBjaGFuZ2UgYWFCQlNwYWNlIGNoYW5nZXMgdGhlIGJveCBkaW1lbnNpb25zXG4gICAgLy8gYWxzbyBjaGFuZ2VzIHRoZSB0cmFuc2Zvcm1cbiAgICAvLyB0aGVyZSBpcyBhbHNvIGEgc3dpdGNoIHRvIG1vdmUgYmFjayBtZXNoIHRvIExQUyBzcGFjZSBhdXRvbWF0aWNhbGx5XG4gICAgdGhpcy5fYWFCQnNwYWNlID0gYWFiYlNwYWNlOyAvLyBvciBMUFMgLT4gZGlmZmVyZW50IHRyYW5zZm9ybXMsIGVzcCBmb3IgdGhlIGdlb21ldHJ5L21lc2hcbiAgICB0aGlzLl9tYXRlcmlhbCA9IG51bGw7XG4gICAgdGhpcy5fdGV4dHVyZXMgPSBbXTtcbiAgICB0aGlzLl9zaGFkZXJzRnJhZ21lbnQgPSBTaGFkZXJzRnJhZ21lbnQ7XG4gICAgdGhpcy5fc2hhZGVyc1ZlcnRleCA9IFNoYWRlcnNWZXJ0ZXg7XG4gICAgdGhpcy5fdW5pZm9ybXMgPSBTaGFkZXJzVW5pZm9ybS51bmlmb3JtcygpO1xuICAgIHRoaXMuX2dlb21ldHJ5ID0gbnVsbDtcbiAgICB0aGlzLl9tZXNoID0gbnVsbDtcbiAgICB0aGlzLl92aXNpYmxlID0gdHJ1ZTtcblxuICAgIC8vIHVwZGF0ZSBkaW1lbnNpb25zLCBjZW50ZXIsIGV0Yy5cbiAgICAvLyBkZXBlbmRpbmcgb24gYWFCQlNwYWNlXG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgLy8gdXBkYXRlIG9iamVjdFxuICAgIHRoaXMuX2NyZWF0ZSgpO1xuICB9XG5cbiAgLy8gZ2V0dGVycy9zZXR0ZXJzXG5cbiAgZ2V0IHN0YWNrKCkge1xuICAgIHJldHVybiB0aGlzLl9zdGFjaztcbiAgfVxuXG4gIHNldCBzdGFjayhzdGFjaykge1xuICAgIHRoaXMuX3N0YWNrID0gc3RhY2s7XG4gIH1cblxuICBnZXQgd2luZG93V2lkdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3dpbmRvd1dpZHRoO1xuICB9XG5cbiAgc2V0IHdpbmRvd1dpZHRoKHdpbmRvd1dpZHRoKSB7XG4gICAgdGhpcy5fd2luZG93V2lkdGggPSB3aW5kb3dXaWR0aDtcbiAgICB0aGlzLnVwZGF0ZUludGVuc2l0eVNldHRpbmdzVW5pZm9ybXMoKTtcbiAgfVxuXG4gIGdldCB3aW5kb3dDZW50ZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3dpbmRvd0NlbnRlcjtcbiAgfVxuXG4gIHNldCB3aW5kb3dDZW50ZXIod2luZG93Q2VudGVyKSB7XG4gICAgdGhpcy5fd2luZG93Q2VudGVyID0gd2luZG93Q2VudGVyO1xuICAgIHRoaXMudXBkYXRlSW50ZW5zaXR5U2V0dGluZ3NVbmlmb3JtcygpO1xuICB9XG5cbiAgZ2V0IHJlc2NhbGVTbG9wZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVzY2FsZVNsb3BlO1xuICB9XG5cbiAgc2V0IHJlc2NhbGVTbG9wZShyZXNjYWxlU2xvcGUpIHtcbiAgICB0aGlzLl9yZXNjYWxlU2xvcGUgPSByZXNjYWxlU2xvcGU7XG4gICAgdGhpcy51cGRhdGVJbnRlbnNpdHlTZXR0aW5nc1VuaWZvcm1zKCk7XG4gIH1cblxuICBnZXQgcmVzY2FsZUludGVyY2VwdCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVzY2FsZUludGVyY2VwdDtcbiAgfVxuXG4gIHNldCByZXNjYWxlSW50ZXJjZXB0KHJlc2NhbGVJbnRlcmNlcHQpIHtcbiAgICB0aGlzLl9yZXNjYWxlSW50ZXJjZXB0ID0gcmVzY2FsZUludGVyY2VwdDtcbiAgICB0aGlzLnVwZGF0ZUludGVuc2l0eVNldHRpbmdzVW5pZm9ybXMoKTtcbiAgfVxuXG4gIGdldCBpbnZlcnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludmVydDtcbiAgfVxuXG4gIHNldCBpbnZlcnQoaW52ZXJ0KSB7XG4gICAgdGhpcy5faW52ZXJ0ID0gaW52ZXJ0O1xuICAgIHRoaXMudXBkYXRlSW50ZW5zaXR5U2V0dGluZ3NVbmlmb3JtcygpO1xuICB9XG5cbiAgZ2V0IGx1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5fbHV0O1xuICB9XG5cbiAgc2V0IGx1dChsdXQpIHtcbiAgICB0aGlzLl9sdXQgPSBsdXQ7XG4gIH1cblxuICBnZXQgbHV0VGV4dHVyZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fbHV0VGV4dHVyZTtcbiAgfVxuXG4gIHNldCBsdXRUZXh0dXJlKGx1dFRleHR1cmUpIHtcbiAgICB0aGlzLl9sdXRUZXh0dXJlID0gbHV0VGV4dHVyZTtcbiAgICB0aGlzLnVwZGF0ZUludGVuc2l0eVNldHRpbmdzVW5pZm9ybXMoKTtcbiAgfVxuXG4gIGdldCBpbnRlbnNpdHlBdXRvKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlbnNpdHlBdXRvO1xuICB9XG5cbiAgc2V0IGludGVuc2l0eUF1dG8oaW50ZW5zaXR5QXV0bykge1xuICAgIHRoaXMuX2ludGVuc2l0eUF1dG8gPSBpbnRlbnNpdHlBdXRvO1xuICAgIHRoaXMudXBkYXRlSW50ZW5zaXR5U2V0dGluZ3MoKTtcbiAgICB0aGlzLnVwZGF0ZUludGVuc2l0eVNldHRpbmdzVW5pZm9ybXMoKTtcbiAgfVxuXG4gIGdldCBpbnRlcnBvbGF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcnBvbGF0aW9uO1xuICB9XG5cbiAgc2V0IGludGVycG9sYXRpb24oaW50ZXJwb2xhdGlvbikge1xuICAgIHRoaXMuX2ludGVycG9sYXRpb24gPSBpbnRlcnBvbGF0aW9uO1xuICAgIHRoaXMudXBkYXRlSW50ZW5zaXR5U2V0dGluZ3NVbmlmb3JtcygpO1xuICAgIHRoaXMuX3VwZGF0ZU1hdGVyaWFsKCk7XG4gIH1cblxuICBnZXQgaW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2luZGV4O1xuICB9XG5cbiAgc2V0IGluZGV4KGluZGV4KSB7XG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcbiAgICB0aGlzLl91cGRhdGUoKTtcbiAgfVxuXG4gIHNldCBwbGFuZVBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgdGhpcy5fcGxhbmVQb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgZ2V0IHBsYW5lUG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BsYW5lUG9zaXRpb247XG4gIH1cblxuICBzZXQgcGxhbmVEaXJlY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5fcGxhbmVEaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgdGhpcy5fdXBkYXRlKCk7XG4gIH1cblxuICBnZXQgcGxhbmVEaXJlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BsYW5lRGlyZWN0aW9uO1xuICB9XG5cbiAgc2V0IGhhbGZEaW1lbnNpb25zKGhhbGZEaW1lbnNpb25zKSB7XG4gICAgdGhpcy5faGFsZkRpbWVuc2lvbnMgPSBoYWxmRGltZW5zaW9ucztcbiAgfVxuXG4gIGdldCBoYWxmRGltZW5zaW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5faGFsZkRpbWVuc2lvbnM7XG4gIH1cblxuICBzZXQgY2VudGVyKGNlbnRlcikge1xuICAgIHRoaXMuX2NlbnRlciA9IGNlbnRlcjtcbiAgfVxuXG4gIGdldCBjZW50ZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NlbnRlcjtcbiAgfVxuXG4gIHNldCBhYWJiU3BhY2UoYWFiYlNwYWNlKSB7XG4gICAgdGhpcy5fYWFCQnNwYWNlID0gYWFiYlNwYWNlO1xuICAgIHRoaXMuX2luaXQoKTtcbiAgfVxuXG4gIGdldCBhYWJiU3BhY2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2FhQkJzcGFjZTtcbiAgfVxuXG4gIHNldCBtZXNoKG1lc2gpIHtcbiAgICB0aGlzLl9tZXNoID0gbWVzaDtcbiAgfVxuXG4gIGdldCBtZXNoKCkge1xuICAgIHJldHVybiB0aGlzLl9tZXNoO1xuICB9XG5cbiAgc2V0IGdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgdGhpcy5fZ2VvbWV0cnkgPSBnZW9tZXRyeTtcbiAgfVxuXG4gIGdldCBnZW9tZXRyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2VvbWV0cnk7XG4gIH1cblxuICBzZXQgY2FudmFzV2lkdGgoY2FudmFzV2lkdGgpIHtcbiAgICB0aGlzLl9jYW52YXNXaWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgIHRoaXMuX3VuaWZvcm1zLnVDYW52YXNXaWR0aC52YWx1ZSA9IHRoaXMuX2NhbnZhc1dpZHRoO1xuICB9XG5cbiAgZ2V0IGNhbnZhc1dpZHRoKCkge1xuICAgIHJldHVybiB0aGlzLl9jYW52YXNXaWR0aDtcbiAgfVxuXG4gIHNldCBjYW52YXNIZWlnaHQoY2FudmFzSGVpZ2h0KSB7XG4gICAgdGhpcy5fY2FudmFzSGVpZ2h0ID0gY2FudmFzSGVpZ2h0O1xuICAgIHRoaXMuX3VuaWZvcm1zLnVDYW52YXNIZWlnaHQudmFsdWUgPSB0aGlzLl9jYW52YXNIZWlnaHQ7XG4gIH1cblxuICBnZXQgY2FudmFzSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLl9jYW52YXNIZWlnaHQ7XG4gIH1cblxuICBzZXQgYm9yZGVyQ29sb3IoYm9yZGVyQ29sb3IpIHtcbiAgICB0aGlzLl9ib3JkZXJDb2xvciA9IGJvcmRlckNvbG9yO1xuICAgIHRoaXMuX3VuaWZvcm1zLnVCb3JkZXJDb2xvci52YWx1ZSA9IG5ldyBUSFJFRS5Db2xvcihib3JkZXJDb2xvcik7XG4gIH1cblxuICBnZXQgYm9yZGVyQ29sb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JvcmRlckNvbG9yO1xuICB9XG5cbiAgX2luaXQoKSB7XG4gICAgaWYgKCF0aGlzLl9zdGFjayB8fCAhdGhpcy5fc3RhY2suX3ByZXBhcmVkIHx8ICF0aGlzLl9zdGFjay5fcGFja2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2FhQkJzcGFjZSA9PT0gJ0lKSycpIHtcbiAgICAgIHRoaXMuX2hhbGZEaW1lbnNpb25zID0gdGhpcy5fc3RhY2suaGFsZkRpbWVuc2lvbnNJSks7XG4gICAgICB0aGlzLl9jZW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgICAgdGhpcy5fc3RhY2suaGFsZkRpbWVuc2lvbnNJSksueCAtIDAuNSxcbiAgICAgICAgdGhpcy5fc3RhY2suaGFsZkRpbWVuc2lvbnNJSksueSAtIDAuNSxcbiAgICAgICAgdGhpcy5fc3RhY2suaGFsZkRpbWVuc2lvbnNJSksueiAtIDAuNSk7XG4gICAgICB0aGlzLl90b0FBQkIgPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBMUFNcbiAgICAgIGxldCBhYUJCb3ggPSB0aGlzLl9zdGFjay5BQUJCb3goKTtcbiAgICAgIHRoaXMuX2hhbGZEaW1lbnNpb25zID0gYWFCQm94LmNsb25lKCkubXVsdGlwbHlTY2FsYXIoMC41KTtcbiAgICAgIHRoaXMuX2NlbnRlciA9IHRoaXMuX3N0YWNrLmNlbnRlckFBQkJveCgpO1xuICAgICAgdGhpcy5fdG9BQUJCID0gdGhpcy5fc3RhY2subHBzMkFBQkI7XG4gICAgfVxuICB9XG5cbiAgLy8gcHJpdmF0ZSBtZXRob2RzXG4gIF9jcmVhdGUoKSB7XG4gICAgaWYgKCF0aGlzLl9zdGFjayB8fCAhdGhpcy5fc3RhY2sucHJlcGFyZWQgfHwgIXRoaXMuX3N0YWNrLnBhY2tlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIENvbnZlbmllbmNlIHZhcnNcbiAgICB0cnkge1xuICAgICAgdGhpcy5fZ2VvbWV0cnkgPSBuZXcgR2VvbWV0cmllc1NsaWNlKFxuICAgICAgICB0aGlzLl9oYWxmRGltZW5zaW9ucyxcbiAgICAgICAgdGhpcy5fY2VudGVyLFxuICAgICAgICB0aGlzLl9wbGFuZVBvc2l0aW9uLFxuICAgICAgICB0aGlzLl9wbGFuZURpcmVjdGlvbixcbiAgICAgICAgdGhpcy5fdG9BQUJCKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB3aW5kb3cuY29uc29sZS5sb2coZSk7XG4gICAgICB3aW5kb3cuY29uc29sZS5sb2coJ2ludmFsaWQgc2xpY2UgZ2VvbWV0cnkgLSBleGl0aW5nLi4uJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9nZW9tZXRyeS52ZXJ0aWNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fbWF0ZXJpYWwpIHtcbiAgICAgIC8vXG4gICAgICB0aGlzLl91bmlmb3Jtcy51VGV4dHVyZVNpemUudmFsdWUgPSB0aGlzLl9zdGFjay50ZXh0dXJlU2l6ZTtcbiAgICAgIHRoaXMuX3VuaWZvcm1zLnVEYXRhRGltZW5zaW9ucy52YWx1ZSA9IFt0aGlzLl9zdGFjay5kaW1lbnNpb25zSUpLLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFjay5kaW1lbnNpb25zSUpLLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFjay5kaW1lbnNpb25zSUpLLnpdO1xuICAgICAgdGhpcy5fdW5pZm9ybXMudVdvcmxkVG9EYXRhLnZhbHVlID0gdGhpcy5fc3RhY2subHBzMklKSztcbiAgICAgIHRoaXMuX3VuaWZvcm1zLnVOdW1iZXJPZkNoYW5uZWxzLnZhbHVlID0gdGhpcy5fc3RhY2subnVtYmVyT2ZDaGFubmVscztcbiAgICAgIHRoaXMuX3VuaWZvcm1zLnVQaXhlbFR5cGUudmFsdWUgPSB0aGlzLl9zdGFjay5waXhlbFR5cGU7XG4gICAgICB0aGlzLl91bmlmb3Jtcy51Qml0c0FsbG9jYXRlZC52YWx1ZSA9IHRoaXMuX3N0YWNrLmJpdHNBbGxvY2F0ZWQ7XG4gICAgICB0aGlzLl91bmlmb3Jtcy51UGFja2VkUGVyUGl4ZWwudmFsdWUgPSB0aGlzLl9zdGFjay5wYWNrZWRQZXJQaXhlbDtcbiAgICAgIC8vIGNvbXB1dGUgdGV4dHVyZSBpZiBtYXRlcmlhbCBleGlzdFxuICAgICAgdGhpcy5fcHJlcGFyZVRleHR1cmUoKTtcbiAgICAgIHRoaXMuX3VuaWZvcm1zLnVUZXh0dXJlQ29udGFpbmVyLnZhbHVlID0gdGhpcy5fdGV4dHVyZXM7XG5cbiAgICAgIHRoaXMuX2NyZWF0ZU1hdGVyaWFsKHtcbiAgICAgICAgc2lkZTogVEhSRUUuRG91YmxlU2lkZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSBpbnRlbnNpdHkgcmVsYXRlZCBzdHVmZlxuICAgIHRoaXMudXBkYXRlSW50ZW5zaXR5U2V0dGluZ3MoKTtcbiAgICB0aGlzLnVwZGF0ZUludGVuc2l0eVNldHRpbmdzVW5pZm9ybXMoKTtcblxuICAgIC8vIGNyZWF0ZSB0aGUgbWVzaCFcbiAgICB0aGlzLl9tZXNoID0gbmV3IFRIUkVFLk1lc2godGhpcy5fZ2VvbWV0cnksIHRoaXMuX21hdGVyaWFsKTtcbiAgICBpZiAodGhpcy5fYWFCQnNwYWNlID09PSAnSUpLJykge1xuICAgICAgdGhpcy5fbWVzaC5hcHBseU1hdHJpeCh0aGlzLl9zdGFjay5pamsyTFBTKTtcbiAgICB9XG5cbiAgICB0aGlzLl9tZXNoLnZpc2libGUgPSB0aGlzLl92aXNpYmxlO1xuXG4gICAgLy8gYW5kIGFkZCBpdCFcbiAgICB0aGlzLmFkZCh0aGlzLl9tZXNoKTtcbiAgfVxuXG4gIHVwZGF0ZUludGVuc2l0eVNldHRpbmdzKCkge1xuICAgIC8vIGlmIGF1dG8sIGdldCBmcm9tIGZyYW1lIGluZGV4XG4gICAgaWYgKHRoaXMuX2ludGVuc2l0eUF1dG8pIHtcbiAgICAgIHRoaXMudXBkYXRlSW50ZW5zaXR5U2V0dGluZygnd2luZG93Q2VudGVyJyk7XG4gICAgICB0aGlzLnVwZGF0ZUludGVuc2l0eVNldHRpbmcoJ3dpbmRvd1dpZHRoJyk7XG4gICAgICB0aGlzLnVwZGF0ZUludGVuc2l0eVNldHRpbmcoJ3Jlc2NhbGVTbG9wZScpO1xuICAgICAgdGhpcy51cGRhdGVJbnRlbnNpdHlTZXR0aW5nKCdyZXNjYWxlSW50ZXJjZXB0Jyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLl93aW5kb3dDZW50ZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5fd2luZG93Q2VudGVyID0gdGhpcy5fc3RhY2sud2luZG93Q2VudGVyO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fX3dpbmRvd1dpZHRoID09PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX3dpbmRvd1dpZHRoID0gdGhpcy5fc3RhY2sud2luZG93V2lkdGg7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9yZXNjYWxlU2xvcGUgPT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5fcmVzY2FsZVNsb3BlID0gdGhpcy5fc3RhY2sucmVzY2FsZVNsb3BlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fcmVzY2FsZUludGVyY2VwdCA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9yZXNjYWxlSW50ZXJjZXB0ID0gdGhpcy5fc3RhY2sucmVzY2FsZUludGVyY2VwdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGVJbnRlbnNpdHlTZXR0aW5nc1VuaWZvcm1zKCkge1xuICAgIC8vIGNvbXBlbnNhdGUgZm9yIHRoZSBvZmZzZXQgdG8gb25seSBwYXNzID4gMCB2YWx1ZXMgdG8gc2hhZGVyc1xuICAgIC8vIG1vZGVscyA+IG1vZGVscy5zdGFjay5qcyA6IF9wYWNrVG84Qml0c1xuICAgIGxldCBvZmZzZXQgPSAwO1xuICAgIGlmICh0aGlzLl9zdGFjay5fbWluTWF4WzBdIDwgMCkge1xuICAgICAgb2Zmc2V0IC09IHRoaXMuX3N0YWNrLl9taW5NYXhbMF07XG4gICAgfVxuXG4gICAgLy8gc2V0IHNsaWNlIHdpbmRvdyBjZW50ZXIgYW5kIHdpZHRoXG4gICAgdGhpcy5fdW5pZm9ybXMudVJlc2NhbGVTbG9wZUludGVyY2VwdC52YWx1ZSA9IFt0aGlzLl9yZXNjYWxlU2xvcGUsIHRoaXMuX3Jlc2NhbGVJbnRlcmNlcHRdO1xuICAgIHRoaXMuX3VuaWZvcm1zLnVXaW5kb3dDZW50ZXJXaWR0aC52YWx1ZSA9IFtvZmZzZXQgKyB0aGlzLl93aW5kb3dDZW50ZXIsIHRoaXMuX3dpbmRvd1dpZHRoXTtcblxuICAgIC8vIGludmVydFxuICAgIHRoaXMuX3VuaWZvcm1zLnVJbnZlcnQudmFsdWUgPSB0aGlzLl9pbnZlcnQgPT09IHRydWUgPyAxIDogMDtcblxuICAgIC8vIGludGVycG9sYXRpb25cbiAgICB0aGlzLl91bmlmb3Jtcy51SW50ZXJwb2xhdGlvbi52YWx1ZSA9IHRoaXMuX2ludGVycG9sYXRpb247XG5cbiAgICAvLyBsdXRcbiAgICBpZiAodGhpcy5fbHV0ID09PSAnbm9uZScpIHtcbiAgICAgIHRoaXMuX3VuaWZvcm1zLnVMdXQudmFsdWUgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl91bmlmb3Jtcy51THV0LnZhbHVlID0gMTtcbiAgICAgIHRoaXMuX3VuaWZvcm1zLnVUZXh0dXJlTFVULnZhbHVlID0gdGhpcy5fbHV0VGV4dHVyZTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVJbnRlbnNpdHlTZXR0aW5nKHNldHRpbmcpIHtcbiAgICBpZiAodGhpcy5fc3RhY2suZnJhbWVbdGhpcy5faW5kZXhdICYmXG4gICAgICAgIHRoaXMuX3N0YWNrLmZyYW1lW3RoaXMuX2luZGV4XVtzZXR0aW5nXSkge1xuICAgICAgdGhpc1snXycgKyBzZXR0aW5nXSA9IHRoaXMuX3N0YWNrLmZyYW1lW3RoaXMuX2luZGV4XVtzZXR0aW5nXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpc1snXycgKyBzZXR0aW5nXSA9IHRoaXMuX3N0YWNrW3NldHRpbmddO1xuICAgIH1cbiAgfVxuXG4gIF91cGRhdGUoKSB7XG4gICAgLy8gdXBkYXRlIHNsaWNlXG4gICAgaWYgKHRoaXMuX21lc2gpIHtcbiAgICAgIHRoaXMucmVtb3ZlKHRoaXMuX21lc2gpO1xuICAgICAgdGhpcy5fbWVzaC5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9tZXNoLmdlb21ldHJ5ID0gbnVsbDtcbiAgICAgIC8vIHdlIGRvIG5vdCB3YW50IHRvIGRpc3Bvc2UgdGhlIHRleHR1cmUhXG4gICAgICAvLyB0aGlzLl9tZXNoLm1hdGVyaWFsLmRpc3Bvc2UoKTtcbiAgICAgIC8vIHRoaXMuX21lc2gubWF0ZXJpYWwgPSBudWxsO1xuICAgICAgdGhpcy5fbWVzaCA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5fY3JlYXRlKCk7XG4gIH1cblxuICBjYXJ0ZXNpYW5FcXVhdGlvbigpIHtcbiAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSBhIGdlb21ldHJ5XG4gICAgaWYgKCF0aGlzLl9nZW9tZXRyeSB8fFxuICAgICAgICF0aGlzLl9nZW9tZXRyeS52ZXJ0aWNlcyB8fFxuICAgICAgIHRoaXMuX2dlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCA8IDMpIHtcbiAgICAgIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yNCgpO1xuICAgIH1cblxuICAgIGxldCB2ZXJ0aWNlcyA9IHRoaXMuX2dlb21ldHJ5LnZlcnRpY2VzO1xuICAgIGxldCBkYXRhVG9Xb3JsZCA9IHRoaXMuX3N0YWNrLmlqazJMUFM7XG4gICAgbGV0IHAxID0gbmV3IFRIUkVFLlZlY3RvcjModmVydGljZXNbMF0ueCwgdmVydGljZXNbMF0ueSwgdmVydGljZXNbMF0ueilcbiAgICAgIC5hcHBseU1hdHJpeDQoZGF0YVRvV29ybGQpO1xuICAgIGxldCBwMiA9IG5ldyBUSFJFRS5WZWN0b3IzKHZlcnRpY2VzWzFdLngsIHZlcnRpY2VzWzFdLnksIHZlcnRpY2VzWzFdLnopXG4gICAgICAuYXBwbHlNYXRyaXg0KGRhdGFUb1dvcmxkKTtcbiAgICBsZXQgcDMgPSBuZXcgVEhSRUUuVmVjdG9yMyh2ZXJ0aWNlc1syXS54LCB2ZXJ0aWNlc1syXS55LCB2ZXJ0aWNlc1syXS56KVxuICAgICAgLmFwcGx5TWF0cml4NChkYXRhVG9Xb3JsZCk7XG4gICAgbGV0IHYxID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblx0XHRsZXQgdjIgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIGxldCBub3JtYWwgPSB2MVxuICAgICAgLnN1YlZlY3RvcnMocDMsIHAyKVxuICAgICAgLmNyb3NzKHYyLnN1YlZlY3RvcnMocDEsIHAyKSlcbiAgICAgIC5ub3JtYWxpemUoKTtcblxuICAgIHJldHVybiBuZXcgVEhSRUUuVmVjdG9yNChcbiAgICAgIG5vcm1hbC54LFxuICAgICAgbm9ybWFsLnksXG4gICAgICBub3JtYWwueixcbiAgICAgIC0gbm9ybWFsLmRvdChwMSlcbiAgICApO1xuICB9XG59XG4iLCIvKiogKiBJbXBvcnRzICoqKi9cbmltcG9ydCBIZWxwZXJzQm9yZGVyIGZyb20gJy4uL2hlbHBlcnMvaGVscGVycy5ib3JkZXInO1xuaW1wb3J0IEhlbHBlcnNCb3VuZGluZ0JveCBmcm9tICcuLi9oZWxwZXJzL2hlbHBlcnMuYm91bmRpbmdib3gnO1xuaW1wb3J0IEhlbHBlcnNTbGljZSBmcm9tICcuLi9oZWxwZXJzL2hlbHBlcnMuc2xpY2UnO1xuXG4vKipcbiAqIEhlbHBlciB0byBlYXNpbHkgZGlzcGxheSBhbmQgaW50ZXJhY3Qgd2l0aCBhIHN0YWNrLjxicj5cbiAqPGJyPlxuICogRGVmYXVsdHM6PGJyPlxuICogICAtIG9yaWVudGF0aW9uOiAwIChhY3F1aXNpdGlvbiBkaXJlY3Rpb24pPGJyPlxuICogICAtIGluZGV4OiBtaWRkbGUgc2xpY2UgaW4gYWNxdWlzaXRpb24gZGlyZWN0aW9uPGJyPlxuICo8YnI+XG4gKiBGZWF0dXJlczo8YnI+XG4gKiAgIC0gc2xpY2UgZnJvbSB0aGUgc3RhY2sgKGluIGFueSBkaXJlY3Rpb24pPGJyPlxuICogICAtIHNsaWNlIGJvcmRlcjxicj5cbiAqICAgLSBzdGFjayBib3VuZGluZyBib3g8YnI+XG4gKjxicj5cbiAqIExpdmUgZGVtbyBhdDoge0BsaW5rIGh0dHA6Ly9qc2ZpZGRsZS5uZXQvZ2gvZ2V0L2xpYnJhcnkvcHVyZS9mbm5kc2MvYW1pL3RyZWUvbWFzdGVyL2xlc3NvbnMvMDEjcnVufExlc3NvbiAwMX1cbiAqXG4gKiBAZXhhbXBsZVxuICogbGV0IHN0YWNrID0gbmV3IFZKUy5Nb2RlbHMuU3RhY2soKTtcbiAqIC4uLiAvLyBwcmVwYXJlIHRoZSBzdGFja1xuICpcbiAqIGxldCBzdGFja0hlbHBlciA9IG5ldyBWSlMuSGVscGVycy5TdGFjayhzdGFjayk7XG4gKiBzdGFja0hlbHBlci5iYm94LmNvbG9yID0gMHhGOUY5Rjk7XG4gKiBzdGFja0hlbHBlci5ib3JkZXIuY29sb3IgPSAweEY5RjlGOTtcbiAqXG4gKiBsZXQgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAqIHNjZW5lLmFkZChzdGFja0hlbHBlcik7XG4gKlxuICogQGV4dGVuZHMgVEhSRUUuT2JqZWN0M0RcbiAqXG4gKiBAc2VlIG1vZHVsZTpoZWxwZXJzL2JvcmRlclxuICogQHNlZSBtb2R1bGU6aGVscGVycy9ib3VuZGluZ2JveFxuICogQHNlZSBtb2R1bGU6aGVscGVycy9zbGljZVxuICpcbiAqIEBtb2R1bGUgaGVscGVycy9zdGFja1xuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIZWxwZXJzU3RhY2sgZXh0ZW5kcyBUSFJFRS5PYmplY3QzRCB7XG4gIGNvbnN0cnVjdG9yKHN0YWNrKSB7XG4gICAgLy9cbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5fc3RhY2sgPSBzdGFjaztcbiAgICB0aGlzLl9iQm94ID0gbnVsbDtcbiAgICB0aGlzLl9zbGljZSA9IG51bGw7XG4gICAgdGhpcy5fYm9yZGVyID0gbnVsbDtcbiAgICB0aGlzLl9kdW1teSA9IG51bGw7XG5cbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IDA7XG4gICAgdGhpcy5faW5kZXggPSAwO1xuXG4gICAgdGhpcy5fdW5pZm9ybXMgPSBudWxsO1xuICAgIHRoaXMuX2F1dG9XaW5kb3dMZXZlbCA9IGZhbHNlO1xuICAgIHRoaXMuX291dE9mQm91bmRzID0gZmFsc2U7XG4gICAgdGhpcy5fb3JpZW50YXRpb25NYXhJbmRleCA9IDA7XG5cbiAgICB0aGlzLl9jYW52YXNXaWR0aCA9IDA7XG4gICAgdGhpcy5fY2FudmFzSGVpZ2h0ID0gMDtcbiAgICB0aGlzLl9ib3JkZXJDb2xvciA9IG51bGw7XG5cblxuICAgIC8vIHRoaXMuX2Fycm93ID0ge1xuICAgIC8vICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAvLyAgIGNvbG9yOiAweEZGRjMzNixcbiAgICAvLyAgIGxlbmd0aDogMjAsXG4gICAgLy8gICBtYXRlcmlhbDogbnVsbCxcbiAgICAvLyAgIGdlb21ldHJ5OiBudWxsLFxuICAgIC8vICAgbWVzaDogbnVsbFxuICAgIC8vIH07XG4gICAgdGhpcy5fY3JlYXRlKCk7XG4gIH1cblxuICAvL1xuICAvLyBQVUJMSUMgTUVUSE9EU1xuICAvL1xuXG4gIC8vXG4gIC8vIFNFVFRFUlMvR0VUVEVSU1xuICAvL1xuXG4gIC8qKlxuICAgKiBHZXQgc3RhY2suXG4gICAqXG4gICAqIEB0eXBlIHtNb2RlbHNTdGFja31cbiAgICovXG4gIGdldCBzdGFjaygpIHtcbiAgICByZXR1cm4gdGhpcy5fc3RhY2s7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGJvdW5kaW5nIGJveCBoZWxwZXIuXG4gICAqXG4gICAqIEB0eXBlIHtIZWxwZXJzQm91bmRpbmdCb3h9XG4gICAqL1xuICBnZXQgYmJveCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYkJveDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgc2xpY2UgaGVscGVyLlxuICAgKlxuICAgKiBAdHlwZSB7SGVscGVyc1NsaWNlfVxuICAgKi9cbiAgZ2V0IHNsaWNlKCkge1xuICAgIHJldHVybiB0aGlzLl9zbGljZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYm9yZGVyIGhlbHBlci5cbiAgICpcbiAgICogQHR5cGUge0hlbHBlcnNTbGljZX1cbiAgICovXG4gIGdldCBib3JkZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JvcmRlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQvZ2V0IGN1cnJlbnQgc2xpY2UgaW5kZXguPGJyPlxuICAgKiBTZXRzIG91dE9mQm91bmRzIGZsYWcgdG8ga25vdyBpZiB0YXJnZXQgaW5kZXggaXMgaW4vb3V0IHN0YWNrIGJvdW5kaW5nIGJveC48YnI+XG4gICAqIDxicj5cbiAgICogSW50ZXJuYWxseSB1cGRhdGVzIHRoZSBzbGljZUhlbHBlciBpbmRleCBhbmQgcG9zaXRpb24uIEFsc28gdXBkYXRlcyB0aGVcbiAgICogYm9yZGVySGVscGVyIHdpdGggdGhlIHVwZGF0ZWQgc2xpY2VIZWxwZXIuXG4gICAqXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBnZXQgaW5kZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2luZGV4O1xuICB9XG5cbiAgc2V0IGluZGV4KGluZGV4KSB7XG4gICAgdGhpcy5faW5kZXggPSBpbmRleDtcblxuICAgIC8vIHVwZGF0ZSB0aGUgc2xpY2VcbiAgICB0aGlzLl9zbGljZS5pbmRleCA9IGluZGV4O1xuICAgIGxldCBoYWxmRGltZW5zaW9ucyA9IHRoaXMuX3N0YWNrLmhhbGZEaW1lbnNpb25zSUpLO1xuICAgIHRoaXMuX3NsaWNlLnBsYW5lUG9zaXRpb24gPSB0aGlzLl9wcmVwYXJlU2xpY2VQb3NpdGlvbihoYWxmRGltZW5zaW9ucywgdGhpcy5faW5kZXgpO1xuXG4gICAgLy8gYWxzbyB1cGRhdGUgdGhlIGJvcmRlclxuICAgIHRoaXMuX2JvcmRlci5oZWxwZXJzU2xpY2UgPSB0aGlzLl9zbGljZTtcblxuICAgIC8vIHVwZGF0ZSBvdXJPZkJvdW5kcyBmbGFnXG4gICAgdGhpcy5faXNJbmRleE91dE9mQm91bmRzKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0L2dldCBjdXJyZW50IHNsaWNlIG9yaWVudGF0aW9uLjxicj5cbiAgICogVmFsdWVzOiA8YnI+XG4gICAqICAgLSAwOiBhY3F1aXNpdGlvbiBkaXJlY3Rpb24gKHNsaWNlIG5vcm1hbCBpcyB6X2Nvc2luZSk8YnI+XG4gICAqICAgLSAxOiBuZXh0IGRpcmVjdGlvbiAoc2xpY2Ugbm9ybWFsIGlzIHhfY29zaW5lKTxicj5cbiAgICogICAtIDI6IG5leHQgZGlyZWN0aW9uIChzbGljZSBub3JtYWwgaXMgeV9jb3NpbmUpPGJyPlxuICAgKiAgIC0gbjogc2V0IG9yaWVudGF0aW9uIHRvIDA8YnI+XG4gICAqIDxicj5cbiAgICogSW50ZXJuYWxseSB1cGRhdGVzIHRoZSBzbGljZUhlbHBlciBkaXJlY3Rpb24uIEFsc28gdXBkYXRlcyB0aGVcbiAgICogYm9yZGVySGVscGVyIHdpdGggdGhlIHVwZGF0ZWQgc2xpY2VIZWxwZXIuXG4gICAqXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICBzZXQgb3JpZW50YXRpb24ob3JpZW50YXRpb24pIHtcbiAgICB0aGlzLl9vcmllbnRhdGlvbiA9IG9yaWVudGF0aW9uO1xuICAgIHRoaXMuX2NvbXB1dGVPcmllbnRhdGlvbk1heEluZGV4KCk7XG5cbiAgICB0aGlzLl9zbGljZS5wbGFuZURpcmVjdGlvbiA9IHRoaXMuX3ByZXBhcmVEaXJlY3Rpb24odGhpcy5fb3JpZW50YXRpb24pO1xuXG4gICAgLy8gYWxzbyB1cGRhdGUgdGhlIGJvcmRlclxuICAgIHRoaXMuX2JvcmRlci5oZWxwZXJzU2xpY2UgPSB0aGlzLl9zbGljZTtcbiAgfVxuXG4gIGdldCBvcmllbnRhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZW50YXRpb247XG4gIH1cblxuICAvKipcbiAgICogU2V0L2dldCB0aGUgb3V0T2ZCb3VuZCBmbGFnLlxuICAgKlxuICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICovXG4gIHNldCBvdXRPZkJvdW5kcyhvdXRPZkJvdW5kcykge1xuICAgIHRoaXMuX291dE9mQm91bmRzID0gb3V0T2ZCb3VuZHM7XG4gIH1cblxuICBnZXQgb3V0T2ZCb3VuZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX291dE9mQm91bmRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldC9nZXQgdGhlIG9yaWVudGF0aW9uTWF4SW5kZXggZmxhZy5cbiAgICpcbiAgICogQHR5cGUge2Jvb2xlYW59XG4gICAqL1xuICBzZXQgb3JpZW50YXRpb25NYXhJbmRleChvcmllbnRhdGlvbk1heEluZGV4KSB7XG4gICAgdGhpcy5fb3JpZW50YXRpb25NYXhJbmRleCA9IG9yaWVudGF0aW9uTWF4SW5kZXg7XG4gIH1cblxuICBnZXQgb3JpZW50YXRpb25NYXhJbmRleCgpIHtcbiAgICByZXR1cm4gdGhpcy5fb3JpZW50YXRpb25NYXhJbmRleDtcbiAgfVxuXG4gIHNldCBjYW52YXNXaWR0aChjYW52YXNXaWR0aCkge1xuICAgIHRoaXMuX2NhbnZhc1dpZHRoID0gY2FudmFzV2lkdGg7XG4gICAgdGhpcy5fc2xpY2UuY2FudmFzV2lkdGggPSB0aGlzLl9jYW52YXNXaWR0aDtcbiAgfVxuXG4gIGdldCBjYW52YXNXaWR0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY2FudmFzV2lkdGg7XG4gIH1cblxuICBzZXQgY2FudmFzSGVpZ2h0KGNhbnZhc0hlaWdodCkge1xuICAgIHRoaXMuX2NhbnZhc0hlaWdodCA9IGNhbnZhc0hlaWdodDtcbiAgICB0aGlzLl9zbGljZS5jYW52YXNIZWlnaHQgPSB0aGlzLl9jYW52YXNIZWlnaHQ7XG4gIH1cblxuICBnZXQgY2FudmFzSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLl9jYW52YXNIZWlnaHQ7XG4gIH1cblxuICBzZXQgYm9yZGVyQ29sb3IoYm9yZGVyQ29sb3IpIHtcbiAgICB0aGlzLl9ib3JkZXJDb2xvciA9IGJvcmRlckNvbG9yO1xuICAgIHRoaXMuX2JvcmRlci5jb2xvciA9IGJvcmRlckNvbG9yO1xuICAgIHRoaXMuX3NsaWNlLmJvcmRlckNvbG9yID0gdGhpcy5fYm9yZGVyQ29sb3I7XG4gIH1cblxuICBnZXQgYm9yZGVyQ29sb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JvcmRlckNvbG9yO1xuICB9XG5cbiAgLy9cbiAgLy8gUFJJVkFURSBNRVRIT0RTXG4gIC8vXG5cbiAgLyoqXG4gICAqIEluaXRpYWwgc2V0dXAsIGluY2x1ZGluZyBzdGFjayBwcmVwYXJlLCBiYm94IHByZXBhcmUsIHNsaWNlIHByZXBhcmUgYW5kXG4gICAqIGJvcmRlciBwcmVwYXJlLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NyZWF0ZSgpIHtcbiAgICBpZiAodGhpcy5fc3RhY2spIHtcbiAgICAgIC8vIHByZXBhcmUgc3RoZSBzdGFjayBpbnRlcm5hbHNcbiAgICAgIHRoaXMuX3ByZXBhcmVTdGFjaygpO1xuXG4gICAgICAvLyBwcmVwYXJlIHZpc3VhbCBvYmplY3RzXG4gICAgICB0aGlzLl9wcmVwYXJlQkJveCgpO1xuICAgICAgdGhpcy5fcHJlcGFyZVNsaWNlKCk7XG4gICAgICB0aGlzLl9wcmVwYXJlQm9yZGVyKCk7XG4gICAgICAvLyB0b2RvOiBBcnJvd1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuY29uc29sZS5sb2coJ25vIHN0YWNrIHRvIGJlIHByZXBhcmVkLi4uJyk7XG4gICAgfVxuICB9XG5cbiAgX2NvbXB1dGVPcmllbnRhdGlvbk1heEluZGV4KCkge1xuICAgIGxldCBkaW1lbnNpb25zSUpLID0gdGhpcy5fc3RhY2suZGltZW5zaW9uc0lKSztcbiAgICB0aGlzLl9vcmllbnRhdGlvbk1heEluZGV4ID0gMDtcbiAgICBzd2l0Y2ggKHRoaXMuX29yaWVudGF0aW9uKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHRoaXMuX29yaWVudGF0aW9uTWF4SW5kZXggPSBkaW1lbnNpb25zSUpLLnogLSAxO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgdGhpcy5fb3JpZW50YXRpb25NYXhJbmRleCA9IGRpbWVuc2lvbnNJSksueCAtIDE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICB0aGlzLl9vcmllbnRhdGlvbk1heEluZGV4ID0gZGltZW5zaW9uc0lKSy55IC0gMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBkbyBub3RoaW5nIVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gb3JpZW50YXRpb24sIGNoZWNrIGlmIGluZGV4IGlzIGluL291dCBvZiBib3VuZHMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaXNJbmRleE91dE9mQm91bmRzKCkge1xuICAgIHRoaXMuX2NvbXB1dGVPcmllbnRhdGlvbk1heEluZGV4KCk7XG4gICAgaWYgKHRoaXMuX2luZGV4ID49IHRoaXMuX29yaWVudGF0aW9uTWF4SW5kZXggfHwgdGhpcy5faW5kZXggPCAwKSB7XG4gICAgICB0aGlzLl9vdXRPZkJvdW5kcyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX291dE9mQm91bmRzID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFByZXBhcmUgYSBzdGFjayBmb3IgdmlzdWFsaXphdGlvbi4gKGltYWdlIHRvIHdvcmxkIHRyYW5zZm9ybSwgZnJhbWVzIG9yZGVyLFxuICAgKiBwYWNrIGRhdGEgaW50byA4IGJpdHMgdGV4dHVyZXMsIGV0Yy4pXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcHJlcGFyZVN0YWNrKCkge1xuICAgIC8vIG1ha2Ugc3VyZSB0aGVyZSBpcyBzb21ldGhpbmcsIGlmIG5vdCB0aHJvdyBhbiBlcnJvclxuICAgIC8vIGNvbXB1dGUgaW1hZ2UgdG8gd29ya2QgdHJhbnNmb3JtLCBvcmRlciBmcmFtZXMsIGV0Yy5cbiAgICBpZiAoIXRoaXMuX3N0YWNrLnByZXBhcmVkKSB7XG4gICAgICB0aGlzLl9zdGFjay5wcmVwYXJlKCk7XG4gICAgfVxuICAgIC8vIHBhY2sgZGF0YSBpbnRvIDggYml0cyByZ2JhIHRleHR1cmUgZm9yIHRoZSBzaGFkZXJcbiAgICAvLyB0aGlzIG9uZSBjYW4gYmUgc2xvdy4uLlxuICAgIGlmICghdGhpcy5fc3RhY2sucGFja2VkKSB7XG4gICAgICB0aGlzLl9zdGFjay5wYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHVwIGJvdW5kaW5nIGJveCBoZWxwZXIgZ2l2ZW4gcHJlcGFyZWQgc3RhY2sgYW5kIGFkZCBib3VuZGluZyBib3ggaGVscGVyXG4gICAqIHRvIHN0YWNrIGhlbHBlci5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9wcmVwYXJlQkJveCgpIHtcbiAgICB0aGlzLl9iQm94ID0gbmV3IEhlbHBlcnNCb3VuZGluZ0JveCh0aGlzLl9zdGFjayk7XG4gICAgdGhpcy5hZGQodGhpcy5fYkJveCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0dXAgYm9yZGVyIGhlbHBlciBnaXZlbiBzbGljZSBoZWxwZXIgYW5kIGFkZCBib3JkZXIgaGVscGVyXG4gICAqIHRvIHN0YWNrIGhlbHBlci5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9wcmVwYXJlQm9yZGVyKCkge1xuICAgIHRoaXMuX2JvcmRlciA9IG5ldyBIZWxwZXJzQm9yZGVyKHRoaXMuX3NsaWNlKTtcbiAgICB0aGlzLmFkZCh0aGlzLl9ib3JkZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHVwIHNsaWNlIGhlbHBlciBnaXZlbiBwcmVwYXJlZCBzdGFjayBoZWxwZXIgYW5kIGFkZCBzbGljZSBoZWxwZXJcbiAgICogdG8gc3RhY2sgaGVscGVyLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3ByZXBhcmVTbGljZSgpIHtcbiAgICBsZXQgaGFsZkRpbWVuc2lvbnNJSksgPSB0aGlzLl9zdGFjay5oYWxmRGltZW5zaW9uc0lKSztcbiAgICAvLyBjb21wdXRlIGluaXRpYWwgaW5kZXggZ2l2ZW4gb3JpZW50YXRpb25cbiAgICB0aGlzLl9pbmRleCA9IHRoaXMuX3ByZXBhcmVTbGljZUluZGV4KGhhbGZEaW1lbnNpb25zSUpLKTtcbiAgICAvLyBjb21wdXRlIGluaXRpYWwgcG9zaXRpb24gZ2l2ZW4gb3JpZW50YXRpb24gYW5kIGluZGV4XG4gICAgbGV0IHBvc2l0aW9uID0gdGhpcy5fcHJlcGFyZVNsaWNlUG9zaXRpb24oaGFsZkRpbWVuc2lvbnNJSkssIHRoaXMuX2luZGV4KTtcbiAgICAvLyBjb21wdXRlIGluaXRpYWwgZGlyZWN0aW9uIG9yaWVudGF0aW9uXG4gICAgbGV0IGRpcmVjdGlvbiA9IHRoaXMuX3ByZXBhcmVEaXJlY3Rpb24odGhpcy5fb3JpZW50YXRpb24pO1xuXG4gICAgdGhpcy5fc2xpY2UgPSBuZXcgSGVscGVyc1NsaWNlKHRoaXMuX3N0YWNrLCB0aGlzLl9pbmRleCwgcG9zaXRpb24sIGRpcmVjdGlvbik7XG4gICAgdGhpcy5hZGQodGhpcy5fc2xpY2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXB1dGUgc2xpY2UgaW5kZXggZGVwZW5kaW5nIG9uIG9yaWVudGF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjN9IGluZGljZXMgLSBJbmRpY2VzIGluIGVhY2ggZGlyZWN0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBTbGljZSBpbmRleCBhY2NvcmRpbmcgdG8gY3VycmVudCBvcmllbnRhdGlvbi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9wcmVwYXJlU2xpY2VJbmRleChpbmRpY2VzKSB7XG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICBzd2l0Y2ggKHRoaXMuX29yaWVudGF0aW9uKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIGluZGV4ID0gTWF0aC5mbG9vcihpbmRpY2VzLnopO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaW5kZXggPSBNYXRoLmZsb29yKGluZGljZXMueCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBpbmRleCA9IE1hdGguZmxvb3IoaW5kaWNlcy55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBkbyBub3RoaW5nIVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXB1dGUgc2xpY2UgcG9zaXRpb24gZGVwZW5kaW5nIG9uIG9yaWVudGF0aW9uLlxuICAgKiBTZXRzIGluZGV4IGluIHByb3BlciBsb2NhdGlvbiBvZiByZWZlcmVuY2UgcG9zaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yM30gclBvc2l0aW9uIC0gUmVmZXJlbmNlIHBvc2l0aW9uLlxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBDdXJyZW50IGluZGV4LlxuICAgKlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBTbGljZSBpbmRleCBhY2NvcmRpbmcgdG8gY3VycmVudCBvcmllbnRhdGlvbi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9wcmVwYXJlU2xpY2VQb3NpdGlvbihyUG9zaXRpb24sIGluZGV4KSB7XG4gICAgbGV0IHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCk7XG4gICAgc3dpdGNoICh0aGlzLl9vcmllbnRhdGlvbikge1xuICAgICAgY2FzZSAwOlxuICAgICAgICBwb3NpdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKFxuICAgICAgICAgIE1hdGguZmxvb3IoclBvc2l0aW9uLngpLFxuICAgICAgICAgIE1hdGguZmxvb3IoclBvc2l0aW9uLnkpLFxuICAgICAgICAgIGluZGV4KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIHBvc2l0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoXG4gICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgTWF0aC5mbG9vcihyUG9zaXRpb24ueSksXG4gICAgICAgICAgTWF0aC5mbG9vcihyUG9zaXRpb24ueikpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcG9zaXRpb24gPSBuZXcgVEhSRUUuVmVjdG9yMyhcbiAgICAgICAgICBNYXRoLmZsb29yKHJQb3NpdGlvbi54KSxcbiAgICAgICAgICBpbmRleCxcbiAgICAgICAgICBNYXRoLmZsb29yKHJQb3NpdGlvbi56KSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gZG8gbm90aGluZyFcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBwb3NpdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlIHNsaWNlIGRpcmVjdGlvbiBkZXBlbmRpbmcgb24gb3JpZW50YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBvcmllbnRhdGlvbiAtIFNsaWNlIG9yaWVudGF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM30gU2xpY2UgZGlyZWN0aW9uXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcHJlcGFyZURpcmVjdGlvbihvcmllbnRhdGlvbikge1xuICAgIGxldCBkaXJlY3Rpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAxKTtcbiAgICBzd2l0Y2ggKG9yaWVudGF0aW9uKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIGRpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgZGlyZWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBkaXJlY3Rpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygwLCAxLCAwKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBkbyBub3RoaW5nIVxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gZGlyZWN0aW9uO1xuICB9XG5cbn1cbiIsImltcG9ydCBTaGFkZXJzQmFzZSBmcm9tICcuLi9zaGFkZXJzLmJhc2UnO1xuXG5jbGFzcyBUZXh0dXJlM2QgZXh0ZW5kcyBTaGFkZXJzQmFzZSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm5hbWUgPSAndGV4dHVyZTNkJztcblxuICAgIC8vIGRlZmF1bHQgcHJvcGVydGllcyBuYW1lc1xuICAgIHRoaXMuX2RhdGFDb29yZGluYXRlcyA9ICdkYXRhQ29vcmRpbmF0ZXMnO1xuICAgIHRoaXMuX2RhdGFWYWx1ZSA9ICdkYXRhVmFsdWUnO1xuICAgIHRoaXMuX29mZnNldCA9ICdvZmZzZXQnO1xuICB9XG5cbiAgICBhcGkoYmFzZUZyYWdtZW50ID0gdGhpcy5fYmFzZSwgZGF0YUNvb3JkaW5hdGVzID0gdGhpcy5fZGF0YUNvb3JkaW5hdGVzLCBkYXRhVmFsdWUgPSB0aGlzLl9kYXRhVmFsdWUsIG9mZnNldCA9IHRoaXMuX29mZnNldCkge1xuICAgIHRoaXMuX2Jhc2UgPSBiYXNlRnJhZ21lbnQ7XG4gICAgcmV0dXJuIHRoaXMuY29tcHV0ZShkYXRhQ29vcmRpbmF0ZXMsIGRhdGFWYWx1ZSwgb2Zmc2V0KTtcbiAgfVxuXG4gIGNvbXB1dGUoZGF0YUNvb3JkaW5hdGVzLCBkYXRhVmFsdWUsIG9mZnNldCkge1xuICAgIHRoaXMuY29tcHV0ZURlZmluaXRpb24oKTtcbiAgICB0aGlzLl9iYXNlLl9mdW5jdGlvbnNbdGhpcy5fbmFtZV0gPSB0aGlzLl9kZWZpbml0aW9uO1xuICAgIHJldHVybiBgJHt0aGlzLl9uYW1lfSgke2RhdGFDb29yZGluYXRlc30sICR7ZGF0YVZhbHVlfSwgJHtvZmZzZXR9KTtgO1xuICB9XG5cblxuICBjb21wdXRlRGVmaW5pdGlvbigpIHtcbiAgICB0aGlzLl9kZWZpbml0aW9uID0gYFxudm9pZCAke3RoaXMuX25hbWV9KGluIGl2ZWMzIGRhdGFDb29yZGluYXRlcywgb3V0IHZlYzQgZGF0YVZhbHVlLCBvdXQgaW50IG9mZnNldCl7XG4gICAgXG4gIGludCBpbmRleCA9IGRhdGFDb29yZGluYXRlcy54XG4gICAgICAgICAgICArIGRhdGFDb29yZGluYXRlcy55ICogdURhdGFEaW1lbnNpb25zLnhcbiAgICAgICAgICAgICsgZGF0YUNvb3JkaW5hdGVzLnogKiB1RGF0YURpbWVuc2lvbnMueSAqIHVEYXRhRGltZW5zaW9ucy54O1xuICBpbnQgaW5kZXhQID0gaW50KGluZGV4L3VQYWNrZWRQZXJQaXhlbCk7XG4gIG9mZnNldCA9IGluZGV4IC0gMippbmRleFA7XG5cbiAgLy8gTWFwIGRhdGEgaW5kZXggdG8gcmlnaHQgc2FtcGxlcjJEIHRleHR1cmVcbiAgaW50IHZveGVsc1BlclRleHR1cmUgPSB1VGV4dHVyZVNpemUqdVRleHR1cmVTaXplO1xuICBpbnQgdGV4dHVyZUluZGV4ID0gaW50KGZsb29yKGZsb2F0KGluZGV4UCkgLyBmbG9hdCh2b3hlbHNQZXJUZXh0dXJlKSkpO1xuICAvLyBtb2R1bG8gc2VlbXMgaW5jb3JyZWN0IHNvbWV0aW1lcy4uLlxuICAvLyBpbnQgaW5UZXh0dXJlSW5kZXggPSBpbnQobW9kKGZsb2F0KGluZGV4KSwgZmxvYXQodGV4dHVyZVNpemUqdGV4dHVyZVNpemUpKSk7XG4gIGludCBpblRleHR1cmVJbmRleCA9IGluZGV4UCAtIHZveGVsc1BlclRleHR1cmUqdGV4dHVyZUluZGV4O1xuXG4gIC8vIEdldCByb3cgYW5kIGNvbHVtbiBpbiB0aGUgdGV4dHVyZVxuICBpbnQgY29sSW5kZXggPSBpbnQobW9kKGZsb2F0KGluVGV4dHVyZUluZGV4KSwgZmxvYXQodVRleHR1cmVTaXplKSkpO1xuICBpbnQgcm93SW5kZXggPSBpbnQoZmxvb3IoZmxvYXQoaW5UZXh0dXJlSW5kZXgpL2Zsb2F0KHVUZXh0dXJlU2l6ZSkpKTtcblxuICAvLyBNYXAgcm93IGFuZCBjb2x1bW4gdG8gdXZcbiAgdmVjMiB1diA9IHZlYzIoMCwwKTtcbiAgdXYueCA9ICgwLjUgKyBmbG9hdChjb2xJbmRleCkpIC8gZmxvYXQodVRleHR1cmVTaXplKTtcbiAgdXYueSA9IDEuIC0gKDAuNSArIGZsb2F0KHJvd0luZGV4KSkgLyBmbG9hdCh1VGV4dHVyZVNpemUpO1xuXG4gIC8vXG4gIGlmKHRleHR1cmVJbmRleCA9PSAwKXsgZGF0YVZhbHVlID0gdGV4dHVyZTJEKHVUZXh0dXJlQ29udGFpbmVyWzBdLCB1dik7IH1cbiAgZWxzZSBpZih0ZXh0dXJlSW5kZXggPT0gMSl7ZGF0YVZhbHVlID0gdGV4dHVyZTJEKHVUZXh0dXJlQ29udGFpbmVyWzFdLCB1dik7fVxuICBlbHNlIGlmKHRleHR1cmVJbmRleCA9PSAyKXsgZGF0YVZhbHVlID0gdGV4dHVyZTJEKHVUZXh0dXJlQ29udGFpbmVyWzJdLCB1dik7IH1cbiAgZWxzZSBpZih0ZXh0dXJlSW5kZXggPT0gMyl7IGRhdGFWYWx1ZSA9IHRleHR1cmUyRCh1VGV4dHVyZUNvbnRhaW5lclszXSwgdXYpOyB9XG4gIGVsc2UgaWYodGV4dHVyZUluZGV4ID09IDQpeyBkYXRhVmFsdWUgPSB0ZXh0dXJlMkQodVRleHR1cmVDb250YWluZXJbNF0sIHV2KTsgfVxuICBlbHNlIGlmKHRleHR1cmVJbmRleCA9PSA1KXsgZGF0YVZhbHVlID0gdGV4dHVyZTJEKHVUZXh0dXJlQ29udGFpbmVyWzVdLCB1dik7IH1cbiAgZWxzZSBpZih0ZXh0dXJlSW5kZXggPT0gNil7IGRhdGFWYWx1ZSA9IHRleHR1cmUyRCh1VGV4dHVyZUNvbnRhaW5lcls2XSwgdXYpOyB9XG5cbn1cbiAgICBgO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IFRleHR1cmUzZCgpO1xuIiwiaW1wb3J0IFNoYWRlcnNCYXNlIGZyb20gJy4uL3NoYWRlcnMuYmFzZSc7XG5cbmNsYXNzIFVucGFjayBleHRlbmRzIFNoYWRlcnNCYXNlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubmFtZSA9ICd1bnBhY2snO1xuXG4gICAgLy8gZGVmYXVsdCBwcm9wZXJ0aWVzIG5hbWVzXG4gICAgdGhpcy5fcGFja2VkRGF0YSA9ICdwYWNrZWREYXRhJztcbiAgICB0aGlzLl9vZmZzZXQgPSAnb2Zmc2V0JztcbiAgICB0aGlzLl91bnBhY2tlZERhdGEgPSAndW5wYWNrZWREYXRhJztcblxuICAgIHRoaXMuX2Jhc2UuX3VuaWZvcm1zID17XG4gICAgICB1TnVtYmVyT2ZDaGFubmVsczoge1xuICAgICAgICB2YWx1ZTogMSxcbiAgICAgIH0sXG4gICAgICB1Qml0c0FsbG9jYXRlZDoge1xuICAgICAgICB2YWx1ZTogMTYsXG4gICAgICB9LFxuICAgICAgdVBpeGVsVHlwZToge1xuICAgICAgICB2YWx1ZTogMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIGFwaShiYXNlRnJhZ21lbnQgPSB0aGlzLl9iYXNlLCBwYWNrZWREYXRhID0gdGhpcy5fcGFja2VkRGF0YSwgb2Zmc2V0ID0gdGhpcy5fb2Zmc2V0LCB1bnBhY2tlZERhdGEgPSB0aGlzLl91bnBhY2tlZERhdGEpIHtcbiAgICB0aGlzLl9iYXNlID0gYmFzZUZyYWdtZW50O1xuICAgIHJldHVybiB0aGlzLmNvbXB1dGUocGFja2VkRGF0YSwgb2Zmc2V0LCB1bnBhY2tlZERhdGEpO1xuICB9XG5cbiAgY29tcHV0ZShwYWNrZWREYXRhLCBvZmZzZXQsIHVucGFja2VkRGF0YSkge1xuICAgIHRoaXMuY29tcHV0ZURlZmluaXRpb24oKTtcbiAgICB0aGlzLl9iYXNlLl9mdW5jdGlvbnNbdGhpcy5fbmFtZV0gPSB0aGlzLl9kZWZpbml0aW9uO1xuICAgIHJldHVybiBgJHt0aGlzLl9uYW1lfSgke3BhY2tlZERhdGF9LCAke29mZnNldH0sICR7dW5wYWNrZWREYXRhfSk7YDtcbiAgfVxuXG4gIGNvbXB1dGVEZWZpbml0aW9uKCkge1xuICAgIC8vIGZ1biBzdHVmZlxuICAgIGxldCBjb250ZW50ID0gJyc7XG4gICAgaWYodGhpcy5fYmFzZS5fdW5pZm9ybXMudU51bWJlck9mQ2hhbm5lbHMudmFsdWUgPT09IDEpIHtcbiAgICAgIHN3aXRjaCh0aGlzLl9iYXNlLl91bmlmb3Jtcy51Qml0c0FsbG9jYXRlZC52YWx1ZSkge1xuXG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgIGNvbnRlbnQgPSB0aGlzLnVwYWNrOCgpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgMTY6XG4gICAgICAgICAgY29udGVudCA9IHRoaXMudXBhY2sxNigpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgMzI6XG4gICAgICAgICAgY29udGVudCA9IHRoaXMudXBhY2szMigpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY29udGVudCA9IHRoaXMudXBhY2tEZWZhdWx0KCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgIH1cbiAgICB9IGVsc2V7XG4gICAgICBjb250ZW50ID0gdGhpcy51cGFja0lkZW50aXR5KCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGVmaW5pdGlvbiA9IGBcbnZvaWQgJHt0aGlzLl9uYW1lfShpbiB2ZWM0IHBhY2tlZERhdGEsIGluIGludCBvZmZzZXQsIG91dCB2ZWM0IHVucGFja2VkRGF0YSl7XG5cbiR7Y29udGVudH1cblxufSAgXG4gICAgYDtcbiAgfVxuXG4gIHVwYWNrOCgpIHtcbiAgICB0aGlzLl9iYXNlLl9mdW5jdGlvbnNbJ3VJbnQ4J10gPSB0aGlzLnVJbnQ4KCk7XG5cbiAgICByZXR1cm4gYFxudUludDgoXG4gIHBhY2tlZERhdGEucixcbiAgdW5wYWNrZWREYXRhLngpO1xuICAgIGA7XG4gIH1cblxuICB1cGFjazE2KCkge1xuICAgIHRoaXMuX2Jhc2UuX2Z1bmN0aW9uc1sndUludDE2J10gPSB0aGlzLnVJbnQxNigpO1xuXG4gICAgcmV0dXJuIGBcbnVJbnQxNihcbiAgcGFja2VkRGF0YS5yICogZmxvYXQoIDEgLSBvZmZzZXQpICsgcGFja2VkRGF0YS5iICogZmxvYXQob2Zmc2V0KSxcbiAgcGFja2VkRGF0YS5nICogZmxvYXQoIDEgLSBvZmZzZXQpICsgcGFja2VkRGF0YS5hICogZmxvYXQob2Zmc2V0KSxcbiAgdW5wYWNrZWREYXRhLngpO1xuICAgIGA7XG4gIH1cblxuICB1cGFjazMyKCkge1xuICAgIGlmKHRoaXMuX2Jhc2UuX3VuaWZvcm1zLnVQaXhlbFR5cGUudmFsdWUgPT09IDApIHtcbiAgICAgIHRoaXMuX2Jhc2UuX2Z1bmN0aW9uc1sndUludDMyJ10gPSB0aGlzLnVJbnQzMigpO1xuXG4gICAgICByZXR1cm4gYFxudUludDMyKFxuICBwYWNrZWREYXRhLnIsXG4gIHBhY2tlZERhdGEuZyxcbiAgcGFja2VkRGF0YS5iLFxuICBwYWNrZWREYXRhLmEsXG4gIHVucGFja2VkRGF0YS54KTtcbiAgICAgIGA7XG4gICAgfSBlbHNle1xuICAgICAgdGhpcy5fYmFzZS5fZnVuY3Rpb25zWyd1RmxvYXQzMiddID0gdGhpcy51RmxvYXQzMigpO1xuXG4gICAgICByZXR1cm4gYFxudUZsb2F0MzIoXG4gIHBhY2tlZERhdGEucixcbiAgcGFja2VkRGF0YS5nLFxuICBwYWNrZWREYXRhLmIsXG4gIHBhY2tlZERhdGEuYSxcbiAgdW5wYWNrZWREYXRhLngpO1xuICAgICAgYDtcbiAgICB9XG4gIH1cblxuICB1cGFja0lkZW50aXR5KCkge1xuICAgIHJldHVybiBgXG5cbnVucGFja2VkRGF0YSA9IHBhY2tlZERhdGE7XG5cbiAgICAgIGA7XG4gIH1cblxuICB1SW50OCgpIHtcbiAgICByZXR1cm4gYFxudm9pZCB1SW50OChpbiBmbG9hdCByLCBvdXQgZmxvYXQgdmFsdWUpe1xuICB2YWx1ZSA9IHIgKiAyNTYuO1xufVxuICAgIGA7XG4gIH1cblxuICB1SW50MTYoKSB7XG4gICAgcmV0dXJuIGBcbnZvaWQgdUludDE2KGluIGZsb2F0IHIsIGluIGZsb2F0IGEsIG91dCBmbG9hdCB2YWx1ZSl7XG4gIHZhbHVlID0gciAqIDI1Ni4gKyBhICogNjU1MzYuO1xufVxuICAgIGA7XG4gIH1cblxuICB1SW50MzIoKSB7XG4gICAgcmV0dXJuIGBcbnZvaWQgdUludDMyKGluIGZsb2F0IHIsIGluIGZsb2F0IGcsIGluIGZsb2F0IGIsIGluIGZsb2F0IGEsIG91dCBmbG9hdCB2YWx1ZSl7XG4gIHZhbHVlID0gciAqIDI1Ni4gKyBnICogNjU1MzYuICsgYiAqIDE2Nzc3MjE2LiArIGEgKiA0Mjk0OTY3Mjk2Ljtcbn1cbiAgICBgO1xuICB9XG5cbiAgdUZsb2F0MzIoKSB7XG4gICAgcmV0dXJuIGBcbnZvaWQgdUZsb2F0MzIoaW4gZmxvYXQgciwgaW4gZmxvYXQgZywgaW4gZmxvYXQgYiwgaW4gZmxvYXQgYSwgb3V0IGZsb2F0IHZhbHVlKXtcblxuICAvLyBjcmVhdGUgYXJyYXlzIGNvbnRhaW5pbmcgYml0cyBmb3IgcmdiYSB2YWx1ZXNcbiAgLy8gdmFsdWUgYmV0d2VlbiAwIGFuZCAyNTVcbiAgdmFsdWUgPSByICogMjU1LjtcbiAgaW50IGJ5dGVtZVJbOF07XG4gIGJ5dGVtZVJbMF0gPSBpbnQoZmxvb3IodmFsdWUgLyAxMjguKSk7XG4gIHZhbHVlIC09IGZsb2F0KGJ5dGVtZVJbMF0gKiAxMjgpO1xuICBieXRlbWVSWzFdID0gaW50KGZsb29yKHZhbHVlIC8gNjQuKSk7XG4gIHZhbHVlIC09IGZsb2F0KGJ5dGVtZVJbMV0gKiA2NCk7XG4gIGJ5dGVtZVJbMl0gPSBpbnQoZmxvb3IodmFsdWUgLyAzMi4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lUlsyXSAqIDMyKTtcbiAgYnl0ZW1lUlszXSA9IGludChmbG9vcih2YWx1ZSAvIDE2LikpO1xuICB2YWx1ZSAtPSBmbG9hdChieXRlbWVSWzNdICogMTYpO1xuICBieXRlbWVSWzRdID0gaW50KGZsb29yKHZhbHVlIC8gOC4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lUls0XSAqIDgpO1xuICBieXRlbWVSWzVdID0gaW50KGZsb29yKHZhbHVlIC8gNC4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lUls1XSAqIDQpO1xuICBieXRlbWVSWzZdID0gaW50KGZsb29yKHZhbHVlIC8gMi4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lUls2XSAqIDIpO1xuICBieXRlbWVSWzddID0gaW50KGZsb29yKHZhbHVlKSk7XG5cbiAgdmFsdWUgPSBnICogMjU1LjtcbiAgaW50IGJ5dGVtZUdbOF07XG4gIGJ5dGVtZUdbMF0gPSBpbnQoZmxvb3IodmFsdWUgLyAxMjguKSk7XG4gIHZhbHVlIC09IGZsb2F0KGJ5dGVtZUdbMF0gKiAxMjgpO1xuICBieXRlbWVHWzFdID0gaW50KGZsb29yKHZhbHVlIC8gNjQuKSk7XG4gIHZhbHVlIC09IGZsb2F0KGJ5dGVtZUdbMV0gKiA2NCk7XG4gIGJ5dGVtZUdbMl0gPSBpbnQoZmxvb3IodmFsdWUgLyAzMi4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lR1syXSAqIDMyKTtcbiAgYnl0ZW1lR1szXSA9IGludChmbG9vcih2YWx1ZSAvIDE2LikpO1xuICB2YWx1ZSAtPSBmbG9hdChieXRlbWVHWzNdICogMTYpO1xuICBieXRlbWVHWzRdID0gaW50KGZsb29yKHZhbHVlIC8gOC4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lR1s0XSAqIDgpO1xuICBieXRlbWVHWzVdID0gaW50KGZsb29yKHZhbHVlIC8gNC4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lR1s1XSAqIDQpO1xuICBieXRlbWVHWzZdID0gaW50KGZsb29yKHZhbHVlIC8gMi4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lR1s2XSAqIDIpO1xuICBieXRlbWVHWzddID0gaW50KGZsb29yKHZhbHVlKSk7XG5cbiAgdmFsdWUgPSBiICogMjU1LjtcbiAgaW50IGJ5dGVtZUJbOF07XG4gIGJ5dGVtZUJbMF0gPSBpbnQoZmxvb3IodmFsdWUgLyAxMjguKSk7XG4gIHZhbHVlIC09IGZsb2F0KGJ5dGVtZUJbMF0gKiAxMjgpO1xuICBieXRlbWVCWzFdID0gaW50KGZsb29yKHZhbHVlIC8gNjQuKSk7XG4gIHZhbHVlIC09IGZsb2F0KGJ5dGVtZUJbMV0gKiA2NCk7XG4gIGJ5dGVtZUJbMl0gPSBpbnQoZmxvb3IodmFsdWUgLyAzMi4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lQlsyXSAqIDMyKTtcbiAgYnl0ZW1lQlszXSA9IGludChmbG9vcih2YWx1ZSAvIDE2LikpO1xuICB2YWx1ZSAtPSBmbG9hdChieXRlbWVCWzNdICogMTYpO1xuICBieXRlbWVCWzRdID0gaW50KGZsb29yKHZhbHVlIC8gOC4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lQls0XSAqIDgpO1xuICBieXRlbWVCWzVdID0gaW50KGZsb29yKHZhbHVlIC8gNC4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lQls1XSAqIDQpO1xuICBieXRlbWVCWzZdID0gaW50KGZsb29yKHZhbHVlIC8gMi4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lQls2XSAqIDIpO1xuICBieXRlbWVCWzddID0gaW50KGZsb29yKHZhbHVlKSk7XG5cbiAgdmFsdWUgPSBhICogMjU1LjtcbiAgaW50IGJ5dGVtZUFbOF07XG4gIGJ5dGVtZUFbMF0gPSBpbnQoZmxvb3IodmFsdWUgLyAxMjguKSk7XG4gIHZhbHVlIC09IGZsb2F0KGJ5dGVtZUFbMF0gKiAxMjgpO1xuICBieXRlbWVBWzFdID0gaW50KGZsb29yKHZhbHVlIC8gNjQuKSk7XG4gIHZhbHVlIC09IGZsb2F0KGJ5dGVtZUFbMV0gKiA2NCk7XG4gIGJ5dGVtZUFbMl0gPSBpbnQoZmxvb3IodmFsdWUgLyAzMi4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lQVsyXSAqIDMyKTtcbiAgYnl0ZW1lQVszXSA9IGludChmbG9vcih2YWx1ZSAvIDE2LikpO1xuICB2YWx1ZSAtPSBmbG9hdChieXRlbWVBWzNdICogMTYpO1xuICBieXRlbWVBWzRdID0gaW50KGZsb29yKHZhbHVlIC8gOC4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lQVs0XSAqIDgpO1xuICBieXRlbWVBWzVdID0gaW50KGZsb29yKHZhbHVlIC8gNC4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lQVs1XSAqIDQpO1xuICBieXRlbWVBWzZdID0gaW50KGZsb29yKHZhbHVlIC8gMi4pKTtcbiAgdmFsdWUgLT0gZmxvYXQoYnl0ZW1lQVs2XSAqIDIpO1xuICBieXRlbWVBWzddID0gaW50KGZsb29yKHZhbHVlKSk7XG5cbiAgLy8gY29tcHV0ZSBmbG9hdDMyIHZhbHVlIGZyb20gYml0IGFycmF5c1xuXG4gIC8vIHNpZ25cbiAgaW50IGlzc2lnbmVkID0gMSAtIDIgKiBieXRlbWVSWzBdO1xuICAvLyAgIGlzc2lnbmVkID0gaW50KHBvdygtMS4sIGZsb2F0KGJ5dGVtZVJbMF0pKSk7XG5cbiAgLy8gZXhwb25lbnRcbiAgaW50IGV4cG9uZW50ID0gMDtcblxuICBleHBvbmVudCArPSBieXRlbWVSWzFdICogaW50KHBvdygyLiwgNy4pKTtcbiAgZXhwb25lbnQgKz0gYnl0ZW1lUlsyXSAqIGludChwb3coMi4sIDYuKSk7XG4gIGV4cG9uZW50ICs9IGJ5dGVtZVJbM10gKiBpbnQocG93KDIuLCA1LikpO1xuICBleHBvbmVudCArPSBieXRlbWVSWzRdICogaW50KHBvdygyLiwgNC4pKTtcbiAgZXhwb25lbnQgKz0gYnl0ZW1lUls1XSAqIGludChwb3coMi4sIDMuKSk7XG4gIGV4cG9uZW50ICs9IGJ5dGVtZVJbNl0gKiBpbnQocG93KDIuLCAyLikpO1xuICBleHBvbmVudCArPSBieXRlbWVSWzddICogaW50KHBvdygyLiwgMS4pKTtcblxuICBleHBvbmVudCArPSBieXRlbWVHWzBdO1xuXG5cbiAgLy8gZnJhY3Rpb25cbiAgZmxvYXQgZnJhY3Rpb24gPSAwLjtcblxuICBmcmFjdGlvbiA9IGZsb2F0KGJ5dGVtZUdbMV0pICogcG93KDIuLCAtMS4pO1xuICBmcmFjdGlvbiArPSBmbG9hdChieXRlbWVHWzJdKSAqIHBvdygyLiwgLTIuKTtcbiAgZnJhY3Rpb24gKz0gZmxvYXQoYnl0ZW1lR1szXSkgKiBwb3coMi4sIC0zLik7XG4gIGZyYWN0aW9uICs9IGZsb2F0KGJ5dGVtZUdbNF0pICogcG93KDIuLCAtNC4pO1xuICBmcmFjdGlvbiArPSBmbG9hdChieXRlbWVHWzVdKSAqIHBvdygyLiwgLTUuKTtcbiAgZnJhY3Rpb24gKz0gZmxvYXQoYnl0ZW1lR1s2XSkgKiBwb3coMi4sIC02Lik7XG4gIGZyYWN0aW9uICs9IGZsb2F0KGJ5dGVtZUdbN10pICogcG93KDIuLCAtNy4pO1xuXG4gIGZyYWN0aW9uICs9IGZsb2F0KGJ5dGVtZUJbMF0pICogcG93KDIuLCAtOC4pO1xuICBmcmFjdGlvbiArPSBmbG9hdChieXRlbWVCWzFdKSAqIHBvdygyLiwgLTkuKTtcbiAgZnJhY3Rpb24gKz0gZmxvYXQoYnl0ZW1lQlsyXSkgKiBwb3coMi4sIC0xMC4pO1xuICBmcmFjdGlvbiArPSBmbG9hdChieXRlbWVCWzNdKSAqIHBvdygyLiwgLTExLik7XG4gIGZyYWN0aW9uICs9IGZsb2F0KGJ5dGVtZUJbNF0pICogcG93KDIuLCAtMTIuKTtcbiAgZnJhY3Rpb24gKz0gZmxvYXQoYnl0ZW1lQls1XSkgKiBwb3coMi4sIC0xMy4pO1xuICBmcmFjdGlvbiArPSBmbG9hdChieXRlbWVCWzZdKSAqIHBvdygyLiwgLTE0Lik7XG4gIGZyYWN0aW9uICs9IGZsb2F0KGJ5dGVtZUJbN10pICogcG93KDIuLCAtMTUuKTtcblxuICBmcmFjdGlvbiArPSBmbG9hdChieXRlbWVBWzBdKSAqIHBvdygyLiwgLTE2Lik7XG4gIGZyYWN0aW9uICs9IGZsb2F0KGJ5dGVtZUFbMV0pICogcG93KDIuLCAtMTcuKTtcbiAgZnJhY3Rpb24gKz0gZmxvYXQoYnl0ZW1lQVsyXSkgKiBwb3coMi4sIC0xOC4pO1xuICBmcmFjdGlvbiArPSBmbG9hdChieXRlbWVBWzNdKSAqIHBvdygyLiwgLTE5Lik7XG4gIGZyYWN0aW9uICs9IGZsb2F0KGJ5dGVtZUFbNF0pICogcG93KDIuLCAtMjAuKTtcbiAgZnJhY3Rpb24gKz0gZmxvYXQoYnl0ZW1lQVs1XSkgKiBwb3coMi4sIC0yMS4pO1xuICBmcmFjdGlvbiArPSBmbG9hdChieXRlbWVBWzZdKSAqIHBvdygyLiwgLTIyLik7XG4gIGZyYWN0aW9uICs9IGZsb2F0KGJ5dGVtZUFbN10pICogcG93KDIuLCAtMjMuKTtcblxuICB2YWx1ZSA9IGZsb2F0KGlzc2lnbmVkKSAqIHBvdyggMi4sIGZsb2F0KGV4cG9uZW50IC0gMTI3KSkgKiAoMS4gKyBmcmFjdGlvbik7XG59XG4gICAgYDtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBVbnBhY2soKTtcbiIsImltcG9ydCBTaGFkZXJzQmFzZSBmcm9tICcuLi9zaGFkZXJzLmJhc2UnO1xuaW1wb3J0IFVucGFjayBmcm9tICcuLi9oZWxwZXJzL3NoYWRlcnMuaGVscGVycy51bnBhY2snO1xuaW1wb3J0IFRleHR1cmUzZCBmcm9tICcuLi9oZWxwZXJzL3NoYWRlcnMuaGVscGVycy50ZXh0dXJlM2QnO1xuXG5cbmNsYXNzIEludGVycG9sYXRpb25JZGVudGl0eSBleHRlbmRzIFNoYWRlcnNCYXNlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubmFtZSA9ICdpbnRlcnBvbGF0aW9uSWRlbnRpdHknO1xuXG4gICAgLy8gZGVmYXVsdCBwcm9wZXJ0aWVzIG5hbWVzXG4gICAgdGhpcy5fY3VycmVudFZveGVsID0gJ2N1cnJlbnRWb3hlbCc7XG4gICAgdGhpcy5fZGF0YVZhbHVlID0gJ2RhdGFWYWx1ZSc7XG4gIH1cblxuICAgIGFwaShiYXNlRnJhZ21lbnQgPSB0aGlzLl9iYXNlLCBjdXJyZW50Vm94ZWwgPSB0aGlzLl9jdXJyZW50Vm94ZWwsIGRhdGFWYWx1ZSA9IHRoaXMuX2RhdGFWYWx1ZSkge1xuICAgIHRoaXMuX2Jhc2UgPSBiYXNlRnJhZ21lbnQ7XG4gICAgcmV0dXJuIHRoaXMuY29tcHV0ZShjdXJyZW50Vm94ZWwsIGRhdGFWYWx1ZSk7XG4gIH1cblxuICBjb21wdXRlKGN1cnJlbnRWb3hlbCwgZGF0YVZhbHVlKSB7XG4gICAgdGhpcy5jb21wdXRlRGVmaW5pdGlvbigpO1xuICAgIHRoaXMuX2Jhc2UuX2Z1bmN0aW9uc1t0aGlzLl9uYW1lXSA9IHRoaXMuX2RlZmluaXRpb247XG4gICAgcmV0dXJuIGAke3RoaXMuX25hbWV9KCR7Y3VycmVudFZveGVsfSwgJHtkYXRhVmFsdWV9KTtgO1xuICB9XG5cblxuICBjb21wdXRlRGVmaW5pdGlvbigpIHtcbiAgICB0aGlzLl9kZWZpbml0aW9uID0gYFxudm9pZCAke3RoaXMuX25hbWV9KGluIHZlYzMgY3VycmVudFZveGVsLCBvdXQgdmVjNCBkYXRhVmFsdWUpe1xuICAvLyBsb3dlciBib3VuZFxuICB2ZWMzIHJjdXJyZW50Vm94ZWwgPSB2ZWMzKGZsb29yKGN1cnJlbnRWb3hlbC54ICsgMC41ICksIGZsb29yKGN1cnJlbnRWb3hlbC55ICsgMC41ICksIGZsb29yKGN1cnJlbnRWb3hlbC56ICsgMC41ICkpO1xuICBpdmVjMyB2b3hlbCA9IGl2ZWMzKGludChyY3VycmVudFZveGVsLngpLCBpbnQocmN1cnJlbnRWb3hlbC55KSwgaW50KHJjdXJyZW50Vm94ZWwueikpO1xuXG4gIHZlYzQgdG1wID0gdmVjNCgwLiwgMC4sIDAuLCAwLik7XG4gIGludCBvZmZzZXQgPSAwO1xuXG4gICR7VGV4dHVyZTNkLmFwaSh0aGlzLl9iYXNlLCAndm94ZWwnLCAndG1wJywgJ29mZnNldCcpfVxuICAke1VucGFjay5hcGkodGhpcy5fYmFzZSwgJ3RtcCcsICdvZmZzZXQnLCAnZGF0YVZhbHVlJyl9XG59XG4gICAgYDtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBJbnRlcnBvbGF0aW9uSWRlbnRpdHkoKTtcbiIsImltcG9ydCBJbnRlcnBvbGF0aW9uSWRlbnRpdHkgZnJvbSAnLi9zaGFkZXJzLmludGVycG9sYXRpb24uaWRlbnRpdHknO1xuaW1wb3J0IEludGVycG9sYXRpb25UcmlsaW5lYXIgZnJvbSAnLi9zaGFkZXJzLmludGVycG9sYXRpb24udHJpbGluZWFyJztcblxuZnVuY3Rpb24gc2hhZGVyc0ludGVycG9sYXRpb24oYmFzZUZyYWdtZW50LCBjdXJyZW50Vm94ZWwsIGRhdGFWYWx1ZSwgZ3JhZGllbnQpIHtcbiAgc3dpdGNoKGJhc2VGcmFnbWVudC5fdW5pZm9ybXMudUludGVycG9sYXRpb24udmFsdWUpIHtcblxuICAgIGNhc2UgMDpcbiAgICAgIC8vIG5vIGludGVycG9sYXRpb25cbiAgICAgIHJldHVybiBJbnRlcnBvbGF0aW9uSWRlbnRpdHkuYXBpKGJhc2VGcmFnbWVudCwgY3VycmVudFZveGVsLCBkYXRhVmFsdWUpO1xuXG4gICAgY2FzZSAxOlxuICAgICAgLy8gdHJpbGluZWFyIGludGVycG9sYXRpb25cbiAgICAgIHJldHVybiBJbnRlcnBvbGF0aW9uVHJpbGluZWFyLmFwaShiYXNlRnJhZ21lbnQsIGN1cnJlbnRWb3hlbCwgZGF0YVZhbHVlLCBncmFkaWVudCk7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIEludGVycG9sYXRpb25JZGVudGl0eS5hcGkoYmFzZUZyYWdtZW50LCBjdXJyZW50Vm94ZWwsIGRhdGFWYWx1ZSk7XG5cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBzaGFkZXJzSW50ZXJwb2xhdGlvbjtcbiIsImltcG9ydCBTaGFkZXJzQmFzZSBmcm9tICcuLi9zaGFkZXJzLmJhc2UnO1xuaW1wb3J0IEludGVycG9sYXRpb25JZGVudGl0eSBmcm9tICcuL3NoYWRlcnMuaW50ZXJwb2xhdGlvbi5pZGVudGl0eSc7XG5cbmNsYXNzIEludGVycG9sYXRpb25UcmlsaW5lYXIgZXh0ZW5kcyBTaGFkZXJzQmFzZSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm5hbWUgPSAnaW50ZXJwb2xhdGlvblRyaWxpbmVhcic7XG5cbiAgICAvLyBkZWZhdWx0IHByb3BlcnRpZXMgbmFtZXNcbiAgICB0aGlzLl9jdXJyZW50Vm94ZWwgPSAnY3VycmVudFZveGVsJztcbiAgICB0aGlzLl9kYXRhVmFsdWUgPSAnZGF0YVZhbHVlJztcbiAgICB0aGlzLl9ncmFkaWVudCA9ICdncmFkaWVudCc7XG4gIH1cblxuICBhcGkoYmFzZUZyYWdtZW50ID0gdGhpcy5fYmFzZSwgY3VycmVudFZveGVsID0gdGhpcy5fY3VycmVudFZveGVsLCBkYXRhVmFsdWUgPSB0aGlzLl9kYXRhVmFsdWUsIGdyYWRpZW50ID0gdGhpcy5fZ3JhZGllbnQpIHtcbiAgICB0aGlzLl9iYXNlID0gYmFzZUZyYWdtZW50O1xuICAgIHJldHVybiB0aGlzLmNvbXB1dGUoY3VycmVudFZveGVsLCBkYXRhVmFsdWUsIGdyYWRpZW50KTtcbiAgfVxuXG4gIGNvbXB1dGUoY3VycmVudFZveGVsLCBkYXRhVmFsdWUsIGdyYWRpZW50KSB7XG4gICAgdGhpcy5jb21wdXRlRGVmaW5pdGlvbigpO1xuICAgIHRoaXMuX2Jhc2UuX2Z1bmN0aW9uc1t0aGlzLl9uYW1lXSA9IHRoaXMuX2RlZmluaXRpb247XG4gICAgcmV0dXJuIGAke3RoaXMuX25hbWV9KCR7Y3VycmVudFZveGVsfSwgJHtkYXRhVmFsdWV9LCAke2dyYWRpZW50fSk7YDtcbiAgfVxuXG4gIGNvbXB1dGVEZWZpbml0aW9uKCkge1xuICAgIHRoaXMuX2RlZmluaXRpb24gPSBgXG52b2lkICR7dGhpcy5fbmFtZX0oaW4gdmVjMyBjdXJyZW50Vm94ZWwsIG91dCB2ZWM0IGRhdGFWYWx1ZSwgb3V0IHZlYzMgZ3JhZGllbnQpe1xuXG4gIC8vIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1RyaWxpbmVhcl9pbnRlcnBvbGF0aW9uXG4gIHZlYzMgbG93ZXJfYm91bmQgPSB2ZWMzKGZsb29yKGN1cnJlbnRWb3hlbC54KSwgZmxvb3IoY3VycmVudFZveGVsLnkpLCBmbG9vcihjdXJyZW50Vm94ZWwueikpO1xuICBpZihsb3dlcl9ib3VuZC54IDwgMC4pe1xuICAgIGxvd2VyX2JvdW5kLnggPSAwLjtcbiAgfVxuICBpZihsb3dlcl9ib3VuZC55IDwgMC4pe1xuICAgIGxvd2VyX2JvdW5kLnkgPSAwLjtcbiAgfVxuICBpZihsb3dlcl9ib3VuZC56IDwgMC4pe1xuICAgIGxvd2VyX2JvdW5kLnogPSAwLjtcbiAgfVxuICBcbiAgdmVjMyBoaWdoZXJfYm91bmQgPSBsb3dlcl9ib3VuZCArIHZlYzMoMSk7XG5cbiAgZmxvYXQgeGQgPSAoIGN1cnJlbnRWb3hlbC54IC0gbG93ZXJfYm91bmQueCApIC8gKCBoaWdoZXJfYm91bmQueCAtIGxvd2VyX2JvdW5kLnggKTtcbiAgZmxvYXQgeWQgPSAoIGN1cnJlbnRWb3hlbC55IC0gbG93ZXJfYm91bmQueSApIC8gKCBoaWdoZXJfYm91bmQueSAtIGxvd2VyX2JvdW5kLnkgKTtcbiAgZmxvYXQgemQgPSAoIGN1cnJlbnRWb3hlbC56IC0gbG93ZXJfYm91bmQueiApIC8gKCBoaWdoZXJfYm91bmQueiAtIGxvd2VyX2JvdW5kLnogKTtcblxuICAvL1xuICAvLyBjMDBcbiAgLy9cblxuICAvL1xuXG4gIHZlYzQgdjAwMCA9IHZlYzQoMC4wLCAwLjAsIDAuMCwgMC4wKTtcbiAgdmVjMyBjMDAwID0gdmVjMyhsb3dlcl9ib3VuZC54LCBsb3dlcl9ib3VuZC55LCBsb3dlcl9ib3VuZC56KTtcbiAgJHtJbnRlcnBvbGF0aW9uSWRlbnRpdHkuYXBpKHRoaXMuX2Jhc2UsICdjMDAwJywgJ3YwMDAnKX1cbiAgdmVjMyBnMDAwID0gdjAwMC5yICogdmVjMygtMS4sIC0xLiwgLTEuKTtcblxuICAvL1xuXG4gIHZlYzQgdjEwMCA9IHZlYzQoMC4wLCAwLjAsIDAuMCwgMC4wKTtcbiAgdmVjMyBjMTAwID0gdmVjMyhoaWdoZXJfYm91bmQueCwgbG93ZXJfYm91bmQueSwgbG93ZXJfYm91bmQueik7XG4gICR7SW50ZXJwb2xhdGlvbklkZW50aXR5LmFwaSh0aGlzLl9iYXNlLCAnYzEwMCcsICd2MTAwJyl9XG4gIHZlYzMgZzEwMCA9IHYxMDAuciAqIHZlYzMoMS4sIC0xLiwgLTEuKTtcblxuICB2ZWM0IGMwMCA9IHYwMDAgKiAoIDEuMCAtIHhkICkgKyB2MTAwICogeGQ7XG5cbiAgLy9cbiAgLy8gYzAxXG4gIC8vXG4gIHZlYzQgdjAwMSA9IHZlYzQoMC4wLCAwLjAsIDAuMCwgMC4wKTtcbiAgdmVjMyBjMDAxID0gdmVjMyhsb3dlcl9ib3VuZC54LCBsb3dlcl9ib3VuZC55LCBoaWdoZXJfYm91bmQueik7XG4gICR7SW50ZXJwb2xhdGlvbklkZW50aXR5LmFwaSh0aGlzLl9iYXNlLCAnYzAwMScsICd2MDAxJyl9XG4gIHZlYzMgZzAwMSA9IHYwMDEuciAqIHZlYzMoLTEuLCAtMS4sIDEuKTtcblxuICB2ZWM0IHYxMDEgPSB2ZWM0KDAuMCwgMC4wLCAwLjAsIDAuMCk7XG4gIHZlYzMgYzEwMSA9IHZlYzMoaGlnaGVyX2JvdW5kLngsIGxvd2VyX2JvdW5kLnksIGhpZ2hlcl9ib3VuZC56KTtcbiAgJHtJbnRlcnBvbGF0aW9uSWRlbnRpdHkuYXBpKHRoaXMuX2Jhc2UsICdjMTAxJywgJ3YxMDEnKX1cbiAgdmVjMyBnMTAxID0gdjEwMS5yICogdmVjMygxLiwgLTEuLCAxLik7XG5cbiAgdmVjNCBjMDEgPSB2MDAxICogKCAxLjAgLSB4ZCApICsgdjEwMSAqIHhkO1xuXG4gIC8vXG4gIC8vIGMxMFxuICAvL1xuICB2ZWM0IHYwMTAgPSB2ZWM0KDAuMCwgMC4wLCAwLjAsIDAuMCk7XG4gIHZlYzMgYzAxMCA9IHZlYzMobG93ZXJfYm91bmQueCwgaGlnaGVyX2JvdW5kLnksIGxvd2VyX2JvdW5kLnopO1xuICAke0ludGVycG9sYXRpb25JZGVudGl0eS5hcGkodGhpcy5fYmFzZSwgJ2MwMTAnLCAndjAxMCcpfVxuICB2ZWMzIGcwMTAgPSB2MDEwLnIgKiB2ZWMzKC0xLiwgMS4sIC0xLik7XG5cbiAgdmVjNCB2MTEwID0gdmVjNCgwLjAsIDAuMCwgMC4wLCAwLjApO1xuICB2ZWMzIGMxMTAgPSB2ZWMzKGhpZ2hlcl9ib3VuZC54LCBoaWdoZXJfYm91bmQueSwgbG93ZXJfYm91bmQueik7XG4gICR7SW50ZXJwb2xhdGlvbklkZW50aXR5LmFwaSh0aGlzLl9iYXNlLCAnYzExMCcsICd2MTEwJyl9XG4gIHZlYzMgZzExMCA9IHYxMTAuciAqIHZlYzMoMS4sIDEuLCAtMS4pO1xuXG4gIHZlYzQgYzEwID0gdjAxMCAqICggMS4wIC0geGQgKSArIHYxMTAgKiB4ZDtcblxuICAvL1xuICAvLyBjMTFcbiAgLy9cbiAgdmVjNCB2MDExID0gdmVjNCgwLjAsIDAuMCwgMC4wLCAwLjApO1xuICB2ZWMzIGMwMTEgPSB2ZWMzKGxvd2VyX2JvdW5kLngsIGhpZ2hlcl9ib3VuZC55LCBoaWdoZXJfYm91bmQueik7XG4gICR7SW50ZXJwb2xhdGlvbklkZW50aXR5LmFwaSh0aGlzLl9iYXNlLCAnYzAxMScsICd2MDExJyl9XG4gIHZlYzMgZzAxMSA9IHYwMTEuciAqIHZlYzMoLTEuLCAxLiwgMS4pO1xuXG4gIHZlYzQgdjExMSA9IHZlYzQoMC4wLCAwLjAsIDAuMCwgMC4wKTtcbiAgdmVjMyBjMTExID0gdmVjMyhoaWdoZXJfYm91bmQueCwgaGlnaGVyX2JvdW5kLnksIGhpZ2hlcl9ib3VuZC56KTtcbiAgJHtJbnRlcnBvbGF0aW9uSWRlbnRpdHkuYXBpKHRoaXMuX2Jhc2UsICdjMTExJywgJ3YxMTEnKX1cbiAgdmVjMyBnMTExID0gdjExMS5yICogdmVjMygxLiwgMS4sIDEuKTtcblxuICB2ZWM0IGMxMSA9IHYwMTEgKiAoIDEuMCAtIHhkICkgKyB2MTExICogeGQ7XG5cbiAgLy8gYzAgYW5kIGMxXG4gIHZlYzQgYzAgPSBjMDAgKiAoIDEuMCAtIHlkKSArIGMxMCAqIHlkO1xuICB2ZWM0IGMxID0gYzAxICogKCAxLjAgLSB5ZCkgKyBjMTEgKiB5ZDtcblxuICAvLyBjXG4gIHZlYzQgYyA9IGMwICogKCAxLjAgLSB6ZCkgKyBjMSAqIHpkO1xuICBkYXRhVmFsdWUgPSBjO1xuXG4gIC8vIGNvbXB1dGUgZ3JhZGllbnRcbiAgZ3JhZGllbnQgPSBnMDAwICsgZzEwMCArIGcwMTAgKyBnMTEwICsgZzAxMSArIGcxMTEgKyBnMTEwICsgZzAxMTtcbiAgLy8gZ3JhZGllbnRNYWduaXR1ZGUgPSBsZW5ndGgoZ3JhZGllbnQpO1xuICAvLyAvLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Ob3JtYWxfKGdlb21ldHJ5KSNUcmFuc2Zvcm1pbmdfbm9ybWFsc1xuICAvLyB2ZWMzIGxvY2FsTm9ybWFsID0gKC0xLiAvIGdyYWRpZW50TWFnbml0dWRlKSAqIGdyYWRpZW50O1xuICAvLyBub3JtYWwgPSBub3JtYWxpemUobm9ybWFsUGl4ZWxUb1BhdGllbnQke3RoaXMuaWR9ICogbG9jYWxOb3JtYWwpO1xuICAvL25vcm1hbCA9IGdyYWRpZW50O1xuXG59XG4gICAgYDtcbiAgfVxuXG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IEludGVycG9sYXRpb25UcmlsaW5lYXIoKTtcbiIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFNoYWRlcnNCYXNlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9uYW1lID0gJ3NoYWRlcnNCYXNlJztcbiAgICB0aGlzLl9iYXNlID0ge1xuICAgICAgX2Z1bmN0aW9uczoge30sXG4gICAgICBfdW5pZm9ybXM6IHt9LFxuICAgIH07XG4gICAgdGhpcy5fZGVmaW5pdGlvbiA9ICcnO1xuICB9XG5cbiAgZ2V0IG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cblxuICBzZXQgbmFtZShuYW1lKSB7XG4gICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gIH1cbn1cbiIsImltcG9ydCBzaGFkZXJzSW50ZXJwb2xhdGlvbiBmcm9tICcuL2ludGVycG9sYXRpb24vc2hhZGVycy5pbnRlcnBvbGF0aW9uJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hhZGVyc0ZyYWdtZW50IHtcblxuICAvLyBwYXNzIHVuaWZvcm1zIG9iamVjdFxuICBjb25zdHJ1Y3Rvcih1bmlmb3Jtcykge1xuICAgIHRoaXMuX3VuaWZvcm1zID0gdW5pZm9ybXM7XG4gICAgdGhpcy5fZnVuY3Rpb25zID0ge307XG4gICAgdGhpcy5fbWFpbiA9ICcnO1xuICB9XG5cbiAgZnVuY3Rpb25zKCkge1xuICAgIGlmKHRoaXMuX21haW4gPT09ICcnKSB7XG4gICAgICAvLyBpZiBtYWluIGlzIGVtcHR5LCBmdW5jdGlvbnMgY2FuIG5vdCBoYXZlIGJlZW4gY29tcHV0ZWRcbiAgICAgIHRoaXMubWFpbigpO1xuICAgIH1cblxuICAgIGxldCBjb250ZW50ID0gJyc7XG4gICAgZm9yIChsZXQgcHJvcGVydHkgaW4gdGhpcy5fZnVuY3Rpb25zKSB7XG4gICAgICBjb250ZW50ICs9IHRoaXMuX2Z1bmN0aW9uc1twcm9wZXJ0eV0gKyAnXFxuJztcbiAgICB9XG5cbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuXG4gIHVuaWZvcm1zKCkge1xuICAgIGxldCBjb250ZW50ID0gJyc7XG4gICAgZm9yIChsZXQgcHJvcGVydHkgaW4gdGhpcy5fdW5pZm9ybXMpIHtcbiAgICAgIGxldCB1bmlmb3JtID0gdGhpcy5fdW5pZm9ybXNbcHJvcGVydHldO1xuICAgICAgY29udGVudCArPSBgdW5pZm9ybSAke3VuaWZvcm0udHlwZUdMU0x9ICR7cHJvcGVydHl9YDtcblxuICAgICAgaWYodW5pZm9ybSAmJiB1bmlmb3JtLmxlbmd0aCkge1xuICAgICAgICBjb250ZW50ICs9IGBbJHt1bmlmb3JtLmxlbmd0aH1dYDtcbiAgICAgIH1cblxuICAgICAgY29udGVudCArPSAnO1xcbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBtYWluKCkge1xuICAgIC8vIG5lZWQgdG8gcHJlLWNhbGwgbWFpbiB0byBmaWxsIHVwIHRoZSBmdW5jdGlvbnMgbGlzdFxuICAgIHRoaXMuX21haW4gPSBgXG52b2lkIG1haW4odm9pZCkge1xuXG4gIC8vIGRyYXcgYm9yZGVyIGlmIHNsaWNlIGlzIGNyb3BwZWRcbiAgLy8gZmxvYXQgdUJvcmRlckRhc2hMZW5ndGggPSAxMC47XG5cbiAgaWYoIHVDYW52YXNXaWR0aCA+IDAuICYmXG4gICAgICAoKGdsX0ZyYWdDb29yZC54ID4gdUJvcmRlck1hcmdpbiAmJiAoZ2xfRnJhZ0Nvb3JkLnggLSB1Qm9yZGVyTWFyZ2luKSA8IHVCb3JkZXJXaWR0aCkgfHxcbiAgICAgICAoZ2xfRnJhZ0Nvb3JkLnggPCAodUNhbnZhc1dpZHRoIC0gdUJvcmRlck1hcmdpbikgJiYgKGdsX0ZyYWdDb29yZC54ICsgdUJvcmRlck1hcmdpbikgPiAodUNhbnZhc1dpZHRoIC0gdUJvcmRlcldpZHRoKSApKSl7XG4gICAgZmxvYXQgdmFsdWVZID0gbW9kKGdsX0ZyYWdDb29yZC55LCAyLiAqIHVCb3JkZXJEYXNoTGVuZ3RoKTtcbiAgICBpZiggdmFsdWVZIDwgdUJvcmRlckRhc2hMZW5ndGggJiYgZ2xfRnJhZ0Nvb3JkLnkgPiB1Qm9yZGVyTWFyZ2luICYmIGdsX0ZyYWdDb29yZC55IDwgKHVDYW52YXNIZWlnaHQgLSB1Qm9yZGVyTWFyZ2luKSApe1xuICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCh1Qm9yZGVyQ29sb3IsIDEuKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBpZiggdUNhbnZhc0hlaWdodCA+IDAuICYmXG4gICAgICAoKGdsX0ZyYWdDb29yZC55ID4gdUJvcmRlck1hcmdpbiAmJiAoZ2xfRnJhZ0Nvb3JkLnkgLSB1Qm9yZGVyTWFyZ2luKSA8IHVCb3JkZXJXaWR0aCkgfHxcbiAgICAgICAoZ2xfRnJhZ0Nvb3JkLnkgPCAodUNhbnZhc0hlaWdodCAtIHVCb3JkZXJNYXJnaW4pICYmIChnbF9GcmFnQ29vcmQueSArIHVCb3JkZXJNYXJnaW4pID4gKHVDYW52YXNIZWlnaHQgLSB1Qm9yZGVyV2lkdGgpICkpKXtcbiAgICBmbG9hdCB2YWx1ZVggPSBtb2QoZ2xfRnJhZ0Nvb3JkLngsIDIuICogdUJvcmRlckRhc2hMZW5ndGgpO1xuICAgIGlmKCB2YWx1ZVggPCB1Qm9yZGVyRGFzaExlbmd0aCAmJiBnbF9GcmFnQ29vcmQueCA+IHVCb3JkZXJNYXJnaW4gJiYgZ2xfRnJhZ0Nvb3JkLnggPCAodUNhbnZhc1dpZHRoIC0gdUJvcmRlck1hcmdpbikgKXtcbiAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQodUJvcmRlckNvbG9yLCAxLik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLy8gZ2V0IHRleHR1cmUgY29vcmRpbmF0ZXMgb2YgY3VycmVudCBwaXhlbFxuICB2ZWM0IGRhdGFDb29yZGluYXRlcyA9IHVXb3JsZFRvRGF0YSAqIHZQb3M7XG4gIHZlYzMgY3VycmVudFZveGVsID0gdmVjMyhkYXRhQ29vcmRpbmF0ZXMueCwgZGF0YUNvb3JkaW5hdGVzLnksIGRhdGFDb29yZGluYXRlcy56KTtcbiAgdmVjNCBkYXRhVmFsdWUgPSB2ZWM0KDAuLCAwLiwgMC4sIDAuKTtcbiAgdmVjMyBncmFkaWVudCA9IHZlYzMoMC4sIDAuLCAwLik7XG4gICR7c2hhZGVyc0ludGVycG9sYXRpb24odGhpcywgJ2N1cnJlbnRWb3hlbCcsICdkYXRhVmFsdWUnLCAnZ3JhZGllbnQnKX1cblxuICAvLyBob3cgZG8gd2UgZGVhbCB3aWwgbW9yZSB0aGFuIDEgY2hhbm5lbD9cbiAgaWYodU51bWJlck9mQ2hhbm5lbHMgPT0gMSl7XG4gICAgZmxvYXQgaW50ZW5zaXR5ID0gZGF0YVZhbHVlLnI7XG5cbiAgICAvLyByZXNjYWxlL3Nsb3BlXG4gICAgaW50ZW5zaXR5ID0gaW50ZW5zaXR5KnVSZXNjYWxlU2xvcGVJbnRlcmNlcHRbMF0gKyB1UmVzY2FsZVNsb3BlSW50ZXJjZXB0WzFdO1xuXG4gICAgZmxvYXQgd2luZG93TWluID0gdVdpbmRvd0NlbnRlcldpZHRoWzBdIC0gdVdpbmRvd0NlbnRlcldpZHRoWzFdICogMC41O1xuICAgIGZsb2F0IHdpbmRvd01heCA9IHVXaW5kb3dDZW50ZXJXaWR0aFswXSArIHVXaW5kb3dDZW50ZXJXaWR0aFsxXSAqIDAuNTtcbiAgICBpbnRlbnNpdHkgPSAoIGludGVuc2l0eSAtIHdpbmRvd01pbiApIC8gdVdpbmRvd0NlbnRlcldpZHRoWzFdO1xuXG4gICAgZGF0YVZhbHVlLnIgPSBkYXRhVmFsdWUuZyA9IGRhdGFWYWx1ZS5iID0gaW50ZW5zaXR5O1xuICAgIGRhdGFWYWx1ZS5hID0gMS4wO1xuICB9XG5cbiAgLy8gQXBwbHkgTFVUIHRhYmxlLi4uXG4gIC8vXG4gIGlmKHVMdXQgPT0gMSl7XG4gICAgLy8gc2hvdWxkIG9wYWNpdHkgYmUgZ3JhYmJlZCB0aGVyZT9cbiAgICBkYXRhVmFsdWUgPSB0ZXh0dXJlMkQoIHVUZXh0dXJlTFVULCB2ZWMyKCBkYXRhVmFsdWUuciAsIDEuMCkgKTtcbiAgfVxuXG4gIGlmKHVJbnZlcnQgPT0gMSl7XG4gICAgZGF0YVZhbHVlID0gdmVjNCgxLikgLSBkYXRhVmFsdWU7XG4gICAgLy8gaG93IGRvIHdlIGRlYWwgd2l0aCB0aGF0IGFuZCBvcGFjaXR5P1xuICAgIGRhdGFWYWx1ZS5hID0gMS47XG4gIH1cblxuICBnbF9GcmFnQ29sb3IgPSBkYXRhVmFsdWU7XG5cbiAgICAvLyBpZiBvbiBlZGdlLCBkcmF3IGxpbmVcbiAgLy8gZmxvYXQgeFBvcyA9IGdsX0ZyYWdDb29yZC54LzUxMi47XG4gIC8vIGZsb2F0IHlQb3MgPSBnbF9GcmFnQ29vcmQueS81MTIuO1xuICAvLyBpZiggeFBvcyA8IDAuMDUgfHwgeFBvcyA+IC45NSB8fCB5UG9zIDwgMC4wNSB8fCB5UG9zID4gLjk1KXtcbiAgLy8gICBnbF9GcmFnQ29sb3IgPSB2ZWM0KHhQb3MsIHlQb3MsIDAuLCAxLik7Ly9kYXRhVmFsdWU7XG4gIC8vICAgLy9yZXR1cm47XG4gIC8vIH1cblxufVxuICAgYDtcbiAgfVxuXG4gIGNvbXB1dGUoKSB7XG4gICAgbGV0IHNoYWRlckludGVycG9sYXRpb24gPSAnJztcbiAgICAvLyBzaGFkZXJJbnRlcnBvbGF0aW9uLmlubGluZShhcmdzKSAvL3RydWUvZmFsc2VcbiAgICAvLyBzaGFkZXJJbnRlcnBvbGF0aW9uLmZ1bmN0aW9ucyhhcmdzKVxuXG4gICAgcmV0dXJuIGBcbi8vIHVuaWZvcm1zXG4ke3RoaXMudW5pZm9ybXMoKX1cblxuLy8gdmFyeWluZyAoc2hvdWxkIGZldGNoIGl0IGZyb20gdmVydGV4IGRpcmVjdGx5KVxudmFyeWluZyB2ZWM0ICAgICAgdlBvcztcblxuLy8gdGFpbG9yZWQgZnVuY3Rpb25zXG4ke3RoaXMuZnVuY3Rpb25zKCl9XG5cbi8vIG1haW4gbG9vcFxuJHt0aGlzLl9tYWlufVxuICAgICAgYDtcbiAgICB9XG5cbn1cbiIsIlxuLyoqXG4gKiBAbW9kdWxlIHNoYWRlcnMvZGF0YVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaGFkZXJzVW5pZm9ybSB7XG4gIC8qKlxuICAgKiBTaGFkZXJzIGRhdGEgdW5pZm9ybXNcbiAgICovXG4gIHN0YXRpYyB1bmlmb3JtcygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ3VUZXh0dXJlU2l6ZSc6IHtcbiAgICAgICAgdHlwZTogJ2knLFxuICAgICAgICB2YWx1ZTogMCxcbiAgICAgICAgdHlwZUdMU0w6ICdpbnQnLFxuICAgICAgfSxcbiAgICAgICd1VGV4dHVyZUNvbnRhaW5lcic6IHtcbiAgICAgICAgdHlwZTogJ3R2JyxcbiAgICAgICAgdmFsdWU6IFtdLFxuICAgICAgICB0eXBlR0xTTDogJ3NhbXBsZXIyRCcsXG4gICAgICAgIGxlbmd0aDogNyxcbiAgICAgIH0sXG4gICAgICAndURhdGFEaW1lbnNpb25zJzoge1xuICAgICAgICB0eXBlOiAnaXYnLFxuICAgICAgICB2YWx1ZTogWzAsIDAsIDBdLFxuICAgICAgICB0eXBlR0xTTDogJ2l2ZWMzJyxcbiAgICAgIH0sXG4gICAgICAndVdvcmxkVG9EYXRhJzoge1xuICAgICAgICB0eXBlOiAnbTQnLFxuICAgICAgICB2YWx1ZTogbmV3IFRIUkVFLk1hdHJpeDQoKSxcbiAgICAgICAgdHlwZUdMU0w6ICdtYXQ0JyxcbiAgICAgIH0sXG4gICAgICAndVdpbmRvd0NlbnRlcldpZHRoJzoge1xuICAgICAgICB0eXBlOiAnZnYxJyxcbiAgICAgICAgdmFsdWU6IFswLjAsIDAuMF0sXG4gICAgICAgIHR5cGVHTFNMOiAnZmxvYXQnLFxuICAgICAgICBsZW5ndGg6IDIsXG4gICAgICB9LFxuICAgICAgJ3VSZXNjYWxlU2xvcGVJbnRlcmNlcHQnOiB7XG4gICAgICAgIHR5cGU6ICdmdjEnLFxuICAgICAgICB2YWx1ZTogWzAuMCwgMC4wXSxcbiAgICAgICAgdHlwZUdMU0w6ICdmbG9hdCcsXG4gICAgICAgIGxlbmd0aDogMixcbiAgICAgIH0sXG4gICAgICAndU51bWJlck9mQ2hhbm5lbHMnOiB7XG4gICAgICAgIHR5cGU6ICdpJyxcbiAgICAgICAgdmFsdWU6IDEsXG4gICAgICAgIHR5cGVHTFNMOiAnaW50JyxcbiAgICAgIH0sXG4gICAgICAndUJpdHNBbGxvY2F0ZWQnOiB7XG4gICAgICAgIHR5cGU6ICdpJyxcbiAgICAgICAgdmFsdWU6IDgsXG4gICAgICAgIHR5cGVHTFNMOiAnaW50JyxcbiAgICAgIH0sXG4gICAgICAndUludmVydCc6IHtcbiAgICAgICAgdHlwZTogJ2knLFxuICAgICAgICB2YWx1ZTogMCxcbiAgICAgICAgdHlwZUdMU0w6ICdpbnQnLFxuICAgICAgfSxcbiAgICAgICd1THV0Jzoge1xuICAgICAgICB0eXBlOiAnaScsXG4gICAgICAgIHZhbHVlOiAwLFxuICAgICAgICB0eXBlR0xTTDogJ2ludCcsXG4gICAgICB9LFxuICAgICAgJ3VUZXh0dXJlTFVUJzoge1xuICAgICAgICB0eXBlOiAndCcsXG4gICAgICAgIHZhbHVlOiBbXSxcbiAgICAgICAgdHlwZUdMU0w6ICdzYW1wbGVyMkQnLFxuICAgICAgfSxcbiAgICAgICd1UGl4ZWxUeXBlJzoge1xuICAgICAgICB0eXBlOiAnaScsXG4gICAgICAgIHZhbHVlOiAwLFxuICAgICAgICB0eXBlR0xTTDogJ2ludCcsXG4gICAgICB9LFxuICAgICAgJ3VQYWNrZWRQZXJQaXhlbCc6IHtcbiAgICAgICAgdHlwZTogJ2knLFxuICAgICAgICB2YWx1ZTogMSxcbiAgICAgICAgdHlwZUdMU0w6ICdpbnQnLFxuICAgICAgfSxcbiAgICAgICd1SW50ZXJwb2xhdGlvbic6IHtcbiAgICAgICAgdHlwZTogJ2knLFxuICAgICAgICB2YWx1ZTogMSxcbiAgICAgICAgdHlwZUdMU0w6ICdpbnQnLFxuICAgICAgfSxcbiAgICAgICd1Q2FudmFzV2lkdGgnOiB7XG4gICAgICAgIHR5cGU6ICdmJyxcbiAgICAgICAgdmFsdWU6IDAuLFxuICAgICAgICB0eXBlR0xTTDogJ2Zsb2F0JyxcbiAgICAgIH0sXG4gICAgICAndUNhbnZhc0hlaWdodCc6IHtcbiAgICAgICAgdHlwZTogJ2YnLFxuICAgICAgICB2YWx1ZTogMC4sXG4gICAgICAgIHR5cGVHTFNMOiAnZmxvYXQnLFxuICAgICAgfSxcbiAgICAgICd1Qm9yZGVyQ29sb3InOiB7XG4gICAgICAgIHR5cGU6ICd2MycsXG4gICAgICAgIHZhbHVlOiBbMS4wLCAwLjAsIDAuNV0sXG4gICAgICAgIHR5cGVHTFNMOiAndmVjMycsXG4gICAgICB9LFxuICAgICAgJ3VCb3JkZXJXaWR0aCc6IHtcbiAgICAgICAgdHlwZTogJ2YnLFxuICAgICAgICB2YWx1ZTogMi4sXG4gICAgICAgIHR5cGVHTFNMOiAnZmxvYXQnLFxuICAgICAgfSxcbiAgICAgICd1Qm9yZGVyTWFyZ2luJzoge1xuICAgICAgICB0eXBlOiAnZicsXG4gICAgICAgIHZhbHVlOiAyLixcbiAgICAgICAgdHlwZUdMU0w6ICdmbG9hdCcsXG4gICAgICB9LFxuICAgICAgJ3VCb3JkZXJEYXNoTGVuZ3RoJzoge1xuICAgICAgICB0eXBlOiAnZicsXG4gICAgICAgIHZhbHVlOiAxMC4sXG4gICAgICAgIHR5cGVHTFNMOiAnZmxvYXQnLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG59XG4iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBTaGFkZXJzVmVydGV4IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgfVxuXG4gICAgY29tcHV0ZSgpIHtcbiAgICAgICAgcmV0dXJuIGBcbnZhcnlpbmcgdmVjNCB2UG9zO1xuXG4vL1xuLy8gbWFpblxuLy9cbnZvaWQgbWFpbigpIHtcblxuICB2UG9zID0gbW9kZWxNYXRyaXggKiB2ZWM0KHBvc2l0aW9uLCAxLjAgKTtcbiAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0aW9uTWF0cml4ICogbW9kZWxWaWV3TWF0cml4ICogdmVjNChwb3NpdGlvbiwgMS4wICk7XG5cbn1cbiAgICAgICAgYDtcbiAgICB9XG5cbn1cbiJdfQ==
