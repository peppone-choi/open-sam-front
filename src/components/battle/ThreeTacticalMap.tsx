'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  GridHelper,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  Color,
  Vector3,
  Raycaster,
  Vector2,
  PlaneGeometry,
  MeshBasicMaterial,
} from 'three';

interface ThreeTacticalMapProps {
  width?: number;
  height?: number;
}

/**
 * three.js 기반 전술맵 샌드박스 컴포넌트
 * - 등각 카메라 비슷한 시점의 그리드 + 정육면체 유닛 3개
 * - 큐브 클릭 → 유닛 선택, 그 후 땅 클릭 → 이동 다이얼로그 → 이동
 */
export default function ThreeTacticalMap({ width = 960, height = 640 }: ThreeTacticalMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedCubeId, setSelectedCubeId] = useState<string | null>(null);
  const [moveDialog, setMoveDialog] = useState<{ cubeId: string; target: Vector3 } | null>(null);

  // three 내부에서 쓸 큐브 참조
  const cubesRef = useRef<{ [id: string]: Mesh } | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedCubeId;
  }, [selectedCubeId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 씬, 카메라, 렌더러 생성
    const scene = new Scene();
    scene.background = new Color(0x020617);

    const aspect = width / height;
    const viewSize = 12;
    const camera = new OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      100,
    );

    // isometric 느낌의 카메라 위치
    camera.position.set(10, 10, 10);
    camera.lookAt(new Vector3(0, 0, 0));

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(width, height, false);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 라이트
    const ambient = new AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dirLight = new DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(8, 15, 5);
    scene.add(dirLight);

    // 그리드 (XZ 평면)
    const gridSize = 20;
    const gridDivisions = 20;
    const grid = new GridHelper(gridSize, gridDivisions, 0x1f2937, 0x1f2937);
    grid.position.set(0, 0, 0);
    scene.add(grid);

    // 클릭용 바닥 Plane (GridHelper는 레이캐스트 대상이 아니므로 별도 메쉬 사용)
    const groundGeo = new PlaneGeometry(gridSize, gridSize);
    const groundMat = new MeshBasicMaterial({ visible: false });
    const groundMesh = new Mesh(groundGeo, groundMat);
    groundMesh.rotateX(-Math.PI / 2);
    scene.add(groundMesh);

    // 유닛용 박스 지오메트리
    const boxGeo = new BoxGeometry(1, 1, 1);

    const blueMat = new MeshStandardMaterial({ color: 0x3b82f6 });
    const redMat = new MeshStandardMaterial({ color: 0xef4444 });
    const greenMat = new MeshStandardMaterial({ color: 0x22c55e });

    const blueCube = new Mesh(boxGeo, blueMat);
    const redCube = new Mesh(boxGeo, redMat);
    const greenCube = new Mesh(boxGeo, greenMat);

    // XZ 평면 위에서 위치, Y는 높이
    blueCube.position.set(-2, 0.5, -2);
    redCube.position.set(3, 0.5, -1);
    greenCube.position.set(0, 0.5, 3);

    scene.add(blueCube, redCube, greenCube);

    cubesRef.current = {
      blue: blueCube,
      red: redCube,
      green: greenCube,
    };

    // Raycaster 설정
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([blueCube, redCube, greenCube, groundMesh]);
      if (intersects.length === 0) return;

      const first = intersects[0];

      // 큐브 클릭: 선택
      if (first.object === blueCube || first.object === redCube || first.object === greenCube) {
        const id = first.object === blueCube ? 'blue' : first.object === redCube ? 'red' : 'green';
        setSelectedCubeId(id);
        setMoveDialog(null);
        return;
      }

      // 땅 클릭: 선택된 큐브가 있을 때만 이동 다이얼로그
      if (first.object === groundMesh) {
        const currentSelected = selectedIdRef.current;
        if (!currentSelected) return;
        const point = first.point.clone();
        setMoveDialog({ cubeId: currentSelected, target: point });
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // 살짝 회전
      blueCube.rotation.y += 0.01;
      redCube.rotation.y -= 0.015;
      greenCube.rotation.y += 0.008;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const newAspect = rect.width / rect.height || aspect;
      const vSize = viewSize;

      camera.left = (-vSize * newAspect) / 2;
      camera.right = (vSize * newAspect) / 2;
      camera.top = vSize / 2;
      camera.bottom = -vSize / 2;
      camera.updateProjectionMatrix();

      renderer.setSize(rect.width, rect.height, false);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      // 정리
      scene.remove(blueCube, redCube, greenCube, grid, groundMesh, ambient, dirLight);
      boxGeo.dispose();
      blueMat.dispose();
      redMat.dispose();
      greenMat.dispose();
      groundGeo.dispose();
      groundMat.dispose();

      renderer.dispose();

      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  const handleConfirmMove = () => {
    if (!moveDialog || !cubesRef.current) return;
    const cube = cubesRef.current[moveDialog.cubeId];
    if (cube) {
      cube.position.x = moveDialog.target.x;
      cube.position.z = moveDialog.target.z;
    }
    setMoveDialog(null);
  };

  const handleCancelMove = () => {
    setMoveDialog(null);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: width,
        height,
        border: '1px solid #4b5563',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#020617',
        margin: '0 auto',
      }}
    >
      {moveDialog && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              background: '#020617',
              border: '1px solid #4b5563',
              borderRadius: 8,
              padding: '1rem 1.5rem',
              color: '#e5e7eb',
              minWidth: 240,
            }}
          >
            <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              이 위치로 이동할까요?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleCancelMove}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: '#111827',
                  color: '#e5e7eb',
                  border: '1px solid #4b5563',
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmMove}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: '#3b82f6',
                  color: '#f9fafb',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
