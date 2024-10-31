import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Sun from './Sun'
import Starfield from './Starfield'
import Planet, { planetInfo } from './Planet'

export default function () {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  const container = document.querySelector('#app')
  container.appendChild(renderer.domElement)
  const canvasSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, canvasSize.width / canvasSize.height, 0.1, 100)
  camera.position.set(0, 5, 40)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.minDistance = 10
  controls.maxDistance = 75
  controls.maxPolarAngle = 1.7
  controls.minPolarAngle = 1.2
  controls.keys = {
    LEFT: 'ArrowLeft', //left arrow
    UP: 'ArrowUp', // up arrow
    RIGHT: 'ArrowRight', // right arrow
    BOTTOM: 'ArrowDown', // down arrow
  }

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const onMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    const intersects = raycaster.intersectObjects(scene.children)
    for (let i = 0; i < intersects.length; i++) {
      const selectedPlanet = intersects[i].object
      if (selectedPlanet.name !== '') {
        // selectedPlanet.scale.set(1.1, 1.1, 1.1)
      }
    }
  }

  const addLight = () => {
    const light = new THREE.DirectionalLight(0xffffff)
    light.position.set(51, 150, 150)
    scene.add(light)
  }

  const create = () => {
    const solarSystemGroup = new THREE.Group()
    const sun = new Sun().getSun()
    const starfield = new Starfield().getStarfield()

    solarSystemGroup.add(sun, starfield)

    planetInfo.forEach((item) => {
      const planet = new Planet(item).getPlanet()
      solarSystemGroup.add(planet)
    })

    solarSystemGroup.position.set(0, 0, 0)
    solarSystemGroup.rotation.set(0.3, -1.1, 0.3)

    scene.add(solarSystemGroup)
  }

  const resize = () => {
    canvasSize.width = window.innerWidth
    canvasSize.height = window.innerHeight

    camera.aspect = canvasSize.width / canvasSize.height
    camera.updateProjectionMatrix()

    renderer.setSize(canvasSize.width, canvasSize.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  const addEvent = () => {
    window.addEventListener('resize', resize)
    document.querySelector('.btn-close').addEventListener('click', toggleInfo)
    // window.addEventListener('mousemove', onMouseMove)
  }

  const draw = () => {
    controls.update()
    renderer.render(scene, camera)
    raycaster.setFromCamera(mouse, camera)

    requestAnimationFrame(() => {
      draw()
    })
  }

  const toggleInfo = () => {
    const infoBox = document.querySelector('.info-box')

    if (infoBox.classList.contains('close')) {
      infoBox.classList.remove('close')
    } else {
      infoBox.classList.add('close')
    }
  }

  const initialize = () => {
    create()
    addLight()
    addEvent()
    resize()
    draw()
  }

  initialize()
}
