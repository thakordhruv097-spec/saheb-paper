import os
from PIL import Image

def generate_icons():
    source_path = 'public/saheb-logo-official.png'
    if not os.path.exists(source_path):
        source_path = 'public/logo.png'
    
    print(f"Loading master source logo from: {source_path}")
    source = Image.open(source_path).convert('RGBA')
    print(f"Master logo dimensions: {source.size} (aspect ratio: {source.width/source.height:.3f})")

    # Trim any outer empty boundary if present to ensure perfect centering
    bbox = source.getbbox()
    if bbox:
        cropped_source = source.crop(bbox)
    else:
        cropped_source = source

    def create_square_icon(src_img, size, max_content_ratio=0.72, bg_color=(255, 255, 255, 0)):
        canvas = Image.new('RGBA', (size, size), bg_color)
        
        max_w = int(size * max_content_ratio)
        max_h = int(size * max_content_ratio)
        
        scale = min(max_w / src_img.width, max_h / src_img.height)
        new_w = max(1, int(src_img.width * scale))
        new_h = max(1, int(src_img.height * scale))
        
        resized = src_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        pos_x = (size - new_w) // 2
        pos_y = (size - new_h) // 2
        
        canvas.paste(resized, (pos_x, pos_y), resized)
        return canvas

    # --- 1. WEB & FAVICON & PWA ICONS ---
    print("\n--- Generating Web, Favicon & PWA Icons ---")
    
    # 32x32 / 64x64 favicon
    fav_32 = create_square_icon(cropped_source, 32, max_content_ratio=0.85, bg_color=(255, 255, 255, 0))
    fav_64 = create_square_icon(cropped_source, 64, max_content_ratio=0.85, bg_color=(255, 255, 255, 0))
    fav_64.save('public/favicon.png')
    
    # Multi-resolution favicon.ico (16, 32, 48, 64)
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_images = [create_square_icon(cropped_source, s[0], max_content_ratio=0.85, bg_color=(255, 255, 255, 0)) for s in ico_sizes]
    ico_images[0].save('public/favicon.ico', format='ICO', sizes=ico_sizes, append_images=ico_images[1:])
    print("Saved: public/favicon.ico, public/favicon.png")

    # Apple touch icon (180x180)
    apple_icon = create_square_icon(cropped_source, 180, max_content_ratio=0.75, bg_color=(255, 255, 255, 255))
    apple_icon.save('public/apple-touch-icon.png')
    print("Saved: public/apple-touch-icon.png")

    # PWA standard icons
    pwa_192 = create_square_icon(cropped_source, 192, max_content_ratio=0.75, bg_color=(255, 255, 255, 255))
    pwa_192.save('public/pwa-192x192.png')

    pwa_512 = create_square_icon(cropped_source, 512, max_content_ratio=0.75, bg_color=(255, 255, 255, 255))
    pwa_512.save('public/pwa-512x512.png')

    # PWA maskable icon (safe zone ~62%)
    pwa_maskable = create_square_icon(cropped_source, 512, max_content_ratio=0.62, bg_color=(255, 255, 255, 255))
    pwa_maskable.save('public/pwa-maskable-512x512.png')
    print("Saved: public/pwa-192x192.png, public/pwa-512x512.png, public/pwa-maskable-512x512.png")

    # --- 2. DESKTOP / ELECTRON BUILD ICONS ---
    print("\n--- Generating Desktop / Electron Icons ---")
    os.makedirs('build', exist_ok=True)
    
    desktop_icon_512 = create_square_icon(cropped_source, 512, max_content_ratio=0.78, bg_color=(255, 255, 255, 0))
    desktop_icon_512.save('build/icon.png')

    desktop_ico_images = [create_square_icon(cropped_source, s[0], max_content_ratio=0.78, bg_color=(255, 255, 255, 0)) for s in ico_sizes]
    desktop_ico_images[0].save('build/icon.ico', format='ICO', sizes=ico_sizes, append_images=desktop_ico_images[1:])
    print("Saved: build/icon.png, build/icon.ico")

    # --- 3. ANDROID APP ICONS ---
    print("\n--- Generating Android Launcher & Adaptive Icons ---")
    
    # Density definitions: (folder, legacy_size, adaptive_fg_size)
    android_densities = [
        ('mipmap-mdpi', 48, 108),
        ('mipmap-hdpi', 72, 162),
        ('mipmap-xhdpi', 96, 216),
        ('mipmap-xxhdpi', 144, 324),
        ('mipmap-xxxhdpi', 192, 432),
    ]

    base_res = 'android/app/src/main/res'
    for folder, legacy_sz, adaptive_sz in android_densities:
        target_dir = os.path.join(base_res, folder)
        os.makedirs(target_dir, exist_ok=True)

        # 1. Legacy square launcher (white background, safe content ratio 0.78)
        legacy_icon = create_square_icon(cropped_source, legacy_sz, max_content_ratio=0.78, bg_color=(255, 255, 255, 255))
        legacy_path = os.path.join(target_dir, 'ic_launcher.png')
        legacy_icon.save(legacy_path)

        # 2. Legacy round launcher (white background, safe content ratio 0.68 for circular clipping)
        round_icon = create_square_icon(cropped_source, legacy_sz, max_content_ratio=0.68, bg_color=(255, 255, 255, 255))
        round_path = os.path.join(target_dir, 'ic_launcher_round.png')
        round_icon.save(round_path)

        # 3. Adaptive Foreground Icon (Transparent background, safe zone ratio 0.62 so it never gets cropped by Android masks)
        adaptive_fg = create_square_icon(cropped_source, adaptive_sz, max_content_ratio=0.62, bg_color=(255, 255, 255, 0))
        fg_path = os.path.join(target_dir, 'ic_launcher_foreground.png')
        adaptive_fg.save(fg_path)

        print(f"Generated {folder}: ic_launcher ({legacy_sz}x{legacy_sz}), ic_launcher_round ({legacy_sz}x{legacy_sz}), ic_launcher_foreground ({adaptive_sz}x{adaptive_sz})")

    # Ensure background color in res/values/ic_launcher_background.xml
    bg_xml_path = os.path.join(base_res, 'values', 'ic_launcher_background.xml')
    os.makedirs(os.path.dirname(bg_xml_path), exist_ok=True)
    with open(bg_xml_path, 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n')

    print("\nAll icon assets successfully generated with mathematical safe-zone padding and aspect-ratio preservation!")

if __name__ == '__main__':
    generate_icons()
