import math
import wave
import struct
import random

SAMPLE_RATE = 44100
DURATION = 20.0  # seconds
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)
BPM = 120.0
BEAT_DUR = 60.0 / BPM  # 0.5s per beat
BAR_DUR = BEAT_DUR * 4.0  # 2.0s per bar

left_channel = [0.0] * TOTAL_SAMPLES
right_channel = [0.0] * TOTAL_SAMPLES

def add_sample(idx, l_val, r_val):
    if 0 <= idx < TOTAL_SAMPLES:
        left_channel[idx] += l_val
        right_channel[idx] += r_val

def add_kick(start_time, velocity=1.0):
    start_idx = int(start_time * SAMPLE_RATE)
    dur = 0.28
    samples = int(dur * SAMPLE_RATE)
    for i in range(samples):
        t = i / SAMPLE_RATE
        # Exponential pitch drop from 160Hz down to 45Hz
        freq = 45.0 + 115.0 * math.exp(-t * 28.0)
        phase = 2.0 * math.pi * (45.0 * t - (115.0 / 28.0) * math.exp(-t * 28.0))
        # Amplitude envelope
        env = math.exp(-t * 14.0)
        # Click transient at start
        click = (math.sin(2.0 * math.pi * 1200.0 * t) * math.exp(-t * 200.0)) * 0.35 if t < 0.03 else 0.0
        val = (math.sin(phase) * 0.85 + click) * env * velocity
        add_sample(start_idx + i, val * 0.95, val * 0.95)

def add_snare(start_time, velocity=0.8):
    start_idx = int(start_time * SAMPLE_RATE)
    dur = 0.22
    samples = int(dur * SAMPLE_RATE)
    for i in range(samples):
        t = i / SAMPLE_RATE
        tone = math.sin(2.0 * math.pi * 185.0 * t) * math.exp(-t * 22.0) * 0.35
        noise = (random.random() * 2.0 - 1.0) * math.exp(-t * 16.0) * 0.65
        val = (tone + noise) * velocity
        add_sample(start_idx + i, val * 0.9, val * 1.0)

def add_hat(start_time, velocity=0.4, pan=0.0):
    start_idx = int(start_time * SAMPLE_RATE)
    dur = 0.06
    samples = int(dur * SAMPLE_RATE)
    for i in range(samples):
        t = i / SAMPLE_RATE
        # High metallic noise
        noise = (random.random() * 2.0 - 1.0)
        # Bandpass emulation via high harmonic ring
        ring = math.sin(2.0 * math.pi * 6500.0 * t) * 0.5 + math.sin(2.0 * math.pi * 9200.0 * t) * 0.5
        val = (noise * 0.6 + ring * 0.4) * math.exp(-t * 60.0) * velocity
        l_mult = 0.5 * (1.0 - pan)
        r_mult = 0.5 * (1.0 + pan)
        add_sample(start_idx + i, val * l_mult, val * r_mult)

def add_bass_note(start_time, dur, freq, velocity=0.5):
    start_idx = int(start_time * SAMPLE_RATE)
    samples = int(dur * SAMPLE_RATE)
    for i in range(samples):
        t = i / SAMPLE_RATE
        # Attack, decay, sustain
        if t < 0.01:
            env = t / 0.01
        elif t > dur - 0.02:
            env = max(0.0, (dur - t) / 0.02)
        else:
            env = 0.85
        # Sawtooth wave + sub sine
        saw = 2.0 * ((t * freq) % 1.0) - 1.0
        sub = math.sin(2.0 * math.pi * (freq / 2.0) * t) * 0.6
        val = (saw * 0.5 + sub * 0.5) * env * velocity
        add_sample(start_idx + i, val * 0.9, val * 0.9)

def add_synth_lead(start_time, dur, freq, velocity=0.35, pan=0.0):
    start_idx = int(start_time * SAMPLE_RATE)
    samples = int(dur * SAMPLE_RATE)
    for i in range(samples):
        t = i / SAMPLE_RATE
        # Envelope
        attack = 0.02
        if t < attack:
            env = t / attack
        elif t > dur - 0.03:
            env = max(0.0, (dur - t) / 0.03)
        else:
            env = 0.8
        # Pulse + saw blend with slight chorus
        p1 = math.sin(2.0 * math.pi * freq * t)
        p2 = math.sin(2.0 * math.pi * (freq * 1.004) * t)
        p3 = math.sin(2.0 * math.pi * (freq * 2.0) * t) * 0.3
        val = (p1 * 0.4 + p2 * 0.4 + p3 * 0.2) * env * velocity
        l_mult = 0.5 * (1.0 - pan)
        r_mult = 0.5 * (1.0 + pan)
        add_sample(start_idx + i, val * l_mult, val * r_mult)

def add_impact_sfx(start_time, velocity=0.8):
    start_idx = int(start_time * SAMPLE_RATE)
    dur = 1.8
    samples = int(dur * SAMPLE_RATE)
    for i in range(samples):
        t = i / SAMPLE_RATE
        freq = 110.0 * math.exp(-t * 2.5)
        boom = math.sin(2.0 * math.pi * freq * t) * math.exp(-t * 2.2)
        noise = (random.random() * 2.0 - 1.0) * math.exp(-t * 6.0) * 0.4
        val = (boom + noise) * velocity
        add_sample(start_idx + i, val * 0.95, val * 0.95)

def add_scan_sfx(start_time, velocity=0.4):
    start_idx = int(start_time * SAMPLE_RATE)
    dur = 0.25
    samples = int(dur * SAMPLE_RATE)
    for i in range(samples):
        t = i / SAMPLE_RATE
        freq = 1800.0 + 800.0 * math.sin(2.0 * math.pi * 12.0 * t)
        val = math.sin(2.0 * math.pi * freq * t) * math.exp(-t * 8.0) * velocity
        add_sample(start_idx + i, val * 0.3, val * 0.7)

def add_chime_sfx(start_time, velocity=0.4):
    # Two crisp bells
    for offset, f in [(0.0, 1046.5), (0.08, 1318.5)]:
        st = start_time + offset
        start_idx = int(st * SAMPLE_RATE)
        dur = 0.4
        samples = int(dur * SAMPLE_RATE)
        for i in range(samples):
            t = i / SAMPLE_RATE
            val = math.sin(2.0 * math.pi * f * t) * math.exp(-t * 9.0) * velocity
            add_sample(start_idx + i, val * 0.6, val * 0.6)

# BUILD BEAT GRID (120 BPM: 0.5s per beat, 40 beats)
# Section 1 (0.0s - 3.0s, beats 0-5): Atmospheric tension, rising kicks on beats 4, 5
add_impact_sfx(0.0, velocity=0.7)
add_kick(2.0, velocity=0.8)
add_kick(2.5, velocity=0.9)
add_hat(2.25, velocity=0.3, pan=-0.3)
add_hat(2.75, velocity=0.4, pan=0.3)

# Section 2-5 (3.0s - 18.0s, beats 6-35): Full industrial driving rhythm
scene_cuts = [3.0, 7.0, 11.0, 15.0, 18.0]
# Add transition SFX at cuts
add_impact_sfx(3.0, velocity=0.85)
add_scan_sfx(7.0, velocity=0.5)
add_impact_sfx(7.0, velocity=0.7)
add_chime_sfx(11.0, velocity=0.55)
add_impact_sfx(11.0, velocity=0.7)
add_scan_sfx(15.0, velocity=0.5)

# Bassline notes (D minor progression: D2, F2, G2, Bb1, C2)
bass_progression = [
    (73.42, 0.4), (73.42, 0.4), (87.31, 0.4), (98.00, 0.4),
    (58.27, 0.4), (65.41, 0.4), (73.42, 0.4), (73.42, 0.4)
]

melody_notes = [587.33, 659.25, 698.46, 783.99, 880.00, 1046.50]  # D5, E5, F5, G5, A5, C6

for beat in range(6, 36):
    b_time = beat * BEAT_DUR
    # Kick on every quarter beat
    add_kick(b_time, velocity=1.0)
    
    # Snare on beats 2 and 4 of each bar (every even beat relative to bar)
    bar_beat = (beat - 6) % 4
    if bar_beat in (1, 3):
        add_snare(b_time, velocity=0.8)
    
    # Hi-hats on 8ths
    add_hat(b_time, velocity=0.35, pan=-0.2)
    add_hat(b_time + 0.25, velocity=0.45, pan=0.2)
    
    # Fast 16th hats before cuts (beats 13, 21, 29, 35)
    if beat in (13, 21, 29, 35):
        add_hat(b_time + 0.125, velocity=0.3, pan=-0.4)
        add_hat(b_time + 0.375, velocity=0.4, pan=0.4)
    
    # Driving bassline
    bass_idx = (beat - 6) % len(bass_progression)
    bfreq, bdur = bass_progression[bass_idx]
    add_bass_note(b_time, bdur * 0.85, bfreq, velocity=0.6)
    
    # Melodic synth arp
    lead_freq = melody_notes[(beat * 3) % len(melody_notes)]
    pan_val = 0.5 * math.sin(beat * 0.8)
    add_synth_lead(b_time + 0.25, 0.2, lead_freq, velocity=0.28, pan=pan_val)

# Section 6 (18.0s - 20.0s, beats 36-39): Outro climax
add_impact_sfx(18.0, velocity=1.0)
add_kick(18.0, velocity=1.0)
add_synth_lead(18.0, 1.8, 587.33, velocity=0.45, pan=0.0)
add_synth_lead(18.0, 1.8, 880.00, velocity=0.35, pan=0.2)

# Master Normalization & Soft Limiter
max_val = 0.0001
for i in range(TOTAL_SAMPLES):
    max_val = max(max_val, abs(left_channel[i]), abs(right_channel[i]))

headroom = 0.92
scale = headroom / max(max_val, 0.001)

# Fade out last 0.2s smoothly to prevent edge pop
fade_samples = int(0.2 * SAMPLE_RATE)
for i in range(fade_samples):
    idx = TOTAL_SAMPLES - fade_samples + i
    fade = 1.0 - (i / fade_samples)
    left_channel[idx] *= fade
    right_channel[idx] *= fade

# Write 16-bit PCM WAV
wav_path = "brag-output/work/soundtrack.wav"
with wave.open(wav_path, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    
    packed_frames = bytearray()
    for i in range(TOTAL_SAMPLES):
        l = max(-1.0, min(1.0, left_channel[i] * scale))
        r = max(-1.0, min(1.0, right_channel[i] * scale))
        # Soft saturation curve: tanh-like
        l = math.tanh(l)
        r = math.tanh(r)
        
        l_int = int(l * 32767.0)
        r_int = int(r * 32767.0)
        packed_frames.extend(struct.pack("<hh", l_int, r_int))
    
    wf.writeframes(packed_frames)

print(f"Synthesized soundtrack: {wav_path} (Duration: {DURATION}s, Peak: {max_val:.2f})")
