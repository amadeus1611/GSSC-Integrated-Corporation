#!/usr/bin/env python3
"""Fig. 2, the Instrument: model, light and render the compass as a scroll-scrubbed film sequence.

Runs on Blender's Python module (pip install bpy==4.2.0, Python 3.11):

    python build_compass.py                  # save compass.blend, render every frame
    python build_compass.py --test 0,40,107  # render only these frames, small, for art direction
    python build_compass.py --frames 0-53    # render a range (split the work across processes)
    python build_compass.py --anchors        # recompute anchors.json only
    python build_compass.py --save           # write compass.blend only
    python build_compass.py --shot turntable # the presentation's turntable loop (frames_turntable/)

Output: frames/f###.png (RGBA, film-transparent with a shadow catcher) and anchors.json (per frame,
the screen position of each part's right-hand rim, for the page's leader lines). The page never runs
3D: it picks the frame for the scroll position and draws it (07 v2.0, Fig. 2 as pre-rendered film).

The sequence is one gesture that the page plays forward and back:
  frames 0..TILT-1        the closed compass tips from top-down to a 30-degree view
  frames TILT..LAST       the six parts lift off in turn, the star first, the case staying down
Played backwards, the lifting becomes closing from the case up, so nothing passes through anything.

Studio light: Poly Haven "Studio Small 09" (CC0, Sergej Majboroda), fetched to ./studio.hdr.
"""
import json
import math
import pathlib
import sys
import urllib.request

import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

HERE = pathlib.Path(__file__).resolve().parent
HDR = HERE / "studio.hdr"
HDR_URL = "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_09_2k.hdr"
OUT = HERE / "frames"
RES = 1000
TILT, PER = 18, 12                  # frames for the tilt; frames per part as it lifts
PARTS = 7                           # case, scale, plates, meridian, inner ring, spokes, star
LAST = TILT + (PARTS - 1) * PER     # 91 frames: 0..90
SPREAD = .92

args = sys.argv[1:]
TEST = [int(x) for x in args[args.index("--test") + 1].split(",")] if "--test" in args else None
RANGE = None
if "--frames" in args:
    a, b = args[args.index("--frames") + 1].split("-"); RANGE = range(int(a), int(b) + 1)

if not HDR.exists():
    urllib.request.urlretrieve(HDR_URL, HDR)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ------------------------------------------------------------------ materials
def mat(name, color, metal, rough, coat=0., coat_rough=.1, aniso=0., wear=.0, bump=None, bump_s=.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    b = N["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = coat_rough
    if aniso:   # brushed metal, turned in rings around the instrument's axis
        b.inputs["Anisotropic"].default_value = aniso
        tg = N.new("ShaderNodeTangent"); tg.direction_type = "RADIAL"; tg.axis = "Z"
        L.new(tg.outputs["Tangent"], b.inputs["Tangent"])
    # wear: roughness drifts across the surface (handling, polish at the edges, faint smudges)
    tc = N.new("ShaderNodeTexCoord")
    nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.5; nz.inputs["Detail"].default_value = 6
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    mr = N.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = rough - wear; mr.inputs["To Max"].default_value = rough + wear
    L.new(nz.outputs["Fac"], mr.inputs["Value"])
    # micro scratches: stretched noise, a few percent
    sc = N.new("ShaderNodeTexNoise"); sc.inputs["Scale"].default_value = 180; sc.inputs["Detail"].default_value = 2
    mp = N.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1, 40, 1)
    L.new(tc.outputs["Object"], mp.inputs["Vector"]); L.new(mp.outputs["Vector"], sc.inputs["Vector"])
    ad = N.new("ShaderNodeMath"); ad.operation = "MULTIPLY_ADD"; ad.inputs[1].default_value = wear * .6
    L.new(sc.outputs["Fac"], ad.inputs[0]); L.new(mr.outputs["Result"], ad.inputs[2])
    L.new(ad.outputs[0], b.inputs["Roughness"])
    if bump is not None:
        tex = N.new("ShaderNodeTexImage"); tex.image = bump; tex.interpolation = "Cubic"
        uv = N.new("ShaderNodeTexCoord"); L.new(uv.outputs["UV"], tex.inputs["Vector"])
        bn = N.new("ShaderNodeBump"); bn.inputs["Strength"].default_value = bump_s; bn.inputs["Distance"].default_value = .02
        L.new(tex.outputs["Color"], bn.inputs["Height"]); L.new(bn.outputs["Normal"], b.inputs["Normal"])
        # the engraving darkens the navy slightly in its troughs
        mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = .35
        mix.inputs["A"].default_value = (*color, 1); L.new(tex.outputs["Color"], mix.inputs["B"]); L.new(mix.outputs["Result"], b.inputs["Base Color"])
    return m

def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)

# a guilloche dial: engine-turned waves, the pattern the web version drew on a canvas
def guilloche(n=2048):
    y, x = np.mgrid[0:n, 0:n] / (n / 2) - 1
    r, a = np.hypot(x, y) * 384, np.arctan2(y, x)
    rr = r + np.sin(a * 24 + r * .06) * 3.2
    v = .5 + .5 * np.cos(rr / 4.2 * 2 * np.pi)
    v = np.clip(v ** 3, 0, 1)
    # written once as an 8-bit PNG beside the script and linked, not packed, so compass.blend stays small
    path = HERE / "guilloche.png"
    if not path.exists():
        img = bpy.data.images.new("guilloche", n, n)
        px = np.ones((n, n, 4), np.float32); px[..., 0] = px[..., 1] = px[..., 2] = v
        img.pixels.foreach_set(px.ravel()); img.filepath_raw = str(path); img.file_format = "PNG"; img.save()
        bpy.data.images.remove(img)
    img = bpy.data.images.load(str(path)); img.colorspace_settings.name = "Non-Color"; return img

G_IMG = guilloche()
M = {
    "navy": mat("NavyMetal", lin("#1e3372"), .85, .3, coat=.25, coat_rough=.2, aniso=.5, wear=.06),
    "dial": mat("Dial", lin("#213878"), .9, .26, coat=.35, coat_rough=.08, wear=.04, bump=G_IMG, bump_s=.6),
    "gold": mat("Gold", (1.0, .72, .36), 1., .2, aniso=.65, wear=.07),
    "goldSatin": mat("GoldSatin", (.95, .7, .36), 1., .34, aniso=.4, wear=.06),
    "goldStar": mat("GoldStar", (1.0, .76, .42), 1., .12, wear=.04),
    "enamel": mat("Enamel", lin("#ece2c8"), 0., .45, coat=1., coat_rough=.04, wear=.03),
    "ivory": mat("Ivory", lin("#e3d8bc"), .0, .4, coat=.5, coat_rough=.1, wear=.03),
}

# ------------------------------------------------------------------ geometry helpers
def link(obj, parent):
    bpy.context.collection.objects.link(obj); obj.parent = parent; return obj

def smooth(obj, bevel=0., seg=3, angle=35):
    for p in obj.data.polygons: p.use_smooth = True
    if bevel:
        md = obj.modifiers.new("bevel", "BEVEL"); md.width = bevel; md.segments = seg; md.limit_method = "ANGLE"
        md.angle_limit = math.radians(angle); md.harden_normals = False
    obj.data.shade_smooth() if hasattr(obj.data, "shade_smooth") else None
    return obj

def torus(name, R, r, material, parent, z=0.):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=256, minor_segments=32, location=(0, 0, z))
    o = bpy.context.object; o.name = name; o.data.materials.append(material)
    bpy.context.collection.objects.unlink(o); link(o, parent); smooth(o); return o

def box(name, sx, sy, sz, loc, rot_z, material, parent, bevel=.004):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=(0, 0, rot_z))
    o = bpy.context.object; o.name = name; o.scale = (sx, sy, sz); bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material); bpy.context.collection.objects.unlink(o); link(o, parent)
    smooth(o, bevel, 2, 60); return o

def annulus_sector(name, r0, r1, a0, a1, depth, material, parent, z=0., bevel=.012, seg=48):
    import bmesh
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    outer = [bm.verts.new((math.cos(a0 + (a1 - a0) * k / seg) * r1, math.sin(a0 + (a1 - a0) * k / seg) * r1, 0)) for k in range(seg + 1)]
    inner = [bm.verts.new((math.cos(a1 - (a1 - a0) * k / seg) * r0, math.sin(a1 - (a1 - a0) * k / seg) * r0, 0)) for k in range(seg + 1)]
    f = bm.faces.new(outer + inner)
    ex = bmesh.ops.extrude_face_region(bm, geom=[f])
    bmesh.ops.translate(bm, vec=(0, 0, depth), verts=[v for v in ex["geom"] if isinstance(v, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); o.location.z = z; me.materials.append(material); link(o, parent)
    smooth(o, bevel, 3, 40)
    ws = o.modifiers.new("ws", "WEIGHTED_NORMAL"); ws.keep_sharp = True
    return o

def part(i):
    e = bpy.data.objects.new(f"part{i}", None); bpy.context.collection.objects.link(e); return e

P = [part(i) for i in range(PARTS)]

# i. the case: a bezel ring over a guilloche dial plate
torus("bezel", 3.6, .11, M["navy"], P[0])
bpy.ops.mesh.primitive_cylinder_add(vertices=256, radius=3.62, depth=.12, location=(0, 0, -.12))
dial = bpy.context.object; dial.name = "dial"; bpy.context.collection.objects.unlink(dial); link(dial, P[0])
dial.data.materials.append(M["navy"]); dial.data.materials.append(M["dial"])
# top cap gets the guilloche, projected flat across it
top = max(dial.data.polygons, key=lambda p: p.center.z); top.material_index = 1
uv = dial.data.uv_layers.new(name="UVMap")
for poly in dial.data.polygons:
    for li in poly.loop_indices:
        co = dial.data.vertices[dial.data.loops[li].vertex_index].co
        uv.data[li].uv = (co.x / 7.24 + .5, co.y / 7.24 + .5)
smooth(dial, .03, 4, 30)
# ii. the graduated scale: 120 ticks, every tenth long and gold, on a satin ring
for k in range(120):
    L = k % 10 == 0; a = k / 120 * math.tau; r = 3.2 if L else 3.26
    box(f"tick{k}", .034 if L else .024, .32 if L else .17, .05 if L else .04, (math.cos(a) * r, math.sin(a) * r, 0), a - math.pi / 2,
        M["gold"] if L else M["ivory"], P[1], .006 if L else .004)
torus("scalering", 3.06, .016, M["goldSatin"], P[1])
# iii. enamel plates: eight cloisonne sectors, each set on a slightly larger gold backing
for k in range(8):
    a0, a1 = k * math.pi / 4 + .03, (k + 1) * math.pi / 4 - .03
    annulus_sector(f"plate{k}", 2.54, 2.94, a0, a1, .08, M["enamel"], P[2], z=.01)
    annulus_sector(f"cell{k}", 2.51, 2.97, a0 - .012, a1 + .012, .06, M["goldSatin"], P[2], z=-.02, bevel=.01)
# iv. the gold meridian; v. the navy inner ring
torus("meridian", 2.38, .05, M["gold"], P[3])
torus("innerring", 2.0, .07, M["navy"], P[4])
# vi. the spokes: sixteen, long gold and short ivory, alternating
for k in range(16):
    Lg = k % 2 == 0; ln = 1.5 if Lg else 1.12; a = k / 16 * math.tau + math.pi / 16; r = .42 + ln / 2
    box(f"spoke{k}", ln, .034 if Lg else .02, .034, (math.cos(a) * r, math.sin(a) * r, 0), a, M["goldSatin"] if Lg else M["ivory"], P[5], .006)
# the star: eight points, each two facets meeting on a ridge, long cardinals and short ordinals
import bmesh
me = bpy.data.meshes.new("star"); bm = bmesh.new(); H, V = .46, .36
apex = bm.verts.new((0, 0, H))
for k in range(8):
    a = k * math.pi / 4 + math.pi / 2; R = 1.42 if k % 2 else 2.16
    tip = bm.verts.new((math.cos(a) * R, math.sin(a) * R, 0))
    vl = bm.verts.new((math.cos(a - math.pi / 8) * V, math.sin(a - math.pi / 8) * V, 0))
    vr = bm.verts.new((math.cos(a + math.pi / 8) * V, math.sin(a + math.pi / 8) * V, 0))
    bm.faces.new((apex, vl, tip)); bm.faces.new((apex, tip, vr))
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me); bm.free()
star = bpy.data.objects.new("star", me); me.materials.append(M["goldStar"]); link(star, P[6])
sd = star.modifiers.new("solid", "SOLIDIFY"); sd.thickness = .05; sd.offset = -1
bv = star.modifiers.new("bevel", "BEVEL"); bv.width = .008; bv.segments = 2; bv.limit_method = "ANGLE"
# a jewel at the pivot
bpy.ops.mesh.primitive_uv_sphere_add(radius=.09, location=(0, 0, H - .02), segments=48, ring_count=24)
pv = bpy.context.object; pv.name = "pivot"; bpy.context.collection.objects.unlink(pv); link(pv, P[6]); pv.data.materials.append(M["gold"]); smooth(pv)

# ------------------------------------------------------------------ studio
world = bpy.data.worlds.new("studio"); scene.world = world; world.use_nodes = True
wn = world.node_tree.nodes; wl = world.node_tree.links
env = wn.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(str(HDR))
mp = wn.new("ShaderNodeMapping"); mp.inputs["Rotation"].default_value = (0, 0, math.radians(200))
tc = wn.new("ShaderNodeTexCoord"); wl.new(tc.outputs["Generated"], mp.inputs["Vector"]); wl.new(mp.outputs["Vector"], env.inputs["Vector"])
# warm the studio toward the site's gold, and keep it low so the navy room reads dark
tint = wn.new("ShaderNodeMix"); tint.data_type = "RGBA"; tint.blend_type = "MULTIPLY"; tint.inputs["Factor"].default_value = 1
tint.inputs["B"].default_value = (1.0, .86, .66, 1); wl.new(env.outputs["Color"], tint.inputs["A"])
wl.new(tint.outputs["Result"], wn["Background"].inputs["Color"]); wn["Background"].inputs["Strength"].default_value = .55

def area(name, loc, size, energy, color, target=(0, 0, 0), shape="RECTANGLE", sy=None):
    l = bpy.data.lights.new(name, "AREA"); l.energy = energy; l.color = color; l.shape = shape; l.size = size
    if sy: l.size_y = sy
    o = bpy.data.objects.new(name, l); scene.collection.objects.link(o); o.location = loc
    d = Vector(target) - Vector(loc); o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); return o

area("key", (-6, 7, 10), 6, 1400, (1, .93, .8), sy=3)            # a large warm softbox, high left
area("strip", (8, -2, 4), .8, 500, (.95, .88, .72), sy=9)          # a thin strip, right: the gold edge line
area("rim", (0, -9, 6), 5, 350, (.6, .7, 1.0), sy=2)             # a cool kicker from behind for separation
area("fill", (-8, -6, 2), 4, 90, (.8, .85, 1.0))

# the table: a shadow catcher, so the render composites over the page's own navy
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, -.19)); fl = bpy.context.object; fl.is_shadow_catcher = True

# ------------------------------------------------------------------ camera
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); scene.collection.objects.link(cam); scene.camera = cam
cam.data.lens = 85; cam.data.sensor_width = 36
cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 11

def ease(t): return 1 - (1 - t) ** 4
def clamp(v, a=0., b=1.): return min(b, max(a, v))

def pose(f):
    """Scene state for frame f: tilt (0..1) and each part's lift (0..1)."""
    tilt = ease(clamp(f / (TILT - 1)))
    lift = [0.] * PARTS
    for i in range(1, PARTS):
        s = TILT + (PARTS - 1 - i) * PER          # the star (i = 6) lifts first
        lift[i] = ease(clamp((f - s) / PER))
    return tilt, lift

def apply(f):
    tilt, lift = pose(f)
    stack = 0.
    for i, p in enumerate(P):
        p.location.z = i * SPREAD * lift[i]; stack = max(stack, p.location.z)
        p.rotation_euler.z = (f / LAST) * .35 * (1 if i % 2 else -1) * lift[i]   # the parts turn a little as they rise
    op = stack / (SPREAD * (PARTS - 1))
    elev = math.radians(90 - 60 * tilt)             # straight down, tipping to a 30-degree view
    dist = 25 + 10 * op                              # the camera eases back as the instrument opens
    tgt = Vector((0, 0, stack * .5))
    cam.location = tgt + Vector((0, -math.cos(elev) * dist, math.sin(elev) * dist))
    d = tgt - cam.location; cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cam.data.dof.focus_distance = d.length
    return tilt, lift

# ------------------------------------------------------------------ render
scene.render.engine = "CYCLES"
cy = scene.cycles; cy.device = "CPU"; cy.samples = 48 if TEST else 32; cy.use_adaptive_sampling = True; cy.adaptive_threshold = .02
cy.use_denoising = True; cy.denoiser = "OPENIMAGEDENOISE"; cy.max_bounces = 8; cy.glossy_bounces = 6; cy.caustics_reflective = False
scene.render.film_transparent = True
scene.render.use_persistent_data = True
scene.render.resolution_x = scene.render.resolution_y = 600 if TEST else RES
scene.render.image_settings.file_format = "PNG"; scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "AgX"; scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = .15

OUT.mkdir(exist_ok=True)
# ------------------------------------------------------------------ extra shots (the presentation)
# --shot turntable [--test]: the closed compass turning once on its table, a seamless 192-frame loop (8 s a turn at 24 fps), low raking view
if "--shot" in args:
    shot = args[args.index("--shot") + 1]
    if shot == "turntable":
        N = 192; odir = HERE / "frames_turntable"; odir.mkdir(exist_ok=True)
        scene.render.resolution_x = scene.render.resolution_y = 600 if TEST else 1100
        apply(0)
        for p in P: p.location.z = 0; p.rotation_euler.z = 0
        elev, dist, tgt = math.radians(26), 23.5, Vector((0, 0, .15))
        for f in (TEST or range(N)):
            az = -math.pi / 2 + f / N * math.tau          # starts where the site's view starts, turns once
            cam.location = tgt + Vector((math.cos(az) * math.cos(elev) * dist, math.sin(az) * math.cos(elev) * dist, math.sin(elev) * dist))
            d = tgt - cam.location; cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler(); cam.data.dof.focus_distance = d.length
            bpy.context.view_layer.update()
            scene.render.filepath = str(odir / (f"test{f:03d}.png" if TEST else f"t{f:03d}.png"))
            bpy.ops.render.render(write_still=True); print("frame", f, flush=True)
    sys.exit(0)
if "--save" in args:
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "compass.blend"), relative_remap=True, compress=True); sys.exit(0)
if "--save" in args or not (TEST or RANGE or "--anchors" in args):
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / "compass.blend"), relative_remap=True, compress=True)

# anchors: each part's right-hand rim in screen space, 0..1 from the top left (cheap: no render)
RADII = [3.72, 3.38, 2.98, 2.43, 2.07, 1.94, 2.16]
if "--anchors" in args or not (TEST or RANGE):
    anchors = []
    for f in range(LAST + 1):
        apply(f); bpy.context.view_layer.update()
        pts = []
        for i, p in enumerate(P):
            v = world_to_camera_view(scene, cam, p.matrix_world.translation + Vector((RADII[i], 0, 0)))
            pts.append([round(v.x, 4), round(1 - v.y, 4)])
        anchors.append(pts)
    (HERE / "anchors.json").write_text(json.dumps({"frames": LAST + 1, "tilt": TILT, "per": PER, "anchors": anchors}))
    if "--anchors" in args: sys.exit(0)
for f in (TEST or RANGE or range(LAST + 1)):
    apply(f); bpy.context.view_layer.update()
    scene.render.filepath = str(OUT / (f"test{f:03d}.png" if TEST else f"f{f:03d}.png"))
    bpy.ops.render.render(write_still=True)
    print("frame", f, flush=True)
