import os
import re

root_dir = r"c:\Users\david\OneDrive - Middlesex University\Apps\unilu-geology-login\UI_UNILU\src"
pattern = re.compile(r"@\d+\.\d+\.\d+")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = pattern.sub("", content)
            
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Fixed: {path}")
