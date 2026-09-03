import urllib.request
import zipfile
import os
import sys
import shutil

NODE_URL = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
TARGET_ZIP = "node.zip"
TARGET_DIR = "nodejs"

print(f"Downloading Node.js from {NODE_URL} ...")
urllib.request.urlretrieve(NODE_URL, TARGET_ZIP)
print("Extracting Node.js zip archive ...")
with zipfile.ZipFile(TARGET_ZIP, 'r') as zip_ref:
    zip_ref.extractall(".")

if os.path.exists("node-v20.18.0-win-x64"):
    if os.path.exists(TARGET_DIR):
        shutil.rmtree(TARGET_DIR)
    os.rename("node-v20.18.0-win-x64", TARGET_DIR)

if os.path.exists(TARGET_ZIP):
    os.remove(TARGET_ZIP)

print("Node.js installation completed successfully!")
node_exe = os.path.abspath(os.path.join(TARGET_DIR, "node.exe"))
print(f"Node binary located at: {node_exe}")
