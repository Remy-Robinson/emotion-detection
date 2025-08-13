# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import io
from PIL import Image

from yolo import YOLOFaceDetector

# ---------- Configuration ----------
YOLO_WEIGHTS = "yolov12.pt"   # path to your YOLO weights
CONF_THRES = 0.25
PORT = 5001

# ---------- Init ----------
app = Flask(__name__)
CORS(app)

detector = YOLOFaceDetector(model_path=YOLO_WEIGHTS, conf_thres=CONF_THRES)

# ---------- Endpoint ----------
@app.route("/detect_faces", methods=["POST"])
def detect_faces():
    if "frame" not in request.files:
        return jsonify({"error": "Send file under 'frame' key"}), 400

    file = request.files["frame"]
    bytes_img = file.read()

    # original image size (for frontend scaling)
    pil = Image.open(io.BytesIO(bytes_img)).convert("RGB")
    w, h = pil.size

    # run YOLO
    dets = detector.detect_from_bytes(bytes_img, return_crops=False)

    # build response
    resp = {
        "image_width": w,
        "image_height": h,
        "detections": []
    }
    for d in dets:
        resp["detections"].append({
            "box": d["box"],                 # [x1,y1,x2,y2]
            "confidence": d["confidence"],
            "class_name": d["class_name"]
            # remove crop_base64 to save bandwidth (set return_crops=True in detector if you want it)
        })

    return jsonify(resp)

if __name__ == "__main__":
    print(f"Starting YOLO Flask server on port {PORT} (YOLO weights: {YOLO_WEIGHTS})")
    app.run(host="0.0.0.0", port=PORT, debug=False)
