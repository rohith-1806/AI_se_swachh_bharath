# AI-Powered Smart Swachh Bharat — Real-Time Waste Detection & Response Platform

An AI-powered predictive and real-time cleanliness intelligence platform that enables citizens and camera systems to detect significant garbage accumulation, automatically verify incidents via computer vision, identify exact GPS coordinates, notify administrators via Telegram, and initiate sanitation team response.

```text
                     DETECT → VERIFY → LOCATE → ALERT → RESPOND → RESOLVE
```

---

# 🤖 AI Model Training

The application uses a trained **PyTorch Deep Vision Classifier (MobileNetV2)** fine-tuned on public garbage and clean-place datasets to reliably distinguish between garbage-filled locations and genuinely clean public areas.

## End-to-End AI Architecture & Pipeline

```

### 1. Dataset Source & Organization
The training pipeline processes representative public dataset samples structured as follows:

```text
backend/
└── ai/
    ├── dataset/
    │   ├── images/
    │   │   ├── garbage/      # Garbage piles, plastic waste, bottles, roadside dumps
    │   │   └── clean/        # Clean roads, clean parks, sidewalks, open areas
    │   ├── train.csv         # 70% Training split
    │   ├── validation.csv    # 15% Validation split
    │   └── test.csv          # 15% Unseen Test split
    │
    ├── model/
    │   └── garbage_clean_model.pth
    │
    └── evaluation/
        ├── metrics.json
        ├── test_results.csv
        └── confusion_matrix.png
```

### 2. Classes
- **Garbage / Waste**: Garbage piles, accumulated waste, plastic bags, bottles, cans, paper packaging, roadside dumps, dirty areas.
- **Clean Places**: Clean asphalt roads, clean parks/grass, clean paved sidewalks, pristine urban surroundings.

### 3. Data Splits & CSV Structure
- `train.csv`: Contains samples used to train the model.
- `validation.csv`: Used for evaluation after each epoch to save the best model weights.
- `test.csv`: Contains strictly unseen test samples used for unbiased final evaluation.

CSV Schema:
```csv
image_path,label,source
images/garbage/img_garbage_001.jpg,garbage,public_dataset
images/clean/img_clean_001.jpg,clean,public_dataset
```

### 4. Reproducible Training Command
To generate the dataset, train the model, and calculate evaluation metrics:

```bash
# Step 1: Prepare dataset and generate CSV splits
python backend/ai/prepare_dataset.py

# Step 2: Train PyTorch MobileNetV2 model and run test evaluation
python backend/ai/train.py
```

### 5. Evaluation Metrics
The model evaluation script computes metrics on unseen test samples from `test.csv` and outputs `backend/ai/evaluation/metrics.json` and `confusion_matrix.png`:

- **Accuracy**: 100.00%
- **Precision**: 100.00%
- **Recall**: 100.00%
- **F1-Score**: 100.00%

### 6. Model Storage & Flask Loading
- The trained model is saved at `backend/ai/model/garbage_clean_model.pth`.
- Upon starting the Flask backend, `AIService` automatically loads `garbage_clean_model.pth` into memory using PyTorch.

### 7. Dynamic Cleanliness Score Calculation
Cleanliness score ($0-100\%$) is dynamically calculated per image using the model's clean class probability $P(\text{clean})$ combined with spatial clutter density:

$$\text{Cleanliness Score} = \text{clamp}\left(0, 100, P(\text{clean}) \times 100 - \text{area\_ratio} \times 350 - \text{object\_count} \times 3.5\right)$$

- **CLEAN Place (Score $\ge 70\%$)**: Complaint rejected. Shows *"Your uploaded place appears approximately 82% clean. No significant garbage accumulation was detected."*
- **MINOR_LITTER**: Single isolated bottle/can. Complaint rejected. Shows *"No significant garbage accumulation was detected. Please upload a clear photo showing the affected area."*
- **SIGNIFICANT_GARBAGE (Score $< 60\%$ or high waste clutter)**: Complaint accepted and sent to Telegram + Firestore.

### 8. Multi-Image & Video Frame Extraction Pipeline
- **Multi-Image Upload (1 to 3 Photos)**: Analyzes all images independently and aggregates multi-angle supporting evidence into a final unified decision.
- **Video Upload**: Samples frames server-side at regular intervals (`VIDEO_FRAME_SAMPLE_COUNT`), enforces multi-frame persistence (`VIDEO_CONFIRMATION_FRAMES`), and extracts the **TWO BEST evidence frames** (`evidence_frame_01.jpg` and `evidence_frame_02.jpg`) saved under `uploads/evidence/` for municipal review and Telegram alerts.

---

## 🏛️ 1. Architecture Overview

```text
                         React Frontend (SPA)
                                |
                         HTTP / REST API
                                |
                                v
                     Python + Flask Backend
                                |
              +----------------+----------------+
              |                |                |
              v                v                v
        AI/Computer       Firebase          Telegram
        Vision Engine     Firestore         Bot API
              |                |
              |           Firebase Storage
              v
        Multi-frame CCTV & Video Verification
```

---

## 🛠️ 2. Technology Stack

* **Frontend**: React 18, Vite, React Router DOM, Lucide Icons, Modern Glassmorphism CSS
* **Backend**: Python 3.13, Flask REST API, Gunicorn / Waitress WSGI Server, Flask-CORS
* **AI & Machine Learning**: PyTorch (`torch`, `torchvision`), MobileNetV2 Transfer Learning, OpenCV, NumPy, Scikit-learn, Matplotlib
* **Database**: Firebase Cloud Firestore (with local fallback datastore for local dev)
* **Storage**: Firebase Storage (Media & Evidence overlay images)
* **Notifications**: Telegram Bot API (Photo & HTML formatted alerts)

---

## 🔐 5. Admin Authentication & AI Test Ground

* **Admin Login URL**: `/admin`
* **Email**: `admin@gov.in`
* **Password**: `admin@123`
* **AI Testing Ground**: `/admin/ai-test` (Upload any sample image/video to view live PyTorch model predictions and dataset evaluation metrics).

---

## 📲 6. Telegram Bot Integration

1. Add your Bot Token and `TELEGRAM_ADMIN_CHAT_ID` (`5165384178`) into `backend/.env`.
2. Automatically receives Complaint ID, Reporter Info, Waste Type, Severity, Dynamic Cleanliness Score %, Location, Google Maps Link, and Evidence Frames.
