# yolo_detector.py
from ultralytics import YOLO
import numpy as np
from PIL import Image
import io

class YOLOFaceDetector:
    def __init__(self, model_path: str = "yolov12.pt", conf_thres: float = 0.25, device: str = None):
        """
        model_path: path to your yolov12 weights (pt, onnx, etc.)
        conf_thres: confidence threshold
        device: e.g. "cuda:0" or "cpu" (Ultralytics auto-selects if None)
        """
        # initialize model
        self.model = YOLO(model_path) if device is None else YOLO(model_path, device=device)
        self.conf_thres = conf_thres
        self.class_names = self.model.names

    def _bytes_to_rgb(self, image_bytes: bytes):
        """Return RGB numpy (H,W,3) from raw image bytes."""
        pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(pil)  # RGB
        return arr

    def detect_from_bytes(self, image_bytes: bytes, return_crops: bool = False, crop_jpeg_quality: int = 80):
        """
        Run detection on image bytes.
        return: list of detections with fields:
          {
            'box': [x1, y1, x2, y2],
            'confidence': float,
            'class_id': int,
            'class_name': str,
            'crop_base64': optional base64 JPEG string
          }
        Coordinates are in pixel space relative to the original image.
        """
        img_rgb = self._bytes_to_rgb(image_bytes)
        results = self.model(img_rgb, imgsz=640, conf=self.conf_thres)

        out = []
        for res in results:
            boxes = getattr(res, "boxes", None)
            if boxes is None:
                continue
            for box in boxes:
                # xyxy, conf, cls
                xyxy = box.xyxy[0].cpu().numpy() if hasattr(box.xyxy, "cpu") else box.xyxy[0].numpy()
                conf = float(box.conf[0].cpu().numpy()) if hasattr(box.conf, "cpu") else float(box.conf[0])
                cls_id = int(box.cls[0].cpu().numpy()) if hasattr(box.cls, "cpu") else int(box.cls[0])
                x1, y1, x2, y2 = map(int, xyxy.tolist())

                # clamp to image
                h, w = img_rgb.shape[:2]
                x1 = max(0, min(w - 1, x1))
                x2 = max(0, min(w - 1, x2))
                y1 = max(0, min(h - 1, y1))
                y2 = max(0, min(h - 1, y2))

                det = {
                    "box": [x1, y1, x2, y2],
                    "confidence": conf,
                    "class_id": cls_id,
                    "class_name": (self.class_names[cls_id] if isinstance(self.class_names, (list, tuple)) else self.class_names.get(cls_id, str(cls_id)))
                }

                if return_crops:
                    crop = img_rgb[y1:y2, x1:x2].copy()
                    if crop.size == 0:
                        det["crop_base64"] = None
                    else:
                        # convert crop to JPEG bytes then base64
                        from io import BytesIO
                        import base64
                        pil = Image.fromarray(crop)
                        buf = BytesIO()
                        pil.save(buf, format="JPEG", quality=crop_jpeg_quality)
                        det["crop_base64"] = base64.b64encode(buf.getvalue()).decode("utf-8")

                out.append(det)
        return out



