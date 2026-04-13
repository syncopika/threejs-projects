# script to do some basic mmp conversion to a json of the notes
# so I can use the json in https://syncopika.github.io/threejs-projects/trumpet/index.html, e.g. https://github.com/syncopika/threejs-projects/blob/master/trumpet/index.js#L199
#
# you can use https://syncopika.github.io/piano_roll_browser/ to compose or transcribe an idea,
# export it as mmp, then use this script
#
# this code is based on https://github.com/syncopika/mmp-to-MusicXML/blob/master/mmp_to_musicxml/converter.py

import json
import xml.etree.ElementTree as ET

file = "humpty dumpty heart - don fagerquist solo (dave pell octet).mmp"

output = []

NOTES = {
  0: "C",
  1: "C#",
  2: "D",
  3: "D#",
  4: "E",
  5: "F",
  6: "F#",
  7: "G",
  8: "G#",
  9: "A",
  10: "A#",
  11: "B",
}   

tree = ET.parse(file)
root = tree.getroot()

for el in tree.iter(tag = 'track'):
    pattern_chunks = []
    for el2 in el.iter(tag = 'pattern'):
        pattern_chunks.append(el2)
    
    # for simplicity, we should only expect one pattern chunk
    pattern_notes = []
    curr_length = 0
    
    for i in range(0, len(pattern_chunks)):
        chunk = pattern_chunks[i].iter(tag = 'note')
    
        # for each note, we need to know position (so we can fill in any gaps with silence)
        # length of the note, and pitch
        for note in chunk:
            note_pos = int(note.attrib['pos'])
            note_length = int(note.attrib['len'])
            note_pitch = int(note.attrib['key'])
            
            note_name = NOTES[note_pitch % 12]
            note_octave = int(note_pitch / 12)
            
            # an eighth note in mmp has a length of 24
            # for simplicity, let's assume an eighth note should be equivalent to 150 ms
            # I have no idea what bpm that would match lol but we can tweak later
            eighth_note_time = 150 # in ms
            lmms_eighth_note_length = 24.0
            
            if curr_length < note_pos:
                # this note starts past the last note's pos + length so we have a gap. fill space with rests
                output.append({
                    'note': '',
                    'length': ((note_pos - curr_length) / lmms_eighth_note_length) * eighth_note_time,  # get a float value
                })
                
            # add the note
            note_octave_fixed = note_octave  
            
            # TODO: until I get more trumpet note audio samples in, adjust octave to a note sample I do have
            if note_octave > 5:
                note_octave_fixed = 5
            elif note_octave < 4:
                note_octave_fixed = 4
            
            note_name_fixed = f"{note_name.lower().replace('#', 's')}{note_octave_fixed}"
            
            output.append({
                'note': note_name_fixed,
                'length': note_length * (eighth_note_time / lmms_eighth_note_length)
            })
            
            curr_length = note_pos
            

# write the data to the json
data = json.dumps(output, indent=4)

with open("mmp_to_trpt_demo.json", "w") as f:
    f.write(data)
    
print("done!")