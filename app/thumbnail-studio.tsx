"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type TeamTheme = "men" | "women";

type Project = {
  id: string;
  name: string;
  logoUrl: string;
  tournamentLine1: string;
  tournamentLine2: string;
};

type Opponent = {
  id: string;
  name: string;
  logoUrl: string;
  circularFrame: boolean;
};

type LoadedImage = {
  img: HTMLImageElement;
  src: string;
  fileName?: string;
};

const WIDTH = 1920;
const HEIGHT = 1080;
const DEFAULT_PROJECT: Project = {
  id: "sample-project",
  name: "챌린지컵 샘플",
  logoUrl: "/assets/sample-tournament-logo.png",
  tournamentLine1: "대전광역시 플로어볼",
  tournamentLine2: "챌린지컵 대회",
};
const DEFAULT_OPPONENTS: Opponent[] = [
  { id: "haechis", name: "해치스 서울", logoUrl: "/assets/haechis-logo.png", circularFrame: true },
  { id: "sniper", name: "스나이퍼", logoUrl: "/assets/sniper-logo.png", circularFrame: true },
];

const readImageFromFile = (file: File): Promise<LoadedImage> =>
  new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, src, fileName: file.name });
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("이미지를 불러오지 못했습니다."));
    };
    img.src = src;
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지를 불러오지 못했습니다: ${src}`));
    img.src = src;
  });

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number },
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight) * zoom;
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const dx = box.x + (box.w - drawW) / 2 + offsetX;
  const dy = box.y + (box.h - drawH) / 2 + offsetY;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  ctx.save();
  ctx.font = `900 ${size}px Arial, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,.64)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 7;
  ctx.shadowOffsetY = 8;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLogoCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  size: number,
  frame: boolean,
) {
  ctx.save();
  if (frame) {
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2 + 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(10,10,14,.22)";
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.clip();
  drawCoverImage(ctx, img, { x: cx - size / 2, y: cy - size / 2, w: size, h: size }, 1, 0, 0);
  ctx.restore();
}

function drawThemePanel(ctx: CanvasRenderingContext2D, theme: TeamTheme) {
  const splitTop = 900;
  const splitBottom = 760;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(splitTop, 0);
  ctx.lineTo(splitBottom, HEIGHT);
  ctx.lineTo(0, HEIGHT);
  ctx.closePath();
  ctx.clip();

  const gradient = ctx.createLinearGradient(0, 0, splitTop, HEIGHT);
  if (theme === "men") {
    gradient.addColorStop(0, "#09003f");
    gradient.addColorStop(0.44, "#1b1179");
    gradient.addColorStop(1, "#070028");
  } else {
    gradient.addColorStop(0, "#7f073e");
    gradient.addColorStop(0.48, "#d20d66");
    gradient.addColorStop(1, "#590625");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, splitTop, HEIGHT);

  ctx.globalAlpha = theme === "men" ? 0.23 : 0.26;
  for (let i = -260; i < 900; i += 140) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.bezierCurveTo(i + 220, 180, i - 80, 420, i + 260, HEIGHT);
    ctx.lineWidth = 38;
    ctx.strokeStyle = theme === "men" ? "#6950ff" : "#ff6ab3";
    ctx.stroke();
  }
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#000000";
  for (let y = 0; y < HEIGHT; y += 8) {
    ctx.fillRect(0, y, splitTop, 2);
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(splitTop, 0);
  ctx.lineTo(splitBottom, HEIGHT);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(0,0,0,.44)";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(splitTop + 8, 0);
  ctx.lineTo(splitBottom + 8, HEIGHT);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.stroke();
  ctx.restore();
}

type RenderInputs = {
  canvas: HTMLCanvasElement;
  theme: TeamTheme;
  project: Project;
  opponent: Opponent;
  stageText: string;
  gamePhoto?: HTMLImageElement;
  logoImages: Record<string, HTMLImageElement>;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

function renderThumbnail({
  canvas,
  theme,
  project,
  opponent,
  stageText,
  gamePhoto,
  logoImages,
  zoom,
  offsetX,
  offsetY,
}: RenderInputs) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#f0eadb";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const splitTop = 900;
  const splitBottom = 760;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(splitTop, 0);
  ctx.lineTo(WIDTH, 0);
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.lineTo(splitBottom, HEIGHT);
  ctx.closePath();
  ctx.clip();
  if (gamePhoto) {
    drawCoverImage(ctx, gamePhoto, { x: splitBottom, y: 0, w: WIDTH - splitBottom, h: HEIGHT }, zoom, offsetX, offsetY);
  } else {
    const bg = ctx.createLinearGradient(splitBottom, 0, WIDTH, HEIGHT);
    bg.addColorStop(0, "#d9d2c2");
    bg.addColorStop(1, "#918a7d");
    ctx.fillStyle = bg;
    ctx.fillRect(splitBottom, 0, WIDTH - splitBottom, HEIGHT);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = '700 46px Arial, "Apple SD Gothic Neo", sans-serif';
    ctx.fillText("경기 사진 업로드", 1120, 540);
  }
  ctx.restore();

  drawThemePanel(ctx, theme);

  const projectLogo = logoImages[project.logoUrl];
  const vikingsLogo = logoImages["/assets/vikings-logo.png"];
  const opponentLogo = logoImages[opponent.logoUrl];

  if (projectLogo) drawLogoCircle(ctx, projectLogo, 470, 88, 165, false);
  drawText(ctx, project.tournamentLine1, 50, 345, 78);
  drawText(ctx, project.tournamentLine2, 165, 435, 78);
  drawText(ctx, stageText || "[예선 4경기]", 105, 640, 88);

  if (vikingsLogo) drawLogoCircle(ctx, vikingsLogo, 190, 865, 250, false);
  ctx.save();
  ctx.font = 'italic 900 84px Arial, "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,.65)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = 7;
  ctx.fillText("vs", 365, 895);
  ctx.restore();
  if (opponentLogo) drawLogoCircle(ctx, opponentLogo, 600, 865, 250, opponent.circularFrame);
}

export default function ThumbnailStudio() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT]);
  const [opponents, setOpponents] = useState<Opponent[]>(DEFAULT_OPPONENTS);
  const [selectedProjectId, setSelectedProjectId] = useState(DEFAULT_PROJECT.id);
  const [selectedOpponentId, setSelectedOpponentId] = useState(DEFAULT_OPPONENTS[0].id);
  const [theme, setTheme] = useState<TeamTheme>("men");
  const [stageText, setStageText] = useState("[5,6위 결정전]");
  const [gamePhoto, setGamePhoto] = useState<LoadedImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [projectLine1, setProjectLine1] = useState("대전광역시 플로어볼");
  const [projectLine2, setProjectLine2] = useState("챌린지컵 대회");
  const [projectLogoFile, setProjectLogoFile] = useState<File | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [opponentLogoFile, setOpponentLogoFile] = useState<File | null>(null);
  const [opponentCircular, setOpponentCircular] = useState(true);
  const [logoImages, setLogoImages] = useState<Record<string, HTMLImageElement>>({});
  const [status, setStatus] = useState("준비 완료");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? DEFAULT_PROJECT,
    [projects, selectedProjectId],
  );
  const selectedOpponent = useMemo(
    () => opponents.find((opponent) => opponent.id === selectedOpponentId) ?? opponents[0] ?? DEFAULT_OPPONENTS[0],
    [opponents, selectedOpponentId],
  );

  const logoUrls = useMemo(() => {
    const urls = new Set(["/assets/vikings-logo.png", selectedProject.logoUrl, selectedOpponent.logoUrl]);
    projects.forEach((project) => urls.add(project.logoUrl));
    opponents.forEach((opponent) => urls.add(opponent.logoUrl));
    return [...urls].filter(Boolean);
  }, [opponents, projects, selectedOpponent.logoUrl, selectedProject.logoUrl]);

  const refreshData = useCallback(async () => {
    try {
      const [projectRes, opponentRes] = await Promise.all([fetch("/api/projects"), fetch("/api/opponents")]);
      if (projectRes.ok) {
        const data = (await projectRes.json()) as { projects: Project[] };
        if (data.projects.length) {
          setProjects(data.projects);
          setSelectedProjectId((current) => data.projects.some((project) => project.id === current) ? current : data.projects[0].id);
        }
      }
      if (opponentRes.ok) {
        const data = (await opponentRes.json()) as { opponents: Opponent[] };
        if (data.opponents.length) {
          setOpponents(data.opponents);
          setSelectedOpponentId((current) => data.opponents.some((opponent) => opponent.id === current) ? current : data.opponents[0].id);
        }
      }
    } catch {
      setStatus("로컬 샘플 데이터로 미리보기 중");
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      logoUrls.map(async (url) => {
        try {
          return [url, await loadImage(url)] as const;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setLogoImages(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, HTMLImageElement]>));
    });
    return () => {
      cancelled = true;
    };
  }, [logoUrls]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderThumbnail({
      canvas,
      theme,
      project: selectedProject,
      opponent: selectedOpponent,
      stageText,
      gamePhoto: gamePhoto?.img,
      logoImages,
      zoom,
      offsetX,
      offsetY,
    });
  }, [gamePhoto, logoImages, offsetX, offsetY, selectedOpponent, selectedProject, stageText, theme, zoom]);

  const uploadStoredImage = async (file: File, folder: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    if (!response.ok) throw new Error("이미지 업로드에 실패했습니다.");
    const data = (await response.json()) as { url: string };
    return data.url;
  };

  const createProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!projectName.trim() || !projectLogoFile) {
      setStatus("프로젝트명과 대회 로고를 입력하세요.");
      return;
    }
    try {
      setStatus("프로젝트 저장 중");
      const logoUrl = await uploadStoredImage(projectLogoFile, "project-logos");
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          logoUrl,
          tournamentLine1: projectLine1,
          tournamentLine2: projectLine2,
        }),
      });
      if (!response.ok) throw new Error("프로젝트 저장 실패");
      const data = (await response.json()) as { project: Project };
      setProjects((items) => [data.project, ...items.filter((item) => item.id !== data.project.id)]);
      setSelectedProjectId(data.project.id);
      setProjectName("");
      setProjectLogoFile(null);
      setStatus("프로젝트 저장 완료");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "프로젝트 저장 실패");
    }
  };

  const createOpponent = async (event: FormEvent) => {
    event.preventDefault();
    if (!opponentName.trim() || !opponentLogoFile) {
      setStatus("상대팀명과 로고를 입력하세요.");
      return;
    }
    try {
      setStatus("상대팀 저장 중");
      const logoUrl = await uploadStoredImage(opponentLogoFile, "opponent-logos");
      const response = await fetch("/api/opponents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: opponentName, logoUrl, circularFrame: opponentCircular }),
      });
      if (!response.ok) throw new Error("상대팀 저장 실패");
      const data = (await response.json()) as { opponent: Opponent };
      setOpponents((items) => [data.opponent, ...items.filter((item) => item.id !== data.opponent.id)]);
      setSelectedOpponentId(data.opponent.id);
      setOpponentName("");
      setOpponentLogoFile(null);
      setStatus("상대팀 저장 완료");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "상대팀 저장 실패");
    }
  };

  const loadOpponentForEdit = (opponent: Opponent) => {
    setSelectedOpponentId(opponent.id);
    setOpponentName(opponent.name);
    setOpponentCircular(opponent.circularFrame);
    setOpponentLogoFile(null);
    setStatus("선택 상대팀을 편집 폼에 불러왔습니다.");
  };

  const updateSelectedOpponent = async () => {
    if (!opponentName.trim() && !opponentLogoFile) {
      setStatus("수정할 상대팀명 또는 로고를 입력하세요.");
      return;
    }
    try {
      setStatus("상대팀 수정 중");
      const logoUrl = opponentLogoFile
        ? await uploadStoredImage(opponentLogoFile, "opponent-logos")
        : selectedOpponent.logoUrl;
      const next = {
        ...selectedOpponent,
        name: opponentName.trim() || selectedOpponent.name,
        logoUrl,
        circularFrame: opponentCircular,
      };
      const response = await fetch(`/api/opponents/${selectedOpponent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("상대팀 수정 실패");
      setOpponents((items) => items.map((item) => item.id === selectedOpponent.id ? next : item));
      setOpponentName("");
      setOpponentLogoFile(null);
      setStatus("상대팀 수정 완료");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "상대팀 수정 실패");
    }
  };

  const deleteOpponent = async (id: string) => {
    const response = await fetch(`/api/opponents/${id}`, { method: "DELETE" });
    if (response.ok) {
      const next = opponents.filter((opponent) => opponent.id !== id);
      setOpponents(next.length ? next : DEFAULT_OPPONENTS);
      setSelectedOpponentId(next[0]?.id ?? DEFAULT_OPPONENTS[0].id);
      setStatus("상대팀 삭제 완료");
    }
  };

  const onGamePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const loaded = await readImageFromFile(file);
    if (gamePhoto) URL.revokeObjectURL(gamePhoto.src);
    setGamePhoto(loaded);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setStatus(`${file.name} 원본 bitmap 로드 완료`);
  };

  const downloadPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderThumbnail({
      canvas,
      theme,
      project: selectedProject,
      opponent: selectedOpponent,
      stageText,
      gamePhoto: gamePhoto?.img,
      logoImages,
      zoom,
      offsetX,
      offsetY,
    });
    const link = document.createElement("a");
    const safeName = `${selectedProject.name}-${stageText || "thumbnail"}`.replace(/[\\/:*?"<>|]/g, "_");
    link.download = `${safeName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    void fetch("/api/thumbnails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProject.id,
        opponentId: selectedOpponent.id,
        theme,
        stageText,
        photoName: gamePhoto?.fileName ?? null,
      }),
    });
    setStatus("1920x1080 PNG 다운로드 생성 완료");
  };

  return (
    <main className="studio-shell">
      <section className="controls" aria-label="썸네일 설정">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Seoul Vikings</p>
            <h1>경기 영상 썸네일 제작</h1>
          </div>
          <img src="/assets/vikings-logo.png" alt="서울 바이킹스" />
        </div>

        <div className="control-block">
          <label htmlFor="project">프로젝트</label>
          <select id="project" value={selectedProject.id} onChange={(event) => setSelectedProjectId(event.target.value)}>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        <form className="control-grid" onSubmit={createProject}>
          <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="새 프로젝트명" />
          <input value={projectLine1} onChange={(event) => setProjectLine1(event.target.value)} placeholder="대회명 1줄" />
          <input value={projectLine2} onChange={(event) => setProjectLine2(event.target.value)} placeholder="대회명 2줄" />
          <label className="file-button">
            <span>대회 로고</span>
            <input type="file" accept="image/*" onChange={(event) => setProjectLogoFile(event.target.files?.[0] ?? null)} />
          </label>
          <button type="submit">＋ 프로젝트 저장</button>
        </form>

        <div className="control-block">
          <label>팀 테마</label>
          <div className="segmented">
            <button className={theme === "men" ? "active" : ""} type="button" onClick={() => setTheme("men")}>남자팀</button>
            <button className={theme === "women" ? "active" : ""} type="button" onClick={() => setTheme("women")}>여자팀</button>
          </div>
        </div>

        <div className="control-block">
          <label htmlFor="stage">경기명</label>
          <input id="stage" value={stageText} onChange={(event) => setStageText(event.target.value)} placeholder="[예선 4경기]" />
        </div>

        <div className="control-block">
          <label htmlFor="opponent">상대팀</label>
          <select id="opponent" value={selectedOpponent.id} onChange={(event) => setSelectedOpponentId(event.target.value)}>
            {opponents.map((opponent) => (
              <option key={opponent.id} value={opponent.id}>{opponent.name}</option>
            ))}
          </select>
        </div>

        <form className="control-grid" onSubmit={createOpponent}>
          <input value={opponentName} onChange={(event) => setOpponentName(event.target.value)} placeholder="상대팀명" />
          <label className="file-button">
            <span>상대 로고</span>
            <input type="file" accept="image/*" onChange={(event) => setOpponentLogoFile(event.target.files?.[0] ?? null)} />
          </label>
          <label className="check-row">
            <input type="checkbox" checked={opponentCircular} onChange={(event) => setOpponentCircular(event.target.checked)} />
            원형 흰색 프레임
          </label>
          <button type="submit">＋ 상대팀 저장</button>
          <button type="button" onClick={updateSelectedOpponent}>수정 저장</button>
        </form>

        <div className="opponent-list">
          {opponents.map((opponent) => (
            <div key={opponent.id} className="opponent-row">
              <img src={opponent.logoUrl} alt="" />
              <span>{opponent.name}</span>
              <button type="button" onClick={() => loadOpponentForEdit(opponent)}>편집</button>
              <button type="button" onClick={() => deleteOpponent(opponent.id)}>삭제</button>
            </div>
          ))}
        </div>

        <div className="control-block">
          <label className="file-button main-file">
            <span>오른쪽 경기 사진 업로드</span>
            <input type="file" accept="image/*" onChange={onGamePhotoChange} />
          </label>
        </div>

        <div className="slider-grid">
          <label>Zoom <input type="range" min="1" max="2.4" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <label>X <input type="range" min="-420" max="420" step="1" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} /></label>
          <label>Y <input type="range" min="-320" max="320" step="1" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} /></label>
        </div>

        <button className="download" type="button" onClick={downloadPng}>PNG 다운로드</button>
        <p className="status">{status}</p>
      </section>

      <section className="preview-wrap" aria-label="썸네일 미리보기">
        <div className="canvas-frame">
          <canvas ref={canvasRef} aria-label="1920x1080 썸네일 미리보기" />
        </div>
      </section>
    </main>
  );
}
