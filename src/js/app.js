import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Sun from './Sun'
import Starfield from './Starfield'
import Planet, { planetInfo, planetContent } from './Planet'
import gsap from 'gsap'

export default function () {
  const loadingManager = new THREE.LoadingManager()
  loadingManager.onProgress = (_, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100
    document.getElementById('loading-bar').style.width = progress + '%'
  }

  loadingManager.onLoad = () => {
    gsap.to('#loading-bar-container', {
      opacity: 0,
      duration: 0.5,
      ease: 'circ.out',
      onComplete: () => {
        document.getElementById('loading-bar-container').style.display = 'none'
        introAnimation()
      },
    })
  }

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
  let intersects
  let currentIntersect = null
  let planetsAndSunMeshes = []

  const addLight = () => {
    const light = new THREE.DirectionalLight(0xffffff)
    light.position.set(51, 150, 150)
    scene.add(light)
  }

  const create = () => {
    const solarSystemGroup = new THREE.Group()
    const sun = new Sun(loadingManager).getSun()
    const starfield = new Starfield().getStarfield()

    solarSystemGroup.name = 'solar-system'
    solarSystemGroup.add(sun)

    const sunMesh = sun.children.find((child) => child.name === 'sun')
    if (sunMesh) planetsAndSunMeshes.push(sunMesh)

    planetInfo.forEach((item) => {
      const planet = new Planet(item, loadingManager).getPlanet()
      solarSystemGroup.add(planet)

      const planetMesh = planet.children[1].children.find((child) => child.name === item.label)
      if (planetMesh) planetsAndSunMeshes.push(planetMesh)
    })

    solarSystemGroup.position.set(0, 0, 0)
    solarSystemGroup.rotation.set(0, -2, 0)

    scene.add(solarSystemGroup, starfield)

    return { solarSystemGroup, planetsAndSunMeshes }
  }

  const resize = () => {
    canvasSize.width = window.innerWidth
    canvasSize.height = window.innerHeight

    camera.aspect = canvasSize.width / canvasSize.height
    camera.updateProjectionMatrix()

    renderer.setSize(canvasSize.width, canvasSize.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  const highlightMesh = (mesh) => {
    if (mesh.material) {
      mesh.material.emissive.set(0xffffff)
      mesh.material.emissiveIntensity = 0.05
    }
  }

  const unhighlightMesh = (mesh) => {
    if (mesh.material) {
      mesh.material.emissive.set(0x000000)
      mesh.material.emissiveIntensity = 1
    }
  }

  const onMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    intersects = raycaster.intersectObjects(planetsAndSunMeshes)

    if (intersects.length > 0) {
      if (!currentIntersect) {
        highlightMesh(intersects[0].object)
      }
      currentIntersect = intersects[0]
    } else {
      if (currentIntersect) {
        unhighlightMesh(currentIntersect.object)
      }

      currentIntersect = null
    }
  }

  const changeContent = (planetName) => {
    const infoBox = document.getElementById('info-box')
    const title = infoBox.querySelector('.title')
    const desc = infoBox.querySelector('.desc')
    const img = infoBox.querySelector('.planet-img')

    img.src = `/assets/img/${planetName}.jpg`
    img.setAttribute('alt', planetName)
    img.onload = () => {
      infoBox.className = 'info-box'
      title.textContent = planetContent[planetName].title
      desc.textContent = planetContent[planetName].desc
      gsap
        .timeline()
        .from(title, { opacity: 0, y: 10, duration: 0.5, ease: 'circ.out', delay: 0.2 })
        .from(desc, { opacity: 0, y: 30, duration: 0.5, ease: 'circ.out' }, '<0.1')
        .from(img, { opacity: 0, duration: 0.5, ease: 'circ.out' }, '<')
    }
  }

  const clickPlanet = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object
      changeContent(clickedObject.name)
    }
  }

  const addEvent = () => {
    window.addEventListener('resize', resize)
    document.querySelector('.btn-close').addEventListener('click', toggleInfo)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('click', clickPlanet)
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

  const introAnimation = () => {
    gsap
      .timeline()
      .to(
        '#wrapper',
        {
          opacity: 1,
          duration: 1,
          ease: 'elastic.out(1,1000)',
        },
        '<'
      )

      .from(
        camera.position,
        {
          y: 20,
          x: 50,
          z: 50,
          duration: 8,
          ease: 'elastic.out(1,10000)',
        },
        '<'
      )
      .from(
        '.main-title h1',
        {
          opacity: 0,
          duration: 2,
          y: 30,
        },
        '<0.4'
      )
      .from(
        '.main-title p',
        {
          opacity: 0,
          duration: 2,
          y: 30,
        },
        '<0.5'
      )
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
