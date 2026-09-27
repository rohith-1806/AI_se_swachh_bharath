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
