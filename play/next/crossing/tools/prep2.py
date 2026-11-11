#!/usr/bin/env python3
"""Second pass of pictures for The Crossing (play/next/crossing): the layered scenes.
Every source is one of the site's own photographs in media/img. Nothing here is drawn or generated:
only crops, resizes, a soft alpha fade along the top of each near layer, and a cleaner cut of the walker.
Needs Pillow and numpy only. Run from anywhere."""
import os, numpy as np
from PIL import Image

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..','..','..'))
IMG=os.path.join(ROOT,'media','img'); OUT=os.path.join(os.path.dirname(__file__),'..','img')
os.makedirs(OUT,exist_ok=True)
def src(n): return Image.open(os.path.join(IMG,n)).convert('RGB')
def report(n): print('%-22s %6d KB'%(n,os.path.getsize(os.path.join(OUT,n))//1024))

def far(name,out,crop=None,w=1600,q=74):
    """A whole place, the far layer: sky and the country, resized to w wide."""
    im=src(name)
    if crop: im=im.crop(tuple(int(c*s) for c,s in zip(crop,(im.width,im.height,im.width,im.height))))
    im=im.resize((w,round(w*im.height/im.width)),Image.LANCZOS)
    im.save(os.path.join(OUT,out),quality=q,optimize=True,progressive=True); report(out); return im

def near(name,out,top,w=1400,q=74):
    """The ground close by, the near layer: the photograph from `top` (0..1) down. The page fades its top edge
    into the far layer with a plain CSS gradient mask, so one plate fits a phone and a laptop alike."""
    im=src(name); y0=int(im.height*top); im=im.crop((0,y0,im.width,im.height))
    im=im.resize((w,round(w*im.height/im.width)),Image.LANCZOS)
    im.save(os.path.join(OUT,out),quality=q,optimize=True,progressive=True); report(out); return im

# ---- the door, and the story: dusk and night
far('peaks-lake-sunset-2000.jpg','far-home.jpg')                 # the Peaks across the lake at sunset
far('fire-moon-1600.jpg','far-night.jpg',w=1200)                 # a fire in the dark meadow under the moon
near('fire-circle-1600.jpg','near-fire.jpg',0.40,w=1100)    # the fire up close, for the wisdom

# ---- the desert: cloud over the red buttes, and a walked sand road in front
far('sedona-sunset-2200.jpg','far-desert.jpg',crop=(0,0,1,0.78)) # cropped above the slab in the foreground
near('sand-road-1600.jpg','near-desert.jpg',0.34)

# ---- the mountains: the trail under the ponderosas toward the Peaks, and the evening meadow in front
far('peaks-trail-2200.jpg','far-mountains.jpg',w=1500,q=72)
near('peaks-meadow-evening-1400.jpg','near-mountains.jpg',0.50)

# ---- the ocean: the long beach under the cliff, and the dark rocks and surf in front
far('pacific-torrey-1400.jpg','far-ocean.jpg',w=1400,q=72)
near('pacific-rocks-1600.jpg','near-ocean.jpg',0.58)

# ---- the walker, cut cleaner: the red ground that came with the first cut is taken out below the pack
w=Image.open(os.path.join(OUT,'walker.png')).convert('RGBA'); a=np.asarray(w).astype(np.float32)
r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
ground=(r>110)&(r>g+12)&(g>b+6)&(r-b>45)          # the red-tan earth
ys=np.arange(a.shape[0])[:,None]; ground&=(ys>a.shape[0]*0.50)   # only below the pack (the arm and neck stay)
al=np.where(ground,0,al)
# soften the edge of what remains
from PIL import ImageFilter
m=Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
w.putalpha(m); w.save(os.path.join(OUT,'walker.png'),optimize=True); report('walker.png')
