#!/usr/bin/env python3
"""Prepares the pictures for The Crossing (play/next/crossing). Run from anywhere.
Every source is one of Tony's own photographs in media/img. Nothing here is drawn or generated except
a seamless-tile crossfade, a paper grain for the costume card, and the crop/round masks."""
import os, sys, numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageOps
import cv2

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..','..','..'))
IMG=os.path.join(ROOT,'media','img'); OUT=os.path.join(os.path.dirname(__file__),'..','img')
os.makedirs(OUT,exist_ok=True)
def src(n): return Image.open(os.path.join(IMG,n)).convert('RGB')
def save(im,n,q=80):
    p=os.path.join(OUT,n); im.save(p,quality=q,optimize=True,progressive=True); print(n,im.size,os.path.getsize(p)//1024,'KB')

# ---- the sky and the far country: the top band of each photograph, down to its own horizon
def sky(name,crop,w=1600,out=None):
    im=src(name).crop(crop); im=im.resize((w,int(w*im.height/im.width)),Image.LANCZOS); save(im,out,78); return im
sky('sedona-bellrock-1600.jpg',(0,0,1600,560),out='sky-desert.jpg')        # Bell Rock through the dead juniper, April 2022
sky('peaks-morning-wide-2000.jpg',(0,0,2000,520),out='sky-mountains.jpg')  # the Peaks under morning cloud and mist, July 2022 (cropped above the houses)
sky('pacific-rocks-1600.jpg',(0,0,1600,560),out='sky-ocean.jpg')           # the Pacific horizon, San Diego, January 2022

# ---- ground tiles: one patch of his own ground, made seamless by the mirror crossfade
def seamless(im,n=512):
    im=im.resize((n,n),Image.LANCZOS); a=np.asarray(im).astype(np.float32)
    r=np.roll(np.roll(a,n//2,0),n//2,1)
    y,x=np.mgrid[0:n,0:n]; d=np.sqrt(((x-n/2)/(n/2))**2+((y-n/2)/(n/2))**2)
    w=np.clip(1.4-d*1.6,0,1); w=w*w*(3-2*w)                       # 1 at the center (the patch), 0 at the edges (the rolled copy, which wraps)
    o=a*w[...,None]+r*(1-w[...,None])
    return Image.fromarray(np.clip(o,0,255).astype(np.uint8))
save(seamless(src('sedona-bellrock-1600.jpg').crop((760,760,1360,1160))),'ground-desert.jpg',82)   # red earth and dry grass below Bell Rock
save(seamless(src('dune-slope-1600.jpg').crop((300,1050,900,1550))),'trail-desert.jpg',82)         # walked sand, the dune slope
save(seamless(src('peaks-meadow-evening-800.jpg').crop((180,520,620,860))),'ground-mountains.jpg',82)  # the evening meadow grass
save(seamless(src('peaks-trail-2200.jpg').crop((650,2050,1450,2850))),'trail-mountains.jpg',82)     # the trail's dirt and stones under the ponderosas

# ---- the stone in the hand, for the calm (his own hand and one stone, from IMG_1508)
def round_crop(im,box,n):
    im=im.crop(box).resize((n,n),Image.LANCZOS)
    m=Image.new('L',(n*4,n*4),0); ImageDraw.Draw(m).ellipse((0,0,n*4-1,n*4-1),fill=255); m=m.resize((n,n),Image.LANCZOS)
    im.putalpha(m); return im
st=round_crop(src('hand-stone-1400.jpg'),(330,620,1030,1320),360)
st.save(os.path.join(OUT,'stone-hand.png'),optimize=True); print('stone-hand.png',os.path.getsize(os.path.join(OUT,'stone-hand.png'))//1024,'KB')

# ---- the three distances: a round window on each place
for n,name,box in [('med-ocean','pacific-rocks-1600.jpg',(300,300,1300,1300)),('med-desert','sedona-bellrock-1600.jpg',(500,200,1300,1000)),('med-mountains','peaks-morning-wide-2000.jpg',(500,0,1500,1000))]:
    im=round_crop(src(name),box,176); im.save(os.path.join(OUT,n+'.png'),optimize=True); print(n, os.path.getsize(os.path.join(OUT,n+'.png'))//1024,'KB')

# ---- paper grain for the costume card (made here, not a photograph)
rng=np.random.default_rng(3); n=256
g=rng.normal(0,1,(n,n)).astype(np.float32)
g=cv2.GaussianBlur(g,(0,0),1.1)*0.5+cv2.GaussianBlur(g,(0,0),0.5)*0.5
g=(g-g.min())/(g.max()-g.min())
fib=rng.normal(0,1,(n,n)).astype(np.float32); fib=cv2.GaussianBlur(fib,(0,0),sigmaX=6,sigmaY=0.6)
fib=(fib-fib.min())/(fib.max()-fib.min())
v=np.clip(238+ (g-0.5)*18 + (fib-0.5)*10,0,255)
paper=np.stack([v*1.0,v*0.975,v*0.92],-1)
Image.fromarray(np.clip(paper,0,255).astype(np.uint8)).save(os.path.join(OUT,'paper.jpg'),quality=70); print('paper.jpg',os.path.getsize(os.path.join(OUT,'paper.jpg'))//1024,'KB')

# ---- the walker: cut from his own photo of a walker on the red trail (figure from behind, no face)
im=cv2.imread(os.path.join(IMG,'red-trail-walker-1600.jpg'))
rect=(380,70,470,1200)
mask=np.zeros(im.shape[:2],np.uint8); bgd=np.zeros((1,65),np.float64); fgd=np.zeros((1,65),np.float64)
cv2.grabCut(im,mask,rect,bgd,fgd,6,cv2.GC_INIT_WITH_RECT)
m=np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD),255,0).astype(np.uint8)
m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((7,7),np.uint8)); m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((11,11),np.uint8))
nlab,lab,stats,_=cv2.connectedComponentsWithStats(m); big=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]); m=np.where(lab==big,255,0).astype(np.uint8)
m=cv2.GaussianBlur(m,(0,0),1.2)
ys,xs=np.where(m>8); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
rgb=cv2.cvtColor(im,cv2.COLOR_BGR2RGB)[y0:y1+1,x0:x1+1]; a=m[y0:y1+1,x0:x1+1]
walker=Image.fromarray(np.dstack([rgb,a]).astype(np.uint8),'RGBA')
h=420; walker=walker.resize((int(walker.width*h/walker.height),h),Image.LANCZOS)
walker.save(os.path.join(OUT,'walker.png'),optimize=True); print('walker.png',walker.size,os.path.getsize(os.path.join(OUT,'walker.png'))//1024,'KB')
