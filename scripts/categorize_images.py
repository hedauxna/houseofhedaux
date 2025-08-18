import os
import shutil
import logging
from datetime import datetime
import numpy as np
import tensorflow as tf
from keras.applications.mobilenet_v2 import preprocess_input, decode_predictions, MobileNetV2
from keras.preprocessing.image import load_img, img_to_array

# 🗓️ Update last updated timestamp
with open("/mnt/c/Users/natha/HouseOfHedaux/last_updated.txt", "w") as f:
    f.write(datetime.now().strftime("%d %B %Y, %H:%M"))

# 📝 Logging setup
log_time = datetime.now().strftime("%Y%m%d_%H%M%S")
LOG_PATH = f'/mnt/c/Users/natha/HouseOfHedaux/static/skywatch/logs/categorize_{log_time}.log'
logging.basicConfig(filename=LOG_PATH, level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# 📁 Paths
RAW_DIR = '/mnt/c/Users/natha/HouseOfHedaux/static/skywatch/raw'
SORTED_DIR = '/mnt/c/Users/natha/HouseOfHedaux/static/skywatch/sorted'

# 🧠 Categories and keyword mapping
CATEGORIES = ["bird", "plane", "cloud", "blank", "unknown", "review"]
KEYWORDS = {
    "bird": ["bird", "eagle", "falcon", "sparrow", "albatross", "parrot", "crane", "kingfisher", "woodpecker", "peacock"],
    "plane": ["airliner", "airplane", "jet", "fighter", "drone", "airship", "helicopter", "space shuttle"],
    "cloud": ["cloud", "thundercloud", "stratus", "cumulus"],
}
MIN_CONFIDENCE = 0.2  # 🔍 Confidence threshold

# 📂 Ensure sorted folders exist
for category in CATEGORIES:
    os.makedirs(os.path.join(SORTED_DIR, category), exist_ok=True)

# 🧠 Load model once
model = MobileNetV2(weights='imagenet')

# 🔍 Categorization function
def categorize_image(image_path):
    try:
        img = load_img(image_path, target_size=(224, 224))
        x = img_to_array(img)
        x = preprocess_input(x)
        x = np.expand_dims(x, axis=0)

        preds = model.predict(x)
        decoded = decode_predictions(preds, top=3)[0]

        for _, label, prob in decoded:
            label = label.lower()
            logging.info(f"Prediction: {label} ({prob:.2f})")

            if prob >= MIN_CONFIDENCE:
                for category, keywords in KEYWORDS.items():
                    if any(keyword in label for keyword in keywords):
                        return category
                return "unknown"  # confident but unmatched

        return "review"  # low confidence or no match

    except Exception as e:
        logging.error(f"Error categorizing image {image_path}: {e}")
        return "review"

# 🕒 Start log
start_time = datetime.now()
timestamp = start_time.strftime("%Y-%m-%d %H:%M:%S")
logging.info(f"🕒 Categorization run started at {timestamp}")
print(f"\n🕒 Categorization run started at {timestamp}")

# 📦 Process images
moved_count = 0
for file in os.listdir(RAW_DIR):
    raw_path = os.path.join(RAW_DIR, file)
    if not os.path.isfile(raw_path):
        continue

    category = categorize_image(raw_path)
    dest_path = os.path.join(SORTED_DIR, category, file)

    if os.path.exists(dest_path):
        continue

    try:
        shutil.move(raw_path, dest_path)
        logging.info(f"Moved {file} → {category}")
        moved_count += 1
    except Exception as e:
        logging.error(f"Failed to move {file}: {e}")

# ✅ End log
end_time = datetime.now()
duration = end_time - start_time
duration_str = str(duration).split('.')[0]
print(f"✅ Categorized {moved_count} files in {duration_str}.")
logging.info(f"✅ Categorized {moved_count} files in {duration_str}.")