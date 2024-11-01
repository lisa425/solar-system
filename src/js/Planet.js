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

  constructor({
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
  } = {}) {
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
    this.loader = new TextureLoader()
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
    title: 'sun',
    desc: 'The sun is a star that exists at the center of the solar system, and is the only star and source of energy in the solar system. Because of the sun, there can be a distinction between day and night, four seasons and climate, and life on Earth. The sun is a G-type main sequence star that is rare even in our galaxy, and thanks to this, it is a star bright enough to be seen with the naked eye even in Alpha Centaurus, which is four light years away.',
  },
  mercury: {
    title: 'mercury',
    desc: "Mercury is the closest orbiting planet in the solar system, an average of 58 million km from the sun. It is also the smallest inner planet with a radius of 2,440 km and a circumference of 43,924 km. Its orbital period is 88 days, its rotation period is 58 days, and its density is 5.427 g/cm3. It is estimated that the core accounts for more than 70% of Mercury's total radius and is mainly composed of iron. A mantle composed of silicates occupies the outside.\nThe surface has many collisions, similar to the moon, and there are huge cliffs that form when the planet contracts as it cools. There is an atmosphere composed of sodium and potassium, but the atmospheric pressure is one-trillionth of the Earth's, which is very thin. It was also found that there is a weak magnetic field. Because it is the closest planet to the sun, its orbit moves little by little every year under the influence of strong gravity.",
  },
  venus: {},
  earth: {},
  mars: {},
  jupiter: {},
  saturn: {},
  uranus: {},
  neptune: {},
}
