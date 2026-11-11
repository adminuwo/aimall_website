import re
import os

files = [
    r'f:/ab/frontend/index.html',
    r'f:/ab/frontend/about.html',
    r'f:/ab/frontend/contact.html',
    r'f:/ab/frontend/partner.html',
    r'f:/ab/frontend/a-series.html'
]

# Use existing .png assets from logos directory
replacement = r'''<div class="social-links">
                            <a href="https://www.instagram.com/aimall.global/" class="social-icon" aria-label="Instagram">
                                <img src="logos/instagram.png" alt="Instagram">
                            </a>
                            <a href="https://www.linkedin.com/in/aimall-global/" class="social-icon" aria-label="LinkedIn">
                                <img src="logos/linked.png" alt="LinkedIn">
                            </a>
                            <a href="https://x.com/aimallglobal" class="social-icon" aria-label="X">
                                <img src="logos/X.png" alt="X">
                            </a>
                            <a href="https://www.youtube.com/" class="social-icon" aria-label="YouTube">
                                <img src="logos/youtube.png" alt="YouTube">
                            </a>
                            <a href="https://www.facebook.com/aimallglobal/" class="social-icon" aria-label="Facebook">
                                <img src="logos/facebook.png" alt="Facebook">
                            </a>
                            <a href="https://api.whatsapp.com/send?phone=918359890909" class="social-icon" aria-label="WhatsApp">
                                <img src="logos/whatsapp.png" alt="WhatsApp">
                            </a>
                            <a href="mailto:admin@uwo24.com" class="social-icon" aria-label="Gmail">
                                <img src="logos/gmail.png" alt="Gmail">
                            </a>
                            <a href="https://www.threads.net/@aimallglobal" class="social-icon" aria-label="Threads">
                                <img src="logos/thread.png" alt="Threads">
                            </a>
                        </div>'''

for f in files:
    if not os.path.exists(f):
        print(f"Skipping {f}, not found.")
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Simple replace for the entire div
    new_content = re.sub(r'<div class="social-links">.*?</div>', replacement, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated {f}")
    else:
        print(f"No match in {f}")
