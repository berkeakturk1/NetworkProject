import numpy as np
import math
import cv2

class face_filters:
    heart_image = None
    circle_image = None
    smiley_image = None

    def __init__(self):
        self.heart_image = cv2.imread("src/filter_images/heart.png", cv2.IMREAD_UNCHANGED)
        self.circle_image = cv2.imread("src/filter_images/circle.png", cv2.IMREAD_UNCHANGED)
        self.smiley_image = cv2.imread("src/filter_images/mouth.png", cv2.IMREAD_UNCHANGED)

        self.van_gogh_left_eye = cv2.imread("src/filter_images/vangogh/left_eye.png", cv2.IMREAD_UNCHANGED)
        self.van_gogh_right_eye = cv2.imread("src/filter_images/vangogh/right_eye.png", cv2.IMREAD_UNCHANGED)
        self.van_gogh_nose = cv2.imread("src/filter_images/vangogh/nose.png", cv2.IMREAD_UNCHANGED)
        self.van_gogh_mouth = cv2.imread("src/filter_images/vangogh/mouth.png", cv2.IMREAD_UNCHANGED)


    def warp_angle(self, image, alpha, beta, gamma, dx, dy, dz, f):
        """
        image: the image that you want rotated.
        alpha: the rotation around the x axis
        beta: the rotation around the y axis
        gamma: the rotation around the z axis (basically a 2D rotation)
        dx: translation along the x axis
        dy: translation along the y axis
        dz: translation along the z axis (distance to the image)
        f: focal distance (distance between camera and image, a smaller number exaggerates the effect)
        """

        alpha = np.deg2rad(alpha)
        beta = np.deg2rad(beta)
        gamma = np.deg2rad(gamma)

        w, h, _ = image.shape

        A1 = np.array([
            [1, 0, -w/2],
            [0, 1, -h/2],
            [0, 0,    0],
            [0, 0,    1]
        ])

        RX = np.array([
            [1,          0,           0, 0],
            [0, math.cos(alpha), -math.sin(alpha), 0],
            [0, math.sin(alpha),  math.cos(alpha), 0],
            [0,          0,           0, 1],
        ])

        RY = np.array([
            [math.cos(beta), 0, -math.sin(beta), 0],
            [0, 1, 0, 0],
            [math.sin(beta), 0, math.cos(beta), 0],
            [0, 0, 0, 1],
        ])

        RZ = np.array([
            [math.cos(gamma), -math.sin(gamma), 0, 0],
            [math.sin(gamma),  math.cos(gamma), 0, 0],
            [0,          0,           1, 0],
            [0,          0,           0, 1]
        ])

        R = RX.dot(RY).dot(RZ)

        T = np.array([
            [1, 0, 0, dx],
            [0, 1, 0, dy],
            [0, 0, 1, dz],
            [0, 0, 0, 1]
        ])


        A2 = np.array([
            [f, 0, w/2, 0],
            [0, f, h/2, 0],
            [0, 0,   1, 0]
        ])

        trans = A2.dot(T.dot(R.dot(A1)))

        warped = cv2.warpPerspective(image, trans,(image.shape[1],image.shape[0]), cv2.INTER_LANCZOS4)

        return warped
    
    def overlay_w_alpha(self, img, overlay, x, y):
        overlay_h, overlay_w, _ = overlay.shape

        img_h, img_w, _ = img.shape

        if x >= img_w or x <= 0 or y >= img_h or y <= 0:
            return img

        start_x = max(x, 0)
        start_y = max(y, 0)
        end_x = min(x + overlay_w, img_w)
        end_y = min(y + overlay_h, img_h)

        overlay_start_x = max(0, -x)
        overlay_start_y = max(0, -y)
        overlay_end_x = overlay_start_x + (end_x - start_x)
        overlay_end_y = overlay_start_y + (end_y - start_y)

        overlay_cropped = overlay[overlay_start_y:overlay_end_y, overlay_start_x:overlay_end_x]
        overlay_color = overlay_cropped[:, :, 0:3]
        overlay_alpha = overlay_cropped[:, :, 3] / 255
        alpha_mask = np.dstack((overlay_alpha, overlay_alpha, overlay_alpha))

        roi = img[start_y:end_y, start_x:end_x]

        composite = roi * (1 - alpha_mask) + overlay_color * alpha_mask
        img[start_y:end_y, start_x:end_x] = composite

        return img

    def apply_circle_eyes_filter(self, image, landmarks_, angle_r_, angle_l_, tilt_angle_, pred_):
        o_circle_w, o_circle_h, _ = self.circle_image.shape
        o_mouth_w, o_mouth_h, _ = self.smiley_image.shape

        eye_mul = 0.8

        for landmarks, angle_r, angle_l, tilt_angle, pred in zip(landmarks_, angle_r_, angle_l_, tilt_angle_, pred_):
            left_eye    = [int(landmarks[0][0]), int(landmarks[0][1])]
            right_eye   = [int(landmarks[1][0]), int(landmarks[1][1])]
            nose        = [int(landmarks[2][0]), int(landmarks[2][1])]
            left_mouth  = [int(landmarks[3][0]), int(landmarks[3][1])]
            right_mouth = [int(landmarks[4][0]), int(landmarks[4][1])]

            d = math.sqrt((left_eye[0] - right_eye[0]) ** 2 + (left_eye[1] - right_eye[1]) ** 2)

            circle_w = int(d)
            circle_h = int((o_circle_h / o_circle_w) * circle_w)

            circle_resized = cv2.resize(self.circle_image, (int(circle_w * eye_mul), int(circle_h * eye_mul)))

            # Left eye
            left_circle_y = left_eye[1] - int(eye_mul * circle_h)//2
            left_circle_x = left_eye[0] - int(eye_mul * circle_w)//2

            warped = self.warp_angle(circle_resized, 0, 45 - angle_l, 0, 0, 0, -200, 200)
            image = self.overlay_w_alpha(image, warped, left_circle_x, left_circle_y)

            # Right eye
            right_circle_y = right_eye[1] - int(eye_mul * circle_h)//2
            right_circle_x = right_eye[0] - int(eye_mul * circle_w)//2

            warped = self.warp_angle(circle_resized, 0, 45 - angle_r, 0, 0, 0, -200, 200)
            image = self.overlay_w_alpha(image, warped, right_circle_x, right_circle_y)

            # Mouth
            center_mouth = ((left_mouth[0] + right_mouth[0]) // 2, (left_mouth[1] + right_mouth[1]) // 2)

            d = math.sqrt((left_mouth[0] - right_mouth[0]) ** 2 + (left_mouth[1] - right_mouth[1]) ** 2)

            mouth_w = int(d * 1.2) 
            mouth_h = int((o_mouth_h / o_mouth_w) * mouth_w)

            mouth_resized = cv2.resize(self.smiley_image, (int(mouth_w * 0.9), int(mouth_h * 0.9)))

            mouth_x = center_mouth[0] - int(0.9 * mouth_w) // 2
            mouth_y = center_mouth[1] - int(0.9 * mouth_h) // 2

            warped = self.warp_angle(mouth_resized, 0, 45 - (angle_r + angle_l) // 2, 180, 0, 0, -200, 200) # 270 - tilt_angle
            image = self.overlay_w_alpha(image, warped, mouth_x, mouth_y)

        return image
    
    def apply_heart_eyes_filter(self, image, landmarks_, angle_r_, angle_l_, tilt_angle_, pred_):
        o_heart_w, o_heart_h, _ = self.heart_image.shape

        eye_mul = 0.5

        for landmarks, angle_r, angle_l, tilt_angle, pred in zip(landmarks_, angle_r_, angle_l_, tilt_angle_, pred_):
            left_eye    = [int(landmarks[0][0]), int(landmarks[0][1])]
            right_eye   = [int(landmarks[1][0]), int(landmarks[1][1])]
            nose        = [int(landmarks[2][0]), int(landmarks[2][1])]
            left_mouth  = [int(landmarks[3][0]), int(landmarks[3][1])]
            right_mouth = [int(landmarks[4][0]), int(landmarks[4][1])]

            d = math.sqrt((left_eye[0] - right_eye[0]) ** 2 + (left_eye[1] - right_eye[1]) ** 2)

            heart_w = int(d * 1.6)
            heart_h = int((o_heart_h / o_heart_w) * heart_w)

            heart_resized = cv2.resize(self.heart_image, (int(heart_w * eye_mul), int(heart_h * eye_mul)))

            # Left eye
            left_heart_y = left_eye[1] - int(eye_mul * heart_h)//2
            left_heart_x = left_eye[0] - int(eye_mul * heart_w)//2

            warped = self.warp_angle(heart_resized, 0, 45 - angle_l, 180, 0, 0, -200, 200) # 270 - tilt_angle
            image = self.overlay_w_alpha(image, warped, left_heart_x, left_heart_y)

            # Right eye
            right_heart_y = right_eye[1] - int(eye_mul * heart_h)//2
            right_heart_x = right_eye[0] - int(eye_mul * heart_w)//2

            warped = self.warp_angle(heart_resized, 0, 45 - angle_r, 180, 0, 0, -200, 200) # 270 - tilt_angle
            image = self.overlay_w_alpha(image, warped, right_heart_x, right_heart_y)

        return image
    

    def apply_van_gogh_filter(self, image, landmarks_, angle_r_, angle_l_, tilt_angle_, pred_):
        # TODO calculate image offsets
        # TODO calculate warp arguments
        # TODO write a function for resizing warping and overlaying an image
        # TODO create a seperate class for each filter and inherit
        # TODO problem with tilt angle warp

        o_left_eye_w, o_left_eye_h, _ = self.van_gogh_left_eye.shape
        o_right_eye_w, o_right_eye_h, _ = self.van_gogh_right_eye.shape
        o_nose_w, o_nose_h, _ = self.van_gogh_nose.shape
        o_mouth_w, o_mouth_h, _ = self.van_gogh_mouth.shape

        eye_mul = 0.8

        for landmarks, angle_r, angle_l, tilt_angle, pred in zip(landmarks_, angle_r_, angle_l_, tilt_angle_, pred_):
            left_eye    = [int(landmarks[0][0]), int(landmarks[0][1])]
            right_eye   = [int(landmarks[1][0]), int(landmarks[1][1])]
            nose        = [int(landmarks[2][0]), int(landmarks[2][1])]
            left_mouth  = [int(landmarks[3][0]), int(landmarks[3][1])]
            right_mouth = [int(landmarks[4][0]), int(landmarks[4][1])]

            d = math.sqrt((left_eye[0] - right_eye[0]) ** 2 + (left_eye[1] - right_eye[1]) ** 2)

            eye_w = int(d)
            eye_h = int((o_left_eye_h / o_left_eye_w) * eye_w)

            left_eye_resized = cv2.resize(self.van_gogh_left_eye, (int(eye_h * eye_mul), int(eye_w * eye_mul)))
            right_eye_resized = cv2.resize(self.van_gogh_right_eye, (int(eye_h * eye_mul), int(eye_w * eye_mul)))

            # Left eye
            left_eye_y = left_eye[1] - int(eye_mul * eye_h)//2 + 20
            left_eye_x = left_eye[0] - int(eye_mul * eye_w)//2 - 20

            warped = self.warp_angle(left_eye_resized, 0, 45 - angle_l, 180, 0, 0, -200, 200)
            image = self.overlay_w_alpha(image, warped, left_eye_x, left_eye_y)

            # Right eye
            right_eye_y = right_eye[1] - int(eye_mul * eye_h)//2 + 20
            right_eye_x = right_eye[0] - int(eye_mul * eye_w)//2 - 20

            warped = self.warp_angle(right_eye_resized, 0, 45 - angle_r, 180, 0, 0, -200, 200)
            image = self.overlay_w_alpha(image, warped, right_eye_x, right_eye_y)

            # Mouth
            center_mouth = ((left_mouth[0] + right_mouth[0]) // 2, (left_mouth[1] + right_mouth[1]) // 2)

            d = math.sqrt((left_mouth[0] - right_mouth[0]) ** 2 + (left_mouth[1] - right_mouth[1]) ** 2)

            mouth_w = int(d * 2) 
            mouth_h = int((o_mouth_h / o_mouth_w) * mouth_w)

            mouth_resized = cv2.resize(self.van_gogh_mouth, (int(mouth_w * 0.9), int(mouth_h * 0.9)))

            mouth_x = center_mouth[0] - int(0.9 * mouth_w) // 2
            mouth_y = center_mouth[1] - int(0.9 * mouth_h) // 2  + mouth_h // 4

            warped = self.warp_angle(mouth_resized, 0, 45 - (angle_r + angle_l) // 2, 180, 0, 0, -200, 200)
            image = self.overlay_w_alpha(image, warped, mouth_x, mouth_y)

            # Nose
            d = math.sqrt((nose[0] - right_eye[0]) ** 2 + (nose[1] - right_eye[1]) ** 2)

            nose_h = int(d)
            nose_w = int((o_nose_w / o_nose_h) * nose_h)

            nose_resized = cv2.resize(self.van_gogh_nose, (int(nose_h * 0.9), int(nose_w * 0.9)))

            nose_y = nose[1] - int(0.9 * nose_h)//2 - 20
            nose_x = nose[0] - int(0.9 * nose_w)//2 + 20

            warped = self.warp_angle(nose_resized, 0, 45 - angle_r, 180, 0, 0, -200, 200)
            image = self.overlay_w_alpha(image, warped, nose_x, nose_y)

        return image
    

    def apply_cartoon_filter(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        smooth = cv2.medianBlur(gray, ksize=5)

        edges = cv2.adaptiveThreshold(smooth, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)

        kernel = np.ones((3,3), np.uint8)
        dilated_edges = cv2.dilate(255 - edges, kernel, iterations=1)

        filtered = cv2.bilateralFilter(src=image, d=9, sigmaColor=300, sigmaSpace=300)

        cartoon = cv2.bitwise_and(filtered, filtered, mask=255 - dilated_edges)

        return cartoon
    
    def apply_invert_filter(self, image):
        return 255 - image