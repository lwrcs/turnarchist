# Character appearance placeholder assets

No final wardrobe meshes are included. The preview creates clearly named
`BASIC_PLACEHOLDER_*` geometry to exercise composition without altering approved bases.

Production GLBs belong here one slot per file. Skinned assets require exact loaded v005
runtime bone names (`ClavicleL`, `FootR`, etc.; GLTF sanitizes Blender's dotted suffixes),
normalized four-component weights, and the target body's rest pose. Declare
male and female compatibility separately. Color textures use sRGB; data textures stay linear.
