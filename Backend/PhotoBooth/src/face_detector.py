from facenet_pytorch import MTCNN
from PIL import Image
import numpy as np
import math
import cv2

from .fast_mtcnn import FastMTCNN

class face_detector:
    
    def __init__(self):
        self.mtcnn = MTCNN(image_size=160,
              margin=0,
              min_face_size=20,
              thresholds=[0.6, 0.7, 0.7], # MTCNN thresholds
              factor=0.709,
              post_process=True,
              device='cpu' # mps = Metal programming framework.
        )

        self.fast_mtcnn = FastMTCNN(
            stride=4,
            resize=1,
            margin=14,
            factor=0.6,
            keep_all=True,
            device='cpu'
        )

        self.detector = cv2.CascadeClassifier("src/models/face_filter.xml")


    def detect_faces(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        angle_R_List_ = []
        angle_L_List_ = []
        predLabelList_ = []
        tilt_angle_List_ = [] 
        landmarks_ = []
        
        rects = self.detector.detectMultiScale(
		    gray, scaleFactor=1.05, minNeighbors=5, minSize=(30, 30),
		    flags=cv2.CASCADE_SCALE_IMAGE)
        
        for (x, y, w, h) in rects:
            roi = gray[y:y+ h, x:x + w]

            face_args = self.pred_face_pos(roi)

            if face_args is None: 
                return

            (landmarks, angle_R_List, angle_L_List, tilt_angle_List, predLabelList) = face_args

            landmarks_.append(landmarks)
            tilt_angle_List_.append(tilt_angle_List)
            predLabelList_.append(predLabelList)
            angle_L_List_.append(angle_L_List)
            angle_R_List_.append(angle_R_List)

        return (landmarks_, angle_R_List_, angle_L_List_, tilt_angle_List_, predLabelList_)

    def pred_face_pos(self, image):
        # Landmarks: [Left Eye], [Right eye], [nose], [left mouth], [right mouth]

        im = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        im = Image.fromarray(im)

        bbox_, prob_, landmarks_ = self.mtcnn.detect(im, landmarks=True) 

        angle_R_List = []
        angle_L_List = []
        predLabelList = []
        tilt_angle_List = [] 


        if bbox_ is None:
            return

        for bbox, landmarks, prob in zip(bbox_, landmarks_, prob_):
            if bbox is not None: # To check if we detect a face in the image
                if prob > 0.9: # To check if the detected face has probability more than 90%, to avoid 
                    angR = self.npAngle(landmarks[0], landmarks[1], landmarks[2]) # Calculate the right eye angle
                    angL = self.npAngle(landmarks[1], landmarks[0], landmarks[2])# Calculate the left eye angle
                    angle_R_List.append(angR)
                    angle_L_List.append(angL)

                    tilt_ang = self.calculate_tilt_angle(landmarks[0], landmarks[1], landmarks[2])
                    tilt_angle_List.append(tilt_ang)

                    if ((int(angR) in range(35, 57)) and (int(angL) in range(35, 58))):
                        predLabel='Frontal'
                        predLabelList.append(predLabel)
                    else:
                        if angR < angL:
                            predLabel='Left Profile'
                        else:
                            predLabel='Right Profile'
                        predLabelList.append(predLabel)
                else:
                    print('The detected face is Less then the detection threshold')
            else:
                print('No face detected in the image')

        return (landmarks_, angle_R_List, angle_L_List, tilt_angle_List, predLabelList)
    

    def calculate_tilt_angle(self, left_eye, right_eye, nose):
        center = ((left_eye[0] + right_eye[0]) // 2, (left_eye[1] + right_eye[1]) // 2)

        x = center[0] - nose[0]
        y = center[1] - nose[1]

        angle = math.atan2(y, x)

        return -np.degrees(angle)
    
    def npAngle(self, a, b, c):
        ba = np.array(a) - np.array(b)
        bc = np.array(c) - np.array(b) 

        cosine_angle = np.dot(ba, bc)/(np.linalg.norm(ba)*np.linalg.norm(bc))
        angle = np.arccos(cosine_angle)

        return np.degrees(angle)


    def anotate(self, image, landmarks_, angle_R_, angle_L_, pred_):

        for landmarks, angle_R, angle_L, pred in zip(landmarks_, angle_R_, angle_L_, pred_):

            point1 = [int(landmarks[0][0]), int(landmarks[0][1])]
            point2 = [int(landmarks[1][0]), int(landmarks[1][1])]
            point3 = [int(landmarks[2][0]), int(landmarks[2][1])]

            for land in landmarks:
                image = cv2.circle(image, (int(land[0]), int(land[1])), 5, (0,0,255), -1)

            image = cv2.line(image, point1, point2, (255,0,0), 3)
            image = cv2.line(image, point2, point3, (255,0,0), 3)
            image = cv2.line(image, point3, point1, (255,0,0), 3)

            font = cv2.FONT_HERSHEY_SIMPLEX
            image = cv2.putText(image, f"{pred} {math.floor(angle_L)}, {math.floor(angle_R)}", (10,100), font, 1,(255,255,255),2,cv2.LINE_AA)

        return image