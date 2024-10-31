import { Mesh, AdditiveBlending, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import Planet from './Planet'

export default class Earth extends Planet {
  constructor(props) {
    super(props)

    // this.createPlanetLights()
    // this.createPlanetClouds()
  }

  createPlanetLights() {
    const planetLightsMaterial = new MeshBasicMaterial({
      map: this.loader.load('/assets/earthmap.jpg'),
      blending: AdditiveBlending,
    })
    const planetLightsMesh = new Mesh(this.planetGeometry, planetLightsMaterial)
    this.planetGroup.add(planetLightsMesh)

    this.group.add(this.planetGroup)
  }

  createPlanetClouds() {
    const planetCloudsMaterial = new MeshStandardMaterial({
      map: this.loader.load('/assets/earthmap.jpg'),
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending,
      alphaMap: this.loader.load('/assets/earthmap.jpg'),
    })
    const planetCloudsMesh = new Mesh(this.planetGeometry, planetCloudsMaterial)
    planetCloudsMesh.scale.setScalar(1.003)
    this.planetGroup.add(planetCloudsMesh)

    this.group.add(this.planetGroup)
  }
}
