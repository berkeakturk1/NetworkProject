from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
from .face_filters import *
from .face_detector import *
from .stylize import Stylizer

app = Flask(__name__)
CORS(app)

# Initialize filters and stylizers
fd = face_detector()
ff = face_filters()
stylizers = [
    None, None, None, None,
    Stylizer('models/style1.pt'),
    Stylizer('models/style2.pt'),
    Stylizer('models/style3.pt'),
    None,
    Stylizer('models/new.pt')
]

filter_names = ["Circle Eyes", "Heart Eyes", "Cartoon", "Inverted", "Starry Night",
                "Snake Skin", "Geometric", "Van Gogh", "My Style"]

facenet_required = [0, 1, 7]


def apply_filters(image):
    results = {}
    face_args = None
    # Convert the image to OpenCV format
    nparr = np.frombuffer(image, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    for i, filter_name in enumerate(filter_names):
        processed_frame = frame.copy()
        if i in facenet_required:
            face_args = fd.pred_face_pos(processed_frame)
        if face_args or i not in facenet_required:
            if i == 0:
                processed_frame = ff.apply_circle_eyes_filter(processed_frame, *face_args)
            elif i == 1:
                processed_frame = ff.apply_heart_eyes_filter(processed_frame, *face_args)
            elif i == 2:
                processed_frame = ff.apply_cartoon_filter(processed_frame)
            elif i == 3:
                processed_frame = ff.apply_invert_filter(processed_frame)
            elif i == 4:
                processed_frame = stylizers[4].stylize(processed_frame)
            elif i == 5:
                processed_frame = stylizers[5].stylize(processed_frame)
            elif i == 6:
                processed_frame = stylizers[6].stylize(processed_frame)
            elif i == 7:
                processed_frame = stylizers[4].stylize(processed_frame)
                processed_frame = ff.apply_van_gogh_filter(processed_frame, *face_args)
            elif i == 8:
                processed_frame = stylizers[8].stylize(processed_frame)

        # Encode image to base64 for JSON response
        _, buffer = cv2.imencode('.jpg', processed_frame)
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        results[filter_name] = image_base64

    return results


@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file found"}), 400

    image_file = request.files['image']
    image_data = image_file.read()

    filters_applied = apply_filters(image_data)
    return jsonify(filters_applied)


if __name__ == '__main__':
    # Use the PORT environment variable if available, otherwise default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
