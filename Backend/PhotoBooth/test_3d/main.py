import cv2

# Load the image
image_path = 'path_to_your_image.jpg'
image = cv2.imread(image_path)

# Convert image to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Detect faces in the grayscale image
rects = detector(gray, 1)

for (i, rect) in enumerate(rects):
    shape = predictor(gray, rect)
    for (x, y) in shape.parts():
        cv2.circle(image, (x, y), 2, (0, 255, 0), -1)

cv2.imshow('Output', image)
cv2.waitKey(0)
cv2.destroyAllWindows()