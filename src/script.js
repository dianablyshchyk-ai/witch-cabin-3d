import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import GUI from 'lil-gui'

const gui = new GUI()
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Текстури
const loadingManager = new THREE.LoadingManager()
loadingManager.onError = (url) => console.error('НЕ ЗНАЙДЕНО ТЕКСТУРУ:', url)
const textureLoader = new THREE.TextureLoader(loadingManager)
const exrLoader = new EXRLoader(loadingManager)

const repeatTextures = (textures, x, y) => {
    for (const texture of textures) {
        texture.repeat.set(x, y)
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
    }
}

const plainLoader = new THREE.TextureLoader()
const loadAny = (label, paths, colorSpace) => {
    const texture = new THREE.Texture()
    if (colorSpace) texture.colorSpace = colorSpace
    const attempt = (i) => {
        if (i >= paths.length) {
            console.error('НЕ ЗНАЙДЕНО ТЕКСТУРУ:', label, '— пробувала:', paths.slice(0, 6), '...')
            return
        }
        plainLoader.load(
            paths[i],
            (loaded) => {
                texture.image = loaded.image
                texture.needsUpdate = true
                console.log('Все добре', label, '←', paths[i])
            },
            undefined,
            () => attempt(i + 1)
        )
    }
    attempt(0)
    return texture
}

const loadPBR = (prefix, size) => {
    const lists = size
        ? {
            color: ['color', 'diff', 'diffuse', 'albedo', 'basecolor'],
            normal: ['normal_opengl', 'nor_gl', 'normal', 'normal_gl'],
            roughness: ['roughness', 'rough'],
            metal: ['metallic', 'metalness', 'metal']
        }
        : {
            color: ['Color', 'color', 'Diffuse'],
            normal: ['NormalGL', 'Normal', 'normal_opengl'],
            roughness: ['Roughness', 'roughness'],
            metal: ['Metalness', 'metallic']
        }
    const build = (names) => {
        const out = []
        for (const n of names) {
            for (const ext of ['jpg', 'png']) {
                if (size) out.push(`${prefix}${n}_${size}.${ext}`)
                out.push(`${prefix}${n}.${ext}`)
            }
        }
        return out
    }
    return {
        color: loadAny(prefix + 'color', build(lists.color), THREE.SRGBColorSpace),
        normal: loadAny(prefix + 'normal', build(lists.normal)),
        roughness: loadAny(prefix + 'roughness', build(lists.roughness)),
        metal: loadAny(prefix + 'metal', build(lists.metal))
    }
}

// Двері
const doorAlphaTexture = textureLoader.load('/door/alpha.jpg')
const doorAOTexture = textureLoader.load('/door/ambientOcclusion.jpg')
const doorHeightTexture = textureLoader.load('/door/height.jpg')
const doorMetalnessTexture = textureLoader.load('/door/metalness.jpg')

// Стіни
const wallTexturePath = '/wall/weathered_planks_4k.blend/textures/'
const wallColorTexture = textureLoader.load(wallTexturePath + 'weathered_planks_diff_4k.jpg')
const wallNormalTexture = exrLoader.load(wallTexturePath + 'weathered_planks_nor_gl_4k.exr')
const wallRoughnessTexture = exrLoader.load(wallTexturePath + 'weathered_planks_rough_4k.exr')
wallColorTexture.colorSpace = THREE.SRGBColorSpace
repeatTextures([wallColorTexture, wallNormalTexture, wallRoughnessTexture], 2, 2)

const { color: roofColorTexture, normal: roofNormalTexture, roughness: roofRoughnessTexture } =
    loadPBR('/roof/rooftop_0004_1k_h3DaDw/rooftop_0004_', '1k')
repeatTextures([roofColorTexture, roofNormalTexture, roofRoughnessTexture], 3, 2)

const { color: trimColorTexture, normal: trimNormalTexture, roughness: trimRoughnessTexture } =
    loadPBR('/door/wood_0048_2k_4kbBB2/wood_0048_', '2k')
repeatTextures([trimColorTexture, trimNormalTexture, trimRoughnessTexture], 1, 1)

// Димар
const chimneyPath = '/roof/roof_slates_02_1k/roof_slates_02_'
const chimneyColorTexture = textureLoader.load(chimneyPath + 'diff_1k.jpg')
const chimneyNormalTexture = textureLoader.load(chimneyPath + 'nor_gl_1k.jpg')
const chimneyARMTexture = textureLoader.load(chimneyPath + 'arm_1k.jpg')
chimneyColorTexture.colorSpace = THREE.SRGBColorSpace
repeatTextures([chimneyColorTexture, chimneyNormalTexture, chimneyARMTexture], 1, 2)

// Ніжки курки
const logLoaded = (name) => (texture) =>
    console.log('Текстуру завантажено:', name, texture.image.width + 'x' + texture.image.height)

const legPath = '/chicken-feet/Wood048_2K-JPG/Wood048_2K-JPG_'
const legColorTexture = textureLoader.load(legPath + 'Color.jpg', logLoaded('Color'))
const legNormalTexture = textureLoader.load(legPath + 'NormalGL.jpg', logLoaded('NormalGL'))
const legRoughnessTexture = textureLoader.load(legPath + 'Roughness.jpg', logLoaded('Roughness'))
legColorTexture.colorSpace = THREE.SRGBColorSpace
repeatTextures([legColorTexture, legNormalTexture, legRoughnessTexture], 1, 2.5)

const clawPath = '/claws/Marble012_2K-JPG/Marble012_2K-JPG_'
const clawColorTexture = textureLoader.load(clawPath + 'Color.jpg', logLoaded('Claw Color'))
const clawNormalTexture = textureLoader.load(clawPath + 'NormalGL.jpg', logLoaded('Claw NormalGL'))
const clawRoughnessTexture = textureLoader.load(clawPath + 'Roughness.jpg', logLoaded('Claw Roughness'))
clawColorTexture.colorSpace = THREE.SRGBColorSpace
repeatTextures([clawColorTexture, clawNormalTexture, clawRoughnessTexture], 1, 1)

// Каміння
const { color: rock060ColorTexture, normal: rock060NormalTexture, roughness: rock060RoughnessTexture } =
    loadPBR('/stone/Rock060_2K-JPG/Rock060_2K-JPG_', null)
repeatTextures([rock060ColorTexture, rock060NormalTexture, rock060RoughnessTexture], 1, 1)

const { color: rock051ColorTexture, normal: rock051NormalTexture, roughness: rock051RoughnessTexture } =
    loadPBR('/stone/Rock051_2K-JPG/Rock051_2K-JPG_', null)
repeatTextures([rock051ColorTexture, rock051NormalTexture, rock051RoughnessTexture], 1, 1)

const loadTexture = (path) =>
    textureLoader.load(path, (t) => console.log('✅ Завантажено:', path, t.image.width + 'x' + t.image.height))

// Земля з мохом
const { color: groundColorTexture, normal: groundNormalTexture, roughness: groundRoughnessTexture } =
    loadPBR('/mud/Moss001_2K-JPG/Moss001_2K-JPG_', null)
repeatTextures([groundColorTexture, groundNormalTexture, groundRoughnessTexture], 8, 8)

// Кора
const { color: barkColorTexture, normal: barkNormalTexture, roughness: barkRoughnessTexture } =
    loadPBR('/tree/wood_0063_1k_wJSQiY/wood_0063_', '1k')
repeatTextures([barkColorTexture, barkNormalTexture, barkRoughnessTexture], 1, 2)

const { color: needlesColorTexture, normal: needlesNormalTexture, roughness: needlesRoughnessTexture } =
    loadPBR('/tree/Moss004_2K-JPG/Moss004_2K-JPG_', null)
repeatTextures([needlesColorTexture, needlesNormalTexture, needlesRoughnessTexture], 3, 2)

// Казан
const {
    color: cauldronColorTexture,
    normal: cauldronNormalTexture,
    roughness: cauldronRoughnessTexture,
    metal: cauldronMetalnessTexture
} = loadPBR('/cauldron/metal_0056_1k_FTr9Ul/metal_0056_', '1k')
repeatTextures([cauldronColorTexture, cauldronNormalTexture, cauldronRoughnessTexture, cauldronMetalnessTexture], 2, 2)

const { color: potionColorTexture, normal: potionNormalTexture, roughness: potionRoughnessTexture } =
    loadPBR('/cauldron/metal_0055_1k_zDowSI/metal_0055_', '1k')
repeatTextures([potionColorTexture, potionNormalTexture, potionRoughnessTexture], 2, 2)

// Черепи
const { color: skullColorTexture, normal: skullNormalTexture, roughness: skullRoughnessTexture } =
    loadPBR('/skull/plastic_0008_1k_4S3Yme/plastic_0008_', '1k')
repeatTextures([skullColorTexture, skullNormalTexture, skullRoughnessTexture], 1, 1)

// Бруд
const mudPath = '/mud/Ground051_1K-JPG/Ground051_1K-JPG_'
const mudColorTexture = loadTexture(mudPath + 'Color.jpg')
const mudNormalTexture = loadTexture(mudPath + 'NormalGL.jpg')
const mudRoughnessTexture = loadTexture(mudPath + 'Roughness.jpg')
mudColorTexture.colorSpace = THREE.SRGBColorSpace
repeatTextures([mudColorTexture, mudNormalTexture, mudRoughnessTexture], 3, 3)

const waterPath = '/water-lily/ground_0033_2k_S2sDPs/ground_0033_'
const waterColorTexture = loadTexture(waterPath + 'color_2k.jpg')
const waterNormalTexture = loadTexture(waterPath + 'normal_opengl_2k.png')
const waterRoughnessTexture = loadTexture(waterPath + 'roughness_2k.jpg')
waterColorTexture.colorSpace = THREE.SRGBColorSpace
repeatTextures([waterColorTexture, waterNormalTexture, waterRoughnessTexture], 1.5, 1.5)

// Очерет
const stemPath = '/cane/Wood065_1K-JPG/Wood065_1K-JPG_'
const stemColorTexture = loadTexture(stemPath + 'Color.jpg')
const stemNormalTexture = loadTexture(stemPath + 'NormalGL.jpg')
const stemRoughnessTexture = loadTexture(stemPath + 'Roughness.jpg')
stemColorTexture.colorSpace = THREE.SRGBColorSpace
repeatTextures([stemColorTexture, stemNormalTexture, stemRoughnessTexture], 1, 4)

const tipPath = '/cane/Wood028_1K-JPG/Wood028_1K-JPG_'
const tipColorTexture = loadTexture(tipPath + 'Color.jpg')
const tipNormalTexture = loadTexture(tipPath + 'NormalGL.jpg')
const tipRoughnessTexture = loadTexture(tipPath + 'Roughness.jpg')
tipColorTexture.colorSpace = THREE.SRGBColorSpace
repeatTextures([tipColorTexture, tipNormalTexture, tipRoughnessTexture], 2, 1)

// Матеріали
const groundMat = new THREE.MeshStandardMaterial({
    map: groundColorTexture,
    color: '#7a7a7a',
    normalMap: groundNormalTexture,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: groundRoughnessTexture
})

const woodMat = new THREE.MeshStandardMaterial({
    map: wallColorTexture,
    color: '#ffffff',
    roughnessMap: wallRoughnessTexture,
    normalMap: wallNormalTexture,
    normalScale: new THREE.Vector2(0.8, 0.8)
})

const roofMat = new THREE.MeshStandardMaterial({
    map: roofColorTexture,
    color: '#ffffff',
    roughnessMap: roofRoughnessTexture,
    normalMap: roofNormalTexture,
    normalScale: new THREE.Vector2(1.8, 1.8)
})

const chimneyMat = new THREE.MeshStandardMaterial({
    map: chimneyColorTexture,
    color: '#ffffff',
    roughnessMap: chimneyARMTexture,
    normalMap: chimneyNormalTexture,
    normalScale: new THREE.Vector2(1.8, 1.8)
})

const doorMat = new THREE.MeshStandardMaterial({
    map: trimColorTexture,
    transparent: true,
    alphaMap: doorAlphaTexture,
    aoMap: doorAOTexture,
    displacementMap: doorHeightTexture,
    displacementScale: 0.1,
    displacementBias: -0.04,
    normalMap: trimNormalTexture,
    metalnessMap: doorMetalnessTexture,
    roughnessMap: trimRoughnessTexture,
    normalScale: new THREE.Vector2(2.5, 2.5)
})

const trimWoodMat = new THREE.MeshStandardMaterial({
    map: trimColorTexture,
    color: '#ffffff',
    normalMap: trimNormalTexture,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: trimRoughnessTexture,
    roughness: 1
})

const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#3b2614', roughness: 0.9 })
const legMat = new THREE.MeshStandardMaterial({ color: '#d99a3d', roughness: 0.6 })

const chickenLegMat = new THREE.MeshStandardMaterial({
    map: legColorTexture,
    color: '#b5a178',
    normalMap: legNormalTexture,
    normalScale: new THREE.Vector2(3, 3),
    roughnessMap: legRoughnessTexture
})

const clawMat = new THREE.MeshStandardMaterial({
    map: clawColorTexture,
    color: '#ffffff',
    normalMap: clawNormalTexture,
    normalScale: new THREE.Vector2(2, 2),
    roughnessMap: clawRoughnessTexture,
    roughness: 0.7
})

const stoneMat1 = new THREE.MeshStandardMaterial({
    map: rock060ColorTexture,
    color: '#ffffff',
    normalMap: rock060NormalTexture,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: rock060RoughnessTexture,
    roughness: 1
})
const stoneMat2 = new THREE.MeshStandardMaterial({
    map: rock051ColorTexture,
    color: '#ffffff',
    normalMap: rock051NormalTexture,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: rock051RoughnessTexture,
    roughness: 1
})

const barkMat = new THREE.MeshStandardMaterial({
    map: barkColorTexture,
    color: '#ffffff',
    normalMap: barkNormalTexture,
    roughnessMap: barkRoughnessTexture,
    roughness: 1
})

const leafMat = new THREE.MeshStandardMaterial({
    map: needlesColorTexture,
    color: '#ffffff',
    normalMap: needlesNormalTexture,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: needlesRoughnessTexture,
    roughness: 1,
    flatShading: true
})

const grassMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.9,
    side: THREE.DoubleSide
})

const eyeMat = new THREE.MeshBasicMaterial({ color: '#120d0a' })

const cauldronMat = new THREE.MeshStandardMaterial({
    map: cauldronColorTexture,
    color: '#ffffff',
    normalMap: cauldronNormalTexture,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: cauldronRoughnessTexture,
    metalnessMap: cauldronMetalnessTexture,
    metalness: 0.35,
    roughness: 1,
    side: THREE.DoubleSide
})

const potionMat = new THREE.MeshStandardMaterial({
    map: potionColorTexture,
    color: '#9dffbf',
    normalMap: potionNormalTexture,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: potionRoughnessTexture,
    emissive: '#2bd96b',
    emissiveMap: potionColorTexture,
    emissiveIntensity: 0.9
})

const boneMat = new THREE.MeshStandardMaterial({ color: '#e8e4d0', roughness: 0.7 })

const skullMat = new THREE.MeshStandardMaterial({
    map: skullColorTexture,
    color: '#ffffff',
    normalMap: skullNormalTexture,
    normalScale: new THREE.Vector2(2, 2),
    roughnessMap: skullRoughnessTexture,
    roughness: 1
})

const frameMat = new THREE.MeshStandardMaterial({ color: '#2b1a0e', roughness: 0.9 })

const mudMat = new THREE.MeshStandardMaterial({
    map: mudColorTexture,
    color: '#6b5645',
    normalMap: mudNormalTexture,
    normalScale: new THREE.Vector2(2.5, 2.5),
    roughnessMap: mudRoughnessTexture,
    roughness: 0.8
})

const wetMudMat = new THREE.MeshStandardMaterial({
    map: mudColorTexture,
    color: '#2e241b',
    normalMap: mudNormalTexture,
    normalScale: new THREE.Vector2(2, 2),
    roughnessMap: mudRoughnessTexture,
    roughness: 0.5
})

const waterMat = new THREE.MeshStandardMaterial({
    map: waterColorTexture,
    normalMap: waterNormalTexture,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: waterRoughnessTexture,
    color: '#ffffff',
    emissive: '#0a3a2a',
    emissiveIntensity: 0.4,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95
})

const reedMat = new THREE.MeshStandardMaterial({
    map: stemColorTexture,
    normalMap: stemNormalTexture,
    normalScale: new THREE.Vector2(2.5, 2.5),
    roughnessMap: stemRoughnessTexture
})
const cattailMat = new THREE.MeshStandardMaterial({
    map: tipColorTexture,
    normalMap: tipNormalTexture,
    normalScale: new THREE.Vector2(2.5, 2.5),
    roughnessMap: tipRoughnessTexture
})

const mushroomStemMat = new THREE.MeshStandardMaterial({ color: '#d8d2bd', roughness: 0.8 })
const mushroomCapMat = new THREE.MeshStandardMaterial({
    color: '#4a2f1c',
    emissive: '#2a1608',
    emissiveIntensity: 0.4,
    roughness: 0.5
})

const windowMat = new THREE.MeshStandardMaterial({
    color: '#ffb347',
    emissive: '#ff8c1a',
    emissiveIntensity: 2
})


const mulberry32 = (a) => () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const rand = mulberry32(20240)
const rr = (min, max) => min + rand() * (max - min)

const shade = (object, cast = true, receive = true) => {
    object.traverse((obj) => {
        if (obj.isMesh) {
            obj.castShadow = cast
            obj.receiveShadow = receive
        }
    })
}


const makeGable = (w, h, d, material) => {
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2, 0)
    shape.lineTo(w / 2, 0)
    shape.lineTo(0, h)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false })
    geo.translate(0, 0, -d / 2)
    const uv = geo.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.4, uv.getY(i) * 0.4)
    return new THREE.Mesh(geo, material)
}

// М'яке світіння
const makeGlowTexture = (stops) => {
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = glowCanvas.height = 128
    const ctx = glowCanvas.getContext('2d')
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    for (const [offset, color] of stops) gradient.addColorStop(offset, color)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(glowCanvas)
}

const skullGeo = new THREE.SphereGeometry(1, 10, 8)
const jawGeo = new THREE.BoxGeometry(1, 0.5, 0.9)
const eyeGeo = new THREE.SphereGeometry(0.22, 6, 6)
const makeSkull = (r) => {
    const skull = new THREE.Group()
    const cranium = new THREE.Mesh(skullGeo, skullMat)
    const jaw = new THREE.Mesh(jawGeo, skullMat)
    jaw.position.set(0, -0.85, 0.15)
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat)
    eyeL.position.set(-0.38, -0.05, 0.82)
    const eyeR = eyeL.clone()
    eyeR.position.x = 0.38
    skull.add(cranium, jaw, eyeL, eyeR)
    skull.scale.setScalar(r)
    return skull
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), groundMat)
ground.rotation.x = -Math.PI * 0.5
ground.receiveShadow = true
scene.add(ground)

const hut = new THREE.Group()
scene.add(hut)

const HIP_HEIGHT = 2.2

// Ніжка
const createLeg = () => {
    const leg = new THREE.Group()

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 1.2, 16), chickenLegMat)
    thigh.position.set(0, -0.57, 0.18)
    thigh.rotation.x = -0.3

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 1.11, 16), chickenLegMat)
    shin.position.set(0, -1.67, 0.18)
    shin.rotation.x = 0.325

    const foot = new THREE.Group()
    foot.position.y = -HIP_HEIGHT + 0.08

    const makeToe = (angle, length) => {
        const toeGroup = new THREE.Group()
        toeGroup.rotation.y = angle

        const toe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, length, 16), chickenLegMat)
        toe.rotation.x = Math.PI * 0.5
        toe.position.z = length / 2

        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 16), clawMat)
        claw.rotation.x = Math.PI * 0.5
        claw.position.z = length + 0.1

        toeGroup.add(toe, claw)
        return toeGroup
    }

    foot.add(makeToe(-0.5, 0.7), makeToe(0, 0.8), makeToe(0.5, 0.7), makeToe(Math.PI, 0.5))

    leg.add(thigh, shin, foot)
    return leg
}

const leftLeg = createLeg()
leftLeg.position.set(-0.8, HIP_HEIGHT, 0)
const rightLeg = createLeg()
rightLeg.position.set(0.8, HIP_HEIGHT, 0)
hut.add(leftLeg, rightLeg)

// Будинок
const cabin = new THREE.Group()
cabin.position.y = HIP_HEIGHT
hut.add(cabin)

const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 3), woodMat)
body.position.y = 1.1
cabin.add(body)

const foundation = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.18, 3.5), darkWoodMat)
foundation.position.y = -0.09
cabin.add(foundation)

for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.3, 0.18), darkWoodMat)
        beam.position.set(sx * 1.5, 1.15, sz * 1.5)
        cabin.add(beam)
    }
}

const makePyramidRoof = (halfBase, height, material) => {
    const positions = []
    const uvs = []
    const y0 = -height / 2
    const y1 = height / 2
    for (let k = 0; k < 4; k++) {
        const phi = (k * Math.PI) / 2
        const c = Math.cos(phi)
        const sn = Math.sin(phi)
        const rot = (x, y, z) => [x * c + z * sn, y, -x * sn + z * c]
        positions.push(
            ...rot(-halfBase, y0, halfBase),
            ...rot(halfBase, y0, halfBase),
            ...rot(0, y1, 0)
        )
        uvs.push(0, 0, 1, 0, 0.5, 1)
    }
    positions.push(
        -halfBase, y0, -halfBase, halfBase, y0, -halfBase, halfBase, y0, halfBase,
        -halfBase, y0, -halfBase, halfBase, y0, halfBase, -halfBase, y0, halfBase
    )
    uvs.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.computeVertexNormals()
    return new THREE.Mesh(geo, material)
}

const roof = makePyramidRoof(1.84, 1.8, roofMat)
roof.position.y = 2.2 + 0.9
cabin.add(roof)

for (const s of [-1, 1]) {
    const beamZ = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.1, 0.1), darkWoodMat)
    beamZ.position.set(0, 2.2, s * 1.85)
    const beamX = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.75), darkWoodMat)
    beamX.position.set(s * 1.85, 2.2, 0)
    cabin.add(beamZ, beamX)
}

const dormerBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), woodMat)
dormerBox.position.set(0, 2.9, 1.1)
const dormerRoof = makeGable(1.05, 0.55, 1.0, roofMat)
dormerRoof.position.set(0, 3.25, 1.2)
cabin.add(dormerBox, dormerRoof)

const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), chimneyMat)
chimney.position.set(0.8, 3.4, -0.6)
const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.62), chimneyMat)
chimneyCap.position.set(0.8, 4.05, -0.6)
cabin.add(chimney, chimneyCap)

const door = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.55, 50, 50), doorMat)
door.position.set(0, 0.78, 1.51)
cabin.add(door)

const porch = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.2), darkWoodMat)
porch.position.set(0, 0, 2.1)
cabin.add(porch)

for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.8, 8), darkWoodMat)
    post.position.set(sx * 1.0, 0.96, 2.6)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 1.1), darkWoodMat)
    rail.position.set(sx * 1.0, 0.55, 2.05)
    cabin.add(post, rail)
}

const awning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.07, 1.4), roofMat)
awning.position.set(0, 2.0, 2.2)
awning.rotation.x = 0.14
cabin.add(awning)

const ladder = new THREE.Group()
for (const sx of [-0.4, 0.4]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.75, 0.07), trimWoodMat)
    rail.position.set(sx, -1.175, 3.3)
    rail.rotation.x = -0.5
    ladder.add(rail)
}
for (let i = 1; i <= 7; i++) {
    const t = i / 8
    const rung = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.07), trimWoodMat)
    rung.position.set(0, -2.35 * t, 2.65 + 1.3 * t)
    ladder.add(rung)
}
cabin.add(ladder)

// Ліхтар
const lampMetalMat = new THREE.MeshStandardMaterial({ color: '#17171a', metalness: 0.5, roughness: 0.55 })
const lampGlassMat = new THREE.MeshStandardMaterial({
    color: '#ffcf8a',
    emissive: '#ff9a3c',
    emissiveIntensity: 2,
    roughness: 0.3
})

const lamp = new THREE.Group()
lamp.position.set(0, 1.56, 2.25)

const lampGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.26, 12), lampGlassMat)
const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.05, 12), lampMetalMat)
lampBase.position.y = -0.155
const lampBaseTip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), lampMetalMat)
lampBaseTip.position.y = -0.2
const lampRoof = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.1, 12), lampMetalMat)
lampRoof.position.y = 0.19
const lampRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12), lampMetalMat)
lampRing.position.y = 0.28
const lampChain = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), lampMetalMat)
lampChain.position.y = 0.36
lamp.add(lampGlass, lampBase, lampBaseTip, lampRoof, lampRing, lampChain)

for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.27, 5), lampMetalMat)
    bar.position.set(Math.cos(a) * 0.085, 0, Math.sin(a) * 0.085)
    lamp.add(bar)
}

const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture([
        [0, 'rgba(255, 200, 120, 1)'],
        [0.2, 'rgba(255, 160, 70, 0.5)'],
        [1, 'rgba(255, 120, 30, 0)']
    ]),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0.55
}))
lampGlow.scale.setScalar(1.1)
lamp.add(lampGlow)
cabin.add(lamp)

const doorLight = new THREE.PointLight('#ff9a3c', 3, 8)
doorLight.position.set(0, 1.56, 2.45)
cabin.add(doorLight)

const doorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.14), trimWoodMat)
doorFrameL.position.set(-0.5, 0.8, 1.52)
const doorFrameR = doorFrameL.clone()
doorFrameR.position.x = 0.5
const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.14), trimWoodMat)
doorFrameTop.position.set(0, 1.55, 1.52)
const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), legMat)
doorKnob.position.set(0.3, 0.75, 1.6)
cabin.add(doorFrameL, doorFrameR, doorFrameTop, doorKnob)

// Вікна
const makeWindow = (w, h) => {
    const win = new THREE.Group()
    const t = 0.07

    const pane = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), windowMat)

    const top = new THREE.Mesh(new THREE.BoxGeometry(w + t, t, 0.14), trimWoodMat)
    top.position.y = h / 2
    const bottom = top.clone()
    bottom.position.y = -h / 2

    const left = new THREE.Mesh(new THREE.BoxGeometry(t, h + t, 0.14), trimWoodMat)
    left.position.x = -w / 2
    const right = left.clone()
    right.position.x = w / 2

    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, 0.12), trimWoodMat)
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, 0.12), trimWoodMat)

    const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.25, 0.07, 0.28), trimWoodMat)
    sill.position.set(0, -h / 2 - 0.08, 0.08)

    const shutterL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, h + 0.05, 0.04), trimWoodMat)
    shutterL.position.set(-w / 2 - w * 0.2, 0, 0.1)
    shutterL.rotation.y = 0.6
    const shutterR = shutterL.clone()
    shutterR.position.x = w / 2 + w * 0.2
    shutterR.rotation.y = -0.6

    win.add(pane, top, bottom, left, right, crossV, crossH, sill, shutterL, shutterR)
    return win
}

const windowSpots = [
    [-1.0, 1.5, 0], [1.0, 1.5, 0],
    [1.5, -0.7, Math.PI * 0.5], [1.5, 0.7, Math.PI * 0.5],
    [-1.5, 0, -Math.PI * 0.5],
    [0, -1.5, Math.PI]
]
for (const [x, z, rot] of windowSpots) {
    const win = makeWindow(0.5, 0.6)
    win.position.set(x, 1.3, z)
    win.rotation.y = rot
    cabin.add(win)
}

const dormerWindow = makeWindow(0.35, 0.4)
dormerWindow.position.set(0, 2.9, 1.51)
cabin.add(dormerWindow)

// Болото
const makeBlob = (r, amp) => ({ r, amp, p: [rand() * 6.28, rand() * 6.28, rand() * 6.28] })
const blobFactor = (blob, a) =>
    1 + blob.amp * (0.5 * Math.sin(2 * a + blob.p[0]) + 0.3 * Math.sin(3 * a + blob.p[1]) + 0.2 * Math.sin(5 * a + blob.p[2]))
const edgeR = (blob, a) => blob.r * blobFactor(blob, a)

const addBlob = (cx, cz, blob, material, y) => {
    const geo = new THREE.CircleGeometry(blob.r, 64)
    geo.rotateX(-Math.PI * 0.5)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const z = pos.getZ(i)
        const f = blobFactor(blob, Math.atan2(z, x))
        pos.setXYZ(i, x * f, 0, z * f)
    }
    const mesh = new THREE.Mesh(geo, material)
    mesh.position.set(cx, y, cz)
    mesh.receiveShadow = true
    scene.add(mesh)
    return mesh
}

const swampDefs = [
    { x: -4.0, z: 3.4, r: 2.3, puddles: [[-0.4, 0.3, 0.9], [1.0, -0.9, 0.5], [-1.3, -1.0, 0.4]] },
    { x: 4.7, z: -3.0, r: 2.1, puddles: [[0.3, 0.2, 0.75], [-0.85, -0.9, 0.42], [1.2, -0.9, 0.4]] },
    { x: -4.8, z: -3.2, r: 2.3, puddles: [[0.1, 0.0, 0.9], [1.3, -1.1, 0.45], [-1.3, 1.0, 0.4]] },
    { x: 4.3, z: 4.3, r: 1.5, puddles: [[0.0, 0.0, 0.7], [1.0, -0.6, 0.28]] }
]

const puddles = []

for (const s of swampDefs) {
    addBlob(s.x, s.z, makeBlob(s.r, 0.2), mudMat, 0.01)
    for (let k = 0; k < 2; k++) {
        const a = rr(0, Math.PI * 2)
        addBlob(
            s.x + Math.cos(a) * s.r * 0.6,
            s.z + Math.sin(a) * s.r * 0.6,
            makeBlob(s.r * 0.55, 0.25),
            mudMat,
            0.014 + k * 0.004
        )
    }

    s.puddles.forEach(([dx, dz, pr], idx) => {
        const water = makeBlob(pr, 0.12)
        const ring = { r: pr * 1.35, amp: 0.12, p: water.p }
        const px = s.x + dx
        const pz = s.z + dz
        addBlob(px, pz, ring, wetMudMat, 0.03)
        addBlob(px, pz, water, waterMat, 0.05 + idx * 0.002)
        puddles.push({ ...water, x: px, z: pz })
    })
}

const inPuddle = (x, z, margin = 0) =>
    puddles.some((p) => Math.hypot(x - p.x, z - p.z) < edgeR(p, Math.atan2(z - p.z, x - p.x)) + margin)

const reedStemGeo = new THREE.CylinderGeometry(0.02, 0.03, 1.3, 8)
const reedTipGeo = new THREE.CapsuleGeometry(0.04, 0.2, 6, 12)
const reeds = []

const addReed = (x, z) => {
    const reed = new THREE.Group()
    const stem = new THREE.Mesh(reedStemGeo, reedMat)
    stem.position.y = 0.65
    const tip = new THREE.Mesh(reedTipGeo, cattailMat)
    tip.position.y = 1.35
    reed.add(stem, tip)

    const randomScale = rr(0.7, 1.4)
    reed.scale.setScalar(randomScale)
    reed.rotation.x = rr(-0.1, 0.1)
    reed.rotation.z = rr(-0.1, 0.1)
    reed.userData.baseRotationX = reed.rotation.x
    reed.userData.baseRotationZ = reed.rotation.z
    reed.userData.phase = rand() * Math.PI * 2
    reed.position.set(x, 0, z)
    shade(reed, false, true)
    reeds.push(reed)
    scene.add(reed)
}

for (const p of puddles) {
    const arcs = p.r > 0.6 ? 2 : 1
    for (let k = 0; k < arcs; k++) {
        const base = rr(0, Math.PI * 2)
        const count = Math.round(rr(4, 7))
        for (let j = 0; j < count; j++) {
            const a = base + rr(-0.5, 0.5)
            const d = edgeR(p, a) + rr(0.02, 0.4)
            addReed(p.x + Math.cos(a) * d, p.z + Math.sin(a) * d)
        }
    }
}

const mushroomStemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.2, 6)
const mushroomCapGeo = new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5)
puddles.forEach((p, idx) => {
    if (idx % 2 !== 0) return
    const base = rr(0, Math.PI * 2)
    for (let j = 0; j < 3; j++) {
        const a = base + rr(-0.4, 0.4)
        const d = edgeR(p, a) + rr(0.25, 0.6)
        const mushroom = new THREE.Group()
        const stem = new THREE.Mesh(mushroomStemGeo, mushroomStemMat)
        stem.position.y = 0.1
        const cap = new THREE.Mesh(mushroomCapGeo, mushroomCapMat)
        cap.position.y = 0.2
        mushroom.add(stem, cap)
        mushroom.scale.setScalar(rr(0.6, 1.4))
        mushroom.position.set(p.x + Math.cos(a) * d, 0, p.z + Math.sin(a) * d)
        scene.add(mushroom)
    }
})

const rockGeo = new THREE.DodecahedronGeometry(1)
const addRock = (x, z, size) => {
    const rockMat = rand() > 0.5 ? stoneMat1 : stoneMat2
    const rock = new THREE.Mesh(rockGeo, rockMat)
    rock.scale.set(size, size * 0.6, size * rr(0.8, 1.2))
    rock.position.set(x, size * 0.25, z)
    rock.rotation.set(rand(), rand(), rand())
    rock.castShadow = true
    rock.receiveShadow = true
    scene.add(rock)
}
for (const p of puddles) {
    if (rand() < 0.6) {
        const a = rr(0, Math.PI * 2)
        const d = edgeR(p, a) + 0.3
        addRock(p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, rr(0.15, 0.35))
    }
}

// Паркан
const fence = new THREE.Group()
const POSTS = 16
const fencePosts = []
const postGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.6, 12)
const postTopGeo = new THREE.ConeGeometry(0.1, 0.25, 12)
for (let i = 1; i < POSTS; i++) {
    const angle = (i / POSTS) * Math.PI * 2
    const x = Math.sin(angle) * 7
    const z = Math.cos(angle) * 7
    fencePosts.push([x, z])

    const postGroup = new THREE.Group()
    const post = new THREE.Mesh(postGeo, barkMat)
    const top = new THREE.Mesh(postTopGeo, barkMat)
    top.position.y = 0.92
    postGroup.add(post, top)
    postGroup.position.set(x, 0.8, z)
    postGroup.rotation.z = rr(-0.1, 0.1)
    fence.add(postGroup)

    if (i % 4 === 0) {
        const skull = makeSkull(0.18)
        skull.position.set(x, 2.0, z)
        skull.rotation.y = angle
        fence.add(skull)
    }
}
for (let i = 0; i < fencePosts.length - 1; i++) {
    const [x1, z1] = fencePosts[i]
    const [x2, z2] = fencePosts[i + 1]
    const len = Math.hypot(x2 - x1, z2 - z1)
    for (const y of [0.5, 1.1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, len), barkMat)
        rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2)
        rail.rotation.y = Math.atan2(x2 - x1, z2 - z1)
        fence.add(rail)
    }
}
scene.add(fence)

const stepGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.08, 7)
for (let i = 0; i < 6; i++) {
    const stepMat = rand() > 0.5 ? stoneMat1 : stoneMat2
    const step = new THREE.Mesh(stepGeo, stepMat)
    step.position.set(rr(-0.15, 0.15), 0.04, 4.4 + i * 0.45)
    step.scale.set(rr(0.85, 1.15), 1, rr(0.7, 0.9))
    step.rotation.y = rand() * Math.PI
    step.receiveShadow = true
    scene.add(step)
}

for (let i = 0; i < 10; i++) {
    const angle = rr(0, Math.PI * 2)
    const radius = rr(3, 6.2)
    const rx = Math.sin(angle) * radius
    const rz = Math.cos(angle) * radius
    if (inPuddle(rx, rz, 0.8)) continue
    if (Math.abs(rx) < 0.9 && rz > 3.5) continue
    addRock(rx, rz, rr(0.2, 0.45))
}

// Казан
const cauldron = new THREE.Group()
const pot = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), cauldronMat)
pot.position.y = 0.42
const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 20), cauldronMat)
potRim.rotation.x = Math.PI * 0.5
potRim.position.y = 0.42
const potion = new THREE.Mesh(new THREE.CircleGeometry(0.38, 20), potionMat)
potion.rotation.x = -Math.PI * 0.5
potion.position.y = 0.38
cauldron.add(pot, potRim, potion)
for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), cauldronMat)
    leg.position.set(Math.cos(a) * 0.25, 0.1, Math.sin(a) * 0.25)
    cauldron.add(leg)
}
cauldron.position.set(1.8, 0, 3.0)
shade(cauldron)
scene.add(cauldron)

const woodpile = new THREE.Group()
const logGeo = new THREE.CylinderGeometry(0.13, 0.13, 1.2, 10)
const logRows = [
    [0.13, [-0.52, -0.26, 0, 0.26, 0.52]],
    [0.36, [-0.39, -0.13, 0.13, 0.39]],
    [0.59, [-0.26, 0, 0.26]]
]
for (const [y, zs] of logRows) {
    for (const z of zs) {
        const log = new THREE.Mesh(logGeo, woodMat)
        log.rotation.z = Math.PI * 0.5
        log.position.set(0, y, z)
        woodpile.add(log)
    }
}
woodpile.position.set(3.4, 0, 0.3)
woodpile.rotation.y = -0.15
shade(woodpile)
scene.add(woodpile)

// Вбиральня
const outhouse = new THREE.Group()
const outhouseBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.7, 0.95), woodMat)
outhouseBody.position.y = 0.85
const outhouseRoof = makeGable(1.35, 0.5, 1.25, roofMat)
outhouseRoof.position.y = 1.7
const outhouseDoor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.3, 0.04), trimWoodMat)
outhouseDoor.position.set(0, 0.7, 0.49)
const outhouseKnob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), legMat)
outhouseKnob.position.set(0.2, 0.7, 0.53)
const outhouseVent = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.04), eyeMat)
outhouseVent.position.set(0, 1.5, 0.49)
outhouse.add(outhouseBody, outhouseRoof, outhouseDoor, outhouseKnob, outhouseVent)
outhouse.position.set(-0.8, 0, -5.2)
outhouse.rotation.y = 0.2
shade(outhouse)
scene.add(outhouse)

// Ялинки
const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 16)
const crownGeos = [
    [new THREE.ConeGeometry(1.5, 2.2, 8), 2.4],
    [new THREE.ConeGeometry(1.15, 2.0, 8), 3.6],
    [new THREE.ConeGeometry(0.8, 1.8, 8), 4.7]
]
for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2 + rr(-0.1, 0.1)
    const radius = rr(10, 16)
    const tree = new THREE.Group()

    const trunk = new THREE.Mesh(trunkGeo, barkMat)
    trunk.position.y = 0.75
    tree.add(trunk)
    for (const [geo, y] of crownGeos) {
        const crown = new THREE.Mesh(geo, leafMat)
        crown.position.y = y
        tree.add(crown)
    }

    tree.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius)
    tree.scale.setScalar(rr(0.8, 1.4))
    shade(tree, true, true)
    scene.add(tree)
}

// Сухі дерева
const deadTreeSpots = [[-6.2, 1.2], [6.3, -5.0], [-6.4, -0.8], [5.2, 6.0]]
for (const [tx, tz] of deadTreeSpots) {
    const tree = new THREE.Group()
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 3.2, 16), barkMat)
    trunk.position.y = 1.6
    tree.add(trunk)
    for (const [sx, y] of [[1, 2.0], [-1, 2.5], [1, 2.9]]) {
        const branchPivot = new THREE.Group()
        branchPivot.position.y = y
        branchPivot.rotation.y = rr(0, Math.PI * 2)
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.07, 1.1, 12), barkMat)
        branch.position.set(sx * 0.45, 0.34, 0)
        branch.rotation.z = -0.9 * sx
        branchPivot.add(branch)
        tree.add(branchPivot)
    }
    tree.position.set(tx, 0, tz)
    tree.rotation.z = rr(-0.06, 0.06)
    shade(tree, true, false)
    scene.add(tree)
}

// Трава
const makeTuftGeometry = () => {
    const positions = []
    const colors = []
    const normals = []
    const indices = []
    const BLADES = 5
    const addVertex = (x, y, z, shadeValue) => {
        positions.push(x, y, z)
        colors.push(shadeValue, shadeValue, shadeValue)
        normals.push(0, 1, 0)
    }
    for (let b = 0; b < BLADES; b++) {
        const angle = (b / BLADES) * Math.PI * 2 + rr(-0.4, 0.4)
        const height = rr(0.25, 0.45)
        const width = rr(0.025, 0.04)
        const lean = rr(0.05, 0.18)
        const dx = Math.cos(angle)
        const dz = Math.sin(angle)
        const bx = dx * rr(0, 0.05)
        const bz = dz * rr(0, 0.05)
        const levels = [[0, width, 0.35], [0.55, width * 0.6, 0.7]]
        const start = positions.length / 3
        for (const [t, w, c] of levels) {
            const along = lean * t * t
            for (const side of [-0.5, 0.5]) {
                addVertex(bx + dx * along - dz * w * side, height * t, bz + dz * along + dx * w * side, c)
            }
        }
        addVertex(bx + dx * lean, height, bz + dz * lean, 1)
        indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2, start + 2, start + 3, start + 4)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geo.setIndex(indices)
    return geo
}

const MAX_TUFTS = 3000
const grass = new THREE.InstancedMesh(makeTuftGeometry(), grassMat, MAX_TUFTS)
const dummy = new THREE.Object3D()
const tuftColor = new THREE.Color()
let tufts = 0

const addClump = (cx, cz, count, spread) => {
    for (let i = 0; i < count && tufts < MAX_TUFTS; i++) {
        const x = cx + rr(-spread, spread)
        const z = cz + rr(-spread, spread)
        if (Math.hypot(x, z) < 2.4) continue
        if (inPuddle(x, z, 0.35)) continue
        if (Math.abs(x) < 0.8 && z > 3.5) continue
        const s = rr(0.8, 1.4)
        dummy.position.set(x, 0, z)
        dummy.rotation.set(rr(-0.15, 0.15), rand() * Math.PI * 2, rr(-0.15, 0.15))
        dummy.scale.set(s, s * rr(0.7, 1.5), s)
        dummy.updateMatrix()
        grass.setMatrixAt(tufts, dummy.matrix)
        grass.setColorAt(tufts, tuftColor.setHSL(rr(0.2, 0.32), 0.5, rr(0.2, 0.42)))
        tufts++
    }
}
for (const s of swampDefs) {
    for (let i = 0; i < 22; i++) {
        const a = rr(0, Math.PI * 2)
        const d = rr(0.4, s.r * 1.1)
        addClump(s.x + Math.cos(a) * d, s.z + Math.sin(a) * d, 9, 0.4)
    }
}
for (let i = 0; i < 100; i++) {
    const a = rr(0, Math.PI * 2)
    const d = rr(2.5, 12)
    addClump(Math.sin(a) * d, Math.cos(a) * d, 9, 0.5)
}
grass.count = tufts
scene.add(grass)

// Блукаючий вогник
const wispGlowTexture = makeGlowTexture([
    [0, 'rgba(255, 255, 255, 1)'],
    [0.25, 'rgba(255, 255, 255, 0.35)'],
    [1, 'rgba(255, 255, 255, 0)']
])

const makeWisp = (color) => {
    const wisp = new THREE.PointLight(color, 3, 6)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: wispGlowTexture,
        color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    }))
    glow.scale.setScalar(1.2)
    wisp.add(glow)
    wisp.userData.glow = glow
    scene.add(wisp)
    return wisp
}
const wisp1 = makeWisp('#00ffff')
const wisp2 = makeWisp('#ff55ff')

const wispPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.0, 1.3, 3.4),
    new THREE.Vector3(0, 1.8, 5.8),
    new THREE.Vector3(4.3, 1.3, 4.3),
    new THREE.Vector3(5.2, 1.6, 0.5),
    new THREE.Vector3(4.7, 1.3, -3.0),
    new THREE.Vector3(0, 1.8, -3.6),
    new THREE.Vector3(-4.8, 1.3, -3.2),
    new THREE.Vector3(-4.9, 1.6, 0.3)
], true, 'centripetal')

// Освітлення
const ambientLight = new THREE.AmbientLight('#6a5fa0', 0.6)
scene.add(ambientLight)

const moonLight = new THREE.DirectionalLight('#8fb0ff', 1.5)
moonLight.position.set(6, 10, -4)
moonLight.castShadow = true
moonLight.shadow.mapSize.set(2048, 2048)
moonLight.shadow.camera.left = -11
moonLight.shadow.camera.right = 11
moonLight.shadow.camera.top = 11
moonLight.shadow.camera.bottom = -11
moonLight.shadow.camera.far = 30
moonLight.shadow.camera.updateProjectionMatrix()
moonLight.shadow.bias = -0.0005
moonLight.shadow.normalBias = 0.03
scene.add(moonLight)

shade(hut)
fence.traverse((obj) => { if (obj.isMesh) obj.castShadow = true })


const fog = new THREE.FogExp2('#12162a', 0.04)
scene.fog = fog

const skyMesh = new Sky()
skyMesh.scale.setScalar(100)
scene.add(skyMesh)

const skyParams = { turbidity: 6, rayleigh: 0.6, elevation: -3, azimuth: 180 }
const skyBrightness = { value: 0.25 }
skyMesh.material.onBeforeCompile = (shader) => {
    shader.uniforms.uBrightness = skyBrightness
    shader.fragmentShader = 'uniform float uBrightness;\n' + shader.fragmentShader.replace(
        '#include <tonemapping_fragment>',
        'gl_FragColor.rgb *= uBrightness;\n#include <tonemapping_fragment>'
    )
}
const sun = new THREE.Vector3()
const moonPosition = new THREE.Vector3(6, 10, -4)
const sunPosition = new THREE.Vector3()
const nightLook = { light: new THREE.Color('#8fb0ff'), ambient: new THREE.Color('#6a5fa0'), fog: new THREE.Color('#12162a') }
const dayLook = { light: new THREE.Color('#ffe2b8'), ambient: new THREE.Color('#a9b8d8'), fog: new THREE.Color('#a9b6c8') }

const updateSky = () => {
    const u = skyMesh.material.uniforms
    u['turbidity'].value = skyParams.turbidity
    u['rayleigh'].value = skyParams.rayleigh
    sun.setFromSphericalCoords(
        1,
        THREE.MathUtils.degToRad(90 - skyParams.elevation),
        THREE.MathUtils.degToRad(skyParams.azimuth)
    )
    u['sunPosition'].value.copy(sun)

    const day = THREE.MathUtils.smoothstep(skyParams.elevation, -3, 25)
    skyBrightness.value = THREE.MathUtils.lerp(0.25, 1, day)
    sunPosition.copy(sun).multiplyScalar(12)
    moonLight.position.lerpVectors(moonPosition, sunPosition, day)
    moonLight.color.lerpColors(nightLook.light, dayLook.light, day)
    moonLight.intensity = THREE.MathUtils.lerp(1.5, 3, day)
    ambientLight.color.lerpColors(nightLook.ambient, dayLook.ambient, day)
    ambientLight.intensity = THREE.MathUtils.lerp(0.6, 1, day)
    fog.color.lerpColors(nightLook.fog, dayLook.fog, day)
    fog.density = THREE.MathUtils.lerp(0.04, 0.015, day)
    stars.material.opacity = 0.8 * (1 - day)
}

const STARS = 500
const starPositions = new Float32Array(STARS * 3)
for (let i = 0; i < STARS; i++) {
    const theta = rr(0, Math.PI * 2)
    const y = rr(0.05, 1)
    const ring = Math.sqrt(1 - y * y)
    starPositions[i * 3] = Math.cos(theta) * ring * 45
    starPositions[i * 3 + 1] = y * 45
    starPositions[i * 3 + 2] = Math.sin(theta) * ring * 45
}
const starGeo = new THREE.BufferGeometry()
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: '#cfd8ff',
    size: 1.8,
    sizeAttenuation: false,
    fog: false,
    transparent: true,
    opacity: 0.8,
    depthWrite: false
}))
scene.add(stars)
updateSky()

// GUI
const params = { walkSpeed: 1.5, sway: 1, wispSpeed: 1 }

const animFolder = gui.addFolder('Анімація')
animFolder.add(params, 'walkSpeed').min(0).max(4).step(0.1).name('Швидкість ходи')
animFolder.add(params, 'sway').min(0).max(2).step(0.1).name('Розгойдування')
animFolder.add(params, 'wispSpeed').min(0).max(4).step(0.1).name('Швидкість вогників')

const lightFolder = gui.addFolder('Світло')
lightFolder.add(ambientLight, 'intensity').min(0).max(2).step(0.01).name('Загальне').listen()
lightFolder.add(moonLight, 'intensity').min(0).max(4).step(0.01).name('Місяць / сонце').listen()
lightFolder.addColor(moonLight, 'color').name('Колір місяця / сонця').listen()
lightFolder.addColor(windowMat, 'emissive').name('Колір вікон')
lightFolder.addColor(lampGlassMat, 'emissive').name('Колір лампи')

const fogFolder = gui.addFolder('Туман')
fogFolder.add(fog, 'density').min(0).max(0.15).step(0.001).name('Густина').listen()
fogFolder.addColor(fog, 'color').name('Колір').listen()

const groundFolder = gui.addFolder('Земля')
groundFolder.addColor(groundMat, 'color').name('Колір землі')
groundFolder.addColor(leafMat, 'color').name('Колір ялинок')

const skyFolder = gui.addFolder('Небо')
skyFolder.add(skyParams, 'turbidity').min(0).max(20).step(0.1).name('Каламутність').onChange(updateSky)
skyFolder.add(skyParams, 'rayleigh').min(0).max(4).step(0.01).name('Розсіювання').onChange(updateSky)
skyFolder.add(skyParams, 'elevation').min(-20).max(90).step(0.1).name('Висота сонця (час доби)').onChange(updateSky)
skyFolder.add(skyParams, 'azimuth').min(-180).max(180).step(0.1).name('Азимут').onChange(updateSky)
skyFolder.add(stars, 'visible').name('Зірки')

// Камера та рендер
const sizes = { width: window.innerWidth, height: window.innerHeight }

const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 200)
camera.position.set(7, 4, 9)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 2, 0)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1

const renderFolder = gui.addFolder('Кадр')
renderFolder.add(renderer, 'toneMappingExposure').min(0.3).max(2).step(0.01).name('Експозиція')

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

//Анімація
const clock = new THREE.Clock()
const wrap01 = (v) => ((v % 1) + 1) % 1

const tick = () => {
    const t = clock.getElapsedTime()
    const walk = t * params.walkSpeed
    const wt = t * params.wispSpeed

    hut.position.y = Math.abs(Math.sin(walk * 2)) * 0.15 * params.sway
    cabin.rotation.z = Math.sin(walk) * 0.05 * params.sway
    cabin.rotation.x = Math.cos(walk * 2) * 0.025 * params.sway

    leftLeg.rotation.x = Math.sin(walk) * 0.3 * params.sway
    rightLeg.rotation.x = -Math.sin(walk) * 0.3 * params.sway

    wisp1.position.copy(wispPath.getPointAt(wrap01(wt * 0.03)))
    wisp1.position.y += Math.sin(wt * 2) * 0.3
    wisp2.position.copy(wispPath.getPointAt(wrap01(0.5 - wt * 0.022)))
    wisp2.position.y += Math.sin(wt * 1.6 + 2) * 0.3
    wisp1.intensity = 3 + Math.sin(wt * 7) * 0.5
    wisp2.intensity = 3 + Math.sin(wt * 6 + 1) * 0.5
    wisp1.userData.glow.scale.setScalar(1.2 + Math.sin(wt * 7) * 0.12)
    wisp2.userData.glow.scale.setScalar(1.2 + Math.sin(wt * 6 + 1) * 0.12)

    doorLight.intensity = 3 + Math.sin(t * 8) * 0.6 + Math.sin(t * 23) * 0.4
    windowMat.emissiveIntensity = 2 + Math.sin(t * 5) * 0.4
    lampGlassMat.emissiveIntensity = doorLight.intensity * 0.7

    for (const reed of reeds) {
        reed.rotation.z = reed.userData.baseRotationZ + Math.sin(t + reed.userData.phase) * 0.06
        reed.rotation.x = reed.userData.baseRotationX + Math.cos(t * 0.8 + reed.userData.phase) * 0.06
    }
    waterMat.emissiveIntensity = 0.4 + Math.sin(t * 1.5) * 0.15
    mushroomCapMat.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.1

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()