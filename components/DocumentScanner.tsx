"use client";

import Webcam from "react-webcam";
import { useCallback, useMemo, useRef, useState, ChangeEvent } from "react";

// avoid strict module mismatch for pdfjs-dist TS declarations
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
  }
  return btoa(binary);
}

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"
};

const autoCropImage = async (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(base64);

      c.width = img.width;
      c.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const data = imageData.data;

      // simple threshold to find non-white area
      let minX = c.width;
      let minY = c.height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < c.height; y += 2) {
        for (let x = 0; x < c.width; x += 2) {
          const p = (y * c.width + x) * 4;
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];
          const gray = (r + g + b) / 3;

          if (gray < 240) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (maxX <= minX || maxY <= minY) {
        return resolve(base64);
      }

      const cropWidth = maxX - minX;
      const cropHeight = maxY - minY;
      const cropCanvas = document.createElement("canvas");
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) return resolve(base64);

      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      cropCtx.drawImage(c, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const enhancedData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
      for (let i = 0; i < enhancedData.data.length; i += 4) {
        let grayLevel = (enhancedData.data[i] + enhancedData.data[i + 1] + enhancedData.data[i + 2]) / 3;
        grayLevel = (grayLevel < 100 ? 0 : grayLevel > 180 ? 255 : grayLevel);
        enhancedData.data[i] = enhancedData.data[i + 1] = enhancedData.data[i + 2] = grayLevel;
      }
      cropCtx.putImageData(enhancedData, 0, 0);

      resolve(cropCanvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

export default function DocumentScanner() {
  const webcamRef = useRef<any>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [cropped, setCropped] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [pdfText, setPdfText] = useState<string>("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOpenCv = useCallback(async () => {
    if ((window as any).cv) return (window as any).cv;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://docs.opencv.org/4.x/opencv.js";
      script.async = true;
      script.onload = () => {
        const cv = (window as any).cv;
        if (cv && cv.readyState === 4) {
          resolve(cv);
        } else {
          cv.onRuntimeInitialized = () => resolve(cv);
        }
      };
      script.onerror = () => reject(new Error("Impossible de charger OpenCV.js"));
      document.body.append(script);
    });
  }, []);

  const cropWithOpenCv = useCallback(async (base64: string): Promise<string> => {
    try {
      const cv = await loadOpenCv();
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Echec chargement image"));
        img.src = base64;
      });

      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = img.width;
      srcCanvas.height = img.height;
      const srcCtx = srcCanvas.getContext("2d");
      if (!srcCtx) return base64;
      srcCtx.drawImage(img, 0, 0);

      const src = cv.imread(srcCanvas);
      const gray = new cv.Mat();
      const edges = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
      cv.Canny(gray, edges, 75, 200);

      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let pageContour: any = null;
      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        if (area > maxArea) {
          maxArea = area;
          pageContour = cnt;
        }
      }

      if (pageContour && maxArea > 1000) {
        const rect = cv.boundingRect(pageContour);
        const cutCanvas = document.createElement("canvas");
        cutCanvas.width = rect.width;
        cutCanvas.height = rect.height;
        const cutCtx = cutCanvas.getContext("2d");
        if (cutCtx) {
          cutCtx.drawImage(srcCanvas, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
          src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
          return cutCanvas.toDataURL("image/png");
        }
      }

      src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
      return base64;
    } catch (err) {
      console.warn("OpenCV crop fallback", err);
      return base64;
    }
  }, [loadOpenCv]);

  const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const imageBase = reader.result as string;
      setCaptured(imageBase);
      setUploadedPdfName(null);
      setLoading(true);
      const cropBase = await cropWithOpenCv(imageBase);
      setCropped(cropBase);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }, [cropWithOpenCv]);

  const handlePdfUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    setUploadedPdfName(file.name);
    setCaptured(null);
    setCropped(null);
    setPdfPages([]);
    setSelectedPageIndex(0);
    setOcrText(`PDF importé : ${file.name}. Chargement des pages...`);

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as ArrayBuffer;
      const pdf = await pdfjsLib.getDocument({ data: raw }).promise;
      const pages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) continue;

        await page.render({ canvasContext: context, viewport }).promise;
        pages.push(canvas.toDataURL("image/png"));
      }

      setPdfPages(pages);
      if (pages.length) {
        setCaptured(pages[0]);
        setCropped(pages[0]);
      }
      setOcrText(`PDF chargé avec ${pages.length} pages.`);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const generateShareLink = useCallback(() => {
    const data = cropped || captured;
    if (!data) return;
    const token = Date.now().toString(36);
    const link = `${window.location.origin}/api/share?doc=${token}`;
    localStorage.setItem(`shared_${token}`, data);
    setShareLink(link);
  }, [captured, cropped]);

  const convertImageToPdf = useCallback(async () => {
    const data = cropped || captured;
    if (!data) return;
    setLoading(true);
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "image-to-pdf", image: data }),
      });
      const result = await response.json();
      if (result.success) {
        setOcrText("Conversion image->PDF réussie. Téléchargement en cours...");
        const link = document.createElement("a");
        link.href = result.result;
        link.download = "document.pdf";
        link.click();
      } else {
        setOcrText(`Erreur conversion : ${result.message}`);
      }
    } catch (err) {
      setOcrText(`Erreur conversion : ${err}`);
    } finally {
      setLoading(false);
    }
  }, [captured, cropped]);

  const mergePdfPages = useCallback(async () => {
    if (pdfPages.length === 0) return;
    setLoading(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();

      for (const pageImg of pdfPages) {
        const imgBytes = pageImg.split(",")[1];
        const imgType = pageImg.match(/^data:(image\/[^;]+);/)?.[1] || "image/png";
        const image = imgType === "image/png" ? await pdfDoc.embedPng(base64ToUint8Array(imgBytes)) : await pdfDoc.embedJpg(base64ToUint8Array(imgBytes));
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {x:0,y:0,width:image.width,height:image.height});
      }

      const output = await pdfDoc.save();
      const base64 = `data:application/pdf;base64,${uint8ArrayToBase64(output)}`;
      const link = document.createElement("a");
      link.href = base64;
      link.download = "merged.pdf";
      link.click();
      setOcrText(`PDF fusionné (${pdfPages.length} pages) téléchargé.`);
    } catch (error) {
      setOcrText(`Erreur fusion PDF : ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [pdfPages]);

  const pdfToText = useCallback(async () => {
    if (!pdfPages.length && !captured) return;
    setLoading(true);
    try {
      const pdfSource = captured || pdfPages[0];
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pdf-to-text", pdf: pdfSource }),
      });
      const result = await response.json();
      if (result.success) {
        setPdfText(result.text);
        setOcrText("Conversion PDF->Texte réussie. Voir texte extrait.");
      } else {
        setOcrText(`Erreur PDF->Texte : ${result.message}`);
      }
    } catch (err) {
      setOcrText(`Erreur PDF->Texte : ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [captured, pdfPages]);

  const pdfToWord = useCallback(async () => {
    if (!pdfPages.length && !captured) return;
    setLoading(true);
    try {
      const pdfSource = captured || pdfPages[0];
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pdf-to-word", pdf: pdfSource }),
      });
      const result = await response.json();
      if (result.success) {
        const link = document.createElement("a");
        link.href = result.word;
        link.download = "document.docx";
        link.click();
        setOcrText("Conversion PDF->Word réussie. Téléchargement en cours...");
      } else {
        setOcrText(`Erreur PDF->Word : ${result.message}`);
      }
    } catch (err) {
      setOcrText(`Erreur PDF->Word : ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [captured, pdfPages]);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    setCaptured(screenshot);
    setLoading(true);
    const crop = await autoCropImage(screenshot);
    setCropped(crop);
    setLoading(false);
  }, []);

  const ocr = useCallback(async () => {
    const source = cropped || captured;
    if (!source) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: source }),
      });
      const result = await response.json();
      if (result.success) {
        setOcrText(result.result.text || "");
      } else {
        setOcrText(`Erreur OCR : ${result.message || "unknown"}`);
      }
    } catch (error) {
      setOcrText(`Erreur serveur OCR : ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [captured, cropped]);

  const preview = useMemo(() => cropped || captured, [captured, cropped]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h3 className="text-xl font-bold mb-3">Scanner intelligent</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            videoConstraints={videoConstraints}
            className="rounded-xl border border-slate-300"
          />
          <div className="mt-3 flex gap-2 flex-wrap">
            <button onClick={capture} className="btn-primary">Capturer</button>
            <button onClick={ocr} className="btn-secondary" disabled={!preview || loading}>OCR par Tesseract</button>
            <button onClick={convertImageToPdf} className="btn-secondary" disabled={!preview || loading}>Image → PDF</button>
            <button onClick={pdfToText} className="btn-secondary" disabled={!preview || loading}>PDF → Texte</button>
            <button onClick={pdfToWord} className="btn-secondary" disabled={!preview || loading}>PDF → Word</button>
            <button onClick={generateShareLink} className="btn-secondary" disabled={!preview}>Partager</button>
          </div>
          <div className="mt-3 flex gap-2 items-center">
            <label className="btn-secondary cursor-pointer">
              Importer image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <label className="btn-secondary cursor-pointer">
              Importer PDF
              <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
            </label>
            {uploadedPdfName && <span className="text-xs text-slate-500">Uploaded: {uploadedPdfName}</span>}
          </div>
          {pdfPages.length > 0 && (
            <div className="mt-2">
              <div className="text-sm font-medium">Pages PDF importées : {pdfPages.length}</div>
              <div className="mt-1 flex gap-2 overflow-x-auto pb-2">
                {pdfPages.map((pageSrc: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => { setSelectedPageIndex(index); setCaptured(pageSrc); setCropped(pageSrc); }}
                    className={`px-2 py-1 border rounded ${selectedPageIndex === index ? "bg-brand-100 border-brand-400" : "bg-white border-slate-300"}`}
                  >
                    P{index + 1}
                  </button>
                ))}
              </div>
              <button onClick={mergePdfPages} className="btn-secondary mt-2" disabled={loading || pdfPages.length < 2}>Fusionner toutes les pages en PDF</button>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">Bord-detection, recadrage intelligent & détection de contours via OpenCV.js (WASM).</p>
        </div>

        <div>
          <h4 className="font-semibold">Aperçu</h4>
          {preview ? (
            <img src={preview} alt="Document recadré" className="w-full object-contain rounded-lg border border-slate-300" />
          ) : (
            <div className="h-64 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">Aucune capture</div>
          )}
          {shareLink && (
            <div className="mt-2 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              Partagez ce document : <a href={shareLink} className="underline" target="_blank" rel="noreferrer">{shareLink}</a>
            </div>
          )}
          {pdfText && (
            <div className="mt-2 p-2 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm">
              <strong>Texte extrait PDF :</strong>
              <pre className="whitespace-pre-wrap break-words mt-1">{pdfText}</pre>
            </div>
          )}
          <div className="mt-3 bg-slate-50 p-2 rounded-md min-h-[8rem] whitespace-pre-wrap text-sm text-slate-800">{loading ? "Traitement..." : ocrText || "Résultat OCR s’affichera ici."}</div>
        </div>
      </div>
    </div>
  );
}
