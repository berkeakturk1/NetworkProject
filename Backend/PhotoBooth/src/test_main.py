import cv2
import time

from face_filters import *
from face_detector import *

from stylize import Stylizer

from multiprocessing import Process, Queue

class PhotoBoot:

    def __init__(self):
        self.stylizer = Stylizer('models/style1.pt')

        self.fd = face_detector()
        self.ff = face_filters()

        self.queue = Queue()


    def detect_face(self, frame):
        face_args = self.fd.pred_face_pos(frame)

        self.queue.put(('face', face_args))
    
    def transfer_style(self, frame):
        styled_image = self.stylizer.stylize(frame)

        self.queue.put(('style', styled_image))

    def combine_face_and_style(self, face_args, image):
        combined = self.ff.apply_van_gogh_filter(image, *face_args)

        return combined


    
    def process_frame(self, frame):
        p1 = Process(target=self.detect_face, args=(frame,))
        p2 = Process(target=self.transfer_style, args=(frame,))

        p1.start()
        p2.start()

        p1.join()
        p2.join()

        face_args = None
        styled_image = None
        for _ in range(2):
            result_type, result = self.queue.get()
            if result_type == 'face':
                face_args = result
            elif result_type == 'style':
                styled_image = result

        if face_args and styled_image:
            final_frame = self.combine_face_and_style(face_args, styled_image)
            return final_frame
        
        return frame


    def run(self):
        cap = cv2.VideoCapture(0)

        fps = 0
        prev_frame_time = 0
        new_frame_time = 0

        while True:
            _, frame = cap.read()
            
            if frame is None:
                break

            new_frame_time = time.time() 
            fps = 1/(new_frame_time-prev_frame_time)
            prev_frame_time = new_frame_time

            processed_frame = self.process_frame(frame)

            cv2.putText(frame, f'FPS: {fps:.2f}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            cv2.imshow('Photob', processed_frame)

            # Exit loop if 'q' key is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()








if __name__ == "__main__":
    pb = PhotoBoot()

    pb.run()