const backgroundColor = 0xffffff;
const textColor = 0x2f24c1;
const cursorColor = 0x3fd1cb;
const highlightColor = 0x3fd1cb;

/*////////////////////////////////////////*/

// Error boundary wrapper for Three.js initialization
try {
  if (typeof THREE === "undefined") {
    throw new Error("THREE.js library not loaded");
  }

  var renderCalls = [];
  function render() {
    requestAnimationFrame(render);
    renderCalls.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error("Render callback error:", err);
      }
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

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Make the canvas background transparent so the page shows through.
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = Math.pow(0.94, 5.0);

  // Append canvas to contact section wrapper instead of body
  const canvasWrapper = document.getElementById("contact-canvas-wrapper");
  if (canvasWrapper) {
    canvasWrapper.appendChild(renderer.domElement);

    // Update resize handler to use wrapper dimensions
    function updateCanvasSize() {
      const width = canvasWrapper.clientWidth;
      const height = canvasWrapper.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    window.addEventListener("resize", updateCanvasSize, false);

    // Initial size update
    updateCanvasSize();
  } else {
    // Fallback to body if wrapper not found
    document.body.appendChild(renderer.domElement);

    window.addEventListener(
      "resize",
      function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false
    );
  }

  function renderScene() {
    renderer.render(scene, camera);
  }
  renderCalls.push(renderScene);

  // Memory cleanup function
  window.cleanupThreeJS = function () {
    try {
      // Stop animation loop
      renderCalls = renderCalls.filter((fn) => fn !== renderScene);

      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      // Dispose renderer
      renderer.dispose();

      // Remove canvas
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }

      console.log("Three.js resources cleaned up");
    } catch (err) {
      console.error("Error cleaning up Three.js:", err);
    }
  };

  // Cleanup on page unload
  window.addEventListener("beforeunload", window.cleanupThreeJS);

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

  var ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);

  var hemiLight = new THREE.HemisphereLight(0xfff7eb, 0xebf7fd, 0.3);
  scene.add(hemiLight);

  var light = new THREE.SpotLight(0xffffff);
  light.position.y = 40;
  light.position.x = 0;
  light.position.z = 200;
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 800;
  light.shadow.camera.fov = 40;
  light.power = 1.5;
  scene.add(light);

  renderCalls.push(() => {
    light.position.copy(camera.position);
  });

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
  var poxelMaterial = new THREE.MeshPhongMaterial({
    color: 0xff0000, //color || '#F00',
    shininess: 60,
  });

  // Poxel is a small cube used as a pixel. Implemented as an ES6 class with
  // its animation methods defined as class methods for clarity.
  class Poxel extends THREE.Mesh {
    constructor(material) {
      super(poxelGeometry, poxelMaterial);
      this.castShadow = true;
      this.receiveShadow = true;
    }

    transitionOut(speed) {
      speed = speed || 0.4 + Math.random() * 0.2;

      let tl = gsap.timeline({
        onStart: () => {
          this.animating = true;
        },
        onComplete: () => {
          this.animating = false;
        },
      });

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

      return gsap.from(this.position, {
        duration: speed,
        z: 80,
        ease: window.myBounce || "bounce.out",
        onStart: () => {
          this.animating = true;
        },
        onComplete: () => {
          this.animating = false;
        },
      });
    }
  }

  // If CustomBounce plugin isn't available (causes ReferenceError), provide a safe
  // fallback that maps a friendly name to a built-in GSAP3 ease string.
  if (typeof CustomBounce === "undefined") {
    window.myBounce = "bounce.out";
  } else {
    try {
      CustomBounce.create("myBounce", { strength: 0.1, squash: 0 });
      window.myBounce = "myBounce";
    } catch (e) {
      window.myBounce = "bounce.out";
    }
  }

  /*////////////////////////////////////////*/

  // Use ES6 class to extend THREE.Object3D (Three's Object3D is an ES6 class)
  class Character extends THREE.Object3D {
    constructor(name, opts) {
      super();
      this.name = name;
      opts = opts || {};
      for (var key in opts) {
        this[key] = opts[key];
      }

      // default color
      this.color = this.color || textColor;

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

        pixelCube.position.set(pixel[0], -pixel[1], 0);
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

      const addChild = (child) => {
        if (child !== this && child.transitionIn) {
          tl.add(child.transitionIn(), 0);
        }
      };

      if (typeof this.traverseVisible === "function") {
        this.traverseVisible(addChild);
      } else {
        this.traverse(addChild);
      }

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

      const addChild = (child) => {
        if (child !== this && child.transitionOut) {
          tl.add(child.transitionOut(), 0);
        }
      };

      if (typeof this.traverseVisible === "function") {
        this.traverseVisible(addChild);
      } else {
        this.traverse(addChild);
      }

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
  // Prefer inserting the Vue input UI into the contact textarea wrapper if present
  var textWrapper =
    document.getElementById("contact-textarea-wrapper") ||
    document.querySelector(".contact-textarea-wrapper");
  if (textWrapper) {
    if (!textWrapper.style.position) textWrapper.style.position = "relative";
    textWrapper.appendChild(el);
  } else {
    document.body.appendChild(el);
  }
  // Insert markup into the created container element so Vue can mount to existing DOM
  const inputTemplate = `
  <div role="form" aria-label="Форма связи" style="width:100%; height:100%; display:flex; flex-direction:row; align-items:center; gap:8px;">
    <label for="contactMessageInput" class="sr-only">Введите ваше сообщение</label>
    <textarea 
      ref="input" 
      id="contactMessageInput"
      v-model="message" 
      aria-label="Введите ваше сообщение для отправки"
      placeholder="Начните печатать..."
      style="flex:1; min-width:0; height:56px; padding: 0.75rem 1rem; background: transparent; border: none; color: inherit; font-size: 1rem; font-family: inherit; resize: none; border-radius:10px;"></textarea>
    <button type="button" id="sendMessageBtn" aria-label="Отправить сообщение" style="flex:0 0 auto; width:56px; height:56px; background:transparent; color:white; border:none; padding:0; border-radius:10px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path d="M22 2L11 13"></path>
        <path d="M22 2L15 22l-4-9-9-4 19-7z"></path>
      </svg>
    </button>
  </div>
`;
  el.innerHTML = inputTemplate;
  var inputter = new Vue({
    el: el,
    data: () => ({
      message: "",
      defaultMessage: "Start\nTyping...",
      characters: [],

      offsetX: 0,
      offsetY: 0,
      group: new THREE.Group(),
      cursor: null,
    }),
    // Note: we mount to existing DOM (el.innerHTML) instead of passing a template
    // to avoid requiring the runtime template compiler. Button wiring below
    // will be attached in mounted().

    mounted() {
      this.message =
        (location.hash && decodeURI(location.hash.slice(1))) ||
        this.defaultMessage;

      // refs may not be present if Vue couldn't compile a template; guard access
      if (this.$refs && this.$refs.input) {
        try {
          // Focus the textarea but avoid scrolling the page to it on load.
          // Some older browsers don't support the options argument, so
          // fall back gracefully to a plain focus() call if needed.
          if (typeof this.$refs.input.focus === "function") {
            try {
              this.$refs.input.focus({ preventScroll: true });
            } catch (errFocusOptions) {
              // Options not supported -> fallback
              this.$refs.input.focus();
            }
          }

          // Do NOT auto-select the text on mount — selecting can trigger
          // scrolling in some browsers. Let the user interact to select.
        } catch (e) {
          // ignore
        }
      }

      // Wire the send button to a Vue method (we inserted button markup manually)
      const sendBtn = el.querySelector("#sendMessageBtn");
      if (sendBtn) {
        sendBtn.addEventListener("click", (ev) => {
          ev.preventDefault();
          try {
            this.sendMessage();
          } catch (e) {}
        });
      }

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
      // GSAP3 replacement for TweenMax.to
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
      // BoundingBoxHelper is deprecated in newer three.js; use BoxHelper for visualization
      // and Box3 to compute min/max coordinates used elsewhere in the code.
      this.box = new THREE.Box3().setFromObject(this.group);
      this.helper = new THREE.BoxHelper(this.group, 0xff0000);
      this.helper.visible = false;
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
        // Minimal send action: log and clear input. Replace with real submit behavior as needed.
        try {
          if (this.message && this.message !== this.defaultMessage) {
            console.log("sendMessage:", this.message);
            // Could send to server here
          }
        } catch (e) {}
        this.message = "";
        this.$nextTick(() => {
          if (this.$refs && this.$refs.input) this.$refs.input.focus();
        });
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
        if (!this.$refs || !this.$refs.input) return;
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
        // ensure box is up-to-date
        if (!this.box) this.box = new THREE.Box3().setFromObject(this.group);
        else this.box.setFromObject(this.group);

        this.highlight.scale.x =
          Math.abs(this.box.max.x) + Math.abs(this.box.min.x);
        this.highlight.position.x += this.highlight.scale.x / 2;
        this.highlight.scale.y =
          Math.abs(this.box.max.y) + Math.abs(this.box.min.y);
        this.highlight.position.y -= this.highlight.scale.y / 2;
        this.highlight.position.z -= 2;
      },

      update() {
        this.helper.position.copy(this.group.position);
        this.helper.position.z = -1;
        // update the helper visual and recompute the Box3
        if (typeof this.helper.update === "function") this.helper.update();
        if (!this.box) this.box = new THREE.Box3().setFromObject(this.group);
        else this.box.setFromObject(this.group);

        this.updateCursor();

        let centerX = (this.box.max.x + this.box.min.x) / 2;
        let centerY = (this.box.max.y + this.box.min.y) / 1.5;

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
} catch (error) {
  console.error("Three.js initialization failed:", error);
  // Hide the canvas wrapper if Three.js fails
  const canvasWrapper = document.getElementById("contact-canvas-wrapper");
  if (canvasWrapper) {
    canvasWrapper.style.display = "none";
  }
  const textWrapper = document.getElementById("contact-textarea-wrapper");
  if (textWrapper) {
    textWrapper.style.marginTop = "0";
  }
}
