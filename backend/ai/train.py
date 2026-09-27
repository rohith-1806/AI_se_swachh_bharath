import os
import json
import csv
import numpy as np
from PIL import Image

# Fix OpenMP runtime duplicate error on Windows
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')
MODEL_DIR = os.path.join(BASE_DIR, 'model')
EVAL_DIR = os.path.join(BASE_DIR, 'evaluation')

LABEL_MAP = {'clean': 0, 'garbage': 1}
INV_LABEL_MAP = {0: 'clean', 1: 'garbage'}

class GarbageCleanDataset(Dataset):
    def __init__(self, csv_file, transform=None):
        self.samples = []
        self.transform = transform
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                full_path = os.path.join(DATASET_DIR, row['image_path'])
                label_idx = LABEL_MAP[row['label'].lower().strip()]
                self.samples.append((full_path, label_idx, row['image_path'], row['label']))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label, rel_path, label_str = self.samples[idx]
        image = Image.open(path).convert('RGB')
        if self.transform:
            image = self.transform(image)
        return image, label, rel_path, label_str

def train_model():
    print("==================================================")
    print("  AI SE SWACHH BHARAT - AI MODEL TRAINING")

    print("==================================================")

    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(EVAL_DIR, exist_ok=True)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using training device: {device}")

    # Data Augmentation & Normalization
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])

    train_csv = os.path.join(DATASET_DIR, 'train.csv')
    val_csv = os.path.join(DATASET_DIR, 'validation.csv')
    test_csv = os.path.join(DATASET_DIR, 'test.csv')

    train_dataset = GarbageCleanDataset(train_csv, transform=train_transform)
    val_dataset = GarbageCleanDataset(val_csv, transform=eval_transform)
    test_dataset = GarbageCleanDataset(test_csv, transform=eval_transform)

    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False)

    print(f"Dataset sizes -> Train: {len(train_dataset)}, Validation: {len(val_dataset)}, Test: {len(test_dataset)}")

    # Load MobileNetV2 architecture with pretrained weights
    print("Initializing MobileNetV2 transfer-learning architecture...")
    weights = models.MobileNet_V2_Weights.DEFAULT
    model = models.mobilenet_v2(weights=weights)

    # Freeze base feature extractor for stable fine-tuning
    for param in model.parameters():
        param.requires_grad = False

    # Replace classifier head for 2-class prediction (clean vs garbage)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 128),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(128, 2)
    )

    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=1e-3, weight_decay=1e-4)

    epochs = 8
    best_val_acc = 0.0
    best_model_path = os.path.join(MODEL_DIR, 'garbage_clean_model.pth')

    print("\nStarting Training Pipeline...")
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels, _, _ in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        train_loss = running_loss / total
        train_acc = correct / total

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels, _, _ in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        val_loss = val_loss / val_total
        val_acc = val_correct / val_total

        print(f"Epoch [{epoch}/{epochs}] - Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.4f} | Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'model_state_dict': model.state_dict(),
                'label_map': LABEL_MAP,
                'val_acc': val_acc
            }, best_model_path)
            print(f"  --> Saved new best model checkpoint to {os.path.basename(best_model_path)}")

    print(f"\nTraining complete. Best Validation Accuracy: {best_val_acc*100:.2f}%")

    # ==================================================
    # TEST DATASET EVALUATION (UNSEEN DATA)
    # ==================================================
    print("\nEvaluating trained model on UNSEEN test dataset (test.csv)...")
    checkpoint = torch.load(best_model_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    y_true = []
    y_pred = []
    y_probs = []
    test_rows = []

    with torch.no_grad():
        for images, labels, rel_paths, orig_labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            y_true.extend(labels.numpy())
            y_pred.extend(preds.cpu().numpy())
            y_probs.extend(probs.cpu().numpy())

            for rel_path, orig_label, pred_idx, prob_vec in zip(rel_paths, orig_labels, preds.cpu().numpy(), probs.cpu().numpy()):
                pred_label = INV_LABEL_MAP[pred_idx]
                confidence = float(prob_vec[pred_idx])
                test_rows.append({
                    'image_path': rel_path,
                    'actual_label': orig_label,
                    'predicted_label': pred_label,
                    'confidence': round(confidence, 4)
                })

    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average='binary', zero_division=0)
    rec = recall_score(y_true, y_pred, average='binary', zero_division=0)
    f1 = f1_score(y_true, y_pred, average='binary', zero_division=0)
    cm = confusion_matrix(y_true, y_pred)

    print("\n=== FINAL TEST EVALUATION METRICS ===")
    print(f"Accuracy  : {acc*100:.2f}%")
    print(f"Precision : {prec*100:.2f}%")
    print(f"Recall    : {rec*100:.2f}%")
    print(f"F1-Score  : {f1*100:.2f}%")
    print("Confusion Matrix:")
    print(cm)

    # Save metrics.json
    metrics_data = {
        'model_name': 'MobileNetV2 Garbage-Clean Classifier',
        'accuracy': round(float(acc), 4),
        'precision': round(float(prec), 4),
        'recall': round(float(rec), 4),
        'f1_score': round(float(f1), 4),
        'confusion_matrix': cm.tolist(),
        'total_test_samples': len(y_true),
        'test_csv_source': 'dataset/test.csv'
    }

    metrics_path = os.path.join(EVAL_DIR, 'metrics.json')
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(metrics_data, f, indent=2)

    # Save test_results.csv
    test_results_path = os.path.join(EVAL_DIR, 'test_results.csv')
    with open(test_results_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['image_path', 'actual_label', 'predicted_label', 'confidence'])
        writer.writeheader()
        writer.writerows(test_rows)

    # Generate and save confusion_matrix.png
    plt.figure(figsize=(6, 5))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix - Garbage vs Clean AI Model')
    plt.colorbar()
    tick_marks = np.arange(2)
    plt.xticks(tick_marks, ['Clean', 'Garbage'])
    plt.yticks(tick_marks, ['Clean', 'Garbage'])

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black")

    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    cm_path = os.path.join(EVAL_DIR, 'confusion_matrix.png')
    plt.savefig(cm_path, dpi=200)
    plt.close()

    print(f"\nEvaluation files successfully saved to:")
    print(f"  Metrics JSON     : {metrics_path}")
    print(f"  Test Results CSV : {test_results_path}")
    print(f"  Confusion Matrix : {cm_path}")
    print("==================================================")

if __name__ == '__main__':
    train_model()
