// ✅ 用 CDN 正确引用 three 和 GLTFLoader（路径需完整）
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/loaders/GLTFLoader.js';


let scene, camera, renderer, balloons = [];
let video, videoTexture;
let analyser, audioData;
let loader = new GLTFLoader();

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true })
    .then(stream => {
      video = document.createElement("video");
      video.setAttribute("playsinline", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("muted", "");
      video.muted = true;
      video.srcObject = stream;

      video.onloadeddata = () => {
        videoTexture = new THREE.VideoTexture(video);
        scene.background = videoTexture;
      };

      video.play();

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const mic = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      mic.connect(analyser);
      audioData = new Uint8Array(analyser.frequencyBinCount);
    });

  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(3, 3, 5);
  scene.add(light);
}

function addBalloon() {
  const maxAttempts = 10;
  let x, z;
  let positionAccepted = false;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    x = (Math.random() - 0.5) * 4;
    z = (Math.random() - 0.5) * 2;

    const tooClose = balloons.some(b => {
      const dx = b.position.x - x;
      const dz = b.position.z - z;
      return dx * dx + dz * dz < 0.3 * 0.3;
    });

    if (!tooClose) {
      positionAccepted = true;
      break;
    }
  }

  if (!positionAccepted) return;

  loader.load('models/balloon.glb', gltf => {
    const balloon = gltf.scene;
    balloon.position.set(x, -2.5, z);
    balloon.scale.set(0.5, 0.5, 0.5);
    balloon.userData.speed = 0.01 + Math.random() * 0.01;
    scene.add(balloon);
    balloons.push(balloon);
  });
}

function animate() {
  requestAnimationFrame(animate);

  if (analyser) {
    analyser.getByteFrequencyData(audioData);
    const volume = audioData.reduce((a, b) => a + b, 0) / audioData.length;
    if (volume > 60) {
      addBalloon();
    }
  }

  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i];
    b.position.y += b.userData.speed;
    b.position.x += Math.sin(performance.now() * 0.001 + b.position.y) * 0.001;

    if (b.position.y > 5) {
      scene.remove(b);
      balloons.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}
