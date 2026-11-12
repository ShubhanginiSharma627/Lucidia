import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  TrophyArtifact,
  UserGamificationProfile,
  Achievement,
  MaterialFinishType,
  PedestalStyleType,
} from '../types';
import {
  detectSoftwareGl,
  createContactShadowMesh,
  createPedestalMesh,
  buildArtifactModel,
} from './three/TrophyArtifactMeshes';
import {
  INITIAL_ARTIFACTS,
  INITIAL_ACHIEVEMENTS,
  MATERIAL_SHOP_ITEMS,
  PEDESTAL_SHOP_ITEMS,
  purchaseShopItem,
} from '../services/gamification';
import {
  Trophy,
  Lock,
  Unlock,
  Sparkles,
  RotateCcw,
  Palette,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Coins,
  ShieldCheck,
  Flame,
  Info,
} from 'lucide-react';

interface TrophyVault3DProps {
  profile: UserGamificationProfile;
  onUpdateProfile: (updated: UserGamificationProfile) => void;
  achievements: Achievement[];
}

export const TrophyVault3D: React.FC<TrophyVault3DProps> = ({
  profile,
  onUpdateProfile,
  achievements,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Vault active state
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    INITIAL_ARTIFACTS[0].id
  );
  const [activeTab, setActiveTab] = useState<'artifacts' | 'finishes' | 'pedestals' | 'achievements'>('artifacts');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [purchaseNotice, setPurchaseNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // References to mutable Three.js scene elements
  const sceneRef = useRef<THREE.Scene | null>(null);
  const artifactGroupRef = useRef<THREE.Group | null>(null);
  const pedestalGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Find currently selected artifact
  const selectedArtifact =
    INITIAL_ARTIFACTS.find((a) => a.id === selectedArtifactId) || INITIAL_ARTIFACTS[0];
  const relatedAchievement = achievements.find(
    (ach) => ach.id === selectedArtifact.achievementId
  ) || INITIAL_ACHIEVEMENTS[0];
  const isSelectedUnlocked = profile.unlockedAchievements.includes(selectedArtifact.achievementId);

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer;
    let pmremGenerator: THREE.PMREMGenerator;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const isSoftware = detectSoftwareGl(renderer.getContext());
    renderer.setPixelRatio(isSoftware ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftware;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Studio Environment lighting
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment()).texture;
    scene.environment = envTexture;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 4.2);

    // Orbit Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.25, 0);
    controls.minDistance = 1.8;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // Lighting rig
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    keyLight.position.set(3, 5, 3.5);
    keyLight.castShadow = !isSoftware;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 15;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-3.5, 2.5, -2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x60a5fa, 2.5, 8);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.9);
    scene.add(hemiLight);

    // Contact Shadow Disc
    const shadowMesh = createContactShadowMesh(3.4);
    scene.add(shadowMesh);

    // Initial Pedestal
    const pedestal = createPedestalMesh(profile.activePedestal);
    scene.add(pedestal);
    pedestalGroupRef.current = pedestal;

    // Initial Artifact
    const finishToUse = isSelectedUnlocked ? profile.activeFinish : 'obsidian_titanium';
    const artifact = buildArtifactModel(selectedArtifact.meshType, finishToUse);
    scene.add(artifact);
    artifactGroupRef.current = artifact;

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Render loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      controls.update();

      // Gentle procedural artifact micro-motion
      if (artifactGroupRef.current) {
        const art = artifactGroupRef.current;
        art.position.y = 1.35 + Math.sin(elapsed * 1.5) * 0.035;

        // Animate internal sub-components
        const innerRing = art.getObjectByName('inner_ring');
        if (innerRing) innerRing.rotation.y = elapsed * 0.8;

        const pulseCore = art.getObjectByName('pulse_core');
        if (pulseCore) {
          const s = 1 + Math.sin(elapsed * 3) * 0.05;
          pulseCore.scale.set(s, s, s);
        }

        const floatRing = art.getObjectByName('float_ring');
        if (floatRing) floatRing.rotation.z = elapsed * 0.6;

        const quantumHalo = art.getObjectByName('quantum_halo');
        if (quantumHalo) quantumHalo.rotation.z = -elapsed * 0.9;

        const satellites = art.getObjectByName('satellites');
        if (satellites) satellites.rotation.y = elapsed * 1.1;

        const compassNeedle = art.getObjectByName('compass_needle');
        if (compassNeedle) compassNeedle.rotation.z = Math.sin(elapsed * 0.8) * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      // Dispose resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });

      envTexture.dispose();
      pmremGenerator.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, []); // Run once on mount

  // Sync autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update Pedestal when profile.activePedestal changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (pedestalGroupRef.current) {
      scene.remove(pedestalGroupRef.current);
      pedestalGroupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (obj.material) obj.material.dispose();
        }
      });
    }

    const newPedestal = createPedestalMesh(profile.activePedestal);
    scene.add(newPedestal);
    pedestalGroupRef.current = newPedestal;
  }, [profile.activePedestal]);

  // Update Artifact Mesh when selectedArtifactId or profile.activeFinish or unlock status changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (artifactGroupRef.current) {
      scene.remove(artifactGroupRef.current);
      artifactGroupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (obj.material) obj.material.dispose();
        }
      });
    }

    const isUnlocked = profile.unlockedAchievements.includes(selectedArtifact.achievementId);
    const finishToUse = isUnlocked ? profile.activeFinish : 'obsidian_titanium';

    const newArtifact = buildArtifactModel(selectedArtifact.meshType, finishToUse);
    scene.add(newArtifact);
    artifactGroupRef.current = newArtifact;
  }, [selectedArtifactId, profile.activeFinish, profile.unlockedAchievements, selectedArtifact]);

  // Reset Camera View
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 1.25, 0);
    }
  };

  // Handle purchasing finish
  const handleSelectFinish = (finishId: MaterialFinishType) => {
    const res = purchaseShopItem(profile, 'finish', finishId);
    if (res.success) {
      onUpdateProfile(res.updatedProfile);
      setPurchaseNotice({
        message: profile.unlockedFinishes.includes(finishId)
          ? 'Finish equipped!'
          : 'Finish unlocked & equipped!',
        type: 'success',
      });
    } else {
      setPurchaseNotice({ message: res.error || 'Unable to equip', type: 'error' });
    }
    setTimeout(() => setPurchaseNotice(null), 3500);
  };

  // Handle purchasing pedestal
  const handleSelectPedestal = (pedestalId: PedestalStyleType) => {
    const res = purchaseShopItem(profile, 'pedestal', pedestalId);
    if (res.success) {
      onUpdateProfile(res.updatedProfile);
      setPurchaseNotice({
        message: profile.unlockedPedestals.includes(pedestalId)
          ? 'Pedestal equipped!'
          : 'Pedestal unlocked & equipped!',
        type: 'success',
      });
    } else {
      setPurchaseNotice({ message: res.error || 'Unable to equip', type: 'error' });
    }
    setTimeout(() => setPurchaseNotice(null), 3500);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col bg-[#070b14] overflow-hidden select-none">
      {/* 3D WebGL Canvas Layer */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Top Floating HUD: Artifact Lore & Token Status */}
      <div className="relative z-10 p-4 md:p-6 pointer-events-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Artifact metadata card */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl p-4 md:p-5 max-w-md shadow-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Trophy className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Cognitive Artifact
            </span>
            {isSelectedUnlocked ? (
              <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Unlock className="w-3 h-3" /> Unlocked
              </span>
            ) : (
              <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {selectedArtifact.name}
          </h2>
          <p className="text-xs font-medium text-indigo-300/90 mb-2">
            {selectedArtifact.subtitle}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 md:line-clamp-3 mb-3">
            {selectedArtifact.lore}
          </p>

          {/* Achievement requirement / progress */}
          <div className="pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {relatedAchievement.title}
              </span>
              <span className="text-indigo-400 font-semibold">
                +{relatedAchievement.tokenReward} ⚡
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-1.5">
              {relatedAchievement.requirementLabel}
            </p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isSelectedUnlocked ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.round((relatedAchievement.progress || 0) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Gamification Status & Orbit Controls HUD */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Level & Token Pill */}
          <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-full px-4 py-2 shadow-xl">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
              <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{profile.tokens}</span>
              <span className="text-xs font-normal text-slate-400">Tokens</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-1.5 text-indigo-300 font-medium text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lv.{profile.level}</span>
              <span className="text-slate-400 hidden sm:inline">({profile.levelTitle})</span>
            </div>
          </div>

          {/* 3D Viewport Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                autoRotate
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetCamera}
              title="Reset View"
              className="p-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* Feedback Notice */}
          {purchaseNotice && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg animate-fade-in ${
                purchaseNotice.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
              }`}
            >
              {purchaseNotice.message}
            </div>
          )}
        </div>
      </div>

      {/* Spacer to push control dock to bottom */}
      <div className="flex-1 pointer-events-none" />

      {/* Bottom Collapsible Control Dock */}
      <div className="relative z-10 w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl transition-all duration-300">
        {/* Dock Header & Toggle */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('artifacts');
                setIsDockCollapsed(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'artifacts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Artifacts</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('finishes');
                setIsDockCollapsed(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'finishes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Metallic Finishes</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('pedestals');
                setIsDockCollapsed(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'pedestals'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pedestals</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('achievements');
                setIsDockCollapsed(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'achievements'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Milestones</span>
            </button>
          </div>

          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isDockCollapsed ? 'Expand Dock' : 'Collapse Dock'}
          >
            {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Dock Content Body */}
        {!isDockCollapsed && (
          <div className="p-3.5 max-h-48 overflow-x-auto overflow-y-hidden">
            {activeTab === 'artifacts' && (
              <div className="flex items-center gap-3 min-w-max pb-1">
                {INITIAL_ARTIFACTS.map((art) => {
                  const isUnlocked = profile.unlockedAchievements.includes(art.achievementId);
                  const isSelected = art.id === selectedArtifactId;

                  return (
                    <button
                      key={art.id}
                      onClick={() => setSelectedArtifactId(art.id)}
                      className={`relative flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isUnlocked
                            ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isUnlocked ? <Trophy className="w-5 h-5 text-amber-400" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white truncate max-w-[140px]">
                          {art.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {isUnlocked ? 'Unlocked' : 'Locked Trophy'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'finishes' && (
              <div className="flex items-center gap-3 min-w-max pb-1">
                {MATERIAL_SHOP_ITEMS.map((item) => {
                  const isUnlocked = profile.unlockedFinishes.includes(item.id);
                  const isActive = profile.activeFinish === item.id;
                  const canAfford = profile.tokens >= item.tokenCost;

                  return (
                    <div
                      key={item.id}
                      className={`relative flex flex-col justify-between p-3 rounded-xl border min-w-[200px] transition-all ${
                        isActive
                          ? 'bg-indigo-600/25 border-indigo-400 ring-1 ring-indigo-400/50'
                          : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        {isActive && (
                          <span className="text-[10px] uppercase font-bold text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-500/30">
                            Equipped
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2.5 line-clamp-1">{item.description}</p>
                      <button
                        onClick={() => handleSelectFinish(item.id)}
                        disabled={!isUnlocked && !canAfford}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                          isActive
                            ? 'bg-slate-700 text-slate-300 cursor-default'
                            : isUnlocked
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            : canAfford
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isActive ? (
                          'Active Finish'
                        ) : isUnlocked ? (
                          'Equip Finish'
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5" /> Unlock ({item.tokenCost} ⚡)
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'pedestals' && (
              <div className="flex items-center gap-3 min-w-max pb-1">
                {PEDESTAL_SHOP_ITEMS.map((item) => {
                  const isUnlocked = profile.unlockedPedestals.includes(item.id);
                  const isActive = profile.activePedestal === item.id;
                  const canAfford = profile.tokens >= item.tokenCost;

                  return (
                    <div
                      key={item.id}
                      className={`relative flex flex-col justify-between p-3 rounded-xl border min-w-[200px] transition-all ${
                        isActive
                          ? 'bg-indigo-600/25 border-indigo-400 ring-1 ring-indigo-400/50'
                          : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">{item.name}</span>
                        {isActive && (
                          <span className="text-[10px] uppercase font-bold text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-500/30">
                            Equipped
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2.5 line-clamp-1">{item.description}</p>
                      <button
                        onClick={() => handleSelectPedestal(item.id)}
                        disabled={!isUnlocked && !canAfford}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                          isActive
                            ? 'bg-slate-700 text-slate-300 cursor-default'
                            : isUnlocked
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            : canAfford
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isActive ? (
                          'Active Pedestal'
                        ) : isUnlocked ? (
                          'Equip Pedestal'
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5" /> Unlock ({item.tokenCost} ⚡)
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="flex items-center gap-3 min-w-max pb-1">
                {achievements.map((ach) => {
                  const isUnlocked = profile.unlockedAchievements.includes(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className={`p-3 rounded-xl border min-w-[240px] max-w-[280px] ${
                        isUnlocked
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-slate-800/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white truncate">{ach.title}</span>
                        <span className="text-xs font-semibold text-amber-400">+{ach.tokenReward} ⚡</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">{ach.description}</p>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${isUnlocked ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.round((ach.progress || 0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
