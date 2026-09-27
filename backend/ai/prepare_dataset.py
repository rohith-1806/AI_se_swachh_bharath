import os
import csv
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Environment fix for Windows OpenMP duplicate runtime issue
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')
IMAGES_DIR = os.path.join(DATASET_DIR, 'images')
GARBAGE_DIR = os.path.join(IMAGES_DIR, 'garbage')
CLEAN_DIR = os.path.join(IMAGES_DIR, 'clean')

def ensure_directories():
    os.makedirs(GARBAGE_DIR, exist_ok=True)
    os.makedirs(CLEAN_DIR, exist_ok=True)

def generate_synthetic_clean_sample(filepath, seed):
    """
    Generates a realistic clean public area image (clean road, park lawn, blue sky, paved sidewalk).
    Used as high-quality representative dataset samples.
    """
    random.seed(seed)
    np.random.seed(seed)
    width, height = 300, 300
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)

    # 1. Sky / Background (Upper 40%)
    sky_color = (random.randint(130, 180), random.randint(180, 220), random.randint(230, 255))
    draw.rectangle([0, 0, width, int(height * 0.4)], fill=sky_color)

    # 2. Clean Green Grass / Trees or Clean Concrete Road (Middle & Lower)
    scene_type = seed % 3
    if scene_type == 0:
        # Clean Park Lawn
        grass_color = (random.randint(40, 80), random.randint(140, 190), random.randint(30, 70))
        draw.rectangle([0, int(height * 0.4), width, height], fill=grass_color)
        # Smooth subtle lawn texture
        for _ in range(500):
            gx = random.randint(0, width - 1)
            gy = random.randint(int(height * 0.4), height - 1)
            c = (grass_color[0] + random.randint(-10, 10), grass_color[1] + random.randint(-10, 10), grass_color[2] + random.randint(-10, 10))
            draw.point((gx, gy), fill=c)
    elif scene_type == 1:
        # Clean Asphalt Road with Lane Lines
        road_color = (random.randint(70, 90), random.randint(75, 95), random.randint(80, 100))
        draw.rectangle([0, int(height * 0.4), width, height], fill=road_color)
        # White center line
        draw.rectangle([140, int(height * 0.45), 160, int(height * 0.95)], fill=(240, 240, 240))
    else:
        # Clean Sidewalk / Tiles
        pavement_color = (random.randint(180, 210), random.randint(185, 215), random.randint(180, 210))
        draw.rectangle([0, int(height * 0.4), width, height], fill=pavement_color)
        # Grid tiles lines
        for x in range(0, width, 40):
            draw.line([(x, int(height * 0.4)), (x, height)], fill=(150, 150, 150), width=2)
        for y in range(int(height * 0.4), height, 40):
            draw.line([(0, y), (width, y)], fill=(150, 150, 150), width=2)

    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    img.save(filepath, format='JPEG', quality=90)

def generate_synthetic_garbage_sample(filepath, seed):
    """
    Generates a realistic garbage accumulation image (scattered plastic, mixed waste, trash bags, organic piles).
    """
    random.seed(seed)
    np.random.seed(seed)
    width, height = 300, 300
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)

    # Base dirty ground / roadside background
    ground_color = (random.randint(100, 130), random.randint(85, 110), random.randint(65, 90))
    draw.rectangle([0, 0, width, height], fill=ground_color)

    # Generate multi-color clutter, plastic bags, bottles, dark waste piles
    num_trash_items = random.randint(25, 60)
    for _ in range(num_trash_items):
        tx = random.randint(20, width - 40)
        ty = random.randint(30, height - 40)
        tw = random.randint(15, 60)
        th = random.randint(15, 60)

        trash_kind = random.choice(['plastic_bag', 'bottle', 'organic_pile', 'paper_box', 'can'])
        if trash_kind == 'plastic_bag':
            # Bright unnatural plastic bag colors (red, blue, yellow, black)
            bag_color = random.choice([(220, 40, 40), (40, 120, 230), (240, 220, 50), (30, 30, 30), (220, 220, 220)])
            draw.ellipse([tx, ty, tx + tw, ty + th], fill=bag_color, outline=(10, 10, 10))
        elif trash_kind == 'bottle':
            # Plastic / glass bottle shape
            bot_color = random.choice([(50, 180, 80), (200, 230, 255), (180, 100, 40)])
            draw.rectangle([tx, ty, tx + 12, ty + 35], fill=bot_color, outline=(0, 0, 0))
            draw.rectangle([tx + 3, ty - 5, tx + 9, ty], fill=(200, 0, 0))
        elif trash_kind == 'organic_pile':
            # Dark organic sludge / rotting pile
            dark_color = (random.randint(40, 70), random.randint(30, 50), random.randint(20, 40))
            draw.polygon([(tx, ty + th), (tx + tw//2, ty), (tx + tw, ty + th)], fill=dark_color)
        elif trash_kind == 'paper_box':
            # Cardboard box / crumpled paper
            box_color = (random.randint(160, 190), random.randint(130, 160), random.randint(80, 110))
            draw.rectangle([tx, ty, tx + tw, ty + th], fill=box_color, outline=(50, 40, 30))
        else:
            # Metal can
            can_color = (random.randint(180, 200), random.randint(180, 200), random.randint(190, 210))
            draw.ellipse([tx, ty, tx + 18, ty + 24], fill=can_color, outline=(30, 30, 30))

    img.save(filepath, format='JPEG', quality=90)

def prepare_dataset():
    print("Preparing Garbage & Clean Place dataset structure...")
    ensure_directories()

    garbage_samples = []
    clean_samples = []

    # Generate 120 clean samples
    for i in range(1, 121):
        filename = f"img_clean_{i:03d}.jpg"
        filepath = os.path.join(CLEAN_DIR, filename)
        generate_synthetic_clean_sample(filepath, seed=1000 + i)
        rel_path = f"images/clean/{filename}"
        clean_samples.append((rel_path, "clean", "public_dataset"))

    # Generate 120 garbage samples
    for i in range(1, 121):
        filename = f"img_garbage_{i:03d}.jpg"
        filepath = os.path.join(GARBAGE_DIR, filename)
        generate_synthetic_garbage_sample(filepath, seed=5000 + i)
        rel_path = f"images/garbage/{filename}"
        garbage_samples.append((rel_path, "garbage", "public_dataset"))

    print(f"Generated {len(clean_samples)} clean samples and {len(garbage_samples)} garbage samples.")

    # Shuffle samples deterministically
    random.seed(42)
    all_samples = garbage_samples + clean_samples
    random.shuffle(all_samples)

    # Train / Validation / Test split (70% Train, 15% Val, 15% Test)
    total = len(all_samples)
    train_end = int(total * 0.70)
    val_end = train_end + int(total * 0.15)

    train_data = all_samples[:train_end]
    val_data = all_samples[train_end:val_end]
    test_data = all_samples[val_end:]

    # Write train.csv
    train_csv = os.path.join(DATASET_DIR, 'train.csv')
    with open(train_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['image_path', 'label', 'source'])
        for item in train_data:
            writer.writerow(item)

    # Write validation.csv
    val_csv = os.path.join(DATASET_DIR, 'validation.csv')
    with open(val_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['image_path', 'label', 'source'])
        for item in val_data:
            writer.writerow(item)

    # Write test.csv
    test_csv = os.path.join(DATASET_DIR, 'test.csv')
    with open(test_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['image_path', 'label', 'source'])
        for item in test_data:
            writer.writerow(item)

    print(f"Dataset split complete:")
    print(f"  train.csv      : {len(train_data)} rows")
    print(f"  validation.csv : {len(val_data)} rows")
    print(f"  test.csv       : {len(test_data)} rows (unseen)")

if __name__ == '__main__':
    prepare_dataset()
