"""Build stylized, geographically positioned contours from real Mapzen DEM tiles.
Optional authoring step; normal site builds use the committed GeoJSON.
Requires numpy, scipy, contourpy, Pillow. Cache defaults to /tmp/naicons-dem.
Sources and licenses: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
"""
import concurrent.futures, json, math, os, time, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
import contourpy

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(os.environ.get('NAICONS_DEM_CACHE', '/tmp/naicons-dem'))
CACHE.mkdir(parents=True, exist_ok=True)
ZOOM, TILE, COLS, ROWS = 5, 256, 12, 16
BASE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium'

def tile(xy):
    x,y=xy
    file=CACHE/f'{ZOOM}-{x}-{y}.png'
    if not file.exists():
        for attempt in range(3):
            try:
                req=urllib.request.Request(f'{BASE}/{ZOOM}/{x}/{y}.png',headers={'User-Agent':'NAIcons-terrain-export/1.0'})
                with urllib.request.urlopen(req,timeout=40) as response: file.write_bytes(response.read())
                break
            except Exception:
                if attempt==2: raise
                time.sleep(attempt+1)
    rgb=np.asarray(Image.open(file).convert('RGB'), dtype=np.float32)
    assert rgb.shape == (256,256,3)
    return x,y,rgb[:,:,0]*256+rgb[:,:,1]+rgb[:,:,2]/256-32768

height=np.zeros((ROWS*TILE,COLS*TILE), dtype=np.float32)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for i,(x,y,z) in enumerate(pool.map(tile,[(x,y) for y in range(ROWS) for x in range(COLS)])):
        height[y*TILE:(y+1)*TILE,x*TILE:(x+1)*TILE]=z
        if (i+1)%24==0: print(f'Loaded {i+1}/{COLS*ROWS} terrain tiles',flush=True)
# Smooth and reduce detail for a continent-scale illustration.
height=gaussian_filter(height, sigma=2.5)[1::2,1::2]
generator=contourpy.contour_generator(z=height, name='serial', line_type='Separate')

def simplify(points,tolerance=.65):
    keep={0,len(points)-1}; stack=[(0,len(points)-1)]
    while stack:
        a,b=stack.pop()
        if b-a<2: continue
        delta=points[b]-points[a]; denom=float(np.dot(delta,delta))
        candidates=points[a+1:b]
        if denom:
            t=np.clip((candidates-points[a])@delta/denom,0,1)
            distance=np.sum((candidates-(points[a]+t[:,None]*delta))**2,axis=1)
        else: distance=np.sum((candidates-points[a])**2,axis=1)
        j=int(np.argmax(distance))
        if distance[j]>tolerance*tolerance:
            split=a+1+j;keep.add(split);stack.extend([(a,split),(split,b)])
    return points[sorted(keep)]

features=[]
for elevation in [100,250,*range(500,4501,250)]:
    lines=[]
    for points in generator.lines(elevation):
        if len(points)<10: continue
        if np.linalg.norm(np.diff(points,axis=0),axis=1).sum()<10: continue
        coords=[]
        for x,y in simplify(points):
            wx=(x*2+1.5)/(TILE*2**ZOOM);wy=(y*2+1.5)/(TILE*2**ZOOM)
            coords.append([round(wx*360-180,3),round(math.degrees(math.atan(math.sinh(math.pi*(1-2*wy)))),3)])
        if len(coords)>2: lines.append(coords)
    features.append({'type':'Feature','properties':{'elevation':elevation},'geometry':{'type':'MultiLineString','coordinates':lines}})
result={'type':'FeatureCollection','features':features}
file=ROOT/'data/terrain-contours.json'
file.write_text(json.dumps(result,separators=(',',':'))+'\n')
print(f'Wrote {len(features)} levels, {file.stat().st_size:,} bytes',flush=True)
metadata={'source':'Mapzen Terrain Tiles on AWS','sourceURL':'https://registry.opendata.aws/terrain-tiles/','tileURL':f'{BASE}/{{z}}/{{x}}/{{y}}.png','zoom':ZOOM,'tiles':{'x':[0,COLS-1],'y':[0,ROWS-1]},'processing':'Terrarium RGB decoded to metres; Gaussian sigma 2.5 source pixels; 2x downsample; 100m, 250m, then 250m intervals; short contours omitted; simplified to 0.65 downsampled pixels. Render clipped to US, Canada, Mexico land geometry.','accessed':'2026-10-20','attributionURL':'https://github.com/tilezen/joerd/blob/master/docs/attribution.md'}
(ROOT/'data/terrain-provenance.json').write_text(json.dumps(metadata,indent=2)+'\n')
