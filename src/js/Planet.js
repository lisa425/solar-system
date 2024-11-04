import {
  Mesh,
  Color,
  Group,
  DoubleSide,
  RingGeometry,
  TorusGeometry,
  TextureLoader,
  ShaderMaterial,
  SRGBColorSpace,
  AdditiveBlending,
  MeshPhongMaterial,
  MeshBasicMaterial,
  IcosahedronGeometry,
} from 'three'

export default class Planet {
  group
  loader
  animate
  planetGroup
  planetGeometry

  constructor(
    {
      label = 'mercury',
      orbitSpeed = 1,
      orbitColor = 0xaae0f2,
      orbitRadius = 1,
      orbitRotationDirection = 'clockwise',

      planetSize = 1,
      planetAngle = 0,
      planetRotationSpeed = 1,
      planetRotationDirection = 'clockwise',
      planetTexture = '/assets/map/mercurymap.jpg',

      rimHex = 0x0088ff,
      facingHex = 0x000000,

      rings = null,
    } = {},
    loadingManager
  ) {
    this.label = label
    this.orbitSpeed = orbitSpeed
    this.orbitColor = orbitColor
    this.orbitRadius = orbitRadius
    this.orbitRotationDirection = orbitRotationDirection

    this.planetSize = planetSize
    this.planetAngle = planetAngle
    this.planetTexture = planetTexture
    this.planetRotationSpeed = planetRotationSpeed
    this.planetRotationDirection = planetRotationDirection

    this.rings = rings

    this.group = new Group()
    this.planetGroup = new Group()
    this.loader = new TextureLoader(loadingManager)
    this.planetGeometry = new IcosahedronGeometry(this.planetSize, 12)

    this.createOrbit()
    this.createRings()
    this.createPlanet()
    this.createGlow(rimHex, facingHex)

    this.animate = this.createAnimateFunction()
    this.animate()
  }

  createOrbit() {
    const orbitGeometry = new TorusGeometry(this.orbitRadius, 0.003, 100)
    const orbitMaterial = new MeshBasicMaterial({
      color: this.orbitColor,
      side: DoubleSide,
      opacity: 0.7,
      transparent: true,
    })
    const orbitMesh = new Mesh(orbitGeometry, orbitMaterial)
    orbitMesh.rotation.x = Math.PI / 2
    this.group.add(orbitMesh)
  }

  createPlanet() {
    const map = this.loader.load(this.planetTexture)
    const planetMaterial = new MeshPhongMaterial({ map })
    planetMaterial.map.colorSpace = SRGBColorSpace

    const planetMesh = new Mesh(this.planetGeometry, planetMaterial)
    planetMesh.name = this.label

    this.planetGroup.add(planetMesh)
    this.planetGroup.position.x = this.orbitRadius - this.planetSize / 9
    this.planetGroup.rotation.z = this.planetAngle
    this.group.add(this.planetGroup)
    this.group.name = this.label
  }

  createGlow(rimHex, facingHex) {
    const uniforms = {
      color1: { value: new Color(rimHex) },
      color2: { value: new Color(facingHex) },
      fresnelBias: { value: 0.1 },
      fresnelScale: { value: 1.3 },
      fresnelPower: { value: 3.0 },
    }

    const vertexShader = `
    uniform float fresnelBias;
    uniform float fresnelScale;
    uniform float fresnelPower;

    varying float vReflectionFactor;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );

      vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );

      vec3 I = worldPosition.xyz - cameraPosition;

      vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );

      gl_Position = projectionMatrix * mvPosition;
    }
    `

    const fragmentShader = `
      uniform vec3 color1;
      uniform vec3 color2;

      varying float vReflectionFactor;

      void main() {
        float f = clamp( vReflectionFactor, 0.0, 1.0 );
        gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
      }
    `

    const planetGlowMaterial = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: AdditiveBlending,
    })
    const planetGlowMesh = new Mesh(this.planetGeometry, planetGlowMaterial)
    planetGlowMesh.scale.setScalar(1.03)
    this.planetGroup.add(planetGlowMesh)
  }

  createRings() {
    if (!this.rings) return

    const innerRadius = this.planetSize + 0.1
    const outerRadius = innerRadius + this.rings.ringsSize

    const ringsGeometry = new RingGeometry(innerRadius, outerRadius, 32)

    const ringsMaterial = new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      map: this.loader.load(this.rings.ringsTexture),
    })

    const ringMeshs = new Mesh(ringsGeometry, ringsMaterial)
    ringMeshs.rotation.x = Math.PI / 2
    this.planetGroup.add(ringMeshs)
  }

  createAnimateFunction() {
    return () => {
      requestAnimationFrame(this.animate)

      this.updateOrbitRotation()
      this.updatePlanetRotation()
    }
  }

  updateOrbitRotation() {
    if (this.orbitRotationDirection === 'clockwise') {
      this.group.rotation.y -= this.orbitSpeed
    } else if (this.orbitRotationDirection === 'counterclockwise') {
      this.group.rotation.y += this.orbitSpeed
    }
  }

  updatePlanetRotation() {
    if (this.planetRotationDirection === 'clockwise') {
      this.planetGroup.rotation.y -= this.planetRotationSpeed
    } else if (this.planetRotationDirection === 'counterclockwise') {
      this.planetGroup.rotation.y += this.planetRotationSpeed
    }
  }

  getPlanet() {
    return this.group
  }
}

export const planetInfo = [
  {
    label: 'mercury',
    orbitSpeed: 0.00048,
    orbitColor: '0xa875bd',
    orbitRadius: 10,
    orbitRotationDirection: 'clockwise',
    planetSize: 0.2,
    planetRotationSpeed: 0.005,
    planetRotationDirection: 'counterclockwise',
    planetTexture: '/assets/map/mercurymap.jpg',
    rimHex: 0xf9cf9f,
  },
  {
    label: 'venus',
    orbitSpeed: 0.00035,
    orbitColor: '0xdb981a',
    orbitRadius: 13,
    orbitRotationDirection: 'clockwise',
    planetSize: 0.5,
    planetRotationSpeed: 0.0005,
    planetRotationDirection: 'clockwise',
    planetTexture: '/assets/map/venusmap.jpg',
    rimHex: 0xb66f1f,
  },
  {
    label: 'earth',
    orbitSpeed: 0.00029,
    orbitColor: '0x2bb3ed',
    orbitRadius: 16,
    orbitRotationDirection: 'clockwise',
    planetSize: 0.5,
    planetAngle: (-23.4 * Math.PI) / 180,
    planetRotationSpeed: 0.01,
    planetRotationDirection: 'counterclockwise',
    planetTexture: '/assets/map/earthmap.jpg',
  },
  {
    label: 'mars',
    orbitSpeed: 0.00024,
    orbitColor: '0xeb690c',
    orbitRadius: 19,
    orbitRotationDirection: 'clockwise',
    planetSize: 0.3,
    planetRotationSpeed: 0.01,
    planetRotationDirection: 'counterclockwise',
    planetTexture: '/assets/map/marsmap.jpg',
    rimHex: 0xbc6434,
  },
  {
    label: 'jupiter',
    orbitSpeed: 0.00013,
    orbitColor: '0xffb580',
    orbitRadius: 22,
    orbitRotationDirection: 'clockwise',
    planetSize: 1,
    planetRotationSpeed: 0.06,
    planetRotationDirection: 'counterclockwise',
    planetTexture: '/assets/map/jupitermap.jpg',
    rimHex: 0xf3d6b6,
  },
  {
    label: 'saturn',
    orbitSpeed: 0.0001,
    orbitColor: '0xc9c230',
    orbitRadius: 25,
    orbitRotationDirection: 'clockwise',
    planetSize: 0.8,
    planetRotationSpeed: 0.05,
    planetRotationDirection: 'counterclockwise',
    planetTexture: '/assets/map/saturnmap.jpg',
    rimHex: 0xd6b892,
    rings: {
      ringsSize: 0.5,
      ringsTexture: '/assets/map/saturnringmap.png',
    },
  },
  {
    label: 'uranus',
    orbitSpeed: 0.00007,
    orbitColor: '0x30fcda',
    orbitRadius: 28,
    orbitRotationDirection: 'clockwise',
    planetSize: 0.5,
    planetRotationSpeed: 0.02,
    planetRotationDirection: 'clockwise',
    planetTexture: '/assets/map/uranusmap.jpg',
    rimHex: 0x9ab6c2,
    rings: {
      ringsSize: 0.4,
      ringsTexture: '/assets/map/uranusringmap.png',
    },
  },
  {
    label: 'neptune',
    orbitSpeed: 0.000054,
    orbitColor: '0x6b89ff',
    orbitRadius: 31,
    orbitRotationDirection: 'clockwise',
    planetSize: 0.5,
    planetRotationSpeed: 0.02,
    planetRotationDirection: 'counterclockwise',
    planetTexture: '/assets/map/neptunemap.jpg',
    rimHex: 0x5c7ed7,
  },
]

export const planetContent = {
  sun: {
    title: 'The Sun',
    desc: "The Sun is the heart of our solar system, a massive star made of hot plasma that provides the light and warmth necessary for life on Earth. It contains about 99.8% of the solar system's total mass, holding planets, moons, asteroids, and comets in its gravitational grip.",
  },
  mercury: {
    title: 'Mercury',
    desc: "Mercury is the smallest and closest planet to the Sun. Its proximity results in extreme temperature changes, from scorching days to freezing nights. With no significant atmosphere, Mercury's surface is heavily cratered, resembling our Moon.",
  },
  venus: {
    title: 'Venus',
    desc: "Venus is often called Earth's 'sister planet' due to its similar size and composition. However, its thick, toxic atmosphere traps heat, making Venus the hottest planet. Its surface is hidden under thick clouds, and its rotation is unique as it spins backward.",
  },
  earth: {
    title: 'Earth',
    desc: 'Earth is the only known planet to support life, thanks to its ideal climate, liquid water, and protective atmosphere. With diverse ecosystems, land, and oceans, Earth’s unique conditions allow countless species to thrive.',
  },
  mars: {
    title: 'Mars',
    desc: "Mars, known as the 'Red Planet' for its rusty surface, has been a focus of exploration due to its potential to support life. It has the largest volcano and canyon in the solar system and shows evidence of past water flows, sparking interest in its habitability.",
  },
  jupiter: {
    title: 'Jupiter',
    desc: 'Jupiter is the largest planet, a gas giant with swirling storms, including the famous Great Red Spot. It has more than 75 moons, and its massive magnetic field is the strongest in the solar system. Jupiter’s size and composition are more similar to a small star than a planet.',
  },
  saturn: {
    title: 'Saturn',
    desc: "Saturn is known for its stunning rings, made of ice and rock. As a gas giant, it’s the second-largest planet and has over 80 moons. Saturn's rings and majestic appearance make it a striking feature in the solar system.",
  },
  uranus: {
    title: 'Uranus',
    desc: 'Uranus is unique for its tilted axis, essentially rolling around the Sun. This icy giant has a blue-green color due to methane in its atmosphere and is mostly made of water, ammonia, and methane ices. It has a faint ring system and numerous moons.',
  },
  neptune: {
    title: 'Neptune',
    desc: 'Neptune, the farthest planet from the Sun, is a cold, dark world with supersonic winds. This ice giant is similar to Uranus in composition, featuring a striking deep blue color and a set of faint rings. Neptune’s largest moon, Triton, is one of the coldest objects in the solar system.',
  },
}
