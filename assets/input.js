const backgroundColor = 0xffffff;
const textColor = 0x2f24c1;
const cursorColor = 0x3fd1cb;
const highlightColor = 0x3fd1cb;

/*////////////////////////////////////////*/

var renderCalls = [];
function render() {
  requestAnimationFrame(render);
  renderCalls.forEach((callback) => {
    callback();
  });
}
render();

/*////////////////////////////////////////*/

var scene = new THREE.Scene();
// Use a dark fog color so the 3D scene blends with the page background
// (previously used the white backgroundColor which caused white fog).
scene.fog = new THREE.Fog(0x020617, 30, 300);

var camera = new THREE.PerspectiveCamera(
  80,
  window.innerWidth / window.innerHeight,
  0.1,
  800
);
camera.position.z = 30;
camera.position.x = 5;
camera.position.y = -2;

// Detect mobile devices and reduce quality for performance
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
const isLowPerformance = isMobile || window.innerWidth < 768;

var renderer = new THREE.WebGLRenderer({
  antialias: !isLowPerformance, // Disable antialiasing on mobile for performance
  alpha: true,
  powerPreference: "high-performance",
});

// Use lower pixel ratio on mobile to improve performance
const pixelRatio = isLowPerformance
  ? Math.min(window.devicePixelRatio, 1.5)
  : window.devicePixelRatio;
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Make the canvas background transparent so the page shows through.
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = Math.pow(0.94, 5.0);

// Disable shadows on mobile for better performance
if (!isLowPerformance && window.innerWidth > 768) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
}

// Append canvas to contact section wrapper instead of body
const canvasWrapper = document.getElementById("contact-canvas-wrapper");
if (canvasWrapper) {
  try {
    canvasWrapper.appendChild(renderer.domElement);

    // Update resize handler to use wrapper dimensions
    function updateCanvasSize() {
      try {
        const width = canvasWrapper.clientWidth || window.innerWidth;
        const height = canvasWrapper.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      } catch (error) {
        console.error("Error updating canvas size:", error);
      }
    }

    window.addEventListener("resize", updateCanvasSize, false);

    // Initial size update with delay to ensure DOM is ready
    setTimeout(updateCanvasSize, 100);
  } catch (error) {
    console.error("Error initializing canvas wrapper:", error);
  }
} else {
  // Fallback to body if wrapper not found
  console.warn("Canvas wrapper not found, appending to body");
  document.body.appendChild(renderer.domElement);

  window.addEventListener(
    "resize",
    function () {
      try {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      } catch (error) {
        console.error("Error resizing canvas:", error);
      }
    },
    false
  );
}

function renderScene() {
  renderer.render(scene, camera);
}
renderCalls.push(renderScene);

/*////////////////////////////////////////*/

var pointer = {
  x: 0,
  y: 0,
};

document.addEventListener("mousemove", pointerMove);
document.addEventListener("touchmove", pointerMove);

document.body.addEventListener("mouseleave", pointerReset);
document.body.addEventListener("touchcancel", pointerReset);

function pointerReset(e) {
  pointer.x = 0.5;
  pointer.y = 0.5;
}

function pointerMove(e) {
  let pos = e.touches ? e.touches[0] : e;
  pointer.x = pos.clientX / window.innerWidth;
  // Use innerHeight for vertical normalization (previously used innerWidth by mistake)
  pointer.y = pos.clientY / window.innerHeight;
}

let mousePos = { x: 0.25, y: 0.5 };
function trackMouse(e) {
  let pointer = e.touches ? e.touches[0] : e;
  mousePos.x = pointer.clientX / window.innerWidth;
  mousePos.y = pointer.clientY / window.innerHeight;
}

function ease(current, target, ease) {
  return current + (target - current) * (ease || 0.2);
}

// var center = new THREE.Vector3(0,0,0);
// function updateCamera(){
//   mousePos._x = ease(mousePos._x || 0.5, mousePos.x, 0.06);
//   mousePos._y = ease(mousePos._y || 0.5, mousePos.y, 0.06);

//   scene.rotation.y = (mousePos._x - 0.5) * Math.PI/4;
//   scene.rotation.x = (mousePos._y - 0.5) * Math.PI/4;

//   // scene.position.x = -(12 * (mousePos._x - 0.5) * 2);
//   // scene.position.y = (12 * (mousePos._y - 0.5) * 2);
//   //scene.lookAt(center);
//   // camera.lookAt( new THREE.Vector3(
//   //   (10 * (mousePos._x - 0.5) * 2),
//   //   -(10 * (mousePos._y - 0.5) * 2),
//   //   0
//   // ));
// }
// updateCamera();

// window.addEventListener('mousemove', trackMouse);
// renderCalls.push(updateCamera);

/*////////////////////////////////////////*/

//let orbit = new THREE.OrbitControls(camera, renderer.domElement);
// orbit.enableRotate = false;
// orbit.enablePan = false;
//orbit.enableKeys = true;
//orbit.zoomSpeed = 0.6;
//orbit.minDistance = 10;

/*////////////////////////////////////////*/

var ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

var hemiLight = new THREE.HemisphereLight(0xfff7eb, 0xebf7fd, 0.3);
scene.add(hemiLight);

var light = new THREE.SpotLight(0xffffff);
light.position.y = 40;
light.position.x = 0;
light.position.z = 200;

// Only enable shadows on desktop for better mobile performance
if (!isLowPerformance) {
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 800;
  light.shadow.camera.fov = 40;
}

light.power = 1.5;
scene.add(light);

renderCalls.push(() => {
  light.position.copy(camera.position);
});

//var axisHelper = new THREE.AxisHelper( 30 );
//scene.add( axisHelper );
// The X axis is red. The Y axis is green. The Z axis is blue.

/*////////////////////////////////////////*/

// https://codepen.io/shshaw/pen/LbaKpa?editors=0010
var characters = {
  0: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  1: [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
  ],
  2: [
    [0, 0],
    [1, 0],
    [2, 1],
    [1, 2],
    [0, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  3: [
    [0, 0],
    [1, 0],
    [2, 1],
    [1, 2],
    [2, 2],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [2, 3],
    [2, 4],
  ],
  5: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [2, 3],
    [0, 4],
    [1, 4],
  ],
  6: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  7: [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
    [1, 3],
    [1, 4],
  ],
  8: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  9: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  Z: [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [1, 2],
    [0, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  Y: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [2, 3],
    [0, 4],
    [1, 4],
  ],
  X: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [1, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [2, 4],
  ],
  W: [
    [0, 0],
    [4, 0],
    [0, 1],
    [2, 1],
    [4, 1],
    [0, 2],
    [2, 2],
    [4, 2],
    [0, 3],
    [2, 3],
    [4, 3],
    [1, 4],
    [3, 4],
  ],
  V: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [1, 4],
  ],
  U: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  T: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
  ],
  S: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [1, 4],
  ],
  R: [
    [0, 0],
    [1, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [1, 3],
    [0, 4],
    [2, 4],
  ],
  Q: [
    [1, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [1, 4],
    [2, 4],
    [3, 4],
  ],
  P: [
    [0, 0],
    [1, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [0, 3],
    [0, 4],
  ],
  O: [
    [1, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [1, 4],
  ],
  N: [
    [0, 0],
    [1, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [2, 4],
  ],
  M: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [0, 1],
    [2, 1],
    [4, 1],
    [0, 2],
    [2, 2],
    [4, 2],
    [0, 3],
    [2, 3],
    [4, 3],
    [0, 4],
    [4, 4],
  ],
  L: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  K: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [2, 4],
  ],
  J: [
    [2, 0],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [1, 4],
  ],
  I: [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  H: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [2, 4],
  ],
  G: [
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  F: [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [0, 3],
    [0, 4],
  ],
  E: [
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [0, 3],
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  D: [
    [0, 0],
    [1, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [1, 4],
  ],
  C: [
    [1, 0],
    [2, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [2, 4],
  ],
  B: [
    [0, 0],
    [1, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [1, 4],
  ],
  A: [
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [0, 3],
    [2, 3],
    [0, 4],
    [2, 4],
  ],
  "}": [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 2],
    [1, 3],
    [0, 4],
    [1, 4],
  ],
  "{": [
    [1, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 4],
  ],
  "]": [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [0, 4],
    [1, 4],
  ],
  "[": [
    [0, 0],
    [1, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 4],
  ],
  ")": [
    [0, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [0, 4],
  ],
  "(": [
    [1, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
  ],
  "—": [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
  ],
  "–": [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  "-": [
    [0, 2],
    [1, 2],
  ],
  "`": [
    [0, 0],
    [1, 1],
  ],
  '"': [
    [0, 0],
    [1, 0],
    [3, 0],
    [4, 0],
    [1, 1],
    [4, 1],
    [0, 2],
    [3, 2],
  ],
  "\\": [
    [0, 0],
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
  ],
  ",": [
    [1, 3],
    [0, 4],
  ],
  ":": [
    [0, 1],
    [0, 3],
  ],
  "^": [
    [2, 0],
    [1, 1],
    [3, 1],
    [0, 2],
    [4, 2],
  ],
  "!": [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 4],
  ],
  "=": [
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 3],
    [1, 3],
    [2, 3],
  ],
  "|": [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
  ".": [[0, 4]],
  "%": [
    [0, 0],
    [1, 0],
    [4, 0],
    [0, 1],
    [1, 1],
    [3, 1],
    [2, 2],
    [1, 3],
    [3, 3],
    [4, 3],
    [0, 4],
    [3, 4],
    [4, 4],
  ],
  "'": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 2],
  ],
  "?": [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [1, 2],
    [1, 4],
  ],
  ";": [
    [0, 1],
    [0, 3],
    [0, 4],
  ],
  "/": [
    [2, 0],
    [2, 1],
    [1, 2],
    [0, 3],
    [0, 4],
  ],
  ">": [
    [0, 0],
    [1, 1],
    [2, 2],
    [1, 3],
    [0, 4],
  ],
  _: [
    [0, 4],
    [1, 4],
    [2, 4],
  ],
  "+": [
    [1, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [1, 3],
  ],
  "<": [
    [2, 0],
    [1, 1],
    [0, 2],
    [1, 3],
    [2, 4],
  ],
  "~": [
    [1, 0],
    [3, 0],
    [0, 1],
    [2, 1],
  ],
  "#": [
    [1, 0],
    [3, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [1, 2],
    [3, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [1, 4],
    [3, 4],
  ],
  "@": [
    [1, 0],
    [2, 0],
    [3, 0],
    [0, 1],
    [2, 1],
    [4, 1],
    [0, 2],
    [2, 2],
    [3, 2],
    [0, 3],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],
  ],
};

/*////////////////////////////////////////*/

var poxelGeometry = new THREE.BoxGeometry(1, 1, 1);

// Use simpler material on mobile for better performance
var poxelMaterial = isLowPerformance
  ? new THREE.MeshBasicMaterial({
      color: 0xff0000,
    })
  : new THREE.MeshPhongMaterial({
      color: 0xff0000,
      shininess: 60,
    });

// Modern Three.js uses ES6 classes; subclass THREE.Mesh directly.
class Poxel extends THREE.Mesh {
  constructor(material) {
    super(poxelGeometry, poxelMaterial);
    // Disable shadows on mobile
    if (!isLowPerformance) {
      this.castShadow = true;
      this.receiveShadow = true;
    }
  }

  transitionOut(speed) {
    speed = speed || 0.4 + Math.random() * 0.2;

    // Use GSAP v3 timeline API
    let tl = gsap.timeline({
      onStart: () => {
        this.animating = true;
      },
      onComplete: () => {
        this.animating = false;
      },
    });

    // animate position.z out
    tl.to(
      this.position,
      {
        duration: speed,
        z: -80,
        delay: Math.random(),
        ease: "power2.in",
      },
      0
    );

    this.material = this.material.clone();
    this.material.transparent = true;

    // fade material opacity
    tl.to(
      this.material,
      {
        duration: speed * 0.6,
        opacity: 0,
        ease: "none",
      },
      speed * 0.6
    );

    return tl;
  }

  transitionIn(speed) {
    speed = speed || 0.4 + Math.random() * 0.35;

    // Use GSAP v3 'from' tween. Replace custom 'myBounce' with built-in bounce
    return gsap.from(this.position, {
      duration: speed,
      z: 80,
      ease: "bounce.out",
      onStart: () => {
        this.animating = true;
      },
      onComplete: () => {
        this.animating = false;
      },
    });
  }
}

// Create the CustomBounce easing only if the plugin is available. Older demos expect
// a CustomBounce plugin — guard to avoid runtime errors when it's not present.
if (typeof CustomBounce !== "undefined") {
  try {
    CustomBounce.create("myBounce", { strength: 0.1, squash: 0 });
  } catch (err) {
    console.warn("CustomBounce.create failed:", err);
  }
  // If running GSAP 3 and the plugin exposes a registration object, try to register it
  if (typeof gsap !== "undefined" && gsap.registerPlugin) {
    try {
      gsap.registerPlugin(CustomBounce);
    } catch (e) {
      // plugin may not be in the expected format; ignore
    }
  }
}

/*////////////////////////////////////////*/

class Character extends THREE.Object3D {
  constructor(name, opts) {
    super();
    this.name = name;
    opts = opts || {};
    for (var key in opts) {
      this[key] = opts[key];
    }
    if (!opts || !opts.poxelMaterial) {
      this.poxelMaterial = new THREE.MeshPhongMaterial({
        color: this.color, //color || '#F00',
        transparent: true,
        emissive: this.color,
        emissiveIntensity: 0.6,
        opacity: 0.95,
        shininess: 120,
      });
    }
    this.buildPoxels(name);
  }

  // default color
  color = textColor;

  buildPoxels(name) {
    let pixels = characters[name];

    let i = pixels.length;

    let width = 0;
    let height = 0;

    while (i--) {
      let pixel = pixels[i];
      let pixelCube = new Poxel();
      pixelCube.material = this.poxelMaterial;

      width = pixel[0] > width ? pixel[0] : width;
      height = pixel[1] > height ? pixel[1] : height;

      pixelCube.position.set(
        pixel[0], // - (this.spriteWidth/2),
        -pixel[1], // + (this.spriteHeight/2),
        0
      );
      this.add(pixelCube);
    }

    this.width = width + 1;
    this.height = height + 1;
  }

  transitionIn(delay, onComplete) {
    onComplete = onComplete || function () {};

    let tl = gsap.timeline({
      onStart: () => {
        this.animating = true;
      },
      onComplete: () => {
        this.animating = false;
        onComplete.call(this, this);
      },
      delay: delay,
    });

    // traverseVisible is not present in modern Three.js; use traverse and test visibility
    this.traverse((child) => {
      if (child !== this && child.visible) {
        if (typeof child.transitionIn === "function") {
          tl.add(child.transitionIn(), 0);
        }
      }
    });

    return tl;
  }

  transitionOut(delay, onComplete) {
    onComplete = onComplete || function () {};

    let tl = gsap.timeline({
      onStart: () => {
        this.animating = true;
      },
      onComplete: () => {
        this.animating = false;
        onComplete.call(this, this);
      },
      delay: delay,
    });

    this.traverse((child) => {
      if (child !== this && child.visible) {
        if (typeof child.transitionOut === "function") {
          tl.add(child.transitionOut(), 0);
        }
      }
    });

    return tl;
  }
}

/*////////////////////////////////////////*/

function ease(current, target, ease) {
  return current + (target - current) * (ease || 0.2);
}

var container = new THREE.Group();
scene.add(container);

var el = document.createElement("div");
// Append to contact-textarea-wrapper if it exists, otherwise fallback to body
const textareaWrapper = document.getElementById("contact-textarea-wrapper");
if (textareaWrapper) {
  textareaWrapper.appendChild(el);
} else {
  document.body.appendChild(el);
}

var inputter = new Vue({
  el: el,
  data: () => ({
    message: "",
    defaultMessage: "Start\nTyping",
    characters: [],

    offsetX: 0,
    offsetY: 0,
    group: new THREE.Group(),
    cursor: null,
  }),
  template: `
    <div style="width:100%; height:100%; display:flex; flex-direction:row; align-items:center; gap:8px;">
      <textarea ref="input" type="text" v-model="message" style="flex:1; min-width:0; height:56px; padding: 0.75rem 1rem; background: transparent; border: none; color: inherit; font-size: 1rem; font-family: inherit; resize: none; border-radius:10px;"></textarea>
      <button type="button" @click="sendMessage" aria-label="Отправить сообщение" style="flex:0 0 auto; width:56px; height:56px; background:transparent; color:white; border:none; padding:0; border-radius:10px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M22 2L11 13"></path>
          <path d="M22 2L15 22l-4-9-9-4 19-7z"></path>
        </svg>
      </button>
    </div>
  `,

  mounted() {
    // Try to load saved defaultMessage from the local API (supabase proxy)
    // Fallback to localStorage if the API is unreachable.
    (async () => {
      try {
        const resp = await fetch("/api/message");
        if (resp.ok) {
          const json = await resp.json();
          if (
            json &&
            typeof json.message === "string" &&
            json.message.length > 0
          ) {
            this.defaultMessage = json.message;
          } else {
            // fallback to localStorage below
            throw new Error("no_message");
          }
        } else {
          throw new Error("api_error");
        }
      } catch (e) {
        try {
          const saved = localStorage.getItem("diorhc_defaultMessage");
          if (saved) this.defaultMessage = saved;
        } catch (ee) {}
      } finally {
        this.message =
          (location.hash && decodeURI(location.hash.slice(1))) ||
          this.defaultMessage;
      }
    })();

    this.$refs.input.focus();
    //renderCalls.push(()=>{ this.$refs.input.focus(); });
    this.$nextTick(() => {
      this.$refs.input.select();
    });

    document.addEventListener("focus", (e) => {
      console.log("click!");
      this.$refs.input.focus();
    });

    // Cursor for tracking position in textarea
    this.cursor = new Character("|", {
      poxelMaterial: new THREE.MeshPhongMaterial({
        color: cursorColor,
        emissive: cursorColor,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.6,
      }),
    });
    this.cursor.visible = false;
    // Use GSAP v3 for the blinking cursor
    gsap.to(
      {},
      {
        duration: 0.7,
        onRepeat: () => {
          this.cursor.visible = !this.cursor.visible;
        },
        repeat: -1,
      }
    );
    this.cursor.traverse((child) => {
      child.attractive = false;
    });

    this.cursor.position.z = -1.1;
    this.group.add(this.cursor);

    // text highlight when selection is made
    this.highlight = new Poxel();
    this.highlight.material = new THREE.MeshPhongMaterial({
      color: highlightColor,
      emissive: highlightColor,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.6,
    });
    this.highlight.position.z = -2;
    container.add(this.highlight);

    container.add(this.group);

    // Keep some dimension to the group.
    let poxel = new Poxel();
    poxel.visible = false;
    this.group.add(poxel);

    // for sizing calculations
    // BoundingBoxHelper was removed from modern Three.js. Create a lightweight
    // Object3D that contains a Box3 under `.box` and an `.update()` method so
    // the rest of the code (which reads `helper.box.max/min`) continues to work.
    this.helper = new THREE.Object3D();
    this.helper.box = new THREE.Box3();
    this.helper.visible = false;
    // cache a reference to the group for use inside update
    (function (helper, groupRef) {
      helper.update = function () {
        // recompute the bounding box for the group
        this.box.setFromObject(groupRef);
      };
    })(this.helper, this.group);
    container.add(this.helper);

    renderCalls.push(this.update);
  },

  watch: {
    message: function (val, oldVal) {
      val = val && val.toUpperCase();
      oldVal = oldVal && oldVal.toUpperCase();
      if (val === oldVal) {
        return;
      }

      let len = Math.max(val.length, oldVal.length);
      let i = 0;
      let delay = 0;
      let tl = gsap.timeline();

      let oldChars = this.characters;
      let newChars = val.split("");

      for (; i < len; i++) {
        let char = newChars[i];
        let oldChar = (oldChars[i] && oldChars[i].name) || oldChars[i];

        if (oldChar !== char) {
          //console.log('not equal', i, char, oldChar);
          if (oldChar) {
            tl.add(this.removeChar(oldChars[i], i), (delay += 0.05));
          }
          if (char) {
            tl.add(this.addChar(char, i), (delay += 0.05));
          }
        }
      }

      //this.cursor.visible = true;
    },
  },

  methods: {
    sendMessage() {
      // when user clicks send, update defaultMessage and persist it
      this.defaultMessage = this.message || this.defaultMessage;

      // Try to persist via local API; fall back to localStorage when offline
      (async () => {
        try {
          const resp = await fetch("/api/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: this.defaultMessage }),
          });
          if (!resp.ok) throw new Error("network");
        } catch (e) {
          try {
            localStorage.setItem("diorhc_defaultMessage", this.defaultMessage);
          } catch (ee) {}
        }
      })();

      // optional: briefly blur the textarea to indicate submission
      try {
        this.$refs.input.blur();
      } catch (e) {}
    },

    addChar(char, i) {
      let character = char.toUpperCase();
      let tl = function () {};

      if (characters[character]) {
        character = new Character(character);
        tl = character.transitionIn(null);
        this.group.add(character);
      }

      this.characters[i] = character;

      let pos = this.getPosition(i);
      if (character.position) {
        character.position.x = pos[0] - character.width;
        character.position.y = pos[1];
      }

      return tl;
    },

    removeChar(char, i) {
      delete this.characters[i];
      if (char && char.transitionOut) {
        return char.transitionOut(null, (char) => {
          if (char.parent) {
            char.parent.remove(char);
          }
        });
      } else {
        return function () {};
      }
    },

    getPosition(index) {
      let offsetX = 0;
      let offsetY = 0;

      this.characters.forEach((char, i) => {
        if (index !== null && i > index) {
          return false;
        }
        if (char.match && char.match(/[\n\r]/)) {
          offsetY -= 6;
          offsetX = 0;
        } else if (char.width) {
          offsetX += char.width + 1;
        } else {
          offsetX += 4;
        }
      });

      this.offsetX = offsetX;
      this.offsetY = offsetY;

      return [offsetX, offsetY];
    },

    updateCursor() {
      let start = this.$refs.input.selectionStart;
      let end = this.$refs.input.selectionEnd;

      let cursorPos = this.getPosition(start - 1);
      let cursorX = cursorPos[0] + 1;
      let cursorY = cursorPos[1];
      let scaleX = 1;
      let scaleY = 1;

      if (start !== end) {
        let cursorEnd = this.getPosition(end);
        cursorX = cursorEnd[0] - (cursorEnd[0] - cursorPos[0]) / 2;

        this.cursor.visible = false;
        this.cursor.animate = false;
        this.updateHighlight();
      } else {
        this.highlight.visible = false;
        this.cursor.animate = true;
      }

      this.cursor.position.x = ease(this.cursor.position.x, cursorX, 0.2);
      this.cursor.position.y = ease(this.cursor.position.y, cursorY, 0.5);
      this.cursor.scale.x = ease(this.cursor.scale.x, scaleX, 0.2);
      this.cursor.scale.y = ease(this.cursor.scale.y, scaleY, 0.2);
    },

    updateHighlight() {
      this.highlight.visible = true;
      this.highlight.position.copy(this.group.position);
      this.highlight.scale.x =
        Math.abs(this.helper.box.max.x) + Math.abs(this.helper.box.min.x);
      this.highlight.position.x += this.highlight.scale.x / 2;
      this.highlight.scale.y =
        Math.abs(this.helper.box.max.y) + Math.abs(this.helper.box.min.y);
      this.highlight.position.y -= this.highlight.scale.y / 2;
      this.highlight.position.z -= 2;
    },

    update() {
      this.helper.position.copy(this.group.position);
      this.helper.position.z = -1;
      this.helper.update();

      this.updateCursor();

      let centerX = (this.helper.box.max.x + this.helper.box.min.x) / 2;
      let centerY = (this.helper.box.max.y + this.helper.box.min.y) / 1.5;

      this.group.position.x = ease(
        this.group.position.x,
        -this.offsetX - centerX,
        0.05
      );
      this.group.position.y = ease(
        this.group.position.y,
        -this.offsetY - centerY,
        0.05
      );
      this.group.position.z = ease(
        this.group.position.z,
        -this.characters.length / 2,
        0.05
      );
    },
  },
});

/*////////////////////////////////////////*/
