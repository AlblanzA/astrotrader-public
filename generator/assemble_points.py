import os, shutil, sys
G='/home/claude/media/generator'; C='/home/claude/media/carousel'
pts=sys.argv[1].split(','); langs=sys.argv[2].split(',')
for p in pts:
    for L in langs:
        d=f'{C}/{p}/{L}'; os.makedirs(d,exist_ok=True)
        for n in range(1,13): shutil.copy(f'{G}/out/serie/B_{p}_casa{n}_{L}.jpg', f'{d}/{n:02d}.jpg')
        shutil.copy(f'{G}/out/serie/A_{p}_{L}_ig.jpg', f'{d}/13.jpg')
        shutil.copy(f'{G}/endcard/out/endcard/{p}/{L}/14.jpg', f'{d}/14.jpg')
print('ok')
