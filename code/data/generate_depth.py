import cv2
import torch
import urllib.request

from PIL import Image


model_type = "DPT_Large"

midas = torch.hub.load("intel-isl/MiDaS", model_type)

device = torch.device("cpu")
midas.to(device)

midas.eval()

midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")

transform = midas_transforms.dpt_transform

img = cv2.imread("portrait.jpg")
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

input_batch = transform(img).to(device)

with torch.no_grad():
    prediction = midas(input_batch)

    prediction = torch.nn.functional.interpolate(
        prediction.unsqueeze(1),
        size=img.shape[:2],
        mode="bicubic",
        align_corners=False,
    ).squeeze()

output = prediction.cpu().numpy()

im = Image.fromarray(output)
im = im.convert('RGB')
im.save("depth.png")
