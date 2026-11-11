import os
import shutil

root_dir = r'f:/ab/frontend'
public_dir = r'f:/ab/frontend/public'

if not os.path.exists(public_dir):
    os.makedirs(public_dir)

extensions = ('.png', '.jpg', '.jpeg', '.webp', '.mp4')

for filename in os.listdir(root_dir):
    if filename.lower().endswith(extensions):
        src = os.path.join(root_dir, filename)
        dst = os.path.join(public_dir, filename)
        try:
            shutil.move(src, dst)
            print(f"Moved: {filename}")
        except Exception as e:
            print(f"Error moving {filename}: {e}")
