---
name: ffmpeg
description: FFmpeg multimedia processing toolkit for video/audio format conversion, resolution changes, compression, trimming, merging, and more. Use when user wants to convert video formats, change resolution, compress videos, extract audio, trim clips, add watermarks, or any multimedia processing task.
---

# FFmpeg Multimedia Toolkit

You are an expert FFmpeg operator. When the user requests video or audio processing tasks, use this knowledge to construct and execute the appropriate FFmpeg commands.

## Prerequisites Check

Before running any FFmpeg command, first verify FFmpeg is installed:
```bash
which ffmpeg || echo "FFmpeg not installed - run: brew install ffmpeg"
```

If not installed, prompt the user to install it:
```bash
brew install ffmpeg
```

## Safety Rules

1. **ALWAYS confirm with user before overwriting existing files** - use `-n` flag to prevent accidental overwrites, or ask user explicitly
2. **Show file info before processing** - use `ffprobe` to display source file details
3. **Estimate output size when possible** - especially for large files
4. **Preserve original files by default** - output to new filename unless user explicitly wants to replace

## Core Commands Reference

### 1. Get File Information
```bash
ffprobe -v quiet -print_format json -show_format -show_streams "input.mp4"
```

Quick summary:
```bash
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 "input.mp4"
```

### 2. Format Conversion

**MP4 to other formats:**
```bash
# MP4 to MKV (lossless remux)
ffmpeg -i input.mp4 -c copy output.mkv

# MP4 to WebM (for web)
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm

# MP4 to AVI
ffmpeg -i input.mp4 -c:v libxvid -q:v 5 -c:a libmp3lame -q:a 4 output.avi

# MP4 to MOV
ffmpeg -i input.mp4 -c copy output.mov

# MP4 to GIF (with optimization)
ffmpeg -i input.mp4 -vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif
```

**Other format conversions:**
```bash
# MKV to MP4
ffmpeg -i input.mkv -c:v libx264 -c:a aac output.mp4

# AVI to MP4
ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4

# WebM to MP4
ffmpeg -i input.webm -c:v libx264 -c:a aac output.mp4
```

### 3. Resolution Changes

**Common resolutions:**
```bash
# 4K (2160p)
ffmpeg -i input.mp4 -vf "scale=3840:2160" -c:a copy output_4k.mp4

# 1080p Full HD
ffmpeg -i input.mp4 -vf "scale=1920:1080" -c:a copy output_1080p.mp4

# 720p HD
ffmpeg -i input.mp4 -vf "scale=1280:720" -c:a copy output_720p.mp4

# 480p SD
ffmpeg -i input.mp4 -vf "scale=854:480" -c:a copy output_480p.mp4

# 360p (mobile)
ffmpeg -i input.mp4 -vf "scale=640:360" -c:a copy output_360p.mp4

# Maintain aspect ratio (use -1 for auto-calculate)
ffmpeg -i input.mp4 -vf "scale=1280:-1" -c:a copy output.mp4
ffmpeg -i input.mp4 -vf "scale=-1:720" -c:a copy output.mp4

# Scale to fit within bounds (keeps aspect ratio)
ffmpeg -i input.mp4 -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" output.mp4
```

### 4. Compression & Quality

**CRF-based compression (recommended):**
```bash
# High quality (CRF 18-20)
ffmpeg -i input.mp4 -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 192k output.mp4

# Balanced (CRF 23 - default)
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4

# Smaller file (CRF 28-30)
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 96k output.mp4

# Maximum compression (CRF 32-35, visible quality loss)
ffmpeg -i input.mp4 -c:v libx264 -crf 32 -preset veryfast -c:a aac -b:a 64k output.mp4
```

**HEVC/H.265 (better compression, slower):**
```bash
ffmpeg -i input.mp4 -c:v libx265 -crf 28 -preset medium -c:a aac output_h265.mp4
```

**Target file size:**
```bash
# Calculate bitrate: bitrate = target_size_MB * 8192 / duration_seconds
# Example: 50MB target for 60s video = 50 * 8192 / 60 ≈ 6827 kbps
ffmpeg -i input.mp4 -c:v libx264 -b:v 6000k -c:a aac -b:a 128k output.mp4
```

### 5. Trimming & Cutting

```bash
# Cut from start time to end time
ffmpeg -i input.mp4 -ss 00:01:30 -to 00:02:45 -c copy output.mp4

# Cut with duration
ffmpeg -i input.mp4 -ss 00:01:30 -t 00:01:15 -c copy output.mp4

# Cut with re-encoding (more accurate)
ffmpeg -i input.mp4 -ss 00:01:30 -to 00:02:45 -c:v libx264 -c:a aac output.mp4

# Remove first N seconds
ffmpeg -i input.mp4 -ss 10 -c copy output.mp4

# Keep only first N seconds
ffmpeg -i input.mp4 -t 30 -c copy output.mp4
```

### 6. Audio Operations

**Extract audio:**
```bash
# Extract to MP3
ffmpeg -i input.mp4 -vn -c:a libmp3lame -q:a 2 output.mp3

# Extract to AAC
ffmpeg -i input.mp4 -vn -c:a aac -b:a 192k output.aac

# Extract to WAV (lossless)
ffmpeg -i input.mp4 -vn -c:a pcm_s16le output.wav

# Extract to FLAC (lossless compressed)
ffmpeg -i input.mp4 -vn -c:a flac output.flac
```

**Modify audio:**
```bash
# Remove audio from video
ffmpeg -i input.mp4 -an -c:v copy output_silent.mp4

# Replace audio track
ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 output.mp4

# Adjust volume
ffmpeg -i input.mp4 -af "volume=1.5" -c:v copy output.mp4  # 150% volume
ffmpeg -i input.mp4 -af "volume=0.5" -c:v copy output.mp4  # 50% volume

# Normalize audio
ffmpeg -i input.mp4 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:v copy output.mp4
```

### 7. Merging & Concatenation

**Concatenate videos (same codec):**
```bash
# Create file list
echo "file 'video1.mp4'" > list.txt
echo "file 'video2.mp4'" >> list.txt
echo "file 'video3.mp4'" >> list.txt

# Concatenate
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
```

**Concatenate with re-encoding (different codecs):**
```bash
ffmpeg -f concat -safe 0 -i list.txt -c:v libx264 -c:a aac output.mp4
```

### 8. Watermark & Overlay

```bash
# Add image watermark (bottom right)
ffmpeg -i input.mp4 -i watermark.png -filter_complex "overlay=W-w-10:H-h-10" output.mp4

# Add image watermark (top left)
ffmpeg -i input.mp4 -i watermark.png -filter_complex "overlay=10:10" output.mp4

# Add text watermark
ffmpeg -i input.mp4 -vf "drawtext=text='My Watermark':fontsize=24:fontcolor=white:x=10:y=10" output.mp4

# Add timestamp
ffmpeg -i input.mp4 -vf "drawtext=text='%{pts\:hms}':fontsize=24:fontcolor=white:x=10:y=10" output.mp4
```

### 9. Frame Rate Changes

```bash
# Change to 30 fps
ffmpeg -i input.mp4 -r 30 -c:a copy output.mp4

# Change to 24 fps (cinematic)
ffmpeg -i input.mp4 -r 24 -c:a copy output.mp4

# Change to 60 fps
ffmpeg -i input.mp4 -r 60 -c:a copy output.mp4

# Slow motion (0.5x speed)
ffmpeg -i input.mp4 -filter:v "setpts=2.0*PTS" -filter:a "atempo=0.5" output.mp4

# Speed up (2x speed)
ffmpeg -i input.mp4 -filter:v "setpts=0.5*PTS" -filter:a "atempo=2.0" output.mp4
```

### 10. Rotation & Flipping

```bash
# Rotate 90 degrees clockwise
ffmpeg -i input.mp4 -vf "transpose=1" output.mp4

# Rotate 90 degrees counter-clockwise
ffmpeg -i input.mp4 -vf "transpose=2" output.mp4

# Rotate 180 degrees
ffmpeg -i input.mp4 -vf "transpose=1,transpose=1" output.mp4

# Horizontal flip (mirror)
ffmpeg -i input.mp4 -vf "hflip" output.mp4

# Vertical flip
ffmpeg -i input.mp4 -vf "vflip" output.mp4
```

### 11. Extract Frames / Create Video from Images

```bash
# Extract all frames
ffmpeg -i input.mp4 frames/frame_%04d.png

# Extract one frame per second
ffmpeg -i input.mp4 -vf "fps=1" frames/frame_%04d.png

# Extract specific frame
ffmpeg -i input.mp4 -ss 00:00:10 -frames:v 1 thumbnail.png

# Create video from images
ffmpeg -framerate 30 -pattern_type glob -i 'frames/*.png' -c:v libx264 -pix_fmt yuv420p output.mp4
```

### 12. Screen Recording Formats

```bash
# For social media (Instagram, TikTok - 9:16 vertical)
ffmpeg -i input.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" output_vertical.mp4

# For YouTube (16:9 horizontal)
ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" output_youtube.mp4

# Square format (Instagram feed)
ffmpeg -i input.mp4 -vf "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2" output_square.mp4
```

### 13. Batch Processing

```bash
# Convert all MP4 to MKV in directory
for f in *.mp4; do ffmpeg -i "$f" -c copy "${f%.mp4}.mkv"; done

# Compress all videos in directory
for f in *.mp4; do ffmpeg -i "$f" -c:v libx264 -crf 23 -c:a aac "compressed_$f"; done

# Convert all files to 720p
for f in *.mp4; do ffmpeg -i "$f" -vf "scale=-1:720" -c:a copy "720p_$f"; done
```

### 14. Hardware Acceleration (macOS)

```bash
# Use VideoToolbox for encoding (much faster on Mac)
ffmpeg -i input.mp4 -c:v h264_videotoolbox -b:v 5000k -c:a aac output.mp4

# HEVC with VideoToolbox
ffmpeg -i input.mp4 -c:v hevc_videotoolbox -b:v 3000k -c:a aac output.mp4
```

## Workflow Guidelines

1. **First, analyze the input file:**
   ```bash
   ffprobe -v error -show_entries stream=codec_name,width,height,duration,bit_rate -of default=noprint_wrappers=1 "INPUT_FILE"
   ```

2. **Confirm the operation with the user**, showing:
   - Input file details
   - Output filename
   - Expected changes

3. **Execute the FFmpeg command**

4. **Verify the output:**
   ```bash
   ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 "OUTPUT_FILE"
   ```

5. **Report results to user** including:
   - Original vs new file size
   - Original vs new duration (if trimming)
   - Original vs new resolution (if scaling)

## Common Quality Presets

| Use Case | CRF | Preset | Resolution | Bitrate |
|----------|-----|--------|------------|---------|
| Archive (best quality) | 18 | slow | Original | N/A |
| General use | 23 | medium | Original | N/A |
| Web/streaming | 26 | fast | 1080p | 4-6 Mbps |
| Mobile | 28 | fast | 720p | 2-3 Mbps |
| Preview/draft | 32 | veryfast | 480p | 1 Mbps |

## Error Handling

Common errors and solutions:

1. **"Avi encoder not found"** - Install FFmpeg with full codecs: `brew install ffmpeg`
2. **"Permission denied"** - Check file permissions
3. **"Invalid data found"** - File might be corrupted, try `-err_detect ignore_err`
4. **"Output file exists"** - Use `-y` to overwrite or change output name
