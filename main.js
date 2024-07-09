import * as THREE from "three";
import { OrbitControls } from "./js/OrbitControls.js";
// import { FontLoader } from "https://unpkg.com/three@0.138.3/examples/jsm/loaders/FontLoader.js";
// import { TextGeometry } from "https://unpkg.com/three@0.138.3/examples/jsm/geometries/TextGeometry.js";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TTFLoader } from "https://unpkg.com/three@0.150.1/examples/jsm/loaders/TTFLoader.js";
import { FontLoader } from "https://unpkg.com/three@0.150.1/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://unpkg.com/three@0.150.1/examples/jsm/geometries/TextGeometry.js";
import { GLTFLoader } from "https://unpkg.com/three@0.150.1/examples/jsm/loaders/GLTFLoader.js";
import { TWEEN } from "https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js";

let isStart = true,
  isGameOver = false,
  isFalling = false,
  zoomFactor = 0,
  enemySpawnSpeed = 10,
  mysteryBox,
  ability,
  lives = 0,
  isPaused = false;
// Set initial velocity and acceleration
let velocityY = 0;
const accelerationY = -0.0035; // Gravity
let score = 0;
const canvas = document.getElementById("canvas");
const scene = new THREE.Scene();
scene.background = new THREE.TextureLoader().load("images/space.jpg");
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 7, 10);

const controls = new OrbitControls(camera, canvas);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
// const geometryPlane = new THREE.PlaneGeometry(10, 20);
const geometryPlane = new THREE.BoxGeometry(10, 0.5, 20);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x85cdfd,
  // side: THREE.DoubleSide,
  // shadowSide: true,
});
const plane = new THREE.Mesh(geometryPlane, planeMaterial);
plane.material.side = THREE.DoubleSide;
// plane.rotation.x = 1.565;
plane.position.y = -0.78;
plane.position.z = -9;
plane.receiveShadow = true;
scene.add(plane);

// light //
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(0, 6, -25);
light.castShadow = true;
scene.add(light);
const helper = new THREE.DirectionalLightHelper(light, 5, 0xfffff);
scene.add(helper);
//  ///  //

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
scene.add(cube);

let cubeBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
cubeBB.setFromObject(cube);

// movement handling //
document.addEventListener("keydown", (e) => {
  if (!isGameOver && !isPaused) {
    let pos = {
      x: cube.position.x,
      y: cube.position.y,
      z: cube.position.z,
    };
    let initialPosition = new THREE.Vector3(pos.x, pos.y, pos.z);
    switch (e.code.toLocaleLowerCase()) {
      case "arrowright":
      case "keyd":
        pos.x += 1;
        break;

      case "keya":
      case "arrowleft":
        pos.x -= 1;
        break;

      case "arrowup":
      case "keyw":
        pos.z -= 1;
        break;

      case "keys":
      case "arrowdown":
        pos.z += 1;
        break;

      case "space":
        pos.y += ability == "doubleJump" ? 5 : 2.5;
        break;

      default:
        break;
    }
    let targetPosition = new THREE.Vector3(pos.x, pos.y, pos.z);
    if (cube.position.y <= 0) {
      smoothMovement(initialPosition, targetPosition);
    }
    const boundingBox = new THREE.Box3().setFromObject(plane);
    let depth = boundingBox.max.z - boundingBox.min.z;
    // console.log("postion : ", depth);
  }
});

// Smooth camera zoom function
function smoothMovement(initialPosition, targetPosition) {
  // zoomFactor += 0.08; // Increment zoom factor (adjust speed as needed)
  // // zoomFactor = Math.min(zoomFactor, 1); // Clamp zoom factor to [0, 1]
  // cube.position.lerpVectors(initialPosition, targetPosition, zoomFactor);
  // // cube.position.lerp(targetPosition, 0.1);
  // // cube.lookAt(scene.position);
  // renderer.render(scene, camera);
  // if (zoomFactor < 1) {
  //   requestAnimationFrame(() =>
  //     smoothMovement(initialPosition, targetPosition)
  //   );
  // } else {
  //   zoomFactor = 0;
  // }
  let time;
  if (targetPosition.y > 0 && ability == "doubleJump") {
    time = 750;
  } else if (targetPosition.y > 0) {
    time = 500;
  } else {
    time = 200;
  }
  if (targetPosition.y > 1) {
    // console.log("in y");
    new TWEEN.Tween({ ...targetPosition })
      .to({ y: 0 }, time)
      .onUpdate((coords) => {
        cube.position.x = coords.x;
        cube.position.y = coords.y;
        cube.position.z = coords.z;
      })
      .easing(TWEEN.Easing.Back.Out)
      // .easing(TWEEN.Easing.Linear.None)
      .delay(time)
      .start();
  }
  const tween = new TWEEN.Tween({ ...initialPosition })
    .to({ ...targetPosition }, time)
    .onUpdate((coords) => {
      cube.position.x = coords.x;
      cube.position.y = coords.y;
      cube.position.z = coords.z;
    })
    .easing(
      targetPosition.y > 0
        ? TWEEN.Easing.Exponential.Out
        : TWEEN.Easing.Linear.None
    );
  // TWEEN.Easing.Back.In
  tween.start();
}
let prevScore, loadedFont;
const ttfLoader = new TTFLoader();
const fontLoader = new FontLoader();
ttfLoader.load("fonts/jet_brains_mono_regular.ttf", (json) => {
  // First parse the font.
  loadedFont = fontLoader.parse(json);
  // const jetBrainsFont = fontLoader.parse(json);
});
function scoreLoader(currentScore) {
  if (prevScore) {
    scene.remove(prevScore);
    prevScore = "";
  }
  let text = currentScore.toString();
  const textGeometry = new TextGeometry(text, {
    height: 0.1,
    size: 1.5,
    font: loadedFont,
  });
  const textMaterial = new THREE.MeshNormalMaterial();
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.x = -1;
  textMesh.position.y = 3;
  textMesh.position.z = -10;
  scene.add(textMesh);
  prevScore = textMesh;
}

function animate(t) {
  TWEEN.update(t);
  if (!isPaused) {
    requestAnimationFrame(animate);
  }
  if (
    isGameOver &&
    document.getElementsByClassName("powerUp")[0].classList.length > 1
  ) {
    document
      .getElementsByClassName("powerUp")[0]
      .classList.remove("invisibility", "scoreMultiplier", "doubleJump");
  }
  // console.log("game on");
  // if (cube.position.y > 0 && !isGameOver) {
  //   velocityY += accelerationY;
  //   cube.position.y += velocityY;
  //   if (cube.position.y <= 0) {
  //     cube.position.y = 0; // Prevent the cube from sinking into the ground
  //     velocityY = 0; // Stop falling
  //     // }
  //   }
  // }
  if (isStart && cube) {
    isStart = false;
    let intro = new TWEEN.Tween({ ...cube.position, y: 5 })
      .to({ y: 0 }, 1000)
      .onUpdate((coords) => {
        cube.position.x = coords.x;
        cube.position.y = coords.y;
        cube.position.z = coords.z;
      })
      .easing(TWEEN.Easing.Back.Out);
    intro.start();
    // .easing(TWEEN.Easing.Linear.None)
    // .delay(time)
    // .start();
  }
  cubeBB.copy(cube.geometry.boundingBox).applyMatrix4(cube.matrixWorld);
  if (mysteryBox) {
    let mysteryBoxBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    mysteryBoxBB.setFromObject(mysteryBox);
    if (mysteryBoxBB.intersectsBox(cubeBB)) {
      // console.log("collision", mysteryBox);
      ability = mysteryBox.name;
      scene.remove(mysteryBox);
      revertAbility();
    }
    if (mysteryBox?.position?.z > 1) {
      scene.remove(mysteryBox);
      mysteryBox = "";
      let timeOut = setTimeout(() => {
        spawnMysteryBox();
      }, 1000);
      mysteryBox = "";
      if (isGameOver) {
        clearTimeout(timeOut);
      }
    } else {
      mysteryBox.position.z += 0.05;
    }
  }
  if (isFalling) {
    velocityY += accelerationY;
    cube.position.y += velocityY;
    if (cube.position.y < -15) {
      scene.remove(cube);
    }
  }
  if (
    cube.position.z > 1 ||
    cube.position.z < -19.2 ||
    cube.position.x > 5 ||
    cube.position.x < -5
  ) {
    isFalling = true;
    isGameOver = true;
  }
  if (lives == 0) {
    let heartElement = document.getElementById("heart");
    // heartElement.classList.add("end");
    // setTimeout(() => {
    heartElement.classList.add("hide");
    //   heartElement.classList.remove("end");
    // }, 500);
  }
  if (ability == "invisibility") {
    let prevHexColor = cube.material.color.getHex();
    // console.log("invis", prevHexColor);
    ability = "active";
    cube.material.color.setHex(0xb0f7b0);
    cube.castShadow = false;
    // setTimeout(() => {
    //   setInterval(() => {
    //     cube.material.color.setHex(
    //       prevHexColor == 11597744 ? 0x00ff00 : 0xb0f7b0
    //     );
    //   }, 200);
    // }, 4000);
  }
  renderer.render(scene, camera);
}

animate();

function spawnEnemies() {
  if (!isPaused) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xc40c0c });
    const enemy = new THREE.Mesh(geometry, material);
    enemy.castShadow = false;
    enemy.receiveShadow = false;
    enemy.position.set(getPostionX(-4.5, 5), 0, -19);
    scene.add(enemy);
    let hasCounted = false,
      hasIntersected = false,
      hasJumped = false;
    // if (!hasJumped) {
    //   hasJumped = true;
    //   jump(enemy);
    // }
    let enemyBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    enemyBB.setFromObject(enemy);
    const interval = setInterval(() => {
      if (!isPaused) {
        if (!isGameOver) {
          if (enemy.position.z < 1.5) {
            enemy.position.z += 0.09;
          } else {
            // scene.remove(enemy);
            enemy.position.z += 0.03;
            enemy.position.y += -0.1;
            if (-10 > enemy.position.y) {
              scene.remove(enemy);
              clearInterval(interval);
            }
          }
          if (enemy.position.z - 1 > cube.position.z && !hasCounted) {
            hasCounted = true;
            score += ability == "scoreMultiplier" ? 2 : 1;
            scoreLoader(score);
          }
        }
        enemyBB
          .copy(enemy.geometry.boundingBox)
          .applyMatrix4(enemy.matrixWorld);
        // console.log("lives : ", lives);
        if (cubeBB.intersectsBox(enemyBB) && ability != "active") {
          if (lives) {
            if (!hasIntersected) {
              hasIntersected = true;
              lives--;
              if (lives > 0) {
                document.getElementsByClassName("heart")[lives]?.remove();
              }
            }
          } else {
            if (!hasIntersected) {
              // console.log(cube.position, "in x gameover : ", enemy.position);
              isGameOver = true;
            }
          }
        }
        if (isGameOver) {
          if (mysteryBox) {
            scene.remove(mysteryBox);
          }
          clearInterval(interval);
        }
      }
    }, 10);
  }
}
setTimeout(() => {
  spawnMysteryBox();
}, 2500);

function spawnMysteryBox() {
  let powerUp = [
    "invisibility",
    "invisibility",
    "doubleJump",
    "scoreMultiplier",
    "invisibility",
    "invisibility",
    "revival",
    "doubleJump",
    "invisibility",
    "revival",
    "doubleJump",
    "scoreMultiplier",
    "invisibility",
    "invisibility",
    "doubleJump",
    "scoreMultiplier",
    "invisibility",
    "invisibility",
    "revival",
  ];
  let index = Math.floor(Math.random() * 18);
  // console.log(index, "\n power up : ", powerUp[index]);
  const loader = new THREE.TextureLoader();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0xc40c0c,
    map: loader.load("./images/mystery_box_texture.png"),
  });
  mysteryBox = new THREE.Mesh(geometry, material);
  mysteryBox.position.x = getPostionX(-4.5, 4.5);
  mysteryBox.position.y = 1.5;
  mysteryBox.position.z = -19;
  mysteryBox.name = powerUp[index];
  scene.add(mysteryBox);
}

function jump(currentMesh) {
  let isStart = true;
  let jumpInterval = setInterval(() => {
    isStart = false;
    let jump = new TWEEN.Tween({ y: 0 })
      .to({ y: 1.5 }, 250)
      .onUpdate((coords) => {
        currentMesh.position.y = coords.y;
        currentMesh.position.z += 0.01;
      })
      .easing(TWEEN.Easing.Back.In);
    new TWEEN.Tween({ y: 1.5 })
      .to({ y: 0 }, 250)
      .onUpdate((coords) => {
        currentMesh.position.y = coords.y;
        currentMesh.position.z += 0.01;
      })
      .easing(TWEEN.Easing.Exponential.InOut)
      .delay(300)
      .start();
    if (isGameOver) {
      clearInterval(jumpInterval);
    }
    jump.start();
    // down.chain(jumpUp);
  }, 800);
}

const spawnEnemyInterval = setInterval(() => {
  if (!isGameOver) {
    if (!isStart) {
      spawnEnemies();
    }
  } else {
    clearInterval(spawnEnemyInterval);
  }
  console.log("spawn speed : ", enemySpawnSpeed * 50);
}, enemySpawnSpeed * 50);

const spawnEnemySpeedIntvl = setInterval(() => {
  clearInterval(spawnEnemySpeedIntvl);
  enemySpawnSpeed--;
  console.log("minute : ", enemySpawnSpeed);
}, 5000);

function getPostionX(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.random() * (max - min) + min; // The maximum is exclusive and the minimum is inclusive
  // return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

let hasExecuted = false;
var timer;
function revertAbility() {
  if (!hasExecuted) {
    hasExecuted = true;
    console.log("in revertabilty ", lives);
    document.getElementsByClassName("powerUp")[0].classList.add(ability);
    let prevAbility = ability;

    timer = new CustomTimer(function () {
      document
        .getElementsByClassName("powerUp")[0]
        .classList.remove(prevAbility);
      prevAbility = "";
      hasExecuted = false;
      ability = "";
      cube.castShadow = true;
      cube.material.color.setHex(0x00ff00);
    }, 5000);
    // setTimeout(() => {
    //   }, 5000);

    if (ability == "revival") {
      let heartElement = document.getElementById("heart");
      heartElement.classList.remove("hide");
      ability = "";
      lives += 1;
      if (lives > 1) {
        let clone = heartElement.cloneNode();
        document.getElementsByClassName("lives-container")[0].append(clone);
      }
    }
  }
}

function CustomTimer(callback, delay) {
  var timerId,
    start,
    remaining = delay;

  this.pause = function () {
    console.log("in pause");
    window.clearTimeout(timerId);
    remaining -= new Date() - start;
  };

  this.resume = function () {
    console.log("in resume");
    start = new Date();
    window.clearTimeout(timerId);
    timerId = window.setTimeout(callback, remaining);
  };

  this.resume();
}

document
  .getElementsByClassName("playNpause")[0]
  .addEventListener("click", (e) => {
    e.target.classList.toggle("start");
    isPaused = !isPaused;
    document.getElementsByClassName("powerUp")[0].classList.toggle("paused");
    if (timer) {
      if (e.target.classList.contains("start")) {
        timer.pause();
      } else {
        timer.resume();
      }
    }
    requestAnimationFrame(animate);
  });
// document.addEventListener("visibilitychange", (e) => {
//   let isVisible = document.visibilityState == "visible";
//   console.log("vis changed : ", document.visibilityState);
//   if (!isVisible) {
//     cancelAnimationFrame(animate);
//   } else {
//     setTimeout(() => {
//       requestAnimationFrame(animate);
//     }, 10000);
//   }
// });
// use signal //
//  ///  //

// Instantiate a loader
const loader = new GLTFLoader();

// Load a glTF resource
// loader.load(
//   // resource URL
//   "models/scene.gltf",
//   // called when the resource is loaded
//   function (gltf) {
//     gltf.scene.scale.set(0.2, 0.2, 0.2);
//     gltf.scene.position.x = -20;
//     gltf.scene.position.y = -0.5;
//     gltf.scene.position.z = -5;
//     gltf.scene.castShadow = true;
//     gltf.scene.receiveShadow = true;
//     gltf.scene.rotation.y = -300;
//     scene.add(gltf.scene);
//     const model = gltf.scene;

//     // Now, you can access the materials of the model
//     model.traverse((node) => {
//       if (node.isMesh) {
//         if (node.material instanceof THREE.MeshStandardMaterial) {
//           const newMaterial = new THREE.MeshBasicMaterial({
//             map: node.material.map,
//             color: node.material.color,
//           });
//           node.material = newMaterial;
//         }
//       }
//     });
//   },
//   // called while loading is progressing
//   function (xhr) {
//     console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
//   },
//   // called when loading has errors
//   function (error) {
//     console.log("An error happened");
//   }
// );
