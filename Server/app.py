from flask import Flask, request, jsonify
from keras.models import load_model
from PIL import Image
import numpy as np
import io
from ultralytics import YOLO

app = Flask(__name__)

# Loading the ResNet50V2 model
model_path = 'resnet50v2_accuracy-89.h5'  
resnet_model = load_model(model_path)

# Define the class names for ResNet50V2
class_names = [
    '1000Rs', '1000Rsback', '100Rs', '100Rsback', '10Rs', '10Rsback',
    '20Rs', '20Rsback', '5000Rs', '5000Rsback', '500Rs', '500Rsback',
    '50Rs', '50Rsback'
]

# Load the YOLO model
yolo_model = YOLO("yolov8n.pt")  # Load a pretrained model

@app.route('/hello', methods=['GET'])
def hello():
    return 'Hello, World!'

@app.route('/currencyprediction', methods=['POST'])
def currencyprediction():
    # Check if the request contains a file
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    try:
        # Convert image to bytes and open with PIL
        image_data = file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Preprocess the image
        image = image.resize((224, 224))  # Resize to match the model input
        image_array = np.array(image)  # Convert to NumPy array
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension
        image_array = image_array / 255.0  # Normalize pixel values
        
        # Perform inference
        predictions = resnet_model.predict(image_array)
        max_confidence = np.max(predictions)
        predicted_class = class_names[np.argmax(predictions)]
        
        # Apply threshold
        if max_confidence < 0.5:
            return jsonify({'predictions': 'No note detected'})
        
        # Return the prediction
        return jsonify({'predictions': predicted_class})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    # Check if the request contains a file
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    try:
        # Perform object detection on the image
        image_data = file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Assume `yolo_model` is the YOLO model loaded previously
        results = yolo_model(image)
        
        names_array = []
        names = yolo_model.names
        
        # Iterate through the results
        for r in results:
            for box in r.boxes:
                if box.conf <= 0.45:
                    continue  # Skip boxes with confidence less than 0.4
                names_array.append(names[int(box.cls)])
        
        # Check if any names were added
        if not names_array:
            return jsonify({'predictions': ''})
        
        # Return the predictions as JSON response
        return jsonify({'predictions': names_array})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


# from flask import Flask, request, jsonify
# from inference_sdk import InferenceHTTPClient
# from PIL import Image
# import io
# from ultralytics import YOLO
# from flask import jsonify

# app = Flask(__name__)

# CLIENT = InferenceHTTPClient(
#     api_url="https://classify.roboflow.com",
#     api_key="y5O5K3Tvyj7jS6zhNhAr"
# )
# DollarCLIENT = InferenceHTTPClient(
#     api_url="https://detect.roboflow.com",
#     api_key="y5O5K3Tvyj7jS6zhNhAr"
# )


# # Load the YOLO model
# model = YOLO("yolov8n.pt")  # Load a pretrained model

# @app.route('/hello', methods=['GET'])
# def hello():
#     return 'Hello, World!'


# @app.route('/currencyprediction', methods=['POST'])
# def currencyprediction():
#     # Check if the request contains a file
#     file = request.files['file']
    
#     # Convert image to bytes
#     image_data = file.read()
#     image = Image.open(io.BytesIO(image_data))

#     # Perform inference using the PKR model
    
#     usresult = DollarCLIENT.infer(image, model_id="usd-money/2")
#     classes = [prediction['class'] for prediction in usresult['predictions']]
#     confidences = [float(prediction['confidence']) for prediction in usresult['predictions']]
#     any_greater_than_50 = any(confidence > 50 for confidence in confidences)
#     print(classes)
#     print(any_greater_than_50)
#     print("confidence")
#     print(confidences)
#     if confidences:  # Check if confidences is not empty
#      print(confidences[0])
#     # Check if the predicted classes are not "other"
#     if confidences and confidences[0]>0.5:
#         print("inside")
#         print(classes)

#         return jsonify({'classes': classes})
#     else:
#         # Perform inference using the USD model
#         pkrresult = CLIENT.infer(image, model_id="pcs-d_app/1")
#         predicted_classes = pkrresult.get('predicted_classes', [])
#         print(predicted_classes)
#         # Return the classes from the USD model
#         return jsonify({'classes': predicted_classes})


# @app.route('/predict', methods=['POST'])
# def predict():
#     # Check if the request contains a file
#     file = request.files['file']
#     # Perform object detection on the image
#     image_data = file.read()
#     image = Image.open(io.BytesIO(image_data))

#     results = model(image)

#     # Initialize an empty list to store the predicted class names
#     names_array = []
#     names = model.names
#     # Iterate through the results
#     for r in results:
#         for c in r.boxes.cls:
#             # Append the value of names[int(c)] to the names_array
#             names_array.append(names[int(c)])

#     # Return the predictions as JSON response
#     return jsonify({'predictions': names_array})

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, debug=True)