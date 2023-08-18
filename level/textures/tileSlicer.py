from PIL import Image
img = Image.open((input("path to image: ")))

sx = int(input("start x: "))
sy = int(input("start y: "))
tileSize = int(input("tile size: "))
tx = int(input("grid width: "))
ty = int(input("grid height: "))
dx = int(input("separation width: "))
dy = int(input("separation height: "))
baseName = input("base name: ")
nameStartNum = int(input("start number for names: "))

w, h = img.size
idx = 0

print("starting")
for y in range(ty):
    cutY = ((tileSize + dy) * y) + sy
    for x in range(tx):
        cutX = ((tileSize + dx) * x) + sx
        crop = img.crop((cutX, cutY, (cutX+tileSize), (cutY+tileSize)))
        crop.save(baseName + str(nameStartNum + idx) + ".png")
        print("finished " + str(idx + 1) + " of " + str(tx * ty))
        idx += 1
print("done!")
