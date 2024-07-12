#cs_start: mega_texture_preprocess
import PIL.Image
import math
image = PIL.Image.open('crab_nebula.png')
# Round the image width and height to multiples of 256.
image = image.crop((0, 0, math.ceil(image.width/256)*256,math.ceil(image.height/ 256)*256))
# Add a 2-pixel padding on tile edges.
padding = 2
# Each level halve the width/height, 
# hence we need log(256) levels to shrink a tile into a single pixel.
for lv in range(0,math.floor(math.log(256,2))+1):
    # How much we need to resize the original image for this level.
    resize_ratio = math.pow(2, lv)
    scaled_width = int(image.width / resize_ratio)
    scaled_height = int(image.height / resize_ratio)
    resized_image = image.resize((scaled_width, scaled_height))
    # h,v are the horizontal and vertical tile counts.
    h = math.ceil(scaled_width / 256)
    v = math.ceil(scaled_height / 256)
    for y in range(0,v):
        for x in range(0,h):
            # Crop a tile, the size of a tile is 260x260 including the padding.
            cropped_image = resized_image.crop((x*256-padding, y*256-padding, (x+1)*256+padding,(y+1)* 256+padding))
            # Save the tile into a png file.
            cropped_image.save('../crab_nebula/crab_'+str(lv)+'_'+str(y)+'_'+str(x)+'.png')
#cs_end: mega_texture_preprocess
