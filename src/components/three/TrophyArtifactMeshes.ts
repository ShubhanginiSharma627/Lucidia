import * as THREE from 'three';
import { MaterialFinishType, PedestalStyleType } from '../../types';

// WebGL software rendering check
export function detectSoftwareGl(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return false;
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * Creates a soft procedural radial contact shadow texture.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

/**
 * Creates contact shadow disc mesh placed right on the pedestal or floor.
 */
export function createContactShadowMesh(size = 3.2): THREE.Mesh {
  const shadowGeo = new THREE.PlaneGeometry(size, size);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    opacity: 0.85,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.01;
  shadowMesh.name = 'contact_shadow';
  return shadowMesh;
}

/**
 * High-fidelity PBR material factory based on unlocked finish.
 */
export function createArtifactMaterial(
  finish: MaterialFinishType,
  role: 'primary' | 'secondary' | 'accent' | 'core' = 'primary'
): THREE.Material {
  switch (finish) {
    case 'brushed_gold':
      if (role === 'primary') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#fbbf24'),
          metalness: 0.92,
          roughness: 0.28,
          envMapIntensity: 1.4,
        });
      } else if (role === 'secondary') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#f59e0b'),
          metalness: 0.85,
          roughness: 0.4,
          envMapIntensity: 1.2,
        });
      } else if (role === 'core') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#fef08a'),
          emissive: new THREE.Color('#f59e0b'),
          emissiveIntensity: 0.6,
          metalness: 0.5,
          roughness: 0.2,
        });
      } else {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ffffff'),
          metalness: 0.95,
          roughness: 0.15,
        });
      }

    case 'iridescent_chrome':
      if (role === 'primary') {
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#e0e7ff'),
          metalness: 0.95,
          roughness: 0.12,
          clearcoat: 0.9,
          clearcoatRoughness: 0.1,
          ior: 1.6,
          reflectivity: 0.9,
          envMapIntensity: 1.8,
        });
      } else if (role === 'secondary') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#818cf8'),
          metalness: 0.9,
          roughness: 0.25,
          envMapIntensity: 1.5,
        });
      } else if (role === 'core') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#a5b4fc'),
          emissive: new THREE.Color('#6366f1'),
          emissiveIntensity: 0.7,
          metalness: 0.3,
          roughness: 0.2,
        });
      } else {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#c7d2fe'),
          metalness: 0.98,
          roughness: 0.1,
        });
      }

    case 'emerald_matrix':
      if (role === 'primary') {
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#059669'),
          metalness: 0.3,
          roughness: 0.15,
          transmission: 0.6,
          thickness: 0.8,
          ior: 1.52,
          emissive: new THREE.Color('#047857'),
          emissiveIntensity: 0.25,
          envMapIntensity: 1.5,
        });
      } else if (role === 'secondary') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#10b981'),
          metalness: 0.8,
          roughness: 0.3,
          envMapIntensity: 1.3,
        });
      } else if (role === 'core') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#34d399'),
          emissive: new THREE.Color('#10b981'),
          emissiveIntensity: 0.9,
          metalness: 0.2,
          roughness: 0.2,
        });
      } else {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#064e3b'),
          metalness: 0.9,
          roughness: 0.25,
        });
      }

    case 'celestial_platinum':
      if (role === 'primary') {
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#f1f5f9'),
          metalness: 0.98,
          roughness: 0.08,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          envMapIntensity: 2.0,
        });
      } else if (role === 'secondary') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#cbd5e1'),
          metalness: 0.9,
          roughness: 0.2,
          envMapIntensity: 1.4,
        });
      } else if (role === 'core') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#ffffff'),
          emissive: new THREE.Color('#93c5fd'),
          emissiveIntensity: 0.8,
          metalness: 0.4,
          roughness: 0.1,
        });
      } else {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#38bdf8'),
          emissive: new THREE.Color('#0284c7'),
          emissiveIntensity: 0.4,
          metalness: 0.8,
          roughness: 0.2,
        });
      }

    case 'obsidian_titanium':
    default:
      if (role === 'primary') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#1e293b'),
          metalness: 0.88,
          roughness: 0.25,
          envMapIntensity: 1.3,
        });
      } else if (role === 'secondary') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#0f172a'),
          metalness: 0.92,
          roughness: 0.18,
          envMapIntensity: 1.4,
        });
      } else if (role === 'core') {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#60a5fa'),
          emissive: new THREE.Color('#3b82f6'),
          emissiveIntensity: 0.75,
          metalness: 0.4,
          roughness: 0.2,
        });
      } else {
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#38bdf8'),
          metalness: 0.8,
          roughness: 0.3,
        });
      }
  }
}

/**
 * Creates high-aesthetic Pedestals anchored at y=0.
 */
export function createPedestalMesh(style: PedestalStyleType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'pedestal_group';

  if (style === 'golden_sanctuary') {
    // Stepped gold dais
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.2, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b45309'),
      metalness: 0.9,
      roughness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.1;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    const stepGeo = new THREE.CylinderGeometry(1.35, 1.45, 0.18, 48);
    const stepMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d97706'),
      metalness: 0.92,
      roughness: 0.25,
    });
    const stepMesh = new THREE.Mesh(stepGeo, stepMat);
    stepMesh.position.y = 0.29;
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    group.add(stepMesh);

    const topGeo = new THREE.CylinderGeometry(1.15, 1.25, 0.14, 48);
    const topMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f59e0b'),
      metalness: 0.95,
      roughness: 0.2,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = 0.45;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);

    // Glowing aurum ring
    const ringGeo = new THREE.TorusGeometry(1.22, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fef08a') });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.46;
    group.add(ringMesh);
  } else if (style === 'floating_obsidian') {
    // Sub-surface anchor
    const anchorGeo = new THREE.CylinderGeometry(1.1, 1.3, 0.12, 32);
    const anchorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#090d16'),
      metalness: 0.7,
      roughness: 0.5,
    });
    const anchor = new THREE.Mesh(anchorGeo, anchorMat);
    anchor.position.y = 0.06;
    group.add(anchor);

    // Floating mirror obsidian plinth
    const discGeo = new THREE.CylinderGeometry(1.4, 1.35, 0.16, 48);
    const discMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#020617'),
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 0.28;
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);

    // Neon cyan levitation light ring
    const glowGeo = new THREE.TorusGeometry(1.15, 0.025, 16, 64);
    const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#38bdf8') });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.15;
    group.add(glow);
  } else if (style === 'cyber_monolith') {
    // Octagonal cyber dais
    const daisGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.25, 8);
    const daisMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f172a'),
      metalness: 0.85,
      roughness: 0.35,
    });
    const dais = new THREE.Mesh(daisGeo, daisMat);
    dais.position.y = 0.125;
    dais.castShadow = true;
    dais.receiveShadow = true;
    group.add(dais);

    // Hex top cap
    const capGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.15, 8);
    const capMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1e293b'),
      metalness: 0.95,
      roughness: 0.2,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.325;
    group.add(cap);

    // Cyan circuit perimeter
    const circGeo = new THREE.TorusGeometry(1.25, 0.02, 16, 8);
    const circMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#06b6d4') });
    const circ = new THREE.Mesh(circGeo, circMat);
    circ.rotation.x = Math.PI / 2;
    circ.position.y = 0.4;
    group.add(circ);
  } else {
    // minimal_slate (Default)
    const slateGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.22, 40);
    const slateMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#182234'),
      metalness: 0.7,
      roughness: 0.45,
    });
    const slate = new THREE.Mesh(slateGeo, slateMat);
    slate.position.y = 0.11;
    slate.castShadow = true;
    slate.receiveShadow = true;
    group.add(slate);

    const bevelGeo = new THREE.CylinderGeometry(1.2, 1.35, 0.12, 40);
    const bevelMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#233044'),
      metalness: 0.8,
      roughness: 0.3,
    });
    const bevel = new THREE.Mesh(bevelGeo, bevelMat);
    bevel.position.y = 0.27;
    bevel.castShadow = true;
    bevel.receiveShadow = true;
    group.add(bevel);

    // Subtle edge ring
    const edgeGeo = new THREE.TorusGeometry(1.25, 0.015, 16, 48);
    const edgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#475569') });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = 0.33;
    group.add(edge);
  }

  return group;
}

/**
 * Composite Artifact 1: The Synaptic Spark
 * Gyroscope gimbals, central glowing core, equatorial pins, axle mounts.
 */
export function createSynapticSparkMesh(finish: MaterialFinishType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'artifact_synaptic_spark';

  const matPrimary = createArtifactMaterial(finish, 'primary');
  const matSecondary = createArtifactMaterial(finish, 'secondary');
  const matAccent = createArtifactMaterial(finish, 'accent');
  const matCore = createArtifactMaterial(finish, 'core');

  // Outer gimbal ring
  const outerRingGeo = new THREE.TorusGeometry(0.85, 0.05, 16, 64);
  const outerRing = new THREE.Mesh(outerRingGeo, matPrimary);
  outerRing.castShadow = true;
  outerRing.name = 'outer_ring';
  group.add(outerRing);

  // Inner gimbal ring
  const innerRingGeo = new THREE.TorusGeometry(0.65, 0.045, 16, 64);
  const innerRing = new THREE.Mesh(innerRingGeo, matSecondary);
  innerRing.castShadow = true;
  innerRing.rotation.x = Math.PI / 3;
  innerRing.name = 'inner_ring';
  group.add(innerRing);

  // Central glowing core
  const coreGeo = new THREE.IcosahedronGeometry(0.24, 1);
  const coreMesh = new THREE.Mesh(coreGeo, matCore);
  coreMesh.name = 'pulse_core';
  group.add(coreMesh);

  // Equatorial mounting pins
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const pinGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.18, 12);
    const pin = new THREE.Mesh(pinGeo, matAccent);
    pin.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.85, 0);
    pin.rotation.z = angle - Math.PI / 2;
    group.add(pin);
  }

  // Vertical axle spindle
  const axleGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.8, 16);
  const axle = new THREE.Mesh(axleGeo, matSecondary);
  axle.castShadow = true;
  group.add(axle);

  // Apex and base finials
  const finialTopGeo = new THREE.ConeGeometry(0.06, 0.16, 16);
  const finialTop = new THREE.Mesh(finialTopGeo, matAccent);
  finialTop.position.y = 0.95;
  group.add(finialTop);

  const finialBotGeo = new THREE.ConeGeometry(0.06, 0.16, 16);
  const finialBot = new THREE.Mesh(finialBotGeo, matAccent);
  finialBot.position.y = -0.95;
  finialBot.rotation.x = Math.PI;
  group.add(finialBot);

  group.position.y = 1.35;
  return group;
}

/**
 * Composite Artifact 2: The Memory Prism
 * Faceted double-pyramid crystal, support cage brackets, levitating ring.
 */
export function createMemoryPrismMesh(finish: MaterialFinishType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'artifact_memory_prism';

  const matPrimary = createArtifactMaterial(finish, 'primary');
  const matSecondary = createArtifactMaterial(finish, 'secondary');
  const matAccent = createArtifactMaterial(finish, 'accent');
  const matCore = createArtifactMaterial(finish, 'core');

  // Double pyramid crystal (Octahedron scaled on Y)
  const crystalGeo = new THREE.OctahedronGeometry(0.68, 0);
  crystalGeo.scale(1, 1.5, 1);
  const crystal = new THREE.Mesh(crystalGeo, matPrimary);
  crystal.castShadow = true;
  crystal.name = 'crystal_body';
  group.add(crystal);

  // Internal glowing core
  const innerGeo = new THREE.OctahedronGeometry(0.28, 0);
  const innerMesh = new THREE.Mesh(innerGeo, matCore);
  innerMesh.name = 'inner_core';
  group.add(innerMesh);

  // Levitating horizontal ring
  const ringGeo = new THREE.TorusGeometry(0.85, 0.035, 16, 64);
  const ring = new THREE.Mesh(ringGeo, matSecondary);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  ring.name = 'float_ring';
  group.add(ring);

  // 4 corner stabilization brackets
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const bracketGeo = new THREE.BoxGeometry(0.06, 0.35, 0.06);
    const bracket = new THREE.Mesh(bracketGeo, matAccent);
    bracket.position.set(Math.cos(angle) * 0.78, 0, Math.sin(angle) * 0.78);
    bracket.rotation.y = angle;
    group.add(bracket);
  }

  // Top and bottom cap jewels
  const capTopGeo = new THREE.TetrahedronGeometry(0.12);
  const capTop = new THREE.Mesh(capTopGeo, matAccent);
  capTop.position.y = 1.08;
  group.add(capTop);

  const capBotGeo = new THREE.TetrahedronGeometry(0.12);
  const capBot = new THREE.Mesh(capBotGeo, matAccent);
  capBot.position.y = -1.08;
  capBot.rotation.x = Math.PI;
  group.add(capBot);

  group.position.y = 1.45;
  return group;
}

/**
 * Composite Artifact 3: The Chrono Compass
 * Dual astrolabe chapter rings, directional needle, central dial hub.
 */
export function createChronoCompassMesh(finish: MaterialFinishType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'artifact_chrono_compass';

  const matPrimary = createArtifactMaterial(finish, 'primary');
  const matSecondary = createArtifactMaterial(finish, 'secondary');
  const matAccent = createArtifactMaterial(finish, 'accent');
  const matCore = createArtifactMaterial(finish, 'core');

  // Outer graduated chapter ring
  const outerRingGeo = new THREE.TorusGeometry(0.9, 0.04, 16, 64);
  const outerRing = new THREE.Mesh(outerRingGeo, matPrimary);
  outerRing.castShadow = true;
  group.add(outerRing);

  // Inner chapter dial
  const innerRingGeo = new THREE.TorusGeometry(0.7, 0.03, 16, 64);
  const innerRing = new THREE.Mesh(innerRingGeo, matSecondary);
  group.add(innerRing);

  // Central dial hub
  const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 24);
  const hub = new THREE.Mesh(hubGeo, matAccent);
  hub.rotation.x = Math.PI / 2;
  hub.castShadow = true;
  group.add(hub);

  // Center luminous jewel
  const jewelGeo = new THREE.SphereGeometry(0.1, 16, 16);
  const jewel = new THREE.Mesh(jewelGeo, matCore);
  jewel.name = 'center_jewel';
  group.add(jewel);

  // Directional needle (North/South pointer)
  const needleGroup = new THREE.Group();
  needleGroup.name = 'compass_needle';

  const northGeo = new THREE.ConeGeometry(0.09, 0.65, 8);
  const northMesh = new THREE.Mesh(northGeo, matPrimary);
  northMesh.position.y = 0.35;
  northMesh.castShadow = true;
  needleGroup.add(northMesh);

  const southGeo = new THREE.ConeGeometry(0.08, 0.55, 8);
  const southMesh = new THREE.Mesh(southGeo, matSecondary);
  southMesh.position.y = -0.3;
  southMesh.rotation.z = Math.PI;
  needleGroup.add(southMesh);

  group.add(needleGroup);

  // 8 cardinal and intercardinal marker pegs
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const isMajor = i % 2 === 0;
    const pegGeo = new THREE.BoxGeometry(0.03, isMajor ? 0.12 : 0.07, 0.04);
    const peg = new THREE.Mesh(pegGeo, matAccent);
    peg.position.set(Math.cos(angle) * 0.8, Math.sin(angle) * 0.8, 0);
    peg.rotation.z = angle - Math.PI / 2;
    group.add(peg);
  }

  group.position.y = 1.35;
  return group;
}

/**
 * Composite Artifact 4: The Neuro Lattice
 * Icosahedral wireframe structure with 12 node spheres and connecting strut cylinders.
 */
export function createNeuroLatticeMesh(finish: MaterialFinishType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'artifact_neuro_lattice';

  const matPrimary = createArtifactMaterial(finish, 'primary');
  const matSecondary = createArtifactMaterial(finish, 'secondary');
  const matCore = createArtifactMaterial(finish, 'core');

  // Base icosahedron for vertex positions
  const baseIco = new THREE.IcosahedronGeometry(0.75, 0);
  const pos = baseIco.attributes.position;
  const vertices: THREE.Vector3[] = [];

  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    if (!vertices.some(existing => existing.distanceTo(v) < 0.05)) {
      vertices.push(v);
    }
  }

  // Node spheres at each vertex
  const sphereGeo = new THREE.SphereGeometry(0.09, 16, 16);
  vertices.forEach((v) => {
    const sphere = new THREE.Mesh(sphereGeo, matPrimary);
    sphere.position.copy(v);
    sphere.castShadow = true;
    group.add(sphere);
  });

  // Connecting struts between nearby vertices
  const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 10);
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const dist = vertices[i].distanceTo(vertices[j]);
      // Icosahedron edge length is ~0.79 with radius 0.75
      if (dist < 0.9) {
        const mid = new THREE.Vector3().addVectors(vertices[i], vertices[j]).multiplyScalar(0.5);
        const strut = new THREE.Mesh(strutGeo, matSecondary);
        strut.position.copy(mid);
        strut.scale.set(1, dist, 1);
        strut.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(vertices[j], vertices[i]).normalize()
        );
        strut.castShadow = true;
        group.add(strut);
      }
    }
  }

  // Pulsing central brain nucleus
  const nucleusGeo = new THREE.DodecahedronGeometry(0.3, 1);
  const nucleus = new THREE.Mesh(nucleusGeo, matCore);
  nucleus.name = 'nucleus';
  group.add(nucleus);

  group.position.y = 1.35;
  return group;
}

/**
 * Composite Artifact 5: The Feynman Monolith
 * Tapered beveled obelisk, inlaid golden circuit channels, tiered plinth, floating quantum ring.
 */
export function createFeynmanMonolithMesh(finish: MaterialFinishType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'artifact_feynman_monolith';

  const matPrimary = createArtifactMaterial(finish, 'primary');
  const matSecondary = createArtifactMaterial(finish, 'secondary');
  const matAccent = createArtifactMaterial(finish, 'accent');
  const matCore = createArtifactMaterial(finish, 'core');

  // Main Obelisk Tower (Cylinder with 4 sides creates clean tapered square obelisk)
  const obeliskGeo = new THREE.CylinderGeometry(0.32, 0.48, 1.6, 4);
  const obelisk = new THREE.Mesh(obeliskGeo, matPrimary);
  obelisk.rotation.y = Math.PI / 4;
  obelisk.castShadow = true;
  obelisk.receiveShadow = true;
  group.add(obelisk);

  // Pyramid Apex Cap
  const apexGeo = new THREE.ConeGeometry(0.32 * Math.SQRT2, 0.35, 4);
  const apex = new THREE.Mesh(apexGeo, matAccent);
  apex.position.y = 0.975;
  apex.rotation.y = Math.PI / 4;
  apex.castShadow = true;
  group.add(apex);

  // Stepped tiered base mount
  const mountGeo = new THREE.BoxGeometry(0.85, 0.12, 0.85);
  const mount = new THREE.Mesh(mountGeo, matSecondary);
  mount.position.y = -0.85;
  mount.castShadow = true;
  group.add(mount);

  // Inlaid luminous cognitive runic channels (vertical lines on each face)
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const channelGeo = new THREE.BoxGeometry(0.04, 1.2, 0.02);
    const channel = new THREE.Mesh(channelGeo, matCore);
    channel.position.set(Math.cos(angle) * 0.31, 0.05, Math.sin(angle) * 0.31);
    channel.rotation.y = angle;
    group.add(channel);
  }

  // Floating Quantum Orbit Ring
  const haloGeo = new THREE.TorusGeometry(0.72, 0.03, 16, 48);
  const halo = new THREE.Mesh(haloGeo, matAccent);
  halo.name = 'quantum_halo';
  halo.rotation.x = Math.PI / 2.3;
  halo.position.y = 0.3;
  group.add(halo);

  group.position.y = 1.35;
  return group;
}

/**
 * Composite Artifact 6: The Polymath Sphere
 * Tri-orbital nested armillary rings, central celestial sphere, cardinal nodes.
 */
export function createPolymathSphereMesh(finish: MaterialFinishType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'artifact_polymath_sphere';

  const matPrimary = createArtifactMaterial(finish, 'primary');
  const matSecondary = createArtifactMaterial(finish, 'secondary');
  const matAccent = createArtifactMaterial(finish, 'accent');
  const matCore = createArtifactMaterial(finish, 'core');

  // Ring 1: Celestial Equator
  const r1Geo = new THREE.TorusGeometry(0.85, 0.04, 16, 64);
  const r1 = new THREE.Mesh(r1Geo, matPrimary);
  r1.castShadow = true;
  r1.name = 'armillary_r1';
  group.add(r1);

  // Ring 2: Meridian Ring
  const r2Geo = new THREE.TorusGeometry(0.85, 0.04, 16, 64);
  const r2 = new THREE.Mesh(r2Geo, matSecondary);
  r2.rotation.x = Math.PI / 2;
  r2.castShadow = true;
  r2.name = 'armillary_r2';
  group.add(r2);

  // Ring 3: Oblique Ecliptic Ring
  const r3Geo = new THREE.TorusGeometry(0.85, 0.035, 16, 64);
  const r3 = new THREE.Mesh(r3Geo, matAccent);
  r3.rotation.x = Math.PI / 4;
  r3.rotation.y = Math.PI / 4;
  r3.castShadow = true;
  r3.name = 'armillary_r3';
  group.add(r3);

  // Central Celestial Sphere
  const sphereGeo = new THREE.SphereGeometry(0.38, 32, 32);
  const sphere = new THREE.Mesh(sphereGeo, matCore);
  sphere.name = 'celestial_globe';
  group.add(sphere);

  // Polar Axis Pin
  const pinGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.1, 16);
  const pin = new THREE.Mesh(pinGeo, matSecondary);
  pin.castShadow = true;
  group.add(pin);

  // Cardinal node spheres
  const nodeGeo = new THREE.SphereGeometry(0.06, 16, 16);
  const positions = [
    new THREE.Vector3(0.85, 0, 0),
    new THREE.Vector3(-0.85, 0, 0),
    new THREE.Vector3(0, 0.85, 0),
    new THREE.Vector3(0, -0.85, 0),
    new THREE.Vector3(0, 0, 0.85),
    new THREE.Vector3(0, 0, -0.85),
  ];
  positions.forEach((p) => {
    const node = new THREE.Mesh(nodeGeo, matAccent);
    node.position.copy(p);
    group.add(node);
  });

  group.position.y = 1.35;
  return group;
}

/**
 * Composite Artifact 7: The Cognitive Ascendant
 * Multi-tier floating magnetic discs, apex crystal spire, energy halo.
 */
export function createCognitiveAscendantMesh(finish: MaterialFinishType): THREE.Group {
  const group = new THREE.Group();
  group.name = 'artifact_cognitive_ascendant';

  const matPrimary = createArtifactMaterial(finish, 'primary');
  const matSecondary = createArtifactMaterial(finish, 'secondary');
  const matAccent = createArtifactMaterial(finish, 'accent');
  const matCore = createArtifactMaterial(finish, 'core');

  // Tier 1: Wide lower floating disc
  const disc1Geo = new THREE.CylinderGeometry(0.85, 0.95, 0.08, 48);
  const disc1 = new THREE.Mesh(disc1Geo, matPrimary);
  disc1.position.y = -0.55;
  disc1.castShadow = true;
  group.add(disc1);

  // Tier 2: Mid floating disc
  const disc2Geo = new THREE.CylinderGeometry(0.65, 0.72, 0.07, 48);
  const disc2 = new THREE.Mesh(disc2Geo, matSecondary);
  disc2.position.y = -0.2;
  disc2.castShadow = true;
  group.add(disc2);

  // Tier 3: Upper floating disc
  const disc3Geo = new THREE.CylinderGeometry(0.45, 0.5, 0.06, 48);
  const disc3 = new THREE.Mesh(disc3Geo, matAccent);
  disc3.position.y = 0.15;
  disc3.castShadow = true;
  group.add(disc3);

  // Crown Apex Crystal Spire
  const spireGeo = new THREE.ConeGeometry(0.24, 0.85, 6);
  const spire = new THREE.Mesh(spireGeo, matCore);
  spire.position.y = 0.7;
  spire.castShadow = true;
  spire.name = 'apex_spire';
  group.add(spire);

  // Levitating Energy Crown Ring
  const crownGeo = new THREE.TorusGeometry(0.55, 0.03, 16, 48);
  const crown = new THREE.Mesh(crownGeo, matAccent);
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 0.5;
  crown.name = 'ascendant_crown';
  group.add(crown);

  // 3 Orbiting Cognitive Satellites
  const satGroup = new THREE.Group();
  satGroup.name = 'satellites';
  const satGeo = new THREE.IcosahedronGeometry(0.08, 0);
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const sat = new THREE.Mesh(satGeo, matCore);
    sat.position.set(Math.cos(angle) * 1.05, 0, Math.sin(angle) * 1.05);
    satGroup.add(sat);
  }
  group.add(satGroup);

  group.position.y = 1.35;
  return group;
}

/**
 * Builds the full artifact mesh by type and finish.
 */
export function buildArtifactModel(
  meshType: string,
  finish: MaterialFinishType
): THREE.Group {
  switch (meshType) {
    case 'synaptic_spark':
      return createSynapticSparkMesh(finish);
    case 'memory_prism':
      return createMemoryPrismMesh(finish);
    case 'chrono_compass':
      return createChronoCompassMesh(finish);
    case 'neuro_lattice':
      return createNeuroLatticeMesh(finish);
    case 'feynman_monolith':
      return createFeynmanMonolithMesh(finish);
    case 'polymath_sphere':
      return createPolymathSphereMesh(finish);
    case 'cognitive_ascendant':
      return createCognitiveAscendantMesh(finish);
    default:
      return createSynapticSparkMesh(finish);
  }
}
