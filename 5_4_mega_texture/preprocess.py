import PIL.Image
import math
image = PIL.Image.open('crab_nebula.png')
image = image.crop((0, 0, math.ceil(image.width/256)*256,math.ceil(image.height/ 256)*256))
padding = 2
for lv in range(0,math.floor(math.log(256,2))+1):
    
    resize_ratio = math.pow(2, lv)
    scaled_width = int(image.width / resize_ratio)
    scaled_height = int(image.height / resize_ratio)
    print("resize ", lv, scaled_width, scaled_height)
    resized_image = image.resize((scaled_width, scaled_height))
    h = math.ceil(scaled_width / 256)
    v = math.ceil(scaled_height / 256)
    for y in range(0,v):
        for x in range(0,h):
            cropped_image = resized_image.crop((x*256-padding, y*256-padding, (x+1)*256+padding,(y+1)* 256+padding))
            cropped_image.save('../crab_nebula/crab_'+str(lv)+'_'+str(y)+'_'+str(x)+'.png')

